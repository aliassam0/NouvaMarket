export type Language = 'ar' | 'fr';

export type UserRank = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface UserProfile {
  id: string;
  fullName: string;
  storeName: string;
  phone: string;
  email?: string;
  password?: string;
  role?: 'reseller' | 'admin' | 'warehouse';
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
  supplierFeePercent: number;
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
  nouvaFeePercent?: number;  // Marketplace fee percentage
  wholesalePrice: number;    // Price charged to reseller in DZD (supplierNetPrice + Nouva fee)
  suggestedSellingPrice: number; // Recommended retail price
  floorPrice: number; // Minimum allowed retail price
  ceilingPrice: number; // Maximum allowed retail price
  descriptionAr: string;
  descriptionFr: string;
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
  totalProfit: number;
  status: OrderStatus;
  statusAr: string;
  statusFr: string;
  createdAt: string;
  trackingCode?: string;
  bordereauUrl?: string;
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
  supplierId?: string;
  supplierEmail?: string;
  returnedToWarehouse?: boolean;
  commissionCredited?: boolean;
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
