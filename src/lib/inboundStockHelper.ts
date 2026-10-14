import { InboundStockRequest, InboundStockItem } from '../types';
import { getStoredProducts, saveStoredProducts } from '../data/mockProducts';

const INBOUND_STOCK_KEY = 'nouva_inbound_stock_requests_v1';

export function getStoredInboundRequests(): InboundStockRequest[] {
  try {
    const raw = localStorage.getItem(INBOUND_STOCK_KEY);
    if (!raw) return getDefaultInboundRequests();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultInboundRequests();
  } catch {
    return getDefaultInboundRequests();
  }
}

export function saveStoredInboundRequests(requests: InboundStockRequest[]): void {
  try {
    localStorage.setItem(INBOUND_STOCK_KEY, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent('nouva_inbound_stock_updated', { detail: requests }));
  } catch (e) {
    console.error('Failed to save inbound stock requests:', e);
  }
}

export function createInboundStockRequest(data: {
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  trackingNumber?: string;
  carrierName?: string;
  items: InboundStockItem[];
  notes?: string;
}): InboundStockRequest {
  const current = getStoredInboundRequests();
  const totalUnits = data.items.reduce((sum, item) => sum + (Number(item.quantitySent) || 0), 0);
  const totalWholesaleValueDzd = data.items.reduce(
    (sum, item) => sum + (Number(item.quantitySent) || 0) * (Number(item.wholesalePrice) || 0),
    0
  );

  const newRequest: InboundStockRequest = {
    id: `INB-${Date.now().toString().slice(-6)}`,
    supplierId: data.supplierId,
    supplierName: data.supplierName,
    supplierPhone: data.supplierPhone,
    supplierEmail: data.supplierEmail,
    trackingNumber: data.trackingNumber || `TRK-INB-${Math.floor(100000 + Math.random() * 900000)}`,
    carrierName: data.carrierName || 'شحن خاص / توصيل مباشر للمستودع',
    status: 'IN_TRANSIT',
    totalUnits,
    totalWholesaleValueDzd,
    items: data.items,
    notes: data.notes,
    createdAt: new Date().toISOString(),
    warehouseLocation: 'مستودع المنصة المركزي (الجزائر العاصمة) - منطقة الاستقبال',
  };

  const updated = [newRequest, ...current];
  saveStoredInboundRequests(updated);
  return newRequest;
}

/**
 * Confirm receiving and inspecting inbound stock at Platform Warehouse
 * This automatically updates the inventory of products in the platform!
 */
export function receiveAndInspectInboundStock(
  requestId: string,
  verifiedItems: { productId: string; variantId?: string; quantityReceived: number }[],
  receivedNotes?: string
): boolean {
  const requests = getStoredInboundRequests();
  const targetIndex = requests.findIndex((r) => r.id === requestId);
  if (targetIndex === -1) return false;

  const target = requests[targetIndex];
  const updatedItems = target.items.map((item) => {
    const verified = verifiedItems.find(
      (v) => v.productId === item.productId && (!v.variantId || v.variantId === item.variantId)
    );
    return {
      ...item,
      quantityReceived: verified ? verified.quantityReceived : item.quantitySent,
    };
  });

  const updatedRequest: InboundStockRequest = {
    ...target,
    status: 'RECEIVED',
    items: updatedItems,
    receivedNotes: receivedNotes || 'تم الاستلام والفحص وتغذية المخزون الحي للمنصة بنجاح ✅',
    receivedAt: new Date().toISOString(),
  };

  requests[targetIndex] = updatedRequest;
  saveStoredInboundRequests(requests);

  // Automatically credit stock to products in mockProducts
  try {
    const products = getStoredProducts();
    let productsModified = false;

    for (const verified of verifiedItems) {
      const prod = products.find((p) => p.id === verified.productId);
      if (prod) {
        if (verified.variantId && prod.variants) {
          const variant = prod.variants.find((v) => v.id === verified.variantId);
          if (variant) {
            variant.stockCount = (Number(variant.stockCount) || 0) + Number(verified.quantityReceived);
            productsModified = true;
          }
        } else if (prod.variants && prod.variants.length > 0) {
          // Add to first variant
          prod.variants[0].stockCount =
            (Number(prod.variants[0].stockCount) || 0) + Number(verified.quantityReceived);
          productsModified = true;
        }
      }
    }

    if (productsModified) {
      saveStoredProducts(products);
    }
  } catch (err) {
    console.error('Failed to credit products inventory:', err);
  }

  return true;
}

function getDefaultInboundRequests(): InboundStockRequest[] {
  return [
    {
      id: 'INB-883412',
      supplierId: 'sup-demo',
      supplierName: 'مؤسسة الأناقة للألبسة',
      supplierPhone: '0550123456',
      supplierEmail: 'warehouse@nouvamarket.com',
      trackingNumber: 'TRK-INB-992104',
      carrierName: 'شاحنة نقل بضائع خاصة',
      status: 'IN_TRANSIT',
      totalUnits: 150,
      totalWholesaleValueDzd: 375000,
      items: [
        {
          productId: 'p-1',
          productName: 'حذاء كاجوال خفيف أصلي',
          variantSize: '42',
          variantColor: 'أسود',
          quantitySent: 100,
          wholesalePrice: 2500,
        },
        {
          productId: 'p-1',
          productName: 'حذاء كاجوال خفيف أصلي',
          variantSize: '43',
          variantColor: 'بني',
          quantitySent: 50,
          wholesalePrice: 2500,
        },
      ],
      notes: 'شحنة كراتين مغلفة جاهزة لفحص الاستقبال في مستودع العاصمة',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      warehouseLocation: 'مستودع المنصة المركزي (الجزائر العاصمة) - رصيف 2',
    },
  ];
}
