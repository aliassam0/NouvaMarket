import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as a standalone PWA, suppress the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className={`p-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-white">ثبّت نوفا ماركت على هاتفك</p>
              <p className="text-[11px] text-violet-100">لتصلك إشعارات المبيعات ورنين الأرباح فورياً بدون فتح المتصفح</p>
            </div>
          </div>
          <button
            onClick={install}
            className="px-3.5 py-1.5 rounded-xl bg-white text-violet-700 font-extrabold text-xs shadow-md hover:bg-violet-50 transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            تثبيت التطبيق 📲
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/70 dark:hover:bg-violet-900/80 text-violet-700 dark:text-violet-300 font-extrabold text-xs border border-violet-200/90 dark:border-violet-800 transition active:scale-95 cursor-pointer shadow-2xs ${className}`}
        title="تثبيت التطبيق على الشاشة الرئيسية للحصول على إشعارات المبيعات ورنين الأرباح"
      >
        <Download className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
        <span className="hidden sm:inline">تثبيت التطبيق</span>
        <span className="sm:hidden text-[11px]">تثبيت</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/70 dark:hover:bg-violet-900/80 text-violet-700 dark:text-violet-300 font-extrabold text-xs border border-violet-200/90 dark:border-violet-800 transition active:scale-95 cursor-pointer shadow-2xs ${className}`}
          title="تثبيت نوفا ماركت على شاشة الآيفون لتفعيل إشعارات المبيعات"
        >
          <Smartphone className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span className="hidden sm:inline">تثبيت على آيفون</span>
          <span className="sm:hidden text-[11px]">آيفون</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" dir="rtl">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black">
                    📲
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    تثبيت التطبيق على iPhone / iPad
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <p>
                    اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح Safari السفلي (أيقونة المربع بسهم للأعلى).
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <p>
                    مرّر لأسفل واضغط على <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <p>
                    اضغط <strong>إضافة (Add)</strong>، وسيظهر التطبيق على شاشتك فوراً ويدعم إشعارات المبيعات ورنين الأرباح!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl bg-violet-600 py-2.5 text-xs font-black text-white hover:bg-violet-700 transition shadow-md cursor-pointer"
              >
                فهمت ذلك، تم ✅
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
