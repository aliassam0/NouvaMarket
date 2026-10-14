import React from 'react';
import {
  Lock,
  UserPlus,
  LogIn,
  Home,
  ShieldCheck,
  Zap,
  TrendingUp,
  Package,
  Truck,
  MessageCircle,
} from 'lucide-react';
import { useRouter } from '../../router/RouterContext';

interface ApprovalGatedScreenProps {
  targetPath?: string;
  pageTitle?: string;
  onOpenRegister?: () => void;
  onOpenLogin?: () => void;
}

export function ApprovalGatedScreen({
  targetPath,
  pageTitle,
  onOpenRegister,
  onOpenLogin,
}: ApprovalGatedScreenProps) {
  const { navigate } = useRouter();

  const handleRegister = () => {
    if (onOpenRegister) {
      onOpenRegister();
    } else {
      navigate('/register');
    }
  };

  const handleLogin = () => {
    if (onOpenLogin) {
      onOpenLogin();
    } else {
      navigate('/login');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 dir-rtl text-right">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Soft Background Blur Blobs */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-md">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-black">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>محتوى مقفل • مخصص للمسوقين المعتمدين فقط</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {pageTitle ? `صفحة ${pageTitle} غير متاحة للزوار` : 'تصفح هذا القسم يتطلب التسجيل وموافقة الإدارة'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            حرصاً على حماية خصوصية أسعار الجملة وهوامش أرباح المسوقين، لا يمكن للزائر غير المسجل مشاهدة صفحات المنصة والكتالوج. يمكنك إنشاء حسابك مجاناً وانتظار اعتماد الإدارة لفتح كافة الأقسام.
          </p>
        </div>

        {/* Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1 text-center sm:text-right">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto sm:mx-0">
              <Zap className="w-4 h-4" />
            </div>
            <p className="font-black text-slate-900 dark:text-white text-xs">تسجيل مجاني 100%</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">بدون رأس مال أو رسوم شهرية</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1 text-center sm:text-right">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto sm:mx-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="font-black text-slate-900 dark:text-white text-xs">عمولات وأرباح فورية</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">سحب دوري ومباشر عبر CCP</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1 text-center sm:text-right">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto sm:mx-0">
              <Truck className="w-4 h-4" />
            </div>
            <p className="font-black text-slate-900 dark:text-white text-xs">شحن لـ 58 ولاية</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">توصيل سريع مع خدمة الـ COD</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleRegister}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-600/25 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>سجل كمسوق جديد الآن (مجاناً)</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>تسجيل الدخول / فحص الحساب</span>
            </button>

            <button
              onClick={handleGoHome}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>العودة إلى الصفحة الرئيسية</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Contact Note */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <span>هل قمت بتقديم طلب التسجيل وترغب بتسريعه؟</span>
          <a
            href="https://wa.me/213550228983?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9%20Nouva%20Market%D8%8C%20%D9%82%D9%85%D8%AA%20%D8%A8%D8%A7%D9%84%D8%AA%D8%B3%D8%AC%D9%8A%D9%84%20%D9%88%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D9%85%D8%B1%D8%A7%D8%AC%D8%B9%D8%A9%20%D9%88%D8%AA%D9%81%D8%B9%D9%8A%D9%84%20%D8%AD%D8%B3%D8%A7%D8%A8%D9%8A."
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 dark:text-purple-400 font-black hover:underline inline-flex items-center gap-1"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>تواصل مع الإدارة عبر الواتساب</span>
          </a>
        </div>
      </div>
    </div>
  );
}
