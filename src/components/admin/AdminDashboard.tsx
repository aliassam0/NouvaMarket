import React, { useState, useEffect } from 'react';
import { DateFilterBar, DateFilterMode, matchesDateFilter } from '../common/DateFilterBar';
import { AdminWarehouseCodStepper } from '../ui/AdminWarehouseCodStepper';
import {
  ShieldCheck,
  Package,
  Layers,
  Users,
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Edit3,
  Plus,
  Search,
  Zap,
  Check,
  DollarSign,
  TrendingUp,
  FileText,
  Key,
  Globe,
  Truck,
  Eye,
  EyeOff,
  RefreshCw,
  Sliders,
  Settings,
  Bell,
  Building,
  Tag,
  Percent,
  Warehouse as WarehouseIcon,
  UserCheck,
  Smartphone,
  Lock,
  Trash2,
  AlertTriangle,
  Send,
  PlusCircle,
  MinusCircle,
  UserPlus,
  Image as ImageIcon,
  FolderPlus,
  ArrowUpRight,
  Filter,
  Award,
  Volume2,
  Music,
  X,
  Mail,
  Store,
  Phone,
  MessageCircle,
  MapPin,
  ShieldAlert,
  Link as LinkIcon,
} from 'lucide-react';
import { ProductUrlImportModal } from '../common/ProductUrlImportModal';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCategories } from '../../context/CategoryContext';
import { MOCK_PRODUCTS, getStoredProducts, saveStoredProducts } from '../../data/mockProducts';
import { Product, Order, UserProfile, WalletTransaction, CategoryItem, SupplierProfile, SupplierSettlement, MarketplaceFeeSettings } from '../../types';
import {
  getStoredSuppliers,
  saveStoredSuppliers,
  addSupplierRegistration,
  updateSupplierStatus,
  deleteSupplierRegistration,
  getStoredSettlements,
  saveStoredSettlements,
  addStoredSettlement,
  getStoredMarketplaceFees,
  saveStoredMarketplaceFees,
} from '../../lib/supplierHelper';
import {
  getStoredSellers,
  saveStoredSellers,
  addSellerRegistration,
  updateSellerStatus,
  deleteSellerRegistration,
  getWhatsAppUrl,
  ExtendedSeller,
} from '../../lib/sellerHelper';
import { ALGERIA_WILAYAS, getWilayaByCode } from '../../data/algeriaLocations';
import { MoneyText } from '../ui/MoneyText';
import { ProductEditModal } from '../common/ProductEditModal';
import { getStoredRanks, saveStoredRanks, RewardRank } from '../../lib/gamificationHelper';
import { getStoredCouriers, saveStoredCouriers, CourierPartner } from '../../lib/courierHelper';
import { LowStockBanner, LowStockModal, getLowStockProducts } from '../common/LowStockAlerts';
import {
  addSellerNotification,
  addAdminNotification,
  addNotification,
  getStoredNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  clearAllNotifications,
  playNotificationTone,
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  AppNotification,
} from '../../lib/notificationHelper';
import { NotificationsModal } from '../tabs/NotificationsModal';

interface AdminDashboardProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSwitchToSellerDashboard?: (seller: UserProfile) => void;
  onImpersonateSupplier?: (supplier: any) => void;
}

// ---------------------- TYPES & INITIAL DATA ----------------------

type AdminTabKey =
  | 'products'
  | 'sellers'
  | 'wallet'
  | 'inventory'
  | 'couriers'
  | 'suppliers'
  | 'categories'
  | 'coupons'
  | 'users'
  | 'settings'
  | 'notifications'
  | 'rewards';

// 1. Initial Customers
interface CustomerItem {
  id: string;
  fullName: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  ordersCount: number;
  totalSpentDzd: number;
  createdAt: string;
}

const INITIAL_CUSTOMERS: CustomerItem[] = [];

// 2. Initial Sellers
const INITIAL_SELLERS: ExtendedSeller[] = [];

import {
  getStoredWithdrawals,
  saveStoredWithdrawals,
  createWithdrawalRequest,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  WithdrawalRequest,
} from '../../lib/withdrawalHelper';

// 4. Initial Suppliers
interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  suppliedProducts: string[];
  purchaseCostDzd: number;
  leadTimeDays: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const INITIAL_SUPPLIERS: Supplier[] = [];

// 6. Initial Coupons
interface CouponItem {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minOrderDzd: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
}

const INITIAL_COUPONS: CouponItem[] = [];



// 8. Initial System Users / Roles (الأدوار والصلاحيات)
interface SystemUser {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'WAREHOUSE' | 'RESELLER_SUPPORT' | 'FINANCE_MANAGER';
  permissions: string[];
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

const INITIAL_USERS: SystemUser[] = [
  {
    id: 'usr-1',
    fullName: 'مدير النظام (Admin)',
    email: 'Admin@nouvamarket.com',
    role: 'ADMIN',
    permissions: ['ALL_PERMISSIONS'],
    status: 'ACTIVE',
    createdAt: '2025-01-01',
  },
  {
    id: 'usr-2',
    fullName: 'أمين المستودع والمورد (Warehouse)',
    email: 'Warehouse@nouvamarket.com',
    role: 'WAREHOUSE',
    permissions: ['PACKING', 'PICKING', 'BARCODE_SCAN', 'INVENTORY_READ_WRITE'],
    status: 'ACTIVE',
    createdAt: '2025-06-12',
  },
];

// ---------------------- COMPONENT MAIN ----------------------

export function AdminDashboard({ onShowToast, onSwitchToSellerDashboard, onImpersonateSupplier }: AdminDashboardProps) {
  const { orders, confirmAndShipOrder, updateOrder } = useOrders();
  const { switchUser } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabKey>('products');

  // Admin Notification Service State
  const [isAdminNotifModalOpen, setIsAdminNotifModalOpen] = useState(false);
  const [adminUnreadCount, setAdminUnreadCount] = useState<number>(() => getUnreadNotificationsCount('admin'));
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastRole, setBroadcastRole] = useState<'seller' | 'admin' | 'all'>('seller');
  const [broadcastType, setBroadcastType] = useState<'product_add' | 'stock_update' | 'order' | 'wallet' | 'reward' | 'system'>('system');

  useEffect(() => {
    const handleAdminNotifUpdate = () => {
      setAdminUnreadCount(getUnreadNotificationsCount('admin'));
    };
    handleAdminNotifUpdate();
    window.addEventListener('admin_notifications_updated', handleAdminNotifUpdate);
    return () => window.removeEventListener('admin_notifications_updated', handleAdminNotifUpdate);
  }, []);

