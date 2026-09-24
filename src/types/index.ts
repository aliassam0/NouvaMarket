export type Language = 'ar' | 'fr';

export type UserRank = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface UserProfile {
  id: string;
  fullName: string;
  storeName: string;
  phone: string;
  email?: string;
  password?: string;
  role?: 'reseller' | 'admin' | 'warehouse' | 'confirmer';
  wilaya: string;
  rank: UserRank;
  rankAr: string;
  rankFr: string;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED';
  approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  avatarUrl?: string;
  totalOrdersCount: number;
  deliveredOrdersCount: number;
  totalEarnedDzd: number;
  joinDate: string;
  metaPixelId?: string;
  tiktokPixelId?: string;
  snapchatPixelId?: string;
}

export type SupplierStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface SupplierProfile {
  id: string;
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  password?: string;
  wilaya: string;
  activityType: string;
  status: SupplierStatus;
  ccpOrRip: string;
  baridiMobNumber?: string;
  bankRib?: string;
  bankName?: string;
  accountHolderName?: string;
  createdAt: string;
  rejectionReason?: string;
  totalProductsCount?: number;
  totalDeliveredOrders?: number;
  totalSalesDzd?: number;
  nouvaCommissionDzd?: number;
  resellerCommissionsDzd?: number;
  paidAmountDzd?: number;
  remainingBalanceDzd?: number;
  lastPaymentDate?: string;
}

export interface SupplierSettlement {
  id: string;
  supplierId: string;
  supplierName: string;
  amountDzd: number;
  payoutMethod: 'CCP' | 'BARIDIMOB' | 'BANK' | 'CASH';
  accountDetails: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'REJECTED';
  referenceNumber: string;
  referenceNote?: string;
  method?: string;
  date: string;
  notes?: string;
}

export interface MarketplaceFeeSettings {
  supplierFeePercent: number; // نسبة عمولة المنصة المقتطعة من المورد (افتراضياً 5%)
  resellerFeePercent: number; // نسبة عمولة المنصة المقتطعة من المسوق (للتحكم في أرباح المسوق)
  defaultSupplierFeePercent?: number;
  defaultResellerCommissionPercent?: number;
  resellerMinProfitMargin: number;
  lastUpdated: string;
}

export type AgeGroup = 'all' | 'general' | '0-3m' | '3-6m' | '6-12m' | '1-2y' | '2-4y' | '4-6y';
export type Gender = 'boy' | 'girl' | 'unisex';

export interface CategoryItem {
  id: string;
  nameAr: string;
  nameFr: string;
  icon: string;
  image?: string;
  displayOrder: number;
  visible: boolean;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stockCount: number;
  image?: string; // صورة مخصصة لهذا اللون أو المتغير
}

export interface DescriptionImageItem {
  url: string;
  title?: string;
}

export interface MarketerReview {
  id: string;
  name: string;
  rating: number; // 1 to 5
  comment: string;
  city?: string;
  image?: string; // photo proof / screenshot
  date?: string;
}

export interface MarketerCustomization {
  // 1. UGC / Review Video Embed
  videoUrl?: string; // TikTok, Instagram Reel, YouTube Shorts / video, direct mp4
  videoTitle?: string;

  // 2. Customer Reviews & Social Proof
  showReviews?: boolean;
  reviews?: MarketerReview[];

  // 3. Direct WhatsApp Chat Button
  showWhatsApp?: boolean;
  whatsappNumber?: string;
  whatsappMessage?: string;

  // 4. Custom Button & Accent Color
  buttonColor?: string; // e.g. '#fca120' (default amber), '#10b981' (emerald), '#7c3aed' (purple), '#2563eb' (blue), '#e11d48' (crimson), '#0f172a' (slate), or custom hex

  // 5. Custom Main Product Image(s)
  customMainImages?: string[];

  // 6. Custom Description Images
  customDescriptionImages?: string[];

  // 7. Custom Product Description
  customDescription?: string;
}

