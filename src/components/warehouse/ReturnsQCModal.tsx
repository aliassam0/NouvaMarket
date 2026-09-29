import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Boxes,
  MapPin,
  Printer,
  FileText,
  Truck,
  Check,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Order, Product, ReturnInspectionReport } from '../../types';
import { MoneyText } from '../ui/MoneyText';
import {
  getStoredReturnInspections,
  inspectAndProcessReturnedOrder,
} from '../../lib/codReconciliationHelper';

interface ReturnsQCModalProps {
  returnedOrders: Order[];
  products: Product[];
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOrderRestocked: (orderId: string) => void;
}

export const ReturnsQCModal: React.FC<ReturnsQCModalProps> = ({
  returnedOrders,
  products,
  onClose,
  onShowToast,
  onOrderRestocked,
}) => {
  const [activeTab, setActiveTab] = useState<'inspect' | 'reports'>('inspect');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(returnedOrders[0]?.id || '');
  const [packagingStatus, setPackagingStatus] = useState<'SEALED_INTACT' | 'OPENED_GOOD' | 'TORN_DAMAGED'>('SEALED_INTACT');
  const [itemStatus, setItemStatus] = useState<'RESELLABLE' | 'DAMAGED_CARRIER' | 'WRONG_ITEM' | 'CUSTOMER_USED'>('RESELLABLE');
  const [shelfLocation, setShelfLocation] = useState('مستودع العاصمة - رف A1');
  const [claimAmount, setClaimAmount] = useState<number>(3000);
  const [notes, setNotes] = useState('');
  const [reports, setReports] = useState<ReturnInspectionReport[]>(() => getStoredReturnInspections());
  const [activeReportToPrint, setActiveReportToPrint] = useState<ReturnInspectionReport | null>(null);

  const selectedOrder = returnedOrders.find((o) => o.id === selectedOrderId) || returnedOrders[0];

  const handleProcessInspection = () => {
    if (!selectedOrder) return;

    const report = inspectAndProcessReturnedOrder({
      order: selectedOrder,
      packagingStatus,
      itemStatus,
      shelfLocation,
      carrierClaimAmountDzd: claimAmount,
      notes,
    });

    setReports(getStoredReturnInspections());
    onOrderRestocked(selectedOrder.id);

    if (itemStatus === 'RESELLABLE') {
      onShowToast(
        `✔ تم فحص الطرد #${selectedOrder.id} بنجاح، وإعادة سلع الطرد للمخزون الحي بالرف (${shelfLocation})!`,
        'success'
      );
    } else if (itemStatus === 'DAMAGED_CARRIER') {
      onShowToast(
        `⚠️ تم تسجيل محضر مطالبة تعويض (${report.claimReference}) ضد شركة التوصيل بمبلغ ${report.carrierClaimAmountDzd} دج!`,
        'info'
      );
    } else {
      onShowToast(`تم تسجيل تقرير فحص الطرد المرتجع #${selectedOrder.id}`, 'info');
    }

    // Move to next order or reports
    const remaining = returnedOrders.filter((o) => o.id !== selectedOrder.id);
    if (remaining.length > 0) {
      setSelectedOrderId(remaining[0].id);
    } else {
      setActiveTab('reports');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-gradient-to-r from-slate-50 to-rose-50/40 dark:from-slate-900 dark:to-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-md shadow-rose-600/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  محطة فحص الجودة (QC) وإعادة المرتجعات للمخزون الحي
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-mono font-black border border-rose-200 dark:border-rose-800">
                  {returnedOrders.length} طرد بانتظار الفحص
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                فحص جودة الطرود المرتجعة من شركات التوصيل، إعادة السلع السليمة للأرفف فوراً، وتوليد محاضر مطالبات التعويض للطرود المتضررة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('inspect')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'inspect'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/80 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>1. فحص طرد مرتجع حالي (QC Inspection)</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 text-[10px]">
              {returnedOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/80 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. سجل محاضر الفحص ومطالبات التعويض ({reports.length})</span>
          </button>
        </div>

        {/* TAB 1: INSPECTION FLOW */}
        {activeTab === 'inspect' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col md:flex-row gap-4">
            
            {/* Returned Orders List */}
            <div className="w-full md:w-72 shrink-0 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2 bg-slate-50/40 dark:bg-slate-800/20 max-h-[60vh] overflow-y-auto">
              <span className="text-[11px] font-black text-slate-500 uppercase block mb-1">
                الطرود المرتجعة للمستودع ({returnedOrders.length})
              </span>
              {returnedOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  لا توجد طرود مرتجعة بانتظار الفحص حالياً.
                </div>
              ) : (
                returnedOrders.map((ord) => {
                  const isSelected = ord.id === selectedOrder?.id;
                  return (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedOrderId(ord.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer text-xs space-y-1 ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span className="font-mono">#{ord.id}</span>
                        <span className="text-[10px]">
                          {ord.trackingCode || 'N/A'}
                        </span>
                      </div>
                      <div className="text-[11px] truncate opacity-90">
                        {ord.customerName} ({ord.wilaya})
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Inspection Form */}
            {selectedOrder ? (
              <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 bg-white dark:bg-slate-900">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-slate-900 dark:text-white font-mono">
                        طرد #{selectedOrder.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-black">
                        كود التتبع: {selectedOrder.trackingCode || 'N/A'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      الزبون: {selectedOrder.customerName} | الولاية: {selectedOrder.wilaya} | سبب الإرجاع: {selectedOrder.failureReason || selectedOrder.cancellationReason || 'رفض الاستلام'}
                    </span>
                  </div>

                  <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                    قيمة الطرد: <MoneyText amount={selectedOrder.totalAmount + selectedOrder.shippingFee} />
                  </span>
                </div>

                {/* Items in parcel */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5 text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-300 block mb-1">محتويات الطرد المطلوب فحصها:</span>
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center font-bold">
                      <span>• {it.productName} ({it.variantSize} / {it.variantColor})</span>
                      <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">
                        × {it.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* STEP 1: Packaging Status */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                    1. حالة التغليف الخارجي للكرتون / كيس الشحن:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'SEALED_INTACT', label: 'مغلق وسليم بالكامل 🔒', desc: 'لم يفتح وغير ممزق' },
                      { id: 'OPENED_GOOD', label: 'مفتوح ولكن بحالة ممتازة 📦', desc: 'فتحه الزبون وأعاده فوراً' },
                      { id: 'TORN_DAMAGED', label: 'ممزق أو متضرر بشدة ⚠️', desc: 'آثار دهس أو بلل أو تمزق' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPackagingStatus(opt.id as any)}
                        className={`p-3 rounded-xl border text-start transition cursor-pointer ${
                          packagingStatus === opt.id
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 font-black ring-2 ring-rose-400/40'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="block font-bold">{opt.label}</span>
                        <span className="text-[10px] text-slate-400">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* STEP 2: Item Condition & Decision */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                    2. القرار وحالة السلع بالداخل (QC Assessment):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      {
                        id: 'RESELLABLE',
                        label: '✔ سليم 100% وقابل لإعادة البيع فوراً',
                        desc: 'يعاد للمخزون الحي ويتوفر للمسوقين للبيع مجدداً',
                        accent: 'border-emerald-500 bg-emerald-50/40 text-emerald-900 dark:text-emerald-200',
                      },
                      {
                        id: 'DAMAGED_CARRIER',
                        label: '⚠️ تالف بسبب سوء نقل شركة التوصيل',
                        desc: 'توليد محضر مطالبة تعويض رسمي ضد شركة التوصيل',
                        accent: 'border-amber-500 bg-amber-50/40 text-amber-900 dark:text-amber-200',
                      },
                      {
                        id: 'WRONG_ITEM',
                        label: '❌ سلعة معيبة أو غير مطابقة',
                        desc: 'تحال لمركز عزل البضائع المرتجعة للمورد',
                        accent: 'border-rose-500 bg-rose-50/40 text-rose-900 dark:text-rose-200',
                      },
                      {
                        id: 'CUSTOMER_USED',
                        label: '🔄 استعمله الزبون أو ينقصه ملحقات',
                        desc: 'تخفيض السعر أو إرجاع إلى المورد',
                        accent: 'border-purple-500 bg-purple-50/40 text-purple-900 dark:text-purple-200',
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setItemStatus(opt.id as any)}
                        className={`p-3 rounded-xl border text-start transition cursor-pointer ${
                          itemStatus === opt.id
                            ? `${opt.accent} font-black ring-2 ring-slate-400/40`
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="block font-bold">{opt.label}</span>
                        <span className="text-[10px] opacity-80">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Fields: Shelf for Resellable vs Claim for Damaged */}
                {itemStatus === 'RESELLABLE' && (
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs">
                    <label className="font-bold text-emerald-900 dark:text-emerald-200 block">
                      موقع الرف في المستودع لإعادة تخزين القطع:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shelfLocation}
                        onChange={(e) => setShelfLocation(e.target.value)}
                        className="flex-1 p-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 font-mono font-bold"
                        placeholder="مستودع العاصمة - رف A2"
                      />
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">
                      💡 فور اعتماد الفحص، ستزداد كمية المنتج في المخزون تلقائياً وسيتم إشعار المورد.
                    </span>
                  </div>
                )}

                {itemStatus === 'DAMAGED_CARRIER' && (
                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2 text-xs">
                    <label className="font-bold text-amber-900 dark:text-amber-200 block">
                      مبلغ التعويض المطلوب من شركة التوصيل (DZD):
                    </label>
                    <input
                      type="number"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-mono font-bold"
                    />
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 block">
                      📋 سيتم توليد محضر معاينة إتلاف رسمي (Damage Claim Report) يحمل رقماً مرجعياً للمطالبة به في فاتورة شركة التوصيل.
                    </span>
                  </div>
                )}

                {/* Action button */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={handleProcessInspection}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {itemStatus === 'RESELLABLE'
                        ? 'اعتماد الفحص وإعادة للمخزون الحي فوراً'
                        : itemStatus === 'DAMAGED_CARRIER'
                        ? 'تسجيل محضر مطالبة التعويض'
                        : 'حفظ تقرير الفحص'}
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

          </div>
        )}

        {/* TAB 2: INSPECTION REPORTS & CLAIMS */}
        {activeTab === 'reports' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {reports.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                لا توجد محاضر فحص سابقة.
              </div>
            ) : (
              reports.map((rep) => {
                const isClaim = rep.compensationClaimNeeded;
                return (
                  <div
                    key={rep.id}
                    className={`p-4 rounded-2xl border transition shadow-xs space-y-2.5 text-xs ${
                      isClaim
                        ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-300/80 dark:border-amber-900/40'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          طلب #{rep.orderId}
                        </span>
                        <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                          ({rep.trackingCode})
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            isClaim
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                          }`}
                        >
                          {isClaim ? '⚠️ مطالبة تعويض قيد المتابعة' : '✔ أعيد للمخزون الحي'}
                        </span>
                      </div>

                      <div className="font-mono text-[11px] text-slate-500">
                        الناقل: <strong>{rep.courierName}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">الزبون والولاية:</span>
                        <strong>{rep.customerName} ({rep.wilaya})</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">حالة الفحص والسلع:</span>
                        <strong>
                          {rep.itemStatus === 'RESELLABLE'
                            ? `سليم بالرف (${rep.restockedToShelf || 'A1'})`
                            : 'تالف بسبب النقل'}
                        </strong>
                      </div>
                      {isClaim && (
                        <div className="text-amber-700 dark:text-amber-300 font-mono">
                          <span className="text-slate-400 block text-[10px]">رقم المطالبة والمبلغ:</span>
                          <strong>{rep.claimReference} ({rep.carrierClaimAmountDzd?.toLocaleString()} دج)</strong>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>الفاحص: {rep.inspectorName}</span>
                      <span>تاريخ الفحص: {new Date(rep.inspectedAt).toLocaleString('ar-DZ')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
};
