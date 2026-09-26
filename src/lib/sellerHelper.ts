import { UserProfile } from '../types';

export interface ExtendedSeller extends UserProfile {
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
}

const STORAGE_KEY_SELLERS = 'nouva_sellers_v2';

export const INITIAL_SELLERS: ExtendedSeller[] = [
  {
    id: 'seller-54839',
    fullName: 'Ali Assam',
    storeName: 'متجر Ali Assam',
    phone: '05555555',
    email: 'ali.assam.geo@gmail.com',
    password: 'aliassam',
    wilaya: '16 - الجزائر',
    role: 'reseller',
    rank: 'BRONZE',
    rankAr: 'المستوى البرونزي',
    rankFr: 'Niveau Bronze',
    kycStatus: 'PENDING',
    approvalStatus: 'PENDING',
    totalOrdersCount: 0,
    deliveredOrdersCount: 0,
    totalEarnedDzd: 0,
    joinDate: '2026-09-22',
  },
  {
    id: 'seller-101',
    fullName: 'كريم بوزيد',
    storeName: 'متجر الأناقة الجزائري',
    phone: '0551234567',
    email: 'karim.seller@gmail.com',
    password: 'sellerpass123',
    wilaya: '16 - الجزائر',
    role: 'reseller',
    rank: 'BRONZE',
    rankAr: 'المستوى البرونزي',
    rankFr: 'Niveau Bronze',
    kycStatus: 'PENDING',
    approvalStatus: 'PENDING',
    totalOrdersCount: 0,
    deliveredOrdersCount: 0,
    totalEarnedDzd: 0,
    joinDate: '2026-09-22',
  },
  {
    id: 'seller-102',
    fullName: 'ياسين بن عمارة',
    storeName: 'متجر الهواتف وإكسسواراتها',
    phone: '0662345678',
    email: 'yacine.dz@gmail.com',
    password: 'sellerpass123',
    wilaya: '31 - وهران',
    role: 'reseller',
    rank: 'BRONZE',
    rankAr: 'المستوى البرونزي',
    rankFr: 'Niveau Bronze',
    kycStatus: 'PENDING',
    approvalStatus: 'PENDING',
    totalOrdersCount: 0,
    deliveredOrdersCount: 0,
    totalEarnedDzd: 0,
    joinDate: '2026-09-22',
  },
];

// In-memory cache to ensure sync across fast re-renders
let cachedSellers: ExtendedSeller[] | null = null;
let isSyncingWithServer = false;

const STORAGE_KEY_DELETED_SELLERS = 'nouva_deleted_sellers_ids_v1';

export function getDeletedSellerIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_SELLERS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

export function markSellerDeleted(sellerId: string): void {
  try {
    const set = getDeletedSellerIds();
    set.add(sellerId);
    localStorage.setItem(STORAGE_KEY_DELETED_SELLERS, JSON.stringify(Array.from(set)));
  } catch {}
}

export function unmarkSellerDeleted(sellerId: string): void {
  try {
    const set = getDeletedSellerIds();
    set.delete(sellerId);
    localStorage.setItem(STORAGE_KEY_DELETED_SELLERS, JSON.stringify(Array.from(set)));
  } catch {}
}

