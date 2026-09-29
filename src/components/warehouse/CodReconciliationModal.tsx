import React, { useState, useMemo } from 'react';
import {
  X,
  DollarSign,
  Building2,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Receipt,
  Printer,
  ShieldCheck,
  Truck,
  Wallet,
  Clock,
  Coins,
  Check,
  Filter,
} from 'lucide-react';
import { Order, CodRemittanceBatch } from '../../types';
import { MoneyText } from '../ui/MoneyText';
import {
  getStoredCodRemittances,
  executeCodRemittanceReconciliation,
} from '../../lib/codReconciliationHelper';

interface CodReconciliationModalProps {
  orders: Order[];
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOrdersUpdated: (updatedOrders: Order[]) => void;
}

export const CodReconciliationModal: React.FC<CodReconciliationModalProps> = ({
  orders,
  onClose,
  onShowToast,
  onOrdersUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'reconcile' | 'history'>('reconcile');
  const [courierName, setCourierName] = useState('Yalidine Express');
  const [paymentReference, setPaymentReference] = useState(
    `VIR-CCP-${Math.floor(100000000 + Math.random() * 900000000)}`
  );
  const [paymentMethod, setPaymentMethod] = useState<'CCP' | 'BARIDIMOB' | 'BANK_TRANSFER' | 'CASH'>('CCP');
  const [shippingFeePerOrder, setShippingFeePerOrder] = useState<number>(600);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [pastBatches, setPastBatches] = useState<CodRemittanceBatch[]>(() => getStoredCodRemittances());
  const [activeHistoryBatch, setActiveHistoryBatch] = useState<CodRemittanceBatch | null>(null);

  // Delivered orders that are not yet reconciled
  const unreconciledDeliveredOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.status === 'DELIVERED' || o.situation === 'Livré') &&
        !o.reconciledWithCourier
    );
  }, [orders]);

  // Orders selected for reconciliation
  const targetOrders = useMemo(() => {
    if (selectedOrderIds.length === 0) return unreconciledDeliveredOrders;
    return unreconciledDeliveredOrders.filter((o) => selectedOrderIds.includes(o.id));
  }, [unreconciledDeliveredOrders, selectedOrderIds]);

  // Calculations for current selection
  const totalCodCollected = useMemo(() => {
    return targetOrders.reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0) + (Number(o.shippingFee) || 0),
      0
    );
  }, [targetOrders]);

  const totalShippingFeeDeduction = useMemo(() => {
    return targetOrders.reduce(
      (sum, o) => sum + (Number(o.shippingFee) || shippingFeePerOrder),
      0
    );
  }, [targetOrders, shippingFeePerOrder]);

  const netCashReceived = Math.max(0, totalCodCollected - totalShippingFeeDeduction);

  const totalResellerProfits = useMemo(() => {
    return targetOrders.reduce((sum, o) => sum + (Number(o.totalProfit) || 0), 0);
  }, [targetOrders]);

  const totalSupplierWholesale = useMemo(() => {
    return targetOrders.reduce((sum, o) => {
      const due = o.items.reduce((itemSum, item) => {
        const price = item.wholesalePrice || (item.sellingPrice ? Math.round(item.sellingPrice * 0.7) : 2000);
        return itemSum + price * (Number(item.quantity) || 1);
      }, 0);
      return sum + due;
    }, 0);
  }, [targetOrders]);

  const totalPlatformMargin = Math.max(
    0,
    netCashReceived - (totalResellerProfits + totalSupplierWholesale)
  );

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === unreconciledDeliveredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(unreconciledDeliveredOrders.map((o) => o.id));
    }
  };

  const handleExecuteReconciliation = () => {
    if (targetOrders.length === 0) {
      onShowToast('الرجاء اختيار طلبية واحدة على الأقل للمطابقة والتسوية', 'error');
      return;
    }

    const { batch, updatedOrders } = executeCodRemittanceReconciliation({
      courierId: courierName.toLowerCase().replace(/\s+/g, '-'),
      courierName,
      paymentReference,
      paymentMethod,
      orders: targetOrders,
      courierShippingFeePerOrder: shippingFeePerOrder,
      reconciledBy: 'مدير المحاسبة والمالية المركزية',
    });

    onOrdersUpdated(updatedOrders);
    setPastBatches(getStoredCodRemittances());
    setSelectedOrderIds([]);
    onShowToast(
      `🎉 تمت التسوية والمطابقة بنجاح! تم توزيع أرباح المسوقين ومستحقات الموردين لـ ${targetOrders.length} طلبية.`,
      'success'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-gradient-to-r from-slate-50 to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  مطابقة تحصيلات الـ COD وصرف مستحقات شركات التوصيل
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-black border border-emerald-200 dark:border-emerald-800">
                  {unreconciledDeliveredOrders.length} طلبية بانتظار التسوية
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                مطابقة حوالات استرجاع أموال الدفع عند الاستلام من شركات التوصيل وتوزيع أرباح المسوقين ومستحقات الموردين آلياً.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-300" />
              <span>طباعة كشف المطابقة</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('reconcile')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'reconcile'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>1. إجراء تسوية حوالة جديدة (New Remittance)</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-[10px]">
              {targetOrders.length} طلبية
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>2. سجل الحوالات والتسويات المعتمدة ({pastBatches.length})</span>
          </button>
        </div>

        {/* TAB 1: NEW RECONCILIATION */}
        {activeTab === 'reconcile' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* Input Form for Remittance info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  شركة التوصيل المحولة:
                </label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="Yalidine Express">Yalidine Express</option>
                  <option value="Zimou Express">Zimou Express</option>
                  <option value="E-com Delivery">E-com Delivery</option>
                  <option value="Procolis Delivery">Procolis Delivery</option>
                  <option value="Maystro Delivery">Maystro Delivery</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  رقم وصل / إشعار الحوالة (Référence):
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                  placeholder="VIR-CCP-12345678"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  طريقة التحويل / الاستلام:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="CCP">حوالة بريدية CCP</option>
                  <option value="BARIDIMOB">تطبيق بريدي موب BaridiMob</option>
                  <option value="BANK_TRANSFER">تحويل بنكي Virement Bancaire</option>
                  <option value="CASH">استلام نقدي مباشر للمستودع</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  تكلفة التوصيل الافتراضية للطلب:
                </label>
                <input
                  type="number"
                  value={shippingFeePerOrder}
                  onChange={(e) => setShippingFeePerOrder(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                />
              </div>
            </div>

            {/* Financial Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">إجمالي كاش الـ COD المحصل</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono block">
                  <MoneyText amount={totalCodCollected} />
                </span>
                <span className="text-[10px] text-slate-400 block">{targetOrders.length} طلبية</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 shadow-xs space-y-1">
                <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold block">أجرة شحن شركة التوصيل (-)</span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono block">
                  -<MoneyText amount={totalShippingFeeDeduction} />
                </span>
                <span className="text-[10px] text-rose-500 block">مقتطعة آلياً</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 shadow-xs space-y-1">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">صافي الحوالة المستلمة (=)</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                  <MoneyText amount={netCashReceived} />
                </span>
                <span className="text-[10px] text-emerald-500 block">في حساب المنصة</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 shadow-xs space-y-1">
                <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold block">أرباح عمولات المسوقين</span>
                <span className="text-base font-black text-purple-600 dark:text-purple-400 font-mono block">
                  <MoneyText amount={totalResellerProfits} />
                </span>
                <span className="text-[10px] text-purple-500 block">تضاف للمحافظ فوراً</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shadow-xs space-y-1">
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block">مستحقات سلع الموردين</span>
                <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono block">
                  <MoneyText amount={totalSupplierWholesale} />
                </span>
                <span className="text-[10px] text-amber-500 block">متاحة للسحب باللوحة</span>
              </div>
            </div>

            {/* Orders Selection Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="font-black text-emerald-700 dark:text-emerald-400 cursor-pointer flex items-center gap-1.5"
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedOrderIds.length === unreconciledDeliveredOrders.length &&
                        unreconciledDeliveredOrders.length > 0
                      }
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-emerald-600 pointer-events-none"
                    />
                    <span>
                      {selectedOrderIds.length === unreconciledDeliveredOrders.length
                        ? 'إلغاء تحديد الكل'
                        : 'تحديد كامل الطلبيات المسلمة للمطابقة'}
                    </span>
                  </button>
                </div>
                <span className="text-slate-500 font-mono font-bold">
                  تم تحديد {targetOrders.length} من أصل {unreconciledDeliveredOrders.length}
                </span>
              </div>

              <div className="max-h-[35vh] overflow-y-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2.5 text-center w-10">تحديد</th>
                      <th className="p-2.5 text-start">رقم التتبع</th>
                      <th className="p-2.5 text-start">الزبون والولاية</th>
                      <th className="p-2.5 text-start">المسوق</th>
                      <th className="p-2.5 text-end">كاش الـ COD</th>
                      <th className="p-2.5 text-end">أرباح المسوق</th>
                      <th className="p-2.5 text-end">مستحقات المورد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {unreconciledDeliveredOrders.map((ord) => {
                      const isSelected = selectedOrderIds.includes(ord.id);
                      const cod = (Number(ord.totalAmount) || 0) + (Number(ord.shippingFee) || 0);
                      const wholesale = ord.items.reduce((s, it) => s + (it.wholesalePrice || 2000) * (it.quantity || 1), 0);

                      return (
                        <tr
                          key={ord.id}
                          onClick={() => toggleSelectOrder(ord.id)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOrder(ord.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                            />
                          </td>
                          <td className="p-2.5 font-mono font-black text-purple-600 dark:text-purple-400">
                            {ord.trackingCode || `DZ-${ord.id}`}
                          </td>
                          <td className="p-2.5 font-bold">
                            {ord.customerName} <span className="text-slate-400 text-[11px]">({ord.wilaya})</span>
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300">
                            {ord.resellerName || 'مسوق المنصة'}
                          </td>
                          <td className="p-2.5 text-end font-mono font-black">
                            <MoneyText amount={cod} />
                          </td>
                          <td className="p-2.5 text-end font-mono font-bold text-purple-600 dark:text-purple-400">
                            +<MoneyText amount={ord.totalProfit} />
                          </td>
                          <td className="p-2.5 text-end font-mono font-bold text-amber-600 dark:text-amber-400">
                            <MoneyText amount={wholesale} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* EXECUTE BAR */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-wrap justify-between items-center gap-3">
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                ⚡ <strong>التوزيع الآلي الذكي:</strong> عند الضغط على تأكيد التسوية، سيتم إيداع أرباح المسوقين بمحافظهم تلقائياً، وإضافة مستحقات الموردين للرصيد القابل للسحب، وتغيير حالة الطرود إلى "تمت المطابقة مع شركة الشحن".
              </div>

              <button
                disabled={targetOrders.length === 0}
                onClick={handleExecuteReconciliation}
                className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-md transition ${
                  targetOrders.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-600/30'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>تأكيد المطابقة وصرف المستحقات آلياً ({targetOrders.length} طلبية)</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: REMITTANCE HISTORY */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {pastBatches.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                لا توجد تسويات حوالات سابقة مسجلة بعد.
              </div>
            ) : (
              pastBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex flex-wrap justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {batch.batchNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black border border-emerald-300">
                        ✔ مطابقة مسددة
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        شركة التوصيل: {batch.courierName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-500 text-[11px]">
                        وصل: <strong>{batch.paymentReference}</strong> ({batch.paymentMethod})
                      </span>
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        صافي المحول: <MoneyText amount={batch.netPayoutDzd} />
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">إجمالي COD المحصل:</span>
                      <strong><MoneyText amount={batch.totalCodCollectedDzd} /></strong>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">أجرة الشحن المقتطعة:</span>
                      <strong><MoneyText amount={batch.courierShippingFeesDzd} /></strong>
                    </div>
                    <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded-xl text-purple-700 dark:text-purple-300">
                      <span className="block text-[10px]">عمولات المسوقين المصروفة:</span>
                      <strong><MoneyText amount={batch.totalResellerProfitsDzd} /></strong>
                    </div>
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-xl text-amber-700 dark:text-amber-300">
                      <span className="block text-[10px]">مستحقات الموردين:</span>
                      <strong><MoneyText amount={batch.totalSupplierWholesaleDzd} /></strong>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                    <span>تاريخ التسوية: {new Date(batch.reconciledAt).toLocaleString('ar-DZ')}</span>
                    <span>المشرف: {batch.reconciledBy || 'مسؤول الحسابات'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};
