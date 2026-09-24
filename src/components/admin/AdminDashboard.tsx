import React, { useState, useEffect, useMemo } from 'react';
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
  CheckCheck,
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
  PhoneCall,
  MessageCircle,
  MapPin,
  ShieldAlert,
  Link as LinkIcon,
  Sparkles,
  Bot,
  RotateCcw,
  Coins,
  ChevronRight,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { AdminAiProviderSettings } from './AdminAiProviderSettings';
import { ProductUrlImportModal } from '../common/ProductUrlImportModal';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCategories } from '../../context/CategoryContext';
import { MOCK_PRODUCTS, getStoredProducts, saveStoredProducts, deleteStoredProduct, syncProductsWithServer } from '../../data/mockProducts';
import { Product, Order, UserProfile, WalletTransaction, CategoryItem, SupplierProfile, SupplierSettlement, MarketplaceFeeSettings, SystemUser, SystemUserRole } from '../../types';
import {
  getStoredSystemUsers,
  addSystemUser,
  updateSystemUser,
  deleteSystemUser,
} from '../../lib/systemUserHelper';
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
  updateSupplierPassword,
  updateSupplierProfile,
  zeroSettlementAmount,
  zeroAllSettlementsAmounts,
  clearAllSettlements,
  syncSuppliersWithServer,
  deleteStoredSettlement,
  syncSettlementsWithServer,
} from '../../lib/supplierHelper';
import {
  getStoredSellers,
  saveStoredSellers,
  addSellerRegistration,
  updateSellerStatus,
  deleteSellerRegistration,
  getWhatsAppUrl,
  ExtendedSeller,
  updateSellerPassword,
  updateSellerProfile,
  syncSellersWithServer,
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
import { AdminConfirmersAuditTab } from './AdminConfirmersAuditTab';
import { AdminVerticalSidebar } from './AdminVerticalSidebar';

interface AdminDashboardProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSwitchToSellerDashboard?: (seller: UserProfile) => void;
  onImpersonateSupplier?: (supplier: any) => void;
  onSwitchToConfirmerDashboard?: (confirmer?: any) => void;
}

// ---------------------- TYPES & INITIAL DATA ----------------------

type AdminTabKey =
  | 'products'
  | 'approvals'
  | 'sellers'
  | 'wallet'
  | 'inventory'
  | 'couriers'
  | 'suppliers'
  | 'categories'
  | 'coupons'
  | 'rewards'
  | 'users'
  | 'confirmers'
  | 'notifications'
  | 'ai_provider'
  | 'settings';

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
  zeroWithdrawalAmount,
  zeroWithdrawalAmountsByStatus,
  zeroAllWithdrawals,
  clearAllWithdrawals,
  deleteWithdrawalRequest,
  syncWithdrawalsWithServer,
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



// ---------------------- COMPONENT MAIN ----------------------

