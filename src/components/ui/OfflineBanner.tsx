import React from 'react';
import { WifiOff, RefreshCw, SignalLow, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '../../offline/networkStatus';
import { useOrders } from '../../context/OrderContext';
import { getLocalQueue } from '../../offline/queue';
import { useLanguage } from '../../context/LanguageContext';

export function OfflineBanner() {
  const { isOnline, networkSpeed } = useNetworkStatus();
  const { syncPendingQueue } = useOrders();
  const { language } = useLanguage();
  const [isSyncing, setIsSyncing] = React.useState(false);

  const pendingQueue = getLocalQueue();
  const pendingCount = pendingQueue.length;

  if (isOnline && networkSpeed === 'online' && pendingCount === 0) {
    return null;
  }

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncPendingQueue();
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <div
      id="offline-banner-alert"
      className={`px-4 py-2.5 text-xs font-medium text-white transition-all shadow-sm ${
        !isOnline
          ? 'bg-amber-600 dark:bg-amber-700'
          : networkSpeed === '3g_slow'
          ? 'bg-blue-600'
          : 'bg-purple-600'
      }`}
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff className="w-4 h-4 text-amber-100 shrink-0 animate-pulse" />
          ) : networkSpeed === '3g_slow' ? (
            <SignalLow className="w-4 h-4 text-blue-100 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-purple-100 shrink-0" />
          )}

          <div>
            {!isOnline ? (
              <span>
                {language === 'ar'
                  ? 'أنت تعمل بدون إنترنت (Offline). الطلبات محفوظة محلياً.'
                  : 'Mode Hors-Ligne. Les commandes sont sauvegardées localement.'}
              </span>
            ) : networkSpeed === '3g_slow' ? (
              <span>
                {language === 'ar'
                  ? 'شبكة 3G ضعيفة — جاري محاولة المزامنة'
                  : 'Réseau 3G lent — Tentative de synchronisation'}
              </span>
            ) : (
              <span>
                {language === 'ar'
                  ? `يوجد ${pendingCount} طلبات بانتظار المزامنة`
                  : `${pendingCount} commandes en attente de synchro`}
              </span>
            )}

            {pendingCount > 0 && (
              <span className="ms-1 px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                {pendingCount}
              </span>
            )}
          </div>
        </div>

        {isOnline && pendingCount > 0 && (
          <button
            id="btn-sync-offline-queue"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold transition"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing
              ? language === 'ar' ? 'جاري المزامنة...' : 'Synchro...'
              : language === 'ar' ? 'مزامنة الآن' : 'Synchroniser'}
          </button>
        )}
      </div>
    </div>
  );
}
