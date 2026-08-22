import { UserProfile } from '../types';

export interface ExtendedSeller extends UserProfile {
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
}

const STORAGE_KEY_SELLERS = 'nouva_sellers_v2';

export function getStoredSellers(): ExtendedSeller[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SELLERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SELLERS, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveStoredSellers(sellers: ExtendedSeller[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SELLERS, JSON.stringify(sellers));
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
  return newSeller;
}

export function updateSellerStatus(
  sellerId: string,
  status: ExtendedSeller['approvalStatus']
): void {
  const sellers = getStoredSellers();
  const updated = sellers.map((s) => {
    if (s.id === sellerId) {
      return {
        ...s,
        approvalStatus: status,
        kycStatus: status === 'APPROVED' ? ('APPROVED' as const) : ('PENDING' as const),
      };
    }
    return s;
  });
  saveStoredSellers(updated);
}

export function deleteSellerRegistration(sellerId: string): void {
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
