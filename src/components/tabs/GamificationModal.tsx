import React, { useState, useEffect } from 'react';
import { Award, X, Zap, CheckCircle2, Lock, Star, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { useLanguage } from '../../context/LanguageContext';
import { getStoredRanks, RewardRank } from '../../lib/gamificationHelper';

interface GamificationModalProps {
  onClose: () => void;
}

export function GamificationModal({ onClose }: GamificationModalProps) {
  const { user } = useAuth();
  const { orders } = useOrders();
  const { t } = useLanguage();
  const [ranks, setRanks] = useState<RewardRank[]>(getStoredRanks);

  useEffect(() => {
    const handleUpdate = () => {
      setRanks(getStoredRanks());
    };
    window.addEventListener('ranks_updated', handleUpdate);
    return () => window.removeEventListener('ranks_updated', handleUpdate);
  }, []);

  const deliveredFromOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const userDelivered = deliveredFromOrders > 0 ? deliveredFromOrders : (user?.deliveredOrdersCount ?? 0);

  // Sort ranks ascending by required orders
  const sortedRanks = [...ranks].sort((a, b) => a.requiredOrders - b.requiredOrders);

  // Compute current rank dynamically
  const currentRankObj = [...sortedRanks]
    .reverse()
    .find((r) => userDelivered >= r.requiredOrders) || sortedRanks[0];

  // Find next target rank
  const nextRank = sortedRanks.find((r) => r.requiredOrders > userDelivered) || sortedRanks[sortedRanks.length - 1];
  const neededOrders = Math.max(0, (nextRank?.requiredOrders || 0) - userDelivered);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-2 shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            مستويات الجوائز والبونص 🌟
          </h3>
          <p className="text-xs text-slate-500">
            كلما زاد عدد طلباتك المسلمة، زادت المكافآت والبونص المباشر في محفظتك!
          </p>
        </div>

        {/* Current user progress bar */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white space-y-2 shadow-md">
          <div className="flex justify-between items-center text-xs">
            <span>مستواك الحالي: <strong className="text-amber-300">{currentRankObj.nameAr}</strong></span>
            <span>{userDelivered} طلبية سلمت</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(neededOrders > 0 ? 5 : 100, (userDelivered / (nextRank?.requiredOrders || 50)) * 100))}%` }}
            />
          </div>
          <div className="text-[10px] text-violet-200 text-center">
            {neededOrders > 0 && currentRankObj.id !== nextRank.id ? (
              <>تبعد {neededOrders} طلبية فقط عن فتح {nextRank?.nameAr} ({nextRank?.bonus}) 🚀</>
            ) : (
              <>أنت في أعلى مستويات الأرباح والبونص الممتاز! 🎉</>
            )}
          </div>
        </div>

        {/* Ranks Cards */}
        <div className="space-y-2.5">
          {ranks.map((r, i) => {
            const isCurrent = currentRankObj.id === r.id;
            return (
              <div
                key={r.id || i}
                className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/50 dark:bg-amber-950/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${r.color || 'from-amber-500 to-yellow-600'} text-white font-black flex items-center justify-center text-sm shadow-xs`}
                  >
                    {r.badgeIcon || (i + 1)}
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {r.nameAr}
                    </span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">{r.bonus}</span>
                    {r.perksAr && r.perksAr.length > 0 && (
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {r.perksAr.join(' • ')}
                      </span>
                    )}
                  </div>
                </div>

                {isCurrent ? (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white font-bold text-[10px] shadow-2xs shrink-0">
                    مستواك الحالي
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-extrabold shrink-0 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-lg">
                    {r.requiredOrders} طلبية
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition cursor-pointer"
        >
          فهمت، واصل البيع!
        </button>
      </div>
    </div>
  );
}
