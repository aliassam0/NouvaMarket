import { SupplierProfile, SupplierSettlement, MarketplaceFeeSettings } from '../types';

const STORAGE_KEY_SUPPLIERS = 'nouva_suppliers_v2';
const STORAGE_KEY_SETTLEMENTS = 'nouva_settlements_v1';
const STORAGE_KEY_FEES = 'nouva_marketplace_fees_v1';

export const INITIAL_SUPPLIERS: SupplierProfile[] = [
  {
    id: 'sup-09329',
    fullName: 'Ali',
    companyName: 'Ali store',
    phone: '055555555',
    email: 'ali.assam.geo@gmail.com',
    password: 'aliassam',
    wilaya: '16 - الجزائر',
    activityType: 'ألبسة ونسيج',
    status: 'PENDING',
    ccpOrRip: 'CCP / BaridiMob Pending',
    createdAt: '2026-09-22',
    totalProductsCount: 0,
    totalDeliveredOrders: 0,
    totalSalesDzd: 0,
    nouvaCommissionDzd: 0,
    resellerCommissionsDzd: 0,
    paidAmountDzd: 0,
  },
  {
    id: 'sup-201',
    fullName: 'أحمد بن قاسم',
    companyName: 'مصنع الأقمشة والملابس الجاهزة',
    phone: '0770987654',
    email: 'ahmed.textile@nouvasupplier.dz',
    password: 'supplierpass123',
    wilaya: '19 - سطيف',
    activityType: 'ألبسة ونسيج وتصنيع',
    status: 'PENDING',
    ccpOrRip: '0012345678 99',
    baridiMobNumber: '00799999001234567899',
    createdAt: '2026-09-22',
    totalProductsCount: 14,
    totalDeliveredOrders: 0,
    totalSalesDzd: 0,
    nouvaCommissionDzd: 0,
    resellerCommissionsDzd: 0,
    paidAmountDzd: 0,
  },
  {
    id: 'sup-202',
    fullName: 'رشيد زواوي',
    companyName: 'مستودع زواوي للتجهيزات المنزلية',
    phone: '0554112233',
    email: 'rachid.warehouses@gmail.com',
    password: 'supplierpass123',
    wilaya: '09 - البليدة',
    activityType: 'أجهزة كهرومنزلية ومستلزمات',
    status: 'PENDING',
    ccpOrRip: '0022334455 11',
    baridiMobNumber: '00799999002233445511',
    createdAt: '2026-09-22',
    totalProductsCount: 8,
    totalDeliveredOrders: 0,
    totalSalesDzd: 0,
    nouvaCommissionDzd: 0,
    resellerCommissionsDzd: 0,
    paidAmountDzd: 0,
  },
];

export const INITIAL_SETTLEMENTS: SupplierSettlement[] = [];

export const DEFAULT_FEES: MarketplaceFeeSettings = {
  supplierFeePercent: 5,
  resellerFeePercent: 0,
  defaultSupplierFeePercent: 5,
  defaultResellerCommissionPercent: 0,
  resellerMinProfitMargin: 0,
  lastUpdated: new Date().toISOString().split('T')[0],
};

// ---------------- SUPPLIERS HELPERS ----------------
// In-memory cache to ensure sync across fast re-renders
let cachedSuppliers: SupplierProfile[] | null = null;
let isSyncingSuppliersWithServer = false;

const STORAGE_KEY_DELETED_SUPPLIERS = 'nouva_deleted_suppliers_ids_v1';

export function getDeletedSupplierIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_SUPPLIERS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

export function markSupplierDeleted(supplierId: string): void {
  try {
    const set = getDeletedSupplierIds();
    set.add(supplierId);
    localStorage.setItem(STORAGE_KEY_DELETED_SUPPLIERS, JSON.stringify(Array.from(set)));
  } catch {}
}

export function unmarkSupplierDeleted(supplierId: string): void {
  try {
    const set = getDeletedSupplierIds();
    set.delete(supplierId);
    localStorage.setItem(STORAGE_KEY_DELETED_SUPPLIERS, JSON.stringify(Array.from(set)));
  } catch {}
}

