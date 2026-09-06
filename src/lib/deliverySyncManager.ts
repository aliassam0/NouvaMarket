import { Order, OrderStatus } from '../types';
import { CourierPartner, getStoredCouriers } from './courierHelper';
import { fetchLiveTrackingFromCourier } from './deliveryApiManager';
import { saveStoredOrders } from '../offline/queue';
import { creditResellerCommission } from './walletHelper';
import { addSellerNotification, addWarehouseNotification } from './notificationHelper';

export interface DeliveryPartnerSyncState {
  id: string;
  name: string;
  provider: 'yalidine' | 'zrexpress' | 'ecom' | 'maystro' | 'other';
  connectionStatus: 'CONNECTED' | 'SYNCING' | 'ERROR' | 'DISCONNECTED';
  lastSyncTime: string;
  lastSyncTimestamp: number;
  pendingQueueCount: number;
  syncedCount: number;
  latencyMs: number;
  endpointUrl: string;
  activeParcelsInTransit: number;
  successfulDeliveriesToday: number;
  message?: string;
}

export interface SyncLogItem {
  id: string;
  timestamp: string;
  orderId: string;
  trackingCode: string;
  courierName: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  statusLabelAr: string;
  customerName: string;
  wilaya: string;
}

const SYNC_LOGS_STORAGE_KEY = 'nouvamarket_delivery_sync_logs_v1';
const SYNC_SETTINGS_STORAGE_KEY = 'nouvamarket_delivery_sync_settings_v1';

export interface SyncSettings {
  autoPollingEnabled: boolean;
  intervalSeconds: number;
  lastGlobalSyncTimestamp: number;
}

