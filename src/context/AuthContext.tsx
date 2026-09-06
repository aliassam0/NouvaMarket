import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getStoredSuppliers, addSupplierRegistration, updateSupplierPassword, updateSupplierProfile } from '../lib/supplierHelper';
import { getStoredSellers, addSellerRegistration, updateSellerPassword, updateSellerProfile } from '../lib/sellerHelper';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPhoneOtp: (phone: string, otp: string) => Promise<boolean>;
  loginWithEmailPassword: (email: string, pass: string) => Promise<boolean>;
  registerWithEmail: (data: {
    fullName: string;
    storeName: string;
    email: string;
    phone: string;
    wilaya: string;
    password: string;
    role?: 'reseller' | 'warehouse' | 'admin';
  }) => Promise<boolean>;
  updateProfile: (updated: Partial<UserProfile>) => void;
  updateUserPassword: (newPassword: string, oldPassword?: string) => Promise<{ success: boolean; message: string }>;
  updateUserEmail: (newEmail: string) => Promise<{ success: boolean; message: string }>;
  submitKyc: (cinNumber: string, frontPhoto: string, backPhoto: string, ccp: string) => Promise<boolean>;
  switchUser: (sellerProfile: UserProfile) => void;
  logout: () => void;
}

const DEFAULT_USER: UserProfile = {
  id: 'u-reseller-12',
  fullName: 'بائع جديد',
  storeName: 'متجر البائع',
  phone: '0550123456',
  email: 'seller@nouvachat.com',
  password: 'Aliass@m1989',
  role: 'reseller',
  wilaya: '16 - الجزائر',
  rank: 'BRONZE',
  rankAr: 'المستوى البرونزي',
  rankFr: 'Niveau Bronze',
  kycStatus: 'APPROVED',
  approvalStatus: 'PENDING',
  totalOrdersCount: 0,
  deliveredOrdersCount: 0,
  totalEarnedDzd: 0,
  joinDate: new Date().toISOString().split('T')[0],
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('nouvamarket_session_v2');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed && (parsed.email || parsed.phone || parsed.id)) {
            return parsed;
          }
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const loginWithPhoneOtp = async (phone: string, otp: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/reseller/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('nouvamarket_session_v2', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch (e) {
      // Fallback local login for smooth demo
      const newUser: UserProfile = {
        ...DEFAULT_USER,
        phone,
      };
      setUser(newUser);
      localStorage.setItem('nouvamarket_session_v2', JSON.stringify(newUser));
      return true;
    }
  };

  const loginWithEmailPassword = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    if (!cleanEmail || !cleanPass) {
      return false;
    }

    try {
      const res = await fetch('/api/reseller/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });
      const data = await res.json();
      if (data.user) {
        let role: 'reseller' | 'admin' | 'warehouse' = 'reseller';
        if (cleanEmail.includes('admin') || cleanEmail.startsWith('admin@')) {
          role = 'admin';
        } else if (
          cleanEmail.includes('warehouse') ||
          cleanEmail.includes('supplier') ||
          cleanEmail.includes('مستودع') ||
          cleanEmail.startsWith('warehouse@')
        ) {
          role = 'warehouse';
        }
        const userWithRole = { ...data.user, role };
        setUser(userWithRole);
        localStorage.setItem('nouvamarket_session_v2', JSON.stringify(userWithRole));
        return true;
      }
    } catch (e) {
      // Fallback local session verification
    }

    // 1. Check registered suppliers (Strict Password Check against latest updated password)
    const suppliers = getStoredSuppliers();
    const matchedSupplier = suppliers.find(
      (s) =>
        (s.email && s.email.trim().toLowerCase() === cleanEmail) ||
        (s.phone && s.phone.trim() === cleanEmail)
    );

    if (matchedSupplier) {
      const expectedPass = (matchedSupplier.password || '123456').trim();
      // Strictly enforce the supplier's actual stored password
      if (cleanPass !== expectedPass) {
        return false;
      }

      const loggedUser: UserProfile = {
        id: matchedSupplier.id,
        fullName: matchedSupplier.fullName,
        storeName: matchedSupplier.companyName || matchedSupplier.fullName,
        phone: matchedSupplier.phone,
        email: matchedSupplier.email,
        password: matchedSupplier.password || cleanPass,
        role: 'warehouse',
        wilaya: matchedSupplier.wilaya || '16 - الجزائر',
        rank: 'BRONZE',
        rankAr: 'المستوى البرونزي',
        rankFr: 'Niveau Bronze',
        kycStatus: 'APPROVED',
        approvalStatus:
          matchedSupplier.status === 'APPROVED'
            ? 'APPROVED'
            : matchedSupplier.status === 'REJECTED'
            ? 'REJECTED'
            : 'PENDING',
        totalOrdersCount: 0,
        deliveredOrdersCount: 0,
        totalEarnedDzd: 0,
        joinDate: matchedSupplier.createdAt || new Date().toISOString().split('T')[0],
      };

      setUser(loggedUser);
      localStorage.setItem('nouvamarket_session_v2', JSON.stringify(loggedUser));
      return true;
    }

    // 2. Check registered sellers (Strict Password Check against latest updated password)
    const sellers = getStoredSellers();
    const matchedSeller = sellers.find(
      (s) =>
        (s.email && s.email.trim().toLowerCase() === cleanEmail) ||
        (s.phone && s.phone.trim() === cleanEmail)
    );

    if (matchedSeller) {
      const expectedPass = (matchedSeller.password || '123456').trim();
      // Strictly enforce the seller's actual stored password
      if (cleanPass !== expectedPass) {
        return false;
      }

      const loggedUser: UserProfile = {
        id: matchedSeller.id,
        fullName: matchedSeller.fullName,
        storeName: matchedSeller.storeName,
        phone: matchedSeller.phone,
        email: matchedSeller.email,
        password: matchedSeller.password || cleanPass,
        role: 'reseller',
        wilaya: matchedSeller.wilaya || '16 - الجزائر',
        rank: 'BRONZE',
        rankAr: 'المستوى البرونزي',
        rankFr: 'Niveau Bronze',
        kycStatus: 'APPROVED',
        approvalStatus: matchedSeller.approvalStatus || 'PENDING',
        totalOrdersCount: 0,
        deliveredOrdersCount: 0,
        totalEarnedDzd: matchedSeller.totalEarnedDzd || 0,
        joinDate: matchedSeller.joinDate || new Date().toISOString().split('T')[0],
      };

      setUser(loggedUser);
      localStorage.setItem('nouvamarket_session_v2', JSON.stringify(loggedUser));
      return true;
    }

    // 3. Check official demo accounts & admin/supplier role matching
    const customAdminPass = localStorage.getItem('nouva_admin_password') || 'Aliass@m1989';
    const isAdminDemo =
      cleanEmail.includes('admin') ||
      cleanEmail.startsWith('admin@') ||
      cleanEmail === 'admin@ecomdz.com' ||
      cleanEmail === 'admin@nouvamarket.com';
    const isSupplierDemo =
      cleanEmail.includes('warehouse') ||
      cleanEmail.includes('supplier') ||
      cleanEmail.startsWith('warehouse@') ||
      cleanEmail === 'warehouse@nouvamarket.com';
    const isSellerDemo =
      cleanEmail.includes('seller') ||
      cleanEmail === DEFAULT_USER.email?.toLowerCase() ||
      cleanEmail === 'seller@nouvachat.com' ||
      cleanEmail === 'seller@nouvamarket.com';

    if (isAdminDemo) {
      if (cleanPass !== customAdminPass && cleanPass !== 'Aliass@m1989') return false;
      const loggedUser: UserProfile = {
        id: 'u-admin-1',
        fullName: 'مدير النظام (Admin)',
        storeName: 'الإدارة العامة Nouva',
        phone: '0550123456',
        email: cleanEmail,
        password: cleanPass,
        role: 'admin',
        wilaya: '16 - الجزائر',
        rank: 'GOLD',
        rankAr: 'المستوى الذهبي',
        rankFr: 'Niveau Or',
        kycStatus: 'APPROVED',
        approvalStatus: 'APPROVED',
        totalOrdersCount: 0,
        deliveredOrdersCount: 0,
        totalEarnedDzd: 0,
        joinDate: new Date().toISOString().split('T')[0],
      };
      setUser(loggedUser);
      localStorage.setItem('nouvamarket_session_v2', JSON.stringify(loggedUser));
      return true;
    }

    if (isSupplierDemo) {
      if (cleanPass !== 'Aliass@m1989') return false;
      const loggedUser: UserProfile = {
        id: 'u-wh-1',
        fullName: 'أمين المستودع والمورد الرئيسي',
        storeName: 'المستودع الرئيسي',
        phone: '0550123456',
        email: cleanEmail,
        password: cleanPass,
        role: 'warehouse',
        wilaya: '16 - الجزائر',
        rank: 'BRONZE',
        rankAr: 'المستوى البرونزي',
        rankFr: 'Niveau Bronze',
        kycStatus: 'APPROVED',
        approvalStatus: 'APPROVED',
        totalOrdersCount: 0,
        deliveredOrdersCount: 0,
        totalEarnedDzd: 0,
        joinDate: new Date().toISOString().split('T')[0],
      };
      setUser(loggedUser);
      localStorage.setItem('nouvamarket_session_v2', JSON.stringify(loggedUser));
      return true;
    }

    if (isSellerDemo) {
      if (cleanPass !== 'Aliass@m1989') return false;
      const loggedUser: UserProfile = {
        ...DEFAULT_USER,
        email: cleanEmail,
        password: cleanPass,
      };
      setUser(loggedUser);
      localStorage.setItem('nouvamarket_session_v2', JSON.stringify(loggedUser));
      return true;
    }

    // Strict reject if credentials not recognized
    return false;
  };

  const updateUserPassword = async (
    newPassword: string,
    oldPassword?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'يجب تسجيل الدخول أولاً' };
    }

    const trimmedPass = (newPassword || '').trim();
    if (trimmedPass.length < 6) {
      return { success: false, message: 'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف أو أرقام على الأقل' };
    }

    if (oldPassword && user.password && user.password !== oldPassword.trim()) {
      return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
    }

    try {
      if (user.role === 'reseller') {
        updateSellerPassword(user.id, trimmedPass);
        if (user.email) {
          updateSellerPassword(user.email, trimmedPass);
        }
      } else if (user.role === 'warehouse') {
        updateSupplierPassword(user.id, trimmedPass);
        if (user.email) {
          updateSupplierPassword(user.email, trimmedPass);
        }
      } else if (user.role === 'admin') {
        localStorage.setItem('nouva_admin_password', trimmedPass);
      }

      const nextUser = { ...user, password: trimmedPass };
      setUser(nextUser);
      localStorage.setItem('nouvamarket_session_v2', JSON.stringify(nextUser));

      return { success: true, message: 'تم تحديث كلمة المرور بنجاح! سيتم استخدامها حصراً لتسجيل الدخول.' };
    } catch (e) {
      return { success: false, message: 'حدث خطأ أثناء حفظ كلمة المرور الجديدة' };
    }
  };

  const updateUserEmail = async (
    newEmail: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'يجب تسجيل الدخول أولاً' };
    }

    const cleanEmail = (newEmail || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, message: 'صيغة البريد الإلكتروني غير صالحة' };
    }

    try {
      if (user.role === 'reseller') {
        updateSellerProfile(user.id, { email: cleanEmail });
      } else if (user.role === 'warehouse') {
        updateSupplierProfile(user.id, { email: cleanEmail });
      }

      const nextUser = { ...user, email: cleanEmail };
      setUser(nextUser);
      localStorage.setItem('nouvamarket_session_v2', JSON.stringify(nextUser));

      return { success: true, message: 'تم تحديث البريد الإلكتروني بنجاح!' };
    } catch (e) {
      return { success: false, message: 'حدث خطأ أثناء تحديث البريد الإلكتروني' };
    }
  };

  const registerWithEmail = async (data: {
    fullName: string;
    storeName: string;
    email: string;
    phone: string;
    wilaya: string;
    password: string;
    role?: 'reseller' | 'warehouse' | 'admin';
  }): Promise<boolean> => {
    const targetRole = data.role || 'reseller';

    let registeredId = `seller-${Date.now().toString().slice(-5)}`;

    if (targetRole === 'warehouse') {
      const sup = addSupplierRegistration({
        fullName: data.fullName,
        companyName: data.storeName || `مستودع ${data.fullName}`,
        phone: data.phone,
        email: data.email,
        password: data.password,
        wilaya: data.wilaya,
        activityType: 'ألبسة ونسيج',
        ccpOrRip: 'CCP / BaridiMob Pending',
      });
      registeredId = sup.id;
    } else if (targetRole === 'reseller') {
      const sel = addSellerRegistration({
        fullName: data.fullName,
        storeName: data.storeName || `متجر ${data.fullName}`,
        phone: data.phone,
        email: data.email,
        password: data.password,
        wilaya: data.wilaya,
      });
      registeredId = sel.id;
    }

    const newSeller: UserProfile = {
      id: registeredId,
      fullName: data.fullName,
      storeName:
        data.storeName || (targetRole === 'warehouse' ? `مستودع ${data.fullName}` : `متجر ${data.fullName}`),
      phone: data.phone,
      email: (data.email || '').trim().toLowerCase(),
      password: (data.password || '123456').trim(),
      role: targetRole,
      wilaya: data.wilaya,
      rank: 'BRONZE',
      rankAr: 'المستوى البرونزي',
      rankFr: 'Niveau Bronze',
      kycStatus: 'APPROVED',
      approvalStatus: targetRole === 'admin' ? 'APPROVED' : 'PENDING',
      totalOrdersCount: 0,
      deliveredOrdersCount: 0,
      totalEarnedDzd: 0,
      joinDate: new Date().toISOString().split('T')[0],
    };
    setUser(newSeller);
    localStorage.setItem('nouvamarket_session_v2', JSON.stringify(newSeller));
    localStorage.setItem('reseller_wallet_balance_v1', '0');
    localStorage.setItem('reseller_wallet_transactions_v1', JSON.stringify([]));
    return true;
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const next = { ...user, ...updated };
    if (updated.email) {
      next.email = updated.email.trim().toLowerCase();
    }
    setUser(next);
    localStorage.setItem('nouvamarket_session_v2', JSON.stringify(next));

    if (user.role === 'reseller') {
      updateSellerProfile(user.id, updated);
    } else if (user.role === 'warehouse') {
      updateSupplierProfile(user.id, updated as any);
    }
  };

  const submitKyc = async (cinNumber: string, frontPhoto: string, backPhoto: string, ccp: string): Promise<boolean> => {
    updateProfile({ kycStatus: 'PENDING' });
    // Simulate server approval delay
    setTimeout(() => {
      updateProfile({ kycStatus: 'APPROVED' });
    }, 4000);
    return true;
  };

  const switchUser = (sellerProfile: UserProfile) => {
    setUser(sellerProfile);
    localStorage.setItem('nouvamarket_session_v2', JSON.stringify(sellerProfile));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nouvamarket_session_v2');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithPhoneOtp,
        loginWithEmailPassword,
        registerWithEmail,
        updateProfile,
        updateUserPassword,
        updateUserEmail,
        submitKyc,
        switchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
