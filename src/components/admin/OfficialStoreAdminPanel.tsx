import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Sparkles,
  Save,
  CheckCircle2,
  ExternalLink,
  Phone,
  MessageCircle,
  Truck,
  Globe,
  Sliders,
  Percent,
  Layers,
  Eye,
  EyeOff,
  ShoppingBag,
  Zap,
  Info,
  Palette,
  ShieldCheck,
  Package,
  Activity,
  Terminal,
  RefreshCw,
  Trash2,
  Radio,
  Clock,
  UserCheck,
  CheckCheck,
  Search,
  Lock,
  Smartphone,
  Copy,
  AlertCircle,
  Printer,
  RotateCcw,
  Box,
  Send,
  FileText,
  CheckSquare,
  Undo2,
  PackageCheck,
  Boxes,
  MapPin,
  X,
  TrendingUp,
  BarChart3,
  DollarSign,
  Gift,
  Award,
  ChevronDown,
  ArrowUpRight,
  Filter,
  Check,
  Share2,
  Calendar
} from 'lucide-react';
import {
  OfficialStoreSettings,
  getOfficialStoreSettings,
  saveOfficialStoreSettings,
} from '../../lib/officialStoreConfig';
import { Product, Order, OrderStatus } from '../../types';
import { useOrders } from '../../context/OrderContext';
import { INITIAL_COURIERS, CourierPartner } from '../../lib/courierHelper';
import { saveStoredProducts } from '../../data/mockProducts';
import { OfficialStoreBordereauModal } from './OfficialStoreBordereauModal';
import { OfficialStoreProductParamsModal } from './OfficialStoreProductParamsModal';
import { OfficialStorePixelTrackingCard } from './OfficialStorePixelTrackingCard';
import { ChangeStoreBannerModal } from '../store/ChangeStoreBannerModal';

interface OfficialStoreAdminPanelProps {
  products: Product[];
  onSaveProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string, permanently?: boolean) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type OfficialSubTab = 'analytics' | 'orders_pipeline' | 'products' | 'settings';
type PipelineStage = 'ALL' | 'PENDING' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'RETOUR';

