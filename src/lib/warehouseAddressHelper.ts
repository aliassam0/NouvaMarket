export interface PlatformWarehouse {
  id: string; // e.g. 'hub-1', 'hub-2', 'hub-3', 'hub-4'
  hubNumber: number; // 1, 2, 3, 4 ...
  hubName: string; // e.g. 'مستودع المنصة 1 (المركز اللوجستي الوطني - الوسط)'
  hubCode: string; // e.g. 'ALG-HUB-01'
  wilaya: string; // e.g. '16 - الجزائر العاصمة'
  commune: string; // e.g. 'المنطقة الصناعية رغاية / زرالدة'
  fullAddress: string;
  postalCode: string;
  receivingPhone: string;
  receivingHours: string;
  contactPerson: string;
  notes: string;
  isPrimary: boolean;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  coverageRegion: string; // Region covered
  coverageWilayasCount: number;
  totalInboundShipmentsCount: number;
  capacityNotes?: string;
  createdAt: string;
}

export interface WarehouseAddressConfig {
  hubName: string;
  hubCode: string;
  wilaya: string;
  commune: string;
  fullAddress: string;
  postalCode: string;
  receivingPhone: string;
  receivingHours: string;
  contactPerson: string;
  notes: string;
}

const STORAGE_KEY_PLATFORM_WAREHOUSES = 'nouva_platform_warehouses_list_v2';
const LEGACY_STORAGE_KEY = 'nouva_central_warehouse_address_v1';

export const INITIAL_PLATFORM_WAREHOUSES: PlatformWarehouse[] = [
  {
    id: 'hub-1',
    hubNumber: 1,
    hubName: 'مستودع المنصة 1 (المركز اللوجستي الوطني - الوسط)',
    hubCode: 'ALG-HUB-01',
    wilaya: '16 - الجزائر العاصمة',
    commune: 'المنطقة الصناعية رغاية / زرالدة اللوجستية',
    fullAddress: 'المنطقة الصناعية المركزية - حظيرة المستودعات الوطنية A4، بوابة الاستقبال والتفريغ رقم 02',
    postalCode: '16011',
    receivingPhone: '+213 550 12 34 56 / +213 23 88 99 00',
    receivingHours: 'السبت إلى الخميس: 08:30 صباحاً حتى 17:00 مساءً',
    contactPerson: 'مسؤول الاستقبال واللوجستيات - م. كريم بن يوسف',
    notes: 'المستودع الرئيسي للمنصة. يرجى تدوين اسم المتجر ورقم الهاتف بوضوح على كل كرتونة، مع إرسال إشعار التوريد من التطبيق مسبقاً.',
    isPrimary: true,
    status: 'ACTIVE',
    coverageRegion: 'الوسط (الجزائر، البليدة، بومرداس، تيبازة، المدية، تيزي وزو، البويرة)',
    coverageWilayasCount: 16,
    totalInboundShipmentsCount: 142,
    capacityNotes: 'مساحة تخزينية 4,500 م² • 12 رصيف شحن وتفريغ',
    createdAt: '2025-01-01',
  },
  {
    id: 'hub-2',
    hubNumber: 2,
    hubName: 'مستودع المنصة 2 (القطب اللوجستي الغربي - وهران)',
    hubCode: 'ORN-HUB-02',
    wilaya: '31 - وهران',
    commune: 'المنطقة الصناعية السانية / بطيوة',
    fullAddress: 'الحظيرة الصناعية اللوجستية وهران - المستودع الإقليمي W2، رصيف الشحن والتوزيع السريع',
    postalCode: '31000',
    receivingPhone: '+213 551 22 33 44 / +213 41 77 88 99',
    receivingHours: 'السبت إلى الخميس: 08:30 صباحاً حتى 16:30 مساءً',
    contactPerson: 'مسؤول القطب الغربي - م. طارق بلحاج',
    notes: 'مخصص لاستقبال وتوريد بضائع تجار وموردي الغرب الجزائري، وتسريع الشحن لولايات الغرب.',
    isPrimary: false,
    status: 'ACTIVE',
    coverageRegion: 'الغرب (وهران، تلمسان، مستغانم، سيدي بلعباس، عين تموشنت، معسكر، غليزان)',
    coverageWilayasCount: 14,
    totalInboundShipmentsCount: 68,
    capacityNotes: 'مساحة تخزينية 3,200 م² • 8 أرصفة تفريغ سريعة',
    createdAt: '2025-03-15',
  },
  {
    id: 'hub-3',
    hubNumber: 3,
    hubName: 'مستودع المنصة 3 (القطب اللوجستي الشرقي - قسنطينة)',
    hubCode: 'CST-HUB-03',
    wilaya: '25 - قسنطينة',
    commune: 'المنطقة الصناعية ديدوش مراد / الخروب',
    fullAddress: 'المركب اللوجستي الشرقي - مجمع مستودعات الشحن والتخزين C1، المحطة اللوجستية',
    postalCode: '25000',
    receivingPhone: '+213 552 44 55 66 / +213 31 66 77 88',
    receivingHours: 'السبت إلى الخميس: 08:30 صباحاً حتى 16:30 مساءً',
    contactPerson: 'مسؤول القطب الشرقي - م. ياسين زواوي',
    notes: 'مخصص لموردي وبائعي ولايات الشرق، لتقليص مدة التسليم للمسوقين في كامل إقليم الشرق.',
    isPrimary: false,
    status: 'ACTIVE',
    coverageRegion: 'الشرق (قسنطينة، سطيف، عنابة، باتنة، سكيكدة، جيجل، برج بوعريريج، قالمة)',
    coverageWilayasCount: 18,
    totalInboundShipmentsCount: 54,
    capacityNotes: 'مساحة تخزينية 3,800 م² • 10 أرصفة شحن وتوزيع',
    createdAt: '2025-06-01',
  },
  {
    id: 'hub-4',
    hubNumber: 4,
    hubName: 'مستودع المنصة 4 (القطب اللوجستي للجنوب - ورقلة)',
    hubCode: 'WGL-HUB-04',
    wilaya: '30 - ورقلة',
    commune: 'المنطقة اللوجستية حاسي مسعود / ورقلة',
    fullAddress: 'محطة التوزيع اللوجستية الكبرى للجنوب - مجمع المستودعات S4، الطريق الوطني رقم 03',
    postalCode: '30000',
    receivingPhone: '+213 553 77 88 99 / +213 29 55 66 77',
    receivingHours: 'السبت إلى الخميس: 08:00 صباحاً حتى 16:00 مساءً',
    contactPerson: 'مسؤول قطب الجنوب - م. عبد القادر مرزوق',
    notes: 'مستودع استراتيجي مكيّف ومجهز بالكامل لتغطية ومرافقة طلبيات الولايات الجنوبية والصحراوية بسرعة فائقة.',
    isPrimary: false,
    status: 'ACTIVE',
    coverageRegion: 'الجنوب (ورقلة، الوادي، بسكرة، غرداية، تقرت، تمنراست، إليزي، بشار، أدرار)',
    coverageWilayasCount: 21,
    totalInboundShipmentsCount: 31,
    capacityNotes: 'مساحة تخزينية 2,800 م² مجهزة بغرف عزل وتبريد',
    createdAt: '2025-08-10',
  },
];

