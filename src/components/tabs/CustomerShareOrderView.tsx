import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingBag,
  Check,
  ArrowRight,
  ExternalLink,
  Truck,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  Building2,
  PackageCheck,
  Sparkles,
  ShoppingCart,
  RefreshCw,
  X,
  Zap,
  Gift,
  CheckCircle2,
  Tag,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Product, Order, OrderItem } from '../../types';
import { ALGERIA_WILAYAS, getWilayaByCode } from '../../data/algeriaLocations';
import { getStoredProducts } from '../../data/mockProducts';
import { useOrders } from '../../context/OrderContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { MoneyText } from '../ui/MoneyText';
import {
  getProductShareConfig,
  getShareLinkById,
  getMarketerRelatedCrossSellProducts,
  getProductDefaultCustomization,
  CrossSellProductItem,
} from '../../utils/shareUtils';
import {
  VideoEmbedPlayer,
  CustomerReviewsSection,
  FloatingWhatsAppButton,
} from './CustomerShareOrderEnhancements';
import { MarketerCustomization } from '../../types';
import { ProductImageSlider } from '../common/ProductImageSlider';
import { ProductDescriptionView } from '../common/ProductDescriptionView';
import { isStandardSize, isStandardColor } from '../../utils/variantUtils';
import { getStoredMarketplaceFees } from '../../lib/supplierHelper';
import { getStoredSellers } from '../../lib/sellerHelper';
import {
  initAllPixels,
  trackPixelPageView,
  trackPixelViewContent,
  trackPixelInitiateCheckout,
  trackPixelPurchase,
} from '../../lib/pixelTracker';

interface CustomerShareOrderViewProps {
  product: Product;
  onBackToApp: () => void;
  onShowToast: (msg: string) => void;
}

