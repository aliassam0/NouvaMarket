import React, { useState, useMemo } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Facebook,
  ExternalLink,
  Sparkles,
  Download,
  Trash2,
  Plus,
  Tag,
  Link as LinkIcon,
  AlertTriangle,
  Zap,
  Layers,
  Eye,
  TrendingUp,
  Package,
  SlidersHorizontal,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ArrowRight,
  Palette,
  Gift,
  Truck,
  Power,
  RotateCcw,
} from 'lucide-react';
import { Product, UpsellOffer } from '../../types';
import { MoneyText } from '../ui/MoneyText';
import { calculateProfit } from '../../lib/formatters';
import { getStoredSuppliers } from '../../lib/supplierHelper';
import { getOfficialStoreSettings } from '../../lib/officialStoreConfig';
import {
  getProductShareLinks,
  saveSingleShareLink,
  updateShareLinkPrice,
  toggleShareLinkActive,
  deleteShareLink,
  removeProductShareData,
  updateShareLinkUpsells,
  updateShareLinkCustomization,
  getProductDefaultCustomization,
  ProductShareLink,
} from '../../utils/shareUtils';
import { downloadAllImages } from '../../utils/imageDownloader';
import { useAuth } from '../../context/AuthContext';
import { MarketerPageCustomizer } from '../tabs/MarketerPageCustomizer';
import { INITIAL_COURIERS } from '../../lib/courierHelper';

interface OfficialStoreProductParamsModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
  onDeleteProduct?: (productId: string, permanently?: boolean) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type ShareDashboardTab = 'links_list' | 'create_link' | 'upsells' | 'customize' | 'logistics';

