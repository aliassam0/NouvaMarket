import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Package,
  Boxes,
  Truck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Store,
  DollarSign,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Tag,
  MessageCircle,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  AlertTriangle,
  XCircle,
  Check,
  RefreshCw,
  ZoomIn,
} from 'lucide-react';
import { Order } from '../../types';

export interface CustomerOrderReviewModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmOrder?: (order: Order, note?: string) => Promise<void> | void;
  onLogCallResult?: (
    order: Order,
    resultId: string,
    resultLabel: string,
    note?: string
  ) => Promise<void> | void;
}

const CALL_OUTCOMES = [
  {
    id: 'answered_confirmed',
    label: 'تم الرد والتأكيد بنجاح ✅',
    shortLabel: 'تم التأكيد ✅',
    color: 'emerald',
    description: 'الزبون أكد الطلبية والعنوان وجاهز للاستلام',
  },
  {
    id: 'no_answer_1',
    label: 'لم يرد (محاولة 1) 📞',
    shortLabel: 'لم يرد 1 📞',
    color: 'amber',
    description: 'تم الاتصال بالرقم ولم يتم الرد (المحاولة الأولى)',
  },
  {
    id: 'no_answer_2',
    label: 'لم يرد (محاولة 2) 📞',
    shortLabel: 'لم يرد 2 📞',
    color: 'orange',
    description: 'المحاولة الثانية ولم يتم الرد',
  },
  {
    id: 'busy',
    label: 'الخط مشغول ⏳',
    shortLabel: 'مشغول ⏳',
    color: 'blue',
    description: 'الخط مشغول حالياً، إعادة الاتصال لاحقاً',
  },
  {
    id: 'switched_off',
    label: 'الهاتف مغلق / غير متاح 📵',
    shortLabel: 'مغلق 📵',
    color: 'slate',
    description: 'الهاتف خارج التغطية أو مغلق',
  },
  {
    id: 'callback_later',
    label: 'طلب إعادة الاتصال لاحقاً ⏰',
    shortLabel: 'إعادة اتصال ⏰',
    color: 'purple',
    description: 'الزبون طلب الاتصال به في وقت محدد آخر',
  },
  {
    id: 'cancelled_by_customer',
    label: 'الزبون ألغى الطلب ❌',
    shortLabel: 'ألغى الطلب ❌',
    color: 'rose',
    description: 'الزبون صرّح صراحة بعدم رغبته في استلام الطلبية',
  },
  {
    id: 'wrong_info',
    label: 'رقم أو عنوان خاطئ ⚠️',
    shortLabel: 'بيانات خاطئة ⚠️',
    color: 'red',
    description: 'الرقم غير مخصص أو العنوان غير موجود',
  },
];

