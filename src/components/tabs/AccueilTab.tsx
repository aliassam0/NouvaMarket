import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Award,
  Wallet,
  Zap,
  Flame,
  Share2,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { useLanguage } from '../../context/LanguageContext';
import { MoneyText } from '../ui/MoneyText';
import { ProfitBadge } from '../ui/ProfitBadge';
import { Product } from '../../types';
import { getUnreadNotificationsCount } from '../../lib/notificationHelper';
import { getStoredWalletBalance } from '../../lib/walletHelper';

interface AccueilTabProps {
  onOpenProduct: (p: Product) => void;
  onNavigateToCatalog?: () => void;
  onOpenWallet: () => void;
  onOpenGamification: () => void;
  onGoToOrders?: () => void;
  onOpenNotifications?: () => void;
}

export function AccueilTab({
  onOpenProduct,
  onNavigateToCatalog,
  onOpenWallet,
  onOpenGamification,
  onGoToOrders,
  onOpenNotifications,
}: AccueilTabProps) {
  const { user } = useAuth();
  const { orders, pendingLinkOrdersCount } = useOrders();
  const { t, language } = useLanguage();

  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(getUnreadNotificationsCount);

  useEffect(() => {
    const handleUpdate = () => {
      setUnreadNotifCount(getUnreadNotificationsCount());
    };
    window.addEventListener('seller_notifications_updated', handleUpdate);
    return () => window.removeEventListener('seller_notifications_updated', handleUpdate);
  }, []);

  const storedBalance = getStoredWalletBalance(user?.id, 0);

  const activeOrders = orders.filter((o) => o.status === 'PROCESSING' || o.status === 'SHIPPED');
  const deliveredOrdersCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const totalOrdersCount = orders.length;
  const deliveryRateCalculated = totalOrdersCount > 0 ? `${((deliveredOrdersCount / totalOrdersCount) * 100).toFixed(1)}%` : '0.0%';

  const totalDeliveredProfit = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((acc, o) => acc + o.totalProfit, 0);

  const pendingProfit = orders
    .filter((o) => o.status === 'PROCESSING' || o.status === 'SHIPPED')
    .reduce((acc, o) => acc + o.totalProfit, 0);

  const displayPendingProfit = pendingProfit;

  return (
    <div className="flex-1 pb-24 overflow-y-auto space-y-4 p-4 text-slate-900 dark:text-slate-100">
      {/* Reseller Header Greeting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white font-black text-lg flex items-center justify-center shadow-xs border border-violet-400 shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('home.greeting')}
            </span>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{user?.fullName}</span>
              <button
                onClick={onOpenGamification}
                className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300 text-[10px] font-bold border border-violet-200 dark:border-violet-700 cursor-pointer"
              >
                {user?.rankAr} 🌟
              </button>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition relative cursor-pointer"
              title="إشعارات البائعين"
            >
              <Bell className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              {unreadNotifCount > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center absolute -top-1 -end-1 shadow-xs border border-white dark:border-slate-900 animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onOpenGamification}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition relative cursor-pointer"
            title="مستوى الحساب"
          >
            <Award className="w-5 h-5 text-amber-500" />
          </button>
        </div>
      </div>

      {/* Pending Link Orders Alert Banner */}
      {pendingLinkOrdersCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-amber-500/20 border-2 border-amber-500/40 dark:border-amber-500/30 flex items-center justify-between gap-3 shadow-md animate-pulse">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <span>لديك {pendingLinkOrdersCount} طلبات جديدة عبر روابط المشاركة!</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black">
                  تنتظر التأكيد
                </span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                يرجى مراجعتها وتأكيدها لنقلها إلى المستودع والتأكد من عدم إهمالها.
              </p>
            </div>
          </div>
          {onGoToOrders && (
            <button
              onClick={onGoToOrders}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-extrabold text-xs whitespace-nowrap shadow-xs transition cursor-pointer"
            >
              مراجعة الطلبات ➔
            </button>
          )}
        </div>
      )}

      {/* Main Earnings Card (Section 2 - Sprint 2 Hero Card) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-slate-900 text-white p-5 shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-xs text-violet-200 font-medium">
              {t('home.availableEarnings')}
            </span>
            <div className="text-3xl font-black tracking-tight text-white mt-0.5">
              <MoneyText amount={storedBalance + totalDeliveredProfit} />
            </div>
          </div>

          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-bold text-xs transition shadow-md"
          >
            <Wallet className="w-4 h-4" />
            <span>{t('home.withdrawBtn')}</span>
          </button>
        </div>

        {/* Pending profits row */}
        <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs text-violet-100">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('home.pendingEarnings')}:</span>
            <span className="font-bold text-amber-300">
              +<MoneyText amount={displayPendingProfit} />
            </span>
          </div>
          <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-lg text-violet-200">
            {activeOrders.length} طلبات نشطة
          </span>
        </div>
      </div>

      {/* Quick Action CTA Bar */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onNavigateToCatalog}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-slate-950 font-black text-xs transition shadow-md cursor-pointer"
        >
          <Flame className="w-4 h-4 fill-current" />
          <span>المنتجات الأكثر مبيعاً 🔥</span>
        </button>

        <button
          onClick={onOpenWallet}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-100 font-bold text-xs transition shadow-xs"
        >
          <Wallet className="w-4 h-4 text-violet-600" />
          <span>سجل المحفظة</span>
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
            {t('home.ordersToday')}
          </span>
          <span className="text-base font-black text-slate-900 dark:text-white">
            {orders.length}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
            {t('home.deliveryRate')}
          </span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
            {deliveryRateCalculated}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
            {t('home.salesThisMonth')}
          </span>
          <span className="text-base font-black text-violet-600 dark:text-violet-400">
            {deliveredOrdersCount}
          </span>
        </div>
      </div>

      {/* Active Orders Horizontal Scroll */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Package className="w-4 h-4 text-violet-600" />
            <span>{t('home.activeOrders')}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              {activeOrders.length}
            </span>
          </h2>
        </div>

        {activeOrders.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500">
            لا توجد طلبات قيد التوصيل حالياً. ابدأ بإنشاء طلبية جديدة!
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {activeOrders.map((ord) => (
              <div
                key={ord.id}
                className="w-64 shrink-0 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {ord.customerName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                    {ord.statusAr}
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  📍 {ord.wilaya} • {ord.commune}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    المبلغ: <MoneyText amount={ord.totalAmount} />
                  </span>
                  <ProfitBadge profit={ord.totalProfit} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
