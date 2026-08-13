export interface AppNotification {
  id: string;
  titleAr: string;
  titleFr?: string;
  bodyAr: string;
  bodyFr?: string;
  timestamp: string;
  createdAt: number;
  isRead: boolean;
  type: 'product_add' | 'stock_update' | 'order' | 'wallet' | 'reward' | 'system';
  productId?: string;
  productNameAr?: string;
  recipientRole?: 'seller' | 'admin' | 'warehouse' | 'all';
}

export type SellerNotification = AppNotification;

const STORAGE_KEY_SELLER = 'seller_notifications_v1';
const STORAGE_KEY_ADMIN = 'admin_notifications_v1';
const STORAGE_KEY_WAREHOUSE = 'warehouse_notifications_v1';

const INITIAL_SELLER_NOTIFICATIONS: AppNotification[] = [];

const INITIAL_ADMIN_NOTIFICATIONS: AppNotification[] = [];

const INITIAL_WAREHOUSE_NOTIFICATIONS: AppNotification[] = [];

export function getStoredNotifications(role: 'seller' | 'admin' | 'warehouse' = 'seller'): AppNotification[] {
  let key = STORAGE_KEY_SELLER;
  let initial = INITIAL_SELLER_NOTIFICATIONS;

  if (role === 'admin') {
    key = STORAGE_KEY_ADMIN;
    initial = INITIAL_ADMIN_NOTIFICATIONS;
  } else if (role === 'warehouse') {
    key = STORAGE_KEY_WAREHOUSE;
    initial = INITIAL_WAREHOUSE_NOTIFICATIONS;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter(
        (n) => n && !n.id?.startsWith('n-default-') && !n.id?.startsWith('n-admin-') && !n.id?.startsWith('n-wh-')
      );
      if (filtered.length !== parsed.length) {
        saveStoredNotifications(filtered, role);
      }
      return filtered;
    }
    return initial;
  } catch (e) {
    console.error(`Failed to load ${role} notifications`, e);
    return initial;
  }
}

export function saveStoredNotifications(
  notifs: AppNotification[],
  role: 'seller' | 'admin' | 'warehouse' = 'seller'
): void {
  let key = STORAGE_KEY_SELLER;
  let eventName = 'seller_notifications_updated';

  if (role === 'admin') {
    key = STORAGE_KEY_ADMIN;
    eventName = 'admin_notifications_updated';
  } else if (role === 'warehouse') {
    key = STORAGE_KEY_WAREHOUSE;
    eventName = 'warehouse_notifications_updated';
  }

  try {
    localStorage.setItem(key, JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent(eventName));
  } catch (e) {
    console.error(`Failed to save ${role} notifications`, e);
  }
}

const SOUND_KEY = 'notifications_sound_enabled';

export function isNotificationSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(SOUND_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, String(enabled));
  } catch {
    // Ignore storage errors
  }
}

export function playNotificationTone(): void {
  if (!isNotificationSoundEnabled()) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Harmonic double chime tone (C5 -> G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.12); // G5
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn('Audio tone play error', e);
  }
}

export function addNotification(
  item: Omit<AppNotification, 'id' | 'createdAt' | 'timestamp' | 'isRead'>
): void {
  const targetRole = item.recipientRole || 'seller';
  const now = new Date();
  const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const newNotif: AppNotification = {
    ...item,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: Date.now(),
    timestamp: `اليوم ${timeFormatted}`,
    isRead: false,
  };

  if (targetRole === 'admin' || targetRole === 'all') {
    const adminNotifs = getStoredNotifications('admin');
    saveStoredNotifications([newNotif, ...adminNotifs], 'admin');
  }

  if (targetRole === 'seller' || targetRole === 'all') {
    const sellerNotifs = getStoredNotifications('seller');
    saveStoredNotifications([newNotif, ...sellerNotifs], 'seller');
  }

  if (targetRole === 'warehouse' || targetRole === 'all') {
    const warehouseNotifs = getStoredNotifications('warehouse');
    saveStoredNotifications([newNotif, ...warehouseNotifs], 'warehouse');
  }

  playNotificationTone();
}

export function addSellerNotification(
  item: Omit<AppNotification, 'id' | 'createdAt' | 'timestamp' | 'isRead' | 'recipientRole'>
): void {
  addNotification({ ...item, recipientRole: 'seller' });
}

export function addAdminNotification(
  item: Omit<AppNotification, 'id' | 'createdAt' | 'timestamp' | 'isRead' | 'recipientRole'>
): void {
  addNotification({ ...item, recipientRole: 'admin' });
}

export function addWarehouseNotification(
  item: Omit<AppNotification, 'id' | 'createdAt' | 'timestamp' | 'isRead' | 'recipientRole'>
): void {
  addNotification({ ...item, recipientRole: 'warehouse' });
}

export function markNotificationAsRead(id: string, role: 'seller' | 'admin' | 'warehouse' = 'seller'): void {
  const notifs = getStoredNotifications(role);
  const updated = notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  saveStoredNotifications(updated, role);
}

export function markAllNotificationsAsRead(role: 'seller' | 'admin' | 'warehouse' = 'seller'): void {
  const notifs = getStoredNotifications(role);
  const updated = notifs.map((n) => ({ ...n, isRead: true }));
  saveStoredNotifications(updated, role);
}

export function clearAllNotifications(role: 'seller' | 'admin' | 'warehouse' = 'seller'): void {
  saveStoredNotifications([], role);
}

export function getUnreadNotificationsCount(role: 'seller' | 'admin' | 'warehouse' = 'seller'): number {
  const notifs = getStoredNotifications(role);
  return notifs.filter((n) => !n.isRead).length;
}

