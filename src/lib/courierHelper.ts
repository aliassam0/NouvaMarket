export interface CourierPartner {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED';
  baseShippingFee: number;
  supportedWilayasCount: number;
  avgDeliveryDays: string;
  isDisabled?: boolean;
}

export const INITIAL_COURIERS: CourierPartner[] = [
  {
    id: 'cour-ecom',
    name: 'Ecom Delivery (إيكوم ديليفري)',
    apiKey: '3490e731e3db4d8c841991987d3cab0f',
    apiSecret: 'b8386c67-f0ce-4ce5-bc3b-cf3246a90819',
    webhookUrl: 'https://api.ecomdelivery.dz/webhook',
    connectionStatus: 'CONNECTED',
    baseShippingFee: 600,
    supportedWilayasCount: 69,
    avgDeliveryDays: '24-48 ساعة',
    isDisabled: false,
  },
];

const COURIERS_STORAGE_KEY = 'nouvamarket_courier_partners_v2';

export function getStoredCouriers(supplierId?: string): CourierPartner[] {
  try {
    const activeKey = supplierId ? supplierId.toLowerCase().trim() : 'default';
    const storageKey = `nouvamarket_courier_partners_${activeKey}`;

    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed: CourierPartner[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure Ecom Delivery is in the list
        if (!parsed.some((c) => c.id === 'cour-ecom' || c.name.toLowerCase().includes('ecom'))) {
          return [INITIAL_COURIERS[0], ...parsed];
        }
        return parsed;
      }
    }

    // Try default storage key
    const defaultRaw = localStorage.getItem(COURIERS_STORAGE_KEY);
    if (defaultRaw) {
      const parsedDefault: CourierPartner[] = JSON.parse(defaultRaw);
      if (Array.isArray(parsedDefault) && parsedDefault.length > 0) {
        return parsedDefault;
      }
    }
  } catch (e) {
    console.error('Failed to load couriers from localStorage', e);
  }

  // Fallback: Every supplier starts with exactly 1 default connected courier (Ecom Delivery)
  return [INITIAL_COURIERS[0]];
}

export function saveStoredCouriers(couriers: CourierPartner[], supplierId?: string): void {
  try {
    const activeKey = supplierId ? supplierId.toLowerCase().trim() : 'default';
    const storageKey = `nouvamarket_courier_partners_${activeKey}`;
    localStorage.setItem(storageKey, JSON.stringify(couriers));
    localStorage.setItem(COURIERS_STORAGE_KEY, JSON.stringify(couriers));
  } catch (e) {
    console.error('Failed to save couriers to localStorage', e);
  }
}

