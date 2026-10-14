import { CourierManifest, Order } from '../types';

const COURIER_MANIFESTS_KEY = 'nouva_courier_manifests_v1';

export function getStoredCourierManifests(): CourierManifest[] {
  try {
    const raw = localStorage.getItem(COURIER_MANIFESTS_KEY);
    if (!raw) return getDefaultCourierManifests();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultCourierManifests();
  } catch {
    return getDefaultCourierManifests();
  }
}

export function saveStoredCourierManifests(manifests: CourierManifest[]): void {
  try {
    localStorage.setItem(COURIER_MANIFESTS_KEY, JSON.stringify(manifests));
    window.dispatchEvent(new CustomEvent('nouva_manifests_updated', { detail: manifests }));
  } catch (e) {
    console.error('Failed to save courier manifests:', e);
  }
}

export function createCourierManifest(params: {
  courierId: string;
  courierName: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  orders: Order[];
  warehouseOfficerName?: string;
  notes?: string;
}): CourierManifest {
  const current = getStoredCourierManifests();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const manifestNumber = `MNF-${dateStr}-${randNum}`;

  const manifestOrders = params.orders.map((o) => {
    const itemsSummary = o.items
      .map((it) => `${it.productName} (${it.variantSize}/${it.variantColor}) × ${it.quantity}`)
      .join(' + ');

    return {
      orderId: o.id,
      trackingCode: o.trackingCode || `TRK-${o.id}`,
      customerName: o.customerName,
      phone: o.phone,
      wilaya: o.wilaya,
      commune: o.commune,
      itemsSummary: itemsSummary || 'طرد منتجات تجارة إلكترونية',
      codAmount: (Number(o.totalAmount) || 0) + (Number(o.shippingFee) || 0),
      deliveryType: o.deliveryType || 'home',
    };
  });

  const totalCodAmountDzd = manifestOrders.reduce((sum, item) => sum + item.codAmount, 0);

  const newManifest: CourierManifest = {
    id: `mnf-${Date.now()}`,
    manifestNumber,
    courierId: params.courierId,
    courierName: params.courierName,
    driverName: params.driverName || 'سائق التوزيع المعتمد',
    driverPhone: params.driverPhone || '',
    vehiclePlate: params.vehiclePlate || '',
    totalParcels: manifestOrders.length,
    totalCodAmountDzd,
    orders: manifestOrders,
    createdAt: new Date().toISOString(),
    warehouseOfficerName: params.warehouseOfficerName || 'مسؤول التجهيز والشحن المركزي',
    notes: params.notes || '',
  };

  const updated = [newManifest, ...current];
  saveStoredCourierManifests(updated);
  return newManifest;
}

function getDefaultCourierManifests(): CourierManifest[] {
  return [
    {
      id: 'mnf-demo-1',
      manifestNumber: 'MNF-20260926-4421',
      courierId: 'cour-yalidine',
      courierName: 'Yalidine Express',
      driverName: 'كمال بن طيب',
      driverPhone: '0555123456',
      vehiclePlate: '16-12345-00',
      totalParcels: 3,
      totalCodAmountDzd: 18500,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      warehouseOfficerName: 'أمين مستودع العاصمة المركزي',
      notes: 'تسليم دفعة طرود الصباحية - تم التحقق بالكامل',
      orders: [
        {
          orderId: 'ord-8834',
          trackingCode: 'YAL-DZ-883401',
          customerName: 'فؤاد بلعيد',
          phone: '0550112233',
          wilaya: 'الجزائر',
          commune: 'بئر مراد رايس',
          itemsSummary: 'حذاء كاجوال خفيف أصلي (42/أسود) × 1',
          codAmount: 4800,
          deliveryType: 'home',
        },
        {
          orderId: 'ord-8835',
          trackingCode: 'YAL-DZ-883502',
          customerName: 'سميرة معوش',
          phone: '0661445566',
          wilaya: 'وهران',
          commune: 'السانية',
          itemsSummary: 'سيروم فيتامين سي للتفتيح والنضارة × 2',
          codAmount: 6400,
          deliveryType: 'home',
        },
        {
          orderId: 'ord-8836',
          trackingCode: 'YAL-DZ-883603',
          customerName: 'عمر شريف',
          phone: '0770778899',
          wilaya: 'قسنطينة',
          commune: 'الخروب',
          itemsSummary: 'ساعة يد كلاسيكية رجالية فاخرة (جلد بني) × 1',
          codAmount: 7300,
          deliveryType: 'desk',
        },
      ],
    },
  ];
}
