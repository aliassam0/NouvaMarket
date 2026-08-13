import React, { useState } from 'react';
import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { MoneyText } from '../ui/MoneyText';

export function AnalyticsTab() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { orders } = useOrders();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const userOrders = orders.filter(
    (o) => o.resellerId === user?.id || o.resellerEmail === user?.email || o.resellerPhone === user?.phone || !user?.id
  );

  const deliveredOrders = userOrders.filter((o) => o.status === 'DELIVERED');
  const totalCount = userOrders.length;
  const deliveredCount = deliveredOrders.length;

  const totalEarned = deliveredOrders.reduce((sum, o) => sum + (o.totalProfit || 0), 0);
  const deliveryRate = totalCount > 0 ? ((deliveredCount / totalCount) * 100).toFixed(1) : '0.0';

  const emptyDaysData = [
    { day: 'الأحد', amount: 0 },
    { day: 'الإثنين', amount: 0 },
    { day: 'الثلاثاء', amount: 0 },
    { day: 'الأربعاء', amount: 0 },
    { day: 'الخميس', amount: 0 },
    { day: 'الجمعة', amount: 0 },
    { day: 'السبت', amount: 0 },
  ];

  const daysData = emptyDaysData;
  const maxAmount = Math.max(...daysData.map((d) => d.amount), 1);

  return (
    <div className="flex-1 pb-24 overflow-y-auto p-4 text-slate-900 dark:text-slate-100 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <span>{t('analytics.title')}</span>
        </h1>

        {/* Period Selector */}
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
          <button
            onClick={() => setPeriod('7d')}
            className={`px-2.5 py-1 rounded-lg transition ${period === '7d' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-500'}`}
          >
            {t('analytics.period7d')}
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-2.5 py-1 rounded-lg transition ${period === '30d' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-500'}`}
          >
            {t('analytics.period30d')}
          </button>
        </div>
      </div>

      {/* Top Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">صافي أرباح الفترة</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            +<MoneyText amount={totalEarned} />
          </span>
          <span className="text-[10px] text-emerald-600 block mt-1 font-bold">
            {totalEarned > 0 ? '↑ نمو مستمر في الأرباح' : 'ابدأ التسويق لتحقيق أرباحك الأولى'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">نسبة التوصيل الناجح</span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            {deliveryRate}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-1 font-bold">
            {`${deliveredCount} تسليم / ${totalCount} طلبية`}
          </span>
        </div>
      </div>

      {/* Earnings Bar Visualizer Chart */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>{t('analytics.earningsChart')}</span>
        </h3>

        <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
          {daysData.map((d, i) => {
            const heightPercent = Math.round((d.amount / maxAmount) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition">
                  {d.amount}
                </span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-indigo-500 hover:from-emerald-500 hover:to-teal-400 transition-all duration-300"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] font-bold text-slate-500 truncate w-full text-center">
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Performance Advice */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-2 border border-indigo-700 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
          <Sparkles className="w-4 h-4" />
          <span>نصيحة الأداء الذكية لهذا الأسبوع:</span>
        </div>
        <p className="text-xs text-indigo-100 leading-relaxed">
          أعلى المبيعات لديك كانت في الساعات الذكية Ultra Series 9 والسماعات اللاسلكية ANC بفرص أرباح تتجاوز 2200دج للقطعة. ننصحك بالتركيز على إعلانات الفيديو على الجزائر ووهران لقوة الطلب عليها.
        </p>
      </div>
    </div>
  );
}
