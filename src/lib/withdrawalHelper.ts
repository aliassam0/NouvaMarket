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
const DELETED_WITHDRAWALS_KEY = 'nouva_deleted_withdrawals_ids_v1';

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

export function getDeletedWithdrawalIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_WITHDRAWALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map(String));
      }
    }
  } catch (e) {
    console.error('Error reading deleted withdrawals:', e);
  }
  return new Set<string>();
}

export function markWithdrawalDeleted(id: string): void {
  try {
    const current = getDeletedWithdrawalIds();
    current.add(String(id));
    localStorage.setItem(DELETED_WITHDRAWALS_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.error('Error blacklisting withdrawal:', e);
  }

  try {
    fetch(`/api/reseller/withdrawals/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch {}
}

export function deleteWithdrawalRequest(id: string): boolean {
  markWithdrawalDeleted(id);
  try {
    const current = getStoredWithdrawals();
    const updated = current.filter((w) => w && w.id !== id);
    saveStoredWithdrawals(updated);
    return true;
  } catch (e) {
    console.error('Error deleting withdrawal:', e);
    return false;
  }
}

export function getStoredWithdrawals(): WithdrawalRequest[] {
  const deletedIds = getDeletedWithdrawalIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WITHDRAWALS);
    if (!raw) {
      const filtered = INITIAL_WITHDRAWALS.filter((w) => !deletedIds.has(w.id));
      localStorage.setItem(STORAGE_KEY_WITHDRAWALS, JSON.stringify(filtered));
      return filtered;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_WITHDRAWALS.filter((w) => !deletedIds.has(w.id));
    const seen = new Set<string>();
    const deduplicated: WithdrawalRequest[] = [];
    for (const item of parsed) {
      if (item && item.id && !deletedIds.has(item.id)) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduplicated.push(item);
        }
      }
    }
    return deduplicated;
  } catch (e) {
    console.error('Error loading withdrawals:', e);
    return INITIAL_WITHDRAWALS.filter((w) => !deletedIds.has(w.id));
  }
}

export function saveStoredWithdrawals(withdrawals: WithdrawalRequest[]): void {
  try {
    const deletedIds = getDeletedWithdrawalIds();
    const seen = new Set<string>();
    const deduplicated: WithdrawalRequest[] = [];
    for (const item of withdrawals) {
      if (item && item.id && !deletedIds.has(item.id)) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduplicated.push(item);
        }
      }
    }
    localStorage.setItem(STORAGE_KEY_WITHDRAWALS, JSON.stringify(deduplicated));
    window.dispatchEvent(new CustomEvent('nouva_withdrawals_updated', { detail: deduplicated }));

    // Background push sync to server
    if (deduplicated.length > 0) {
      fetch('/api/reseller/withdrawals/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawals: deduplicated }),
      }).catch(() => {});
    }
  } catch (e) {
    console.error('Error saving withdrawals:', e);
  }
}

export async function syncWithdrawalsWithServer(): Promise<WithdrawalRequest[]> {
  try {
    const local = getStoredWithdrawals();
    const res = await fetch('/api/reseller/withdrawals');
    if (!res.ok) return local;
    const data = await res.json();
    const remoteList: WithdrawalRequest[] = Array.isArray(data) ? data : (data.withdrawals || []);
    if (!Array.isArray(remoteList)) return local;

    const deletedIds = getDeletedWithdrawalIds();
    const map = new Map<string, WithdrawalRequest>();

    remoteList.forEach((w) => {
      if (w && w.id && !deletedIds.has(w.id)) {
        map.set(w.id, w);
      }
    });

    let hasLocalOnly = false;
    local.forEach((w) => {
      if (!w || !w.id || deletedIds.has(w.id)) return;
      if (map.has(w.id)) {
        map.set(w.id, { ...map.get(w.id)!, ...w });
      } else {
        map.set(w.id, w);
        hasLocalOnly = true;
      }
    });

    const merged = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY_WITHDRAWALS, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('nouva_withdrawals_updated', { detail: merged }));

    if (hasLocalOnly && merged.length > 0) {
      fetch('/api/reseller/withdrawals/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawals: merged }),
      }).catch(() => {});
    }

    return merged;
  } catch (err) {
    return getStoredWithdrawals();
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
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 90000 + 10000)}`;
  const newReq: WithdrawalRequest = {
    id: `WTH-${uniqueId}`,
    sellerId: data.sellerId,
    sellerName: data.sellerName,
    storeName: data.storeName,
    phone: data.phone,
    amountDzd: Math.max(0, data.amountDzd),
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

/**
 * Zero out the amount of a specific withdrawal request
 */
export function zeroWithdrawalAmount(id: string): boolean {
  const withdrawals = getStoredWithdrawals();
  let found = false;
  const updated = withdrawals.map((w) => {
    if (w.id === id) {
      found = true;
      return { ...w, amountDzd: 0 };
    }
    return w;
  });
  if (found) {
    saveStoredWithdrawals(updated);
    return true;
  }
  return false;
}

/**
 * Zero out withdrawal amounts with specific status filter ('ALL' | 'APPROVED' | 'PENDING' | 'REJECTED')
 */
export function zeroWithdrawalAmountsByStatus(
  targetStatus: 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' = 'ALL'
): { count: number; totalZeroed: number } {
  const withdrawals = getStoredWithdrawals();
  let count = 0;
  let totalZeroed = 0;
  const updated = withdrawals.map((w) => {
    if (targetStatus === 'ALL' || w.status === targetStatus) {
      if (w.amountDzd > 0) {
        count++;
        totalZeroed += w.amountDzd;
      }
      return { ...w, amountDzd: 0 };
    }
    return w;
  });
  saveStoredWithdrawals(updated);
  return { count, totalZeroed };
}

/**
 * Reset all withdrawal amounts to zero across all records
 */
export function zeroAllWithdrawals(): { count: number; totalZeroed: number } {
  return zeroWithdrawalAmountsByStatus('ALL');
}

/**
 * Clear all withdrawal records from storage
 */
export function clearAllWithdrawals(): void {
  saveStoredWithdrawals([]);
}
