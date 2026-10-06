import React, { useState, useEffect } from 'react';
import {
  Ship,
  MapPin,
  Building2,
  Phone,
  Clock,
  Send,
  Check,
  Edit3,
  Trash2,
  ExternalLink,
  MessageSquare,
  DollarSign,
  Calendar,
  Info,
  Sparkles,
  Save,
  Boxes,
  FileText,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Truck,
  Plus,
  Star,
  ShieldCheck,
  Copy,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import {
  PlatformWarehouse,
  getStoredPlatformWarehouses,
  addPlatformWarehouse,
  updatePlatformWarehouse,
  deletePlatformWarehouse,
  setPrimaryPlatformWarehouse,
  getStoredWarehouseAddress,
  saveStoredWarehouseAddress,
  WarehouseAddressConfig,
} from '../../lib/warehouseAddressHelper';
import {
  getStoredSourcingRequests,
  updateSourcingRequest,
  deleteSourcingRequest,
  ProductSourcingRequest,
} from '../../lib/sourcingHelper';
import { ALGERIA_WILAYAS } from '../../data/algeriaLocations';

interface AdminWarehouseAddressAndSourcingProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminWarehouseAddressAndSourcingTab({
  onShowToast,
}: AdminWarehouseAddressAndSourcingProps) {
  const [subTab, setSubTab] = useState<'sourcing_requests' | 'warehouse_address'>('warehouse_address');

  // Sourcing Requests State
  const [sourcingRequests, setSourcingRequests] = useState<ProductSourcingRequest[]>(() =>
    getStoredSourcingRequests()
  );
  const [sourcingFilter, setSourcingFilter] = useState<string>('ALL');
  const [sourcingSearch, setSourcingSearch] = useState<string>('');
  const [editingRequest, setEditingRequest] = useState<ProductSourcingRequest | null>(null);

  // Quote Form State
  const [quoteStatus, setQuoteStatus] = useState<ProductSourcingRequest['status']>('QUOTED');
  const [quoteUnitPrice, setQuoteUnitPrice] = useState<number | ''>('');
  const [quoteShippingCost, setQuoteShippingCost] = useState<number | ''>('');
  const [quoteCustomsEstimate, setQuoteCustomsEstimate] = useState<number | ''>('');
  const [quoteArrivalDate, setQuoteArrivalDate] = useState<string>('');
  const [quoteFeedback, setQuoteFeedback] = useState<string>('');

  // Multi-Warehouse Platform State (Hubs 1, 2, 3, 4...)
  const [warehouses, setWarehouses] = useState<PlatformWarehouse[]>(() =>
    getStoredPlatformWarehouses()
  );
  const [selectedHubFilter, setSelectedHubFilter] = useState<string>('ALL');
  const [isAddHubModalOpen, setIsAddHubModalOpen] = useState(false);
  const [editingHub, setEditingHub] = useState<PlatformWarehouse | null>(null);
  const [hubFormData, setHubFormData] = useState<Partial<PlatformWarehouse>>({});

  useEffect(() => {
    const handleSourcingUpdate = () => {
      setSourcingRequests(getStoredSourcingRequests());
    };
    const handleWarehousesUpdate = () => {
      setWarehouses(getStoredPlatformWarehouses());
    };

    window.addEventListener('nouva_sourcing_requests_updated', handleSourcingUpdate);
    window.addEventListener('nouva_platform_warehouses_updated', handleWarehousesUpdate);
    return () => {
      window.removeEventListener('nouva_sourcing_requests_updated', handleSourcingUpdate);
      window.removeEventListener('nouva_platform_warehouses_updated', handleWarehousesUpdate);
    };
  }, []);

  const handleOpenQuoteModal = (req: ProductSourcingRequest) => {
    setEditingRequest(req);
    setQuoteStatus(req.status || 'QUOTED');
    setQuoteUnitPrice(req.quotedUnitPriceDzd ?? '');
    setQuoteShippingCost(req.quotedShippingCostDzd ?? '');
    setQuoteCustomsEstimate(req.quotedCustomsEstimateDzd ?? '');
    setQuoteArrivalDate(req.estimatedArrivalDate ?? '');
    setQuoteFeedback(req.adminFeedback ?? '');
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    const unitPrice = Number(quoteUnitPrice) || 0;
    const shipping = Number(quoteShippingCost) || 0;
    const customs = Number(quoteCustomsEstimate) || 0;
    const totalEst = unitPrice * (editingRequest.targetQuantity || 1) + shipping + customs;

    updateSourcingRequest(editingRequest.id, {
      status: quoteStatus,
      quotedUnitPriceDzd: unitPrice > 0 ? unitPrice : undefined,
      quotedShippingCostDzd: shipping > 0 ? shipping : undefined,
      quotedCustomsEstimateDzd: customs > 0 ? customs : undefined,
      totalEstimatedCostDzd: totalEst > 0 ? totalEst : undefined,
      estimatedArrivalDate: quoteArrivalDate || undefined,
      adminFeedback: quoteFeedback.trim() || undefined,
      quotedAt: new Date().toISOString(),
    });

    setSourcingRequests(getStoredSourcingRequests());
    setEditingRequest(null);
    onShowToast(`✔ تم تحديث وإرسال عرض السعر لطلب الاستيراد #${editingRequest.id} للبائع بنجاح!`, 'success');
  };

  const handleDeleteRequest = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف طلب الاستيراد هذا؟')) {
      deleteSourcingRequest(id);
      setSourcingRequests(getStoredSourcingRequests());
      onShowToast('🗑️ تم حذف طلب الاستيراد بنجاح', 'info');
    }
  };

  const getStatusBadge = (status: ProductSourcingRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-xs font-black border border-amber-300">قيد المراجعة والدراسة ⏳</span>;
      case 'SOURCING':
        return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 text-xs font-black border border-blue-300">جارٍ التواصل مع المصانع 🔍</span>;
      case 'QUOTED':
        return <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 text-xs font-black border border-purple-300">تم تحديد عرض السعر 📄</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 text-xs font-black border border-emerald-300">تم التعاقد وبدء الشحن 🚢</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 text-xs font-black border border-indigo-300">في التخليص الجمركي 📦</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 text-xs font-black border border-rose-300">ملغي أو غير متوفر</span>;
      default:
        return null;
    }
  };

  const filteredRequests = sourcingRequests.filter((r) => {
    if (sourcingFilter !== 'ALL' && r.status !== sourcingFilter) return false;
    if (sourcingSearch.trim()) {
      const q = sourcingSearch.toLowerCase();
      const matchName = r.productName?.toLowerCase().includes(q);
      const matchSeller = r.sellerName?.toLowerCase().includes(q) || r.sellerPhone?.includes(q);
      const matchId = r.id?.toLowerCase().includes(q);
      if (!matchName && !matchSeller && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Sub-Tabs Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setSubTab('sourcing_requests')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              subTab === 'sourcing_requests'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Ship className="w-4 h-4 text-emerald-300" />
            <span>طلبات الاستيراد</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white">
              {sourcingRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('warehouse_address')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              subTab === 'warehouse_address'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4 text-amber-300" />
            <span>عنوان المستودع</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden md:block">
          {subTab === 'sourcing_requests'
            ? 'متابعة وتسعير طلبات الاستيراد والتنسيق مع الموردين'
            : 'بيانات العنوان ومواعيد الاستلام الظاهرة للبائعين'}
        </span>
      </div>

      {/* ==================== SUB-TAB 1: SOURCING REQUESTS ==================== */}
      {subTab === 'sourcing_requests' && (
        <div className="space-y-4">
          {/* Header & Filter Controls */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                  <Ship className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base flex items-center gap-2">
                    <span>طلبات الاستيراد والتوفير</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      استيراد متكامل
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    إدارة طلبات استيراد السلع، تقديم عروض الأسعار والشحن، والتواصل مع البائعين.
                  </p>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-white/10">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث باسم المنتج، اسم البائع، الهاتف، أو كود الطلب..."
                  value={sourcingSearch}
                  onChange={(e) => setSourcingSearch(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
                {[
                  { id: 'ALL', label: 'الكل', count: sourcingRequests.length },
                  { id: 'PENDING', label: 'جديدة', count: sourcingRequests.filter((r) => r.status === 'PENDING').length },
                  { id: 'SOURCING', label: 'قيد البحث', count: sourcingRequests.filter((r) => r.status === 'SOURCING').length },
                  { id: 'QUOTED', label: 'تم التسعير', count: sourcingRequests.filter((r) => r.status === 'QUOTED').length },
                  { id: 'APPROVED', label: 'بدء الشحن', count: sourcingRequests.filter((r) => r.status === 'APPROVED').length },
                  { id: 'SHIPPED', label: 'في الجمرك', count: sourcingRequests.filter((r) => r.status === 'SHIPPED').length },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSourcingFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      sourcingFilter === f.id
                        ? 'bg-emerald-600 text-white font-black shadow-xs'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="font-mono text-[10px] opacity-80">({f.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sourcing Requests Cards List */}
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Ship className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-bold">لا توجد طلبات استيراد مطابقة للبحث أو التصفية المحددة.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const whatsappPhone = req.sellerPhone ? req.sellerPhone.replace(/\D/g, '') : '';
                const cleanWhatsApp = whatsappPhone.startsWith('0') ? `213${whatsappPhone.slice(1)}` : whatsappPhone;

                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 hover:border-purple-300 dark:hover:border-purple-800 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {req.id}
                        </span>
                        <div>
                          <h4 className="font-black text-sm text-slate-900 dark:text-white">
                            {req.productName}
                          </h4>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            تاريخ الطلب: {new Date(req.createdAt).toLocaleDateString('ar-DZ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(req.status)}
                        {req.productUrl && (
                          <a
                            href={req.productUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1 transition"
                            title="رابط المنتج في المصنع (1688 / Alibaba)"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>رابط المصنع</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Sourcing Parameters Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold">معلومات البائع:</span>
                        <span className="font-black text-slate-900 dark:text-white block">{req.sellerName}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`https://wa.me/${cleanWhatsApp}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 transition"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>واتساب</span>
                          </a>
                          <a
                            href={`tel:${req.sellerPhone}`}
                            className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-[10px] flex items-center gap-1 transition"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{req.sellerPhone}</span>
                          </a>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold">الكمية المطلوبة:</span>
                        <span className="font-black font-mono text-slate-900 dark:text-white text-sm">
                          {req.targetQuantity.toLocaleString()} قطعة
                        </span>
                        {req.targetBudgetDzd && (
                          <span className="text-[11px] text-slate-500 block font-mono">
                            الميزانية: {req.targetBudgetDzd.toLocaleString()} دج
                          </span>
                        )}
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold">عرض السعر الحالي:</span>
                        {req.quotedUnitPriceDzd ? (
                          <div>
                            <span className="font-black font-mono text-purple-600 dark:text-purple-400 text-sm">
                              {req.quotedUnitPriceDzd.toLocaleString()} دج / قطعة
                            </span>
                            {req.totalEstimatedCostDzd && (
                              <span className="text-[10px] text-slate-500 block">
                                الإجمالي الواصل: {req.totalEstimatedCostDzd.toLocaleString()} دج
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-600 font-bold text-[11px]">بانتظار تقديم عرض السعر</span>
                        )}
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold">موعد الوصول التقديري:</span>
                        {req.estimatedArrivalDate ? (
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                            📅 {req.estimatedArrivalDate}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">غير محدد بعد</span>
                        )}
                      </div>
                    </div>

                    {/* Notes & Admin Feedback */}
                    {req.notes && (
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                        <strong>ملاحظات وشروط البائع:</strong> {req.notes}
                      </div>
                    )}

                    {req.adminFeedback && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-200">
                        <strong>رد وملاحظات فريق الاستيراد للبائع:</strong> {req.adminFeedback}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenQuoteModal(req)}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تحديد عرض السعر وتحديث الحالة للبائع</span>
                        </button>

                        <a
                          href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
                            `مرحباً ${req.sellerName}، بخصوص طلب استيراد السلعة "${req.productName}" (كود #${req.id}) عبر Nouva Market...`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>محادثة واتساب سريعة</span>
                        </a>
                      </div>

                      <button
                        onClick={() => handleDeleteRequest(req.id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="حذف الطلب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== SUB-TAB 2: MULTI-WAREHOUSE PLATFORM MANAGEMENT ==================== */}
      {subTab === 'warehouse_address' && (
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                <WarehouseIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <span>إدارة وتنسيق مستودعات المنصة المتعددة</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-black border border-indigo-500/30">
                    {warehouses.length} مستودعات معتمدة
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  إمكانية إضافة مستودعات جديدة (مثلاً 2، 3، 4، 5...)، وتعديل عنوان كل مستودع، وتنسيق التوريد والشحن بدقة واحترافية.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  const nextNum = warehouses.length > 0 ? Math.max(...warehouses.map((w) => w.hubNumber || 0)) + 1 : 1;
                  setHubFormData({
                    hubNumber: nextNum,
                    hubName: `مستودع المنصة ${nextNum}`,
                    hubCode: `HUB-${String(nextNum).padStart(2, '0')}`,
                    wilaya: '16 - الجزائر العاصمة',
                    commune: '',
                    fullAddress: '',
                    postalCode: '',
                    receivingPhone: '+213 ',
                    receivingHours: 'السبت إلى الخميس: 08:30 صباحاً حتى 17:00 مساءً',
                    contactPerson: '',
                    notes: 'يرجى تدوين اسم المتجر ورقم الهاتف بوضوح على كل كرتونة، مع إرسال إشعار التوريد مسبقاً.',
                    isPrimary: false,
                    status: 'ACTIVE',
                    coverageRegion: 'تغطية إقليمية مخصصة',
                    coverageWilayasCount: 12,
                    totalInboundShipmentsCount: 0,
                    capacityNotes: 'مساحة تخزينية مجهزة ومحمية بالكامل',
                  });
                  setEditingHub(null);
                  setIsAddHubModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-purple-600/25 transition cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة مستودع منصة جديد</span>
              </button>
            </div>
          </div>

          {/* Quick Hub Navigation Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-extrabold scrollbar-none">
            <button
              onClick={() => setSelectedHubFilter('ALL')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedHubFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>جميع المستودعات</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                {warehouses.length}
              </span>
            </button>

            {warehouses.map((hub) => (
              <button
                key={hub.id}
                onClick={() => setSelectedHubFilter(hub.id)}
                className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
                  selectedHubFilter === hub.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{hub.hubName.split('(')[0].trim() || `مستودع ${hub.hubNumber}`}</span>
                {hub.isPrimary && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-400 text-slate-950 font-black">
                    الرئيسي
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Warehouses Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouses
              .filter((h) => selectedHubFilter === 'ALL' || h.id === selectedHubFilter)
              .map((hub) => {
                const isHub1 = hub.hubNumber === 1;

                return (
                  <div
                    key={hub.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                  >
                    {/* Top Row: Title, Badges, Status */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-lg">
                            {hub.hubNumber}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                                {hub.hubName}
                              </h4>
                              {hub.isPrimary && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span>الرئيسي الافتراضي</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                              <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px] text-slate-700 dark:text-slate-300">
                                {hub.hubCode}
                              </span>
                              <span>•</span>
                              <span className="text-slate-600 dark:text-slate-300 font-bold">{hub.wilaya}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            hub.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {hub.status === 'ACTIVE' ? 'نشط ويستقبل الشحنات' : 'تحت الصيانة'}
                        </span>
                      </div>

                      {/* Detailed Address Box */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="text-slate-800 dark:text-slate-200">
                            <strong>العنوان التفصيلي لسائقي الشحن:</strong>
                            <p className="mt-0.5 leading-relaxed font-medium">
                              {hub.fullAddress} {hub.commune && `• ${hub.commune}`}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="font-bold">الهاتف:</span>
                            <span className="font-mono text-slate-900 dark:text-white font-bold" dir="ltr">{hub.receivingPhone}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-bold">أوقات العمل:</span>
                            <span className="text-slate-900 dark:text-white truncate">{hub.receivingHours}</span>
                          </div>
                        </div>

                        {hub.contactPerson && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="font-bold">مسؤول الاستقبال:</span>
                            <span className="text-slate-900 dark:text-white font-bold">{hub.contactPerson}</span>
                          </div>
                        )}
                      </div>

                      {/* Coverage & Logistics Specs */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-300 space-y-0.5">
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">إقليم التغطية:</span>
                          <span className="font-black text-xs block leading-tight">{hub.coverageRegion || hub.wilaya}</span>
                          <span className="text-[9px] text-purple-500 dark:text-purple-400 block font-mono">
                            تغطية {hub.coverageWilayasCount || 10} ولايات
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 text-teal-900 dark:text-teal-300 space-y-0.5">
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold block">السعة والتجهيز:</span>
                          <span className="font-bold text-xs block truncate">{hub.capacityNotes || 'مساحة تخزين مجهزة'}</span>
                          <span className="text-[9px] text-teal-500 dark:text-teal-400 block font-mono">
                            {hub.totalInboundShipmentsCount || 0} شحنة مودعة
                          </span>
                        </div>
                      </div>

                      {hub.notes && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                          <strong>إرشادات التوريد للبائع:</strong> {hub.notes}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setEditingHub(hub);
                            setHubFormData({ ...hub });
                            setIsAddHubModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل العنوان والبيانات</span>
                        </button>

                        <button
                          onClick={() => {
                            const formatted = `📦 ${hub.hubName} (${hub.hubCode})
📍 الولاية: ${hub.wilaya} - ${hub.commune}
🏢 العنوان الدقيق للشاحنات: ${hub.fullAddress}
📞 هاتف التنسيق والاستقبال: ${hub.receivingPhone}
⏰ أوقات الاستقبال وتفريغ البضائع: ${hub.receivingHours}
👤 مسؤول الاستقبال: ${hub.contactPerson || 'إدارة المستودع'}
💡 ملاحظات للبائع: ${hub.notes || 'يرجى كتابة اسم المتجر ورقم الهاتف بوضوح على كل طرد'}`;
                            navigator.clipboard.writeText(formatted);
                            onShowToast(`📋 تم نسخ عنوان وبيانات ${hub.hubName} للواتساب بنجاح!`, 'success');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                          title="نسخ تفاصيل العنوان للشاحنات والواتساب"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ للواتساب</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!hub.isPrimary && (
                          <button
                            onClick={() => {
                              setPrimaryPlatformWarehouse(hub.id);
                              setWarehouses(getStoredPlatformWarehouses());
                              onShowToast(`✔ تم تعيين ${hub.hubName} كمستودع رئيسي افتراضي للمنصة!`, 'success');
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            title="تعيين كمستودع رئيسي"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>جعله رئيسي</span>
                          </button>
                        )}

                        {!isHub1 && !hub.isPrimary && (
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف ${hub.hubName} نهائياً من مستودعات المنصة؟`)) {
                                deletePlatformWarehouse(hub.id);
                                setWarehouses(getStoredPlatformWarehouses());
                                onShowToast('تم حذف المستودع بنجاح', 'info');
                              }
                            }}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="حذف المستودع"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Coordination Guide Card */}
          <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-black text-sm block">آلية التنسيق الاحترافي بين جميع المستودعات:</strong>
              <p className="leading-relaxed">
                يستطيع البائع عند تسجيل شحنة توريد اختيار أقرب مستودع منصة له (الوسط، الغرب، الشرق، الجنوب). يقوم أمين كل مستودع بفحص وتأكيد الإيداع في مستودعه الخاص، وتظهر السلع فوراً للمسوقين مع تحديد موقع المخزون لتقليص مدة التوصيل للزبائن النهائيين وزيادة نسبة التسليم.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD / EDIT WAREHOUSE MODAL ==================== */}
      {isAddHubModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white border-b border-indigo-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0">
                  <WarehouseIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black">
                    {editingHub ? `تعديل بيانات ${editingHub.hubName}` : 'إضافة مستودع منصة جديد (Hub)'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    تعديل العنوان الدقيق، أرقام الهاتف، أوقات الاستقبال، وإقليم التغطية.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddHubModalOpen(false);
                  setEditingHub(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!hubFormData.hubName || !hubFormData.fullAddress || !hubFormData.receivingPhone) {
                  onShowToast('يرجى تعبئة الحقول الأساسية: اسم المستودع، العنوان الدقيق، ورقم الهاتف', 'error');
                  return;
                }

                if (editingHub) {
                  updatePlatformWarehouse(editingHub.id, hubFormData);
                  onShowToast(`✔ تم تحديث وحفظ بيانات ${hubFormData.hubName} بنجاح! سيظهر التحديث لجميع البائعين.`, 'success');
                } else {
                  addPlatformWarehouse(hubFormData as any);
                  onShowToast(`✔ تم إضافة ${hubFormData.hubName} إلى شبكة مستودعات المنصة بنجاح!`, 'success');
                }

                setWarehouses(getStoredPlatformWarehouses());
                setIsAddHubModalOpen(false);
                setEditingHub(null);
              }}
              className="p-5 space-y-4 overflow-y-auto text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    رقم المستودع (مثلاً 1، 2، 3، 4):
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={hubFormData.hubNumber || 1}
                    onChange={(e) => setHubFormData({ ...hubFormData, hubNumber: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    رمز المستودع (Hub Code):
                  </label>
                  <input
                    type="text"
                    required
                    value={hubFormData.hubCode || ''}
                    onChange={(e) => setHubFormData({ ...hubFormData, hubCode: e.target.value })}
                    placeholder="مثال: ALG-HUB-01"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    حالة المستودع:
                  </label>
                  <select
                    value={hubFormData.status || 'ACTIVE'}
                    onChange={(e) => setHubFormData({ ...hubFormData, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">نشط وجاهز للاستقبال</option>
                    <option value="MAINTENANCE">تحت الصيانة</option>
                    <option value="INACTIVE">معطل مؤقتاً</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  اسم المستودع الرسمي والقطب اللوجستي:
                </label>
                <input
                  type="text"
                  required
                  value={hubFormData.hubName || ''}
                  onChange={(e) => setHubFormData({ ...hubFormData, hubName: e.target.value })}
                  placeholder="مثال: مستودع المنصة 2 (القطب اللوجستي الغربي - وهران)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    الولاية:
                  </label>
                  <select
                    value={hubFormData.wilaya || '16 - الجزائر العاصمة'}
                    onChange={(e) => setHubFormData({ ...hubFormData, wilaya: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {ALGERIA_WILAYAS.map((w) => (
                      <option key={w.code} value={w.nameAr}>
                        {w.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    البلدية أو المنطقة الصناعية:
                  </label>
                  <input
                    type="text"
                    required
                    value={hubFormData.commune || ''}
                    onChange={(e) => setHubFormData({ ...hubFormData, commune: e.target.value })}
                    placeholder="المنطقة الصناعية..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    الرمز البريدي:
                  </label>
                  <input
                    type="text"
                    value={hubFormData.postalCode || ''}
                    onChange={(e) => setHubFormData({ ...hubFormData, postalCode: e.target.value })}
                    placeholder="مثال: 16000"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  العنوان الدقيق والتفصيلي لسائقي الشاحنات والناقلين:
                </label>
                <textarea
                  rows={2}
                  required
                  value={hubFormData.fullAddress || ''}
                  onChange={(e) => setHubFormData({ ...hubFormData, fullAddress: e.target.value })}
                  placeholder="اسم الشارع، رقم الحظيرة، رقم بوابة التفريغ والشحن..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    أرقام هواتف التنسيق والاستلام:
                  </label>
                  <input
                    type="text"
                    required
                    value={hubFormData.receivingPhone || ''}
                    onChange={(e) => setHubFormData({ ...hubFormData, receivingPhone: e.target.value })}
                    placeholder="+213 550 00 00 00 / +213 23 00 00 00"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    أوقات العمل وتفريغ الشاحنات:
                  </label>
                  <input
                    type="text"
                    required
                    value={hubFormData.receivingHours || ''}
                    onChange={(e) => setHubFormData({ ...hubFormData, receivingHours: e.target.value })}
                    placeholder="السبت إلى الخميس: 08:30 صباحاً حتى 17:00 مساءً"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    المسؤول اللوجستي أو شخص الاتصال:
                  </label>
                  <input
                    type="text"
                    value={hubFormData.contactPerson || ''}
                    onChange={(e) => setHubFormData({ ...hubFormData, contactPerson: e.target.value })}
                    placeholder="مثال: مسؤول الاستقبال - م. كريم"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    إقليم التغطية (الولايات المغطاة):
                  </label>
                  <input
                    type="text"
                    value={hubFormData.coverageRegion || ''}
                    onChange={(e) => setHubFormData({ ...hubFormData, coverageRegion: e.target.value })}
                    placeholder="مثال: الغرب (وهران، تلمسان، مستغانم...)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  المواصفات والسعة التخزينية للمستودع:
                </label>
                <input
                  type="text"
                  value={hubFormData.capacityNotes || ''}
                  onChange={(e) => setHubFormData({ ...hubFormData, capacityNotes: e.target.value })}
                  placeholder="مثال: مساحة 3,500 م² • 8 أرصفة تفريغ سريعة • غرف عزل"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  تعليمات وشروط هامة للبائع عند تسليم الشحنات:
                </label>
                <textarea
                  rows={2}
                  value={hubFormData.notes || ''}
                  onChange={(e) => setHubFormData({ ...hubFormData, notes: e.target.value })}
                  placeholder="مثال: يرجى وضع اسم المتجر بوضوح على كل كرتونة وإرفاق وصل التوريد..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="primaryHubCheck"
                  checked={Boolean(hubFormData.isPrimary)}
                  onChange={(e) => setHubFormData({ ...hubFormData, isPrimary: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="primaryHubCheck" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  تعيين هذا المستودع كمستودع رئيسي افتراضي للمنصة
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddHubModalOpen(false);
                    setEditingHub(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingHub ? 'حفظ تعديلات المستودع' : 'إضافة المستودع للنظام'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== QUOTE & STATUS EDIT MODAL ==================== */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 text-white border-b border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-400/40 text-purple-300 flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black">
                    تحديد عرض السعر وتحديث الحالة للطلب #{editingRequest.id}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    السلعة: {editingRequest.productName} • البائع: {editingRequest.sellerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRequest(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-xs">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  حالة الطلب اللوجستية:
                </label>
                <select
                  value={quoteStatus}
                  onChange={(e) => setQuoteStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="PENDING">قيد المراجعة والدراسة (Pending)</option>
                  <option value="SOURCING">جارٍ البحث والتواصل مع المصانع (Sourcing)</option>
                  <option value="QUOTED">تم إصدار عرض السعر والشحن (Quoted)</option>
                  <option value="APPROVED">تم الاتفاق وبدء الشحن الدولي (Approved & Shipped)</option>
                  <option value="SHIPPED">في التخليص الجمركي بميناء/مطار الجزائر (In Customs)</option>
                  <option value="REJECTED">ملغي / غير متوفر (Rejected)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    سعر الوحدة المقترح من المصنع (دج):
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 1200 دج"
                    value={quoteUnitPrice}
                    onChange={(e) => setQuoteUnitPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    كلفة الشحن الدولي الإجمالية (دج):
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 45000 دج"
                    value={quoteShippingCost}
                    onChange={(e) => setQuoteShippingCost(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    تقدير الرسوم الجمركية (دج):
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 30000 دج"
                    value={quoteCustomsEstimate}
                    onChange={(e) => setQuoteCustomsEstimate(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    تاريخ الوصول المتوقع للمستودع:
                  </label>
                  <input
                    type="date"
                    value={quoteArrivalDate}
                    onChange={(e) => setQuoteArrivalDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  رد وعرض فريق الاستيراد للبائع:
                </label>
                <textarea
                  rows={3}
                  placeholder="اكتب تفاصيل العرض للبائع (المواصفات، مدة الشحن، شروط الفحص والتغليف)..."
                  value={quoteFeedback}
                  onChange={(e) => setQuoteFeedback(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-200">
                سيظهر هذا العرض مباشرة للبائع في قسم سجل طلبات الاستيراد، وسيتم إرسال إشعار لحظي له لمتابعة التفاصيل.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال العرض والتحديث للبائع</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
