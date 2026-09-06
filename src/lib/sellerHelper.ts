import { UserProfile } from '../types';

export interface ExtendedSeller extends UserProfile {
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
}

const STORAGE_KEY_SELLERS = 'nouva_sellers_v2';

// In-memory cache to ensure sync across fast re-renders
let cachedSellers: ExtendedSeller[] | null = null;
let isSyncingWithServer = false;

export function getStoredSellers(): ExtendedSeller[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SELLERS);
    let localList: ExtendedSeller[] = [];
    if (raw) {
      localList = JSON.parse(raw);
      if (!Array.isArray(localList)) localList = [];
    }

    // Trigger background sync with server if not already running
    if (!isSyncingWithServer && typeof window !== 'undefined') {
      isSyncingWithServer = true;
      fetch('/api/reseller/sellers')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.sellers)) {
            const serverSellers: ExtendedSeller[] = data.sellers;
            const currentLocal = getStoredSellers();
            // Merge local and server without losing any seller
            const map = new Map<string, ExtendedSeller>();
            serverSellers.forEach((s) => { if (s && s.id) map.set(s.id, s); });
            currentLocal.forEach((s) => {
              if (s && s.id) {
                // If local has newer fields or exists only locally, keep and push to server
                if (!map.has(s.id)) {
                  fetch('/api/reseller/sellers', {
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
              localStorage.setItem(STORAGE_KEY_SELLERS, JSON.stringify(merged));
              cachedSellers = merged;
              window.dispatchEvent(new CustomEvent('nouva_sellers_updated', { detail: merged }));
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          isSyncingWithServer = false;
        });
    }

    cachedSellers = localList;
    return localList;
  } catch (e) {
    return cachedSellers || [];
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

export function addSellerRegistration(data: {
  fullName: string;
  storeName?: string;
  phone: string;
  email: string;
  password?: string;
  wilaya: string;
}): ExtendedSeller {
  const sellers = getStoredSellers();
  const existing = sellers.find(
    (s) => (s.email && s.email.trim().toLowerCase() === (data.email || '').trim().toLowerCase()) ||
           (s.phone && s.phone.trim() === (data.phone || '').trim())
  );

  if (existing) {
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

    // Sync with server
    fetch(`/api/reseller/sellers/${existing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSeller),
    }).catch(() => {});

    return updatedSeller;
  }

  const newSeller: ExtendedSeller = {
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

  // Sync to server immediately
  fetch('/api/reseller/sellers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSeller),
  }).catch(() => {});

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
  // Soft disable or remove from local if explicit
  const sellers = getStoredSellers();
  const updated = sellers.filter((s) => s.id !== sellerId);
  saveStoredSellers(updated);
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
