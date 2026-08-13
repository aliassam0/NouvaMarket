export interface RewardRank {
  id: string;
  nameAr: string;
  nameFr: string;
  requiredOrders: number;
  bonus: string;
  cashBonusAmount?: number;
  color: string;
  badgeIcon: string;
  perksAr?: string[];
}

export const DEFAULT_RANKS: RewardRank[] = [
  {
    id: 'bronze',
    nameAr: 'المستوى البرونزي',
    nameFr: 'Bronze',
    requiredOrders: 0,
    bonus: 'عمولة أساسية بدون بونص إضافي',
    cashBonusAmount: 0,
    color: 'from-amber-700 to-amber-900',
    badgeIcon: '🥉',
    perksAr: ['عمولة بيع أساسية', 'لوحة تحكم كاملة', 'دعم فني قياسي'],
  },
  {
    id: 'silver',
    nameAr: 'المستوى الفضي',
    nameFr: 'Silver',
    requiredOrders: 10,
    bonus: '+200دج بونص على كل 5 طلبات جديدة',
    cashBonusAmount: 200,
    color: 'from-slate-400 to-slate-600',
    badgeIcon: '🥈',
    perksAr: ['+200دج بونص على كل 5 طلبات', 'أولوية في معالجة الشحن', 'دعم سريع'],
  },
  {
    id: 'gold',
    nameAr: 'المستوى الذهبي',
    nameFr: 'Gold',
    requiredOrders: 30,
    bonus: '+500دج بونص + تخفيض عينات المنتجات',
    cashBonusAmount: 500,
    color: 'from-amber-400 to-yellow-600',
    badgeIcon: '🥇',
    perksAr: ['+500دج بونص لكل 10 طلبات', 'توصيل مجاني للعينات', 'أولوية الاتصال وتأكيد الطلبيات'],
  },
  {
    id: 'platinum',
    nameAr: 'المستوى الماسي / البلاتيني',
    nameFr: 'Platinum',
    requiredOrders: 100,
    bonus: 'نسبة أرباح مضاعفة + دعم VIP 24/7',
    cashBonusAmount: 2000,
    color: 'from-cyan-400 to-blue-600',
    badgeIcon: '💎',
    perksAr: ['نسبة أرباح مخصصة مضاعفة', 'مدير حساب خاص VIP 24/7', 'دفع فوري فور التسليم'],
  },
];

export function getStoredRanks(): RewardRank[] {
  try {
    const data = localStorage.getItem('app_reward_ranks');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading reward ranks:', e);
  }
  return DEFAULT_RANKS;
}

export function saveStoredRanks(ranks: RewardRank[]): void {
  try {
    localStorage.setItem('app_reward_ranks', JSON.stringify(ranks));
    window.dispatchEvent(new CustomEvent('ranks_updated', { detail: ranks }));
  } catch (e) {
    console.error('Error saving reward ranks:', e);
  }
}