export interface UpsellOffer {
  id: string;
  title: string;              // عنوان العرض مثل: "أضف شاحن سريع أصلي" أو "قطعة ثانية بخصم 35%"
  description?: string;        // تفاصيل العرض والقيمة المضافة
  image?: string;             // صورة مخصصة للعرض
  price: number;              // سعر البيع للزبون (DZD)
  originalPrice?: number;     // السعر السابق للشطب وتوضيح نسبة التوفير (DZD)
  wholesalePrice: number;     // سعر الجملة / التكلفة الأساسية (DZD)
  profit: number;             // عمولة وربح المسوق الإضافية من هذا العرض (DZD)
  badge?: string;             // وسم جذاب مثل: "الأكثر طلباً 🔥" أو "توفير 40%"
  isDefaultSelected?: boolean;// هل يتم تحديده افتراضياً
  quantity?: number;          // عدد القطع المرتبطة بهذا العرض (1، 2، 3، إلخ)
}

export interface Product {
  id: string;
  nameAr: string;
  nameFr: string;
  categoryAr: string;
  categoryFr: string;
  ageGroup: AgeGroup;
  gender: Gender;
  images: string[];
  supplierId?: string;
  supplierName?: string;
  supplierEmail?: string;
  supplierNetPrice?: number; // Net price requested by supplier
  nouvaFeePercent?: number;  // Marketplace fee percentage from supplier (default 5%)
  resellerFeePercent?: number; // Optional platform fee percentage from reseller for this product
  wholesalePrice: number;    // Price charged to reseller in DZD (supplierNetPrice + Nouva fee)
  suggestedSellingPrice: number; // Recommended retail price
  floorPrice: number; // Minimum allowed retail price
  ceilingPrice: number; // Maximum allowed retail price
  descriptionAr: string;
  descriptionFr: string;
  descriptionImages?: (string | DescriptionImageItem)[]; // Visual landing page description images (supports string URL or object with title)
  colorImages?: Record<string, string>; // صور مخصصة لكل لون { [colorName]: imageUrl }
  upsells?: UpsellOffer[]; // Multiple Upsell offers (عروض البيع الإضافي التكميلي لزيادة المبيعات وعمولة المسوق)
  featuresAr: string[];
  featuresFr: string[];
  variants: ProductVariant[];
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  minStockAlert?: number; // Minimum stock threshold before alert is triggered
  approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  rejectionReason?: string;
}

export type OrderStatus =
  | 'LINK_ORDER'   // طلب من الرابط
  | 'PENDING_SYNC' // Waiting in local offline queue
  | 'CONFIRMED'    // تم التأكيد
  | 'PROCESSING'   // En préparation
  | 'SHIPPED'     // En transit
  | 'DELIVERED'   // Livré
  | 'FAILED'      // Échec de livraison
  | 'CANCELLED';   // Annulé

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  variantSize: string;
  variantColor: string;
  quantity: number;
  supplierId?: string;
  supplierName?: string;
  supplierNetPrice?: number;
  nouvaFeeAmount?: number;
  wholesalePrice: number;
  sellingPrice: number;
  profit: number;
  isUpsell?: boolean; // هل هذا العنصر عرض بيع إضافي (Upsell)
  upsellOfferId?: string; // معرف عرض الـ Upsell
  isCrossSell?: boolean; // هل هذا العنصر منتج بيع متقاطع (Cross-sell)
}

