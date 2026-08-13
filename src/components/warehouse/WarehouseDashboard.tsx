import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useCategories } from '../../context/CategoryContext';
import { useAuth } from '../../context/AuthContext';
import { getStoredProducts, saveStoredProducts } from '../../data/mockProducts';
import { getStoredCouriers, saveStoredCouriers, CourierPartner } from '../../lib/courierHelper';
import {
  getStoredSuppliers,
  saveStoredSuppliers,
  getStoredSettlements,
  recordSupplierPayment,
  getStoredMarketplaceFees,
} from '../../lib/supplierHelper';
import { Order, OrderStatus, Product, SupplierProfile, SupplierSettlement } from '../../types';
import { MoneyText } from '../ui/MoneyText';
import { ProductEditModal } from '../common/ProductEditModal';
import { ProductUrlImportModal } from '../common/ProductUrlImportModal';
import { LowStockBanner, LowStockModal, getLowStockProducts } from '../common/LowStockAlerts';
import { addSellerNotification, addWarehouseNotification, addAdminNotification, getUnreadNotificationsCount } from '../../lib/notificationHelper';
import { NotificationsModal } from '../tabs/NotificationsModal';

interface WarehouseDashboardProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type WarehouseTab =
  | 'pending'
  | 'preparation'
  | 'delivery'
  | 'completed'
  | 'returned'
  | 'products'
  | 'tracking'
  | 'couriers'
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

