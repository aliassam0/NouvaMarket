import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, Clock, Wallet, Award, Package, RefreshCw, Trash2, CheckCheck, Volume2, VolumeX, Music, ShieldCheck, Box } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  playNotificationTone,
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  AppNotification,
} from '../../lib/notificationHelper';

interface NotificationsModalProps {
  onClose: () => void;
  role?: 'seller' | 'admin' | 'warehouse';
}

export function NotificationsModal({ onClose, role = 'seller' }: NotificationsModalProps) {
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getStoredNotifications(role));
  const [soundEnabled, setSoundEnabled] = useState<boolean>(isNotificationSoundEnabled);

  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(getStoredNotifications(role));
    };
    let eventName = 'seller_notifications_updated';
    if (role === 'admin') {
      eventName = 'admin_notifications_updated';
    } else if (role === 'warehouse') {
      eventName = 'warehouse_notifications_updated';
    }
    window.addEventListener(eventName, handleUpdate);
    return () => window.removeEventListener(eventName, handleUpdate);
  }, [role]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setNotificationSoundEnabled(next);
    if (next) {
      playNotificationTone();
    }
  };

  const handleTestSound = () => {
    playNotificationTone();
  };

  const handleItemClick = (n: AppNotification) => {
    if (!n.isRead) {
      markNotificationAsRead(n.id, role);
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(role);
  };

  const handleClearAll = () => {
    clearAllNotifications(role);
  };

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'product_add':
        return <Package className="w-4 h-4 text-purple-500 shrink-0" />;
      case 'stock_update':
        return <RefreshCw className="w-4 h-4 text-sky-500 shrink-0" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'reward':
        return <Award className="w-4 h-4 text-purple-500 shrink-0" />;
      case 'order':
        return <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-violet-500 shrink-0" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getRoleHeaderInfo = () => {
    if (role === 'admin') {
      return {
        title: 'إشعارات وتنبيهات الأدمن',
        subtitle: 'طلبات سحب الأرباح، التنبيهات المخزنية، والطلبات الجديدة بالمنصة',
        badgeBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400',
        icon: <ShieldCheck className="w-5 h-5" />,
      };
    }
    if (role === 'warehouse') {
      return {
        title: 'تنبيهات وإشعارات المستودع',
        subtitle: 'طلبيات التحضير الجديدة، تنبيهات المخزون المنخفض، والطرود المرجعة (Retours)',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400',
        icon: <Box className="w-5 h-5" />,
      };
    }
    return {
      title: 'تنبيهات وإشعارات البائعين',
      subtitle: 'تحديثات المنتجات الجديدة، توفر الكميات والمخزون، والأرباح',
      badgeBg: 'bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400',
      icon: <Bell className="w-5 h-5" />,
    };
  };

  const headerInfo = getRoleHeaderInfo();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl space-y-4 relative border border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-between pe-8">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-2xl ${headerInfo.badgeBg}`}>
              {headerInfo.icon}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{headerInfo.title}</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px]">
                    {unreadCount} جديد
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Notification Sound Settings Bar */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-violet-50/80 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/50 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-xl transition cursor-pointer flex items-center justify-center ${
                soundEnabled
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}
              title={soundEnabled ? 'كتم صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <div className="text-[11px]">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                صوت التنبيهات (Tone)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {soundEnabled ? 'مفعل (نغمة عند وصول إشعار جديد)' : 'معطل (وضع الصامت)'}
              </span>
            </div>
          </div>

          <button
            onClick={handleTestSound}
            className="px-2.5 py-1 rounded-xl bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 font-bold text-[10px] hover:bg-violet-200 dark:hover:bg-violet-800 transition flex items-center gap-1 cursor-pointer"
          >
            <Music className="w-3 h-3" />
            <span>تجربة الصوت</span>
          </button>
        </div>

        {/* Action Toolbar */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between pt-1 pb-1 border-b border-slate-100 dark:border-slate-800 text-[11px]">
            <button
              onClick={handleMarkAllRead}
              className="text-violet-600 dark:text-violet-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>تعليم الكل كـ مقروء</span>
            </button>

            <button
              onClick={handleClearAll}
              className="text-rose-500 hover:text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح كل الإشعارات</span>
            </button>
          </div>
        )}

        <div className="space-y-2.5 max-h-96 overflow-y-auto pe-1 scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                لا توجد إشعارات حالياً
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                  !n.isRead
                    ? 'bg-violet-50/70 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/60 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getNotifIcon(n.type)}
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {n.titleAr}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" title="غير مقروء" />
                    )}
                    <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed ps-6">
                  {n.bodyAr}
                </p>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs cursor-pointer"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
