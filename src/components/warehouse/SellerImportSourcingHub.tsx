import React, { useState } from 'react';
import {
  Ship,
  Boxes,
  MapPin,
  Phone,
  Clock,
  Copy,
  Check,
  Plus,
  Send,
  ExternalLink,
  ShieldCheck,
  Truck,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  X,
  Compass,
} from 'lucide-react';
import {
  ProductSourcingRequest,
  getStoredSourcingRequests,
  createSourcingRequest,
} from '../../lib/sourcingHelper';
import {
  getStoredWarehouseAddress,
  getStoredPlatformWarehouses,
  PlatformWarehouse,
  WarehouseAddressConfig,
} from '../../lib/warehouseAddressHelper';

interface SellerImportSourcingHubProps {
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  onOpenInboundShipmentModal: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function SellerImportSourcingHub({
  supplierId,
  supplierName,
  supplierPhone = '',
  supplierEmail = '',
  onOpenInboundShipmentModal,
  onShowToast,
}: SellerImportSourcingHubProps) {
  const [activeTab, setActiveTab] = useState<'turnkey_import' | 'warehouse_address'>('turnkey_import');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [showAddressDetails, setShowAddressDetails] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Multi-Warehouse Platform State
  const [platformWarehouses, setPlatformWarehouses] = useState<PlatformWarehouse[]>(() =>
    getStoredPlatformWarehouses()
  );
  const [activeHubId, setActiveHubId] = useState<string>(() => {
    const all = getStoredPlatformWarehouses();
    return all.find((w) => w.isPrimary)?.id || all[0]?.id || 'hub-1';
  });

  // Sourcing Form State
  const [productName, setProductName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [targetQuantity, setTargetQuantity] = useState(200);
  const [targetBudgetDzd, setTargetBudgetDzd] = useState<number | ''>('');
  const [phone, setPhone] = useState(supplierPhone);
  const [notes, setNotes] = useState('');
  const [sourcingRequests, setSourcingRequests] = useState<ProductSourcingRequest[]>(() =>
    getStoredSourcingRequests().filter(
      (r) => r.sellerId === supplierId || r.sellerName?.toLowerCase() === supplierName.toLowerCase()
    )
  );

  const [warehouseAddressInfo, setWarehouseAddressInfo] = useState<WarehouseAddressConfig>(() =>
    getStoredWarehouseAddress()
  );

  // Listen to address updates from Admin Dashboard
  React.useEffect(() => {
    const handleAddressUpdate = () => {
      setWarehouseAddressInfo(getStoredWarehouseAddress());
      setPlatformWarehouses(getStoredPlatformWarehouses());
    };
    const handleSourcingUpdate = () => {
      setSourcingRequests(
        getStoredSourcingRequests().filter(
          (r) => r.sellerId === supplierId || r.sellerName?.toLowerCase() === supplierName.toLowerCase()
        )
      );
    };

    window.addEventListener('nouva_warehouse_address_updated', handleAddressUpdate);
    window.addEventListener('nouva_platform_warehouses_updated', handleAddressUpdate);
    window.addEventListener('nouva_sourcing_requests_updated', handleSourcingUpdate);
    return () => {
      window.removeEventListener('nouva_warehouse_address_updated', handleAddressUpdate);
      window.removeEventListener('nouva_platform_warehouses_updated', handleAddressUpdate);
      window.removeEventListener('nouva_sourcing_requests_updated', handleSourcingUpdate);
    };
  }, [supplierId, supplierName]);

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    onShowToast('📋 تم نسخ البيانات إلى الحافظة بنجاح!', 'success');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCreateSourcing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      onShowToast('يرجى كتابة اسم المنتج المطلوب استيراده', 'error');
      return;
    }
    if (!phone.trim()) {
      onShowToast('يرجى تحديد رقم الهاتف لمتابعة الطلب', 'error');
      return;
    }

    const created = createSourcingRequest({
      sellerId: supplierId,
      sellerName: supplierName,
      sellerPhone: phone,
      sellerEmail: supplierEmail,
      productName,
      productUrl,
      targetQuantity: Number(targetQuantity) || 100,
      targetBudgetDzd: targetBudgetDzd ? Number(targetBudgetDzd) : undefined,
      notes,
    });

    setSourcingRequests((prev) => [created, ...prev]);
    setIsRequestModalOpen(false);
    setProductName('');
    setProductUrl('');
    setNotes('');
    onShowToast('🎉 تم إرسال طلب استيراد السلعة بنجاح! سيتواصل معك فريق الاستيراد والتخليص لتزويدك بعرض السعر وجدول الشحن.', 'success');
  };

