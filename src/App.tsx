import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Layers,
  Package,
  Wallet,
  User,
  Bell,
  Sparkles,
  Zap,
  BarChart3,
  Share2,
  Link as LinkIcon,
  Wand2,
  LogOut,
  Store,
  Globe,
  ShieldCheck,
  Boxes,
  Headphones,
  Headset,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider, useOrders } from './context/OrderContext';
import { CategoryProvider } from './context/CategoryContext';
import { RouterProvider, useRouter } from './router/RouterContext';
import { MobileDeviceFrame } from './components/ui/MobileDeviceFrame';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { Toast, ToastMessage } from './components/ui/Toast';
import { AccessDeniedScreen } from './components/common/AccessDeniedScreen';

import { AccueilTab } from './components/tabs/AccueilTab';
import { ProduitsTab } from './components/tabs/ProduitsTab';
import { ProductDetailModal } from './components/tabs/ProductDetailModal';
import { CommandesTab } from './components/tabs/CommandesTab';
import { NewOrderModal } from './components/tabs/NewOrderModal';
import { WalletTab } from './components/tabs/WalletTab';
import { AnalyticsTab } from './components/tabs/AnalyticsTab';
import { MarketingTab } from './components/tabs/MarketingTab';
import { GamificationModal } from './components/tabs/GamificationModal';
import { ProfilTab } from './components/tabs/ProfilTab';
import { PendingSellerScreen } from './components/common/PendingSellerScreen';
import { NotificationsModal } from './components/tabs/NotificationsModal';
import { getUnreadNotificationsCount } from './lib/notificationHelper';
import { DevToolsDrawer } from './components/tabs/DevToolsDrawer';

import { AdminDashboard } from './components/admin/AdminDashboard';
import { WarehouseDashboard } from './components/warehouse/WarehouseDashboard';
import { ConfirmerDashboard } from './components/confirmer/ConfirmerDashboard';
import { SupportDashboard } from './components/support/SupportDashboard';
import { LandingPage } from './components/landing/LandingPage';
import { PublicProductsPage } from './components/public/PublicProductsPage';
import { PublicSuppliersPage } from './components/public/PublicSuppliersPage';
import { PublicResellersPage } from './components/public/PublicResellersPage';
import { PublicAcademyPage } from './components/public/PublicAcademyPage';
import { PublicShippingPage } from './components/public/PublicShippingPage';
import { PublicFaqPage } from './components/public/PublicFaqPage';
import { PublicAboutPage } from './components/public/PublicAboutPage';
import { PublicContactPage } from './components/public/PublicContactPage';
import { PublicTermsPage } from './components/public/PublicTermsPage';
import { PublicPrivacyPage } from './components/public/PublicPrivacyPage';
import { MarketedProductsTab } from './components/tabs/MarketedProductsTab';
import { ShareProductModal } from './components/tabs/ShareProductModal';
import { CustomerShareOrderView } from './components/tabs/CustomerShareOrderView';
import { ExternalStoreSyncModal } from './components/common/ExternalStoreSyncModal';
import { StoresManagementModal } from './components/common/StoresManagementModal';
import { SellerDirectSupportChatWidget } from './components/chat/SellerDirectSupportChatWidget';
import { SupportAgentInboxWidget } from './components/chat/SupportAgentInboxWidget';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { DashboardSwitcher, DashboardRole } from './components/common/DashboardSwitcher';
import { InstantSaleBanner } from './components/common/InstantSaleBanner';
import { MOCK_PRODUCTS, getStoredProducts, syncProductsWithServer } from './data/mockProducts';

import { Product, ProductVariant } from './types';

type TabType = 'accueil' | 'produits' | 'marketed' | 'commandes' | 'wallet' | 'analytics' | 'marketing' | 'profil';
export type RoleType = 'reseller' | 'admin' | 'warehouse' | 'platform_warehouse' | 'confirmer' | 'support';

