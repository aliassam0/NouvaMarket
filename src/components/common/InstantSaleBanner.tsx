import React, { useState, useEffect } from 'react';
import { Sparkles, X, ArrowUpRight, Coins, Volume2, Smartphone } from 'lucide-react';

interface InstantSaleData {
  title: string;
  body: string;
  profit: number;
  orderId?: string;
  productName?: string;
  customerName?: string;
  timestamp: number;
}

interface InstantSaleBannerProps {
  onGoToOrders?: () => void;
  onGoToWallet?: () => void;
}

export const InstantSaleBanner: React.FC<InstantSaleBannerProps> = ({ onGoToOrders, onGoToWallet }) => {
  const [activeSale, setActiveSale] = useState<InstantSaleData | null>(null);

  useEffect(() => {
    const handleSaleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<InstantSaleData>;
      if (customEvent.detail) {
        setActiveSale(customEvent.detail);
      }
    };

    window.addEventListener('nouva_instant_sale', handleSaleEvent);
    return () => window.removeEventListener('nouva_instant_sale', handleSaleEvent);
  }, []);

  if (!activeSale) return null;

  return (
    <div
      dir="rtl"
      className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 animate-in fade-in slide-in-from-top-6 duration-300"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 p-4 shadow-2xl border-2 border-amber-300 ring-4 ring-amber-400/30">
        {/* Shimmer background animation */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/20 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 border border-amber-200 text-amber-950 flex items-center justify-center text-2xl shadow-md shrink-0 animate-bounce">
              💰
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  إشعار فوري PWA 🔔
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-950/80">
                  <Smartphone className="w-3 h-3" /> اهتزاز هاتف
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-950/80">
                  <Volume2 className="w-3 h-3" /> رنين مبيعة
                </span>
              </div>

              <h2 className="text-base font-black text-slate-950 mt-1">
                {activeSale.title}
              </h2>

              <p className="text-xs text-amber-950 font-medium mt-0.5 line-clamp-2">
                {activeSale.body}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveSale(null)}
            className="p-1 rounded-xl bg-black/10 hover:bg-black/20 text-slate-900 transition shrink-0 cursor-pointer"
            title="إغلاق الإشعار"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-3.5 pt-3 border-t border-amber-400/40 flex items-center justify-between gap-2">
          <div className="text-[11px] font-extrabold text-amber-950">
            تم تحديث رصيد أرباحك لحظياً 🚀
          </div>
          <div className="flex items-center gap-2">
            {onGoToWallet && (
              <button
                onClick={() => {
                  setActiveSale(null);
                  onGoToWallet();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950 text-white font-black text-xs hover:bg-slate-800 transition active:scale-95 cursor-pointer shadow-xs"
              >
                المحفظة 💼
              </button>
            )}
            {onGoToOrders && (
              <button
                onClick={() => {
                  setActiveSale(null);
                  onGoToOrders();
                }}
                className="px-3 py-1.5 rounded-xl bg-white text-slate-950 font-black text-xs hover:bg-amber-50 transition active:scale-95 cursor-pointer shadow-xs"
              >
                الطلبيات 📦
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