export function CustomerShareOrderView({ product: initialProduct, onBackToApp, onShowToast }: CustomerShareOrderViewProps) {
  const { createOrder } = useOrders();
  const { language } = useLanguage();
  const { user } = useAuth();

  // Keep internal product state live and synchronized with localStorage when seller edits products/upsells
  const [product, setProduct] = useState<Product>(() => {
    const stored = getStoredProducts().find((p) => p.id === initialProduct.id);
    return stored || initialProduct;
  });

  useEffect(() => {
    const syncProduct = () => {
      const stored = getStoredProducts().find((p) => p.id === initialProduct.id);
      if (stored) {
        setProduct(stored);
      }
    };
    window.addEventListener('products_updated', syncProduct);
    window.addEventListener('storage', syncProduct);
    return () => {
      window.removeEventListener('products_updated', syncProduct);
      window.removeEventListener('storage', syncProduct);
    };
  }, [initialProduct.id]);

  const searchParams = new URLSearchParams(window.location.search);
  const linkIdParam = searchParams.get('linkId');
  const sellerIdParam = searchParams.get('sellerId') || searchParams.get('resellerId') || '';
  const sellerNameParam = searchParams.get('sellerName') || searchParams.get('resellerName') || '';
  const sellerPhoneParam = searchParams.get('sellerPhone') || searchParams.get('resellerPhone') || '';
  const sellerEmailParam = searchParams.get('sellerEmail') || searchParams.get('resellerEmail') || '';
  const spParam = searchParams.get('sp') || searchParams.get('price');
  const customSellingPrice = spParam && !isNaN(Number(spParam)) && Number(spParam) > 0 ? Number(spParam) : null;

  const shareLink = getShareLinkById(
    product.id,
    linkIdParam,
    customSellingPrice || product.suggestedSellingPrice || product.wholesalePrice + 1000,
    product.variants[0]?.size || 'Standard',
    product.variants[0]?.color || 'Standard'
  );
  if (customSellingPrice && (!shareLink.sellingPrice || linkIdParam?.startsWith('link-related-') || linkIdParam?.startsWith('link-grossell-'))) {
    shareLink.sellingPrice = customSellingPrice;
  }

  // Guarantee the marketer identity is preserved
  const effectiveSellerId = sellerIdParam || (shareLink as any)?.sellerId || (user?.role === 'reseller' ? user.id : '');
  const effectiveSellerName = sellerNameParam || (user?.role === 'reseller' ? (user.storeName || user.fullName) : '');
  const effectiveSellerPhone = sellerPhoneParam || (user?.role === 'reseller' ? user.phone : '');
  const effectiveSellerEmail = sellerEmailParam || (user?.role === 'reseller' ? user.email : '');

  // Marketer page customization (Differentiating Elements)
  const customization: MarketerCustomization | undefined =
    shareLink.customization || getProductDefaultCustomization(product.id);
  const effectiveButtonColor = customization?.buttonColor || '#fca120';
  const effectiveWhatsAppPhone =
    customization?.whatsappNumber?.trim() ||
    effectiveSellerPhone?.trim() ||
    (user?.phone ? user.phone.trim() : '');

  // Grossell: Find up to 2 related products that have active working links for this marketer
  const [crossSellProducts, setCrossSellProducts] = useState<CrossSellProductItem[]>(() =>
    getMarketerRelatedCrossSellProducts(
      product.id,
      product.categoryAr,
      product.categoryFr,
      effectiveSellerId || undefined
    )
  );
  const [orderedCrossSellIds, setOrderedCrossSellIds] = useState<Set<string>>(new Set());
  const [orderingCrossSellId, setOrderingCrossSellId] = useState<string | null>(null);

  // Re-sync cross sell products if storage or links change
  useEffect(() => {
    const refreshCrossSell = () => {
      const items = getMarketerRelatedCrossSellProducts(
        product.id,
        product.categoryAr,
        product.categoryFr,
        effectiveSellerId || undefined
      );
      setCrossSellProducts(items);
    };

    refreshCrossSell();
    window.addEventListener('storage', refreshCrossSell);
    window.addEventListener('marketed_products_updated', refreshCrossSell);
    return () => {
      window.removeEventListener('storage', refreshCrossSell);
      window.removeEventListener('marketed_products_updated', refreshCrossSell);
    };
  }, [product.id, product.categoryAr, product.categoryFr, effectiveSellerId]);

  const [activeImage, setActiveImage] = useState(product.images[0] || '');
  const [selectedSize, setSelectedSize] = useState(shareLink.size);
  const [selectedColor, setSelectedColor] = useState(shareLink.color);

  // Variant color image state & synchronization with slider
  const [selectedColorImage, setSelectedColorImage] = useState<string | undefined>(() => {
    const initialColor = shareLink.color;
    if (initialColor) {
      return (
        product.colorImages?.[initialColor.trim()] ||
        product.variants?.find((v) => v.color?.trim() === initialColor.trim() && v.image)?.image
      );
    }
    return undefined;
  });

  const allGalleryImages = useMemo(() => {
    const list: string[] = [];
    if (customization?.customMainImages && customization.customMainImages.length > 0) {
      list.push(...customization.customMainImages);
    }
    (product.images || []).forEach((img) => {
      if (!list.includes(img)) {
        list.push(img);
      }
    });
    if (product.variants) {
      product.variants.forEach((v) => {
        if (v.image && !list.includes(v.image)) {
          list.push(v.image);
        }
      });
    }
    if (product.colorImages) {
      Object.values(product.colorImages).forEach((img) => {
        if (typeof img === 'string' && img && !list.includes(img)) {
          list.push(img);
        }
      });
    }
    return list;
  }, [product.images, product.variants, product.colorImages, customization?.customMainImages]);

  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    const colorImg =
      product.colorImages?.[colorName.trim()] ||
      product.variants?.find((v) => v.color?.trim() === colorName.trim() && v.image)?.image;
    if (colorImg) {
      setSelectedColorImage(colorImg);
    }
  };

  // Helper to extract numerical count from Arabic or number text
  const parseQuantityFromTitle = (title: string): number => {
    if (!title) return 1;
    const lower = title.toLowerCase();
    if (lower.includes('واحد') || lower.includes('1')) return 1;
    if (lower.includes('قطعتين') || lower.includes('اثنين') || lower.includes('2')) return 2;
    if (lower.includes('ثلاث') || lower.includes('3')) return 3;
    if (lower.includes('أربع') || lower.includes('اربع') || lower.includes('4')) return 4;
    if (lower.includes('خمس') || lower.includes('5')) return 5;
    if (lower.includes('ست') || lower.includes('6')) return 6;
    if (lower.includes('سبع') || lower.includes('7')) return 7;
    if (lower.includes('ثمان') || lower.includes('8')) return 8;
    if (lower.includes('تسع') || lower.includes('9')) return 9;
    if (lower.includes('عشر') || lower.includes('10')) return 10;
    return 1;
  };

  const [quantity, setQuantity] = useState(shareLink.quantity || 1);
  const sellingPrice = shareLink.sellingPrice;

  // Available Upsell Offers (from link custom upsells, product upsells, or smart generated bundles)
  const availableUpsells = useMemo(() => {
    // 1. Custom UpSells configured specifically for this link by the seller
    if (shareLink.upsells && Array.isArray(shareLink.upsells) && shareLink.upsells.length > 0) {
      return shareLink.upsells;
    }
    // 2. UpSells configured by the seller/supplier on the product
    if (product.upsells && Array.isArray(product.upsells) && product.upsells.length > 0) {
      return product.upsells;
    }
    // 3. Fallback smart tiers based on link selling price
    const p1 = shareLink.sellingPrice;
    const p2 = Math.round((p1 * 2 * 0.88) / 50) * 50;
    const p3 = Math.round((p1 * 3 * 0.80) / 50) * 50;
    const p4 = Math.round((p1 * 4 * 0.72) / 50) * 50;
    const wholesale = product.wholesalePrice || Math.round(p1 * 0.6);

    return [
      {
        id: `tier-qty-1`,
        title: 'قطعة واحدة',
        price: p1,
        wholesalePrice: wholesale,
        profit: Math.max(0, p1 - wholesale),
        quantity: 1,
        isDefaultSelected: false,
      },
      {
        id: `tier-qty-2`,
        title: 'قطعتين',
        price: p2,
        originalPrice: p1 * 2,
        wholesalePrice: wholesale * 2,
        profit: Math.max(0, p2 - wholesale * 2),
        quantity: 2,
        badge: 'توفير 12%',
        isDefaultSelected: false,
      },
      {
        id: `tier-qty-3`,
        title: '3 قطع',
        price: p3,
        originalPrice: p1 * 3,
        wholesalePrice: wholesale * 3,
        profit: Math.max(0, p3 - wholesale * 3),
        quantity: 3,
        badge: 'الأكثر طلباً 🔥',
        isDefaultSelected: true,
      },
      {
        id: `tier-qty-4`,
        title: '4 قطع',
        price: p4,
        originalPrice: p1 * 4,
        wholesalePrice: wholesale * 4,
        profit: Math.max(0, p4 - wholesale * 4),
        quantity: 4,
        badge: 'أعلى توفير 🎁',
        isDefaultSelected: false,
      },
    ];
  }, [shareLink.upsells, shareLink.sellingPrice, product.upsells, product.wholesalePrice]);

  // Selected UpSell ID
  const [selectedUpsellId, setSelectedUpsellId] = useState<string>(() => {
    const list = shareLink.upsells?.length ? shareLink.upsells : (product.upsells?.length ? product.upsells : null);
    if (list && list.length > 0) {
      const def = list.find((u) => u.isDefaultSelected);
      if (def) return def.id;
      return list[0]?.id || '';
    }
    return 'tier-qty-3';
  });

  // Keep selectedUpsellId valid and in sync whenever availableUpsells changes
  useEffect(() => {
    if (availableUpsells.length > 0) {
      const exists = availableUpsells.some((u) => u.id === selectedUpsellId);
      if (!exists) {
        const def = availableUpsells.find((u) => u.isDefaultSelected) || availableUpsells[0];
        if (def) {
          setSelectedUpsellId(def.id);
          const q = def.quantity || parseQuantityFromTitle(def.title);
          if (q) setQuantity(q);
        }
      }
    }
  }, [availableUpsells, selectedUpsellId]);

  const activeUpsell = availableUpsells.find((u) => u.id === selectedUpsellId) || availableUpsells[0];

  const effectiveQuantity = activeUpsell
    ? (activeUpsell.quantity || parseQuantityFromTitle(activeUpsell.title) || quantity)
    : quantity;
  const effectiveProductPrice = activeUpsell ? Number(activeUpsell.price) : (sellingPrice * quantity);
  const effectiveProfit = activeUpsell
    ? (Number(activeUpsell.profit) || Math.max(0, effectiveProductPrice - ((activeUpsell.wholesalePrice || product.wholesalePrice) * effectiveQuantity)))
    : ((sellingPrice - product.wholesalePrice) * quantity);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [selectedWilayaCode, setSelectedWilayaCode] = useState('16');
  const [commune, setCommune] = useState('باب الزوار');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'office'>('home');
  const [codeStopdesk, setCodeStopdesk] = useState('16A');
  const [echange, setEchange] = useState<number>(0);
  const [noteFournisseur, setNoteFournisseur] = useState('');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  const activeWilaya = getWilayaByCode(selectedWilayaCode);
  const shippingFee = deliveryType === 'home' ? activeWilaya.homeFee : activeWilaya.officeFee;
  
  const totalAmount = effectiveProductPrice + shippingFee;
  const feeSettings = getStoredMarketplaceFees();
  const resellerFeeRate = feeSettings.resellerFeePercent || 0;
  const grossProfit = Math.max(0, effectiveProfit);
  const platformResellerCut = Math.round((grossProfit * resellerFeeRate) / 100);
  const totalProfit = Math.max(0, grossProfit - platformResellerCut);

  // Social Media Pixel Configuration & Auto-Tracking
  const fbPixelParam = searchParams.get('fbPixel') || searchParams.get('metaPixel') || '';
  const ttPixelParam = searchParams.get('ttPixel') || searchParams.get('tiktokPixel') || '';
  const snapPixelParam = searchParams.get('snapPixel') || searchParams.get('snapchatPixel') || '';

  // Match marketer profile from storage if pixel IDs are not in URL parameters
  const matchedSeller = useMemo(() => {
    if (user && user.role === 'reseller' && (user.id === effectiveSellerId || !effectiveSellerId)) {
      return user;
    }
    const sellers = getStoredSellers();
    return sellers.find(
      (s) =>
        (effectiveSellerId && s.id === effectiveSellerId) ||
        (effectiveSellerPhone && s.phone === effectiveSellerPhone) ||
        (effectiveSellerEmail && s.email?.toLowerCase() === effectiveSellerEmail.toLowerCase())
    );
  }, [user, effectiveSellerId, effectiveSellerPhone, effectiveSellerEmail]);

  const resolvedMetaPixel = fbPixelParam || matchedSeller?.metaPixelId || '';
  const resolvedTikTokPixel = ttPixelParam || matchedSeller?.tiktokPixelId || '';
  const resolvedSnapchatPixel = snapPixelParam || matchedSeller?.snapchatPixelId || '';

  // 1. Initialize Pixels & Fire PageView + ViewContent
  useEffect(() => {
    if (resolvedMetaPixel || resolvedTikTokPixel || resolvedSnapchatPixel) {
      initAllPixels({
        metaPixelId: resolvedMetaPixel,
        tiktokPixelId: resolvedTikTokPixel,
        snapchatPixelId: resolvedSnapchatPixel,
      });
      trackPixelPageView();
      trackPixelViewContent({
        productId: product.id,
        productName: product.nameAr,
        category: product.categoryAr,
        price: effectiveProductPrice,
      });
    }
  }, [
    resolvedMetaPixel,
    resolvedTikTokPixel,
    resolvedSnapchatPixel,
    product.id,
    product.nameAr,
    product.categoryAr,
    effectiveProductPrice,
  ]);

  // 2. InitiateCheckout tracking (fired once upon customer interaction with checkout)
  const hasTrackedCheckoutRef = useRef(false);
  const triggerInitiateCheckout = () => {
    if (hasTrackedCheckoutRef.current) return;
    hasTrackedCheckoutRef.current = true;
    trackPixelInitiateCheckout({
      productId: product.id,
      productName: product.nameAr,
      price: effectiveProductPrice,
      quantity: effectiveQuantity,
    });
  };

  if (!shareLink.active) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
            ⚠️
          </div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {language === 'ar' ? 'رابط الطلب غير متوفر حالياً' : 'Lien non disponible'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {language === 'ar'
              ? 'عذراً، تم تعطيل هذا الرابط المخصص أو انتهاء فترة العرض الخاصة به من قبل البائع. يرجى التواصل مع البائع للحصول على رابط جديد.'
              : 'Ce lien a été désactivé par le vendeur.'}
          </p>
          <button
            onClick={onBackToApp}
            className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
          >
            {language === 'ar' ? 'العودة إلى المنصة' : 'Retour'}
          </button>
        </div>
      </div>
    );
  }

  const availableSizes: string[] = Array.from(new Set(product.variants.map((v) => v.size))).filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0 && !isStandardSize(s)
  );
  const availableColors: string[] = Array.from(new Set(product.variants.map((v) => v.color))).filter(
    (c): c is string => typeof c === 'string' && c.trim().length > 0 && !isStandardColor(c)
  );
  const hasSpecs = availableSizes.length > 0 || availableColors.length > 0;

  const handleConfirmOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerInitiateCheckout();

    if (!customerName.trim()) {
      onShowToast('يرجى إدخال الاسم واللقب لتقديم الطلب');
      const el = document.getElementById('customer-name-input');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }
    if (!phone.trim() || phone.length < 9) {
      onShowToast('يرجى إدخال رقم هاتف صحيح متكون من 10 أرقام');
      const el = document.getElementById('customer-phone-input');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }

    setIsSubmitting(true);
    const effectiveCodeStopdesk = codeStopdesk || `${activeWilaya.code}A`;

    const upsellNoteSummary = activeUpsell
      ? ` + [عرض التوفير المختار: ${activeUpsell.title} (${activeUpsell.price} دج)]`
      : '';

    const orderPayload: Partial<Order> = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      phone2: phone2.trim(),
      wilaya: activeWilaya.nameAr,
      wilayaCode: activeWilaya.code,
      commune: commune.trim(),
      address: address.trim(),
      deliveryType,
      stopdesk: deliveryType === 'office' ? 1 : 0,
      codeStopdesk: deliveryType === 'office' ? effectiveCodeStopdesk : '',
      echange,
      refArticle: `REF-${product.id}`,
      noteFournisseur: `${noteFournisseur.trim()}${upsellNoteSummary}`.trim(),
      idExterne: `ORD-LINK-${Math.floor(1000 + Math.random() * 9000)}`,
      items: [
        {
          productId: product.id,
          productName: activeUpsell ? `${product.nameAr} - [${activeUpsell.title}]` : product.nameAr,
          productImage: activeImage || product.images[0],
          variantSize: selectedSize,
          variantColor: selectedColor,
          quantity: effectiveQuantity,
          wholesalePrice: activeUpsell?.wholesalePrice || product.wholesalePrice,
          sellingPrice: effectiveProductPrice,
          profit: effectiveProfit,
          isUpsell: !!activeUpsell,
          upsellOfferId: activeUpsell?.id,
        },
      ],
      totalAmount,
      shippingFee,
      totalProfit, // Reseller net profit credited
      grossProfit,
      platformResellerFee: platformResellerCut,
      resellerFeePercent: resellerFeeRate,
      resellerId: effectiveSellerId || undefined,
      resellerName: effectiveSellerName || undefined,
      resellerPhone: effectiveSellerPhone || undefined,
      resellerEmail: effectiveSellerEmail || undefined,
      status: 'LINK_ORDER' as any,
      statusAr: 'طلب من الرابط',
      statusFr: 'Commande par lien',
      situation: 'طلب من الرابط',
      source: 'LINK',
      adminConfirmed: false,
      isLockedForEdit: false,
    };

    try {
      await createOrder(orderPayload);
      setIsSubmitting(false);
      setIsSubmitted(true);

      // Track Pixel Purchase for Primary Order
      trackPixelPurchase({
        orderId: orderPayload.idExterne || `ORD-${Date.now()}`,
        productId: product.id,
        productName: activeUpsell ? `${product.nameAr} - [${activeUpsell.title}]` : product.nameAr,
        totalAmount,
        quantity: effectiveQuantity,
      });

      onShowToast('🎉 تم إرسال طلبك بنجاح! سنتصل بك قريباً لتأكيد الطلب.');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      onShowToast('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
    }
  };

  const handleOrderCrossSellProduct = async (item: CrossSellProductItem) => {
    if (orderedCrossSellIds.has(item.product.id) || orderingCrossSellId) return;

    setOrderingCrossSellId(item.product.id);
    const crossSellingPrice = item.activeLink.sellingPrice;
    const crossWholesalePrice = item.product.wholesalePrice;
    const grossCrossProfit = Math.max(0, crossSellingPrice - crossWholesalePrice);
    const crossPlatformCut = Math.round((grossCrossProfit * resellerFeeRate) / 100);
    const crossNetProfit = Math.max(0, grossCrossProfit - crossPlatformCut);

    const crossOrderPayload: Partial<Order> = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      phone2: phone2.trim(),
      wilaya: activeWilaya.nameAr,
      wilayaCode: activeWilaya.code,
      commune: commune.trim(),
      address: address.trim(),
      deliveryType,
      stopdesk: deliveryType === 'office' ? 1 : 0,
      codeStopdesk: deliveryType === 'office' ? (codeStopdesk || `${activeWilaya.code}A`) : '',
      echange: 0,
      refArticle: `REF-${item.product.id}`,
      noteFournisseur: `[طلب منتج إضافي مدمج مع الشحنة: ${phone.trim()}]`.trim(),
      idExterne: `ORD-EXTRA-${Math.floor(1000 + Math.random() * 9000)}`,
      items: [
        {
          productId: item.product.id,
          productName: item.product.nameAr,
          productImage: item.product.images[0],
          variantSize: item.activeLink.size || item.product.variants[0]?.size || 'Standard',
          variantColor: item.activeLink.color || item.product.variants[0]?.color || 'Standard',
          quantity: 1,
          wholesalePrice: crossWholesalePrice,
          sellingPrice: crossSellingPrice,
          profit: crossNetProfit,
          isCrossSell: true,
        },
      ],
      totalAmount: crossSellingPrice,
      shippingFee: 0, // Free combined shipping with existing order
      totalProfit: crossNetProfit, // Credited net to the SAME reseller
      grossProfit: grossCrossProfit,
      platformResellerFee: crossPlatformCut,
      resellerFeePercent: resellerFeeRate,
      resellerId: effectiveSellerId || undefined,
      resellerName: effectiveSellerName || undefined,
      resellerPhone: effectiveSellerPhone || undefined,
      resellerEmail: effectiveSellerEmail || undefined,
      status: 'LINK_ORDER' as any,
      statusAr: 'طلب من الرابط (منتج إضافي)',
      statusFr: 'Commande Produit Complémentaire',
      situation: 'طلب من الرابط (منتج إضافي)',
      source: 'LINK',
      adminConfirmed: false,
      isLockedForEdit: false,
    };

    try {
      await createOrder(crossOrderPayload);
      setOrderedCrossSellIds((prev) => new Set(prev).add(item.product.id));

      // Track Pixel Purchase for Cross-Sell item
      trackPixelPurchase({
        orderId: crossOrderPayload.idExterne || `ORD-CROSS-${Date.now()}`,
        productId: item.product.id,
        productName: item.product.nameAr,
        totalAmount: crossSellingPrice,
        quantity: 1,
      });

      onShowToast(`🎉 رائع! تمت إضافة "${item.product.nameAr}" لطلبيتك بنجاح وبنفس الشحنة!`);
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء إضافة المنتج، يرجى المحاولة مرة أخرى.');
    } finally {
      setOrderingCrossSellId(null);
    }
  };

  const getCrossSellShareUrl = (item: CrossSellProductItem) => {
    if (typeof window === 'undefined') return '#';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const params = new URLSearchParams();
    params.set('share', item.product.id);
    if (item.activeLink?.id && !item.activeLink.id.startsWith('link-grossell-') && !item.activeLink.id.startsWith('link-related-')) {
      params.set('linkId', item.activeLink.id);
    }
    if (item.activeLink?.sellingPrice) {
      params.set('sp', String(item.activeLink.sellingPrice));
    }
    if (effectiveSellerId) params.set('sellerId', effectiveSellerId);
    if (effectiveSellerName) params.set('sellerName', effectiveSellerName);
    if (effectiveSellerPhone) params.set('sellerPhone', effectiveSellerPhone);
    if (effectiveSellerEmail) params.set('sellerEmail', effectiveSellerEmail);
    if (resolvedMetaPixel) params.set('fbPixel', resolvedMetaPixel);
    if (resolvedTikTokPixel) params.set('ttPixel', resolvedTikTokPixel);
    if (resolvedSnapchatPixel) params.set('snapPixel', resolvedSnapchatPixel);
    return `${origin}${pathname}?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-32 sm:pb-36">
      {/* Top Header - Hidden on Thank You page to protect seller dashboard privacy */}
      {!isSubmitted && (
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center text-center">
            <p className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
              <span>توصيل سريع لكافة الولايات 🚚</span>
            </p>
          </div>
        </header>
      )}

      <main className="max-w-lg mx-auto px-3.5 sm:px-4 py-4 space-y-4">
        {isSubmitted ? (
          /* Confirmation Success Card */
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5 animate-fade-in my-4">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-purple-50 dark:ring-purple-900/30">
              <PackageCheck className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">تم استلام طلبك بنجاح! 🎉</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                شكراً لثقتك بنا! سنتصل بك هاتفياً على الرقم{' '}
                <span className="font-black text-purple-600 dark:text-purple-400 font-mono text-sm underline">{phone}</span> لتأكيد موعد التسليم والعنوان.
              </p>
            </div>

            {/* Order Brief Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-start space-y-2.5">
              <div className="flex justify-between items-center font-extrabold text-slate-800 dark:text-slate-200">
                <span>المنتج:</span>
                <span className="text-slate-900 dark:text-white">{product.nameAr}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>المواصفات والكمية:</span>
                <span className="font-bold">
                  {selectedSize} / {selectedColor} {activeUpsell ? `[${activeUpsell.title}]` : `(x${quantity})`}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>مكان والتوصيل:</span>
                <span className="font-bold">
                  {activeWilaya.nameAr} ({deliveryType === 'home' ? 'للمنزل' : 'للمكتب Stopdesk'})
                </span>
              </div>

              {activeUpsell && (
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-purple-800 dark:text-purple-300 font-black">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>عرض التوفير المختار:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white mr-1">{activeUpsell.title}</span>
                  </span>
                  <span className="font-mono font-black text-purple-700 dark:text-purple-300">
                    <MoneyText amount={effectiveProductPrice} />
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center font-black text-sm text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2.5">
                <span>المبلغ الإجمالي عند الاستلام:</span>
                <span className="text-purple-600 dark:text-purple-400 text-base">
                  <MoneyText amount={totalAmount} />
                </span>
              </div>
            </div>

            {/* Related Products Suggestions: Up to 2 related active products */}
            {crossSellProducts.length > 0 && (
              <div className="pt-2 text-start space-y-3 animate-fade-in">
                {/* Header Banner */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-600/10 to-indigo-600/15 border border-amber-500/30 dark:border-amber-500/40 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-700 dark:text-amber-400">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                      منتجات مقترحة ومختارة لك 🎁 (عروض حصرية)
                    </span>
                    <span className="text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                      شحن مدمج مجاني 🚚
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    بما أنك أتممت طلبك بنجاح، يمكنك إضافة أحد هذه المنتجات المقترحة ذات الصلة إلى نفس شحنتك بضغطة زر واحدة مع شحن مدمج دون دفع أي مصاريف شحن إضافية!
                  </p>
                </div>

                {/* The Up to 2 Related Products */}
                <div className="space-y-3">
                  {crossSellProducts.map((cross) => {
                    const isOrdered = orderedCrossSellIds.has(cross.product.id);
                    const isSubmittingThis = orderingCrossSellId === cross.product.id;
                    const crossShareUrl = getCrossSellShareUrl(cross);

                    return (
                      <div
                        key={cross.product.id}
                        className={`p-3.5 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-800/90 shadow-sm flex flex-col sm:flex-row gap-3.5 items-start sm:items-center justify-between ${
                          isOrdered
                            ? 'border-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/30 ring-1 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500/60'
                        }`}
                      >
                        {/* Product Image & Info */}
                        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                          <a
                            href={crossShareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-700 block group"
                            title="عرض تفاصيل المنتج"
                          >
                            <img
                              src={cross.product.images[0] || 'https://via.placeholder.com/150'}
                              alt={cross.product.nameAr}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              loading="lazy"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-slate-900 font-black text-[8px] text-center py-0.5 shadow-2xs">
                              عرض خاص ✨
                            </span>
                          </a>

                          <div className="min-w-0 flex-1 space-y-1 text-right">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                {cross.product.categoryAr}
                              </span>
                              {cross.isSameCategory ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                                  من نفس التشكيلة 🎯
                                </span>
                              ) : cross.product.isBestSeller ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400">
                                  الأكثر مبيعاً 🔥
                                </span>
                              ) : null}
                            </div>

                            <a
                              href={crossShareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1 leading-snug hover:text-amber-600 dark:hover:text-amber-400 transition block"
                            >
                              {cross.product.nameAr}
                            </a>

                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                                <MoneyText amount={cross.activeLink.sellingPrice} />
                              </span>
                              {cross.activeLink.size && cross.activeLink.size !== 'Standard' && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                  ({cross.activeLink.size})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60">
                          {/* View details link */}
                          <a
                            href={crossShareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            title="مشاهدة تفاصيل المنتج الكاملة"
                          >
                            <span>عرض التفاصيل</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          {/* Quick 1-Click Order Button */}
                          {isOrdered ? (
                            <div className="py-2 px-3.5 rounded-xl bg-emerald-600 text-white text-[11px] font-black flex items-center gap-1.5 shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تمت الإضافة للطلب ✓</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOrderCrossSellProduct(cross)}
                              disabled={isSubmittingThis || Boolean(orderingCrossSellId)}
                              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white text-[11px] font-black transition shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                            >
                              {isSubmittingThis ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>جاري الإضافة...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                  <span>أضف للطلب فوراً ⚡</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.close();
                  }
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>إغلاق الصفحة</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Customer Order Form */
          <form id="customer-order-form" onSubmit={handleConfirmOrder} className="space-y-4">
            {/* 1. Product Gallery Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <ProductImageSlider
                images={allGalleryImages}
                selectedImage={selectedColorImage}
                alt={product.nameAr}
                aspectRatio="aspect-4/3 sm:aspect-square"
                showDownloadBtn={false}
                badge={
                  <span className="bg-purple-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md">
                    متوفر جاهز للشحن ⚡
                  </span>
                }
              />

              {/* Name */}
              <div className="pt-1">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                  {product.nameAr}
                </h2>
              </div>
            </div>

            {/* Marketer Video UGC / Reels Embed (Differentiating Element) */}
            {customization?.videoUrl && (
              <VideoEmbedPlayer
                url={customization.videoUrl}
                title={customization.videoTitle}
              />
            )}

            {/* 2. Unified High-Converting Checkout Section:
                (اختر المقاس + اختر اللون + الكمية + عرض Upsell ان وجد + فورم الطلب + طريقة التوصيل + ملخص الطلبية) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border-2 border-purple-500/30 dark:border-purple-500/40 shadow-xl shadow-purple-500/5 space-y-5">
              {/* Step 1: اختر المقاس + اختر اللون + الكمية المطلوبة */}
              <div className="space-y-3.5">
                {(availableSizes.length > 0 || availableColors.length > 0) && (
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-xs">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-black">
                      1
                    </span>
                    <span>حدد خيارات المنتج:</span>
                  </div>
                )}

                {/* اختر المقاس */}
                {availableSizes.length > 0 && (
                  <div className="space-y-2 bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        اختر المقاس: <span className="text-purple-600 dark:text-purple-400 font-black">{selectedSize}</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">انقر لتحديد المقاس</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`min-h-[42px] min-w-[50px] px-4 py-2 rounded-xl font-black text-xs border transition-all cursor-pointer flex items-center justify-center ${
                            selectedSize === sz
                              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25 ring-2 ring-purple-500/30 scale-[1.02]'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-300'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* اختر اللون */}
                {availableColors.length > 0 && (
                  <div className="space-y-2 bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        اختر اللون: <span className="text-purple-600 dark:text-purple-400 font-black">{selectedColor}</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">انقر لتحديد اللون</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((cl) => {
                        const colorKey = typeof cl === 'string' ? cl.trim() : '';
                        const clImg =
                          (colorKey && product.colorImages?.[colorKey]) ||
                          product.variants?.find((v) => typeof v.color === 'string' && v.color.trim() === colorKey && v.image)?.image;
                        const clHex = product.variants?.find((v) => typeof v.color === 'string' && v.color.trim() === colorKey)?.colorHex;
                        const isSelected = selectedColor === cl;

                        return (
                          <button
                            key={cl}
                            type="button"
                            onClick={() => handleSelectColor(String(cl))}
                            className={`min-h-[42px] px-3.5 py-1.5 rounded-2xl font-black text-xs border transition-all cursor-pointer flex items-center gap-2 ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25 ring-2 ring-purple-500/30 scale-[1.02]'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-purple-300'
                            }`}
                          >
                            {clImg ? (
                              <img
                                src={clImg}
                                alt={cl}
                                className={`w-6 h-6 rounded-md object-cover border transition ${
                                  isSelected ? 'border-white ring-1 ring-white/60' : 'border-slate-200 dark:border-slate-600'
                                }`}
                              />
                            ) : clHex ? (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs inline-block shrink-0"
                                style={{ backgroundColor: clHex }}
                              />
                            ) : null}
                            <span>{cl}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* الكمية المطلوبة - تخفى تلقائياً في حال وجود عروض وباقات توفير */}
                {availableUpsells.length === 0 && (
                  <div className="flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">الكمية المطلوبة:</span>
                      <span className="text-[10px] text-slate-400 font-medium">حدد عدد القطع التي تريدها</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 shadow-xs active:scale-95 text-slate-900 dark:text-white font-black text-base flex items-center justify-center transition cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-black text-base text-slate-900 dark:text-white font-mono">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 shadow-xs active:scale-95 text-slate-900 dark:text-white font-black text-base flex items-center justify-center transition cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: عرض الـ Upsell إن وجد */}
              {availableUpsells.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-black">
                        2
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        اختر الباقة والعرض المناسب:
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/50 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>عروض خاصة</span>
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {availableUpsells.map((upsell) => {
                      const isSelected = selectedUpsellId === upsell.id;
                      const priceNum = Number(upsell.price) || 0;

                      return (
                        <div
                          key={upsell.id}
                          onClick={() => {
                            setSelectedUpsellId(upsell.id);
                            const q = upsell.quantity || parseQuantityFromTitle(upsell.title);
                            if (q) setQuantity(q);
                          }}
                          className={`relative w-full rounded-2xl py-3.5 px-4 sm:px-5 transition-all duration-200 cursor-pointer select-none flex items-center justify-between border-2 ${
                            isSelected
                              ? 'border-[#7c3aed] dark:border-[#8b5cf6] bg-purple-50/30 dark:bg-purple-950/30 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          {isSelected && (
                            <div
                              className="absolute -top-2.5 -right-2 w-6 h-6 rounded-full bg-[#7c3aed] text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 z-10 animate-in zoom-in-75 duration-150"
                              aria-hidden="true"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}

                          <div className="flex flex-col items-start font-mono text-left">
                            <span
                              className={`text-base sm:text-xl font-black transition-colors ${
                                isSelected
                                  ? 'text-[#7c3aed] dark:text-purple-400'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {priceNum} دج
                            </span>
                            {upsell.originalPrice && Number(upsell.originalPrice) > priceNum && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {upsell.originalPrice} دج
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-right">
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2">
                                {upsell.badge && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                    {upsell.badge}
                                  </span>
                                )}
                                <span
                                  className={`text-sm sm:text-base font-extrabold transition-colors ${
                                    isSelected
                                      ? 'text-slate-900 dark:text-white'
                                      : 'text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  {upsell.title}
                                </span>
                              </div>
                              {upsell.description && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium max-w-[200px] sm:max-w-xs truncate">
                                  {upsell.description}
                                </span>
                              )}
                            </div>
                            {upsell.image && (
                              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                                <img src={upsell.image} alt={upsell.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: فورم الطلب (معلومات المشتري والعنوان) */}
              <div id="customer-info-section" className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-xs">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-black">
                    {availableUpsells.length > 0 ? '3' : '2'}
                  </span>
                  <span>معلومات المشتري والعنوان:</span>
                </div>

                {/* الاسم واللقب */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    الاسم واللقب الكامل <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    <input
                      id="customer-name-input"
                      type="text"
                      required
                      value={customerName}
                      onFocus={triggerInitiateCheckout}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        triggerInitiateCheckout();
                      }}
                      placeholder="مثال: محمد بوعلي"
                      className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-800 transition outline-hidden"
                    />
                  </div>
                </div>

                {/* أرقام الهاتف */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      رقم الهاتف الرئيسي <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                      <input
                        id="customer-phone-input"
                        type="tel"
                        required
                        dir="ltr"
                        value={phone}
                        onFocus={triggerInitiateCheckout}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          triggerInitiateCheckout();
                        }}
                        placeholder="06XXXXXXXX"
                        className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-800 transition outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      رقم هاتف ثانٍ (اختياري)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="tel"
                        dir="ltr"
                        value={phone2}
                        onFocus={triggerInitiateCheckout}
                        onChange={(e) => setPhone2(e.target.value)}
                        placeholder="07XXXXXXXX"
                        className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-800 transition outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* الولاية والبلدية */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      الولاية (69 ولاية): <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedWilayaCode}
                      onFocus={triggerInitiateCheckout}
                      onChange={(e) => {
                        triggerInitiateCheckout();
                        const code = e.target.value;
                        setSelectedWilayaCode(code);
                        const w = getWilayaByCode(code);
                        if (w.communes.length > 0) setCommune(w.communes[0]);
                        setCodeStopdesk(`${w.code}A`);
                      }}
                      className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-purple-500 transition outline-hidden"
                    >
                      {ALGERIA_WILAYAS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      البلدية: <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={commune}
                      onChange={(e) => setCommune(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-purple-500 transition outline-hidden"
                    >
                      {activeWilaya.communes.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* العنوان */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">العنوان التفصيلي:</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="اسم الحي، الشارع، أو الشارع المجاور..."
                      className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-purple-500 transition outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: طريقة التوصيل */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-xs">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-black">
                    {availableUpsells.length > 0 ? '4' : '3'}
                  </span>
                  <span>طريقة التوصيل:</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('home')}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                      deliveryType === 'home'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 ring-2 ring-purple-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Truck className="w-5 h-5" />
                    <span>توصيل للمنزل</span>
                    <span className="text-[10px] opacity-90 font-mono">{activeWilaya.homeFee} دج</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('office')}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                      deliveryType === 'office'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 ring-2 ring-purple-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span>استلام من المكتب (Stopdesk)</span>
                    <span className="text-[10px] opacity-90 font-mono">{activeWilaya.officeFee} دج</span>
                  </button>
                </div>

                {deliveryType === 'office' && (
                  <div className="p-2.5 rounded-xl bg-purple-500/10 dark:bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">
                      رمز المكتب (CodeStopdesk):
                    </span>
                    <span className="font-mono font-black text-purple-600 dark:text-purple-400">
                      {codeStopdesk || `${activeWilaya.code}A`} ✓
                    </span>
                  </div>
                )}
              </div>

              {/* ملاحظات خاصة (اختياري) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">ملاحظات خاصة (اختياري):</label>
                <input
                  type="text"
                  value={noteFournisseur}
                  onChange={(e) => setNoteFournisseur(e.target.value)}
                  placeholder="ملاحظات حول التغليف، توقيت الاتصال..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-purple-500 transition outline-hidden"
                />
              </div>

              {/* Step 5: ملخص الطلبية (Order Summary) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-slate-100 dark:border-slate-800/80"
                >
                  <div className="text-amber-500 hover:text-amber-600 transition p-1">
                    {isSummaryExpanded ? (
                      <ChevronUp className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 text-right">
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-[#7c3aed] dark:text-purple-400">
                        ملخص الطلبية النهائي
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block">
                        {effectiveQuantity > 1 ? `${effectiveQuantity} منتجات محددة` : '1 منتج محدد'}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-amber-500 shrink-0">
                      <ShoppingCart className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                </div>

                {isSummaryExpanded && (
                  <div className="space-y-3.5 pt-1">
                    {/* Item row */}
                    <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                          {effectiveProductPrice} دج
                        </span>
                        <span className="bg-[#fca120] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                          {effectiveQuantity}×
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-right min-w-0">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[220px]">
                          {activeUpsell ? `${product.nameAr} (${activeUpsell.title})` : product.nameAr}
                        </span>
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                          <img
                            src={activeImage || product.images[0] || 'https://via.placeholder.com/150'}
                            alt={product.nameAr}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shipping fee */}
                    <div className="flex items-center justify-between px-1">
                      <div>
                        {shippingFee > 0 ? (
                          <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                            {shippingFee} دج
                          </span>
                        ) : (
                          <span className="bg-[#fffbeb] dark:bg-amber-950/50 text-[#d97706] dark:text-amber-400 font-extrabold text-[11px] px-2.5 py-1 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                            اختر الولاية
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          سعر التوصيل
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
                      <div className="bg-[#fffbeb] dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/60 px-3.5 py-1.5 rounded-2xl">
                        <span className="text-base sm:text-xl font-black text-[#fca120] dark:text-amber-400 font-mono">
                          {totalAmount} دج
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                          المجموع الكلي
                        </span>
                        <span className="text-lg" role="img" aria-label="money-bag">
                          💰
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* In-Section Direct Conversion Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: effectiveButtonColor }}
                  className="w-full py-4 px-6 rounded-2xl hover:brightness-95 active:scale-[0.99] text-white font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer transition select-none"
                >
                  <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                  <span>{isSubmitting ? 'جاري تأكيد وإرسال طلبك...' : 'تأكيد الطلب الآن ⚡'}</span>
                </button>
                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>الدفع نقداً عند الاستلام بعد فحص المنتج والتأكد من مطابقته</span>
                </p>
              </div>
            </div>

            {/* Marketer Customer Reviews & Social Proof (Differentiating Element) */}
            {customization?.showReviews !== false && customization?.reviews && customization.reviews.length > 0 && (
              <CustomerReviewsSection reviews={customization.reviews} />
            )}

            {/* 3. Product Description & Full Details (Placed below the unified conversion section) */}
            {((customization?.customDescription || product.descriptionAr) ||
              ((customization?.customDescriptionImages && customization.customDescriptionImages.length > 0) ||
               (product.descriptionImages && product.descriptionImages.length > 0))) && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    تفاصيل ومميزات المنتج
                  </h3>
                </div>
                <ProductDescriptionView
                  description={customization?.customDescription || product.descriptionAr || ''}
                  descriptionImages={
                    customization?.customDescriptionImages && customization.customDescriptionImages.length > 0
                      ? customization.customDescriptionImages
                      : product.descriptionImages
                  }
                  productName={product.nameAr}
                  isLandingPage={true}
                  clickable={false}
                  hideImageHeader={true}
                  className="pt-1"
                />
              </div>
            )}
          </form>
        )}
      </main>

      {/* Floating WhatsApp Quick Contact Button (Differentiating Element) */}
      {!isSubmitted && customization?.showWhatsApp !== false && effectiveWhatsAppPhone && (
        <FloatingWhatsAppButton
          phone={effectiveWhatsAppPhone}
          message={customization?.whatsappMessage}
          productName={product.nameAr}
        />
      )}

      {/* Permanent Sticky Bottom Bar - Amber "اشتري الان" Button visible across both Mobile and Desktop */}
      {!isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 p-3 sm:py-3.5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
          <div className="max-w-lg mx-auto">
            <button
              type="submit"
              form="customer-order-form"
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              style={{ backgroundColor: effectiveButtonColor }}
              className="relative w-full rounded-2xl sm:rounded-3xl py-3.5 sm:py-4 px-4 sm:px-6 hover:brightness-95 active:scale-[0.99] text-white shadow-xl shadow-black/10 transition-all cursor-pointer flex items-center justify-center font-black select-none"
            >
              {/* Top-Left / Start White Price Pill */}
              <div
                style={{ color: effectiveButtonColor }}
                className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-4 bg-white dark:bg-slate-900 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-black text-xs sm:text-sm shadow-xs border border-slate-200 dark:border-slate-800 font-mono flex items-center gap-1"
              >
                <span>{totalAmount}</span>
                <span className="text-[10px] sm:text-xs">دج</span>
              </div>

              <span className="font-black text-lg sm:text-2xl tracking-wide">
                {isSubmitting ? 'جاري إرسال الطلب...' : 'اشتري الان'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