export interface Order {
  id: string;
  idempotencyKey: string;
  customerName: string;
  phone: string;
  phone2?: string;
  wilaya: string;
  wilayaCode?: string;
  commune: string;
  address: string;
  deliveryType: 'home' | 'office';
  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  totalProfit: number; // صافي الربح المستحق للمسوق
  grossProfit?: number; // إجمالي ربح المسوق قبل اقتطاع عمولة المنصة
  platformResellerFee?: number; // مبلغ عمولة المنصة المقتطع من أرباح المسوق
  resellerFeePercent?: number; // نسبة عمولة المنصة المقتطعة من المسوق المطبقة
  status: OrderStatus;
  statusAr: string;
  statusFr: string;
  createdAt: string;
  trackingCode?: string;
  bordereauUrl?: string;
  courierPartnerId?: string; // معرف شركة التوصيل المختارة من طرف المورد
  bordereauCreatedAt?: string; // تاريخ ووقت إنشاء البوردورو عبر API
  adminConfirmed?: boolean;
  confirmedAt?: string;
  deliveryCompanySent?: boolean;
  deliveryCompanyName?: string;
  failureReason?: string;
  cancellationReason?: string;
  syncStatus?: 'synced' | 'pending_sync' | 'failed_sync';
  isLockedForEdit?: boolean;
  situation?: string;
  avancement?: string;
  noteFournisseur?: string;
  echange?: number; // 0 or 1
  stopdesk?: number; // 0 or 1
  codeStopdesk?: string;
  refArticle?: string;
  idExterne?: string;
  source?: string;
  resellerId?: string;
  resellerEmail?: string;
  resellerPhone?: string;
  resellerName?: string;
  externalOrderId?: string; // معرف الطلبية في المتجر الخارجي (Shopify / YouCan / WooCommerce)
  externalOrderNumber?: string; // رقم الطلبية الخارجي مثل #1048
  externalStoreId?: string; // معرف المتجر المتصل
  externalStoreName?: string; // اسم المتجر الخارجي
  externalStorePlatform?: 'shopify' | 'youcan' | 'woocommerce' | 'wordpress'; // نوع المنصة
  externalCustomerNote?: string; // ملاحظات الزبون من المتجر الخارجي
  supplierId?: string;
  supplierEmail?: string;
  returnedToWarehouse?: boolean;
  commissionCredited?: boolean;
  trackingHistory?: any[];
  assignedConfirmerId?: string; // معرف المؤكد المكلف بالطلبية حصرياً لمنع الازدواجية
  assignedConfirmerName?: string; // اسم المؤكد المكلف
  assignedAt?: string; // تاريخ ووقت التكليف أو حجز الطلبية
  confirmedBy?: string; // معرف المؤكد أو الأدمن الذي أكد الطلبية
  confirmerName?: string; // اسم مؤكد الطلبيات
  confirmedByRole?: 'CONFIRMER' | 'SUPPLIER' | 'ADMIN'; // رتبة من قام بالتأكيد لمنع ازدواجية التأكيد بين المؤكد والمورد
  confirmationNote?: string; // ملاحظات مكالمة التأكيد
  callAttempts?: number; // عدد محاولات الاتصال بالزبون
  lastCallDate?: string; // تاريخ ووقوع آخر اتصال
  lastCallResult?: string; // نتيجة آخر اتصال: تم الرد، لم يرد، مغلق، طلب تأجيل، إلغاء...
  callHistory?: { date: string; result: string; note?: string; agentName: string }[];
  trackingFollowedBy?: string; // معرف مؤكد الطلبيات المسؤول عن تتبع التوصيل والتنسيق
  trackingFollowedByName?: string; // اسم مؤكد الطلبيات المسؤول عن المتابعة
  deliveredAt?: string; // تاريخ وصول الطلبية لمرحلة التسليم بنجاح
  driverName?: string; // اسم الموزع / السائق التابع لشركة التوصيل
  driverPhone?: string; // رقم هاتف الموزع الخاص بشركة التوصيل
  driverCompany?: string; // اسم شركة التوصيل أو مركز التوزيع
  coordinationNotes?: string; // ملاحظات التنسيق بين الموزع والمشتري
  coordinationStatus?: 'waiting_pickup' | 'out_for_delivery' | 'notified_buyer' | 'driver_called_no_answer' | 'customer_rescheduled' | 'address_clarified' | 'delivered' | 'returned';
  lastCoordinationAt?: string; // تاريخ ووقوع آخر تنسيق
}

