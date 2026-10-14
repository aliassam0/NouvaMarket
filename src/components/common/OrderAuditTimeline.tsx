import React from 'react';
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
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';

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

export function OrderAuditTimeline({ order, compact = false }: OrderAuditTimelineProps) {
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
      actor: order.confirmerName || order.assignedConfirmerName || 'فريق التأكيد المركزي',
      actorRole: 'confirmer',
      timestamp: order.confirmedAt,
      isCompleted: isConfirmed,
      isCurrent: isConfirmed && !isPacked && !isCancelled,
      details: order.confirmationNote || (isConfirmed ? 'تم تأكيد العنوان والجاهزية هاتفياً' : 'بانتظار اتصال المؤكد'),
      metaBadge: isConfirmed ? 'تم التأكيد ✅' : 'بانتظار الاتصال',
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
        ? `تعذر التسليم: ${order.failureReason || order.cancellationReason || 'الطلب ملغي/راجع'}`
        : 'بانتظار تسليم الطرد يد بيد للزبون',
      metaBadge: isDelivered ? 'تم التسليم 💰' : isCancelled ? 'ملغي / راجع ❌' : 'قيد الانتظار',
    },
  ];

  if (compact) {
    return (
      <div className="space-y-2 p-3 rounded-2xl bg-white border border-slate-200 text-xs" dir="rtl">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1 text-slate-800">
            <Clock className="w-3.5 h-3.5 text-violet-600" />
            مسار التزامن اللحظي للطلب
          </span>
          <span className="font-mono text-purple-700">#{order.id}</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {steps.map((st) => (
            <div
              key={st.id}
              className={`p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition ${
                st.isCompleted
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : st.isCurrent
                  ? 'bg-violet-50 text-violet-800 border border-violet-300 font-bold ring-2 ring-violet-400/20'
                  : 'bg-slate-50 text-slate-400 border border-slate-100 opacity-60'
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
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span>سجل المزامنة والتدقيق الزمني (Live Audit Trail)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                تزامن فوري ⚡
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              تتبع مسار الطلب لحظة بلحظة عبر الداشبوردات الخمسة دون تعارض أو ازدواجية
            </p>
          </div>
        </div>

        {order.trackingCode && (
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs text-slate-800 flex items-center gap-1.5 font-bold">
            <Truck className="w-3.5 h-3.5 text-violet-600" />
            <span>AWB: {order.trackingCode}</span>
          </div>
        )}
      </div>

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
                      st.isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Node Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 font-black text-xs transition ${
                    st.isCompleted
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : st.isCurrent
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20 animate-pulse ring-4 ring-violet-100'
                      : isCancelled && isLast
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-300'
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
                      ? 'bg-violet-50/70 border-violet-200 shadow-xs'
                      : st.isCompleted
                      ? 'bg-emerald-50/40 border-emerald-100'
                      : 'bg-slate-50/50 border-slate-200/60 opacity-70'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-slate-900">{st.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          st.isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : st.isCurrent
                            ? 'bg-violet-100 text-violet-800'
                            : 'bg-slate-200 text-slate-600'
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

                  <div className="mt-1 text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>المسؤول: <strong>{st.actor}</strong></span>
                  </div>

                  {st.details && (
                    <p className="mt-1.5 text-xs text-slate-600 font-normal bg-white/70 p-2 rounded-lg border border-slate-100">
                      {st.details}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Visibility Matrix Box */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <div className="font-black text-slate-800 flex items-center gap-1.5">
          <EyeIcon className="w-4 h-4 text-violet-600" />
          <span>الرؤية الموحدة الآن عبر الداشبوردات (Single Source of Truth)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-1 text-[11px]">
          <div className="p-2 rounded-lg bg-white border border-slate-200">
            <div className="font-bold text-slate-500">لوحة المؤكد</div>
            <div className="font-black text-slate-900 mt-0.5">
              {isConfirmed ? 'مؤكدة (جاهزة للشحن)' : 'بانتظار الاتصال'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200">
            <div className="font-bold text-slate-500">مستودع المنصة</div>
            <div className="font-black text-slate-900 mt-0.5">
              {isShipped ? 'تم خروج الشحنة' : isPacked ? 'مغلف وجاهز' : isConfirmed ? 'جاهز للتجهيز' : 'غير مرئي بعد'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200">
            <div className="font-bold text-slate-500">لوحة البائع</div>
            <div className="font-black text-slate-900 mt-0.5">
              {isDelivered ? 'تم التسليم والأرباح' : isShipped ? 'في الطريق مع الموزع' : isConfirmed ? 'قيد تجهيز المستودع' : 'قيد التأكيد'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200">
            <div className="font-bold text-slate-500">لوحة المسوّق</div>
            <div className="font-black text-slate-900 mt-0.5">
              {isDelivered ? 'مكتمل وأرباح مودعة' : isShipped ? 'شحنتك خرجت للتوصيل' : isConfirmed ? 'تم التأكيد هاتفياً' : 'قيد المعالجة'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200">
            <div className="font-bold text-slate-500">لوحة الأدمن</div>
            <div className="font-black text-slate-900 mt-0.5">
              رقابة شاملة لحظية ⚡
            </div>
          </div>
        </div>
      </div>
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
