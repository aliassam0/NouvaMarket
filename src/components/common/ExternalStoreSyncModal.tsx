import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Store,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Plus,
  Sliders,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import { Product, ExternalStoreConnection, SyncedProductMapping, ProductExportOptions } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  fetchConnectedStores,
  exportProductToExternalStores,
  fetchSyncedProducts,
  getLocalStoredStores
} from '../../lib/externalStoreService';
import { MoneyText } from '../ui/MoneyText';

interface ExternalStoreSyncModalProps {
  product: Product;
  onClose: () => void;
  onOpenStoreManager?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function ExternalStoreSyncModal({
  product,
  onClose,
  onOpenStoreManager,
  onShowToast,
}: ExternalStoreSyncModalProps) {
  const { user } = useAuth();
  const [stores, setStores] = useState<ExternalStoreConnection[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [retailPrice, setRetailPrice] = useState<number>(
    product.suggestedSellingPrice || product.wholesalePrice + 600
  );
  const [syncInventory, setSyncInventory] = useState(true);
  const [includeVariants, setIncludeVariants] = useState(true);
  const [includeDescriptionImages, setIncludeDescriptionImages] = useState(true);
  const [productStatus, setProductStatus] = useState<'active' | 'draft'>('active');

  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMappings, setExportSuccessMappings] = useState<SyncedProductMapping[] | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoadingStores(true);
      const list = await fetchConnectedStores(user?.id);
      setStores(list);
      if (list.length > 0) {
        setSelectedStoreIds([list[0].id]);
      }
      setIsLoadingStores(false);
    }
    load();
  }, [user]);

  const wholesale = Number(product.wholesalePrice) || 0;
  const unitProfit = Math.max(0, retailPrice - wholesale);
  const profitMarginPercent = retailPrice > 0 ? Math.round((unitProfit / retailPrice) * 100) : 0;
  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stockCount || 0), 0) || 0;

  const toggleStore = (storeId: string) => {
    if (selectedStoreIds.includes(storeId)) {
      if (selectedStoreIds.length === 1) return; // keep at least one
      setSelectedStoreIds(selectedStoreIds.filter((id) => id !== storeId));
    } else {
      setSelectedStoreIds([...selectedStoreIds, storeId]);
    }
  };

  const handleExport = async () => {
    if (selectedStoreIds.length === 0) {
      onShowToast('يرجى تحديد متجر واحد على الأقل', 'error');
      return;
    }

    if (retailPrice < wholesale) {
      onShowToast('سعر البيع لا يمكن أن يكون أقل من سعر الجملة', 'error');
      return;
    }

    setIsExporting(true);

    const options: ProductExportOptions = {
      storeIds: selectedStoreIds,
      sellingPrice: retailPrice,
      includeVariants,
      includeDescriptionImages,
      includeFeatures: true,
      syncInventory,
      productStatus,
    };

    const res = await exportProductToExternalStores(
      product,
      options,
      user ? { id: user.id, fullName: user.fullName } : undefined
    );

    setIsExporting(false);

    if (res.success && res.syncedMappings.length > 0) {
      setExportSuccessMappings(res.syncedMappings);
      onShowToast(
        `🎉 تم تصدير المنتج بنجاح إلى ${res.syncedMappings.length} متجر خارجي!`,
        'success'
      );
    } else {
      onShowToast(res.errors[0] || 'فشل التصدير إلى المتجر الخارجي', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-1.5">
                <span>تصدير إلى متجري بنقرة واحدة</span>
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-bold">1-Click Sync</span>
              </h3>
              <p className="text-xs text-purple-100 font-medium">
                Shopify • YouCan • WooCommerce • WordPress
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100 text-sm">
          {exportSuccessMappings ? (
            /* Success View */
            <div className="space-y-5 py-2">
              <div className="text-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-emerald-800 dark:text-emerald-300">
                  تم التصدير والمزامنة بنجاح!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 max-w-md mx-auto">
                  تم إرسال صور المنتج، المواصفات، الأحجام والألوان، والمخزون الحي ({totalStock} قطعة) إلى متاجرك. أي طلبية تأتي على متجرك ستُسحب فوراً وتظهر في لوحة التأكيد والشحن!
                </p>
              </div>

              {/* Stores export list with links */}
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400">
                  روابط المنتجات في متاجرك الخارجية:
                </label>
                {exportSuccessMappings.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center font-bold text-violet-700 dark:text-violet-300 text-xs shrink-0">
                        {m.platform === 'shopify' ? '🛍️' : m.platform === 'youcan' ? '🛒' : '⚡'}
                      </div>
                      <div className="truncate">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {m.storeName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            سعر البيع: {m.syncedSellingPrice.toLocaleString()} دج
                          </span>
                          <span>•</span>
                          <span>ربحك: +{m.calculatedProfit.toLocaleString()} دج</span>
                        </div>
                      </div>
                    </div>

                    {m.externalProductUrl && (
                      <a
                        href={m.externalProductUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition shadow-sm"
                      >
                        <span>معاينة في المتجر</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition shadow-md"
                >
                  إتمام وإغلاق النافذة
                </button>
              </div>
            </div>
          ) : (
            /* Configure Export View */
            <>
              {/* Product mini header */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5">
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4'}
                  alt={product.nameAr}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {product.nameAr}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span>
                      سعر الجملة: <strong className="text-slate-800 dark:text-slate-200">{wholesale.toLocaleString()} دج</strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      مخزون حي: {totalStock} قطعة
                    </span>
                    <span>•</span>
                    <span>{product.variants?.length || 1} خيارات ومتغيرات</span>
                  </div>
                </div>
              </div>

              {/* 1. Target Stores Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-violet-600" />
                    <span>اختر المتاجر المستهدفة للتصدير:</span>
                  </label>
                  {onOpenStoreManager && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenStoreManager();
                      }}
                      className="text-[11px] font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ربط متجر جديد</span>
                    </button>
                  )}
                </div>

                {isLoadingStores ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-400">
                    جاري تحميل المتاجر المتصلة...
                  </div>
                ) : stores.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      لم تقم بربط أي متجر خارجي بعد (Shopify / YouCan / WooCommerce)
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenStoreManager) onOpenStoreManager();
                      }}
                      className="px-4 py-2 rounded-xl bg-violet-600 text-white font-extrabold text-xs shadow-sm hover:bg-violet-700"
                    >
                      ربط متجري الآن
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {stores.map((store) => {
                      const isSelected = selectedStoreIds.includes(store.id);
                      return (
                        <div
                          key={store.id}
                          onClick={() => toggleStore(store.id)}
                          className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-violet-50/80 dark:bg-violet-950/40 border-violet-500 dark:border-violet-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/60 flex items-center justify-center font-bold text-sm shrink-0">
                              {store.platform === 'shopify' ? '🛍️' : store.platform === 'youcan' ? '🛒' : '⚡'}
                            </div>
                            <div className="truncate">
                              <div className="font-black text-xs text-slate-900 dark:text-white truncate">
                                {store.storeName}
                              </div>
                              <div className="text-[10px] text-slate-500 capitalize">
                                {store.platform} • {store.currency}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                              isSelected
                                ? 'bg-violet-600 border-violet-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Retail Pricing & Live Margin Calculator */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-800/60 dark:to-purple-950/20 border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span>سعر البيع على متجرك (دج):</span>
                  </label>
                  <span className="text-[11px] font-bold text-slate-500">
                    المقترح من المنصة: {product.suggestedSellingPrice?.toLocaleString() || (wholesale + 600).toLocaleString()} دج
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(Math.max(0, Number(e.target.value)))}
                      className="w-full ps-3.5 pe-12 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                    <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      دج
                    </span>
                  </div>

                  {/* Quick price presets */}
                  <div className="flex items-center gap-1">
                    {[500, 800, 1200].map((markup) => (
                      <button
                        key={markup}
                        type="button"
                        onClick={() => setRetailPrice(wholesale + markup)}
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-extrabold border transition ${
                          retailPrice === wholesale + markup
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                        }`}
                      >
                        +{markup}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profit bar */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">
                      صافي ربحك في القطعة
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-300">
                      +{unitProfit.toLocaleString()} دج
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/80">
                    <span className="text-[10px] text-violet-700 dark:text-violet-400 font-bold block">
                      هامش الربح التجاري
                    </span>
                    <span className="text-sm font-black text-violet-600 dark:text-violet-300">
                      {profitMarginPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Sync Options */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                  خيارات المزامنة التلقائية:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      مزامنة المخزون الحي تلقائياً
                    </span>
                    <input
                      type="checkbox"
                      checked={syncInventory}
                      onChange={(e) => setSyncInventory(e.target.checked)}
                      className="rounded accent-violet-600 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      تصدير كافة المقاسات والألوان
                    </span>
                    <input
                      type="checkbox"
                      checked={includeVariants}
                      onChange={(e) => setIncludeVariants(e.target.checked)}
                      className="rounded accent-violet-600 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      تضمين صور الوصف عالية الدقة
                    </span>
                    <input
                      type="checkbox"
                      checked={includeDescriptionImages}
                      onChange={(e) => setIncludeDescriptionImages(e.target.checked)}
                      className="rounded accent-violet-600 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      نشر المنتج فوراً كـ نشط (Active)
                    </span>
                    <input
                      type="checkbox"
                      checked={productStatus === 'active'}
                      onChange={(e) => setProductStatus(e.target.checked ? 'active' : 'draft')}
                      className="rounded accent-violet-600 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting || stores.length === 0}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 transition active:scale-98"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري التصدير والمزامنة مع المتجر...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>🚀 تصدير إلى متجري الآن بنقرة واحدة</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