export interface DeliveryApiConfig {
  apiKey: string;
  apiToken: string;
  companyName: string;
  endpointUrl: string;
  autoSendOnConfirm: boolean;
}

export interface ColisPayload {
  Echange: number;
  Stopdesk: number;
  CodeStopdesk: string;
  NomComplet: string;
  Mobile_1: string;
  Mobile_2: string;
  Adresse: string;
  Wilaya: string;
  Commune: string;
  Article: string;
  Ref_Article: string;
  NoteFournisseur: string;
  Total: string;
  ID_Externe: string;
  Source: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'withdrawal' | 'bonus';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  method?: string;
  accountNumber?: string;
}

export interface WalletState {
  available: number;
  pending: number;
  totalEarned: number;
  currency: string;
}

export interface NotificationItem {
  id: string;
  titleAr: string;
  titleFr: string;
  bodyAr: string;
  bodyFr: string;
  timestamp: string;
  isRead: boolean;
  type: 'order' | 'wallet' | 'reward' | 'system';
  targetId?: string;
}

export interface MarketingCopyRequest {
  productName: string;
  productDescription: string;
  platform: 'WhatsApp' | 'Instagram' | 'TikTok' | 'Facebook';
  tone: string;
  price: number;
  profit: number;
  ageGroup: string;
}

export type SystemUserRole = 'ADMIN' | 'WAREHOUSE' | 'RESELLER_SUPPORT' | 'FINANCE_MANAGER' | 'ORDER_CONFIRMER';

export interface SystemUser {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  role: SystemUserRole;
  permissions: string[];
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

// ----------------------------------------------------
// External Store Integrations (Shopify / YouCan / WooCommerce)
// ----------------------------------------------------

export type ExternalPlatform = 'shopify' | 'youcan' | 'woocommerce' | 'wordpress';

export interface ExternalStoreConnection {
  id: string;
  resellerId: string;
  resellerName?: string;
  platform: ExternalPlatform;
  storeName: string;
  storeUrl: string; // e.g. https://mystore.myshopify.com or https://mystore.youcan.shop or https://mywordpresssite.com
  apiKey?: string; // Shopify Access Token / YouCan API Token / WooCommerce Consumer Key
  apiSecret?: string; // WooCommerce Consumer Secret
  webhookSecret?: string;
  currency: string; // DZD, USD, EUR, etc.
  status: 'connected' | 'error' | 'disconnected';
  statusMessage?: string;
  lastSyncAt?: string;
  lastOrdersSyncAt?: string;
  autoSyncInventory: boolean;
  autoPullOrders: boolean;
  priceMarkupType: 'fixed' | 'percentage';
  priceMarkupValue: number; // e.g. 500 DZD or 15%
  defaultOrderStatus: OrderStatus;
  syncedProductsCount?: number;
  totalOrdersPulled?: number;
  createdAt: string;
}

export interface SyncedProductMapping {
  id: string;
  storeId: string;
  platform: ExternalPlatform;
  storeName: string;
  nouvaProductId: string;
  nouvaProductName: string;
  externalProductId: string;
  externalProductUrl?: string;
  resellerId: string;
  syncedSellingPrice: number;
  wholesalePrice: number;
  calculatedProfit: number;
  lastSyncedAt: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  errorMessage?: string;
  variantsCount: number;
  stockSynced: number;
}

export interface ProductExportOptions {
  storeIds: string[];
  sellingPrice: number; // DZD retail price on external store
  includeVariants: boolean;
  selectedVariantIds?: string[];
  includeDescriptionImages: boolean;
  includeFeatures: boolean;
  syncInventory: boolean;
  productStatus?: 'active' | 'draft';
}

export interface ExternalOrderSyncResult {
  storeId: string;
  storeName: string;
  platform: ExternalPlatform;
  pulledCount: number;
  skippedCount: number;
  orders: Order[];
  errors: string[];
}
