import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DateFilterBar, DateFilterMode, matchesDateFilter } from '../common/DateFilterBar';
import { ShipmentTrackingTool } from '../common/ShipmentTrackingTool';
import { ShippingRatesModal } from '../common/ShippingRatesModal';
import {
  Package,
  Printer,
  CheckCircle2,
  Truck,
  Search,
  Clock,
  XCircle,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Plus,
  Edit3,
  Send,
  FileText,
  Check,
  RefreshCw,
  Box,
  Barcode,
  ShieldAlert,
  Trash2,
  Bell,
  DollarSign,
  BarChart3,
  User,
  Wallet,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  TrendingUp,
  CreditCard,
  Calendar,
  Save,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Flame,
  TrendingDown,
  Users,
  ShoppingBag,
  Award,
  Percent,
  Link as LinkIcon,
  Lock,
  Key,
  Eye,
  EyeOff,
  Radio,
  Menu,
  Boxes,
  ArrowDownToLine,
  Banknote,
  History,
} from 'lucide-react';
import { WarehouseVerticalSidebar } from './WarehouseVerticalSidebar';
import { useOrders } from '../../context/OrderContext';
import { useCategories } from '../../context/CategoryContext';
import { useAuth } from '../../context/AuthContext';
import { getStoredProducts, saveStoredProducts, deleteStoredProduct, syncProductsWithServer } from '../../data/mockProducts';
import { getStoredCouriers, saveStoredCouriers, CourierPartner } from '../../lib/courierHelper';
import { fetchLiveTrackingFromCourier, createBordereauForOrderViaCourier } from '../../lib/deliveryApiManager';
import { EcomDeliveryApiClient, ECOM_SITUATIONS_REF } from '../../lib/ecomDeliveryApi';
import {
  getStoredSuppliers,
  saveStoredSuppliers,
  getStoredSettlements,
  saveStoredSettlements,
  recordSupplierPayment,
  requestSupplierPayout,
  deletePendingSupplierSettlement,
  getStoredMarketplaceFees,
  updateSupplierPassword,
  updateSupplierProfile,
} from '../../lib/supplierHelper';
import {
  getStoredWithdrawals,
  createWithdrawalRequest,
  WithdrawalRequest,
} from '../../lib/withdrawalHelper';
import { Order, OrderStatus, Product, SupplierProfile, SupplierSettlement } from '../../types';
import { MoneyText } from '../ui/MoneyText';
import { ProductEditModal } from '../common/ProductEditModal';
import { ProductUrlImportModal } from '../common/ProductUrlImportModal';
import { LowStockBanner, LowStockModal, getLowStockProducts } from '../common/LowStockAlerts';
import { addSellerNotification, addWarehouseNotification, addAdminNotification, getUnreadNotificationsCount } from '../../lib/notificationHelper';
import { NotificationsModal } from '../tabs/NotificationsModal';
import { DeliverySyncMonitor } from './DeliverySyncMonitor';
import {
  InboundStockRequest,
  InboundStockItem,
} from '../../types';
import {
  getStoredInboundRequests,
  saveStoredInboundRequests,
  createInboundStockRequest,
  receiveAndInspectInboundStock,
} from '../../lib/inboundStockHelper';
import { PickingPackingModal } from './PickingPackingModal';
import { CourierManifestModal } from './CourierManifestModal';
import { CodReconciliationModal } from './CodReconciliationModal';
import { ReturnsQCModal } from './ReturnsQCModal';
import { CourierAnalyticsModal } from './CourierAnalyticsModal';
import { OrderAuditTimeline } from '../common/OrderAuditTimeline';

interface WarehouseDashboardProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isPlatformWarehouse?: boolean;
}

type WarehouseTab =
  | 'pipeline'
  | 'pending'
  | 'preparation'
  | 'delivery'
  | 'completed'
  | 'returned'
  | 'inbound'
  | 'products'
  | 'tracking'
  | 'financial'
  | 'analytics'
  | 'profile';


const REJECTION_REASONS = [
  'المنتج غير متوفر بالمخزن',
  'رقم الهاتف خاطئ أو لا يرن',
  'العنوان غير واضح أو ناقص',
  'معلومات ناقصة',
  'طلب مكرر من الزبون',
  'سبب آخر',
];

