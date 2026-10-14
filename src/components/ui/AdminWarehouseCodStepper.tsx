import React, { useState } from 'react';
import {
  FileSearch,
  ShieldCheck,
  Clock,
  Printer,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  FileText,
  Zap,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { useOrders } from '../../context/OrderContext';

interface AdminWarehouseCodStepperProps {
  order: Order;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  showActionButtons?: boolean;
}

export function AdminWarehouseCodStepper({
  order,
  onShowToast,
  showActionButtons = true,
}: AdminWarehouseCodStepperProps) {
  const { updateOrderStatus, setTrackingCode, confirmAndShipOrder, confirmAdminOrder, cancelOrderWithReason } = useOrders();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReasonOption, setSelectedReasonOption] = useState('الزبون لا يجيب على الهاتف');
  const [customReasonText, setCustomReasonText] = useState('');

  const isFailed =
    order.status === 'FAILED' ||
    order.status === 'CANCELLED' ||
    order.situation === 'Retour' ||
    order.situation === 'Annulé';
  const isDelivered = order.status === 'DELIVERED' || order.situation === 'Livré';
  const isShipped =
    isDelivered ||
    order.status === 'SHIPPED' ||
    order.avancement === 'En livraison' ||
    order.situation === 'EnTransit';
  const hasLabel =
    isShipped ||
    order.deliveryCompanySent ||
    !!order.trackingCode ||
    order.situation === 'PrêtÀExpédier' ||
    order.situation === 'EnTraitement';
  const isPreparing =
    hasLabel ||
    order.status === 'PROCESSING' ||
    order.situation === 'EnPréparation';
  const isConfirmed =
    isPreparing ||
    order.adminConfirmed ||
    order.status === 'CONFIRMED' ||
    order.isLockedForEdit;

  const steps = [
    {
      id: 1,
      key: 'REVIEW',
      label: 'قيد المراجعة',
      active: !isConfirmed && !isFailed,
      completed: isConfirmed,
      icon: FileSearch,
      color: 'amber',
    },
    {
      id: 2,
      key: 'CONFIRMED',
      label: 'تم التأكيد',
      active: isConfirmed && !isPreparing && !isFailed,
      completed: isPreparing,
      icon: ShieldCheck,
      color: 'purple',
    },
    {
      id: 3,
      key: 'PROCESSING',
      label: 'قيد التحضير',
      active: isPreparing && !hasLabel && !isShipped && !isDelivered && !isFailed,
      completed: hasLabel,
      icon: Clock,
      color: 'violet',
    },
    {
      id: 4,
      key: 'LABEL',
      label: 'إصدار بوليصات الشحن',
      active: hasLabel && !isShipped && !isDelivered && !isFailed,
      completed: isShipped,
      icon: Printer,
      color: 'amber',
    },
    {
      id: 5,
      key: 'SHIPPED',
      label: 'قيد التوصيل',
      active: isShipped && !isDelivered && !isFailed,
      completed: isDelivered,
      icon: Truck,
      color: 'blue',
    },
    {
      id: 6,
      key: 'DELIVERED',
      label: 'تم التسليم',
      active: isDelivered,
      completed: isDelivered,
      icon: CheckCircle2,
      color: 'purple',
    },
    {
      id: 7,
      key: 'FAILED',
      label: 'فشل التسليم / مرتجع',
      active: isFailed,
      completed: isFailed,
      icon: XCircle,
      color: 'rose',
    },
  ];

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 space-y-3">
      {/* Header Info Bar */}
      <div className="flex items-center justify-between text-xs font-black">
        <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
          <Zap className="w-4 h-4 text-amber-500 animate-bounce" />
          <span>مراحل طلبية COD (الأدمن والمستودع):</span>
        </span>
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tight ${
            isFailed
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
              : isDelivered
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
              : isShipped
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
              : hasLabel
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              : isPreparing
              ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border border-violet-300 dark:border-violet-800'
              : isConfirmed
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
          }`}
        >
          {isFailed
            ? '✖ فشل التسليم / مرتجع'
            : isDelivered
            ? '✔ تم التسليم'
            : isShipped
            ? '🚚 قيد التوصيل'
            : hasLabel
            ? '📄 بوليصة الشحن جاهزة'
            : isPreparing
            ? '📦 قيد التحضير بالمستودع'
            : isConfirmed
            ? '🛡️ تم التأكيد'
            : '🔍 قيد المراجعة'}
        </span>
      </div>

      {/* 7 Steps Horizontal Progress Bar */}
      <div className="grid grid-cols-7 gap-1 pt-1">
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <div key={st.id} className="flex flex-col items-center text-center group">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all ${
                  st.id === 7 && isFailed
                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400 dark:ring-rose-800 scale-105'
                    : st.completed
                    ? 'bg-purple-600 text-white shadow-xs'
                    : st.active
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400 dark:ring-purple-700 animate-pulse scale-105'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span
                className={`text-[8px] sm:text-[9px] font-extrabold mt-1.5 leading-tight ${
                  st.id === 7 && isFailed
                    ? 'text-rose-600 dark:text-rose-400 font-black'
                    : st.active || st.completed
                    ? 'text-slate-900 dark:text-white font-black'
                    : 'text-slate-400'
                }`}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Admin & Warehouse Interactive Step Controls */}
      {showActionButtons && (
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
            التحكم السريع بالمراحل (تحديث مباشر لكل الحسابات):
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {!isConfirmed && (
              <>
                <button
                  onClick={() => {
                    confirmAdminOrder(order.id);
                    onShowToast('✔ تم تأكيد الطلب وقفل التعديل على البائع! انتقل إلى تم التأكيد', 'success');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[11px] flex items-center gap-1 transition shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>✔ تأكيد الطلب</span>
                </button>

                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] flex items-center gap-1 transition shadow-sm"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>✖ إلغاء الطلب (مع السبب)</span>
                </button>
              </>
            )}

            {isConfirmed && !isPreparing && (
              <button
                onClick={() => {
                  updateOrderStatus(order.id, 'PROCESSING');
                  onShowToast('✔ 2. تحويل الطلب إلى: قيد التحضير بالمستودع', 'success');
                }}
                className="px-2.5 py-1 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[10px] flex items-center gap-1 transition"
              >
                <Clock className="w-3 h-3" />
                <span>2. قيد التحضير</span>
              </button>
            )}

            {isPreparing && !hasLabel && (
              <button
                onClick={() => {
                  const tracking = order.trackingCode || `YAL-${Math.floor(100000 + Math.random() * 900000)}`;
                  setTrackingCode(order.id, tracking);
                  onShowToast(`✔ 3. تم إصدار بوليصة الشحن برقم: ${tracking}`, 'success');
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[10px] flex items-center gap-1 transition"
              >
                <Printer className="w-3 h-3" />
                <span>3. بوليصات الشحن</span>
              </button>
            )}

            {hasLabel && !isShipped && (
              <button
                onClick={() => {
                  updateOrderStatus(order.id, 'SHIPPED');
                  onShowToast('✔ 4. تحويل الطلب إلى: قيد التوصيل مع الشاحنة', 'success');
                }}
                className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] flex items-center gap-1 transition"
              >
                <Truck className="w-3 h-3" />
                <span>4. قيد التوصيل</span>
              </button>
            )}

            {isShipped && !isDelivered && (
              <button
                onClick={() => {
                  updateOrderStatus(order.id, 'DELIVERED');
                  onShowToast('✔ 5. تم تسليم الطلب وقبض مبلغ COD بنجاح!', 'success');
                }}
                className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[10px] flex items-center gap-1 transition"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>5. تم التسليم</span>
              </button>
            )}

            {!isFailed && !isDelivered && (
              <button
                onClick={() => {
                  updateOrderStatus(order.id, 'FAILED');
                  onShowToast('✖ 6. تسجيل فشل التسليم / مرتجع للطرد', 'info');
                }}
                className="px-2.5 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-[10px] flex items-center gap-1 transition"
              >
                <XCircle className="w-3 h-3 text-rose-600" />
                <span>6. فشل التسليم</span>
              </button>
            )}

            {isFailed && (
              <button
                onClick={() => {
                  updateOrderStatus(order.id, 'PROCESSING');
                  onShowToast('🔄 إعادة الطلب للتحضير والمحاولة مجدداً', 'success');
                }}
                className="px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[10px] flex items-center gap-1 transition"
              >
                <span>إعادة المحاولة</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 relative text-slate-900 dark:text-white">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 end-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black">إلغاء الطلبية #{order.id}</h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              اختر أو اكتب سبب الإلغاء ليتم إشعاره للبائع بشكل فوري وواضح في لوحته:
            </p>

            <div className="space-y-2">
              {[
                'الزبون لا يجيب على الهاتف (أرقام متعددة)',
                'بيانات رقم الهاتف أو العنوان غير صحيحة',
                'الزبون ألغى الطلبية بنفسه',
                'المنتج أو المقاس المطلوب غير متوفر بالمستودع',
                'سبب آخر (كتابة مخصصة)',
              ].map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-bold cursor-pointer transition ${
                    selectedReasonOption === opt
                      ? 'bg-rose-50 border-rose-400 dark:bg-rose-950/40 dark:border-rose-700 text-rose-800 dark:text-rose-200'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`reason-${order.id}`}
                    value={opt}
                    checked={selectedReasonOption === opt}
                    onChange={(e) => setSelectedReasonOption(e.target.value)}
                    className="accent-rose-600"
                  />
                  <span>{opt}</span>
                </label>
              ))}

              {selectedReasonOption === 'سبب آخر (كتابة مخصصة)' && (
                <textarea
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  placeholder="اكتب سبب الإلغاء بالتفصيل للعميل/البائع..."
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                تراجع
              </button>
              <button
                onClick={() => {
                  const finalReason =
                    selectedReasonOption === 'سبب آخر (كتابة مخصصة)'
                      ? customReasonText || 'تم إلغاء الطلبية من المستودع/الأدمن'
                      : selectedReasonOption;

                  cancelOrderWithReason(order.id, finalReason);
                  setShowCancelModal(false);
                  onShowToast(`✖ تم إلغاء الطلبية #{order.id} مع إرسال السبب للبائع`, 'info');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md transition"
              >
                تأكيد الإلغاء وحفظ السبب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
