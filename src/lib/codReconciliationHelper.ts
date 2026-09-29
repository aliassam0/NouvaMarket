import { CodRemittanceBatch, ReturnInspectionReport, Order } from '../types';
import { creditResellerCommission } from './walletHelper';
import { getStoredSuppliers, saveStoredSuppliers, getStoredSettlements, saveStoredSettlements } from './supplierHelper';
import { getStoredProducts, saveStoredProducts } from '../data/mockProducts';
import { addWarehouseNotification, addAdminNotification, addSellerNotification } from './notificationHelper';

const COD_REMITTANCES_KEY = 'nouva_cod_remittances_v1';
const RETURN_INSPECTIONS_KEY = 'nouva_return_inspections_v1';

// ----------------------------------------------------
// 1. COD Remittances & Courier Cash Reconciliation
// ----------------------------------------------------

export function getStoredCodRemittances(): CodRemittanceBatch[] {
  try {
    const raw = localStorage.getItem(COD_REMITTANCES_KEY);
    if (!raw) return getDefaultCodRemittances();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultCodRemittances();
  } catch {
    return getDefaultCodRemittances();
  }
}

export function saveStoredCodRemittances(batches: CodRemittanceBatch[]): void {
  try {
    localStorage.setItem(COD_REMITTANCES_KEY, JSON.stringify(batches));
    window.dispatchEvent(new CustomEvent('nouva_cod_reconciled', { detail: batches }));
  } catch (e) {
    console.error('Failed to save COD remittances:', e);
  }
}

export function executeCodRemittanceReconciliation(params: {
  courierId: string;
  courierName: string;
  paymentReference: string;
  paymentMethod: 'CCP' | 'BARIDIMOB' | 'BANK_TRANSFER' | 'CASH';
  orders: Order[];
  courierShippingFeePerOrder?: number;
  reconciledBy?: string;
  notes?: string;
}): { batch: CodRemittanceBatch; updatedOrders: Order[] } {
  const currentBatches = getStoredCodRemittances();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const batchNumber = `REM-${params.courierName.slice(0, 3).toUpperCase()}-${dateStr}-${randNum}`;

  let totalCodCollectedDzd = 0;
  let totalResellerProfitsDzd = 0;
  let totalSupplierWholesaleDzd = 0;
  let totalCourierShippingFeesDzd = 0;

  const defaultFee = params.courierShippingFeePerOrder || 600;

  // Process and update orders
  const updatedOrders = params.orders.map((ord) => {
    const orderCod = (Number(ord.totalAmount) || 0) + (Number(ord.shippingFee) || 0);
    const orderShipping = Number(ord.shippingFee) || defaultFee;
    const orderProfit = Number(ord.totalProfit) || 0;

    // Wholesale due calculation for items
    const orderWholesale = ord.items.reduce((sum, item) => {
      const price = item.wholesalePrice || (item.sellingPrice ? Math.round(item.sellingPrice * 0.7) : 2000);
      return sum + price * (Number(item.quantity) || 1);
    }, 0);

    totalCodCollectedDzd += orderCod;
    totalCourierShippingFeesDzd += orderShipping;
    totalResellerProfitsDzd += orderProfit;
    totalSupplierWholesaleDzd += orderWholesale;

    // 1. Credit reseller profit wallet if not yet credited
    if (!ord.commissionCredited && ord.resellerId) {
      creditResellerCommission(ord.id, orderProfit, ord.resellerId);
    }

    return {
      ...ord,
      status: 'DELIVERED' as const,
      reconciledWithCourier: true,
      courierRemittanceId: batchNumber,
      commissionCredited: true,
    };
  });

  const netPayoutDzd = totalCodCollectedDzd - totalCourierShippingFeesDzd;
  const totalPlatformFeeDzd = Math.max(0, netPayoutDzd - (totalResellerProfitsDzd + totalSupplierWholesaleDzd));

  const newBatch: CodRemittanceBatch = {
    id: `batch-${Date.now()}`,
    batchNumber,
    courierId: params.courierId,
    courierName: params.courierName,
    paymentReference: params.paymentReference,
    paymentMethod: params.paymentMethod,
    totalOrdersCount: params.orders.length,
    totalCodCollectedDzd,
    courierShippingFeesDzd: totalCourierShippingFeesDzd,
    netPayoutDzd,
    totalResellerProfitsDzd,
    totalSupplierWholesaleDzd,
    totalPlatformFeeDzd,
    status: 'RECONCILED',
    orderIds: params.orders.map((o) => o.id),
    reconciledAt: new Date().toISOString(),
    reconciledBy: params.reconciledBy || 'مسؤول الحسابات والمالية المركزية',
    notes: params.notes || 'تسوية رسمية لحوالة تحصيل أموال الدفع عند الاستلام',
  };

  const updatedBatches = [newBatch, ...currentBatches];
  saveStoredCodRemittances(updatedBatches);

  // Notifications
  addAdminNotification({
    type: 'order',
    titleAr: `💰 تسوية ومطابقة أموال COD (${params.courierName})`,
    bodyAr: `تم بنجاح مطابقة دفعة تحصيل ${params.orders.length} طلبية بمبلغ ${totalCodCollectedDzd.toLocaleString()} دج وتوزيع مستحقات الموردين والمسوقين آلياً.`,
  });

  addWarehouseNotification({
    type: 'stock_update',
    titleAr: `✅ تسوية مالية جديدة: ${batchNumber}`,
    bodyAr: `تم إغلاق ومطابقة حساب ${params.orders.length} طرد مع ${params.courierName}.`,
  });

  return { batch: newBatch, updatedOrders };
}