export function OfficialStoreProductParamsModal({
  product,
  onClose,
  onSave,
  onDeleteProduct,
  onShowToast,
}: OfficialStoreProductParamsModalProps) {
  if (!product) return null;

  const { user } = useAuth();
  const initialVariant = product.variants?.[0] || { size: 'Standard', color: 'Standard', colorHex: '#000' };
  const defaultSellingPrice = product.officialStoreRetailPrice || product.suggestedSellingPrice || product.wholesalePrice + 1000;

  // Suppliers & Pixels information
  const activeSupplier = useMemo(() => {
    const suppliers = getStoredSuppliers();
    return (
      suppliers.find(
        (s) =>
          (product.supplierId && s.id === product.supplierId) ||
          (product.supplierEmail && s.email && s.email.toLowerCase() === product.supplierEmail.toLowerCase())
      ) || null
    );
  }, [product.supplierId, product.supplierEmail]);

  const officialSettings = useMemo(() => getOfficialStoreSettings(), []);
  const activePixelOwner = activeSupplier || user;
  const hasMeta = Boolean(activePixelOwner?.metaPixelId || (officialSettings.enablePixelTracking && officialSettings.facebookPixelId));
  const hasTiktok = Boolean(activePixelOwner?.tiktokPixelId || (officialSettings.enablePixelTracking && officialSettings.tiktokPixelId));
  const hasSnap = Boolean(activePixelOwner?.snapchatPixelId || (officialSettings.enablePixelTracking && officialSettings.snapchatPixelId));

  // Wholesale cost & platform margin
  const wholesaleCost = product.wholesalePrice || (product.supplierNetPrice ? product.supplierNetPrice + 200 : 2500);
  const platformProfitBaseline = Math.max(0, defaultSellingPrice - wholesaleCost);

  // Load existing links for this product
  const [links, setLinks] = useState<ProductShareLink[]>(() =>
    getProductShareLinks(product.id, defaultSellingPrice, initialVariant.size, initialVariant.color)
  );

  // Active vertical dashboard tab
  const [activeTab, setActiveTab] = useState<ShareDashboardTab>('links_list');
  const [mobileShowWorkspace, setMobileShowWorkspace] = useState(false);
  const [selectedCustomizationLinkId, setSelectedCustomizationLinkId] = useState<string>(
    () => links[0]?.id || 'link-default'
  );

  const handleSelectTab = (tab: ShareDashboardTab) => {
    setActiveTab(tab);
    setMobileShowWorkspace(true);
  };

  // Filter for links tab: 'all' | 'active' | 'disabled'
  const [linksFilter, setLinksFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Form state for creating a new link
  const [newTitle, setNewTitle] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState<number>(defaultSellingPrice);
  const [newSize, setNewSize] = useState<string>(initialVariant.size);
  const [newColor, setNewColor] = useState<string>(initialVariant.color);
  const [newQuantity, setNewQuantity] = useState<number>(1);

  // Price editing state for inline links: { [linkId]: editedPriceNumber }
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // UpSell state per link
  const [expandedUpsellLinkId, setExpandedUpsellLinkId] = useState<string | null>(null);
  const [linkUpsellDrafts, setLinkUpsellDrafts] = useState<Record<string, UpsellOffer[]>>({});
  const [upsellTargetLinkId, setUpsellTargetLinkId] = useState<string>(() => links[0]?.id || 'link-default');

  // Official Store Direct Parameters (Retail, Compare-at, Logistics)
  const [storeRetailPrice, setStoreRetailPrice] = useState<number>(
    product.officialStoreRetailPrice || product.suggestedSellingPrice || defaultSellingPrice
  );
  const [storeCompareAtPrice, setStoreCompareAtPrice] = useState<number>(
    product.officialStoreCompareAtPrice || product.ceilingPrice || Math.round(storeRetailPrice * 1.35)
  );
  const [storeCustomTitle, setStoreCustomTitle] = useState<string>(
    product.officialStoreCustomTitle || product.nameAr || ''
  );
  const [storeBadge, setStoreBadge] = useState<string>(
    product.officialStoreBadge || 'الأكثر طلباً 🔥'
  );
  const [isOfficialStoreEnabled, setIsOfficialStoreEnabled] = useState<boolean>(
    product.isOfficialStoreEnabled !== false
  );
  const [isOfficialStoreFeatured, setIsOfficialStoreFeatured] = useState<boolean>(
    Boolean(product.isOfficialStoreFeatured)
  );
  const [preferredCourier, setPreferredCourier] = useState<string>(
    product.officialStorePreferredCourier || 'cour-yalidine'
  );
  const [packagingNotes, setPackagingNotes] = useState<string>(
    product.officialStorePackagingNotes || 'تغليف آمن ومحكم مع فحص المقاس واللون ووضع لاصق الحماية قبل الإغلاق.'
  );

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'disable' | 'permanent'>('disable');

  // Direct store URL
  const directStoreUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/store?product=${product.id}`
    : `/store?product=${product.id}`;

  // Smart bundle tiers generator
  const generateSmartBundleOffers = (basePrice: number): UpsellOffer[] => {
    const wholesale = product.wholesalePrice || Math.round(basePrice * 0.6);
    const p2 = Math.round((basePrice * 2 * 0.88) / 50) * 50;
    const p3 = Math.round((basePrice * 3 * 0.80) / 50) * 50;
    const p4 = Math.round((basePrice * 4 * 0.72) / 50) * 50;

    return [
      {
        id: `upsell-${Date.now()}-1`,
        title: 'قطعة واحدة',
        price: basePrice,
        wholesalePrice: wholesale,
        profit: Math.max(0, basePrice - wholesale),
        quantity: 1,
        isDefaultSelected: false,
      },
      {
        id: `upsell-${Date.now()}-2`,
        title: 'قطعتين',
        price: p2,
        originalPrice: basePrice * 2,
        wholesalePrice: wholesale * 2,
        profit: Math.max(0, p2 - wholesale * 2),
        quantity: 2,
        badge: 'الأكثر طلباً 🔥 (وفر 12%)',
        isDefaultSelected: true,
      },
      {
        id: `upsell-${Date.now()}-3`,
        title: '3 قطع',
        price: p3,
        originalPrice: basePrice * 3,
        wholesalePrice: wholesale * 3,
        profit: Math.max(0, p3 - wholesale * 3),
        quantity: 3,
        badge: 'أفضل توفير 💰 (وفر 20%)',
        isDefaultSelected: false,
      },
      {
        id: `upsell-${Date.now()}-4`,
        title: '4 قطع',
        price: p4,
        originalPrice: basePrice * 4,
        wholesalePrice: wholesale * 4,
        profit: Math.max(0, p4 - wholesale * 4),
        quantity: 4,
        badge: 'باقة العائلة 🏆 (وفر 28%)',
        isDefaultSelected: false,
      },
    ];
  };

  const syncLinksFromStorage = () => {
    const updated = getProductShareLinks(product.id, defaultSellingPrice, initialVariant.size, initialVariant.color);
    setLinks(updated);
  };

  const handleCopy = (text: string, linkId?: string) => {
    navigator.clipboard.writeText(text);
    if (linkId) setCopiedLinkId(linkId);
    onShowToast('✔ تم نسخ الرابط إلى الحافظة بنجاح!', 'success');
    if (linkId) setTimeout(() => setCopiedLinkId(null), 2500);
  };

  const handleCreateNewLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSellingPrice < wholesaleCost) {
      onShowToast(`⚠️ سعر البيع (${newSellingPrice} دج) أقل من سعر الجملة (${wholesaleCost} دج)`, 'error');
      return;
    }

    const defaultUpsells = generateSmartBundleOffers(newSellingPrice);

    const newLink: ProductShareLink = {
      id: `link-${Date.now()}`,
      productId: product.id,
      title: newTitle.trim() || `حملة ${links.length + 1} (${newSellingPrice} دج)`,
      sellingPrice: newSellingPrice,
      size: newSize,
      color: newColor,
      quantity: newQuantity,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      upsells: defaultUpsells,
    };

    saveSingleShareLink(newLink, defaultSellingPrice);
    syncLinksFromStorage();
    setSelectedCustomizationLinkId(newLink.id);
    setNewTitle('');
    onShowToast(`🎉 تم إنشاء وتفعيل رابط الحملة بنجاح!`, 'success');
    setActiveTab('links_list');
    setMobileShowWorkspace(false);
  };

  const handleSavePrice = (linkId: string) => {
    const newPrice = editedPrices[linkId];
    if (newPrice === undefined) return;
    if (newPrice < wholesaleCost) {
      onShowToast(`⚠️ السعر (${newPrice} دج) أقل من تكلفة الجملة (${wholesaleCost} دج)`, 'error');
      return;
    }

    updateShareLinkPrice(product.id, linkId, newPrice, defaultSellingPrice);
    syncLinksFromStorage();
    setEditedPrices((prev) => {
      const next = { ...prev };
      delete next[linkId];
      return next;
    });
    onShowToast('✔ تم تحديث سعر البيع وهوامش الربح بنجاح!', 'success');
  };

  const handleToggleActive = (linkId: string) => {
    toggleShareLinkActive(product.id, linkId, defaultSellingPrice);
    syncLinksFromStorage();
    onShowToast('✔ تم تبديل حالة تفعيل الرابط', 'info');
  };

  const handleDeleteLink = (linkId: string) => {
    if (links.length <= 1) {
      onShowToast('⚠️ يجب الإبقاء على رابط تسويقي واحد على الأقل للمنتج', 'error');
      return;
    }
    deleteShareLink(product.id, linkId, defaultSellingPrice);
    syncLinksFromStorage();
    onShowToast('🗑️ تم حذف رابط الحملة بنجاح', 'info');
  };

  const handlePreviewLink = (link?: ProductShareLink) => {
    if (link) {
      window.open(`/p/${product.id}?linkId=${link.id}`, '_blank');
    } else {
      window.open(`/store?product=${product.id}`, '_blank');
    }
  };

  // Save Official Store Settings to Product
  const handleSaveOfficialStoreParameters = () => {
    const updated: Product = {
      ...product,
      officialStoreRetailPrice: storeRetailPrice,
      officialStoreCompareAtPrice: storeCompareAtPrice,
      officialStoreCustomTitle: storeCustomTitle.trim(),
      officialStoreBadge: storeBadge.trim(),
      officialStorePreferredCourier: preferredCourier,
      officialStorePackagingNotes: packagingNotes.trim(),
      isOfficialStoreEnabled: isOfficialStoreEnabled,
      isOfficialStoreFeatured: isOfficialStoreFeatured,
      suggestedSellingPrice: storeRetailPrice,
    };

    onSave(updated);
    onShowToast(`✔ تم حفظ معايير المنتج "${product.nameAr}" بالمتجر الرسمي بنجاح!`, 'success');
  };

  // Upsell helpers
  const handleGetLinkUpsells = (link: ProductShareLink): UpsellOffer[] => {
    if (linkUpsellDrafts[link.id]) return linkUpsellDrafts[link.id];
    if (link.upsells && Array.isArray(link.upsells) && link.upsells.length > 0) return link.upsells;
    return generateSmartBundleOffers(link.sellingPrice);
  };

  const handleUpdateDraftUpsell = (
    linkId: string,
    upsellIndex: number,
    field: keyof UpsellOffer,
    val: any
  ) => {
    const currentLink = links.find((l) => l.id === linkId);
    if (!currentLink) return;
    const currentUpsells = [...handleGetLinkUpsells(currentLink)];
    currentUpsells[upsellIndex] = {
      ...currentUpsells[upsellIndex],
      [field]: val,
    };
    setLinkUpsellDrafts((prev) => ({
      ...prev,
      [linkId]: currentUpsells,
    }));
  };

  const handleAddDraftUpsellTier = (linkId: string) => {
    const currentLink = links.find((l) => l.id === linkId);
    if (!currentLink) return;
    const currentUpsells = [...handleGetLinkUpsells(currentLink)];
    const lastQty = currentUpsells.length > 0 ? currentUpsells[currentUpsells.length - 1].quantity || 1 : 1;
    const nextQty = lastQty + 1;
    const wholesale = product.wholesalePrice || Math.round(currentLink.sellingPrice * 0.6);
    const newTierPrice = Math.round((currentLink.sellingPrice * nextQty * 0.75) / 50) * 50;

    const newTier: UpsellOffer = {
      id: `upsell-${Date.now()}-${nextQty}`,
      title: `${nextQty} قطع`,
      price: newTierPrice,
      originalPrice: currentLink.sellingPrice * nextQty,
      wholesalePrice: wholesale * nextQty,
      profit: Math.max(0, newTierPrice - wholesale * nextQty),
      quantity: nextQty,
      badge: `توفير إضافي ⚡ (${nextQty} قطع)`,
      isDefaultSelected: false,
    };

    setLinkUpsellDrafts((prev) => ({
      ...prev,
      [linkId]: [...currentUpsells, newTier],
    }));
  };

  const handleRemoveDraftUpsellTier = (linkId: string, index: number) => {
    const currentLink = links.find((l) => l.id === linkId);
    if (!currentLink) return;
    const currentUpsells = [...handleGetLinkUpsells(currentLink)];
    if (currentUpsells.length <= 1) {
      onShowToast('⚠️ يجب الإبقاء على باقة واحدة على الأقل', 'error');
      return;
    }
    currentUpsells.splice(index, 1);
    setLinkUpsellDrafts((prev) => ({
      ...prev,
      [linkId]: currentUpsells,
    }));
  };

  const handleSaveLinkUpsells = (link: ProductShareLink) => {
    const draft = linkUpsellDrafts[link.id];
    if (!draft) return;
    updateShareLinkUpsells(product.id, link.id, draft, defaultSellingPrice);
    syncLinksFromStorage();
    setLinkUpsellDrafts((prev) => {
      const next = { ...prev };
      delete next[link.id];
      return next;
    });
    onShowToast('🎉 تم حفظ وتحديث باقات الـ Upsell بنجاح!', 'success');
  };

  const handleResetUpsellsToProduct = (link: ProductShareLink) => {
    const smartOffers = generateSmartBundleOffers(link.sellingPrice);
    updateShareLinkUpsells(product.id, link.id, smartOffers, defaultSellingPrice);
    syncLinksFromStorage();
    setLinkUpsellDrafts((prev) => {
      const next = { ...prev };
      delete next[link.id];
      return next;
    });
    onShowToast('🔄 تم استرجاع باقات التوفير الذكية بنجاح!', 'info');
  };

  // Execution of product deletion / hiding
  const handleExecuteDelete = () => {
    if (deleteMode === 'disable') {
      const updated: Product = {
        ...product,
        isOfficialStoreEnabled: false,
      };
      onSave(updated);
      onShowToast(`🚫 تم إخفاء وتعطيل ظهور المنتج "${product.nameAr}" من المتجر الرسمي.`, 'info');
      onClose();
    } else {
      if (onDeleteProduct) {
        onDeleteProduct(product.id, true);
        onShowToast(`🗑️ تم حذف المنتج "${product.nameAr}" نهائياً من متجر المنصة.`, 'error');
      } else {
        removeProductShareData(product.id);
        const updated: Product = {
          ...product,
          isOfficialStoreEnabled: false,
        };
        onSave(updated);
        onShowToast(`🚫 تم حذف المنتج من قائمة المتجر الرسمي.`, 'info');
      }
      onClose();
    }
  };

  // Filtered links
  const filteredLinks = links.filter((l) => {
    if (linksFilter === 'active') return l.active !== false;
    if (linksFilter === 'disabled') return l.active === false;
    return true;
  });

  const activeLinksCount = links.filter((l) => l.active !== false).length;
  const averageProfit = Math.round(
    links.reduce((acc, l) => acc + calculateProfit(wholesaleCost, l.sellingPrice), 0) /
      (links.length || 1)
  );

  const selectedLinkForUpsells = links.find((l) => l.id === upsellTargetLinkId) || links[0];
  const newProfit = calculateProfit(wholesaleCost, newSellingPrice);

  const sizes = Array.from(new Set(product.variants?.map((v) => v.size).filter(Boolean))) as string[];
  const colors = Array.from(new Set(product.variants?.map((v) => v.color).filter(Boolean))) as string[];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-6xl h-[94vh] max-h-[920px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 text-right">
        
        {/* ==================== TOP HEADER COCKPIT ==================== */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-600/30 border border-violet-400/40 rounded-2xl text-violet-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black tracking-tight">
                  لوحة إدارة روابط المشاركة وحملات البيع
                </h1>
                <span className="text-[11px] font-bold text-violet-300 bg-violet-500/20 px-2.5 py-0.5 rounded-full border border-violet-500/30 font-mono">
                  {links.length} رابط
                </span>
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  المتجر الرسمي
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                تعديل أسعار البيع، التحكم بهامش الربح، تخصيص صفحة الزبون، وإطلاق الحملات الإعلانية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePreviewLink()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/15 cursor-pointer"
              title="معاينة صفحة الزبون بالمتجر"
            >
              <Eye className="w-3.5 h-3.5 text-amber-300" />
              <span>معاينة كزبون</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-bold transition cursor-pointer"
              title="حذف منتج من متجر المنصة"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف من المتجر</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ==================== SPLIT BODY: VERTICAL SIDEBAR + WORKSPACE ==================== */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* ==================== VERTICAL SIDEBAR (RIGHT) ==================== */}
          <aside
            className={`${
              mobileShowWorkspace ? 'hidden md:flex' : 'flex'
            } w-full md:w-80 shrink-0 bg-slate-50/80 dark:bg-slate-900/90 border-b md:border-b-0 md:border-e border-slate-200 dark:border-slate-800 p-4 flex-col justify-between overflow-y-auto space-y-4`}
          >
            <div className="space-y-4">
              
              {/* Product Mini-Card */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150'}
                    alt={product.nameAr}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-black text-xs text-slate-900 dark:text-white line-clamp-2">
                      {product.nameAr}
                    </h2>
                    <div className="mt-1 text-[11px] text-slate-500 space-x-1 space-x-reverse">
                      <span>الجملة:</span>
                      <span className="font-black text-slate-900 dark:text-white font-mono">
                        <MoneyText amount={wholesaleCost} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Baseline Row */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-400 block text-[10px]">المقترح للبيع:</span>
                    <span className="font-black text-slate-900 dark:text-white font-mono text-xs">
                      <MoneyText amount={storeRetailPrice} />
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">
                      ربح المنصة الصافي:
                    </span>
                    <span className="font-black font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      +<MoneyText amount={Math.max(0, storeRetailPrice - wholesaleCost)} />
                    </span>
                  </div>
                </div>

                {/* Quick Image Download */}
                <button
                  type="button"
                  onClick={() => downloadAllImages(product.images, product.nameAr, (msg) => onShowToast(msg, 'info'))}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-violet-600" />
                  <span>تحميل باقة الصور كاملة ({product.images?.length || 0})</span>
                </button>
              </div>

              {/* Performance Indicators (Vertical Matrix) */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">إجمالي الروابط</span>
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    {links.length}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <span className="text-[10px] block">الروابط النشطة</span>
                  <span className="text-sm font-black font-mono">
                    {activeLinksCount}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300">
                  <span className="text-[10px] block">متوسط الربح</span>
                  <span className="text-xs font-black font-mono">
                    <MoneyText amount={averageProfit} />
                  </span>
                </div>
              </div>

              {/* Vertical Navigation Menu */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1">
                  أقسام لوحة التحكم
                </span>

                <button
                  type="button"
                  onClick={() => handleSelectTab('links_list')}
                  className={`w-full p-3 rounded-2xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
                    activeTab === 'links_list'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                      : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LinkIcon className="w-4 h-4" />
                    <span>روابط البيع وهوامش الربح</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                      activeTab === 'links_list'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {links.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('create_link')}
                  className={`w-full p-3 rounded-2xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
                    activeTab === 'create_link'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                      : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="w-4 h-4" />
                    <span>إنشاء رابط بيع مخصص</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'create_link'
                        ? 'bg-white/20 text-white'
                        : 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300'
                    }`}
                  >
                    حملة جديدة ✨
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('upsells')}
                  className={`w-full p-3 rounded-2xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
                    activeTab === 'upsells'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                      : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Gift className="w-4 h-4" />
                    <span>عروض الكميات والـ Upsell</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'upsells'
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    مضاعفة الأرباح ⚡
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('customize')}
                  className={`w-full p-3 rounded-2xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
                    activeTab === 'customize'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                      : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4" />
                    <span>تخصيص وتمييز صفحة الزبون</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'customize'
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                    }`}
                  >
                    Differentiating 🚀
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('logistics')}
                  className={`w-full p-3 rounded-2xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
                    activeTab === 'logistics'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                      : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4" />
                    <span>معايير المتجر والشحن</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'logistics'
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    لوجستيات 📦
                  </span>
                </button>
              </div>
            </div>

            {/* Sidebar Bottom: Tracking Pixels & Admin Product Delete */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                <span className="font-bold block text-slate-700 dark:text-slate-300">
                  ربط البيكسل الإعلاني:
                </span>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={hasMeta ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    • Meta Pixel {hasMeta ? '✔' : ''}
                  </span>
                  <span className={hasTiktok ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    • TikTok {hasTiktok ? '✔' : ''}
                  </span>
                  <span className={hasSnap ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    • Snap {hasSnap ? '✔' : ''}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2 px-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border border-rose-200 dark:border-rose-900/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف منتج من متجر المنصة</span>
              </button>
            </div>
          </aside>

          {/* ==================== MAIN WORKSPACE ==================== */}
          <main
            className={`${
              !mobileShowWorkspace ? 'hidden md:block' : 'block'
            } flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 bg-white dark:bg-slate-900 w-full`}
          >
            {/* Mobile Workspace Navigation Cockpit */}
            <div className="md:hidden flex flex-col gap-2.5 p-3 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl mb-4 shrink-0 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMobileShowWorkspace(false)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 shadow-2xs border border-slate-200 dark:border-slate-600 active:scale-95 transition cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span>« رجوع لقائمة الخيارات</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePreviewLink()}
                    className="px-2.5 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-300" />
                    <span>معاينة الزبون</span>
                  </button>
                </div>
              </div>

              {/* Horizontal Tab Switcher Pills on Mobile */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('links_list')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                    activeTab === 'links_list'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>الروابط ({links.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('create_link')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                    activeTab === 'create_link'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>رابط جديد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upsells')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                    activeTab === 'upsells'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>الـ Upsell</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('customize')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                    activeTab === 'customize'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>تخصيص الصفحة 🎨</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('logistics')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                    activeTab === 'logistics'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>المتجر والشحن 📦</span>
                </button>
              </div>
            </div>

            {/* -------------------- TAB 1: LINKS LIST -------------------- */}
            {activeTab === 'links_list' && (
              <div className="space-y-4 max-w-4xl mx-auto">
                {/* Section Header with Segmented Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>روابط البيع وهوامش الأرباح</span>
                      <span className="text-xs font-bold text-slate-500">
                        ({filteredLinks.length} من أصل {links.length})
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      عدّل سعر البيع المباشر، انسخ الرابط بنقرة واحدة، وشارك عبر واتساب وفيسبوك
                    </p>
                  </div>

                  {/* Filter segmented buttons */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setLinksFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        linksFilter === 'all'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      الكل ({links.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinksFilter('active')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        linksFilter === 'active'
                          ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      النشطة ({activeLinksCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinksFilter('disabled')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        linksFilter === 'disabled'
                          ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      المعطلة ({links.length - activeLinksCount})
                    </button>
                  </div>
                </div>

                {/* PINNED MASTER CARD: OFFICIAL STORE DIRECT PRODUCT LINK */}
                <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-50 dark:to-slate-800/40 border-2 border-emerald-500/30 shadow-xs space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          رابط صفحة الهبوط المباشرة للمتجر الرسمي
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white font-mono">
                            OFFICIAL STORE
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          الرابط المعتمد بالمتجر الرسمي مع باقات التوفير والشراء المباشر الفوري
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOfficialStoreEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {isOfficialStoreEnabled ? 'متاح بالمتجر ✔' : 'مخفي مؤقتاً'}
                      </span>
                      {isOfficialStoreFeatured && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          مميز ⭐
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Live Price Editing for Official Store */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                        سعر البيع بالمتجر الرسمي (دج):
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step={50}
                          min={wholesaleCost}
                          value={storeRetailPrice}
                          onChange={(e) => setStoreRetailPrice(Number(e.target.value))}
                          className="w-full p-2 rounded-xl border border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 font-black font-mono text-emerald-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleSaveOfficialStoreParameters}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shrink-0"
                          title="حفظ سعر المتجر"
                        >
                          حفظ
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        السعر المشطوب (المقارن):
                      </label>
                      <input
                        type="number"
                        step={50}
                        value={storeCompareAtPrice}
                        onChange={(e) => setStoreCompareAtPrice(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold font-mono text-slate-700 dark:text-slate-300 text-xs"
                      />
                    </div>

                    <div className="flex flex-col justify-center p-2 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-center">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                        صافي ربح المنصة في القطعة:
                      </span>
                      <span className="text-base font-black font-mono">
                        +<MoneyText amount={Math.max(0, storeRetailPrice - wholesaleCost)} />
                      </span>
                    </div>
                  </div>

                  {/* URL copy & action bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={directStoreUrl}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 select-all"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(directStoreUrl, 'official-store')}
                        className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {copiedLinkId === 'official-store' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedLinkId === 'official-store' ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePreviewLink()}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        title="معاينة الرابط في نافذة جديدة"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`شاهد هذا العرض الحصري: ${directStoreUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 transition cursor-pointer"
                        title="مشاركة عبر واتساب"
                      >
                        <Share2 className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Campaign links list cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
                    <span>روابط الحملات الإعلانية والتسويقية المستقلة:</span>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('create_link')}
                      className="text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إنشاء رابط حملة جديد</span>
                    </button>
                  </div>

                  {filteredLinks.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                      <p className="text-xs text-slate-500 font-bold">لا توجد روابط تطابق الفلتر المحدد.</p>
                      <button
                        type="button"
                        onClick={() => setLinksFilter('all')}
                        className="text-xs text-violet-600 font-bold underline cursor-pointer"
                      >
                        عرض جميع الروابط
                      </button>
                    </div>
                  ) : (
                    filteredLinks.map((link) => {
                      const isEditingPrice = editedPrices[link.id] !== undefined;
                      const currentSellingPrice = isEditingPrice ? editedPrices[link.id] : link.sellingPrice;
                      const profit = calculateProfit(wholesaleCost, currentSellingPrice);
                      const shareUrl = typeof window !== 'undefined'
                        ? `${window.location.origin}/p/${product.id}?linkId=${link.id}`
                        : `/p/${product.id}?linkId=${link.id}`;

                      return (
                        <div
                          key={link.id}
                          className={`p-4 rounded-2xl border transition space-y-3.5 ${
                            link.active !== false
                              ? 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md'
                              : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-75'
                          }`}
                        >
                          {/* Card Header: Title, Status toggle, and Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  link.active !== false ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              <h4 className="font-black text-xs text-slate-900 dark:text-white line-clamp-1">
                                {link.title || `رابط الحملة (${link.sellingPrice} دج)`}
                              </h4>
                              {link.customization?.badgeText && (
                                <span className="text-[10px] font-bold bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 px-2 py-0.5 rounded-full">
                                  {link.customization.badgeText}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(link.id)}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                                  link.active !== false
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                                title="تبديل حالة الرابط"
                              >
                                <Power className="w-3 h-3" />
                                <span>{link.active !== false ? 'مفعّل' : 'معطّل'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteLink(link.id)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                                title="حذف هذا الرابط"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Price & Profit Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-1">
                                سعر البيع المباشر (دج):
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step={50}
                                  min={wholesaleCost}
                                  value={currentSellingPrice}
                                  onChange={(e) =>
                                    setEditedPrices((prev) => ({
                                      ...prev,
                                      [link.id]: Number(e.target.value),
                                    }))
                                  }
                                  className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-black font-mono text-slate-900 dark:text-white text-xs"
                                />
                                {isEditingPrice && (
                                  <button
                                    type="button"
                                    onClick={() => handleSavePrice(link.id)}
                                    className="px-2.5 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-violet-500 shrink-0"
                                  >
                                    حفظ
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col justify-center">
                              <span className="text-[10px] text-slate-400 block">
                                تكلفة الجملة الأساسية:
                              </span>
                              <span className="font-black text-slate-700 dark:text-slate-300 font-mono text-xs">
                                <MoneyText amount={wholesaleCost} />
                              </span>
                            </div>

                            <div className="flex flex-col justify-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-center">
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                                هامش الربح المحسوب:
                              </span>
                              <span className="font-black font-mono text-xs">
                                +<MoneyText amount={profit} />
                              </span>
                            </div>
                          </div>

                          {/* Link box & share tools */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={shareUrl}
                              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 select-all"
                            />
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopy(shareUrl, link.id)}
                                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                {copiedLinkId === link.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedLinkId === link.id ? 'تم النسخ!' : 'نسخ'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePreviewLink(link)}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                                title="معاينة كزبون"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <a
                                href={`https://wa.me/?text=${encodeURIComponent(`شاهد هذا العرض الحصري: ${shareUrl}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 transition cursor-pointer"
                                title="مشاركة عبر واتساب"
                              >
                                <Share2 className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* -------------------- TAB 2: CREATE NEW LINK -------------------- */}
            {activeTab === 'create_link' && (
              <div className="max-w-2xl mx-auto space-y-5">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-violet-600" />
                    <span>إنشاء رابط تسويقي مخصص جديد</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    خصّص سعراً مستقلاً لكل حملة إعلانية (مثلاً: رابط لحملة فيسبوك، رابط لتيكتوك، أو عرض تخفيض زمني)
                  </p>
                </div>

                <form onSubmit={handleCreateNewLink} className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs mb-1.5">
                      عنوان أو اسم الرابط (لتمييز الحملة):
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: حملة فيسبوك - عرض حصري 4,200 دج"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-violet-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs mb-1.5">
                      سعر البيع المقترح للزبون (دج):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={newSellingPrice}
                        onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                        className="w-full p-3 pe-10 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white text-base focus:ring-2 focus:ring-violet-500 shadow-2xs"
                      />
                      <span className="absolute end-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        دج
                      </span>
                    </div>

                    <div className="mt-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs">
                      <span className="text-purple-900 dark:text-purple-200 font-bold">
                        هامش ربح المنصة المحسوب آلياً في القطعة:
                      </span>
                      <span
                        className={`font-black font-mono text-sm ${
                          newProfit > 0 ? 'text-purple-700 dark:text-purple-300' : 'text-rose-600'
                        }`}
                      >
                        +<MoneyText amount={newProfit} />
                      </span>
                    </div>
                  </div>

                  {sizes.length > 0 && (
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs mb-1.5">
                        المقاس الافتراضي المحدد مسبقاً:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setNewSize(sz)}
                            className={`px-3.5 py-2 rounded-xl font-bold text-xs border transition cursor-pointer ${
                              newSize === sz
                                ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {colors.length > 0 && (
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs mb-1.5">
                        اللون الافتراضي المحدد مسبقاً:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((cl) => (
                          <button
                            key={cl}
                            type="button"
                            onClick={() => setNewColor(cl)}
                            className={`px-3.5 py-2 rounded-xl font-bold text-xs border transition cursor-pointer ${
                              newColor === cl
                                ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {cl}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition cursor-pointer active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                      <span>إنشاء وتفعيل رابط البيع فورياً</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* -------------------- TAB 3: UPSELLS DEDICATED VIEW -------------------- */}
            {activeTab === 'upsells' && (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Gift className="w-5 h-5 text-amber-500" />
                      <span>عروض الكميات وباقات الـ Upsell</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      زيادة متوسط قيمة الطلب (AOV) ومضاعفة الأرباح عند شراء الزبون لقطعتين أو 3 قطع
                    </p>
                  </div>

                  {/* Target Link Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-bold">الرابط المستهدف:</span>
                    <select
                      value={upsellTargetLinkId}
                      onChange={(e) => setUpsellTargetLinkId(e.target.value)}
                      className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-white"
                    >
                      {links.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title || 'رابط'} ({l.sellingPrice} دج)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedLinkForUpsells && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
                      <span>
                        تظهر هذه الباقات كخيارات فورية في استمارة الطلب بالصفحة لترغيب المشتري بالتوفير.
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResetUpsellsToProduct(selectedLinkForUpsells)}
                        className="font-bold underline cursor-pointer text-amber-800 dark:text-amber-300"
                      >
                        إعادة تعيين الذكية
                      </button>
                    </div>

                    {/* Tiers List */}
                    <div className="space-y-2.5">
                      {handleGetLinkUpsells(selectedLinkForUpsells).map((upsell, uIdx) => {
                        const uWholesale =
                          upsell.wholesalePrice || wholesaleCost * (upsell.quantity || 1);
                        const uProfit = Math.max(0, (upsell.price || 0) - uWholesale);

                        return (
                          <div
                            key={upsell.id || uIdx}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-slate-900 dark:text-white">
                                  باقة #{uIdx + 1}:
                                </span>
                                <input
                                  type="text"
                                  value={upsell.title || ''}
                                  onChange={(e) =>
                                    handleUpdateDraftUpsell(
                                      selectedLinkForUpsells.id,
                                      uIdx,
                                      'title',
                                      e.target.value
                                    )
                                  }
                                  placeholder="عنوان الباقة"
                                  className="p-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-xs"
                                />
                                <span className="text-xs text-slate-500">
                                  ({upsell.quantity || 1} قطع)
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(upsell.isDefaultSelected)}
                                    onChange={(e) =>
                                      handleUpdateDraftUpsell(
                                        selectedLinkForUpsells.id,
                                        uIdx,
                                        'isDefaultSelected',
                                        e.target.checked
                                      )
                                    }
                                    className="rounded text-violet-600 focus:ring-violet-500"
                                  />
                                  <span>محدد افتراضياً</span>
                                </label>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveDraftUpsellTier(selectedLinkForUpsells.id, uIdx)
                                  }
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                  title="حذف هذه الباقة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 block mb-1">
                                  سعر العرض للزبون (دج):
                                </span>
                                <input
                                  type="number"
                                  step={50}
                                  value={upsell.price || 0}
                                  onChange={(e) =>
                                    handleUpdateDraftUpsell(
                                      selectedLinkForUpsells.id,
                                      uIdx,
                                      'price',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-black font-mono text-xs text-slate-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-400 block mb-1">
                                  السعر المشطوب (دج):
                                </span>
                                <input
                                  type="number"
                                  step={50}
                                  value={upsell.originalPrice || (upsell.price ? Math.round(upsell.price * 1.25) : 0)}
                                  onChange={(e) =>
                                    handleUpdateDraftUpsell(
                                      selectedLinkForUpsells.id,
                                      uIdx,
                                      'originalPrice',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold font-mono text-xs text-slate-600"
                                />
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-400 block mb-1">
                                  الشارة التسويقية (Badge):
                                </span>
                                <input
                                  type="text"
                                  value={upsell.badge || ''}
                                  onChange={(e) =>
                                    handleUpdateDraftUpsell(
                                      selectedLinkForUpsells.id,
                                      uIdx,
                                      'badge',
                                      e.target.value
                                    )
                                  }
                                  placeholder="مثال: الأكثر طلباً 🔥"
                                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-xs"
                                />
                              </div>

                              <div className="flex flex-col justify-center p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-center">
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 block">
                                  الربح الصافي في الباقة:
                                </span>
                                <span className="font-black font-mono text-xs">
                                  +<MoneyText amount={uProfit} />
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Upsell Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => handleAddDraftUpsellTier(selectedLinkForUpsells.id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة باقة جديدة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveLinkUpsells(selectedLinkForUpsells)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black cursor-pointer shadow-xs"
                      >
                        حفظ باقات الرابط
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* -------------------- TAB 4: CUSTOMIZE LANDING PAGE -------------------- */}
            {activeTab === 'customize' && (
              <div className="space-y-4">
                {/* Link Selector Bar */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-violet-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      تخصيص وتنسيق صفحة الهبوط للرابط:
                    </span>
                    <select
                      value={selectedCustomizationLinkId}
                      onChange={(e) => setSelectedCustomizationLinkId(e.target.value)}
                      className="p-1.5 ps-2 pe-6 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-white"
                    >
                      {links.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title || 'رابط'} ({l.sellingPrice} دج)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const targetLink =
                        links.find((l) => l.id === selectedCustomizationLinkId) || links[0];
                      if (targetLink) handlePreviewLink(targetLink);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition cursor-pointer self-start sm:self-auto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة النتيجة الحية للزبون</span>
                  </button>
                </div>

                {/* Embedded Marketer Page Customizer (The Exact Same Rich Customizer) */}
                <MarketerPageCustomizer
                  product={product}
                  initialCustomization={
                    links.find((l) => l.id === selectedCustomizationLinkId)?.customization ||
                    getProductDefaultCustomization(product.id)
                  }
                  onSave={(customization) => {
                    updateShareLinkCustomization(
                      product.id,
                      selectedCustomizationLinkId,
                      customization,
                      defaultSellingPrice
                    );
                    onShowToast('🎉 تم حفظ وتطبيق تخصيصات صفحة الرابط بنجاح!', 'success');
                  }}
                  onPreview={() => {
                    const targetLink =
                      links.find((l) => l.id === selectedCustomizationLinkId) || links[0];
                    if (targetLink) handlePreviewLink(targetLink);
                  }}
                  onClose={() => {
                    setActiveTab('links_list');
                    setMobileShowWorkspace(false);
                  }}
                />
              </div>
            )}

            {/* -------------------- TAB 5: LOGISTICS & OFFICIAL STORE SETTINGS -------------------- */}
            {activeTab === 'logistics' && (
              <div className="max-w-3xl mx-auto space-y-5">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-600" />
                    <span>إعدادات الشحن، المستودع، والتواجد بالمتجر الرسمي</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ضبط شركة الشحن المعتمدة للطلب، إرشادات التغليف، وتفعيل أو إبراز المنتج بالواجهة
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Courier Partner Selection */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="text-xs font-black text-slate-900 dark:text-white block">
                      شركة الشحن المعتمدة لهذا المنتج:
                    </label>
                    <select
                      value={preferredCourier}
                      onChange={(e) => setPreferredCourier(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    >
                      {INITIAL_COURIERS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} - التوصيل: {c.avgDeliveryDays}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      يتم توليد البوردورو والرفع التلقائي عبر API لهذه الشركة عند تأكيد الطلب.
                    </p>
                  </div>

                  {/* Packaging Instructions */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="text-xs font-black text-slate-900 dark:text-white block">
                      تعليمات فحص الجودة والتغليف في المستودع:
                    </label>
                    <textarea
                      rows={3}
                      value={packagingNotes}
                      onChange={(e) => setPackagingNotes(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs"
                      placeholder="اكتب تعليمات خاصة للمغلف (مثال: فحص المقاس، وضع كيس حماية فقاعي...)"
                    />
                  </div>

                  {/* Official Store Display Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          متاح في كتالوج المتجر الرسمي
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          يظهر للمشترين في شبكة منتجات المتجر
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isOfficialStoreEnabled}
                        onChange={(e) => setIsOfficialStoreEnabled(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                    </label>

                    <label className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          منتج مميز بالصفحة الأولى (Featured ⭐)
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          يظهر في شارة التميز أعلى المتجر
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isOfficialStoreFeatured}
                        onChange={(e) => setIsOfficialStoreFeatured(e.target.checked)}
                        className="w-4 h-4 text-amber-500 rounded"
                      />
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveOfficialStoreParameters}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>حفظ إعدادات المتجر والشحن</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ==================== CONFIRMATION MODAL FOR DELETING PRODUCT ==================== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 text-right" dir="rtl">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>إزالة أو حذف منتج من متجر المنصة</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              يرجى اختيار الإجراء المطلوب لمنتج &quot;{product.nameAr}&quot;:
            </p>

            <div className="space-y-2.5">
              <label
                onClick={() => setDeleteMode('disable')}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  deleteMode === 'disable'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    إخفاء وتعطيل من المتجر الرسمي (موصى به)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    يظل المنتج محفوظاً في قاعدة البيانات وتتوقف مبيعاته بالمتجر.
                  </span>
                </div>
                <input
                  type="radio"
                  name="delMode"
                  checked={deleteMode === 'disable'}
                  onChange={() => setDeleteMode('disable')}
                  className="text-amber-600"
                />
              </label>

              <label
                onClick={() => setDeleteMode('permanent')}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  deleteMode === 'permanent'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 block">
                    حذف نهائي للمنتج من المنصة (صلاحية الأدمن)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    حذف المنتج والروابط بالكامل من المتجر والمنصة.
                  </span>
                </div>
                <input
                  type="radio"
                  name="delMode"
                  checked={deleteMode === 'permanent'}
                  onChange={() => setDeleteMode('permanent')}
                  className="text-rose-600"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد الإجراء</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
