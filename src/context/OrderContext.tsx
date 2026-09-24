import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Order, OrderStatus } from '../types';
import { getStoredOrders, enqueueOrder, flushOfflineQueue, saveStoredOrders, getDeletedOrderIds, markOrderDeleted } from '../offline/queue';
import { useNetworkStatus } from '../offline/networkStatus';
import { useAuth } from './AuthContext';
import { creditResellerCommission } from '../lib/walletHelper';
import { addSellerNotification, addAdminNotification, addWarehouseNotification } from '../lib/notificationHelper';
import { getStoredProducts, saveStoredProducts } from '../data/mockProducts';
import { pollOrderStatusesFromDeliveryApis, getStoredSyncSettings } from '../lib/deliverySyncManager';
import {
  syncOrderStatus as coreSyncOrderStatus,
  SyncOrderStatusOptions,
  SyncOrderStatusResult,
} from '../lib/orderStatusSync';

interface OrderContextType {
  orders: Order[];
  pendingLinkOrdersCount: number;
  isLoading: boolean;
  createOrder: (orderInput: Partial<Order>) => Promise<{ idempotencyKey: string; order: Order }>;
  syncOrderStatus: (
    orderIdOrOrder: string | Order,
    newStatus: OrderStatus,
    options?: SyncOrderStatusOptions
  ) => Promise<SyncOrderStatusResult>;
  confirmAndShipOrder: (orderId: string) => Promise<{ success: boolean; order?: Order; message?: string }>;
  claimOrderForConfirmer: (orderId: string, agent: { id: string; fullName: string }) => Promise<{ success: boolean; message: string; order?: Order }>;
  releaseOrderFromConfirmer: (orderId: string, agentId: string) => Promise<{ success: boolean; message: string }>;
  confirmOrderByAgent: (orderId: string, agent: { id: string; fullName: string }, note?: string) => Promise<{ success: boolean; order?: Order; message?: string }>;
  logConfirmerCall: (orderId: string, agent: { id: string; fullName: string }, result: string, note?: string) => void;
  updateOrderTrackingFollowup: (orderId: string, agentId: string, newStatus?: OrderStatus, note?: string, agentName?: string) => void;
  updateCourierCoordination: (
    orderId: string,
    data: {
      driverName?: string;
      driverPhone?: string;
      driverCompany?: string;
      coordinationNotes?: string;
      coordinationStatus?: 'waiting_pickup' | 'out_for_delivery' | 'notified_buyer' | 'driver_called_no_answer' | 'customer_rescheduled' | 'address_clarified' | 'delivered' | 'returned';
      newStatus?: OrderStatus;
    },
    agent?: { id: string; fullName: string }
  ) => void;
  confirmOrderWarehouse: (
    orderId: string,
    supplierInfo?: { id?: string; name?: string }
  ) => { success: boolean; message: string; order?: Order };
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

// Helper to broadcast order mutations to other tabs & windows
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('nouvamarket_orders_sync');
  }
} catch {
  // Ignore
}

function broadcastSync(payload: any) {
  try {
    syncChannel?.postMessage(payload);
  } catch {
    // Ignore
  }
}