function getDefaultCodRemittances(): CodRemittanceBatch[] {
  return [
    {
      id: 'rem-demo-1',
      batchNumber: 'REM-YAL-20260925-8812',
      courierId: 'cour-yalidine',
      courierName: 'Yalidine Express',
      paymentReference: 'VIR-CCP-981244510-ALGIERS',
      paymentMethod: 'CCP',
      totalOrdersCount: 4,
      totalCodCollectedDzd: 24500,
      courierShippingFeesDzd: 2400,
      netPayoutDzd: 22100,
      totalResellerProfitsDzd: 5600,
      totalSupplierWholesaleDzd: 15200,
      totalPlatformFeeDzd: 1300,
      status: 'RECONCILED',
      orderIds: ['ord-8834', 'ord-8835', 'ord-8836'],
      reconciledAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      reconciledBy: 'مدير المحاسبة والمالية',
      notes: 'كشف حوالة الحساب البريدي الجاري لطرود العاصمة ووهران',
    },
  ];
}

// ----------------------------------------------------
// 2. Returns Quality Control (QC) & Restocking
// ----------------------------------------------------

export function getStoredReturnInspections(): ReturnInspectionReport[] {
  try {
    const raw = localStorage.getItem(RETURN_INSPECTIONS_KEY);
    if (!raw) return getDefaultReturnInspections();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultReturnInspections();
  } catch {
    return getDefaultReturnInspections();
  }
}

export function saveStoredReturnInspections(reports: ReturnInspectionReport[]): void {
  try {
    localStorage.setItem(RETURN_INSPECTIONS_KEY, JSON.stringify(reports));
    window.dispatchEvent(new CustomEvent('nouva_returns_inspected', { detail: reports }));
  } catch (e) {
    console.error('Failed to save return inspections:', e);
  }
}

