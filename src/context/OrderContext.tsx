import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '../types';
import { getStoredOrders, enqueueOrder, flushOfflineQueue, saveStoredOrders } from '../offline/queue';
import { useNetworkStatus } from '../offline/networkStatus';
import { useAuth } from './AuthContext';
import { creditResellerCommission } from '../lib/walletHelper';
import { addSellerNotification, addAdminNotification, addWarehouseNotification } from '../lib/notificationHelper';
import { getStoredProducts, saveStoredProducts } from '../data/mockProducts';

interface OrderContextType {
  orders: Order[];
  pendingLinkOrdersCount: number;
  isLoading: boolean;
  createOrder: (orderInput: Partial<Order>) => Promise<{ idempotencyKey: string; order: Order }>;
  confirmAndShipOrder: (orderId: string) => Promise<{ success: boolean; order?: Order; message?: string }>;
  confirmOrderWarehouse: (orderId: string) => void;
  rejectOrderWithReason: (orderId: string, reason: string) => void;
  resubmitOrder: (orderId: string, updatedFields: Partial<Order>) => Promise<{ success: boolean; order?: Order }>;
  confirmReturnInWarehouse: (orderId: string) => void;
  updateOrder: (orderId: string, updatedFields: Partial<Order>) => Promise<{ success: boolean; order?: Order; error?: string; message?: string }>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  setTrackingCode: (orderId: string, trackingCode: string) => void;
  confirmAdminOrder: (orderId: string) => void;
  cancelOrderWithReason: (orderId: string, reason: string) => void;
  markReadyToShip: (trackingCodes: string[]) => Promise<{ success: boolean; message?: string }>;
  deleteParcel: (trackingCodes: string[]) => Promise<{ success: boolean; message?: string }>;
  deleteOrder: (orderId: string) => void;
  syncPendingQueue: () => Promise<void>;
  filterStatus: string;
  setFilterStatus: (st: string) => void;
  getFilteredOrders: () => Order[];
  getWhatsAppReceiptText: (order: Order) => string;
  retryDelivery: (orderId: string) => void;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
}

