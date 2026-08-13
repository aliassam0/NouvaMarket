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
    id: 'cour-1',
    name: 'Yalidine Express (ياليدين)',
    apiKey: 'yali_api_live_893247923',
    apiSecret: 'yali_sec_9918237912',
    webhookUrl: 'https://api.tassyir.io/webhook/yalidine',
    connectionStatus: 'CONNECTED',
    baseShippingFee: 600,
    supportedWilayasCount: 69,
    avgDeliveryDays: '24-48 ساعة',
    isDisabled: false,
  },
  {
    id: 'cour-2',
    name: 'Maystro Delivery (مايسترو)',
    apiKey: 'maystro_key_7718293',
    apiSecret: 'maystro_sec_1182391',
    webhookUrl: 'https://api.tassyir.io/webhook/maystro',
    connectionStatus: 'CONNECTED',
    baseShippingFee: 550,
    supportedWilayasCount: 69,
    avgDeliveryDays: '24-72 ساعة',
    isDisabled: false,
  },
  {
    id: 'cour-3',
    name: 'ZR Express (زد آر)',
    apiKey: 'zr_key_4412891',
    apiSecret: 'zr_sec_3318293',
    webhookUrl: 'https://api.tassyir.io/webhook/zr',
    connectionStatus: 'DISCONNECTED',
    baseShippingFee: 500,
    supportedWilayasCount: 69,
    avgDeliveryDays: '48-96 ساعة',
    isDisabled: false,
  },
];

const COURIERS_STORAGE_KEY = 'nouvamarket_courier_partners_v1';

export function getStoredCouriers(): CourierPartner[] {
  try {
    const raw = localStorage.getItem(COURIERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(COURIERS_STORAGE_KEY, JSON.stringify(INITIAL_COURIERS));
      return INITIAL_COURIERS;
    }
    const parsed: CourierPartner[] = JSON.parse(raw);
    // Ensure Ecom delivery is present if upgraded
    if (!parsed.some((c) => c.id === 'cour-ecom')) {
      const merged = [INITIAL_COURIERS[0], ...parsed];
      localStorage.setItem(COURIERS_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load couriers from localStorage', e);
    return INITIAL_COURIERS;
  }
}

export function saveStoredCouriers(couriers: CourierPartner[]): void {
  try {
    localStorage.setItem(COURIERS_STORAGE_KEY, JSON.stringify(couriers));
  } catch (e) {
    console.error('Failed to save couriers to localStorage', e);
  }
}
