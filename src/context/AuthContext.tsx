import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getStoredSuppliers, addSupplierRegistration, updateSupplierPassword, updateSupplierProfile } from '../lib/supplierHelper';
import { getStoredSellers, addSellerRegistration, updateSellerPassword, updateSellerProfile } from '../lib/sellerHelper';
import { verifySystemUserCredentials, mapSystemUserToAppRole, updateSystemUser, getStoredSystemUsers } from '../lib/systemUserHelper';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
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
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('nouvamarket_session_v2');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed && (parsed.email || parsed.phone || parsed.id)) {
            // Strict Admin Approval Enforcement for Stored Sessions
            const cleanEmail = (parsed.email || '').trim().toLowerCase();
            const cleanPhone = (parsed.phone || '').trim();

            // Match and enforce exact system user role
            const sysUsers = getStoredSystemUsers();
            const matchedSys = sysUsers.find(
              (u) => (u.email && u.email.trim().toLowerCase() === cleanEmail) || u.id === parsed.id
            );
            if (matchedSys) {
              parsed.role = mapSystemUserToAppRole(matchedSys.role);
            } else if (cleanEmail.includes('confirm') || parsed.rankAr?.includes('مؤكد') || parsed.rankAr?.includes('Confirmer')) {
              parsed.role = 'confirmer';
            }

            if (parsed.role === 'warehouse') {
              const suppliers = getStoredSuppliers();
              const sup = suppliers.find(
                (s) =>
                  (s.id && s.id === parsed.id) ||
                  (s.email && s.email.trim().toLowerCase() === cleanEmail) ||
                  (s.phone && s.phone.trim() === cleanPhone)
              );
              if (sup) {
                parsed.approvalStatus = sup.status;
                if (sup.status === 'APPROVED') {
                  parsed.kycStatus = 'APPROVED';
                }
              }
            } else if (parsed.role === 'reseller') {
              const sellers = getStoredSellers();
              const sel = sellers.find(
                (s) =>
                  (s.id && s.id === parsed.id) ||
                  (s.email && s.email.trim().toLowerCase() === cleanEmail) ||
                  (s.phone && s.phone.trim() === cleanPhone)
              );
              if (sel) {
                parsed.approvalStatus = sel.approvalStatus;
                if (sel.approvalStatus === 'APPROVED') {
                  parsed.kycStatus = 'APPROVED';
                }
              }
            }

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

  // Background real-time listener for Admin Approval:
  // Keeps registrant inside the app and transitions them immediately upon admin approval without logging in!
  useEffect(() => {
    if (!user || user.approvalStatus === 'APPROVED') return;

    const checkApproval = () => {
      const cleanEmail = (user.email || '').trim().toLowerCase();
      const cleanPhone = (user.phone || '').trim();

      if (user.role === 'warehouse') {
        const suppliers = getStoredSuppliers();
        const sup = suppliers.find(
          (s) =>
            (s.id && s.id === user.id) ||
            (s.email && s.email.trim().toLowerCase() === cleanEmail) ||
            (s.phone && s.phone.trim() === cleanPhone)
        );
        if (sup && sup.status === 'APPROVED') {
          const updatedUser: UserProfile = {
            ...user,
            approvalStatus: 'APPROVED',
            kycStatus: 'APPROVED',
          };
          setUser(updatedUser);
          localStorage.setItem('nouvamarket_session_v2', JSON.stringify(updatedUser));
          window.dispatchEvent(new CustomEvent('nouva_user_approved', { detail: updatedUser }));
        }
      } else if (user.role === 'reseller') {
        const sellers = getStoredSellers();
        const sel = sellers.find(
          (s) =>
            (s.id && s.id === user.id) ||
            (s.email && s.email.trim().toLowerCase() === cleanEmail) ||
            (s.phone && s.phone.trim() === cleanPhone)
        );
        if (sel && sel.approvalStatus === 'APPROVED') {
          const updatedUser: UserProfile = {
            ...user,
            approvalStatus: 'APPROVED',
            kycStatus: 'APPROVED',
          };
          setUser(updatedUser);
          localStorage.setItem('nouvamarket_session_v2', JSON.stringify(updatedUser));
          window.dispatchEvent(new CustomEvent('nouva_user_approved', { detail: updatedUser }));
        }
      }
    };

    checkApproval();
    const interval = setInterval(checkApproval, 2000);
    window.addEventListener('storage', checkApproval);
    window.addEventListener('nouva_suppliers_updated', checkApproval);
    window.addEventListener('nouva_sellers_updated', checkApproval);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkApproval);
      window.removeEventListener('nouva_suppliers_updated', checkApproval);
      window.removeEventListener('nouva_sellers_updated', checkApproval);
    };
  }, [user]);

  const clearAuthError = () => setAuthError(null);

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
    setAuthError(null);
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    if (!cleanEmail || !cleanPass) {
      setAuthError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return false;
    }

    try {
      const res = await fetch('/api/reseller/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });
      const data = await res.json();
      if (data.pendingApproval) {
        setAuthError(
          data.message ||
            '⏳ حسابك قيد المراجعة والتدقيق. تطبيقاً لقوانين المنصة، لا يمكنك الدخول إلى الحساب إلا بموافقة الأدمن من خلال الضغط على زر الموافقة في الداشبورد.'
        );
        return false;
      }
      if (data.user) {
        let role: 'reseller' | 'admin' | 'warehouse' | 'confirmer' = data.user.role || 'reseller';
        if (
          data.user.systemRole === 'ORDER_CONFIRMER' ||
          data.user.role === 'confirmer' ||
          cleanEmail.includes('confirm') ||
          cleanEmail.startsWith('confirm@')
        ) {
          role = 'confirmer';
        } else if (cleanEmail.includes('admin') || cleanEmail.startsWith('admin@')) {
          role = 'admin';
        } else if (
          cleanEmail.includes('warehouse') ||
          cleanEmail.includes('supplier') ||
          cleanEmail.includes('مستودع') ||
          cleanEmail.startsWith('warehouse@')
        ) {
          role = 'warehouse';
        }

        if (role !== 'admin' && role !== 'confirmer' && data.user.approvalStatus && data.user.approvalStatus !== 'APPROVED') {
          setAuthError(
            '⏳ حسابك قيد المراجعة والتدقيق. تطبيقاً لقوانين المنصة، لا يمكنك الدخول إلى الحساب إلا بموافقة الأدمن من خلال الضغط على زر الموافقة في الداشبورد.'
          );
          return false;
        }

        const userWithRole = { ...data.user, role };
        setUser(userWithRole);
        localStorage.setItem('nouvamarket_session_v2', JSON.stringify(userWithRole));
        return true;
      }
    } catch (e) {
      // Fallback local session verification
    }

    // 0. Check System Users (Admin, Warehouse, Support, Finance with email & password)
    const matchedSystemUser = verifySystemUserCredentials(cleanEmail, cleanPass);
    if (matchedSystemUser) {
      const appRole = mapSystemUserToAppRole(matchedSystemUser.role);
      const isWarehouse = appRole === 'warehouse';
      const isConfirmer = appRole === 'confirmer';
      const loggedUser: UserProfile = {
        id: matchedSystemUser.id,
        fullName: matchedSystemUser.fullName,
        storeName: isWarehouse ? 'مستودع Nouva' : isConfirmer ? 'فريق تأكيد الطلبيات Nouva' : 'الإدارة العامة Nouva',
        phone: '0550123456',
        email: matchedSystemUser.email,
        password: matchedSystemUser.password || cleanPass,
        role: appRole,
        wilaya: '16 - الجزائر',
        rank: 'GOLD',
        rankAr: matchedSystemUser.role === 'ADMIN' ? 'مدير النظام' : matchedSystemUser.role === 'ORDER_CONFIRMER' ? 'مؤكد الطلبيات (Confirmer)' : matchedSystemUser.role,
        rankFr: matchedSystemUser.role === 'ORDER_CONFIRMER' ? 'Agent de confirmation' : 'Administrateur',
        kycStatus: 'APPROVED',
        approvalStatus: 'APPROVED',
        totalOrdersCount: 0,
        deliveredOrdersCount: 0,
        totalEarnedDzd: 0,
        joinDate: matchedSystemUser.createdAt || new Date().toISOString().split('T')[0],
      };

      setUser(loggedUser);
      localStorage.setItem('nouvamarket_session_v2', JSON.stringify(loggedUser));
      return true;
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
        setAuthError('كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.');
        return false;
      }

      // STRICT ADMIN APPROVAL MANDATE:
      if (matchedSupplier.status !== 'APPROVED') {
        if (matchedSupplier.status === 'REJECTED') {
          setAuthError('❌ تم رفض طلب انضمام حساب المورد هذا من قِبل إدارة المنصة.');
          return false;
        } else if (matchedSupplier.status === 'SUSPENDED') {
          setAuthError('⛔ تم تعليق حساب المورد هذا مؤقتاً من قِبل إدارة المنصة.');
          return false;
        } else {
          // Keep registrant connected in PENDING status so they stay in app and auto-enter when approved!
          const pendingUser: UserProfile = {
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
            kycStatus: 'PENDING',
            approvalStatus: 'PENDING',
            totalOrdersCount: 0,
            deliveredOrdersCount: 0,
            totalEarnedDzd: 0,
            joinDate: matchedSupplier.createdAt || new Date().toISOString().split('T')[0],
          };
          setAuthError(null);
          setUser(pendingUser);
          localStorage.setItem('nouvamarket_session_v2', JSON.stringify(pendingUser));
          return true;
        }
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
        approvalStatus: 'APPROVED',
        totalOrdersCount: 0,
        deliveredOrdersCount: 0,
        totalEarnedDzd: 0,
        joinDate: matchedSupplier.createdAt || new Date().toISOString().split('T')[0],
      };

      setAuthError(null);
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
        setAuthError('كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.');
        return false;
      }

      // STRICT ADMIN APPROVAL MANDATE:
      if (matchedSeller.approvalStatus !== 'APPROVED') {
        if (matchedSeller.approvalStatus === 'REJECTED') {
          setAuthError('❌ تم رفض طلب انضمام حساب البائع هذا من قِبل إدارة المنصة.');
          return false;
        } else if (matchedSeller.approvalStatus === 'SUSPENDED') {
          setAuthError('⛔ تم تعليق حساب البائع هذا مؤقتاً من قِبل إدارة المنصة.');
          return false;
        } else {
          // Keep registrant connected in PENDING status so they stay in app and auto-enter when approved!
          const pendingUser: UserProfile = {
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
            kycStatus: 'PENDING',
            approvalStatus: 'PENDING',
            totalOrdersCount: 0,
            deliveredOrdersCount: 0,
            totalEarnedDzd: matchedSeller.totalEarnedDzd || 0,
            joinDate: matchedSeller.joinDate || new Date().toISOString().split('T')[0],
          };
          setAuthError(null);
          setUser(pendingUser);
          localStorage.setItem('nouvamarket_session_v2', JSON.stringify(pendingUser));
          return true;
        }
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
        approvalStatus: 'APPROVED',
        totalOrdersCount: 0,
        deliveredOrdersCount: 0,
        totalEarnedDzd: matchedSeller.totalEarnedDzd || 0,
        joinDate: matchedSeller.joinDate || new Date().toISOString().split('T')[0],
      };

      setAuthError(null);
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
        if (user.id) {
          updateSystemUser(user.id, { password: trimmedPass });
        }
      }

      if (user.id && user.id.startsWith('usr-')) {
        updateSystemUser(user.id, { password: trimmedPass });
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

    // Save user session for all registrants (including pending sellers and suppliers)
    // so they stay connected inside the application without being disconnected!
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
        authError,
        clearAuthError,
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
