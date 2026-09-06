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
  {
    id: 'cour-yalidine',
    name: 'Yalidine Express (ياليدين إكسبريس)',
    apiKey: 'yal_live_key_9823419082',
    apiSecret: 'yal_sec_4481902847119028',
    webhookUrl: 'https://api.yalidine.app/v1/webhook',
    connectionStatus: 'CONNECTED',
    baseShippingFee: 650,
    supportedWilayasCount: 69,
    avgDeliveryDays: '24-48 ساعة',
    isDisabled: false,
  },
  {
    id: 'cour-zr',
    name: 'ZR Express (زد آر إكسبريس)',
    apiKey: 'zr_live_token_771920834',
    apiSecret: 'zr_sec_882910394817',
    webhookUrl: 'https://api.zrexpress.dz/webhook',
    connectionStatus: 'CONNECTED',
    baseShippingFee: 600,
    supportedWilayasCount: 69,
    avgDeliveryDays: '24-48 ساعة',
    isDisabled: false,
  },
  {
    id: 'cour-maystro',
    name: 'Maystro Delivery (مايسترو دليفري)',
    apiKey: 'may_live_token_44120938',
    apiSecret: 'may_sec_1092837465',
    webhookUrl: 'https://api.maystro-delivery.com/webhook',
    connectionStatus: 'CONNECTED',
    baseShippingFee: 550,
    supportedWilayasCount: 69,
    avgDeliveryDays: '24-36 ساعة',
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
        // Merge missing default partners
        const merged = [...parsed];
        for (const initC of INITIAL_COURIERS) {
          if (!merged.some((c) => c.id === initC.id || c.name.toLowerCase().includes(initC.id.replace('cour-', '')))) {
            merged.push(initC);
          }
        }
        return merged;
      }
    }

    // Try default storage key
    const defaultRaw = localStorage.getItem(COURIERS_STORAGE_KEY);
    if (defaultRaw) {
      const parsedDefault: CourierPartner[] = JSON.parse(defaultRaw);
      if (Array.isArray(parsedDefault) && parsedDefault.length > 0) {
        const merged = [...parsedDefault];
        for (const initC of INITIAL_COURIERS) {
          if (!merged.some((c) => c.id === initC.id || c.name.toLowerCase().includes(initC.id.replace('cour-', '')))) {
            merged.push(initC);
          }
        }
        return merged;
      }
    }
  } catch (e) {
    console.error('Failed to load couriers from localStorage', e);
  }

  // Fallback: Return all initial connected couriers
  return INITIAL_COURIERS;
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

