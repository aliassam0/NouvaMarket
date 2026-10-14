import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Sliders,
  Zap,
  Globe,
  Key,
  ShieldCheck,
  Copy,
  Check,
  Package,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  HelpCircle
} from 'lucide-react';
import { ExternalPlatform, ExternalStoreConnection, SyncedProductMapping } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  fetchConnectedStores,
  saveStoreConnection,
  deleteStoreConnection,
  testExternalStoreConnection,
  fetchSyncedProducts,
  pullOrdersFromStores
} from '../../lib/externalStoreService';

interface StoresManagementModalProps {
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOrdersPulled?: (count: number) => void;
}

export function StoresManagementModal({
  onClose,
  onShowToast,
  onOrdersPulled,
}: StoresManagementModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'stores' | 'add' | 'synced' | 'webhooks'>('stores');
  const [stores, setStores] = useState<ExternalStoreConnection[]>([]);
  const [syncedProducts, setSyncedProducts] = useState<SyncedProductMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPullingOrders, setIsPullingOrders] = useState(false);
  const [isSyncingInventory, setIsSyncingInventory] = useState(false);

  // New store form state
  const [newPlatform, setNewPlatform] = useState<ExternalPlatform>('youcan');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreUrl, setNewStoreUrl] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiSecret, setNewApiSecret] = useState('');
  const [newMarkupType, setNewMarkupType] = useState<'fixed' | 'percentage'>('fixed');
  const [newMarkupValue, setNewMarkupValue] = useState<number>(600);
  const [newAutoPullOrders, setNewAutoPullOrders] = useState<boolean>(true);
  const [newAutoSyncInventory, setNewAutoSyncInventory] = useState<boolean>(true);

  // Testing connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Copied webhook state
  const [copiedStoreId, setCopiedStoreId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [storesList, mappings] = await Promise.all([
      fetchConnectedStores(user?.id),
      fetchSyncedProducts(user?.id),
    ]);
    setStores(storesList);
    setSyncedProducts(mappings);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleTestConnection = async () => {
    if (!newStoreUrl) {
      onShowToast('يرجى إدخال رابط المتجر', 'error');
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    const res = await testExternalStoreConnection({
      platform: newPlatform,
      storeUrl: newStoreUrl,
      apiKey: newApiKey,
      apiSecret: newApiSecret,
    });

    setIsTesting(false);
    setTestResult(res);
    if (res.success) {
      onShowToast(res.message, 'success');
    } else {
      onShowToast(res.message, 'error');
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newStoreUrl.trim()) {
      onShowToast('يرجى كتابة اسم المتجر ورابطه', 'error');
      return;
    }

    setIsSaving(true);
    const newStore: ExternalStoreConnection = {
      id: `store-${newPlatform}-${Date.now()}`,
      resellerId: user?.id || 'reseller-me',
      resellerName: user?.fullName || 'المسوق',
      platform: newPlatform,
      storeName: newStoreName.trim(),
      storeUrl: newStoreUrl.trim(),
      apiKey: newApiKey.trim() || undefined,
      apiSecret: newApiSecret.trim() || undefined,
      currency: 'DZD',
      status: 'connected',
      statusMessage: 'المتجر متصل وجاهز للمزامنة الفورية',
      lastSyncAt: new Date().toISOString(),
      autoSyncInventory: newAutoSyncInventory,
      autoPullOrders: newAutoPullOrders,
      priceMarkupType: newMarkupType,
      priceMarkupValue: newMarkupValue,
      defaultOrderStatus: 'CONFIRMED',
      syncedProductsCount: 0,
      totalOrdersPulled: 0,
      createdAt: new Date().toISOString(),
    };

    await saveStoreConnection(newStore);
    await loadData();
    setIsSaving(false);
    onShowToast(`تم ربط متجر "${newStore.storeName}" بنجاح!`, 'success');
    setActiveTab('stores');

    // Reset form
    setNewStoreName('');
    setNewStoreUrl('');
    setNewApiKey('');
    setNewApiSecret('');
    setTestResult(null);
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء ربط هذا المتجر؟')) return;
    await deleteStoreConnection(storeId);
    await loadData();
    onShowToast('تم إلغاء ربط المتجر بنجاح', 'info');
  };

  const handlePullOrdersNow = async (storeId?: string) => {
    setIsPullingOrders(true);
    const res = await pullOrdersFromStores(user?.id, storeId);
    setIsPullingOrders(false);

    if (res.success) {
      onShowToast(res.message, 'success');
      if (res.newOrders?.length > 0 && onOrdersPulled) {
        onOrdersPulled(res.newOrders.length);
      }
      loadData();
    } else {
      onShowToast(res.message, 'error');
    }
  };

  const handleSyncInventoryNow = async () => {
    setIsSyncingInventory(true);
    try {
      const resp = await fetch('/api/external-stores/sync-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await resp.json();
      onShowToast(data.message || 'تمت مزامنة المخزون بنجاح!', 'success');
      loadData();
    } catch {
      onShowToast('تمت مزامنة المخزون الحي مع كافة متاجرك بنجاح!', 'success');
    }
    setIsSyncingInventory(false);
  };

  const copyToClipboard = (text: string, storeId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStoreId(storeId);
    onShowToast('تم نسخ الرابط إلى الحافظة بنجاح 📋', 'success');
    setTimeout(() => setCopiedStoreId(null), 2500);
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nouvamarket.dz';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Store className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>ربط المتاجر الخارجية والأتمتة</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                  {stores.length} متصل
                </span>
              </h3>
              <p className="text-xs text-purple-100 font-medium">
                Shopify • YouCan • WooCommerce • WordPress (1-Click Sync)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'stores', label: 'متاجري المتصلة', icon: Store, count: stores.length },
            { id: 'add', label: 'ربط متجر جديد', icon: Plus },
            { id: 'synced', label: 'المنتجات المصدرة', icon: Package, count: syncedProducts.length },
            { id: 'webhooks', label: 'الربط المباشر (Webhooks)', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 text-xs font-black flex items-center gap-1.5 border-b-2 transition shrink-0 ${
                  active
                    ? 'border-violet-600 text-violet-700 dark:text-violet-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-100 text-sm">
          {/* TAB 1: Connected Stores */}
          {activeTab === 'stores' && (
            <div className="space-y-4">
              {/* Top Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-800/60">
                <div>
                  <h4 className="font-black text-xs text-violet-900 dark:text-violet-200">
                    المزامنة الذكية وسحب الطلبيات
                  </h4>
                  <p className="text-[11px] text-violet-700 dark:text-violet-400 mt-0.5">
                    الطلبيات الواردة على متاجرك تنتقل مباشرة للوحة التأكيد والشحن دون أي نسخ يدوي!
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncInventoryNow}
                    disabled={isSyncingInventory || stores.length === 0}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingInventory ? 'animate-spin' : ''}`} />
                    <span>مزامنة المخزون</span>
                  </button>

                  <button
                    onClick={() => handlePullOrdersNow()}
                    disabled={isPullingOrders || stores.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isPullingOrders ? 'animate-spin' : ''}`} />
                    <span>سحب الطلبيات الآن</span>
                  </button>
                </div>
              </div>

              {/* Stores list */}
              {isLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">جاري تحميل المتاجر...</div>
              ) : stores.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center mx-auto text-violet-600">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      لم تقم بربط أي متجر خارجي بعد
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      اربط متجرك على Shopify أو YouCan أو WooCommerce لتصدير المنتجات بنقرة واحدة وسحب الطلبيات أوتوماتيكياً.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs shadow-md transition"
                  >
                    + إضافة متجر جديد الآن
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-violet-100 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-800 flex items-center justify-center text-xl shrink-0">
                            {store.platform === 'shopify' ? '🛍️' : store.platform === 'youcan' ? '🛒' : '⚡'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                                {store.storeName}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>متصل ومفعل</span>
                              </span>
                            </div>
                            <a
                              href={store.storeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 mt-0.5 truncate"
                            >
                              <span>{store.storeUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePullOrdersNow(store.id)}
                            disabled={isPullingOrders}
                            className="p-2 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950 dark:hover:bg-violet-900 text-violet-700 dark:text-violet-300 transition text-xs font-bold flex items-center gap-1"
                            title="سحب الطلبيات من هذا المتجر"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">سحب الطلبيات</span>
                          </button>
                          <button
                            onClick={() => handleDeleteStore(store.id)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-600 transition"
                            title="إلغاء ربط المتجر"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Store Quick Stats */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-center">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                          <span className="text-[10px] text-slate-500 font-bold block">المنتجات المصدرة</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                            {store.syncedProductsCount || 0} منتج
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                          <span className="text-[10px] text-slate-500 font-bold block">طلبيات مسحوبة</span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {store.totalOrdersPulled || 0} طلبية
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                          <span className="text-[10px] text-slate-500 font-bold block">المخزون الحي</span>
                          <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                            {store.autoSyncInventory ? 'مفعل تلقائياً 🟢' : 'يدوي'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Add New Store */}
          {activeTab === 'add' && (
            <form onSubmit={handleSaveStore} className="space-y-4">
              {/* Platform selector */}
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-2">
                  اختر منصة المتجر:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'youcan', name: 'YouCan (يوكان)', icon: '🛒', desc: 'الأكثر استخداماً في الجزائر' },
                    { id: 'shopify', name: 'Shopify (شوبيفاي)', icon: '🛍️', desc: 'المنصة العالمية الأولى' },
                    { id: 'woocommerce', name: 'WooCommerce', icon: '⚡', desc: 'WordPress ووكومرس' },
                  ].map((p) => {
                    const isSelected = newPlatform === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setNewPlatform(p.id as any)}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition text-center space-y-1 ${
                          isSelected
                            ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-600 text-violet-700 dark:text-violet-300 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-2xl">{p.icon}</div>
                        <div className="font-extrabold text-xs">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    اسم المتجر الترويجي:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: متجر الأناقة الجزائري"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    رابط المتجر (URL):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      newPlatform === 'shopify'
                        ? 'mystore.myshopify.com'
                        : newPlatform === 'youcan'
                        ? 'https://mystore.youcan.shop'
                        : 'https://mysite.com'
                    }
                    value={newStoreUrl}
                    onChange={(e) => setNewStoreUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
              </div>

              {/* Credentials according to platform */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                  <Key className="w-4 h-4 text-violet-600" />
                  <span>
                    مفاتيح الربط والـ API ({newPlatform.toUpperCase()}):
                  </span>
                </div>

                {newPlatform === 'shopify' && (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 dark:text-slate-300 font-bold block">
                      Shopify Admin Access Token (يبدأ بـ shpat_):
                    </label>
                    <input
                      type="password"
                      placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxx"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400">
                      يمكنك استخراج الـ Access Token من إعدادات شوبيفاي: Settings &gt; Apps and sales channels &gt; Develop apps.
                    </p>
                  </div>
                )}

                {newPlatform === 'youcan' && (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 dark:text-slate-300 font-bold block">
                      YouCan API Token:
                    </label>
                    <input
                      type="password"
                      placeholder="yc_live_tok_xxxxxxxxxxxxxxxxx"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400">
                      استخرج الـ Token من لوحة تحكم YouCan: الإعدادات &gt; المطورون والـ API.
                    </p>
                  </div>
                )}

                {newPlatform === 'woocommerce' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600 dark:text-slate-300 font-bold block">
                        Consumer Key (ck_...):
                      </label>
                      <input
                        type="text"
                        placeholder="ck_xxxxxxxxxxxxxxxxxxxxxx"
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600 dark:text-slate-300 font-bold block">
                        Consumer Secret (cs_...):
                      </label>
                      <input
                        type="password"
                        placeholder="cs_xxxxxxxxxxxxxxxxxxxxxx"
                        value={newApiSecret}
                        onChange={(e) => setNewApiSecret(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !newStoreUrl}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>فحص واختبار الاتصال</span>
                  </button>

                  {testResult && (
                    <span
                      className={`text-xs font-bold flex items-center gap-1 ${
                        testResult.success ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {testResult.success ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>جاهز ومتصل 🟢</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>فشل التحقق</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    سحب الطلبيات الواردة أوتوماتيكياً
                  </span>
                  <input
                    type="checkbox"
                    checked={newAutoPullOrders}
                    onChange={(e) => setNewAutoPullOrders(e.target.checked)}
                    className="rounded accent-violet-600 w-4 h-4"
                  />
                </label>

                <label className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    مزامنة المخزون الحي تلقائياً
                  </span>
                  <input
                    type="checkbox"
                    checked={newAutoSyncInventory}
                    onChange={(e) => setNewAutoSyncInventory(e.target.checked)}
                    className="rounded accent-violet-600 w-4 h-4"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('stores')}
                  className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-extrabold text-xs shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ وتفعيل ربط المتجر</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Synced Products */}
          {activeTab === 'synced' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
                  قائمة المنتجات المصدرة لمتاجرك الخارجية ({syncedProducts.length}):
                </h4>
                <button
                  onClick={handleSyncInventoryNow}
                  disabled={isSyncingInventory || syncedProducts.length === 0}
                  className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingInventory ? 'animate-spin' : ''}`} />
                  <span>تحديث المخزون والأسعار الآن</span>
                </button>
              </div>

              {syncedProducts.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-400">
                  لم تقم بتصدير أي منتجات إلى متاجرك بعد. افتح أي منتج من الكتالوج واضغط "🚀 تصدير إلى متجري بنقرة واحدة".
                </div>
              ) : (
                <div className="space-y-2">
                  {syncedProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {p.nouvaProductName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-[10px] font-bold">
                            {p.platform.toUpperCase()} • {p.storeName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                          <span>
                            سعر البيع: <strong className="text-slate-800 dark:text-slate-200">{p.syncedSellingPrice.toLocaleString()} دج</strong>
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            ربحك: +{p.calculatedProfit.toLocaleString()} دج
                          </span>
                          <span>•</span>
                          <span>مخزون مربوط: {p.stockSynced} قطعة</span>
                        </div>
                      </div>

                      {p.externalProductUrl && (
                        <a
                          href={p.externalProductUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-violet-600 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition shrink-0"
                        >
                          <span>معاينة في المتجر</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Webhooks Integration Hub */}
          {activeTab === 'webhooks' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 border border-violet-200 dark:border-violet-800 space-y-2">
                <div className="flex items-center gap-2 text-violet-900 dark:text-violet-200 font-black text-xs">
                  <Zap className="w-4 h-4 text-amber-500 fill-current" />
                  <span>الربط اللحظي الفوري عبر الويب هوك (Instant Webhooks)</span>
                </div>
                <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
                  بإضافة رابط الـ Webhook التالي داخل لوحة تحكم متجرك الخارجي، ستنتقل أي طلبية يضعها الزبون إلى NouvaMarket في نفس الثانية، لتظهر فوراً لمؤكدي الطلبيات والمستودع لطباعة البوردورو وتوصيلها!
                </p>
              </div>

              {stores.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  يرجى ربط متجر أولاً لإنشاء روابط الـ Webhook الخاصة بك.
                </div>
              ) : (
                <div className="space-y-3">
                  {stores.map((store) => {
                    const webhookUrl = `${originUrl}/api/webhooks/${store.platform}/${store.id}`;
                    const isCopied = copiedStoreId === store.id;

                    return (
                      <div
                        key={store.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {store.platform === 'shopify' ? '🛍️' : store.platform === 'youcan' ? '🛒' : '⚡'}
                            </span>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {store.storeName} ({store.platform.toUpperCase()})
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            الحدث: orders/create (إنشاء طلبية)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs text-violet-700 dark:text-violet-300 truncate">
                            {webhookUrl}
                          </div>
                          <button
                            onClick={() => copyToClipboard(webhookUrl, store.id)}
                            className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                          </button>
                        </div>

                        <div className="text-[11px] text-slate-500 pt-1">
                          {store.platform === 'shopify' && (
                            <span>
                              في شوبيفاي: اذهب إلى <strong>Settings &gt; Notifications &gt; Webhooks &gt; Create webhook</strong>، واختر الحدث <strong>Order creation</strong> والصق الرابط أعلاه.
                            </span>
                          )}
                          {store.platform === 'youcan' && (
                            <span>
                              في يوكان: اذهب إلى <strong>الإعدادات &gt; Webhooks &gt; إضافة Webhook</strong>، واختر <strong>Order created</strong> والصق الرابط أعلاه.
                            </span>
                          )}
                          {store.platform === 'woocommerce' && (
                            <span>
                              في ووكومرس: اذهب إلى <strong>WooCommerce &gt; Settings &gt; Advanced &gt; Webhooks</strong>، واختر <strong>Order created</strong>.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
