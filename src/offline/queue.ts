import { Order } from '../types';

const OFFLINE_QUEUE_KEY = 'nouvamarket_offline_orders_queue_v1';
const STORED_ORDERS_KEY = 'nouvamarket_local_orders_v1';

export interface QueuedOrder {
  idempotencyKey: string;
  orderData: Partial<Order>;
  createdAt: number;
  attempts: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'km-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

export function getLocalQueue(): QueuedOrder[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalQueue(queue: QueuedOrder[]) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save offline queue to localStorage', e);
  }
}

export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORED_ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const demoIds = ['ORD-9281', 'ORD-9290', 'ORD-9270', 'ORD-9821', 'ORD-7712', 'ORD-101', 'ORD-102', 'ORD-103', 'ORD-104', 'ORD-105', 'ORD-100'];
        const filtered = parsed.filter(
          (o) => o && !demoIds.includes(o.id) && !o.id?.startsWith('ORD-92') && !o.id?.startsWith('ORD-98') && !o.id?.startsWith('ORD-77')
        );
        if (filtered.length !== parsed.length) {
          saveStoredOrders(filtered);
        }
        return filtered;
      }
    }
  } catch (e) {
    return [];
  }
  return [];
}

export function saveStoredOrders(orders: Order[]) {
  try {
    localStorage.setItem(STORED_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders to localStorage', e);
  }
}

/**
 * Enqueue an order locally with a client-generated UUID Idempotency Key
 * Returns immediately for smooth UI feedback (Rule Section 5.2)
 */
export function enqueueOrder(orderInput: Partial<Order>): { idempotencyKey: string; localOrder: Order } {
  const idempotencyKey = orderInput.idempotencyKey || generateUUID();
  const orderId = 'ORD-LOCAL-' + Math.floor(1000 + Math.random() * 9000);

  const localOrder: Order = {
    id: orderId,
    idempotencyKey,
    customerName: orderInput.customerName || '',
    phone: orderInput.phone || '',
    wilaya: orderInput.wilaya || '16 - Alger',
    commune: orderInput.commune || 'Alger',
    address: orderInput.address || '',
    deliveryType: orderInput.deliveryType || 'home',
    items: orderInput.items || [],
    totalAmount: orderInput.totalAmount || 0,
    shippingFee: orderInput.shippingFee || 500,
    totalProfit: orderInput.totalProfit || 0,
    status: orderInput.status || 'PENDING_SYNC',
    statusAr: orderInput.statusAr || (orderInput.status === 'LINK_ORDER' ? 'طلب من الرابط' : '🔍 قيد المراجعة (في انتظار التأكيد)'),
    statusFr: orderInput.statusFr || (orderInput.status === 'LINK_ORDER' ? 'Commande par lien' : 'En révision'),
    situation: orderInput.situation || (orderInput.status === 'LINK_ORDER' ? 'طلب من الرابط' : 'En révision'),
    source: orderInput.source || 'LOCAL',
    adminConfirmed: false,
    isLockedForEdit: false,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending_sync',
    trackingCode: 'PENDING-' + idempotencyKey.substring(0, 6).toUpperCase(),
  };

  // 1. Add to local queue
  const queue = getLocalQueue();
  queue.push({
    idempotencyKey,
    orderData: localOrder,
    createdAt: Date.now(),
    attempts: 0,
    status: 'pending',
  });
  saveLocalQueue(queue);

  // 2. Prepend to local stored orders
  const existingOrders = getStoredOrders();
  saveStoredOrders([localOrder, ...existingOrders]);

  return { idempotencyKey, localOrder };
}

/**
 * Flush pending items in the offline queue to the server
 */
export async function flushOfflineQueue(
  sendOrderApi: (payload: any) => Promise<any>
): Promise<{ syncedCount: number; failedCount: number }> {
  const queue = getLocalQueue();
  if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

  let syncedCount = 0;
  let failedCount = 0;
  const remainingQueue: QueuedOrder[] = [];

  for (const item of queue) {
    try {
      item.status = 'syncing';
      item.attempts += 1;

      // Send to server with exact Idempotency-Key
      const response = await sendOrderApi({
        ...item.orderData,
        idempotencyKey: item.idempotencyKey,
      });

      if (response && response.success && response.order) {
        syncedCount++;

        // Update local stored order with real server details
        const stored = getStoredOrders();
        const updated = stored.map((ord) => {
          if (ord.idempotencyKey === item.idempotencyKey) {
            return {
              ...response.order,
              syncStatus: 'synced' as const,
            };
          }
          return ord;
        });
        saveStoredOrders(updated);
      } else {
        throw new Error('Server response invalid');
      }
    } catch (err) {
      console.warn(`[Offline Queue] Sync failed for ${item.idempotencyKey}, attempt ${item.attempts}`, err);
      failedCount++;
      if (item.attempts < 5) {
        remainingQueue.push({ ...item, status: 'pending' });
      }
    }
  }

  saveLocalQueue(remainingQueue);
  return { syncedCount, failedCount };
}
