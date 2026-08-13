import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  Package,
  Truck,
  Wallet,
  Users,
  CheckCircle2,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  Phone,
  Store,
  MapPin,
  Lock,
  Mail,
  UserCheck,
  Star,
  HelpCircle,
  MessageCircle,
  X,
  PlayCircle,
  Award,
  DollarSign,
  ShoppingCart,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ALGERIA_WILAYAS as FULL_ALGERIA_WILAYAS } from '../../data/algeriaLocations';
import { addSupplierRegistration } from '../../lib/supplierHelper';
import { addSellerRegistration } from '../../lib/sellerHelper';
import { TermsModal } from './TermsModal';
import { PrivacyModal } from './PrivacyModal';

interface LandingPageProps {
  onEnterApp: (role?: 'reseller' | 'admin' | 'warehouse') => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ALGERIA_WILAYAS = FULL_ALGERIA_WILAYAS.map((w) => w.nameAr);

export function LandingPage({ onEnterApp, onShowToast }: LandingPageProps) {
  const { user, loginWithPhoneOtp, loginWithEmailPassword, registerWithEmail, updateProfile } = useAuth();

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<'reseller' | 'admin' | 'warehouse'>('reseller');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Form states - Register
  const [regAccountType, setRegAccountType] = useState<'reseller' | 'supplier'>('reseller');
  const [regFullName, setRegFullName] = useState('');
  const [regStoreName, setRegStoreName] = useState('');
  const [supplierCompany, setSupplierCompany] = useState('');
  const [supplierActivity, setSupplierActivity] = useState('ألبسة ونسيج');
  const [supplierCcp, setSupplierCcp] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWilaya, setRegWilaya] = useState('16 - الجزائر');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAgency, setAgreeAgency] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Calculator State
  const [dailySales, setDailySales] = useState(5);
  const [avgMargin, setAvgMargin] = useState(1200);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Calculated estimated earnings
  const dailyProfit = dailySales * avgMargin;
  const monthlyProfit = dailyProfit * 30;

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      onShowToast('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
      return;
    }
    setIsLoggingIn(true);
    try {
      const success = await loginWithEmailPassword(loginEmail, loginPassword);
      if (success) {
        let targetRole: 'reseller' | 'admin' | 'warehouse' = loginRole;
        const lowerEmail = loginEmail.toLowerCase();
        if (lowerEmail.includes('admin') || lowerEmail.startsWith('admin@')) {
          targetRole = 'admin';
        } else if (
          lowerEmail.includes('warehouse') ||
          lowerEmail.includes('supplier') ||
          lowerEmail.includes('مستودع') ||
          lowerEmail.startsWith('warehouse@')
        ) {
          targetRole = 'warehouse';
        } else {
          targetRole = 'reseller';
        }

        const roleLabel =
          targetRole === 'admin' ? '🛠️ مدير النظام (Admin)' : targetRole === 'warehouse' ? '📦 أمين المستودع' : '🛍️ بائع';
        onShowToast(`تم تسجيل الدخول بنجاح كـ ${roleLabel}`, 'success');
        setIsLoginModalOpen(false);
        onEnterApp(targetRole);
      } else {
        onShowToast('بيانات الدخول غير صحيحة! يرجى إدخال البريد الإلكتروني وكلمة السر الصحيحة (Ali1234567)', 'error');
      }
    } catch (err) {
      onShowToast('حدث خطأ أثناء تسجيل الدخول', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPassword) {
      onShowToast('يرجى ملء جميع الحقول المطلوبة (الاسم، البريد الإلكتروني، وكلمة السر)', 'error');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      onShowToast('كلمتا المرور غير متطابقتين، يرجى التأكد مرة أخرى', 'error');
      return;
    }
    if (!agreeTerms || !agreeAgency) {
      onShowToast('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية وإقرار الوكالة للمتابعة', 'error');
      return;
    }
    setIsRegistering(true);
    try {
      if (regAccountType === 'supplier') {
        addSupplierRegistration({
          fullName: regFullName,
          companyName: supplierCompany || `مستودع ${regFullName}`,
          phone: regPhone || '0550000000',
          email: regEmail,
          password: regPassword,
          wilaya: regWilaya,
          activityType: supplierActivity,
          ccpOrRip: supplierCcp || 'CCP / BaridiMob Pending',
        });
        await registerWithEmail({
          fullName: regFullName,
          storeName: supplierCompany || `مستودع ${regFullName}`,
          email: regEmail,
          phone: regPhone || '0550000000',
          wilaya: regWilaya,
          password: regPassword,
          role: 'warehouse',
        });
        onShowToast('✔ تم تسجيل حسابك كمورد بنجاح! مرحباً بك في لوحة تحكم المستودع والتوريد.', 'success');
        setIsRegisterModalOpen(false);
        onEnterApp('warehouse');
      } else {
        addSellerRegistration({
          fullName: regFullName,
          storeName: regStoreName || `متجر ${regFullName}`,
          phone: regPhone || '0550000000',
          email: regEmail,
          password: regPassword,
          wilaya: regWilaya,
        });
        await registerWithEmail({
          fullName: regFullName,
          storeName: regStoreName || `متجر ${regFullName}`,
          email: regEmail,
          phone: regPhone || '0550000000',
          wilaya: regWilaya,
          password: regPassword,
          role: 'reseller',
        });
        onShowToast('🎉 تم تسديد طلب انضمامك كبائع بنجاح! بانتظار تأكيد الإدارة لتفعيل حسابك.', 'success');
        setIsRegisterModalOpen(false);
        onEnterApp('reseller');
      }
    } catch (err) {
      onShowToast('حدث خطأ أثناء إنشاء الحساب', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white dir-rtl text-right overflow-x-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        <div className="absolute top-0 -start-40 w-96 h-96 bg-emerald-300/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -end-40 w-96 h-96 bg-violet-300/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 start-1/4 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl" />
      </div>

      {/* Top Floating Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 transition shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-indigo-600 to-violet-600 p-0.5 shadow-md shadow-emerald-500/10 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-emerald-400 text-sm sm:text-base tracking-tighter">
                RM
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                  Nouva Market
                </h1>
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition">المميزات</a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition">كيف تبدأ؟</a>
            <a href="#calculator" className="hover:text-emerald-600 transition">حاسبة الأرباح</a>
            <a href="#faq" className="hover:text-emerald-600 transition">الأسئلة الشائعة</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <button
                onClick={() => onEnterApp(user.role as any)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition duration-200 flex items-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-emerald-300" />
                <span>
                  {user.fullName || user.storeName || user.email} ({user.role === 'admin' ? 'مدير' : user.role === 'warehouse' ? 'مورد' : 'بائع'}) - دخول الحساب
                </span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <>
                {/* Login Button */}
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 font-extrabold text-xs sm:text-sm transition duration-200 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                  <span>تسجيل الدخول</span>
                </button>

                {/* Register Seller CTA */}
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition duration-200 flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>تسجيل بائع</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-10 sm:pt-20 pb-16 sm:pb-28 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Trust Pills */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs animate-pulse">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>منصة التجارة الإلكترونية الأولى في الجزائر بدون رأس مال!</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight">
              حقّق أرباحاً يومية من <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
                التجارة الإلكترونية
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-lg text-slate-600 font-medium leading-relaxed">
              لا تحتاج شراء مخزون أو امتلاك رأس مال! نحن نوفر لك أحدث تشكيلات الإلكترونيات والمنتجات الذكية والأجهزة الأكثر مبيعاً، التغليف، والتوصيل لـ <span className="text-emerald-700 font-bold">69 ولاية</span> مع الدفع عند الاستلام (COD)، وأنت تستلم أرباحك الصافية فوراً.
            </p>

            {/* Main CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {user ? (
                <button
                  onClick={() => onEnterApp(user.role as any)}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-600/20 active:scale-95 transition flex items-center justify-center gap-2.5 group cursor-pointer"
                >
                  <UserCheck className="w-5 h-5 text-emerald-300" />
                  <span>مرحباً {user.fullName || user.storeName} - الانتقال المباشر لمساحة العمل</span>
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-600/20 active:scale-95 transition flex items-center justify-center gap-2.5 group cursor-pointer"
                  >
                    <Zap className="w-5 h-5 fill-current text-white group-hover:scale-110 transition" />
                    <span>ابدأ الربح الآن - تسجيل بائع مجاناً</span>
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
                  </button>

                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-slate-100/80 border border-slate-200 text-slate-800 font-bold text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-5 h-5 text-indigo-600" />
                    <span>تسجيل الدخول إلى حسابك</span>
                  </button>
                </>
              )}
            </div>

            {/* Key Trust Badges Below Hero */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs font-bold text-slate-700">
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>شحن 69 ولاية COD</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center gap-2">
                <Wallet className="w-4 h-4 text-teal-600 shrink-0" />
                <span>سحب الأرباح عبر CCP</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center gap-2">
                <Package className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>بدون مخزون أو رأس مال</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0" />
                <span>ضمان الجودة والمرجوعات</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Section */}
      <section className="py-10 bg-white border-y border-slate-200/80 shadow-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-2xl sm:text-4xl font-black text-emerald-600 tracking-tight">+15,400</p>
              <p className="text-xs sm:text-sm text-slate-500 font-bold">طرد مسلّم للزبائن 📦</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-4xl font-black text-teal-600 tracking-tight">+1,250</p>
              <p className="text-xs sm:text-sm text-slate-500 font-bold">بائع وموزع نشط 🛍️</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-4xl font-black text-indigo-600 tracking-tight">69</p>
              <p className="text-xs sm:text-sm text-slate-500 font-bold">ولاية مغطاة بالكامل 🇩🇿</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-4xl font-black text-violet-600 tracking-tight">24-48h</p>
              <p className="text-xs sm:text-sm text-slate-500 font-bold">متوسط سرعة التوصيل 🚚</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Features */}
      <section id="features" className="py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              لماذا تختار Nouva Market؟
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
              كل ما تحتاجه للنجاح في تجارتك الإلكترونية
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              صمّمنا المنصة خصيصاً للموزعين والبائعين في الجزائر لنوفر عليهم عناء الاستيراد والتخزين والتوصيل.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">صفر رأس مال ومخزون</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                ابتدئ بدون المخاطرة بمالك. البضاعة مخزنة ومحفوظة بمركزنا اللوجستي، أنت تسوق ونحن نشحن باسم متجرك.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-500/40 transition duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">توصيل وسحب سريع للأرباح</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                ربط مباشر مع شركات التوصيل الجزائري. تحول أرباحك تلقائياً بحسابك في CCP أو BaridiMob دون تأخير.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-violet-500/40 transition duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 group-hover:scale-110 transition">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">أدوات ذكاء اصطناعي للتسويق</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                ولد إعلانات فيسبوك وانستغرام احترافية بالذكاء الاصطناعي بنقرة واحدة، واستفد من الصور والفيديوهات عالية الجودة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Profit Calculator Section */}
      <section id="calculator" className="py-16 bg-slate-100/70 border-y border-slate-200/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                🧮 حاسبة أرباح الموزع
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
                كم يمكنك أن تربح شهرياً؟
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                حدد عدد المبيعات التي يمكنك تحقيقها يومياً والهامش الربحي المقترح لتكتشف مداخيلك الشهرية المتوقعة من التجارة الإلكترونية.
              </p>

              <div className="pt-2 space-y-2 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تحديد السعر النهائي للزبون بحرية تامة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تحويل مباشر لـ CCP أو BaridiMob فور التسليم</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              {/* Slider 1: Sales per day */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs sm:text-sm font-extrabold">
                  <span className="text-slate-700">المبيعات اليومية المتوقعة:</span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm">
                    {dailySales} مبيعات / يومياً
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={dailySales}
                  onChange={(e) => setDailySales(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Slider 2: Margin per item */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs sm:text-sm font-extrabold">
                  <span className="text-slate-700">متوسط فائدتك في القطعة الواحدة:</span>
                  <span className="px-3 py-1 rounded-xl bg-teal-100 text-teal-800 font-black text-sm">
                    {avgMargin.toLocaleString()} د.ج
                  </span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={3000}
                  step={100}
                  value={avgMargin}
                  onChange={(e) => setAvgMargin(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              {/* Results Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 grid grid-cols-2 gap-4 text-center">
                <div className="border-e border-emerald-200 pe-2">
                  <span className="text-[11px] font-bold text-slate-500 block">الربح اليومي الصافي</span>
                  <span className="text-lg sm:text-2xl font-black text-emerald-700">
                    {dailyProfit.toLocaleString()} د.ج
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block">الربح الشهري المتوقع</span>
                  <span className="text-xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                    {monthlyProfit.toLocaleString()} د.ج
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                تسجيل بائع لكسب هذا المدخول الآن
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Step-by-Step */}
      <section id="how-it-works" className="py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
              كيف تبدأ العمل؟
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
              4 خطوات بسيطة لبدء مشوارك
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'سجل حساب بائع',
                desc: 'أنشئ حسابك مجاناً بدون رسوم اشتراك في دقيقة واحدة.',
                icon: Store,
                color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
              },
              {
                step: '02',
                title: 'اختر المنتجات وسوّقها',
                desc: 'نزّل صور المنتجات عالية الجودة وانشرها على صفحتك في فيسبوك/انستغرام.',
                icon: Layers,
                color: 'text-teal-700 bg-teal-50 border-teal-200',
              },
              {
                step: '03',
                title: 'أدخل الطلبات بالداشبورد',
                desc: 'سجل معلومات الزبون (الاسم، الهاتف، الولاية) ببساطة.',
                icon: ShoppingCart,
                color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
              },
              {
                step: '04',
                title: 'استلم أرباحك بـ CCP',
                desc: 'فريقنا يتصل بالزبون ويغلف ويشحن، وأنت تستلم ربحك الصافي.',
                icon: Wallet,
                color: 'text-violet-700 bg-violet-50 border-violet-200',
              },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.step}
                  className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden space-y-4"
                >
                  <span className="text-4xl font-black text-slate-100 absolute top-4 left-4 select-none">
                    {item.step}
                  </span>
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${item.color}`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              الأسئلة الشائعة
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
              كل ما تود معرفته قبل البدء
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'هل أحتاج لرأس مال للبدء في التسويق؟',
                a: 'لا نهائياً! التسجيل في المنصة مجاني 100%. المنتجات متوفرة بمستودعنا وتدفع قيمتها فقط بعد استلام الزبون للطلبية واقتطاع أرباحك.',
              },
              {
                q: 'كيف أستلم أرباحي الصافية؟',
                a: 'تتم تسوية وحساب أرباحك تلقائياً في محفظتك بالداشبورد فور تسليم الطلبية من شركة التوصيل، ويمكنك طلب سحب الأرباح مباشرة عبر حساب CCP أو BaridiMob.',
              },
              {
                q: 'ماذا يحدث إذا رفض الزبون استلام الطلبية؟',
                a: 'يتكفل المستودع بإدارة المرجوعات بالكامل بدون تحميل الموزع أي تكاليف شحن إضافية أو غرامات.',
              },
              {
                q: 'كيف أسوق للمنتجات بفعالية؟',
                a: 'نوفر لك صوراً وفيديوهات احترافية وأوصافاً مجهزة لكل منتج، بالإضافة لمولد إعلانات بالذكاء الاصطناعي بالداشبورد لمساعدتك على فيسبوك وانستغرام.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-right font-black text-sm text-slate-900 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-emerald-600 transition-transform ${
                      openFaq === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Conversion CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-lg relative z-10">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            جاهز لبدء تحقيق أرباح حقيقية اليوم؟
          </h2>
          <p className="text-xs sm:text-base text-emerald-50 font-medium max-w-xl mx-auto">
            انضم إلى أكثر من 1,200 بائع وموزع ناجح بالجزائر. سجل الآن مجاناً وابدأ نشر أول منتج في أقل من 3 دقائق!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <button
                onClick={() => onEnterApp(user.role as any)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-950 font-black text-base shadow-xl active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>مرحباً {user.fullName || user.storeName} - دخول مساحة العمل</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-950 font-black text-base shadow-xl active:scale-95 transition cursor-pointer"
                >
                  تسجيل بائع جديد الآن
                </button>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-800/60 hover:bg-emerald-800/90 border border-emerald-400/40 text-white font-bold text-sm transition cursor-pointer"
                >
                  دخول الحساب الحالي
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 text-xs text-slate-500 font-semibold relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Nouva Market. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            <button
              onClick={() => setIsTermsModalOpen(true)}
              className="hover:text-emerald-600 text-slate-700 font-bold transition cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>شروط الاستخدام</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="hover:text-indigo-600 text-slate-700 font-bold transition cursor-pointer flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>سياسة الخصوصية</span>
            </button>
            <span>•</span>
            {user ? (
              <button onClick={() => onEnterApp(user.role as any)} className="hover:text-emerald-600 transition cursor-pointer text-emerald-600 font-bold">
                حسابك: {user.fullName || user.email}
              </button>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="hover:text-emerald-600 transition cursor-pointer">
                تسجيل الدخول
              </button>
            )}
            <span>•</span>
            <a href="#faq" className="hover:text-emerald-600 transition">الأسئلة الشائعة</a>
          </div>
        </div>
      </footer>

      {/* Terms of Use Modal */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* Privacy Policy Modal */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* ===================== LOGIN MODAL (دخول) ===================== */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative text-right">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                <span>تسجيل الدخول إلى النظام</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">أدخل البريد الإلكتروني وكلمة المرور الخاصة بك للدخول إلى حسابك</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">البريد الإلكتروني *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="user@nouvachat.com"
                    className="w-full py-3 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">كلمة السر / المرور *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-3 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-2xl text-white font-black text-sm bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoggingIn ? 'جاري التحقق من البيانات...' : 'تسجيل الدخول'}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-center space-y-2">
              <p className="text-xs text-slate-500 pt-1">
                ليس لديك حساب بعد؟{' '}
                <button
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    setIsRegisterModalOpen(true);
                  }}
                  className="text-emerald-600 font-black hover:underline cursor-pointer"
                >
                  سجل كبائع جديد الآن
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===================== REGISTER MODAL (تسجيل بائع) ===================== */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative text-right max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-emerald-600" />
                <span>{regAccountType === 'supplier' ? 'انضم كمورد للكتالوج' : 'تسجيل بائع / مسوق جديد'}</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {regAccountType === 'supplier'
                  ? 'سجل معلومات مستودعك أو براندك لبدء توريد المنتجات وسحب المستحقات'
                  : 'ابدأ عملك مجاناً وبدون أي تكاليف أولية أو شراء مخزون'}
              </p>

              {/* Account Type Toggle Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold pt-2">
                <button
                  type="button"
                  onClick={() => setRegAccountType('reseller')}
                  className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    regAccountType === 'reseller'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>تسجيل كبائع / مسوق</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegAccountType('supplier')}
                  className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    regAccountType === 'supplier'
                      ? 'bg-amber-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>انضم كمورد (Supplier)</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">البريد الإلكتروني للحساب *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={regAccountType === 'supplier' ? 'supplier@domain.com' : 'seller@domain.com'}
                    className="w-full py-3 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="مثال: توفيق بوعلام"
                    className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                  />
                </div>

                {regAccountType === 'reseller' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">اسم المتجر أو الصفحة (اختياري)</label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
                      <input
                        type="text"
                        value={regStoreName}
                        onChange={(e) => setRegStoreName(e.target.value)}
                        placeholder="مثال: Amira Kids Store"
                        className="w-full py-3 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">اسم الشركة أو المستودع *</label>
                    <div className="relative">
                      <Package className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
                      <input
                        type="text"
                        required
                        value={supplierCompany}
                        onChange={(e) => setSupplierCompany(e.target.value)}
                        placeholder="مثال: مستودع الأوراس للألبسة"
                        className="w-full py-3 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                )}
              </div>



              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">رقم الواتساب *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0550123456"
                      className="w-full py-3 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">الولاية *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
                    <select
                      value={regWilaya}
                      onChange={(e) => setRegWilaya(e.target.value)}
                      className="w-full py-3 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 transition appearance-none"
                    >
                      {ALGERIA_WILAYAS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">كلمة المرور *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="اختر كلمة سر لحسابك"
                    className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">تأكيد كلمة المرور *</label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="أعد كتابة كلمة السر للتأكيد"
                    className={`w-full py-3 px-4 bg-slate-50 border rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition ${
                      regConfirmPassword && regConfirmPassword !== regPassword
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Required Agreement Checkboxes */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 shrink-0"
                  />
                  <span>
                    بإنشاء حساب، أقر بأنني قرأت وأوافق على{' '}
                    <button
                      type="button"
                      onClick={() => setIsTermsModalOpen(true)}
                      className="text-emerald-600 dark:text-emerald-400 font-extrabold underline hover:text-emerald-700 cursor-pointer inline-block"
                    >
                      شروط الاستخدام
                    </button>{' '}
                    و{' '}
                    <button
                      type="button"
                      onClick={() => setIsPrivacyModalOpen(true)}
                      className="text-indigo-600 dark:text-indigo-400 font-extrabold underline hover:text-indigo-700 cursor-pointer inline-block"
                    >
                      سياسة الخصوصية
                    </button>{' '}
                    الخاصة بالمنصة.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                  <input
                    type="checkbox"
                    required
                    checked={agreeAgency}
                    onChange={(e) => setAgreeAgency(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 shrink-0"
                  />
                  <span>
                    أقرّ بأنني أسوّق وأبيع منتجات المنصة بصفتي وكيلاً عنها مقابل ربح معلوم، وألتزم بالصدق والأمانة في البيع.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isRegistering || !agreeTerms || !agreeAgency}
                className={`w-full py-3.5 rounded-2xl font-black text-sm transition shadow-md flex items-center justify-center gap-2 ${
                  agreeTerms && agreeAgency && !isRegistering
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20 cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                {isRegistering ? 'جاري إنشاء الحساب...' : 'إنشاء حساب بائع معتمد'}
              </button>
            </form>

            <p className="text-xs text-slate-500 text-center pt-2 border-t border-slate-100">
              لديك حساب بالفعل؟{' '}
              <button
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="text-emerald-600 font-black hover:underline cursor-pointer"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
