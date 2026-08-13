import React from 'react';
import { Clock, ShieldAlert, MessageCircle, LogOut, CheckCircle2, Store, Phone, Mail, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../lib/sellerHelper';

interface PendingSellerScreenProps {
  onLogout: () => void;
  onGoToLanding: () => void;
}

export function PendingSellerScreen({ onLogout, onGoToLanding }: PendingSellerScreenProps) {
  const { user } = useAuth();

  const isSupplier = user?.role === 'warehouse';
  const roleLabel = isSupplier ? 'المورد / المصنع' : 'البائع';
  const isSuspended = user?.approvalStatus === 'SUSPENDED';
  const isRejected = user?.approvalStatus === 'REJECTED';

  const whatsappMessage = `مرحباً إدارة Nouva Market، قمت بتسجيل حساب ${roleLabel} جديد باسم (${user?.storeName || user?.fullName}) ورقم (${user?.phone})، وأرغب في تأكيد وتفعيل الحساب.`;
  const whatsappUrl = getWhatsAppUrl('+213550228983', whatsappMessage);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 dir-rtl text-right">
      <div className="max-w-lg w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Glowing Gradient accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Title */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            {isSuspended ? (
              <ShieldAlert className="w-10 h-10 text-rose-500" />
            ) : isRejected ? (
              <ShieldAlert className="w-10 h-10 text-rose-500" />
            ) : (
              <Clock className="w-10 h-10 text-amber-400 animate-pulse" />
            )}
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-black border border-amber-500/30 inline-block mb-2">
              {isSuspended ? 'ACCOUNT SUSPENDED' : isRejected ? 'APPLICATION REJECTED' : 'PENDING ADMIN APPROVAL'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {isSuspended
                ? 'حسابك معلق حالياً'
                : isRejected
                ? 'تم رفض طلب الانضمام'
                : `طلب انضمامك كـ ${roleLabel} قيد المراجعة ⏳`}
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {isSuspended
                ? 'تم تعليق حسابك من قبل إدارة Nouva. يرجى التواصل مع الدعم الفني للاستفسار.'
                : isRejected
                ? `نأسف، تم رفض طلب تسجيل حساب ${roleLabel} الخاص بك من قبل الإدارة.`
                : isSupplier
                ? 'شكراً لتسجيلك كمورد في منصة Nouva Market! لقد تم استلام طلبك وهو حالياً بانتظار موافقة واعتماد الأدمن لتفعيل حسابك وإتاحة إضافة منتجاتك وبناء مخزونك.'
                : 'شكراً لتسجيلك في منصة Nouva Market! لقد تم استلام طلبك وهو حالياً بانتظار موافقة واعتماد الأدمن لتفعيل دخولك الكامل للكتالوج وإنشاء الطلبات.'}
            </p>
          </div>
        </div>

        {/* User Account Info Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
          <h3 className="font-black text-amber-400 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>تفاصيل حساب {roleLabel} المسجل:</span>
            <span className="text-[10px] text-slate-500 font-mono">ID: {user?.id}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">المتجر: <strong className="text-white">{user?.storeName || 'غير محدد'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">الواتساب: <strong className="text-white">{user?.phone || 'غير محدد'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">البريد: <strong className="text-white">{user?.email || 'غير محدد'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">الولاية: <strong className="text-white">{user?.wilaya || 'غير محدد'}</strong></span>
            </div>
          </div>
        </div>

        {/* WhatsApp Contact Action Button */}
        <div className="space-y-3 pt-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>مراسلة الإدارة عبر الواتساب لتسريع التفعيل 💬</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
            <button
              onClick={onGoToLanding}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              الرئيسية 🌐
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