export async function syncSuppliersWithServer(): Promise<SupplierProfile[]> {
  if (typeof window === 'undefined') return cachedSuppliers || INITIAL_SUPPLIERS;
  try {
    const deletedIds = getDeletedSupplierIds();
    const res = await fetch('/api/reseller/suppliers');
    const text = await res.text();
    if (text && !text.trim().startsWith('<')) {
      const data = JSON.parse(text);
      if (data && Array.isArray(data.suppliers)) {
        const serverSuppliers: SupplierProfile[] = data.suppliers;
        let raw = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
        let currentLocal: SupplierProfile[] = [];
        if (raw) {
          try {
            currentLocal = JSON.parse(raw);
          } catch {}
        }
        if (!Array.isArray(currentLocal) || currentLocal.length === 0) {
          currentLocal = INITIAL_SUPPLIERS.filter((s) => !deletedIds.has(s.id));
        }

        // Notify server if it still has any supplier that was deleted locally
        serverSuppliers.forEach((s) => {
          if (s && s.id && deletedIds.has(s.id)) {
            fetch(`/api/reseller/suppliers/${encodeURIComponent(s.id)}`, { method: 'DELETE' }).catch(() => {});
          }
        });

        const validServerSuppliers = serverSuppliers.filter((s) => s && s.id && !deletedIds.has(s.id));

        const map = new Map<string, SupplierProfile>();
        // First add initial seeds that were NOT deleted
        INITIAL_SUPPLIERS.forEach((s) => {
          if (!deletedIds.has(s.id)) map.set(s.id, s);
        });
        // Then add server suppliers
        validServerSuppliers.forEach((s) => {
          map.set(s.id, { ...map.get(s.id), ...s });
        });
        // Then merge local suppliers
        currentLocal.forEach((s) => {
          if (s && s.id && !deletedIds.has(s.id)) {
            if (!map.has(s.id)) {
              fetch('/api/reseller/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(s),
              }).catch(() => {});
            }
            map.set(s.id, { ...map.get(s.id), ...s });
          }
        });
        const merged = Array.from(map.values());
        if (merged.length > 0) {
          localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(merged));
          cachedSuppliers = merged;
          window.dispatchEvent(new CustomEvent('nouva_suppliers_updated', { detail: merged }));
        }
        return merged;
      }
    }
  } catch (e) {
    console.error('Error syncing suppliers from server:', e);
  }
  return getStoredSuppliers();
}

export function getStoredSuppliers(): SupplierProfile[] {
  try {
    const deletedIds = getDeletedSupplierIds();
    let raw = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
    let localList: SupplierProfile[] = [];
    if (raw) {
      localList = JSON.parse(raw);
      if (!Array.isArray(localList)) localList = [];
    }

    // Filter out any supplier that was deleted
    localList = localList.filter((s) => s && s.id && !deletedIds.has(s.id));

    // Check previous keys (e.g., nouva_suppliers_v1) to preserve all historical suppliers
    if (localList.length === 0) {
      const prevKeys = ['nouva_suppliers_v1', 'nouva_suppliers'];
      for (const pKey of prevKeys) {
        const pRaw = localStorage.getItem(pKey);
        if (pRaw) {
          try {
            const pParsed = JSON.parse(pRaw);
            if (Array.isArray(pParsed) && pParsed.length > 0) {
              localList = pParsed.filter((s: SupplierProfile) => s && s.id && !deletedIds.has(s.id));
              if (localList.length > 0) {
                localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(localList));
                break;
              }
            }
          } catch {}
        }
      }
    }

    // If still empty, seed with INITIAL_SUPPLIERS that were not deleted
    if (localList.length === 0) {
      localList = INITIAL_SUPPLIERS.filter((s) => !deletedIds.has(s.id));
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(localList));
    } else {
      // Smart merge to ensure no seed accounts (like Ali store) are missing unless deleted
      const existingMap = new Map<string, SupplierProfile>(localList.map((s) => [s.id, s]));
      let hasChanges = false;
      INITIAL_SUPPLIERS.forEach((seed) => {
        if (!deletedIds.has(seed.id) && !existingMap.has(seed.id)) {
          localList.unshift(seed);
          existingMap.set(seed.id, seed);
          hasChanges = true;
        }
      });
      if (hasChanges) {
        localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(localList));
      }
    }

    // Trigger background sync with server
    if (!isSyncingSuppliersWithServer && typeof window !== 'undefined') {
      isSyncingSuppliersWithServer = true;
      syncSuppliersWithServer().finally(() => {
        isSyncingSuppliersWithServer = false;
      });
    }

    cachedSuppliers = localList;
    return localList;
  } catch (e) {
    const deletedIds = getDeletedSupplierIds();
    return (cachedSuppliers || INITIAL_SUPPLIERS).filter((s) => !deletedIds.has(s.id));
  }
}