export function WarehouseDashboard({ onShowToast }: WarehouseDashboardProps) {
  const { categories } = useCategories();
  const {
    orders,
    confirmOrderWarehouse,
    rejectOrderWithReason,
    setTrackingCode,
    updateOrderStatus,
    updateOrder,
    confirmReturnInWarehouse,
  } = useOrders();

  const [activeTab, setActiveTab] = useState<WarehouseTab>('pending');
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

  const togglePrepOrderSelection = (id: string) => {
    setSelectedPrepOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Products Inventory State
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNewProduct, setIsAddingNewProduct] = useState(false);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const [isUrlImportModalOpen, setIsUrlImportModalOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Supplier Profile & Financials State
  const { user } = useAuth();
  const isDemoSupplier = false;

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
      status: 'APPROVED',
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

  const [settlements, setSettlements] = useState<SupplierSettlement[]>(() => {
    const allSettlements = getStoredSettlements();
    if (isDemoSupplier) {
      return allSettlements;
    }
    return allSettlements.filter((st) => st.supplierId === supplierProfile.id);
  });

  // Financial Payments & Settlements State
  const [isMakePaymentModalOpen, setIsMakePaymentModalOpen] = useState(false);
  const [settlementFilterStatus, setSettlementFilterStatus] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');
  const [settlementSearchTerm, setSettlementSearchTerm] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    amountDzd: 38000,
    payoutMethod: 'BARIDIMOB' as 'BARIDIMOB' | 'CCP' | 'BANK' | 'CASH',
    referenceNumber: `BM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 8999 + 1000)}`,
    accountDetails: 'RIP: 00799999000123456789',
    notes: 'تسديد دفعة عمولات Nouva Market والمسوقين',
  });

  const handlePerformSupplierPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amountDzd || paymentForm.amountDzd <= 0) {
      onShowToast('يرجى تحديد مبلغ دفع صحيح أكبر من الصفر!', 'error');
      return;
    }

    const newSettlement = recordSupplierPayment(
      supplierProfile.id,
      paymentForm.amountDzd,
      paymentForm.payoutMethod,
      paymentForm.accountDetails || supplierProfile.ccpOrRip || 'BaridiMob',
      paymentForm.referenceNumber,
      paymentForm.notes
    );

    setSettlements((prev) => [newSettlement, ...prev]);

    const updatedProfile: SupplierProfile = {
      ...supplierProfile,
      paidAmountDzd: (supplierProfile.paidAmountDzd || 0) + paymentForm.amountDzd,
      lastPaymentDate: new Date().toISOString().split('T')[0],
    };

    setSupplierProfile(updatedProfile);
    const suppliers = getStoredSuppliers();
    const idx = suppliers.findIndex((s) => s.id === updatedProfile.id);
    if (idx !== -1) {
      suppliers[idx] = updatedProfile;
    } else {
      suppliers.push(updatedProfile);
    }
    saveStoredSuppliers(suppliers);

    setIsMakePaymentModalOpen(false);
    onShowToast(
      `✔ تم تسجيل وتأكيد عملية الدفع بمبلغ ${paymentForm.amountDzd.toLocaleString()} د.ج بنجاح!`,
      'success'
    );
  };

  // Couriers ( شركات التوصيل API ) State & Handlers
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

  const handleAddCourierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourierForm.name.trim()) {
      onShowToast('يرجى إدخال اسم شركة التوصيل', 'error');
      return;
    }
    const createdCourier: CourierPartner = {
      id: `cour-${Date.now()}`,
      name: newCourierForm.name.trim(),
      apiKey: newCourierForm.apiKey || `key_${Math.floor(Math.random() * 899999 + 100000)}`,
      apiSecret: newCourierForm.apiSecret || `sec_${Math.floor(Math.random() * 899999 + 100000)}`,
      webhookUrl: newCourierForm.webhookUrl || 'https://api.nouvamarket.com/webhook',
      connectionStatus: 'CONNECTED',
      baseShippingFee: newCourierForm.baseShippingFee || 600,
      supportedWilayasCount: newCourierForm.supportedWilayasCount || 69,
      avgDeliveryDays: '24-48 ساعة',
      isDisabled: false,
    };
    setCouriers([...couriers, createdCourier]);
    setIsAddingCourierModalOpen(false);
    setNewCourierForm({ name: '', apiKey: '', apiSecret: '', webhookUrl: '', baseShippingFee: 600, supportedWilayasCount: 69 });
    onShowToast('✔ تم إضافة وتحديث شركة التوصيل للمورد بنجاح!', 'success');
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const updated: SupplierProfile = {
      ...supplierProfile,
      ...profileForm,
    };
    setSupplierProfile(updated);
    const suppliers = getStoredSuppliers();
    const idx = suppliers.findIndex((s) => s.id === updated.id);
    if (idx !== -1) {
      suppliers[idx] = updated;
    } else {
      suppliers.push(updated);
    }
    saveStoredSuppliers(suppliers);
    onShowToast('✔ تم تحديث بيانات الملف الشخصي للمورد بنجاح!', 'success');
    setIsSavingProfile(false);
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
    const allCouriers = getStoredCouriers();
    const activeCouriers = allCouriers.filter((c) => !c.isDisabled);
    const courier =
      activeCouriers.find((c) => c.id === selectedCourierId) ||
      activeCouriers[0] ||
      allCouriers[0];

    confirmOrderWarehouse(confirmingOrderModal.id);

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

  // STEP 2 — Button 1: Send to Shipping Platform API
  const handleSendToShippingApi = (order: Order) => {
    const tracking = order.trackingCode || `YAL-${Math.floor(100000 + Math.random() * 900000)}`;
    setTrackingCode(order.id, tracking);
    updateOrder(order.id, { deliveryCompanySent: true });
    onShowToast(`🚀 تم إرسال الطلب لشركة الشحن وتسجيل رقم التتبع: ${tracking}`, 'success');
  };

  // STEP 2 — Button 2: Retrieve Shipping Label API
  const handleRetrieveShippingLabel = (orderId: string) => {
    setRetrievedLabels((prev) => ({ ...prev, [orderId]: true }));
    onShowToast('📄 تم استرجاع ملصق الشحن (Étiquette PDF) من الشركة بنجاح!', 'success');
  };

  // STEP 2 — Button 4: Mark Package Ready
  const handleMarkPackageReady = (orderId: string) => {
    updateOrderStatus(orderId, 'SHIPPED');
    onShowToast('🚚 تم تجهيز الطرد وتأكيد تحويل الحالة تلقائياً إلى قيد التوصيل!', 'success');
  };

  // STEP 3 — Sync Delivery Status
  const handleSyncDeliveryStatus = (order: Order) => {
    const trackingStatuses = [
      { internal: 'Out For Delivery', label: 'خرج للتوصيل مع السائق' },
      { internal: 'Delivered', label: 'تم التسليم للزبون' },
    ];
    const randomStatus = trackingStatuses[Math.floor(Math.random() * trackingStatuses.length)];

    if (randomStatus.internal === 'Delivered') {
      updateOrderStatus(order.id, 'DELIVERED');
      onShowToast(`🎉 تم مزامنة التوصيل: تم تسليم الطلب #${order.id} بنجاح!`, 'success');
    } else {
      updateOrder(order.id, {
        statusAr: `قيد التوصيل (${randomStatus.label})`,
      });
      onShowToast(`🔄 تم تحديث التتبع من شركة الشحن: ${randomStatus.label}`, 'info');
    }
  };

  // Products Save Handler
  const handleSaveProductFromWarehouse = (savedProduct: Product) => {
    let isNew = false;
    setProducts((prev) => {
      const exists = prev.some((x) => x.id === savedProduct.id);
      isNew = !exists || isAddingNewProduct;
      const updated = exists
        ? prev.map((x) => (x.id === savedProduct.id ? savedProduct : x))
        : [savedProduct, ...prev];
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
    setProducts((prev) => {
      const prod = prev.find((p) => p.id === productId);
      const updated = prev.filter((p) => p.id !== productId);
      saveStoredProducts(updated);
      onShowToast(`🗑️ تم حذف المنتج (${prod?.nameAr || ''}) نهائياً من المستودع!`, 'info');
      return updated;
    });
  };

  const [showOnlyMyProducts, setShowOnlyMyProducts] = useState(true);

  const handleOpenAddProduct = () => {
    const newP: Product = {
      id: `p-${Date.now()}`,
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

  const preparationOrders = dateFilteredOrders.filter(
    (o) =>
      (o.adminConfirmed || o.status === 'PROCESSING' || o.status === 'CONFIRMED' || o.situation === 'EnPréparation') &&
      o.status !== 'SHIPPED' &&
      o.status !== 'DELIVERED' &&
      o.status !== 'CANCELLED' &&
      o.status !== 'FAILED'
  );

  const deliveryOrders = dateFilteredOrders.filter((o) => o.status === 'SHIPPED');

  const completedOrders = dateFilteredOrders.filter((o) => o.status === 'DELIVERED');

  const returnedOrders = dateFilteredOrders.filter(
    (o) =>
      !o.returnedToWarehouse &&
      o.situation !== 'RetourReçu' &&
      (o.status === 'FAILED' ||
        o.status === 'CANCELLED' ||
        o.situation === 'Retour')
  );

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
    <div className="flex-1 pb-24 overflow-y-auto p-2.5 sm:p-4 text-slate-900 dark:text-slate-100 space-y-4 max-w-7xl mx-auto overflow-x-hidden w-full min-w-0">
      {/* HEADER BANNER - HIGH CREATIVE & PROFESSIONAL */}
      <div className="p-4 sm:p-6 rounded-[2rem] bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-800/80 text-white shadow-2xl space-y-5 relative overflow-hidden">
        {/* Background Decorative Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-sky-500/30 border border-indigo-400/40 text-indigo-300 shadow-inner shrink-0">
              <Package className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>لوحة تحكم المورد والمستودع</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  المستودع الرئيسي
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-200/80 font-medium mt-0.5">
                إدارة الكتالوج والمخزون، تجهيز الطلبات، تتبع بوليصات الشحن، ومتابعة الأرباح والتحويلات المالية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setShowShippingRatesModal(true)}
              className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-lg active:scale-95"
              title="جدول أسعار التوصيل لجميع الولايات"
            >
              <Truck className="w-4 h-4 text-slate-950" />
              <span>🚚 أسعار التوصيل (68 ولاية)</span>
            </button>
            <button
              onClick={() => setIsWarehouseNotifOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-2 transition cursor-pointer relative shadow-lg hover:shadow-amber-500/20"
              title="تنبيهات وإشعارات المستودع"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>إشعارات المستودع</span>
              {unreadNotifCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse border-2 border-slate-950">
                  {unreadNotifCount}
                </span>
              )}
            </button>
            <span className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-300 border border-sky-500/30 text-xs font-black whitespace-nowrap shadow-xs">
              🏭 المورد المعتمد
            </span>
          </div>
        </div>

        {/* 10 MAIN KPI CARDS - COVERING ALL WAREHOUSE SECTIONS */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 xl:grid-cols-10 gap-2 pt-3 border-t border-indigo-800/60 relative z-10">
          {/* 1. Products */}
          <div
            onClick={() => setActiveTab('products')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeTab === 'products'
                ? 'bg-indigo-600/50 border-indigo-400 text-white shadow-lg ring-1 ring-indigo-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-indigo-900/80 hover:border-indigo-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">المنتجات</span>
              <Box className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-indigo-300 font-mono">{products.length}</span>
              <span className="text-[9px] text-indigo-200 font-medium">منتج</span>
            </div>
          </div>

          {/* 2. Pending */}
          <div
            onClick={() => setActiveTab('pending')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeTab === 'pending'
                ? 'bg-amber-600/50 border-amber-400 text-white shadow-lg ring-1 ring-amber-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-indigo-900/80 hover:border-amber-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">1. مراجعة</span>
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-amber-400 font-mono">{pendingOrders.length}</span>
              <span className="text-[9px] text-amber-200 font-medium">طلب</span>
            </div>
          </div>

          {/* 3. Preparation */}
          <div
            onClick={() => setActiveTab('preparation')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeTab === 'preparation'
                ? 'bg-violet-600/50 border-violet-400 text-white shadow-lg ring-1 ring-violet-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-indigo-900/80 hover:border-violet-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">2. تحضير</span>
              <Package className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-violet-300 font-mono">{preparationOrders.length}</span>
              <span className="text-[9px] text-violet-200 font-medium">طلب</span>
            </div>
          </div>

          {/* 4. Delivery */}
          <div
            onClick={() => setActiveTab('delivery')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeTab === 'delivery'
                ? 'bg-blue-600/50 border-blue-400 text-white shadow-lg ring-1 ring-blue-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-indigo-900/80 hover:border-blue-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">3. توصيل</span>
              <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-blue-400 font-mono">{deliveryOrders.length}</span>
              <span className="text-[9px] text-blue-200 font-medium">شحنة</span>
            </div>
          </div>

          {/* 5. Completed */}
          <div
            onClick={() => setActiveTab('completed')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeTab === 'completed'
                ? 'bg-emerald-600/50 border-emerald-400 text-white shadow-lg ring-1 ring-emerald-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-indigo-900/80 hover:border-emerald-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">4. مكتملة</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">{completedOrders.length}</span>
              <span className="text-[9px] text-emerald-200 font-medium">طلب</span>
            </div>
          </div>

          {/* 6. Returned */}
          <div
            onClick={() => setActiveTab('returned')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeTab === 'returned'
                ? 'bg-rose-600/50 border-rose-400 text-white shadow-lg ring-1 ring-rose-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-indigo-900/80 hover:border-rose-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">5. مرتجعات</span>
              <RotateCcw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-rose-400 font-mono">{returnedOrders.length}</span>
              <span className="text-[9px] text-rose-200 font-medium">مرتجع</span>
            </div>
          </div>

          {/* 7. Financial */}
          <div
            onClick={() => setActiveTab('financial')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeTab === 'financial'
                ? 'bg-emerald-600/50 border-emerald-400 text-white shadow-lg ring-1 ring-emerald-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-indigo-900/80 hover:border-emerald-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">المالية</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xs sm:text-sm font-black text-emerald-300 font-mono">
                {completedOrders.reduce((acc, o) => acc + (o.wholesalePrice || 0), 0).toLocaleString()}
              </span>
              <span className="text-[9px] text-emerald-200 font-medium">دج</span>
            </div>
          </div>

          {/* 8. Tracking Tool */}
          <div
            onClick={() => setActiveTab('tracking')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeTab === 'tracking'
                ? 'bg-violet-600/50 border-violet-400 text-white shadow-lg ring-1 ring-violet-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-indigo-900/80 hover:border-violet-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">تتبع الشحنة</span>
              <Search className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xs sm:text-sm font-black text-violet-300 font-mono">Ecom API</span>
              <span className="text-[9px] text-violet-200 font-medium">بحث فوري</span>
            </div>
          </div>

          {/* 9. Couriers API */}
          <div
            onClick={() => setActiveTab('couriers')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeTab === 'couriers'
                ? 'bg-sky-600/50 border-sky-400 text-white shadow-lg ring-1 ring-sky-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-indigo-900/80 hover:border-sky-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">شركات التوصيل</span>
              <Truck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-black text-sky-400 font-mono">{couriers.length}</span>
              <span className="text-[9px] text-sky-200 font-medium">شركة</span>
            </div>
          </div>

          {/* 9. Analytics */}
          <div
            onClick={() => setActiveTab('analytics')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeTab === 'analytics'
                ? 'bg-purple-600/50 border-purple-400 text-white shadow-lg ring-1 ring-purple-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-indigo-900/80 hover:border-purple-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">الإحصائيات</span>
              <BarChart3 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xs sm:text-sm font-black text-purple-300 font-mono">
                {dateFilteredOrders.length > 0
                  ? Math.round((completedOrders.length / dateFilteredOrders.length) * 100) + '%'
                  : '100%'}
              </span>
              <span className="text-[9px] text-purple-200 font-medium">تسليم</span>
            </div>
          </div>

          {/* 10. Profile */}
          <div
            onClick={() => setActiveTab('profile')}
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              activeTab === 'profile'
                ? 'bg-teal-600/50 border-teal-400 text-white shadow-lg ring-1 ring-teal-400/50 scale-[1.02]'
                : 'bg-slate-900/70 border-indigo-900/80 hover:border-teal-600/80 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span className="truncate">الملف والحساب</span>
              <User className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xs sm:text-sm font-black text-teal-300 font-mono">مُعتمَد</span>
              <span className="text-[9px] text-teal-200 font-medium">حساب</span>
            </div>
          </div>
        </div>
      </div>

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

      {/* SEARCH & REORDERED HIGH-CREATIVE NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Navigation Tabs - Cleanly Ordered & Categorized */}
        <div className="p-1.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-x-auto w-full max-w-full text-xs font-bold scrollbar-none shrink-0 min-w-0">
          <div className="flex items-center gap-1.5">
            {/* 1. Products Management */}
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 font-black scale-[1.01]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <Box className="w-4 h-4 text-indigo-400" />
              <span>إدارة المنتجات والمخزون ({products.length})</span>
            </button>

            {/* 2. Pending Orders */}
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25 font-black scale-[1.01]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>1. قيد المراجعة ({pendingOrders.length})</span>
            </button>

            {/* 3. Preparation */}
            <button
              onClick={() => setActiveTab('preparation')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'preparation'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25 font-black scale-[1.01]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <Package className="w-4 h-4 text-violet-400" />
              <span>2. قيد التحضير ({preparationOrders.length})</span>
            </button>

            {/* 4. Delivery */}
            <button
              onClick={() => setActiveTab('delivery')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'delivery'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-black scale-[1.01]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <Truck className="w-4 h-4 text-blue-400" />
              <span>3. قيد التوصيل ({deliveryOrders.length})</span>
            </button>

            {/* 5. Completed */}
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 font-black scale-[1.01]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>4. مكتملة ({completedOrders.length})</span>
            </button>

            {/* 6. Returned */}
            <button
              onClick={() => setActiveTab('returned')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'returned'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25 font-black scale-[1.01]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>5. مرتجعات ({returnedOrders.length})</span>
            </button>

            {/* 7. Financial */}
            <button
              onClick={() => setActiveTab('financial')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'financial'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 font-black scale-[1.01]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>المستحقات والمالية</span>
            </button>

            {/* 8. Couriers API */}
            <button
              onClick={() => setActiveTab('couriers')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'couriers'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/25 font-black scale-[1.01]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <Truck className="w-4 h-4 text-sky-400" />
              <span>شركات التوصيل API ({couriers.length})</span>
            </button>

            {/* 9. Analytics */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 font-black scale-[1.01]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>الإحصائيات والتحليلات</span>
            </button>

            {/* 10. Profile */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-black scale-[1.01]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <User className="w-4 h-4 text-blue-400" />
              <span>الملف الشخصي والحساب</span>
            </button>
          </div>
        </div>

        {/* Quick Search Input */}
        {activeTab !== 'products' && (
          <div className="relative min-w-[220px] shrink-0">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث باسم الزبون، الهاتف، أو ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-10 pe-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-xs"
            />
          </div>
        )}
      </div>

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
              filterBySearch(pendingOrders).map((order) => (
                <div
                  key={order.id}
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
                    </div>

                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">
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
                          <span className="text-indigo-500 font-medium text-[11px]">
                            ({item.variantSize} / {item.variantColor})
                          </span>
                        </span>
                        <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border text-[11px]">
                          × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* STEP 1 ACTIONS: Confirm Order vs Reject Order */}
                  <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        const activeCouriers = getStoredCouriers().filter((c) => !c.isDisabled);
                        if (activeCouriers.length > 0) {
                          const defaultEcom = activeCouriers.find((c) => c.id === 'cour-ecom');
                          setSelectedCourierId(defaultEcom ? defaultEcom.id : activeCouriers[0].id);
                        }
                        setConfirmingOrderModal(order);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>✅ تم التأكيد</span>
                    </button>

                    <button
                      onClick={() => {
                        setRejectingOrder(order);
                        setSelectedReason(REJECTION_REASONS[0]);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>❌ فشل التأكيد</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: قيد التحضير ==================== */}
      {activeTab === 'preparation' && (
        <div className="space-y-3">
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl text-xs text-violet-800 dark:text-violet-300 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 shrink-0 text-violet-500" />
              <span>
                الطلبات المؤكدة الجاهزة للتحضير. يمكنك تحديد طلبات متعددة أو "تحديد الكل" لطباعة ملصقات الشحن الحرارية دفعة واحدة.
              </span>
            </div>
          </div>

          {/* BATCH SELECTION & BULK ACTION TOOLBAR */}
          {filterBySearch(preparationOrders).length > 0 && (
            <div className="p-3.5 bg-white dark:bg-slate-900 border-2 border-violet-300 dark:border-violet-900/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
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
                      : 'تحديد الكل للطباعة'}
                  </span>
                </button>

                <span className="text-xs font-black text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-3 py-1.5 rounded-xl border border-violet-200 dark:border-violet-900">
                  تم تحديد {selectedPrepOrderIds.length} من أصل {filterBySearch(preparationOrders).length} طلبية
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={selectedPrepOrderIds.length === 0}
                  onClick={() => {
                    const ordersToPrint = preparationOrders.filter((o) =>
                      selectedPrepOrderIds.includes(o.id)
                    );
                    if (ordersToPrint.length === 0) {
                      onShowToast('الرجاء تحديد طلبية واحدة على الأقل للطباعة', 'info');
                      return;
                    }
                    setBulkPrintOrders(ordersToPrint);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition ${
                    selectedPrepOrderIds.length > 0
                      ? 'bg-violet-600 hover:bg-violet-500 text-white cursor-pointer ring-2 ring-violet-400'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ طباعة الملصقات المحددة ({selectedPrepOrderIds.length})</span>
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
                      ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد تجهيز المحدد ({selectedPrepOrderIds.length})</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filterBySearch(preparationOrders).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                لا توجد طلبات في مرحلة التحضير حالياً.
              </div>
            ) : (
              filterBySearch(preparationOrders).map((order) => {
                const isSentToShipping = order.deliveryCompanySent || !!order.trackingCode;
                const isLabelRetrieved = retrievedLabels[order.id] || isSentToShipping;
                const isSelected = selectedPrepOrderIds.includes(order.id);

                return (
                  <div
                    key={order.id}
                    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition space-y-3 ${
                      isSelected
                        ? 'border-2 border-violet-500 bg-violet-50/40 dark:bg-violet-950/20 shadow-md ring-1 ring-violet-400/50'
                        : 'border-violet-200/80 dark:border-violet-900/40 shadow-xs'
                    }`}
                  >
                    {/* Card Header with Checkbox */}
                    <div className="flex flex-wrap justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 gap-2">
                      <div className="flex items-center gap-2.5">
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

                        {isSentToShipping && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                            ✔ تم الرفع لمنصة الشحن
                          </span>
                        )}
                      </div>

                      <div className="text-end font-mono text-xs">
                        <span className="text-[10px] text-slate-400 block">رقم التتبع:</span>
                        <span className="font-black text-indigo-600 dark:text-indigo-400">
                          {order.trackingCode || 'بانتظار الإرسال API'}
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
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center font-bold">
                          <span>
                            • {item.productName} ({item.variantSize} / {item.variantColor})
                          </span>
                          <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">
                            × {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* STEP 2: THE 4 PREPARATION BUTTONS */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
                      {/* Button 1: Send to Shipping Platform */}
                      <button
                        onClick={() => handleSendToShippingApi(order)}
                        className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          isSentToShipping
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSentToShipping ? 'تم الإرسال لشركة الشحن' : '1. إرسال لشركة الشحن'}</span>
                      </button>

                      {/* Button 2: Retrieve Shipping Label */}
                      <button
                        onClick={() => handleRetrieveShippingLabel(order.id)}
                        className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          isLabelRetrieved
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isLabelRetrieved ? '✔ تم استرجاع الملصق' : '2. استرجاع الملصق'}</span>
                      </button>

                      {/* Button 3: Print Label */}
                      <button
                        onClick={() => setPrintingOrder(order)}
                        className="py-2 px-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>3. طباعة الملصق</span>
                      </button>

                      {/* Button 4: Mark Package Ready */}
                      <button
                        onClick={() => handleMarkPackageReady(order.id)}
                        className="py-2 px-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>4. تأكيد تجهيز الطرد</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: قيد التوصيل ==================== */}
      {activeTab === 'delivery' && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Truck className="w-4 h-4 shrink-0 text-blue-500" />
            <span>
              الطلبات المشحونة التي تم تسليمها لشركة التوصيل. يتم التتبع التلقائي عبر API وتتحدث الحالات الفنية داخلياً، بينما يرى البائع فقط "قيد التوصيل".
            </span>
          </div>

          <div className="space-y-3">
            {filterBySearch(deliveryOrders).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                لا توجد طلبات قيد التوصيل حالياً.
              </div>
            ) : (
              filterBySearch(deliveryOrders).map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/40 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-blue-600 dark:text-blue-400">#{order.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-black">
                        قيد التوصيل
                      </span>
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
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تأكيد التسليم (تم التوصيل)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: مكتمل (تم التوصيل) ==================== */}
      {activeTab === 'completed' && (
        <div className="space-y-3">
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
              <div>
                <span className="font-black block text-sm">الطلبات المكتملة (تم التوصيل بنجاح)</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  عند مزامنة وتأكيد التسليم مع API شركة التوصيل، يضاف مبلغ العمولة تلقائياً إلى محفظة البائع 💰
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filterBySearch(completedOrders).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                لا توجد طلبات مكتملة حالياً.
              </div>
            ) : (
              filterBySearch(completedOrders).map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 dark:text-white">#{order.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        تم التوصيل بنجاح 🎉
                      </span>
                    </div>

                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
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
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{order.trackingCode || 'N/A'}</span>
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

                  {/* Auto Wallet Commission Banner */}
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-black flex items-center justify-between">
                    <span>💰 ربح/عمولة البائع المضافة للمحفظة تلقائياً:</span>
                    <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                      +<MoneyText amount={order.totalProfit || 1000} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 5: مرتجع (المرتجعات) ==================== */}
      {activeTab === 'returned' && (
        <div className="space-y-3">
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 shrink-0 text-rose-500" />
              <div>
                <span className="font-black block text-sm">إدارة الطلبات المرتجعة للمستودع</span>
                <span className="text-[11px] text-rose-700 dark:text-rose-400">
                  عند وصول الطرد الجسدي إلى المخزن، يضغط مسؤل المستودع على "تم الإرجاع بالمخزن" لإعادة السلعة تلقائياً لمكانها في المخزون! 📦
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filterBySearch(returnedOrders).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                لا توجد طلبات مرتجعة حالياً.
              </div>
            ) : (
              filterBySearch(returnedOrders).map((order) => {
                const isReturnedInStock = !!order.returnedToWarehouse;
                const totalItemsQty = order.items.reduce((acc, item) => acc + item.quantity, 0);

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 shadow-xs space-y-3 text-xs"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 dark:text-white">#{order.id}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isReturnedInStock
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                          }`}
                        >
                          {isReturnedInStock ? '✔ تم الاستلام بالمخزن وتحديث المخزون' : 'بانتظار وصول الطرد للمستودع ⏳'}
                        </span>
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
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{order.trackingCode || 'N/A'}</span>
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
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-black flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
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
        const myProducts = products.filter((p) => {
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
            (p.supplierEmail && p.supplierEmail === supplierProfile.email) ||
            p.supplierName === supplierProfile.companyName ||
            p.supplierName === supplierProfile.fullName
          );
        });
        const displayedProductsList = showOnlyMyProducts ? myProducts : products;

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
                {getLowStockProducts(products).length > 0 && (
                  <button
                    onClick={() => setIsLowStockModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-200 animate-pulse" />
                    <span>تنبيهات انخفاض المخزون ({getLowStockProducts(products).length})</span>
                  </button>
                )}

                <button
                  onClick={() => setIsUrlImportModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <LinkIcon className="w-4 h-4 text-amber-300" />
                  <span>🔗 استيراد منتجات من رابط</span>
                </button>

                <button
                  onClick={handleOpenAddProduct}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منتج جديد للمخزون</span>
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
                  <span>منتجاتي الموردة ({myProducts.length})</span>
                </button>
                <button
                  onClick={() => setShowOnlyMyProducts(false)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    !showOnlyMyProducts
                      ? 'bg-indigo-600 text-white shadow-xs'
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
              {displayedProductsList.map((p) => (
                <div
                  key={p.id}
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
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
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
                      <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm">
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
                        <Edit3 className="w-3 h-3 text-indigo-500" />
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
                      <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{v.stockCount} قطعة</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        );
      })()}

      {/* ==================== TAB 7: المالية والتسويات للمورد (Financial) ==================== */}
      {activeTab === 'financial' && (() => {
        const totalSales = isDemoSupplier ? (supplierProfile.totalSalesDzd || 850000) : (supplierProfile.totalSalesDzd || 0);
        const nouvaCommission = isDemoSupplier ? (supplierProfile.nouvaCommissionDzd || 42000) : (supplierProfile.nouvaCommissionDzd || 0);
        const marketerCommissions = isDemoSupplier ? (supplierProfile.resellerCommissionsDzd || 96000) : (supplierProfile.resellerCommissionsDzd || 0);
        const totalDuesOwed = nouvaCommission + marketerCommissions;
        const paidAmount = isDemoSupplier ? (supplierProfile.paidAmountDzd || 100000) : (supplierProfile.paidAmountDzd || 0);
        const remainingUnpaid = Math.max(totalDuesOwed - paidAmount, 0);
        const lastPayment = supplierProfile.lastPaymentDate || (isDemoSupplier ? '05/08/2026' : 'لا توجد دفعات بعد');

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
            {/* Financial Rule Notice */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-indigo-50 dark:from-emerald-950/40 dark:to-indigo-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs text-slate-800 dark:text-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>القسم المالي للمورد وتسوية العمولات</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-mono">
                      COD Supplier Model
                    </span>
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    بعد توصيل الطلبيات بنجاح، يقوم المورد بتحصيل المبالغ من شركات التوصيل، ويتوجب عليه تسديد <strong>عمولة Nouva Market</strong> و <strong>عمولات المسوقين</strong> بانتظام عبر حساب البريد (CCP / BaridiMob).
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setPaymentForm((prev) => ({
                    ...prev,
                    amountDzd: remainingUnpaid > 0 ? remainingUnpaid : (isDemoSupplier ? 38000 : 0),
                  }));
                  setIsMakePaymentModalOpen(true);
                }}
                className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تسديد المستحقات (تسجيل عملية دفع)</span>
              </button>
            </div>

            {/* Financial Overview Cards - 6 Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* Card 1: Total Sales */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
                  <span>إجمالي المبيعات</span>
                  <ShoppingBag className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  <MoneyText amount={totalSales} />
                </div>
                <p className="text-[10px] text-slate-400">قيمة المبيعات المسلمة بنجاح</p>
              </div>

              {/* Card 2: Nouva Commission */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
                  <span>عمولة Nouva</span>
                  <Building2 className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  <MoneyText amount={nouvaCommission} />
                </div>
                <p className="text-[10px] text-slate-400">عمولة المنصة المستحقة</p>
              </div>

              {/* Card 3: Marketer Commissions */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
                  <span>عمولات المسوقين</span>
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  <MoneyText amount={marketerCommissions} />
                </div>
                <p className="text-[10px] text-slate-400">أرباح ومستحقات البائعين</p>
              </div>

              {/* Card 4: Total Dues */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
                  <span>مجموع العمولات</span>
                  <CreditCard className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  <MoneyText amount={totalDuesOwed} />
                </div>
                <p className="text-[10px] text-slate-400">العمولات المستحقة الكلية</p>
              </div>

              {/* Card 5: Total Paid */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
                  <span>مجموع ما دفعه المورد</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  <MoneyText amount={paidAmount} />
                </div>
                <p className="text-[10px] text-slate-400">الدفعات المحولة للمنصة</p>
              </div>

              {/* Card 6: Remaining Balance Unpaid */}
              <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-[11px] text-amber-800 dark:text-amber-300 font-bold">
                  <span>المبلغ المتبقي للدفع</span>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono">
                  <MoneyText amount={remainingUnpaid} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                  <span>آخر دفع:</span>
                  <span className="font-mono font-bold">{lastPayment}</span>
                </div>
              </div>
            </div>

            {/* Formatted Account Settlement Breakdown */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>ملخص كشف الحساب المالي والتسويات (Financial Statement Summary)</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">تفاصيل المعادلة الحسابية للعمولات المسددة والمتبقية</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl font-mono">
                    آخر دفعة: {lastPayment}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <span className="text-xs font-extrabold text-slate-500 block">1. المبيعات الإجمالية (Sales)</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                    <MoneyText amount={totalSales} />
                  </div>
                  <p className="text-[11px] text-slate-400">محصلة من طلبات الشحن والتوصيل</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <span className="text-xs font-extrabold text-slate-500 block">2. مجموع العمولات المستحقة (Fees Owed)</span>
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    <MoneyText amount={totalDuesOwed} />
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <div className="flex justify-between">
                      <span>• Nouva Commission:</span>
                      <span className="font-mono font-bold">{nouvaCommission.toLocaleString()} DA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Marketer Profits:</span>
                      <span className="font-mono font-bold">{marketerCommissions.toLocaleString()} DA</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2 md:col-span-2 lg:col-span-1">
                  <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 block">3. الحالة الحالية للتسوية</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>المبلغ المسدد سابقاً:</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{paidAmount.toLocaleString()} DA</span>
                    </div>
                    <div className="flex justify-between text-slate-900 dark:text-white font-extrabold pt-1 border-t border-emerald-200 dark:border-emerald-800">
                      <span>المبلغ المتبقي غير المدفوع:</span>
                      <span className="font-mono font-black text-amber-600 dark:text-amber-400">{remainingUnpaid.toLocaleString()} DA</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPaymentForm((prev) => ({
                        ...prev,
                        amountDzd: remainingUnpaid > 0 ? remainingUnpaid : (isDemoSupplier ? 38000 : 0),
                      }));
                      setIsMakePaymentModalOpen(true);
                    }}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>تسديد المبلغ المتبقي الآن</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Transactions & Settlements Log */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>سجل جميع عمليات الدفع والمعاملات (Payment Transactions History)</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">سجل العمليات والدفعات المسددة من المورد بقيمها وتواريخها</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="بحث بالرقم المرجعي..."
                      value={settlementSearchTerm}
                      onChange={(e) => setSettlementSearchTerm(e.target.value)}
                      className="w-full pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  <select
                    value={settlementFilterStatus}
                    onChange={(e) => setSettlementFilterStatus(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shrink-0"
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="COMPLETED">✔ المكتملة</option>
                    <option value="PENDING">⏳ قيد المعالجة</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold pb-2">
                      <th className="py-2.5 px-3">معرف العملية</th>
                      <th className="py-2.5 px-3">تاريخ الدفع</th>
                      <th className="py-2.5 px-3">طريقة التحويل</th>
                      <th className="py-2.5 px-3">المبلغ الذي دفعه المورد</th>
                      <th className="py-2.5 px-3">الرقم المرجعي / الوصل</th>
                      <th className="py-2.5 px-3">ملاحظات</th>
                      <th className="py-2.5 px-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-800 dark:text-slate-200">
                    {filteredSettlements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          لا توجد معاملة تسوية سابقة مطابقة للبحث.
                        </td>
                      </tr>
                    ) : (
                      filteredSettlements.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono font-black text-indigo-600 dark:text-indigo-400">
                            {st.id}
                          </td>
                          <td className="py-3 px-3 font-mono">{st.date}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold text-[11px]">
                              {st.payoutMethod || st.method || 'BaridiMob'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            <MoneyText amount={st.amountDzd || 0} />
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                            {st.referenceNumber || st.accountDetails || 'BM-REF'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[200px] truncate">
                            {st.notes || st.referenceNote || 'تسديد مستحقات'}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                                st.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {st.status === 'COMPLETED' ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>تم الدفع والاعتماد</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>قيد التدقيق</span>
                                </>
                              )}
                            </span>
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

      {/* ==================== TAB: تتبع الشحنة المباشر (Shipment Tracking) ==================== */}
      {activeTab === 'tracking' && (
        <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
          <ShipmentTrackingTool
            isDarkTheme={true}
            onShowNotice={(msg) => onShowToast(msg, 'success')}
          />
        </div>
      )}

      {/* ==================== TAB: شركات التوصيل API (Couriers API) ==================== */}
      {activeTab === 'couriers' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Notice */}
          <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50 to-slate-50 dark:from-sky-950/40 dark:via-indigo-950/40 dark:to-slate-900 border border-sky-200 dark:border-sky-800/60 rounded-3xl text-xs text-slate-800 dark:text-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-sky-600 text-white rounded-2xl shrink-0 mt-0.5 shadow-md">
                <Truck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>إدارة منصات وربط شركات التوصيل (Delivery Companies API Integrations)</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 text-[10px] font-extrabold font-mono">
                    حساب المورد كلياً
                  </span>
                </h4>
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed max-w-3xl">
                  المورد يتحكم كلياً في شركة التوصيل الخاصة به: ربط وإدخال مفاتيح الـ API (Yalidine Express, Maystro, ZR Express, Ecom Delivery, EcoTrack, Nord&Sud)، متابعة حالة الإتصال، تحديد أسعار الشحن والتغطية بالولايات، وتفعيل أو تعطيل التوصيل.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddingCourierModalOpen(true)}
              className="w-full md:w-auto px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة شركة توصيل جديدة</span>
            </button>
          </div>

          {/* Courier List */}
          <div className="space-y-3">
            {couriers.map((c) => (
              <div
                key={c.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-xs space-y-4 text-xs transition ${
                  c.isDisabled
                    ? 'border-amber-300 dark:border-amber-800/60 bg-amber-500/5 opacity-80'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-2xl ${
                        c.isDisabled
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400'
                          : 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400'
                      }`}
                    >
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{c.name}</span>
                        {c.isDisabled ? (
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-[10px]">
                            🚫 معطلة (موقوفة)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-[10px]">
                            ✓ مفعّلة وشغالة
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        <span>سعر الشحن الأساسي: <strong className="text-slate-800 dark:text-slate-200 font-mono">{c.baseShippingFee} د.ج</strong></span>
                        <span>•</span>
                        <span>التغطية: <strong className="text-slate-800 dark:text-slate-200 font-mono">{c.supportedWilayasCount} ولاية</strong></span>
                        <span>•</span>
                        <span>سرعة التوصيل: <strong className="text-slate-800 dark:text-slate-200">{c.avgDeliveryDays}</strong></span>
                      </div>
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
                                  connectionStatus:
                                    x.connectionStatus === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED',
                                }
                              : x
                          )
                        );
                        onShowToast('تم تحديث حالة اتصال الـ API لشركة التوصيل!');
                      }}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-black cursor-pointer transition ${
                        c.connectionStatus === 'CONNECTED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200'
                      }`}
                    >
                      {c.connectionStatus === 'CONNECTED' ? '● API متصل وشغال' : '○ غير متصل'}
                    </button>

                    {/* Disable / Enable Button */}
                    <button
                      onClick={() => handleToggleDisableCourier(c.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        c.isDisabled
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
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
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="حذف شركة التوصيل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-bold">API Key (مفتاح الربط الخاص بالمورد):</label>
                    <input
                      type="text"
                      disabled={c.isDisabled}
                      value={c.apiKey}
                      onChange={(e) =>
                        setCouriers((prev) =>
                          prev.map((x) => (x.id === c.id ? { ...x, apiKey: e.target.value } : x))
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white font-bold disabled:opacity-50"
                      placeholder="أدخل API Key..."
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-bold">API Secret / Token:</label>
                    <input
                      type="text"
                      disabled={c.isDisabled}
                      value={c.apiSecret}
                      onChange={(e) =>
                        setCouriers((prev) =>
                          prev.map((x) => (x.id === c.id ? { ...x, apiSecret: e.target.value } : x))
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white font-bold disabled:opacity-50"
                      placeholder="أدخل Token Secret..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            .reduce((acc, o) => acc + (o.totalAmount || 0), 0) || (isDemoSupplier ? (supplierProfile.totalSalesDzd || 1850000) : 0);

        const deliveryRate = totalOrdersCount > 0 ? Math.round((deliveredOrdersCount / totalOrdersCount) * 100) : isDemoSupplier ? 88 : 0;
        const returnRate = totalOrdersCount > 0 ? Math.round((returnedOrdersCount / totalOrdersCount) * 100) : isDemoSupplier ? 7 : 0;

        // Active resellers count
        const activeResellersSet = new Set(
          orders.map((o) => o.resellerId || o.sellerStoreName || o.customerName || 'مسوق').filter(Boolean)
        );
        const activeResellersCount = isDemoSupplier ? Math.max(activeResellersSet.size, 14) : activeResellersSet.size;

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
        const todaySales = todayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0) || (isDemoSupplier ? 45000 : 0);

        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weeklyOrders = orders.filter((o) => new Date(o.createdAt || Date.now()) >= sevenDaysAgo);
        const weeklySales = weeklyOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0) || (isDemoSupplier ? 380000 : 0);

        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const monthlyOrders = orders.filter((o) => new Date(o.createdAt || Date.now()) >= thirtyDaysAgo);
        const monthlySales = monthlyOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0) || (isDemoSupplier ? 1850000 : 0);

        // 3. Product Analytics Matrix
        const productStatsMap = products.map((p) => {
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
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>
                <strong>مركز تحليلات وإحصائيات المورد (Supplier Intelligence Hub):</strong> رصد المبيعات، معدلات التسليم، أداء المنتجات، والمسوقين الأكثر نشاطاً في منصة Nouva Market.
              </span>
            </div>

            {/* ---------------- SECTION 1: MAIN KPI CARDS (8 CARDS) ---------------- */}
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
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
                  <div className="flex justify-between items-center text-emerald-500">
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 block">الطلبات المسلمة</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">✅ {deliveredOrdersCount}</div>
                  <span className="text-[9px] text-emerald-500/80 block font-bold">تم الاستلام بنجاح</span>
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
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 block">إجمالي المبيعات</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono truncate">
                    <MoneyText amount={totalSalesRevenueDzd} />
                  </div>
                  <span className="text-[9px] text-emerald-500 block font-bold">صافي مستحقات المورد</span>
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
                  <div className="flex justify-between items-center text-indigo-500">
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block">المسوقون النشطون</span>
                    <Users className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">👥 {activeResellersCount}</div>
                  <span className="text-[9px] text-indigo-400 block font-bold">باعوا منتجاتك</span>
                </div>
              </div>
            </div>

            {/* ---------------- SECTION 2: SALES ANALYTICS (إحصائيات المبيعات) ---------------- */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>إحصائيات المبيعات والأداء المالي (Sales Analytics)</span>
                  </h3>
                  <p className="text-xs text-slate-500">تتبع حجم المبيعات اليومية، الأسبوعية، والشهرية، ومتوسطات الطلبات</p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-xs font-black self-start sm:self-auto">
                  إجمالي الوحدات المباعة: {totalUnitsSold} قطعة 📦
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Daily Sales Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      المبيعات اليومية (Daily)
                    </span>
                    <span className="text-[10px] text-emerald-600 font-mono font-black">{todayOrders.length} طلبات</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    <MoneyText amount={todaySales} />
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[65%]" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">مبيعات اليوم المسجلة بالنظام</p>
                </div>

                {/* Weekly Sales Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      المبيعات الأسبوعية (7 أيام)
                    </span>
                    <span className="text-[10px] text-indigo-600 font-mono font-black">{isDemoSupplier ? (weeklyOrders.length || 24) : weeklyOrders.length} طلبات</span>
                  </div>
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    <MoneyText amount={weeklySales} />
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[80%]" />
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
                    <span className="text-[10px] text-violet-600 font-mono font-black">{isDemoSupplier ? (monthlyOrders.length || 95) : monthlyOrders.length} طلبات</span>
                  </div>
                  <div className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">
                    <MoneyText amount={monthlySales} />
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-violet-500 h-full w-[92%]" />
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
                    <Package className="w-4 h-4 text-indigo-600" />
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
                          ? 'bg-indigo-600 text-white font-black shadow-xs'
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
                          ? 'bg-emerald-600 text-white font-black shadow-xs'
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
                      filteredProductStats.map((item) => (
                        <tr key={item.product.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
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
                                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-black flex items-center gap-0.5">
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
                          <td className="py-3 px-3 font-mono font-black text-indigo-600 dark:text-indigo-400">
                            📦 {item.ordersCount}
                          </td>

                          {/* Units Sold */}
                          <td className="py-3 px-3 font-mono font-black text-amber-600 dark:text-amber-400">
                            {item.unitsSold} قطعة
                          </td>

                          {/* Delivery Rate */}
                          <td className="py-3 px-3">
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
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
                          <td className="py-3 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
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
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
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
                  <User className="w-5 h-5 text-indigo-600" />
                  <span>معلومات الملف الشخصي للمورد والمستودع</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">قم بتحديث بيانات الاتصال وتفاصيل المستودع</p>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
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
        </div>
      )}

      {/* CONFIRMATION & COURIER API SELECTION MODAL */}
      {confirmingOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
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
                <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
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
                  className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-indigo-500 text-slate-900 dark:text-white font-extrabold text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {getStoredCouriers()
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
                  getStoredCouriers().find((c) => c.id === selectedCourierId) ||
                  getStoredCouriers()[0];
                return (
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                    <div className="flex justify-between items-center font-extrabold text-indigo-900 dark:text-indigo-200 text-xs">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-indigo-500" />
                        <span>{currentCourier.name}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black">
                        ● API متصل وشغال
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-700 dark:text-slate-300 pt-1 border-t border-indigo-200/50 dark:border-indigo-900/50 font-mono">
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

              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
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
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer"
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
                <span className="font-black text-sm tracking-wider text-indigo-700">
                  {printingOrder.deliveryCompanyName || 'Ecom Delivery (إيكوم)'}
                </span>
                <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                  {printingOrder.deliveryType === 'home' ? 'LIVRAISON À DOMICILE' : 'STOPDESK'}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 font-mono tracking-wider">
                {printingOrder.wilaya.toUpperCase()}
              </h2>
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
                <span className="text-lg text-emerald-400 font-mono">
                  {printingOrder.totalAmount + printingOrder.shippingFee} DZD
                </span>
              </div>
            </div>

            {/* Print Action */}
            <div className="pt-2">
              <button
                onClick={() => {
                  window.print();
                  onShowToast('✔ تم إرسال الملصق للطباعة الحرارية!');
                }}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الملصق الآن</span>
              </button>
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
                  key={ord.id}
                  className="border-2 border-slate-900 rounded-2xl p-4 bg-white space-y-4 print:rounded-none print:border-2 print:border-black print:mb-6 print:break-after-page"
                >
                  {/* Label Header */}
                  <div className="border-b-2 border-slate-900 pb-2 text-center space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs tracking-wider text-indigo-700">
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
                      <span className="text-base text-emerald-400 font-mono">
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

      {/* SUPPLIER MAKE PAYMENT MODAL */}
      {isMakePaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  تسديد مستحقات Nouva والمسوقين
                </h3>
              </div>
              <button
                onClick={() => setIsMakePaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              أدخل تفاصيل دفعة تحويل العمولات عبر البريد (BaridiMob / CCP) لتحديث حسابك وإلغاء المتبقي.
            </p>

            <form onSubmit={handlePerformSupplierPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المبلغ المدفوع (DZD) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentForm.amountDzd}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amountDzd: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-black text-sm text-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    طريقة الدفع *
                  </label>
                  <select
                    value={paymentForm.payoutMethod}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        payoutMethod: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="BARIDIMOB">BaridiMob 📱</option>
                    <option value="CCP">حساب CCP 📮</option>
                    <option value="BANK">تحويل بنكي 🏛️</option>
                    <option value="CASH">دفع نقداً 💵</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الرقم المرجعي (Ref/RIP) *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.referenceNumber}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تأكيد الحساب / رقم الوصل
                </label>
                <input
                  type="text"
                  value={paymentForm.accountDetails}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, accountDetails: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات الدفعة
                </label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  placeholder="ملاحظات توضيحية عن الدفعة..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMakePaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد وتسجيل الدفع</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD COURIER */}
      {isAddingCourierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex justify-center items-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-600" />
                <span>إضافة وتوصيل شركة توصيل جديدة (API)</span>
              </h3>
              <button
                onClick={() => setIsAddingCourierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCourierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">اسم شركة التوصيل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: Nord & Sud Express"
                  value={newCourierForm.name}
                  onChange={(e) => setNewCourierForm({ ...newCourierForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">API Key</label>
                  <input
                    type="text"
                    value={newCourierForm.apiKey}
                    onChange={(e) => setNewCourierForm({ ...newCourierForm, apiKey: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">API Secret</label>
                  <input
                    type="text"
                    value={newCourierForm.apiSecret}
                    onChange={(e) => setNewCourierForm({ ...newCourierForm, apiSecret: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">سعر الشحن الأساسي (DA)</label>
                  <input
                    type="number"
                    value={newCourierForm.baseShippingFee}
                    onChange={(e) => setNewCourierForm({ ...newCourierForm, baseShippingFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">عدد الولايات المغطاة</label>
                  <input
                    type="number"
                    value={newCourierForm.supportedWilayasCount}
                    onChange={(e) => setNewCourierForm({ ...newCourierForm, supportedWilayasCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingCourierModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs cursor-pointer transition shadow-md"
                >
                  حفظ وتفعيل API
                </button>
              </div>
            </form>
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
    </div>
  );
}