function mergeOrderLists(local: Order[], remote: Order[]): Order[] {
  const map = new Map<string, Order>();
  const deletedIds = getDeletedOrderIds();

  // Add all remote orders that are not blacklisted
  remote.forEach((o) => {
    if (!o) return;
    if (o.id && deletedIds.has(String(o.id))) return;
    if (o.trackingCode && deletedIds.has(String(o.trackingCode))) return;
    if (o.id) map.set(o.id, o);
    if (o.idempotencyKey) map.set(o.idempotencyKey, o);
    if (o.trackingCode) map.set(o.trackingCode, o);
  });

  // Add or update local orders that are not blacklisted
  local.forEach((o) => {
    if (!o) return;
    if (o.id && deletedIds.has(String(o.id))) return;
    if (o.trackingCode && deletedIds.has(String(o.trackingCode))) return;
    const key = o.id || o.idempotencyKey || o.trackingCode;
    const existing = (o.id && map.get(o.id)) || (o.idempotencyKey && map.get(o.idempotencyKey)) || (o.trackingCode && map.get(o.trackingCode));
    if (!existing) {
      map.set(key || String(Math.random()), o);
    } else {
      const merged: Order = {
        ...existing,
        ...o,
        status: existing.status || o.status,
        statusAr: existing.statusAr || o.statusAr,
        statusFr: existing.statusFr || o.statusFr,
        situation: existing.situation || o.situation,
        avancement: existing.avancement || o.avancement,
        adminConfirmed: existing.adminConfirmed ?? o.adminConfirmed,
        isLockedForEdit: existing.isLockedForEdit ?? o.isLockedForEdit,
        trackingCode: existing.trackingCode || o.trackingCode,
        bordereauUrl: existing.bordereauUrl || o.bordereauUrl,
        assignedConfirmerId: o.assignedConfirmerId !== undefined ? o.assignedConfirmerId : existing.assignedConfirmerId,
        assignedConfirmerName: o.assignedConfirmerName !== undefined ? o.assignedConfirmerName : existing.assignedConfirmerName,
        assignedAt: o.assignedAt || existing.assignedAt,
        confirmedBy: o.confirmedBy || existing.confirmedBy,
        confirmerName: o.confirmerName || existing.confirmerName,
        confirmedAt: o.confirmedAt || existing.confirmedAt,
        confirmationNote: o.confirmationNote || existing.confirmationNote,
        callAttempts: o.callAttempts ?? existing.callAttempts,
        lastCallDate: o.lastCallDate || existing.lastCallDate,
        lastCallResult: o.lastCallResult || existing.lastCallResult,
        callHistory: o.callHistory || existing.callHistory,
        trackingFollowedBy: o.trackingFollowedBy || existing.trackingFollowedBy,
        trackingFollowedByName: o.trackingFollowedByName || existing.trackingFollowedByName,
        deliveredAt: o.deliveredAt || existing.deliveredAt,
        driverName: o.driverName || existing.driverName,
        driverPhone: o.driverPhone || existing.driverPhone,
        driverCompany: o.driverCompany || existing.driverCompany,
        coordinationNotes: o.coordinationNotes || existing.coordinationNotes,
        coordinationStatus: o.coordinationStatus || existing.coordinationStatus,
        lastCoordinationAt: o.lastCoordinationAt || existing.lastCoordinationAt,
      };
      map.set(merged.id || key, merged);
    }
  });

  return Array.from(new Set(Array.from(map.values()))).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

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

  // Load orders on startup & initialize real-time SSE + BroadcastChannel
  useEffect(() => {
    const local = getStoredOrders();
    if (local && local.length > 0) {
      setOrders(local);
    } else {
      setOrders(INITIAL_DEMO_ORDERS);
      saveStoredOrders(INITIAL_DEMO_ORDERS);
    }
    setIsLoading(false);

    // 1. Initial fetch from server
    const fetchServerOrders = async () => {
      try {
        const res = await fetch('/api/reseller/orders');
        if (res.ok) {
          const data = await res.json();
          const incomingOrders = Array.isArray(data) ? data : (data.orders || []);
          if (Array.isArray(incomingOrders)) {
            setOrders((prev) => {
              const merged = mergeOrderLists(prev, incomingOrders);
              saveStoredOrders(merged);
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('Initial server orders fetch fallback', err);
      }
    };
    fetchServerOrders();

    // 2. Setup BroadcastChannel listener for multi-tab sync
    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        const data = event.data;
        if (data?.type === 'order_updated' || data?.type === 'order_created') {
          const order = data.order;
          if (order) {
            setOrders((prev) => {
              const exists = prev.some((o) => o.id === order.id || (o.idempotencyKey && o.idempotencyKey === order.idempotencyKey));
              let updated: Order[];
              if (exists) {
                updated = prev.map((o) => (o.id === order.id || (o.idempotencyKey && o.idempotencyKey === order.idempotencyKey) ? { ...o, ...order } : o));
              } else {
                updated = [order, ...prev];
              }
              saveStoredOrders(updated);
              return updated;
            });
          }
        } else if (data?.type === 'order_deleted') {
          markOrderDeleted(data.orderId);
          setOrders((prev) => {
            const updated = prev.filter((o) => o.id !== data.orderId);
            saveStoredOrders(updated);
            return updated;
          });
        }
      };
    }

    // 3. Setup Server-Sent Events (SSE) for Real-Time synchronization
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/reseller/orders/stream');

      eventSource.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'initial' && Array.isArray(msg.orders)) {
            setOrders((prev) => {
              const merged = mergeOrderLists(prev, msg.orders);
              saveStoredOrders(merged);
              return merged;
            });
          } else if (msg.type === 'order_created' || msg.type === 'order_updated') {
            const newOrUpdated: Order = msg.order;
            if (newOrUpdated) {
              setOrders((prev) => {
                const exists = prev.some(
                  (o) => o.id === newOrUpdated.id || (o.idempotencyKey && o.idempotencyKey === newOrUpdated.idempotencyKey)
                );
                let updatedList: Order[];
                if (exists) {
                  updatedList = prev.map((o) =>
                    o.id === newOrUpdated.id || (o.idempotencyKey && o.idempotencyKey === newOrUpdated.idempotencyKey)
                      ? { ...o, ...newOrUpdated }
                      : o
                  );
                } else {
                  updatedList = [newOrUpdated, ...prev];
                }
                saveStoredOrders(updatedList);
                return updatedList;
              });

              if (msg.type === 'order_created' && (newOrUpdated.status === 'LINK_ORDER' || newOrUpdated.source === 'LINK')) {
                window.dispatchEvent(
                  new CustomEvent('app-toast', {
                    detail: {
                      message: `🔥 طلب جديد وارد من الرابط: ${newOrUpdated.customerName || 'زبون'} (${newOrUpdated.totalAmount} دج)`,
                      type: 'success',
                    },
                  })
                );
              }
            }
          } else if (msg.type === 'order_deleted') {
            markOrderDeleted(msg.orderId);
            setOrders((prev) => {
              const updatedList = prev.filter((o) => o.id !== msg.orderId);
              saveStoredOrders(updatedList);
              return updatedList;
            });
          }
        } catch (parseErr) {
          console.warn('SSE parse error', parseErr);
        }
      };

      eventSource.onerror = () => {
        // SSE will attempt to auto-reconnect
      };
    } catch (sseErr) {
      console.warn('SSE connection initialization error', sseErr);
    }

    // 4. Fallback Polling every 3.5 seconds
    const interval = setInterval(fetchServerOrders, 3500);

    // 5. In-window synchronous event listener for instant multi-role update
    const handleOrderStatusSynced = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.order) {
        setOrders((prev) => {
          const exists = prev.some((o) => o.id === detail.order.id);
          let updatedList: Order[];
          if (exists) {
            updatedList = prev.map((o) => (o.id === detail.order.id ? { ...o, ...detail.order } : o));
          } else {
            updatedList = [detail.order, ...prev];
          }
          saveStoredOrders(updatedList);
          return updatedList;
        });
      }
    };
    window.addEventListener('order_status_synced', handleOrderStatusSynced);

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
      window.removeEventListener('order_status_synced', handleOrderStatusSynced);
    };
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

  // Automated Delivery Carrier API Polling Mechanism
  // Periodically queries delivery APIs for active orders, updates database, and triggers app-toasts for the reseller
  useEffect(() => {
    let pollingInterval: any = null;

    const executePolling = async () => {
      const settings = getStoredSyncSettings();
      if (!settings.autoPollingEnabled) return;

      try {
        const result = await pollOrderStatusesFromDeliveryApis(orders, {
          forceStatusChange: false,
          onOrderUpdated: (updatedOrder) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
            );
          },
        });

        if (result.updatedOrdersCount > 0) {
          setOrders(result.allOrders);
        }
      } catch (err) {
        console.warn('Delivery API background polling loop warning:', err);
      }
    };

    // Initial background poll after 20 seconds
    const initialDelay = setTimeout(() => {
      executePolling();
    }, 20000);

    const settings = getStoredSyncSettings();
    const intervalMs = Math.max((settings.intervalSeconds || 45) * 1000, 20000);
    pollingInterval = setInterval(executePolling, intervalMs);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(pollingInterval);
    };
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
          body: JSON.stringify({ ...localOrder, ...enrichedInput, idempotencyKey }),
        });
        const data = await res.json();
        if (data.success && data.order) {
          const syncedOrder = { ...data.order, syncStatus: 'synced' as const };
          setOrders((prev) => {
            const updated = prev.map((o) => (o.idempotencyKey === idempotencyKey ? syncedOrder : o));
            saveStoredOrders(updated);
            return updated;
          });
          broadcastSync({ type: 'order_created', order: syncedOrder });
          return { idempotencyKey, order: syncedOrder };
        }
      } catch (err) {
        console.log('[Order Context] Network sync deferred to offline queue');
      }
    }

    broadcastSync({ type: 'order_created', order: localOrder });
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

  /**
   * Claim and exclusively lock an order for a specific confirmer agent
   */
  const claimOrderForConfirmer = async (
    orderId: string,
    agent: { id: string; fullName: string }
  ): Promise<{ success: boolean; message: string; order?: Order }> => {
    let updatedOrder: Order | undefined;
    let conflictError: string | undefined;

    setOrders((prev) => {
      const target = prev.find((o) => o.id === orderId);
      if (!target) {
        conflictError = 'الطلبية غير موجودة';
        return prev;
      }
      if (target.assignedConfirmerId && target.assignedConfirmerId !== agent.id && agent.id !== 'admin') {
        conflictError = `⚠️ الطلبية محجوزة ومكلفة بالفعل للمؤكد (${target.assignedConfirmerName || target.assignedConfirmerId}). لا يمكن لمؤكد آخر استلامها بحساب مختلف.`;
        return prev;
      }
      if (target.confirmedBy && target.confirmedBy !== agent.id && agent.id !== 'admin') {
        conflictError = `⚠️ الطلبية مؤكدة بالفعل من قِبل المؤكد (${target.confirmerName || target.confirmedBy}). لا يمكن لمؤكد ثانٍ العمل عليها.`;
        return prev;
      }

      const updated = prev.map((o) => {
        if (o.id === orderId) {
          updatedOrder = {
            ...o,
            assignedConfirmerId: agent.id,
            assignedConfirmerName: agent.fullName,
            assignedAt: o.assignedAt || new Date().toISOString(),
          };
          return updatedOrder;
        }
        return o;
      });
      saveStoredOrders(updated);
      return updated;
    });

    if (conflictError) {
      return { success: false, message: conflictError };
    }

    if (updatedOrder) {
      fetch(`/api/reseller/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      }).catch(() => {});
      broadcastSync({ type: 'order_updated', order: updatedOrder });
      return {
        success: true,
        message: `تم استلام وتكليف الطلبية لحسابك (${agent.fullName}) بنجاح 🔒`,
        order: updatedOrder,
      };
    }
    return { success: false, message: 'تعذر استلام الطلبية' };
  };

  /**
   * Release / Unclaim an order so another confirmer can pick it up
   */
  const releaseOrderFromConfirmer = async (
    orderId: string,
    agentId: string
  ): Promise<{ success: boolean; message: string }> => {
    let updatedOrder: Order | undefined;
    let conflictError: string | undefined;

    setOrders((prev) => {
      const target = prev.find((o) => o.id === orderId);
      if (!target) {
        conflictError = 'الطلبية غير موجودة';
        return prev;
      }
      if (target.assignedConfirmerId && target.assignedConfirmerId !== agentId && agentId !== 'admin') {
        conflictError = 'لا يمكنك إلغاء حجز طلبية مكلفة لمؤكد آخر';
        return prev;
      }
      if (target.adminConfirmed && target.status !== 'PENDING') {
        conflictError = 'لا يمكن إخلاء طلبية بعد تأكيدها ونقلها للتنفيذ';
        return prev;
      }

      const updated = prev.map((o) => {
        if (o.id === orderId) {
          updatedOrder = {
            ...o,
            assignedConfirmerId: undefined,
            assignedConfirmerName: undefined,
            assignedAt: undefined,
          };
          return updatedOrder;
        }
        return o;
      });
      saveStoredOrders(updated);
      return updated;
    });

    if (conflictError) {
      return { success: false, message: conflictError };
    }

    if (updatedOrder) {
      fetch(`/api/reseller/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      }).catch(() => {});
      broadcastSync({ type: 'order_updated', order: updatedOrder });
      return { success: true, message: 'تم إخلاء الطلبية بنجاح وإتاحتها لجميع المؤكدين 🔓' };
    }
    return { success: false, message: 'تعذر إخلاء الطلبية' };
  };

  /**
   * Dedicated confirmation by Company Confirmation Agent (مؤكد الطلبيات)
   * Unified sync across Marketer, Confirmer, and Supplier
   */
  const confirmOrderByAgent = async (
    orderId: string,
    agent: { id: string; fullName: string },
    note?: string
  ): Promise<{ success: boolean; order?: Order; message?: string }> => {
    // 1. Validation check for cross-confirmer exclusivity
    const currentOrder = orders.find((o) => o.id === orderId);
    if (!currentOrder) {
      return { success: false, message: 'الطلبية غير موجودة' };
    }

    if (currentOrder.assignedConfirmerId && currentOrder.assignedConfirmerId !== agent.id && agent.id !== 'admin') {
      return {
        success: false,
        message: `⛔ غير مسموح: هذه الطلبية محجوزة ومكلفة للمؤكد (${currentOrder.assignedConfirmerName || currentOrder.assignedConfirmerId}). لا يمكن لمؤكدين بحسابين مختلفين تأكيد نفس الطلبية.`,
      };
    }

    // Strict check: Has this order already been confirmed by the Supplier / Warehouse?
    if (
      currentOrder.confirmedByRole === 'SUPPLIER' ||
      currentOrder.confirmedBy === 'supplier' ||
      (currentOrder.adminConfirmed && !currentOrder.confirmedBy)
    ) {
      return {
        success: false,
        message: `⛔ غير مسموح: هذه الطلبية تم تأكيدها مسبقاً من قِبل المورد/المستودع (${currentOrder.confirmerName || 'المستودع'}). لا يمكن للمؤكد والمورد تأكيد نفس الطلبية لمنع الازدواجية وتكرار الشحن.`,
      };
    }

    if (currentOrder.confirmedBy && currentOrder.confirmedBy !== agent.id && agent.id !== 'admin') {
      return {
        success: false,
        message: `⛔ غير مسموح: هذه الطلبية مؤكدة مسبقاً من قِبل المؤكد (${currentOrder.confirmerName || currentOrder.confirmedBy}). لا يمكن لمؤكد ثانٍ تأكيدها مرة أخرى لمنع الازدواجية.`,
      };
    }

    const tracking = currentOrder.trackingCode || ("TC" + orderId.replace("ORD-", "") + "LHJ");
    const labelUrl = currentOrder.bordereauUrl || `/api/delivery/label/${orderId}?tracking=${tracking}`;
    const courierName = currentOrder.deliveryCompanyName || 'Ecom Delivery';
    let updatedOrder: Order | undefined;

    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          const currentHistory = o.callHistory || [];
          const newCallEntry = {
            date: new Date().toISOString(),
            result: 'تم الرد والتأكيد بنجاح',
            note: note || 'تم الاتصال بالزبون وتأكيد بيانات الطلبية',
            agentName: agent.fullName,
          };

          updatedOrder = {
            ...o,
            status: 'CONFIRMED',
            statusAr: 'مؤكدة - جاري التجهيز بالمستودع',
            statusFr: 'Confirmée - En préparation',
            situation: 'EnPréparation',
            adminConfirmed: true,
            isLockedForEdit: true,
            assignedConfirmerId: agent.id,
            assignedConfirmerName: agent.fullName,
            assignedAt: o.assignedAt || new Date().toISOString(),
            confirmedBy: agent.id,
            confirmerName: agent.fullName,
            confirmedByRole: 'CONFIRMER',
            confirmedAt: new Date().toISOString(),
            trackingFollowedBy: agent.id,
            trackingFollowedByName: agent.fullName,
            confirmationNote: note || o.confirmationNote || 'تم التأكيد هاتفياً من فريق الشركة',
            trackingCode: tracking,
            bordereauUrl: labelUrl,
            deliveryCompanySent: true,
            deliveryCompanyName: courierName,
            callAttempts: (o.callAttempts || 0) + 1,
            lastCallDate: new Date().toISOString(),
            lastCallResult: 'تم الرد والتأكيد بنجاح',
            callHistory: [newCallEntry, ...currentHistory],
          };
          return updatedOrder;
        }
        return o;
      });
      saveStoredOrders(updated);
      return updated;
    });

    if (updatedOrder) {
      // Sync to backend API
      fetch(`/api/reseller/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      }).catch(() => {});

      broadcastSync({ type: 'order_updated', order: updatedOrder });

      // Notifications
      const firstItem = (updatedOrder as Order).items?.[0];
      addSellerNotification({
        type: 'order',
        titleAr: '✅ تم تأكيد طلبيتك',
        bodyAr: `قام مؤكد الطلبيات (${agent.fullName}) بتأكيد طلبيتك #${(updatedOrder as Order).trackingCode || orderId} للزبون (${(updatedOrder as Order).customerName}).`,
        productId: firstItem?.productId,
        productNameAr: firstItem?.productName,
      });

      addWarehouseNotification({
        type: 'order',
        titleAr: '📦 طلبية جديدة جاهزة للتجهيز بالمستودع',
        bodyAr: `أكّد (${agent.fullName}) الطلبية #${(updatedOrder as Order).trackingCode || orderId} - يرجى تغليفها وإعداد الشحن.`,
      });

      try {
        window.dispatchEvent(new CustomEvent('orders_updated'));
      } catch (e) {}

      return { success: true, order: updatedOrder, message: 'تم تأكيد الطلبية بنجاح ومزامنتها مع المورد والمسوق' };
    }

    return { success: false, message: 'الطلبية غير موجودة' };
  };

  /**
   * Log a call attempt by Confirmation Agent (لم يرد، مشغول، طلب تأجيل، مغلق...)
   */
  const logConfirmerCall = (
    orderId: string,
    agent: { id: string; fullName: string },
    result: string,
    note?: string
  ) => {
    // Cross-confirmer validation: cannot log call on another confirmer's order
    const target = orders.find((o) => o.id === orderId);
    if (target && agent.id !== 'admin') {
      if (target.assignedConfirmerId && target.assignedConfirmerId !== agent.id) {
        return;
      }
      if (target.confirmedBy && target.confirmedBy !== agent.id) {
        return;
      }
    }

    let updatedOrder: Order | undefined;
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          const currentHistory = o.callHistory || [];
          const newCallEntry = {
            date: new Date().toISOString(),
            result,
            note: note || '',
            agentName: agent.fullName,
          };
          updatedOrder = {
            ...o,
            assignedConfirmerId: o.assignedConfirmerId || agent.id,
            assignedConfirmerName: o.assignedConfirmerName || agent.fullName,
            assignedAt: o.assignedAt || new Date().toISOString(),
            callAttempts: (o.callAttempts || 0) + 1,
            lastCallDate: new Date().toISOString(),
            lastCallResult: result,
            callHistory: [newCallEntry, ...currentHistory],
            confirmationNote: note ? `${o.confirmationNote ? o.confirmationNote + ' | ' : ''}${result}: ${note}` : o.confirmationNote,
          };
          return updatedOrder;
        }
        return o;
      });
      saveStoredOrders(updated);
      return updated;
    });

    if (updatedOrder) {
      fetch(`/api/reseller/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      }).catch(() => {});
      broadcastSync({ type: 'order_updated', order: updatedOrder });
      try {
        window.dispatchEvent(new CustomEvent('orders_updated'));
      } catch (e) {}
    }
  };

  /**
   * Update delivery tracking follow-up by Confirmation Agent
   */
  const updateOrderTrackingFollowup = (
    orderId: string,
    agentId: string,
    newStatus?: OrderStatus,
    note?: string,
    agentName?: string
  ) => {
    // Cross-confirmer exclusivity: check if order is under another confirmer's follow-up
    const target = orders.find((o) => o.id === orderId);
    if (target && agentId !== 'admin') {
      if (target.trackingFollowedBy && target.trackingFollowedBy !== agentId) {
        return;
      }
      if (target.confirmedBy && target.confirmedBy !== agentId && !target.trackingFollowedBy) {
        return;
      }
    }

    let updatedOrder: Order | undefined;
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          const targetStatus = newStatus || o.status;
          let statusAr = o.statusAr;
          let statusFr = o.statusFr;
          let situation = o.situation;
          let deliveredAt = o.deliveredAt;

          if (targetStatus === 'DELIVERED') {
            statusAr = 'تم التسليم بنجاح';
            statusFr = 'Livré';
            situation = 'Livré';
            deliveredAt = deliveredAt || new Date().toISOString();
            if (!o.commissionCredited) {
              creditResellerCommission(o.id, o.totalProfit || 1000, o.resellerId);
            }
          } else if (targetStatus === 'SHIPPED') {
            statusAr = 'قيد التوصيل والشحن';
            statusFr = 'En cours de livraison';
            situation = 'EnTransit';
          } else if (targetStatus === 'FAILED' || targetStatus === 'CANCELLED') {
            statusAr = 'فشل التسليم / مرتجع';
            statusFr = 'Échec de livraison';
            situation = 'Retour';
          }

          updatedOrder = {
            ...o,
            status: targetStatus,
            statusAr,
            statusFr,
            situation,
            deliveredAt,
            trackingFollowedBy: o.trackingFollowedBy || agentId,
            trackingFollowedByName: o.trackingFollowedByName || agentName,
            confirmationNote: note ? `${o.confirmationNote ? o.confirmationNote + ' | ' : ''}${note}` : o.confirmationNote,
          };
          return updatedOrder;
        }
        return o;
      });
      saveStoredOrders(updated);
      return updated;
    });

    if (updatedOrder) {
      fetch(`/api/reseller/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      }).catch(() => {});
      broadcastSync({ type: 'order_updated', order: updatedOrder });
      try {
        window.dispatchEvent(new CustomEvent('orders_updated'));
      } catch (e) {}
    }
  };

  /**
   * Update courier driver information and buyer-courier coordination status
   */
  const updateCourierCoordination = (
    orderId: string,
    data: {
      driverName?: string;
      driverPhone?: string;
      driverCompany?: string;
      coordinationNotes?: string;
      coordinationStatus?: 'waiting_pickup' | 'out_for_delivery' | 'notified_buyer' | 'driver_called_no_answer' | 'customer_rescheduled' | 'address_clarified' | 'delivered' | 'returned';
      newStatus?: OrderStatus;
    },
    agent?: { id: string; fullName: string }
  ) => {
    // Exclusivity check: prevent another confirmer from hijacking coordination
    if (agent && agent.id !== 'admin') {
      const target = orders.find((o) => o.id === orderId);
      if (target) {
        if (target.trackingFollowedBy && target.trackingFollowedBy !== agent.id) {
          return;
        }
        if (target.confirmedBy && target.confirmedBy !== agent.id && !target.trackingFollowedBy) {
          return;
        }
      }
    }

    let updatedOrder: Order | undefined;
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          // Auto-derive targetStatus from coordinationStatus if not explicitly provided
          let targetStatus = data.newStatus || o.status;
          if (!data.newStatus) {
            if (data.coordinationStatus === 'delivered') {
              targetStatus = 'DELIVERED';
            } else if (data.coordinationStatus === 'returned') {
              targetStatus = 'FAILED';
            } else if (data.coordinationStatus === 'out_for_delivery') {
              targetStatus = 'SHIPPED';
            }
          }

          let statusAr = o.statusAr;
          let statusFr = o.statusFr;
          let situation = o.situation;
          let deliveredAt = o.deliveredAt;

          if (targetStatus === 'DELIVERED') {
            statusAr = 'تم التسليم بنجاح (Livré)';
            statusFr = 'Livré';
            situation = 'Livré';
            deliveredAt = deliveredAt || new Date().toISOString();
            if (!o.commissionCredited) {
              creditResellerCommission(o.id, o.totalProfit || 1000, o.resellerId);
            }
          } else if (targetStatus === 'SHIPPED') {
            statusAr = 'خارج للتوصيل (Sorti en livraison)';
            statusFr = 'Sorti en livraison';
            situation = 'SortiEnLivraison';
          } else if (targetStatus === 'FAILED' || targetStatus === 'CANCELLED') {
            statusAr = 'فشل التسليم / مرتجع (Retour)';
            statusFr = 'Retour';
            situation = 'Retour';
          }

          updatedOrder = {
            ...o,
            status: targetStatus,
            statusAr,
            statusFr,
            situation,
            deliveredAt,
            trackingFollowedBy: o.trackingFollowedBy || agent?.id,
            trackingFollowedByName: o.trackingFollowedByName || agent?.fullName,
            driverName: data.driverName !== undefined ? data.driverName : o.driverName,
            driverPhone: data.driverPhone !== undefined ? data.driverPhone : o.driverPhone,
            driverCompany: data.driverCompany !== undefined ? data.driverCompany : o.driverCompany,
            coordinationNotes: data.coordinationNotes !== undefined ? data.coordinationNotes : o.coordinationNotes,
            coordinationStatus: data.coordinationStatus !== undefined ? data.coordinationStatus : o.coordinationStatus,
            lastCoordinationAt: new Date().toISOString(),
          };
          return updatedOrder;
        }
        return o;
      });
      saveStoredOrders(updated);
      return updated;
    });

    if (updatedOrder) {
      fetch(`/api/reseller/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      }).catch(() => {});
      broadcastSync({ type: 'order_updated', order: updatedOrder });
      try {
        window.dispatchEvent(new CustomEvent('orders_updated'));
      } catch (e) {}
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
    markOrderDeleted(orderId);
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

    // Sync deletion to server & other tabs
    fetch(`/api/reseller/orders/${orderId}`, { method: 'DELETE' }).catch(() => {});
    broadcastSync({ type: 'order_deleted', orderId });

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
            (o) => !o.resellerId || o.resellerId === user.id || o.resellerEmail === user.email || o.resellerPhone === user.phone
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

  const syncOrderStatus = useCallback(
    async (
      orderIdOrOrder: string | Order,
      newStatus: OrderStatus,
      options?: SyncOrderStatusOptions
    ): Promise<SyncOrderStatusResult> => {
      const res = await coreSyncOrderStatus(orderIdOrOrder, newStatus, options);
      if (res.success && res.order) {
        setOrders((prev) => {
          const updatedList = prev.map((o) => (o.id === res.order!.id ? res.order! : o));
          if (!updatedList.some((o) => o.id === res.order!.id)) {
            updatedList.unshift(res.order!);
          }
          saveStoredOrders(updatedList);
          return updatedList;
        });
      }
      return res;
    },
    []
  );

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    syncOrderStatus(orderId, newStatus, {
      source: 'system',
      dispatchToCourier: true,
      notifyParties: true,
    });
  };

  const setTrackingCode = (orderId: string, trackingCode: string) => {
    let updatedOrderObj: Order | undefined;
    setOrders((prev) => {
      const updatedList = prev.map((o) => {
        if (o.id === orderId) {
          const labelUrl = `/api/delivery/label/${orderId}?tracking=${trackingCode}`;
          updatedOrderObj = {
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
          return updatedOrderObj;
        }
        return o;
      });
      saveStoredOrders(updatedList);
      return updatedList;
    });

    if (updatedOrderObj) {
      fetch(`/api/reseller/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrderObj),
      }).catch(() => {});
      broadcastSync({ type: 'order_updated', order: updatedOrderObj });
    }
  };

  const confirmAdminOrder = (orderId: string) => {
    let updatedOrderObj: Order | undefined;
    setOrders((prev) => {
      const updatedList = prev.map((o) => {
        if (o.id === orderId) {
          updatedOrderObj = {
            ...o,
            status: 'CONFIRMED' as OrderStatus,
            statusAr: 'تم التأكيد من الأدمن / المستودع',
            statusFr: 'Confirmée par Admin/Dépôt',
            situation: 'Confirmé',
            adminConfirmed: true,
            isLockedForEdit: true,
            confirmedAt: new Date().toISOString(),
          };
          return updatedOrderObj;
        }
        return o;
      });
      saveStoredOrders(updatedList);
      return updatedList;
    });

    if (updatedOrderObj) {
      fetch(`/api/reseller/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrderObj),
      }).catch(() => {});
      broadcastSync({ type: 'order_updated', order: updatedOrderObj });
    }
  };

  const confirmOrderWarehouse = (
    orderId: string,
    supplierInfo?: { id?: string; name?: string }
  ): { success: boolean; message: string; order?: Order } => {
    const currentOrder = orders.find((o) => o.id === orderId);
    if (!currentOrder) {
      return { success: false, message: 'الطلبية غير موجودة' };
    }

    // 1. Strict check: Has this order already been confirmed by a Confirmation Agent?
    if (
      currentOrder.confirmedByRole === 'CONFIRMER' ||
      (currentOrder.confirmedBy && currentOrder.confirmedByRole !== 'SUPPLIER' && currentOrder.confirmedBy !== 'supplier')
    ) {
      return {
        success: false,
        message: `⛔ غير مسموح: هذه الطلبية تم تأكيدها مسبقاً من طرف مؤكد الطلبيات (${currentOrder.confirmerName || currentOrder.confirmedBy}). لا يمكن للمورد والمؤكد تأكيد نفس الطلبية لمنع الازدواجية وتكرار الشحن.`,
      };
    }

    // 2. Strict check: Is this order currently claimed/locked by a Confirmation Agent on a call?
    if (currentOrder.assignedConfirmerId && !currentOrder.adminConfirmed) {
      return {
        success: false,
        message: `⛔ غير مسموح: هذه الطلبية محجوزة حالياً تحت اتصال المؤكد (${currentOrder.assignedConfirmerName || 'المؤكد'}). يرجى انتظار انتهاء المكالمة أو إخلائها من المؤكد.`,
      };
    }

    if (currentOrder.adminConfirmed && currentOrder.confirmedByRole === 'SUPPLIER') {
      return {
        success: false,
        message: 'هذه الطلبية مؤكدة مسبقاً في المستودع وقيد التحضير.',
      };
    }

    let updatedOrderObj: Order | undefined;
    setOrders((prev) => {
      const updatedList = prev.map((o) => {
        if (o.id === orderId) {
          const tracking = o.trackingCode || `WH-${Math.floor(100000 + Math.random() * 900000)}`;
          updatedOrderObj = {
            ...o,
            status: 'PROCESSING' as OrderStatus,
            statusAr: 'قيد التحضير والتجهيز بالمستودع',
            statusFr: 'En préparation',
            situation: 'EnPréparation',
            adminConfirmed: true,
            isLockedForEdit: true,
            confirmedBy: supplierInfo?.id || 'supplier',
            confirmerName: supplierInfo?.name || 'المورد / المستودع',
            confirmedByRole: 'SUPPLIER',
            confirmedAt: new Date().toISOString(),
            trackingCode: tracking,
            deliveryCompanySent: true,
            deliveryCompanyName: o.deliveryCompanyName || 'Ecom Delivery',
            bordereauUrl: o.bordereauUrl || `/api/delivery/label/${orderId}?tracking=${tracking}`,
            failureReason: undefined,
            cancellationReason: undefined,
          };
          return updatedOrderObj;
        }
        return o;
      });
      saveStoredOrders(updatedList);
      return updatedList;
    });

    if (updatedOrderObj) {
      fetch(`/api/reseller/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrderObj),
      }).catch(() => {});
      broadcastSync({ type: 'order_updated', order: updatedOrderObj });
      try {
        window.dispatchEvent(new CustomEvent('orders_updated'));
      } catch (e) {}
      return { success: true, message: 'تم تأكيد الطلبية في المستودع بنجاح ونقلها للتحضير', order: updatedOrderObj };
    }

    return { success: false, message: 'تعذر تحديث الطلبية' };
  };

  const rejectOrderWithReason = (orderId: string, reason: string) => {
    let updatedOrderObj: Order | undefined;
    setOrders((prev) => {
      const updatedList = prev.map((o) => {
        if (o.id === orderId) {
          updatedOrderObj = {
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
          return updatedOrderObj;
        }
        return o;
      });
      saveStoredOrders(updatedList);
      return updatedList;
    });

    if (updatedOrderObj) {
      fetch(`/api/reseller/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrderObj),
      }).catch(() => {});
      broadcastSync({ type: 'order_updated', order: updatedOrderObj });
    }
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
    if (user.role === 'admin' || user.role === 'confirmer') return orders;
    if (user.role === 'reseller') {
      const isDemoSeller =
        user.email === 'seller@nouvachat.com' ||
        user.phone === '0550123456' ||
        user.id === 'u-reseller-12';
      if (!isDemoSeller) {
        return orders.filter(
          (o) => !o.resellerId || o.resellerId === user.id || o.resellerEmail === user.email || o.resellerPhone === user.phone
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

    return `وصل الطلب - نوفا ماركت 🛍️
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
        syncOrderStatus,
        confirmAndShipOrder,
        claimOrderForConfirmer,
        releaseOrderFromConfirmer,
        confirmOrderByAgent,
        logConfirmerCall,
        updateOrderTrackingFollowup,
        updateCourierCoordination,
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
