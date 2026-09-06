import { SupplierProfile, SupplierSettlement, MarketplaceFeeSettings } from '../types';

const STORAGE_KEY_SUPPLIERS = 'nouva_suppliers_v2';
const STORAGE_KEY_SETTLEMENTS = 'nouva_settlements_v1';
const STORAGE_KEY_FEES = 'nouva_marketplace_fees_v1';

export const INITIAL_SUPPLIERS: SupplierProfile[] = [];

export const INITIAL_SETTLEMENTS: SupplierSettlement[] = [];

export const DEFAULT_FEES: MarketplaceFeeSettings = {
  supplierFeePercent: 12,
  resellerMinProfitMargin: 0,
  lastUpdated: '2026-08-01',
};

// ---------------- SUPPLIERS HELPERS ----------------
// In-memory cache to ensure sync across fast re-renders
let cachedSuppliers: SupplierProfile[] | null = null;
let isSyncingSuppliersWithServer = false;

export function getStoredSuppliers(): SupplierProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
    let localList: SupplierProfile[] = [];
    if (raw) {
      localList = JSON.parse(raw);
      if (!Array.isArray(localList)) localList = [];
    }

    // Trigger background sync with server if not already running
    if (!isSyncingSuppliersWithServer && typeof window !== 'undefined') {
      isSyncingSuppliersWithServer = true;
      fetch('/api/reseller/suppliers')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.suppliers)) {
            const serverSuppliers: SupplierProfile[] = data.suppliers;
            const currentLocal = getStoredSuppliers();
            // Merge local and server without losing any supplier
            const map = new Map<string, SupplierProfile>();
            serverSuppliers.forEach((s) => { if (s && s.id) map.set(s.id, s); });
            currentLocal.forEach((s) => {
              if (s && s.id) {
                // If local has newer fields or exists only locally, push to server
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
          }
        })
        .catch(() => {})
        .finally(() => {
          isSyncingSuppliersWithServer = false;
        });
    }

    cachedSuppliers = localList;
    return localList;
  } catch (e) {
    return cachedSuppliers || INITIAL_SUPPLIERS;
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
  // Soft delete / remove from local if explicit
  const suppliers = getStoredSuppliers();
  const updated = suppliers.filter((sup) => sup.id !== supplierId);
  saveStoredSuppliers(updated);
}

// ---------------- SETTLEMENTS HELPERS ----------------
export function getStoredSettlements(): SupplierSettlement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTLEMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SETTLEMENTS, JSON.stringify(INITIAL_SETTLEMENTS));
      return INITIAL_SETTLEMENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_SETTLEMENTS;
  }
}

export function saveStoredSettlements(settlements: SupplierSettlement[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTLEMENTS, JSON.stringify(settlements));
    window.dispatchEvent(new CustomEvent('nouva_settlements_updated', { detail: settlements }));
  } catch (e) {
    console.error('Error saving settlements:', e);
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
  const newSt: SupplierSettlement = {
    id: `SETTL-${Date.now().toString().slice(-4)}`,
    supplierId: data.supplierId,
    supplierName: data.supplierName,
    amountDzd: data.amountDzd,
    payoutMethod: data.method as any,
    accountDetails: data.referenceNote || 'CCP / BaridiMob',
    status: data.status,
    referenceNumber: data.referenceNote || `REF-${Math.floor(Math.random() * 89999 + 10000)}`,
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

  const newSettlement: SupplierSettlement = {
    id: `SETTL-${Date.now().toString().slice(-4)}`,
    supplierId,
    supplierName: sup?.companyName || sup?.fullName || 'مورد',
    amountDzd,
    payoutMethod,
    accountDetails,
    status: 'COMPLETED',
    referenceNumber: referenceNumber || `REF-${Math.floor(Math.random() * 89999 + 10000)}`,
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

// ---------------- MARKETPLACE FEES HELPERS ----------------
export function getStoredMarketplaceFees(): MarketplaceFeeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FEES, JSON.stringify(DEFAULT_FEES));
      return DEFAULT_FEES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_FEES;
  }
}

export function saveStoredMarketplaceFees(fees: MarketplaceFeeSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_FEES, JSON.stringify(fees));
    window.dispatchEvent(new CustomEvent('nouva_fees_updated', { detail: fees }));
  } catch (e) {
    console.error('Error saving marketplace fees:', e);
  }
}

// Helper to compute wholesale price given a supplier net price & fee %
export function calculateWholesalePrice(supplierNetPrice: number, feePercent?: number): number {
  const fee = feePercent ?? getStoredMarketplaceFees().supplierFeePercent;
  const markup = Math.round((supplierNetPrice * fee) / 100);
  return supplierNetPrice + markup;
}