  const handleSendBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      onShowToast('يرجى كتابة عنوان وتفاصيل الإشعار أولاً!', 'error');
      return;
    }

    addNotification({
      recipientRole: broadcastRole,
      type: broadcastType,
      titleAr: broadcastTitle.trim(),
      bodyAr: broadcastBody.trim(),
    });

    setBroadcastTitle('');
    setBroadcastBody('');
    onShowToast('📢 تم إرسال وبث الإشعار الفوري بنجاح مع تشغيل نغمة التنبيه!', 'success');
  };

  const handleEnterSellerDashboard = (seller: UserProfile) => {
    switchUser(seller);
    if (onSwitchToSellerDashboard) {
      onSwitchToSellerDashboard(seller);
    }
    onShowToast(`🚀 تم الدخول بنجاح إلى داشبورد البائع: ${seller.fullName} (${seller.storeName})`, 'success');
  };

  // 1. Products State
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNewProduct, setIsAddingNewProduct] = useState(false);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const [isUrlImportModalOpen, setIsUrlImportModalOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Supplier System State
  const [supplierList, setSupplierList] = useState<SupplierProfile[]>(getStoredSuppliers);
  const [supplierFilter, setSupplierFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SUSPENDED'>('ALL');
  const [feeSettings, setFeeSettings] = useState<MarketplaceFeeSettings>(getStoredMarketplaceFees);
  
  // Add Supplier Modal State & Form
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({
    fullName: '',
    email: '',
    companyName: '',
    activityType: 'ألبسة ونسيج',
    ccpOrRip: '',
    phone: '',
    wilaya: ALGERIA_WILAYAS[0]?.nameAr || '01 - أدرار',
    password: '',
    confirmPassword: '',
    initialStatus: 'APPROVED' as 'APPROVED' | 'PENDING',
  });

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierForm.fullName || !newSupplierForm.email || !newSupplierForm.companyName || !newSupplierForm.phone) {
      onShowToast('يرجى ملء جميع الحقول المطلوبة (الاسم، البريد، اسم الشركة، والهاتف)', 'error');
      return;
    }
    if (newSupplierForm.password && newSupplierForm.password !== newSupplierForm.confirmPassword) {
      onShowToast('كلمتا المرور غير متطابقتين، يرجى التأكد مرة أخرى', 'error');
      return;
    }

    const created = addSupplierRegistration({
      fullName: newSupplierForm.fullName,
      companyName: newSupplierForm.companyName,
      phone: newSupplierForm.phone || '0550000000',
      email: newSupplierForm.email,
      password: newSupplierForm.password || '123456',
      wilaya: newSupplierForm.wilaya,
      activityType: newSupplierForm.activityType,
      ccpOrRip: newSupplierForm.ccpOrRip || 'CCP / BaridiMob Pending',
    });

    if (newSupplierForm.initialStatus === 'APPROVED') {
      updateSupplierStatus(created.id, 'APPROVED');
    }

    const updatedList = getStoredSuppliers();
    setSupplierList(updatedList);

    setIsAddSupplierModalOpen(false);
    setNewSupplierForm({
      fullName: '',
      email: '',
      companyName: '',
      activityType: 'ألبسة ونسيج',
      ccpOrRip: '',
      phone: '',
      wilaya: ALGERIA_WILAYAS[0]?.nameAr || '01 - أدرار',
      password: '',
      confirmPassword: '',
      initialStatus: 'APPROVED',
    });

    onShowToast(`✔ تم إضافة وتسجيل المورد (${created.companyName}) بنجاح!`, 'success');
  };
  
  // Settlement Form Modal State
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [selectedSupplierForSettlement, setSelectedSupplierForSettlement] = useState<SupplierProfile | null>(null);
  const [settlementAmount, setSettlementAmount] = useState(10000);
  const [settlementMethod, setSettlementMethod] = useState<'CCP' | 'BARIDIMOB' | 'BANK' | 'CASH'>('CCP');
  const [settlementNote, setSettlementNote] = useState('');

  const handleUpdateSupplierStatus = (supplierId: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    const list = getStoredSuppliers();
    const idx = list.findIndex((s) => s.id === supplierId);
    if (idx !== -1) {
      list[idx].status = status;
      saveStoredSuppliers(list);
      setSupplierList(list);
      
      const statusLabels = {
        APPROVED: 'تمت الموافقة وتفعيل حساب المورد بنجاح ✔',
        REJECTED: 'تم رفض طلب انضمام المورد ✖',
        SUSPENDED: 'تم تعليق حساب المورد ⛔',
      };
      onShowToast(statusLabels[status], status === 'APPROVED' ? 'success' : 'info');
      
      addNotification({
        recipientRole: 'warehouse',
        type: 'system',
        titleAr: `تحديث حالة حساب المورد: ${list[idx].companyName}`,
        bodyAr: `تم تغير حالة حسابك إلى: ${status === 'APPROVED' ? 'معتمد' : status === 'REJECTED' ? 'مرفوض' : 'معلق'}`,
      });
    }
  };

  const handleApproveProduct = (productId: string) => {
    const prods = getStoredProducts();
    const idx = prods.findIndex((p) => p.id === productId);
    if (idx !== -1) {
      prods[idx].approvalStatus = 'APPROVED';
      saveStoredProducts(prods);
      setProducts(prods);
      onShowToast('✔ تمت الموافقة على المنتج ونشره رسمياً في الكتالوج العام للمسوقين!', 'success');
      
      addNotification({
        recipientRole: 'seller',
        type: 'product_add',
        titleAr: 'منتج جديد متوفر بالكتالوج!',
        bodyAr: `تمت إضافة منتج جديد: ${prods[idx].nameAr} بسعر جملة مميز.`,
      });
    }
  };

  const handleRejectProduct = (productId: string) => {
    const prods = getStoredProducts();
    const idx = prods.findIndex((p) => p.id === productId);
    if (idx !== -1) {
      prods[idx].approvalStatus = 'REJECTED';
      saveStoredProducts(prods);
      setProducts(prods);
      onShowToast('تم رفض المنتج وسحبه من الكتالوج.', 'info');
    }
  };

  const handleSaveFeeSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredMarketplaceFees(feeSettings);
    onShowToast('✔ تم تحديث إعدادات عمولة المنصة Nouva Supplier Fee بنجاح!', 'success');
  };

  const handleCreateSettlementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForSettlement) return;
    
    addStoredSettlement({
      supplierId: selectedSupplierForSettlement.id,
      supplierName: selectedSupplierForSettlement.companyName,
      amountDzd: settlementAmount,
      date: new Date().toISOString().split('T')[0],
      method: settlementMethod,
      referenceNote: settlementNote || 'تسوية مستحقات مالية من الأدمن',
      status: 'COMPLETED',
    });

    // Update supplier balance
    const list = getStoredSuppliers();
    const idx = list.findIndex((s) => s.id === selectedSupplierForSettlement.id);
    if (idx !== -1) {
      list[idx].paidAmountDzd = (list[idx].paidAmountDzd || 0) + settlementAmount;
      list[idx].remainingBalanceDzd = Math.max(0, (list[idx].remainingBalanceDzd || 0) - settlementAmount);
      saveStoredSuppliers(list);
      setSupplierList(list);
    }

    setIsSettlementModalOpen(false);
    setSelectedSupplierForSettlement(null);
    setSettlementNote('');
    onShowToast('✔ تم تسجيل التحويل والتسوية المالية للمورد بنجاح!', 'success');
  };

  useEffect(() => {
    const handleProductsUpdated = () => {
      setProducts(getStoredProducts());
    };
    window.addEventListener('products_updated', handleProductsUpdated);
    return () => window.removeEventListener('products_updated', handleProductsUpdated);
  }, []);

  // Telegram Importer State
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramRawText, setTelegramRawText] = useState('');
  const [telegramImageUrl, setTelegramImageUrl] = useState('');
  const [parsedTelegramProduct, setParsedTelegramProduct] = useState<Partial<Product> | null>(null);

  const handleParseTelegramText = () => {
    if (!telegramRawText.trim()) {
      onShowToast('الرجاء لصق نص منشور التلغرام أولاً', 'error');
      return;
    }

    const lines = telegramRawText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    // Extract title (clean emojis and symbols)
    const nameAr = lines[0].replace(/^[✨🔥💥📢📦🛒🌸💙⭐✅‼️📌\s\-\*\#\d\.\:]+/, '').trim() || 'منتج مستورد من التلغرام';
    const nameFr = nameAr;

    // Extract prices (look for digits)
    const numbers = (telegramRawText.match(/\d+/g) || []).map(Number);
    const validPrices = numbers.filter((n) => n >= 200 && n <= 500000);

    let wholesalePrice = validPrices[0] || 2500;
    let suggestedSellingPrice = validPrices[1] || wholesalePrice + 1000;
    if (suggestedSellingPrice <= wholesalePrice) {
      suggestedSellingPrice = wholesalePrice + 1000;
    }
    let floorPrice = Math.round(wholesalePrice * 1.12);
    let ceilingPrice = Math.round(suggestedSellingPrice * 1.25);

    // Extract image URLs if present in text or field
    const extractedImages: string[] = [];
    if (telegramImageUrl.trim()) {
      extractedImages.push(telegramImageUrl.trim());
    }
    const urlMatches = telegramRawText.match(/https?:\/\/[^\s"'\)]+/gi);
    if (urlMatches) {
      urlMatches.forEach((url) => {
        if (url.match(/\.(jpeg|jpg|png|webp|gif)/i) || url.includes('cdn') || url.includes('telegram') || url.includes('shopify') || url.includes('unsplash')) {
          if (!extractedImages.includes(url)) extractedImages.push(url);
        }
      });
    }
    if (extractedImages.length === 0) {
      extractedImages.push('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600');
    }

    // Extract features (bullet points if any)
    const features = lines
      .filter((l) => l.startsWith('✅') || l.startsWith('•') || l.startsWith('-') || l.startsWith('✔️') || l.startsWith('✨'))
      .map((l) => l.replace(/^[✅•\-✔️✨\s]+/, '').trim())
      .filter(Boolean);

    // Auto detect category
    let categoryAr = categories[0]?.nameAr || 'منتجات البشرة والجسم';
    let categoryFr = categories[0]?.nameFr || 'Soins Peau & Corps';

    const lowerText = telegramRawText.toLowerCase();
    if (lowerText.includes('حلاقة') || lowerText.includes('ماكينة') || lowerText.includes('شفرة') || lowerText.includes('تجميل') || lowerText.includes('سشوار') || lowerText.includes('rasoir') || lowerText.includes('tondeuse')) {
      const matchCat = categories.find((c) => c.nameAr.includes('الحلاقة') || c.nameAr.includes('أدوات'));
      if (matchCat) {
        categoryAr = matchCat.nameAr;
        categoryFr = matchCat.nameFr;
      }
    } else if (lowerText.includes('أسنان') || lowerText.includes('معجون') || lowerText.includes('تبييض') || lowerText.includes('dent')) {
      const matchCat = categories.find((c) => c.nameAr.includes('الأسنان'));
      if (matchCat) {
        categoryAr = matchCat.nameAr;
        categoryFr = matchCat.nameFr;
      }
    } else if (lowerText.includes('شعر') || lowerText.includes('شامبو') || lowerText.includes('بلسم') || lowerText.includes('cheveux') || lowerText.includes('shampoo')) {
      const matchCat = categories.find((c) => c.nameAr.includes('الشعر'));
      if (matchCat) {
        categoryAr = matchCat.nameAr;
        categoryFr = matchCat.nameFr;
      }
    }

    setParsedTelegramProduct({
      id: `p-tg-${Date.now()}`,
      nameAr,
      nameFr,
      categoryAr,
      categoryFr,
      ageGroup: 'all',
      gender: 'unisex',
      descriptionAr: telegramRawText.trim(),
      descriptionFr: telegramRawText.trim(),
      featuresAr: features.length > 0 ? features : ['منتج أصلي 100% مستورد من قناة التلغرام', 'توصيل متاح إلى جميع الولايات 69 ولاية', 'هامش ربح ممتاز ومضمون للبائعين'],
      featuresFr: ['Produit Qualité Supérieure', 'Livraison rapide disponible'],
      wholesalePrice,
      floorPrice,
      ceilingPrice,
      suggestedSellingPrice,
      images: extractedImages,
      variants: [
        { id: `v-tg-${Date.now()}`, size: 'Standard', color: 'Original', colorHex: '#2563eb', stockCount: 50 }
      ],
      isNewArrival: true,
    });

    onShowToast('تم تحليـل منشور التلغرام واستخراج بيانات المنتج بنجاح!', 'success');
  };

  const handleConfirmTelegramProduct = () => {
    if (!parsedTelegramProduct || !parsedTelegramProduct.nameAr) return;
    const newProduct = parsedTelegramProduct as Product;
    const updated = [newProduct, ...products];
    setProducts(updated);
    saveStoredProducts(updated);

    addSellerNotification({
      type: 'product_add',
      titleAr: '📦 منتج جديد متوفر بالمتجر 🔥',
      bodyAr: `تم إضافة منتج جديد "${newProduct.nameAr}" مستورد من التلغرام بسعر جملة ${newProduct.wholesalePrice} دج. ابدأ التسويق الآن!`,
      productId: newProduct.id,
      productNameAr: newProduct.nameAr,
    });

    onShowToast(`تمت إضافة المنتج "${newProduct.nameAr}" وإرسال إشعار للبائعين بتوفره! 🎉`, 'success');
    setIsTelegramModalOpen(false);
    setTelegramRawText('');
    setTelegramImageUrl('');
    setParsedTelegramProduct(null);
  };

  // 2. Customers & Orders Creation Modals
  const [customers, setCustomers] = useState<CustomerItem[]>(INITIAL_CUSTOMERS);
  const [isAddingCustomerModalOpen, setIsAddingCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    fullName: '',
    phone: '',
    wilaya: '16 - الجزائر',
    commune: '',
    address: '',
  });

  const [isAddingOrderModalOpen, setIsAddingOrderModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    phone: '',
    wilaya: '16 - الجزائر',
    commune: '',
    address: '',
    selectedProductId: MOCK_PRODUCTS[0]?.id || '',
    selectedVariantSize: MOCK_PRODUCTS[0]?.variants[0]?.size || '',
    quantity: 1,
    salePriceDzd: MOCK_PRODUCTS[0]?.suggestedSellingPrice || 2500,
    shippingFeeDzd: 600,
    courierName: 'Yalidine Express',
  });

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // 3. Sellers & Join Approvals State
  const [sellers, setSellers] = useState<ExtendedSeller[]>(getStoredSellers);
  const [sellerFilter, setSellerFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED'>('ALL');

  useEffect(() => {
    const handleSellersUpdate = () => {
      setSellers(getStoredSellers());
    };
    window.addEventListener('nouva_sellers_updated', handleSellersUpdate);
    return () => window.removeEventListener('nouva_sellers_updated', handleSellersUpdate);
  }, []);
  const [isAddingSellerModalOpen, setIsAddingSellerModalOpen] = useState(false);
  const [newSellerForm, setNewSellerForm] = useState({
    fullName: '',
    storeName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    wilaya: '16 - الجزائر',
    rank: 'BRONZE' as const,
    initialBalanceDzd: 0,
  });

  // 4. Wallet & Withdrawals & Admin Treasury State
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(getStoredWithdrawals);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [rejectModalWithdrawalId, setRejectModalWithdrawalId] = useState<string | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [adminWalletSubTab, setAdminWalletSubTab] = useState<'SELLER_WITHDRAWALS' | 'SUPPLIER_SETTLEMENTS'>('SELLER_WITHDRAWALS');
  const [proofRefInput, setProofRefInput] = useState<{ [wthId: string]: string }>({});

  const [settlements, setSettlements] = useState<SupplierSettlement[]>(getStoredSettlements);

  useEffect(() => {
    setWithdrawals(getStoredWithdrawals());
    setSettlements(getStoredSettlements());

    const handleWithdrawalsUpdate = (e: any) => {
      setWithdrawals(e.detail || getStoredWithdrawals());
    };
    const handleSettlementsUpdate = (e: any) => {
      setSettlements(e.detail || getStoredSettlements());
    };

    window.addEventListener('nouva_withdrawals_updated', handleWithdrawalsUpdate);
    window.addEventListener('nouva_settlements_updated', handleSettlementsUpdate);

    return () => {
      window.removeEventListener('nouva_withdrawals_updated', handleWithdrawalsUpdate);
      window.removeEventListener('nouva_settlements_updated', handleSettlementsUpdate);
    };
  }, []);

  // 5. Inventory Bins State
  const [inventoryLocation, setInventoryLocation] = useState<{ [productId: string]: string }>({
    'p-1': 'المستودع الرئيسي - رف A1-04',
    'p-2': 'المستودع الرئيسي - رف B2-01',
    'p-3': 'مستودع وهران - رف C3-09',
  });

  // 6. Couriers State & Modal
  const [couriers, setCouriersState] = useState<CourierPartner[]>(getStoredCouriers);
  const setCouriers = (action: CourierPartner[] | ((prev: CourierPartner[]) => CourierPartner[])) => {
    setCouriersState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      saveStoredCouriers(next);
      return next;
    });
  };
  const [isAddingCourierModalOpen, setIsAddingCourierModalOpen] = useState(false);
  const [newCourierForm, setNewCourierForm] = useState({
    name: '',
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    baseShippingFee: 600,
    supportedWilayasCount: 69,
  });

  // 7. Suppliers State
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);

  // 8. Categories State & Modal
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [isAddingCategoryModalOpen, setIsAddingCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [newCategoryForm, setNewCategoryForm] = useState({
    nameAr: '',
    nameFr: '',
    icon: '📦',
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=300',
    displayOrder: categories.length + 1,
  });

  // 9. Coupons State
  const [coupons, setCoupons] = useState<CouponItem[]>(INITIAL_COUPONS);

  // 10. System Users / Roles State & Modal
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [isAddingUserModalOpen, setIsAddingUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    role: 'WAREHOUSE' as const,
    permissions: ['PACKING', 'PICKING'],
  });

  // System Settings State
  const [platformName, setPlatformName] = useState('Nouva Market DZ');
  const [currencyName, setCurrencyName] = useState('DZD (دج)');
  const [defaultCommission, setDefaultCommission] = useState(15);
  const [minWithdrawalDzd, setMinWithdrawalDzd] = useState(2000);

  // Notifications Templates State
  const [smsTemplate, setSmsTemplate] = useState(
    'مرحباً {name}، طلبيتك رقم #{order_id} قيد التوصيل الآن مع كود التتبع {tracking}.'
  );
  const [whatsAppTemplate, setWhatsAppTemplate] = useState(
    'السلام عليكم {name} 👋، تم تأكيد طلبيتك {product_name} والمبلغ هو {total} دج. يرجى تأكيد استلام الاتصال.'
  );

  // Reward Ranks & Gamification State & Modals
  const [rewardRanks, setRewardRanks] = useState<RewardRank[]>(getStoredRanks);
  const [editingRank, setEditingRank] = useState<RewardRank | null>(null);
  const [isAddingRankModalOpen, setIsAddingRankModalOpen] = useState(false);
  const [rankForm, setRankForm] = useState<Partial<RewardRank>>({
    nameAr: '',
    nameFr: '',
    requiredOrders: 10,
    bonus: '',
    cashBonusAmount: 200,
    color: 'from-amber-400 to-yellow-600',
    badgeIcon: '🌟',
    perksAr: ['عمولة بيع ممتازة', 'أولوية الشحن والتوصيل'],
  });

  const handleOpenEditRank = (rank: RewardRank) => {
    setEditingRank(rank);
    setRankForm({
      nameAr: rank.nameAr,
      nameFr: rank.nameFr,
      requiredOrders: rank.requiredOrders,
      bonus: rank.bonus,
      cashBonusAmount: rank.cashBonusAmount || 0,
      color: rank.color,
      badgeIcon: rank.badgeIcon,
      perksAr: rank.perksAr || [],
    });
  };

  const handleOpenAddRank = () => {
    setEditingRank(null);
    setRankForm({
      nameAr: '',
      nameFr: '',
      requiredOrders: 15,
      bonus: '+300دج بونص لكل 5 طلبات',
      cashBonusAmount: 300,
      color: 'from-purple-500 to-purple-700',
      badgeIcon: '🌟',
      perksAr: ['بونص مالي مباشر', 'دعم فني سريع'],
    });
    setIsAddingRankModalOpen(true);
  };

  const handleSaveRankSubmit = () => {
    if (!rankForm.nameAr) {
      onShowToast('يرجى كتابة اسم المستوى بالعربية', 'error');
      return;
    }
    const perksList = Array.isArray(rankForm.perksAr)
      ? rankForm.perksAr
      : typeof rankForm.perksAr === 'string'
      ? (rankForm.perksAr as string).split('\n').filter(Boolean)
      : [];

    const rankToSave: RewardRank = {
      id: editingRank ? editingRank.id : `rank-${Date.now().toString().slice(-4)}`,
      nameAr: rankForm.nameAr,
      nameFr: rankForm.nameFr || rankForm.nameAr,
      requiredOrders: Number(rankForm.requiredOrders) || 0,
      bonus: rankForm.bonus || 'بونص ومكافآت مخصصة',
      cashBonusAmount: Number(rankForm.cashBonusAmount) || 0,
      color: rankForm.color || 'from-amber-400 to-yellow-600',
      badgeIcon: rankForm.badgeIcon || '🌟',
      perksAr: perksList,
    };

    setRewardRanks((prev) => {
      const exists = prev.some((r) => r.id === rankToSave.id);
      const next = exists ? prev.map((r) => (r.id === rankToSave.id ? rankToSave : r)) : [...prev, rankToSave];
      saveStoredRanks(next);
      return next;
    });

    setEditingRank(null);
    setIsAddingRankModalOpen(false);
    onShowToast('✔ تم حفظ وتحديث كافة تفاصيل مستويات الجوائز والبونص للمسوّقين بنجاح!', 'success');
  };

  const handleDeleteRank = (rankId: string) => {
    setRewardRanks((prev) => {
      const next = prev.filter((r) => r.id !== rankId);
      saveStoredRanks(next);
      return next;
    });
    onShowToast('✔ تم حذف المستوى بنجاح', 'info');
  };

  // Global Search & Date Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [dateMode, setDateMode] = useState<DateFilterMode>('today');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ---------- HANDLERS & ACTIONS ----------

  // Save Product (Create or Update)
  const handleSaveProduct = (p: Product) => {
    let isNew = false;
    setProducts((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      isNew = !exists || isAddingNewProduct;
      const updated = exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev];
      saveStoredProducts(updated);
      return updated;
    });

    const totalStock = p.variants.reduce((acc, v) => acc + (Number(v.stockCount) || 0), 0);

    if (isNew) {
      addSellerNotification({
        type: 'product_add',
        titleAr: '📦 منتج جديد متوفر بالمتجر 🔥',
        bodyAr: `قام الأدمن بإضافة منتج جديد "${p.nameAr}" بسعر جملة ${p.wholesalePrice} دج. ابدأ التسويق الآن!`,
        productId: p.id,
        productNameAr: p.nameAr,
      });
      onShowToast('✔ تم حفظ المنتج وإرسال إشعار للبائعين بتوفر المنتج الجديد!', 'success');
    } else {
      addSellerNotification({
        type: 'stock_update',
        titleAr: '🔄 تحديث الكمية والمخزون',
        bodyAr: `تم تحديث كميات ومخزون المنتج "${p.nameAr}" [إجمالي الكمية: ${totalStock} قطعة].`,
        productId: p.id,
        productNameAr: p.nameAr,
      });
      onShowToast('✔ تم حفظ المنتج وتحديث كمياته وإرسال إشعار للبائعين!', 'success');
    }

    setEditingProduct(null);
    setIsAddingNewProduct(false);
  };

  // Delete / Reset Stock
  const handleClearProductStock = (productId: string) => {
    let clearedProdName = '';
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          clearedProdName = p.nameAr;
          const resetVariants = p.variants.map((v) => ({ ...v, stockCount: 0 }));
          return { ...p, variants: resetVariants };
        }
        return p;
      });
      saveStoredProducts(updated);
      return updated;
    });

    addSellerNotification({
      type: 'stock_update',
      titleAr: '⚠️ نفاد مؤقت لمخزون منتج',
      bodyAr: `تم تصفير مخزون المنتج "${clearedProdName}" مؤقتاً بالمتجر.`,
      productId,
      productNameAr: clearedProdName,
    });

    onShowToast('✔ تم مسح وتصفير مخزون المنتج بنجاح وإشعار البائعين!', 'info');
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => {
      const prod = prev.find((p) => p.id === productId);
      const updated = prev.filter((p) => p.id !== productId);
      saveStoredProducts(updated);
      onShowToast(`🗑️ تم حذف المنتج (${prod?.nameAr || ''}) نهائياً من النظام!`, 'info');
      return updated;
    });
  };

  // Clear Bin Location
  const handleClearBinLocation = (productId: string) => {
    setInventoryLocation((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    onShowToast('✔ تم إخلاء ومسح موقع الرف لهذا المنتج!', 'info');
  };

  // Add Customer
  const handleAddCustomerSubmit = () => {
    if (!newCustomer.fullName || !newCustomer.phone) {
      onShowToast('الرجاء كتابة الاسم الكامل ورقم الهاتف', 'error');
      return;
    }
    const created: CustomerItem = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      fullName: newCustomer.fullName,
      phone: newCustomer.phone,
      wilaya: newCustomer.wilaya,
      commune: newCustomer.commune || 'المركز',
      address: newCustomer.address || 'العنوان الرئيسي',
      ordersCount: 0,
      totalSpentDzd: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers([created, ...customers]);
    setIsAddingCustomerModalOpen(false);
    setNewCustomer({ fullName: '', phone: '', wilaya: '16 - الجزائر', commune: '', address: '' });
    onShowToast('✔ تم إضافة العميل الجديد بنجاح!', 'success');
  };

  // Add Order directly
  const handleAddOrderSubmit = () => {
    if (!newOrderForm.customerName || !newOrderForm.phone) {
      onShowToast('يرجى ملء كافة بيانات العميل لإنشاء الطلبية', 'error');
      return;
    }
    const product = products.find((p) => p.id === newOrderForm.selectedProductId) || products[0];
    onShowToast(`✔ تم إنشاء الطلبية الجديدة للعميل ${newOrderForm.customerName} بنجاح!`, 'success');
    setIsAddingOrderModalOpen(false);
  };

  // Approve Seller Join
  const handleApproveSeller = (sellerId: string) => {
    updateSellerStatus(sellerId, 'APPROVED');
    const updated = sellers.map((s) => (s.id === sellerId ? { ...s, approvalStatus: 'APPROVED' as const, kycStatus: 'APPROVED' as const } : s));
    setSellers(updated);
    saveStoredSellers(updated);
    
    // Sync active session if this seller is logged in
    const approvedSeller = sellers.find((s) => s.id === sellerId);
    if (approvedSeller) {
      const sessStr = localStorage.getItem('nouvamarket_session_v2');
      if (sessStr) {
        try {
          const sess = JSON.parse(sessStr);
          if (sess.email?.toLowerCase() === approvedSeller.email?.toLowerCase()) {
            sess.approvalStatus = 'APPROVED';
            localStorage.setItem('nouvamarket_session_v2', JSON.stringify(sess));
          }
        } catch (e) {}
      }
    }

    onShowToast('✔ تم تأكيد انضمام وتفعيل حساب البائع بنجاح!', 'success');
  };

  // Reject Seller Join
  const handleRejectSeller = (sellerId: string) => {
    updateSellerStatus(sellerId, 'REJECTED');
    const updated = sellers.map((s) => (s.id === sellerId ? { ...s, approvalStatus: 'REJECTED' as const, kycStatus: 'REJECTED' as const } : s));
    setSellers(updated);
    saveStoredSellers(updated);
    onShowToast('✖ تم رفض طلب انضمام البائع', 'info');
  };

  // Suspend Seller
  const handleSuspendSeller = (sellerId: string) => {
    updateSellerStatus(sellerId, 'SUSPENDED');
    const updated = sellers.map((s) => (s.id === sellerId ? { ...s, approvalStatus: 'SUSPENDED' as const } : s));
    setSellers(updated);
    saveStoredSellers(updated);
    onShowToast('⛔ تم تعليق حساب البائع', 'info');
  };

  // Delete Seller
  const handleDeleteSeller = (sellerId: string) => {
    if (window.confirm('هل أنت تأكد من حذف حساب هذا البائع نهائياً من المنصة؟')) {
      deleteSellerRegistration(sellerId);
      setSellers(getStoredSellers());
      onShowToast('🗑️ تم حذف حساب البائع بنجاح', 'info');
    }
  };

  // Delete Supplier
  const handleDeleteSupplier = (id: string) => {
    if (window.confirm('هل أنت تأكد من حذف حساب هذا المورد نهائياً من النظام؟')) {
      deleteSupplierRegistration(id);
      setSuppliers(getStoredSuppliers());
      onShowToast('🗑️ تم حذف حساب المورد بنجاح', 'info');
    }
  };

  // Enter Supplier Dashboard
  const handleEnterSupplierDashboard = (supplier: any) => {
    if (onImpersonateSupplier) {
      onImpersonateSupplier(supplier);
    }
  };

  // Add New Seller
  const handleAddSellerSubmit = () => {
    if (!newSellerForm.fullName || !newSellerForm.phone || !newSellerForm.email || !newSellerForm.password) {
      onShowToast('يرجى كتابة كافة البيانات الإجبارية (*)', 'error');
      return;
    }
    if (newSellerForm.confirmPassword && newSellerForm.confirmPassword !== newSellerForm.password) {
      onShowToast('كلمة المرور وتأكيد كلمة المرور غير متطابقين!', 'error');
      return;
    }
    const createdSeller = addSellerRegistration({
      fullName: newSellerForm.fullName,
      storeName: newSellerForm.storeName,
      phone: newSellerForm.phone,
      email: newSellerForm.email,
      password: newSellerForm.password,
      wilaya: newSellerForm.wilaya,
    });
    updateSellerStatus(createdSeller.id, 'APPROVED');
    setSellers(getStoredSellers());
    setIsAddingSellerModalOpen(false);
    setNewSellerForm({ fullName: '', storeName: '', phone: '', email: '', password: '', confirmPassword: '', wilaya: '16 - الجزائر', rank: 'BRONZE', initialBalanceDzd: 0 });
    onShowToast('✔ تم تسجيل وإضافة حساب بائع جديد بنجاح!', 'success');
  };

  // Handle Withdrawals & Supplier Settlements
  const handleApproveWithdrawal = (id: string) => {
    const proofRef = proofRefInput[id] || `CCP-TRANS-${Math.floor(Math.random() * 89999 + 10000)}`;
    const success = approveWithdrawalRequest(id, proofRef);
    if (success) {
      setWithdrawals(getStoredWithdrawals());
      onShowToast('✔ تم الموافقة وصرف طلب السحب وتوثيق إثبات التحويل بنجاح!', 'success');
    } else {
      onShowToast('حدث خطأ أثناء الموافقة على طلب السحب', 'error');
    }
  };

  const handleRejectWithdrawalSubmit = () => {
    if (!rejectModalWithdrawalId) return;
    const reason = rejectionReasonText.trim() || 'عدم مطابقة بيانات الحساب الرقمي';
    const success = rejectWithdrawalRequest(rejectModalWithdrawalId, reason);
    if (success) {
      setWithdrawals(getStoredWithdrawals());
      setRejectModalWithdrawalId(null);
      setRejectionReasonText('');
      onShowToast('✖ تم رفض طلب السحب وإعادة الرصيد آلياً إلى محفظة البائع مع إشعاره', 'info');
    } else {
      onShowToast('حدث خطأ أثناء رفض الطلب', 'error');
    }
  };

  const handleApproveSettlement = (settlementId: string) => {
    const allSt = getStoredSettlements();
    const targetSt = allSt.find((st) => st.id === settlementId);
    if (!targetSt) return;

    const updated = allSt.map((st) =>
      st.id === settlementId ? { ...st, status: 'COMPLETED' as const } : st
    );
    saveStoredSettlements(updated);
    setSettlements(updated);

    // Update supplier paid amount & status in suppliers list
    const sups = getStoredSuppliers();
    const updatedSups = sups.map((s) => {
      if (s.id === targetSt.supplierId) {
        return {
          ...s,
          paidAmountDzd: (s.paidAmountDzd || 0) + targetSt.amountDzd,
          lastPaymentDate: new Date().toISOString().split('T')[0],
        };
      }
      return s;
    });
    saveStoredSuppliers(updatedSups);

    addAdminNotification({
      type: 'wallet',
      titleAr: '💰 تم تحصيل دفعة مستحقات مورد',
      bodyAr: `تمت الموافقة وتوثيق تحصيل دفعة بمبلغ ${targetSt.amountDzd.toLocaleString()} دج من المورد (${targetSt.supplierName}).`,
    });

    onShowToast('✔ تم تأكيد القَبض وإيداع تحويل المورد بالخزينة المركزية!', 'success');
  };

  const handleRejectSettlement = (settlementId: string) => {
    const reason = prompt('سبب رفض وصل إثبات دفع المورد:') || 'وصل الدفع غير مكتمل أو رقم الحوالة غير صحيح';
    const allSt = getStoredSettlements();
    const updated = allSt.map((st) =>
      st.id === settlementId ? { ...st, status: 'REJECTED' as const, notes: reason } : st
    );
    saveStoredSettlements(updated);
    setSettlements(updated);
    onShowToast('✖ تم رفض إثبات دفع المورد وتنبيهه بإعادة الرفع', 'info');
  };

  // Save Courier Partner
  const handleAddCourierSubmit = () => {
    if (!newCourierForm.name || !newCourierForm.apiKey) {
      onShowToast('يرجى إدخال اسم الشركة و مفتاح API', 'error');
      return;
    }
    const createdCourier: CourierPartner = {
      id: `cour-${Date.now().toString().slice(-4)}`,
      name: newCourierForm.name,
      apiKey: newCourierForm.apiKey,
      apiSecret: newCourierForm.apiSecret || 'secret_key',
      webhookUrl: newCourierForm.webhookUrl || `https://api.tassyir.io/webhook/${Date.now()}`,
      connectionStatus: 'CONNECTED',
      baseShippingFee: newCourierForm.baseShippingFee,
      supportedWilayasCount: newCourierForm.supportedWilayasCount,
      avgDeliveryDays: '24-48 ساعة',
    };
    setCouriers([...couriers, createdCourier]);
    setIsAddingCourierModalOpen(false);
    setNewCourierForm({ name: '', apiKey: '', apiSecret: '', webhookUrl: '', baseShippingFee: 600, supportedWilayasCount: 69 });
    onShowToast('✔ تم إضافة منصة شركة التوصيل وتفعيل API!', 'success');
  };

  const handleToggleDisableCourier = (courierId: string) => {
    const courier = couriers.find((c) => c.id === courierId);
    if (!courier) return;
    const nextDisabled = !courier.isDisabled;
    setCouriers((prev) =>
      prev.map((c) => (c.id === courierId ? { ...c, isDisabled: nextDisabled } : c))
    );
    onShowToast(
      nextDisabled
        ? `تم تعطيل شركة التوصيل (${courier.name}) بنجاح!`
        : `تم إعادة تفعيل شركة التوصيل (${courier.name}) بنجاح!`,
      nextDisabled ? 'info' : 'success'
    );
  };

  const handleDeleteCourier = (courierId: string) => {
    const courierToDelete = couriers.find((c) => c.id === courierId);
    setCouriers((prev) => prev.filter((c) => c.id !== courierId));
    onShowToast(`تم حذف شركة التوصيل (${courierToDelete?.name || ''}) بنجاح!`, 'info');
  };

  // Save Category
  const handleAddCategorySubmit = () => {
    if (!newCategoryForm.nameAr) {
      onShowToast('يرجى كتابة اسم الفئة بالعربية', 'error');
      return;
    }
    addCategory({
      nameAr: newCategoryForm.nameAr,
      nameFr: newCategoryForm.nameFr || newCategoryForm.nameAr,
      icon: newCategoryForm.icon || '📦',
      image: newCategoryForm.image,
      displayOrder: newCategoryForm.displayOrder || categories.length + 1,
      visible: true,
    });
    setIsAddingCategoryModalOpen(false);
    setNewCategoryForm({
      nameAr: '',
      nameFr: '',
      icon: '📦',
      image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=300',
      displayOrder: categories.length + 1,
    });
    onShowToast('✔ تم إضافة التصنيف الجديد بنجاح!', 'success');
  };

  const handleEditCategorySubmit = () => {
    if (!editingCategory || !editingCategory.nameAr) {
      onShowToast('يرجى كتابة اسم الفئة بالعربية', 'error');
      return;
    }
    updateCategory(editingCategory.id, {
      nameAr: editingCategory.nameAr,
      nameFr: editingCategory.nameFr,
      icon: editingCategory.icon,
      displayOrder: editingCategory.displayOrder,
      visible: editingCategory.visible,
    });
    setEditingCategory(null);
    onShowToast('✔ تم تعديل التصنيف بنجاح!', 'success');
  };

  const handleDeleteCategoryConfirm = () => {
    if (!deletingCategory) return;
    deleteCategory(deletingCategory.id);
    onShowToast(`تم حذف التصنيف (${deletingCategory.nameAr}) بنجاح!`, 'info');
    setDeletingCategory(null);
  };

  // Save System User Role
  const handleAddUserSubmit = () => {
    if (!newUserForm.fullName || !newUserForm.email) {
      onShowToast('يرجى كتابة الاسم والبريد الإلكتروني', 'error');
      return;
    }
    const createdUser: SystemUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      fullName: newUserForm.fullName,
      email: newUserForm.email,
      role: newUserForm.role,
      permissions: newUserForm.permissions,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSystemUsers([...systemUsers, createdUser]);
    setIsAddingUserModalOpen(false);
    setNewUserForm({ fullName: '', email: '', role: 'WAREHOUSE', permissions: ['PACKING', 'PICKING'] });
    onShowToast('✔ تم تعيين وتجهيز دور المستخدم والصلاحيات!', 'success');
  };

  return (
    <div className="flex-1 pb-24 overflow-y-auto p-2.5 sm:p-4 text-slate-900 dark:text-slate-100 space-y-4 overflow-x-hidden">
      {/* Top Main Admin Banner */}
      <div className="p-4 sm:p-6 rounded-[2rem] bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 border border-purple-800/80 text-white shadow-2xl space-y-5 relative overflow-hidden">
        {/* Background Decorative Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/30 to-purple-500/30 border border-purple-400/40 text-purple-300 shadow-inner shrink-0">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>مركز الإدارة والتحكم الشامل</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                  النظام مباشر
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-purple-200/80 font-medium mt-0.5">
                متابعة المنتجات، البائعين، السحوبات المالية، الموردين، والمخزون في الوقت الفعلي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setActiveAdminTab('couriers')}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 border border-purple-400/50 text-white font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-lg animate-pulse"
              title="شركات التوصيل وربط الـ API"
            >
              <Truck className="w-4 h-4 text-purple-100" />
              <span>🚚 شركات التوصيل API</span>
            </button>

            <button
              onClick={() => setIsAdminNotifModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/50 text-white font-extrabold text-xs flex items-center gap-2 transition cursor-pointer relative shadow-lg hover:shadow-purple-500/20"
              title="إشعارات وتنبيهات الإدارة"
            >
              <Bell className="w-4 h-4 text-purple-300" />
              <span>الإشعارات</span>
              {adminUnreadCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse border-2 border-slate-950">
                  {adminUnreadCount}
                </span>
              )}
            </button>

            <span className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-purple-500/20 to-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-black whitespace-nowrap shadow-xs">
              👑 أدمن رئيسي
            </span>
          </div>
        </div>

        {/* Global Performance KPI Cards - All 12 Admin Tabs */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-12 gap-2 pt-3 border-t border-purple-800/60 relative z-10">
          {/* 1. Products */}
          <div
            onClick={() => setActiveAdminTab('products')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeAdminTab === 'products'
                ? 'bg-purple-600/50 border-purple-400 text-white shadow-lg ring-1 ring-purple-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-purple-900/80 hover:border-purple-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">المنتجات</span>
              <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-white font-mono">{products.length}</span>
              <span className="text-[9px] text-purple-300 font-medium">عنصر</span>
            </div>
          </div>

          {/* 2. Sellers */}
          <div
            onClick={() => setActiveAdminTab('sellers')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeAdminTab === 'sellers'
                ? 'bg-purple-600/50 border-purple-400 text-white shadow-lg ring-1 ring-purple-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-purple-900/80 hover:border-purple-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">البائعين</span>
              <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-purple-400 font-mono">{sellers.length}</span>
              <span className="text-[9px] text-purple-300 font-medium">تاجر</span>
            </div>
          </div>

          {/* 3. Wallet */}
          <div
            onClick={() => setActiveAdminTab('wallet')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeAdminTab === 'wallet'
                ? 'bg-amber-600/50 border-amber-400 text-white shadow-lg ring-1 ring-amber-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-purple-900/80 hover:border-amber-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">السحوبات</span>
              <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
                {withdrawals.filter((w) => w.status === 'PENDING').length}
              </span>
              <span className="text-[9px] text-amber-300 font-medium">معلق</span>
            </div>
          </div>

          {/* 4. Inventory */}
          <div
            onClick={() => setActiveAdminTab('inventory')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeAdminTab === 'inventory'
                ? 'bg-orange-600/50 border-orange-400 text-white shadow-lg ring-1 ring-orange-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-purple-900/80 hover:border-orange-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">المخزون</span>
              <WarehouseIcon className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-orange-300 font-mono">
                {getLowStockProducts(products).length}
              </span>
              <span className="text-[9px] text-orange-200 font-medium">تنبيه</span>
            </div>
          </div>

          {/* 5. Categories */}
          <div
            onClick={() => setActiveAdminTab('categories')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeAdminTab === 'categories'
                ? 'bg-pink-600/50 border-pink-400 text-white shadow-lg ring-1 ring-pink-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-purple-900/80 hover:border-pink-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">الفئات</span>
              <Tag className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-pink-400 font-mono">{categories.length}</span>
              <span className="text-[9px] text-pink-300 font-medium">فئة</span>
            </div>
          </div>

          {/* 6. Suppliers */}
          <div
            onClick={() => setActiveAdminTab('suppliers')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeAdminTab === 'suppliers'
                ? 'bg-purple-600/50 border-purple-400 text-white shadow-lg ring-1 ring-purple-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-purple-900/80 hover:border-purple-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">الموردين</span>
              <Building className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-purple-300 font-mono">{supplierList.length}</span>
              <span className="text-[9px] text-purple-200 font-medium">مورد</span>
            </div>
          </div>

          {/* 7. Couriers */}
          <div
            onClick={() => setActiveAdminTab('couriers')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeAdminTab === 'couriers'
                ? 'bg-sky-600/50 border-sky-400 text-white shadow-lg ring-1 ring-sky-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-purple-900/80 hover:border-sky-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">التوصيل</span>
              <Truck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-sky-400 font-mono">{couriers.length}</span>
              <span className="text-[9px] text-sky-300 font-medium">شركة</span>
            </div>
          </div>

          {/* 8. Coupons */}
          <div
            onClick={() => setActiveAdminTab('coupons')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeAdminTab === 'coupons'
                ? 'bg-purple-600/50 border-purple-400 text-white shadow-lg ring-1 ring-purple-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-purple-900/80 hover:border-purple-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">الكوبونات</span>
              <Percent className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-purple-300 font-mono">{coupons.length}</span>
              <span className="text-[9px] text-purple-200 font-medium">كوبون</span>
            </div>
          </div>

          {/* 9. Rewards Ranks */}
          <div
            onClick={() => setActiveAdminTab('rewards')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeAdminTab === 'rewards'
                ? 'bg-rose-600/50 border-rose-400 text-white shadow-lg ring-1 ring-rose-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-purple-900/80 hover:border-rose-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">الجوائز</span>
              <Award className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-amber-300 font-mono">{rewardRanks.length}</span>
              <span className="text-[9px] text-amber-200 font-medium">مستوى</span>
            </div>
          </div>

          {/* 10. Users & Roles */}
          <div
            onClick={() => setActiveAdminTab('users')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeAdminTab === 'users'
                ? 'bg-blue-600/50 border-blue-400 text-white shadow-lg ring-1 ring-blue-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-purple-900/80 hover:border-blue-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">الصلاحيات</span>
              <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-blue-300 font-mono">{systemUsers.length}</span>
              <span className="text-[9px] text-blue-200 font-medium">مستخدم</span>
            </div>
          </div>

          {/* 11. Notifications */}
          <div
            onClick={() => setActiveAdminTab('notifications')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeAdminTab === 'notifications'
                ? 'bg-purple-600/50 border-purple-400 text-white shadow-lg ring-1 ring-purple-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-purple-900/80 hover:border-purple-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">الإشعارات</span>
              <Bell className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-purple-300 font-mono">{adminUnreadCount}</span>
              <span className="text-[9px] text-purple-200 font-medium">تنبيه</span>
            </div>
          </div>

          {/* 12. Settings */}
          <div
            onClick={() => setActiveAdminTab('settings')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeAdminTab === 'settings'
                ? 'bg-slate-700/60 border-slate-400 text-white shadow-lg ring-1 ring-slate-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-purple-900/80 hover:border-slate-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">الإعدادات</span>
              <Settings className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xs font-black text-purple-400 font-mono">مُنشّط</span>
              <span className="text-[9px] text-slate-300 font-medium">نظام</span>
            </div>
          </div>
        </div>
      </div>

      {/* LOW STOCK ALERT BANNER FOR ADMIN */}
      <LowStockBanner
        products={products}
        onOpenModal={() => setIsLowStockModalOpen(true)}
        roleName="الأدمن والإدارة"
      />

      {/* ADMIN NAVIGATION BAR */}
      <div className="p-1.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-x-auto w-full max-w-full text-xs font-bold scrollbar-none shrink-0 min-w-0">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'products', label: '1. المنتجات والأسعار', icon: Layers },
            { id: 'sellers', label: '2. البائعين والانضمام', icon: Users },
            { id: 'wallet', label: '3. المحفظة والسحوبات', icon: Wallet },
            { id: 'inventory', label: '4. مسح المخزون والأماكن', icon: WarehouseIcon },
            { id: 'categories', label: '5. الفئات والتصنيفات', icon: Tag },
            { id: 'suppliers', label: '6. الموردين والمصانع', icon: Building },
            { id: 'couriers', label: '7. شركات التوصيل API', icon: Truck },
            { id: 'coupons', label: '8. الكوبونات والعروض', icon: Percent },
            { id: 'rewards', label: '9. مستويات الجوائز والبونص 🌟', icon: Award },
            { id: 'users', label: '10. الأدوار والصلاحيات', icon: UserCheck },
            { id: 'notifications', label: '11. قوالب الإشعارات', icon: Bell },
            { id: 'settings', label: '12. إعدادات المنصة', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeAdminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAdminTab(tab.id as AdminTabKey)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-purple-600 text-white shadow-md shadow-purple-500/25 font-black scale-[1.01]'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- 1. EDIT PRODUCTS & CATEGORY & QUANTITIES & IMAGES ---------------- */}
      {activeAdminTab === 'products' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase">
                إدارة المنتجات، التصنيف (Catégorie)، الكميات، وتحميل الصور
              </h3>
              <p className="text-[10px] text-slate-500">
                تحديد سعر الجملة، أدنى وأعلى سعر، السعر المقترح، الكميات لكل مقاس، والصور
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {getLowStockProducts(products).length > 0 && (
                <button
                  onClick={() => setIsLowStockModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-200 animate-pulse" />
                  <span>تنبيهات المخزون ({getLowStockProducts(products).length})</span>
                </button>
              )}

              <button
                onClick={() => setIsTelegramModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer transition"
              >
                <Send className="w-4 h-4 rotate-45" />
                <span>📥 استيراد من تلغرام</span>
              </button>
              <button
                onClick={() => setIsUrlImportModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-500 hover:to-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md whitespace-nowrap cursor-pointer transition"
              >
                <LinkIcon className="w-4 h-4 text-amber-300" />
                <span>🔗 استيراد منتجات من رابط</span>
              </button>
              <button
                onClick={() => {
                  const newP: Product = {
                    id: `p-new-${Date.now()}`,
                    nameAr: '',
                    nameFr: '',
                    categoryAr: categories[0]?.nameAr || 'منتجات البشرة والجسم',
                    categoryFr: categories[0]?.nameFr || 'Soins Peau & Corps',
                    ageGroup: 'all',
                    gender: 'unisex',
                    descriptionAr: '',
                    descriptionFr: '',
                    featuresAr: [],
                    featuresFr: [],
                    wholesalePrice: 0,
                    floorPrice: 0,
                    ceilingPrice: 0,
                    suggestedSellingPrice: 0,
                    images: [],
                    variants: [
                      { id: `v1-${Date.now()}`, size: 'Standard', color: 'Original', colorHex: '#2563eb', stockCount: 0 },
                    ],
                    supplierId: getStoredSuppliers()[0]?.id || 'sup-01',
                    supplierName: getStoredSuppliers()[0]?.companyName || getStoredSuppliers()[0]?.fullName || 'مستودع الجزائر الأوراس للألبسة',
                    isNewArrival: true,
                  };
                  setEditingProduct(newP);
                  setIsAddingNewProduct(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>
          </div>

          {/* Products List Grid */}
          <div className="space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={p.images[0]}
                    alt={p.nameAr}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{p.nameAr}</h4>
                      {p.isFeatured && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-black">
                          مميز ⭐
                        </span>
                      )}
                      {p.isNewArrival && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[9px] font-black">
                          جديد 🔥
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-slate-400">
                        التصنيف: <strong className="text-purple-600 dark:text-purple-400">{p.categoryAr}</strong> • {p.ageGroup}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 text-[10px] font-bold flex items-center gap-1 border border-purple-200 dark:border-purple-800/50">
                        <Building className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>المورد: {p.supplierName || 'مستودع الجزائر الأوراس للألبسة'}</span>
                      </span>
                    </div>

                    {/* Badges for Colors & Sizes on Card */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-bold">المقاسات:</span>
                      {p.variants.map((v, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-bold">
                          {v.size}
                        </span>
                      ))}
                      <span className="text-[10px] text-slate-400 font-bold ms-2">الألوان:</span>
                      {Array.from(new Set(p.variants.map((v) => v.color))).map((colorName, idx) => {
                        const matchingVariant = p.variants.find((v) => v.color === colorName);
                        return (
                          <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold">
                            <span className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-600 inline-block" style={{ backgroundColor: matchingVariant?.colorHex || '#94a3b8' }} />
                            <span>{colorName}</span>
                          </span>
                        );
                      })}
                    </div>

                    {/* Pricing & Stock Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-[10px] bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl font-mono">
                      <div>
                        <span className="text-slate-400 block">سعر الجملة:</span>
                        <span className="font-extrabold text-purple-600 dark:text-purple-400">{p.wholesalePrice} دج</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">أدنى سعر:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{p.floorPrice} دج</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">السعر المقترح للبائع:</span>
                        <span className="font-black text-purple-500">{p.suggestedSellingPrice || p.floorPrice + 500} دج</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">الكمية الكلية:</span>
                        <span className="font-bold text-purple-500">
                          {p.variants.reduce((acc, v) => acc + v.stockCount, 0)} قطعة
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs flex-wrap gap-2">
                  <span className="text-[10px] text-slate-500">
                    عدد الألوان والأنواع: {p.variants.length} أنواع ({p.images.length} صور مرفقة)
                  </span>
                  <div className="flex gap-2 items-center flex-wrap">
                    <button
                      onClick={() => handleClearProductStock(p.id)}
                      className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 font-bold text-[10px] cursor-pointer"
                    >
                      تصفير المخزون
                    </button>

                    {deletingProductId === p.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/80 p-1 rounded-xl border border-rose-200 dark:border-rose-800">
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">حذف نهائي؟</span>
                        <button
                          onClick={() => {
                            handleDeleteProduct(p.id);
                            setDeletingProductId(null);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-extrabold text-[10px] cursor-pointer"
                        >
                          نعم، حذف
                        </button>
                        <button
                          onClick={() => setDeletingProductId(null)}
                          className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingProductId(p.id)}
                        className="px-2.5 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        <span>حذف المنتج</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setIsAddingNewProduct(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل المنتج والأسعار</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT / ADD PRODUCT MODAL */}
      {editingProduct && (
        <ProductEditModal
          editingProduct={editingProduct}
          isAddingNewProduct={isAddingNewProduct}
          onClose={() => setEditingProduct(null)}
          onSaveProduct={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
          categories={categories}
          onShowToast={onShowToast}
        />
      )}

      {/* ---------------- 2. SELLERS & APPROVALS (اضافة وتأكيد البائعين) ---------------- */}
      {activeAdminTab === 'sellers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase">
                إدارة وتأكيد البائعين والمستويات والمحفظة ({sellers.length})
              </h3>
              <p className="text-[10px] text-slate-500">تأكيد طلبات انضمام البائعين، مراسلتهم عبر الواتساب، وإدارة الحسابات</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveAdminTab('rewards')}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>تعديل مستويات الجوائز والبونص 🌟</span>
              </button>
              <button
                onClick={() => setIsAddingSellerModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ إضافة بائع جديد</span>
              </button>

              {/* Status Filter Tabs for Sellers */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSellerFilter(st)}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      sellerFilter === st
                        ? 'bg-purple-600 text-white font-black shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'الكل'
                      : st === 'PENDING'
                      ? '⏳ قيد المراجعة'
                      : st === 'APPROVED'
                      ? '✔ معتمدين'
                      : st === 'SUSPENDED'
                      ? '⛔ معلقين'
                      : '✖ مرفوضين'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sellers List */}
          <div className="space-y-3">
            {sellers.filter((s) => sellerFilter === 'ALL' || s.approvalStatus === sellerFilter).length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
                لا يوجد بائعون ضمن هذا الفلتر حالياً.
              </div>
            ) : (
              sellers
                .filter((s) => sellerFilter === 'ALL' || s.approvalStatus === sellerFilter)
                .map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-base shrink-0 border border-purple-200 dark:border-purple-800">
                          {s.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              onClick={() => handleEnterSellerDashboard(s)}
                              className="text-xs font-black text-slate-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition flex items-center gap-1.5"
                              title="اضغط للدخول إلى داشبورد هذا البائع"
                            >
                              <span>{s.fullName}</span>
                              <span className="text-slate-400 font-normal">({s.storeName})</span>
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold">
                              {s.rankAr || 'المستوى البرونزي'}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                s.approvalStatus === 'APPROVED'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                  : s.approvalStatus === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {s.approvalStatus === 'APPROVED'
                                ? '✔ حساب معتمد'
                                : s.approvalStatus === 'PENDING'
                                ? '⏳ قيد المراجعة'
                                : s.approvalStatus === 'SUSPENDED'
                                ? '⛔ حساب معلق'
                                : '✖ طلب مرفوض'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{s.phone} • {s.wilaya}</span>
                          {s.email && <span className="text-[10px] text-purple-500 font-mono block">{s.email}</span>}
                          {s.password && (
                            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
                              <Lock className="w-3 h-3 text-amber-500" />
                              <span className="text-slate-500 dark:text-slate-400">كلمة السر:</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400">{s.password}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {/* WhatsApp Direct Link Button */}
                        <a
                          href={getWhatsAppUrl(
                            s.phone,
                            `مرحباً ${s.fullName}، نحييك من إدارة منصة Nouva بشأن حساب البائع (${s.storeName}) الخاص بك.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          title="مراسلة البائع مباشرة عبر الواتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب</span>
                        </a>

                        {s.approvalStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveSeller(s.id)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer shadow-xs"
                            >
                              ✔ قبول البائع
                            </button>
                            <button
                              onClick={() => handleRejectSeller(s.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-xs"
                            >
                              ✖ رفض
                            </button>
                          </>
                        )}

                        {s.approvalStatus === 'APPROVED' && (
                          <button
                            onClick={() => handleSuspendSeller(s.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 font-black text-xs cursor-pointer"
                          >
                            تعليق ⛔
                          </button>
                        )}

                        {(s.approvalStatus === 'SUSPENDED' || s.approvalStatus === 'REJECTED') && (
                          <button
                            onClick={() => handleApproveSeller(s.id)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer"
                          >
                            إعادة التفعيل ⚡
                          </button>
                        )}

                        <button
                          onClick={() => handleEnterSellerDashboard(s)}
                          className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          title="الدخول المباشر لداشبورد هذا البائع"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>دخول الداشبورد 🛍️</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSeller(s.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="حذف حساب البائع نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="font-extrabold text-purple-600 dark:text-purple-400">
                        رصيده الحالي: <MoneyText amount={s.totalEarnedDzd} />
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD SELLER (نفس فورم تسجيل بائع / موزع جديد الخاص بصفحة الهبوط) */}
      {isAddingSellerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative text-right max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddingSellerModalOpen(false)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-purple-400" />
                <span>تسجيل بائع / موزع جديد</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">ابدأ عملك مجاناً وبدون أي تكاليف أولية</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddSellerSubmit();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 block">البريد الإلكتروني للحساب *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3.5" />
                  <input
                    type="email"
                    required
                    value={newSellerForm.email}
                    onChange={(e) => setNewSellerForm({ ...newSellerForm, email: e.target.value })}
                    placeholder="seller@domain.com"
                    className="w-full py-3 pr-10 pl-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300 block">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={newSellerForm.fullName}
                    onChange={(e) => setNewSellerForm({ ...newSellerForm, fullName: e.target.value })}
                    placeholder="مثال: أميرة بن ناصر"
                    className="w-full py-3 px-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300 block">اسم المتجر أو الصفحة (اختياري)</label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3.5" />
                    <input
                      type="text"
                      value={newSellerForm.storeName}
                      onChange={(e) => setNewSellerForm({ ...newSellerForm, storeName: e.target.value })}
                      placeholder="مثال: Amira Kids Store"
                      className="w-full py-3 pr-10 pl-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300 block">رقم الواتساب *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3.5" />
                    <input
                      type="tel"
                      required
                      value={newSellerForm.phone}
                      onChange={(e) => setNewSellerForm({ ...newSellerForm, phone: e.target.value })}
                      placeholder="0550123456"
                      className="w-full py-3 pr-10 pl-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300 block">الولاية *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3.5" />
                    <select
                      value={newSellerForm.wilaya}
                      onChange={(e) => setNewSellerForm({ ...newSellerForm, wilaya: e.target.value })}
                      className="w-full py-3 pr-10 pl-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-purple-500 transition appearance-none cursor-pointer"
                    >
                      {ALGERIA_WILAYAS.map((w) => (
                        <option key={w.code} value={w.nameAr}>
                          {w.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300 block">كلمة المرور *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3.5" />
                    <input
                      type="password"
                      required
                      value={newSellerForm.password}
                      onChange={(e) => setNewSellerForm({ ...newSellerForm, password: e.target.value })}
                      placeholder="اختر كلمة سر لحسابك"
                      className="w-full py-3 pr-10 pl-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300 block">تأكيد كلمة المرور *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3.5" />
                    <input
                      type="password"
                      required
                      value={newSellerForm.confirmPassword}
                      onChange={(e) => setNewSellerForm({ ...newSellerForm, confirmPassword: e.target.value })}
                      placeholder="أعد كتابة كلمة السر للتأكيد"
                      className={`w-full py-3 pr-10 pl-4 bg-slate-950 border rounded-2xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none transition ${
                        newSellerForm.confirmPassword && newSellerForm.confirmPassword !== newSellerForm.password
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : 'border-slate-800 focus:border-purple-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <label className="text-xs font-extrabold text-slate-300 block">الرصيد الأولي للمحفظة (اختياري / د.ج)</label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3.5" />
                  <input
                    type="number"
                    min={0}
                    value={newSellerForm.initialBalanceDzd !== undefined ? newSellerForm.initialBalanceDzd : ''}
                    onChange={(e) => setNewSellerForm({ ...newSellerForm, initialBalanceDzd: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full py-3 pr-10 pl-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-purple-400 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-500 hover:from-purple-400 hover:to-purple-400 text-slate-950 font-black text-sm transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                إنشاء حساب بائع معتمد
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- 4. WALLET & WITHDRAWALS (الخزينة المركزية والتصفية المالية للآدمن) ---------------- */}
      {activeAdminTab === 'wallet' && (() => {
        const totalCollectedFromSuppliers = settlements
          .filter((st) => st.status === 'COMPLETED')
          .reduce((acc, st) => acc + (st.amountDzd || 0), 0);

        const totalPaidToSellers = withdrawals
          .filter((w) => w.status === 'APPROVED')
          .reduce((acc, w) => acc + (w.amountDzd || 0), 0);

        const pendingSellerAmount = withdrawals
          .filter((w) => w.status === 'PENDING')
          .reduce((acc, w) => acc + (w.amountDzd || 0), 0);

        const pendingSupplierSettlements = settlements
          .filter((st) => st.status === 'PENDING')
          .reduce((acc, st) => acc + (st.amountDzd || 0), 0);

        const netTreasuryReserve = totalCollectedFromSuppliers - totalPaidToSellers;

        return (
          <div className="space-y-6">
            {/* Header Banner - 3-Tier Financial Coordination System */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-900/50 rounded-3xl text-white shadow-xl space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-600/30 border border-purple-500/40 rounded-2xl text-purple-400">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>الخزينة المركزية وإدارة مقاصة الأموال (Admin Central Treasury)</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                        Unified 3-Tier Clearing
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                      التنسيق المالي الموحد والتلقائي بين <strong>مستحقات الموردين</strong>، <strong>محفظة أرباح البائعين</strong>، و<strong>الخزينة المركزية للآدمن</strong>.
                    </p>
                  </div>
                </div>

                {/* Sub-Tab Selector */}
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 shrink-0">
                  <button
                    onClick={() => setAdminWalletSubTab('SELLER_WITHDRAWALS')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                      adminWalletSubTab === 'SELLER_WITHDRAWALS'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>سحوبات البائعين ({withdrawals.filter((w) => w.status === 'PENDING').length})</span>
                  </button>

                  <button
                    onClick={() => setAdminWalletSubTab('SUPPLIER_SETTLEMENTS')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                      adminWalletSubTab === 'SUPPLIER_SETTLEMENTS'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>تحصيلات الموردين ({settlements.filter((st) => st.status === 'PENDING').length})</span>
                  </button>
                </div>
              </div>

              {/* Financial Flow Guide Line */}
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 grid grid-cols-1 md:grid-cols-3 gap-2 text-center font-medium">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                  <span>1. المورد يدفع عمولات المنصة والمسوقين للآدمن</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                  <span>2. الآدمن يؤكد استلام المبالغ بالخزينة المركزية</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                  <span>3. الآدمن يحول الأرباح لمشتركي البائعين فور طلبهم</span>
                </div>
              </div>
            </div>

            {/* Treasury 4 Main Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Supplier Collections */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-xs text-slate-500 font-extrabold">
                  <span>محصلات الموردين المقبوضة</span>
                  <Building className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  <MoneyText amount={totalCollectedFromSuppliers} />
                </div>
                <p className="text-[10px] text-slate-400">إجمالي المبالغ المسددة من الموردين للآدمن</p>
              </div>

              {/* Card 2: Paid Seller Withdrawals */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-xs text-slate-500 font-extrabold">
                  <span>سحوبات البائعين المصروفة</span>
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  <MoneyText amount={totalPaidToSellers} />
                </div>
                <p className="text-[10px] text-slate-400">أرباح تم تحويلها لحسابات البائعين</p>
              </div>

              {/* Card 3: Pending Payouts */}
              <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-xs text-amber-800 dark:text-amber-300 font-extrabold">
                  <span>طلبات معلقة بانتظار الصرف</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono">
                  <MoneyText amount={pendingSellerAmount} />
                </div>
                <p className="text-[10px] text-amber-700 dark:text-amber-400">إجمالي الطلبات في قائمة الانتظار</p>
              </div>

              {/* Card 4: Net Treasury Reserve */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-50 dark:from-purple-950/40 dark:to-purple-950/40 border border-purple-200 dark:border-purple-800 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-xs text-purple-900 dark:text-purple-300 font-extrabold">
                  <span>احتياطي الخزينة الصافي</span>
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-xl font-black text-purple-600 dark:text-purple-300 font-mono">
                  <MoneyText amount={netTreasuryReserve} />
                </div>
                <p className="text-[10px] text-purple-700 dark:text-purple-400">المبلغ الصافي المتوفر بالخزينة المركزية</p>
              </div>
            </div>

            {/* SUB TAB 1: SELLER WITHDRAWAL REQUESTS */}
            {adminWalletSubTab === 'SELLER_WITHDRAWALS' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>قائمة طلبات سحب أرباح البائعين والمسوّقين (Seller Payout Requests)</span>
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">مراجعة وصرف أو رفض طلبات السحب المستلمة من لوحة البائع</p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setWithdrawalFilter(st)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer transition ${
                          withdrawalFilter === st
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        {st === 'ALL'
                          ? 'الكل'
                          : st === 'PENDING'
                          ? `⏳ بانتظار الموافقة (${withdrawals.filter((w) => w.status === 'PENDING').length})`
                          : st === 'APPROVED'
                          ? '✔ مقبولة ومصروفة'
                          : '✖ مرفوضة'}
                      </button>
                    ))}
                  </div>
                </div>

                {withdrawals.filter((w) => withdrawalFilter === 'ALL' || w.status === withdrawalFilter).length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-bold">
                    لا توجد طلبات سحب مطابقة لهذا الفلتر حالياً.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {withdrawals
                      .filter((w) => withdrawalFilter === 'ALL' || w.status === withdrawalFilter)
                      .map((w) => (
                        <div
                          key={w.id}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 text-xs hover:border-purple-300 dark:hover:border-purple-800 transition"
                        >
                          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-purple-600 dark:text-purple-400 font-black">{w.id}</span>
                              <button
                                onClick={() => {
                                  const sellerObj = sellers.find(
                                    (s) => s.fullName === w.sellerName || s.storeName === w.storeName
                                  ) || {
                                    id: w.sellerId || 'u-seller-' + w.id,
                                    fullName: w.sellerName,
                                    storeName: w.storeName,
                                    phone: w.phone || '0550000000',
                                    wilaya: '16 - الجزائر',
                                    rank: 'BRONZE',
                                    rankAr: 'المستوى البرونزي',
                                    rankFr: 'Niveau Bronze',
                                    kycStatus: 'APPROVED',
                                    avatarUrl:
                                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                                    totalOrdersCount: 10,
                                    deliveredOrdersCount: 8,
                                    totalEarnedDzd: w.amountDzd,
                                    joinDate: '2026-01-01',
                                  };
                                  handleEnterSellerDashboard(sellerObj);
                                }}
                                className="text-slate-900 dark:text-white font-extrabold hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer flex items-center gap-1 transition"
                                title="اضغط للدخول إلى لوحة هذا البائع"
                              >
                                <span>{w.sellerName} ({w.storeName})</span>
                                <Store className="w-3.5 h-3.5 text-violet-500" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  w.status === 'APPROVED'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                    : w.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {w.status === 'APPROVED' ? '✔ تم الصرف والتحويل' : w.status === 'PENDING' ? '⏳ بانتظار الصرف' : '✖ مرفوض ومسترجع'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold">المبلغ المطلوب:</span>
                              <span className="font-black text-purple-600 dark:text-purple-400 text-sm font-mono">
                                <MoneyText amount={w.amountDzd} />
                              </span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">وسيلة السحب: <strong className="text-slate-800 dark:text-slate-200">{w.method}</strong></span>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold">بيانات وتفاصيل الحساب:</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block text-xs">{w.accountDetails}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">الهاتف: {w.phone}</span>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold">تاريخ الطلب:</span>
                              <span className="font-mono text-slate-700 dark:text-slate-300 text-xs block">{w.requestDate}</span>
                              {w.proofReference && (
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono block mt-0.5">
                                  رقم الإثبات: <strong>{w.proofReference}</strong>
                                </span>
                              )}
                              {w.rejectionReason && (
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block mt-0.5">
                                  سبب الرفض: <strong>{w.rejectionReason}</strong>
                                </span>
                              )}
                            </div>
                          </div>

                          {w.status === 'PENDING' && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <div className="w-full sm:w-auto flex items-center gap-2">
                                <span className="text-[11px] text-slate-500 font-bold shrink-0">رقم إثبات التحويل (اختياري):</span>
                                <input
                                  type="text"
                                  placeholder="مثال: CCP-TRANS-9812"
                                  value={proofRefInput[w.id] || ''}
                                  onChange={(e) => setProofRefInput({ ...proofRefInput, [w.id]: e.target.value })}
                                  className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono w-full sm:w-48"
                                />
                              </div>

                              <div className="flex justify-end gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() => handleApproveWithdrawal(w.id)}
                                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer shadow-xs transition flex items-center gap-1.5"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>✔ موافقة وصرف الرصيد</span>
                                </button>

                                <button
                                  onClick={() => setRejectModalWithdrawalId(w.id)}
                                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-xs transition flex items-center gap-1.5"
                                >
                                  <X className="w-4 h-4" />
                                  <span>✖ رفض وإرجاع الرصيد</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB TAB 2: SUPPLIER SETTLEMENTS & DUES */}
            {adminWalletSubTab === 'SUPPLIER_SETTLEMENTS' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-600" />
                      <span>تحصيلات وتسويات مستحقات الموردين (Supplier Dues Ledger)</span>
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">مراجعة وتأكيد المبالغ والعمولات المسددة من قبل الموردين للآدمن</p>
                  </div>
                </div>

                {settlements.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-bold">
                    لا توجد عمليات تسديد أو تحصيلات مسجلة للموردين حالياً.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {settlements.map((st) => (
                      <div
                        key={st.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 text-xs"
                      >
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-purple-600 dark:text-purple-400 font-black">{st.id}</span>
                            <span className="text-slate-900 dark:text-white font-extrabold">{st.supplierName}</span>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              st.status === 'COMPLETED'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : st.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {st.status === 'COMPLETED' ? '✔ مقبول ومودع بالخزينة' : st.status === 'PENDING' ? '⏳ معلق بانتظار المراجعة' : '✖ مرفوض'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">المبلغ المسدد:</span>
                            <span className="font-black text-purple-600 dark:text-purple-400 text-sm font-mono">
                              <MoneyText amount={st.amountDzd} />
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">طريقة التحويل:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{st.payoutMethod || st.method || 'BaridiMob'}</span>
                            <span className="text-[10px] text-slate-500 font-mono block">{st.accountDetails}</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">رقم الحوالة/الإثبات:</span>
                            <span className="font-mono font-black text-purple-600 dark:text-purple-400 block text-xs">{st.referenceNumber}</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">التاريخ والملاحظات:</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300 block text-[11px]">{st.date}</span>
                            {st.notes && <p className="text-[10px] text-slate-500 italic mt-0.5">{st.notes}</p>}
                          </div>
                        </div>

                        {st.status === 'PENDING' && (
                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                              onClick={() => handleApproveSettlement(st.id)}
                              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer shadow-xs transition flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              <span>✔ تأكيد وإيداع بالخزينة</span>
                            </button>

                            <button
                              onClick={() => handleRejectSettlement(st.id)}
                              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-xs transition flex items-center gap-1.5"
                            >
                              <X className="w-4 h-4" />
                              <span>✖ رفض الإثبات</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* MODAL REJECT WITHDRAWAL */}
      {rejectModalWithdrawalId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100">
            <h3 className="text-sm font-black text-white">سبب رفض طلب السحب:</h3>
            <textarea
              rows={3}
              placeholder="اكتب سبب الرفض هنا..."
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalWithdrawalId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleRejectWithdrawalSubmit}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 5. EDIT INVENTORY & CLEAR LOCATIONS (مسح المخزون والاماكن) ---------------- */}
      {activeAdminTab === 'inventory' && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase">
            مسح المخزون، إخلاء أرفف المستودعات، والتحكم بالأماكن
          </h3>

          <div className="space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 text-xs"
              >
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-900 dark:text-white">{p.nameAr}</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    مخزون: {p.variants.reduce((acc, v) => acc + v.stockCount, 0)} قطعة
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">موقع المنتج بالرف:</span>
                  <input
                    type="text"
                    value={inventoryLocation[p.id] || 'المستودع الرئيسي - رف A1'}
                    onChange={(e) =>
                      setInventoryLocation({ ...inventoryLocation, [p.id]: e.target.value })
                    }
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-[11px] border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    onClick={() => onShowToast('تم تحديث موقع الرف بنجاح!')}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-[10px]"
                  >
                    حفظ الرف
                  </button>
                  <button
                    onClick={() => handleClearBinLocation(p.id)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-[10px]"
                  >
                    مسح المكان والرف
                  </button>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleClearProductStock(p.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح / تصفير مخزون المنتج بالكامل</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 6. CATEGORIES MANAGEMENT (إدارة الفئات والتصنيفات) ---------------- */}
      {activeAdminTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase">
                إدارة فئات وتصنيفات المنتجات ({categories.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-bold">
                الفئات المعروضة هنا تظهر تلقائياً في الشريط الأفقي لكتالوج المنتجات
              </p>
            </div>
            <button
              onClick={() => {
                setNewCategoryForm({
                  nameAr: '',
                  nameFr: '',
                  icon: '📦',
                  image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=300',
                  displayOrder: categories.length + 1,
                });
                setIsAddingCategoryModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ إضافة فئة وتصنيف جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border flex items-center justify-between text-xs font-bold transition ${
                  cat.visible !== false
                    ? 'border-slate-200/80 dark:border-slate-800 shadow-2xs'
                    : 'border-amber-300/60 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{cat.icon || '📦'}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="block text-slate-900 dark:text-white font-black text-sm">{cat.nameAr}</span>
                      {cat.visible === false && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 text-[10px] font-bold">
                          مخفي
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{cat.nameFr}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                    #{cat.displayOrder}
                  </span>

                  {/* Toggle Visibility */}
                  <button
                    onClick={() => {
                      updateCategory(cat.id, { visible: !cat.visible });
                      onShowToast(
                        cat.visible ? `تم إخفاء الفئة (${cat.nameAr})` : `تم إظهار الفئة (${cat.nameAr})`,
                        'info'
                      );
                    }}
                    title={cat.visible !== false ? 'إخفاء الفئة من الكتالوج' : 'إظهار الفئة في الكتالوج'}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    {cat.visible !== false ? (
                      <Eye className="w-4 h-4 text-purple-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-amber-500" />
                    )}
                  </button>

                  {/* Edit Category Button */}
                  <button
                    onClick={() => setEditingCategory({ ...cat })}
                    title="تعديل الفئة والتصنيف"
                    className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/50 text-purple-600 dark:text-purple-400 transition cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete Category Button */}
                  <button
                    onClick={() => setDeletingCategory(cat)}
                    title="حذف الفئة"
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {isAddingCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <FolderPlus className="w-4 h-4" />
                <span>إضافة تصنيف وفئة جديدة</span>
              </h3>
              <button
                onClick={() => setIsAddingCategoryModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">اسم الفئة بالعربية:</label>
                <input
                  type="text"
                  placeholder="مثال: أجهزة منزلية ذكية"
                  value={newCategoryForm.nameAr}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, nameAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">اسم الفئة بالفرنسية:</label>
                <input
                  type="text"
                  placeholder="Électroménager"
                  value={newCategoryForm.nameFr}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, nameFr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">الأيقونة (Emoji):</label>
                  <input
                    type="text"
                    value={newCategoryForm.icon}
                    onChange={(e) => setNewCategoryForm({ ...newCategoryForm, icon: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-center text-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">ترتيب العرض:</label>
                  <input
                    type="number"
                    value={newCategoryForm.displayOrder}
                    onChange={(e) => setNewCategoryForm({ ...newCategoryForm, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsAddingCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddCategorySubmit}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition cursor-pointer shadow-xs"
              >
                إضافة التصنيف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CATEGORY */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Edit3 className="w-4 h-4" />
                <span>تعديل الفئة والتصنيف</span>
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">اسم الفئة بالعربية:</label>
                <input
                  type="text"
                  value={editingCategory.nameAr}
                  onChange={(e) => setEditingCategory({ ...editingCategory, nameAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">اسم الفئة بالفرنسية:</label>
                <input
                  type="text"
                  value={editingCategory.nameFr}
                  onChange={(e) => setEditingCategory({ ...editingCategory, nameFr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">الأيقونة (Emoji):</label>
                  <input
                    type="text"
                    value={editingCategory.icon}
                    onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">ترتيب العرض:</label>
                  <input
                    type="number"
                    value={editingCategory.displayOrder}
                    onChange={(e) => setEditingCategory({ ...editingCategory, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCategory.visible !== false}
                    onChange={(e) => setEditingCategory({ ...editingCategory, visible: e.target.checked })}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                  <span>ظاهرة للبائعين في كتالوج المنتجات</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleEditCategorySubmit}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition cursor-pointer shadow-xs"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CATEGORY CONFIRMATION */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">حذف الفئة والتصنيف</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                هل أنت متأكد من رغبتك في حذف الفئة <strong className="text-rose-600 font-black">"{deletingCategory.nameAr}"</strong>؟
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingCategory(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteCategoryConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition cursor-pointer shadow-xs"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TELEGRAM PRODUCT IMPORTER */}
      {isTelegramModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto dir-rtl">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <Send className="w-5 h-5 rotate-45" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    أداة استيراد المنتجات من قناة التلغرام (Telegram Importer)
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-[10px] font-bold">ذكية ⚡</span>
                  </h3>
                  <p className="text-xs text-slate-500">انسخ المنشور من قناة التلغرام والصقه هنا، وسيتم استخراج العنونة والأسعار والوصف والصور تلقائياً!</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsTelegramModalOpen(false);
                  setParsedTelegramProduct(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  نص منشور التلغرام (Telegram Post Text):
                </label>
                <button
                  onClick={() => {
                    setTelegramRawText(`✨ سيروم لاروش بوزيه هيالورونيك B5 الأصلي ✨\n\n💙 سيروم مرطب ومجدد للبشرة يعيد إليها مرونتها وحيويتها.\n💰 سعر الجملة: 3200 دج\n💰 السعر المقترح للبيع: 4500 دج\n\n✅ مميزات المنتج:\n- ترطيب عميق ومقاومة للتجاعيد\n- تركيبة غنية بـ Hyaluronic Acid و B5\n- مناسب لجميع أنواع البشرة حتى الحساسة\n\n🚚 التوصيل 69 ولاية متوفر`);
                    setTelegramImageUrl('https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6929.png?v=1785197156');
                  }}
                  className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>⚡ تجربة مثال منشور من التلغرام</span>
                </button>
              </div>

              <textarea
                value={telegramRawText}
                onChange={(e) => setTelegramRawText(e.target.value)}
                rows={6}
                placeholder={`انسخ المنشور من التلغرام والصقه هنا، مثال:\n\n✨ سيروم سيراف للوجه ✨\nسعر الجملة: 2500 دج\nسعر البيع المقترح: 3600 دج\n- ترطيب عميق وتفتيح للبشرة\n- توصيل لـ 69 ولاية...`}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رابط صورة المنتج (أو اتركه فارغاً لاستخراج الصور من المنشور تلقائياً):
                </label>
                <input
                  type="url"
                  value={telegramImageUrl}
                  onChange={(e) => setTelegramImageUrl(e.target.value)}
                  placeholder="https://cdn.shopify.com/... أو رابط الصورة المرفقة مع منشور التلغرام"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                onClick={handleParseTelegramText}
                className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>تحليل المنشور واستخراج بيانات المنتج</span>
              </button>
            </div>

            {/* PREVIEW PARSED PRODUCT CARD */}
            {parsedTelegramProduct && (
              <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                  <span className="text-xs font-black text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                    معاينة المنتج قبل إضافته للكتالوج:
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">جاهز للإضافة بنقرة واحدة</span>
                </div>

                <div className="flex gap-4 items-start">
                  <img
                    src={parsedTelegramProduct.images?.[0]}
                    alt={parsedTelegramProduct.nameAr}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={parsedTelegramProduct.nameAr || ''}
                      onChange={(e) => setParsedTelegramProduct({ ...parsedTelegramProduct, nameAr: e.target.value, nameFr: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-white"
                    />

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold">التصنيف:</span>
                        <select
                          value={parsedTelegramProduct.categoryAr || ''}
                          onChange={(e) => {
                            const c = categories.find((cat) => cat.nameAr === e.target.value);
                            setParsedTelegramProduct({
                              ...parsedTelegramProduct,
                              categoryAr: e.target.value,
                              categoryFr: c?.nameFr || e.target.value,
                            });
                          }}
                          className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white cursor-pointer"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.nameAr}>
                              {cat.icon} {cat.nameAr}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold">سعر الجملة (DZD):</span>
                        <input
                          type="number"
                          value={parsedTelegramProduct.wholesalePrice || 0}
                          onChange={(e) => setParsedTelegramProduct({ ...parsedTelegramProduct, wholesalePrice: Number(e.target.value) })}
                          className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-purple-600"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold">السعر المقترح (DZD):</span>
                        <input
                          type="number"
                          value={parsedTelegramProduct.suggestedSellingPrice || 0}
                          onChange={(e) => setParsedTelegramProduct({ ...parsedTelegramProduct, suggestedSellingPrice: Number(e.target.value) })}
                          className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-purple-600"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {parsedTelegramProduct.descriptionAr}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-500/20">
                  <button
                    onClick={() => setParsedTelegramProduct(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
                  >
                    إلغاء المعاينة
                  </button>
                  <button
                    onClick={handleConfirmTelegramProduct}
                    className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>تأكيد إضافة المنتج لـ NouvaMarket</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsTelegramModalOpen(false);
                  setParsedTelegramProduct(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                إغلاق الأداة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 7. COURIERS API (اضافة شركات التوصيل api) ---------------- */}
      {activeAdminTab === 'couriers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase">
              مفاتيح الـ API وربط شركات التوصيل (Yalidine / Maystro / ZR / Nord&Sud)
            </h3>
            <button
              onClick={() => setIsAddingCourierModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ إضافة شركة توصيل جديدة</span>
            </button>
          </div>

          <div className="space-y-3">
            {couriers.map((c) => (
              <div
                key={c.id}
                className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border shadow-xs space-y-3.5 text-xs transition ${
                  c.isDisabled
                    ? 'border-amber-300 dark:border-amber-800/60 bg-amber-500/5 opacity-80'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-2xl ${c.isDisabled ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'}`}>
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{c.name}</span>
                        {c.isDisabled ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold text-[10px]">
                            🚫 معطلة (موقوفة)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-extrabold text-[10px]">
                            ✓ مفعّلة وشغالة
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-slate-400">سعر الشحن الأساسي: {c.baseShippingFee} دج | التغطية: {c.supportedWilayasCount} ولاية</span>
                    </div>
                  </div>

                  {/* Actions & Status Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCouriers((prev) =>
                          prev.map((x) =>
                            x.id === c.id
                              ? {
                                  ...x,
                                  connectionStatus: x.connectionStatus === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED',
                                }
                              : x
                          )
                        );
                        onShowToast('تم تحديث حالة اتصال الـ API!');
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition ${
                        c.connectionStatus === 'CONNECTED'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200'
                      }`}
                    >
                      {c.connectionStatus === 'CONNECTED' ? '● API متصل' : '○ غير متصل'}
                    </button>

                    {/* Disable / Enable Button */}
                    <button
                      onClick={() => handleToggleDisableCourier(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                        c.isDisabled
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-xs'
                          : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      }`}
                      title={c.isDisabled ? 'تفعيل الشركة' : 'تعطيل الشركة'}
                    >
                      <span>{c.isDisabled ? 'تفعيل الشركة ⚡' : 'تعطيل الشركة ⏸'}</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت تأكد من رغبتك في حذف شركة التوصيل (${c.name})؟`)) {
                          handleDeleteCourier(c.id);
                        }
                      }}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="حذف شركة التوصيل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-bold">API Key (مفتاح الربط):</label>
                    <input
                      type="text"
                      disabled={c.isDisabled}
                      value={c.apiKey}
                      onChange={(e) =>
                        setCouriers((prev) =>
                          prev.map((x) => (x.id === c.id ? { ...x, apiKey: e.target.value } : x))
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white font-bold disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-bold">API Secret / Token:</label>
                    <input
                      type="text"
                      disabled={c.isDisabled}
                      value={c.apiSecret}
                      onChange={(e) =>
                        setCouriers((prev) =>
                          prev.map((x) => (x.id === c.id ? { ...x, apiSecret: e.target.value } : x))
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white font-bold disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD COURIER */}
      {isAddingCourierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-400" />
              <span>إضافة وتوصيل شركة توصيل جديدة (API)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">اسم شركة التوصيل:</label>
                <input
                  type="text"
                  placeholder="مثال: Nord & Sud Express"
                  value={newCourierForm.name}
                  onChange={(e) => setNewCourierForm({ ...newCourierForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">API Key:</label>
                  <input
                    type="text"
                    value={newCourierForm.apiKey}
                    onChange={(e) => setNewCourierForm({ ...newCourierForm, apiKey: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">API Secret:</label>
                  <input
                    type="text"
                    value={newCourierForm.apiSecret}
                    onChange={(e) => setNewCourierForm({ ...newCourierForm, apiSecret: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsAddingCourierModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddCourierSubmit}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white font-black text-xs"
              >
                ربط وتفعيل الـ API
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 8. SUPPLIERS SYSTEM MANAGEMENT ---------------- */}
      {activeAdminTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-xs text-purple-900 dark:text-purple-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600 shrink-0" />
              <span>
                <strong>نظام إدارة الموردين (Supplier System):</strong> التحكم في طلبات انضمام الموردين، اعتماد المنتجات الجديدة، ضبط عمولات Nouva Market، وتحويل المستحقات والتحويلات المالية.
              </span>
            </div>
          </div>

          {/* SECTION A: Marketplace Fee Settings Card */}
          <form onSubmit={handleSaveFeeSettings} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-purple-600" />
                  <span>إعدادات عمولة منصة Nouva Market ومربح المورد</span>
                </h3>
                <p className="text-xs text-slate-500">تطبيق عمولة تلقائية على سعر النيت الصافي للمورد لحساب سعر بيع الجملة للمسوقين</p>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ نسبة العمولة</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">نسبة عمولة منصة نوفا ماركت التلقائية (Nouva Fee %):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={feeSettings.defaultSupplierFeePercent}
                    onChange={(e) =>
                      setFeeSettings({ ...feeSettings, defaultSupplierFeePercent: Number(e.target.value) })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm text-purple-600 font-black"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">%</span>
                </div>
                <p className="text-[10px] text-slate-400">مثال: إذا أدخل المورد سعر النيت = 3,000 دج والعمولة 12%، يظهر للبائع سعر الجملة = 3,360 دج (ربح المنصة = 360 دج).</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">نسبة هامش ربح المسوق المقترح التلقائي (%):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={feeSettings.defaultResellerCommissionPercent}
                    onChange={(e) =>
                      setFeeSettings({ ...feeSettings, defaultResellerCommissionPercent: Number(e.target.value) })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm text-purple-600 font-black"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">%</span>
                </div>
                <p className="text-[10px] text-slate-400">تستخدم لاقتراح سعر البيع النهائي للزبون في متجر المسوق.</p>
              </div>
            </div>
          </form>

          {/* SECTION B: Supplier Approvals & List */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>طلبات الانضمام والموردين المسجلين ({supplierList.length})</span>
                </h3>
                <p className="text-xs text-slate-500">قبول، رفض أو تعليق حسابات الموردين والمستودعات</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsAddSupplierModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة مورد جديد</span>
                </button>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setSupplierFilter(st)}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        supplierFilter === st
                          ? 'bg-purple-600 text-white font-black shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {st === 'ALL'
                        ? 'الكل'
                        : st === 'PENDING'
                        ? '⏳ قيد المراجعة'
                        : st === 'APPROVED'
                        ? '✔ معتمدين'
                        : '⛔ معلقين'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {supplierList
                .filter((s) => supplierFilter === 'ALL' || s.status === supplierFilter)
                .map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{s.companyName}</span>
                            <span className="text-slate-400 text-xs font-normal">({s.fullName})</span>
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">{s.email} | {s.phone} | {s.wilaya}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            s.status === 'APPROVED'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : s.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {s.status === 'APPROVED' ? '✔ معتمد' : s.status === 'PENDING' ? '⏳ قيد المراجعة' : '⛔ معلق'}
                        </span>

                        {/* Enter Supplier Dashboard button */}
                        <button
                          onClick={() => handleEnterSupplierDashboard(s)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          title="الدخول المباشر لداشبورد هذا المورد"
                        >
                          <WarehouseIcon className="w-3.5 h-3.5" />
                          <span>دخول حساب المورد 🏭</span>
                        </button>

                        {/* WhatsApp Direct Link */}
                        <a
                          href={getWhatsAppUrl(
                            s.phone,
                            `مرحباً ${s.companyName || s.fullName}، نحييك من إدارة منصة Nouva بشأن حساب المورد الخاص بك.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          title="مراسلة المورد مباشرة عبر الواتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب</span>
                        </a>

                        {s.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateSupplierStatus(s.id, 'APPROVED')}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] shadow-xs cursor-pointer"
                            >
                              قبول المورد ✔
                            </button>
                            <button
                              onClick={() => handleUpdateSupplierStatus(s.id, 'REJECTED')}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] shadow-xs cursor-pointer"
                            >
                              رفض ✖
                            </button>
                          </>
                        )}

                        {s.status === 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateSupplierStatus(s.id, 'SUSPENDED')}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 font-black text-[11px] cursor-pointer"
                          >
                            تعليق الحساب ⛔
                          </button>
                        )}

                        {s.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleUpdateSupplierStatus(s.id, 'APPROVED')}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] cursor-pointer"
                          >
                            إعادة التفعيل ⚡
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedSupplierForSettlement(s);
                            setIsSettlementModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] cursor-pointer"
                        >
                          تسوية أرصدة 💰
                        </button>

                        <button
                          onClick={() => handleDeleteSupplier(s.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="حذف حساب المورد نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold">
                      <div>
                        <span className="text-slate-400 block text-[10px]">مجال النشاط:</span>
                        <span className="text-slate-800 dark:text-slate-200">{s.activityType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">CCP / RIP / BaridiMob:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{s.ccpOrRip || 'غير مدخل'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">إجمالي المبيعات (Delivered):</span>
                        <span className="font-mono text-purple-600 font-black">
                          <MoneyText amount={s.totalSalesDzd || 0} />
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">المبلغ المتبقي للسدد:</span>
                        <span className="font-mono text-amber-600 font-black">
                          <MoneyText amount={s.remainingBalanceDzd || 0} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* SECTION C: Supplier Pending Products Approvals Queue */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <span>طابور موافقة المنتجات المضافة من الموردين (Product Approvals)</span>
              </h3>
              <p className="text-xs text-slate-500">لا تظهر منتجات الموردين في الكتالوج العام للمسوقين إلا بعد مراجعتها وقبولها من الأدمن</p>
            </div>

            <div className="space-y-3">
              {products.filter((p) => p.approvalStatus === 'PENDING').length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-bold">
                  ✔ لا توجد منتجات قيد المراجعة حالياً. جميع منتجات الموردين معتمدة أو تمت مراجعتها!
                </div>
              ) : (
                products
                  .filter((p) => p.approvalStatus === 'PENDING')
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0]}
                          alt={p.nameAr}
                          className="w-12 h-12 rounded-xl object-cover border border-amber-200"
                        />
                        <div>
                          <h4 className="font-black text-sm text-slate-900 dark:text-white">{p.nameAr}</h4>
                          <span className="text-[10px] text-slate-400 block font-bold">
                            المورد: {p.supplierName || 'مورد الجزائر'} | الفئة: {p.categoryNameAr}
                          </span>
                          <div className="flex items-center gap-3 mt-1 font-mono">
                            <span className="text-slate-600 dark:text-slate-300">
                              سعر النيت: <MoneyText amount={p.supplierNetPrice || p.wholesalePrice} />
                            </span>
                            <span className="text-purple-600 font-black">
                              سعر الجملة للمسوق: <MoneyText amount={p.wholesalePrice} />
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveProduct(p.id)}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          <span>قبول ونشر بالكتالوج</span>
                        </button>
                        <button
                          onClick={() => handleRejectProduct(p.id)}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          <span>رفض المنتج</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SUPPLIER SETTLEMENT */}
      {isSettlementModalOpen && selectedSupplierForSettlement && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <form
            onSubmit={handleCreateSettlementSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 text-right"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-600" />
                <span>تسجيل تسوية مالية للمورد ({selectedSupplierForSettlement.companyName})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSettlementModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-400 block">المبلغ المتبقي المستحق للمورد حالياً:</span>
                <span className="text-base font-mono font-black text-amber-600">
                  <MoneyText amount={selectedSupplierForSettlement.remainingBalanceDzd || 0} />
                </span>
                <span className="text-[10px] text-slate-400 block">حساب CCP/BaridiMob: {selectedSupplierForSettlement.ccpOrRip || 'غير محدد'}</span>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">المبلغ المراد تحويله وتأكيده (DZD): *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(Number(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm font-black text-purple-600"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">طريقة التحويل الدفع: *</label>
                <select
                  value={settlementMethod}
                  onChange={(e) => setSettlementMethod(e.target.value as any)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="CCP">تحويل بريدي CCP</option>
                  <option value="BARIDIMOB">تطبيق بريدي موب BaridiMob</option>
                  <option value="BANK">تحويل بنكي</option>
                  <option value="CASH">تسليم نقدي بالمستودع</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">رقم الحوالة المرجعي / الملاحظة (Ref / Note):</label>
                <input
                  type="text"
                  placeholder="مثال: حوالة بريدية رقم 8871239"
                  value={settlementNote}
                  onChange={(e) => setSettlementNote(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSettlementModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer shadow-md"
              >
                تأكيد وتسجيل التسوية 💰
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD SUPPLIER MODAL */}
      {isAddSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex justify-center items-center p-4 animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    إضافة وتسجيل مورد جديد (Supplier Registration)
                  </h3>
                  <p className="text-[11px] text-slate-500">أدخل بيانات المورد كاملة لإضافته مباشرة إلى حسابات المنصة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSupplierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-3.5 text-xs">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">البريد الإلكتروني للحساب *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
                  <input
                    type="email"
                    required
                    value={newSupplierForm.email}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, email: e.target.value })}
                    placeholder="supplier@domain.com"
                    className="w-full py-2.5 pr-10 pl-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition font-mono"
                  />
                </div>
              </div>

              {/* Full Name & Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={newSupplierForm.fullName}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, fullName: e.target.value })}
                    placeholder="مثال: توفيق بوعلام"
                    className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">اسم الشركة أو المستودع *</label>
                  <div className="relative">
                    <Package className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
                    <input
                      type="text"
                      required
                      value={newSupplierForm.companyName}
                      onChange={(e) => setNewSupplierForm({ ...newSupplierForm, companyName: e.target.value })}
                      placeholder="مثال: مستودع الأوراس للألبسة"
                      className="w-full py-2.5 pr-10 pl-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>
              </div>



              {/* Phone & Wilaya */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">رقم الواتساب *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
                    <input
                      type="tel"
                      required
                      value={newSupplierForm.phone}
                      onChange={(e) => setNewSupplierForm({ ...newSupplierForm, phone: e.target.value })}
                      placeholder="0550123456"
                      className="w-full py-2.5 pr-10 pl-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">الولاية *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5 pointer-events-none" />
                    <select
                      value={newSupplierForm.wilaya}
                      onChange={(e) => setNewSupplierForm({ ...newSupplierForm, wilaya: e.target.value })}
                      className="w-full py-2.5 pr-10 pl-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition"
                    >
                      {ALGERIA_WILAYAS.map((w) => (
                        <option key={w.code} value={w.nameAr}>
                          {w.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">كلمة المرور *</label>
                  <input
                    type="password"
                    required
                    value={newSupplierForm.password}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, password: e.target.value })}
                    placeholder="كلمة مرور الحساب"
                    className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">تأكيد كلمة المرور *</label>
                  <input
                    type="password"
                    required
                    value={newSupplierForm.confirmPassword}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, confirmPassword: e.target.value })}
                    placeholder="تأكيد كلمة المرور"
                    className={`w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
                      newSupplierForm.confirmPassword && newSupplierForm.confirmPassword !== newSupplierForm.password
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-purple-500'
                    }`}
                  />
                </div>
              </div>

              {/* Initial Status Selection */}
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 rounded-2xl space-y-1.5">
                <label className="text-xs font-extrabold text-purple-900 dark:text-purple-200 block">
                  حالة المورد المبدئية عند التسجيل:
                </label>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="initialStatus"
                      value="APPROVED"
                      checked={newSupplierForm.initialStatus === 'APPROVED'}
                      onChange={() => setNewSupplierForm({ ...newSupplierForm, initialStatus: 'APPROVED' })}
                      className="accent-purple-600"
                    />
                    <span className="text-purple-700 dark:text-purple-400 font-extrabold">✔ معتمد ومفعل فوراً (APPROVED)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="initialStatus"
                      value="PENDING"
                      checked={newSupplierForm.initialStatus === 'PENDING'}
                      onChange={() => setNewSupplierForm({ ...newSupplierForm, initialStatus: 'PENDING' })}
                      className="accent-purple-600"
                    />
                    <span className="text-amber-700 dark:text-amber-400 font-extrabold">⏳ قيد المراجعة (PENDING)</span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer shadow-md transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إضافة وتسجيل المورد 🚀</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- 9. COUPONS ---------------- */}
      {activeAdminTab === 'coupons' && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase">
            إدارة كوبونات الخصم والعروض
          </h3>

          <div className="space-y-2">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-bold"
              >
                <div>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-black text-sm block">
                    {c.code}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    خصم: {c.discountValue} {c.discountType === 'PERCENT' ? '%' : 'دج'}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px]">
                  مُستعمل: {c.usedCount}/{c.usageLimit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 10. ROLES & PERMISSIONS (الأدوار والصلاحيات اضافة) ---------------- */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase">
              إدارة مستخدمي النظام، الأدوار والصلاحيات (Admin / Warehouse / Support)
            </h3>
            <button
              onClick={() => setIsAddingUserModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>+ إضافة مستخدم / دور جديد</span>
            </button>
          </div>

          <div className="space-y-3">
            {systemUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex justify-between items-center text-xs"
              >
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm">{u.fullName}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{u.email}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold text-[9px]">
                      دور: {u.role}
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black">
                  نشط
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD USER & ROLE */}
      {isAddingUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-400" />
              <span>تعيين مستخدم جديد وتحديد الصلاحيات</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  placeholder="اسم المستخدم"
                  value={newUserForm.fullName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  placeholder="user@nouvamarket.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">الدور الوظيفي:</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, role: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                >
                  <option value="ADMIN">أدمن كامل الصلاحيات</option>
                  <option value="WAREHOUSE">مسؤول مستودع</option>
                  <option value="FINANCE_MANAGER">مدير المحفظة والمالية</option>
                  <option value="RESELLER_SUPPORT">الدعم الفني للبائعين</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsAddingUserModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddUserSubmit}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white font-black text-xs"
              >
                إضافة وتأكيد الدور
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 11. SETTINGS ---------------- */}
      {activeAdminTab === 'settings' && (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">إعدادات المنصة الأساسية</h3>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">اسم المنصة:</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">العملة الرئسية:</label>
              <input
                type="text"
                value={currencyName}
                onChange={(e) => setCurrencyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <button
              onClick={() => onShowToast('✔ تم حفظ إعدادات المنصة بنجاح!')}
              className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-black shadow-md"
            >
              حفظ الإعدادات
            </button>
          </div>
        </div>
      )}

      {/* ---------------- 12. NOTIFICATIONS & BROADCAST SERVICE ---------------- */}
      {activeAdminTab === 'notifications' && (
        <div className="space-y-4 text-xs">
          {/* Header Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-violet-950 via-purple-950 to-slate-950 border border-violet-800 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-violet-600/30 border border-violet-500/40 text-violet-300">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>خدمة الإشعارات والتنبيهات والبث المباشر (Notification Service)</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                    Tone & Broadcast
                  </span>
                </h3>
                <p className="text-[11px] text-violet-200/80">
                  إرسال إشعارات فورية مع نغمة تنبيه صوتية لجميع البائعين أو فريق الأدمن والإدارة.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => playNotificationTone()}
                className="px-3 py-2 rounded-xl bg-violet-600/40 hover:bg-violet-600/60 border border-violet-500/50 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Music className="w-3.5 h-3.5 text-violet-300" />
                <span>اختبار نغمة التنبيه</span>
              </button>
              <button
                onClick={() => setIsAdminNotifModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>إشعارات الأدمن ({adminUnreadCount})</span>
              </button>
            </div>
          </div>

          {/* Broadcast Notification Form */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <span>📢 إنشاء وبث إشعار فوري جديد (Broadcast)</span>
              </h4>
              <span className="text-[10px] text-slate-400">يُصدر نغمة تنبيه فورية للمستلم</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  الجمهور المستهدف (Recipient Role):
                </label>
                <select
                  value={broadcastRole}
                  onChange={(e) => setBroadcastRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="seller">🛍️ جميع البائعين والمسوقين (Sellers)</option>
                  <option value="admin">🛡️ طاقم الأدمن والإدارة (Admins)</option>
                  <option value="all">🌐 الجميع - كافة مستخدمي المنصة (Broadcast All)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  نوع الإشعار (Notification Type):
                </label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="system">⚙️ تنبيه نظام عام (System Alert)</option>
                  <option value="product_add">🔥 وصل منتج جديد (Product Add)</option>
                  <option value="stock_update">📦 تجديد المخزون (Stock Update)</option>
                  <option value="wallet">💰 المحفظة والأرباح (Wallet)</option>
                  <option value="reward">🌟 جوائز وبونص (Reward / Bonus)</option>
                  <option value="order">🛒 الطلبيات والتوصيل (Order Alert)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                عنوان التنبيه والإشعار (العربية):
              </label>
              <input
                type="text"
                placeholder="مثال: وصول سلعة جديدة بفرصة أرباح عالية! 🔥"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                نص ومحتوى الرسالة والتفاصيل:
              </label>
              <textarea
                rows={3}
                placeholder="تفاصيل الإشعار الذي سيظهر للبائعين في مركز التنبيهات..."
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500">
                سيصل هذا الإشعار فوراً مع نغمة صوتية مرئية في جرس التنبيهات.
              </span>
              <button
                onClick={handleSendBroadcast}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition"
              >
                <Send className="w-4 h-4" />
                <span>إرسال وبث التنبيه الفوري 📢</span>
              </button>
            </div>
          </div>

          {/* SMS & Delivery Templates */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h4 className="text-xs font-black text-slate-900 dark:text-white">قوالب إشعارات الرسائل والـ SMS والواتساب التلقائية</h4>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">قالب رسالة SMS للتوصيل:</label>
                <textarea
                  rows={2}
                  value={smsTemplate}
                  onChange={(e) => setSmsTemplate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <button
                onClick={() => onShowToast('✔ تم حفظ قوالب الإشعارات بنجاح!')}
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-black shadow-md cursor-pointer"
              >
                حفظ القوالب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 13. REWARDS & GAMIFICATION (تعديل مستويات الجوائز والبونص للبائعين) ---------------- */}
      {activeAdminTab === 'rewards' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>إدارة وتعديل مستويات الجوائز والبونص للبائعين والمسوّقين</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                يمكنك التعديل على جميع تفاصيل مستويات الجوائز (اسم المستوى، عدد الطلبات المسلمة المطلوبة، البونص المالي، الشارة والمزايا).
              </p>
            </div>
            <button
              onClick={handleOpenAddRank}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة مستوى جوائز جديد 🌟</span>
            </button>
          </div>

          {/* Ranks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {rewardRanks
              .sort((a, b) => a.requiredOrders - b.requiredOrders)
              .map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    {/* Level Badge Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${r.color || 'from-amber-400 to-yellow-600'} text-white font-black flex items-center justify-center text-xl shadow-md`}
                        >
                          {r.badgeIcon || '🌟'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{r.nameAr}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({r.nameFr})</span>
                          </h4>
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-black text-[11px] mt-0.5">
                            المطلوب: {r.requiredOrders} طلبية مسلمة
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bonus details & cash bonus */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">تفاصيل المكافأة للبائع:</span>
                        {r.cashBonusAmount ? (
                          <span className="font-black text-purple-600 dark:text-purple-400 text-xs">
                            +{r.cashBonusAmount} دج بونص مباشر
                          </span>
                        ) : null}
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{r.bonus}</p>

                      {r.perksAr && r.perksAr.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                          <span className="text-[10px] text-slate-400 block font-bold">المزايا والإيجابيات:</span>
                          <div className="flex flex-wrap gap-1">
                            {r.perksAr.map((perk, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold border border-slate-200/60 dark:border-slate-600"
                              >
                                ✓ {perk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <button
                      onClick={() => handleOpenEditRank(r)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-purple-500" />
                      <span>تعديل تفاصيل المستوى</span>
                    </button>
                    {rewardRanks.length > 1 && (
                      <button
                        onClick={() => handleDeleteRank(r.id)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="حذف المستوى"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODAL EDIT / CREATE REWARD RANK */}
      {(editingRank || isAddingRankModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>{editingRank ? `تعديل تفاصيل (${editingRank.nameAr})` : 'إضافة مستوى جوائز جديد'}</span>
              </h3>
              <button
                onClick={() => {
                  setEditingRank(null);
                  setIsAddingRankModalOpen(false);
                }}
                className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    اسم المستوى بالعربية:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: المستوى الفضي"
                    value={rankForm.nameAr || ''}
                    onChange={(e) => setRankForm({ ...rankForm, nameAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    اسم المستوى بالفرنسية:
                  </label>
                  <input
                    type="text"
                    placeholder="Silver"
                    value={rankForm.nameFr || ''}
                    onChange={(e) => setRankForm({ ...rankForm, nameFr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    عدد الطلبات المسلمة المطلوبة:
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="10"
                    value={rankForm.requiredOrders !== undefined ? rankForm.requiredOrders : ''}
                    onChange={(e) => setRankForm({ ...rankForm, requiredOrders: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    مبلغ البونص المالي المباشر (دج):
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="200"
                    value={rankForm.cashBonusAmount !== undefined ? rankForm.cashBonusAmount : ''}
                    onChange={(e) => setRankForm({ ...rankForm, cashBonusAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-purple-600 dark:text-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  توصيف البونص والمكافأة (يظهر للمسوق):
                </label>
                <input
                  type="text"
                  placeholder="مثال: +200دج بونص على كل 5 طلبات جديدة"
                  value={rankForm.bonus || ''}
                  onChange={(e) => setRankForm({ ...rankForm, bonus: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    أيقونة / رمز الشارة:
                  </label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      placeholder="🥇"
                      value={rankForm.badgeIcon || ''}
                      onChange={(e) => setRankForm({ ...rankForm, badgeIcon: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-center text-lg"
                    />
                    <div className="flex gap-1">
                      {['🥉', '🥈', '🥇', '💎', '🏆', '🚀', '⚡'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setRankForm({ ...rankForm, badgeIcon: emoji })}
                          className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-sm cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    تدرج لون خلفية الرمز:
                  </label>
                  <select
                    value={rankForm.color || 'from-amber-400 to-yellow-600'}
                    onChange={(e) => setRankForm({ ...rankForm, color: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="from-amber-700 to-amber-900">برونزي (Bronze)</option>
                    <option value="from-slate-400 to-slate-600">فضي (Silver)</option>
                    <option value="from-amber-400 to-yellow-600">ذهبي (Gold)</option>
                    <option value="from-cyan-400 to-blue-600">ماسي / بلاتيني (Diamond)</option>
                    <option value="from-purple-500 to-purple-600">بنفسجي فاخر (Royal Purple)</option>
                    <option value="from-purple-500 to-purple-700">زمردي (Emerald Green)</option>
                    <option value="from-rose-500 to-red-600">ياقوتي (Ruby Red)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  المزايا والخصائص الإضافية (ميزة في كل سطر):
                </label>
                <textarea
                  rows={3}
                  placeholder={'عمولة بيع ممتازة\nأولوية الشحن والتوصيل\nدعم فني خاص'}
                  value={
                    Array.isArray(rankForm.perksAr)
                      ? rankForm.perksAr.join('\n')
                      : rankForm.perksAr || ''
                  }
                  onChange={(e) => setRankForm({ ...rankForm, perksAr: e.target.value.split('\n') })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingRank(null);
                  setIsAddingRankModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveRankSubmit}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
              >
                ✔ حفظ وتحديث المستوى
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN NOTIFICATIONS MODAL */}
      {isAdminNotifModalOpen && (
        <NotificationsModal
          role="admin"
          onClose={() => setIsAdminNotifModalOpen(false)}
        />
      )}

      {/* LOW STOCK REPLENISHMENT MODAL */}
      {isLowStockModalOpen && (
        <LowStockModal
          products={products}
          onClose={() => setIsLowStockModalOpen(false)}
          onProductsUpdated={(updated) => setProducts(updated)}
          onShowToast={onShowToast}
        />
      )}

      {/* URL MULTI-PRODUCT IMPORT MODAL */}
      <ProductUrlImportModal
        isOpen={isUrlImportModalOpen}
        onClose={() => setIsUrlImportModalOpen(false)}
        onImportProducts={(newProducts) => {
          setProducts((prev) => {
            const updated = [...newProducts, ...prev];
            saveStoredProducts(updated);
            return updated;
          });
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
}
