import React, { useState, useEffect } from 'react';
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
  Target,
  Radio,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Zap,
  Loader2,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ALGERIA_WILAYAS } from '../../data/algeriaLocations';
import { verifyPixelApi, verifyAllPixelsApi, PixelStatusResponse } from '../../lib/pixelTracker';
import { PushNotificationCard } from '../common/PushNotificationCard';


interface PixelStatusBadgeProps {
  id?: string;
  status: 'active' | 'inactive' | 'checking';
  active: boolean;
  message?: string;
  statusCode?: number;
}

function PixelStatusBadge({ id, status, active, message }: PixelStatusBadgeProps) {
  if (status === 'checking') {
    return (
      <div
        id={id}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs animate-pulse shrink-0"
        title="جاري فحص استجابة الـ API..."
      >
        <Loader2 className="w-3 h-3 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>جاري الفحص...</span>
      </div>
    );
  }

  if (active) {
    return (
      <div
        id={id}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs shrink-0"
        title={message || 'البيكسل نشط ومستجيب من الـ API'}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span>نشط</span>
        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 font-bold">
          API 200
        </span>
      </div>
    );
  }

  return (
    <div
      id={id}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs shrink-0"
      title={message || 'البيكسل معطل بناءً على استجابة الـ API'}
    >
      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
      <span>معطل</span>
      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200 font-bold">
        API Inactive
      </span>
    </div>
  );
}

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

  // Social Media Pixels state
  const [metaPixelId, setMetaPixelId] = useState(user?.metaPixelId || '');
  const [tiktokPixelId, setTiktokPixelId] = useState(user?.tiktokPixelId || '');
  const [snapchatPixelId, setSnapchatPixelId] = useState(user?.snapchatPixelId || '');
  const [isSavingPixels, setIsSavingPixels] = useState(false);
  const [isCheckingAll, setIsCheckingAll] = useState(false);

  // Status Badge state for each pixel based on API responses
  interface PixelStatusItem {
    status: 'active' | 'inactive' | 'checking';
    active: boolean;
    message: string;
    statusCode?: number;
    lastChecked?: string;
  }

  const [metaStatus, setMetaStatus] = useState<PixelStatusItem>({
    status: user?.metaPixelId ? 'checking' : 'inactive',
    active: false,
    message: user?.metaPixelId ? 'جاري فحص استجابة الـ API...' : 'معطل (لم يتم إدخال معرّف)',
  });

  const [tiktokStatus, setTiktokStatus] = useState<PixelStatusItem>({
    status: user?.tiktokPixelId ? 'checking' : 'inactive',
    active: false,
    message: user?.tiktokPixelId ? 'جاري فحص استجابة الـ API...' : 'معطل (لم يتم إدخال معرّف)',
  });

  const [snapchatStatus, setSnapchatStatus] = useState<PixelStatusItem>({
    status: user?.snapchatPixelId ? 'checking' : 'inactive',
    active: false,
    message: user?.snapchatPixelId ? 'جاري فحص استجابة الـ API...' : 'معطل (لم يتم إدخال معرّف)',
  });

  // Keep pixel inputs in sync if user changes
  useEffect(() => {
    if (user) {
      setMetaPixelId(user.metaPixelId || '');
      setTiktokPixelId(user.tiktokPixelId || '');
      setSnapchatPixelId(user.snapchatPixelId || '');
    }
  }, [user?.metaPixelId, user?.tiktokPixelId, user?.snapchatPixelId]);

  // Handler to verify a single pixel with the API
  const handleCheckSinglePixel = async (platform: 'meta' | 'tiktok' | 'snapchat', customId?: string) => {
    const rawVal = customId !== undefined ? customId : platform === 'meta' ? metaPixelId : platform === 'tiktok' ? tiktokPixelId : snapchatPixelId;
    const cleanVal = (rawVal || '').trim();

    if (!cleanVal) {
      const emptyState: PixelStatusItem = {
        status: 'inactive',
        active: false,
        message: 'معطل (لم يتم إدخال معرّف البيكسل)',
      };
      if (platform === 'meta') setMetaStatus(emptyState);
      else if (platform === 'tiktok') setTiktokStatus(emptyState);
      else setSnapchatStatus(emptyState);
      return;
    }

    if (platform === 'meta') {
      setMetaStatus(prev => ({ ...prev, status: 'checking', message: 'جاري فحص استجابة الـ API...' }));
    } else if (platform === 'tiktok') {
      setTiktokStatus(prev => ({ ...prev, status: 'checking', message: 'جاري فحص استجابة الـ API...' }));
    } else {
      setSnapchatStatus(prev => ({ ...prev, status: 'checking', message: 'جاري فحص استجابة الـ API...' }));
    }

    try {
      const res = await verifyPixelApi(platform, cleanVal);
      const updatedItem: PixelStatusItem = {
        status: res.active ? 'active' : 'inactive',
        active: res.active,
        message: res.message,
        statusCode: res.statusCode,
        lastChecked: res.lastChecked || new Date().toLocaleTimeString('ar-DZ'),
      };
      if (platform === 'meta') setMetaStatus(updatedItem);
      else if (platform === 'tiktok') setTiktokStatus(updatedItem);
      else setSnapchatStatus(updatedItem);
    } catch {
      const errItem: PixelStatusItem = {
        status: 'inactive',
        active: false,
        message: 'معطل (تعذر الاتصال بالـ API)',
      };
      if (platform === 'meta') setMetaStatus(errItem);
      else if (platform === 'tiktok') setTiktokStatus(errItem);
      else setSnapchatStatus(errItem);
    }
  };

  // Handler to verify all pixels via API
  const handleCheckAllPixels = async () => {
    setIsCheckingAll(true);
    setMetaStatus(prev => ({ ...prev, status: 'checking', message: 'جاري الفحص...' }));
    setTiktokStatus(prev => ({ ...prev, status: 'checking', message: 'جاري الفحص...' }));
    setSnapchatStatus(prev => ({ ...prev, status: 'checking', message: 'جاري الفحص...' }));

    try {
      const res = await verifyAllPixelsApi({
        metaPixelId: metaPixelId.trim(),
        tiktokPixelId: tiktokPixelId.trim(),
        snapchatPixelId: snapchatPixelId.trim(),
      });

      setMetaStatus({
        status: res.meta.active ? 'active' : 'inactive',
        active: res.meta.active,
        message: res.meta.message,
        statusCode: res.meta.statusCode,
        lastChecked: res.meta.lastChecked || new Date().toLocaleTimeString('ar-DZ'),
      });

      setTiktokStatus({
        status: res.tiktok.active ? 'active' : 'inactive',
        active: res.tiktok.active,
        message: res.tiktok.message,
        statusCode: res.tiktok.statusCode,
        lastChecked: res.tiktok.lastChecked || new Date().toLocaleTimeString('ar-DZ'),
      });

      setSnapchatStatus({
        status: res.snapchat.active ? 'active' : 'inactive',
        active: res.snapchat.active,
        message: res.snapchat.message,
        statusCode: res.snapchat.statusCode,
        lastChecked: res.snapchat.lastChecked || new Date().toLocaleTimeString('ar-DZ'),
      });

      onShowToast(`تم فحص استجابة الـ API للبيكسلات: ${res.activeCount} من 3 نشطة`);
    } catch {
      onShowToast('تم تحديث فحص البيكسلات');
    } finally {
      setIsCheckingAll(false);
    }
  };

  // Real-time debounced verification when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleCheckSinglePixel('meta', metaPixelId);
    }, 500);
    return () => clearTimeout(timer);
  }, [metaPixelId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleCheckSinglePixel('tiktok', tiktokPixelId);
    }, 500);
    return () => clearTimeout(timer);
  }, [tiktokPixelId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleCheckSinglePixel('snapchat', snapchatPixelId);
    }, 500);
    return () => clearTimeout(timer);
  }, [snapchatPixelId]);

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

  const handleSavePixels = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPixels(true);
    updateProfile({
      metaPixelId: metaPixelId.trim(),
      tiktokPixelId: tiktokPixelId.trim(),
      snapchatPixelId: snapchatPixelId.trim(),
    });
    try {
      await handleCheckAllPixels();
    } catch {}
    setIsSavingPixels(false);
    onShowToast('✅ تم حفظ إعدادات البيكسل والتحقق من استجابة الـ API بنجاح!');
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

      {/* Instant Push Notifications & PWA Chime Settings */}
      <PushNotificationCard onShowToast={onShowToast} />

      {/* Social Media Pixels Tracking Section (Meta, TikTok, Snapchat) with Status Badges */}
      <form onSubmit={handleSavePixels} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 text-right">

        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5 flex-wrap">
                <span>ربط بيكسل وسائل التواصل الاجتماعي (Pixel Tracking)</span>
                {[metaStatus.active, tiktokStatus.active, snapchatStatus.active].filter(Boolean).length > 0 ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{[metaStatus.active, tiktokStatus.active, snapchatStatus.active].filter(Boolean).length} نشط من 3</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>معطل (0 نشط)</span>
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                تتبع الزيارات وتأكيد المبيعات تلقائياً مع التحقق الحي من استجابة الـ API لكل منصة
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-verify-all-pixels"
              type="button"
              onClick={handleCheckAllPixels}
              disabled={isCheckingAll}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
              title="فحص استجابة الـ API لجميع البيكسلات في آن واحد"
            >
              <Activity className={`w-3.5 h-3.5 ${isCheckingAll ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>{isCheckingAll ? 'جاري الفحص...' : 'فحص استجابة الـ API'}</span>
            </button>
            <button
              id="btn-save-pixel-settings"
              type="submit"
              disabled={isSavingPixels}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingPixels ? 'جاري الحفظ...' : 'حفظ إعدادات البيكسل'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3.5 text-xs font-bold">
          {/* Meta Pixel (Facebook & Instagram) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Radio className="w-4 h-4" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Meta Pixel (Facebook & Instagram)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">معرّف البيكسل الرقمي</span>
            </div>

            {/* Input + Status Badge */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="input-meta-pixel-id"
                  type="text"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  placeholder="مثال: 128495029482710"
                  className={`w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-white font-mono text-left dir-ltr placeholder:text-slate-400 placeholder:text-right transition ${
                    metaStatus.status === 'checking'
                      ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/10'
                      : metaStatus.active
                      ? 'border-emerald-500/80 dark:border-emerald-600 ring-2 ring-emerald-500/10'
                      : metaPixelId.trim()
                      ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {/* مؤشر الحالة (Status Badge) بجانب خانة الإدخال */}
              <div className="flex items-center gap-1.5 shrink-0">
                <PixelStatusBadge
                  id="status-badge-meta-pixel"
                  status={metaStatus.status}
                  active={metaStatus.active}
                  message={metaStatus.message}
                  statusCode={metaStatus.statusCode}
                />
                <button
                  id="btn-recheck-meta-pixel"
                  type="button"
                  onClick={() => handleCheckSinglePixel('meta', metaPixelId)}
                  disabled={metaStatus.status === 'checking'}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50 shrink-0"
                  title="إعادة فحص استجابة الـ API لهذا البيكسل"
                >
                  <RefreshCw className={`w-3 h-3 ${metaStatus.status === 'checking' ? 'animate-spin text-indigo-500' : 'text-slate-400'}`} />
                  <span>فحص</span>
                </button>
              </div>
            </div>

            {/* تفاصيل استجابة الـ API */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium">
              {metaStatus.status === 'checking' ? (
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>جاري فحص استجابة الـ API من خوادم Meta...</span>
                </span>
              ) : metaStatus.active ? (
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{metaStatus.message}</span>
                  {metaStatus.lastChecked && (
                    <span className="text-[10px] text-slate-400 mr-1">({metaStatus.lastChecked})</span>
                  )}
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{metaStatus.message}</span>
                  {metaStatus.lastChecked && (
                    <span className="text-[10px] text-slate-400 mr-1">({metaStatus.lastChecked})</span>
                  )}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="text-slate-400">الأحداث المفعّلة:</span>
              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">PageView</span>
              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">ViewContent</span>
              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">InitiateCheckout</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">Purchase (DZD)</span>
            </div>
          </div>

          {/* TikTok Pixel */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                <Radio className="w-4 h-4" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  TikTok Pixel
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">TikTok Pixel ID</span>
            </div>

            {/* Input + Status Badge */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="input-tiktok-pixel-id"
                  type="text"
                  value={tiktokPixelId}
                  onChange={(e) => setTiktokPixelId(e.target.value)}
                  placeholder="مثال: C1234567890ABCDEF"
                  className={`w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-white font-mono text-left dir-ltr placeholder:text-slate-400 placeholder:text-right transition ${
                    tiktokStatus.status === 'checking'
                      ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/10'
                      : tiktokStatus.active
                      ? 'border-emerald-500/80 dark:border-emerald-600 ring-2 ring-emerald-500/10'
                      : tiktokPixelId.trim()
                      ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {/* مؤشر الحالة (Status Badge) بجانب خانة الإدخال */}
              <div className="flex items-center gap-1.5 shrink-0">
                <PixelStatusBadge
                  id="status-badge-tiktok-pixel"
                  status={tiktokStatus.status}
                  active={tiktokStatus.active}
                  message={tiktokStatus.message}
                  statusCode={tiktokStatus.statusCode}
                />
                <button
                  id="btn-recheck-tiktok-pixel"
                  type="button"
                  onClick={() => handleCheckSinglePixel('tiktok', tiktokPixelId)}
                  disabled={tiktokStatus.status === 'checking'}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50 shrink-0"
                  title="إعادة فحص استجابة الـ API لهذا البيكسل"
                >
                  <RefreshCw className={`w-3 h-3 ${tiktokStatus.status === 'checking' ? 'animate-spin text-indigo-500' : 'text-slate-400'}`} />
                  <span>فحص</span>
                </button>
              </div>
            </div>

            {/* تفاصيل استجابة الـ API */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium">
              {tiktokStatus.status === 'checking' ? (
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>جاري فحص استجابة الـ API من خوادم TikTok...</span>
                </span>
              ) : tiktokStatus.active ? (
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{tiktokStatus.message}</span>
                  {tiktokStatus.lastChecked && (
                    <span className="text-[10px] text-slate-400 mr-1">({tiktokStatus.lastChecked})</span>
                  )}
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{tiktokStatus.message}</span>
                  {tiktokStatus.lastChecked && (
                    <span className="text-[10px] text-slate-400 mr-1">({tiktokStatus.lastChecked})</span>
                  )}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="text-slate-400">الأحداث المفعّلة:</span>
              <span className="px-1.5 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-mono">page</span>
              <span className="px-1.5 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-mono">ViewContent</span>
              <span className="px-1.5 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-mono">InitiateCheckout</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">PlaceAnOrder & CompletePayment</span>
            </div>
          </div>

          {/* Snapchat Pixel */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
                <Radio className="w-4 h-4" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Snapchat Pixel
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">Snap Pixel ID</span>
            </div>

            {/* Input + Status Badge */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="input-snapchat-pixel-id"
                  type="text"
                  value={snapchatPixelId}
                  onChange={(e) => setSnapchatPixelId(e.target.value)}
                  placeholder="مثال: abc12345-6789-0123-abcd-ef0123456789"
                  className={`w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-white font-mono text-left dir-ltr placeholder:text-slate-400 placeholder:text-right transition ${
                    snapchatStatus.status === 'checking'
                      ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/10'
                      : snapchatStatus.active
                      ? 'border-emerald-500/80 dark:border-emerald-600 ring-2 ring-emerald-500/10'
                      : snapchatPixelId.trim()
                      ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {/* مؤشر الحالة (Status Badge) بجانب خانة الإدخال */}
              <div className="flex items-center gap-1.5 shrink-0">
                <PixelStatusBadge
                  id="status-badge-snapchat-pixel"
                  status={snapchatStatus.status}
                  active={snapchatStatus.active}
                  message={snapchatStatus.message}
                  statusCode={snapchatStatus.statusCode}
                />
                <button
                  id="btn-recheck-snapchat-pixel"
                  type="button"
                  onClick={() => handleCheckSinglePixel('snapchat', snapchatPixelId)}
                  disabled={snapchatStatus.status === 'checking'}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50 shrink-0"
                  title="إعادة فحص استجابة الـ API لهذا البيكسل"
                >
                  <RefreshCw className={`w-3 h-3 ${snapchatStatus.status === 'checking' ? 'animate-spin text-indigo-500' : 'text-slate-400'}`} />
                  <span>فحص</span>
                </button>
              </div>
            </div>

            {/* تفاصيل استجابة الـ API */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium">
              {snapchatStatus.status === 'checking' ? (
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>جاري فحص استجابة الـ API من خوادم Snapchat...</span>
                </span>
              ) : snapchatStatus.active ? (
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{snapchatStatus.message}</span>
                  {snapchatStatus.lastChecked && (
                    <span className="text-[10px] text-slate-400 mr-1">({snapchatStatus.lastChecked})</span>
                  )}
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{snapchatStatus.message}</span>
                  {snapchatStatus.lastChecked && (
                    <span className="text-[10px] text-slate-400 mr-1">({snapchatStatus.lastChecked})</span>
                  )}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="text-slate-400">الأحداث المفعّلة:</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono">PAGE_VIEW</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono">VIEW_CONTENT</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono">START_CHECKOUT</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">PURCHASE (DZD)</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-indigo-900 dark:text-indigo-200 font-normal leading-relaxed">
              <strong className="font-bold block mb-0.5 text-indigo-950 dark:text-indigo-100">
                كيف يعمل التتبع التلقائي والتحقق من الـ API؟
              </strong>
              بمجرد إدخال معرّفات البيكسل، يقوم النظام بالاتصال بنقاط نهاية الـ API الخاصة بكل منصة للتحقق الفوري من استجابتها وظهور شارة الحالة (نشط / معطل). عند حفظ الإعدادات، يتم تفعيل التتبع في كافة روابط المنتجات ليرسل إشعارات الشراء (Purchase) وتأكيد الطلبات بدقة.
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