export function OfficialStoreAdminPanel({
  products,
  onSaveProduct,
  onDeleteProduct,
  onShowToast,
}: OfficialStoreAdminPanelProps) {
  const { orders, confirmAdminOrder, updateOrder, updateOrderStatus } = useOrders();
  const [settings, setSettings] = useState<OfficialStoreSettings>(getOfficialStoreSettings);
  const [showAdminBannerModal, setShowAdminBannerModal] = useState(false);

  // 4 Consolidated Subtabs as requested
  const [activeSubTab, setActiveSubTab] = useState<OfficialSubTab>('analytics');

  // Search & Filters
  const [searchProduct, setSearchProduct] = useState('');
  const [productFilter, setProductFilter] = useState<'all' | 'enabled' | 'disabled' | 'featured'>('all');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Modals state
  const [selectedProductForParams, setSelectedProductForParams] = useState<Product | null>(null);
  const [selectedOrderForBordereau, setSelectedOrderForBordereau] = useState<Order | null>(null);
  const [selectedOrderForRetour, setSelectedOrderForRetour] = useState<Order | null>(null);

  // Pipeline Filter & Search
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('ALL');
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [pipelineCourierFilter, setPipelineCourierFilter] = useState('ALL');

  // Settings Active Section
  const [settingsSection, setSettingsSection] = useState<'pixels' | 'branding' | 'domain' | 'commissions'>('commissions');

  // Retour dialog state
  const [retourReason, setRetourReason] = useState<string>('لم يرد الزبون على الهاتف (Injoignable)');
  const [retourCondition, setRetourCondition] = useState<'INTACT_RESTOCKED' | 'DAMAGED' | 'OPENED_INSPECTED'>('INTACT_RESTOCKED');
  const [retourNotes, setRetourNotes] = useState<string>('');


  // Date Filter State for KPIs & Orders
  // Options: 'today' (اليوم), 'all' (الكل), 'week' (الأسبوع), 'month' (الشهر), 'custom' (تحديد تاريخ معين من - الى)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-10-11');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-10-11');

  // Filter official store orders
  const rawOfficialOrders = useMemo(() => {
    return orders.filter(
      (o) => o.source === 'official_store' || o.resellerName?.includes('المتجر الرسمي')
    );
  }, [orders]);

  // Apply Date Filtering to officialOrders
  const officialOrders = useMemo(() => {
    if (dateFilter === 'all') return rawOfficialOrders;

    const todayStr = '2026-10-11';
    const todayDate = new Date('2026-10-11T23:59:59Z');

    return rawOfficialOrders.filter((o) => {
      if (!o.createdAt) return false;
      const orderDateStr = o.createdAt.split('T')[0];
      const orderDate = new Date(o.createdAt);

      if (dateFilter === 'today') {
        return orderDateStr === todayStr || o.createdAt.startsWith('2026-10-11');
      }

      if (dateFilter === 'week') {
        const weekAgo = new Date('2026-10-04T00:00:00Z');
        return orderDate >= weekAgo && orderDate <= todayDate;
      }

      if (dateFilter === 'month') {
        const monthAgo = new Date('2026-09-11T00:00:00Z');
        return orderDate >= monthAgo && orderDate <= todayDate;
      }

      if (dateFilter === 'custom') {
        if (!customStartDate && !customEndDate) return true;
        if (customStartDate && orderDateStr < customStartDate) return false;
        if (customEndDate && orderDateStr > customEndDate) return false;
        return true;
      }

      return true;
    });
  }, [rawOfficialOrders, dateFilter, customStartDate, customEndDate]);

  // Statistics & Financial KPIs
  const confirmerFeeUnit = settings.confirmerFeePerDeliveredOrder ?? 150;
  const officialOrdersCount = officialOrders.length;
  const officialRevenue = officialOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Delivered stats
  const deliveredOrders = officialOrders.filter((o) => o.status === 'DELIVERED');
  const deliveredCount = deliveredOrders.length;
  const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const deliverySuccessRate = officialOrdersCount > 0 ? Math.round((deliveredCount / officialOrdersCount) * 100) : 0;

  // Confirmer Commissions: deducted from official store revenues on each delivered order
  const totalConfirmerDues = deliveredCount * confirmerFeeUnit;

  // Wholesale cost of delivered goods
  const wholesaleCostDelivered = deliveredOrders.reduce((sum, o) => {
    return sum + (o.items?.reduce((itemSum, item) => itemSum + ((item.wholesalePrice || (item.unitPrice ? item.unitPrice * 0.6 : 1500)) * (item.quantity || 1)), 0) || 0);
  }, 0);

  // Platform Net Profit = Delivered Revenue - Wholesale Cost - Confirmer Dues
  const platformNetProfit = Math.max(0, deliveredRevenue - wholesaleCostDelivered - totalConfirmerDues);

  // Pipeline stage counts
  const pendingOrders = officialOrders.filter((o) => !o.adminConfirmed && o.status === 'PENDING');
  const preparingOrders = officialOrders.filter(
    (o) =>
      (o.adminConfirmed || o.status === 'CONFIRMED' || o.status === 'PROCESSING') &&
      o.packagingStatus !== 'DISPATCHED' &&
      o.status !== 'SHIPPED' &&
      o.status !== 'DELIVERED' &&
      o.status !== 'FAILED' &&
      o.status !== 'CANCELLED'
  );
  const shippedOrders = officialOrders.filter(
    (o) => (o.status === 'SHIPPED' || o.packagingStatus === 'DISPATCHED') && o.status !== 'DELIVERED' && o.status !== 'FAILED'
  );
  const retourOrders = officialOrders.filter(
    (o) => o.status === 'FAILED' || o.situation === 'Retour' || o.packagingStatus === 'RETURN_RECEIVED' || o.returnedToWarehouse
  );

  const retourRate = officialOrdersCount > 0 ? Math.round((retourOrders.length / officialOrdersCount) * 100) : 0;
  const avgOrderValue = officialOrdersCount > 0 ? Math.round(officialRevenue / officialOrdersCount) : 0;

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getOfficialStoreSettings());
    };
    window.addEventListener('official_store_settings_updated', handleUpdate);
    return () => window.removeEventListener('official_store_settings_updated', handleUpdate);
  }, []);


  const handleSave = () => {
    saveOfficialStoreSettings(settings);
    setIsSavedRecently(true);
    onShowToast('✔ تم حفظ إعدادات وتخصيصات المتجر والبيكسل وعمولات المؤكدين بنجاح!', 'success');
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  // 1-Click Pipeline Actions
  const handleAdminConfirm = async (order: Order) => {
    confirmAdminOrder(order.id);
    await updateOrder(order.id, {
      status: 'CONFIRMED' as OrderStatus,
      situation: 'Confirmé',
      packagingStatus: 'PACKAGING',
    });
    onShowToast(`🛡️ تم تأكيد الطلبية #${order.trackingCode || order.id} وانتقالها لمرحلة قيد التحضير والتغليف!`, 'success');
  };

  const handleCancelOrder = async (order: Order, reason = 'إلغاء بناء على طلب الزبون') => {
    await updateOrder(order.id, {
      status: 'CANCELLED' as OrderStatus,
      situation: 'Annulé',
      cancelReason: reason,
    });
    onShowToast(`🚫 تم إلغاء الطلبية #${order.id}`, 'info');
  };

  const handleAssignCourierAndUpload = async (order: Order, courierId: string) => {
    const found = INITIAL_COURIERS.find((c) => c.id === courierId) || INITIAL_COURIERS[0];
    const courierPrefix = (found.id.split('-')[1] || 'YAL').toUpperCase();
    const generatedTracking =
      order.trackingCode ||
      `${courierPrefix}-${order.wilayaCode || '16'}-${order.id.replace(/\D/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000)}`;

    await updateOrder(order.id, {
      courierPartnerId: found.id,
      deliveryCompanyName: found.name,
      trackingCode: generatedTracking,
      packagingStatus: 'PACKAGING',
      bordereauUrl: `/api/delivery/label/${order.id}?tracking=${generatedTracking}`,
      situation: 'TéléverséAPI',
    });

    onShowToast(`🚀 تم رفع الطلبية بنجاح إلى شركة ${found.name} وتوليد رمز التتبع #${generatedTracking}!`, 'success');
  };

  const handleCompletePackaging = async (order: Order) => {
    await updateOrder(order.id, {
      packagingStatus: 'PACKAGED',
      packagedAt: new Date().toISOString(),
      situation: 'EmballéPrêt',
    });
    onShowToast(`🏷️ تم الانتهاء من التغليف بنجاح! الطرد جاهز للتسليم للناقل وطباعة البوردورو`, 'success');
  };

  const handleDispatchToCourier = async (order: Order) => {
    const assignedCourier = order.deliveryCompanyName || settings.defaultCourierName || 'Yalidine Express';
    const assignedTracking =
      order.trackingCode ||
      `NV-YAL-${order.id.replace(/\D/g, '').slice(-6) || '202688'}`;

    await updateOrder(order.id, {
      packagingStatus: 'DISPATCHED',
      status: 'SHIPPED' as OrderStatus,
      situation: 'EnTransit',
      dispatchedAt: new Date().toISOString(),
      deliveryCompanySent: true,
      trackingCode: assignedTracking,
    });
    onShowToast(`🚀 تم تسليم الطرد #${assignedTracking} لشركة التوصيل (${assignedCourier}) وتحديث الحالة إلى "قيد الشحن والتوزيع"!`, 'success');
  };

  const handleMarkDelivered = async (order: Order) => {
    await updateOrder(order.id, {
      status: 'DELIVERED' as OrderStatus,
      situation: 'Livré',
      deliveredAt: new Date().toISOString(),
      packagingStatus: 'DISPATCHED',
    });
    onShowToast(`🎉 تم تأكيد تسليم الطلبية بنجاح! تم احتساب مستحقات المؤكد (${confirmerFeeUnit} دج) وصافي ربح المتجر.`, 'success');
  };

  const handleOpenRetourModal = (order: Order) => {
    setSelectedOrderForRetour(order);
    setRetourReason('لم يرد الزبون على الهاتف (Injoignable)');
    setRetourCondition('INTACT_RESTOCKED');
    setRetourNotes('');
  };

  const handleConfirmRetour = async () => {
    if (!selectedOrderForRetour) return;

    // If intact, automatically restock items into product inventory!
    if (retourCondition === 'INTACT_RESTOCKED') {
      const currentProducts = [...products];
      let hasUpdatedStock = false;

      for (const item of selectedOrderForRetour.items || []) {
        const prodIndex = currentProducts.findIndex((p) => p.id === item.productId);
        if (prodIndex !== -1) {
          const prod = { ...currentProducts[prodIndex] };
          const variantIndex = prod.variants?.findIndex(
            (v) =>
              (v.color === item.variantColor || (!item.variantColor && v.color === 'Standard')) &&
              (v.size === item.variantSize || (!item.variantSize && v.size === 'Standard'))
          );
          if (variantIndex !== undefined && variantIndex !== -1 && prod.variants) {
            const updatedVariants = [...prod.variants];
            updatedVariants[variantIndex] = {
              ...updatedVariants[variantIndex],
              stockCount: (updatedVariants[variantIndex].stockCount || 0) + (item.quantity || 1),
            };
            prod.variants = updatedVariants;
            currentProducts[prodIndex] = prod;
            hasUpdatedStock = true;
            if (onSaveProduct) {
              onSaveProduct(prod);
            }
          }
        }
      }

      if (hasUpdatedStock) {
        saveStoredProducts(currentProducts);
      }
    }

    await updateOrder(selectedOrderForRetour.id, {
      packagingStatus: 'RETURN_RECEIVED',
      status: 'FAILED' as OrderStatus,
      situation: 'Retour',
      returnedToWarehouse: true,
      returnReason: retourReason,
      returnCondition: retourCondition,
      returnedAt: new Date().toISOString(),
      returnRestocked: retourCondition === 'INTACT_RESTOCKED',
      returnNotes: retourNotes,
    });

    onShowToast(`↩️ تم استقبال الطرد المرتجع بنجاح وتوثيقه ${retourCondition === 'INTACT_RESTOCKED' ? 'وإعادة الكميات للمخزون تلقائياً' : ''}!`, 'success');
    setSelectedOrderForRetour(null);
  };

  // Filtered Orders for the Unified Pipeline
  const filteredPipelineOrders = useMemo(() => {
    return officialOrders.filter((o) => {
      // Stage Filter
      if (pipelineStage === 'PENDING' && (o.adminConfirmed || o.status !== 'PENDING')) return false;
      if (pipelineStage === 'PREPARING') {
        const isPrep =
          (o.adminConfirmed || o.status === 'CONFIRMED' || o.status === 'PROCESSING') &&
          o.packagingStatus !== 'DISPATCHED' &&
          o.status !== 'SHIPPED' &&
          o.status !== 'DELIVERED' &&
          o.status !== 'FAILED' &&
          o.status !== 'CANCELLED';
        if (!isPrep) return false;
      }
      if (pipelineStage === 'SHIPPED') {
        const isShip = (o.status === 'SHIPPED' || o.packagingStatus === 'DISPATCHED') && o.status !== 'DELIVERED' && o.status !== 'FAILED';
        if (!isShip) return false;
      }
      if (pipelineStage === 'DELIVERED' && o.status !== 'DELIVERED') return false;
      if (pipelineStage === 'RETOUR') {
        const isRet = o.status === 'FAILED' || o.situation === 'Retour' || o.packagingStatus === 'RETURN_RECEIVED' || o.returnedToWarehouse;
        if (!isRet) return false;
      }

      // Courier Filter
      if (pipelineCourierFilter !== 'ALL' && o.courierPartnerId !== pipelineCourierFilter && o.deliveryCompanyName !== pipelineCourierFilter) {
        return false;
      }

      // Search
      if (pipelineSearch.trim()) {
        const q = pipelineSearch.toLowerCase();
        const matchName = o.customerName?.toLowerCase().includes(q);
        const matchPhone = o.phone?.includes(q);
        const matchTrack = o.trackingCode?.toLowerCase().includes(q);
        const matchId = o.id?.toLowerCase().includes(q);
        const matchWilaya = o.wilaya?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchTrack && !matchId && !matchWilaya) return false;
      }

      return true;
    });
  }, [officialOrders, pipelineStage, pipelineCourierFilter, pipelineSearch]);

  // Filtered Products for Products Tab
  const filteredProductsList = useMemo(() => {
    return products.filter((p) => {
      if (productFilter === 'enabled' && p.isOfficialStoreEnabled === false) return false;
      if (productFilter === 'disabled' && p.isOfficialStoreEnabled !== false) return false;
      if (productFilter === 'featured' && !p.isOfficialStoreFeatured) return false;

      if (searchProduct.trim()) {
        const q = searchProduct.toLowerCase();
        const matchName = p.nameAr?.toLowerCase().includes(q);
        const matchDesc = p.descriptionAr?.toLowerCase().includes(q);
        const matchCat = p.categoryAr?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [products, productFilter, searchProduct]);

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      {/* 1. Header Banner & Quick Actions */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                المتجر الرسمي
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black">
                معتمد
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              إدارة المتجر والمبيعات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => window.open('/store', '_blank')}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
            title="معاينة المتجر"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>معاينة المتجر</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-emerald-900 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            {isSavedRecently ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSavedRecently ? 'تم الحفظ' : 'حفظ'}</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-tabs Selector (Simplified concise labels) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveSubTab('analytics')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>الإحصائيات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('orders_pipeline')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
            activeSubTab === 'orders_pipeline'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>الطلبيات</span>
          {pendingOrders.length > 0 && (
            <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
              {pendingOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('products')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'products'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>المنتجات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('settings')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>الإعدادات</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ANALYTICS & ALL STORE KPIS (صفحة الإحصائيات مع جميع مؤشرات الأداء)
      ========================================================================= */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          {/* Date Filter Bar for KPIs */}
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  تصفية التاريخ:
                </span>
                <span className="text-[11px] text-slate-400">
                  اليوم: 2026-10-11
                </span>
              </div>
            </div>

            {/* Quick Filter Buttons & Custom Range */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  dateFilter === 'today'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>اليوم</span>
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  dateFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>الكل</span>
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  dateFilter === 'week'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>الأسبوع</span>
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  dateFilter === 'month'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>الشهر</span>
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  dateFilter === 'custom'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>مخصص</span>
              </button>
            </div>
          </div>

          {/* Custom Date Range Selector (shows when custom is active) */}
          {dateFilter === 'custom' && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 animate-fadeIn">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  النطاق:
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[11px]">من:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 dark:text-white outline-none cursor-pointer text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[11px]">إلى:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 dark:text-white outline-none cursor-pointer text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('2026-10-11');
                    setCustomEndDate('2026-10-11');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-[11px] hover:bg-amber-400 transition"
                >
                  اليوم
                </button>
              </div>
            </div>
          )}

          {/* Main KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>المبيعات</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {officialRevenue.toLocaleString()} <span className="text-xs text-slate-400">دج</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-bold">
                {officialOrdersCount} طلبية
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-xs space-y-1 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/20">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                <span>صافي الأرباح</span>
                <Percent className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-black text-emerald-600">
                +{platformNetProfit.toLocaleString()} <span className="text-xs text-emerald-700">دج</span>
              </div>
              <div className="text-[10px] text-slate-500">
                الربح الصافي
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-blue-600 text-xs font-bold">
                <span>المسلّمة</span>
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-black text-blue-600">
                {deliveredCount}
              </div>
              <div className="text-[10px] text-blue-700 font-bold">
                النجاح: {deliverySuccessRate}%
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-purple-600 text-xs font-bold">
                <span>مستحقات التأكيد</span>
                <UserCheck className="w-4 h-4 text-purple-500" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-black text-purple-600">
                {totalConfirmerDues.toLocaleString()} <span className="text-xs text-purple-500">دج</span>
              </div>
              <div className="text-[10px] text-purple-700 font-bold">
                {confirmerFeeUnit} دج / طلب
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>تكلفة المورد</span>
                <Boxes className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-black text-slate-800 dark:text-slate-200">
                {wholesaleCostDelivered.toLocaleString()} <span className="text-xs text-slate-400">دج</span>
              </div>
              <div className="text-[10px] text-slate-500">
                سعر الجملة
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-red-600 text-xs font-bold">
                <span>نسبة المرتجع</span>
                <RotateCcw className="w-4 h-4 text-red-500" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-black text-red-600">
                {retourRate}%
              </div>
              <div className="text-[10px] text-red-700 font-bold">
                {retourOrders.length} مرتجع
              </div>
            </div>
          </div>

          {/* Operational Performance & Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Pipeline Funnel */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>مسار الطلبيات</span>
                </h3>
                <span className="text-[11px] text-slate-400">تحديث لحظي</span>
              </div>

              <div className="space-y-2.5 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-amber-600">قيد التأكيد:</span>
                    <span className="font-mono">{pendingOrders.length} طلبية</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${officialOrdersCount > 0 ? (pendingOrders.length / officialOrdersCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-blue-600">قيد التحضير:</span>
                    <span className="font-mono">{preparingOrders.length} طلبية</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${officialOrdersCount > 0 ? (preparingOrders.length / officialOrdersCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-indigo-600">قيد الشحن:</span>
                    <span className="font-mono">{shippedOrders.length} طلبية</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${officialOrdersCount > 0 ? (shippedOrders.length / officialOrdersCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-600">تم التسليم:</span>
                    <span className="font-mono">{deliveredCount} طلبية</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${officialOrdersCount > 0 ? (deliveredCount / officialOrdersCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-red-600">المرتجعات:</span>
                    <span className="font-mono">{retourOrders.length} طلبية</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${officialOrdersCount > 0 ? (retourOrders.length / officialOrdersCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Couriers Performance */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>شركات التوصيل</span>
              </h3>

              <div className="space-y-2 pt-1">
                {INITIAL_COURIERS.slice(0, 4).map((c) => {
                  const courierOrders = officialOrders.filter(
                    (o) => o.courierPartnerId === c.id || o.deliveryCompanyName?.includes(c.name)
                  );
                  const courierDelivered = courierOrders.filter((o) => o.status === 'DELIVERED').length;
                  const rate = courierOrders.length > 0 ? Math.round((courierDelivered / courierOrders.length) * 100) : 0;

                  return (
                    <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-blue-600 shadow-2xs">
                          {c.id.replace('cour-', '').toUpperCase().slice(0, 3)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</div>
                          <div className="text-[10px] text-slate-400">{courierOrders.length} طرد</div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-black text-emerald-600 font-mono">{rate}%</div>
                        <div className="text-[10px] text-slate-400">التسليم</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: UNIFIED ORDERS & LOGISTICS PIPELINE (سير الطلبيات والعمليات اللوجستية)
      ========================================================================= */}
      {activeSubTab === 'orders_pipeline' && (
        <div className="space-y-4">
          {/* Pipeline Stage Buttons Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setPipelineStage('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                pipelineStage === 'ALL'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>الكل</span>
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1.5 py-0.2 rounded-full text-[10px]">
                {officialOrdersCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPipelineStage('PENDING')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                pipelineStage === 'PENDING'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-amber-600 border border-amber-200 dark:border-amber-900/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>قيد التأكيد</span>
              <span className="bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 rounded-full text-[10px]">
                {pendingOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPipelineStage('PREPARING')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                pipelineStage === 'PREPARING'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-blue-600 border border-blue-200 dark:border-blue-900/40'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>قيد التحضير</span>
              <span className="bg-blue-100 dark:bg-blue-950 px-1.5 py-0.2 rounded-full text-[10px]">
                {preparingOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPipelineStage('SHIPPED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                pipelineStage === 'SHIPPED'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-indigo-600 border border-indigo-200 dark:border-indigo-900/40'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>قيد الشحن</span>
              <span className="bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.2 rounded-full text-[10px]">
                {shippedOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPipelineStage('DELIVERED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                pipelineStage === 'DELIVERED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-emerald-600 border border-emerald-200 dark:border-emerald-900/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تم التسليم</span>
              <span className="bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded-full text-[10px]">
                {deliveredCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPipelineStage('RETOUR')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                pipelineStage === 'RETOUR'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-red-600 border border-red-200 dark:border-red-900/40'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>المرتجعات</span>
              <span className="bg-red-100 dark:bg-red-950 px-1.5 py-0.2 rounded-full text-[10px]">
                {retourOrders.length}
              </span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="ابحث بالاسم، الهاتف، التتبع، الولاية، أو رقم الطلب..."
                value={pipelineSearch}
                onChange={(e) => setPipelineSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={pipelineCourierFilter}
              onChange={(e) => setPipelineCourierFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">شركات التوصيل</option>
              {INITIAL_COURIERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pipeline Orders Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            {filteredPipelineOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold">لا توجد طلبيات في هذه المرحلة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold">
                    <tr>
                      <th className="p-3.5">الطلبية</th>
                      <th className="p-3.5">الزبون</th>
                      <th className="p-3.5">الوجهة</th>
                      <th className="p-3.5">المبلغ</th>
                      <th className="p-3.5">الشحن والتتبع</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPipelineOrders.map((order) => {
                      const isPending = !order.adminConfirmed && order.status === 'PENDING';
                      const isPrep =
                        (order.adminConfirmed || order.status === 'CONFIRMED' || order.status === 'PROCESSING') &&
                        order.packagingStatus !== 'DISPATCHED' &&
                        order.status !== 'SHIPPED' &&
                        order.status !== 'DELIVERED' &&
                        order.status !== 'FAILED';
                      const isShipped = (order.status === 'SHIPPED' || order.packagingStatus === 'DISPATCHED') && order.status !== 'DELIVERED' && order.status !== 'FAILED';
                      const isDelivered = order.status === 'DELIVERED';
                      const isRetour = order.status === 'FAILED' || order.situation === 'Retour';

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          {/* Order & Date */}
                          <td className="p-3.5">
                            <div className="font-mono font-black text-slate-900 dark:text-white">
                              #{order.trackingCode || order.id.slice(-6)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString('ar-DZ')}
                            </div>
                          </td>

                          {/* Customer & Call */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {order.customerName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <a
                                href={`tel:${order.phone}`}
                                className="font-mono text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{order.phone}</span>
                              </a>
                              <a
                                href={`https://wa.me/213${order.phone?.replace(/^0/, '')}?text=${encodeURIComponent(
                                  `مرحباً ${order.customerName}، معك خدمة الزبائن من المتجر الرسمي لتأكيد طلبيتك بمبلغ ${order.totalAmount} دج.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center transition"
                                title="مراسلة فورية عبر واتساب"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>

                          {/* Wilaya & Address */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {order.wilaya} - {order.commune}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {order.deliveryType === 'home' ? 'توصيل للمنزل' : 'إستلام من المكتب'}
                            </div>
                          </td>

                          {/* Products & COD Total */}
                          <td className="p-3.5">
                            <div className="line-clamp-1 font-bold text-slate-900 dark:text-white">
                              {order.items?.map((it) => it.productName).join(' + ') || 'منتج'}
                            </div>
                            <div className="font-mono font-black text-emerald-600 mt-0.5">
                              {(order.totalAmount || 0).toLocaleString()} دج (COD)
                            </div>
                          </td>

                          {/* Courier Partner & Tracking */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {order.deliveryCompanyName || 'لم تحدد بعد'}
                            </div>
                            {order.trackingCode && (
                              <div className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                                {order.trackingCode}
                              </div>
                            )}
                          </td>

                          {/* Pipeline Status Tag */}
                          <td className="p-3.5">
                            {isPending && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] font-black inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> قيد التأكيد
                              </span>
                            )}
                            {isPrep && (
                              <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-[10px] font-black inline-flex items-center gap-1">
                                <Box className="w-3 h-3" /> قيد التحضير
                              </span>
                            )}
                            {isShipped && (
                              <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-[10px] font-black inline-flex items-center gap-1">
                                <Truck className="w-3 h-3" /> قيد الشحن
                              </span>
                            )}
                            {isDelivered && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-black inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> تم التسليم
                              </span>
                            )}
                            {isRetour && (
                              <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-[10px] font-black inline-flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> مرتجع
                              </span>
                            )}
                          </td>

                          {/* 1-Click Automated Pipeline Actions */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* If Pending Confirmation */}
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleAdminConfirm(order)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                                    title="تأكيد ونقل للتحضير"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>تأكيد</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelOrder(order)}
                                    className="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-red-100 text-slate-700 hover:text-red-600 font-bold text-[11px] transition cursor-pointer"
                                    title="إلغاء الطلب"
                                  >
                                    إلغاء
                                  </button>
                                </>
                              )}

                              {/* If Preparing (Packaging & Courier Upload) */}
                              {isPrep && (
                                <>
                                  {/* Select Courier & Upload API */}
                                  {!order.deliveryCompanySent && (
                                    <select
                                      defaultValue=""
                                      onChange={(e) => {
                                        if (e.target.value) handleAssignCourierAndUpload(order, e.target.value);
                                      }}
                                      className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-lg px-2 py-1 text-[10px] font-bold cursor-pointer"
                                    >
                                      <option value="" disabled>
                                        اختر وارفَع للـ API...
                                      </option>
                                      {INITIAL_COURIERS.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}

                                  {/* Print Bordereau */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForBordereau(order)}
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                    title="طباعة بوردورو الشحن"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                                  </button>

                                  {/* Complete Packaging & Dispatch */}
                                  <button
                                    type="button"
                                    onClick={() => handleDispatchToCourier(order)}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                                    title="تسليم لشركة الشحن وتفعيل التتبع"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>تسليم للشحن</span>
                                  </button>
                                </>
                              )}

                              {/* If Shipped (In Transit) */}
                              {isShipped && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkDelivered(order)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                                    title="تأكيد التسليم بنجاح"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>تم التسليم</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRetourModal(order)}
                                    className="px-2 py-1.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 font-bold text-[11px] hover:bg-red-200 transition cursor-pointer flex items-center gap-1"
                                    title="تسجيل كطرد مرتجع (روتور)"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>روتور</span>
                                  </button>
                                </>
                              )}

                              {/* If Delivered */}
                              {isDelivered && (
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>مكتملة ومقبوضة</span>
                                </span>
                              )}

                              {/* If Retour */}
                              {isRetour && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRetourModal(order)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition cursor-pointer"
                                >
                                  معاينة الروتور
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PRODUCTS & CAMPAIGN CUSTOMIZATION (كتالوج المنتجات وتعديلها)
      ========================================================================= */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="ابحث عن منتج بالاسم، الوصف، أو التصنيف..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setProductFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  productFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                الكل ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setProductFilter('enabled')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  productFilter === 'enabled'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                المتاح بالمتجر
              </button>
              <button
                type="button"
                onClick={() => setProductFilter('featured')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  productFilter === 'featured'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                المميز ⭐
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProductsList.map((product) => {
              const retail = product.officialStoreRetailPrice || product.suggestedSellingPrice || 3500;
              const compare = product.officialStoreCompareAtPrice || product.ceilingPrice || Math.round(retail * 1.35);
              const isEnabled = product.isOfficialStoreEnabled !== false;
              const isFeatured = Boolean(product.isOfficialStoreFeatured);

              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div className="p-4 space-y-3">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                        alt={product.nameAr}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        {isFeatured && (
                          <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                            مميز ⭐
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm ${
                            isEnabled
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isEnabled ? 'متاح بالمتجر' : 'مخفي'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-emerald-600 mb-0.5">
                        {product.categoryAr || 'عام'}
                      </div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                        {product.officialStoreCustomTitle || product.nameAr}
                      </h4>
                    </div>

                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-base font-black text-emerald-600 font-mono">
                          {retail.toLocaleString()} دج
                        </span>
                        {compare > retail && (
                          <span className="text-[10px] text-slate-400 line-through mr-1.5">
                            {compare.toLocaleString()} دج
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        مخزون: {product.variants?.reduce((sum, v) => sum + (v.stockCount || 0), 0) ?? 20}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProductForParams(product)}
                      className="flex-1 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      title="إدارة الروابط"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>إدارة الروابط</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.open(`/store?product=${product.id}`, '_blank')}
                      className="p-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                      title="معاينة"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedProductForParams(product)}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SETTINGS (الإعدادات الشاملة)
      ========================================================================= */}
      {activeSubTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Settings Sub-Navigation */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-2.5 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setSettingsSection('commissions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                settingsSection === 'commissions'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>العمولات والشحن</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsSection('pixels')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                settingsSection === 'pixels'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>البيكسل</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsSection('branding')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                settingsSection === 'branding'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>الهوية</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsSection('domain')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                settingsSection === 'domain'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>الدومين</span>
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* SECTION A: COMMISSIONS & FREE SHIPPING THRESHOLD */}
            {settingsSection === 'commissions' && (
              <div className="space-y-4 max-w-xl">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>العمولات والشحن</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    تُصرف عمولة التأكيد عند تسليم الطلبية بنجاح.
                  </p>
                </div>

                {/* 1. Confirmer Fee Setting */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="text-xs font-black text-slate-900 dark:text-white block">
                    عمولة التأكيد:
                  </label>
                  <div className="relative max-w-xs">
                    <input
                      type="number"
                      min={0}
                      step={25}
                      value={settings.confirmerFeePerDeliveredOrder ?? 150}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          confirmerFeePerDeliveredOrder: Number(e.target.value),
                        })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-black font-mono text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute left-3 top-2 text-xs text-slate-400">دج / طلب</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    تُصرف تلقائياً عند التسليم.
                  </p>
                </div>

                {/* 2. Free Shipping Threshold Setting */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="text-xs font-black text-slate-900 dark:text-white block">
                    الشحن المجاني:
                  </label>
                  <div className="relative max-w-xs">
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={settings.freeShippingThreshold || 0}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          freeShippingThreshold: Number(e.target.value),
                        })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute left-3 top-2 text-xs text-slate-400">دج</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    إذا تجاوز الطلب هذا المبلغ (0 للتعطيل).
                  </p>
                </div>
              </div>
            )}

            {/* SECTION B: PIXELS & AD TRACKING */}
            {settingsSection === 'pixels' && (
              <OfficialStorePixelTrackingCard
                settings={settings}
                onSaveSettings={(updates) => {
                  const updated = { ...settings, ...updates };
                  setSettings(updated);
                  saveOfficialStoreSettings(updated);
                  window.dispatchEvent(new CustomEvent('official_store_settings_updated', { detail: updated }));
                }}
                onShowToast={onShowToast}
              />
            )}

            {/* SECTION C: BRANDING & IDENTITY */}
            {settingsSection === 'branding' && (
              <div className="space-y-3.5 max-w-xl">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    اسم المتجر:
                  </label>
                  <input
                    type="text"
                    value={settings.storeName}
                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    شعار المتجر:
                  </label>
                  <input
                    type="text"
                    value={settings.storeTagline}
                    onChange={(e) => setSettings({ ...settings, storeTagline: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    شريط الإعلان:
                  </label>
                  <input
                    type="text"
                    value={settings.announcementText}
                    onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      صورة البانر الرئيسية للمتجر (Hero Banner):
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAdminBannerModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>🖼️ رفع صورة أو اختيار بانر جاهز</span>
                    </button>
                  </div>
                  
                  {/* Current Banner Preview */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-36 bg-slate-900">
                    <img
                      src={settings.bannerImageUrl || '/social-banner.png'}
                      alt="Banner Preview"
                      className="w-full h-auto max-h-36 object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/social-banner.png';
                      }}
                    />
                    <div className="absolute bottom-2 end-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs font-mono">
                      {settings.bannerImageUrl || '/social-banner.png'}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="/social-banner.png أو رابط صورة خارجي..."
                    value={settings.bannerImageUrl || ''}
                    onChange={(e) => setSettings({ ...settings, bannerImageUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-500">
                    تستبدل النص القديم للبانر بصورة عريضة احترافية بدقة عالية. يمكنك الرفع من جهازك أو اختيار أحد التصاميم الجاهزة بالزر أعلاه.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      رقم الهاتف:
                    </label>
                    <input
                      type="text"
                      value={settings.phoneContact}
                      onChange={(e) => setSettings({ ...settings, phoneContact: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      رقم واتساب:
                    </label>
                    <input
                      type="text"
                      value={settings.whatsappContact}
                      onChange={(e) => setSettings({ ...settings, whatsappContact: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION D: SUBDOMAIN & CUSTOM DOMAIN */}
            {settingsSection === 'domain' && (
              <div className="space-y-3 max-w-xl">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      الدومين الفرعي:
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      مفعل
                    </span>
                  </div>
                  <div className="font-mono text-sm text-slate-900 dark:text-white font-bold bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    store.nouvamarket.com
                  </div>
                  <p className="text-[11px] text-slate-500">
                    المسار المباشر: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">/store</code>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedProductForParams && (
        <OfficialStoreProductParamsModal
          product={selectedProductForParams}
          onClose={() => setSelectedProductForParams(null)}
          onSave={(updated) => {
            if (onSaveProduct) onSaveProduct(updated);
            setSelectedProductForParams(null);
          }}
          onDeleteProduct={(id, permanent) => {
            if (onDeleteProduct) {
              onDeleteProduct(id, permanent);
            } else {
              const current = products.filter((p) => p.id !== id);
              saveStoredProducts(current);
            }
            setSelectedProductForParams(null);
          }}
          onShowToast={onShowToast}
        />
      )}

      {selectedOrderForBordereau && (
        <OfficialStoreBordereauModal
          order={selectedOrderForBordereau}
          courierName={selectedOrderForBordereau.deliveryCompanyName || settings.defaultCourierName || 'Yalidine Express'}
          onClose={() => setSelectedOrderForBordereau(null)}
          onConfirmPrinted={async (orderId) => {
            await updateOrder(orderId, {
              bordereauPrinted: true,
              bordereauPrintedAt: new Date().toISOString(),
              packagingStatus: 'PACKAGED',
            });
            onShowToast('✔ تم تأكيد طباعة بوردورو الشحن الرسمي بنجاح!', 'success');
            setSelectedOrderForBordereau(null);
          }}
        />
      )}

      {/* Retour QC Dialog */}
      {selectedOrderForRetour && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-red-600" />
                استقبال ومعاينة الطرد المرتجع (Retour)
              </h4>
              <button
                onClick={() => setSelectedOrderForRetour(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  سبب فشل التسليم / الإرجاع:
                </label>
                <select
                  value={retourReason}
                  onChange={(e) => setRetourReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                >
                  <option value="لم يرد الزبون على الهاتف (Injoignable)">لم يرد الزبون على الهاتف (Injoignable)</option>
                  <option value="رفض الاستلام بدون سبب">رفض الاستلام بدون سبب</option>
                  <option value="إلغاء متأخر من المشتري">إلغاء متأخر من المشتري</option>
                  <option value="عنوان غير دقيق أو خارج التغطية">عنوان غير دقيق أو خارج التغطية</option>
                  <option value="الزبون لا يملك المبلغ المالي">الزبون لا يملك المبلغ المالي</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  حالة وسلامة المنتج عند الفحص (QC Inspection):
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={retourCondition === 'INTACT_RESTOCKED'}
                      onChange={() => setRetourCondition('INTACT_RESTOCKED')}
                      className="text-emerald-600"
                    />
                    <div>
                      <div className="font-bold text-emerald-600">سليم وجديد (إعادة الكمية للمخزون آلياً)</div>
                      <div className="text-[10px] text-slate-400">المنتج لم يفتح وجاهز لإعادة البيع</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={retourCondition === 'DAMAGED'}
                      onChange={() => setRetourCondition('DAMAGED')}
                      className="text-red-600"
                    />
                    <div>
                      <div className="font-bold text-red-600">متضرر أثناء الشحن</div>
                      <div className="text-[10px] text-slate-400">تسجيل خسارة في البضاعة وعدم إعادة المخزون</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ملاحظات المستودع (اختياري):
                </label>
                <textarea
                  rows={2}
                  value={retourNotes}
                  onChange={(e) => setRetourNotes(e.target.value)}
                  placeholder="ملاحظات حول حالة التغليف..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForRetour(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmRetour}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md shadow-red-700/20"
              >
                تأكيد الاسترجاع وتحديث المخزون
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal for uploading/selecting store banner */}
      <ChangeStoreBannerModal
        isOpen={showAdminBannerModal}
        onClose={() => setShowAdminBannerModal(false)}
      />
    </div>
  );
}
