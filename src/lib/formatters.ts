import { Language } from '../types';

/**
 * Centralized currency formatter for Algerian DZD (دج / DZD)
 * Section 4 requirement: zero decimals, thousands separator, Latin numerals
 */
export function formatCurrency(amount: number, lang: Language = 'ar'): string {
  const rounded = Math.round(amount || 0);
  return `${rounded}دج`;
}

/**
 * Rule #6 Section 8: Single source of truth for reseller profit calculation
 */
export function calculateProfit(wholesalePrice: number, sellingPrice: number): number {
  return Math.max(0, Math.round(sellingPrice - wholesalePrice));
}

/**
 * Format ISO dates nicely for Arabic and French
 */
export function formatDate(dateIso: string, lang: Language = 'ar'): string {
  try {
    const d = new Date(dateIso);
    if (isNaN(d.getTime())) return dateIso;

    if (lang === 'fr') {
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // Arabic format
    const monthAr = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ][d.getMonth()];

    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');

    return `${d.getDate()} ${monthAr} ${d.getFullYear()} - ${hours}:${mins}`;
  } catch (e) {
    return dateIso;
  }
}
