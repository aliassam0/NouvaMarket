import React, { useState, useEffect } from 'react';
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
  Wand2,
  LogOut,
} from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider, useOrders } from './context/OrderContext';
import { CategoryProvider } from './context/CategoryContext';
import { MobileDeviceFrame } from './components/ui/MobileDeviceFrame';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { Toast, ToastMessage } from './components/ui/Toast';

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
import { LandingPage } from './components/landing/LandingPage';
import { ShareProductModal } from './components/tabs/ShareProductModal';
import { CustomerShareOrderView } from './components/tabs/CustomerShareOrderView';
import { MOCK_PRODUCTS, getStoredProducts } from './data/mockProducts';
import { Product, ProductVariant } from './types';

type TabType = 'accueil' | 'produits' | 'commandes' | 'wallet' | 'analytics' | 'marketing' | 'profil';
type RoleType = 'reseller' | 'admin' | 'warehouse';
type ViewMode = 'landing' | 'app';

function AppContent() {
  const { t, language, isRtl } = useLanguage();
  const { user, logout } = useAuth();
  const { pendingLinkOrdersCount } = useOrders();

  const [viewMode, setViewMode] = useState<ViewMode>(user ? 'app' : 'landing');
  const [currentRole, setCurrentRole] = useState<RoleType>((user?.role as RoleType) || 'reseller');
  const [activeTab, setActiveTab] = useState<TabType>('accueil');
  const [impersonatedSellerName, setImpersonatedSellerName] = useState<string | null>(null);
  const [impersonatedSupplierName, setImpersonatedSupplierName] = useState<string | null>(null);

  const handleImpersonateSupplier = (supplier: any) => {
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
    showToast(`تم الدخول لحساب المورد: ${name}`, 'info');
  };

  useEffect(() => {
    if (user) {
      setViewMode('app');
      if (user.role) {
        setCurrentRole(user.role as RoleType);
      }
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    setViewMode('landing');
    setImpersonatedSellerName(null);
    setImpersonatedSupplierName(null);
    setCurrentRole('reseller');
    setActiveTab('accueil');
    showToast('تم تسجيل الخروج بنجاح 👋', 'info');
  };

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [shareModalProduct, setShareModalProduct] = useState<Product | null>(null);
  const [customerSharedProduct, setCustomerSharedProduct] = useState<Product | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [prefilledOrderProduct, setPrefilledOrderProduct] = useState<Product | null>(null);

  // Check URL query param or hash for ?share=productId
  React.useEffect(() => {
    const checkShareUrl = () => {
      const searchParams = new URLSearchParams(window.location.search);
      let shareId = searchParams.get('share');
      if (!shareId && window.location.hash.includes('share=')) {
        const hashMatch = window.location.hash.match(/share=([^&]+)/);
        if (hashMatch) shareId = hashMatch[1];
      }

      if (shareId) {
        const allProducts = getStoredProducts();
        const found = allProducts.find((p) => p.id === shareId);
        if (found) {
          setCustomerSharedProduct(found);
        }
      }
    };

    checkShareUrl();
    window.addEventListener('popstate', checkShareUrl);
    window.addEventListener('products_updated', checkShareUrl);
    return () => {
      window.removeEventListener('popstate', checkShareUrl);
      window.removeEventListener('products_updated', checkShareUrl);
    };
  }, []);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

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

  const [isGamificationOpen, setIsGamificationOpen] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ id: 't-' + Date.now(), message, type });
  };

  useEffect(() => {
    const handleAppToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: 'success' | 'error' | 'info' }>;
      if (customEvent.detail?.message) {
        setTimeout(() => {
          showToast(customEvent.detail.message, customEvent.detail.type || 'success');
        }, 0);
      }
    };
    window.addEventListener('app-toast', handleAppToast);
    return () => window.removeEventListener('app-toast', handleAppToast);
  }, []);

  const handleOpenNewOrder = (product?: Product) => {
    if (product) setPrefilledOrderProduct(product);
    else setPrefilledOrderProduct(null);
    setIsNewOrderModalOpen(true);
  };

  const handleOrderFromDetail = (product: Product, variant: ProductVariant, customSellingPrice: number) => {
    setPrefilledOrderProduct(product);
    setIsNewOrderModalOpen(true);
  };

  const handleGenerateAiCopyFromDetail = (product: Product) => {
    setSelectedProduct(null);
    setPrefilledOrderProduct(product);
    setActiveTab('marketing');
  };

  if (customerSharedProduct) {
    return (
      <div className="w-full h-full min-h-screen relative bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        <CustomerShareOrderView
          product={customerSharedProduct}
          onBackToApp={() => {
            setCustomerSharedProduct(null);
            const url = new URL(window.location.href);
            url.searchParams.delete('share');
            window.history.replaceState({}, '', url.pathname + url.search);
          }}
          onShowToast={showToast}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  if (viewMode === 'landing') {
    return (
      <div className="w-full h-full min-h-screen relative">
        <LandingPage
          onEnterApp={(role) => {
            if (role === 'admin' || role === 'warehouse' || role === 'reseller') {
              setCurrentRole(role);
            } else {
              setCurrentRole('reseller');
            }
            setViewMode('app');
          }}
          onShowToast={showToast}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative">
      {/* Top Offline Network Alert Banner */}
      <OfflineBanner />

      {/* App Top Header Bar */}
      <header className="px-3 py-2.5 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md shadow-xs gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('landing')}
            className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition"
            title="الرجوع إلى الصفحة الرئيسية"
          >
            <span>🌐 الرئيسية</span>
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black text-xs shadow-md shrink-0">
              KM
            </div>
            <div>
              <h1 className="text-xs font-black tracking-tight text-slate-900 dark:text-white leading-none">
                {t('app.title')}
              </h1>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Operating System
              </span>
            </div>
          </div>
        </div>

        {/* Active Role Status Badge (Secured - isolated per user login) */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold">
          {currentRole === 'admin' && (
            <span className="text-indigo-700 dark:text-indigo-300 font-black flex items-center gap-1">
              🛠️ لوحة الأدمن (Admin)
            </span>
          )}
          {currentRole === 'warehouse' && (
            <span className="text-amber-700 dark:text-amber-300 font-black flex items-center gap-1">
              🏭 المستودع والمورد
            </span>
          )}
          {currentRole === 'reseller' && (
            <span className="text-emerald-700 dark:text-emerald-300 font-black flex items-center gap-1">
              🛍️ لوحة البائع
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="flex p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition relative cursor-pointer"
            title="إشعارات وتنبيهات البائعين"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center absolute -top-1 -end-1 shadow-xs border border-white dark:border-slate-900 animate-pulse">
                {unreadNotifCount}
              </span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-900 flex items-center gap-1 transition cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      {/* Admin Impersonation Notice Banner */}
      {currentRole !== 'admin' && impersonatedSellerName && (
        <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-violet-800 text-white px-3 py-2 text-xs font-bold flex items-center justify-between shadow-md border-b border-indigo-500/50">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide">
              👁️ معاينة الأدمن
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
            }}
            className="px-3 py-1 rounded-xl bg-white text-indigo-950 hover:bg-amber-300 font-black text-[11px] flex items-center gap-1 shadow-sm transition cursor-pointer shrink-0"
          >
            <span>العودة للأدمن 🛠️</span>
          </button>
        </div>
      )}

      {currentRole !== 'admin' && impersonatedSupplierName && (
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white px-3 py-2 text-xs font-bold flex items-center justify-between shadow-md border-b border-indigo-500/50">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide">
              🏭 معاينة الأدمن للمورد
            </span>
            <span>
              أنت تتصفح الآن حساب المورد:{' '}
              <strong className="text-amber-300 font-extrabold">{impersonatedSupplierName}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              setImpersonatedSupplierName(null);
              setCurrentRole('admin');
            }}
            className="px-3 py-1 rounded-xl bg-white text-indigo-950 hover:bg-amber-300 font-black text-[11px] flex items-center gap-1 shadow-sm transition cursor-pointer shrink-0"
          >
            <span>العودة للأدمن 🛠️</span>
          </button>
        </div>
      )}

      {/* Main View rendering based on currentRole */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {currentRole === 'admin' && (
          <AdminDashboard
            onShowToast={showToast}
            onSwitchToSellerDashboard={(seller) => {
              setImpersonatedSellerName(`${seller.fullName} (${seller.storeName})`);
              setCurrentRole('reseller');
              setActiveTab('accueil');
            }}
            onImpersonateSupplier={handleImpersonateSupplier}
          />
        )}

        {currentRole === 'warehouse' && (
          user?.approvalStatus !== 'APPROVED' && !impersonatedSupplierName ? (
            <PendingSellerScreen
              onLogout={handleLogout}
              onGoToLanding={() => setViewMode('landing')}
            />
          ) : (
            <WarehouseDashboard onShowToast={showToast} />
          )
        )}

        {currentRole === 'reseller' && (
          user?.approvalStatus !== 'APPROVED' && !impersonatedSellerName ? (
            <PendingSellerScreen
              onLogout={handleLogout}
              onGoToLanding={() => setViewMode('landing')}
            />
          ) : (
            <>
              {activeTab === 'accueil' && (
              <AccueilTab
                onOpenProduct={(p) => setSelectedProduct(p)}
                onNavigateToCatalog={() => setActiveTab('produits')}
                onOpenWallet={() => setActiveTab('wallet')}
                onOpenGamification={() => setIsGamificationOpen(true)}
                onGoToOrders={() => setActiveTab('commandes')}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
              />
            )}

            {activeTab === 'produits' && (
              <ProduitsTab
                onOpenProduct={(p) => setSelectedProduct(p)}
                onOpenNewOrderForProduct={(p) => handleOpenNewOrder(p)}
                onOpenShareModal={(p) => setShareModalProduct(p)}
              />
            )}

            {activeTab === 'commandes' && <CommandesTab />}

            {activeTab === 'wallet' && <WalletTab onShowToast={showToast} />}

            {activeTab === 'analytics' && <AnalyticsTab />}

            {activeTab === 'marketing' && (
              <MarketingTab
                initialProduct={prefilledOrderProduct}
                onShowToast={showToast}
                onReturnToOrder={(product) => handleOpenNewOrder(product)}
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

      {/* Reseller Floating CTA & Mobile Navigation Bar */}
      {currentRole === 'reseller' && (user?.approvalStatus === 'APPROVED' || impersonatedSellerName) && (
        <>
          <button
            onClick={() => handleOpenNewOrder()}
            className="fixed bottom-20 end-5 z-30 p-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold shadow-2xl flex items-center gap-2 border-2 border-white/20 transition duration-200"
            title="إنشاء طلبية جديدة"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span className="hidden sm:inline text-xs">طلب جديد</span>
          </button>

          <nav className="px-2 py-2 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-around sticky bottom-0 z-30 backdrop-blur-md shadow-lg">
            {[
              { id: 'accueil', label: t('tab.home'), icon: Home },
              { id: 'produits', label: t('tab.products'), icon: Layers },
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
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition relative ${
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
        </>
      )}

      {/* Modals */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOrderNow={handleOrderFromDetail}
          onGenerateAiCopy={handleGenerateAiCopyFromDetail}
          onShowToast={showToast}
        />
      )}

      {shareModalProduct && (
        <ShareProductModal
          product={shareModalProduct}
          onClose={() => setShareModalProduct(null)}
          onShowToast={showToast}
          onPreviewCustomerView={(product) => {
            setShareModalProduct(null);
            setCustomerSharedProduct(product);
            const url = new URL(window.location.href);
            url.searchParams.set('share', product.id);
            window.history.pushState({}, '', url.toString());
          }}
        />
      )}

      {isNewOrderModalOpen && (
        <NewOrderModal
          initialProduct={prefilledOrderProduct}
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
            <MobileDeviceFrame>
              <AppContent />
            </MobileDeviceFrame>
          </CategoryProvider>
        </OrderProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
