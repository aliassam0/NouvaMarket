import React from 'react';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { useLanguage } from '../../context/LanguageContext';

interface ProfitBadgeProps {
  profit: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfitBadge({ profit, label, size = 'md' }: ProfitBadgeProps) {
  const { language } = useLanguage();

  const paddingClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm'
      : 'px-2.5 py-1 text-xs';

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs whitespace-nowrap ${paddingClass}`}
    >
      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span>{label || (language === 'ar' ? 'ربحك:' : 'Profit:')}</span>
      <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
        +{formatCurrency(profit, language)}
      </span>
    </div>
  );
}
