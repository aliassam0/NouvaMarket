import { addAdminNotification, addWarehouseNotification } from './notificationHelper';

export interface ProductSourcingRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail?: string;
  productName: string;
  productUrl?: string;
  targetQuantity: number;
  targetBudgetDzd?: number;
  notes?: string;
  status: 'PENDING' | 'SOURCING' | 'QUOTED' | 'APPROVED' | 'SHIPPED' | 'REJECTED';
  createdAt: string;
  // Admin Quotation & Sourcing Details
  quotedUnitPriceDzd?: number;
  quotedShippingCostDzd?: number;
  quotedCustomsEstimateDzd?: number;
  totalEstimatedCostDzd?: number;
  estimatedArrivalDate?: string;
  adminFeedback?: string;
  quotedAt?: string;
}

const SOURCING_REQUESTS_KEY = 'nouva_sourcing_requests_v1';

export function getStoredSourcingRequests(sellerId?: string): ProductSourcingRequest[] {
  try {
    const raw = localStorage.getItem(SOURCING_REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleanList = parsed.filter((r) => r && r.id !== 'SRC-98124' && r.sellerId !== 'sup-demo');
    if (sellerId) {
      return cleanList.filter((r) => r.sellerId === sellerId);
    }
    return cleanList;
  } catch {
    return [];
  }
}

export function saveStoredSourcingRequests(requests: ProductSourcingRequest[]): void {
  try {
    localStorage.setItem(SOURCING_REQUESTS_KEY, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent('nouva_sourcing_requests_updated', { detail: requests }));
  } catch (e) {
    console.error('Failed to save sourcing requests:', e);
  }
}

export function createSourcingRequest(data: {
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail?: string;
  productName: string;
  productUrl?: string;
  targetQuantity: number;
  targetBudgetDzd?: number;
  notes?: string;
}): ProductSourcingRequest {
  const current = getStoredSourcingRequests();
  const newReq: ProductSourcingRequest = {
    id: `SRC-${Date.now().toString().slice(-6)}`,
    sellerId: data.sellerId,
    sellerName: data.sellerName,
    sellerPhone: data.sellerPhone,
    sellerEmail: data.sellerEmail,
    productName: data.productName.trim(),
    productUrl: data.productUrl?.trim(),
    targetQuantity: Number(data.targetQuantity) || 100,
    targetBudgetDzd: data.targetBudgetDzd ? Number(data.targetBudgetDzd) : undefined,
    notes: data.notes?.trim(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  const updated = [newReq, ...current];
  saveStoredSourcingRequests(updated);

  addAdminNotification({
    titleAr: 'طلب استيراد وتوريد سلعة جديد 🚢',
    bodyAr: `قدم البائع ${data.sellerName} طلب استيراد للسلعة "${data.productName}" بكمية ${data.targetQuantity} قطعة.`,
    type: 'order',
  });

  addWarehouseNotification({
    titleAr: 'طلب استيراد مسجل بنجاح 📋',
    bodyAr: `تم تسجيل طلب استيراد السلعة "${data.productName}" وسيتواصل معك فريق الاستيراد والتخليص لتأكيد التفاصيل.`,
    type: 'system',
  });

  return newReq;
}

export function updateSourcingRequest(
  id: string,
  updates: Partial<ProductSourcingRequest>
): ProductSourcingRequest | null {
  const current = getStoredSourcingRequests();
  let updatedReq: ProductSourcingRequest | null = null;

  const updated = current.map((req) => {
    if (req.id === id) {
      updatedReq = {
        ...req,
        ...updates,
      };
      return updatedReq;
    }
    return req;
  });

  if (updatedReq) {
    saveStoredSourcingRequests(updated);

    const statusLabels: Record<string, string> = {
      PENDING: 'قيد المراجعة والدراسة',
      SOURCING: 'جارٍ البحث والتواصل مع المصانع',
      QUOTED: 'تم إصدار عرض السعر والشحن',
      APPROVED: 'تم الاتفاق وبدء الشحن الدولي',
      SHIPPED: 'في إجراءات التخليص الجمركي بميناء/مطار الجزائر',
      REJECTED: 'ملغي أو تعذر التوفير',
    };

    const label = updates.status ? statusLabels[updates.status] || updates.status : 'تحديث البيانات';

    addWarehouseNotification({
      titleAr: 'تحديث في طلب استيراد السلعة 🚢',
      bodyAr: `تم تحديث حالة طلب الاستيراد #${id} الخاص بالسلعة "${(updatedReq as ProductSourcingRequest).productName}" إلى: ${label}`,
      type: 'system',
    });
  }

  return updatedReq;
}

export function deleteSourcingRequest(id: string): void {
  const current = getStoredSourcingRequests();
  const updated = current.filter((r) => r.id !== id);
  saveStoredSourcingRequests(updated);
}

function getDefaultSourcingRequests(): ProductSourcingRequest[] {
  return [];
}