export function getStoredSyncSettings(): SyncSettings {
  try {
    const raw = localStorage.getItem(SYNC_SETTINGS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {
    autoPollingEnabled: true,
    intervalSeconds: 45,
    lastGlobalSyncTimestamp: Date.now() - 30000,
  };
}

export function saveStoredSyncSettings(settings: SyncSettings) {
  try {
    localStorage.setItem(SYNC_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function getStoredSyncLogs(): SyncLogItem[] {
  try {
    const raw = localStorage.getItem(SYNC_LOGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 50);
    }
  } catch {
    // ignore
  }
  return [];
}

export function addSyncLog(log: SyncLogItem) {
  try {
    const existing = getStoredSyncLogs();
    const updated = [log, ...existing].slice(0, 50);
    localStorage.setItem(SYNC_LOGS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('delivery_sync_logs_updated'));
  } catch {
    // ignore
  }
}

/**
 * Format relative or exact Arabic time string
 */
export function formatArabicSyncTime(timestamp: number): string {
  if (!timestamp || timestamp === 0) return 'لم تتم بعد';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 10) return 'منذ ثوانٍ قليلة (الآن)';
  if (diffSec < 60) return `منذ ${diffSec} ثانية`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}

/**
 * Identify provider type from courier name or id
 */
export function detectProviderCode(courier: CourierPartner): 'yalidine' | 'zrexpress' | 'ecom' | 'maystro' | 'other' {
  const name = courier.name.toLowerCase();
  const id = courier.id.toLowerCase();
  if (name.includes('yalidine') || id.includes('yalidine')) return 'yalidine';
  if (name.includes('zr') || id.includes('zr')) return 'zrexpress';
  if (name.includes('ecom') || id.includes('ecom')) return 'ecom';
  if (name.includes('maystro') || id.includes('maystro')) return 'maystro';
  return 'other';
}

/**
 * Computes live partner sync statuses from available couriers and active orders
 */
export function getDeliveryPartnerSyncStates(orders: Order[], supplierId?: string): DeliveryPartnerSyncState[] {
  const couriers = getStoredCouriers(supplierId);
  const settings = getStoredSyncSettings();

  return couriers.map((courier) => {
    const provider = detectProviderCode(courier);
    
    // Filter orders associated with this courier
    const courierOrders = orders.filter((o) => {
      if (o.deliveryCompanyName && o.deliveryCompanyName.toLowerCase().includes(provider)) return true;
      if (courier.name && o.deliveryCompanyName && o.deliveryCompanyName === courier.name) return true;
      return false;
    });

    // Orders in queue awaiting courier dispatch or active tracking
    const pendingQueueCount = courierOrders.filter(
      (o) => o.status === 'PROCESSING' || o.situation === 'EnPréparation' || o.status === 'CONFIRMED'
    ).length;

    // Active parcels in transit with courier
    const activeParcelsInTransit = courierOrders.filter(
      (o) => o.status === 'SHIPPED' || o.situation === 'SortiEnLivraison' || o.situation === 'EnCours'
    ).length;

    // Completed today
    const successfulDeliveriesToday = courierOrders.filter(
      (o) => o.status === 'DELIVERED'
    ).length;

    const endpointUrl =
      provider === 'yalidine'
        ? 'https://api.yalidine.app/v1/parcels'
        : provider === 'zrexpress'
        ? 'https://api.zrexpress.dz/api/v1/tracking'
        : provider === 'ecom'
        ? 'https://ecom-dz.com/api_v2/colis'
        : provider === 'maystro'
        ? 'https://api.maystro-delivery.com/v2/orders'
        : courier.webhookUrl || 'https://api.partner.dz/tracking';

    // Mock realistic latency
    const latencyMap = {
      yalidine: 42,
      zrexpress: 58,
      ecom: 35,
      maystro: 48,
      other: 65,
    };

    return {
      id: courier.id,
      name: courier.name,
      provider,
      connectionStatus: courier.isDisabled ? 'DISCONNECTED' : (courier.connectionStatus || 'CONNECTED'),
      lastSyncTime: formatArabicSyncTime(settings.lastGlobalSyncTimestamp),
      lastSyncTimestamp: settings.lastGlobalSyncTimestamp,
      pendingQueueCount,
      syncedCount: courierOrders.length,
      latencyMs: latencyMap[provider] || 50,
      endpointUrl,
      activeParcelsInTransit,
      successfulDeliveriesToday,
      message: courier.isDisabled ? 'الشركة معطلة حالياً' : 'مزامنة نشطة 200 OK',
    };
  });
}

/**
 * Core Polling Worker:
 * Iterates through active orders in transit or processing, fetches live courier updates,
 * updates the database, updates the wallet if delivered, and triggers app-toast alerts for the reseller.
 */
export async function pollOrderStatusesFromDeliveryApis(
  currentOrders: Order[],
  options?: {
    forceStatusChange?: boolean;
    onOrderUpdated?: (updatedOrder: Order) => void;
  }
): Promise<{
  updatedOrdersCount: number;
  deliveredCount: number;
  newLogs: SyncLogItem[];
  allOrders: Order[];
}> {
  let updatedOrdersCount = 0;
  let deliveredCount = 0;
  const newLogs: SyncLogItem[] = [];

  // Filter orders that are currently in progress and have a tracking number or in preparation/transit
  const candidateOrders = currentOrders.filter(
    (o) =>
      o.status === 'PROCESSING' ||
      o.status === 'SHIPPED' ||
      (o.trackingCode && o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'FAILED')
  );

  if (candidateOrders.length === 0 && !options?.forceStatusChange) {
    // Update sync timestamp even if no orders were modified
    saveStoredSyncSettings({
      ...getStoredSyncSettings(),
      lastGlobalSyncTimestamp: Date.now(),
    });
    window.dispatchEvent(new CustomEvent('delivery_sync_completed'));
    return { updatedOrdersCount: 0, deliveredCount: 0, newLogs: [], allOrders: currentOrders };
  }

  // To simulate realistic courier delivery polling, pick candidate orders or test simulate
  const targetOrders = options?.forceStatusChange
    ? candidateOrders.slice(0, 3)
    : candidateOrders.filter(() => Math.random() > 0.4).slice(0, 2);

  const updatedOrdersMap = new Map<string, Order>();

  for (const order of targetOrders) {
    try {
      const trackingResult = await fetchLiveTrackingFromCourier(order, order.supplierId);
      
      // Only proceed if status actually changed or new history entry
      const statusChanged = trackingResult.newStatus !== order.status;

      if (statusChanged || options?.forceStatusChange) {
        const previousStatus = order.status;
        const newStatus = trackingResult.newStatus;

        let statusAr = trackingResult.trackingHistory[0]?.statusAr || order.statusAr || 'تم تحديث مسار الطرد';
        if (newStatus === 'SHIPPED') {
          statusAr = `خرج للتوزيع مع ${trackingResult.courierName} في ${order.wilaya || 'الوجهة'}`;
        } else if (newStatus === 'DELIVERED') {
          statusAr = `تم تسليم الطرد للزبون وتحصيل ${order.totalAmount?.toLocaleString()} دج بنجاح`;
        } else if (newStatus === 'FAILED') {
          statusAr = `فشل التسليم / إرجاع للمستودع`;
        }

        const updatedOrder: Order = {
          ...order,
          status: newStatus,
          statusAr,
          trackingCode: trackingResult.trackingCode,
          deliveryCompanyName: trackingResult.courierName,
          trackingHistory: trackingResult.trackingHistory,
          situation: newStatus === 'DELIVERED' ? 'Livré' : newStatus === 'SHIPPED' ? 'SortiEnLivraison' : order.situation,
        };

        updatedOrdersMap.set(updatedOrder.id, updatedOrder);
        updatedOrdersCount++;

        if (newStatus === 'DELIVERED' && previousStatus !== 'DELIVERED') {
          deliveredCount++;
          // Credit reseller commission automatically to wallet
          const resellerProfit = order.totalProfit || 1200;
          if (resellerProfit > 0) {
            creditResellerCommission(
              order.id,
              resellerProfit,
              order.resellerId || 'reseller-demo'
            );
          }
        }

        // 1. App-Toast Alert specifically for the reseller & app user
        const toastType = newStatus === 'DELIVERED' ? 'success' : newStatus === 'FAILED' ? 'error' : 'info';
        const toastMessage = `🚚 تحديث شركة التوصيل (${trackingResult.courierName}) للطلب #${updatedOrder.trackingCode || updatedOrder.id} [${order.customerName}]: ${statusAr}`;
        
        window.dispatchEvent(
          new CustomEvent('app-toast', {
            detail: {
              message: toastMessage,
              type: toastType,
            },
          })
        );

        // 2. Notification Center alerts
        addSellerNotification({
          type: 'order',
          titleAr: `📦 تحديث حالة الشحنة #${updatedOrder.trackingCode || updatedOrder.id}`,
          bodyAr: `أفادت شركة ${trackingResult.courierName} بتحديث حالة طرد الزبون (${updatedOrder.customerName}): ${statusAr}`,
        });

        addWarehouseNotification({
          type: 'order',
          titleAr: `🚚 تحديث API لشركة التوصيل #${updatedOrder.trackingCode || updatedOrder.id}`,
          bodyAr: `تم مزامنة حالة الطرد مع خوادم ${trackingResult.courierName}: ${statusAr}`,
        });

        // 3. Record in sync log
        const logItem: SyncLogItem = {
          id: `synclog-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`,
          timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          orderId: updatedOrder.id,
          trackingCode: updatedOrder.trackingCode || order.id,
          courierName: trackingResult.courierName,
          previousStatus,
          newStatus,
          statusLabelAr: statusAr,
          customerName: order.customerName,
          wilaya: order.wilaya,
        };

        newLogs.push(logItem);
        addSyncLog(logItem);

        if (options?.onOrderUpdated) {
          options.onOrderUpdated(updatedOrder);
        }
      }
    } catch (err) {
      console.warn('Error polling courier status for order', order.id, err);
    }
  }

  // Update order lists in local and server storage
  const finalOrders = currentOrders.map((o) => updatedOrdersMap.get(o.id) || o);

  if (updatedOrdersCount > 0) {
    saveStoredOrders(finalOrders);

    // Broadcast to other tabs & windows
    try {
      const channel = new BroadcastChannel('nouvamarket_orders_sync');
      for (const updated of updatedOrdersMap.values()) {
        channel.postMessage({ type: 'order_updated', order: updated });
        
        // Notify server backend
        fetch(`/api/reseller/orders/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch(() => {
          // ignore offline
        });
      }
    } catch {
      // ignore
    }
  }

  // Update sync settings timestamp
  saveStoredSyncSettings({
    ...getStoredSyncSettings(),
    lastGlobalSyncTimestamp: Date.now(),
  });

  window.dispatchEvent(new CustomEvent('delivery_sync_completed', { detail: { updatedOrdersCount, deliveredCount } }));

  return {
    updatedOrdersCount,
    deliveredCount,
    newLogs,
    allOrders: finalOrders,
  };
}