export function inspectAndProcessReturnedOrder(params: {
  order: Order;
  packagingStatus: 'SEALED_INTACT' | 'OPENED_GOOD' | 'TORN_DAMAGED';
  itemStatus: 'RESELLABLE' | 'DAMAGED_CARRIER' | 'WRONG_ITEM' | 'CUSTOMER_USED';
  inspectorName?: string;
  shelfLocation?: string;
  carrierClaimAmountDzd?: number;
  notes?: string;
}): ReturnInspectionReport {
  const current = getStoredReturnInspections();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(1000 + Math.random() * 9000);

  const isResellable = params.itemStatus === 'RESELLABLE';
  const claimNeeded = params.itemStatus === 'DAMAGED_CARRIER';
  const claimRef = claimNeeded ? `CLM-CARRIER-${dateStr}-${randNum}` : undefined;

  const totalItemsCount = params.order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  // If item is intact and resellable, credit stock back to products!
  if (isResellable) {
    try {
      const products = getStoredProducts();
      let modified = false;

      params.order.items.forEach((ordItem) => {
        const prod = products.find((p) => p.id === ordItem.productId);
        if (prod && prod.variants) {
          const variant = prod.variants.find(
            (v) =>
              (ordItem.variantSize && v.size === ordItem.variantSize) ||
              (ordItem.variantColor && v.color === ordItem.variantColor)
          ) || prod.variants[0];

          if (variant) {
            variant.stockCount = (Number(variant.stockCount) || 0) + (Number(ordItem.quantity) || 1);
            modified = true;
          }
        }
      });

      if (modified) {
        saveStoredProducts(products);
      }
    } catch (e) {
      console.error('Failed to restock returned products:', e);
    }
  }

  const report: ReturnInspectionReport = {
    id: `qc-${Date.now()}`,
    orderId: params.order.id,
    trackingCode: params.order.trackingCode || `DZ-${params.order.id}`,
    customerName: params.order.customerName,
    phone: params.order.phone,
    wilaya: params.order.wilaya,
    courierName: params.order.deliveryCompanyName || 'شركة التوصيل الشريكة',
    packagingStatus: params.packagingStatus,
    itemStatus: params.itemStatus,
    inspectorName: params.inspectorName || 'أمين فحص المرتجعات والجودة QC',
    restockedToShelf: isResellable ? (params.shelfLocation || 'مستودع العاصمة - رف A1') : undefined,
    itemsCount: totalItemsCount,
    compensationClaimNeeded: claimNeeded,
    carrierClaimAmountDzd: claimNeeded ? (params.carrierClaimAmountDzd || params.order.totalAmount) : 0,
    claimStatus: claimNeeded ? 'CLAIM_FILED' : 'NOT_APPLICABLE',
    claimReference: claimRef,
    notes: params.notes || (isResellable ? 'تم الفحص بنجاح والسلعة سليمة وأعيدت للمخزون الحي' : 'السلعة متضررة بسبب الشحن وتستوجب التعويض'),
    inspectedAt: new Date().toISOString(),
  };

  const updated = [report, ...current];
  saveStoredReturnInspections(updated);

  // Notify Supplier & Admin
  addWarehouseNotification({
    type: 'stock_update',
    titleAr: isResellable ? '📦 تم فحص وإعادة طرد مرتجع للمخزون الحي' : '⚠️ تم تسجيل محضر طرد مرتجع تالف',
    bodyAr: isResellable
      ? `تم فحص الطرد #${params.order.id} وإعادة ${totalItemsCount} قطعة للمخزون بالرف (${report.restockedToShelf}).`
      : `تم تسجيل مطالبة تعويض (${claimRef}) ضد شركة التوصيل بمبلغ ${report.carrierClaimAmountDzd} دج عن الطلب #${params.order.id}.`,
  });

  return report;
}

function getDefaultReturnInspections(): ReturnInspectionReport[] {
  return [
    {
      id: 'qc-demo-1',
      orderId: 'ord-8720',
      trackingCode: 'YAL-DZ-872091',
      customerName: 'طارق مزيان',
      phone: '0551998877',
      wilaya: 'تيزي وزو',
      courierName: 'Yalidine Express',
      packagingStatus: 'SEALED_INTACT',
      itemStatus: 'RESELLABLE',
      inspectorName: 'أمين مراقبة الجودة QC',
      restockedToShelf: 'مستودع العاصمة - رف A2',
      itemsCount: 1,
      compensationClaimNeeded: false,
      claimStatus: 'NOT_APPLICABLE',
      notes: 'تم فحص الكرتونة، غير مفتوحة وسليمة 100%. أعيدت للرف A2.',
      inspectedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ];
}