export const CustomerOrderReviewModal: React.FC<CustomerOrderReviewModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmOrder,
  onLogCallResult,
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<string>('answered_confirmed');
  const [callNote, setCallNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const totalAmount = (order.totalAmount || 0) + (order.shippingFee || 0);
  const items = order.items || [];
  const hasCrossSell =
    order.isCrossSell ||
    items.some((i) => i.isCrossSell) ||
    order.status === ('LINK_ORDER' as any) ||
    order.source === 'SUPPLIER_LINK';

  const handleOpenWhatsApp = () => {
    let cleanPhone = order.phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '213' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('213')) {
      cleanPhone = '213' + cleanPhone;
    }
    const message = encodeURIComponent(
      `السلام عليكم أخي/أختي ${order.customerName}، معكم مصلحة تأكيد وتوصيل طلبيات منصة Nouva Market بخصوص طلبيتكم رقم #${order.trackingCode || order.id} بمبلغ ${totalAmount.toLocaleString()} دج. هل أنتم جاهزون لتأكيد الاستلام؟`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleQuickConfirm = async () => {
    if (!onConfirmOrder) return;
    setIsSubmitting(true);
    try {
      await onConfirmOrder(order, callNote.trim() || 'تم الاتصال بالزبون وتأكيد مشترياته وتثبيت العنوان بنجاح');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCallOutcome = async () => {
    setIsSubmitting(true);
    try {
      if (selectedOutcome === 'answered_confirmed' && onConfirmOrder) {
        await onConfirmOrder(order, callNote.trim() || 'تم الاتصال وتأكيد الطلبية هاتفياً');
      } else if (onLogCallResult) {
        const outcomeObj = CALL_OUTCOMES.find((o) => o.id === selectedOutcome);
        await onLogCallResult(
          order,
          selectedOutcome,
          outcomeObj?.label || selectedOutcome,
          callNote.trim()
        );
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 max-h-[94vh] flex flex-col text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="relative bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0">
              <Boxes className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black bg-white/20 px-2.5 py-0.5 rounded-full border border-white/25">
                  #{order.trackingCode || order.id}
                </span>
                {hasCrossSell && (
                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-slate-900" />
                    <span>طرد موحد / منتج إضافي 🔥</span>
                  </span>
                )}
                {order.adminConfirmed ? (
                  <span className="text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                    مؤكدة ومحالة للمستودع ✅
                  </span>
                ) : (
                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                    بانتظار التأكيد ⏳
                  </span>
                )}
              </div>
              <h3 className="font-black text-base sm:text-lg leading-tight mt-1 flex items-center gap-2">
                <span>مراجعة مشتريات الزبون:</span>
                <span className="text-amber-200">{order.customerName}</span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* ============================================================ */}
          {/* 1. FIRST SECTION: CUSTOMER PURCHASES WITH PHOTOS & DETAILS */}
          {/* ============================================================ */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-slate-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-slate-900/60 border-2 border-purple-200/80 dark:border-purple-800/60 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-purple-200/60 dark:border-purple-800/40">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-purple-600 text-white shadow-xs">
                  <Package className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-purple-900 dark:text-purple-300">
                    مشتريات الزبون بالصور والمنتجات 👁️
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    تحقق من المنتجات، المقاسات، الألوان والكميات المطلوبة قبل الاتصال
                  </p>
                </div>
              </div>
              <span className="font-bold text-xs px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                {items.length || 1} {items.length > 1 ? 'منتجات' : 'منتج'}
              </span>
            </div>

            {/* Product Cards List */}
            <div className="space-y-2.5">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-purple-300 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Product Thumbnail with Click-to-Zoom */}
                      <div
                        className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs cursor-pointer group"
                        onClick={() => item.productImage && setZoomedImage(item.productImage)}
                        title="انقر لتكبير الصورة"
                      >
                        {item.productImage ? (
                          <>
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <ZoomIn className="w-4 h-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-7 h-7 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                            {item.productName}
                          </h5>
                          {item.isCrossSell && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                              كروس سيل 🔥
                            </span>
                          )}
                        </div>

                        {/* Variants (Size & Color) */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                          {item.variantSize && item.variantSize !== 'Standard' && (
                            <span className="font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              المقاس: {item.variantSize}
                            </span>
                          )}
                          {item.variantColor && item.variantColor !== 'Standard' && (
                            <span className="font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              اللون: {item.variantColor}
                            </span>
                          )}
                          {item.supplierName && (
                            <span className="text-slate-400 text-[10px]">
                              المورد: {item.supplierName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Unit Price */}
                    <div className="flex items-center sm:flex-col justify-between sm:items-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                      <span className="font-mono font-black text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        الكمية: ×{item.quantity}
                      </span>
                      <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                        {((item.sellingPrice || item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()} دج
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-center text-xs text-slate-500">
                  تفاصيل المنتج غير متوفرة
                </div>
              )}
            </div>

            {/* Financial Summary Card */}
            <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/40 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex justify-between items-center sm:flex-col sm:items-start">
                <span className="text-slate-400 text-[11px]">سعر المنتجات:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {(order.totalAmount || 0).toLocaleString()} دج
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex justify-between items-center sm:flex-col sm:items-start">
                <span className="text-slate-400 text-[11px]">مصاريف الشحن ({order.wilaya}):</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {(order.shippingFee || 0).toLocaleString()} دج
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/40 flex justify-between items-center sm:flex-col sm:items-start">
                <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">المبلغ الإجمالي للتحصيل:</span>
                <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
                  {totalAmount.toLocaleString()} دج
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2. SECOND SECTION: CUSTOMER CONTACT & DELIVERY ADDRESS */}
          {/* ============================================================ */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>بيانات الزبون والتوصيل</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                طريقة الاستلام: {order.deliveryType === 'office' ? '🏢 مكتب التوصيل' : '🏠 للمنزل'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Customer Name */}
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">الاسم الكامل:</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {order.customerName}
                  </span>
                </div>
              </div>

              {/* Phone with Direct Call Action */}
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">رقم الهاتف:</span>
                    <a
                      href={`tel:${order.phone}`}
                      className="font-mono font-black text-emerald-600 dark:text-emerald-400 hover:underline"
                      dir="ltr"
                    >
                      {order.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`tel:${order.phone}`}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition"
                  >
                    <Phone className="w-3 h-3" />
                    <span>اتصال</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="p-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-950 dark:text-green-300 transition"
                    title="مراسلة الزبون بالواتساب"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Wilaya & Commune */}
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">الولاية والبلدية:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {order.wilaya} {order.commune ? `- ${order.commune}` : ''}
                  </span>
                </div>
              </div>

              {/* Reseller Info */}
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">المسوق صاحب الطلبية:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {order.resellerName || order.resellerEmail || 'مسوق منصة'}
                  </span>
                </div>
              </div>
            </div>

            {order.address && (
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px]">العنوان التفصيلي:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {order.address}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 3. THIRD SECTION: ONE-CLICK CONFIRMATION & CALL OUTCOME LOG */}
          {/* ============================================================ */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 shadow-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <PhoneCall className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    تسجيل نتيجة الاتصال وتأكيد الطلبية 📞
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    اختر نتيجة المكالمة وانقر على الحفظ مباشرة
                  </p>
                </div>
              </div>
            </div>

            {/* Big Primary One-Click Confirmation Button */}
            {!order.adminConfirmed && (
              <button
                type="button"
                onClick={handleQuickConfirm}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition transform active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                <span>✅ تم الرد وتأكيد الطلبية ونقلها للمستودع فوراً</span>
              </button>
            )}

            {/* Other Call Outcomes (Clean Grid Selector) */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                أو اختر نتيجة أخرى للاتصال:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {CALL_OUTCOMES.filter((o) => o.id !== 'answered_confirmed').map((outcome) => {
                  const isSelected = selectedOutcome === outcome.id;
                  return (
                    <button
                      key={outcome.id}
                      type="button"
                      onClick={() => setSelectedOutcome(outcome.id)}
                      className={`p-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm ring-2 ring-purple-500/40'
                          : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                      title={outcome.description}
                    >
                      <span>{outcome.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Call Note */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-bold text-slate-500 dark:text-slate-400">
                  ملاحظات المكالمة (اختياري):
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCallNote('أكد الزبون الاستلام بعد العصر')}
                    className="text-[10px] text-purple-600 hover:underline"
                  >
                    + بعد العصر
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setCallNote('الزبون طلب إرسال الموقع عبر واتساب')}
                    className="text-[10px] text-purple-600 hover:underline"
                  >
                    + موقع واتساب
                  </button>
                </div>
              </div>
              <textarea
                value={callNote}
                onChange={(e) => setCallNote(e.target.value)}
                placeholder="اكتب ملاحظة للمكالمة، مثل: وقت التوصيل المفضل أو تأكيد بالواتساب..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Submit Non-Confirmed Outcome Button if Selected */}
            {selectedOutcome !== 'answered_confirmed' && (
              <button
                type="button"
                onClick={handleSubmitCallOutcome}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>حفظ وتسجيل نتيجة: {CALL_OUTCOMES.find((o) => o.id === selectedOutcome)?.shortLabel}</span>
              </button>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <a
              href={`tel:${order.phone}`}
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>اتصال مباشر</span>
            </a>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="py-2 px-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>

      {/* LIGHTBOX MODAL FOR PRODUCT PHOTO ZOOM */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-lg max-h-[85vh] p-2 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl">
            <img
              src={zoomedImage}
              alt="صورة المنتج مكبرة"
              className="max-h-[80vh] w-auto object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderReviewModal;
