import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  Phone,
  Building2,
  MapPin,
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  Save,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ALGERIA_WILAYAS } from '../../data/algeriaLocations';

interface ProfilTabProps {
  onOpenDevTools?: () => void;
  onOpenGamification: () => void;
  onShowToast: (msg: string) => void;
  onLogout?: () => void;
}

export function ProfilTab({ onOpenGamification, onShowToast, onLogout }: ProfilTabProps) {
  const { user, updateProfile, updateUserPassword, updateUserEmail, submitKyc, logout } = useAuth();
  const { t } = useLanguage();

  // Profile fields state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [storeName, setStoreName] = useState(user?.storeName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [wilaya, setWilaya] = useState(user?.wilaya || '16 - Alger');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // KYC state
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [cinNumber, setCinNumber] = useState('');
  const [ccpNumber, setCcpNumber] = useState('00219812981 RIP');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    
    // Update basic profile details
    updateProfile({ fullName, storeName, phone, wilaya, email: cleanEmail });

    // Also update email in stored records if changed
    if (cleanEmail && cleanEmail !== user?.email) {
      await updateUserEmail(cleanEmail);
    }

    onShowToast('تم تحديث معلومات الحساب والمتجر بنجاح!');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword.trim()) {
      setPasswordError('يرجى كتابة كلمة المرور الجديدة');
      return;
    }

    if (newPassword.trim().length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة المرور الجديدة غير متطابقة مع تأكيد كلمة المرور');
      return;
    }

    setIsChangingPassword(true);
    const res = await updateUserPassword(newPassword.trim(), currentPassword.trim() || undefined);
    setIsChangingPassword(false);

    if (res.success) {
      onShowToast(res.message);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setPasswordError('');
    } else {
      setPasswordError(res.message);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitKyc(cinNumber, 'front.jpg', 'back.jpg', ccpNumber);
    setIsKycModalOpen(false);
    onShowToast('تم إرسال مستندات الهوية, جاري المراجعة في غضون دقائق!');
  };

  return (
    <div className="flex-1 pb-28 overflow-y-auto p-4 text-slate-900 dark:text-slate-100 space-y-4 max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white font-black text-xl flex items-center justify-center border-2 border-purple-400 shadow-xs shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {user?.fullName || 'حساب البائع'}
            </h2>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-bold block">{user?.storeName || 'اسم المتجر'}</span>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {user?.email && <span>{user.email}</span>}
              {user?.phone && <span>• {user.phone}</span>}
            </div>
          </div>
        </div>

        {/* KYC Status Badge */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {t('profile.kycStatus')}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold">
              مؤكد وموثق (Approved)
            </span>
          </div>
        </div>
      </div>

      {/* Account Details & Email Edit Form */}
      <form onSubmit={handleSaveProfile} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 text-right">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <User className="w-4 h-4 text-purple-600" />
            <span>معلومات الحساب والبريد الإلكتروني</span>
          </h3>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ البيانات</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
          <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 block">الاسم واللقب:</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full py-2 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 block">اسم المتجر / البراند:</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full py-2 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 block">البريد الإلكتروني (لتسجيل الدخول):</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-2 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-left dir-ltr"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 block">رقم الهاتف:</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full py-2 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-slate-600 dark:text-slate-400 block">الولاية:</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full py-2 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
              >
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w.code} value={`${w.code} - ${w.nameAr}`}>
                    {w.code} - {w.nameAr} ({w.nameFr})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </form>

      {/* Security & Password Change Section */}
      <form onSubmit={handleChangePassword} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 text-right">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <span>تغيير كلمة المرور والأمان (Password & Security)</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            عند تغيير كلمة السر، سيتم اعتماد الكلمة الجديدة بشكل صارم لتسجيل الدخول القادم
          </p>
        </div>

        {passwordError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{passwordError}</span>
          </div>
        )}

        <div className="space-y-3 text-xs font-bold">
          <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 block">كلمة المرور الجديدة *</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="أدخل كلمة المرور الجديدة (6 أحرف/أرقام على الأقل)"
                className="w-full py-2.5 pr-9 pl-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400 hover:text-slate-600 transition"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 block">تأكيد كلمة المرور الجديدة *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="أعد كتابة كلمة المرور للتأكيد"
                className={`w-full py-2.5 pr-9 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-mono ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-rose-400'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isChangingPassword || !newPassword}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition disabled:opacity-50"
          >
            <Key className="w-4 h-4" />
            <span>{isChangingPassword ? 'جاري الحفظ...' : 'تحديث وتأكيد كلمة المرور الجديدة'}</span>
          </button>
        </div>
      </form>

      {/* Settings Menu Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase px-1">إعدادات الحساب والمكافآت:</h3>

        {/* Gamification Level Button */}
        <button
          onClick={onOpenGamification}
          className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-bold transition hover:bg-slate-50 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>مستوى الحساب والمكافآت</span>
          </div>
          <span className="text-amber-500">{user?.rankAr || 'المستوى البرونزي'} 🌟</span>
        </button>

        {/* Logout */}
        <button
          onClick={() => {
            logout();
            if (onLogout) onLogout();
          }}
          className="w-full p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-between text-xs font-bold transition hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4" />
            <span>{t('profile.logout')}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