export const DEFAULT_WAREHOUSE_ADDRESS: WarehouseAddressConfig = {
  hubName: INITIAL_PLATFORM_WAREHOUSES[0].hubName,
  hubCode: INITIAL_PLATFORM_WAREHOUSES[0].hubCode,
  wilaya: INITIAL_PLATFORM_WAREHOUSES[0].wilaya,
  commune: INITIAL_PLATFORM_WAREHOUSES[0].commune,
  fullAddress: INITIAL_PLATFORM_WAREHOUSES[0].fullAddress,
  postalCode: INITIAL_PLATFORM_WAREHOUSES[0].postalCode,
  receivingPhone: INITIAL_PLATFORM_WAREHOUSES[0].receivingPhone,
  receivingHours: INITIAL_PLATFORM_WAREHOUSES[0].receivingHours,
  contactPerson: INITIAL_PLATFORM_WAREHOUSES[0].contactPerson,
  notes: INITIAL_PLATFORM_WAREHOUSES[0].notes,
};

/**
 * Get all stored platform warehouses (Hubs 1, 2, 3, 4 ...)
 */
export function getStoredPlatformWarehouses(): PlatformWarehouse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLATFORM_WAREHOUSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PLATFORM_WAREHOUSES, JSON.stringify(INITIAL_PLATFORM_WAREHOUSES));
      return INITIAL_PLATFORM_WAREHOUSES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure Hub 1 is preserved and merge
      return parsed;
    }
    return INITIAL_PLATFORM_WAREHOUSES;
  } catch {
    return INITIAL_PLATFORM_WAREHOUSES;
  }
}

