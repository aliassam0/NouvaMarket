import React from 'react';
import { formatCurrency } from '../../lib/formatters';
import { useLanguage } from '../../context/LanguageContext';

interface MoneyTextProps {
  amount: number;
  className?: string;
  isProfit?: boolean;
}

export function MoneyText({ amount, className = '', isProfit = false }: MoneyTextProps) {
  const { language } = useLanguage();
  const formatted = formatCurrency(amount, language);

  return (
    <span
      className={`inline-flex items-baseline font-bold tracking-tight whitespace-nowrap ${
        isProfit ? 'text-emerald-600 dark:text-emerald-400' : ''
      } ${className}`}
    >
      {formatted}
    </span>
  );
}
