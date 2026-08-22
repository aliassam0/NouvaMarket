import { addSellerNotification, addAdminNotification } from './notificationHelper';
import { getStoredWalletBalance, saveStoredWalletBalance, getStoredWalletTransactions, saveStoredWalletTransactions, WalletTransaction } from './walletHelper';

export interface WithdrawalRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  storeName: string;
  phone: string;
  amountDzd: number;
  method: 'CCP' | 'BARIDIMOB' | 'BANK' | 'CASH';
  accountDetails: string;
  requestDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  proofReference?: string;
  userType?: 'SELLER' | 'SUPPLIER';
}

const STORAGE_KEY_WITHDRAWALS = 'nouva_withdrawals_v2';

const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'WTH-1092',
    sellerId: 'u-seller-1',
    sellerName: 'أحمد محمود',
    storeName: 'متجر التميز والروائع',
    phone: '0550123456',
    amountDzd: 15000,
    method: 'BARIDIMOB',
    accountDetails: 'RIP: 00799999000123456789',
    requestDate: '2026-08-12 14:30',
    status: 'PENDING',
    userType: 'SELLER',
  },
  {
    id: 'WTH-1088',
    sellerId: 'u-seller-2',
    sellerName: 'سارة العلمي',
    storeName: 'سارة شوب للتجميل',
    phone: '0661987654',
    amountDzd: 28500,
    method: 'CCP',
    accountDetails: 'CCP: 1234567 Cle 89',
    requestDate: '2026-08-11 10:15',
    status: 'APPROVED',
    proofReference: 'CCP-TRANS-9921',
    userType: 'SELLER',
  },
];

export function getStoredWithdrawals(): WithdrawalRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WITHDRAWALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_WITHDRAWALS, JSON.stringify(INITIAL_WITHDRAWALS));
      return INITIAL_WITHDRAWALS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_WITHDRAWALS;
  } catch (e) {
    console.error('Error loading withdrawals:', e);
    return INITIAL_WITHDRAWALS;
  }
}

export function saveStoredWithdrawals(withdrawals: WithdrawalRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_WITHDRAWALS, JSON.stringify(withdrawals));
    window.dispatchEvent(new CustomEvent('nouva_withdrawals_updated', { detail: withdrawals }));
  } catch (e) {
    console.error('Error saving withdrawals:', e);
  }
}

export function createWithdrawalRequest(data: {
  sellerId: string;
  sellerName: string;
  storeName: string;
  phone: string;
  amountDzd: number;
  method: 'CCP' | 'BARIDIMOB' | 'BANK' | 'CASH';
  accountDetails: string;
  userType?: 'SELLER' | 'SUPPLIER';
}): WithdrawalRequest {
  const withdrawals = getStoredWithdrawals();
  const newReq: WithdrawalRequest = {
    id: `WTH-${Math.floor(Math.random() * 8999 + 1000)}`,
    sellerId: data.sellerId,
    sellerName: data.sellerName,
    storeName: data.storeName,
    phone: data.phone,
    amountDzd: data.amountDzd,
    method: data.method,
    accountDetails: data.accountDetails,
    requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
    status: 'PENDING',
    userType: data.userType || 'SELLER',
  };

  const updated = [newReq, ...withdrawals];
  saveStoredWithdrawals(updated);

  addAdminNotification({
    type: 'wallet',
    titleAr: '💰 طلب سحب أرباح جديد بانتظار الموافقة',
    bodyAr: `قدم البائع (${data.sellerName} - ${data.storeName}) طلب سحب بمبلغ ${data.amountDzd.toLocaleString()} دج عبر ${data.method}.`,
  });

  return newReq;
}

export function approveWithdrawalRequest(id: string, proofReference?: string): boolean {
  const withdrawals = getStoredWithdrawals();
  let targetReq: WithdrawalRequest | undefined;

  const updated = withdrawals.map((w) => {
    if (w.id === id) {
      targetReq = {
        ...w,
        status: 'APPROVED' as const,
        proofReference: proofReference || `TRANS-${Math.floor(Math.random() * 89999 + 10000)}`,
      };
      return targetReq;
    }
    return w;
  });

  if (!targetReq) return false;

  saveStoredWithdrawals(updated);

  // Update transaction status in seller's wallet txs
  const sellerTxs = getStoredWalletTransactions(targetReq.sellerId);
  const updatedSellerTxs = sellerTxs.map((tx) => {
    if (tx.type === 'withdrawal' && (tx.status === 'pending' || tx.description.includes(targetReq!.amountDzd.toString()))) {
      return { ...tx, status: 'completed' as const };
    }
    return tx;
  });
  saveStoredWalletTransactions(updatedSellerTxs, targetReq.sellerId);

  addSellerNotification({
    type: 'wallet',
    titleAr: '✔ تم صرف طلب السحب وتحويل الأرباح!',
    bodyAr: `تمت الموافقة على طلب السحب رقم #${targetReq.id} بمبلغ ${targetReq.amountDzd.toLocaleString()} دج وتحويل الأرباح إلى حسابك (${targetReq.accountDetails}). رقم الإثبات: ${targetReq.proofReference}`,
  });

  return true;
}

export function rejectWithdrawalRequest(id: string, reason: string): boolean {
  const withdrawals = getStoredWithdrawals();
  let targetReq: WithdrawalRequest | undefined;

  const updated = withdrawals.map((w) => {
    if (w.id === id) {
      targetReq = {
        ...w,
        status: 'REJECTED' as const,
        rejectionReason: reason || 'لم تستوفِ العملية الشروط المطلوبة',
      };
      return targetReq;
    }
    return w;
  });

  if (!targetReq) return false;

  saveStoredWithdrawals(updated);

  // Refund the seller's wallet balance
  const currentBalance = getStoredWalletBalance(targetReq.sellerId);
  const newBalance = currentBalance + targetReq.amountDzd;
  saveStoredWalletBalance(newBalance, targetReq.sellerId);

  // Add a credit refund transaction
  const sellerTxs = getStoredWalletTransactions(targetReq.sellerId);
  const refundTx: WalletTransaction = {
    id: `tx-refund-${Date.now()}`,
    type: 'credit',
    amount: targetReq.amountDzd,
    description: `استرجاع رصيد - تم رفض طلب السحب #${targetReq.id} (${reason})`,
    status: 'completed',
    date: new Date().toISOString(),
  };
  saveStoredWalletTransactions([refundTx, ...sellerTxs], targetReq.sellerId);

  addSellerNotification({
    type: 'wallet',
    titleAr: '✖ تم رفض طلب السحب وإعادة الرصيد لمحفظتك',
    bodyAr: `تم رفض طلب السحب #${targetReq.id} بمبلغ ${targetReq.amountDzd.toLocaleString()} دج. السبب: (${reason}). تم إرجاع المبلغ كاملاً إلى محفظتك المتاحة.`,
  });

  return true;
}