function AppContent() {
  const { t, language, isRtl } = useLanguage();
  const { user, logout } = useAuth();
  const { pendingLinkOrdersCount } = useOrders();
  const { path, searchParams, navigate } = useRouter();

  const [currentRole, setCurrentRole] = useState<RoleType>((user?.role as RoleType) || 'reseller');
  const [activeTab, setActiveTab] = useState<TabType>('accueil');
  const [impersonatedSellerName, setImpersonatedSellerName] = useState<string | null>(null);
  const [impersonatedSupplierName, setImpersonatedSupplierName] = useState<string | null>(null);
  const [impersonatedConfirmerName, setImpersonatedConfirmerName] = useState<string | null>(null);
  const [impersonatedSupportName, setImpersonatedSupportName] = useState<string | null>(null);
  const [impersonatedSupportAgentId, setImpersonatedSupportAgentId] = useState<string | null>(null);

  // Synchronize URL path with internal state
  useEffect(() => {
    // 1. Handle Legacy ?share=productId queries
    const legacyShareId = searchParams.get('share');
    if (legacyShareId) {
      const linkId = searchParams.get('linkId');
      navigate(`/p/${legacyShareId}${linkId ? `?linkId=${linkId}` : ''}`, { replace: true });
      return;
    }

    // 2. Map route to role and tabs
    if (path === '/admin') {
      setCurrentRole('admin');
    } else if (path === '/warehouse') {
      setCurrentRole('warehouse');
    } else if (path === '/confirmer') {
      setCurrentRole('confirmer');
    } else if (path === '/support') {
      setCurrentRole('support');
    } else if (path.startsWith('/dashboard')) {
      setCurrentRole('reseller');
      const sub = path.replace(/^\/dashboard\/?/, '').trim();
      const validTabs: TabType[] = ['accueil', 'produits', 'marketed', 'commandes', 'wallet', 'analytics', 'marketing', 'profil'];
      if (sub && validTabs.includes(sub as TabType)) {
        setActiveTab(sub as TabType);
      } else if (!sub) {
        setActiveTab('accueil');
      }
    }
  }, [path, searchParams, navigate]);

  useEffect(() => {
    syncProductsWithServer();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setImpersonatedSellerName(null);
    setImpersonatedSupplierName(null);
    setImpersonatedConfirmerName(null);
    setImpersonatedSupportName(null);
    setImpersonatedSupportAgentId(null);
    setCurrentRole('reseller');
    setActiveTab('accueil');
    showToast('تم تسجيل الخروج بنجاح 👋', 'info');
  };

  const handleSwitchDashboard = (newRole: DashboardRole) => {
    if (newRole === 'admin') {
      setImpersonatedSellerName(null);
      setImpersonatedSupplierName(null);
      setImpersonatedConfirmerName(null);
      setImpersonatedSupportName(null);
      setImpersonatedSupportAgentId(null);
      setCurrentRole('admin');
      navigate('/admin');
      showToast('تم الانتقال إلى: لوحة الأدمن (Admin HQ)', 'info');
    } else if (newRole === 'support') {
      if (user?.role === 'admin' && !impersonatedSupportName) {
        setImpersonatedSupportName('معاينة وكيل الدعم الفني');
        setImpersonatedSupportAgentId(null);
      }
      setCurrentRole('support');
      navigate('/support');
      showToast('تم الانتقال إلى: لوحة الدعم الفني للمسوقين', 'info');
    } else if (newRole === 'confirmer') {
      if (user?.role === 'admin' && !impersonatedConfirmerName) {
        setImpersonatedConfirmerName('معاينة مؤكد الطلبيات');
      }
      setCurrentRole('confirmer');
      navigate('/confirmer');
      showToast('تم الانتقال إلى: واجهة المؤكد (Confirmer Desk)', 'info');
    } else if (newRole === 'warehouse') {
      if (user?.role === 'admin' && !impersonatedSupplierName) {
        setImpersonatedSupplierName('بائع الأجهزة والإلكترونيات');
      }
      setCurrentRole('warehouse');
      navigate('/warehouse');
      showToast('تم الانتقال إلى: لوحة المورد (Warehouse)', 'info');
    } else if (newRole === 'platform_warehouse') {
      setCurrentRole('platform_warehouse');
      navigate('/warehouse');
      showToast('تم الانتقال إلى: مستودع المنصة الرئيسي', 'info');
    } else {
      setImpersonatedSellerName(null);
      setImpersonatedSupplierName(null);
      setImpersonatedConfirmerName(null);
      setImpersonatedSupportName(null);
      setImpersonatedSupportAgentId(null);
      setCurrentRole('reseller');
      navigate('/dashboard');
      showToast('تم الانتقال إلى: لوحة تحكم المسوق', 'info');
    }
  };

  const isDirectSupportUser = user?.role === 'support' && !impersonatedSupportName;
  const isDirectConfirmerUser = user?.role === 'confirmer' && !impersonatedConfirmerName;
  const canSwitchAll = Boolean(
    !isDirectSupportUser &&
    !isDirectConfirmerUser &&
    (user?.role === 'admin' ||
    user?.email?.includes('admin') ||
    impersonatedSellerName ||
    impersonatedSupplierName ||
    impersonatedConfirmerName ||
    impersonatedSupportName ||
    !user)
  );

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [syncModalProduct, setSyncModalProduct] = useState<Product | null>(null);
  const [shareModalProduct, setShareModalProduct] = useState<Product | null>(null);
  const [isStoresManagerOpen, setIsStoresManagerOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [prefilledOrderProduct, setPrefilledOrderProduct] = useState<Product | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [isGamificationOpen, setIsGamificationOpen] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ id: 't-' + Date.now(), message, type });
  };

  useEffect(() => {
    const handleNotifUpdate = () => {
      const targetRole = currentRole === 'admin' ? 'admin' : 'seller';
      setUnreadNotifCount(getUnreadNotificationsCount(targetRole));
    };
    handleNotifUpdate();
    window.addEventListener('seller_notifications_updated', handleNotifUpdate);
    window.addEventListener('admin_notifications_updated', handleNotifUpdate);
    return () => {
      window.removeEventListener('seller_notifications_updated', handleNotifUpdate);
      window.removeEventListener('admin_notifications_updated', handleNotifUpdate);
    };
  }, [currentRole]);

  useEffect(() => {
    const handleAppToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: 'success' | 'error' | 'info' }>;
      if (customEvent.detail?.message) {
        setTimeout(() => {
          showToast(customEvent.detail.message, customEvent.detail.type || 'success');
        }, 50);
      }
    };
    window.addEventListener('app_toast', handleAppToast);
    return () => window.removeEventListener('app_toast', handleAppToast);
  }, []);

  const handleOrderFromDetail = (product: Product) => {
    setPrefilledOrderProduct(product);
    setIsNewOrderModalOpen(true);
  };

  const handleGenerateAiCopyFromDetail = (product: Product) => {
    setSelectedProduct(null);
    setPrefilledOrderProduct(product);
    setActiveTab('marketing');
    navigate('/dashboard/marketing');
  };

  // =========================================================================
  // ROUTE 1: PUBLIC CUSTOMER SHARE & ORDER PAGE (/p/:productId or /order/:productId)
  // =========================================================================
  const isProductShareRoute = path.startsWith('/p/') || path.startsWith('/order/');
  if (isProductShareRoute) {
    const segments = path.split('/').filter(Boolean);
    const targetProductId = segments[1] || '';
    const allProducts = getStoredProducts();
    const foundProduct = allProducts.find((p) => p.id === targetProductId);

    if (foundProduct) {
      return (
        <div className="w-full h-full min-h-screen relative bg-slate-50 dark:bg-slate-950 overflow-y-auto">
          <CustomerShareOrderView
            product={foundProduct}
            onBackToApp={() => {
              if (user) {
                navigate('/dashboard');
              } else {
                navigate('/');
              }
            }}
            onShowToast={showToast}
          />
          <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
      );
    }

    // Product not found fallback screen
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">المنتج غير متوفر أو الرابط منتهي</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            عذراً، لم نتمكن من العثور على المنتج المطلوب. قد يكون قد نفد المخزون أو تم تحديث الرابط.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 text-white font-black text-xs hover:bg-purple-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى الصفحة الرئيسية</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ROUTE 2: PROTECTED ADMIN HQ (/admin) - RBAC STRICT
  // =========================================================================
  if (path === '/admin') {
    const isAuthorizedAdmin = Boolean(user && (user.role === 'admin' || user.email?.includes('admin')));
    if (!isAuthorizedAdmin) {
      return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950">
          <AccessDeniedScreen
            requiredRoleNameAr="المشرف العام"
            requiredRoleNameFr="Super Admin"
            targetPath="/admin"
          />
          <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
      );
    }
  }

  // =========================================================================
  // ROUTE 3: PROTECTED WAREHOUSE & SUPPLIERS (/warehouse) - RBAC STRICT
  // =========================================================================
  if (path === '/warehouse') {
    const isAuthorizedSupplier = Boolean(
      user && (
        user.role === 'warehouse' ||
        user.role === 'platform_warehouse' ||
        user.role === 'admin' ||
        impersonatedSupplierName
      )
    );
    if (!isAuthorizedSupplier) {
      return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950">
          <AccessDeniedScreen
            requiredRoleNameAr="الموردين والمستودع"
            requiredRoleNameFr="Suppliers & Warehouse"
            targetPath="/warehouse"
          />
          <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
      );
    }
  }

  // =========================================================================
  // ROUTE 4: PROTECTED CALL CENTER CONFIRMERS (/confirmer) - RBAC STRICT
  // =========================================================================
  if (path === '/confirmer') {
    const isAuthorizedConfirmer = Boolean(
      user && (user.role === 'confirmer' || user.role === 'admin' || impersonatedConfirmerName)
    );
    if (!isAuthorizedConfirmer) {
      return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950">
          <AccessDeniedScreen
            requiredRoleNameAr="فريق التأكيد والاتصال"
            requiredRoleNameFr="Call Center Confirmers"
            targetPath="/confirmer"
          />
          <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
      );
    }
  }

  // =========================================================================
  // ROUTE 5: PROTECTED SUPPORT AGENTS (/support) - RBAC STRICT
  // =========================================================================
  if (path === '/support') {
    const isAuthorizedSupport = Boolean(
      user && (user.role === 'support' || user.role === 'admin' || impersonatedSupportName)
    );
    if (!isAuthorizedSupport) {
      return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950">
          <AccessDeniedScreen
            requiredRoleNameAr="وكلاء الدعم الفني"
            requiredRoleNameFr="Customer Support Agents"
            targetPath="/support"
          />
          <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
      );
    }
  }

  // =========================================================================
  // ROUTE 6: PROTECTED RESELLER DASHBOARD (/dashboard and /dashboard/*)
  // =========================================================================
  if (path.startsWith('/dashboard')) {
    if (!user) {
      return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950">
          <AccessDeniedScreen
            requiredRoleNameAr="المسوقين والتجار"
            requiredRoleNameFr="Affiliate Resellers"
            targetPath={path}
          />
          <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
      );
    }
  }

  // =========================================================================
  // PUBLIC SEO ROUTES (Dedicated, Crawlable Pages with Unique Meta & URLs)
  // =========================================================================
  if (path === '/products' || path === '/catalog') {
    return (
      <div className="w-full h-full min-h-screen relative">
        <PublicProductsPage
          onOpenLogin={() => navigate('/login')}
          onOpenRegister={() => navigate('/register')}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  if (path === '/suppliers') {
    return (
      <div className="w-full h-full min-h-screen relative">
        <PublicSuppliersPage
          onOpenLogin={() => navigate('/login')}
          onOpenRegister={() => navigate('/register')}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  if (path === '/resellers') {
    return (
      <div className="w-full h-full min-h-screen relative">
        <PublicResellersPage
          onOpenLogin={() => navigate('/login')}
          onOpenRegister={() => navigate('/register')}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  if (path === '/academy') {
    return (
      <div className="w-full h-full min-h-screen relative">
        <PublicAcademyPage
          onOpenLogin={() => navigate('/login')}
          onOpenRegister={() => navigate('/register')}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  if (path === '/shipping') {
    return (
      <div className="w-full h-full min-h-screen relative">
        <PublicShippingPage
          onOpenLogin={() => navigate('/login')}
          onOpenRegister={() => navigate('/register')}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  if (path === '/faq') {
    return (
      <div className="w-full h-full min-h-screen relative">
        <PublicFaqPage
          onOpenLogin={() => navigate('/login')}
          onOpenRegister={() => navigate('/register')}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  if (path === '/about') {
    return (
      <div className="w-full h-full min-h-screen relative">
        <PublicAboutPage
          onOpenLogin={() => navigate('/login')}
          onOpenRegister={() => navigate('/register')}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  if (path === '/contact') {
    return (
      <div className="w-full h-full min-h-screen relative">
        <PublicContactPage
          onOpenLogin={() => navigate('/login')}
          onOpenRegister={() => navigate('/register')}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  if (path === '/terms') {
    return (
      <div className="w-full h-full min-h-screen relative">
        <PublicTermsPage
          onOpenLogin={() => navigate('/login')}
          onOpenRegister={() => navigate('/register')}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  if (path === '/privacy') {
    return (
      <div className="w-full h-full min-h-screen relative">
        <PublicPrivacyPage
          onOpenLogin={() => navigate('/login')}
          onOpenRegister={() => navigate('/register')}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  if (path === '/login' || path === '/register') {
    return (
      <div className="w-full h-full min-h-screen relative">
        <LandingPage
          initialModal={path === '/login' ? 'login' : 'register'}
          onEnterApp={(role) => {
            if (role === 'admin') {
              navigate('/admin');
            } else if (role === 'warehouse' || role === 'platform_warehouse') {
              navigate('/warehouse');
            } else if (role === 'confirmer') {
              navigate('/confirmer');
            } else if (role === 'support') {
              navigate('/support');
            } else {
              navigate('/dashboard');
            }
          }}
          onShowToast={showToast}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  // =========================================================================
  // ROUTE 7: PUBLIC LANDING PAGE (/) OR UNRECOGNIZED PUBLIC PATH
  // =========================================================================
  if (path === '/' || path === '' || (!user && !path.startsWith('/dashboard') && path !== '/admin' && path !== '/warehouse' && path !== '/confirmer' && path !== '/support')) {
    return (
      <div className="w-full h-full min-h-screen relative">
        <LandingPage
          onEnterApp={(role) => {
            if (role === 'admin') {
              navigate('/admin');
            } else if (role === 'warehouse' || role === 'platform_warehouse') {
              navigate('/warehouse');
            } else if (role === 'confirmer') {
              navigate('/confirmer');
            } else if (role === 'support') {
              navigate('/support');
            } else {
              navigate('/dashboard');
            }
          }}
          onShowToast={showToast}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  // =========================================================================
  // APP DASHBOARDS FRAMEWORK (Admin / Warehouse / Confirmer / Support / Reseller)
  // =========================================================================
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative">
      {/* Instant Push Sale Celebration Alert Banner */}
      <InstantSaleBanner
        onGoToOrders={() => {
          setActiveTab('commandes');
          navigate('/dashboard/commandes');
        }}
        onGoToWallet={() => {
          setActiveTab('wallet');
          navigate('/dashboard/wallet');
        }}
      />

      {/* Top Offline Network Alert Banner */}
      <OfflineBanner />

      {/* App Top Header Bar */}
      <header className="px-3 py-2 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md shadow-2xs gap-2">
        {/* Right Section: Brand & Home / Landing Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt="Nouva Market Logo"
              className="w-8 h-8 object-contain drop-shadow-2xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="hidden xl:block">
              <h1 className="text-xs font-black tracking-tight text-slate-900 dark:text-white leading-none">
                {t('app.title')}
              </h1>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Operating System
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/90 hover:bg-purple-50 dark:bg-slate-800/90 dark:hover:bg-purple-950/60 text-slate-700 hover:text-purple-700 dark:text-slate-300 dark:hover:text-purple-300 font-extrabold text-[11px] border border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800 transition cursor-pointer shadow-2xs"
            title="الانتقال إلى الصفحة الرئيسية / المتجر"
          >
            <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">الرئيسية</span>
          </button>
        </div>

        {/* Center Section: Unified Dashboards Switcher */}
        <div className="flex-1 flex justify-center max-w-2xl px-1">
          <DashboardSwitcher
            currentRole={currentRole}
            onSwitchRole={handleSwitchDashboard}
            canSwitchAll={canSwitchAll}
          />
        </div>

        {/* Left Section: PWA Install, Quick Tools, Notifications, Logout */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton />

          {(currentRole === 'reseller' || currentRole === 'warehouse') && (
            <button
              onClick={() => setIsStoresManagerOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 font-extrabold text-[11px] border border-violet-200 dark:border-violet-800 hidden md:flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              title="إدارة ربط المتاجر (Shopify / YouCan / WooCommerce / WordPress)"
            >
              <Store className="w-3.5 h-3.5" />
              <span>ربط المتاجر</span>
            </button>
          )}

          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="flex p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition relative cursor-pointer"
            title="إشعارات وتنبيهات المسوقين"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center absolute -top-1 -end-1 shadow-2xs border border-white dark:border-slate-900 animate-pulse">
                {unreadNotifCount}
              </span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-900 flex items-center gap-1 transition cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      {/* Admin Impersonation Notice Banner */}
      {currentRole !== 'admin' && impersonatedSellerName && (
        <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 text-white px-3 py-2 text-xs font-bold flex items-center justify-between shadow-md border-b border-purple-500/40">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-200" />
              <span>معاينة الأدمن</span>
            </span>
            <span>
              أنت تتصفح الآن في وضع المعاينة:{' '}
              <strong className="text-amber-300 font-extrabold">{impersonatedSellerName}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              setImpersonatedSellerName(null);
              setCurrentRole('admin');
              navigate('/admin');
            }}
            className="px-3 py-1 rounded-xl bg-white text-purple-950 hover:bg-amber-300 font-black text-[11px] flex items-center gap-1 shadow-xs transition cursor-pointer shrink-0"
          >
            <span>العودة للوحة الأدمن</span>
          </button>
        </div>
      )}

      {currentRole !== 'admin' && impersonatedSupplierName && (
        <div className="bg-gradient-to-r from-amber-800 via-orange-900 to-slate-900 text-white px-3 py-2 text-xs font-bold flex items-center justify-between shadow-md border-b border-amber-500/40">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide flex items-center gap-1">
              <Boxes className="w-3 h-3 text-amber-200" />
              <span>معاينة البائع</span>
            </span>
            <span>
              أنت تتصفح الآن حساب البائع:{' '}
              <strong className="text-amber-300 font-extrabold">{impersonatedSupplierName}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              setImpersonatedSupplierName(null);
              setCurrentRole('admin');
              navigate('/admin');
            }}
            className="px-3 py-1 rounded-xl bg-white text-amber-950 hover:bg-amber-300 font-black text-[11px] flex items-center gap-1 shadow-xs transition cursor-pointer shrink-0"
          >
            <span>العودة للوحة الأدمن</span>
          </button>
        </div>
      )}

      {/* Main Workspaces Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        {/* VIEW 1: ADMIN HQ */}
        {currentRole === 'admin' && (
          <AdminDashboard
            onShowToast={showToast}
            onSwitchToSellerDashboard={(seller) => {
              setImpersonatedSellerName(`${seller.fullName} (${seller.storeName})`);
              setCurrentRole('reseller');
              navigate('/dashboard');
              showToast(`تم الدخول لحساب المسوق: ${seller.fullName || seller.storeName}`, 'info');
            }}
            onImpersonateSupplier={(supplier) => {
              const name = supplier.companyName || supplier.fullName;
              setImpersonatedSupplierName(name);
              const supplierData = {
                id: supplier.id || 'SUP-DEMO',
                fullName: supplier.fullName || name,
                companyName: supplier.companyName || name,
                phone: supplier.phone || '',
                email: supplier.email || '',
                wilaya: supplier.wilaya || '16 - الجزائر',
                activityType: supplier.activityType || 'مصنع / مورد',
                ccpOrRip: supplier.ccpOrRip || '',
                status: supplier.status || 'APPROVED',
              };
              localStorage.setItem('nouva_supplier_profile', JSON.stringify(supplierData));
              setCurrentRole('warehouse');
              navigate('/warehouse');
              showToast(`تم الدخول لحساب البائع: ${name}`, 'info');
            }}
            onSwitchToConfirmerDashboard={(confirmer) => {
              setImpersonatedConfirmerName(confirmer?.fullName || 'مؤكد الطلبيات');
              setCurrentRole('confirmer');
              navigate('/confirmer');
              showToast(`تم الدخول لحساب المؤكد: ${confirmer?.fullName || 'مؤكد الطلبيات'}`, 'info');
            }}
            onSwitchToSupportDashboard={(agent) => {
              setImpersonatedSupportAgentId(agent?.id || null);
              setImpersonatedSupportName(agent?.fullName || 'سارة مراد (الدعم الفني)');
              setCurrentRole('support');
              navigate('/support');
              showToast(`تم الدخول لحساب وكيل الدعم: ${agent?.fullName || 'سارة مراد'}`, 'info');
            }}
          />
        )}

        {/* VIEW 2: WAREHOUSE / SUPPLIER DASHBOARD */}
        {currentRole === 'platform_warehouse' && (
          <WarehouseDashboard onShowToast={showToast} isPlatformWarehouse={true} />
        )}
        {currentRole === 'warehouse' && (
          user?.approvalStatus !== 'APPROVED' && !impersonatedSupplierName ? (
            <PendingSellerScreen
              onLogout={handleLogout}
              onGoToLanding={() => navigate('/')}
            />
          ) : (
            <WarehouseDashboard onShowToast={showToast} isPlatformWarehouse={false} />
          )
        )}

        {/* VIEW 3: CONFIRMER DASHBOARD */}
        {currentRole === 'confirmer' && (
          <ConfirmerDashboard onShowToast={showToast} />
        )}

        {/* VIEW 4: DIRECT SUPPORT AGENT DASHBOARD */}
        {currentRole === 'support' && (
          <SupportDashboard
            onShowToast={showToast}
            onSwitchRole={handleSwitchDashboard}
            impersonatedAgentId={impersonatedSupportAgentId}
            impersonatedAgentName={impersonatedSupportName}
            onClearImpersonation={() => {
              setImpersonatedSupportAgentId(null);
              setImpersonatedSupportName(null);
            }}
          />
        )}

        {/* VIEW 5: RESELLER / MARKETER DASHBOARD */}
        {currentRole === 'reseller' && (
          user?.approvalStatus !== 'APPROVED' && !impersonatedSellerName ? (
            <PendingSellerScreen
              onLogout={handleLogout}
              onGoToLanding={() => navigate('/')}
            />
          ) : (
            <>
              {activeTab === 'accueil' && (
                <AccueilTab
                  onOpenProduct={(p) => setSelectedProduct(p)}
                  onNavigateToCatalog={() => {
                    setActiveTab('produits');
                    navigate('/dashboard/produits');
                  }}
                  onOpenWallet={() => {
                    setActiveTab('wallet');
                    navigate('/dashboard/wallet');
                  }}
                  onOpenGamification={() => setIsGamificationOpen(true)}
                  onGoToOrders={() => {
                    setActiveTab('commandes');
                    navigate('/dashboard/commandes');
                  }}
                  onOpenNotifications={() => setIsNotificationsOpen(true)}
                />
              )}
              {activeTab === 'produits' && (
                <ProduitsTab
                  onOpenProduct={(p) => setSelectedProduct(p)}
                  onOpenNewOrderForProduct={(p) => {
                    setPrefilledOrderProduct(p);
                    setIsNewOrderModalOpen(true);
                  }}
                  onOpenShareModal={(p) => setShareModalProduct(p)}
                  onOpenSyncToStore={(p) => setSyncModalProduct(p)}
                  onOpenStoreManager={() => setIsStoresManagerOpen(true)}
                />
              )}
              {activeTab === 'marketed' && (
                <MarketedProductsTab
                  onOpenProduct={(p) => setSelectedProduct(p)}
                  onOpenNewOrderForProduct={(p) => {
                    setPrefilledOrderProduct(p);
                    setIsNewOrderModalOpen(true);
                  }}
                  onOpenShareModal={(p) => setShareModalProduct(p)}
                  onShowToast={showToast}
                  onNavigateTab={(tab) => {
                    setActiveTab(tab as any);
                    navigate(`/dashboard/${tab}`);
                  }}
                />
              )}
              {activeTab === 'commandes' && <CommandesTab />}
              {activeTab === 'wallet' && <WalletTab onShowToast={showToast} />}
              {activeTab === 'analytics' && <AnalyticsTab />}
              {activeTab === 'marketing' && (
                <MarketingTab
                  initialProduct={prefilledOrderProduct}
                  onShowToast={showToast}
                  onReturnToOrder={(product) => {
                    setPrefilledOrderProduct(product);
                    setIsNewOrderModalOpen(true);
                  }}
                />
              )}
              {activeTab === 'profil' && (
                <ProfilTab
                  onOpenGamification={() => setIsGamificationOpen(true)}
                  onShowToast={showToast}
                  onLogout={handleLogout}
                />
              )}
            </>
          )
        )}
      </main>

      {/* Reseller Bottom Navigation Bar */}
      {currentRole === 'reseller' && user?.approvalStatus !== 'PENDING' && (
        <nav
          aria-label="Navigation principale"
          className="fixed bottom-0 start-0 end-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 flex justify-around items-center px-2 py-1.5 shadow-lg max-w-lg mx-auto rounded-t-3xl md:hidden"
        >
          {[
            { id: 'accueil', label: t('tab.home'), icon: Home },
            { id: 'produits', label: t('tab.products'), icon: Layers },
            { id: 'marketed', label: t('tab.links', 'الروابط'), icon: LinkIcon },
            { id: 'commandes', label: t('tab.orders'), icon: Package, badge: pendingLinkOrdersCount },
            { id: 'wallet', label: t('tab.wallet'), icon: Wallet },
            { id: 'profil', label: t('tab.profile'), icon: User },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            const badgeCount = tab.badge || 0;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  navigate(`/dashboard/${tab.id}`);
                }}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition relative cursor-pointer ${
                  isActive
                    ? 'text-violet-600 dark:text-violet-400 font-extrabold scale-105'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {badgeCount > 0 && (
                    <span className="absolute -top-2 -end-2.5 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black leading-none animate-bounce shadow-md border-2 border-white dark:border-slate-900 flex items-center justify-center min-w-[18px] min-h-[18px]">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Global Modals */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOrderNow={handleOrderFromDetail}
          onGenerateAiCopy={handleGenerateAiCopyFromDetail}
          onShowToast={showToast}
          onOpenSyncToStore={(p) => setSyncModalProduct(p)}
        />
      )}

      {syncModalProduct && (
        <ExternalStoreSyncModal
          product={syncModalProduct}
          onClose={() => setSyncModalProduct(null)}
          onOpenStoreManager={() => setIsStoresManagerOpen(true)}
          onShowToast={showToast}
        />
      )}

      {isStoresManagerOpen && (
        <StoresManagementModal
          onClose={() => setIsStoresManagerOpen(false)}
          onShowToast={showToast}
          onOrdersPulled={(count) => {
            showToast(`🎉 تم سحب ${count} طلبية واردة من المتاجر بنجاح!`, 'success');
          }}
        />
      )}

      {shareModalProduct && (
        <ShareProductModal
          product={shareModalProduct}
          onClose={() => setShareModalProduct(null)}
          onShowToast={showToast}
          onPreviewCustomerView={(product, linkId) => {
            setShareModalProduct(null);
            navigate(`/p/${product.id}${linkId ? `?linkId=${linkId}` : ''}`);
          }}
        />
      )}

      {isNewOrderModalOpen && (
        <NewOrderModal
          initialProduct={prefilledOrderProduct}
          availableProducts={getStoredProducts().filter(
            (p) => p.allowAffiliate !== false && !p.isSupplierExclusive && p.approvalStatus !== 'REJECTED'
          )}
          onClose={() => setIsNewOrderModalOpen(false)}
          onShowToast={showToast}
        />
      )}

      {isNotificationsOpen && (
        <NotificationsModal
          role={currentRole === 'admin' ? 'admin' : 'seller'}
          onClose={() => setIsNotificationsOpen(false)}
        />
      )}

      {isGamificationOpen && (
        <GamificationModal onClose={() => setIsGamificationOpen(false)} />
      )}

      {isDevToolsOpen && (
        <DevToolsDrawer
          onClose={() => setIsDevToolsOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Real-time Direct Support Chat Widget for Reseller (Marketer) */}
      {currentRole === 'reseller' && (user?.approvalStatus === 'APPROVED' || impersonatedSellerName) && (
        <SellerDirectSupportChatWidget partyType="RESELLER" />
      )}

      {/* Real-time Direct Support Chat Widget for Supplier (Warehouse/Vendor) */}
      {currentRole === 'warehouse' && (
        <SellerDirectSupportChatWidget partyType="SUPPLIER" />
      )}

      {/* Real-time Direct Support Inbox Widget for Support Team */}
      {currentRole === 'support' && (
        <SupportAgentInboxWidget />
      )}

      {/* Floating Toast Alerts */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <OrderProvider>
          <CategoryProvider>
            <RouterProvider>
              <MobileDeviceFrame>
                <AppContent />
              </MobileDeviceFrame>
            </RouterProvider>
          </CategoryProvider>
        </OrderProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
