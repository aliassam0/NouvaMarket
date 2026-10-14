import React, { useState } from 'react';
import {
  Clock,
  PhoneCall,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  User,
  Building2,
  Headphones,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  MapPin,
  Calendar,
  Check,
  RefreshCw,
  Sparkles,
  Eye,
  AlertTriangle,
  Boxes,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { CustomerOrderReviewModal } from './CustomerOrderReviewModal';

interface OrderAuditTimelineProps {
  order: Order;
  compact?: boolean;
}

export interface TimelineStep {
  id: string;
  stepNumber: number;
  title: string;
  actor: string;
  actorRole: 'seller' | 'confirmer' | 'warehouse' | 'courier' | 'customer';
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
  details?: string;
  metaBadge?: string;
}

const CALL_OUTCOMES_OPTIONS = [
  { id: 'no_answer_1', label: 'لم يرد 1 📞', shortLabel: 'لم يرد 1 📞' },
  { id: 'no_answer_2', label: 'لم يرد 2 📞', shortLabel: 'لم يرد 2 📞' },
  { id: 'busy', label: 'مشغول ⏳', shortLabel: 'مشغول ⏳' },
  { id: 'switched_off', label: 'مغلق 📵', shortLabel: 'مغلق 📵' },
  { id: 'callback_later', label: 'إعادة اتصال ⏰', shortLabel: 'إعادة اتصال ⏰' },
  { id: 'cancelled_by_customer', label: 'ألغى الطلب ❌', shortLabel: 'ألغى الطلب ❌' },
  { id: 'wrong_info', label: 'بيانات خاطئة ⚠️', shortLabel: 'بيانات خاطئة ⚠️' },
];

export function OrderAuditTimeline({ order, compact = false }: OrderAuditTimelineProps) {
  const { user } = useAuth();
  const { confirmOrderByAgent, logConfirmerCall, updateOrderTrackingFollowup } = useOrders();

  const [selectedOutcome, setSelectedOutcome] = useState<string>('answered_confirmed');
  const [callNote, setCallNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  // Determine timeline progress based on unified order state
  const isCreated = true;
  const isConfirmed = Boolean(
    order.adminConfirmed ||
    order.status === 'CONFIRMED' ||
    order.status === 'PROCESSING' ||
    order.status === 'SHIPPED' ||
    order.status === 'DELIVERED'
  );
  const isPacked = Boolean(
    order.situation === 'Emballé' ||
    order.status === 'PROCESSING' ||
    order.status === 'SHIPPED' ||
    order.status === 'DELIVERED'
  );
  const isShipped = Boolean(
    order.status === 'SHIPPED' ||
    order.status === 'DELIVERED' ||
    order.deliveryCompanySent
  );
  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = order.status === 'CANCELLED' || order.status === 'FAILED';

  // Permission check for intervention: STRICTLY restricted to Admin and Confirmer.
  // Completely hidden for Marketers (المسوق) and Sellers (البائع) so they only see real-time synchronized status.
  const canIntervene = Boolean(
    user?.role === 'admin' || user?.role === 'confirmer'
  );

  const getActorLabel = () => {
    if (user?.role === 'admin') return 'مدير النظام (Admin)';
    return user?.fullName || 'فريق التأكيد المركزي';
  };

  const handleInstantConfirm = async () => {
    setIsSubmitting(true);
    try {
      const agent = {
        id: user?.id || 'admin',
        fullName: getActorLabel(),
      };
      await confirmOrderByAgent(
        order.id,
        agent,
        callNote.trim() || 'تم الاتصال وتأكيد الطلبية هاتفياً وتجهيزها للإرسال'
      );
      setFeedbackMessage('✔ تم تأكيد الطلبية بنجاح وتزامنها لحظياً مع الإدارة والمستودع والمسوق!');
      setCallNote('');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCallOutcome = async (outcomeLabel: string) => {
    setIsSubmitting(true);
    try {
      const agent = {
        id: user?.id || 'admin',
        fullName: getActorLabel(),
      };
      logConfirmerCall(order.id, agent, outcomeLabel, callNote.trim());

      // If customer cancelled or wrong info, trigger cancellation without retour label
      if (outcomeLabel.includes('ألغى الطلب') || outcomeLabel.includes('بيانات خاطئة')) {
        updateOrderTrackingFollowup(
          order.id,
          agent.id,
          'CANCELLED',
          callNote.trim() || outcomeLabel,
          agent.fullName
        );
      }

      setFeedbackMessage(`✔ تم تسجيل نتيجة الاتصال (${outcomeLabel}) وتزامنها لحظياً!`);
      setCallNote('');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: TimelineStep[] = [
    {
      id: 'creation',
      stepNumber: 1,
      title: '1. إنشاء الطلبية وحجز المخزون',
      actor: order.resellerName || order.resellerEmail || 'المسوّق',
      actorRole: 'seller',
      timestamp: order.createdAt,
      isCompleted: isCreated,
      isCurrent: !isConfirmed && !isCancelled,
      details: `الزبون: ${order.customerName} (${order.wilaya}) - إجمالي: ${order.totalAmount.toLocaleString()} دج`,
      metaBadge: 'حجز مؤقت',
    },
    {
      id: 'confirmation',
      stepNumber: 2,
      title: '2. الاتصال والتأكيد الهاتفي',
      actor: isConfirmed
        ? (order.confirmerName || 'مدير النظام (Admin)')
        : (order.assignedConfirmerName || order.confirmerName || 'مدير النظام (Admin)'),
      actorRole: 'confirmer',
      timestamp: isConfirmed ? order.confirmedAt : (order.lastCallDate || undefined),
      isCompleted: isConfirmed,
      isCurrent: !isConfirmed && !isCancelled,
      details: isConfirmed
        ? (order.confirmationNote || 'تم تأكيد العنوان والجاهزية هاتفياً بنجاح')
        : (order.lastCallResult
            ? `آخر نتيجة اتصال: ${order.lastCallResult}${order.confirmationNote ? ' | ' + order.confirmationNote : ''}`
            : 'بانتظار الاتصال بالزبون للتأكيد والتثبيت'),
      metaBadge: isConfirmed
        ? 'تم التأكيد ✅'
        : (order.lastCallResult || 'بانتظار الاتصال'),
    },
    {
      id: 'packing',
      stepNumber: 3,
      title: '3. تجهيز وتغليف مستودع المنصة',
      actor: 'مستودع المنصة',
      actorRole: 'warehouse',
      timestamp: order.bordereauCreatedAt || (isPacked ? order.confirmedAt : undefined),
      isCompleted: isPacked,
      isCurrent: isPacked && !isShipped && !isCancelled,
      details: order.trackingCode ? `بوليصة الشحن (AWB): ${order.trackingCode}` : 'جاري الفحص بالباركود والتغليف المحكم',
      metaBadge: isPacked ? 'مغلف وجاهز 📦' : 'قيد التجهيز',
    },
    {
      id: 'shipping',
      stepNumber: 4,
      title: '4. خروج الشحنة مع شركة التوصيل',
      actor: order.deliveryCompanyName || order.driverCompany || 'شركة التوصيل الشريكة',
      actorRole: 'courier',
      timestamp: isShipped ? order.confirmedAt : undefined,
      isCompleted: isShipped,
      isCurrent: isShipped && !isDelivered && !isCancelled,
      details: order.trackingCode ? `كود التتبع: ${order.trackingCode}` : 'في انتظار استلام مندوب الشحن',
      metaBadge: isShipped ? 'في الطريق 🚚' : 'بانتظار الشاحنة',
    },
    {
      id: 'delivery',
      stepNumber: 5,
      title: '5. التسليم النهائي وتحصيل الـ COD',
      actor: `الزبون: ${order.customerName}`,
      actorRole: 'customer',
      timestamp: order.deliveredAt,
      isCompleted: isDelivered,
      isCurrent: isDelivered,
      details: isDelivered
        ? `تم التحصيل بنجاح - إيداع عمولة المسوق (${(order.totalProfit || 0).toLocaleString()} دج) ومستحقات البائع`
        : isCancelled
        ? (isShipped
            ? `تعذر التسليم: ${order.failureReason || 'فشل التسليم / مرتجع'}`
            : `الطلب ملغى قبل خروجه للشحن: ${order.cancellationReason || order.statusAr || 'ألغى الزبون'}`)
        : 'بانتظار تسليم الطرد يد بيد للزبون',
      metaBadge: isDelivered
        ? 'تم التسليم 💰'
        : isCancelled
        ? (isShipped ? 'فشل تسليم / مرتجع ❌' : 'ملغي قبل الشحن ❌')
        : 'قيد الانتظار',
    },
  ];

  if (compact) {
    return (
      <div className="space-y-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs" dir="rtl">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1 text-slate-800 dark:text-slate-200">
            <Clock className="w-3.5 h-3.5 text-violet-600" />
            مسار التزامن اللحظي للطلب
          </span>
          <span className="font-mono text-purple-700 dark:text-purple-300">#{order.trackingCode || order.id}</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {steps.map((st) => (
            <div
              key={st.id}
              className={`p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition ${
                st.isCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : st.isCurrent
                  ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-700 font-bold ring-2 ring-violet-400/20'
                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border border-slate-100 dark:border-slate-800 opacity-60'
              }`}
            >
              {st.isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : st.isCurrent ? (
                <Clock className="w-4 h-4 text-violet-600 animate-pulse" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">
                  {st.stepNumber}
                </span>
              )}
              <span className="text-[10px] leading-tight line-clamp-1">{st.title.split('.')[1]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>مسار الطلبية والتزامن اللحظي (Live Audit Timeline)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                تزامن فوري ⚡
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              تزامن موحد ولحظي بين الإدارة، المسوّق، والمورد لمنع أي تعارض أو أخطاء
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Review Customer Purchases Button */}
          <button
            type="button"
            onClick={() => setShowReviewModal(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-black text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="مراجعة تفاصيل مشتريات الزبون بالصور والمنتجات"
          >
            <Eye className="w-4 h-4 text-purple-600" />
            <span>مشتريات الزبون بالصور 👁️</span>
          </button>

          {order.trackingCode && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-bold">
              <Truck className="w-3.5 h-3.5 text-violet-600" />
              <span>AWB: {order.trackingCode}</span>
            </div>
          )}
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Progress Stepper Line */}
      <div className="relative pt-2 pb-1">
        <div className="space-y-4">
          {steps.map((st, idx) => {
            const isLast = idx === steps.length - 1;

            return (
              <div key={st.id} className="relative flex items-start gap-3.5">
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`absolute top-8 start-4 -translate-x-1/2 w-0.5 h-full ${
                      st.isCompleted ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}

                {/* Node Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 font-black text-xs transition ${
                    st.isCompleted
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : st.isCurrent
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20 animate-pulse ring-4 ring-violet-100 dark:ring-violet-950'
                      : isCancelled && isLast
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {st.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : isCancelled && isLast ? (
                    <XCircle className="w-4 h-4 text-white" />
                  ) : (
                    st.stepNumber
                  )}
                </div>

                {/* Node Content */}
                <div
                  className={`flex-1 p-3.5 rounded-xl border transition ${
                    st.isCurrent
                      ? 'bg-violet-50/70 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900/60 shadow-xs'
                      : st.isCompleted
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/60'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-70'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-slate-900 dark:text-white">{st.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          st.isCompleted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : st.isCurrent
                            ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {st.metaBadge}
                      </span>
                    </div>

                    {st.timestamp && (
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(st.timestamp).toLocaleDateString('ar-DZ')} {new Date(st.timestamp).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>المسؤول: <strong>{st.actor}</strong></span>
                  </div>

                  {st.details && (
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 font-normal bg-white/70 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      {st.details}
                    </p>
                  )}

                  {/* ======================================================== */}
                  {/* DIRECT CALL OUTCOME & CONFIRMATION INTERVENTION PANEL    */}
                  {/* Strictly for Admin and Confirmer - Completely hidden from Marketers and Sellers */}
                  {/* ======================================================== */}
                  {st.id === 'confirmation' && !isConfirmed && canIntervene && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-800 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-black text-xs text-purple-900 dark:text-purple-300">
                          <PhoneCall className="w-4 h-4 text-purple-600 animate-pulse" />
                          <span>
                            {user?.role === 'admin'
                              ? '⚡ تدخل الإدارة للتأكيد الهاتفي الفوري أو تسجيل محاولة الاتصال:'
                              : '⚡ تسجيل نتيجة الاتصال والتأكيد الهاتفي:'}
                          </span>
                        </div>
                        <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                          تزامن لحظي ⚡
                        </span>
                      </div>

                      {/* Primary Action: Instant Confirmation */}
                      <button
                        type="button"
                        onClick={handleInstantConfirm}
                        disabled={isSubmitting}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>✅ تم الرد وتأكيد الطلبية ونقلها للمستودع فوراً</span>
                      </button>

                      {/* Secondary Options: Call Outcomes Grid */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                          أو اختر نتيجة أخرى للاتصال:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {CALL_OUTCOMES_OPTIONS.map((outcome) => {
                            const isSelected = selectedOutcome === outcome.id;
                            return (
                              <button
                                key={outcome.id}
                                type="button"
                                onClick={() => {
                                  setSelectedOutcome(outcome.id);
                                  handleSaveCallOutcome(outcome.shortLabel);
                                }}
                                disabled={isSubmitting}
                                className={`p-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                  isSelected
                                    ? 'bg-purple-600 text-white border-purple-500 shadow-xs ring-2 ring-purple-500/40'
                                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <span>{outcome.shortLabel}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Optional Call Note Input */}
                      <div className="space-y-1 pt-1">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                          ملاحظات المكالمة (اختياري):
                        </label>
                        <input
                          type="text"
                          value={callNote}
                          onChange={(e) => setCallNote(e.target.value)}
                          placeholder="اكتب ملاحظة للمكالمة، مثل: وقت التوصيل المفضل أو تأكيد بالواتساب..."
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Visibility Matrix Box */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
        <div className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <EyeIcon className="w-4 h-4 text-violet-600" />
          <span>الرؤية الموحدة الآن عبر الداشبوردات (Single Source of Truth)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-1 text-[11px]">
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-500">لوحة المؤكد</div>
            <div className="font-black text-slate-900 dark:text-white mt-0.5">
              {isConfirmed ? 'مؤكدة (جاهزة للشحن)' : (order.lastCallResult || 'بانتظار الاتصال')}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-500">مستودع المنصة</div>
            <div className="font-black text-slate-900 dark:text-white mt-0.5">
              {isShipped ? 'تم خروج الشحنة' : isPacked ? 'مغلف وجاهز' : isConfirmed ? 'جاهز للتجهيز' : 'غير مرئي بعد'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-500">لوحة البائع</div>
            <div className="font-black text-slate-900 dark:text-white mt-0.5">
              {isDelivered ? 'تم التسليم والأرباح' : isShipped ? 'في الطريق مع الموزع' : isConfirmed ? 'قيد تجهيز المستودع' : (order.lastCallResult || 'قيد التأكيد')}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-500">لوحة المسوّق</div>
            <div className="font-black text-slate-900 dark:text-white mt-0.5">
              {isDelivered ? 'مكتمل وأرباح مودعة' : isShipped ? 'شحنتك خرجت للتوصيل' : isConfirmed ? 'تم التأكيد هاتفياً' : (order.lastCallResult || 'بانتظار التأكيد')}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-500">لوحة الأدمن</div>
            <div className="font-black text-slate-900 dark:text-white mt-0.5">
              رقابة شاملة لحظية ⚡
            </div>
          </div>
        </div>
      </div>

      {/* Customer Order Review Modal with Photos & Products */}
      {showReviewModal && (
        <CustomerOrderReviewModal
          order={order}
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onConfirmOrder={async (ord, note) => {
            const agent = {
              id: user?.id || 'admin',
              fullName: getActorLabel(),
            };
            await confirmOrderByAgent(ord.id, agent, note || 'تم تأكيد الطلبية هاتفياً بنجاح');
            setShowReviewModal(false);
          }}
          onLogCallResult={async (ord, outcomeId, label, note) => {
            const agent = {
              id: user?.id || 'admin',
              fullName: getActorLabel(),
            };
            logConfirmerCall(ord.id, agent, label, note);
            if (label.includes('ألغى الطلب') || label.includes('بيانات خاطئة')) {
              updateOrderTrackingFollowup(
                ord.id,
                agent.id,
                'CANCELLED',
                note || label,
                agent.fullName
              );
            }
            setShowReviewModal(false);
          }}
        />
      )}
    </div>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