/**
 * Save platform warehouses list
 */
export function saveStoredPlatformWarehouses(warehouses: PlatformWarehouse[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PLATFORM_WAREHOUSES, JSON.stringify(warehouses));
    // Also sync the primary warehouse to legacy key for backwards compatibility
    const primary = warehouses.find((w) => w.isPrimary) || warehouses[0];
    if (primary) {
      const legacyConfig: WarehouseAddressConfig = {
        hubName: primary.hubName,
        hubCode: primary.hubCode,
        wilaya: primary.wilaya,
        commune: primary.commune,
        fullAddress: primary.fullAddress,
        postalCode: primary.postalCode,
        receivingPhone: primary.receivingPhone,
        receivingHours: primary.receivingHours,
        contactPerson: primary.contactPerson,
        notes: primary.notes,
      };
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyConfig));
    }
    window.dispatchEvent(new CustomEvent('nouva_platform_warehouses_updated', { detail: warehouses }));
    window.dispatchEvent(new CustomEvent('nouva_warehouse_address_updated'));
  } catch (e) {
    console.error('Failed to save platform warehouses:', e);
  }
}

/**
 * Add a new platform warehouse (Hub 2, 3, 4, 5...)
 */
export function addPlatformWarehouse(
  data: Omit<PlatformWarehouse, 'id' | 'createdAt'>
): PlatformWarehouse {
  const current = getStoredPlatformWarehouses();
  const nextNumber = current.length > 0 ? Math.max(...current.map((w) => w.hubNumber || 0)) + 1 : 1;
  const newWarehouse: PlatformWarehouse = {
    ...data,
    id: `hub-${Date.now()}`,
    hubNumber: data.hubNumber || nextNumber,
    createdAt: new Date().toISOString().split('T')[0],
  };

  if (newWarehouse.isPrimary) {
    current.forEach((w) => {
      w.isPrimary = false;
    });
  }

  const updated = [...current, newWarehouse];
  saveStoredPlatformWarehouses(updated);
  return newWarehouse;
}

/**
 * Update an existing platform warehouse
 */
export function updatePlatformWarehouse(
  id: string,
  data: Partial<PlatformWarehouse>
): PlatformWarehouse | null {
  const current = getStoredPlatformWarehouses();
  const index = current.findIndex((w) => w.id === id);
  if (index === -1) return null;

  if (data.isPrimary) {
    current.forEach((w) => {
      w.isPrimary = false;
    });
  }

  current[index] = {
    ...current[index],
    ...data,
  };

  saveStoredPlatformWarehouses(current);
  return current[index];
}

/**
 * Delete a platform warehouse (Hub 1 cannot be deleted)
 */
export function deletePlatformWarehouse(id: string): boolean {
  const current = getStoredPlatformWarehouses();
  const target = current.find((w) => w.id === id);
  if (!target || target.hubNumber === 1 || target.isPrimary) {
    return false; // Cannot delete primary or Hub 1
  }

  const updated = current.filter((w) => w.id !== id);
  saveStoredPlatformWarehouses(updated);
  return true;
}

/**
 * Set a warehouse as the primary/default hub
 */
export function setPrimaryPlatformWarehouse(id: string): void {
  const current = getStoredPlatformWarehouses();
  current.forEach((w) => {
    w.isPrimary = w.id === id;
  });
  saveStoredPlatformWarehouses(current);
}

/**
 * Legacy support: Get default/primary warehouse address
 */
export function getStoredWarehouseAddress(): WarehouseAddressConfig {
  const warehouses = getStoredPlatformWarehouses();
  const primary = warehouses.find((w) => w.isPrimary) || warehouses[0] || INITIAL_PLATFORM_WAREHOUSES[0];
  return {
    hubName: primary.hubName,
    hubCode: primary.hubCode,
    wilaya: primary.wilaya,
    commune: primary.commune,
    fullAddress: primary.fullAddress,
    postalCode: primary.postalCode,
    receivingPhone: primary.receivingPhone,
    receivingHours: primary.receivingHours,
    contactPerson: primary.contactPerson,
    notes: primary.notes,
  };
}

/**
 * Legacy support: Save primary warehouse address
 */
export function saveStoredWarehouseAddress(config: WarehouseAddressConfig): void {
  const warehouses = getStoredPlatformWarehouses();
  const primary = warehouses.find((w) => w.isPrimary) || warehouses[0];
  if (primary) {
    updatePlatformWarehouse(primary.id, {
      ...config,
    });
  }
}
