// officialStoreConfig.ts - Persistent official store configuration & helpers
// Preserves all existing product catalog, seller accounts, and supplier data without overwriting.

export interface OfficialStoreSettings {
  storeName: string;
  storeTagline: string;
  announcementText: string;
  phoneContact: string;
  whatsappContact: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerBadge: string;
  bannerImageUrl?: string; // Optional custom banner image
  primaryColor: string; // 'emerald' | 'indigo' | 'violet'
  freeShippingThreshold: number; // in DZD, 0 = disabled
  allowMultiItemCart: boolean;
  enableStockUrgencyBadge: boolean;
  enableBundleDiscounts: boolean;
  doubleItemDiscountPercent: number; // default 5%
  tripleItemDiscountPercent: number; // default 10%
  customDomainNotice: string;
  subdomainReady: boolean;
  featuredProductIds: string[]; // specific products highlighted on top
  hiddenProductIds: string[]; // products hidden from retail store

  // Tracking Pixels (Meta, TikTok, Snapchat, Google Analytics)
  enablePixelTracking: boolean;
  facebookPixelId: string;
  tiktokPixelId: string;
  snapchatPixelId: string;
  googleAnalyticsId: string;
  testEventCode: string; // Meta test event code

  // Delivery & Courier Partner Settings (شركة التوصيل المعتمدة والتغليف)
  defaultCourierPartnerId?: string; // e.g. 'cour-yalidine'
  defaultCourierName?: string; // e.g. 'Yalidine Express'
  packagingInstructions?: string; // توجيهات التغليف

  // Confirmer Commissions (حقوق مؤكد الطلبيات عن كل طرد ناجح ومسلّم)
  confirmerFeePerDeliveredOrder?: number; // افتراضياً 150 دج تُقتطع من إيرادات متجر المنصة لحساب المؤكد
}

const STORAGE_KEY = 'nouva_official_store_settings_v1';

export const DEFAULT_OFFICIAL_STORE_SETTINGS: OfficialStoreSettings = {
  storeName: 'Nouva Store | المتجر الرسمي',
  storeTagline: 'متجر التجزئة المباشر الأول في الجزائر - جودة مضمونة ودفع عند الاستلام',
  announcementText: '🚚 توصيل سريع لـ 58 ولاية • الدفع عند الاستلام مع حق الفحص والمعاينة • ضمان الاستبدال 7 أيام',
  phoneContact: '0550123456',
  whatsappContact: '213550123456',
  bannerTitle: 'عروض حصرية ومنتجات أصلية مختارة',
  bannerSubtitle: 'تسوق بأمان مع أسرع خدمة توصيل إلى باب المنزل والدفع بعد فحص طلبيتك',
  bannerBadge: 'توصيل سريع لجميع الولايات 🚚',
  bannerImageUrl: '/social-banner.png',
  primaryColor: 'emerald',
  freeShippingThreshold: 0,
  allowMultiItemCart: true,
  enableStockUrgencyBadge: true,
  enableBundleDiscounts: true,
  doubleItemDiscountPercent: 5,
  tripleItemDiscountPercent: 10,
  customDomainNotice: 'store.nouvamarket.com',
  subdomainReady: true,
  featuredProductIds: [],
  hiddenProductIds: [],

  // Tracking Pixels Defaults
  enablePixelTracking: true,
  facebookPixelId: '',
  tiktokPixelId: '',
  snapchatPixelId: '',
  googleAnalyticsId: '',
  testEventCode: '',

  // Delivery Courier Defaults
  defaultCourierPartnerId: 'cour-yalidine',
  defaultCourierName: 'Yalidine Express (ياليدين إكسبريس)',
  packagingInstructions: 'يرجى وضع لاصق الحماية وفحص سلامة المنتج قبل التغليف، مع إرفاق بطاقة شكر المتجر الرسمي.',

  // Confirmer Commissions Default
  confirmerFeePerDeliveredOrder: 150,
};

export function getOfficialStoreSettings(): OfficialStoreSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_OFFICIAL_STORE_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_OFFICIAL_STORE_SETTINGS,
      ...parsed,
    };
  } catch (err) {
    console.error('Error loading official store settings:', err);
    return DEFAULT_OFFICIAL_STORE_SETTINGS;
  }
}

export function saveOfficialStoreSettings(settings: Partial<OfficialStoreSettings>): OfficialStoreSettings {
  try {
    const current = getOfficialStoreSettings();
    const updated = {
      ...current,
      ...settings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('official_store_settings_updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.error('Error saving official store settings:', err);
    return DEFAULT_OFFICIAL_STORE_SETTINGS;
  }
}