export function saveStoredSuppliers(suppliers: SupplierProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(suppliers));
    cachedSuppliers = suppliers;
    window.dispatchEvent(new CustomEvent('nouva_suppliers_updated', { detail: suppliers }));
  } catch (e) {
    console.error('Error saving suppliers:', e);
  }
}

export function addSupplierRegistration(data: {
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  password?: string;
  wilaya: string;
  activityType: string;
  ccpOrRip: string;
  baridiMobNumber?: string;
}): SupplierProfile {
  const suppliers = getStoredSuppliers();
  const existing = suppliers.find(
    (s) => (s.email && s.email.trim().toLowerCase() === (data.email || '').trim().toLowerCase()) ||
           (s.phone && s.phone.trim() === (data.phone || '').trim())
  );

  if (existing) {
    unmarkSupplierDeleted(existing.id);
    // Update existing rather than creating duplicate, preserving account
    const updatedSupplier: SupplierProfile = {
      ...existing,
      fullName: data.fullName || existing.fullName,
      companyName: data.companyName || existing.companyName,
      password: data.password || existing.password,
      wilaya: data.wilaya || existing.wilaya,
      activityType: data.activityType || existing.activityType,
      ccpOrRip: data.ccpOrRip || existing.ccpOrRip,
      baridiMobNumber: data.baridiMobNumber || existing.baridiMobNumber,
    };
    const updatedList = suppliers.map((s) => (s.id === existing.id ? updatedSupplier : s));
    saveStoredSuppliers(updatedList);

    // Sync with server
    fetch(`/api/reseller/suppliers/${existing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSupplier),
    }).catch(() => {});

    return updatedSupplier;
  }

  const newSupplier: SupplierProfile = {
    id: `sup-${Date.now().toString().slice(-5)}`,
    fullName: data.fullName,
    companyName: data.companyName,
    phone: data.phone,
    email: data.email,
    password: data.password || '123456',
    wilaya: data.wilaya,
    activityType: data.activityType,
    status: 'PENDING',
    ccpOrRip: data.ccpOrRip,
    baridiMobNumber: data.baridiMobNumber,
    createdAt: new Date().toISOString().split('T')[0],
    totalProductsCount: 0,
    totalDeliveredOrders: 0,
    totalSalesDzd: 0,
    nouvaCommissionDzd: 0,
    resellerCommissionsDzd: 0,
    paidAmountDzd: 0,
  };

  const updated = [newSupplier, ...suppliers];
  saveStoredSuppliers(updated);

  // Sync to server immediately
  fetch('/api/reseller/suppliers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSupplier),
  }).catch(() => {});

  return newSupplier;
}

export function updateSupplierStatus(
  supplierId: string,
  status: SupplierProfile['status'],
  rejectionReason?: string
): void {
  const suppliers = getStoredSuppliers();
  let updatedSupplierObj: SupplierProfile | null = null;
  const updated = suppliers.map((sup) => {
    if (sup.id === supplierId) {
      updatedSupplierObj = {
        ...sup,
        status,
        rejectionReason: rejectionReason || sup.rejectionReason,
      };
      return updatedSupplierObj;
    }
    return sup;
  });
  saveStoredSuppliers(updated);

  if (updatedSupplierObj) {
    fetch(`/api/reseller/suppliers/${supplierId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSupplierObj),
    }).catch(() => {});
  }
}