export async function syncSellersWithServer(): Promise<ExtendedSeller[]> {
  if (typeof window === 'undefined') return cachedSellers || INITIAL_SELLERS;
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return getStoredSellers();
    }
    const deletedIds = getDeletedSellerIds();
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;

    let res: Response;
    try {
      res = await fetch(`/api/reseller/sellers?_t=${Date.now()}`, {
        signal: controller ? controller.signal : undefined,
        cache: 'no-store',
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    if (!res || !res.ok) {
      return getStoredSellers();
    }

    const text = await res.text();
    if (text && !text.trim().startsWith('<')) {
      const data = JSON.parse(text);
      if (data && Array.isArray(data.sellers)) {
        const serverSellers: ExtendedSeller[] = data.sellers;
        let raw = localStorage.getItem(STORAGE_KEY_SELLERS);
        let currentLocal: ExtendedSeller[] = [];
        if (raw) {
          try {
            currentLocal = JSON.parse(raw);
          } catch {}
        }
        if (!Array.isArray(currentLocal) || currentLocal.length === 0) {
          currentLocal = INITIAL_SELLERS.filter((s) => !deletedIds.has(s.id));
        }

        // Notify server if it still has any account that was deleted by admin
        serverSellers.forEach((s) => {
          if (s && s.id && deletedIds.has(s.id)) {
            fetch(`/api/reseller/sellers/${encodeURIComponent(s.id)}`, { method: 'DELETE' }).catch(() => {});
          }
        });

        const validServerSellers = serverSellers.filter((s) => s && s.id && !deletedIds.has(s.id));

        const map = new Map<string, ExtendedSeller>();
        // First add initial seeds that were NOT deleted
        INITIAL_SELLERS.forEach((s) => {
          if (!deletedIds.has(s.id)) map.set(s.id, s);
        });
        // Then merge local sellers
        currentLocal.forEach((s) => {
          if (s && s.id && !deletedIds.has(s.id)) {
            map.set(s.id, { ...map.get(s.id), ...s });
          }
        });
        // Server sellers take final precedence for fresh real-time status and new registrations
        validServerSellers.forEach((s) => {
          map.set(s.id, { ...map.get(s.id), ...s });
        });

        const merged = Array.from(map.values());
        if (merged.length > 0) {
          localStorage.setItem(STORAGE_KEY_SELLERS, JSON.stringify(merged));
          cachedSellers = merged;
          window.dispatchEvent(new CustomEvent('nouva_sellers_updated', { detail: merged }));
        }
        return merged;
      }
    }
  } catch (e) {
    // Graceful fallback to stored sellers during network reload / offline
    console.warn('Seller server sync deferred, using local persistence.');
  }
  return getStoredSellers();
}

export function getStoredSellers(): ExtendedSeller[] {
  try {
    const deletedIds = getDeletedSellerIds();
    let raw = localStorage.getItem(STORAGE_KEY_SELLERS);
    let localList: ExtendedSeller[] = [];
    if (raw) {
      localList = JSON.parse(raw);
      if (!Array.isArray(localList)) localList = [];
    }

    // Filter out any seller that was deleted
    localList = localList.filter((s) => s && s.id && !deletedIds.has(s.id));

    // Check previous keys (e.g., nouva_sellers_v1) to preserve all historical sellers
    if (localList.length === 0) {
      const prevKeys = ['nouva_sellers_v1', 'nouva_sellers'];
      for (const pKey of prevKeys) {
        const pRaw = localStorage.getItem(pKey);
        if (pRaw) {
          try {
            const pParsed = JSON.parse(pRaw);
            if (Array.isArray(pParsed) && pParsed.length > 0) {
              localList = pParsed.filter((s: ExtendedSeller) => s && s.id && !deletedIds.has(s.id));
              if (localList.length > 0) {
                localStorage.setItem(STORAGE_KEY_SELLERS, JSON.stringify(localList));
                break;
              }
            }
          } catch {}
        }
      }
    }

    // If still empty, seed with INITIAL_SELLERS that were not deleted
    if (localList.length === 0) {
      localList = INITIAL_SELLERS.filter((s) => !deletedIds.has(s.id));
      localStorage.setItem(STORAGE_KEY_SELLERS, JSON.stringify(localList));
    } else {
      // Smart merge to ensure no seed accounts (like Ali Assam) are missing unless deleted
      const existingMap = new Map<string, ExtendedSeller>(localList.map((s) => [s.id, s]));
      let hasChanges = false;
      INITIAL_SELLERS.forEach((seed) => {
        if (!deletedIds.has(seed.id) && !existingMap.has(seed.id)) {
          localList.unshift(seed);
          existingMap.set(seed.id, seed);
          hasChanges = true;
        }
      });
      if (hasChanges) {
        localStorage.setItem(STORAGE_KEY_SELLERS, JSON.stringify(localList));
      }
    }

    // Trigger background sync with server
    if (!isSyncingWithServer && typeof window !== 'undefined') {
      isSyncingWithServer = true;
      syncSellersWithServer().finally(() => {
        isSyncingWithServer = false;
      });
    }

    cachedSellers = localList;
    return localList;
  } catch (e) {
    const deletedIds = getDeletedSellerIds();
    return (cachedSellers || INITIAL_SELLERS).filter((s) => !deletedIds.has(s.id));
  }
}

export function saveStoredSellers(sellers: ExtendedSeller[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SELLERS, JSON.stringify(sellers));
    cachedSellers = sellers;
    window.dispatchEvent(new CustomEvent('nouva_sellers_updated', { detail: sellers }));
  } catch (e) {
    console.error('Error saving sellers:', e);
  }
}

