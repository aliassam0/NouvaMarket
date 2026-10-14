import { addSellerNotification } from './notificationHelper';

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'withdrawal';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

const WALLET_BALANCE_KEY = 'reseller_wallet_balance_v1';
const WALLET_TXS_KEY = 'reseller_wallet_transactions_v1';

const INITIAL_TRANSACTIONS: WalletTransaction[] = [];

function getBalanceKey(userId?: string) {
  return userId ? `reseller_wallet_balance_${userId}` : 'reseller_wallet_balance_v1';
}

function getTxsKey(userId?: string) {
  return userId ? `reseller_wallet_transactions_${userId}` : 'reseller_wallet_transactions_v1';
}

export function getStoredWalletBalance(userId?: string, fallbackBalance?: number): number {
  try {
    const raw = localStorage.getItem(getBalanceKey(userId));
    if (raw !== null) {
      const val = parseFloat(raw);
      if (!isNaN(val)) return val;
    }
  } catch (e) {
    console.error('Error reading wallet balance:', e);
  }
  return fallbackBalance ?? 0;
}

export function saveStoredWalletBalance(amount: number, userId?: string): void {
  try {
    localStorage.setItem(getBalanceKey(userId), amount.toString());
  } catch (e) {
    console.error('Error saving wallet balance:', e);
  }
}

export function getStoredWalletTransactions(userId?: string, fallbackToDemo: boolean = false): WalletTransaction[] {
  try {
    const raw = localStorage.getItem(getTxsKey(userId));
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(
          (t) => t && !['tx-102', 'tx-101', 'tx-100', 'tx-099'].includes(t.id)
        );
        if (filtered.length !== parsed.length) {
          saveStoredWalletTransactions(filtered, userId);
        }
        return filtered;
      }
    }
  } catch (e) {
    console.error('Error reading wallet txs:', e);
  }
  return [];
}

export function saveStoredWalletTransactions(txs: WalletTransaction[], userId?: string): void {
  try {
    localStorage.setItem(getTxsKey(userId), JSON.stringify(txs));
  } catch (e) {
    console.error('Error saving wallet txs:', e);
  }
}

export function creditResellerCommission(orderId: string, amount: number, userId?: string): { success: boolean; newBalance: number } {
  const currentBalance = getStoredWalletBalance(userId);
  const txs = getStoredWalletTransactions(userId);

  // Check if already credited for this order
  const existing = txs.find((tx) => tx.description.includes(`#${orderId}`));
  if (existing) {
    return { success: false, newBalance: currentBalance };
  }

  const profitAmount = amount > 0 ? amount : 1000;
  const newBalance = currentBalance + profitAmount;

  const newTx: WalletTransaction = {
    id: `tx-comm-${Date.now()}`,
    type: 'credit',
    amount: profitAmount,
    description: `أرباح عمولة طلبية تسليم ناجح #${orderId}`,
    status: 'completed',
    date: new Date().toISOString(),
  };

  const updatedTxs = [newTx, ...txs];

  saveStoredWalletBalance(newBalance, userId);
  saveStoredWalletTransactions(updatedTxs, userId);

  addSellerNotification({
    type: 'wallet',
    titleAr: '💰 تم إيداع أرباح جديدة بمحفظتك!',
    bodyAr: `تم إضافة عمولة أرباح بمبلغ (+${profitAmount} دج) عن الطلبية #${orderId}. رصيد محفظتك المتاح الآن: ${newBalance} دج.`,
  });

  return { success: true, newBalance };
}