export function updateSupplierPassword(supplierIdOrEmail: string, newPassword: string): boolean {
  try {
    const suppliers = getStoredSuppliers();
    let found = false;
    let targetSupplier: SupplierProfile | null = null;
    const target = (supplierIdOrEmail || '').trim().toLowerCase();
    const updated = suppliers.map((sup) => {
      if (sup.id === supplierIdOrEmail || (sup.email && sup.email.trim().toLowerCase() === target)) {
        found = true;
        targetSupplier = {
          ...sup,
          password: newPassword.trim(),
        };
        return targetSupplier;
      }
      return sup;
    });

    if (found && targetSupplier) {
      saveStoredSuppliers(updated);

      // Sync with server
      fetch(`/api/reseller/suppliers/${(targetSupplier as any).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword.trim() }),
      }).catch(() => {});

      // Also update session user if currently logged in
      const sessionRaw = localStorage.getItem('nouvamarket_session_v2');
      if (sessionRaw) {
        try {
          const sessionUser = JSON.parse(sessionRaw);
          if (sessionUser && (sessionUser.id === supplierIdOrEmail || (sessionUser.email && sessionUser.email.trim().toLowerCase() === target))) {
            sessionUser.password = newPassword.trim();
            localStorage.setItem('nouvamarket_session_v2', JSON.stringify(sessionUser));
          }
        } catch (e) {
          // ignore
        }
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error updating supplier password:', e);
    return false;
  }
}

export function updateSupplierProfile(
  supplierIdOrEmail: string,
  updates: Partial<SupplierProfile>
): SupplierProfile | null {
  try {
    const suppliers = getStoredSuppliers();
    let updatedSupplier: SupplierProfile | null = null;
    const target = (supplierIdOrEmail || '').trim().toLowerCase();

    const updated = suppliers.map((sup) => {
      if (sup.id === supplierIdOrEmail || (sup.email && sup.email.trim().toLowerCase() === target)) {
        updatedSupplier = {
          ...sup,
          ...updates,
          email: updates.email ? updates.email.trim().toLowerCase() : sup.email,
        };
        return updatedSupplier;
      }
      return sup;
    });

    if (updatedSupplier) {
      saveStoredSuppliers(updated);

      // Sync with server
      fetch(`/api/reseller/suppliers/${(updatedSupplier as any).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).catch(() => {});

      // Also update session user if currently logged in
      const sessionRaw = localStorage.getItem('nouvamarket_session_v2');
      if (sessionRaw) {
        try {
          const sessionUser = JSON.parse(sessionRaw);
          if (sessionUser && (sessionUser.id === supplierIdOrEmail || (sessionUser.email && sessionUser.email.trim().toLowerCase() === target))) {
            const nextSession = { ...sessionUser, ...updates };
            localStorage.setItem('nouvamarket_session_v2', JSON.stringify(nextSession));
          }
        } catch (e) {
          // ignore
        }
      }
    }

    return updatedSupplier;
  } catch (e) {
    console.error('Error updating supplier profile:', e);
    return null;
  }
}

export function deleteSupplierRegistration(supplierId: string): void {
  // Mark as deleted in blacklist so it never reappears on reload or re-sync
  markSupplierDeleted(supplierId);
  const suppliers = getStoredSuppliers().filter((sup) => sup.id !== supplierId);
  saveStoredSuppliers(suppliers);

  // Send DELETE to server (supports both Node server and Hostinger PHP bridge)
  fetch(`/api/reseller/suppliers/${encodeURIComponent(supplierId)}`, {
    method: 'DELETE',
  }).catch(() => {});
}

// ---------------- SETTLEMENTS HELPERS ----------------
const DELETED_SETTLEMENTS_KEY = 'nouva_deleted_settlements_ids_v1';

export function getDeletedSettlementIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_SETTLEMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map(String));
      }
    }
  } catch (e) {
    console.error('Error reading deleted settlements:', e);
  }
  return new Set<string>();
}

