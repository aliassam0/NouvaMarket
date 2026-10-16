import React from 'react';
import { Clock, ShieldAlert, LogOut, Store, Phone, Mail, MapPin, Sparkles, ShoppingBag, CheckCircle2, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../lib/sellerHelper';
import { WhatsAppIcon } from '../tabs/CustomerShareOrderEnhancements';

interface PendingSellerScreenProps {
  onLogout: () => void;
  onGoToLanding: () => void;
}

export function PendingSellerScreen({ onLogout, onGoToLanding }: PendingSellerScreenProps) {
  const { user } = useAuth();

  const isSupplier = user?.role === 'warehouse';
  const roleLabel = isSupplier ? 'البائع (صاحب السلع والمستودع)' : 'المسوّق بالعمولة (المسوق الرقمي)';
  const isSuspended = user?.approvalStatus === 'SUSPENDED';
  const isRejected = user?.approvalStatus === 'REJECTED';

  const whatsappMessage = `مرحباً إدارة Nouva Market، قمت بتسجيل حساب جديد (${roleLabel}) باسم (${user?.storeName || user?.fullName}) ورقم (${user?.phone})، وأنا حالياً في قائمة الانتظار للمراجعة اليدوية، وأرغب في مراجعة وتفعيل الحساب.`;
  const whatsappUrl = getWhatsAppUrl('+213550228983', whatsappMessage);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 dir-rtl text-right">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden">
        {/* Soft Ambient glow */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Title */}
        <div className="text-center space-y-2.5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            {isSuspended || isRejected ? (
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            ) : (
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            )}
          </div>

          <div>
            <span className="px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30 inline-flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              <span>
                {isSuspended
                  ? 'الحساب معلق مؤقتاً'
                  : isRejected
                  ? 'تم رفض الطلب'
                  : 'قائمة الانتظار (حتى التوسع) ⏳'}
              </span>
            </span>

            <h2 className="text-lg sm:text-2xl font-black text-white">
              {isSuspended
                ? 'حسابك معلق حالياً'
                : isRejected
                ? 'تم رفض طلب الانضمام'
                : 'طلبك في قائمة الانتظار للمراجعة اليدوية'}
            </h2>

            {!isSuspended && !isRejected && (
              <div className="mt-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-xs text-amber-200/90 leading-relaxed text-right space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-300">
                  <span>📌 تنبيه بخصوص قبول الحسابات:</span>
                </p>
                <p>
                  قبول الحسابات الجديدة <strong>لا يتم أوتوماتيكياً</strong>؛ يتم فحص ومراجعة كل ملف يدوياً من قِبل إدارة Nouva Market، ويتم تفعيل الحسابات تدريجياً بحسب القدرة الاستيعابية لمواكبة التوسع.
                </p>
                <p className="text-[11px] text-amber-300/80">
                  ✨ ستبقى متصلاً بالمنصة؛ بمجرد اعتماد الإدارة لحسابك يدوياً، ستدخل تلقائياً إلى لوحة التحكم فوراً.
                </p>
              </div>
            )}

            {(isSuspended || isRejected) && (
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {isSuspended
                  ? 'تم تعليق الحساب من قِبل الإدارة. يرجى التواصل مع الدعم الفني للاستفسار.'
                  : 'نأسف، لم تتم الموافقة على طلب تسجيل الحساب من قِبل الإدارة في الوقت الحالي.'}
              </p>
            )}
          </div>
        </div>

        {/* User Account Info Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="font-bold text-amber-400 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-purple-400" />
              <span>بيانات ملفك المسجل في قائمة الانتظار:</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">ID: {user?.id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-300">
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">المتجر/النشاط: <strong className="text-white">{user?.storeName || 'غير محدد'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">الهاتف: <strong className="text-white font-mono">{user?.phone || 'غير محدد'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">البريد: <strong className="text-white font-mono">{user?.email || 'غير محدد'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">الولاية: <strong className="text-white">{user?.wilaya || 'غير محدد'}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current" />
            <span>مراسلة الإدارة عبر الواتساب لتسريع التفعيل والمراجعة 💬</span>
          </a>

          <button
            onClick={onGoToLanding}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700"
          >
            <ShoppingBag className="w-4 h-4 text-purple-400" />
            <span>العودة إلى الصفحة الرئيسية</span>
          </button>

          <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>نظام الفحص اللحظي متصل 🟢</span>
            </span>
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-400 transition flex items-center gap-1 cursor-pointer font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
