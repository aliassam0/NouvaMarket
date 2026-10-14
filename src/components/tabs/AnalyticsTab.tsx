import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Sparkles, ShoppingBag, DollarSign, Calendar, ArrowUpRight } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { MoneyText } from '../ui/MoneyText';
import { formatDZD } from '../../lib/formatters';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  isRtl?: boolean;
}

const CustomBarTooltip = ({ active, payload, label, isRtl }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/80 text-xs backdrop-blur-md min-w-[170px] space-y-1.5 z-50">
        <div className="flex items-center justify-between border-b border-slate-700/70 pb-1.5">
          <span className="font-bold text-purple-300">{data.label || label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">
            {data.ordersCount} {isRtl ? 'طلبات' : 'cmdes'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-300">{isRtl ? 'حجم المبيعات:' : 'Volume ventes:'}</span>
          <span className="font-black text-emerald-400">{formatDZD(data.salesVolume)}</span>
        </div>
        {data.profit > 0 && (
          <div className="flex items-center justify-between gap-4 pt-0.5 border-t border-slate-800">
            <span className="text-slate-400">{isRtl ? 'الأرباح:' : 'Profit:'}</span>
            <span className="font-bold text-amber-300">+{formatDZD(data.profit)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function AnalyticsTab() {
  const { t, isRtl } = useLanguage();
  const { user } = useAuth();
  const { orders } = useOrders();
  const [activeMetric, setActiveMetric] = useState<'salesVolume' | 'profit'>('salesVolume');

  // Filter relevant orders for this reseller
  const userOrders = useMemo(() => {
    return orders.filter(
      (o) => o.resellerId === user?.id || o.resellerEmail === user?.email || o.resellerPhone === user?.phone || !user?.id
    );
  }, [orders, user]);

  const deliveredOrders = useMemo(() => userOrders.filter((o) => o.status === 'DELIVERED'), [userOrders]);
  const totalCount = userOrders.length;
  const deliveredCount = deliveredOrders.length;

  const totalEarned = deliveredOrders.reduce((sum, o) => sum + (o.totalProfit || 0), 0);
  const deliveryRate = totalCount > 0 ? ((deliveredCount / totalCount) * 100).toFixed(1) : '0.0';

  // Compute daily sales volume and stats for the last 7 days
  const last7DaysData = useMemo(() => {
    const data = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);

      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      // Find orders matching this day
      const dayOrders = userOrders.filter((o) => {
        if (!o.createdAt) return false;
        const orderDate = new Date(o.createdAt);
        return orderDate >= targetDate && orderDate < nextDate;
      });

      const daySalesVolume = dayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      const dayProfit = dayOrders.reduce((sum, o) => sum + (Number(o.totalProfit) || 0), 0);
      const count = dayOrders.length;

      // Locale-friendly day names
      const dayName = targetDate.toLocaleDateString(isRtl ? 'ar-DZ' : 'fr-FR', { weekday: 'short' });
      const dayNum = targetDate.toLocaleDateString(isRtl ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'short' });

      data.push({
        date: targetDate.toISOString().split('T')[0],
        day: dayName,
        fullDate: dayNum,
        label: `${dayName} (${dayNum})`,
        salesVolume: daySalesVolume,
        profit: dayProfit,
        ordersCount: count,
      });
    }

    return data;
  }, [userOrders, isRtl]);

  const total7DaysSales = useMemo(() => {
    return last7DaysData.reduce((acc, d) => acc + d.salesVolume, 0);
  }, [last7DaysData]);

  const total7DaysOrders = useMemo(() => {
    return last7DaysData.reduce((acc, d) => acc + d.ordersCount, 0);
  }, [last7DaysData]);

  const maxSalesDay = useMemo(() => {
    const highest = [...last7DaysData].sort((a, b) => b.salesVolume - a.salesVolume)[0];
    return highest && highest.salesVolume > 0 ? highest : null;
  }, [last7DaysData]);

  return (
    <div className="flex-1 pb-24 overflow-y-auto p-4 text-slate-900 dark:text-slate-100 space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span>{t('analytics.title')}</span>
        </h1>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 text-xs font-bold text-purple-700 dark:text-purple-300">
          <Calendar className="w-3.5 h-3.5" />
          <span>{isRtl ? 'آخر 7 أيام' : '7 derniers jours'}</span>
        </div>
      </div>

      {/* Top Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{isRtl ? 'حجم مبيعات (7 أيام)' : 'Volume 7 jours'}</span>
            <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <span className="text-xl font-black text-purple-600 dark:text-purple-400 block">
            <MoneyText amount={total7DaysSales} />
          </span>
          <span className="text-[10px] text-slate-400 block mt-1 font-bold">
            {total7DaysOrders} {isRtl ? 'طلبية مسجلة هذا الأسبوع' : 'commandes cette semaine'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{isRtl ? 'صافي أرباح التسليم' : 'Gains livrés'}</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">
            +<MoneyText amount={totalEarned} />
          </span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-1 font-bold">
            {isRtl ? `نسبة التسليم: ${deliveryRate}% (${deliveredCount}/${totalCount})` : `Taux: ${deliveryRate}% (${deliveredCount}/${totalCount})`}
          </span>
        </div>
      </div>

      {/* Recharts Bar Chart: Daily Total Sales Volume (Last 7 Days) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{isRtl ? 'حجم المبيعات اليومية (آخر 7 أيام)' : 'Volume quotidien des ventes (7j)'}</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isRtl
                ? 'رسم بياني يوضح تطور حجم المبيعات الإجمالي اليومي بالدينار الجزائري'
                : 'Évolution du volume total des ventes journalières en DZD'}
            </p>
          </div>

          {/* Metric Selector Toggle */}
          <div className="flex gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setActiveMetric('salesVolume')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeMetric === 'salesVolume'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRtl ? 'المبيعات (دج)' : 'Ventes (DZD)'}
            </button>
            <button
              onClick={() => setActiveMetric('profit')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeMetric === 'profit'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRtl ? 'الأرباح (دج)' : 'Profits (DZD)'}
            </button>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="w-full h-56 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last7DaysData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" strokeOpacity={0.15} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`)}
              />
              <Tooltip
                content={<CustomBarTooltip isRtl={isRtl} />}
                cursor={{ fill: 'rgba(147, 51, 234, 0.08)', radius: 8 }}
              />
              <Bar
                dataKey={activeMetric}
                radius={[6, 6, 0, 0]}
                animationDuration={800}
              >
                {last7DaysData.map((entry, index) => {
                  const isMax = maxSalesDay && entry.date === maxSalesDay.date && entry[activeMetric] > 0;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        activeMetric === 'salesVolume'
                          ? isMax
                            ? '#7c3aed' // Vibrant Purple for peak
                            : '#9333ea' // Purple
                          : isMax
                          ? '#059669' // Vibrant Emerald for peak profit
                          : '#10b981' // Emerald
                      }
                      opacity={entry[activeMetric] === 0 ? 0.25 : 0.9}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 7-Day Performance Insight Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>
              {maxSalesDay
                ? isRtl
                  ? `أعلى يوم مبيعاً: ${maxSalesDay.day} (${formatDZD(maxSalesDay.salesVolume)})`
                  : `Meilleur jour: ${maxSalesDay.day} (${formatDZD(maxSalesDay.salesVolume)})`
                : isRtl
                ? 'لا توجد مبيعات مسجلة في الـ 7 أيام الأخيرة'
                : 'Aucune vente enregistrée sur les 7 derniers jours'}
            </span>
          </div>
          <span className="font-bold text-purple-600 dark:text-purple-400 text-[11px]">
            {isRtl ? `المجموع: ${formatDZD(total7DaysSales)}` : `Total: ${formatDZD(total7DaysSales)}`}
          </span>
        </div>
      </div>

      {/* AI Performance Advice */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900 to-slate-900 text-white space-y-2 border border-purple-700 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
          <Sparkles className="w-4 h-4" />
          <span>{isRtl ? 'نصيحة الأداء الذكية لهذا الأسبوع:' : 'Conseil IA de la semaine:'}</span>
        </div>
        <p className="text-xs text-purple-100 leading-relaxed">
          {isRtl
            ? 'أعلى المبيعات لديك كانت في الساعات الذكية والسماعات اللاسلكية بفرص أرباح تتجاوز 2200 دج للقطعة. ننصحك بنشر روابط المنتجات عبر ستوريات وفيسبوك ماركت بليس لرفع المبيعات اليومية.'
            : 'Vos meilleures ventes concernent les montres connectées et les écouteurs sans fil avec un profit moyen supérieur à 2200 DZD. Partagez vos liens sur vos réseaux pour booster votre volume quotidien.'}
        </p>
      </div>
    </div>
  );
}

