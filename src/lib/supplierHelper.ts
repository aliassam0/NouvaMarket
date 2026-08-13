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
export function getStoredSuppliers(): SupplierProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
      return INITIAL_SUPPLIERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_SUPPLIERS;
  }
}

export function saveStoredSuppliers(suppliers: SupplierProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(suppliers));
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
  return newSupplier;
}

export function updateSupplierStatus(
  supplierId: string,
  status: SupplierProfile['status'],
  rejectionReason?: string
): void {
  const suppliers = getStoredSuppliers();
  const updated = suppliers.map((sup) => {
    if (sup.id === supplierId) {
      return {
        ...sup,
        status,
        rejectionReason: rejectionReason || sup.rejectionReason,
      };
    }
    return sup;
  });
  saveStoredSuppliers(updated);
}

export function deleteSupplierRegistration(supplierId: string): void {
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
