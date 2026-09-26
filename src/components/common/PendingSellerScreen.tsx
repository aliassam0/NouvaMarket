import React from 'react';
import { Clock, ShieldAlert, LogOut, Store, Phone, Mail, MapPin, Sparkles, ShoppingBag } from 'lucide-react';
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
  const roleLabel = isSupplier ? 'المورّد والمستودع' : 'البائع والمسوق';
  const isSuspended = user?.approvalStatus === 'SUSPENDED';
  const isRejected = user?.approvalStatus === 'REJECTED';

  const whatsappMessage = `مرحباً إدارة Nouva Market، قمت بتسجيل حساب (${roleLabel}) جديد باسم (${user?.storeName || user?.fullName}) ورقم (${user?.phone})، وأرغب في مراجعة وتفعيل الحساب.`;
  const whatsappUrl = getWhatsAppUrl('+213550228983', whatsappMessage);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 dir-rtl text-right">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden">
        {/* Soft Ambient glow */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

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
            <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 inline-block mb-1.5">
              {isSuspended ? 'الحساب معلق مؤقتاً' : isRejected ? 'تم رفض الطلب' : 'حساب مسجل وبانتظار موافقة الإدارة ⏳'}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {isSuspended
                ? 'حسابك معلق حالياً'
                : isRejected
                ? 'تم رفض طلب الانضمام'
                : `طلب انضمامك كـ ${roleLabel} قيد المراجعة`}
            </h2>
            {(isSuspended || isRejected) && (
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {isSuspended
                  ? 'تم تعليق الحساب من قِبل الإدارة. يرجى التواصل مع الدعم الفني للاستفسار.'
                  : 'نأسف، لم تتم الموافقة على طلب تسجيل الحساب من قِبل الإدارة.'}
              </p>
            )}
          </div>
        </div>

        {/* User Account Info Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="font-bold text-amber-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>بيانات حسابك المسجل:</span>
            <span className="text-[10px] text-slate-400 font-mono">ID: {user?.id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">المتجر/النشاط: <strong className="text-white">{user?.storeName || 'غير محدد'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">الهاتف: <strong className="text-white">{user?.phone || 'غير محدد'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">البريد: <strong className="text-white">{user?.email || 'غير محدد'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">الولاية: <strong className="text-white">{user?.wilaya || 'غير محدد'}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={onGoToLanding}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>الصفحة الرئيسية</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current" />
            <span>مراسلة الإدارة عبر الواتساب لتسريع التفعيل 💬</span>
          </a>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
            <span>المزامنة التلقائية مفعلة 🟢</span>
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-400 transition flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
