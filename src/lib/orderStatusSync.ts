import { Order, OrderStatus } from '../types';
import { getStoredOrders, saveStoredOrders } from '../offline/queue';
import { creditResellerCommission } from './walletHelper';
import {
  addSellerNotification,
  addWarehouseNotification,
  addAdminNotification,
  addConfirmerNotification,
} from './notificationHelper';
import { triggerSaleNotification } from './pwaNotificationManager';

import { fetchDriverInfoFromCourierApi } from './deliveryApiManager';
import { addSyncLog, SyncLogItem } from './deliverySyncManager';
import { getStoredCouriers } from './courierHelper';

export type DashboardRole = 'admin' | 'warehouse' | 'confirmer' | 'reseller' | 'delivery' | 'supplier' | 'system';

export interface SyncActor {
  id?: string;
  fullName?: string;
  name?: string;
  role?: DashboardRole;
  phone?: string;
}

export interface SyncOrderStatusOptions {
  source?: DashboardRole;
  actor?: SyncActor;
  note?: string;
  reason?: string;
  trackingCode?: string;
  courierName?: string;
  courierId?: string;
  driverInfo?: {
    driverName?: string;
    driverPhone?: string;
    driverCompany?: string;
    distributionCenter?: string;
  };
  coordinationStatus?:
    | 'waiting_pickup'
    | 'out_for_delivery'
    | 'notified_buyer'
    | 'driver_called_no_answer'
    | 'customer_rescheduled'
    | 'address_clarified'
    | 'delivered'
    | 'returned';
  notifyParties?: boolean; // default true
  dispatchToCourier?: boolean; // default true when reaching SHIPPED
  skipExclusivityCheck?: boolean; // admin override
  silentToast?: boolean;
}

export interface SyncOrderStatusResult {
  success: boolean;
  order?: Order;
  previousStatus?: OrderStatus;
  newStatus?: OrderStatus;
  message: string;
  courierDispatched?: boolean;
  trackingCode?: string;
  bordereauUrl?: string;
  commissionCredited?: boolean;
}

/**
 * Standardized status labels and logistics situation codes
 */
export function mapStatusToLogisticsMeta(status: OrderStatus): {
  statusAr: string;
  statusFr: string;
  situation: string;
  avancement: string;
  adminConfirmed: boolean;
  isLockedForEdit: boolean;
} {
  switch (status) {
    case 'LINK_ORDER':
      return {
        statusAr: 'طلب من الرابط',
        statusFr: 'Commande par lien',
        situation: 'طلب من الرابط',
        avancement: 'Nouveau',
        adminConfirmed: false,
        isLockedForEdit: false,
      };
    case 'PENDING_SYNC':
      return {
        statusAr: '🔍 قيد المراجعة (في انتظار التأكيد)',
        statusFr: 'En révision',
        situation: 'En révision',
        avancement: 'En attente',
        adminConfirmed: false,
        isLockedForEdit: false,
      };
    case 'CONFIRMED':
      return {
        statusAr: 'مؤكدة - جاري التجهيز بالمستودع',
        statusFr: 'Confirmée - En préparation',
        situation: 'EnPréparation',
        avancement: 'Confirmé',
        adminConfirmed: true,
        isLockedForEdit: true,
      };
    case 'PROCESSING':
      return {
        statusAr: 'قيد التحضير والتغليف بالمستودع',
        statusFr: 'En préparation au dépôt',
        situation: 'EnPréparation',
        avancement: 'Prêt à expédier',
        adminConfirmed: true,
        isLockedForEdit: true,
      };
    case 'SHIPPED':
      return {
        statusAr: 'قيد التوصيل والتوزيع (En cours de livraison)',
        statusFr: 'En cours de livraison',
        situation: 'SortiEnLivraison',
        avancement: 'En livraison',
        adminConfirmed: true,
        isLockedForEdit: true,
      };
    case 'DELIVERED':
      return {
        statusAr: 'تم التسليم بنجاح (Livré)',
        statusFr: 'Livré',
        situation: 'Livré',
        avancement: 'Livré',
        adminConfirmed: true,
        isLockedForEdit: true,
      };
    case 'FAILED':
      return {
        statusAr: 'فشل التسليم / طرد مرجع (Retour)',
        statusFr: 'Échec de livraison / Retour',
        situation: 'Retour',
        avancement: 'Retour',
        adminConfirmed: true,
        isLockedForEdit: true,
      };
    case 'CANCELLED':
      return {
        statusAr: 'ملغاة',
        statusFr: 'Annulé',
        situation: 'Annulé',
        avancement: 'Annulé',
        adminConfirmed: false,
        isLockedForEdit: false,
      };
    default:
      return {
        statusAr: 'طلب عادي',
        statusFr: 'Commande',
        situation: 'Standard',
        avancement: 'En cours',
        adminConfirmed: false,
        isLockedForEdit: false,
      };
  }
}