export function AdminDashboard({
  onShowToast,
  onSwitchToSellerDashboard,
  onImpersonateSupplier,
  onSwitchToConfirmerDashboard,
}: AdminDashboardProps) {
  const { orders, confirmAndShipOrder, updateOrder } = useOrders();
  const { switchUser } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabKey>('products');

  // Vertical Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nouva_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => isNotificationSoundEnabled());

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    setNotificationSoundEnabled(nextState);
    if (nextState) {
      playNotificationTone();
    }
  };

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nouva_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const getCurrentTabTitle = (tab: AdminTabKey) => {
    switch (tab) {
      case 'approvals': return 'طلبات الانضمام والاعتماد الفوري';
      case 'products': return 'كتالوج وإدارة المنتجات';
      case 'sellers': return 'شبكة البائعين والمسوقين';
      case 'suppliers': return 'الموردين والمستودعات';
      case 'confirmers': return 'مؤكدو الطلبيات (المراقبة)';
      case 'couriers': return 'شركات التوصيل وربط API';
      case 'wallet': return 'الخزينة وسحوبات الأموال';
      case 'inventory': return 'المخزون وتنبيهات النفاذ';
      case 'categories': return 'فئات وتصنيفات المنتجات';
      case 'coupons': return 'الكوبونات والخصومات';
      case 'rewards': return 'رتب ومكافآت المسوقين';
      case 'users': return 'المستخدمين والصلاحيات';
      case 'notifications': return 'سجل إشعارات الإدارة';
      case 'ai_provider': return 'مزود الذكاء الاصطناعي (Gemini)';
      case 'settings': return 'إعدادات المنصة العامة';
      default: return 'لوحة الإدارة';
    }
  };

  const getCurrentTabSubtitle = (tab: AdminTabKey) => {
    switch (tab) {
      case 'approvals': return 'مراجعة واعتماد طلبات تسجيل البائعين والموردين الجدد في الوقت الفعلي';
      case 'products': return 'تعديل الأسعار والكميات والمخزون الحي والصور واستيراد المنتجات';
      case 'sellers': return 'إدارة شبكة المسوقين، رتبهم، معلومات الدفع وتعديل كلمات المرور';
      case 'suppliers': return 'إدارة مستودعات الموردين والشراكات والمنتجات الموردة';
      case 'confirmers': return 'متابعة أداء فريق تأكيد المكالمات ونسب النجاح اللحظية';
      case 'couriers': return 'ربط شركات التوصيل (Yalidine, ZR, Maystro, Ecom) عبر الـ API';
      case 'wallet': return 'مراجعة طلبات السحب للبائعين وتحصيلات الموردين وإدارتها';
      case 'inventory': return 'مراقبة كميات المخزون وتنبيهات النفاذ ومواقع الرفوف';
      case 'categories': return 'إضافة وتعديل التصنيفات والفئات لمنتجات المتجر';
      case 'coupons': return 'إنشاء قسائم التخفيض والخصومات الترويجية';
      case 'rewards': return 'نظام الحوافز والنقاط والمستويات التنافسية للبائعين';
      case 'users': return 'إدارة حسابات طاقم العمل وتوزيع الصلاحيات الإدارية';
      case 'notifications': return 'بث الإشعارات الجماعية وسجل التنبيهات الإدارية';
      case 'ai_provider': return 'تكوين وضبط نماذج Google Gemini API للوصف والمبيعات';
      case 'settings': return 'إعدادات المنصة العامة وعمولات السوق والروابط';
      default: return '';
    }
  };

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

  // Admin Password & Profile Reset State for Sellers & Suppliers
  const [adminPasswordResetUser, setAdminPasswordResetUser] = useState<{
    id: string;
    name: string;
    email: string;
    currentPassword?: string;
    role: 'seller' | 'supplier';
  } | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminNewEmail, setAdminNewEmail] = useState('');
  const [showAdminResetPassword, setShowAdminResetPassword] = useState(false);
  const [showNewSellerPassword, setShowNewSellerPassword] = useState(false);
  const [showNewSupplierPassword, setShowNewSupplierPassword] = useState(false);
  const [adminResetError, setAdminResetError] = useState('');

  const handleOpenPasswordReset = (user: {
    id: string;
    name: string;
    email: string;
    currentPassword?: string;
    role: 'seller' | 'supplier';
  }) => {
    setAdminPasswordResetUser(user);
    setAdminNewEmail(user.email || '');
    setAdminNewPassword('');
    setAdminConfirmPassword('');
    setShowAdminResetPassword(false);
    setAdminResetError('');
  };

  const handleAdminPasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminResetError('');

    if (!adminPasswordResetUser) return;

    const trimmedPass = adminNewPassword.trim();
    const cleanEmail = adminNewEmail.trim().toLowerCase();

    if (trimmedPass && trimmedPass.length < 6) {
      setAdminResetError('كلمة المرور الجديدة يجب أن تتكون من 6 أحرف أو أرقام على الأقل');
      return;
    }

    if (trimmedPass && trimmedPass !== adminConfirmPassword.trim()) {
      setAdminResetError('تأكيد كلمة المرور غير متطابق مع كلمة المرور الجديدة');
      return;
    }

    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setAdminResetError('صيغة البريد الإلكتروني غير صالحة');
        return;
      }
    }

    if (adminPasswordResetUser.role === 'seller') {
      if (trimmedPass) {
        updateSellerPassword(adminPasswordResetUser.id, trimmedPass);
        if (adminPasswordResetUser.email) {
          updateSellerPassword(adminPasswordResetUser.email, trimmedPass);
        }
      }
      if (cleanEmail && cleanEmail !== adminPasswordResetUser.email) {
        updateSellerProfile(adminPasswordResetUser.id, { email: cleanEmail });
      }
      setSellers(getStoredSellers());
    } else {
      if (trimmedPass) {
        updateSupplierPassword(adminPasswordResetUser.id, trimmedPass);
        if (adminPasswordResetUser.email) {
          updateSupplierPassword(adminPasswordResetUser.email, trimmedPass);
        }
      }
      if (cleanEmail && cleanEmail !== adminPasswordResetUser.email) {
        updateSupplierProfile(adminPasswordResetUser.id, { email: cleanEmail });
      }
      setSupplierList(getStoredSuppliers());
    }

    onShowToast('✔ تم تحديث بيانات الدخول بنجاح! سيتم إلزام الحساب باستعمال كلمة المرور والبريد الأخيرين للدخول.', 'success');
    setAdminPasswordResetUser(null);
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

      // Immediately sync with server backend
      fetch('/api/admin/approve-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'supplier', id: supplierId, action: status }),
      }).catch(() => {});
      
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
    const normalized = {
      ...feeSettings,
      supplierFeePercent: Number(feeSettings.supplierFeePercent) || 5,
      resellerFeePercent: Number(feeSettings.resellerFeePercent) || 0,
      defaultSupplierFeePercent: Number(feeSettings.supplierFeePercent) || 5,
      defaultResellerCommissionPercent: Number(feeSettings.resellerFeePercent) || 0,
    };
    saveStoredMarketplaceFees(normalized);
    setFeeSettings(normalized);
    onShowToast(`✔ تم حفظ نسب العمولات: عمولة المورد ${normalized.supplierFeePercent}%، وعمولة المسوق ${normalized.resellerFeePercent}% بنجاح!`, 'success');
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
      id: `p-tg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
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
  const [isRefreshingRegistrations, setIsRefreshingRegistrations] = useState(false);
  const [approvalsFilter, setApprovalsFilter] = useState<'ALL' | 'SELLERS' | 'SUPPLIERS'>('ALL');

  // Pending applicants memoized calculations
  const pendingSellers = useMemo(() => sellers.filter((s) => s.approvalStatus === 'PENDING'), [sellers]);
  const pendingSuppliers = useMemo(() => supplierList.filter((s) => s.status === 'PENDING'), [supplierList]);
  const totalPendingApprovals = pendingSellers.length + pendingSuppliers.length;

  useEffect(() => {
    const handleSellersUpdate = () => {
      setSellers(getStoredSellers());
    };
    const handleSuppliersUpdate = () => {
      setSupplierList(getStoredSuppliers());
    };
    window.addEventListener('nouva_sellers_updated', handleSellersUpdate);
    window.addEventListener('nouva_suppliers_updated', handleSuppliersUpdate);

    // Live background polling every 4 seconds to catch new registrations in real time
    const interval = setInterval(() => {
      syncSellersWithServer().catch(() => {});
      syncSuppliersWithServer().catch(() => {});
    }, 4000);

    const handleFocus = () => {
      syncSellersWithServer().catch(() => {});
      syncSuppliersWithServer().catch(() => {});
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('nouva_sellers_updated', handleSellersUpdate);
      window.removeEventListener('nouva_suppliers_updated', handleSuppliersUpdate);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const handleForceRefreshRegistrations = async () => {
    setIsRefreshingRegistrations(true);
    try {
      const [newSellers, newSuppliers] = await Promise.all([
        syncSellersWithServer(),
        syncSuppliersWithServer(),
      ]);
      setSellers(newSellers);
      setSupplierList(newSuppliers);
      onShowToast('✔ تم تحديث ومزامنة جميع تسجيلات البائعين والموردين بنجاح!', 'success');
    } catch (e) {
      onShowToast('حدث خطأ أثناء المزامنة', 'error');
    } finally {
      setIsRefreshingRegistrations(false);
    }
  };
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
  
  // Zero Balances in Withdrawals & Treasury State
  const [isZeroBalancesModalOpen, setIsZeroBalancesModalOpen] = useState(false);
  const [zeroBalancesTarget, setZeroBalancesTarget] = useState<
    'ALL_WITHDRAWALS' | 'PAID_WITHDRAWALS' | 'PENDING_WITHDRAWALS' | 'SUPPLIER_SETTLEMENTS' | 'ALL_TREASURY' | 'CLEAR_HISTORY'
  >('ALL_WITHDRAWALS');

  useEffect(() => {
    setWithdrawals(getStoredWithdrawals());
    setSettlements(getStoredSettlements());

    // Sync all entities with backend/Hostinger and anti-resurrection blacklists
    syncProductsWithServer().then((p) => {
      if (p && p.length > 0) setProducts(p);
    });
    syncWithdrawalsWithServer().then((w) => {
      if (w) setWithdrawals(w);
    });
    syncSettlementsWithServer().then((s) => {
      if (s) setSettlements(s);
    });
    syncSuppliersWithServer().then((sup) => {
      if (sup) setSuppliers(sup);
    });
    syncSellersWithServer().then((sel) => {
      if (sel) setSellers(sel);
    });

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
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(getStoredSystemUsers);
  const [isAddingUserModalOpen, setIsAddingUserModalOpen] = useState(false);
  const [editingSystemUser, setEditingSystemUser] = useState<SystemUser | null>(null);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);
  const [visiblePasswordUserId, setVisiblePasswordUserId] = useState<string | null>(null);

  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'WAREHOUSE' as SystemUserRole,
    permissions: ['PACKING', 'PICKING'],
  });

  const [editUserForm, setEditUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'WAREHOUSE' as SystemUserRole,
    permissions: [] as string[],
    status: 'ACTIVE' as 'ACTIVE' | 'DISABLED',
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
    deleteStoredProduct(productId);
    setProducts((prev) => {
      const prod = prev.find((p) => p.id === productId);
      const updated = prev.filter((p) => p.id !== productId);
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

    // Immediately sync with backend
    fetch('/api/admin/approve-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'seller', id: sellerId, action: 'APPROVED' }),
    }).catch(() => {});
    
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

    // Immediately sync with backend
    fetch('/api/admin/approve-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'seller', id: sellerId, action: 'REJECTED' }),
    }).catch(() => {});

    onShowToast('✖ تم رفض طلب انضمام البائع', 'info');
  };

  // Suspend Seller
  const handleSuspendSeller = (sellerId: string) => {
    updateSellerStatus(sellerId, 'SUSPENDED');
    const updated = sellers.map((s) => (s.id === sellerId ? { ...s, approvalStatus: 'SUSPENDED' as const } : s));
    setSellers(updated);
    saveStoredSellers(updated);

    fetch('/api/admin/approve-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'seller', id: sellerId, action: 'SUSPENDED' }),
    }).catch(() => {});

    onShowToast('⛔ تم تعليق حساب البائع', 'info');
  };

  // Delete Seller
  const handleDeleteSeller = (sellerId: string) => {
    if (window.confirm('هل أنت تأكد من حذف حساب هذا البائع نهائياً من المنصة؟')) {
      deleteSellerRegistration(sellerId);
      const updated = getStoredSellers();
      setSellers(updated);
      onShowToast('🗑️ تم حذف حساب البائع بنجاح', 'info');
    }
  };

  // Delete Supplier
  const handleDeleteSupplier = (id: string) => {
    if (window.confirm('هل أنت تأكد من حذف حساب هذا المورد نهائياً من النظام؟')) {
      deleteSupplierRegistration(id);
      const updated = getStoredSuppliers();
      setSupplierList(updated);
      setSuppliers(updated as any);
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
      titleAr: '💰 تم تحويل مستحقات المورد بنجاح',
      bodyAr: `تمت الموافقة وتأكيد تحويل مستحقات مبيعات الجملة بمبلغ ${targetSt.amountDzd.toLocaleString()} دج للمورد (${targetSt.supplierName}).`,
    });

    onShowToast('✔ تم تأكيد تحويل مستحقات المورد بنجاح وتوثيق العملية!', 'success');
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

  // Zero Balances Handlers (تصفير مبالغ السحوبات والخزينة)
  const handleZeroSingleWithdrawal = (id: string) => {
    const target = withdrawals.find((w) => w.id === id);
    if (!target) return;
    if (window.confirm(`هل أنت متأكد من تصفير مبلغ هذا الطلب (${target.sellerName} - #${target.id}) من ${target.amountDzd.toLocaleString()} دج إلى 0 دج؟`)) {
      const success = zeroWithdrawalAmount(id);
      if (success) {
        setWithdrawals(getStoredWithdrawals());
        onShowToast(`✔ تم تصفير مبلغ طلب السحب #${id} إلى 0 دج بنجاح`, 'success');
      }
    }
  };

  const handleZeroSingleSettlement = (id: string) => {
    const target = settlements.find((s) => s.id === id);
    if (!target) return;
    if (window.confirm(`هل أنت متأكد من تصفير مبلغ هذه التسوية (${target.supplierName} - #${target.id}) من ${target.amountDzd.toLocaleString()} دج إلى 0 دج؟`)) {
      const success = zeroSettlementAmount(id);
      if (success) {
        setSettlements(getStoredSettlements());
        onShowToast(`✔ تم تصفير مبلغ تحصيل المورد #${id} إلى 0 دج بنجاح`, 'success');
      }
    }
  };

  const handleDeleteSingleWithdrawal = (id: string) => {
    const target = withdrawals.find((w) => w.id === id);
    if (!target) return;
    if (window.confirm(`هل أنت متأكد من حذف هذا السحب (${target.sellerName} - #${target.id}) نهائياً؟ لن يعود للظهور عند التحديث.`)) {
      const success = deleteWithdrawalRequest(id);
      if (success) {
        setWithdrawals(getStoredWithdrawals());
        onShowToast(`🗑️ تم حذف طلب السحب #${id} نهائياً بنجاح!`, 'success');
      }
    }
  };

  const handleDeleteSingleSettlement = (id: string) => {
    const target = settlements.find((s) => s.id === id);
    if (!target) return;
    if (window.confirm(`هل أنت متأكد من حذف هذه التسوية (${target.supplierName} - #${target.id}) نهائياً؟ لن تعود للظهور عند التحديث.`)) {
      const success = deleteStoredSettlement(id);
      if (success) {
        setSettlements(getStoredSettlements());
        onShowToast(`🗑️ تم حذف التسوية #${id} نهائياً بنجاح!`, 'success');
      }
    }
  };

  const handleExecuteZeroBalances = () => {
    if (zeroBalancesTarget === 'PAID_WITHDRAWALS') {
      const res = zeroWithdrawalAmountsByStatus('APPROVED');
      setWithdrawals(getStoredWithdrawals());
      setIsZeroBalancesModalOpen(false);
      onShowToast(`✔ تم تصفير مبالغ السحوبات المصروفة بنجاح (${res.count} طلب بمجموع ${res.totalZeroed.toLocaleString()} دج أصبح 0 دج)`, 'success');
    } else if (zeroBalancesTarget === 'PENDING_WITHDRAWALS') {
      const res = zeroWithdrawalAmountsByStatus('PENDING');
      setWithdrawals(getStoredWithdrawals());
      setIsZeroBalancesModalOpen(false);
      onShowToast(`✔ تم تصفير مبالغ طلبات السحب المعلقة بنجاح (${res.count} طلب بمجموع ${res.totalZeroed.toLocaleString()} دج أصبح 0 دج)`, 'success');
    } else if (zeroBalancesTarget === 'ALL_WITHDRAWALS') {
      const res = zeroAllWithdrawals();
      setWithdrawals(getStoredWithdrawals());
      setIsZeroBalancesModalOpen(false);
      onShowToast(`✔ تم تصفير جميع مبالغ السحوبات بالكامل (${res.count} طلب بمجموع ${res.totalZeroed.toLocaleString()} دج أصبح 0 دج)`, 'success');
    } else if (zeroBalancesTarget === 'SUPPLIER_SETTLEMENTS') {
      const res = zeroAllSettlementsAmounts('ALL');
      setSettlements(getStoredSettlements());
      setIsZeroBalancesModalOpen(false);
      onShowToast(`✔ تم تصفير مبالغ تحصيلات الموردين بنجاح (${res.count} عملية بمجموع ${res.totalZeroed.toLocaleString()} دج أصبح 0 دج)`, 'success');
    } else if (zeroBalancesTarget === 'ALL_TREASURY') {
      const resWth = zeroAllWithdrawals();
      const resStl = zeroAllSettlementsAmounts('ALL');
      setWithdrawals(getStoredWithdrawals());
      setSettlements(getStoredSettlements());
      setIsZeroBalancesModalOpen(false);
      onShowToast(
        `✔ تم تصفير شامل لجميع مبالغ السحوبات والخزينة بنجاح (السحوبات: ${resWth.totalZeroed.toLocaleString()} دج | التحصيلات: ${resStl.totalZeroed.toLocaleString()} دج أصبحت 0 دج)`,
        'success'
      );
    } else if (zeroBalancesTarget === 'CLEAR_HISTORY') {
      clearAllWithdrawals();
      setWithdrawals([]);
      setIsZeroBalancesModalOpen(false);
      onShowToast('✔ تم مسح سجل طلبات السحب مع الحفاظ التام على حسابات البائعين والموردين', 'info');
    }
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

  // Generate random secure password for staff
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$&!';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  // Save System User Role & Password
  const handleAddUserSubmit = () => {
    const name = newUserForm.fullName.trim();
    const email = newUserForm.email.trim().toLowerCase();
    const password = newUserForm.password.trim();

    if (!name || !email) {
      onShowToast('يرجى كتابة الاسم والبريد الإلكتروني', 'error');
      return;
    }
    if (!password || password.length < 6) {
      onShowToast('يرجى إدخال كلمة سر لا تقل عن 6 أحرف', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      onShowToast('يرجى إدخال بريد إلكتروني صالح', 'error');
      return;
    }

    if (systemUsers.some((u) => u.email.toLowerCase() === email)) {
      onShowToast('هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر', 'error');
      return;
    }

    const defaultPerms =
      newUserForm.role === 'ADMIN'
        ? ['ALL_PERMISSIONS']
        : newUserForm.role === 'WAREHOUSE'
        ? ['PACKING', 'PICKING', 'BARCODE_SCAN', 'INVENTORY_READ_WRITE']
        : newUserForm.role === 'FINANCE_MANAGER'
        ? ['FINANCE_MANAGE', 'ORDERS_MANAGE']
        : ['RESELLER_SUPPORT', 'ORDERS_MANAGE'];

    addSystemUser({
      fullName: name,
      email: email,
      password: password,
      role: newUserForm.role,
      permissions: newUserForm.permissions.length > 0 ? newUserForm.permissions : defaultPerms,
      status: 'ACTIVE',
    });

    setSystemUsers(getStoredSystemUsers());
    setIsAddingUserModalOpen(false);
    setNewUserForm({
      fullName: '',
      email: '',
      password: '',
      role: 'WAREHOUSE',
      permissions: ['PACKING', 'PICKING'],
    });
    setShowNewUserPassword(false);
    onShowToast('✔ تم إضافة المستخدم وتعيين كلمة المرور والصلاحيات بنجاح!', 'success');
  };

  const handleStartEditUser = (u: SystemUser) => {
    setEditingSystemUser(u);
    setEditUserForm({
      fullName: u.fullName,
      email: u.email,
      password: u.password || '',
      role: u.role,
      permissions: u.permissions || [],
      status: u.status,
    });
    setShowEditUserPassword(false);
  };

  const handleEditUserSubmit = () => {
    if (!editingSystemUser) return;
    const name = editUserForm.fullName.trim();
    const email = editUserForm.email.trim().toLowerCase();
    const password = editUserForm.password.trim();

    if (!name || !email) {
      onShowToast('يرجى إدخال الاسم والبريد الإلكتروني', 'error');
      return;
    }
    if (password && password.length < 6) {
      onShowToast('كلمة السر يجب ألا تقل عن 6 أحرف', 'error');
      return;
    }

    updateSystemUser(editingSystemUser.id, {
      fullName: name,
      email: email,
      ...(password ? { password } : {}),
      role: editUserForm.role,
      permissions: editUserForm.permissions,
      status: editUserForm.status,
    });

    setSystemUsers(getStoredSystemUsers());
    setEditingSystemUser(null);
    onShowToast('✔ تم تحديث بيانات المستخدم وكلمة السر بنجاح!', 'success');
  };

  const handleDeleteUser = (u: SystemUser) => {
    if (u.id === 'usr-1') {
      onShowToast('لا يمكن حذف حساب مدير النظام الأساسي (Super Admin)', 'error');
      return;
    }
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف المستخدم "${u.fullName}" نهائياً من النظام؟`)) {
      deleteSystemUser(u.id);
      setSystemUsers(getStoredSystemUsers());
      onShowToast('تم حذف المستخدم من النظام', 'info');
    }
  };

  const handleToggleUserStatus = (u: SystemUser) => {
    if (u.id === 'usr-1') {
      onShowToast('لا يمكن تعطيل حساب مدير النظام الأساسي', 'error');
      return;
    }
    const newStatus = u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    updateSystemUser(u.id, { status: newStatus });
    setSystemUsers(getStoredSystemUsers());
    onShowToast(
      newStatus === 'ACTIVE' ? `تم تفعيل حساب ${u.fullName}` : `تم تعطيل حساب ${u.fullName}`,
      'info'
    );
  };

  return (
    <div className="flex-1 flex flex-row h-full overflow-hidden bg-slate-950 text-slate-100" dir="rtl">
      {/* 1. Admin Vertical Sidebar */}
      <AdminVerticalSidebar
        activeTab={activeAdminTab}
        onSelectTab={setActiveAdminTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        counts={{
          totalPendingApprovals,
          productsCount: products.length,
          sellersCount: sellers.length,
          pendingSellersCount: pendingSellers.length,
          suppliersCount: supplierList.length,
          confirmersCount: systemUsers.filter((u) => u.role === 'ORDER_CONFIRMER').length,
          pendingWithdrawalsCount: withdrawals.filter((w) => w.status === 'PENDING').length,
          lowStockCount: getLowStockProducts(products).length,
          categoriesCount: categories.length,
          couponsCount: coupons.length,
          rewardsCount: rewardRanks.length,
          usersCount: systemUsers.length,
          unreadNotifsCount: adminUnreadCount,
        }}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenNotifications={() => setIsAdminNotifModalOpen(true)}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Modern Sticky Vertical Top Navbar */}
        <header className="sticky top-0 z-20 px-3 sm:px-6 py-3 bg-slate-900/95 backdrop-blur-md border-b border-purple-900/40 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-300 hover:text-white hover:bg-purple-900/60 transition cursor-pointer shrink-0"
              title="فتح القائمة الجانبية"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current Active Tab Breadcrumb & Title */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-400">لوحة الإدارة</span>
                <span className="text-slate-500 text-xs">/</span>
                <h1 className="text-sm sm:text-base font-black text-white truncate flex items-center gap-1.5">
                  {getCurrentTabTitle(activeAdminTab)}
                </h1>
                {activeAdminTab === 'approvals' && totalPendingApprovals > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                    {totalPendingApprovals} معلق
                  </span>
                )}
                {activeAdminTab === 'products' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-900/60 text-purple-300">
                    {products.length} منتج
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate">
                {getCurrentTabSubtitle(activeAdminTab)}
              </p>
            </div>
          </div>

          {/* Quick Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Force Refresh Button */}
            <button
              onClick={handleForceRefreshRegistrations}
              disabled={isRefreshingRegistrations}
              className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-300 hover:text-white hover:bg-purple-900/60 transition cursor-pointer"
              title="مزامنة وتحديث البيانات اللحظية من الخادم"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingRegistrations ? 'animate-spin text-purple-400' : ''}`} />
            </button>

            {/* Gemini AI Quick Shortcut */}
            <button
              onClick={() => setActiveAdminTab('ai_provider')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeAdminTab === 'ai_provider'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-indigo-950/40 text-indigo-300 border-indigo-800/50 hover:bg-indigo-900/60'
              }`}
              title="إعدادات مزود الذكاء الاصطناعي Gemini"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Gemini AI</span>
            </button>

            {/* Delivery Couriers API Quick Shortcut */}
            <button
              onClick={() => setActiveAdminTab('couriers')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeAdminTab === 'couriers'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                  : 'bg-purple-950/40 text-purple-300 border-purple-800/50 hover:bg-purple-900/60'
              }`}
              title="شركات التوصيل وربط API"
            >
              <Truck className="w-3.5 h-3.5 text-purple-200" />
              <span className="hidden md:inline">شركات التوصيل</span>
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => setIsAdminNotifModalOpen(true)}
              className="p-2 rounded-xl bg-purple-950/50 border border-purple-800/40 text-purple-300 hover:text-white hover:bg-purple-900/60 transition relative cursor-pointer"
              title="إشعارات وتنبيهات الإدارة"
            >
              <Bell className="w-4 h-4" />
              {adminUnreadCount > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center absolute -top-1 -end-1 shadow-xs border border-slate-900 animate-pulse">
                  {adminUnreadCount}
                </span>
              )}
            </button>

            {/* Sound Toggle Button */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                soundEnabled
                  ? 'bg-purple-950/60 text-amber-300 border-purple-800/40 hover:bg-purple-900/80'
                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'صوت التنبيهات: مفعل (انقر للتعطيل)' : 'صوت التنبيهات: صامت (انقر للتفعيل)'}
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Impersonate/Super Admin Tag */}
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-black">
              👑 أدمن رئيسي
            </span>
          </div>
        </header>

        {/* Inner Scrollable Workspace */}
        <div className="p-3 sm:p-6 space-y-4 max-w-7xl w-full mx-auto pb-24">
          {/* Subtle Pending Approvals Alert when NOT in approvals tab */}
          {activeAdminTab !== 'approvals' && totalPendingApprovals > 0 && (
            <div
              onClick={() => setActiveAdminTab('approvals')}
              className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/10 to-amber-500/20 border border-amber-500/50 flex items-center justify-between gap-3 text-xs cursor-pointer hover:border-amber-400 transition shadow-md group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black animate-pulse">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-amber-300">
                    تنبيه اعتماد الحسابات: يوجد {totalPendingApprovals} طلب تسجيل جديد بانتظار الموافقة (بائعين وموردين)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    انقر هنا لمراجعة طلبات الانضمام والموافقة الفورية عليها لتفعيل نشاطهم في المنصة
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-[11px] group-hover:scale-105 transition shadow-xs">
                مراجعة الآن 👈
              </span>
            </div>
          )}
      {/* LOW STOCK ALERT BANNER FOR ADMIN */}
      <LowStockBanner
        products={products}
        onOpenModal={() => setIsLowStockModalOpen(true)}
        roleName="الأدمن والإدارة"
      />

      {/* ===================== PENDING APPROVALS CENTRAL HUB ===================== */}
            {/* ===================== TAB: APPROVALS (PENDING APPROVALS CENTRAL HUB) ===================== */}
      {activeAdminTab === 'approvals' && (
        <div id="pending-approvals-hub" className="rounded-2xl border transition-all duration-300 overflow-hidden shadow-md bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
        <div className={`p-4 ${
          totalPendingApprovals > 0
            ? 'bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-amber-500/15 border-b border-amber-500/30'
            : 'bg-slate-50 dark:bg-slate-800/40'
        } flex flex-col md:flex-row items-start md:items-center justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              totalPendingApprovals > 0
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {totalPendingApprovals > 0 ? (
                <Clock className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  مركز طلبات الانضمام والموافقة الفورية (بائعين وموردين)
                </h3>
                {totalPendingApprovals > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                    {totalPendingApprovals} طلب بانتظار الاعتماد
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    جميع الحسابات معتمدة ومفعلة ✔
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {totalPendingApprovals > 0
                  ? `يوجد ${pendingSellers.length} بائعين و ${pendingSuppliers.length} موردين مسجلين بانتظار مراجعتك واعتمادهم لبدء النشاط.`
                  : 'لا توجد طلبات معلقة حالياً. يتم فحص ومزامنة التسجيلات الجديدة تلقائياً كل 4 ثوانٍ.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
            {totalPendingApprovals > 0 && (
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
                <button
                  onClick={() => setApprovalsFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    approvalsFilter === 'ALL'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  الكل ({totalPendingApprovals})
                </button>
                <button
                  onClick={() => setApprovalsFilter('SELLERS')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    approvalsFilter === 'SELLERS'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  بائعين ({pendingSellers.length})
                </button>
                <button
                  onClick={() => setApprovalsFilter('SUPPLIERS')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    approvalsFilter === 'SUPPLIERS'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  موردين ({pendingSuppliers.length})
                </button>
              </div>
            )}

            <button
              onClick={handleForceRefreshRegistrations}
              disabled={isRefreshingRegistrations}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="فحص ومزامنة فوري للتسجيلات الجديدة من السيرفر"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRegistrations ? 'animate-spin text-purple-500' : ''}`} />
              <span>{isRefreshingRegistrations ? 'جاري الفحص...' : 'تحديث فوري'}</span>
            </button>
          </div>
        </div>

        {/* Pending Items Grid */}
        {totalPendingApprovals > 0 ? (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Render Pending Sellers */}
              {(approvalsFilter === 'ALL' || approvalsFilter === 'SELLERS') &&
                pendingSellers.map((seller) => (
                  <div
                    key={seller.id}
                    className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 hover:border-amber-500/50 transition shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-600 text-white">
                            بائع / تاجر
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {seller.registrationDate || 'مسجل حديثاً'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          ⏳ قيد المراجعة
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{seller.fullName}</span>
                          {seller.storeName && (
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                              • متجر {seller.storeName}
                            </span>
                          )}
                        </h4>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span>📍 الولاية: <strong className="text-slate-700 dark:text-slate-200">{seller.wilaya || 'غير محددة'}</strong></span>
                          <span>📞 هاتف: <strong className="text-slate-700 dark:text-slate-200 font-mono">{seller.phone}</strong></span>
                          <span>✉️ بريد: <strong className="text-slate-700 dark:text-slate-200 font-mono">{seller.email}</strong></span>
                        </div>
                        {seller.password && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md w-fit border border-slate-200 dark:border-slate-700">
                            <Lock className="w-3 h-3 text-amber-500" />
                            <span className="text-slate-500 dark:text-slate-400">كلمة المرور:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400 select-all">{seller.password}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-amber-500/20 flex-wrap">
                      <button
                        onClick={() => handleApproveSeller(seller.id)}
                        className="flex-1 min-w-[120px] py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>قبول واعتماد البائع ✔</span>
                      </button>

                      <a
                        href={getWhatsAppUrl(
                          seller.phone,
                          `مرحباً ${seller.fullName}، نحييك من إدارة منصة Nouva Market بشأن طلب انضمامك كبائع ومسوق.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                        title="مراسلة عبر الواتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </a>

                      <button
                        onClick={() => handleRejectSeller(seller.id)}
                        className="py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                        title="رفض الطلب"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>رفض</span>
                      </button>
                    </div>
                  </div>
                ))}

              {/* Render Pending Suppliers */}
              {(approvalsFilter === 'ALL' || approvalsFilter === 'SUPPLIERS') &&
                pendingSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 hover:border-purple-500/50 transition shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-600 text-white">
                            مورد / مصنع
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {supplier.activityType || 'مورد بضاعة'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          ⏳ قيد المراجعة
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{supplier.companyName || supplier.fullName}</span>
                          <span className="text-xs text-slate-400 font-normal">
                            ({supplier.fullName})
                          </span>
                        </h4>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span>📍 الولاية: <strong className="text-slate-700 dark:text-slate-200">{supplier.wilaya || 'غير محددة'}</strong></span>
                          <span>📞 هاتف: <strong className="text-slate-700 dark:text-slate-200 font-mono">{supplier.phone}</strong></span>
                          <span>✉️ بريد: <strong className="text-slate-700 dark:text-slate-200 font-mono">{supplier.email}</strong></span>
                        </div>
                        {supplier.password && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md w-fit border border-slate-200 dark:border-slate-700">
                            <Lock className="w-3 h-3 text-amber-500" />
                            <span className="text-slate-500 dark:text-slate-400">كلمة المرور:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400 select-all">{supplier.password}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-purple-500/20 flex-wrap">
                      <button
                        onClick={() => handleUpdateSupplierStatus(supplier.id, 'APPROVED')}
                        className="flex-1 min-w-[120px] py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>قبول واعتماد المورد ✔</span>
                      </button>

                      <a
                        href={getWhatsAppUrl(
                          supplier.phone,
                          `مرحباً ${supplier.companyName || supplier.fullName}، نحييك من إدارة منصة Nouva Market بخصوص حساب المورد الخاص بك.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                        title="مراسلة عبر الواتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </a>

                      <button
                        onClick={() => handleUpdateSupplierStatus(supplier.id, 'REJECTED')}
                        className="py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                        title="رفض الطلب"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>رفض</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-1">
              <CheckCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              جميع طلبات البائعين والموردين معتمدة ومفعلة حالياً!
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              لديك <strong className="text-slate-800 dark:text-slate-200">{sellers.length} بائع</strong> و <strong className="text-slate-800 dark:text-slate-200">{supplierList.length} مورد</strong> نشط في المنصة. عند تسجيل أي بائع أو مورد جديد سيظهر طلبه هنا فوراً للموافقة عليه.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <button
                onClick={() => setActiveAdminTab('sellers')}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 transition border border-purple-500/30 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>عرض قائمة البائعين ({sellers.length})</span>
              </button>
              <button
                onClick={() => setActiveAdminTab('suppliers')}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 transition border border-purple-500/30 cursor-pointer"
              >
                <Building className="w-3.5 h-3.5" />
                <span>عرض قائمة الموردين ({supplierList.length})</span>
              </button>
            </div>
          </div>
        )}
      </div>
      )}

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
                    id: `p-new-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
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
                    nouvaFeePercent: feeSettings.supplierFeePercent || 5,
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
            {products.map((p, pIdx) => (
              <div
                key={`${p.id}-${pIdx}`}
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

      {/* ---------------- 1.5. APPROVALS & NEW REGISTRATIONS TAB (طلبات الانضمام والتفعيل) ---------------- */}
      {activeAdminTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 border border-amber-500/30">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-500" />
                <span>إدارة ومراجعة طلبات التسجيل والانضمام (بائعين وموردين)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                تأكيد واعتماد الحسابات الجديدة لتبدأ في البيع أو توريد البضاعة، والتواصل المباشر معهم عبر الواتساب.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setApprovalsFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    approvalsFilter === 'ALL'
                      ? 'bg-purple-600 text-white font-black shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  الكل ({totalPendingApprovals})
                </button>
                <button
                  onClick={() => setApprovalsFilter('SELLERS')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    approvalsFilter === 'SELLERS'
                      ? 'bg-purple-600 text-white font-black shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  بائعين معلقين ({pendingSellers.length})
                </button>
                <button
                  onClick={() => setApprovalsFilter('SUPPLIERS')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    approvalsFilter === 'SUPPLIERS'
                      ? 'bg-purple-600 text-white font-black shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  موردين معلقين ({pendingSuppliers.length})
                </button>
              </div>

              <button
                onClick={handleForceRefreshRegistrations}
                disabled={isRefreshingRegistrations}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRegistrations ? 'animate-spin text-purple-500' : ''}`} />
                <span>تحديث فوري</span>
              </button>
            </div>
          </div>

          {totalPendingApprovals === 0 ? (
            <div className="p-8 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-2">
                <CheckCheck className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                رائع! لا توجد طلبات معلقة حالياً
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                تم اعتماد وتفعيل جميع حسابات البائعين والموردين المسجلين في المنصة بنجاح.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <button
                  onClick={() => setActiveAdminTab('sellers')}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-purple-500 transition cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>استعراض البائعين المعتمدين ({sellers.length})</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('suppliers')}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-slate-700 transition cursor-pointer"
                >
                  <Building className="w-4 h-4" />
                  <span>استعراض الموردين المعتمدين ({supplierList.length})</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sellers cards */}
              {(approvalsFilter === 'ALL' || approvalsFilter === 'SELLERS') &&
                pendingSellers.map((seller) => (
                  <div
                    key={`tab-pending-${seller.id}`}
                    className="p-4 rounded-2xl border-2 border-amber-500/40 bg-white dark:bg-slate-900 hover:border-amber-500 transition shadow-sm flex flex-col justify-between gap-3.5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-purple-600 text-white">
                          طلب بائع / مسوق
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          ⏳ بانتظار الاعتماد
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{seller.fullName}</span>
                          {seller.storeName && (
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                              • متجر {seller.storeName}
                            </span>
                          )}
                        </h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                          <span>📍 الولاية: <strong className="text-slate-700 dark:text-slate-200">{seller.wilaya || 'غير محددة'}</strong></span>
                          <span>📞 هاتف: <strong className="text-slate-700 dark:text-slate-200 font-mono">{seller.phone}</strong></span>
                          <span>✉️ بريد: <strong className="text-slate-700 dark:text-slate-200 font-mono">{seller.email}</strong></span>
                        </div>
                        {seller.password && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-slate-500 dark:text-slate-400">كلمة المرور:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400 select-all">{seller.password}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                      <button
                        onClick={() => handleApproveSeller(seller.id)}
                        className="flex-1 min-w-[130px] py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>قبول واعتماد البائع ✔</span>
                      </button>

                      <a
                        href={getWhatsAppUrl(
                          seller.phone,
                          `مرحباً ${seller.fullName}، نحييك من إدارة منصة Nouva Market بشأن طلب انضمامك كبائع ومسوق.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title="مراسلة عبر الواتساب"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>واتساب</span>
                      </a>

                      <button
                        onClick={() => handleRejectSeller(seller.id)}
                        className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                        title="رفض الطلب"
                      >
                        <X className="w-4 h-4" />
                        <span>رفض</span>
                      </button>
                    </div>
                  </div>
                ))}

              {/* Suppliers cards */}
              {(approvalsFilter === 'ALL' || approvalsFilter === 'SUPPLIERS') &&
                pendingSuppliers.map((supplier) => (
                  <div
                    key={`tab-pending-${supplier.id}`}
                    className="p-4 rounded-2xl border-2 border-purple-500/40 bg-white dark:bg-slate-900 hover:border-purple-500 transition shadow-sm flex flex-col justify-between gap-3.5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-purple-700 text-white">
                          طلب مورد / مصنع
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          ⏳ بانتظار الاعتماد
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{supplier.companyName || supplier.fullName}</span>
                          <span className="text-xs text-slate-400 font-normal">
                            ({supplier.fullName})
                          </span>
                        </h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                          <span>📍 الولاية: <strong className="text-slate-700 dark:text-slate-200">{supplier.wilaya || 'غير محددة'}</strong></span>
                          <span>🏭 النشاط: <strong className="text-slate-700 dark:text-slate-200">{supplier.activityType || 'توريد عام'}</strong></span>
                          <span>📞 هاتف: <strong className="text-slate-700 dark:text-slate-200 font-mono">{supplier.phone}</strong></span>
                          <span>✉️ بريد: <strong className="text-slate-700 dark:text-slate-200 font-mono">{supplier.email}</strong></span>
                        </div>
                        {supplier.password && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-slate-500 dark:text-slate-400">كلمة المرور:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400 select-all">{supplier.password}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                      <button
                        onClick={() => handleUpdateSupplierStatus(supplier.id, 'APPROVED')}
                        className="flex-1 min-w-[130px] py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>قبول واعتماد المورد ✔</span>
                      </button>

                      <a
                        href={getWhatsAppUrl(
                          supplier.phone,
                          `مرحباً ${supplier.companyName || supplier.fullName}، نحييك من إدارة منصة Nouva Market بخصوص حساب المورد الخاص بك.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title="مراسلة عبر الواتساب"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>واتساب</span>
                      </a>

                      <button
                        onClick={() => handleUpdateSupplierStatus(supplier.id, 'REJECTED')}
                        className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                        title="رفض الطلب"
                      >
                        <X className="w-4 h-4" />
                        <span>رفض</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
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
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      sellerFilter === st
                        ? 'bg-purple-600 text-white font-black shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>
                      {st === 'ALL'
                        ? `الكل (${sellers.length})`
                        : st === 'PENDING'
                        ? `⏳ قيد المراجعة`
                        : st === 'APPROVED'
                        ? '✔ معتمدين'
                        : st === 'SUSPENDED'
                        ? '⛔ معلقين'
                        : '✖ مرفوضين'}
                    </span>
                    {st === 'PENDING' && pendingSellers.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                        {pendingSellers.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Notice for Pending Sellers */}
          {pendingSellers.length > 0 && sellerFilter !== 'PENDING' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="text-amber-800 dark:text-amber-300 font-bold">
                  يوجد <strong className="text-amber-600 dark:text-amber-400">{pendingSellers.length}</strong> بائعين مسجلين بانتظار موافقتك وتفعيل حساباتهم.
                </span>
              </div>
              <button
                onClick={() => setSellerFilter('PENDING')}
                className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition cursor-pointer shrink-0"
              >
                عرض البائعين المعلقين الآن ⏳
              </button>
            </div>
          )}

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
                          onClick={() =>
                            handleOpenPasswordReset({
                              id: s.id,
                              name: s.fullName,
                              email: s.email || '',
                              currentPassword: s.password,
                              role: 'seller',
                            })
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-amber-500/30"
                          title="تعديل كلمة السر أو البريد الإلكتروني للبائع"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>تعديل كلمة السر</span>
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
                    <Lock className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3.5 pointer-events-none" />
                    <input
                      type={showNewSellerPassword ? 'text' : 'password'}
                      required
                      value={newSellerForm.password}
                      onChange={(e) => setNewSellerForm({ ...newSellerForm, password: e.target.value })}
                      placeholder="اختر كلمة سر لحسابك"
                      className="w-full py-3 pr-10 pl-11 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewSellerPassword(!showNewSellerPassword)}
                      className="absolute top-1/2 -translate-y-1/2 left-3 p-1.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition cursor-pointer"
                      title={showNewSellerPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      aria-label={showNewSellerPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showNewSellerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300 block">تأكيد كلمة المرور *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3.5 pointer-events-none" />
                    <input
                      type={showNewSellerPassword ? 'text' : 'password'}
                      required
                      value={newSellerForm.confirmPassword}
                      onChange={(e) => setNewSellerForm({ ...newSellerForm, confirmPassword: e.target.value })}
                      placeholder="أعد كتابة كلمة السر للتأكيد"
                      className={`w-full py-3 pr-10 pl-11 bg-slate-950 border rounded-2xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none transition ${
                        newSellerForm.confirmPassword && newSellerForm.confirmPassword !== newSellerForm.password
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : 'border-slate-800 focus:border-purple-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewSellerPassword(!showNewSellerPassword)}
                      className="absolute top-1/2 -translate-y-1/2 left-3 p-1.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition cursor-pointer"
                      title={showNewSellerPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      aria-label={showNewSellerPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showNewSellerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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

                {/* Actions & Sub-Tab Selector */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setZeroBalancesTarget('ALL_TREASURY');
                      setIsZeroBalancesModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    title="تصفير المبالغ في خانة السحوبات والخزينة"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400 group-hover:text-white" />
                    <span>تصفير المبالغ</span>
                  </button>

                  <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
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
                      <span>طلبات سحب الموردين ({settlements.filter((st) => st.status === 'PENDING').length})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Financial Flow Guide Line */}
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 grid grid-cols-1 md:grid-cols-3 gap-2 text-center font-medium">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                  <span>1. تحصيل مبالغ الطلبيات المسلّمة COD من شركات التوصيل</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                  <span>2. تسوية وتحويل مستحقات مبيعات الجملة للموردين عند طلب السحب</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                  <span>3. تحويل أرباح وعمولات البائعين والمسوقين لحساباتهم</span>
                </div>
              </div>
            </div>

            {/* Treasury 4 Main Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Supplier Collections */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-xs text-slate-500 font-extrabold">
                  <span>محصلات الموردين المقبوضة</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setZeroBalancesTarget('SUPPLIER_SETTLEMENTS');
                        setIsZeroBalancesModalOpen(true);
                      }}
                      className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="تصفير محصلات الموردين"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <Building className="w-4 h-4 text-purple-500" />
                  </div>
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
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setZeroBalancesTarget('PAID_WITHDRAWALS');
                        setIsZeroBalancesModalOpen(true);
                      }}
                      className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="تصفير سحوبات البائعين المصروفة (0 دج)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <Users className="w-4 h-4 text-purple-500" />
                  </div>
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
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setZeroBalancesTarget('PENDING_WITHDRAWALS');
                        setIsZeroBalancesModalOpen(true);
                      }}
                      className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/60 text-amber-600 hover:text-rose-600 transition cursor-pointer"
                      title="تصفير مبالغ الطلبات المعلقة (0 دج)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
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
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setZeroBalancesTarget('ALL_TREASURY');
                        setIsZeroBalancesModalOpen(true);
                      }}
                      className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/60 text-purple-400 hover:text-rose-600 transition cursor-pointer"
                      title="تصفير مبالغ الخزينة والسحوبات بالكامل"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                  </div>
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

                  {/* Filter Pills & Reset Action */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
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

                    <button
                      onClick={() => {
                        setZeroBalancesTarget('ALL_WITHDRAWALS');
                        setIsZeroBalancesModalOpen(true);
                      }}
                      className="px-3 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer transition bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 flex items-center gap-1.5"
                      title="تصفير مبالغ طلبات السحب"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>تصفير مبالغ السحوبات</span>
                    </button>
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
                              <button
                                onClick={() => handleZeroSingleWithdrawal(w.id)}
                                disabled={w.amountDzd === 0}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 transition cursor-pointer ${
                                  w.amountDzd === 0
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 hover:shadow-xs'
                                }`}
                                title="تصفير مبلغ هذا الطلب ليصبح 0 دج"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>تصفير المبلغ</span>
                              </button>

                              <button
                                onClick={() => handleDeleteSingleWithdrawal(w.id)}
                                className="px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 transition cursor-pointer bg-slate-50 dark:bg-slate-800/60 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 hover:bg-rose-100 hover:border-rose-300"
                                title="حذف طلب السحب نهائياً من النظام"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>حذف</span>
                              </button>

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

                  <button
                    onClick={() => {
                      setZeroBalancesTarget('SUPPLIER_SETTLEMENTS');
                      setIsZeroBalancesModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1.5"
                    title="تصفير مبالغ تحصيلات الموردين"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>تصفير مبالغ التحصيلات</span>
                  </button>
                </div>

                {settlements.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-bold">
                    لا توجد طلبات سحب أو تسويات مسجلة للموردين حالياً.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {settlements.map((st, idx) => (
                      <div
                        key={`${st.id}-${idx}`}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 text-xs"
                      >
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-purple-600 dark:text-purple-400 font-black">{st.id}</span>
                            <span className="text-slate-900 dark:text-white font-extrabold">{st.supplierName}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleZeroSingleSettlement(st.id)}
                              disabled={st.amountDzd === 0}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 transition cursor-pointer ${
                                st.amountDzd === 0
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 hover:shadow-xs'
                              }`}
                              title="تصفير مبلغ هذه التسوية ليصبح 0 دج"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>تصفير المبلغ</span>
                            </button>

                            <button
                              onClick={() => handleDeleteSingleSettlement(st.id)}
                              className="px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 transition cursor-pointer bg-slate-50 dark:bg-slate-800/60 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 hover:bg-rose-100 hover:border-rose-300"
                              title="حذف هذه التسوية نهائياً من النظام"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>حذف</span>
                            </button>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                st.status === 'COMPLETED'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                  : st.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {st.status === 'COMPLETED' ? '✔ تم التحويل للمورد' : st.status === 'PENDING' ? '⏳ طلب سحب بانتظار التحويل' : '✖ مرفوض'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">المبلغ المطلوب:</span>
                            <span className="font-black text-purple-600 dark:text-purple-400 text-sm font-mono">
                              <MoneyText amount={st.amountDzd} />
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">طريقة الاستلام والحساب:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{st.payoutMethod || st.method || 'BaridiMob'}</span>
                            <span className="text-[10px] text-slate-500 font-mono block">{st.accountDetails}</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">الرقم المرجعي:</span>
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
                              <span>✔ تأكيد التحويل للمورد</span>
                            </button>

                            <button
                              onClick={() => handleRejectSettlement(st.id)}
                              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-xs transition flex items-center gap-1.5"
                            >
                              <X className="w-4 h-4" />
                              <span>✖ رفض الطلب</span>
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

      {/* MODAL ZERO BALANCES IN WITHDRAWALS & TREASURY */}
      {isZeroBalancesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/10 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-500/20">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    تصفير المبالغ في خانة السحوبات والخزينة
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    اختر نوع التصفير المطلوب. يتم تصفير المبالغ المالية مع الحفاظ الصارم على بيانات وحسابات البائعين والموردين.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsZeroBalancesModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options Selection */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                حدد الإجراء المالي المطلوب تنفيذه:
              </label>

              {/* Option 1: Zero All Withdrawals */}
              <div
                onClick={() => setZeroBalancesTarget('ALL_WITHDRAWALS')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  zeroBalancesTarget === 'ALL_WITHDRAWALS'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="zeroTarget"
                  checked={zeroBalancesTarget === 'ALL_WITHDRAWALS'}
                  onChange={() => setZeroBalancesTarget('ALL_WITHDRAWALS')}
                  className="mt-1 accent-purple-600"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      تصفير كافة مبالغ طلبات السحب (الكل 0 دج)
                    </span>
                    <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">
                      {withdrawals.reduce((sum, w) => sum + (w.amountDzd || 0), 0).toLocaleString()} دج
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    يجعل مبالغ جميع طلبات السحب (المصروفة، المعلقة، والمرفوضة) مساوية لـ 0 دج مع بقاء كافة بيانات الطلبات وأصحابها.
                  </p>
                </div>
              </div>

              {/* Option 2: Zero Paid Withdrawals */}
              <div
                onClick={() => setZeroBalancesTarget('PAID_WITHDRAWALS')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  zeroBalancesTarget === 'PAID_WITHDRAWALS'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="zeroTarget"
                  checked={zeroBalancesTarget === 'PAID_WITHDRAWALS'}
                  onChange={() => setZeroBalancesTarget('PAID_WITHDRAWALS')}
                  className="mt-1 accent-purple-600"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      تصفير مبالغ السحوبات المصروفة فقط (0 دج)
                    </span>
                    <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">
                      {withdrawals.filter(w => w.status === 'APPROVED').reduce((sum, w) => sum + (w.amountDzd || 0), 0).toLocaleString()} دج
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    تصفير مبالغ العمليات التي تم صرفها مسبقاً للبائعين ليعود مؤشر «سحوبات البائعين المصروفة» إلى 0 دج.
                  </p>
                </div>
              </div>

              {/* Option 3: Zero Pending Withdrawals */}
              <div
                onClick={() => setZeroBalancesTarget('PENDING_WITHDRAWALS')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  zeroBalancesTarget === 'PENDING_WITHDRAWALS'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="zeroTarget"
                  checked={zeroBalancesTarget === 'PENDING_WITHDRAWALS'}
                  onChange={() => setZeroBalancesTarget('PENDING_WITHDRAWALS')}
                  className="mt-1 accent-purple-600"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      تصفير مبالغ طلبات السحب المعلقة فقط (0 دج)
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                      {withdrawals.filter(w => w.status === 'PENDING').reduce((sum, w) => sum + (w.amountDzd || 0), 0).toLocaleString()} دج
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    تصفير المبالغ المعلقة قيد الانتظار لتصبح 0 دج دون إلغاء أو حذف الطلبات.
                  </p>
                </div>
              </div>

              {/* Option 4: Zero Supplier Settlements */}
              <div
                onClick={() => setZeroBalancesTarget('SUPPLIER_SETTLEMENTS')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  zeroBalancesTarget === 'SUPPLIER_SETTLEMENTS'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="zeroTarget"
                  checked={zeroBalancesTarget === 'SUPPLIER_SETTLEMENTS'}
                  onChange={() => setZeroBalancesTarget('SUPPLIER_SETTLEMENTS')}
                  className="mt-1 accent-purple-600"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      تصفير مبالغ تحصيلات وتسويات الموردين (0 دج)
                    </span>
                    <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">
                      {settlements.reduce((sum, st) => sum + (st.amountDzd || 0), 0).toLocaleString()} دج
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    تصفير مبالغ المدفوعات والتحصيلات المسددة من الموردين ليعود المؤشر إلى 0 دج.
                  </p>
                </div>
              </div>

              {/* Option 5: All Treasury Zeroing */}
              <div
                onClick={() => setZeroBalancesTarget('ALL_TREASURY')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  zeroBalancesTarget === 'ALL_TREASURY'
                    ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="zeroTarget"
                  checked={zeroBalancesTarget === 'ALL_TREASURY'}
                  onChange={() => setZeroBalancesTarget('ALL_TREASURY')}
                  className="mt-1 accent-rose-600"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-rose-700 dark:text-rose-400">
                      ⚡ تصفير شامل لجميع مبالغ الخزينة والسحوبات (الكل 0 دج)
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      تصفير كامل
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    يقوم بتصفير كافة مبالغ السحوبات والتحصيلات في آن واحد لتصبح جميع بطاقات السحوبات والخزينة 0 دج.
                  </p>
                </div>
              </div>

              {/* Option 6: Clear History */}
              <div
                onClick={() => setZeroBalancesTarget('CLEAR_HISTORY')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  zeroBalancesTarget === 'CLEAR_HISTORY'
                    ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="zeroTarget"
                  checked={zeroBalancesTarget === 'CLEAR_HISTORY'}
                  onChange={() => setZeroBalancesTarget('CLEAR_HISTORY')}
                  className="mt-1 accent-amber-600"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-amber-800 dark:text-amber-400">
                      مسح وتفريغ سجل طلبات السحب القديمة
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {withdrawals.length} طلب
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    إفراغ جدول طلبات السحب بالكامل للبدء بسجل جديد، مع الحفاظ التام والصارم على حسابات البائعين والموردين.
                  </p>
                </div>
              </div>
            </div>

            {/* Note & Safe Preservation Notice */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                <strong>ضمان الأمان:</strong> عملية التصفير تطبق فقط على المبالغ المختارة وتضمن الحفاظ الصارم على حسابات البائعين، الموردين، والمتاجر دون مساس.
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsZeroBalancesModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteZeroBalances}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition cursor-pointer shadow-md flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تأكيد تنفيذ التصفير الآن</span>
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
            {products.map((p, pIdx) => (
              <div
                key={`${p.id}-${pIdx}`}
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
          {/* Centralized Financial Cycle & Intermediary Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white border-2 border-indigo-500/60 shadow-xl space-y-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-indigo-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white flex items-center gap-2">
                    <span>إدارة شركات التوصيل والدورة المالية المركزية (Central Financial Brokerage)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-400/30">
                      أموال الـ COD عند الأدمن
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    المنصة والأدمن هما الوسيط المالي المباشر بين المسوّق والمورّد لضمان حقوق كافة الأطراف.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => setActiveAdminTab('withdrawals')}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>جدول التحويلات والتسويات</span>
                </button>
              </div>
            </div>

            {/* Financial Cycle Flow Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-indigo-800/40 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-300 text-[11px]">
                  <span>1. تحصيل أموال الزبائن (COD)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  شركات التوصيل التابعة للأدمن تجمع أموال الطلبيات المسلّمة وتحولها مباشرة لحساب المنصة.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-indigo-800/40 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-[11px]">
                  <span>2. تسديد حقوق الموردين</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  يقوم الأدمن بدفع سعر الجملة المحدد للسلع المسلّمة لحساب المورد في CCP أو BaridiMob.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-indigo-800/40 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px]">
                  <span>3. تسديد عمولات المسوّقين</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  يقوم الأدمن بدفع صافي عمولات التسويق للبائعين عند طلب السحب من محفظتهم.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase">
              مفاتيح الـ API وربط شركات التوصيل المعتمدة (Yalidine / Maystro / ZR / Ecom / Nord&Sud)
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
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-purple-600" />
                  <span>إعدادات عمولات المنصة (نسبة المورد ونسبة المسوق)</span>
                </h3>
                <p className="text-xs text-slate-500">التحكم في نسبة عمولة المنصة من المورد، والنسبة المقتطعة من أرباح المسوق</p>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer self-start sm:self-auto"
              >
                <Check className="w-4 h-4" />
                <span>حفظ نسب العمولات</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
              {/* Supplier Fee Control */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 dark:text-slate-200 font-black block">
                    1. عمولة المنصة من المورد (Nouva Supplier Fee %):
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-black">
                    افتراضياً 5%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={feeSettings.supplierFeePercent ?? 5}
                    onChange={(e) =>
                      setFeeSettings({
                        ...feeSettings,
                        supplierFeePercent: Number(e.target.value),
                        defaultSupplierFeePercent: Number(e.target.value),
                      })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-sm text-purple-600 dark:text-purple-400 font-black focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">%</span>
                </div>
                
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold">نسب سريعة:</span>
                  {[3, 5, 7, 10].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() =>
                        setFeeSettings({
                          ...feeSettings,
                          supplierFeePercent: rate,
                          defaultSupplierFeePercent: rate,
                        })
                      }
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                        (feeSettings.supplierFeePercent ?? 5) === rate
                          ? 'bg-purple-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-[10px] text-purple-800 dark:text-purple-300 space-y-1">
                  <p className="font-extrabold">💡 كيف تُحسب عمولة المورد؟</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    إذا أدخل المورد سعر النيت = 3,000 دج ونسبة العمولة {feeSettings.supplierFeePercent ?? 5}%،
                    تأخذ المنصة {Math.round((3000 * (feeSettings.supplierFeePercent ?? 5)) / 100)} دج،
                    ويظهر للمسوق سعر الجملة = {3000 + Math.round((3000 * (feeSettings.supplierFeePercent ?? 5)) / 100)} دج.
                  </p>
                </div>
              </div>

              {/* Reseller Fee Control */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 dark:text-slate-200 font-black block">
                    2. عمولة المنصة المقتطعة من المسوق (Nouva Reseller Fee %):
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-black">
                    تحكم حر 0 - 50%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={feeSettings.resellerFeePercent ?? 0}
                    onChange={(e) =>
                      setFeeSettings({
                        ...feeSettings,
                        resellerFeePercent: Number(e.target.value),
                        defaultResellerCommissionPercent: Number(e.target.value),
                      })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-sm text-emerald-600 dark:text-emerald-400 font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">%</span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold">نسب سريعة:</span>
                  {[0, 3, 5, 10, 15].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() =>
                        setFeeSettings({
                          ...feeSettings,
                          resellerFeePercent: rate,
                          defaultResellerCommissionPercent: rate,
                        })
                      }
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                        (feeSettings.resellerFeePercent ?? 0) === rate
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {rate === 0 ? '0% (بدون اقتطاع)' : `${rate}%`}
                    </button>
                  ))}
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-[10px] text-emerald-800 dark:text-emerald-300 space-y-1">
                  <p className="font-extrabold">💡 كيف تُحسب عمولة المسوق؟</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    إذا حقق المسوق ربحاً إجمالياً 1,000 دج ونسبة الاقتطاع {feeSettings.resellerFeePercent ?? 0}%،
                    تقتطع المنصة {Math.round((1000 * (feeSettings.resellerFeePercent ?? 0)) / 100)} دج،
                    ويصل محفظة المسوق صافي {1000 - Math.round((1000 * (feeSettings.resellerFeePercent ?? 0)) / 100)} دج.
                  </p>
                </div>
              </div>
            </div>

            {/* LIVE SIMULATION CARD */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/10 via-slate-900/20 to-emerald-900/10 border border-purple-500/20 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                  <span>محاكاة توزيع الأرباح لطلبية نموذجية (سعر النيت 3,000 دج وسعر البيع 4,500 دج):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">حساب تلقائي حي</span>
              </div>

              {(() => {
                const netSupplier = 3000;
                const supFee = feeSettings.supplierFeePercent ?? 5;
                const resFee = feeSettings.resellerFeePercent ?? 0;
                const platformFromSupplier = Math.round((netSupplier * supFee) / 100);
                const wholesale = netSupplier + platformFromSupplier;
                const retailSelling = 4500;
                const grossResellerProfit = Math.max(0, retailSelling - wholesale);
                const platformFromReseller = Math.round((grossResellerProfit * resFee) / 100);
                const netResellerProfit = Math.max(0, grossResellerProfit - platformFromReseller);
                const totalPlatformRevenue = platformFromSupplier + platformFromReseller;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">سعر الجملة للمسوق</span>
                      <span className="text-xs font-black text-purple-600 dark:text-purple-400 font-mono">{wholesale} دج</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">(صافي المورد {netSupplier} دج)</span>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">عمولة المنصة من المورد</span>
                      <span className="text-xs font-black text-purple-600 dark:text-purple-400 font-mono">+{platformFromSupplier} دج</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">({supFee}% من النيت)</span>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">صافي ربح المسوق</span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">{netResellerProfit} دج</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">(من أصل {grossResellerProfit} دج)</span>
                    </div>

                    <div className="p-2 rounded-xl bg-purple-600/10 dark:bg-purple-900/30 border border-purple-500/30 text-center">
                      <span className="text-[10px] text-purple-700 dark:text-purple-300 block font-black">إجمالي دخل المنصة</span>
                      <span className="text-xs font-black text-purple-700 dark:text-purple-300 font-mono">{totalPlatformRevenue} دج</span>
                      <span className="text-[9px] text-purple-500 dark:text-purple-400 block mt-0.5">({platformFromSupplier} + {platformFromReseller} دج)</span>
                    </div>
                  </div>
                );
              })()}
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
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        supplierFilter === st
                          ? 'bg-purple-600 text-white font-black shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <span>
                        {st === 'ALL'
                          ? `الكل (${supplierList.length})`
                          : st === 'PENDING'
                          ? '⏳ قيد المراجعة'
                          : st === 'APPROVED'
                          ? '✔ معتمدين'
                          : '⛔ معلقين'}
                      </span>
                      {st === 'PENDING' && pendingSuppliers.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                          {pendingSuppliers.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Notice for Pending Suppliers */}
            {pendingSuppliers.length > 0 && supplierFilter !== 'PENDING' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                  <span className="text-amber-800 dark:text-amber-300 font-bold">
                    يوجد <strong className="text-amber-600 dark:text-amber-400">{pendingSuppliers.length}</strong> طلبات انضمام موردين بانتظار موافقتك وتفعيل حساباتهم.
                  </span>
                </div>
                <button
                  onClick={() => setSupplierFilter('PENDING')}
                  className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition cursor-pointer shrink-0"
                >
                  عرض الموردين المعلقين الآن ⏳
                </button>
              </div>
            )}

            <div className="space-y-3">
              {supplierList.filter((s) => supplierFilter === 'ALL' || s.status === supplierFilter).length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
                  لا يوجد موردون ضمن هذا الفلتر حالياً.
                </div>
              ) : (
                supplierList
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
                          {s.password && (
                            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
                              <Lock className="w-3 h-3 text-amber-500" />
                              <span className="text-slate-500 dark:text-slate-400">كلمة السر:</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400">{s.password}</span>
                            </div>
                          )}
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
                          onClick={() =>
                            handleOpenPasswordReset({
                              id: s.id,
                              name: s.companyName || s.fullName,
                              email: s.email || '',
                              currentPassword: s.password,
                              role: 'supplier',
                            })
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border border-amber-500/30"
                          title="تعديل كلمة السر أو البريد الإلكتروني للمورد"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>تعديل كلمة السر</span>
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
                ))
              )}
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
                  .map((p, pIdx) => (
                    <div
                      key={`${p.id}-${pIdx}`}
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
                  <div className="relative">
                    <input
                      type={showNewSupplierPassword ? 'text' : 'password'}
                      required
                      value={newSupplierForm.password}
                      onChange={(e) => setNewSupplierForm({ ...newSupplierForm, password: e.target.value })}
                      placeholder="كلمة مرور الحساب"
                      className="w-full py-2.5 pr-3.5 pl-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewSupplierPassword(!showNewSupplierPassword)}
                      className="absolute top-1/2 -translate-y-1/2 left-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                      title={showNewSupplierPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      aria-label={showNewSupplierPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showNewSupplierPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">تأكيد كلمة المرور *</label>
                  <div className="relative">
                    <input
                      type={showNewSupplierPassword ? 'text' : 'password'}
                      required
                      value={newSupplierForm.confirmPassword}
                      onChange={(e) => setNewSupplierForm({ ...newSupplierForm, confirmPassword: e.target.value })}
                      placeholder="تأكيد كلمة المرور"
                      className={`w-full py-2.5 pr-3.5 pl-10 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
                        newSupplierForm.confirmPassword && newSupplierForm.confirmPassword !== newSupplierForm.password
                          ? 'border-rose-500 focus:border-rose-500'
                          : 'border-slate-200 dark:border-slate-700 focus:border-purple-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewSupplierPassword(!showNewSupplierPassword)}
                      className="absolute top-1/2 -translate-y-1/2 left-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                      title={showNewSupplierPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      aria-label={showNewSupplierPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showNewSupplierPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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

      {/* ---------------- 10. ROLES & PERMISSIONS (الأدوار والصلاحيات وإدارة كلمات السر) ---------------- */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <span>إدارة مستخدمي النظام، الأدوار والصلاحيات وكلمات السر</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                يمكن لكل مستخدم إداري تسجيل الدخول مباشرة من صفحة الدخول بالبريد الإلكتروني وكلمة المرور المحددة له هنا.
              </p>
            </div>
            <button
              onClick={() => {
                setNewUserForm({
                  fullName: '',
                  email: '',
                  password: generateRandomPassword(),
                  role: 'WAREHOUSE',
                  permissions: ['PACKING', 'PICKING'],
                });
                setShowNewUserPassword(true);
                setIsAddingUserModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إضافة مستخدم وكلمة مرور جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {systemUsers.map((u) => {
              const isSuperAdmin = u.id === 'usr-1';
              const isPasswordVisible = visiblePasswordUserId === u.id;

              const roleLabel =
                u.role === 'ADMIN'
                  ? 'مدير النظام (Admin)'
                  : u.role === 'ORDER_CONFIRMER'
                  ? 'مؤكد الطلبيات لجميع الموردين (Confirmer)'
                  : u.role === 'WAREHOUSE'
                  ? 'أمين المستودع (Warehouse)'
                  : u.role === 'FINANCE_MANAGER'
                  ? 'مدير المالية والمحفظة'
                  : 'الدعم الفني للبائعين';

              const roleBadgeColor =
                u.role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                  : u.role === 'ORDER_CONFIRMER'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : u.role === 'WAREHOUSE'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : u.role === 'FINANCE_MANAGER'
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';

              return (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-black text-purple-600 text-sm">
                        {u.fullName.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 dark:text-white text-sm">
                            {u.fullName}
                          </h4>
                          {isSuperAdmin && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-600 text-white">
                              الأساسي
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleUserStatus(u)}
                      disabled={isSuperAdmin}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                      } ${isSuperAdmin ? 'opacity-80 cursor-default' : 'hover:opacity-80'}`}
                    >
                      {u.status === 'ACTIVE' ? 'نشط' : 'معطّل'}
                    </button>
                  </div>

                  {/* Role and Password Box */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">الدور الوظيفي:</span>
                      <span className={`px-2.5 py-0.5 rounded-lg border font-bold text-[10px] ${roleBadgeColor}`}>
                        {roleLabel}
                      </span>
                    </div>

                    {/* Password display row */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Lock className="w-3.5 h-3.5 text-purple-500" />
                        <span>كلمة المرور:</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-md" dir="ltr">
                          {isPasswordVisible ? u.password || 'Aliass@m1989' : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVisiblePasswordUserId(isPasswordVisible ? null : u.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-purple-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                          title={isPasswordVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(u.password || 'Aliass@m1989');
                            onShowToast('تم نسخ كلمة المرور إلى الحافظة', 'success');
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-purple-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                          title="نسخ كلمة المرور"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Pills */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">الصلاحيات الممنوحة:</span>
                    <div className="flex flex-wrap gap-1">
                      {u.permissions.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-mono text-[9px] border border-purple-100 dark:border-purple-900/50"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => handleStartEditUser(u)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 dark:bg-slate-800 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل كلمة السر والصلاحيات</span>
                    </button>

                    {!isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                        title="حذف المستخدم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD USER & PASSWORD & ROLE */}
      {isAddingUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span>إضافة مستخدم جديد وتعيين كلمة المرور</span>
              </h3>
              <button
                onClick={() => setIsAddingUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  placeholder="مثال: أحمد بلقاسم"
                  value={newUserForm.fullName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold placeholder:text-slate-600 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">البريد الإلكتروني (لتسجيل الدخول):</label>
                <input
                  type="email"
                  placeholder="staff@nouvamarket.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder:text-slate-600 focus:border-purple-500 outline-none"
                  dir="ltr"
                />
              </div>

              {/* Password field with random generator & toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>كلمة المرور:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = generateRandomPassword();
                      setNewUserForm({ ...newUserForm, password: generated });
                      setShowNewUserPassword(true);
                      onShowToast('تم توليد كلمة سر عشوائية قوية', 'info');
                    }}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" />
                    <span>توليد تلقائي</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewUserPassword ? 'text' : 'password'}
                    placeholder="كلمة السر (6 أحرف على الأقل)"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder:text-slate-600 focus:border-purple-500 outline-none pl-10"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 سيتمكن المستخدم من تسجيل الدخول فوراً بهذا البريد الإلكتروني وكلمة المرور.
                </p>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">الدور الوظيفي:</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => {
                    const role = e.target.value as SystemUserRole;
                    const defaultPerms =
                      role === 'ADMIN'
                        ? ['ALL_PERMISSIONS']
                        : role === 'ORDER_CONFIRMER'
                        ? ['CONFIRM_ORDERS', 'ORDERS_MANAGE', 'FOLLOW_DELIVERY']
                        : role === 'WAREHOUSE'
                        ? ['PACKING', 'PICKING', 'BARCODE_SCAN', 'INVENTORY_READ_WRITE']
                        : role === 'FINANCE_MANAGER'
                        ? ['FINANCE_MANAGE', 'ORDERS_MANAGE']
                        : ['RESELLER_SUPPORT', 'ORDERS_MANAGE'];
                    setNewUserForm({ ...newUserForm, role, permissions: defaultPerms });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none"
                >
                  <option value="ADMIN">أدمن كامل الصلاحيات (ADMIN)</option>
                  <option value="ORDER_CONFIRMER">مؤكد الطلبيات لجميع الموردين (CONFIRMER)</option>
                  <option value="WAREHOUSE">مسؤول مستودع ومخزون (WAREHOUSE)</option>
                  <option value="FINANCE_MANAGER">مدير المحفظة والمالية (FINANCE)</option>
                  <option value="RESELLER_SUPPORT">الدعم الفني للبائعين (SUPPORT)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAddingUserModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddUserSubmit}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs"
              >
                حفظ وإضافة المستخدم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER & PASSWORD & ROLE */}
      {editingSystemUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <span>تعديل المستخدم وتغيير كلمة السر</span>
              </h3>
              <button
                onClick={() => setEditingSystemUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  value={editUserForm.fullName}
                  onChange={(e) => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none"
                  dir="ltr"
                />
              </div>

              {/* Password update field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>تغيير كلمة المرور:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = generateRandomPassword();
                      setEditUserForm({ ...editUserForm, password: generated });
                      setShowEditUserPassword(true);
                      onShowToast('تم توليد كلمة سر عشوائية جديدة', 'info');
                    }}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" />
                    <span>توليد تلقائي</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showEditUserPassword ? 'text' : 'password'}
                    placeholder="اكتب كلمة سر جديدة أو اتركها الحالية"
                    value={editUserForm.password}
                    onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none pl-10"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditUserPassword(!showEditUserPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showEditUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 عند تعديل كلمة المرور سيتمكن المستخدم فوراً من الدخول بها.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">الدور الوظيفي:</label>
                  <select
                    value={editUserForm.role}
                    disabled={editingSystemUser.id === 'usr-1'}
                    onChange={(e) =>
                      setEditUserForm({ ...editUserForm, role: e.target.value as SystemUserRole })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none"
                  >
                    <option value="ADMIN">أدمن كامل الصلاحيات</option>
                    <option value="ORDER_CONFIRMER">مؤكد الطلبيات لجميع الموردين</option>
                    <option value="WAREHOUSE">مسؤول مستودع</option>
                    <option value="FINANCE_MANAGER">مدير المحفظة والمالية</option>
                    <option value="RESELLER_SUPPORT">الدعم الفني للبائعين</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">حالة الحساب:</label>
                  <select
                    value={editUserForm.status}
                    disabled={editingSystemUser.id === 'usr-1'}
                    onChange={(e) =>
                      setEditUserForm({ ...editUserForm, status: e.target.value as 'ACTIVE' | 'DISABLED' })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none"
                  >
                    <option value="ACTIVE">نشط</option>
                    <option value="DISABLED">معطل</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingSystemUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleEditUserSubmit}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 11. ORDER CONFIRMERS AUDIT ---------------- */}
      {activeAdminTab === 'confirmers' && (
        <AdminConfirmersAuditTab
          orders={orders}
          systemUsers={systemUsers}
          onOpenAddUserModal={() => {
            setNewUserForm({
              email: '',
              fullName: '',
              role: 'ORDER_CONFIRMER',
              permissions: ['CONFIRM_ORDERS', 'ORDERS_MANAGE', 'FOLLOW_DELIVERY'],
              password: generateRandomPassword(),
              status: 'ACTIVE',
            });
            setShowNewUserPassword(true);
            setIsAddingUserModalOpen(true);
          }}
          onEditUser={(u) => handleStartEditUser(u)}
          onToggleUserStatus={(u) => handleToggleUserStatus(u)}
          onShowToast={onShowToast}
          onSwitchToConfirmerDashboard={onSwitchToConfirmerDashboard}
        />
      )}

      {/* ---------------- 11. AI PROVIDER SETTINGS (GEMINI API) ---------------- */}
      {activeAdminTab === 'ai_provider' && (
        <AdminAiProviderSettings onShowToast={onShowToast} />
      )}

      {/* ---------------- 12. PLATFORM SETTINGS ---------------- */}
      {activeAdminTab === 'settings' && (
        <div className="space-y-4 text-xs">
          {/* AI Provider Quick Navigation Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/40 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>مزود الذكاء الاصطناعي (Google Gemini API)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    نشط وموصى به
                  </span>
                </h4>
                <p className="text-[11px] text-indigo-200/80 mt-0.5">
                  تعديل واختيار نماذج Gemini، ربط مفتاح API، واختبار الاتصال الفوري بخوادم Google AI
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveAdminTab('ai_provider')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shrink-0"
            >
              <span>فتح إعدادات الذكاء الاصطناعي</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>

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

      {/* ADMIN PASSWORD & EMAIL RESET MODAL FOR SELLERS AND SUPPLIERS */}
      {adminPasswordResetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 text-right dir-rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    تعديل كلمة السر والبريد
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                    {adminPasswordResetUser.role === 'seller' ? 'بائع مسوق' : 'مورد / مصنع'}: {adminPasswordResetUser.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAdminPasswordResetUser(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminResetError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{adminResetError}</span>
              </div>
            )}

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-bold">المعرف (ID):</span>
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-bold">{adminPasswordResetUser.id}</span>
              </div>
              {adminPasswordResetUser.currentPassword && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">كلمة السر الحالية المسجلة:</span>
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                    {adminPasswordResetUser.currentPassword}
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleAdminPasswordResetSubmit} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">
                  البريد الإلكتروني لتسجيل الدخول:
                </label>
                <input
                  type="email"
                  required
                  value={adminNewEmail}
                  onChange={(e) => setAdminNewEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">
                  كلمة المرور الجديدة (أتركها فارغة إذا أردت تعديل البريد فقط):
                </label>
                <div className="relative">
                  <input
                    type={showAdminResetPassword ? 'text' : 'password'}
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="أدخل كلمة مرور جديدة (6 أحرف/أرقام على الأقل)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-hidden focus:border-purple-500 pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminResetPassword(!showAdminResetPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showAdminResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {adminNewPassword.trim() && (
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1">
                    تأكيد كلمة المرور الجديدة:
                  </label>
                  <input
                    type={showAdminResetPassword ? 'text' : 'password'}
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور للتأكيد"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              )}

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                🔒 <strong>تأكيد صارم:</strong> عند الحفظ، سيتم تحديث كلمة المرور والبريد فوراً في النظام، وسيُطلب من المستخدم استعمال البيانات الجديدة حصراً لتسجيل الدخول.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdminPasswordResetUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد وحفظ التغييرات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}