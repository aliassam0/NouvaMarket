import React, { useState, useMemo } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Facebook,
  ExternalLink,
  Sparkles,
  Download,
  Power,
  Trash2,
  Plus,
  Tag,
  Edit3,
  Link as LinkIcon,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp,
  Layers,
  Eye,
  TrendingUp,
  Package,
  SlidersHorizontal,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Filter,
  Palette,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { Product, UpsellOffer } from '../../types';
import { MoneyText } from '../ui/MoneyText';
import { calculateProfit } from '../../lib/formatters';
import { getStoredSuppliers } from '../../lib/supplierHelper';
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
import { isStandardSize, isStandardColor } from '../../utils/variantUtils';
import { useAuth } from '../../context/AuthContext';
import { MarketerPageCustomizer } from './MarketerPageCustomizer';

interface ShareProductModalProps {
  product: Product;
  isSupplier?: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onPreviewCustomerView?: (product: Product, linkId?: string) => void;
}

type ShareDashboardTab = 'links_list' | 'create_link' | 'upsells' | 'customize';

export function ShareProductModal({
  product,
  isSupplier = false,
  onClose,
  onShowToast,
  onPreviewCustomerView,
}: ShareProductModalProps) {
  const { user } = useAuth();
  const initialVariant = product.variants[0] || { size: 'Standard', color: 'Standard', colorHex: '#000' };
  const defaultSellingPrice = product.suggestedSellingPrice || product.wholesalePrice + 1000;

  const isSupplierUser = Boolean(
    isSupplier ||
    user?.role === 'warehouse' ||
    (product.supplierId && (user?.id === product.supplierId || user?.email?.toLowerCase() === product.supplierEmail?.toLowerCase()))
  );

  const activeSupplier = useMemo(() => {
    if (!isSupplierUser) return null;
    const suppliers = getStoredSuppliers();
    return (
      suppliers.find(
        (s) =>
          (user?.id && s.id === user.id) ||
          (product.supplierId && s.id === product.supplierId) ||
          (user?.email && s.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
          (product.supplierEmail && s.email && s.email.toLowerCase() === product.supplierEmail.toLowerCase())
      ) || null
    );
  }, [isSupplierUser, user, product.supplierId, product.supplierEmail]);

  const activePixelOwner = isSupplierUser && activeSupplier ? activeSupplier : user;

  const supplierPlatformFee = product.nouvaFeeAmount ?? Math.round((product.supplierNetPrice || product.wholesalePrice || 1000) * 0.05);
  const sellerDirectProfit = Math.max(0, defaultSellingPrice - supplierPlatformFee);

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
  const [showDeleteProductConfirm, setShowDeleteProductConfirm] = useState(false);

  // UpSell state per link
  const [expandedUpsellLinkId, setExpandedUpsellLinkId] = useState<string | null>(null);
  const [linkUpsellDrafts, setLinkUpsellDrafts] = useState<Record<string, UpsellOffer[]>>({});

  // Helper to generate smart bundle tiers for a given base price
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
        badge: 'توفير 12%',
        isDefaultSelected: false,
      },
      {
        id: `upsell-${Date.now()}-3`,
        title: '3 قطع',
        price: p3,
        originalPrice: basePrice * 3,
        wholesalePrice: wholesale * 3,
        profit: Math.max(0, p3 - wholesale * 3),
        quantity: 3,
        badge: 'الأكثر طلباً 🔥',
        isDefaultSelected: true,
      },
      {
        id: `upsell-${Date.now()}-4`,
        title: '4 قطع',
        price: p4,
        originalPrice: basePrice * 4,
        wholesalePrice: wholesale * 4,
        profit: Math.max(0, p4 - wholesale * 4),
        quantity: 4,
        badge: 'أعلى توفير 🎁',
        isDefaultSelected: false,
      },
    ];
  };

  // UpSell state for creating a new link (defaults to product.upsells or smart tiers)
  const [newLinkUpsells, setNewLinkUpsells] = useState<UpsellOffer[]>(() => {
    if (product.upsells && Array.isArray(product.upsells) && product.upsells.length > 0) {
      return product.upsells;
    }
    return generateSmartBundleOffers(defaultSellingPrice);
  });

  // Dedicated upsells tab target link
  const [upsellTargetLinkId, setUpsellTargetLinkId] = useState<string>(
    () => links[0]?.id || 'link-default'
  );

  // Available unique sizes and colors
  const sizes = Array.from(new Set(product.variants.map((v) => v.size))).filter((s) => !isStandardSize(s));
  const colors = Array.from(new Set(product.variants.map((v) => v.color))).filter((c) => !isStandardColor(c));

  const newProfit = isSupplierUser
    ? Math.max(0, newSellingPrice - supplierPlatformFee)
    : calculateProfit(product.wholesalePrice, newSellingPrice);

  // Helper to get active upsells for a specific link
  const handleGetLinkUpsells = (link: ProductShareLink): UpsellOffer[] => {
    if (linkUpsellDrafts[link.id]) {
      return linkUpsellDrafts[link.id];
    }
    if (link.upsells && Array.isArray(link.upsells) && link.upsells.length > 0) {
      return link.upsells;
    }
    if (product.upsells && Array.isArray(product.upsells) && product.upsells.length > 0) {
      return product.upsells;
    }
    return generateSmartBundleOffers(link.sellingPrice);
  };

  const handleUpdateLinkUpsellField = (
    linkId: string,
    upsellIndex: number,
    field: keyof UpsellOffer,
    val: any
  ) => {
    const link = links.find((l) => l.id === linkId);
    if (!link) return;
    const current = [...handleGetLinkUpsells(link)];
    if (!current[upsellIndex]) return;

    const updatedItem = { ...current[upsellIndex], [field]: val };
    if (field === 'price' || field === 'wholesalePrice') {
      const p = Number(field === 'price' ? val : updatedItem.price) || 0;
      const w = Number(field === 'wholesalePrice' ? val : updatedItem.wholesalePrice) || 0;
      updatedItem.profit = Math.max(0, p - w);
    }

    current[upsellIndex] = updatedItem;
    setLinkUpsellDrafts((prev) => ({ ...prev, [linkId]: current }));
  };

  const handleSaveLinkUpsells = (link: ProductShareLink) => {
    const drafts = handleGetLinkUpsells(link);
    const updated = updateShareLinkUpsells(product.id, link.id, drafts, defaultSellingPrice);
    setLinks(updated);
    setLinkUpsellDrafts((prev) => {
      const copy = { ...prev };
      delete copy[link.id];
      return copy;
    });
    onShowToast(`✨ تم حفظ وربط عروض UpSell للرابط "${link.title || 'الرابط'}" بنجاح!`);
  };

  const handleAddUpsellToLink = (linkId: string) => {
    const link = links.find((l) => l.id === linkId);
    if (!link) return;
    const current = [...handleGetLinkUpsells(link)];
    const price = link.sellingPrice;
    const wholesale = product.wholesalePrice || Math.round(price * 0.6);
    const newOffer: UpsellOffer = {
      id: `upsell-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `عرض إضافي خاص`,
      price: price,
      originalPrice: Math.round(price * 1.3),
      wholesalePrice: wholesale,
      profit: Math.max(0, price - wholesale),
      quantity: 1,
      badge: 'عرض حصري ⚡',
      isDefaultSelected: false,
    };
    setLinkUpsellDrafts((prev) => ({
      ...prev,
      [linkId]: [...current, newOffer],
    }));
  };

  const handleDeleteUpsellFromLink = (linkId: string, upsellIndex: number) => {
    const link = links.find((l) => l.id === linkId);
    if (!link) return;
    const current = handleGetLinkUpsells(link).filter((_, idx) => idx !== upsellIndex);
    setLinkUpsellDrafts((prev) => ({
      ...prev,
      [linkId]: current,
    }));
  };

  const handleResetUpsellsToProduct = (link: ProductShareLink) => {
    const base = product.upsells && product.upsells.length > 0
      ? product.upsells
      : generateSmartBundleOffers(link.sellingPrice);
    const updated = updateShareLinkUpsells(product.id, link.id, base, defaultSellingPrice);
    setLinks(updated);
    setLinkUpsellDrafts((prev) => {
      const copy = { ...prev };
      delete copy[link.id];
      return copy;
    });
    onShowToast('🔄 تم استعادة عروض UpSell الأصلية للمنتج على هذا الرابط.');
  };

  // Generate full Share URL for a specific link with seller tracking parameters
  const getShareUrlForLink = (linkId: string) => {
    const origin = window.location.origin;
    const effectiveSellerId = user?.id || (isSupplierUser ? product.supplierId : '');
    const effectiveSellerName = user?.storeName || user?.fullName || (isSupplierUser ? product.supplierName : '');
    const effectiveSellerEmail = user?.email || (isSupplierUser ? product.supplierEmail : '');
    const effectiveSellerPhone = user?.phone || '';
    const roleParam = isSupplierUser ? '&sellerRole=supplier&isSupplier=true' : '';
    const sellerParams = `&sellerId=${encodeURIComponent(effectiveSellerId || '')}&sellerName=${encodeURIComponent(effectiveSellerName || '')}&sellerPhone=${encodeURIComponent(effectiveSellerPhone || '')}&sellerEmail=${encodeURIComponent(effectiveSellerEmail || '')}${roleParam}`;
    const pixelParams = activePixelOwner
      ? `${activePixelOwner.metaPixelId ? `&fbPixel=${encodeURIComponent(activePixelOwner.metaPixelId)}` : ''}${activePixelOwner.tiktokPixelId ? `&ttPixel=${encodeURIComponent(activePixelOwner.tiktokPixelId)}` : ''}${activePixelOwner.snapchatPixelId ? `&snapPixel=${encodeURIComponent(activePixelOwner.snapchatPixelId)}` : ''}`
      : '';
    return `${origin}/p/${product.id}?linkId=${linkId}${sellerParams}${pixelParams}`;
  };

  // Handle price update directly from list
  const handleSaveLinkPrice = (link: ProductShareLink) => {
    const targetPrice = editedPrices[link.id] ?? link.sellingPrice;
    if (targetPrice < product.wholesalePrice) {
      onShowToast('سعر البيع لا يمكن أن يكون أقل من سعر الجملة!');
      return;
    }

    const updated = updateShareLinkPrice(product.id, link.id, targetPrice, defaultSellingPrice);
    setLinks(updated);
    setEditedPrices((prev) => {
      const copy = { ...prev };
      delete copy[link.id];
      return copy;
    });
    onShowToast(`✔ تم تحديث سعر البيع لـ "${link.title || 'الرابط'}" إلى ${targetPrice.toLocaleString()} دج بنجاح!`);
  };

  // Handle toggle active/disabled status
  const handleToggleLinkActive = (link: ProductShareLink) => {
    const updated = toggleShareLinkActive(product.id, link.id, defaultSellingPrice);
    setLinks(updated);
    const newStatus = updated.find((l) => l.id === link.id)?.active;
    if (newStatus) {
      onShowToast(`🟢 تم تفعيل رابط البيع "${link.title || 'الرابط'}" بنجاح!`);
    } else {
      onShowToast(`🔴 تم تعطيل رابط البيع "${link.title || 'الرابط'}". لن يتمكن العملاء من طلب المنتج عبره.`);
    }
  };

  // Handle delete link
  const handleDeleteLink = (link: ProductShareLink) => {
    if (links.length <= 1) {
      setShowDeleteProductConfirm(true);
      return;
    }
    const updated = deleteShareLink(product.id, link.id, defaultSellingPrice);
    setLinks(updated);
    onShowToast(`🗑️ تم حذف رابط المشاركة بنجاح.`);
  };

  // Delete product completely from links tab
  const handleDeleteProductFromLinks = () => {
    removeProductShareData(product.id);
    onShowToast(`🗑️ تم حذف المنتج "${product.nameAr}" وجميع روابطه بنجاح.`);
    onClose();
  };

  // Create new link
  const handleCreateNewLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSellingPrice < product.wholesalePrice) {
      onShowToast('سعر البيع لا يمكن أن يكون أقل من سعر الجملة!');
      return;
    }

    const titleText = newTitle.trim() || `رابط حملة ${newSellingPrice.toLocaleString()} دج`;
    const updated = saveSingleShareLink(
      {
        productId: product.id,
        title: titleText,
        sellingPrice: newSellingPrice,
        size: newSize,
        color: newColor,
        quantity: newQuantity,
        active: true,
        sellerId: user?.id,
        upsells: newLinkUpsells,
      },
      defaultSellingPrice
    );

    setLinks(updated);
    setNewTitle('');
    setActiveTab('links_list');
    onShowToast(`✨ تم إنشاء وتفعيل رابط مشاركة مخصص جديد: "${titleText}"!`);
  };

  const handleCopyLink = (link: ProductShareLink) => {
    const url = getShareUrlForLink(link.id);
    navigator.clipboard.writeText(url);
    setCopiedLinkId(link.id);
    onShowToast('📋 تم نسخ رابط المنتج بنجاح!');
    setTimeout(() => setCopiedLinkId(null), 3000);
  };

  const handleWhatsApp = (link: ProductShareLink) => {
    const url = getShareUrlForLink(link.id);
    const text = `🔥 شُوف هاد المنتج المميز: ${product.nameAr}\n💰 السعر: ${link.sellingPrice.toLocaleString()} دج\n🛒 اطلب الآن مباشرة والدفع عند الاستلام:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleFacebook = (link: ProductShareLink) => {
    const url = getShareUrlForLink(link.id);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const handlePreviewLink = (link: ProductShareLink) => {
    if (onPreviewCustomerView) {
      onPreviewCustomerView(product, link.id);
    } else {
      const url = getShareUrlForLink(link.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const activeLinksCount = links.filter((l) => l.active).length;
  const disabledLinksCount = links.filter((l) => !l.active).length;
  const averageProfit = links.length > 0
    ? Math.round(
        links.reduce(
          (acc, l) =>
            acc +
            (isSupplierUser
              ? Math.max(0, l.sellingPrice - supplierPlatformFee)
              : calculateProfit(product.wholesalePrice, l.sellingPrice)),
          0
        ) / links.length
      )
    : 0;

  const filteredLinks = links.filter((l) => {
    if (linksFilter === 'active') return l.active;
    if (linksFilter === 'disabled') return !l.active;
    return true;
  });

  const selectedLinkForUpsells = links.find((l) => l.id === upsellTargetLinkId) || links[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-6xl h-[94vh] max-h-[920px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Cockpit */}
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
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                تعديل أسعار البيع، التحكم بهامش الربح، تخصيص صفحة الزبون، وإطلاق الحملات الإعلانية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {links[0] && (
              <button
                type="button"
                onClick={() => handlePreviewLink(links[0])}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/15 cursor-pointer"
                title="معاينة صفحة الزبون الحية"
              >
                <Eye className="w-3.5 h-3.5 text-amber-300" />
                <span>معاينة كزبون</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Split Body: Vertical Sidebar (Right in RTL) + Main Workspace (Left) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* ==================== VERTICAL SIDEBAR ==================== */}
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
                    src={product.images[0]}
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
                        <MoneyText amount={product.wholesalePrice} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Baseline Row */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-400 block text-[10px]">المقترح للبيع:</span>
                    <span className="font-black text-slate-900 dark:text-white font-mono text-xs">
                      <MoneyText amount={defaultSellingPrice} />
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">
                      {isSupplierUser ? 'مستحقاتك كبائع:' : 'ربحك المقترح:'}
                    </span>
                    <span className="font-black font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      +<MoneyText amount={isSupplierUser ? sellerDirectProfit : calculateProfit(product.wholesalePrice, defaultSellingPrice)} />
                    </span>
                  </div>
                </div>

                {/* Quick Image Download */}
                <button
                  type="button"
                  onClick={() => downloadAllImages(product.images, product.nameAr, onShowToast)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-violet-600" />
                  <span>تحميل باقة الصور كاملة ({product.images.length})</span>
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
                  <span className="text-[10px] block">{isSupplierUser ? 'متوسط المستحقات' : 'متوسط الربح'}</span>
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
              </div>
            </div>

            {/* Sidebar Bottom: Tracking Pixels & Safe Product Delete */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                <span className="font-bold block text-slate-700 dark:text-slate-300">
                  ربط البيكسل الإعلاني:
                </span>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={activePixelOwner?.metaPixelId ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    • Meta Pixel {activePixelOwner?.metaPixelId ? '✔' : ''}
                  </span>
                  <span className={activePixelOwner?.tiktokPixelId ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    • TikTok {activePixelOwner?.tiktokPixelId ? '✔' : ''}
                  </span>
                  <span className={activePixelOwner?.snapchatPixelId ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    • Snap {activePixelOwner?.snapchatPixelId ? '✔' : ''}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteProductConfirm(true)}
                className="w-full py-2 px-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border border-rose-200 dark:border-rose-900/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>إزالة المنتج من تبويب الروابط</span>
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
                  {links[0] && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetLink =
                          links.find((l) => l.id === selectedCustomizationLinkId) || links[0];
                        if (targetLink) handlePreviewLink(targetLink);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>معاينة الزبون</span>
                    </button>
                  )}
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
                          ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      المعطلة ({disabledLinksCount})
                    </button>
                  </div>
                </div>

                {/* Empty State */}
                {filteredLinks.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                    <LinkIcon className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-bold">
                      لا توجد روابط تطابق هذا التصنيف حالياً.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('create_link')}
                      className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                    >
                      إنشاء رابط جديد الآن
                    </button>
                  </div>
                ) : (
                  /* Vertical Link Cards */
                  <div className="space-y-3.5">
                    {filteredLinks.map((link) => {
                      const currentPrice = editedPrices[link.id] ?? link.sellingPrice;
                      const isPriceModified =
                        editedPrices[link.id] !== undefined && editedPrices[link.id] !== link.sellingPrice;
                      const linkProfit = isSupplierUser
                        ? Math.max(0, currentPrice - supplierPlatformFee)
                        : calculateProfit(product.wholesalePrice, currentPrice);
                      const shareUrl = getShareUrlForLink(link.id);
                      const isCopied = copiedLinkId === link.id;
                      const linkUpsells = handleGetLinkUpsells(link);
                      const isUpsellOpen = expandedUpsellLinkId === link.id;

                      return (
                        <div
                          key={link.id}
                          className={`p-4 rounded-3xl border transition-all space-y-3.5 ${
                            link.active
                              ? 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 shadow-xs hover:border-violet-300 dark:hover:border-violet-700'
                              : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-80'
                          }`}
                        >
                          {/* Card Top Row: Title, Status, and Controls */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  link.active
                                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}
                              >
                                <Tag className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                    {link.title || 'رابط مشاركة مخصص'}
                                  </h4>
                                  {link.active ? (
                                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 shrink-0">
                                      نشط للبيع ✔
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
                                      معطل مؤقتاً
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                  <span>الكمية: {link.quantity || 1}</span>
                                  <span>·</span>
                                  <span>المقاس: {link.size || 'افتراضي'}</span>
                                  <span>·</span>
                                  <span>اللون: {link.color || 'افتراضي'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Power Toggle & Delete */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleToggleLinkActive(link)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                                  link.active
                                    ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                                    : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900'
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{link.active ? 'تعطيل الرابط' : 'تفعيل للبيع'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteLink(link)}
                                title="حذف هذا الرابط"
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Direct Price & Profit Cockpit */}
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <Edit3 className="w-4 h-4 text-violet-600" />
                                  <span>سعر البيع المباشر للزبون:</span>
                                </label>
                                <div className="relative w-36">
                                  <input
                                    type="number"
                                    value={currentPrice}
                                    onChange={(e) =>
                                      setEditedPrices((prev) => ({
                                        ...prev,
                                        [link.id]: Number(e.target.value),
                                      }))
                                    }
                                    className="w-full p-2 ps-3 pe-8 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-black text-slate-900 dark:text-white text-xs text-start focus:ring-2 focus:ring-violet-500"
                                  />
                                  <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                    دج
                                  </span>
                                </div>

                                {isPriceModified && (
                                  <button
                                    type="button"
                                    onClick={() => handleSaveLinkPrice(link)}
                                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition shadow-xs cursor-pointer active:scale-95"
                                  >
                                    حفظ السعر
                                  </button>
                                )}
                              </div>

                              {/* Calculated Net Profit Indicator */}
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-slate-500 dark:text-slate-400">
                                  {isSupplierUser ? 'مستحقاتك كبائع في القطعة:' : 'صافي ربحك في القطعة:'}
                                </span>
                                <span
                                  className={`font-black font-mono text-sm px-2.5 py-1 rounded-xl ${
                                    linkProfit > 0
                                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                      : 'bg-rose-100 text-rose-700'
                                  }`}
                                >
                                  +<MoneyText amount={linkProfit} />
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* URL Box & 1-Click Action Buttons */}
                          <div className="space-y-2">
                            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2 overflow-hidden">
                              <span className="truncate">{shareUrl}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyLink(link)}
                                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-500 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer shrink-0"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-purple-600" /> : <Copy className="w-3.5 h-3.5 text-violet-500" />}
                                <span>{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                              </button>
                            </div>

                            {/* Share Buttons Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <button
                                type="button"
                                onClick={() => handleWhatsApp(link)}
                                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span>مشاركة واتساب</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleFacebook(link)}
                                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                              >
                                <Facebook className="w-4 h-4" />
                                <span>مشاركة فيسبوك</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePreviewLink(link)}
                                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95"
                              >
                                <Eye className="w-4 h-4 text-violet-600" />
                                <span>معاينة الزبون</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomizationLinkId(link.id);
                                  setActiveTab('customize');
                                }}
                                className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-purple-200 dark:border-purple-800 active:scale-95"
                              >
                                <Palette className="w-4 h-4 text-purple-600" />
                                <span>تخصيص الصفحة</span>
                              </button>
                            </div>
                          </div>

                          {/* Inline UpSell Bundle Accordion */}
                          <div className="rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 overflow-hidden">
                            <div
                              onClick={() => setExpandedUpsellLinkId(isUpsellOpen ? null : link.id)}
                              className="p-3 flex items-center justify-between cursor-pointer select-none hover:bg-purple-100/40 dark:hover:bg-purple-900/30 transition text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-purple-600 fill-current" />
                                <span className="font-black text-slate-900 dark:text-white">
                                  باقات عروض الـ Upsell المرتبطة بالرابط ({linkUpsells.length} عروض)
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-purple-700 dark:text-purple-300 font-bold">
                                <span>{isUpsellOpen ? 'إغلاق الباقات' : 'عرض وتعديل الباقات'}</span>
                                {isUpsellOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>

                            {isUpsellOpen && (
                              <div className="p-3.5 border-t border-purple-200/80 dark:border-purple-900/60 space-y-2.5 bg-white dark:bg-slate-900">
                                <div className="space-y-2">
                                  {linkUpsells.map((upsell, uIdx) => {
                                    const uWholesale = upsell.wholesalePrice || product.wholesalePrice * (upsell.quantity || 1);
                                    const uProfit = Math.max(0, (upsell.price || 0) - uWholesale);

                                    return (
                                      <div
                                        key={upsell.id || uIdx}
                                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-slate-900 dark:text-white">
                                            {upsell.title}
                                          </span>
                                          {upsell.badge && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                              {upsell.badge}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-slate-400">سعر البيع:</span>
                                            <input
                                              type="number"
                                              value={upsell.price}
                                              onChange={(e) =>
                                                handleUpdateLinkUpsellField(link.id, uIdx, 'price', Number(e.target.value))
                                              }
                                              className="w-24 p-1 ps-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                                            />
                                            <span className="text-[10px] text-slate-400">دج</span>
                                          </div>
                                          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 min-w-[80px] text-end font-mono">
                                            ربحك: +<MoneyText amount={uProfit} />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteUpsellFromLink(link.id, uIdx)}
                                            className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                  <button
                                    type="button"
                                    onClick={() => handleAddUpsellToLink(link.id)}
                                    className="px-3 py-1.5 rounded-xl border border-dashed border-purple-300 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>إضافة باقة جديدة</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveLinkUpsells(link)}
                                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-black cursor-pointer shadow-xs"
                                  >
                                    حفظ باقات الرابط
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                        هامش ربحك المحسوب آلياً في القطعة:
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
                      زيادة متوسط قيمة الطلب (AOV) ومضاعفة ربحك عند شراء الزبون لقطعتين أو 3 قطع
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
                          upsell.wholesalePrice || product.wholesalePrice * (upsell.quantity || 1);
                        const uProfit = Math.max(0, (upsell.price || 0) - uWholesale);

                        return (
                          <div
                            key={upsell.id || uIdx}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-slate-900 dark:text-white">
                                  {upsell.title}
                                </span>
                                {upsell.badge && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200">
                                    {upsell.badge}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteUpsellFromLink(selectedLinkForUpsells.id, uIdx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 block">سعر البيع للزبون:</span>
                                <input
                                  type="number"
                                  value={upsell.price}
                                  onChange={(e) =>
                                    handleUpdateLinkUpsellField(
                                      selectedLinkForUpsells.id,
                                      uIdx,
                                      'price',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block">تكلفة الجملة:</span>
                                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300">
                                  <MoneyText amount={uWholesale} />
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 block font-bold">
                                  ربحك الصافي من هذه الباقة:
                                </span>
                                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 font-mono font-black text-purple-700 dark:text-purple-300 text-sm">
                                  +<MoneyText amount={uProfit} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <button
                        type="button"
                        onClick={() => handleAddUpsellToLink(selectedLinkForUpsells.id)}
                        className="px-4 py-2.5 rounded-xl border border-dashed border-purple-400 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة باقة كميات جديدة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveLinkUpsells(selectedLinkForUpsells)}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md cursor-pointer"
                      >
                        حفظ جميع التغييرات
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

                {/* Embedded Marketer Page Customizer */}
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
                    onShowToast('🎉 تم حفظ وتطبيق تخصيصات صفحة الرابط بنجاح!');
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
          </main>
        </div>
      </div>

      {/* Confirmation Modal for Deleting Product from Links */}
      {showDeleteProductConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>إزالة المنتج من تبويب الروابط</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              هل أنت متأكد من رغبتك في إزالة منتج &quot;{product.nameAr}&quot; وكافة الروابط التسويقية التابعة له؟ لن يظهر هذا المنتج في تبويب الروابط بعد الآن.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteProductFromLinks}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد الإزالة</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteProductConfirm(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
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