export async function addSellerRegistration(data: {
  fullName: string;
  storeName?: string;
  phone: string;
  email: string;
  password?: string;
  wilaya: string;
}): Promise<ExtendedSeller> {
  const sellers = getStoredSellers();
  const existing = sellers.find(
    (s) => (s.email && s.email.trim().toLowerCase() === (data.email || '').trim().toLowerCase()) ||
           (s.phone && s.phone.trim() === (data.phone || '').trim())
  );

  if (existing) {
    unmarkSellerDeleted(existing.id);
    // Update existing rather than creating duplicate, preserving account
    const updatedSeller: ExtendedSeller = {
      ...existing,
      fullName: data.fullName || existing.fullName,
      storeName: data.storeName || existing.storeName,
      password: data.password || existing.password,
      wilaya: data.wilaya || existing.wilaya,
    };
    const updatedList = sellers.map((s) => (s.id === existing.id ? updatedSeller : s));
    saveStoredSellers(updatedList);

    // Sync with server immediately
    try {
      await fetch(`/api/reseller/sellers/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSeller),
        cache: 'no-store',
      });
    } catch {}

    return updatedSeller;
  }

  let newSeller: ExtendedSeller = {
    id: `seller-${Date.now().toString().slice(-5)}`,
    fullName: data.fullName,
    storeName: data.storeName || `متجر ${data.fullName}`,
    phone: data.phone,
    email: data.email,
    password: data.password || '123456',
    wilaya: data.wilaya,
    role: 'reseller',
    rank: 'BRONZE',
    rankAr: 'المستوى البرونزي',
    rankFr: 'Niveau Bronze',
    kycStatus: 'PENDING',
    approvalStatus: 'PENDING',
    totalOrdersCount: 0,
    deliveredOrdersCount: 0,
    totalEarnedDzd: 0,
    joinDate: new Date().toISOString().split('T')[0],
  };

  const updated = [newSeller, ...sellers];
  saveStoredSellers(updated);

  // Sync to server immediately and await response
  try {
    const res = await fetch('/api/reseller/sellers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSeller),
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.seller) {
        newSeller = { ...newSeller, ...json.seller };
        const finalUpdated = [newSeller, ...sellers.filter((s) => s.id !== newSeller.id)];
        saveStoredSellers(finalUpdated);
      }
    }
  } catch (err) {
    console.warn('Deferred server sync for registered seller, saved locally:', err);
  }

  return newSeller;
}

export function updateSellerStatus(
  sellerId: string,
  status: ExtendedSeller['approvalStatus']
): void {
  const sellers = getStoredSellers();
  let updatedSellerObj: ExtendedSeller | null = null;
  const updated = sellers.map((s) => {
    if (s.id === sellerId) {
      updatedSellerObj = {
        ...s,
        approvalStatus: status,
        kycStatus: status === 'APPROVED' ? ('APPROVED' as const) : ('PENDING' as const),
      };
      return updatedSellerObj;
    }
    return s;
  });
  saveStoredSellers(updated);

  if (updatedSellerObj) {
    fetch(`/api/reseller/sellers/${sellerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSellerObj),
    }).catch(() => {});
  }
}

