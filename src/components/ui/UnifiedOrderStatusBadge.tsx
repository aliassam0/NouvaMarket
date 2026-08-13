import React from 'react';
import { Truck, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { Order } from '../../types';

interface UnifiedOrderStatusBadgeProps {
  order: Order;
}

// Official API status list provided by the user
export const OFFICIAL_DELIVERY_API_STATUSES = [
  'En Préparation',
  'En Traitement',
  'Au Bureau',
  'Sortir en livraison',
  'En livraison',
  'Dispatcher',
  'Retour Fournisseur',
  'Récupérer',
  'Perdu',
  'EnCours',
  'Ne Réponde pas #1',
  'Ne Réponde pas #2',
  'Ne Réponde pas #3',
  'Annuler',
  'Annuler x3',
  'Attend Information',
  'Reporté',
  'Reporté Commune Erronée',
  'Reporté Wilaya Erronée',
  'BIZ',
  'Appel Tel',
  'SMS Envoyé',
  'Recouvert',
] as const;

export function getSingleOrderStatus(order: Order): string {
  if (order.status === 'LINK_ORDER') {
    return 'طلب من الرابط';
  }
  // If order has situation and it's not generic 'EnCours', return situation
  if (order.situation && order.situation !== 'EnCours') {
    return order.situation;
  }
  // Otherwise return avancement if set
  if (order.avancement) {
    return order.avancement;
  }
  // Standard app status fallbacks mapped to official list
  if (order.status === 'DELIVERED') return 'Recouvert';
  if (order.status === 'CANCELLED' || order.status === 'FAILED') return 'Annuler';
  if (order.status === 'SHIPPED') return 'En livraison';
  if (order.adminConfirmed || order.status === 'CONFIRMED') return 'En Traitement';
  return 'En Préparation';
}

export function UnifiedOrderStatusBadge({ order }: UnifiedOrderStatusBadgeProps) {
  const trackingCode = order.trackingCode || `TC${order.id.replace('ORD-', '')}LHJ`;
  const currentSingleStatus = getSingleOrderStatus(order);

  // Status Styling Logic
  const isDelivered = currentSingleStatus === 'Recouvert' || currentSingleStatus === 'Livré' || order.status === 'DELIVERED';
  const isCancelled = currentSingleStatus.startsWith('Annuler') || currentSingleStatus === 'Perdu' || currentSingleStatus === 'Retour Fournisseur' || order.status === 'CANCELLED';
  const isShipped = currentSingleStatus === 'En livraison' || currentSingleStatus === 'Sortir en livraison' || currentSingleStatus === 'Dispatcher';
  const isWarning = currentSingleStatus.includes('Ne Réponde pas') || currentSingleStatus.includes('Reporté') || currentSingleStatus === 'Attend Information';

  const badgeColorClass = isDelivered
    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
    : isCancelled
    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
    : isShipped
    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300'
    : isWarning
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
    : 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-violet-300';

  return (
    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 via-violet-50/50 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-800/80 border border-violet-200/80 dark:border-violet-900/60 shadow-xs space-y-2.5 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
          <Truck className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
          <span className="text-xs">حالة الطلب:</span>
        </div>
      </div>

      {/* Single Unified Order Status Box */}
      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-900/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] shrink-0">الحالة الحالية:</span>
          <span className={`px-3 py-1 rounded-xl font-mono font-extrabold text-xs border shadow-2xs flex items-center gap-1.5 ${badgeColorClass}`}>
            {isDelivered ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : isCancelled ? (
              <XCircle className="w-3.5 h-3.5" />
            ) : isWarning ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            <span>{currentSingleStatus}</span>
          </span>
        </div>
      </div>

      {/* Tracking Code Line */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-0.5">
        <span>كود التتبع: <strong className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">{trackingCode}</strong></span>
      </div>
    </div>
  );
}

