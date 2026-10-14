import React, { useState, useEffect } from 'react';
import {
  Bell,
  Smartphone,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  AlertCircle,
  Vibrate,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  getSaleNotifSettings,
  saveSaleNotifSettings,
  getPushPermissionStatus,
  requestPushPermission,
  testSalePushNotification,
  playSaleChime,
  vibratePhoneForSale,
  isPushSupported,
  isVibrationSupported,
} from '../../lib/pwaNotificationManager';
import { PWAInstallButton } from './PWAInstallButton';

export const PushNotificationCard: React.FC<{ onShowToast?: (msg: string) => void }> = ({ onShowToast }) => {
  const [settings, setSettings] = useState(getSaleNotifSettings);
  const [permStatus, setPermStatus] = useState(getPushPermissionStatus);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getSaleNotifSettings());
      setPermStatus(getPushPermissionStatus());
    };
    window.addEventListener('nouva_sale_settings_updated', handleUpdate);
    return () => window.removeEventListener('nouva_sale_settings_updated', handleUpdate);
  }, []);

  const handleToggleSound = () => {
    const updated = saveSaleNotifSettings({ soundEnabled: !settings.soundEnabled });
    setSettings(updated);
    if (updated.soundEnabled) {
      playSaleChime();
      onShowToast?.('تم تفعيل رنين المبيعات المميز 🔔');
    } else {
      onShowToast?.('تم كتم صوت رنين المبيعات 🔕');
    }
  };

  const handleToggleVibration = () => {
    const updated = saveSaleNotifSettings({ vibrationEnabled: !settings.vibrationEnabled });
    setSettings(updated);
    if (updated.vibrationEnabled) {
      vibratePhoneForSale();
      onShowToast?.('تم تفعيل اهتزاز الهاتف عند كل مبيعة 📳');
    } else {
      onShowToast?.('تم تعطيل اهتزاز الهاتف ⏹️');
    }
  };

  const handleRequestPermission = async () => {
    const res = await requestPushPermission();
    setPermStatus(res);
    if (res === 'granted') {
      onShowToast?.('تم تفعيل إشعارات هاتف المسوق الفورية بنجاح! 🎉');
      testSalePushNotification(2500);
    } else if (res === 'denied') {
      onShowToast?.('تم رفض الإذن. يرجى تفعيله من إعدادات المتصفح.');
    }
  };

  const handleTestSaleChimeAndVibe = () => {
    setIsTesting(true);
    testSalePushNotification(2500);
    onShowToast?.('💰 تم إطلاق إشعار المبيعة التجريبي (ربحك: 2,500 دج) مع الرنين والاهتزاز!');
    setTimeout(() => setIsTesting(false), 1200);
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
            🔔
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>إشعارات الهاتف الفورية (Push PWA)</span>
              <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300 text-[10px] font-black">
                لحظي
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              إشعار يهتز في هاتفك مع رنين مميز كلما حققت مبيعة جديدة وأرباحاً 💰
            </p>
          </div>
        </div>

        <PWAInstallButton />
      </div>

      {/* Permission Status Box */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {permStatus === 'granted' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          )}
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {permStatus === 'granted'
                ? 'إشعارات النظام مفعلة على هاتفك ✅'
                : permStatus === 'denied'
                ? 'تم حظر الإشعارات في المتصفح'
                : 'إشعارات النظام غير مفعّلة بعد'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {permStatus === 'granted'
                ? 'تصلك التنبيهات الفورية حتى عند إغلاق التطبيق'
                : 'اضغط لتفعيل الإشعارات الفورية على شاشة الهاتف'}
            </p>
          </div>
        </div>

        {permStatus !== 'granted' && (
          <button
            onClick={handleRequestPermission}
            className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            تفعيل الإشعارات 📲
          </button>
        )}
      </div>

      {/* Feature Toggles */}
      <div className="grid grid-cols-2 gap-3">
        {/* Sound Toggle */}
        <button
          onClick={handleToggleSound}
          className={`p-3 rounded-2xl border text-right transition flex items-center justify-between cursor-pointer ${
            settings.soundEnabled
              ? 'bg-purple-50/70 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800 text-purple-950 dark:text-purple-200'
              : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-2">
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold">صوت رنين الكاش 💰</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">نغمة الذهب المميزة</p>
            </div>
          </div>
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
              settings.soundEnabled ? 'bg-purple-600 text-white border-purple-600 font-bold' : 'border-slate-300'
            }`}
          >
            {settings.soundEnabled && '✓'}
          </span>
        </button>

        {/* Vibration Toggle */}
        <button
          onClick={handleToggleVibration}
          className={`p-3 rounded-2xl border text-right transition flex items-center justify-between cursor-pointer ${
            settings.vibrationEnabled
              ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 text-amber-950 dark:text-amber-200'
              : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-2">
            <Smartphone className={`w-4 h-4 shrink-0 ${settings.vibrationEnabled ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <div>
              <p className="text-xs font-bold">اهتزاز الهاتف 📳</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">نمط هزّة ثلاثي احتفالي</p>
            </div>
          </div>
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
              settings.vibrationEnabled ? 'bg-amber-600 text-white border-amber-600 font-bold' : 'border-slate-300'
            }`}
          >
            {settings.vibrationEnabled && '✓'}
          </span>
        </button>
      </div>

      {/* Distinctive Test Button (as explicitly requested) */}
      <button
        onClick={handleTestSaleChimeAndVibe}
        disabled={isTesting}
        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
      >
        <Sparkles className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
        <span>اختبار الإشعار اللحظي: 💰 مبيعة جديدة! ربحك: 2,500 دج</span>
      </button>
    </div>
  );
};