export function markSettlementDeleted(id: string): void {
  try {
    const current = getDeletedSettlementIds();
    current.add(String(id));
    localStorage.setItem(DELETED_SETTLEMENTS_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.error('Error blacklisting settlement:', e);
  }

  try {
    fetch(`/api/reseller/settlements/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch {}
}

export function deleteStoredSettlement(id: string): boolean {
  markSettlementDeleted(id);
  try {
    const current = getStoredSettlements();
    const updated = current.filter((s) => s && s.id !== id);
    saveStoredSettlements(updated);
    return true;
  } catch (e) {
    console.error('Error deleting settlement:', e);
    return false;
  }
}

export function getStoredSettlements(): SupplierSettlement[] {
  const deletedIds = getDeletedSettlementIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTLEMENTS);
    if (!raw) {
      const filtered = INITIAL_SETTLEMENTS.filter((s) => !deletedIds.has(s.id));
      localStorage.setItem(STORAGE_KEY_SETTLEMENTS, JSON.stringify(filtered));
      return filtered;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_SETTLEMENTS.filter((s) => !deletedIds.has(s.id));
    const seen = new Set<string>();
    const deduplicated: SupplierSettlement[] = [];
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
    return INITIAL_SETTLEMENTS.filter((s) => !deletedIds.has(s.id));
  }
}

export function saveStoredSettlements(settlements: SupplierSettlement[]): void {
  try {
    const deletedIds = getDeletedSettlementIds();
    const seen = new Set<string>();
    const deduplicated: SupplierSettlement[] = [];
    for (const item of settlements) {
      if (item && item.id && !deletedIds.has(item.id)) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduplicated.push(item);
        }
      }
    }
    localStorage.setItem(STORAGE_KEY_SETTLEMENTS, JSON.stringify(deduplicated));
    window.dispatchEvent(new CustomEvent('nouva_settlements_updated', { detail: deduplicated }));

    // Background push sync to server
    if (deduplicated.length > 0) {
      fetch('/api/reseller/settlements/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlements: deduplicated }),
      }).catch(() => {});
    }
  } catch (e) {
    console.error('Error saving settlements:', e);
  }
}

export async function syncSettlementsWithServer(): Promise<SupplierSettlement[]> {
  try {
    const local = getStoredSettlements();
    const res = await fetch('/api/reseller/settlements');
    if (!res.ok) return local;
    const data = await res.json();
    const remoteList: SupplierSettlement[] = Array.isArray(data) ? data : (data.settlements || []);
    if (!Array.isArray(remoteList)) return local;

    const deletedIds = getDeletedSettlementIds();
    const map = new Map<string, SupplierSettlement>();

    remoteList.forEach((s) => {
      if (s && s.id && !deletedIds.has(s.id)) {
        map.set(s.id, s);
      }
    });

    let hasLocalOnly = false;
    local.forEach((s) => {
      if (!s || !s.id || deletedIds.has(s.id)) return;
      if (map.has(s.id)) {
        map.set(s.id, { ...map.get(s.id)!, ...s });
      } else {
        map.set(s.id, s);
        hasLocalOnly = true;
      }
    });

    const merged = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY_SETTLEMENTS, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('nouva_settlements_updated', { detail: merged }));

    if (hasLocalOnly && merged.length > 0) {
      fetch('/api/reseller/settlements/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlements: merged }),
      }).catch(() => {});
    }

    return merged;
  } catch (err) {
    return getStoredSettlements();
  }
}

export function addStoredSettlement(data: {
  supplierId: string;
  supplierName: string;
  amountDzd: number;
  date: string;
  method: string;
  referenceNote?: string;
  status: 'COMPLETED' | 'PENDING';
}): SupplierSettlement {
  const settlements = getStoredSettlements();
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 90000 + 10000)}`;
  const newSt: SupplierSettlement = {
    id: `SETTL-${uniqueId}`,
    supplierId: data.supplierId,
    supplierName: data.supplierName,
    amountDzd: data.amountDzd,
    payoutMethod: data.method as any,
    accountDetails: data.referenceNote || 'CCP / BaridiMob',
    status: data.status,
    referenceNumber: data.referenceNote || `REF-${uniqueId}`,
    referenceNote: data.referenceNote,
    method: data.method,
    date: data.date,
  };
  const updated = [newSt, ...settlements];
  saveStoredSettlements(updated);
  return newSt;
}

export function recordSupplierPayment(
  supplierId: string,
  amountDzd: number,
  payoutMethod: SupplierSettlement['payoutMethod'],
  accountDetails: string,
  referenceNumber: string,
  notes?: string
): SupplierSettlement {
  const settlements = getStoredSettlements();
  const suppliers = getStoredSuppliers();

  const sup = suppliers.find((s) => s.id === supplierId);
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 90000 + 10000)}`;

  const newSettlement: SupplierSettlement = {
    id: `SETTL-${uniqueId}`,
    supplierId,
    supplierName: sup?.companyName || sup?.fullName || 'مورد',
    amountDzd,
    payoutMethod,
    accountDetails,
    status: 'COMPLETED',
    referenceNumber: referenceNumber || `REF-${uniqueId}`,
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    notes,
  };

  saveStoredSettlements([newSettlement, ...settlements]);

  // Update supplier's paid amount & last payment date
  const updatedSuppliers = suppliers.map((s) => {
    if (s.id === supplierId) {
      return {
        ...s,
        paidAmountDzd: (s.paidAmountDzd || 0) + amountDzd,
        lastPaymentDate: new Date().toISOString().split('T')[0],
      };
    }
    return s;
  });
  saveStoredSuppliers(updatedSuppliers);

  return newSettlement;
}

export function requestSupplierPayout(
  supplierId: string,
  amountDzd: number,
  payoutMethod: SupplierSettlement['payoutMethod'],
  accountDetails: string,
  notes?: string
): SupplierSettlement {
  const settlements = getStoredSettlements();
  const suppliers = getStoredSuppliers();
  const sup = suppliers.find((s) => s.id === supplierId);
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 90000 + 10000)}`;

  const newSettlement: SupplierSettlement = {
    id: `REQ-${uniqueId}`,
    supplierId,
    supplierName: sup?.companyName || sup?.fullName || 'المورد المعتمد',
    amountDzd,
    payoutMethod,
    accountDetails,
    status: 'PENDING',
    referenceNumber: `REQ-${uniqueId}`,
    referenceNote: accountDetails,
    method: payoutMethod,
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    notes: notes || 'طلب سحب مستحقات مبيعات الجملة',
  };

  saveStoredSettlements([newSettlement, ...settlements]);
  return newSettlement;
}

export function deletePendingSupplierSettlement(settlementId: string, supplierId?: string): boolean {
  try {
    const settlements = getStoredSettlements();
    const target = settlements.find((s) => s.id === settlementId);
    if (!target) return false;
    
    // Only allow deletion if status is PENDING (قيد مراجعة وتحويل الإدارة)
    if (target.status !== 'PENDING') return false;
    if (supplierId && target.supplierId && target.supplierId !== supplierId) return false;

    markSettlementDeleted(settlementId);
    const updated = settlements.filter((s) => s.id !== settlementId);
    saveStoredSettlements(updated);
    return true;
  } catch (e) {
    console.error('Error deleting pending settlement:', e);
    return false;
  }
}

// ---------------- MARKETPLACE FEES HELPERS ----------------
export function getStoredMarketplaceFees(): MarketplaceFeeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FEES, JSON.stringify(DEFAULT_FEES));
      return DEFAULT_FEES;
    }
    const parsed = JSON.parse(raw);
    let supplierFee = parsed.supplierFeePercent ?? parsed.defaultSupplierFeePercent;
    // Auto-migrate from the old hardcoded 12% default to the requested 5%
    if (supplierFee === 12 || supplierFee === undefined) {
      supplierFee = 5;
    }
    let resellerFee = parsed.resellerFeePercent ?? parsed.defaultResellerCommissionPercent ?? 0;

    const normalized: MarketplaceFeeSettings = {
      supplierFeePercent: Number(supplierFee) || 5,
      resellerFeePercent: Number(resellerFee) || 0,
      defaultSupplierFeePercent: Number(supplierFee) || 5,
      defaultResellerCommissionPercent: Number(resellerFee) || 0,
      resellerMinProfitMargin: parsed.resellerMinProfitMargin || 0,
      lastUpdated: parsed.lastUpdated || new Date().toISOString().split('T')[0],
    };
    return normalized;
  } catch (e) {
    return DEFAULT_FEES;
  }
}