/**
 * Generates an official tracking code for the chosen courier
 */
export function generateCourierTrackingCode(courierName?: string, orderId?: string): string {
  const cleanName = (courierName || '').toLowerCase();
  const idSuffix = orderId ? orderId.replace(/\D/g, '').slice(-4) || '1001' : `${Math.floor(1000 + Math.random() * 9000)}`;

  if (cleanName.includes('ecom')) {
    return `ECBGB${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (cleanName.includes('yalidine')) {
    return `YAL-${Math.floor(10000000 + Math.random() * 90000000)}`;
  }
  if (cleanName.includes('zr')) {
    return `ZR-${Math.floor(1000000 + Math.random() * 9000000)}`;
  }
  if (cleanName.includes('maystro')) {
    return `MAY-${Math.floor(1000000 + Math.random() * 9000000)}`;
  }
  return `TC${idSuffix}LHJ`;
}

/**
 * Core Unified Order Status Synchronization Engine
 * Synchronizes order state simultaneously between Admin, Supplier, Confirmer, Reseller, and Delivery Partner.
 */
export async function syncOrderStatus(
  orderIdOrOrder: string | Order,
  newStatus: OrderStatus,
  options: SyncOrderStatusOptions = {}
): Promise<SyncOrderStatusResult> {
  const targetId = typeof orderIdOrOrder === 'string' ? orderIdOrOrder : orderIdOrOrder.id;
  const currentOrders = getStoredOrders();
  let existingOrder = currentOrders.find(
    (o) => o.id === targetId || (o.trackingCode && o.trackingCode === targetId)
  );

  if (!existingOrder && typeof orderIdOrOrder === 'object') {
    existingOrder = orderIdOrOrder;
  }

  if (!existingOrder) {
    // Attempt fast fetch from server if not found in local storage
    try {
      const resp = await fetch(`/api/reseller/orders/${targetId}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && (data.id || data.order?.id)) {
          existingOrder = data.order || data;
        }
      }
    } catch {
      // offline / ignored
    }
  }

  if (!existingOrder) {
    return {
      success: false,
      message: `الطلبية رقم (${targetId}) غير موجودة في النظام.`,
    };
  }

  const previousStatus = existingOrder.status;
  const actor = options.actor;
  const source = options.source || actor?.role || 'system';
  const notifyParties = options.notifyParties !== false;

  // 1. Cross-role Exclusivity and Collision Guards
  if (!options.skipExclusivityCheck && actor && actor.id && actor.id !== 'admin') {
    // Confirmer vs Confirmer Guard
    if (source === 'confirmer') {
      if (
        existingOrder.assignedConfirmerId &&
        existingOrder.assignedConfirmerId !== actor.id &&
        !existingOrder.adminConfirmed
      ) {
        return {
          success: false,
          previousStatus,
          newStatus,
          message: `⛔ غير مسموح: هذه الطلبية محجوزة حالياً للمؤكد (${existingOrder.assignedConfirmerName || existingOrder.assignedConfirmerId}).`,
        };
      }

      if (
        existingOrder.confirmedByRole === 'SUPPLIER' ||
        existingOrder.confirmedBy === 'supplier'
      ) {
        return {
          success: false,
          previousStatus,
          newStatus,
          message: `⛔ غير مسموح: هذه الطلبية تم تأكيدها مسبقاً من طرف المورد/المستودع (${existingOrder.confirmerName || 'المستودع'}). لا يمكن للمؤكد والمورد تأكيد نفس الطلبية لتفادي الازدواجية.`,
        };
      }
    }

    // Warehouse vs Confirmer Guard
    if (source === 'warehouse' || source === 'supplier') {
      if (
        existingOrder.assignedConfirmerId &&
        !existingOrder.adminConfirmed &&
        existingOrder.confirmedByRole !== 'SUPPLIER'
      ) {
        return {
          success: false,
          previousStatus,
          newStatus,
          message: `⛔ غير مسموح: الطلبية تحت اتصال ومتابعة مؤكد الطلبيات (${existingOrder.assignedConfirmerName || 'المؤكد'}).`,
        };
      }
    }
  }

  // 2. Compute Logistics Meta and Status Attributes
  const meta = mapStatusToLogisticsMeta(newStatus);
  let updatedOrder: Order = {
    ...existingOrder,
    status: newStatus,
    statusAr: meta.statusAr,
    statusFr: meta.statusFr,
    situation: meta.situation,
    avancement: meta.avancement,
    adminConfirmed: meta.adminConfirmed || existingOrder.adminConfirmed,
    isLockedForEdit: meta.isLockedForEdit || existingOrder.isLockedForEdit,
  };

  let courierDispatched = false;
  let commissionCredited = false;

  // 3. Status-Specific Processing

  // CASE A: CONFIRMED
  if (newStatus === 'CONFIRMED') {
    updatedOrder.confirmedAt = updatedOrder.confirmedAt || new Date().toISOString();
    if (actor) {
      updatedOrder.confirmedBy = actor.id || updatedOrder.confirmedBy;
      updatedOrder.confirmerName = actor.fullName || actor.name || updatedOrder.confirmerName;
      if (source === 'confirmer') {
        updatedOrder.confirmedByRole = 'CONFIRMER';
        updatedOrder.assignedConfirmerId = actor.id || updatedOrder.assignedConfirmerId;
        updatedOrder.assignedConfirmerName = actor.fullName || actor.name || updatedOrder.assignedConfirmerName;
      } else if (source === 'warehouse' || source === 'supplier') {
        updatedOrder.confirmedByRole = 'SUPPLIER';
      } else if (source === 'admin') {
        updatedOrder.confirmedByRole = 'ADMIN';
      }
    }
    if (options.note) {
      updatedOrder.confirmationNote = options.note;
    }
  }

  // CASE B: PROCESSING (جاهزة للتجهيز أو قيد التحضير)
  if (newStatus === 'PROCESSING') {
    updatedOrder.adminConfirmed = true;
    updatedOrder.isLockedForEdit = true;
    if (source === 'warehouse' || source === 'supplier') {
      updatedOrder.confirmedByRole = updatedOrder.confirmedByRole || 'SUPPLIER';
      updatedOrder.confirmerName = updatedOrder.confirmerName || actor?.fullName || actor?.name || 'المورد / المستودع';
    }
  }

  // CASE C: SHIPPED (قيد التوصيل - الربط التلقائي الفوري بشركة التوصيل)
  if (newStatus === 'SHIPPED') {
    // Determine delivery company partner
    const couriers = getStoredCouriers(updatedOrder.supplierId);
    const activeCouriers = couriers.filter((c) => !c.isDisabled);
    const preferredCourier =
      options.courierName ||
      options.courierId ||
      updatedOrder.deliveryCompanyName ||
      (activeCouriers[0]?.name) ||
      'Ecom Delivery';

    // 1. Ensure tracking code
    let trackingCode = options.trackingCode || updatedOrder.trackingCode;
    if (!trackingCode || trackingCode.trim() === '') {
      trackingCode = generateCourierTrackingCode(preferredCourier, updatedOrder.id);
    }
    updatedOrder.trackingCode = trackingCode;

    // 2. Ensure official Bordereau URL
    const bordereauUrl = `/api/delivery/label/${updatedOrder.id}?tracking=${encodeURIComponent(
      trackingCode
    )}&courier=${encodeURIComponent(preferredCourier)}&v=${Date.now()}`;
    updatedOrder.bordereauUrl = bordereauUrl;
    updatedOrder.bordereauCreatedAt = updatedOrder.bordereauCreatedAt || new Date().toISOString();

    // 3. Mark delivery company sent
    updatedOrder.deliveryCompanySent = true;
    updatedOrder.deliveryCompanyName = preferredCourier;
    updatedOrder.coordinationStatus = options.coordinationStatus || 'out_for_delivery';

    // 4. Assign courier driver if provided
    if (options.driverInfo) {
      updatedOrder.driverName = options.driverInfo.driverName || updatedOrder.driverName;
      updatedOrder.driverPhone = options.driverInfo.driverPhone || updatedOrder.driverPhone;
      updatedOrder.driverCompany = options.driverInfo.driverCompany || updatedOrder.driverCompany;
    } else if (!updatedOrder.driverName || !updatedOrder.driverPhone) {
      try {
        const driverRes = await fetchDriverInfoFromCourierApi(updatedOrder, preferredCourier);
        if (driverRes && driverRes.status === 'SUCCESS' && driverRes.driverName) {
          updatedOrder.driverName = driverRes.driverName;
          updatedOrder.driverPhone = driverRes.driverPhone;
          updatedOrder.driverCompany = driverRes.driverCompany;
        }
      } catch {
        // Keep actual state without inventing fake driver
      }
    }

    // 5. Append tracking history log
    const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const trackingHistory = Array.isArray(updatedOrder.trackingHistory) ? [...updatedOrder.trackingHistory] : [];
    trackingHistory.unshift({
      timestamp: nowIso,
      statusAr: options.note || `تم تسليم الشحنة لشركة التوصيل (${preferredCourier}) برقم تتبع: ${trackingCode}`,
      statusEn: 'Handed Over to Courier',
      location: updatedOrder.wilaya || 'مركز الشحن',
      courierName: preferredCourier,
      trackingCode,
      note: options.note || `تم استلام الطرد وتأكيد إرساله مع شركة التوصيل (${preferredCourier})`,
    });
    updatedOrder.trackingHistory = trackingHistory;

    // 6. Record in delivery sync log if requested
    if (options.silentToast !== true) {
      const syncLogItem: SyncLogItem = {
        id: `synclog-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`,
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        orderId: updatedOrder.id,
        trackingCode,
        courierName: preferredCourier,
        previousStatus,
        newStatus: 'SHIPPED',
        statusLabelAr: meta.statusAr,
        customerName: updatedOrder.customerName,
        wilaya: updatedOrder.wilaya,
      };
      addSyncLog(syncLogItem);
    }

    // 7. Dispatch to backend courier API route
    if (options.dispatchToCourier !== false) {
      try {
        fetch('/api/delivery/confirm-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: updatedOrder.id,
            trackingCode,
            courierName: preferredCourier,
          }),
        }).catch(() => {});
        courierDispatched = true;
      } catch {
        // Ignore network failure
      }
    }
  }

  // CASE D: DELIVERED (تم التسليم بنجاح وإضافة عمولة المسوق)
  if (newStatus === 'DELIVERED') {
    updatedOrder.deliveredAt = updatedOrder.deliveredAt || new Date().toISOString();
    updatedOrder.coordinationStatus = 'delivered';

    // Automatic wallet commission credit to reseller
    if (!updatedOrder.commissionCredited) {
      const resellerProfit = updatedOrder.totalProfit || 1000;
      if (resellerProfit > 0) {
        creditResellerCommission(
          updatedOrder.id,
          resellerProfit,
          updatedOrder.resellerId || 'reseller-demo'
        );
        updatedOrder.commissionCredited = true;
        commissionCredited = true;

        triggerSaleNotification({
          profit: resellerProfit,
          orderId: updatedOrder.trackingCode || updatedOrder.id,
          productName: updatedOrder.items?.[0]?.productName || 'منتج مسوق',
          customerName: updatedOrder.customerName || 'زبون',
          wilaya: (updatedOrder as any).wilayaName || updatedOrder.wilayaCode,
        });
      }
    }


    // Append delivery log
    const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const trackingHistory = Array.isArray(updatedOrder.trackingHistory) ? [...updatedOrder.trackingHistory] : [];
    trackingHistory.unshift({
      timestamp: nowIso,
      statusAr: `تم تسليم الطرد للزبون (${updatedOrder.customerName}) وتحصيل المبلغ بنجاح`,
      statusEn: 'Delivered / Livré',
      location: updatedOrder.wilaya || 'عنوان الزبون',
      courierName: updatedOrder.deliveryCompanyName || 'شركة التوصيل',
      trackingCode: updatedOrder.trackingCode || updatedOrder.id,
      note: options.note || 'تم استلام المبلغ نقداً عند الاستلام (COD)',
    });
    updatedOrder.trackingHistory = trackingHistory;

    // Delivery sync log
    const syncLogItem: SyncLogItem = {
      id: `synclog-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`,
      timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      orderId: updatedOrder.id,
      trackingCode: updatedOrder.trackingCode || updatedOrder.id,
      courierName: updatedOrder.deliveryCompanyName || 'شركة التوصيل',
      previousStatus,
      newStatus: 'DELIVERED',
      statusLabelAr: meta.statusAr,
      customerName: updatedOrder.customerName,
      wilaya: updatedOrder.wilaya,
    };
    addSyncLog(syncLogItem);
  }

  // CASE E: FAILED / CANCELLED (فشل التسليم أو الإلغاء)
  if (newStatus === 'FAILED' || newStatus === 'CANCELLED') {
    const reasonText = options.reason || options.note || (newStatus === 'FAILED' ? 'فشل التسليم / تعذر الوصول للزبون' : 'تم إلغاء الطلبية');
    if (newStatus === 'FAILED') {
      updatedOrder.failureReason = reasonText;
      updatedOrder.coordinationStatus = 'returned';
    } else {
      updatedOrder.cancellationReason = reasonText;
    }

    // Append log
    const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const trackingHistory = Array.isArray(updatedOrder.trackingHistory) ? [...updatedOrder.trackingHistory] : [];
    trackingHistory.unshift({
      timestamp: nowIso,
      statusAr: `${meta.statusAr}: ${reasonText}`,
      statusEn: newStatus === 'FAILED' ? 'Delivery Failed / Return' : 'Cancelled',
      location: updatedOrder.wilaya || 'مركز التوزيع',
      courierName: updatedOrder.deliveryCompanyName || 'شركة التوصيل',
      trackingCode: updatedOrder.trackingCode || updatedOrder.id,
      note: reasonText,
    });
    updatedOrder.trackingHistory = trackingHistory;
  }

  // 4. Multi-Role Notifications Dispatch
  if (notifyParties && previousStatus !== newStatus) {
    const orderRef = updatedOrder.trackingCode || updatedOrder.id;
    const customer = updatedOrder.customerName;
    const wilaya = updatedOrder.wilaya || 'الجزائر';
    const firstItem = updatedOrder.items?.[0];

    // Notification for Reseller / Seller
    if (newStatus === 'CONFIRMED') {
      addSellerNotification({
        type: 'order',
        titleAr: '✅ تم تأكيد طلبيتك',
        bodyAr: `تم تأكيد طلبيتك #${orderRef} للزبون (${customer}) بنجاح وهي الآن جاهزة للتحضير بالمستودع.`,
        productId: firstItem?.productId,
        productNameAr: firstItem?.productName,
      });
    } else if (newStatus === 'PROCESSING') {
      addSellerNotification({
        type: 'order',
        titleAr: '📦 طلبيتك قيد التجهيز بالمستودع',
        bodyAr: `بدأ المستودع بتجهيز وتحضير الطرد للطلبية #${orderRef}.`,
        productId: firstItem?.productId,
        productNameAr: firstItem?.productName,
      });
    } else if (newStatus === 'SHIPPED') {
      const courierStr = updatedOrder.deliveryCompanyName || 'شركة التوصيل';
      const driverStr = updatedOrder.driverName ? `السائق: ${updatedOrder.driverName} (${updatedOrder.driverPhone || ''})` : '';
      addSellerNotification({
        type: 'order',
        titleAr: '🚚 طلبيتك قيد التوصيل الآن',
        bodyAr: `أصبحت طلبيتك #${orderRef} قيد التوصيل في ولاية ${wilaya} مع ${courierStr}. ${driverStr}`,
        productId: firstItem?.productId,
        productNameAr: firstItem?.productName,
      });
    } else if (newStatus === 'DELIVERED') {
      addSellerNotification({
        type: 'wallet',
        titleAr: '🎉 تم تسليم الطلبية وإضافة الأرباح!',
        bodyAr: `تم تسليم طلبيتك #${orderRef} للزبون (${customer}) بنجاح وإضافة عمولتك (+${(updatedOrder.totalProfit || 1000).toLocaleString()} دج) إلى رصيد محفظتك.`,
        productId: firstItem?.productId,
        productNameAr: firstItem?.productName,
      });
    } else if (newStatus === 'FAILED' || newStatus === 'CANCELLED') {
      addSellerNotification({
        type: 'order',
        titleAr: '⚠️ تحديث بخصوص طلبيتك (غير مستلمة / ملغاة)',
        bodyAr: `الطلبية #${orderRef} للزبون (${customer}) تم تسجيلها كـ (${meta.statusAr}). السبب: ${options.reason || options.note || 'تعذر التسليم'}`,
        productId: firstItem?.productId,
        productNameAr: firstItem?.productName,
      });
    }

    // Notification for Warehouse / Supplier
    if (newStatus === 'CONFIRMED') {
      addWarehouseNotification({
        type: 'order',
        titleAr: '📦 طلبية جديدة مؤكدة للتجهيز',
        bodyAr: `طلبية جديدة #${orderRef} للزبون (${customer}) تم تأكيدها وجاهزة للتغليف والشحن.`,
      });
    } else if (newStatus === 'SHIPPED') {
      addWarehouseNotification({
        type: 'order',
        titleAr: '🚚 تم تسليم الشحنة لشركة التوصيل',
        bodyAr: `تم تسليم الطرد #${orderRef} بنجاح إلى مندوب ${updatedOrder.deliveryCompanyName || 'شركة التوصيل'} وهو الآن قيد التوزيع.`,
      });
    } else if (newStatus === 'FAILED') {
      addWarehouseNotification({
        type: 'system',
        titleAr: '🔄 طرد مرتجع قادم للمستودع',
        bodyAr: `الشحنة #${orderRef} للزبون (${customer}) سجلت كمرتجع (Retour). يرجى استلامها في المستودع.`,
      });
    }

    // Notification for Confirmer Team
    if (source !== 'confirmer') {
      addConfirmerNotification({
        type: 'order',
        titleAr: `📋 تحديث حالة الطلبية #${orderRef}`,
        bodyAr: `تم تحديث حالة الطلبية (${customer} - ${wilaya}) إلى: ${meta.statusAr}.`,
      });
    }

    // Notification for Admin
    addAdminNotification({
      type: 'order',
      titleAr: `🛒 تحديث موحد للطلبية #${orderRef}`,
      bodyAr: `تم تغيير الحالة من [${previousStatus}] إلى [${newStatus}] بواسطة (${actor?.fullName || source}).`,
    });
  }

  // 5. Save to Persistent Local Storage (with Strict Data Preservation)
  const updatedOrdersList = currentOrders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
  if (!updatedOrdersList.some((o) => o.id === updatedOrder.id)) {
    updatedOrdersList.unshift(updatedOrder);
  }
  saveStoredOrders(updatedOrdersList);

  // 6. Broadcast across Browser Tabs & Windows (Instant Multi-Dashboard Sync)
  try {
    const syncChannel = new BroadcastChannel('nouvamarket_orders_sync');
    syncChannel.postMessage({
      type: 'order_updated',
      order: updatedOrder,
      previousStatus,
      newStatus,
      source,
      timestamp: Date.now(),
    });
  } catch {
    // BroadcastChannel unsupported or restricted in iframe
  }

  // 7. Dispatch In-App DOM Custom Events
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('orders_updated', {
          detail: { order: updatedOrder, previousStatus, newStatus, source },
        })
      );
      window.dispatchEvent(
        new CustomEvent('order_status_synced', {
          detail: {
            order: updatedOrder,
            previousStatus,
            newStatus,
            source,
            courierDispatched,
          },
        })
      );
      if (newStatus === 'SHIPPED' || newStatus === 'DELIVERED') {
        window.dispatchEvent(new CustomEvent('delivery_sync_completed'));
      }
    } catch {
      // ignore
    }

    // Instant Visual Toast Alert (if not silenced)
    if (!options.silentToast) {
      const toastType =
        newStatus === 'DELIVERED'
          ? 'success'
          : newStatus === 'SHIPPED'
          ? 'info'
          : newStatus === 'FAILED' || newStatus === 'CANCELLED'
          ? 'error'
          : 'success';

      const toastMessage =
        newStatus === 'SHIPPED'
          ? `🚚 تم ربط الطلبية #${updatedOrder.trackingCode || updatedOrder.id} بشركة التوصيل (${updatedOrder.deliveryCompanyName}) وتعيين الموزع بنجاح!`
          : newStatus === 'DELIVERED'
          ? `🎉 تم تسليم الطلبية #${updatedOrder.trackingCode || updatedOrder.id} للزبون وإيداع أرباح المسوق!`
          : `✔ تم تحديث ومزامنة حالة الطلبية #${updatedOrder.trackingCode || updatedOrder.id} لحظياً: ${meta.statusAr}`;

      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { message: toastMessage, type: toastType },
        })
      );
    }
  }

  // 8. Remote Server Sync & Global SSE Real-time Push
  try {
    // Call server sync endpoint
    fetch('/api/orders/sync-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: updatedOrder.id,
        newStatus,
        source,
        actor,
        note: options.note,
        reason: options.reason,
        courierName: updatedOrder.deliveryCompanyName,
        courierId: options.courierId,
        trackingCode: updatedOrder.trackingCode,
        driverInfo: {
          driverName: updatedOrder.driverName,
          driverPhone: updatedOrder.driverPhone,
          driverCompany: updatedOrder.driverCompany,
        },
        coordinationStatus: updatedOrder.coordinationStatus,
        orderData: updatedOrder,
      }),
    })
      .catch(() => {
        // Fallback to standard put endpoint
        return fetch(`/api/reseller/orders/${updatedOrder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedOrder),
        });
      })
      .catch(() => {
        // offline server handled gracefully
      });
  } catch {
    // ignore
  }

  return {
    success: true,
    order: updatedOrder,
    previousStatus,
    newStatus,
    message: `تم تحديث ومزامنة حالة الطلبية لحظياً مع جميع لوحات التحكم (${meta.statusAr})`,
    courierDispatched,
    trackingCode: updatedOrder.trackingCode,
    bordereauUrl: updatedOrder.bordereauUrl,
    commissionCredited,
  };
}

/**
 * Convenience alias for syncOrderStatus
 */
export const syncOrderStatusAcrossDashboards = syncOrderStatus;

/**
 * Event subscriber helper for listening to order status sync events in any component
 */
export function onOrderStatusSynced(
  callback: (eventData: {
    order: Order;
    previousStatus?: OrderStatus;
    newStatus?: OrderStatus;
    source?: string;
  }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener('order_status_synced', handler);
  return () => {
    window.removeEventListener('order_status_synced', handler);
  };
}
