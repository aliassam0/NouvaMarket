import React, { useState } from 'react';
import {
  Search,
  Truck,
  Package,
  User,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Zap,
  Building2,
  Calendar,
  FileText,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { Order } from '../../types';
import { MoneyText } from '../ui/MoneyText';

interface ShipmentTrackingToolProps {
  onShowNotice?: (msg: string) => void;
  isDarkTheme?: boolean;
}

export function ShipmentTrackingTool({ onShowNotice, isDarkTheme = false }: ShipmentTrackingToolProps) {
  const { orders, updateOrder } = useOrders();

  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Quick helper to search parcel
  const handleSearchTracking = async (codeToSearch?: string) => {
    const targetCode = (codeToSearch || trackingCodeInput).trim();
    if (!targetCode) return;

    setIsSearching(true);
    setNotFound(false);
    setSearchResult(null);

    try {
      // 1. Try querying the server Ecom Delivery endpoint
      const res = await fetch(`/Api_v1/Colis/Tracking/${encodeURIComponent(targetCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.Nb_Colis > 0 && data.Colis && data.Colis.length > 0) {
          const parcelData = data.Colis[0];
          setSearchResult({
            type: 'api',
            data: parcelData,
          });
          setIsSearching(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API lookup error, falling back to local search:', err);
    }

    // 2. Fallback to local order search in context
    const cleanCode = targetCode.toLowerCase();
    const localMatched = orders.find(
      (o) =>
        (o.trackingCode && o.trackingCode.toLowerCase() === cleanCode) ||
        o.id.toLowerCase() === cleanCode ||
        o.id.toLowerCase().replace('ord-', '') === cleanCode ||
        (o.phone && o.phone.includes(cleanCode))
    );

    if (localMatched) {
      setSearchResult({
        type: 'order',
        data: localMatched,
      });
    } else {
      setNotFound(true);
    }

    setIsSearching(false);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Live status update trigger
  const handleUpdateParcelStatus = async (situation: string, avancement: string, newOrderStatus?: any) => {
    if (!searchResult) return;

    setIsUpdatingStatus(true);
    const tracking =
      searchResult.type === 'api'
        ? searchResult.data.Tracking
        : searchResult.data.trackingCode || searchResult.data.id;

    try {
      // Trigger Webhook Callback Simulation
      const res = await fetch('/api/delivery/webhook/trigger-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking,
          situation,
          avancement,
        }),
      });
      const data = await res.json();

      if (searchResult.type === 'order' && newOrderStatus) {
        await updateOrder(searchResult.data.id, {
          status: newOrderStatus,
          situation,
          avancement,
        });
      }

      // Re-run search to get fresh updated payload
      await handleSearchTracking(tracking);

      const msg = `✔ تم تحديث حالة الشحنة #${tracking} إلى: (${situation} - ${avancement}) بنجاح!`;
      if (onShowNotice) onShowNotice(msg);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('app-toast', {
            detail: { message: msg, type: 'success' },
          })
        );
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Find sample tracking code from current orders for 1-click test
  const sampleTrackingCode =
    orders.find((o) => o.trackingCode)?.trackingCode ||
    orders[0]?.trackingCode ||
    'EC-ALG-88120';

  return (
    <div className={`p-4 sm:p-5 rounded-3xl border transition-all shadow-xl space-y-5 ${
      isDarkTheme
        ? 'bg-slate-900/90 border-slate-800 text-slate-100'
        : 'bg-white border-slate-200/80 text-slate-900'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md">
              <Truck className="w-4 h-4" />
            </div>
            <span>تتبع الشحنة المباشر (Ecom Delivery)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            أدخل رقم تتبع الشحنة لجلب بياناتها وتحديث حالتها فورياً مع شركة التوصيل.
          </p>
        </div>

        {/* Quick Sample Code Button */}
        <button
          onClick={() => {
            setTrackingCodeInput(sampleTrackingCode);
            handleSearchTracking(sampleTrackingCode);
          }}
          className="self-start sm:self-auto text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900 transition flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>جرب رقم تتبع تجريبي: <strong className="font-mono">{sampleTrackingCode}</strong></span>
        </button>
      </div>

      {/* Input Search Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearchTracking();
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={trackingCodeInput}
            onChange={(e) => setTrackingCodeInput(e.target.value)}
            placeholder="أدخل كود التتبع (مثال: EC-ALG-88120 أو EC1234AAA أو ORD-9281)..."
            className="w-full ps-10 pe-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-xs font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !trackingCodeInput.trim()}
          className="px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-extrabold text-xs shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSearching ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>جاري الاستعلام...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>بحث وتحديث الحالة</span>
            </>
          )}
        </button>
      </form>

      {/* Not Found State */}
      {notFound && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 shrink-0 text-rose-500" />
          <div>
            <p className="font-extrabold">لم يتم العثور على شحنة بهذا الرقم ({trackingCodeInput})</p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
              يرجى التأكد من كتابة كود التتبع الصحيح أو اختيار طلبية مسجلة في النظام.
            </p>
          </div>
        </div>
      )}

      {/* Parcel Result Display */}
      {searchResult && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4 animate-fadeIn">
          {/* Top Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">رقم الشحنة:</span>
              <span className="text-sm font-black font-mono text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/80 px-2.5 py-1 rounded-xl border border-violet-200 dark:border-violet-800 flex items-center gap-1.5">
                {searchResult.type === 'api' ? searchResult.data.Tracking : searchResult.data.trackingCode || searchResult.data.id}
                <button
                  onClick={() =>
                    handleCopyCode(
                      searchResult.type === 'api' ? searchResult.data.Tracking : searchResult.data.trackingCode || searchResult.data.id
                    )
                  }
                  className="hover:text-slate-900 dark:hover:text-white"
                  title="نسخ الكود"
                >
                  {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </span>
            </div>

            {/* Delivery Type Badge */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {(searchResult.type === 'api' ? searchResult.data.Stopdesk === 1 : searchResult.data.deliveryType === 'office')
                  ? '🏢 توصيل للمكتب (Stopdesk)'
                  : '🏠 توصيل للمنزل'}
              </span>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Ecom Delivery Express
              </span>
            </div>
          </div>

          {/* Grid Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer & Destination */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <User className="w-3.5 h-3.5 text-violet-500" />
                <span>بيانات الزبون والوجهة</span>
              </h3>
              <div className="text-xs space-y-1">
                <p className="font-black text-slate-900 dark:text-white text-sm">
                  {searchResult.type === 'api' ? searchResult.data.NomComplet : searchResult.data.customerName}
                </p>
                <p className="font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{searchResult.type === 'api' ? searchResult.data.Mobile_1 : searchResult.data.phone}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400 flex items-start gap-1 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    {searchResult.type === 'api'
                      ? `${searchResult.data.Commune_Bureau || ''} (${searchResult.data.IDWilaya || ''}) - ${searchResult.data.Adresse || ''}`
                      : `${searchResult.data.commune || ''} - ${searchResult.data.wilaya || ''} (${searchResult.data.address || ''})`}
                  </span>
                </p>
              </div>
            </div>

            {/* Current Parcel Status */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>حالة الشحنة الحالية (Status & Avancement)</span>
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">الحالة الرئيسية (Situation):</span>
                  <span className="font-extrabold px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {searchResult.type === 'api' ? searchResult.data.Situation : searchResult.data.situation || 'Livré'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">التطور (Avancement):</span>
                  <span className="font-extrabold px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                    {searchResult.type === 'api' ? searchResult.data.Avancement : searchResult.data.avancement || 'En livraison'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">المبلغ الإجمالي (المحصل):</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {searchResult.type === 'api' ? searchResult.data.Total : searchResult.data.totalAmount} دج
                  </span>
                </div>

                {(searchResult.type === 'api' ? searchResult.data.Commentaire : searchResult.data.noteFournisseur) && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                    "{searchResult.type === 'api' ? searchResult.data.Commentaire : searchResult.data.noteFournisseur}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Article details */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs flex items-center justify-between">
            <span className="font-bold text-slate-500 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-violet-500" />
              <span>محتوى الطرد:</span>
            </span>
            <span className="font-black text-slate-900 dark:text-white truncate max-w-[250px] sm:max-w-md">
              {searchResult.type === 'api'
                ? searchResult.data.Article
                : searchResult.data.items?.map((i: any) => i.productName).join(' + ') || 'منتجات ملابس أطفال'}
            </span>
          </div>

          {/* Live Status Action Panel */}
          <div className="p-4 rounded-2xl bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-violet-900 dark:text-violet-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-current" />
                <span>تحديث حالة الشحنة فورياً (Ecom Live Status Update)</span>
              </h4>
              <span className="text-[10px] text-violet-600 dark:text-violet-300 font-bold">
                تحديث متزامن مع الخادم
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleUpdateParcelStatus('Livré', 'Livré', 'DELIVERED')}
                disabled={isUpdatingStatus}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs flex flex-col items-center gap-1 shadow-md transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✅ تم التسليم (Livré)</span>
              </button>

              <button
                onClick={() => handleUpdateParcelStatus('EnCours', 'En livraison', 'SHIPPED')}
                disabled={isUpdatingStatus}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs flex flex-col items-center gap-1 shadow-md transition disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                <span>🚚 قيد التوصيل</span>
              </button>

              <button
                onClick={() => handleUpdateParcelStatus('Reporté', 'Ne répond pas')}
                disabled={isUpdatingStatus}
                className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-black text-xs flex flex-col items-center gap-1 shadow-md transition disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                <span>⏳ لم يرد / مؤجل</span>
              </button>

              <button
                onClick={() => handleUpdateParcelStatus('Retour', 'Retour Fournisseur', 'FAILED')}
                disabled={isUpdatingStatus}
                className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs flex flex-col items-center gap-1 shadow-md transition disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>❌ مرتجع (Retour)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
