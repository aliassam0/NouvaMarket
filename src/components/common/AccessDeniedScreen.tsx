import React from 'react';
import { ShieldAlert, ArrowRight, LogIn, Home, Lock } from 'lucide-react';
import { useRouter } from '../../router/RouterContext';
import { useAuth } from '../../context/AuthContext';

interface AccessDeniedScreenProps {
  requiredRoleNameAr: string;
  requiredRoleNameFr: string;
  targetPath: string;
  onOpenLoginModal?: () => void;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  requiredRoleNameAr,
  requiredRoleNameFr,
  targetPath,
  onOpenLoginModal,
}) => {
  const { navigate } = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
        {/* Shield Lock Badge */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-black">
            <Lock className="w-3.5 h-3.5" />
            <span>403 • محمي برمز الأمان (Restricted Area)</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            غير مصرّح لك بالدخول إلى هذا المسار
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            المسار <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-purple-600 font-mono font-bold text-xs">{targetPath}</code> مخصص حصرياً لفئة <strong className="text-slate-800 dark:text-slate-200">{requiredRoleNameAr}</strong> ({requiredRoleNameFr}).
          </p>
        </div>

        {/* Current User Status Indicator */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-start space-y-1">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>الحساب الحالي:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {user ? (user.fullName || user.email) : 'غير مسجل الدخول (زائر)'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>الرتبة المكتشفة:</span>
            <span className="font-extrabold text-purple-600 dark:text-purple-400 uppercase">
              {user?.role || 'زائر غير مسجل'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {!user ? (
            <button
              onClick={() => {
                if (onOpenLoginModal) {
                  onOpenLoginModal();
                } else {
                  navigate(`/?login=true&redirect=${encodeURIComponent(targetPath)}`);
                }
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-purple-500/25 hover:from-purple-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول بالحساب المصرح له</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 text-white font-black text-sm shadow-lg shadow-purple-500/25 hover:bg-purple-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>العودة إلى لوحة تحكم المسوق</span>
            </button>
          )}

          <button
            onClick={() => {
              if (user) {
                logout();
              }
              navigate('/');
            }}
            className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>العودة للصفحة الرئيسية (Landing Page)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