export function WarehouseDashboard({ onShowToast, isPlatformWarehouse }: WarehouseDashboardProps) {
  const { categories } = useCategories();
  const {
    orders,
    confirmOrderWarehouse,
    rejectOrderWithReason,
    setTrackingCode,
    updateOrderStatus,
    updateOrder,
    updateOrdersBatch,
    confirmReturnInWarehouse,
  } = useOrders();

  const [activeTab, setActiveTab] = useState<WarehouseTab>(() =>
    isPlatformWarehouse ? 'preparation' : 'pipeline'
  );

  // Vertical Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nouva_wh_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nouva_wh_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const getWarehouseTabTitle = (tab: WarehouseTab) => {
    switch (tab) {
      case 'pipeline': return 'متابعة حركة الطلبيات (المزامنة الحية)';
      case 'pending': return '1. مراجعة وتأكيد الطلبيات';
      case 'preparation': return '2. التحضير وتوليد البوردورو';
      case 'delivery': return '3. قيد التوصيل مع الشركات';
      case 'completed': return '4. طلبيات مسلمة ومكتملة';
      case 'returned': return '5. المرتجعات والرجوع';
      case 'inbound': return 'شحنات التوريد لمستودع المنصة';
      case 'products': return 'منتجاتي والمخزون الحي';
      case 'tracking': return 'تتبع الشحنات ومزامنة API';
      case 'financial': return 'التحصيلات وسحب المستحقات وأتعاب التغليف';
      case 'analytics': return 'إحصائيات المبيعات والأداء';
      case 'profile': return 'بيانات المستودع والحساب';
      default: return 'لوحة المستودع';
    }
  };

  const getWarehouseTabSubtitle = (tab: WarehouseTab) => {
    switch (tab) {
      case 'pipeline': return 'عرض دورة حياة طلبات منتجاتك ابتداءً من قيد المراجعة في وضع المراقبة اللحظية فقط';
      case 'pending': return 'مراجعة بيانات الزبون، توفر المخزون، والتأكيد الهاتفي للشحن الفوري';
      case 'preparation': return 'طباعة ملصقات الشحن (Bordereau) وتعيين شركات التوصيل وحزم الطرود';
      case 'delivery': return 'متابعة مسار الشحنات المنطلقة مع شركات التوصيل بالتحديث اللحظي';
      case 'completed': return 'سجل الطلبيات المسلمة للزبائن بنجاح وتحصيل أموال الـ COD';
      case 'returned': return 'استلام الطرود المرتجعة وإعادة فحص المنتجات وإرجاعها للمخزون';
      case 'inbound': return 'استقبال وفحص شحنات كراتين الموردين وتغذية المخزون الحي للمنصة تلقائياً';
      case 'products': return 'إدارة الكتالوج، أسعار الجملة، الكميات لكل مقاس ولون، وإضافة منتجات جديدة';

      case 'tracking': return 'أداة الاستعلام اللحظي عن كود التتبع مع خوادم شركات التوصيل';
      case 'financial': return 'كشف حساب الأرباح، أتعاب التغليف والتجهيز (Pick & Pack)، والمستحقات، وتقديم طلبات سحب الأموال';
      case 'analytics': return 'معدلات تسليم الشحنات، أعلى المنتجات طلباً، ومؤشرات الأداء';
      case 'profile': return 'معلومات المستودع، أرقام CCP / BaridiMob، والعنوان للتوصيل';
      default: return '';
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [showShippingRatesModal, setShowShippingRatesModal] = useState(false);

  // Rejection Modal State
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');

  // Confirmation & Courier Selection Modal State
  const [confirmingOrderModal, setConfirmingOrderModal] = useState<Order | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('cour-ecom');

  // Shipping Label Print Modal
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Multi-select and Bulk Shipping Label Print Modal State
  const [selectedPrepOrderIds, setSelectedPrepOrderIds] = useState<string[]>([]);
  const [bulkPrintOrders, setBulkPrintOrders] = useState<Order[] | null>(null);
  const [generatingBordereauMap, setGeneratingBordereauMap] = useState<Record<string, boolean>>({});
  const [bulkTargetCourierId, setBulkTargetCourierId] = useState<string>('cour-ecom');

  const togglePrepOrderSelection = (id: string) => {
    setSelectedPrepOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // E-com Delivery API v2 State
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [pickupVehicule, setPickupVehicule] = useState<1 | 2 | 3 | 4>(2);
  const [pickupColisCount, setPickupColisCount] = useState<number>(15);
  const [pickupCommune, setPickupCommune] = useState<string>('الجزائر العاصمة');
  const [pickupHeure, setPickupHeure] = useState<string>('14:30');
  const [pickupMobile, setPickupMobile] = useState<string>('0550000000');
  const [pickupNote, setPickupNote] = useState<string>('يرجى الاتصال قبل الحضور للمستودع');

  const [showEcomSummaryModal, setShowEcomSummaryModal] = useState(false);
  const [ecomSummaryData, setEcomSummaryData] = useState<any>(null);
  const [showEcomPaiementsModal, setShowEcomPaiementsModal] = useState(false);
  const [ecomPaiementsData, setEcomPaiementsData] = useState<any[]>([]);

  // Products Inventory State
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNewProduct, setIsAddingNewProduct] = useState(false);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const [isUrlImportModalOpen, setIsUrlImportModalOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Inbound Stock Shipments to Platform Warehouse State
  const [inboundRequests, setInboundRequests] = useState<InboundStockRequest[]>(() => getStoredInboundRequests());
  const [isInboundModalOpen, setIsInboundModalOpen] = useState(false);
  const [inboundSelectedProductId, setInboundSelectedProductId] = useState<string>('');
  const [inboundQuantitySent, setInboundQuantitySent] = useState<number>(50);
  const [inboundNotes, setInboundNotes] = useState<string>('');
  const [inboundCarrier, setInboundCarrier] = useState<string>('شاحنة خاصة بالمورد');
  const [inspectingInboundRequest, setInspectingInboundRequest] = useState<InboundStockRequest | null>(null);
  const [inboundTabFilter, setInboundTabFilter] = useState<'pending' | 'received' | 'all'>('pending');

  // Phase 2: Picking Sheet & Courier Handover Manifest State
  const [isPickingModalOpen, setIsPickingModalOpen] = useState(false);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
  const [isCentralFulfillmentMode, setIsCentralFulfillmentMode] = useState(Boolean(isPlatformWarehouse));

  // Phase 3: COD Reconciliation, Returns QC & Courier Analytics State
  const [isCodReconcileModalOpen, setIsCodReconcileModalOpen] = useState(false);
  const [isReturnsQCModalOpen, setIsReturnsQCModalOpen] = useState(false);
  const [isCourierAnalyticsModalOpen, setIsCourierAnalyticsModalOpen] = useState(false);
  const [selectedTimelineOrder, setSelectedTimelineOrder] = useState<Order | null>(null);

  // Supplier Profile & Financials State
  const { user } = useAuth();
  const isDemoSupplier =
    (user?.email && user.email.toLowerCase() === 'warehouse@nouvamarket.com') ||
    user?.id === 'u-wh-1' ||
    user?.id === 'sup-demo';

  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile>(() => {
    const suppliers = getStoredSuppliers();
    const existing = suppliers.find(
      (s) => (user?.email && s.email.toLowerCase() === user.email.toLowerCase()) || (user?.phone && s.phone === user.phone) || s.id === user?.id
    );
    if (existing) return existing;

    const newSupplier: SupplierProfile = {
      id: user?.id || `sup-${Date.now().toString().slice(-4)}`,
      fullName: user?.fullName || 'مورد جديد',
      companyName: user?.storeName || `مستودع ${user?.fullName || ''}`,
      phone: user?.phone || '0550000000',
      email: user?.email || 'Warehouse@nouvamarket.com',
      password: '123',
      wilaya: user?.wilaya || '16 - الجزائر',
      activityType: 'ألبسة ونسيج',
      status: (user?.approvalStatus as any) || 'PENDING',
      ccpOrRip: 'CCP / BaridiMob Pending',
      totalSalesDzd: 0,
      nouvaCommissionDzd: 0,
      resellerCommissionsDzd: 0,
      paidAmountDzd: 0,
      remainingBalanceDzd: 0,
      totalProductsCount: 0,
      totalDeliveredOrders: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    saveStoredSuppliers([newSupplier, ...suppliers]);
    return newSupplier;
  });

  const mySupplierProducts = useMemo(() => {
    return products.filter((p) => {
      if (isDemoSupplier) {
        if (!p.supplierId && !p.supplierName) return true;
        return (
          p.supplierId === supplierProfile.id ||
          p.supplierName === supplierProfile.companyName ||
          p.supplierName === supplierProfile.fullName
        );
      }
      return (
        p.supplierId === supplierProfile.id ||
        (p.supplierEmail && p.supplierEmail.toLowerCase() === (supplierProfile.email || '').toLowerCase()) ||
        (p.supplierName && (p.supplierName === supplierProfile.companyName || p.supplierName === supplierProfile.fullName))
      );
    });
  }, [products, supplierProfile, isDemoSupplier]);

  const [settlements, setSettlements] = useState<SupplierSettlement[]>(() => {
    const allSettlements = getStoredSettlements();
    if (isDemoSupplier) {
      return allSettlements;
    }
    return allSettlements.filter((st) => st.supplierId === supplierProfile.id);
  });

  // Real-time synchronization for settlements from Admin / other tabs
  useEffect(() => {
    const handleSettlementsSync = () => {
      const allSettlements = getStoredSettlements();
      if (isDemoSupplier) {
        setSettlements(allSettlements);
      } else {
        setSettlements(allSettlements.filter((st) => st.supplierId === supplierProfile.id));
      }
    };
    window.addEventListener('nouva_settlements_updated', handleSettlementsSync);
    return () => window.removeEventListener('nouva_settlements_updated', handleSettlementsSync);
  }, [isDemoSupplier, supplierProfile.id]);

  // Financial Payout Requests & Dues State
  const [isRequestPayoutModalOpen, setIsRequestPayoutModalOpen] = useState(false);
  const [settlementFilterStatus, setSettlementFilterStatus] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'REJECTED'>('ALL');
  const [settlementSearchTerm, setSettlementSearchTerm] = useState('');
  const [payoutForm, setPayoutForm] = useState({
    amountDzd: 0,
    payoutMethod: 'BARIDIMOB' as 'BARIDIMOB' | 'CCP' | 'BANK',
    baridiMobPhoneOrRip: '',
    ccpNumber: '',
    ccpKey: '',
    bankName: 'BNA - البنك الوطني الجزائري',
    bankRib: '',
    accountHolderName: '',
    notes: '',
  });

  // Edit Payout Accounts Modal State
  const [isEditAccountsModalOpen, setIsEditAccountsModalOpen] = useState(false);
  const [editAccountsForm, setEditAccountsForm] = useState({
    accountHolderName: '',
    baridiMobNumber: '',
    ccpOrRip: '',
    bankRib: '',
    bankName: '',
  });

  // Settlement Deletion Modal State
  const [settlementToDelete, setSettlementToDelete] = useState<SupplierSettlement | null>(null);

  // Packer / Warehouse Worker Packaging Fees Withdrawals State
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(getStoredWithdrawals);
  const [isPackerWithdrawModalOpen, setIsPackerWithdrawModalOpen] = useState(false);
  const [packerWithdrawAmount, setPackerWithdrawAmount] = useState<number>(0);
  const [packerWithdrawMethod, setPackerWithdrawMethod] = useState<'BARIDIMOB' | 'CCP' | 'CASH' | 'BANK'>('BARIDIMOB');
  const [packerWithdrawAccountDetails, setPackerWithdrawAccountDetails] = useState('');
  const [packerWorkerName, setPackerWorkerName] = useState(supplierProfile.fullName || 'عامل ومغلف المستودع');
  const [packerWorkerPhone, setPackerWorkerPhone] = useState(supplierProfile.phone || user?.phone || '');
  const [packerWithdrawNotes, setPackerWithdrawNotes] = useState('');

  useEffect(() => {
    const handleWithdrawalsSync = () => {
      setWithdrawals(getStoredWithdrawals());
    };
    window.addEventListener('nouva_withdrawals_updated', handleWithdrawalsSync);
    return () => window.removeEventListener('nouva_withdrawals_updated', handleWithdrawalsSync);
  }, []);

  // Clean up legacy auto-delivery sync flag if exists to ensure strict preparation workflow
  useEffect(() => {
    try {
      localStorage.removeItem('nouva_warehouse_auto_delivery_sync');
    } catch {}
  }, []);

  const handleOpenEditAccountsModal = () => {
    setEditAccountsForm({
      accountHolderName: supplierProfile.accountHolderName || supplierProfile.fullName || supplierProfile.companyName || '',
      baridiMobNumber: supplierProfile.baridiMobNumber || (supplierProfile.ccpOrRip && supplierProfile.ccpOrRip.startsWith('007') ? supplierProfile.ccpOrRip : ''),
      ccpOrRip: supplierProfile.ccpOrRip && !supplierProfile.ccpOrRip.startsWith('007') ? supplierProfile.ccpOrRip : '',
      bankRib: supplierProfile.bankRib || '',
      bankName: supplierProfile.bankName || 'BNA - البنك الوطني الجزائري',
    });
    setIsEditAccountsModalOpen(true);
  };

  const handleSavePayoutAccounts = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SupplierProfile = {
      ...supplierProfile,
      accountHolderName: editAccountsForm.accountHolderName.trim(),
      baridiMobNumber: editAccountsForm.baridiMobNumber.trim(),
      ccpOrRip: editAccountsForm.ccpOrRip.trim() || supplierProfile.ccpOrRip,
      bankRib: editAccountsForm.bankRib.trim(),
      bankName: editAccountsForm.bankName.trim(),
    };

    setSupplierProfile(updated);

    updateSupplierProfile(supplierProfile.id, {
      accountHolderName: editAccountsForm.accountHolderName.trim(),
      baridiMobNumber: editAccountsForm.baridiMobNumber.trim(),
      ccpOrRip: editAccountsForm.ccpOrRip.trim() || supplierProfile.ccpOrRip,
      bankRib: editAccountsForm.bankRib.trim(),
      bankName: editAccountsForm.bankName.trim(),
    });

    setProfileForm((prev) => ({
      ...prev,
      ccpOrRip: editAccountsForm.ccpOrRip.trim() || prev.ccpOrRip,
    }));

    setIsEditAccountsModalOpen(false);
    onShowToast('✔ تم تحديث وحفظ بيانات حسابات السحب بنجاح!', 'success');
  };

  const handleDeleteSettlement = (settlementId: string) => {
    const target = settlements.find((s) => s.id === settlementId);
    if (!target) {
      setSettlementToDelete(null);
      return;
    }

    if (target.status !== 'PENDING') {
      onShowToast('لا يمكن حذف الطلب إلا إذا كان في حالة: قيد مراجعة وتحويل الإدارة!', 'error');
      setSettlementToDelete(null);
      return;
    }

    const success = deletePendingSupplierSettlement(settlementId, isDemoSupplier ? undefined : supplierProfile.id);
    if (success) {
      setSettlements((prev) => prev.filter((s) => s.id !== settlementId));
      onShowToast(
        `✔ تم حذف وإلغاء طلب السحب (${settlementId}) بمبلغ ${target.amountDzd?.toLocaleString()} د.ج واسترجاع المبلغ للرصيد المتاح!`,
        'success'
      );
    } else {
      onShowToast('تعذر حذف طلب السحب، يرجى إعادة المحاولة.', 'error');
    }
    setSettlementToDelete(null);
  };

  // Centrally approved couriers list managed exclusively by Admin
  const [couriers, setCouriersState] = useState<CourierPartner[]>(() => getStoredCouriers());

  useEffect(() => {
    const handleUpdate = () => {
      setCouriersState(getStoredCouriers());
    };
    window.addEventListener('nouva_couriers_updated', handleUpdate);
    return () => window.removeEventListener('nouva_couriers_updated', handleUpdate);
  }, []);

  // Analytics Filter state
  const [productAnalyticsFilter, setProductAnalyticsFilter] = useState<'ALL' | 'TOP' | 'GROWING' | 'LOW_PERFORMING'>('ALL');
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    fullName: supplierProfile.fullName,
    companyName: supplierProfile.companyName,
    phone: supplierProfile.phone,
    email: supplierProfile.email,
    wilaya: supplierProfile.wilaya,
    activityType: supplierProfile.activityType,
    ccpOrRip: supplierProfile.ccpOrRip,
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Supplier Password Change state
  const [supplierNewPassword, setSupplierNewPassword] = useState('');
  const [supplierConfirmPassword, setSupplierConfirmPassword] = useState('');
  const [showSupplierPassword, setShowSupplierPassword] = useState(false);
  const [supplierPasswordError, setSupplierPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const cleanEmail = profileForm.email.trim().toLowerCase();
    const updated: SupplierProfile = {
      ...supplierProfile,
      ...profileForm,
      email: cleanEmail,
    };
    setSupplierProfile(updated);
    
    // Save to supplier list and update session
    updateSupplierProfile(supplierProfile.id, {
      ...profileForm,
      email: cleanEmail,
    });
    
    onShowToast('✔ تم تحديث بيانات الملف الشخصي والبريد الإلكتروني للمورد بنجاح!', 'success');
    setIsSavingProfile(false);
  };

  const handleUpdateSupplierPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSupplierPasswordError('');

    if (!supplierNewPassword.trim()) {
      setSupplierPasswordError('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (supplierNewPassword.trim().length < 6) {
      setSupplierPasswordError('كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل');
      return;
    }

    if (supplierNewPassword !== supplierConfirmPassword) {
      setSupplierPasswordError('كلمة المرور غير متطابقة مع التأكيد');
      return;
    }

    setIsUpdatingPassword(true);
    const trimmedPass = supplierNewPassword.trim();
    const success = updateSupplierPassword(supplierProfile.id, trimmedPass);
    if (supplierProfile.email) {
      updateSupplierPassword(supplierProfile.email, trimmedPass);
    }
    setIsUpdatingPassword(false);

    if (success) {
      setSupplierProfile((prev) => ({ ...prev, password: trimmedPass }));
      onShowToast('✔ تم تحديث كلمة المرور للمورد بنجاح! سيتم استخدامها حصراً لتسجيل الدخول القادم.', 'success');
      setSupplierNewPassword('');
      setSupplierConfirmPassword('');
      setSupplierPasswordError('');
    } else {
      setSupplierPasswordError('حدث خطأ أثناء حفظ كلمة المرور');
    }
  };

  // Warehouse Notification Modal State
  const [isWarehouseNotifOpen, setIsWarehouseNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(() => getUnreadNotificationsCount('warehouse'));

  useEffect(() => {
    const handleNotifUpdate = () => {
      setUnreadNotifCount(getUnreadNotificationsCount('warehouse'));
    };
    window.addEventListener('warehouse_notifications_updated', handleNotifUpdate);
    return () => window.removeEventListener('warehouse_notifications_updated', handleNotifUpdate);
  }, []);

  // Sync products when modified from modal or other component
  useEffect(() => {
    const handleProductsUpdated = () => {
      setProducts(getStoredProducts());
    };
    window.addEventListener('products_updated', handleProductsUpdated);
    return () => window.removeEventListener('products_updated', handleProductsUpdated);
  }, []);

  // API State per order (to show progressive states in قيد التحضير)
  const [retrievedLabels, setRetrievedLabels] = useState<{ [orderId: string]: boolean }>({});

  // ---------------- HANDLERS ----------------

  const handleConfirmOrderWithCourierSubmit = () => {
    if (!confirmingOrderModal) return;
    const allCouriers = getStoredCouriers(user?.id || user?.email);
    const activeCouriers = allCouriers.filter((c) => !c.isDisabled);
    const courier =
      activeCouriers.find((c) => c.id === selectedCourierId) ||
      activeCouriers[0] ||
      allCouriers[0];

    const res = confirmOrderWarehouse(confirmingOrderModal.id, {
      id: supplierProfile?.id || user?.id || 'supplier',
      name: supplierProfile?.companyName || supplierProfile?.fullName || 'المورد / المستودع',
    });

    if (!res.success) {
      onShowToast(res.message, 'error');
      setConfirmingOrderModal(null);
      return;
    }

    let prefix = 'ECOM';
    if (courier.name.toLowerCase().includes('yalidine')) prefix = 'YAL';
    else if (courier.name.toLowerCase().includes('maystro')) prefix = 'MAY';
    else if (courier.name.toLowerCase().includes('zr')) prefix = 'ZR';

    const tracking =
      confirmingOrderModal.trackingCode ||
      `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    setTrackingCode(confirmingOrderModal.id, tracking);
    updateOrder(confirmingOrderModal.id, {
      deliveryCompanySent: true,
      deliveryCompanyName: courier.name,
      trackingCode: tracking,
    });
    setRetrievedLabels((prev) => ({ ...prev, [confirmingOrderModal.id]: true }));

    onShowToast(
      `🎉 تم تأكيد الطلب #${confirmingOrderModal.id} ورفعه تلقائياً لمنصة ${courier.name} واسترجاع الملصق!`,
      'success'
    );

    addWarehouseNotification({
      type: 'order',
      titleAr: '📦 تم تأكيد الطلبية وتحويلها لقائمة التحضير',
      bodyAr: `تم ربط الطلبية #${tracking} بشركة التوصيل (${courier.name}) وجاهزة لطباعة ملصق الشحن.`,
      productId: confirmingOrderModal.items?.[0]?.productId,
      productNameAr: confirmingOrderModal.items?.[0]?.productName,
    });

    const updatedOrder: Order = {
      ...confirmingOrderModal,
      adminConfirmed: true,
      deliveryCompanySent: true,
      deliveryCompanyName: courier.name,
      trackingCode: tracking,
    };

    setConfirmingOrderModal(null);
    setPrintingOrder(updatedOrder);
  };

  const handleRejectSubmit = () => {
    if (!rejectingOrder) return;
    const finalReason = selectedReason === 'سبب آخر' ? customReason.trim() || 'سبب آخر' : selectedReason;
    rejectOrderWithReason(rejectingOrder.id, finalReason);
    onShowToast('❌ تم تسجيل عدم التأكيد وتوضيح السبب للبائع لتصحيحه.', 'info');
    setRejectingOrder(null);
    setCustomReason('');
  };

  // Helper to get active couriers for this supplier
  const activeCouriersList = useMemo(() => {
    return couriers.filter((c) => !c.isDisabled);
  }, [couriers]);

  // Find courier chosen for an order
  const findCourierForOrder = (order: Order): CourierPartner => {
    const list = activeCouriersList.length > 0 ? activeCouriersList : couriers;
    return (
      list.find((c) => c.id === (order as any).courierPartnerId) ||
      list.find((c) => c.name === order.deliveryCompanyName) ||
      list.find((c) => order.deliveryCompanyName && c.name.toLowerCase().includes(order.deliveryCompanyName.toLowerCase())) ||
      list[0] ||
      couriers[0]
    );
  };

  // Change selected courier for an order during preparation
  const handleSelectCourierForOrder = (orderId: string, courierId: string) => {
    const courier = couriers.find((c) => c.id === courierId) || activeCouriersList.find((c) => c.id === courierId);
    if (!courier) return;

    updateOrder(orderId, {
      courierPartnerId: courier.id,
      deliveryCompanyName: courier.name,
    });

    onShowToast(`🚚 تم تعيين شركة التوصيل: ${courier.name}`, 'info');
  };

  // Apply chosen courier to all selected preparation orders in bulk (or all visible preparation orders if none selected)
  const handleApplyBulkCourier = (courierId: string) => {
    const courier = couriers.find((c) => c.id === courierId) || activeCouriersList.find((c) => c.id === courierId);
    if (!courier) return;

    const visibleOrders = filterBySearch(preparationOrders);
    const targetOrderIds = selectedPrepOrderIds.length > 0
      ? selectedPrepOrderIds
      : visibleOrders.map((o) => o.id);

    if (targetOrderIds.length === 0) {
      onShowToast('لا توجد طلبيات متاحة لتطبيق شركة التوصيل عليها', 'info');
      return;
    }

    if (updateOrdersBatch) {
      updateOrdersBatch(targetOrderIds, {
        courierPartnerId: courier.id,
        deliveryCompanyName: courier.name,
      });
    } else {
      targetOrderIds.forEach((orderId) => {
        updateOrder(orderId, {
          courierPartnerId: courier.id,
          deliveryCompanyName: courier.name,
        });
      });
    }

    const scopeLabel = selectedPrepOrderIds.length > 0
      ? `لـ ${targetOrderIds.length} طلبية محددة`
      : `لجميع طلبات التحضير المعروضة (${targetOrderIds.length} طلبية)`;

    onShowToast(`⚡ تم التغيير التلقائي الفوري لشركة التوصيل (${courier.name}) ${scopeLabel} بنجاح!`, 'success');
  };

  // Create Bordereau for an order via the selected courier's API
  const handleCreateBordereauForOrder = async (order: Order) => {
    const courier = findCourierForOrder(order);
    setGeneratingBordereauMap((prev) => ({ ...prev, [order.id]: true }));

    try {
      const result = await createBordereauForOrderViaCourier(order, courier, {
        id: supplierProfile.id,
        companyName: supplierProfile.companyName || supplierProfile.fullName,
        fullName: supplierProfile.fullName,
        phone: supplierProfile.phone || user?.phone || '0550000000',
        wilaya: supplierProfile.wilaya || '16 - الجزائر',
        address: supplierProfile.address || '',
      });

      if (result.success) {
        setTrackingCode(order.id, result.trackingCode);
        updateOrder(order.id, {
          trackingCode: result.trackingCode,
          bordereauUrl: result.bordereauUrl,
          deliveryCompanyName: result.courierName,
          courierPartnerId: result.courierId,
          deliveryCompanySent: true,
          situation: 'EnPréparation',
          bordereauCreatedAt: result.createdAt,
        });

        setRetrievedLabels((prev) => ({ ...prev, [order.id]: true }));
        onShowToast(result.message, 'success');

        addWarehouseNotification({
          type: 'order',
          titleAr: `📄 تم إنشاء بوردورو الشحن عبر API (${result.courierName})`,
          bodyAr: `تم توليد البوردورو للطلب #${order.id} مع رقم التتبع (${result.trackingCode}) وجاهز للطباعة.`,
          productId: order.items?.[0]?.productId,
          productNameAr: order.items?.[0]?.productName,
        });

        return {
          ...order,
          trackingCode: result.trackingCode,
          bordereauUrl: result.bordereauUrl,
          deliveryCompanyName: result.courierName,
          courierPartnerId: result.courierId,
          deliveryCompanySent: true,
        };
      }
    } catch (e) {
      onShowToast('حدث خطأ أثناء الاتصال بـ API شركة التوصيل لإنشاء البوردورو', 'error');
    } finally {
      setGeneratingBordereauMap((prev) => ({ ...prev, [order.id]: false }));
    }
    return order;
  };

  // Print Bordereau (auto-creates if missing, then opens print modal)
  const handlePrintBordereauForOrder = async (order: Order) => {
    let orderToPrint = order;
    if (!order.bordereauUrl || !order.trackingCode || !order.deliveryCompanySent) {
      const updated = await handleCreateBordereauForOrder(order);
      if (updated) orderToPrint = updated;
    }
    setPrintingOrder(orderToPrint);
  };

  // Bulk Create Bordereaux for all selected preparation orders
  const handleBulkCreateBordereaux = async () => {
    if (selectedPrepOrderIds.length === 0) {
      onShowToast('الرجاء تحديد طلبية واحدة على الأقل', 'info');
      return;
    }

    const ordersToProcess = preparationOrders.filter((o) => selectedPrepOrderIds.includes(o.id));
    for (const ord of ordersToProcess) {
      await handleCreateBordereauForOrder(ord);
    }

    onShowToast(`⚡ تم إنشاء وتوليد البوردورو لـ ${ordersToProcess.length} طلبية عبر API شركات التوصيل بنجاح!`, 'success');
  };

  // Bulk Print Bordereaux (generates any missing, then opens modal)
  const handleBulkPrintBordereaux = async () => {
    if (selectedPrepOrderIds.length === 0) {
      onShowToast('الرجاء تحديد طلبية واحدة على الأقل للطباعة', 'info');
      return;
    }

    const ordersToPrint = preparationOrders.filter((o) => selectedPrepOrderIds.includes(o.id));
    const processedOrders: Order[] = [];

    for (const ord of ordersToPrint) {
      if (!ord.bordereauUrl || !ord.trackingCode) {
        const updated = await handleCreateBordereauForOrder(ord);
        processedOrders.push(updated || ord);
      } else {
        processedOrders.push(ord);
      }
    }

    setBulkPrintOrders(processedOrders);
  };

  // STEP 2 — Button 1: Send to Shipping Platform API
  const handleSendToShippingApi = (order: Order) => {
    handleCreateBordereauForOrder(order);
  };

  // STEP 2 — Button 2: Retrieve Shipping Label API
  const handleRetrieveShippingLabel = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      handleCreateBordereauForOrder(order);
    } else {
      setRetrievedLabels((prev) => ({ ...prev, [orderId]: true }));
      onShowToast('📄 تم استرجاع ملصق الشحن عبر API بنجاح!', 'success');
    }
  };

  // STEP 2 — Button 4: Mark Package Ready
  const handleMarkPackageReady = (orderId: string) => {
    updateOrderStatus(orderId, 'SHIPPED');
    onShowToast('🚚 تم تجهيز الطرد وتأكيد تحويل الحالة تلقائياً إلى قيد التوصيل!', 'success');
  };

  // STEP 3 — Sync Delivery Status
  const handleSyncDeliveryStatus = async (order: Order) => {
    try {
      const res = await fetchLiveTrackingFromCourier(order, user?.id || user?.email);
      updateOrderStatus(order.id, res.newStatus);
      onShowToast(res.messageAr, 'success');
    } catch (e) {
      onShowToast('تعذر الاتصال بـ API شركة التوصيل. يرجى التحقق من مفتاح الـ API', 'error');
    }
  };

  const handleSubmitRamassage = async () => {
    const ecomCourier = couriers.find((c) => c.id === 'cour-ecom' || c.name.toLowerCase().includes('ecom')) || couriers[0];
    const client = new EcomDeliveryApiClient(ecomCourier?.apiKey || '3490e731e3db4d8c841991987d3cab0f', ecomCourier?.apiSecret || 'b8386c67-f0ce-4ce5-bc3b-cf3246a90819');
    
    const res = await client.requestPickup({
      nb_colis: pickupColisCount,
      type_vehicule: pickupVehicule,
      commune: pickupCommune,
      heure: pickupHeure,
      mobile: pickupMobile,
      note: pickupNote,
    });

    onShowToast(res.messageAr, 'success');
    setIsPickupModalOpen(false);
  };

  // Products Save Handler
  const handleSaveProductFromWarehouse = (savedProduct: Product) => {
    let isNew = false;
    const productWithSupplier: Product = {
      ...savedProduct,
      supplierId: savedProduct.supplierId || supplierProfile.id,
      supplierName: savedProduct.supplierName || supplierProfile.companyName || supplierProfile.fullName,
      supplierEmail: savedProduct.supplierEmail || supplierProfile.email,
    };
    setProducts((prev) => {
      const exists = prev.some((x) => x.id === productWithSupplier.id);
      isNew = !exists || isAddingNewProduct;
      const updated = exists
        ? prev.map((x) => (x.id === productWithSupplier.id ? productWithSupplier : x))
        : [productWithSupplier, ...prev];
      saveStoredProducts(updated);
      return updated;
    });

    const totalStock = savedProduct.variants.reduce((acc, v) => acc + (Number(v.stockCount) || 0), 0);

    if (isNew) {
      addSellerNotification({
        type: 'product_add',
        titleAr: '📦 منتج جديد متوفر بالمتجر!',
        bodyAr: `تم إضافة منتج جديد "${savedProduct.nameAr}" بالمستودع بسعر جملة ${savedProduct.wholesalePrice} دج. ابدأ التسويق الآن!`,
        productId: savedProduct.id,
        productNameAr: savedProduct.nameAr,
      });
      addWarehouseNotification({
        type: 'product_add',
        titleAr: '📦 تم إدخال منتج جديد لمخزون المستودع',
        bodyAr: `تم إضافة المنتج "${savedProduct.nameAr}" [إجمالي الكمية: ${totalStock} قطعة].`,
        productId: savedProduct.id,
        productNameAr: savedProduct.nameAr,
      });
      onShowToast('✔ تم حفظ المنتج وإرسال إشعار للبائعين بتوفر المنتج الجديد!', 'success');
    } else {
      addSellerNotification({
        type: 'stock_update',
        titleAr: '🔄 تحديث الكمية والمخزون بالمستودع',
        bodyAr: `قام المستودع بتحديث كميات ومخزون المنتج "${savedProduct.nameAr}" [إجمالي الكمية: ${totalStock} قطعة].`,
        productId: savedProduct.id,
        productNameAr: savedProduct.nameAr,
      });
      addWarehouseNotification({
        type: 'stock_update',
        titleAr: '🔄 تم تحديث المخزون بالمستودع بنجاح',
        bodyAr: `تم حفظ تحديث كميات المنتج "${savedProduct.nameAr}" [إجمالي الكمية الحالية: ${totalStock} قطعة].`,
        productId: savedProduct.id,
        productNameAr: savedProduct.nameAr,
      });
      onShowToast('✔ تم حفظ المنتج وتحديث الكمية وإرسال إشعار للبائعين!', 'success');
    }

    setEditingProduct(null);
    setIsAddingNewProduct(false);
  };

  const handleDeleteProductFromWarehouse = (productId: string) => {
    deleteStoredProduct(productId);
    setProducts((prev) => {
      const prod = prev.find((p) => p.id === productId);
      const updated = prev.filter((p) => p.id !== productId);
      onShowToast(`🗑️ تم حذف المنتج (${prod?.nameAr || ''}) نهائياً من المستودع!`, 'info');
      return updated;
    });
  };

  const [showOnlyMyProducts, setShowOnlyMyProducts] = useState(true);

  const handleOpenAddProduct = () => {
    const newP: Product = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      nameAr: '',
      nameFr: '',
      categoryAr: categories[0]?.nameAr || 'منتجات البشرة والجسم',
      categoryFr: categories[0]?.nameFr || 'Soins Peau & Corps',
      ageGroup: 'all',
      gender: 'unisex',
      wholesalePrice: 0,
      floorPrice: 0,
      suggestedSellingPrice: 0,
      ceilingPrice: 0,
      descriptionAr: '',
      descriptionFr: '',
      featuresAr: [],
      featuresFr: [],
      images: [],
      variants: [
        { id: `v1-${Date.now()}`, size: 'Standard', color: 'Original', colorHex: '#2563eb', stockCount: 0 },
      ],
      supplierId: supplierProfile.id,
      supplierName: supplierProfile.companyName || supplierProfile.fullName,
      nouvaFeePercent: getStoredMarketplaceFees().supplierFeePercent || 5,
      isNewArrival: true,
    };
    setEditingProduct(newP);
    setIsAddingNewProduct(true);
  };

  // Date Filter State
  const [dateMode, setDateMode] = useState<DateFilterMode>('all');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const dateFilteredOrders = orders.filter((o) =>
    matchesDateFilter(o.createdAt, dateMode, singleDate, startDate, endDate)
  );

  // FILTERED ORDERS FOR WORKFLOW TABS
  const pendingOrders = dateFilteredOrders.filter(
    (o) =>
      !o.adminConfirmed &&
      !o.isLockedForEdit &&
      !o.confirmedBy &&
      o.status !== 'LINK_ORDER' &&
      o.status !== 'CONFIRMED' &&
      o.status !== 'PROCESSING' &&
      o.status !== 'SHIPPED' &&
      o.status !== 'DELIVERED' &&
      o.status !== 'CANCELLED' &&
      o.status !== 'FAILED' &&
      o.situation !== 'EnPréparation' &&
      o.situation !== 'Confirmé' &&
      o.situation !== 'PrêtÀExpédier'
  );

  const preparationOrders = dateFilteredOrders.filter((o) => {
    return (
      (o.adminConfirmed || o.status === 'PROCESSING' || o.status === 'CONFIRMED' || o.situation === 'EnPréparation') &&
      o.status !== 'SHIPPED' &&
      o.status !== 'DELIVERED' &&
      o.status !== 'CANCELLED' &&
      o.status !== 'FAILED'
    );
  });

  const deliveryOrders = dateFilteredOrders.filter((o) => {
    return o.status === 'SHIPPED';
  });

  const completedOrders = dateFilteredOrders.filter((o) => o.status === 'DELIVERED');

  const returnedOrders = dateFilteredOrders.filter(
    (o) =>
      !o.returnedToWarehouse &&
      o.situation !== 'RetourReçu' &&
      (o.status === 'FAILED' ||
        o.status === 'CANCELLED' ||
        o.situation === 'Retour')
  );

  // SUPPLIER PIPELINE: Orders belonging to this supplier starting from REVIEW
  const supplierOrders = useMemo(() => {
    return dateFilteredOrders.filter((order) => {
      if (order.status === 'LINK_ORDER') return false;
      if (isDemoSupplier) return true;
      return order.items?.some((it) =>
        it.supplierId === supplierProfile.id ||
        (it.supplierName && (it.supplierName === supplierProfile.companyName || it.supplierName === supplierProfile.fullName))
      );
    });
  }, [dateFilteredOrders, isDemoSupplier, supplierProfile]);

  const [supplierPipelineFilter, setSupplierPipelineFilter] = useState<
    'ALL' | 'REVIEW' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'FAILED'
  >('ALL');

  const supplierReviewCount = useMemo(
    () =>
      supplierOrders.filter(
        (o) =>
          o.status === 'PENDING' ||
          (!o.adminConfirmed &&
            o.status !== 'CONFIRMED' &&
            o.status !== 'PROCESSING' &&
            o.status !== 'SHIPPED' &&
            o.status !== 'DELIVERED' &&
            o.status !== 'FAILED' &&
            o.status !== 'CANCELLED' &&
            o.situation !== 'Confirmé' &&
            o.situation !== 'EnPréparation')
      ).length,
    [supplierOrders]
  );
  const supplierConfirmedCount = useMemo(
    () =>
      supplierOrders.filter(
        (o) =>
          (o.status === 'CONFIRMED' || o.situation === 'Confirmé') &&
          o.status !== 'PROCESSING' &&
          o.status !== 'SHIPPED' &&
          o.status !== 'DELIVERED'
      ).length,
    [supplierOrders]
  );
  const supplierProcessingCount = useMemo(
    () =>
      supplierOrders.filter(
        (o) =>
          (o.status === 'PROCESSING' || o.situation === 'EnPréparation') &&
          o.status !== 'SHIPPED' &&
          o.status !== 'DELIVERED'
      ).length,
    [supplierOrders]
  );
  const supplierShippedCount = useMemo(
    () => supplierOrders.filter((o) => o.status === 'SHIPPED').length,
    [supplierOrders]
  );
  const supplierDeliveredCount = useMemo(
    () => supplierOrders.filter((o) => o.status === 'DELIVERED').length,
    [supplierOrders]
  );
  const supplierFailedCount = useMemo(
    () =>
      supplierOrders.filter(
        (o) => o.status === 'FAILED' || o.status === 'CANCELLED' || o.situation === 'Retour'
      ).length,
    [supplierOrders]
  );

  const filteredSupplierPipelineOrders = useMemo(() => {
    return supplierOrders.filter((o) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matches =
          o.id.toLowerCase().includes(term) ||
          o.customerName?.toLowerCase().includes(term) ||
          o.phone?.includes(term) ||
          o.wilaya?.toLowerCase().includes(term) ||
          o.trackingCode?.toLowerCase().includes(term);
        if (!matches) return false;
      }

      if (supplierPipelineFilter === 'ALL') return true;
      if (supplierPipelineFilter === 'REVIEW') {
        return (
          o.status === 'PENDING' ||
          (!o.adminConfirmed &&
            o.status !== 'CONFIRMED' &&
            o.status !== 'PROCESSING' &&
            o.status !== 'SHIPPED' &&
            o.status !== 'DELIVERED' &&
            o.status !== 'FAILED' &&
            o.status !== 'CANCELLED' &&
            o.situation !== 'Confirmé' &&
            o.situation !== 'EnPréparation')
        );
      }
      if (supplierPipelineFilter === 'CONFIRMED') {
        return (
          (o.status === 'CONFIRMED' || o.situation === 'Confirmé') &&
          o.status !== 'PROCESSING' &&
          o.status !== 'SHIPPED' &&
          o.status !== 'DELIVERED'
        );
      }
      if (supplierPipelineFilter === 'PROCESSING') {
        return (
          (o.status === 'PROCESSING' || o.situation === 'EnPréparation') &&
          o.status !== 'SHIPPED' &&
          o.status !== 'DELIVERED'
        );
      }
      if (supplierPipelineFilter === 'SHIPPED') return o.status === 'SHIPPED';
      if (supplierPipelineFilter === 'DELIVERED') return o.status === 'DELIVERED';
      if (supplierPipelineFilter === 'FAILED') {
        return o.status === 'FAILED' || o.status === 'CANCELLED' || o.situation === 'Retour';
      }
      return true;
    });
  }, [supplierOrders, supplierPipelineFilter, searchTerm]);

  // Helper to calculate wholesale dues for a given order belonging to this supplier
  const getOrderWholesaleAmount = useCallback(
    (order: Order): number => {
      if (!order) return 0;
      if (!order.items || order.items.length === 0) {
        return Math.round((order.totalAmount || 0) * 0.7);
      }
      const matchingItems = order.items.filter((it) => {
        if (isDemoSupplier) return true;
        return (
          it.supplierId === supplierProfile.id ||
          (it.supplierName &&
            (it.supplierName === supplierProfile.companyName ||
              it.supplierName === supplierProfile.fullName))
        );
      });
      const targetItems = matchingItems.length > 0 ? matchingItems : isDemoSupplier ? order.items : [];
      if (targetItems.length === 0) return 0;

      return targetItems.reduce((acc, it) => {
        const qty = it.quantity || 1;
        const price =
          it.wholesalePrice ||
          it.supplierNetPrice ||
          (it.sellingPrice ? Math.round(it.sellingPrice * 0.75) : 0);
        return acc + price * qty;
      }, 0);
    },
    [isDemoSupplier, supplierProfile]
  );

  // Supplier Wholesale Financial Metrics
  const totalDeliveredWholesale = useMemo(() => {
    return completedOrders.reduce((acc, o) => acc + getOrderWholesaleAmount(o), 0);
  }, [completedOrders, getOrderWholesaleAmount]);

  const inTransitWholesale = useMemo(() => {
    return (
      deliveryOrders.reduce((acc, o) => acc + getOrderWholesaleAmount(o), 0) +
      preparationOrders.reduce((acc, o) => acc + getOrderWholesaleAmount(o), 0)
    );
  }, [deliveryOrders, preparationOrders, getOrderWholesaleAmount]);

  const paidPayoutsAmount = useMemo(() => {
    return settlements
      .filter((st) => st.status === 'COMPLETED')
      .reduce((sum, st) => sum + (st.amountDzd || 0), 0);
  }, [settlements]);

  const pendingPayoutsAmount = useMemo(() => {
    return settlements
      .filter((st) => st.status === 'PENDING')
      .reduce((sum, st) => sum + (st.amountDzd || 0), 0);
  }, [settlements]);

  // Available balance for supplier withdrawal
  const availableBalance = useMemo(() => {
    const baseWholesale =
      totalDeliveredWholesale > 0 ? totalDeliveredWholesale : isDemoSupplier ? 142000 : 0;
    const calculated = baseWholesale - (paidPayoutsAmount + pendingPayoutsAmount);
    return Math.max(0, calculated);
  }, [totalDeliveredWholesale, paidPayoutsAmount, pendingPayoutsAmount, isDemoSupplier]);

  const handleOpenPayoutModal = (presetAmount?: number) => {
    if (availableBalance <= 0) {
      onShowToast('رصيدك المتاح للسحب هو 0 د.ج. لا يمكنك تقديم طلب سحب إلا بعد تسليم طلبيات المنتجات وتحصيل مستحقات الجملة.', 'error');
      return;
    }
    const defaultAmount = presetAmount !== undefined ? Math.min(presetAmount, availableBalance) : availableBalance;
    const ccpParts = (supplierProfile.ccpOrRip || '').split('Clé');
    const ccpNum = ccpParts[0]?.trim() || '';
    const ccpK = ccpParts[1]?.trim() || '';

    setPayoutForm({
      amountDzd: defaultAmount,
      payoutMethod: 'BARIDIMOB',
      baridiMobPhoneOrRip:
        supplierProfile.baridiMobNumber ||
        (supplierProfile.ccpOrRip && supplierProfile.ccpOrRip.startsWith('007')
          ? supplierProfile.ccpOrRip
          : '00799999000123456789'),
      ccpNumber:
        ccpNum ||
        (supplierProfile.ccpOrRip && !supplierProfile.ccpOrRip.startsWith('007')
          ? supplierProfile.ccpOrRip.split(' ')[0]
          : '1234567'),
      ccpKey: ccpK || '89',
      bankName: supplierProfile.bankName || 'BNA - البنك الوطني الجزائري',
      bankRib: supplierProfile.bankRib || '00100999000012345678',
      accountHolderName: supplierProfile.accountHolderName || supplierProfile.fullName || supplierProfile.companyName || 'المورد المعتمد',
      notes: '',
    });
    setIsRequestPayoutModalOpen(true);
  };

  const handleRequestSupplierPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (availableBalance <= 0) {
      onShowToast('رصيدك المتاح للسحب حالياً هو 0 د.ج. لا يمكنك سحب أي مبلغ!', 'error');
      return;
    }

    if (!payoutForm.amountDzd || payoutForm.amountDzd <= 0) {
      onShowToast('يرجى إدخال مبلغ سحب صالح أكبر من 0 د.ج!', 'error');
      return;
    }

    if (payoutForm.amountDzd < 1000) {
      onShowToast('الحد الأدنى لطلب سحب المستحقات هو 1,000 د.ج!', 'error');
      return;
    }

    if (payoutForm.amountDzd > availableBalance) {
      onShowToast(
        `لا يمكنك سحب مبلغ أكبر من رصيدك المتاح! المبلغ المطلوب (${payoutForm.amountDzd.toLocaleString()} د.ج) يتجاوز الرصيد المتاح للسحب (${availableBalance.toLocaleString()} د.ج).`,
        'error'
      );
      return;
    }

    let accountDetailsStr = '';
    if (isPlatformWarehouse) {
      accountDetailsStr = 'الخزينة المركزية الرسمية لمنصة Nouva Market (Platform Central Operating Treasury)';
    } else if (payoutForm.payoutMethod === 'BARIDIMOB') {
      accountDetailsStr = `BaridiMob: ${payoutForm.baridiMobPhoneOrRip || supplierProfile.baridiMobNumber || supplierProfile.ccpOrRip || '00799999000123456789'}`;
    } else if (payoutForm.payoutMethod === 'CCP') {
      accountDetailsStr = `CCP: ${payoutForm.ccpNumber || '1234567'} Clé: ${payoutForm.ccpKey || '89'}`;
    } else {
      accountDetailsStr = `بنك: ${payoutForm.bankName} - RIB: ${payoutForm.bankRib || '00100999000012345678'} (${payoutForm.accountHolderName})`;
    }

    const newSettlement = requestSupplierPayout(
      supplierProfile.id,
      payoutForm.amountDzd,
      isPlatformWarehouse ? 'BANK' : payoutForm.payoutMethod,
      accountDetailsStr,
      payoutForm.notes || (isPlatformWarehouse ? 'ترحيل تحصيلات مستودع المنصة إلى الخزينة المركزية' : 'طلب سحب مستحقات مبيعات الجملة')
    );

    setSettlements((prev) => {
      if (prev.some((s) => s.id === newSettlement.id)) return prev;
      return [newSettlement, ...prev];
    });

    if (isPlatformWarehouse) {
      addWarehouseNotification({
        titleAr: 'تم ترحيل التحصيلات إلى الخزينة المركزية 🏛️',
        bodyAr: `تم ترحيل تحصيلات مستودع المنصة بمبلغ ${payoutForm.amountDzd.toLocaleString()} د.ج إلى حساب الخزينة المركزية بنجاح.`,
        type: 'wallet',
      });
      addAdminNotification({
        titleAr: 'ترحيل تحصيلات مستودع المنصة 🏛️',
        bodyAr: `تم تسجيل ترحيل مبلغ ${payoutForm.amountDzd.toLocaleString()} د.ج من عوائد مستودع المنصة إلى الخزينة المركزية.`,
        type: 'wallet',
      });
      setIsRequestPayoutModalOpen(false);
      onShowToast(
        `✔ تم ترحيل تحصيلات مستودع المنصة بمبلغ ${payoutForm.amountDzd.toLocaleString()} د.ج بنجاح إلى الخزينة المركزية!`,
        'success'
      );
    } else {
      addWarehouseNotification({
        titleAr: 'تم إرسال طلب سحب المستحقات 💰',
        bodyAr: `تم تقديم طلب سحب مستحقات جملة بمبلغ ${payoutForm.amountDzd.toLocaleString()} د.ج بنجاح وبانتظار تحويل الإدارة.`,
        type: 'wallet',
      });
      addAdminNotification({
        titleAr: 'طلب سحب مستحقات جديد لمورد 🔔',
        bodyAr: `المورد ${supplierProfile.companyName || supplierProfile.fullName} طلب سحب مستحقات بمبلغ ${payoutForm.amountDzd.toLocaleString()} د.ج (${payoutForm.payoutMethod}).`,
        type: 'wallet',
      });
      setIsRequestPayoutModalOpen(false);
      onShowToast(
        `✔ تم إرسال طلب سحب المستحقات بمبلغ ${payoutForm.amountDzd.toLocaleString()} د.ج بنجاح إلى إدارة المنصة! سيتم التحويل وإشعارك قريباً.`,
        'success'
      );
    }
  };

  // ==================== PACKER / WAREHOUSE WORKER PACKAGING FEES LOGIC ====================
  const feeSettings = useMemo(() => getStoredMarketplaceFees(), []);
  const packagingFeePerOrder = feeSettings.pickAndPackFeeDzd ?? 100;

  const myPackerWithdrawals = useMemo(() => {
    return withdrawals.filter(
      (w) =>
        w.userType === 'PACKER' &&
        (w.sellerId === supplierProfile.id ||
          w.sellerId === 'warehouse-main' ||
          w.sellerName === packerWorkerName ||
          isDemoSupplier)
    );
  }, [withdrawals, supplierProfile.id, packerWorkerName, isDemoSupplier]);

  const totalEarnedPackagingDzd = useMemo(() => {
    return completedOrders.length * packagingFeePerOrder;
  }, [completedOrders.length, packagingFeePerOrder]);

  const paidPackerWithdrawalsDzd = useMemo(() => {
    return myPackerWithdrawals
      .filter((w) => w.status === 'APPROVED')
      .reduce((sum, w) => sum + (w.amountDzd || 0), 0);
  }, [myPackerWithdrawals]);

  const pendingPackerWithdrawalsDzd = useMemo(() => {
    return myPackerWithdrawals
      .filter((w) => w.status === 'PENDING')
      .reduce((sum, w) => sum + (w.amountDzd || 0), 0);
  }, [myPackerWithdrawals]);

  const availablePackerWithdrawalDzd = useMemo(() => {
    return Math.max(
      0,
      totalEarnedPackagingDzd - (paidPackerWithdrawalsDzd + pendingPackerWithdrawalsDzd)
    );
  }, [totalEarnedPackagingDzd, paidPackerWithdrawalsDzd, pendingPackerWithdrawalsDzd]);

  const handleOpenPackerWithdrawModal = (presetAmount?: number) => {
    if (availablePackerWithdrawalDzd <= 0) {
      onShowToast('الرصيد المتاح لأتعاب التغليف حالياً هو 0 د.ج. يتم احتساب الأتعاب فور تسليم الطرود للزبائن!', 'error');
      return;
    }
    setPackerWithdrawAmount(
      presetAmount !== undefined ? Math.min(presetAmount, availablePackerWithdrawalDzd) : availablePackerWithdrawalDzd
    );
    setIsPackerWithdrawModalOpen(true);
  };

  const handleRequestPackerPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packerWithdrawAmount || packerWithdrawAmount <= 0) {
      onShowToast('يرجى إدخال مبلغ صالح لأتعاب التغليف والتجهيز!', 'error');
      return;
    }
    if (packerWithdrawAmount > availablePackerWithdrawalDzd) {
      onShowToast(
        `المبلغ المطلوب (${packerWithdrawAmount.toLocaleString()} د.ج) أكبر من الرصيد المتاح لأتعاب التغليف (${availablePackerWithdrawalDzd.toLocaleString()} د.ج)!`,
        'error'
      );
      return;
    }
    if (packerWithdrawMethod !== 'CASH' && !packerWithdrawAccountDetails.trim()) {
      onShowToast(
        packerWithdrawMethod === 'BARIDIMOB'
          ? 'يرجى إدخال رقم هاتف BaridiMob أو الـ RIP'
          : 'يرجى إدخال رقم حساب CCP والمفتاح Clé أو رقم الحساب البنكي',
        'error'
      );
      return;
    }

    const details =
      packerWithdrawMethod === 'CASH'
        ? `استلام نقدي باليد في المستودع/المقر (${packerWorkerPhone || 'بدون هاتف'})${packerWithdrawNotes ? ` - ملاحظة: ${packerWithdrawNotes}` : ''}`
        : `${packerWithdrawAccountDetails.trim()}${packerWithdrawNotes ? ` - ملاحظة: ${packerWithdrawNotes}` : ''}`;

    createWithdrawalRequest({
      sellerId: supplierProfile.id || 'warehouse-main',
      sellerName: packerWorkerName.trim() || 'عامل ومغلف المستودع',
      storeName: `مستودع ${supplierProfile.warehouseName || 'المنصة'} (أتعاب التغليف)`,
      phone: packerWorkerPhone || '',
      amountDzd: packerWithdrawAmount,
      method: packerWithdrawMethod,
      accountDetails: details,
      userType: 'PACKER',
    });

    setWithdrawals(getStoredWithdrawals());
    setIsPackerWithdrawModalOpen(false);
    setPackerWithdrawAmount(0);
    setPackerWithdrawAccountDetails('');
    setPackerWithdrawNotes('');
    onShowToast(
      `✔ تم إرسال طلب سحب أتعاب التغليف بمبلغ ${packerWithdrawAmount.toLocaleString()} د.ج بنجاح إلى إدارة المنصة!`,
      'success'
    );
  };

  // Search Filter Helper
  const filterBySearch = (list: Order[]) => {
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (o) =>
        o.id.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        o.phone.includes(term) ||
        o.wilaya.toLowerCase().includes(term)
    );
  };

  return (
    <div className="flex-1 flex flex-row h-full overflow-hidden bg-slate-50 text-slate-900" dir="rtl">
      {/* 1. Warehouse Vertical Sidebar */}
      <WarehouseVerticalSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        counts={{
          pendingCount: pendingOrders.length,
          preparationCount: preparationOrders.length,
          deliveryCount: deliveryOrders.length,
          completedCount: completedOrders.length,
          returnedCount: returnedOrders.length,
          productsCount: mySupplierProducts.length,
          pipelineCount: supplierOrders.length,
        }}
        availableBalance={availableBalance}
        supplierName={
          isPlatformWarehouse
            ? 'مستودع المنصة'
            : supplierProfile?.companyName || supplierProfile?.fullName || 'بوابة المورّد'
        }
        isPlatformWarehouse={isPlatformWarehouse}
        onOpenPayoutModal={() => handleOpenPayoutModal()}
        onOpenPickupModal={() => setIsPickupModalOpen(true)}
        onOpenAddProduct={() => {
          setActiveTab('products');
          const newP: Product = {
            id: 'p-new-' + Date.now(),
            nameAr: '',
            nameFr: '',
            categoryAr: categories[0]?.nameAr || 'منتجات عامة',
            categoryFr: categories[0]?.nameFr || 'Produits Divers',
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
              { id: 'v1-' + Date.now(), size: 'Standard', color: 'Original', colorHex: '#2563eb', stockCount: 0 },
            ],
            supplierId: supplierProfile?.id || 'sup-01',
            supplierName: supplierProfile?.companyName || supplierProfile?.fullName || 'المستودع الرئيسي',
            isNewArrival: true,
          };
          setEditingProduct(newP);
          setIsAddingNewProduct(true);
        }}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Modern Sticky Vertical Top Navbar */}
        <header className="sticky top-0 z-20 px-3 sm:px-6 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/90 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-violet-700 hover:bg-slate-200 transition cursor-pointer shrink-0"
              title="فتح القائمة الجانبية"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current Active Tab Breadcrumb & Title */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-violet-600">لوحة المستودع</span>
                <span className="text-slate-300 text-xs">/</span>
                <h1 className="text-sm sm:text-base font-black text-slate-900 truncate flex items-center gap-1.5">
                  {getWarehouseTabTitle(activeTab)}
                </h1>
                {activeTab === 'pending' && pendingOrders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    {pendingOrders.length} معلق
                  </span>
                )}
                {activeTab === 'preparation' && preparationOrders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-100 text-violet-800 border border-violet-200 font-bold">
                    {preparationOrders.length} طرد
                  </span>
                )}
                {activeTab === 'products' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-100 text-purple-800 border border-purple-200 font-bold">
                    {mySupplierProducts.length} صنف
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                {getWarehouseTabSubtitle(activeTab)}
              </p>
            </div>
          </div>

          {/* Quick Header Action Buttons & Search */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Input in header */}
            {activeTab !== 'products' && (
              <div className="relative hidden md:block w-48 lg:w-64">
                <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم الزبون أو الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full ps-9 pe-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-violet-500 shadow-2xs transition"
                />
              </div>
            )}

            {/* Ramassage Quick Button (Platform Central Warehouse ONLY) */}
            {isPlatformWarehouse ? (
              <button
                onClick={() => setIsPickupModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="طلب سيارة جمع الطرود من المستودع المركزي (Demande Ramassage)"
              >
                <Truck className="w-3.5 h-3.5 text-violet-600" />
                <span className="hidden sm:inline">طلب راماساج للشحنات</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('inbound')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="إرسال شحنة توريد بضاعة جديدة لمستودع المنصة المركزي"
              >
                <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">📦 إرسال توريد للمستودع</span>
              </button>
            )}

            {/* Shipping Rates Modal Button */}
            <button
              onClick={() => setShowShippingRatesModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="جدول أسعار التوصيل لجميع الولايات"
            >
              <Truck className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">أسعار التوصيل</span>
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => setIsWarehouseNotifOpen(true)}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-violet-700 transition relative cursor-pointer shadow-2xs"
              title="تنبيهات وإشعارات المستودع"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              {unreadNotifCount > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center absolute -top-1 -end-1 shadow-xs border border-white animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Available Balance Pill */}
            <div
              onClick={() => handleOpenPayoutModal()}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-black cursor-pointer transition shadow-2xs ${
                isPlatformWarehouse
                  ? 'bg-violet-50 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300 hover:bg-violet-100'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
              title={
                isPlatformWarehouse
                  ? 'تحصيلات المنصة المؤكدة (انقر للترحيل إلى الخزينة المركزية)'
                  : 'رصيدك المتاح للسحب (انقر لطلب سحب)'
              }
            >
              <span>{isPlatformWarehouse ? 'التحصيلات:' : 'المتاح:'}</span>
              <span className={`font-mono ${isPlatformWarehouse ? 'text-violet-700 dark:text-violet-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {availableBalance.toLocaleString()} دج
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Search Bar if active */}
        {activeTab !== 'products' && (
          <div className="md:hidden px-3 pt-3">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث باسم الزبون، الهاتف، أو ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full ps-9 pe-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 shadow-2xs transition"
              />
            </div>
          </div>
        )}

        {/* Inner Scrollable Workspace */}
        <div className="p-3 sm:p-6 space-y-4 max-w-7xl w-full mx-auto pb-24">
          {/* LOW STOCK ALERT BANNER FOR WAREHOUSE */}
      <LowStockBanner
        products={products}
        onOpenModal={() => setIsLowStockModalOpen(true)}
        roleName="المستودع"
      />

      {/* DATE FILTER BAR */}
      <DateFilterBar
        dateMode={dateMode}
        setDateMode={setDateMode}
        singleDate={singleDate}
        setSingleDate={setSingleDate}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />

      {/* ==================== TAB: حركة الطلبيات (المزامنة الحية للمورد) ==================== */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Executive Supplier KPIs (المبيعات، أتعاب التغليف والتجهيز، نسبة التسليم، الرصيد، والطلبات النشطة) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* KPI 1: Available Balance */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                <span>المستحقات المتاحة للسحب</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2.5 flex items-baseline justify-between gap-2">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                  {availableBalance.toLocaleString()} <span className="text-xs">دج</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenPayoutModal()}
                  disabled={availableBalance <= 0}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition active:scale-95 shadow-xs cursor-pointer ${
                    availableBalance > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  طلب سحب
                </button>
              </div>
            </div>

            {/* KPI 2: Pick & Pack for Platform Warehouse OR Supplier Products for Suppliers */}
            {isPlatformWarehouse ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-amber-950/30 border-2 border-amber-300 dark:border-amber-700/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-bold">
                    <span>أتعاب التغليف والتجهيز (Pick & Pack)</span>
                    <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
                      {availablePackerWithdrawalDzd.toLocaleString()} <span className="text-xs">دج</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenPackerWithdrawModal()}
                      disabled={availablePackerWithdrawalDzd <= 0}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition active:scale-95 shadow-xs ${
                        availablePackerWithdrawalDzd > 0
                          ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                          : 'bg-amber-200/50 text-amber-600/60 dark:bg-amber-950/50 dark:text-amber-700/50 cursor-not-allowed'
                      }`}
                    >
                      سحب الأتعاب
                    </button>
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-1 flex-wrap">
                  <span className="text-[9px] font-black text-amber-900 dark:text-amber-200 bg-amber-200/70 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                    مضمونة 100% على عاتق الإدارة
                  </span>
                  <span className="text-[9px] text-amber-700/80 dark:text-amber-400/80 font-medium">
                    ({completedOrders.length} مسلّمة × {packagingFeePerOrder} دج)
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                  <span>منتجاتي الموردة بالمستودع</span>
                  <Package className="w-4 h-4 text-purple-600" />
                </div>
                <div className="mt-2.5 flex items-baseline justify-between gap-2">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {mySupplierProducts.length} <span className="text-xs">منتج معتمد</span>
                  </span>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                    متاح للبيع
                  </span>
                </div>
              </div>
            )}

            {/* KPI 3: Delivered Wholesale GMV */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                <span>إجمالي مبيعات الجملة</span>
                <CheckCircle2 className="w-4 h-4 text-violet-600" />
              </div>
              <div className="mt-2.5 flex items-baseline justify-between gap-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {totalDeliveredWholesale.toLocaleString()} <span className="text-xs">دج</span>
                </span>
                <span className="text-[10px] text-violet-700 dark:text-violet-300 font-bold bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800">
                  {completedOrders.length} مسلّمة 🎉
                </span>
              </div>
            </div>

            {/* KPI 4: Delivery Rate */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                <span>نسبة نجاح التسليم</span>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2.5 flex items-baseline justify-between gap-2">
                <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {completedOrders.length + returnedOrders.length > 0
                    ? `${((completedOrders.length / (completedOrders.length + returnedOrders.length)) * 100).toFixed(1)}%`
                    : isDemoSupplier
                    ? '86.4%'
                    : '100%'}
                </span>
                <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                  معدل ممتاز ✨
                </span>
              </div>
            </div>

            {/* KPI 5: Active Orders in Pipeline */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                <span>الطلبات النشطة في المسار</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2.5 flex items-baseline justify-between gap-2">
                <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {supplierShippedCount + supplierProcessingCount}
                </span>
                <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  تجهيز وتوصيل 🚚
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Wholesale Dues Breakdown: Delivered vs In-Transit */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    {isPlatformWarehouse
                      ? 'تحصيلات وعوائد مبيعات مستودع المنصة (المحررة vs قيد التوصيل)'
                      : 'تفصيل دورة مستحقات الجملة (المحررة vs قيد التوصيل)'}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isPlatformWarehouse
                      ? 'متابعة العوائد المحصلة من السلع المسلّمة والجاهزة للترحيل إلى خزينة المنصة'
                      : 'مقارنة دقيقة بين مستحقات السلع المسلّمة الجاهزة للسحب ومستحقات السلع التي خرجت مع الناقل'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card 1: مستحقات طرود سُلّمت (جاهزة للسحب / للترحيل) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-2 border-emerald-500/30 dark:border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {isPlatformWarehouse
                        ? 'تحصيلات مؤكدة (جاهزة للترحيل للخزينة)'
                        : 'مستحقات سُلّمت (جاهزة للسحب)'}
                    </span>
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {completedOrders.length} طلب مسلّم
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {availableBalance.toLocaleString()} <span className="text-xs">دج</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenPayoutModal()}
                    disabled={availableBalance <= 0}
                    className={`text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                      availableBalance > 0
                        ? 'text-emerald-700 dark:text-emerald-300 hover:underline'
                        : 'text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>{isPlatformWarehouse ? 'ترحيل للخزينة' : 'طلب سحب'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-emerald-500/10 pt-2">
                  {isPlatformWarehouse
                    ? 'عوائد بيع السلع المحصلة ورسوم التجهيز والتغليف للطرود المسلّمة، جاهزة للتحويل مباشرة إلى الخزينة المركزية للمنصة.'
                    : 'مستحقات بيع الجملة لسلع تم تسليمها وتحصيل ثمنها، محررة بحسابك وجاهزة للتحويل الفوري عبر CCP أو BaridiMob.'}
                </p>
              </div>

              {/* Card 2: مستحقات طرود في الطريق (In-Transit) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border-2 border-blue-500/30 dark:border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-black text-blue-800 dark:text-blue-300">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>مستحقات مع الناقل (In-Transit)</span>
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {deliveryOrders.length} طرد مع الناقل
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                    +{inTransitWholesale.toLocaleString()} <span className="text-xs">دج</span>
                  </div>
                  {preparationOrders.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({preparationOrders.length} طرد قيد التجهيز)
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-blue-500/10 pt-2">
                  سلع خرجت للتوصيل الفعلي لدى شركات الشحن، وتُضاف مستحقات جملتها تلقائياً إلى رصيدك المتاح فور إتمام التسليم.
                </p>
              </div>
            </div>
          </div>

          {/* Pipeline Horizontal Status Tabs (Starting from Review) */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', labelAr: 'الكل', count: supplierOrders.length, color: 'bg-slate-100 text-slate-800' },
              { id: 'REVIEW', labelAr: '🔍 قيد المراجعة', count: supplierReviewCount, color: 'bg-amber-100 text-amber-800' },
              { id: 'CONFIRMED', labelAr: '✅ تم التأكيد', count: supplierConfirmedCount, color: 'bg-blue-100 text-blue-800' },
              { id: 'PROCESSING', labelAr: '📦 قيد التحضير', count: supplierProcessingCount, color: 'bg-purple-100 text-purple-800' },
              { id: 'SHIPPED', labelAr: '🚚 قيد التوصيل', count: supplierShippedCount, color: 'bg-indigo-100 text-indigo-800' },
              { id: 'DELIVERED', labelAr: '🎉 تم التسليم', count: supplierDeliveredCount, color: 'bg-emerald-100 text-emerald-800' },
              { id: 'FAILED', labelAr: '❌ فشل التسليم', count: supplierFailedCount, color: 'bg-rose-100 text-rose-800' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSupplierPipelineFilter(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                  supplierPipelineFilter === tab.id
                    ? 'bg-violet-600 text-white shadow-xs scale-102 ring-2 ring-violet-400/40'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span>{tab.labelAr}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    supplierPipelineFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : tab.color
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Supplier Orders List */}
          {filteredSupplierPipelineOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p>لا توجد طلبات في هذه المرحلة حالياً.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSupplierPipelineOrders.map((order, idx) => {
                const wholesaleAmount = getOrderWholesaleAmount(order);
                const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-DZ') : '-';

                // Status badge display info
                let statusBadge = {
                  label: 'قيد المراجعة',
                  color: 'bg-amber-100 text-amber-900 border-amber-300',
                  dot: 'bg-amber-500',
                };
                if (order.status === 'CONFIRMED' || order.situation === 'Confirmé') {
                  statusBadge = {
                    label: 'مؤكدة هاتفياً • بانتظار التجهيز بالمنصة',
                    color: 'bg-blue-100 text-blue-900 border-blue-300',
                    dot: 'bg-blue-500',
                  };
                } else if (order.status === 'PROCESSING' || order.situation === 'EnPréparation') {
                  statusBadge = {
                    label: 'قيد التجهيز والتغليف بمستودع المنصة',
                    color: 'bg-purple-100 text-purple-900 border-purple-300',
                    dot: 'bg-purple-500',
                  };
                } else if (order.status === 'SHIPPED') {
                  statusBadge = {
                    label: 'في الطريق مع شركة التوصيل',
                    color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                    dot: 'bg-indigo-500',
                  };
                } else if (order.status === 'DELIVERED') {
                  statusBadge = {
                    label: 'تم التسليم بنجاح • أرباح الجملة مضافة',
                    color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                    dot: 'bg-emerald-500',
                  };
                } else if (order.status === 'FAILED' || order.status === 'CANCELLED' || order.situation === 'Retour') {
                  statusBadge = {
                    label: 'فشل التسليم • أعيدت للمخزون',
                    color: 'bg-rose-100 text-rose-900 border-rose-300',
                    dot: 'bg-rose-500',
                  };
                }

                return (
                  <div
                    key={`${order.id || 'sup-ord'}-${idx}`}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition hover:border-violet-300 dark:hover:border-violet-800"
                  >
                    {/* Header: ID, Date, Status Badge, Timeline Button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          #{order.id}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1.5 ${statusBadge.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot} animate-pulse`} />
                          <span>{statusBadge.label}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedTimelineOrder(order)}
                          className="px-2 py-0.5 rounded-md bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                          title="عرض المسار اللحظي والمزامنة عبر كافة الداشبوردات"
                        >
                          <Clock className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                          <span>المسار اللحظي ⚡</span>
                        </button>
                      </div>

                      <div className="text-end font-mono text-xs">
                        <span className="text-[10px] text-slate-400 block">تاريخ الإضافة:</span>
                        <span className="font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                          {orderDate}
                        </span>
                      </div>
                    </div>

                    {/* Customer Location & Courier Tracking */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">وجهة التوصيل:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {order.wilaya} {order.commune ? `• ${order.commune}` : ''}
                        </span>
                      </div>

                      {order.trackingCode && (
                        <div className="sm:text-end">
                          <span className="text-[10px] text-slate-400 block">رقم التتبع (Tracking):</span>
                          <span className="font-mono font-black text-xs text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 inline-block">
                            {order.trackingCode}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Products belonging to this Supplier */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 text-xs">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        المنتجات التابعة لمستودعك في هذا الطلب:
                      </span>
                      {order.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between items-center font-bold">
                          <span className="text-slate-800 dark:text-slate-200">
                            • {item.productName}{' '}
                            <span className="text-purple-500 font-medium text-[11px]">
                              ({item.variantSize || 'قياسي'} / {item.variantColor || 'افتراضي'})
                            </span>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border text-[11px]">
                              × {item.quantity}
                            </span>
                            <span className="font-mono text-purple-700 dark:text-purple-300 text-xs font-bold">
                              {((item.wholesalePrice || item.supplierNetPrice || 0) * (item.quantity || 1)).toLocaleString()} دج
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Supplier Wholesale Net Total & Reassurance Notice */}
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                      <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-200">
                        <DollarSign className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>مستحقات سعر الجملة الصافية لهذا الطلب:</span>
                      </div>
                      <span className="font-mono text-sm font-black text-purple-700 dark:text-purple-300">
                        +<MoneyText amount={wholesaleAmount} />
                      </span>
                    </div>

                    {/* Read-Only Observation Notice */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
                      <span>👁️ وضع المراقبة اللحظية فقط • المزامنة ثنائية الاتجاه مع المنصة</span>
                      <span className="font-medium text-slate-500">
                        {order.status === 'DELIVERED' ? '✔ مضاف للرصيد المتاح' : '⏳ يضاف للرصيد فور التسليم'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 1: قيد المراجعة ==================== */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              الطلبات الجديدة المقدمة من البائعين. قم بالتأكد من توفر المخزون وصحة العنوان والهاتف ثم اختر التأكيد أو رفض الطلب مع ذكر السبب.
            </span>
          </div>

          <div className="space-y-3">
            {filterBySearch(pendingOrders).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                لا توجد طلبات معلقة بانتظار المراجعة حالياً.
              </div>
            ) : (
              filterBySearch(pendingOrders).map((order, idx) => (
                <div
                  key={`${order.id || 'ord'}-${idx}`}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 shadow-xs space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                        #{order.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-black">
                        قيد المراجعة
                      </span>
                      <span className="text-[10px] text-slate-400">
                        البائع: بائع متميز
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedTimelineOrder(order)}
                        className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="عرض مسار وتزامن الطلبية عبر جميع الداشبوردات"
                      >
                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>المسار اللحظي ⚡</span>
                      </button>
                    </div>

                    <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-xs">
                      COD: <MoneyText amount={order.totalAmount + order.shippingFee} />
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">معلومات العميل:</span>
                      <span className="font-black text-slate-900 dark:text-white block">{order.customerName}</span>
                      <span className="font-mono text-slate-500 block">{order.phone}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">الولاية والعنوان:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {order.wilaya} — {order.commune}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">{order.address}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-xs">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">المنتجات المطلوبة:</span>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center font-bold">
                        <span className="text-slate-800 dark:text-slate-200">
                          • {item.productName}{' '}
                          <span className="text-purple-500 font-medium text-[11px]">
                            ({item.variantSize} / {item.variantColor})
                          </span>
                        </span>
                        <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border text-[11px]">
                          × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* STEP 1 ACTIONS: Confirm Order vs Reject Order vs Locked by Confirmer */}
                  {!isPlatformWarehouse ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>🛡️ يتم الاتصال والتأكيد هاتفياً عبر <strong>فريق التأكيد (Confirmer)</strong> والتجهيز عبر <strong>مستودع المنصة المركزي</strong> آلياً.</span>
                      </div>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 rounded-lg border border-amber-200">
                        مخزون محجوز مؤقتاً
                      </span>
                    </div>
                  ) : order.assignedConfirmerId ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex-1 py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-2">
                        <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>🔒 محجوزة وقيد الاتصال بواسطة المؤكد: <strong className="text-amber-900 dark:text-amber-200">{order.assignedConfirmerName || 'فريق التأكيد'}</strong></span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        يمنع التأكيد المزدوج حتى انتهاء المكالمة
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          const activeCouriers = getStoredCouriers(user?.id || user?.email).filter((c) => !c.isDisabled);
                          if (activeCouriers.length > 0) {
                            const defaultEcom = activeCouriers.find((c) => c.id === 'cour-ecom');
                            setSelectedCourierId(defaultEcom ? defaultEcom.id : activeCouriers[0].id);
                          }
                          setConfirmingOrderModal(order);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                        title="تأكيد جاهزية المنتج بالمستودع وتحويله للتحضير والتغليف فوراً"
                      >
                        <Check className="w-4 h-4" />
                        <span>✅ تأكيد التوفر بالمستودع والتحويل للتحضير</span>
                      </button>

                      <button
                        onClick={() => {
                          setRejectingOrder(order);
                          setSelectedReason(REJECTION_REASONS[0]);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>❌ غير متوفر بالمستودع</span>
                      </button>
                    </div>

                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: قيد التحضير ==================== */}
      {activeTab === 'preparation' && (
        <div className="space-y-4">
          {/* Executive Platform Warehouse & Packer KPIs Banner */}
          {Boolean(isPlatformWarehouse) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* KPI 1: Dedicated Packaging & Fulfillment Fees (Pick & Pack) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-amber-950/30 border-2 border-amber-300 dark:border-amber-700/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-bold">
                    <span>أتعاب التغليف والتجهيز (Pick & Pack)</span>
                    <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
                      {availablePackerWithdrawalDzd.toLocaleString()} <span className="text-xs">دج</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenPackerWithdrawModal()}
                      disabled={availablePackerWithdrawalDzd <= 0}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition active:scale-95 shadow-xs ${
                        availablePackerWithdrawalDzd > 0
                          ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                          : 'bg-amber-200/50 text-amber-600/60 dark:bg-amber-950/50 dark:text-amber-700/50 cursor-not-allowed'
                      }`}
                    >
                      سحب الأتعاب
                    </button>
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-1 flex-wrap">
                  <span className="text-[9px] font-black text-amber-900 dark:text-amber-200 bg-amber-200/70 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                    مضمونة 100% على عاتق الإدارة
                  </span>
                  <span className="text-[9px] text-amber-700/80 dark:text-amber-400/80 font-medium">
                    ({completedOrders.length} مسلّمة × {packagingFeePerOrder} دج)
                  </span>
                </div>
              </div>

              {/* KPI 2: Preparation Orders */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                  <span>طلبيات قيد التجهيز والتغليف</span>
                  <Boxes className="w-4 h-4 text-violet-600" />
                </div>
                <div className="mt-2.5 flex items-baseline justify-between gap-2">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {preparationOrders.length} <span className="text-xs">طرد</span>
                  </span>
                  <span className="text-[10px] text-violet-700 dark:text-violet-300 font-bold bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800">
                    بانتظار الباركود
                  </span>
                </div>
              </div>

              {/* KPI 3: Delivery Ready */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                  <span>جاهزة لوصل تسليم الناقل</span>
                  <Truck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-2.5 flex items-baseline justify-between gap-2">
                  <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                    {deliveryOrders.length} <span className="text-xs">طرد</span>
                  </span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    Bordereau
                  </span>
                </div>
              </div>

              {/* KPI 4: Delivered */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                  <span>طرود تم تسليمها بنجاح</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2.5 flex items-baseline justify-between gap-2">
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {completedOrders.length} <span className="text-xs">طرد مسلّم</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    COD محصل 🎉
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* BATCH SELECTION & BULK ACTION TOOLBAR (Platform Warehouse Only) */}
          {Boolean(isPlatformWarehouse && filterBySearch(preparationOrders).length > 0) && (
            <div className="p-4 bg-white dark:bg-slate-900 border-2 border-violet-400 dark:border-violet-900 rounded-2xl space-y-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = filterBySearch(preparationOrders);
                      if (selectedPrepOrderIds.length === filtered.length && filtered.length > 0) {
                        setSelectedPrepOrderIds([]);
                      } else {
                        setSelectedPrepOrderIds(filtered.map((o) => o.id));
                      }
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-100 hover:bg-violet-200 dark:bg-violet-950 dark:hover:bg-violet-900 text-violet-900 dark:text-violet-100 font-black text-xs transition cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={
                        filterBySearch(preparationOrders).length > 0 &&
                        selectedPrepOrderIds.length === filterBySearch(preparationOrders).length
                      }
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer pointer-events-none"
                    />
                    <span>
                      {selectedPrepOrderIds.length === filterBySearch(preparationOrders).length &&
                      filterBySearch(preparationOrders).length > 0
                        ? 'إلغاء تحديد الكل'
                        : 'تحديد الكل للتحضير والطباعة'}
                    </span>
                  </button>

                  <span className="text-xs font-black text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-3 py-1.5 rounded-xl border border-violet-200 dark:border-violet-900">
                    تم تحديد {selectedPrepOrderIds.length} من أصل {filterBySearch(preparationOrders).length} طلبية
                  </span>
                </div>

                {/* Bulk Actions buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={selectedPrepOrderIds.length === 0}
                    onClick={handleBulkCreateBordereaux}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition ${
                      selectedPrepOrderIds.length > 0
                        ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>⚡ إنشاء البوردورو للمحدد عبر API ({selectedPrepOrderIds.length})</span>
                  </button>

                  <button
                    disabled={selectedPrepOrderIds.length === 0}
                    onClick={handleBulkPrintBordereaux}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition ${
                      selectedPrepOrderIds.length > 0
                        ? 'bg-violet-600 hover:bg-violet-500 text-white cursor-pointer ring-2 ring-violet-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Printer className="w-4 h-4" />
                    <span>🖨️ طباعة ملصقات الـ API المحددة ({selectedPrepOrderIds.length})</span>
                  </button>

                  <button
                    disabled={selectedPrepOrderIds.length === 0}
                    onClick={() => {
                      if (selectedPrepOrderIds.length === 0) return;
                      if (
                        confirm(
                          `هل أنت متأكد من تأكيد تجهيز ${selectedPrepOrderIds.length} طرد وتحويلها دفعة واحدة إلى قيد التوصيل؟`
                        )
                      ) {
                        selectedPrepOrderIds.forEach((id) => updateOrderStatus(id, 'SHIPPED'));
                        onShowToast(
                          `🚚 تم تجهيز ${selectedPrepOrderIds.length} طرد وتأكيد تحويلها دفعة واحدة!`,
                          'success'
                        );
                        setSelectedPrepOrderIds([]);
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      selectedPrepOrderIds.length > 0
                        ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد تجهيز المحدد ({selectedPrepOrderIds.length})</span>
                  </button>
                </div>
              </div>

              {/* Bulk Courier Assignment Bar */}
              <div className="pt-2.5 border-t border-violet-100 dark:border-violet-950 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <Truck className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    تعيين شركة توصيل موحدة للطلبات المحددة:
                  </span>
                  <select
                    value={bulkTargetCourierId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setBulkTargetCourierId(newId);
                      handleApplyBulkCourier(newId);
                    }}
                    className="px-2.5 py-1 rounded-lg border-2 border-violet-400 dark:border-violet-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-violet-500 shadow-xs cursor-pointer"
                  >
                    {activeCouriersList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.connectionStatus === 'CONNECTED' ? '✓ (متصل API)' : ''}
                      </option>
                    ))}
                  </select>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black flex items-center gap-1 shadow-xs">
                    <span>⚡ تغيير تلقائي ولحظي متزامن</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleApplyBulkCourier(bulkTargetCourierId)}
                    disabled={selectedPrepOrderIds.length === 0 && filterBySearch(preparationOrders).length === 0}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                      selectedPrepOrderIds.length > 0 || filterBySearch(preparationOrders).length > 0
                        ? 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 cursor-pointer shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {selectedPrepOrderIds.length > 0
                      ? `تطبيق على المحدد (${selectedPrepOrderIds.length})`
                      : `تطبيق على كل المعروض (${filterBySearch(preparationOrders).length})`}
                  </button>
                </div>

                <span className="text-[11px] text-slate-500 font-medium">
                  ⚡ بمجرد اختيار شركة التوصيل تتغير فوراً خانة «شركة التوصيل لشحنات المنصة:» في جميع بطاقات الطلبات
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filterBySearch(preparationOrders).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                لا توجد طلبات في مرحلة التحضير حالياً.
              </div>
            ) : (
              filterBySearch(preparationOrders).map((order, idx) => {
                const chosenCourier = findCourierForOrder(order);
                const isSentToShipping = order.deliveryCompanySent || !!order.trackingCode;
                const hasBordereau = !!order.bordereauUrl && isSentToShipping;
                const isCreatingThis = !!generatingBordereauMap[order.id];
                const isSelected = selectedPrepOrderIds.includes(order.id);

                return (
                  <div
                    key={`${order.id || 'ord'}-${idx}`}
                    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition space-y-3 ${
                      isSelected
                        ? 'border-2 border-violet-500 bg-violet-50/40 dark:bg-violet-950/20 shadow-md ring-1 ring-violet-400/50'
                        : 'border-violet-200/80 dark:border-violet-900/40 shadow-xs'
                    }`}
                  >
                    {/* Card Header with Checkbox */}
                    <div className="flex flex-wrap justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5 gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePrepOrderSelection(order.id)}
                          className="w-4.5 h-4.5 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                        />
                        <span className="font-mono text-xs font-black text-violet-600 dark:text-violet-400">
                          #{order.id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 text-[10px] font-black">
                          قيد التحضير
                        </span>

                        {order.confirmedByRole === 'CONFIRMER' || order.confirmerName ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>مؤكدة هاتفياً ({order.confirmerName || 'المؤكد'})</span>
                          </span>
                        ) : order.confirmedByRole === 'SUPPLIER' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-black flex items-center gap-1">
                            <span>مؤكدة من المستودع</span>
                          </span>
                        ) : null}

                        {/* Courier API Bordereau Status Badge */}
                        {hasBordereau ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 text-[10px] font-black flex items-center gap-1">
                            <span>✅ تم إنشاء البوردورو عبر API ({chosenCourier.name.split(' ')[0]})</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-[10px] font-black flex items-center gap-1">
                            <span>⚡ بانتظار توليد البوردورو عبر API ({chosenCourier.name.split(' ')[0]})</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTimelineOrder(order)}
                          className="px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-950/80 text-violet-800 dark:text-violet-200 hover:bg-violet-200 border border-violet-200 dark:border-violet-800 text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer"
                          title="عرض سجل التدقيق والمزامنة اللحظية للطلب"
                        >
                          <Clock className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                          <span>المسار اللحظي ⚡</span>
                        </button>
                        <div className="text-end font-mono text-xs">
                          <span className="text-[10px] text-slate-400 block">تاريخ الإضافة:</span>
                          <span className="font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-DZ') : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* COURIER PARTNER SELECTOR BAR (Platform Warehouse ONLY) */}
                    {isPlatformWarehouse ? (
                      <>
                        <div className="p-3 bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-900/60 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Truck className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                            <span className="font-black text-slate-800 dark:text-slate-200">
                              شركة التوصيل لشحنات المنصة:
                            </span>
                            <select
                              value={order.courierPartnerId || chosenCourier.id}
                              onChange={(e) => handleSelectCourierForOrder(order.id, e.target.value)}
                              className="px-3 py-1.5 rounded-xl border-2 border-violet-400 dark:border-violet-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-xs cursor-pointer focus:ring-2 focus:ring-violet-500 shadow-xs"
                            >
                              {activeCouriersList.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} {c.connectionStatus === 'CONNECTED' ? '✓ (متصل API)' : ''}
                                </option>
                              ))}
                            </select>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black">
                              ✓ API متصل
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-bold">رقم التتبع (Tracking API):</span>
                            <span className="font-mono font-black text-xs text-violet-700 dark:text-violet-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-violet-200 dark:border-violet-800">
                              {order.trackingCode || 'بانتظار الإنشاء عبر API'}
                            </span>
                          </div>
                        </div>

                        {/* Customer & Address */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-black text-slate-900 dark:text-white block">{order.customerName}</span>
                            <span className="font-mono text-slate-500 text-[11px] block">{order.phone}</span>
                          </div>
                          <div className="sm:text-end">
                            <span className="font-bold text-amber-600 dark:text-amber-400 block">{order.wilaya}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{order.commune} - {order.address}</span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-xs">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center font-bold">
                              <span>
                                • {item.productName} ({item.variantSize} / {item.variantColor})
                              </span>
                              <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">
                                × {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* API BORDEREAU ACTIONS (TIED TO SELECTED COURIER API) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
                          {/* Button 1: Create Bordereau via Selected Courier API */}
                          <button
                            disabled={isCreatingThis}
                            onClick={() => handleCreateBordereauForOrder(order)}
                            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer text-xs font-black shadow-xs ${
                              hasBordereau
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300'
                                : 'bg-violet-600 hover:bg-violet-500 text-white'
                            }`}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isCreatingThis ? 'animate-spin' : ''}`} />
                            <span>
                              {isCreatingThis
                                ? 'جاري الاتصال بالـ API...'
                                : hasBordereau
                                ? `🔄 1. إعادة توليد البوردورو (${chosenCourier.name.split(' ')[0]})`
                                : `⚡ 1. إنشاء البوردورو عبر API (${chosenCourier.name.split(' ')[0]})`}
                            </span>
                          </button>

                          {/* Button 2: Print Bordereau via Selected Courier API */}
                          <button
                            onClick={() => handlePrintBordereauForOrder(order)}
                            className="py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer text-xs font-black ring-2 ring-violet-400/40"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>🖨️ 2. طباعة البوردورو عبر API</span>
                          </button>

                          {/* Button 3: Direct API Bordereau Web / PDF */}
                          <button
                            disabled={!order.bordereauUrl}
                            onClick={() => {
                              if (order.bordereauUrl) {
                                window.open(order.bordereauUrl, '_blank');
                              } else {
                                handleCreateBordereauForOrder(order);
                              }
                            }}
                            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition text-xs font-black ${
                              order.bordereauUrl
                                ? 'bg-slate-800 hover:bg-slate-700 text-white cursor-pointer'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>📄 3. سند الشحن الرسمي (PDF)</span>
                          </button>

                          {/* Button 4: Mark Package Ready */}
                          <button
                            onClick={() => handleMarkPackageReady(order.id)}
                            className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer text-xs font-black"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>4. تأكيد تجهيز الطرد (قيد التوصيل)</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        {/* Customer & Address */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-black text-slate-900 dark:text-white block">{order.customerName}</span>
                            <span className="font-mono text-slate-500 text-[11px] block">{order.phone}</span>
                          </div>
                          <div className="sm:text-end">
                            <span className="font-bold text-amber-600 dark:text-amber-400 block">{order.wilaya}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{order.commune} - {order.address}</span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-xs">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center font-bold">
                              <span>
                                • {item.productName} ({item.variantSize} / {item.variantColor})
                              </span>
                              <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">
                                × {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Status Banner for Supplier */}
                        <div className="p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-xs text-violet-900 dark:text-violet-200 flex flex-wrap items-center justify-between gap-2 font-bold">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-violet-600 shrink-0" />
                            <span>📦 قيد التحضير والتغليف في مستودع المنصة</span>
                          </div>
                          {order.trackingCode && (
                            <span className="font-mono text-xs px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-violet-200 text-violet-700 dark:text-violet-300">
                              كود التتبع: {order.trackingCode}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: قيد التوصيل ==================== */}
      {activeTab === 'delivery' && (
        <div className="space-y-4">

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-800 dark:text-blue-300 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 shrink-0 text-blue-500" />
              <span>
                الطلبات المشحونة التي تم تسليمها لشركة التوصيل. يتم التتبع التلقائي عبر API وتتحدث الحالات الفنية داخلياً.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCourierAnalyticsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>📊 مصفوفة معدلات التسليم والولايات</span>
            </button>
          </div>

          <div className="space-y-3">
            {filterBySearch(deliveryOrders).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                لا توجد طلبات قيد التوصيل حالياً.
              </div>
            ) : (
              filterBySearch(deliveryOrders).map((order, idx) => (
                <div
                  key={`${order.id || 'ord'}-${idx}`}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/40 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-blue-600 dark:text-blue-400">#{order.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-black">
                        قيد التوصيل
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedTimelineOrder(order)}
                        className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="عرض مسار وتزامن الطلبية عبر جميع الداشبوردات"
                      >
                        <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>المسار اللحظي ⚡</span>
                      </button>
                    </div>

                    <span className="font-mono font-bold text-slate-500 text-[11px]">
                      تتبع: {order.trackingCode || 'YAL-DEFAULT'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{order.customerName}</span>
                      <span className="font-mono text-slate-500 text-[11px] block">{order.phone}</span>
                    </div>
                    <div className="sm:text-end">
                      <span className="font-bold text-amber-600 dark:text-amber-400 block">{order.wilaya}</span>
                      <span className="text-[10px] text-slate-500 truncate block">{order.commune} - {order.address}</span>
                    </div>
                  </div>

                  {isPlatformWarehouse ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleSyncDeliveryStatus(order)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                        <span>مزامنة التتبع التلقائي مع API الشحن</span>
                      </button>

                      <button
                        onClick={() => {
                          updateOrderStatus(order.id, 'DELIVERED');
                          onShowToast(`🎉 تم تأكيد التسليم النهائي للطلب #${order.id}`, 'success');
                        }}
                        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تأكيد التسليم (تم التوصيل)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                        <span>في الطريق مع الموزع • التحديث اللحظي عبر API شركة التوصيل</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                        {order.trackingCode || 'قيد المتابعة'}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: مكتمل (تم التوصيل) ==================== */}
      {activeTab === 'completed' && (() => {
        const filteredCompleted = filterBySearch(completedOrders);
        const totalCodCash = filteredCompleted.reduce((sum, o) => sum + (o.totalAmount || 0) + (o.shippingFee || 0), 0);
        const totalWholesale = filteredCompleted.reduce((sum, o) => sum + getOrderWholesaleAmount(o), 0);
        const totalSellerProfits = filteredCompleted.reduce((sum, o) => sum + (o.totalProfit || 0), 0);
        const totalDeliveryFees = filteredCompleted.reduce((sum, o) => sum + (o.shippingFee || 0), 0);

        return (
          <div className="space-y-4">
            {/* COD Cash Reconciliation Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-black">مطابقة كاش الـ COD وتسوية المستحقات</h2>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        مطابقة دقيقة 100%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      توزيع الكاش المحصل من الناقلين بين مستحقات الموردين، أرباح المسوقين، ورسوم التوصيل حتى آخر دينار.
                    </p>
                  </div>
                </div>
                <div className="text-start sm:text-end">
                  <span className="text-[11px] text-slate-400 block font-medium">إجمالي كاش COD المحصل:</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                    <MoneyText amount={totalCodCash} />
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-white/10 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 block">1. مستحقات الموردين بالجملة</span>
                  <span className="text-base font-black font-mono text-white block">
                    <MoneyText amount={totalWholesale} />
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">محررة لرصيد المورد ✅</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 block">2. أرباح المسوقين المحررة</span>
                  <span className="text-base font-black font-mono text-violet-300 block">
                    <MoneyText amount={totalSellerProfits} />
                  </span>
                  <span className="text-[10px] text-violet-300 font-medium">محررة بمحافظ البائعين 🛍️</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 block">3. رسوم شركات التوصيل</span>
                  <span className="text-base font-black font-mono text-blue-300 block">
                    <MoneyText amount={totalDeliveryFees} />
                  </span>
                  <span className="text-[10px] text-blue-300 font-medium">مقتطعة للناقلين 🚚</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 block">4. الطرود المسلّمة</span>
                  <span className="text-base font-black font-mono text-amber-300 block">
                    {filteredCompleted.length} طرد
                  </span>
                  <span className="text-[10px] text-amber-300 font-medium">تسليم وتحصيل مكتمل 🎉</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
            {filterBySearch(completedOrders).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                لا توجد طلبات مكتملة حالياً.
              </div>
            ) : (
              filterBySearch(completedOrders).map((order, idx) => (
                <div
                  key={`${order.id || 'ord'}-${idx}`}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-900/40 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 dark:text-white">#{order.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-black flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        تم التوصيل بنجاح 🎉
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedTimelineOrder(order)}
                        className="px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="عرض مسار وتزامن الطلبية عبر جميع الداشبوردات"
                      >
                        <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>المسار اللحظي ⚡</span>
                      </button>
                    </div>

                    <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                      تحصيل: <MoneyText amount={order.totalAmount + order.shippingFee} />
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{order.customerName} ({order.phone})</span>
                      <span className="text-slate-400">{order.wilaya} - {order.commune}</span>
                    </div>
                    <div className="text-end font-mono">
                      <span className="text-slate-400 text-[10px] block">رمز التتبع:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{order.trackingCode || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center font-bold">
                        <span>• {item.productName} ({item.variantSize} / {item.variantColor})</span>
                        <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">× {item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Supplier Wholesale Due Banner */}
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-800 dark:text-purple-300 text-[11px] font-black flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>مستحقات منتجات الجملة المضافة لرصيدك:</span>
                    </span>
                    <span className="font-mono text-sm font-black text-purple-600 dark:text-purple-400">
                      +<MoneyText amount={getOrderWholesaleAmount(order)} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    })()}

      {/* ==================== TAB 5: مرتجع (المرتجعات) ==================== */}
      {activeTab === 'returned' && (
        <div className="space-y-3">
          <div className="p-3.5 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-purple-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-900 dark:text-rose-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <span className="font-black block text-sm text-slate-900 dark:text-white">
                  فحص جودة المرتجعات QC وإعادة التخزين
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  فحص سلامة الطرود المرتجعة، مطابقة المنتجات وإعادتها فورياً لمواقع الأرفف بالمستودع أو تسجيل التوالف.
                </span>
              </div>
            </div>

            {isPlatformWarehouse && (
              <button
                type="button"
                onClick={() => setIsReturnsQCModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-amber-200 animate-pulse" />
                <span>🔍 فحص جودة الطرود المرتجعة QC</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filterBySearch(returnedOrders).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                لا توجد طلبات مرتجعة حالياً.
              </div>
            ) : (
              filterBySearch(returnedOrders).map((order, idx) => {
                const isReturnedInStock = !!order.returnedToWarehouse;
                const totalItemsQty = order.items.reduce((acc, item) => acc + item.quantity, 0);

                return (
                  <div
                    key={`${order.id || 'ord'}-${idx}`}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 shadow-xs space-y-3 text-xs"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 dark:text-white">#{order.id}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isReturnedInStock
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                          }`}
                        >
                          {isReturnedInStock ? '✔ تم الاستلام بالمخزن وتحديث المخزون' : 'بانتظار وصول الطرد للمستودع ⏳'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedTimelineOrder(order)}
                          className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                          title="عرض مسار وتزامن الطلبية عبر جميع الداشبوردات"
                        >
                          <Clock className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>المسار اللحظي ⚡</span>
                        </button>
                      </div>

                      <span className="font-mono text-slate-500 font-bold text-xs">
                        {order.wilaya}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{order.customerName} ({order.phone})</span>
                        <span className="text-slate-400">{order.commune} - {order.address}</span>
                      </div>
                      <div className="text-end font-mono">
                        <span className="text-slate-400 text-[10px] block">كود التتبع:</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">{order.trackingCode || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Order Items to return */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-xs">
                      <span className="text-[10px] text-slate-400 block font-bold mb-1">محتوى الطرد المطلوب إرجاعه للمخزن:</span>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center font-bold">
                          <span>• {item.productName} ({item.variantSize} / {item.variantColor})</span>
                          <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border text-rose-600 dark:text-rose-400">
                            + {item.quantity} قطعة للمخزون
                          </span>
                        </div>
                      ))}
                    </div>

                    {(order.failureReason || order.cancellationReason) && (
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                        سبب الإرجاع / الرفض: {order.failureReason || order.cancellationReason}
                      </div>
                    )}

                    {/* ACTION BUTTON OR CONFIRMATION BANNER */}
                    {!isReturnedInStock ? (
                      isPlatformWarehouse ? (
                        <button
                          onClick={() => {
                            confirmReturnInWarehouse(order.id);
                            setProducts(getStoredProducts());
                            onShowToast(
                              `✔ تم استلام الطرد #${order.id} بالمخزن، إضافة ${totalItemsQty} قطعة إلى المخزون تلقائياً، وحذفه من قائمة المرتجعات!`,
                              'success'
                            );
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>تم الاستلام بالمخزن وتحديث المخزون (إضافة للمخزون وحذف من القائمة)</span>
                        </button>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>بانتظار استلام الطرد من شركة التوصيل وفحصه بمستودع المنصة المركزي لإعادته لمخزونك المتاح للبيع.</span>
                        </div>
                      )
                    ) : (
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-800 dark:text-purple-300 text-[11px] font-black flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                        <span>تم تأكيد وصول الطرد للمستودع وإضافة الكمية ({totalItemsQty} قطعة) لمكانها المخصص في المخزون بنجاح!</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 5: إدارة المنتجات والمخزون ==================== */}
      {activeTab === 'products' && (() => {
        const displayedProductsList = showOnlyMyProducts ? mySupplierProducts : products;

        return (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase">
                  إدارة المنتجات، الكميات والأنواع بالمخزن
                </h3>
                <p className="text-[10px] text-slate-400">
                  عرض وإضافة المنتجات الخاصة بمستودع المورد أو تعديل أسعارها والكميات المتاحة
                </p>
              </div>

              <div className="flex items-center gap-2">
                {getLowStockProducts(mySupplierProducts).length > 0 && (
                  <button
                    onClick={() => setIsLowStockModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-200 animate-pulse" />
                    <span>تنبيهات انخفاض المخزون ({getLowStockProducts(mySupplierProducts).length})</span>
                  </button>
                )}

                <button
                  onClick={() => setIsUrlImportModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-500 hover:to-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <LinkIcon className="w-4 h-4 text-amber-300" />
                  <span>🔗 استيراد منتجات من رابط</span>
                </button>

                <button
                  onClick={() => setActiveTab('inbound')}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  title="توريد شحنة بضاعة لمستودع المنصة"
                >
                  <Boxes className="w-4 h-4 text-emerald-200" />
                  <span>📦 توريد بضاعة للمستودع</span>
                </button>

                <button
                  onClick={handleOpenAddProduct}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منتج جديد</span>
                </button>

              </div>
            </div>

            {/* SUPPLIER FILTER BAR */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowOnlyMyProducts(true)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    showOnlyMyProducts
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>منتجاتي الموردة ({mySupplierProducts.length})</span>
                </button>
                <button
                  onClick={() => setShowOnlyMyProducts(false)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    !showOnlyMyProducts
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>جميع منتجات الكتالوج ({products.length})</span>
                </button>
              </div>

              <span className="text-[10px] text-purple-600 dark:text-purple-300 font-extrabold px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800/50">
                المورد: {supplierProfile.companyName || supplierProfile.fullName}
              </span>
            </div>

            <div className="space-y-3">
              {displayedProductsList.map((p, pIdx) => (
                <div
                  key={`${p.id}-${pIdx}`}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.images[0]}
                        alt={p.nameAr}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                      />
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{p.nameAr}</h4>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                            {p.categoryAr} • {p.variants.length} أنواع/متغيرات
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-[9px] font-bold inline-flex items-center gap-1 border border-purple-200 dark:border-purple-800/50">
                            <Building2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span>المورد: {p.supplierName || supplierProfile.companyName}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                      <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-xs sm:text-sm">
                        {p.variants.reduce((acc, v) => acc + v.stockCount, 0)} قطعة بالمخزن
                      </span>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setIsAddingNewProduct(false);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-purple-500" />
                        <span>تعديل الكميات</span>
                      </button>

                      {deletingProductId === p.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/80 p-1 rounded-xl border border-rose-200 dark:border-rose-800">
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">تأكيد؟</span>
                          <button
                            onClick={() => {
                              handleDeleteProductFromWarehouse(p.id);
                              setDeletingProductId(null);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-extrabold text-[10px] cursor-pointer"
                          >
                            حذف
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
                          className="px-2.5 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/80 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                          title="حذف المنتج من المخزن"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Variants Preview */}
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  {p.variants.map((v, i) => (
                    <div key={i} className="flex justify-between items-center p-1 bg-white dark:bg-slate-900 rounded border">
                      <span>{v.size} ({v.color}):</span>
                      <span className="font-mono font-black text-purple-600 dark:text-purple-400">{v.stockCount} قطعة</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        );
      })()}

      {/* ==================== TAB: شحنات التوريد لمستودع المنصة (Inbound Stock to Central Warehouse) ==================== */}
      {activeTab === 'inbound' && (() => {
        return (
          <div className="space-y-4">
            {/* Header / Info Banner */}
            <div className="p-5 bg-gradient-to-r from-emerald-900/90 via-slate-900 to-teal-950 border border-emerald-500/30 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shrink-0 shadow-lg shadow-emerald-600/30">
                  <Boxes className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base">استقبال كراتين التوريد لمستودع المنصة</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      توريد وفحص السلع
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
                    استقبال كراتين السلع من الموردين، مطابقة عدد القطع مع الفواتير، وتعيين أرفف التخزين بالمستودع لتغذية جاهزية الطلبيات للتجهيز والشحن.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (mySupplierProducts.length > 0) {
                    setInboundSelectedProductId(mySupplierProducts[0].id);
                  }
                  setIsInboundModalOpen(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>إرسال إشعار شحنة توريد جديدة للمستودع</span>
              </button>
            </div>

            {/* Filter Tabs for Inbound Shipments */}
            {inboundRequests.length > 0 && (
              <div className="flex items-center justify-between gap-3 flex-wrap bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setInboundTabFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      inboundTabFilter === 'pending'
                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>شحنات قيد التوريد بانتظار الإيداع ({inboundRequests.filter((r) => r.status !== 'RECEIVED').length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInboundTabFilter('received')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      inboundTabFilter === 'received'
                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>سجل الشحنات المودعة في الرفوف ({inboundRequests.filter((r) => r.status === 'RECEIVED').length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInboundTabFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      inboundTabFilter === 'all'
                        ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>الكل ({inboundRequests.length})</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-500 font-bold">
                  ⚡ تختفي الشحنة الموردة تلقائياً من هذه القائمة بمجرد الضغط على إيداعها وتأكيد المخزون الحي
                </span>
              </div>
            )}

            {/* Inbound Requests List */}
            <div className="space-y-3">
              {inboundRequests.filter((req) => {
                if (inboundTabFilter === 'pending') return req.status !== 'RECEIVED';
                if (inboundTabFilter === 'received') return req.status === 'RECEIVED';
                return true;
              }).length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {inboundTabFilter === 'pending'
                    ? '✔ لا توجد شحنات توريد معلقة حالياً — تم إيداع جميع السلع الموردة في رفوف المستودع والمخزون متاح للمسوقين بنجاح! 📦'
                    : 'لا توجد شحنات مسجلة في هذا القسم.'}
                </div>
              ) : (
                inboundRequests
                  .filter((req) => {
                    if (inboundTabFilter === 'pending') return req.status !== 'RECEIVED';
                    if (inboundTabFilter === 'received') return req.status === 'RECEIVED';
                    return true;
                  })
                  .map((req, rIdx) => {
                    const isReceived = req.status === 'RECEIVED';
                    return (
                      <div
                        key={req.id || rIdx}
                        className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition shadow-xs space-y-3 ${
                          isReceived
                            ? 'border-emerald-200/90 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                            : 'border-amber-200/90 dark:border-amber-900/40'
                        }`}
                      >
                        {/* Request Header */}
                        <div className="flex flex-wrap justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5 gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                              #{req.id}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                isReceived
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 animate-pulse'
                              }`}
                            >
                              {isReceived ? '✔ تم إيداع الشحنة في الرفوف والمخزون متاح' : '🚚 في الطريق لمستودع المنصة'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-bold">
                              المورد: {req.supplierName} ({req.supplierPhone || ''})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-purple-600 dark:text-purple-400 font-black">
                              القيمة بالجملة: <MoneyText amount={req.totalWholesaleValueDzd} />
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-[11px]">
                              {req.totalUnits} قطعة
                            </span>
                          </div>
                        </div>

                        {/* Items Details */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5 text-xs">
                          <div className="text-[11px] font-bold text-slate-400 mb-1">السلع المضمنة في هذه الشحنة:</div>
                          {req.items.map((item, itIdx) => (
                            <div key={itIdx} className="flex justify-between items-center font-bold">
                              <span className="text-slate-800 dark:text-slate-200">
                                • {item.productName}{' '}
                                <span className="text-purple-500 font-medium text-[11px]">
                                  ({item.variantSize || 'قياسي'} / {item.variantColor || 'عادي'})
                                </span>
                              </span>
                              <div className="flex items-center gap-3 font-mono">
                                <span className="text-slate-500">{item.wholesalePrice} دج/قطعة</span>
                                <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border text-emerald-600 dark:text-emerald-400">
                                  {isReceived ? `استُلمت: ${item.quantityReceived ?? item.quantitySent}` : `المرسلة: ${item.quantitySent}`} قطعة
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Logistics Info & Notes */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                          <div>
                            <span>🚚 الناقل / وسيلة الشحن: <strong>{req.carrierName || 'شاحنة خاصة'}</strong></span>
                            {req.trackingNumber && <span className="ms-3 font-mono">كود الشحنة: <strong>{req.trackingNumber}</strong></span>}
                          </div>
                          <div>
                            <span>تاريخ الإنشاء: {new Date(req.createdAt).toLocaleDateString('ar-DZ')}</span>
                          </div>
                        </div>

                        {req.notes && (
                          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px]">
                            <strong>ملاحظات المورد:</strong> {req.notes}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {!isReceived ? (
                            <button
                              onClick={() => {
                                // Perform inspect, deposit and receive
                                const verified = req.items.map((it) => ({
                                  productId: it.productId,
                                  variantId: it.variantId,
                                  quantityReceived: it.quantitySent,
                                }));
                                const ok = receiveAndInspectInboundStock(req.id, verified);
                                if (ok) {
                                  // Immediately remove from active pending shipments so it disappears automatically
                                  setInboundRequests((prev) => prev.filter((item) => item.id !== req.id));
                                  setProducts(getStoredProducts());
                                  onShowToast(
                                    `✔ تم إيداع الشحنة #${req.id} في رفوف المستودع واختفت الشحنة الموردة تلقائياً والمخزون متاح للمسوقين فوراً (${req.totalUnits} قطعة)!`,
                                    'success'
                                  );
                                }
                              }}
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>تم إيداع الشحنة في رفوف المستودع والمخزون متاح للمسوقين فوراً</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>تم إيداع الشحنة في رفوف المستودع والمخزون متاح للمسوقين فوراً</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setInboundRequests((prev) => prev.filter((item) => item.id !== req.id));
                                  onShowToast(`📦 تم إخفاء الشحنة المودعة #${req.id} من القائمة بنجاح`, 'info');
                                }}
                                className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold transition cursor-pointer"
                              >
                                إخفاء من القائمة
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Modal: New Inbound Request by Supplier */}
            {isInboundModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-emerald-600" />
                      <span>إرسال بضاعة إلى مستودع المنصة المركزي</span>
                    </h3>
                    <button
                      onClick={() => setIsInboundModalOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const targetProd = products.find((p) => p.id === inboundSelectedProductId) || products[0];
                      if (!targetProd) {
                        onShowToast('الرجاء اختيار منتج صالح', 'error');
                        return;
                      }

                      createInboundStockRequest({
                        supplierId: supplierProfile.id,
                        supplierName: supplierProfile.companyName || supplierProfile.fullName,
                        supplierPhone: supplierProfile.phone,
                        supplierEmail: supplierProfile.email,
                        carrierName: inboundCarrier,
                        items: [
                          {
                            productId: targetProd.id,
                            productName: targetProd.nameAr,
                            productImage: targetProd.images?.[0],
                            variantSize: targetProd.variants?.[0]?.size || 'Standard',
                            variantColor: targetProd.variants?.[0]?.color || 'Original',
                            quantitySent: Number(inboundQuantitySent) || 50,
                            wholesalePrice: targetProd.wholesalePrice || 2500,
                          },
                        ],
                        notes: inboundNotes,
                      });

                      setInboundRequests(getStoredInboundRequests());
                      setIsInboundModalOpen(false);
                      setInboundNotes('');
                      onShowToast('✔ تم تسجيل إرسال شحنة التوريد بنجاح! سيتم فحصها واستلامها في المستودع فور وصولها.', 'success');
                    }}
                    className="space-y-3.5 text-xs"
                  >
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        اختر المنتج المراد توريده للمستودع:
                      </label>
                      <select
                        value={inboundSelectedProductId}
                        onChange={(e) => setInboundSelectedProductId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nameAr} (سعر الجملة: {p.wholesalePrice} دج)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          الكمية المرسلة (قطع):
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="5000"
                          value={inboundQuantitySent}
                          onChange={(e) => setInboundQuantitySent(Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-black"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          وسيلة النقل / الناقل:
                        </label>
                        <input
                          type="text"
                          value={inboundCarrier}
                          onChange={(e) => setInboundCarrier(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                          placeholder="مثلاً: شاحنة خاصة، ياليدين، ..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        ملاحظات أو رقم كود الشحنة للتعرف عليها:
                      </label>
                      <textarea
                        rows={2}
                        value={inboundNotes}
                        onChange={(e) => setInboundNotes(e.target.value)}
                        placeholder="مثلاً: 3 كراتين كبيرة، ملصق عليها كود SUP-100..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                      />
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                      💡 فور وصول الشحنة للمستودع وتأكيد استلامها، سيتم زيادة كميات المنتج تلقائياً وسيبدأ المسوقون في جلب المبيعات فوراً!
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsInboundModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md cursor-pointer"
                      >
                        إرسال الإشعار للمستودع
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ==================== TAB 7: المالية ومستحقات منتجات الجملة للمورد (Financial & Wholesale Dues) ==================== */}
      {activeTab === 'financial' && (() => {

        const filteredSettlements = settlements.filter((st) => {
          const matchesStatus =
            settlementFilterStatus === 'ALL' || st.status === settlementFilterStatus;
          const matchesSearch =
            !settlementSearchTerm ||
            st.id.toLowerCase().includes(settlementSearchTerm.toLowerCase()) ||
            (st.referenceNumber &&
              st.referenceNumber.toLowerCase().includes(settlementSearchTerm.toLowerCase())) ||
            (st.accountDetails &&
              st.accountDetails.toLowerCase().includes(settlementSearchTerm.toLowerCase())) ||
            (st.notes && st.notes.toLowerCase().includes(settlementSearchTerm.toLowerCase()));
          return matchesStatus && matchesSearch;
        });

        return (
          <div className="space-y-6">
            {/* Financial Rule Notice - Ultra Professional */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border-2 border-purple-500/40 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="p-3.5 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl shrink-0 shadow-lg shadow-purple-600/30">
                  <Wallet className="w-6 h-6" />
                </div>
                  <div className="space-y-1.5 text-right">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-base text-white flex items-center gap-2">
                      <span>
                        {isPlatformWarehouse
                          ? 'القسم المالي لمستودع المنصة (Platform Warehouse Central Treasury)'
                          : 'القسم المالي لمستحقات المورد (Supplier Wholesale Revenue)'}
                      </span>
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                      {isPlatformWarehouse ? 'Platform Central Revenue' : 'COD Guaranteed Payouts'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                      {isPlatformWarehouse ? 'عوائد السلع + رسوم التغليف' : 'مستحقات الجملة الصافية'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed max-w-3xl">
                    {isPlatformWarehouse
                      ? 'تحصيلات أموال السلع ورسوم التغليف والتجهيز (Pick & Pack) المحصلة من شركات التوصيل بعد تسليم الطرود للزبائن. هذه الأموال يتم ترحيلها دورياً ومباشرة إلى الخزينة المركزية للمنصة.'
                      : 'يتم تحصيل أموال الطلبيات (COD) مركزياً عبر شركات التوصيل لحساب المنصة، ومستحقات منتجات الجملة الخاصة بك تُضاف فورا وتلقائياً لرصيدك المتاح فور تسليم الطلبية للزبون. يمكنك في أي وقت طلب تحويل مستحقاتك لحسابك البريدي أو البنكي.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0 relative z-10">
                <button
                  onClick={() => handleOpenPayoutModal()}
                  disabled={availableBalance <= 0}
                  className={`px-6 py-3 font-black text-xs rounded-2xl shadow-xl transition flex items-center justify-center gap-2 border ${
                    availableBalance <= 0
                      ? 'bg-slate-800 text-slate-500 border-slate-700 opacity-60 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white active:scale-95 cursor-pointer border-purple-400/40 shadow-purple-600/20'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isPlatformWarehouse
                      ? availableBalance <= 0
                        ? 'لا توجد تحصيلات للترحيل (0 د.ج)'
                        : 'ترحيل إلى خزينة المنصة المركزية'
                      : availableBalance <= 0
                      ? 'لا توجد مستحقات للسحب (0 د.ج)'
                      : 'طلب سحب المستحقات (Demande de Retrait)'}
                  </span>
                </button>
              </div>
            </div>

            {/* Financial Overview Cards - 6 Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {/* Card 1: Available Balance for Withdrawal / Treasury Transfer */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-900/30 via-slate-900 to-indigo-950/40 border-2 border-purple-500/60 shadow-lg shadow-purple-900/20 space-y-2 relative overflow-hidden">
                <div className="flex justify-between items-center text-[11px] font-black text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{isPlatformWarehouse ? 'تحصيلات مؤكدة للخزينة' : 'الرصيد المتاح للسحب'}</span>
                  </span>
                  <Wallet className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-tight">
                  <MoneyText amount={availableBalance} />
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-purple-800/40">
                  <p className="text-[10px] text-purple-200/80 font-medium">
                    {isPlatformWarehouse ? 'جاهز للترحيل للخزينة' : 'جاهز للتحويل الفوري'}
                  </p>
                  <button
                    onClick={() => handleOpenPayoutModal()}
                    disabled={availableBalance <= 0}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-purple-500/30 hover:bg-purple-500 text-purple-200 hover:text-white font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isPlatformWarehouse ? 'ترحيل الآن ←' : 'سحب الآن ←'}
                  </button>
                </div>
              </div>

              {/* Card 2: Total Delivered Wholesale Earnings */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
                  <span>إجمالي مبيعات الجملة المسلّمة</span>
                  <ShoppingBag className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  <MoneyText amount={totalDeliveredWholesale} />
                </div>
                <p className="text-[10px] text-slate-400">
                  قيمة مبيعات الجملة لـ {completedOrders.length} طلبية مسلّمة بنجاح
                </p>
              </div>

              {/* Card 3: Paid / Transferred Dues */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
                  <span>المستحقات المحولة لحسابك</span>
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  <MoneyText amount={paidPayoutsAmount} />
                </div>
                <p className="text-[10px] text-slate-400">
                  تم تحويلها بنجاح لحساب CCP / BaridiMob
                </p>
              </div>

              {/* Card 4: Pick & Pack for Platform Warehouse OR In-Prep Goods for Supplier */}
              {isPlatformWarehouse ? (
                <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-orange-500/15 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-700/80 shadow-xs space-y-1.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-[11px] text-amber-900 dark:text-amber-200 font-bold">
                      <span>أتعاب التغليف والتجهيز (Pick & Pack)</span>
                      <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono mt-0.5">
                      <MoneyText amount={availablePackerWithdrawalDzd} />
                    </div>
                    <p className="text-[10px] text-amber-800/90 dark:text-amber-400/90">
                      متاح للسحب: {availablePackerWithdrawalDzd.toLocaleString()} دج (إجمالي {totalEarnedPackagingDzd.toLocaleString()} دج لـ {completedOrders.length} طرد مسلّم)
                    </p>
                  </div>
                  <div className="pt-2 border-t border-amber-300/50 dark:border-amber-800/50 flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[9px] font-black text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                      مضمونة 100% على عاتق الإدارة
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenPackerWithdrawModal()}
                      disabled={availablePackerWithdrawalDzd <= 0}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition flex items-center gap-1 ${
                        availablePackerWithdrawalDzd > 0
                          ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer active:scale-95 shadow-xs'
                          : 'bg-amber-200/50 text-amber-600/60 dark:bg-amber-950/50 dark:text-amber-700/50 cursor-not-allowed'
                      }`}
                    >
                      <ArrowDownToLine className="w-3 h-3" />
                      <span>طلب سحب الأتعاب</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-3xl bg-violet-500/10 dark:bg-violet-950/20 border border-violet-300 dark:border-violet-800/60 shadow-xs space-y-1.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-[11px] text-violet-800 dark:text-violet-300 font-bold">
                      <span>بضاعة قيد التحضير بالمستودع</span>
                      <Package className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="text-xl font-black text-violet-700 dark:text-violet-400 font-mono mt-0.5">
                      <MoneyText amount={preparationOrders.reduce((acc, o) => acc + getOrderWholesaleAmount(o), 0)} />
                    </div>
                    <p className="text-[10px] text-violet-700/80 dark:text-violet-400/80">
                      قيمة الجملة لـ {preparationOrders.length} طلبية يجري تجهيزها حالياً
                    </p>
                  </div>
                  <div className="pt-2 border-t border-violet-300/40 dark:border-violet-800/40 flex items-center justify-between">
                    <span className="text-[9px] text-violet-700 dark:text-violet-300 font-bold">يتم تحصيلها فور التسليم</span>
                    <span className="text-[10px] text-violet-600 font-mono font-bold">{preparationOrders.length} طرد</span>
                  </div>
                </div>
              )}

              {/* Card 5: Pending Payout Requests */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
                  <span>طلبات سحب قيد المعالجة</span>
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono">
                  <MoneyText amount={pendingPayoutsAmount} />
                </div>
                <p className="text-[10px] text-slate-400">
                  جارٍ التدقيق والتحويل من طرف الإدارة
                </p>
              </div>

              {/* Card 6: In-Transit Wholesale Dues */}
              <div className="p-4 rounded-3xl bg-blue-500/10 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-800/60 shadow-xs space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-blue-800 dark:text-blue-300 font-bold">
                  <span>مستحقات قيد التوصيل</span>
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-xl font-black text-blue-700 dark:text-blue-400 font-mono">
                  <MoneyText amount={inTransitWholesale} />
                </div>
                <p className="text-[10px] text-blue-700/80 dark:text-blue-400/80">
                  تضاف للرصيد المتاح فور تسليم الزبائن
                </p>
              </div>
            </div>

            {/* Payout Coordinates & Financial Identity Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>معلومات وحسابات استلام المستحقات المالية (Payout Coordinates)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    الحسابات المعتمدة لتحويل مستحقات مبيعات الجملة الخاصة بك من قبل إدارة Nouva Market
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenEditAccountsModal}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/20"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل حسابات السحب</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                {/* Method 1: BaridiMob */}
                <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 space-y-2 relative group">
                  <div className="flex items-center justify-between text-purple-900 dark:text-purple-300 font-extrabold">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-purple-600" />
                      <span>تطبيق بريدي موب (BaridiMob)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-mono">
                      فوري
                    </span>
                  </div>
                  <div className="font-mono font-black text-slate-900 dark:text-white text-xs tracking-wider break-all">
                    {supplierProfile.baridiMobNumber || (supplierProfile.ccpOrRip && supplierProfile.ccpOrRip.startsWith('007') ? supplierProfile.ccpOrRip : 'لم يتم تحديد رقم بريدي موب')}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-purple-100 dark:border-purple-900/40">
                    <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                      المستفيد: {supplierProfile.accountHolderName || supplierProfile.fullName || supplierProfile.companyName}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenEditAccountsModal}
                      className="text-[11px] text-purple-600 dark:text-purple-400 hover:text-purple-700 font-bold inline-flex items-center gap-1 cursor-pointer transition shrink-0"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>تعديل</span>
                    </button>
                  </div>
                </div>

                {/* Method 2: CCP */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 relative group">
                  <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-extrabold">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span>حساب البريد الجاري (CCP)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                      حوالة بريدية
                    </span>
                  </div>
                  <div className="font-mono font-black text-slate-900 dark:text-white text-xs tracking-wider break-all">
                    {supplierProfile.ccpOrRip || 'لم يتم إدخال حساب CCP'}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-[10px] text-slate-500">بريد الجزائر (Algérie Poste)</p>
                    <button
                      type="button"
                      onClick={handleOpenEditAccountsModal}
                      className="text-[11px] text-purple-600 dark:text-purple-400 hover:text-purple-700 font-bold inline-flex items-center gap-1 cursor-pointer transition shrink-0"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>تعديل</span>
                    </button>
                  </div>
                </div>

                {/* Method 3: Bank Virement */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 relative group">
                  <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-extrabold">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>التحويل البنكي (Virement Bancaire)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                      بنوك وطنية
                    </span>
                  </div>
                  <div className="font-mono font-black text-slate-900 dark:text-white text-xs tracking-wider break-all">
                    {supplierProfile.bankRib ? `RIB: ${supplierProfile.bankRib} (${supplierProfile.bankName || 'BNA'})` : 'لم يتم إدخال RIB بعد'}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-[10px] text-slate-500 truncate max-w-[140px]">متاح للمبالغ والمؤسسات المسجلة</p>
                    <button
                      type="button"
                      onClick={handleOpenEditAccountsModal}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold inline-flex items-center gap-1 cursor-pointer transition shrink-0"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>تعديل</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Transactions & Settlements Log */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>كشف حساب وحركات المستحقات (Settlements & Payout History)</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">سجل طلبات السحب ومبالغ مبيعات الجملة المحولة لحسابك من قبل الإدارة</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="بحث بالرقم أو الوصل..."
                      value={settlementSearchTerm}
                      onChange={(e) => setSettlementSearchTerm(e.target.value)}
                      className="w-full pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  <select
                    value={settlementFilterStatus}
                    onChange={(e) => setSettlementFilterStatus(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="COMPLETED">✔ تم التحويل بنجاح</option>
                    <option value="PENDING">⏳ قيد المراجعة والتحويل</option>
                  </select>

                  <button
                    onClick={() => handleOpenPayoutModal()}
                    disabled={availableBalance <= 0}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                      availableBalance <= 0
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>طلب سحب</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold pb-2">
                      <th className="py-2.5 px-3">رقم الطلب / المعرف</th>
                      <th className="py-2.5 px-3">تاريخ الطلب</th>
                      <th className="py-2.5 px-3">طريقة التحويل</th>
                      <th className="py-2.5 px-3">مبلغ المستحقات (الجملة)</th>
                      <th className="py-2.5 px-3">تفاصيل الحساب المودع فيه</th>
                      <th className="py-2.5 px-3">رقم وصل التحويل (Ref)</th>
                      <th className="py-2.5 px-3">ملاحظات</th>
                      <th className="py-2.5 px-3">حالة التحويل</th>
                      <th className="py-2.5 px-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-800 dark:text-slate-200">
                    {filteredSettlements.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-400 font-medium">
                          <div className="max-w-xs mx-auto space-y-2">
                            <Wallet className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                            <p className="text-xs">لا توجد حركات سحب أو تسويات سابقة مطابقة للبحث.</p>
                            <button
                              onClick={() => handleOpenPayoutModal()}
                              disabled={availableBalance <= 0}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 mt-1 ${
                                availableBalance <= 0
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{availableBalance <= 0 ? 'لا توجد مستحقات للسحب (0 د.ج)' : 'تقديم طلب سحب جديد'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSettlements.map((st, idx) => (
                        <tr key={`${st.id}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono font-black text-purple-600 dark:text-purple-400">
                            {st.id}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                            {st.date}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-[11px] inline-flex items-center gap-1">
                              {st.payoutMethod === 'BARIDIMOB' ? '📱 BaridiMob' : st.payoutMethod === 'CCP' ? '📮 حساب CCP' : '🏛️ تحويل بنكي'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                            <MoneyText amount={st.amountDzd || 0} />
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                            {st.accountDetails || st.referenceNote || 'CCP / BaridiMob'}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                            {st.referenceNumber || 'قيد المعالجة'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[180px] truncate">
                            {st.notes || 'سحب مستحقات مبيعات الجملة'}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                                st.status === 'COMPLETED'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {st.status === 'COMPLETED' ? (
                                <>
                                  <Check className="w-3 h-3 text-purple-600" />
                                  <span>تم التحويل بنجاح</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>قيد مراجعة وتحويل الإدارة</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {st.status === 'PENDING' ? (
                              <button
                                type="button"
                                onClick={() => setSettlementToDelete(st)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 hover:text-rose-700 dark:text-rose-400 text-[11px] font-bold transition inline-flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/50 cursor-pointer shadow-2xs"
                                title="حذف وإلغاء طلب السحب واستعادة الرصيد المتاح"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                <span>حذف الطلب</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ==================== SECTION: مستحقات وأتعاب التغليف والتجهيز لعامل ومغلف المستودع ==================== */}
            {Boolean(isPlatformWarehouse) && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-yellow-50/50 dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-900 border-2 border-amber-300 dark:border-amber-800/60 shadow-lg space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-200/80 dark:border-amber-900/40 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <span>أتعاب التغليف والتجهيز (خاص بعامل ومغلف مستودع المنصة)</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                            على عاتق الإدارة 100%
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          عن كل طرد يتم تحضيره ويُسلّم بنجاح للزبون، تضمن إدارة المنصة استحقاق {packagingFeePerOrder} دج لعامل التغليف. يتم تحويل المستحقات لحسابك عبر BaridiMob أو CCP أو نقداً باليد.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenPackerWithdrawModal()}
                    disabled={availablePackerWithdrawalDzd <= 0}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg transition shrink-0 ${
                      availablePackerWithdrawalDzd > 0
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white cursor-pointer active:scale-95 shadow-amber-600/20 border border-amber-400/40'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>طلب سحب أتعاب التغليف ({availablePackerWithdrawalDzd.toLocaleString()} دج)</span>
                  </button>
                </div>

                {/* 4 Financial Metric Cards for Packer */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs text-center space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold block">إجمالي أتعاب التغليف المكتسبة</span>
                    <strong className="text-amber-600 dark:text-amber-400 font-black font-mono text-lg block">
                      {totalEarnedPackagingDzd.toLocaleString()} دج
                    </strong>
                    <span className="text-[10px] text-slate-400 block font-medium">({completedOrders.length} طرد مسلّم × {packagingFeePerOrder} دج)</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs text-center space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold block">المبالغ المصروفة والمحولة</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black font-mono text-lg block">
                      {paidPackerWithdrawalsDzd.toLocaleString()} دج
                    </strong>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">تم تحويلها لحسابك بنجاح</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs text-center space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold block">طلبات قيد المراجعة والتحويل</span>
                    <strong className="text-orange-600 dark:text-orange-400 font-black font-mono text-lg block">
                      {pendingPackerWithdrawalsDzd.toLocaleString()} دج
                    </strong>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 block font-bold">بانتظار إشعار تحويل الإدارة</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-700 text-center space-y-1 shadow-sm">
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-black block">الرصيد المتاح للسحب الآن</span>
                    <strong className="text-emerald-700 dark:text-emerald-300 font-black font-mono text-xl block">
                      {availablePackerWithdrawalDzd.toLocaleString()} دج
                    </strong>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">جاهز للتحويل الفوري</span>
                  </div>
                </div>

                {/* Packer Withdrawals History */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>سجل طلبات سحب أتعاب التغليف والتجهيز ({myPackerWithdrawals.length})</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">تحديث فوري ومباشر</span>
                  </div>

                  {myPackerWithdrawals.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-400 text-xs font-bold">
                      لا توجد طلبات سحب سابقة لأتعاب التغليف. يمكنك تقديم طلب السحب متى توفر لديك رصيد متاح من الطرود المسلّمة!
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {myPackerWithdrawals.map((w) => (
                        <div
                          key={w.id}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-amber-600 dark:text-amber-400">{w.id}</span>
                              <span className="text-slate-400">•</span>
                              <span className="font-mono text-slate-500 text-[11px]">{w.requestDate}</span>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                                {w.method === 'BARIDIMOB' ? '📱 BaridiMob' : w.method === 'CCP' ? '📮 حساب CCP' : w.method === 'CASH' ? '💵 نقداً باليد' : '🏛️ تحويل بنكي'}
                              </span>
                              <span className="text-slate-500 text-[11px] font-medium">({w.sellerName})</span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300">
                              تفاصيل الحساب: <strong className="font-mono text-slate-900 dark:text-white">{w.accountDetails}</strong>
                            </div>
                            {w.proofReference && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>وصل إثبات التحويل من الإدارة: {w.proofReference}</span>
                              </div>
                            )}
                            {w.rejectionReason && (
                              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>سبب الرفض: {w.rejectionReason}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <span className="font-black font-mono text-base text-slate-900 dark:text-white">
                              {w.amountDzd.toLocaleString()} دج
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                w.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                                  : w.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                              }`}
                            >
                              {w.status === 'APPROVED' ? '✔ تم الصرف والتحويل' : w.status === 'PENDING' ? '⏳ قيد المراجعة لدى الإدارة' : '✖ مرفوض'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ==================== TAB: معدلات التوصيل بالولايات وتتبع الشحنات ==================== */}
      {activeTab === 'tracking' && (
        <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
          {/* Header Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-cyan-900/80 via-slate-900 to-blue-950 border border-cyan-500/30 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-600 text-white rounded-2xl shadow-lg shadow-cyan-600/30 shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-black">معدلات التوصيل بالولايات والربط اللوجستي</h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    58 ولاية
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  جدول أسعار ومعدلات نجاح التوصيل عبر شبكة شركات التوصيل المعتمدة (Yalidine, Ecom, ZR Express).
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowShippingRatesModal(true)}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition cursor-pointer active:scale-95 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>عرض جدول الأسعار لـ 58 ولاية</span>
            </button>
          </div>

          <ShipmentTrackingTool
            isDarkTheme={true}
            onShowNotice={(msg) => onShowToast(msg, 'success')}
          />
        </div>
      )}

      {/* ==================== TAB 8: الإحصائيات الشاملة للمورد (Supplier Analytics) ==================== */}
      {activeTab === 'analytics' && (() => {
        // 1. KPI Calculations
        const totalOrdersCount = orders.length;
        const deliveredOrdersCount = completedOrders.length;
        const returnedOrdersCount = returnedOrders.length;
        const prepOrdersCount = preparationOrders.length + pendingOrders.length;

        const totalSalesRevenueDzd =
          orders
            .filter((o) => o.status === 'DELIVERED')
            .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

        const deliveryRate = totalOrdersCount > 0 ? Math.round((deliveredOrdersCount / totalOrdersCount) * 100) : 0;
        const returnRate = totalOrdersCount > 0 ? Math.round((returnedOrdersCount / totalOrdersCount) * 100) : 0;

        // Active resellers count
        const activeResellersSet = new Set(
          orders.map((o) => o.resellerId || o.sellerStoreName || '').filter(Boolean)
        );
        const activeResellersCount = activeResellersSet.size;

        // 2. Sales Analytics
        const totalUnitsSold = orders.reduce((acc, o) => {
          if (o.items && o.items.length > 0) {
            return acc + o.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
          }
          return acc + 1;
        }, 0);

        const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalSalesRevenueDzd / (deliveredOrdersCount || totalOrdersCount)) : 0;
        const avgDailyOrders = (totalOrdersCount / 30).toFixed(1);

        // Time periods calculations
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);

        const todayOrders = orders.filter((o) => o.createdAt && o.createdAt.startsWith(todayStr));
        const todaySales = todayOrders.filter((o) => o.status === 'DELIVERED').reduce((acc, o) => acc + (o.totalAmount || 0), 0);

        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weeklyOrders = orders.filter((o) => new Date(o.createdAt || Date.now()) >= sevenDaysAgo);
        const weeklySales = weeklyOrders.filter((o) => o.status === 'DELIVERED').reduce((acc, o) => acc + (o.totalAmount || 0), 0);

        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const monthlyOrders = orders.filter((o) => new Date(o.createdAt || Date.now()) >= thirtyDaysAgo);
        const monthlySales = monthlyOrders.filter((o) => o.status === 'DELIVERED').reduce((acc, o) => acc + (o.totalAmount || 0), 0);

        // 3. Product Analytics Matrix
        const productStatsMap = mySupplierProducts.map((p) => {
          const pOrders = orders.filter(
            (o) =>
              o.items?.some((i) => i.productId === p.id || i.productName?.toLowerCase().includes(p.nameAr.toLowerCase())) ||
              o.productName?.toLowerCase().includes(p.nameAr.toLowerCase())
          );

          const ordersCount = pOrders.length;
          const unitsSold = pOrders.reduce((acc, o) => {
            const match = o.items?.find(
              (i) => i.productId === p.id || i.productName?.toLowerCase().includes(p.nameAr.toLowerCase())
            );
            return acc + (match ? match.quantity || 1 : 1);
          }, 0);

          const deliveredCount = pOrders.filter((o) => o.status === 'DELIVERED').length;
          const returnedCount = pOrders.filter(
            (o) => o.status === 'CANCELLED' || o.status === 'FAILED' || o.situation === 'RetourReçu'
          ).length;

          const pDeliveryRate = ordersCount > 0 ? Math.round((deliveredCount / ordersCount) * 100) : 90;
          const pReturnRate = ordersCount > 0 ? Math.round((returnedCount / ordersCount) * 100) : 5;

          const revenue =
            pOrders
              .filter((o) => o.status === 'DELIVERED')
              .reduce((acc, o) => {
                const item = o.items?.find((i) => i.productId === p.id);
                const qty = item ? item.quantity || 1 : 1;
                return acc + (p.wholesalePrice || 3000) * qty;
              }, 0) || (unitsSold > 0 ? unitsSold * p.wholesalePrice : 0);

          const pResellers = new Set(
            pOrders.map((o) => o.resellerId || o.sellerStoreName || o.customerName || 'بائع').filter(Boolean)
          ).size;

          const currentStock = p.variants?.reduce((acc, v) => acc + (Number(v.stockCount) || 0), 0) ?? 0;

          // Performance Flags
          const isTopSelling = unitsSold >= 3 || ordersCount >= 2;
          const isFastGrowing = pDeliveryRate >= 80 && unitsSold >= 1;
          const isLowPerforming = pReturnRate > 15 || (ordersCount <= 1 && unitsSold <= 1);

          return {
            product: p,
            ordersCount,
            unitsSold,
            deliveryRate: pDeliveryRate,
            returnRate: pReturnRate,
            revenue,
            resellersCount: Math.max(pResellers, 1),
            currentStock,
            isTopSelling,
            isFastGrowing,
            isLowPerforming,
          };
        });

        // Filtered Product Stats
        const filteredProductStats = productStatsMap.filter((item) => {
          const matchesSearch =
            !productSearchTerm ||
            item.product.nameAr.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            item.product.categoryAr?.toLowerCase().includes(productSearchTerm.toLowerCase());

          if (!matchesSearch) return false;

          if (productAnalyticsFilter === 'TOP') return item.isTopSelling;
          if (productAnalyticsFilter === 'GROWING') return item.isFastGrowing;
          if (productAnalyticsFilter === 'LOW_PERFORMING') return item.isLowPerforming;
          return true;
        });

        return (
          <div className="space-y-6">
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-xs text-purple-900 dark:text-purple-300 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600 shrink-0" />
              <span>
                <strong>مركز تحليلات وإحصائيات المورد (Supplier Intelligence Hub):</strong> رصد المبيعات، معدلات التسليم، أداء المنتجات، والمسوقين الأكثر نشاطاً في منصة Nouva Market.
              </span>
            </div>

            {/* ---------------- SECTION 1: MAIN KPI CARDS (8 CARDS) ---------------- */}
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span>المؤشرات الرئيسية والأداء (Main KPIs)</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {/* Card 1: Total Orders */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block">إجمالي الطلبات</span>
                    <Package className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white font-mono">📦 {totalOrdersCount}</div>
                  <span className="text-[9px] text-slate-400 block font-bold">كل الشحنات المسجلة</span>
                </div>

                {/* Card 2: Delivered Orders */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="flex justify-between items-center text-purple-500">
                    <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 block">الطلبات المسلمة</span>
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">✅ {deliveredOrdersCount}</div>
                  <span className="text-[9px] text-purple-500/80 block font-bold">تم الاستلام بنجاح</span>
                </div>

                {/* Card 3: Returned Orders */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="flex justify-between items-center text-rose-500">
                    <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 block">المرتجعات</span>
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">❌ {returnedOrdersCount}</div>
                  <span className="text-[9px] text-rose-400 block font-bold">مرفوضة / عائدة</span>
                </div>

                {/* Card 4: Prep & Pending Orders */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="flex justify-between items-center text-amber-500">
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 block">قيد التجهيز</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">⏳ {prepOrdersCount}</div>
                  <span className="text-[9px] text-amber-500/80 block font-bold">قيد التحضير بالتغليف</span>
                </div>

                {/* Card 5: Total Sales Revenue */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="flex justify-between items-center text-purple-600">
                    <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 block">إجمالي المبيعات</span>
                    <DollarSign className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-base font-black text-purple-600 dark:text-purple-400 font-mono truncate">
                    <MoneyText amount={totalSalesRevenueDzd} />
                  </div>
                  <span className="text-[9px] text-purple-500 block font-bold">صافي مستحقات المورد</span>
                </div>

                {/* Card 6: Delivery Rate */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="flex justify-between items-center text-blue-500">
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 block">معدل التسليم</span>
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">📈 {deliveryRate}%</div>
                  <span className="text-[9px] text-blue-400 block font-bold">نسبة النجاح والتوصيل</span>
                </div>

                {/* Card 7: Return Rate */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="flex justify-between items-center text-rose-500">
                    <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 block">معدل المرتجعات</span>
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">🔄 {returnRate}%</div>
                  <span className="text-[9px] text-rose-400 block font-bold">نسبة عدم التسليم</span>
                </div>

                {/* Card 8: Active Resellers */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="flex justify-between items-center text-purple-500">
                    <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 block">المسوقون النشطون</span>
                    <Users className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">👥 {activeResellersCount}</div>
                  <span className="text-[9px] text-purple-400 block font-bold">باعوا منتجاتك</span>
                </div>
              </div>
            </div>

            {/* ---------------- SECTION 2: SALES ANALYTICS (إحصائيات المبيعات) ---------------- */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    <span>إحصائيات المبيعات والأداء المالي (Sales Analytics)</span>
                  </h3>
                  <p className="text-xs text-slate-500">تتبع حجم المبيعات اليومية، الأسبوعية، والشهرية، ومتوسطات الطلبات</p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-mono text-xs font-black self-start sm:self-auto">
                  إجمالي الوحدات المباعة: {totalUnitsSold} قطعة 📦
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Daily Sales Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      المبيعات اليومية (Daily)
                    </span>
                    <span className="text-[10px] text-purple-600 font-mono font-black">{todayOrders.length} طلبات</span>
                  </div>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                    <MoneyText amount={todaySales} />
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full transition-all duration-500"
                      style={{ width: todaySales > 0 ? `${Math.min(Math.round((todaySales / 50000) * 100), 100)}%` : '0%' }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">مبيعات اليوم المسجلة بالنظام</p>
                </div>

                {/* Weekly Sales Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      المبيعات الأسبوعية (7 أيام)
                    </span>
                    <span className="text-[10px] text-purple-600 font-mono font-black">{weeklyOrders.length} طلبات</span>
                  </div>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                    <MoneyText amount={weeklySales} />
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full transition-all duration-500"
                      style={{ width: weeklySales > 0 ? `${Math.min(Math.round((weeklySales / 200000) * 100), 100)}%` : '0%' }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">إجمالي الأداء خلال آخر 7 أيام</p>
                </div>

                {/* Monthly Sales Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-violet-500" />
                      المبيعات الشهرية (30 يوم)
                    </span>
                    <span className="text-[10px] text-violet-600 font-mono font-black">{monthlyOrders.length} طلبات</span>
                  </div>
                  <div className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">
                    <MoneyText amount={monthlySales} />
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-violet-500 h-full transition-all duration-500"
                      style={{ width: monthlySales > 0 ? `${Math.min(Math.round((monthlySales / 500000) * 100), 100)}%` : '0%' }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">إجمالي المبيعات المكتملة هذا الشهر</p>
                </div>

                {/* Total Units Sold */}
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <ShoppingBag className="w-4 h-4 text-amber-500" />
                    عدد الوحدات المباعة (Units Sold)
                  </span>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    📦 {totalUnitsSold} قطعة
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">مجموع القطع الخارجة من المخزن</p>
                </div>

                {/* Average Order Value (AOV) */}
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                    <Award className="w-4 h-4 text-blue-500" />
                    متوسط قيمة الطلب (Average Order Value)
                  </span>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                    <MoneyText amount={avgOrderValue} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">معدل قيمة السلة الواحدة لكل طلبية</p>
                </div>

                {/* Average Daily Orders */}
                <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                  <span className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    متوسط عدد الطلبات اليومي (Daily Avg)
                  </span>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                    ⚡ {avgDailyOrders} طلب / يوم
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">معدل تدفق الطلبات اليومية الجديدة</p>
                </div>
              </div>
            </div>

            {/* ---------------- SECTION 3: PRODUCT ANALYTICS (إحصائيات المنتجات) ---------------- */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-600" />
                    <span>إحصائيات وتحليلات أداء المنتجات (Product Analytics)</span>
                  </h3>
                  <p className="text-xs text-slate-500">تحليل الأداء الفردي لكل منتج: الطلبات، الوحدات، الإيرادات، ومعدل التسليم</p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="بحث في منتجاتك..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="py-1.5 pr-8 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setProductAnalyticsFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        productAnalyticsFilter === 'ALL'
                          ? 'bg-purple-600 text-white font-black shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      الكل
                    </button>
                    <button
                      onClick={() => setProductAnalyticsFilter('TOP')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        productAnalyticsFilter === 'TOP'
                          ? 'bg-amber-500 text-white font-black shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Flame className="w-3 h-3 text-amber-300" />
                      <span>🔥 الأكثر مبيعاً</span>
                    </button>
                    <button
                      onClick={() => setProductAnalyticsFilter('GROWING')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        productAnalyticsFilter === 'GROWING'
                          ? 'bg-purple-600 text-white font-black shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>📈 الأسرع نمواً</span>
                    </button>
                    <button
                      onClick={() => setProductAnalyticsFilter('LOW_PERFORMING')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        productAnalyticsFilter === 'LOW_PERFORMING'
                          ? 'bg-rose-600 text-white font-black shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <TrendingDown className="w-3 h-3" />
                      <span>📉 الأقل أداءً</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Analytics Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold bg-slate-50/50 dark:bg-slate-800/30">
                      <th className="py-3 px-3">المنتج والوسم</th>
                      <th className="py-3 px-3">المخزون الحالي</th>
                      <th className="py-3 px-3">عدد الطلبات</th>
                      <th className="py-3 px-3">الوحدات المباعة</th>
                      <th className="py-3 px-3">نسبة التسليم</th>
                      <th className="py-3 px-3">نسبة المرتجعات</th>
                      <th className="py-3 px-3">عدد المسوقين</th>
                      <th className="py-3 px-3">إجمالي الإيرادات (DZD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
                    {filteredProductStats.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs font-bold">
                          لا توجد منتجات تطابق معايير التصفية والبحث المحددة
                        </td>
                      </tr>
                    ) : (
                      filteredProductStats.map((item, itemIdx) => (
                        <tr key={`${item.product.id}-${itemIdx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          {/* Product Details & Tag */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.product.images[0]}
                                alt={item.product.nameAr}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                              <div>
                                <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{item.product.nameAr}</span>
                                  {item.isTopSelling && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-black flex items-center gap-0.5">
                                      🔥 الأكثر مبيعاً
                                    </span>
                                  )}
                                  {item.isFastGrowing && !item.isTopSelling && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[9px] font-black flex items-center gap-0.5">
                                      📈 الأسرع نمواً
                                    </span>
                                  )}
                                  {item.isLowPerforming && !item.isTopSelling && !item.isFastGrowing && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[9px] font-black flex items-center gap-0.5">
                                      📉 الأقل أداءً
                                    </span>
                                  )}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  سعر الجملة: <MoneyText amount={item.product.wholesalePrice} />
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Current Stock */}
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-black ${
                                item.currentStock <= 5
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {item.currentStock} قطعة
                            </span>
                          </td>

                          {/* Orders Count */}
                          <td className="py-3 px-3 font-mono font-black text-purple-600 dark:text-purple-400">
                            📦 {item.ordersCount}
                          </td>

                          {/* Units Sold */}
                          <td className="py-3 px-3 font-mono font-black text-amber-600 dark:text-amber-400">
                            {item.unitsSold} قطعة
                          </td>

                          {/* Delivery Rate */}
                          <td className="py-3 px-3">
                            <span className="font-mono font-black text-purple-600 dark:text-purple-400">
                              {item.deliveryRate}%
                            </span>
                          </td>

                          {/* Return Rate */}
                          <td className="py-3 px-3">
                            <span
                              className={`font-mono font-black ${
                                item.returnRate > 15 ? 'text-rose-600' : 'text-slate-500'
                              }`}
                            >
                              {item.returnRate}%
                            </span>
                          </td>

                          {/* Resellers Count */}
                          <td className="py-3 px-3 font-mono font-black text-violet-600 dark:text-violet-400">
                            👥 {item.resellersCount} مسوقين
                          </td>

                          {/* Revenue */}
                          <td className="py-3 px-3 font-mono font-black text-purple-600 dark:text-purple-400">
                            <MoneyText amount={item.revenue} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== TAB 9: الملف الشخصي (Profile) ==================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Supplier Approval Status Banner */}
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
              supplierProfile.status === 'APPROVED'
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-900 dark:text-purple-300'
                : supplierProfile.status === 'PENDING'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-black block">
                  حالة حساب المورد: {supplierProfile.status === 'APPROVED' ? '✔ حساب معتمد ونشط' : supplierProfile.status === 'PENDING' ? '⏳ في انتظار موافقة الأدمن' : '⛔ حساب معلق'}
                </span>
                <span className="text-[11px] opacity-80">
                  {supplierProfile.status === 'APPROVED'
                    ? 'حسابك مفعل بالكامل. يمكنك إضافة المنتجات، استقبال الطلبات وسحب الأرباح فوراً.'
                    : supplierProfile.status === 'PENDING'
                    ? 'طلب انضمامك كمورد قيد المراجعة حالياً من قبل إدارة Nouva Market. سيصلك إشعار فور التفعيل.'
                    : 'حساب المورد الخاص بك معلق. يرجى التواصل مع الدعم الفني للإدارة.'}
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 font-extrabold text-[11px] shadow-xs">
              ID: {supplierProfile.id}
            </span>
          </div>

          {/* Profile Form Card */}
          <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 text-right">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  <span>معلومات الملف الشخصي للمورد والمستودع</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">قم بتحديث بيانات الاتصال وتفاصيل المستودع</p>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">الاسم الكامل للمسؤول *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full py-2.5 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">اسم الشركة / المستودع *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
                  <input
                    type="text"
                    required
                    value={profileForm.companyName}
                    onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                    className="w-full py-2.5 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">رقم الهاتف *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
                  <input
                    type="tel"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full py-2.5 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">البريد الإلكتروني *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full py-2.5 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">الولاية مقر المستودع *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
                  <input
                    type="text"
                    required
                    value={profileForm.wilaya}
                    onChange={(e) => setProfileForm({ ...profileForm, wilaya: e.target.value })}
                    className="w-full py-2.5 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Supplier Payout Accounts Management Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 text-right">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span>حسابات استلام المستحقات المالية (Payout Accounts)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  أرقام وحسابات CCP و BaridiMob والتحويل البنكي المعتمدة لتحويل أرباحك ومستحقاتك
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenEditAccountsModal}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/20"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل الحسابات</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 space-y-1">
                <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> BaridiMob
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-white block truncate">
                  {supplierProfile.baridiMobNumber || 'غير محدد'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  المستفيد: {supplierProfile.accountHolderName || supplierProfile.fullName || '—'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-purple-600" /> Algérie Poste CCP
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-white block truncate">
                  {supplierProfile.ccpOrRip || 'غير محدد'}
                </span>
                <span className="text-[10px] text-slate-400 block">بريد الجزائر</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" /> التحويل البنكي
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-white block truncate">
                  {supplierProfile.bankRib ? `RIB: ${supplierProfile.bankRib}` : 'غير محدد'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {supplierProfile.bankName || 'بنوك وطنية'}
                </span>
              </div>
            </div>
          </div>

          {/* Supplier Password & Security Card */}
          <form onSubmit={handleUpdateSupplierPassword} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 text-right">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" />
                <span>تغيير كلمة المرور للمورد (Security & Password)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                عند حفظ كلمة المرور، سيتم اعتمادها بشكل صارم عند تسجيل الدخول القادم بحساب المستودع
              </p>
            </div>

            {supplierPasswordError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{supplierPasswordError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">كلمة المرور الجديدة *</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
                  <input
                    type={showSupplierPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={supplierNewPassword}
                    onChange={(e) => {
                      setSupplierNewPassword(e.target.value);
                      setSupplierPasswordError('');
                    }}
                    placeholder="كلمة المرور الجديدة (6 خانات على الأقل)"
                    className="w-full py-2.5 pr-9 pl-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSupplierPassword(!showSupplierPassword)}
                    className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showSupplierPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">تأكيد كلمة المرور الجديدة *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
                  <input
                    type={showSupplierPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={supplierConfirmPassword}
                    onChange={(e) => {
                      setSupplierConfirmPassword(e.target.value);
                      setSupplierPasswordError('');
                    }}
                    placeholder="أعد كتابة كلمة المرور للتأكيد"
                    className={`w-full py-2.5 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-mono ${
                      supplierConfirmPassword && supplierConfirmPassword !== supplierNewPassword
                        ? 'border-rose-400'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingPassword || !supplierNewPassword}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                <span>{isUpdatingPassword ? 'جاري الحفظ...' : 'تحديث وتأكيد كلمة المرور الجديدة'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRMATION & COURIER API SELECTION MODAL */}
      {confirmingOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>تأكيد الطلب #{confirmingOrderModal.id} واختيار شركة الشحن</span>
              </h3>
              <button
                onClick={() => setConfirmingOrderModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Order summary */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex justify-between items-center border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block">
                    {confirmingOrderModal.customerName} ({confirmingOrderModal.phone})
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {confirmingOrderModal.wilaya} — {confirmingOrderModal.commune}
                  </span>
                </div>
                <div className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                  {confirmingOrderModal.totalAmount + confirmingOrderModal.shippingFee} دج
                </div>
              </div>

              {/* Courier Dropdown */}
              <div className="space-y-1.5">
                <label className="font-black text-slate-800 dark:text-slate-200 block text-xs">
                  اختر شركة التوصيل المتاحة والمفعلة (Liste déroulante API active):
                </label>
                <select
                  value={selectedCourierId}
                  onChange={(e) => setSelectedCourierId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-purple-500 text-slate-900 dark:text-white font-extrabold text-xs focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {getStoredCouriers(user?.id || user?.email)
                    .filter((c) => !c.isDisabled)
                    .map((courier) => (
                      <option key={courier.id} value={courier.id}>
                        {courier.name} {courier.id === 'cour-ecom' ? '⭐ (Ecom Delivery)' : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* Courier API details card */}
              {(() => {
                const currentCourier =
                  getStoredCouriers(user?.id || user?.email).find((c) => c.id === selectedCourierId) ||
                  getStoredCouriers(user?.id || user?.email)[0];
                return (
                  <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 space-y-2">
                    <div className="flex justify-between items-center font-extrabold text-purple-900 dark:text-purple-200 text-xs">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-purple-500" />
                        <span>{currentCourier.name}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-black">
                        ● API متصل وشغال
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-700 dark:text-slate-300 pt-1 border-t border-purple-200/50 dark:border-purple-900/50 font-mono">
                      <div>
                        <span className="text-slate-400 block text-[9px]">API Key:</span>
                        <span className="font-bold truncate block">{currentCourier.apiKey}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">API Secret / Token:</span>
                        <span className="font-bold truncate block">{currentCourier.apiSecret}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40 text-[11px] text-purple-800 dark:text-purple-300 font-bold">
                🚀 عند الضغط على تأكيد، يتم رفع الطرد أوتوماتيكياً عبر API الشركة المحددة واسترجاع ملصق الشحن للطباعة فوراً.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setConfirmingOrderModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmOrderWithCourierSubmit}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تأكيد ورفع تلقائي لـ API واسترجاع الملصق 🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>سبب فشل تأكيد الطلب #{rejectingOrder.id}</span>
              </h3>
              <button
                onClick={() => setRejectingOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500 text-[11px]">
                اختر سبب عدم التأكيد ليصل تلقائياً للبائع مع السماح له بتعديل الطلب وإعادة إرساله:
              </p>

              <div className="space-y-2">
                {REJECTION_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      selectedReason === reason
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 font-black'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="accent-rose-600"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {selectedReason === 'سبب آخر' && (
                <textarea
                  rows={2}
                  placeholder="اكتب السبب بالتفصيل هنا..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md cursor-pointer"
              >
                تأكيد الرفض وإخطار البائع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE SHIPPING LABEL MODAL */}
      {printingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 relative border-2 border-slate-900 my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setPrintingOrder(null)}
              className="absolute top-3 end-3 p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <XCircle className="w-5 h-5" />
            </button>

            {/* Label Header */}
            <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs tracking-wider text-purple-700">
                  {printingOrder.deliveryCompanyName || 'شركة التوصيل المحددة'}
                </span>
                <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                  {printingOrder.deliveryType === 'home' ? 'LIVRAISON À DOMICILE' : 'STOPDESK'}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 font-mono tracking-wider">
                {printingOrder.wilaya.toUpperCase()}
              </h2>
              <div className="text-[10px] text-slate-500 font-medium">
                بوردورو شحن مولد عبر API شركة التوصيل المختارة
              </div>
            </div>

            {/* Tracking Barcode */}
            <div className="p-3 bg-slate-50 border-2 border-dashed border-slate-400 rounded-xl text-center space-y-2">
              <div className="flex justify-center items-center gap-2">
                <Barcode className="w-32 h-10 text-slate-900" />
              </div>
              <span className="font-mono text-xs font-black block tracking-widest text-slate-900">
                {printingOrder.trackingCode || `DZ-${printingOrder.id}`}
              </span>
            </div>

            {/* Recipient Details */}
            <div className="space-y-1.5 text-xs font-bold border-b-2 border-slate-900 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">الزبون:</span>
                <span className="font-extrabold text-sm">{printingOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الهاتف:</span>
                <span className="font-mono font-black">{printingOrder.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">العنوان:</span>
                <span className="text-end text-[11px]">
                  {printingOrder.commune} - {printingOrder.address}
                </span>
              </div>
            </div>

            {/* Package Contents & COD */}
            <div className="space-y-2">
              <div className="text-[11px] space-y-0.5">
                <span className="text-slate-500 block">المحتوى:</span>
                {printingOrder.items.map((item, i) => (
                  <span key={i} className="block font-bold">
                    • {item.productName} ({item.variantSize}) × {item.quantity}
                  </span>
                ))}
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl flex justify-between items-center font-black">
                <span className="text-xs">المبلغ عند الاستلام (COD):</span>
                <span className="text-lg text-purple-400 font-mono">
                  {printingOrder.totalAmount + printingOrder.shippingFee} DZD
                </span>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                  onShowToast('✔ تم إرسال الملصق للطباعة الحرارية!');
                }}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الملصق الحراري الآن</span>
              </button>

              {printingOrder.bordereauUrl && (
                <button
                  onClick={() => {
                    window.open(printingOrder.bordereauUrl, '_blank');
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>فتح بوردورو الشركة في نافذة جديدة (PDF / HTML)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BULK PRINTABLE SHIPPING LABELS MODAL */}
      {bulkPrintOrders && bulkPrintOrders.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-5 shadow-2xl space-y-6 relative border-2 border-slate-900 my-auto max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:w-full print:p-0">
            {/* Modal Header Controls (Hidden during browser window.print()) */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 print:hidden">
              <div>
                <h3 className="text-base font-black text-violet-900 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-violet-600" />
                  <span>طباعة ملصقات الشحن الحرارية ({bulkPrintOrders.length} ملصق)</span>
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  معاينة وتأكيد طباعة كافة الملصقات المحددة دفعة واحدة.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.print();
                    onShowToast(`✔ تم إرسال ${bulkPrintOrders.length} ملصق للطباعة الحرارية!`, 'success');
                  }}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الكل الآن ({bulkPrintOrders.length})</span>
                </button>
                <button
                  onClick={() => setBulkPrintOrders(null)}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List of Thermal Shipping Labels for Selected Orders */}
            <div className="space-y-6 print:space-y-0">
              {bulkPrintOrders.map((ord, idx) => (
                <div
                  key={`${ord.id || 'ord'}-${idx}`}
                  className="border-2 border-slate-900 rounded-2xl p-4 bg-white space-y-4 print:rounded-none print:border-2 print:border-black print:mb-6 print:break-after-page"
                >
                  {/* Label Header */}
                  <div className="border-b-2 border-slate-900 pb-2 text-center space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs tracking-wider text-purple-700">
                        {ord.deliveryCompanyName || 'Ecom Delivery (إيكوم)'}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                        {ord.deliveryType === 'home' ? 'LIVRAISON À DOMICILE' : 'STOPDESK'}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 font-mono tracking-wider">
                      {ord.wilaya.toUpperCase()}
                    </h2>
                  </div>

                  {/* Tracking Barcode */}
                  <div className="p-2.5 bg-slate-50 border-2 border-dashed border-slate-400 rounded-xl text-center space-y-1">
                    <div className="flex justify-center items-center gap-2">
                      <Barcode className="w-36 h-10 text-slate-900" />
                    </div>
                    <span className="font-mono text-xs font-black block tracking-widest text-slate-900">
                      {ord.trackingCode || `DZ-${ord.id}`}
                    </span>
                  </div>

                  {/* Recipient Details */}
                  <div className="space-y-1 text-xs font-bold border-b-2 border-slate-900 pb-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">الزبون:</span>
                      <span className="font-extrabold text-sm">{ord.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">الهاتف:</span>
                      <span className="font-mono font-black">{ord.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">العنوان:</span>
                      <span className="text-end text-[11px]">
                        {ord.commune} - {ord.address}
                      </span>
                    </div>
                  </div>

                  {/* Package Contents & COD Amount */}
                  <div className="space-y-2">
                    <div className="text-[11px] space-y-0.5">
                      <span className="text-slate-500 block">المحتوى:</span>
                      {ord.items.map((item, i) => (
                        <span key={i} className="block font-bold">
                          • {item.productName} ({item.variantSize}) × {item.quantity}
                        </span>
                      ))}
                    </div>

                    <div className="p-2.5 bg-slate-900 text-white rounded-xl flex justify-between items-center font-black">
                      <span className="text-xs">المبلغ عند الاستلام (COD):</span>
                      <span className="text-base text-purple-400 font-mono">
                        {ord.totalAmount + ord.shippingFee} DZD
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT EDIT / ADD MODAL FOR WAREHOUSE */}
      {editingProduct && (
        <ProductEditModal
          editingProduct={editingProduct}
          isAddingNewProduct={isAddingNewProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSaveProduct={handleSaveProductFromWarehouse}
          onDeleteProduct={handleDeleteProductFromWarehouse}
          onShowToast={onShowToast}
          isPlatformWarehouse={isPlatformWarehouse}
          currentSupplier={
            !isPlatformWarehouse
              ? {
                  id: supplierProfile.id,
                  name: supplierProfile.companyName || supplierProfile.fullName,
                  wilaya: supplierProfile.wilaya,
                }
              : undefined
          }
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

      {/* WAREHOUSE NOTIFICATIONS MODAL */}
      {isWarehouseNotifOpen && (
        <NotificationsModal
          role="warehouse"
          onClose={() => setIsWarehouseNotifOpen(false)}
        />
      )}

      {/* SUPPLIER REQUEST PAYOUT MODAL */}
      {isRequestPayoutModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {isPlatformWarehouse
                      ? 'ترحيل تحصيلات مستودع المنصة إلى الخزينة المركزية'
                      : 'طلب سحب مستحقات مبيعات الجملة'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isPlatformWarehouse
                      ? 'Transfert des Recettes du Dépôt vers la Trésorerie Centrale'
                      : 'Demande de Retrait des Revenus de Vente en Gros'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRequestPayoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Balance Notice Banner */}
            {availableBalance <= 0 ? (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div className="space-y-0.5 text-right">
                  <span className="font-black text-xs block">
                    {isPlatformWarehouse
                      ? 'رصيد التحصيلات المتاح حالياً هو 0 د.ج'
                      : 'رصيدك المتاح للسحب هو 0 د.ج'}
                  </span>
                  <p className="text-[11px] leading-relaxed text-rose-600/90 dark:text-rose-300/90">
                    {isPlatformWarehouse
                      ? 'لا توجد تحصيلات مؤكدة للترحيل حالياً. يتم إضافة عوائد مبيعات السلع ورسوم التغليف فور تسليم الطرود للزبائن واستلام أموال الـ COD.'
                      : 'لا يمكنك سحب أي مبلغ حالياً. يتم تحرير المستحقات وإضافتها للرصيد المتاح فور تسليم طلبيات مبيعات الجملة للزبائن وتأكيد التوصيل (COD).'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-purple-900 dark:text-purple-300 font-bold block">
                    {isPlatformWarehouse
                      ? 'التحصيلات المؤكدة الجاهزة للترحيل للخزينة:'
                      : 'الرصيد المتاح للسحب حالياً:'}
                  </span>
                  <span className="text-xl font-black font-mono text-purple-700 dark:text-purple-400">
                    <MoneyText amount={availableBalance} />
                  </span>
                </div>
                <span className="text-[10px] bg-purple-600 text-white px-2.5 py-1 rounded-full font-bold">
                  {isPlatformWarehouse ? 'ترحيل داخلي للخزينة 🏛️' : 'تحويل مباشر'}
                </span>
              </div>
            )}

            <form onSubmit={handleRequestSupplierPayout} className="space-y-4 text-xs">
              {/* Amount Input with Quick Preset Buttons */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isPlatformWarehouse
                      ? 'مبلغ التحصيلات المراد ترحيله إلى الخزينة (DZD) *'
                      : 'مبلغ السحب المطلوب (DZD) *'}
                  </label>
                  {availableBalance > 0 && (
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() =>
                          setPayoutForm((prev) => ({
                            ...prev,
                            amountDzd: Math.round(availableBalance * 0.5),
                          }))
                        }
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 font-bold"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPayoutForm((prev) => ({
                            ...prev,
                            amountDzd: availableBalance,
                          }))
                        }
                        className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold"
                      >
                        {isPlatformWarehouse ? 'كامل المبلغ (100%)' : 'كامل الرصيد (100%)'}
                      </button>
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  required
                  disabled={availableBalance <= 0}
                  min="1000"
                  max={availableBalance > 0 ? availableBalance : 0}
                  value={payoutForm.amountDzd || ''}
                  onChange={(e) =>
                    setPayoutForm({ ...payoutForm, amountDzd: Number(e.target.value) })
                  }
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-black text-base outline-hidden transition ${
                    payoutForm.amountDzd > availableBalance || availableBalance <= 0
                      ? 'border-rose-500 text-rose-600 focus:ring-2 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 focus:ring-2 focus:ring-purple-500'
                  }`}
                  placeholder="مثال: 50000"
                />
                {payoutForm.amountDzd > availableBalance && availableBalance > 0 && (
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold block">
                    ⚠️ المبلغ المطلوب ({payoutForm.amountDzd.toLocaleString()} د.ج) أكبر من رصيدك المتاح ({availableBalance.toLocaleString()} د.ج)!
                  </span>
                )}
                {availableBalance <= 0 && (
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold block">
                    ⚠️ لا يمكن السحب لأن الرصيد المتوفر هو 0 د.ج.
                  </span>
                )}
                <span className="text-[10px] text-slate-400 block">
                  الحد الأدنى لطلب السحب: 1,000 د.ج | الحد الأقصى: {availableBalance.toLocaleString()} د.ج
                </span>
              </div>

              {/* Payout Method / Treasury Destination Selection */}
              {isPlatformWarehouse ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-purple-500/10 border-2 border-violet-500/30 dark:border-violet-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-violet-900 dark:text-violet-300">
                      <Building2 className="w-4 h-4 text-violet-600" />
                      <span>وجهة الترحيل: الخزينة المركزية الرسمية لمنصة Nouva Market</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200">
                      حساب معتمد 🏛️
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">طبيعة العملية:</span>
                      <span className="font-bold text-violet-700 dark:text-violet-400">ترحيل إيرادات وتحصيلات COD داخلية</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">الحساب المستلم:</span>
                      <span className="font-mono font-bold">Nouva Market Platform Central Treasury</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-violet-200/50 dark:border-violet-800/40 pt-2">
                    بما أن هذا المستودع تابع للمنصة، فإن هذه التحصيلات تُقيد تلقائياً لصالح الخزينة العامة للمنصة لتغطية دورة رأس المال وتصفية فواتير شركات التوصيل.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      طريقة استلام المستحقات *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPayoutForm({ ...payoutForm, payoutMethod: 'BARIDIMOB' })}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          payoutForm.payoutMethod === 'BARIDIMOB'
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 font-black shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold'
                        }`}
                      >
                        <Phone className="w-4 h-4 text-purple-600" />
                        <span className="text-[11px]">بريدي موب</span>
                        <span className="text-[9px] text-slate-400">BaridiMob</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayoutForm({ ...payoutForm, payoutMethod: 'CCP' })}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          payoutForm.payoutMethod === 'CCP'
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 font-black shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold'
                        }`}
                      >
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span className="text-[11px]">حساب CCP</span>
                        <span className="text-[9px] text-slate-400">حوالة بريدية</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayoutForm({ ...payoutForm, payoutMethod: 'BANK' })}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          payoutForm.payoutMethod === 'BANK'
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 font-black shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span className="text-[11px]">تحويل بنكي</span>
                        <span className="text-[9px] text-slate-400">Virement RIB</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Account Inputs based on Method */}
                  {payoutForm.payoutMethod === 'BARIDIMOB' && (
                    <div className="space-y-1.5 p-3.5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        رقم الحساب أو RIP لتطبيق بريدي موب *
                      </label>
                      <input
                        type="text"
                        required
                        value={payoutForm.baridiMobPhoneOrRip}
                        onChange={(e) =>
                          setPayoutForm({ ...payoutForm, baridiMobPhoneOrRip: e.target.value })
                        }
                        placeholder="مثال: 00799999000123456789"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        يتم التحويل الفوري مباشرة عبر شبكة بريد الجزائر.
                      </span>
                    </div>
                  )}

                  {payoutForm.payoutMethod === 'CCP' && (
                    <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            رقم حساب CCP *
                          </label>
                          <input
                            type="text"
                            required
                            value={payoutForm.ccpNumber}
                            onChange={(e) =>
                              setPayoutForm({ ...payoutForm, ccpNumber: e.target.value })
                            }
                            placeholder="مثال: 1234567"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            المفتاح Clé *
                          </label>
                          <input
                            type="text"
                            required
                            value={payoutForm.ccpKey}
                            onChange={(e) =>
                              setPayoutForm({ ...payoutForm, ccpKey: e.target.value })
                            }
                            placeholder="89"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {payoutForm.payoutMethod === 'BANK' && (
                    <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          اسم البنك *
                        </label>
                        <select
                          value={payoutForm.bankName}
                          onChange={(e) =>
                            setPayoutForm({ ...payoutForm, bankName: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                        >
                          <option value="BNA - البنك الوطني الجزائري">BNA - البنك الوطني الجزائري</option>
                          <option value="BEA - بنك الجزائر الخارجي">BEA - بنك الجزائر الخارجي</option>
                          <option value="BADR - بنك الفلاحة والتنمية الريفية">BADR - بنك الفلاحة والتنمية الريفية</option>
                          <option value="BDL - بنك التنمية المحلية">BDL - بنك التنمية المحلية</option>
                          <option value="CPA - القرض الشعبي الجزائري">CPA - القرض الشعبي الجزائري</option>
                          <option value="Al Baraka - بنك البركة الجزائري">Al Baraka - بنك البركة الجزائري</option>
                          <option value="Gulf Bank - بنك الخليج الجزائر">Gulf Bank - بنك الخليج الجزائر</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          رقم الحساب البنكي RIB (20 رقم) *
                        </label>
                        <input
                          type="text"
                          required
                          value={payoutForm.bankRib}
                          onChange={(e) =>
                            setPayoutForm({ ...payoutForm, bankRib: e.target.value })
                          }
                          placeholder="00100999000012345678"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          اسم صاحب الحساب أو الشركة *
                        </label>
                        <input
                          type="text"
                          required
                          value={payoutForm.accountHolderName}
                          onChange={(e) =>
                            setPayoutForm({ ...payoutForm, accountHolderName: e.target.value })
                          }
                          placeholder="اسم المستفيد الكامل"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isPlatformWarehouse
                    ? 'ملاحظات أو مرجع إيداع الخزينة (اختياري)'
                    : 'ملاحظات أو تعليمات خاصة لطلب السحب (اختياري)'}
                </label>
                <textarea
                  rows={2}
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  placeholder={
                    isPlatformWarehouse
                      ? 'أي مرجع أو ملاحظة خاصة بترحيل التحصيلات إلى الخزينة المركزية...'
                      : 'أي ملاحظة أو تفاصيل إضافية للإدارة المالية...'
                  }
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestPayoutModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={
                    availableBalance <= 0 ||
                    !payoutForm.amountDzd ||
                    payoutForm.amountDzd <= 0 ||
                    payoutForm.amountDzd > availableBalance ||
                    payoutForm.amountDzd < 1000
                  }
                  className={`px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg transition ${
                    availableBalance <= 0 ||
                    !payoutForm.amountDzd ||
                    payoutForm.amountDzd <= 0 ||
                    payoutForm.amountDzd > availableBalance ||
                    payoutForm.amountDzd < 1000
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                      : isPlatformWarehouse
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30 cursor-pointer'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 cursor-pointer'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isPlatformWarehouse
                      ? 'تأكيد الترحيل إلى الخزينة المركزية 🏛️'
                      : 'إرسال طلب السحب للإدارة'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PACKER / WAREHOUSE WORKER WITHDRAWAL MODAL */}
      {isPackerWithdrawModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    طلب سحب أتعاب التغليف والتجهيز
                  </h3>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                    مستحقات عامل ومغلف المستودع (على عاتق الإدارة 100%)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPackerWithdrawModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Available Balance Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-300 dark:border-amber-800/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold block">
                  رصيدك المتاح للسحب من أتعاب التغليف:
                </span>
                <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono">
                  {availablePackerWithdrawalDzd.toLocaleString()} د.ج
                </span>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black border border-amber-500/30">
                {completedOrders.length} طرد مسلّم
              </span>
            </div>

            <form onSubmit={handleRequestPackerPayout} className="space-y-4 text-xs font-bold">
              {/* Amount to withdraw */}
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">
                  المبلغ المراد سحبه (دج) *
                </label>
                <input
                  type="number"
                  min={100}
                  max={availablePackerWithdrawalDzd}
                  value={packerWithdrawAmount || ''}
                  onChange={(e) => setPackerWithdrawAmount(Number(e.target.value))}
                  placeholder={`الحد الأقصى: ${availablePackerWithdrawalDzd.toLocaleString()} دج`}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base focus:border-amber-500 focus:outline-hidden"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPackerWithdrawAmount(availablePackerWithdrawalDzd)}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-black transition cursor-pointer"
                  >
                    كامل الرصيد ({availablePackerWithdrawalDzd.toLocaleString()} دج)
                  </button>
                  {availablePackerWithdrawalDzd >= 2000 && (
                    <button
                      type="button"
                      onClick={() => setPackerWithdrawAmount(Math.floor(availablePackerWithdrawalDzd / 2))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] transition cursor-pointer"
                    >
                      نصف الرصيد (50%)
                    </button>
                  )}
                  {[5000, 10000, 20000].map(
                    (amt) =>
                      availablePackerWithdrawalDzd >= amt && (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setPackerWithdrawAmount(amt)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] transition cursor-pointer"
                        >
                          {amt.toLocaleString()} دج
                        </button>
                      )
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">
                  طريقة استلام الأتعاب *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'BARIDIMOB' as const, label: '📱 BaridiMob' },
                    { id: 'CCP' as const, label: '📮 حساب CCP' },
                    { id: 'CASH' as const, label: '💵 نقداً بالمستودع' },
                    { id: 'BANK' as const, label: '🏛️ حساب بنكي' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPackerWithdrawMethod(m.id)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer text-xs font-black ${
                        packerWithdrawMethod === m.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Worker Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 block">
                    اسم عامل / مسؤول التغليف *
                  </label>
                  <input
                    type="text"
                    value={packerWorkerName}
                    onChange={(e) => setPackerWorkerName(e.target.value)}
                    required
                    placeholder="مثال: يونس قاسم"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 block">
                    رقم الهاتف للتواصل *
                  </label>
                  <input
                    type="text"
                    value={packerWorkerPhone}
                    onChange={(e) => setPackerWorkerPhone(e.target.value)}
                    required
                    placeholder="05 / 06 / 07 ..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Account Details depending on method */}
              {packerWithdrawMethod !== 'CASH' && (
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 block">
                    {packerWithdrawMethod === 'BARIDIMOB'
                      ? 'رقم BaridiMob أو الـ RIP (20 رقم) *'
                      : packerWithdrawMethod === 'CCP'
                      ? 'رقم حساب CCP والمفتاح Clé *'
                      : 'رقم الحساب البنكي RIB واسم البنك *'}
                  </label>
                  <input
                    type="text"
                    value={packerWithdrawAccountDetails}
                    onChange={(e) => setPackerWithdrawAccountDetails(e.target.value)}
                    required
                    placeholder={
                      packerWithdrawMethod === 'BARIDIMOB'
                        ? 'مثال: 00799999000123456789 أو 0550123456'
                        : packerWithdrawMethod === 'CCP'
                        ? 'مثال: CCP: 1234567 Clé 89'
                        : 'مثال: BNA - RIB: 00100999000012345678'
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 block">
                  ملاحظات إضافية (اختياري)
                </label>
                <input
                  type="text"
                  value={packerWithdrawNotes}
                  onChange={(e) => setPackerWithdrawNotes(e.target.value)}
                  placeholder="أي توضيحات بخصوص التحويل..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPackerWithdrawModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={
                    availablePackerWithdrawalDzd <= 0 ||
                    !packerWithdrawAmount ||
                    packerWithdrawAmount <= 0 ||
                    packerWithdrawAmount > availablePackerWithdrawalDzd
                  }
                  className={`px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg transition ${
                    availablePackerWithdrawalDzd <= 0 ||
                    !packerWithdrawAmount ||
                    packerWithdrawAmount <= 0 ||
                    packerWithdrawAmount > availablePackerWithdrawalDzd
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/30 cursor-pointer active:scale-95'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إرسال طلب سحب أتعاب التغليف 📦</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPLIER EDIT PAYOUT ACCOUNTS MODAL */}
      {isEditAccountsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-right">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    تعديل حسابات استلام المستحقات
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    تحديث بيانات BaridiMob و CCP والتحويل البنكي
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditAccountsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayoutAccounts} className="space-y-4 text-xs">
              {/* Account Holder Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  اسم صاحب الحساب الكامل / المستفيد (Nom & Prénom) *
                </label>
                <input
                  type="text"
                  required
                  value={editAccountsForm.accountHolderName}
                  onChange={(e) => setEditAccountsForm({ ...editAccountsForm, accountHolderName: e.target.value })}
                  placeholder="مثال: أمين بن بلقاسم أو شركة سارل إلكترونيكس"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500 text-xs"
                />
                <span className="text-[10px] text-slate-400 block">
                  الاسم المسجل رسمياً على الصك البريدي أو البطاقة الذهبية أو الكشف البنكي
                </span>
              </div>

              {/* BaridiMob Account */}
              <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/40 space-y-2">
                <div className="flex items-center justify-between text-purple-900 dark:text-purple-300 font-extrabold">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-purple-600" />
                    <span>حساب تطبيق بريدي موب (BaridiMob RIP / Numéro)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-mono">
                    فوري
                  </span>
                </div>
                <input
                  type="text"
                  value={editAccountsForm.baridiMobNumber}
                  onChange={(e) => setEditAccountsForm({ ...editAccountsForm, baridiMobNumber: e.target.value })}
                  placeholder="مثال: 00799999000123456789 أو رقم الهاتف المسجل"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500 text-xs"
                />
                <p className="text-[10px] text-purple-700/80 dark:text-purple-300/80">
                  يُفضل إدخال رقم الـ RIP المكون من 20 رقماً للتحويل الفوري المباشر عبر تطبيق بريدي موب
                </p>
              </div>

              {/* CCP Account */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-extrabold">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>حساب البريد الجاري الجزائري (CCP & Clé)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                    بريد الجزائر
                  </span>
                </div>
                <input
                  type="text"
                  value={editAccountsForm.ccpOrRip}
                  onChange={(e) => setEditAccountsForm({ ...editAccountsForm, ccpOrRip: e.target.value })}
                  placeholder="مثال: 12345678 Clé 89"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500 text-xs"
                />
                <p className="text-[10px] text-slate-400">
                  رقم الحساب البريدي الجاري والمفتاح لتحويل الحوالات البريدية الرسمية
                </p>
              </div>

              {/* Bank Account RIB */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-extrabold">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>الحساب البنكي (Virement Bancaire RIB)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                    بنوك وطنية
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">اسم البنك (Banque):</label>
                    <input
                      type="text"
                      value={editAccountsForm.bankName}
                      onChange={(e) => setEditAccountsForm({ ...editAccountsForm, bankName: e.target.value })}
                      placeholder="مثال: BNA / BEA / BADR / CPA / BDL"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">رقم الـ RIB (20 رقماً):</label>
                    <input
                      type="text"
                      value={editAccountsForm.bankRib}
                      onChange={(e) => setEditAccountsForm({ ...editAccountsForm, bankRib: e.target.value })}
                      placeholder="مثال: 00100999000012345678"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500 text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  مخصص للتحويلات البنكية للمبالغ الكبيرة وللمؤسسات ذات السجل التجاري
                </p>
              </div>

              {/* Security note */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-[11px]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>بياناتك المالية محمية وتُستخدم فقط لتحويل مستحقاتك من مبيعات الجملة.</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditAccountsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black flex items-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ وتحديث الحسابات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PENDING SETTLEMENT MODAL */}
      {settlementToDelete && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                تأكيد حذف طلب السحب؟
              </h3>
              <p className="text-xs text-slate-500">
                هل أنت متأكد من رغبتك في حذف وإلغاء طلب السحب الذي لا يزال قيد مراجعة وتحويل الإدارة؟
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">رقم الطلب:</span>
                <span className="font-mono font-black text-purple-600 dark:text-purple-400">{settlementToDelete.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">المبلغ المطلوب:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                  <MoneyText amount={settlementToDelete.amountDzd || 0} />
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">طريقة التحويل:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {settlementToDelete.payoutMethod === 'BARIDIMOB' ? '📱 BaridiMob' : settlementToDelete.payoutMethod === 'CCP' ? '📮 حساب CCP' : '🏛️ تحويل بنكي'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">الحالة الحالية:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>قيد مراجعة وتحويل الإدارة</span>
                </span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/60 text-center font-bold">
              💡 عند حذف هذا الطلب، سيتم استرجاع مبلغ السحب ({settlementToDelete.amountDzd?.toLocaleString()} د.ج) فوراً إلى رصيدك المتاح.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSettlementToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition cursor-pointer text-xs"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSettlement(settlementToDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition cursor-pointer text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تأكيد حذف الطلب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL MULTI-PRODUCT IMPORT MODAL */}
      <ProductUrlImportModal
        isOpen={isUrlImportModalOpen}
        onClose={() => setIsUrlImportModalOpen(false)}
        defaultSupplierId={supplierProfile.id}
        defaultSupplierName={supplierProfile.companyName || supplierProfile.fullName}
        onImportProducts={(newProducts) => {
          setProducts((prev) => {
            const updated = [...newProducts, ...prev];
            saveStoredProducts(updated);
            return updated;
          });
        }}
        onShowToast={onShowToast}
      />

      {/* SHIPPING RATES MODAL (68 WILAYAS) */}
      {showShippingRatesModal && (
        <ShippingRatesModal onClose={() => setShowShippingRatesModal(false)} />
      )}

      {/* ==================== E-COM DELIVERY API v2: RAMASSAGE MODAL (Platform Warehouse Only) ==================== */}
      {Boolean(isPlatformWarehouse && isPickupModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">طلب سائق لجمع الطرود من المستودع المركزي</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Platform Warehouse Pickup (Ramassage) • E-com API</p>
                </div>
              </div>
              <button
                onClick={() => setIsPickupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">عدد الطرود والطلب الشحن المراد جمعها:</label>
                <input
                  type="number"
                  min="1"
                  value={pickupColisCount}
                  onChange={(e) => setPickupColisCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">نوع المركبة المطلوبة من شركة E-com:</label>
                <select
                  value={pickupVehicule}
                  onChange={(e) => setPickupVehicule(Number(e.target.value) as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value={1}>1 - دراجة نارية (Moto - للطرود الصغيرة)</option>
                  <option value={2}>2 - سيارة سياحية (Voiture)</option>
                  <option value={3}>3 - شاحنة صغيرة (Pickup)</option>
                  <option value={4}>4 - شاحنة مغلقة (Fourgon - للكميات الكبيرة)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">بلدية المستودع:</label>
                  <input
                    type="text"
                    value={pickupCommune}
                    onChange={(e) => setPickupCommune(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الوقت المطلوب:</label>
                  <input
                    type="text"
                    value={pickupHeure}
                    onChange={(e) => setPickupHeure(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">هاتف الاتصال بالمستودع:</label>
                <input
                  type="text"
                  value={pickupMobile}
                  onChange={(e) => setPickupMobile(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ملاحظات للموزع السائق:</label>
                <textarea
                  value={pickupNote}
                  onChange={(e) => setPickupNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsPickupModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmitRamassage}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال طلب الجمع للسائق (201 Created)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== E-COM DELIVERY API v2: SUMMARY STATS MODAL ==================== */}
      {showEcomSummaryModal && ecomSummaryData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">إحصائيات ونسب الأداء الحية من E-com Delivery</h3>
                  <p className="text-[10px] text-slate-500 font-mono">GET https://ecom-dz.com/api_v2/colis/resume</p>
                </div>
              </div>
              <button
                onClick={() => setShowEcomSummaryModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">إجمالي الطرود</span>
                <strong className="text-sm text-slate-900 dark:text-white font-extrabold">{ecomSummaryData.total}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800">
                <span className="text-[10px] text-purple-600 dark:text-purple-400 block">نسبة نجاح التسليم</span>
                <strong className="text-sm text-purple-700 dark:text-purple-300 font-extrabold">{ecomSummaryData.taux_livraison}%</strong>
              </div>
              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
                <span className="text-[10px] text-sky-600 dark:text-sky-400 block">توصيل المنزل vs الفرع</span>
                <strong className="text-xs text-sky-700 dark:text-sky-300 font-bold">{ecomSummaryData.taux_domicile}% / {ecomSummaryData.taux_stopdesk}%</strong>
              </div>
            </div>

            {/* Situations Breakdown */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">التوزيع حسب حالات E-com القياسية (par_situation):</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {ecomSummaryData.par_situation?.map((st: any, idx: number) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{st.situation}</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-extrabold">
                      {st.nombre} طرد
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowEcomSummaryModal(false)}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== E-COM DELIVERY API v2: PAIEMENTS MODAL ==================== */}
      {showEcomPaiementsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">كشوفات وحوالات المستحقات من E-com Delivery</h3>
                  <p className="text-[10px] text-slate-500 font-mono">GET https://ecom-dz.com/api_v2/paiements</p>
                </div>
              </div>
              <button
                onClick={() => setShowEcomPaiementsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {ecomPaiementsData.length === 0 ? (
                <p className="text-xs text-center text-slate-500 py-4">لا توجد كشوفات حوالات صادرة بعد.</p>
              ) : (
                ecomPaiementsData.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400 text-sm">{item.code}</span>
                      <span className="text-[11px] font-mono text-slate-500">{item.date}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-mono">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block">صافي الحوالة</span>
                        <strong className="text-purple-600 dark:text-purple-400 font-extrabold text-xs">{item.montant?.toLocaleString()} دج</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block">عدد الطرود</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-bold">{item.nb_colis} (مسلم: {item.colis_livres})</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block">رسوم الخدمة</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-bold">{item.total_service} دج</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block">رسوم التغليف</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-bold">{item.total_emballage} دج</strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowEcomPaiementsModal(false)}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PHASE 2: PICKING & PACKING MODAL ==================== */}
      {isPickingModalOpen && (
        <PickingPackingModal
          orders={
            selectedPrepOrderIds.length > 0
              ? preparationOrders.filter((o) => selectedPrepOrderIds.includes(o.id))
              : filterBySearch(preparationOrders)
          }
          products={products}
          onClose={() => setIsPickingModalOpen(false)}
          onUpdateOrderStatus={(orderId, status) => {
            updateOrderStatus(orderId, status);
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* ==================== PHASE 2: COURIER HANDOVER MANIFEST MODAL ==================== */}
      {isManifestModalOpen && (
        <CourierManifestModal
          orders={
            selectedPrepOrderIds.length > 0
              ? preparationOrders.filter((o) => selectedPrepOrderIds.includes(o.id))
              : filterBySearch(preparationOrders)
          }
          onClose={() => setIsManifestModalOpen(false)}
          onShowToast={onShowToast}
          onMarkOrdersShipped={(orderIds) => {
            orderIds.forEach((id) => updateOrderStatus(id, 'SHIPPED'));
            setSelectedPrepOrderIds([]);
          }}
        />
      )}

      {/* ==================== PHASE 3: COD RECONCILIATION MODAL ==================== */}
      {isCodReconcileModalOpen && (
        <CodReconciliationModal
          orders={orders}
          onClose={() => setIsCodReconcileModalOpen(false)}
          onShowToast={onShowToast}
          onOrdersUpdated={(updatedOrders) => {
            updatedOrders.forEach((uo) => updateOrder(uo.id, uo));
          }}
        />
      )}

      {/* ==================== PHASE 3: RETURNS QC & CLAIMS MODAL ==================== */}
      {isReturnsQCModalOpen && (
        <ReturnsQCModal
          returnedOrders={returnedOrders}
          products={products}
          onClose={() => setIsReturnsQCModalOpen(false)}
          onShowToast={onShowToast}
          onOrderRestocked={(orderId) => {
            confirmReturnInWarehouse(orderId);
            setProducts(getStoredProducts());
          }}
        />
      )}

      {/* ==================== PHASE 3: COURIER ANALYTICS & WILAYA MATRIX MODAL ==================== */}
      {isCourierAnalyticsModalOpen && (
        <CourierAnalyticsModal
          orders={orders}
          onClose={() => setIsCourierAnalyticsModalOpen(false)}
        />
      )}

      {/* ==================== LIVE AUDIT TRAIL & TIMELINE MODAL ==================== */}
      {selectedTimelineOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900 dark:text-white">
                  سجل التزامن والمسار اللحظي للطلب
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 font-extrabold">
                  #{selectedTimelineOrder.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedTimelineOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <OrderAuditTimeline order={selectedTimelineOrder} />

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedTimelineOrder(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}