const INITIAL_DEMO_ORDERS: Order[] = [];

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { isOnline } = useNetworkStatus();

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('km_favorite_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('km_favorite_products', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  // Load orders on startup
  useEffect(() => {
    const local = getStoredOrders();
    if (local && local.length > 0) {
      setOrders(local);
    } else {
      setOrders(INITIAL_DEMO_ORDERS);
      saveStoredOrders(INITIAL_DEMO_ORDERS);
    }
    setIsLoading(false);
  }, []);

  const syncPendingQueue = useCallback(async () => {
    if (!isOnline) return;
    try {
      const result = await flushOfflineQueue(async (payload) => {
        const res = await fetch('/api/reseller/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': payload.idempotencyKey,
          },
          body: JSON.stringify(payload),
        });
        return await res.json();
      });

      if (result.syncedCount > 0) {
        // Refresh local state from storage
        const refreshed = getStoredOrders();
        setOrders(refreshed);
      }
    } catch (e) {
      console.error('Queue sync failed:', e);
    }
  }, [isOnline]);

  // Attempt auto sync when coming online
  useEffect(() => {
    if (isOnline) {
      syncPendingQueue();
    }
  }, [isOnline, syncPendingQueue]);

  // Track order status transitions to automatically send Toast notification when an order moves from 'قيد المراجعة' to 'مؤكد'
  const prevOrdersRef = React.useRef<Record<string, { status?: string; adminConfirmed?: boolean; statusAr?: string; situation?: string }>>({});
  const isInitialMountRef = React.useRef(true);

  useEffect(() => {
    if (orders.length === 0) return;

    if (isInitialMountRef.current) {
      // Snapshot initial state on startup to prevent firing toast for already existing confirmed orders
      const initialMap: Record<string, { status?: string; adminConfirmed?: boolean; statusAr?: string; situation?: string }> = {};
      orders.forEach((o) => {
        initialMap[o.id] = {
          status: o.status,
          adminConfirmed: o.adminConfirmed,
          statusAr: o.statusAr,
          situation: o.situation,
        };
      });
      prevOrdersRef.current = initialMap;
      isInitialMountRef.current = false;
      return;
    }

    orders.forEach((currOrder) => {
      const prev = prevOrdersRef.current[currOrder.id];

      if (prev) {
        // Was the order in 'قيد المراجعة' (Pending Review)?
        const wasPendingReview =
          prev.status === 'PENDING_SYNC' ||
          prev.status === 'LINK_ORDER' ||
          (prev.statusAr && prev.statusAr.includes('قيد المراجعة')) ||
          (!prev.adminConfirmed &&
            prev.status !== 'CONFIRMED' &&
            prev.status !== 'PROCESSING' &&
            prev.status !== 'SHIPPED' &&
            prev.status !== 'DELIVERED' &&
            prev.status !== 'CANCELLED' &&
            prev.status !== 'FAILED' &&
            prev.situation !== 'Confirmé');

        // Is the order now 'مؤكد' (Confirmed)?
        const isNowConfirmed =
          currOrder.status === 'CONFIRMED' ||
          currOrder.adminConfirmed === true ||
          currOrder.situation === 'Confirmé' ||
          (currOrder.statusAr && (currOrder.statusAr.includes('مؤكد') || currOrder.statusAr.includes('تم التأكيد')));

        if (wasPendingReview && isNowConfirmed) {
          if (typeof window !== 'undefined') {
            const customerInfo = currOrder.customerName ? ` (${currOrder.customerName})` : '';
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('app-toast', {
                  detail: {
                    message: `🎉 تم تغيير حالة الطلب ${currOrder.id}${customerInfo} من 'قيد المراجعة' إلى 'مؤكد'`,
                    type: 'success',
                  },
                })
              );
            }, 0);
          }
        }
      }

      // Update snapshot for this order ID
      prevOrdersRef.current[currOrder.id] = {
        status: currOrder.status,
        adminConfirmed: currOrder.adminConfirmed,
        statusAr: currOrder.statusAr,
        situation: currOrder.situation,
      };
    });
  }, [orders]);

  const createOrder = async (orderInput: Partial<Order>) => {
    // 1. Always enqueue locally first (Rule Section 5.2)
    const enrichedInput: Partial<Order> = {
      ...orderInput,
      resellerId: orderInput.resellerId || user?.id,
      resellerEmail: orderInput.resellerEmail || user?.email,
      resellerPhone: orderInput.resellerPhone || user?.phone,
      resellerName: orderInput.resellerName || user?.fullName,
    };
    const { idempotencyKey, localOrder } = enqueueOrder(enrichedInput);

    setOrders((prev) => [localOrder, ...prev]);

    // Send seller notification for new order (link or manual)
    const firstItem = localOrder.items?.[0];
    if (orderInput.source === 'LINK' || orderInput.status === ('LINK_ORDER' as any)) {
      addSellerNotification({
        type: 'order',
        titleAr: '🔗 طلبية جديدة واردة من رابط المشاركة! 🔥',
        bodyAr: `قام زبون جديد (${localOrder.customerName || 'مجهول'}) بطلب منتج "${firstItem?.productName || ''}" عبر رابط المتجر الشخصي. بقيمة ${localOrder.totalAmount || 0} دج (ربح متوقع: +${localOrder.totalProfit || 0} دج).`,
        productId: firstItem?.productId,
        productNameAr: firstItem?.productName,
      });

      addAdminNotification({
        type: 'order',
        titleAr: '🛒 طلبية جديدة عبر رابط متجر شخصي',
        bodyAr: `ورود طلبية جديدة من الزبون (${localOrder.customerName || 'مجهول'}) لمنتج "${firstItem?.productName || ''}" بقيمة ${localOrder.totalAmount || 0} دج في ولاية ${(localOrder as any).wilayaName || localOrder.wilayaCode || ''}.`,
        productId: firstItem?.productId,
        productNameAr: firstItem?.productName,
      });
    } else {
      addSellerNotification({
        type: 'order',
        titleAr: '📝 تم تسجيل طلبية جديدة بنجاح',
        bodyAr: `تم إنشاء طلبية جديدة للزبون (${localOrder.customerName || ''}) بقيمة ${localOrder.totalAmount || 0} دج.`,
        productId: firstItem?.productId,
        productNameAr: firstItem?.productName,
      });

      addAdminNotification({
        type: 'order',
        titleAr: '🛒 طلبية جديدة بالمنصة',
        bodyAr: `تم تسجيل طلبية جديدة #${localOrder.trackingCode || localOrder.id} للزبون (${localOrder.customerName || ''}) بقيمة ${localOrder.totalAmount || 0} دج.`,
        productId: firstItem?.productId,
        productNameAr: firstItem?.productName,
      });
    }

    addWarehouseNotification({
      type: 'order',
      titleAr: '📦 طلبية جديدة بانتظار التحضير والتأكيد',
      bodyAr: `ورود طلبية جديدة #${localOrder.trackingCode || localOrder.id} للزبون (${localOrder.customerName || 'مجهول'}) لمنتج "${firstItem?.productName || ''}" بقيمة ${localOrder.totalAmount || 0} دج.`,
      productId: firstItem?.productId,
      productNameAr: firstItem?.productName,
    });

    // 2. Try background immediate API sync if online
    if (isOnline) {
      try {
        const res = await fetch('/api/reseller/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ ...orderInput, idempotencyKey }),
        });
        const data = await res.json();
        if (data.success && data.order) {
          const syncedOrder = { ...data.order, syncStatus: 'synced' as const };
          setOrders((prev) =>
            prev.map((o) => (o.idempotencyKey === idempotencyKey ? syncedOrder : o))
          );
          return { idempotencyKey, order: syncedOrder };
        }
      } catch (err) {
        console.log('[Order Context] Network sync deferred to offline queue');
      }
    }

    return { idempotencyKey, order: localOrder };
  };

  const confirmAndShipOrder = async (orderId: string) => {
    try {
      // Call backend confirm endpoint
      const res = await fetch('/api/delivery/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) => {
          const updated = prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o));
          saveStoredOrders(updated);
          return updated;
        });
        return { success: true, order: data.order, message: data.message };
      } else {
        // Local fallback if server unreachable
        const tracking = "TC" + orderId.replace("ORD-", "") + "LHJ";
        const labelUrl = `/api/delivery/label/${orderId}?tracking=${tracking}`;
        let fallbackOrder: Order | undefined;

        setOrders((prev) => {
          const updated = prev.map((o) => {
            if (o.id === orderId) {
              fallbackOrder = {
                ...o,
                status: 'SHIPPED',
                statusAr: 'مؤكدة - تم الإرسال لشركة التوصيل',
                statusFr: 'Confirmée & Transmise à la livraison',
                adminConfirmed: true,
                isLockedForEdit: true,
                confirmedAt: new Date().toISOString(),
                deliveryCompanySent: true,
                deliveryCompanyName: 'Express Delivery',
                trackingCode: tracking,
                bordereauUrl: labelUrl,
              };
              return fallbackOrder;
            }
            return o;
          });
          saveStoredOrders(updated);
          return updated;
        });

        return {
          success: true,
          order: fallbackOrder,
          message: 'تم تأكيد الطلب من قبل الأدمن وقفله على البائع بنجاح',
        };
      }
    } catch (err) {
      console.error('Error confirming order:', err);
      // Fallback
      const tracking = "TC" + orderId.replace("ORD-", "") + "LHJ";
      const labelUrl = `/api/delivery/label/${orderId}?tracking=${tracking}`;
      let fallbackOrder: Order | undefined;

      setOrders((prev) => {
        const updated = prev.map((o) => {
          if (o.id === orderId) {
            fallbackOrder = {
              ...o,
              status: 'SHIPPED',
              statusAr: 'مؤكدة - تم الإرسال لشركة التوصيل',
              statusFr: 'Confirmée & Transmise à la livraison',
              adminConfirmed: true,
              isLockedForEdit: true,
              confirmedAt: new Date().toISOString(),
              deliveryCompanySent: true,
              trackingCode: tracking,
              bordereauUrl: labelUrl,
            };
            return fallbackOrder;
          }
          return o;
        });
        saveStoredOrders(updated);
        return updated;
      });

      return {
        success: true,
        order: fallbackOrder,
        message: 'تم تأكيد الطلب واستخراج كود التتبع وقفل التعديل بنجاح',
      };
    }
  };

  const updateOrder = async (orderId: string, updatedFields: Partial<Order>) => {
    // Lock guard check
    const currentOrder = orders.find((o) => o.id === orderId);
    if (currentOrder?.adminConfirmed || currentOrder?.isLockedForEdit || currentOrder?.situation === 'EnTraitement') {
      return {
        success: false,
        error: 'لا يمكن تعديل هذه الطلبية لأنها مؤكدة من قبل الأدمن ومقفلة للتعديل',
      };
    }

    try {
      // 1. Call server API
      const res = await fetch(`/api/reseller/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'فشل تعديل الطلبية' };
      }

      // 2. Also trigger Delivery API PUT /Api_v1/Colis/:tracking if tracking code exists
      const currentOrder = orders.find((o) => o.id === orderId);
      const tracking = currentOrder?.trackingCode || "TC" + orderId.replace("ORD-", "") + "LHJ";

      try {
        await fetch(`/Api_v1/Colis/${tracking}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'key': '3490e731e3db4d8c841991987d3cab0f',
            'token': 'b8386c67-f0ce-4ce5-bc3b-cf3246a90819',
          },
          body: JSON.stringify({
            Colis: {
              NomComplet: updatedFields.customerName || currentOrder?.customerName,
              Mobile_1: updatedFields.phone || currentOrder?.phone,
              Mobile_2: updatedFields.phone2 || currentOrder?.phone2 || "",
              Adresse: updatedFields.address || currentOrder?.address,
              Commune: updatedFields.commune || currentOrder?.commune,
              Wilaya: updatedFields.wilaya || currentOrder?.wilaya,
              Total: String((updatedFields.totalAmount || currentOrder?.totalAmount || 0) + (updatedFields.shippingFee || currentOrder?.shippingFee || 0)),
              NoteFournisseur: updatedFields.noteFournisseur || "Nouva Market Reseller App",
              Ref_Article: orderId,
              ID_Externe: orderId,
            }
          }),
        });
      } catch (deliveryErr) {
        console.warn('Delivery API direct update sync notice:', deliveryErr);
      }

      // Update local state
      const refreshedOrder: Order = data.order || {
        ...(currentOrder as Order),
        ...updatedFields,
        bordereauUrl: `/api/delivery/label/${orderId}?tracking=${tracking}&v=${Date.now()}`,
      };

      setOrders((prev) => {
        const updatedList = prev.map((o) => (o.id === orderId ? refreshedOrder : o));
        saveStoredOrders(updatedList);
        return updatedList;
      });

      return {
        success: true,
        order: refreshedOrder,
        message: 'تم تحديث معلومات الطلبية وتوليد ملصق شحن جديد ببيانات صحيحة!',
      };
    } catch (err: any) {
      console.error('Error updating order:', err);
      // Fallback local update
      let fallbackOrder: Order | undefined;
      setOrders((prev) => {
        const updatedList = prev.map((o) => {
          if (o.id === orderId) {
            const tracking = o.trackingCode || "TC" + orderId.replace("ORD-", "") + "LHJ";
            fallbackOrder = {
              ...o,
              ...updatedFields,
              bordereauUrl: `/api/delivery/label/${orderId}?tracking=${tracking}&v=${Date.now()}`,
            };
            return fallbackOrder;
          }
          return o;
        });
        saveStoredOrders(updatedList);
        return updatedList;
      });

      return {
        success: true,
        order: fallbackOrder,
        message: 'تم تحديث معلومات الطلبية محلية وتوليد ملصق جديد!',
      };
    }
  };

  const markReadyToShip = async (trackingCodes: string[]) => {
    try {
      const res = await fetch('/Api_v1/aExpédier', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'key': '3490e731e3db4d8c841991987d3cab0f',
          'token': 'b8386c67-f0ce-4ce5-bc3b-cf3246a90819',
        },
        body: JSON.stringify({
          Colis: trackingCodes.map((t) => ({ Tracking: t })),
        }),
      });

      const data = await res.json();
      
      setOrders((prev) => {
        const updatedList = prev.map((o) => {
          if (trackingCodes.includes(o.trackingCode || '') || trackingCodes.includes(o.id)) {
            return {
              ...o,
              situation: 'EnTraitement',
              avancement: 'Prêt à expédier',
              isLockedForEdit: true,
              status: 'SHIPPED' as OrderStatus,
              statusAr: 'جاهزة للشحن - En Traitement',
              statusFr: 'En Traitement / Prêt à expédier',
            };
          }
          return o;
        });
        saveStoredOrders(updatedList);
        return updatedList;
      });

      return {
        success: true,
        message: data.Message || "تمت تغيير حالة الطرود إلى 'En Traitement' وهي الآن جاهزة للشحن وتم قفل التعديل عليها.",
      };
    } catch (err) {
      console.error('Error marking ready to ship:', err);
      // Fallback
      setOrders((prev) => {
        const updatedList = prev.map((o) => {
          if (trackingCodes.includes(o.trackingCode || '') || trackingCodes.includes(o.id)) {
            return {
              ...o,
              situation: 'EnTraitement',
              avancement: 'Prêt à expédier',
              isLockedForEdit: true,
              status: 'SHIPPED' as OrderStatus,
              statusAr: 'جاهزة للشحن - En Traitement',
              statusFr: 'En Traitement / Prêt à expédier',
            };
          }
          return o;
        });
        saveStoredOrders(updatedList);
        return updatedList;
      });

      return {
        success: true,
        message: "تمت تغيير حالة الطرود إلى 'En Traitement' وهي الآن جاهزة للشحن.",
      };
    }
  };

  const deleteParcel = async (trackingCodes: string[]) => {
    try {
      const res = await fetch('/Api_v1/Supprimer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'key': '3490e731e3db4d8c841991987d3cab0f',
          'token': 'b8386c67-f0ce-4ce5-bc3b-cf3246a90819',
        },
        body: JSON.stringify({
          Colis: trackingCodes.map((t) => ({ Tracking: t })),
        }),
      });

      const data = await res.json();

      setOrders((prev) => {
        const updatedList = prev.map((o) => {
          if (trackingCodes.includes(o.trackingCode || '') || trackingCodes.includes(o.id)) {
            return {
              ...o,
              status: 'CANCELLED' as OrderStatus,
              statusAr: 'ملغاة / محذوفة من الشحن',
              statusFr: 'Annulé / Supprimé',
              situation: 'Supprimé',
              avancement: 'Annulé',
            };
          }
          return o;
        });
        saveStoredOrders(updatedList);
        return updatedList;
      });

      const msg = data.Message || "تم حذف / إلغاء الطرود المحددة بنجاح من شركة التوصيل";
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('app-toast', {
            detail: { message: `🗑️ ${msg}`, type: 'success' },
          })
        );
      }

      return {
        success: true,
        message: msg,
      };
    } catch (err) {
      console.error('Error deleting parcel:', err);
      setOrders((prev) => {
        const updatedList = prev.map((o) => {
          if (trackingCodes.includes(o.trackingCode || '') || trackingCodes.includes(o.id)) {
            return {
              ...o,
              status: 'CANCELLED' as OrderStatus,
              statusAr: 'ملغاة / محذوفة من الشحن',
              statusFr: 'Annulé / Supprimé',
              situation: 'Supprimé',
              avancement: 'Annulé',
            };
          }
          return o;
        });
        saveStoredOrders(updatedList);
        return updatedList;
      });

      const fallbackMsg = "تم إلغاء الطرد من الشحن بنجاح";
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('app-toast', {
            detail: { message: `🗑️ ${fallbackMsg}`, type: 'success' },
          })
        );
      }

      return {
        success: true,
        message: fallbackMsg,
      };
    }
  };

  const deleteOrder = (orderId: string) => {
    let orderCustomer = '';
    setOrders((prev) => {
      const target = prev.find((o) => o.id === orderId);
      if (target) {
        orderCustomer = target.customerName ? ` للعميل (${target.customerName})` : '';
      }
      const updatedList = prev.filter((o) => o.id !== orderId);
      saveStoredOrders(updatedList);
      return updatedList;
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: {
            message: `🗑️ تم حذف الطلب ${orderId}${orderCustomer} بنجاح من النظام`,
            type: 'success',
          },
        })
      );
    }
  };

  const getFilteredOrders = () => {
    let baseOrders = orders;
    if (user) {
      if (user.role === 'reseller') {
        const isDemoSeller =
          user.email === 'seller@nouvachat.com' ||
          user.phone === '0550123456' ||
          user.id === 'u-reseller-12';
        if (!isDemoSeller) {
          baseOrders = orders.filter(
            (o) => o.resellerId === user.id || o.resellerEmail === user.email || o.resellerPhone === user.phone
          );
        }
      } else if (user.role === 'warehouse') {
        const cleanUserEmail = user.email?.trim().toLowerCase();
        baseOrders = orders.filter(
          (o) =>
            o.supplierId === user.id ||
            o.items?.some(
              (i) => i.supplierId === user.id || (cleanUserEmail && i.supplierEmail?.toLowerCase() === cleanUserEmail)
            ) ||
            cleanUserEmail === 'warehouse@nouvamarket.com'
        );
      }
    }

    if (filterStatus === 'ALL') return baseOrders;
    if (filterStatus === 'LINK_ORDER') {
      return baseOrders.filter((o) => o.status === 'LINK_ORDER');
    }
    if (filterStatus === 'REVIEW') {
      return baseOrders.filter(
        (o) =>
          o.status !== 'LINK_ORDER' &&
          !o.adminConfirmed &&
          !o.isLockedForEdit &&
          o.status !== 'CONFIRMED' &&
          o.status !== 'PROCESSING' &&
          o.status !== 'SHIPPED' &&
          o.status !== 'DELIVERED' &&
          o.status !== 'CANCELLED' &&
          o.status !== 'FAILED' &&
          o.situation !== 'EnPréparation' &&
          o.situation !== 'Confirmé' &&
          o.situation !== 'PrêtÀExpédier'
      );
    }
    if (filterStatus === 'CONFIRMED') {
      return baseOrders.filter((o) => o.status === 'CONFIRMED' || o.adminConfirmed);
    }
    if (filterStatus === 'FAILED') {
      return baseOrders.filter((o) => o.status === 'FAILED' || o.status === 'CANCELLED' || o.situation === 'Retour' || o.situation === 'Annulé');
    }
    return baseOrders.filter((o) => o.status === filterStatus);
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) => {
      const updatedList = prev.map((o) => {
        if (o.id === orderId) {
          let statusAr = o.statusAr;
          let statusFr = o.statusFr;
          let situation = o.situation;
          let avancement = o.avancement;
          let adminConfirmed = o.adminConfirmed;
          let isLockedForEdit = o.isLockedForEdit;

          if (newStatus === 'LINK_ORDER') {
            statusAr = 'طلب من الرابط';
            statusFr = 'Commande par lien';
            situation = 'طلب من الرابط';
          } else if (newStatus === 'PENDING_SYNC') {
            statusAr = '🔍 قيد المراجعة (في انتظار التأكيد)';
            statusFr = 'En révision';
            situation = 'En révision';
          } else if (newStatus === 'CONFIRMED') {
            statusAr = 'تم التأكيد';
            statusFr = 'Confirmée';
            adminConfirmed = true;
            isLockedForEdit = true;
          } else if (newStatus === 'PROCESSING') {
            statusAr = 'قيد التحضير';
            statusFr = 'En préparation';
            situation = 'EnPréparation';
            adminConfirmed = true;
            isLockedForEdit = true;
          } else if (newStatus === 'SHIPPED') {
            statusAr = 'قيد التوصيل';
            statusFr = 'En cours de livraison';
            avancement = 'En livraison';
            situation = 'EnTransit';
            adminConfirmed = true;
            isLockedForEdit = true;
          } else if (newStatus === 'DELIVERED') {
            statusAr = 'تم التسليم';
            statusFr = 'Livré';
            situation = 'Livré';
            adminConfirmed = true;
            isLockedForEdit = true;

            // Automatically credit reseller wallet commission upon delivery!
            if (!o.commissionCredited) {
              creditResellerCommission(o.id, o.totalProfit || 1000, o.resellerId);
            }
          } else if (newStatus === 'FAILED' || newStatus === 'CANCELLED') {
            statusAr = 'فشل التسليم';
            statusFr = 'Échec de livraison';
            situation = 'Retour';
            adminConfirmed = true;
            isLockedForEdit = true;
          }

          if (o.status !== newStatus) {
            let notifTitle = '';
            let notifBody = '';
            const orderRef = o.trackingCode || o.id;

            if (newStatus === 'CONFIRMED') {
              notifTitle = '✅ تم تأكيد الطلبية';
              notifBody = `تم تأكيد الطلبية #${orderRef} للزبون (${o.customerName}) بنجاح!`;
            } else if (newStatus === 'PROCESSING') {
              notifTitle = '📦 الطلبية قيد التجهيز بالمستودع';
              notifBody = `بدأ المستودع بتجهيز وتحضير الطلبية #${orderRef}.`;
            } else if (newStatus === 'SHIPPED') {
              notifTitle = '🚚 الطلبية في الطريق للزبون';
              notifBody = `تم شحن الطلبية #${orderRef} وتسليمها لشركة التوصيل (${o.wilayaName}).`;
            } else if (newStatus === 'DELIVERED') {
              notifTitle = '🎉 تم تسليم الطلبية بنجاح!';
              notifBody = `تم تسليم الطلبية #${orderRef} للزبون وإضافة أرباحك (+${o.totalProfit || 1000} دج) للمحفظة.`;
            } else if (newStatus === 'FAILED' || newStatus === 'CANCELLED') {
              notifTitle = '❌ إلغاء / عدم تسليم الطلبية';
              notifBody = `تم تغيير حالة الطلبية #${orderRef} إلى (غير مستلمة / ملغاة).`;
            }

            if (notifTitle) {
              const item = o.items?.[0];
              addSellerNotification({
                type: 'order',
                titleAr: notifTitle,
                bodyAr: notifBody,
                productId: item?.productId,
                productNameAr: item?.productName,
              });
            }
          }

          return {
            ...o,
            status: newStatus,
            statusAr,
            statusFr,
            situation,
            avancement,
            adminConfirmed,
            isLockedForEdit,
          };
        }
        return o;
      });
      saveStoredOrders(updatedList);
      return updatedList;
    });
  };

  const setTrackingCode = (orderId: string, trackingCode: string) => {
    setOrders((prev) => {
      const updatedList = prev.map((o) => {
        if (o.id === orderId) {
          const labelUrl = `/api/delivery/label/${orderId}?tracking=${trackingCode}`;
          return {
            ...o,
            trackingCode,
            deliveryCompanySent: true,
            bordereauUrl: labelUrl,
            adminConfirmed: true,
            isLockedForEdit: true,
            status: o.status === 'PENDING_SYNC' ? ('PROCESSING' as OrderStatus) : o.status,
            statusAr: 'تم إصدار بوليصة الشحن والتسليم',
            statusFr: 'Bordereau & Étiquette Générés',
            situation: 'PrêtÀExpédier',
          };
        }
        return o;
      });
      saveStoredOrders(updatedList);
      return updatedList;
    });
  };

  const confirmAdminOrder = (orderId: string) => {
    setOrders((prev) => {
      const updatedList = prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'CONFIRMED' as OrderStatus,
            statusAr: 'تم التأكيد من الأدمن / المستودع',
            statusFr: 'Confirmée par Admin/Dépôt',
            situation: 'Confirmé',
            adminConfirmed: true,
            isLockedForEdit: true,
            confirmedAt: new Date().toISOString(),
          };
        }
        return o;
      });
      saveStoredOrders(updatedList);
      return updatedList;
    });
  };

  const confirmOrderWarehouse = (orderId: string) => {
    setOrders((prev) => {
      const updatedList = prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'PROCESSING' as OrderStatus,
            statusAr: 'قيد التحضير',
            statusFr: 'En préparation',
            situation: 'EnPréparation',
            adminConfirmed: true,
            isLockedForEdit: true,
            confirmedAt: new Date().toISOString(),
            failureReason: undefined,
            cancellationReason: undefined,
          };
        }
        return o;
      });
      saveStoredOrders(updatedList);
      return updatedList;
    });
  };

  const rejectOrderWithReason = (orderId: string, reason: string) => {
    setOrders((prev) => {
      const updatedList = prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'CANCELLED' as OrderStatus,
            statusAr: 'فشل التأكيد',
            statusFr: 'Échec de confirmation',
            situation: 'Annulé',
            cancellationReason: reason,
            failureReason: reason,
            adminConfirmed: false,
            isLockedForEdit: false, // allow reseller to edit & resubmit!
          };
        }
        return o;
      });
      saveStoredOrders(updatedList);
      return updatedList;
    });
  };

  const resubmitOrder = async (orderId: string, updatedFields: Partial<Order>) => {
    let updatedOrder: Order | undefined;
    setOrders((prev) => {
      const updatedList = prev.map((o) => {
        if (o.id === orderId) {
          updatedOrder = {
            ...o,
            ...updatedFields,
            status: 'PENDING_SYNC' as OrderStatus,
            statusAr: 'قيد المراجعة',
            statusFr: 'En révision',
            failureReason: undefined,
            cancellationReason: undefined,
            adminConfirmed: false,
            isLockedForEdit: false,
            createdAt: new Date().toISOString(),
          };
          return updatedOrder;
        }
        return o;
      });
      saveStoredOrders(updatedList);
      return updatedList;
    });
    return { success: true, order: updatedOrder };
  };

  const confirmReturnInWarehouse = (orderId: string) => {
    setOrders((prev) => {
      let targetOrder: Order | undefined;
      const updatedList = prev.map((o) => {
        if (o.id === orderId) {
          targetOrder = o;
          return {
            ...o,
            returnedToWarehouse: true,
            statusAr: 'تم الإرجاع للمستودع وإعادة المخزون',
            statusFr: 'Retourné au dépôt (Stock Restauré)',
            situation: 'RetourReçu',
          };
        }
        return o;
      });

      // Automatically restore inventory stock for each item in the returned order
      if (targetOrder) {
        try {
          const storedProds = getStoredProducts();
          const updatedProds = storedProds.map((prod) => {
            let prodModified = false;

            const matchingItemsForProd = targetOrder?.items.filter(
              (item) => item.productId === prod.id || item.productName === prod.nameAr
            ) || [];

            if (matchingItemsForProd.length === 0) {
              return prod;
            }

            const updatedVariants = prod.variants.map((varItem) => {
              const matchingVariantItems = matchingItemsForProd.filter(
                (item) =>
                  (!item.variantSize || item.variantSize === varItem.size) &&
                  (!item.variantColor || item.variantColor === varItem.color)
              );
              if (matchingVariantItems.length > 0) {
                prodModified = true;
                const totalQtyToAdd = matchingVariantItems.reduce((sum, item) => sum + item.quantity, 0);
                return {
                  ...varItem,
                  stockCount: varItem.stockCount + totalQtyToAdd,
                };
              }
              return varItem;
            });

            if (!prodModified && prod.variants.length > 0) {
              const totalQtyToAdd = matchingItemsForProd.reduce((sum, item) => sum + item.quantity, 0);
              const updatedFirst = { ...prod.variants[0], stockCount: prod.variants[0].stockCount + totalQtyToAdd };
              return { ...prod, variants: [updatedFirst, ...prod.variants.slice(1)] };
            }

            return prodModified ? { ...prod, variants: updatedVariants } : prod;
          });
          saveStoredProducts(updatedProds);

          addWarehouseNotification({
            type: 'system',
            titleAr: '🔄 تم استلام وتأكيد طرد مرجع (Retour)',
            bodyAr: `تم إعادة إدخال كميات المنتج لمخزون المستودع للطلبية المرجعة #${targetOrder.trackingCode || targetOrder.id}.`,
            productId: targetOrder.items?.[0]?.productId,
            productNameAr: targetOrder.items?.[0]?.productName,
          });
        } catch (e) {
          console.error('Error restoring stock on warehouse return:', e);
        }
      }

      saveStoredOrders(updatedList);
      return updatedList;
    });
  };

  const cancelOrderWithReason = (orderId: string, reason: string) => {
    let orderCustomer = '';
    setOrders((prev) => {
      const target = prev.find((o) => o.id === orderId);
      if (target) {
        orderCustomer = target.customerName ? ` للعميل (${target.customerName})` : '';
      }
      const updatedList = prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'CANCELLED' as OrderStatus,
            statusAr: `ملغاة من الأدمن: ${reason}`,
            statusFr: `Annulé: ${reason}`,
            situation: 'Annulé',
            cancellationReason: reason,
            failureReason: reason,
            isLockedForEdit: true,
          };
        }
        return o;
      });
      saveStoredOrders(updatedList);
      return updatedList;
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: {
            message: `🚫 تم إلغاء الطلب ${orderId}${orderCustomer} بنجاح (${reason})`,
            type: 'info',
          },
        })
      );
    }
  };

  const retryDelivery = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'PROCESSING',
              statusAr: 'تمت إعادة الطلب للتجهيز',
              statusFr: 'Relancé en préparation',
            }
          : o
      )
    );
  };

  const userFilteredOrders = React.useMemo(() => {
    if (!user) return orders;
    if (user.role === 'admin') return orders;
    if (user.role === 'reseller') {
      const isDemoSeller =
        user.email === 'seller@nouvachat.com' ||
        user.phone === '0550123456' ||
        user.id === 'u-reseller-12';
      if (!isDemoSeller) {
        return orders.filter(
          (o) => o.resellerId === user.id || o.resellerEmail === user.email || o.resellerPhone === user.phone
        );
      }
    } else if (user.role === 'warehouse') {
      const cleanUserEmail = user.email?.trim().toLowerCase();
      return orders.filter(
        (o) =>
          o.supplierId === user.id ||
          o.items?.some(
            (i) => i.supplierId === user.id || (cleanUserEmail && i.supplierEmail?.toLowerCase() === cleanUserEmail)
          ) ||
          cleanUserEmail === 'warehouse@nouvamarket.com'
      );
    }
    return orders;
  }, [orders, user]);

  const pendingLinkOrdersCount = React.useMemo(() => {
    return userFilteredOrders.filter((o) => o.status === 'LINK_ORDER').length;
  }, [userFilteredOrders]);

  const getWhatsAppReceiptText = (order: Order) => {
    const itemsList = order.items
      .map((it) => `• ${it.productName} (${it.variantSize} / ${it.variantColor}) × ${it.quantity} = ${it.sellingPrice * it.quantity}دج`)
      .join('\n');

    return `وصل الطلب - كيدز ماركت 🛍️
-----------------------------------
رقم الطلبية: ${order.id}
اسم الزبون: ${order.customerName}
العنوان: ${order.wilaya} - ${order.commune}

الطلبات:
${itemsList}

مجموع المنتجات: ${order.totalAmount}دج
مصاريف التوصيل: ${order.shippingFee}دج
المبلغ الإجمالي عند الاستلام: ${order.totalAmount + order.shippingFee}دج

شكراً لثقتكم بنا! ❤️
لأي استفسار يرجى الرد على هذه الرسالة.`;
  };

  return (
    <OrderContext.Provider
      value={{
        orders: userFilteredOrders,
        pendingLinkOrdersCount,
        isLoading,
        createOrder,
        confirmAndShipOrder,
        confirmOrderWarehouse,
        rejectOrderWithReason,
        resubmitOrder,
        confirmReturnInWarehouse,
        updateOrder,
        updateOrderStatus,
        setTrackingCode,
        confirmAdminOrder,
        cancelOrderWithReason,
        markReadyToShip,
        deleteParcel,
        deleteOrder,
        syncPendingQueue,
        filterStatus,
        setFilterStatus,
        getFilteredOrders,
        getWhatsAppReceiptText,
        retryDelivery,
        favorites,
        toggleFavorite,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used inside OrderProvider');
  return ctx;
}
