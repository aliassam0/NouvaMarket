import React, { useState, useEffect } from 'react';
import {
  Truck,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Zap,
  Globe,
  Radio,
  Sliders,
  Bell,
  ArrowUpRight,
  ShieldCheck,
  Play,
  Pause,
} from 'lucide-react';
import { Order } from '../../types';
import {
  getDeliveryPartnerSyncStates,
  DeliveryPartnerSyncState,
  formatArabicSyncTime,
  getStoredSyncSettings,
  saveStoredSyncSettings,
  getStoredSyncLogs,
  SyncLogItem,
  pollOrderStatusesFromDeliveryApis,
} from '../../lib/deliverySyncManager';

interface DeliverySyncMonitorProps {
  orders: Order[];
  supplierId?: string;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOrdersUpdated?: (orders: Order[]) => void;
  isCompact?: boolean;
}

export function DeliverySyncMonitor({
  orders,
  supplierId,
  onShowToast,
  onOrdersUpdated,
  isCompact = false,
}: DeliverySyncMonitorProps) {
  const [partnerStates, setPartnerStates] = useState<DeliveryPartnerSyncState[]>(() =>
    getDeliveryPartnerSyncStates(orders, supplierId)
  );
  const [settings, setSettings] = useState(getStoredSyncSettings);
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>(getStoredSyncLogs);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [, setTick] = useState(0);

  // Refresh partner states when orders or supplierId change
  useEffect(() => {
    setPartnerStates(getDeliveryPartnerSyncStates(orders, supplierId));
  }, [orders, supplierId]);

  // Periodic tick for live relative time updating ("منذ X ثانية")
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Listen to sync events & log updates
  useEffect(() => {
    const handleSyncCompleted = () => {
      setPartnerStates(getDeliveryPartnerSyncStates(orders, supplierId));
      setSettings(getStoredSyncSettings());
      setSyncLogs(getStoredSyncLogs());
    };
    const handleLogsUpdated = () => {
      setSyncLogs(getStoredSyncLogs());
    };

    window.addEventListener('delivery_sync_completed', handleSyncCompleted);
    window.addEventListener('delivery_sync_logs_updated', handleLogsUpdated);

    return () => {
      window.removeEventListener('delivery_sync_completed', handleSyncCompleted);
      window.removeEventListener('delivery_sync_logs_updated', handleLogsUpdated);
    };
  }, [orders, supplierId]);

  // Manual Trigger: Immediate Sync with Delivery APIs
  const handleTriggerSyncNow = async () => {
    if (isSyncingNow) return;
    setIsSyncingNow(true);
    onShowToast('🔄 جاري المزامنة الآن مع خوادم شركات التوصيل (Yalidine, ZR Express, Ecom Delivery)...', 'info');

    try {
      const result = await pollOrderStatusesFromDeliveryApis(orders, {
        forceStatusChange: false,
      });

      if (onOrdersUpdated && result.updatedOrdersCount > 0) {
        onOrdersUpdated(result.allOrders);
      }

      setPartnerStates(getDeliveryPartnerSyncStates(result.allOrders, supplierId));
      setSettings(getStoredSyncSettings());
      setSyncLogs(getStoredSyncLogs());

      if (result.updatedOrdersCount > 0) {
        onShowToast(
          `✔ اكتملت المزامنة: تم تحديث حالة ${result.updatedOrdersCount} طرد (${result.deliveredCount} طرد تم تسليمه)!`,
          'success'
        );
      } else {
        onShowToast('✔ اكتملت المزامنة: جميع الطرود والشحنات متزامنة مع خوادم التوصيل.', 'success');
      }
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء الاتصال بشركات التوصيل', 'error');
    } finally {
      setIsSyncingNow(false);
    }
  };

  // Test simulation: Force a state transition to verify toast alerts for resellers
  const handleSimulateStatusAlert = async () => {
    if (isSyncingNow) return;
    setIsSyncingNow(true);
    onShowToast('⚡ جاري محاكاة تحديث حالة شحنة لاختبار إشعار البائع (App-Toast)...', 'info');

    try {
      const result = await pollOrderStatusesFromDeliveryApis(orders, {
        forceStatusChange: true,
      });

      if (onOrdersUpdated && result.updatedOrdersCount > 0) {
        onOrdersUpdated(result.allOrders);
      }

      setPartnerStates(getDeliveryPartnerSyncStates(result.allOrders, supplierId));
      setSettings(getStoredSyncSettings());
      setSyncLogs(getStoredSyncLogs());

      onShowToast('✔ تم إطلاق إشعار التحديث الفوري (App-Toast) وحفظ الحالة في السجل!', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('تعذر إجراء المحاكاة', 'error');
    } finally {
      setIsSyncingNow(false);
    }
  };

  // Toggle Auto-Polling
  const handleToggleAutoPolling = () => {
    const nextVal = !settings.autoPollingEnabled;
    const updated = { ...settings, autoPollingEnabled: nextVal };
    setSettings(updated);
    saveStoredSyncSettings(updated);
    onShowToast(
      nextVal ? '✔ تم تفعيل المزامنة الآلية الدورية في الخلفية!' : '⏸ تم إيقاف المزامنة الآلية الدورية مؤقتاً',
      nextVal ? 'success' : 'info'
    );
  };

  // Change Polling Interval
  const handleChangeInterval = (sec: number) => {
    const updated = { ...settings, intervalSeconds: sec };
    setSettings(updated);
    saveStoredSyncSettings(updated);
    onShowToast(`تم ضبط تردد المزامنة إلى كل ${sec} ثانية`, 'info');
  };

  // Summary Metrics
  const totalPendingQueue = partnerStates.reduce((sum, p) => sum + p.pendingQueueCount, 0);
  const totalInTransit = partnerStates.reduce((sum, p) => sum + p.activeParcelsInTransit, 0);
  const connectedPartnersCount = partnerStates.filter((p) => p.connectionStatus === 'CONNECTED').length;

  // COMPACT VIEW (used in headers or small tabs)
  if (isCompact) {
    return (
      <div className="p-3 rounded-2xl bg-slate-900 border border-sky-500/40 shadow-md text-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-extrabold text-sky-300">مراقب المزامنة (Sync Status):</span>
          <span className="text-slate-300 font-mono">
            {connectedPartnersCount}/{partnerStates.length} شركاء متصلين
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-300 font-bold font-mono">
            طابور الانتظار: {totalPendingQueue} طرد
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">آخر مزامنة: {formatArabicSyncTime(settings.lastGlobalSyncTimestamp)}</span>
        </div>

        <button
          onClick={handleTriggerSyncNow}
          disabled={isSyncingNow}
          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-[11px] flex items-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
          <span>مزامنة الآن</span>
        </button>
      </div>
    );
  }

  // FULL MONITOR VIEW
  return (
    <div className="p-5 rounded-3xl bg-slate-950 text-white border-2 border-sky-500/50 shadow-2xl space-y-6 animate-fadeIn">
      {/* 1. Header Bar with Global Status & Main Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500/20 to-purple-500/20 border border-sky-400/40 text-sky-400 shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>مزامنة فورية حية (Real-Time Sync Active)</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono">
                API Polling: كل {settings.intervalSeconds}ث
              </span>
            </div>
            <h3 className="font-black text-base text-white mt-1 flex items-center gap-2">
              <span>مراقب حالة الربط والمزامنة مع شركات التوصيل (Sync Status Monitor)</span>
            </h3>
            <p className="text-xs text-slate-400">
              متابعة الاتصال اللحظي بخوادم Yalidine Express, ZR Express, Ecom Delivery, Maystro وسحب التحديثات وتنبيه البائع.
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Auto Polling */}
          <button
            onClick={handleToggleAutoPolling}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
              settings.autoPollingEnabled
                ? 'bg-slate-900 border-slate-700 text-emerald-400 hover:bg-slate-800'
                : 'bg-amber-950/60 border-amber-800 text-amber-300 hover:bg-amber-900/60'
            }`}
            title={settings.autoPollingEnabled ? 'إيقاف المزامنة الدورية' : 'تفعيل المزامنة الدورية'}
          >
            {settings.autoPollingEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{settings.autoPollingEnabled ? 'المزامنة الدورية شَغّالة' : 'المزامنة موقوفة'}</span>
          </button>

          {/* Simulate Status Alert */}
          <button
            onClick={handleSimulateStatusAlert}
            disabled={isSyncingNow}
            className="px-3 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-700/60 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="محاكاة تحديث حالة طرد لاختبار إشعار البائع App-Toast"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>محاكاة إشعار بائع 🔔</span>
          </button>

          {/* Sync Now Button */}
          <button
            onClick={handleTriggerSyncNow}
            disabled={isSyncingNow}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-sky-900/40 active:scale-95 transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingNow ? 'animate-spin' : ''}`} />
            <span>{isSyncingNow ? 'جاري الاتصال والمزامنة...' : 'مزامنة فورية الآن ⚡'}</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bar (4 summary cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Connected Partners */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold">حالة الشركات</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
            {connectedPartnersCount} / {partnerStates.length}
          </div>
          <span className="text-[10px] text-slate-400 block font-medium">شركاء متصلون 200 OK</span>
        </div>

        {/* Pending Queue Count */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-amber-400">
            <span className="text-[10px] font-bold">طابور الانتظار (Queue)</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
            {totalPendingQueue} طرد
          </div>
          <span className="text-[10px] text-amber-400/80 block font-medium">بانتظار الشحن والتحديث</span>
        </div>

        {/* Parcels in Transit */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-sky-400">
            <span className="text-[10px] font-bold">قيد التوزيع (In Transit)</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-sky-400 font-mono">
            {totalInTransit} شحنة
          </div>
          <span className="text-[10px] text-sky-400/80 block font-medium">مع سائقي التوصيل</span>
        </div>

        {/* Last Sync Time */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-purple-400">
            <span className="text-[10px] font-bold">وقت آخر مزامنة</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm sm:text-base font-black text-purple-300 font-mono truncate">
            {formatArabicSyncTime(settings.lastGlobalSyncTimestamp)}
          </div>
          <span className="text-[10px] text-slate-400 block font-medium">مزامنة قاعدة البيانات المحلية</span>
        </div>
      </div>

      {/* 3. Partner Cards Grid (Yalidine, ZR Express, Ecom Delivery, Maystro...) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>حالة الاتصال المباشر مع منصات وشركاء التوصيل (Active Partners)</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">تكرار الفحص:</span>
            {[30, 45, 60, 120].map((sec) => (
              <button
                key={sec}
                onClick={() => handleChangeInterval(sec)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition ${
                  settings.intervalSeconds === sec
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {sec}ث
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {partnerStates.map((partner) => (
            <div
              key={partner.id}
              className={`p-4 rounded-2xl border transition-all ${
                partner.connectionStatus === 'CONNECTED'
                  ? 'bg-slate-900/80 border-slate-800 hover:border-sky-500/50'
                  : 'bg-amber-950/20 border-amber-900/60'
              }`}
            >
              {/* Top Row: Name & Connection Status Badge */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-bold text-xs shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                      <span>{partner.name}</span>
                      {partner.provider === 'ecom' && (
                        <span className="px-1.5 py-0.2 rounded bg-sky-950 border border-sky-700 text-sky-300 text-[9px] font-mono">
                          API v2
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 truncate block max-w-[200px]">
                      {partner.endpointUrl}
                    </span>
                  </div>
                </div>

                {/* Connection Status Pill */}
                <div className="text-left shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                      partner.connectionStatus === 'CONNECTED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        partner.connectionStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    <span>{partner.connectionStatus === 'CONNECTED' ? 'متصل 200 OK' : 'معطلة / غير متصل'}</span>
                  </span>
                </div>
              </div>

              {/* Bottom Row: Detailed Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-3 text-center text-xs font-mono">
                {/* Last Sync */}
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-sans block">آخر مزامنة</span>
                  <strong className="text-white text-[11px] block mt-0.5 truncate">
                    {partner.lastSyncTime}
                  </strong>
                </div>

                {/* Pending Queue */}
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-sans block">طابور الانتظار</span>
                  <strong className="text-amber-400 text-xs block mt-0.5">
                    {partner.pendingQueueCount} طرد
                  </strong>
                </div>

                {/* Latency */}
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-sans block">زمن الاستجابة</span>
                  <strong className="text-sky-300 text-xs block mt-0.5">
                    {partner.latencyMs} ms
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Live Sync Activity & App-Toast Event Log */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>سجل آخر التحديثات وتنبيهات البائع اللحظية (Recent Delivery Sync Alerts)</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {syncLogs.length} عمليات مسجلة
          </span>
        </div>

        {syncLogs.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center text-xs text-slate-400 font-medium">
            لا توجد تحديثات حالات طرود مسجلة بعد. عند تغير حالة أي شحنة مع شركة التوصيل (مثل الخروج للتوزيع أو التسليم)، ستظهر هنا مباشرة مع إشعار البائع.
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {syncLogs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between gap-3 text-[11px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      log.newStatus === 'DELIVERED'
                        ? 'bg-emerald-400'
                        : log.newStatus === 'SHIPPED'
                        ? 'bg-sky-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <div className="min-w-0 truncate">
                    <span className="font-mono font-bold text-sky-300 mr-1">#{log.trackingCode}</span>
                    <span className="text-slate-300">({log.customerName} - {log.wilaya}):</span>{' '}
                    <span className="text-white font-bold">{log.statusLabelAr}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-slate-400 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-sans">
                    {log.courierName}
                  </span>
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
