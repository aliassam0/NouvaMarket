import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Building2,
  Copy,
  Check,
  RefreshCw,
  X,
  Store,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { WhatsAppIcon } from '../tabs/CustomerShareOrderEnhancements';
import { getStoredSuppliers } from '../../lib/supplierHelper';
import { getStoredSellers } from '../../lib/sellerHelper';
import { useAuth } from '../../context/AuthContext';

export interface PendingApprovalData {
  role: 'supplier' | 'reseller';
  fullName: string;
  email: string;
  phone?: string;
  storeOrCompany: string;
  wilaya?: string;
  activityType?: string;
  submittedAt?: string;
  referenceCode?: string;
}

interface EnterprisePendingApprovalModalProps {
  info: PendingApprovalData;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenLogin?: () => void;
  onGoToBrowse?: () => void;
  onEnterDashboard?: () => void;
}

export const EnterprisePendingApprovalModal: React.FC<EnterprisePendingApprovalModalProps> = ({
  info,
  onClose,
  onShowToast,
  onOpenLogin,
  onGoToBrowse,
  onEnterDashboard,
}) => {
  const { user, logout } = useAuth();
  const [copiedRef, setCopiedRef] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isApprovedNow, setIsApprovedNow] = useState(false);

  const isSupplier = info.role === 'supplier';
  const roleLabel = isSupplier ? 'المورّد والمستودع' : 'البائع والمسوق';

  const referenceCode =
    info.referenceCode ||
    (isSupplier ? 'NV-SUP-' : 'NV-SEL-') +
      Math.abs(
        info.email.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0) % 900000 + 100000
      );

  const formattedDate = info.submittedAt
    ? new Date(info.submittedAt).toLocaleString('ar-DZ', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('ar-DZ', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  // Check live approval status from storage or user state
  const handleCheckLiveStatus = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      const lowerEmail = info.email.toLowerCase().trim();
      const phoneClean = (info.phone || '').trim();

      if (isSupplier) {
        const suppliers = getStoredSuppliers();
        const found = suppliers.find(
          (s) =>
            (s.email && s.email.toLowerCase().trim() === lowerEmail) ||
            (phoneClean && s.phone && s.phone.trim() === phoneClean)
        );
        if (found && found.status === 'APPROVED') {
          setIsApprovedNow(true);
          onShowToast('🎉 تهانينا! تمت مصادقة وتفعيل حساب المورد بنجاح من قِبل الإدارة.', 'success');
          return;
        }
      } else {
        const sellers = getStoredSellers();
        const found = sellers.find(
          (s) =>
            (s.email && s.email.toLowerCase().trim() === lowerEmail) ||
            (phoneClean && s.phone && s.phone.trim() === phoneClean)
        );
        if (found && found.approvalStatus === 'APPROVED') {
          setIsApprovedNow(true);
          onShowToast('🎉 تهانينا! تمت مصادقة وتفعيل حساب البائع بنجاح من قِبل الإدارة.', 'success');
          return;
        }
      }

      onShowToast('⏳ طلبك قيد المراجعة لدى الإدارة حالياً. ستدخل تلقائياً فور الموافقة.', 'info');
    }, 600);
  };

  // Background approval detection: if approved, instantly update state
  useEffect(() => {
    if (user?.approvalStatus === 'APPROVED') {
      setIsApprovedNow(true);
      return;
    }

    const checkBackground = () => {
      const lowerEmail = info.email.toLowerCase().trim();
      const phoneClean = (info.phone || '').trim();

      if (isSupplier) {
        const suppliers = getStoredSuppliers();
        const found = suppliers.find(
          (s) =>
            (s.email && s.email.toLowerCase().trim() === lowerEmail) ||
            (phoneClean && s.phone && s.phone.trim() === phoneClean)
        );
        if (found && found.status === 'APPROVED') {
          setIsApprovedNow(true);
        }
      } else {
        const sellers = getStoredSellers();
        const found = sellers.find(
          (s) =>
            (s.email && s.email.toLowerCase().trim() === lowerEmail) ||
            (phoneClean && s.phone && s.phone.trim() === phoneClean)
        );
        if (found && found.approvalStatus === 'APPROVED') {
          setIsApprovedNow(true);
        }
      }
    };

    const interval = setInterval(checkBackground, 3000);
    const handleApprovedEvent = () => setIsApprovedNow(true);
    window.addEventListener('nouva_user_approved', handleApprovedEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('nouva_user_approved', handleApprovedEvent);
    };
  }, [info, user, isSupplier]);

  const handleCopyReference = () => {
    navigator.clipboard.writeText(referenceCode);
    setCopiedRef(true);
    onShowToast('تم نسخ الرمز المرجعي للطلب', 'success');
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleEnterNow = () => {
    if (onEnterDashboard) {
      onEnterDashboard();
    } else {
      onClose();
    }
  };

  const handleBrowseHome = () => {
    if (onGoToBrowse) {
      onGoToBrowse();
    } else {
      onClose();
    }
  };

  const whatsappMessage = encodeURIComponent(
    `مرحباً إدارة Nouva Market،\n` +
      `قمت بتسجيل حساب جديد كـ (${roleLabel}) وأرغب في مراجعة وتفعيل الحساب:\n` +
      `• الرمز المرجعي: ${referenceCode}\n` +
      `• الاسم والنشاط: ${info.fullName} (${info.storeOrCompany})\n` +
      `• البريد الإلكتروني: ${info.email}\n` +
      `• رقم الهاتف: ${info.phone || 'غير مسجل'}\n` +
      `• الولاية: ${info.wilaya || 'الجزائر'}`
  );

  return (
    <div
      id="enterprise-pending-approval-portal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/70 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              {isApprovedNow ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-extrabold text-sm sm:text-base">
                  منصة Nouva Market
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isApprovedNow
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isApprovedNow ? 'حساب معتمد ومفعل ✅' : 'بانتظار موافقة الإدارة ⏳'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isApprovedNow
                  ? 'تم قبول واعتماد ملفك من قِبل إدارة المنصة'
                  : 'طلب انضمامك مسجل بأمان وهو الآن قيد التدقيق'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Main Status Alert Box (if approved) */}
          {isApprovedNow && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 text-emerald-100 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>تهانينا! تمت الموافقة على حسابك بنجاح 🎉</span>
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                تم اعتماد حسابك رسمياً. يمكنك الآن الدخول المباشر إلى لوحة التحكم الخاصة بك للبدء في نشاطك التجاري دون الحاجة لإعادة تسجيل الدخول.
              </p>
            </div>
          )}

          {/* Dossier Card */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">الرمز المرجعي:</span>
                <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm tracking-wider">
                  {referenceCode}
                </span>
              </div>
              <button
                onClick={handleCopyReference}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
              >
                {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRef ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-slate-400 truncate">
                  النشاط: <strong className="text-white">{info.storeOrCompany}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-slate-400 truncate">
                  الصفة: <strong className="text-amber-200">{roleLabel}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-slate-400 truncate">
                  البريد: <strong className="text-white">{info.email}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-400 truncate">
                  الهاتف: <strong className="text-white">{info.phone || 'غير مسجل'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-slate-400 truncate">
                  الولاية: <strong className="text-white">{info.wilaya || '16 - الجزائر'}</strong>
                  <span className="text-[10px] text-slate-500 mr-2">({formattedDate})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            {isApprovedNow ? (
              <button
                onClick={handleEnterNow}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition cursor-pointer"
              >
                <span>الدخول المباشر إلى لوحة التحكم 🚀</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleBrowseHome}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <span>الصفحة الرئيسية</span>
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/213550228983?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-current" />
                    <span>تسريع التفعيل عبر واتساب</span>
                  </a>

                  <button
                    onClick={handleCheckLiveStatus}
                    disabled={isChecking}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer border border-slate-700/60 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-amber-400' : ''}`} />
                    <span>فحص الحالة</span>
                  </button>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
              <span>ستبقى مسجلاً داخل المنصة حتى لو أغلقت النافذة</span>
              {user && (
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="text-slate-400 hover:text-rose-400 transition flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>تسجيل الخروج</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