export function updateSellerPassword(sellerIdOrEmail: string, newPassword: string): boolean {
  try {
    const sellers = getStoredSellers();
    let found = false;
    let targetSeller: ExtendedSeller | null = null;
    const target = (sellerIdOrEmail || '').trim().toLowerCase();
    const updated = sellers.map((s) => {
      if (s.id === sellerIdOrEmail || (s.email && s.email.trim().toLowerCase() === target)) {
        found = true;
        targetSeller = {
          ...s,
          password: newPassword.trim(),
        };
        return targetSeller;
      }
      return s;
    });

    if (found && targetSeller) {
      saveStoredSellers(updated);

      // Sync with server
      fetch(`/api/reseller/sellers/${(targetSeller as any).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword.trim() }),
      }).catch(() => {});

      // Also update session user if currently logged in
      const sessionRaw = localStorage.getItem('nouvamarket_session_v2');
      if (sessionRaw) {
        try {
          const sessionUser = JSON.parse(sessionRaw);
          if (sessionUser && (sessionUser.id === sellerIdOrEmail || (sessionUser.email && sessionUser.email.trim().toLowerCase() === target))) {
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
    console.error('Error updating seller password:', e);
    return false;
  }
}

export function updateSellerProfile(
  sellerIdOrEmail: string,
  updates: Partial<ExtendedSeller>
): ExtendedSeller | null {
  try {
    const sellers = getStoredSellers();
    let updatedSeller: ExtendedSeller | null = null;
    const target = (sellerIdOrEmail || '').trim().toLowerCase();

    const updated = sellers.map((s) => {
      if (s.id === sellerIdOrEmail || (s.email && s.email.trim().toLowerCase() === target)) {
        updatedSeller = {
          ...s,
          ...updates,
          email: updates.email ? updates.email.trim().toLowerCase() : s.email,
        };
        return updatedSeller;
      }
      return s;
    });

    if (updatedSeller) {
      saveStoredSellers(updated);

      // Sync with server
      fetch(`/api/reseller/sellers/${(updatedSeller as any).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).catch(() => {});

      // Also update session user if currently logged in
      const sessionRaw = localStorage.getItem('nouvamarket_session_v2');
      if (sessionRaw) {
        try {
          const sessionUser = JSON.parse(sessionRaw);
          if (sessionUser && (sessionUser.id === sellerIdOrEmail || (sessionUser.email && sessionUser.email.trim().toLowerCase() === target))) {
            const nextSession = { ...sessionUser, ...updates };
            localStorage.setItem('nouvamarket_session_v2', JSON.stringify(nextSession));
          }
        } catch (e) {
          // ignore
        }
      }
    }

    return updatedSeller;
  } catch (e) {
    console.error('Error updating seller profile:', e);
    return null;
  }
}

export function deleteSellerRegistration(sellerId: string): void {
  // Mark as deleted in blacklist so it never reappears on reload or re-sync
  markSellerDeleted(sellerId);
  const sellers = getStoredSellers().filter((s) => s.id !== sellerId);
  saveStoredSellers(sellers);

  // Send DELETE to server (supports both Node server and Hostinger PHP bridge)
  fetch(`/api/reseller/sellers/${encodeURIComponent(sellerId)}`, {
    method: 'DELETE',
  }).catch(() => {});
}

export function getWhatsAppUrl(phone: string, text?: string): string {
  let cleaned = (phone || '').replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '213' + cleaned.substring(1);
  } else if (!cleaned.startsWith('213') && cleaned.length > 0) {
    cleaned = '213' + cleaned;
  }
  const baseUrl = `https://wa.me/${cleaned}`;
  if (text) {
    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  }
  return baseUrl;
}