export function saveStoredMarketplaceFees(fees: MarketplaceFeeSettings): void {
  try {
    const supplierFee = Number(fees.supplierFeePercent ?? fees.defaultSupplierFeePercent ?? 5);
    const resellerFee = Number(fees.resellerFeePercent ?? fees.defaultResellerCommissionPercent ?? 0);
    const payload: MarketplaceFeeSettings = {
      ...fees,
      supplierFeePercent: supplierFee,
      resellerFeePercent: resellerFee,
      defaultSupplierFeePercent: supplierFee,
      defaultResellerCommissionPercent: resellerFee,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    localStorage.setItem(STORAGE_KEY_FEES, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('nouva_fees_updated', { detail: payload }));
  } catch (e) {
    console.error('Error saving marketplace fees:', e);
  }
}

// Helper to compute wholesale price given a supplier net price & fee %
export function calculateWholesalePrice(supplierNetPrice: number, feePercent?: number): number {
  const fee = feePercent ?? getStoredMarketplaceFees().supplierFeePercent ?? 5;
  const markup = Math.round((supplierNetPrice * fee) / 100);
  return supplierNetPrice + markup;
}

// Helper to calculate reseller net profit and platform cut from reseller
export function calculateResellerProfitBreakdown(
  grossProfit: number,
  overrideResellerFeePercent?: number
): { grossProfit: number; netProfit: number; platformCut: number; feePercent: number } {
  const feePercent = overrideResellerFeePercent ?? getStoredMarketplaceFees().resellerFeePercent ?? 0;
  const platformCut = Math.max(0, Math.round((grossProfit * feePercent) / 100));
  const netProfit = Math.max(0, grossProfit - platformCut);
  return { grossProfit, netProfit, platformCut, feePercent };
}

/**
 * Zero out the amount of a specific settlement
 */
export function zeroSettlementAmount(id: string): boolean {
  const settlements = getStoredSettlements();
  let found = false;
  const updated = settlements.map((st) => {
    if (st.id === id) {
      found = true;
      return { ...st, amountDzd: 0 };
    }
    return st;
  });
  if (found) {
    saveStoredSettlements(updated);
    return true;
  }
  return false;
}

/**
 * Zero out settlements amounts by status filter
 */
export function zeroAllSettlementsAmounts(
  targetStatus: 'ALL' | 'COMPLETED' | 'PENDING' = 'ALL'
): { count: number; totalZeroed: number } {
  const settlements = getStoredSettlements();
  let count = 0;
  let totalZeroed = 0;
  const updated = settlements.map((st) => {
    if (targetStatus === 'ALL' || st.status === targetStatus) {
      if (st.amountDzd > 0) {
        count++;
        totalZeroed += st.amountDzd;
      }
      return { ...st, amountDzd: 0 };
    }
    return st;
  });
  saveStoredSettlements(updated);
  return { count, totalZeroed };
}

/**
 * Clear all settlements records from storage
 */
export function clearAllSettlements(): void {
  saveStoredSettlements([]);
}
