import React, { useState } from 'react';
import { X, Wifi, WifiOff, SignalLow, RefreshCw, Trash2, Database, ShieldCheck } from 'lucide-react';
import { useNetworkStatus, setSimulatedNetworkStatus, NetworkSpeed } from '../../offline/networkStatus';
import { getLocalQueue } from '../../offline/queue';
import { useOrders } from '../../context/OrderContext';

interface DevToolsDrawerProps {
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export function DevToolsDrawer({ onClose, onShowToast }: DevToolsDrawerProps) {
  const { networkSpeed } = useNetworkStatus();
  const { syncPendingQueue } = useOrders();

  const [queue, setQueue] = useState(getLocalQueue());

  const handleSpeedChange = (speed: NetworkSpeed) => {
    setSimulatedNetworkStatus(speed);
    onShowToast(`تم تغيير وضع الشبكة المحاكى إلى: ${speed}`);
  };

  const handleManualSync = async () => {
    await syncPendingQueue();
    setQueue(getLocalQueue());
    onShowToast('تمت محاولة مزامنة طابور الطلبات المحفوظة!');
  };

  const handleClearQueue = () => {
    localStorage.removeItem('nouvamarket_offline_orders_queue_v1');
    setQueue([]);
    onShowToast('تم مسح طابور الطلبات المحلية');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex justify-center items-center p-4">
      <div className="w-full max-w-sm bg-slate-900 text-white rounded-3xl p-5 shadow-2xl space-y-4 relative border border-slate-700">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-extrabold text-white">
            أداة اختبار الشبكة والفيابيلتي ⚙️
          </h3>
        </div>

        {/* Network speed simulator controls */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">
            محاكاة حالة الشبكة (Network Mode):
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSpeedChange('online')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                networkSpeed === 'online'
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Wifi className="w-4 h-4" />
              <span>4G / متصل</span>
            </button>

            <button
              onClick={() => handleSpeedChange('3g_slow')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                networkSpeed === '3g_slow'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <SignalLow className="w-4 h-4" />
              <span>3G بطيئة</span>
            </button>

            <button
              onClick={() => handleSpeedChange('offline')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                networkSpeed === 'offline'
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <WifiOff className="w-4 h-4" />
              <span>Offline (بدون شبكة)</span>
            </button>
          </div>
        </div>

        {/* Offline Queue Inspector */}
        <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span>طابور الطلبات المحلي:</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300">
              {queue.length} طلبية معلقة
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleManualSync}
              className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>مزامنة الطابور</span>
            </button>

            <button
              onClick={handleClearQueue}
              className="px-3 py-2 rounded-xl bg-rose-600/30 text-rose-300 font-bold text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