  const getStatusBadge = (status: ProductSourcingRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">قيد المراجعة والدراسة ⏳</span>;
      case 'SOURCING':
        return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black border border-blue-300">جارٍ التواصل مع المصانع 🔍</span>;
      case 'QUOTED':
        return <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black border border-purple-300">تم تحديد عرض السعر والشحن 📄</span>;
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">تم التعاقد وبدء الشحن 🚢</span>;
      case 'SHIPPED':
        return <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black border border-indigo-300">في التخليص الجمركي بالجزائر 📦</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-300">ملغي أو غير متوفر</span>;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/25 text-white shadow-xl overflow-hidden">
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20 shrink-0">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">خدمات الاستيراد والتوريد</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                استيراد شامل للبضائع أو توريد مباشر لمستودعاتنا.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-95"
            >
              <Ship className="w-3.5 h-3.5 text-emerald-200" />
              <span>طلب استيراد</span>
            </button>
            <button
              onClick={onOpenInboundShipmentModal}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Boxes className="w-3.5 h-3.5 text-amber-300" />
              <span>إشعار توريد</span>
            </button>
          </div>
        </div>

        {/* User Brief Card */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            يمكنك استيراد المنتجات بالتعاون معنا، وسنتولى جميع الأمور اللازمة من الشحن إلى التخليص الجمركي وحتى توفير المنتجات. سنهتم بجميع التفاصيل لتسهيل العملية عليك. بدلاً من ذلك، إذا كنت ترغب في إدارة الأمور بنفسك، يمكننا تزويدك بعنوان مستودعاتنا بحيث تتولى الشحن والتوريد بالطريقة التي تناسبك.
          </p>
        </div>

        {/* Two Operational Paths Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* Option 1: Turnkey Sourcing */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-emerald-400 flex items-center gap-1.5">
                  <Ship className="w-4 h-4" />
                  <span>1. استيراد عبر المنصة</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  شحن وتخليص شامل
                </span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 leading-normal">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>البحث في المصانع وفحص الجودة</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>الشحن الدولي البحري والجوي</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>التخليص الجمركي في الجزائر</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>الإيداع المباشر في المستودع</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>طلب استيراد بضاعة ➔</span>
            </button>
          </div>

          {/* Option 2: Self-managed Inbound */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-indigo-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>2. التوريد المباشر للمستودع</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                  شحن ذاتي
                </span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 leading-normal">
                <li className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>شحن البضاعة من موردك المحلي</span>
                </li>
                <li className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>استقبال الكراتين بمستودعنا المركزي</span>
                </li>
                <li className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>مطابقة عدد القطع مع الفاتورة</span>
                </li>
                <li className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>إيداع البضاعة وتحديث المخزون فوراً</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddressDetails(!showAddressDetails)}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{showAddressDetails ? 'إخفاء العنوان' : 'عنوان المستودع'}</span>
                {showAddressDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onOpenInboundShipmentModal}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="إرسال إشعار توريد"
              >
                <Boxes className="w-3.5 h-3.5 text-amber-300" />
                <span>إشعار توريد</span>
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Warehouse Address Reveal Section */}
        {showAddressDetails && (() => {
          const selectedHub = platformWarehouses.find((w) => w.id === activeHubId) || platformWarehouses[0];
          const activeHubAddress = selectedHub?.fullAddress || warehouseAddressInfo.fullAddress;
          const activeHubPhone = selectedHub?.receivingPhone || warehouseAddressInfo.receivingPhone;
          const activeHubHours = selectedHub?.receivingHours || warehouseAddressInfo.receivingHours;
          const activeHubCode = selectedHub?.hubCode || warehouseAddressInfo.hubCode;
          const activeHubName = selectedHub?.hubName || warehouseAddressInfo.hubName;
          const activeHubWilaya = selectedHub?.wilaya || warehouseAddressInfo.wilaya;
          const activeHubCommune = selectedHub?.commune || warehouseAddressInfo.commune;

          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-indigo-400/40 space-y-3.5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-indigo-500/30 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h4 className="font-black text-sm text-white flex items-center gap-2">
                      <span>شبكة مستودعات المنصة ({platformWarehouses.length} مستودعات)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">اختر المستودع الأقرب إليك لشحن وتوريد بضائعك</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-indigo-300 px-2.5 py-0.5 rounded-lg bg-indigo-950 border border-indigo-500/30">
                  رمز المستودع: {activeHubCode}
                </span>
              </div>

              {/* Hub Selection Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
                {platformWarehouses.map((hub) => {
                  const isSelected = (selectedHub?.id || 'hub-1') === hub.id;
                  return (
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => setActiveHubId(hub.id)}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-black shadow-xs'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      <span>مستودع {hub.hubNumber}</span>
                      <span className="text-[10px] opacity-80">({hub.wilaya.split('-')[1]?.trim() || hub.wilaya})</span>
                      {hub.isPrimary && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-400 text-slate-950 font-black">
                          الرئيسي
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">اسم المستودع:</span>
                  <span className="font-black text-slate-100">{activeHubName}</span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">الولاية والبلدية:</span>
                  <span className="font-black text-slate-100">
                    {activeHubWilaya} {activeHubCommune && `• ${activeHubCommune}`}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">أوقات العمل واستقبال الكراتين:</span>
                  <span className="font-black text-emerald-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{activeHubHours}</span>
                  </span>
                </div>

                <div className="sm:col-span-2 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">العنوان الدقيق لسائق الشاحنة:</span>
                    <span className="font-bold text-slate-100 text-xs">{activeHubAddress}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeHubAddress, 'address')}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition shrink-0 cursor-pointer"
                  >
                    {copiedField === 'address' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'address' ? 'تم النسخ!' : 'نسخ العنوان'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">هاتف التنسيق المباشر:</span>
                    <span className="font-mono font-bold text-amber-300 text-xs">{activeHubPhone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeHubPhone, 'phone')}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition shrink-0 cursor-pointer"
                    title="نسخ الهاتف"
                  >
                    {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {selectedHub?.notes && (
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 text-xs">
                  <strong>إرشادات التوريد لمستودع {selectedHub.hubNumber}:</strong> {selectedHub.notes}
                </div>
              )}

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>ملاحظة هامة للشحن الذاتي:</strong> يرجى كتابة اسم متجرك أو اسم البائع ورقم الهاتف بوضوح على كل كرتونة يتم تسليمها، مع إرسال إشعار التوريد من التطبيق مسبقاً لمطابقة عدد القطع فور الاستلام دون أي تأخير.
                </span>
              </div>
            </div>
          );
        })()}

        {/* Existing Sourcing Requests History */}
        {sourcingRequests.length > 0 && (
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>سجل طلبات الاستيراد الخاصة بك ({sourcingRequests.length}):</span>
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {sourcingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">{req.id}</span>
                      <h5 className="font-black text-slate-100 truncate">{req.productName}</h5>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 flex-wrap">
                      <span>الكمية المطلوبة: <strong>{req.targetQuantity} قطعة</strong></span>
                      {req.targetBudgetDzd && (
                        <span>الميزانية المقترحة: <strong>{req.targetBudgetDzd.toLocaleString()} دج</strong></span>
                      )}
                      <span>التاريخ: {new Date(req.createdAt).toLocaleDateString('ar-DZ')}</span>
                    </div>

                    {/* Admin Quotation Details */}
                    {req.quotedUnitPriceDzd && (
                      <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] space-y-1 mt-1 text-purple-200">
                        <div className="flex items-center gap-3 font-mono flex-wrap">
                          <span>سعر الوحدة من المصنع: <strong>{req.quotedUnitPriceDzd.toLocaleString()} دج</strong></span>
                          {req.quotedShippingCostDzd && (
                            <span>الشحن الدولي: <strong>{req.quotedShippingCostDzd.toLocaleString()} دج</strong></span>
                          )}
                          {req.totalEstimatedCostDzd && (
                            <span className="text-emerald-400 font-bold">الإجمالي الواصل للمستودع: <strong>{req.totalEstimatedCostDzd.toLocaleString()} دج</strong></span>
                          )}
                        </div>
                        {req.estimatedArrivalDate && (
                          <div className="text-amber-300 font-bold">
                            📅 تاريخ الوصول المتوقع للمستودع: {req.estimatedArrivalDate}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Admin Feedback */}
                    {req.adminFeedback && (
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] mt-1">
                        <strong>رد وملاحظات فريق الاستيراد:</strong> {req.adminFeedback}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(req.status)}
                    {req.productUrl && (
                      <a
                        href={req.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
                        title="رابط المنتج الأصلي"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SOURCING REQUEST MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white border-b border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black">طلب استيراد بضاعة</h3>
                  <p className="text-[11px] text-slate-300">توفير المنتج، الشحن الدولي، والتخليص الجمركي الكامل.</p>
                </div>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSourcing} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-xs">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  اسم أو نوع المنتج المطلوب استيراده: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سماعات بلوتوث عازلة للضوضاء، ساعة ذكية..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  رابط المنتج (1688 / Alibaba / Taobao / موقع المورد) إن توفر:
                </label>
                <input
                  type="url"
                  placeholder="https://detail.1688.com/offer/..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    الكمية المقدرة (قطعة): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="20"
                    required
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    الميزانية أو التكلفة المستهدفة (دج):
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 500,000 دج"
                    value={targetBudgetDzd}
                    onChange={(e) => setTargetBudgetDzd(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  رقم الهاتف للتواصل والمتابعة: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0555 12 34 56"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  ملاحظات أو مواصفات خاصة (الألوان، الشعار، التغليف):
                </label>
                <textarea
                  rows={2}
                  placeholder="أي تفاصيل ترغب في توفيرها من المصنع أو شروط الفحص والتغليف..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                سيتولى فريق الاستيراد فحص المنتج وتزويدك بعرض أسعار شامل للشحن الدولي والتخليص الجمركي والتوصيل لمستودع المنصة.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/25 cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>تأكيد وإرسال الطلب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
