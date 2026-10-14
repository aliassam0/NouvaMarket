import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Heart,
  SlidersHorizontal,
  Truck,
  CheckCircle2,
  Phone,
  Search,
  ShoppingCart,
  Zap,
  Star,
  Clock,
  Sparkles,
  ArrowRight,
  X,
  Package,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Eye,
  Award,
  BadgePercent,
  Flame,
  Layers,
  MapPin,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  TrendingUp,
  Gift,
  Home,
  RefreshCw,
  ShoppingBag,
  Sliders,
  DollarSign,
  Tag
} from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { getStoredProducts } from '../../data/mockProducts';
import { ALGERIA_WILAYAS, WilayaInfo } from '../../data/algeriaLocations';
import { CustomerShareOrderView } from '../tabs/CustomerShareOrderView';
import { ChangeStoreBannerModal } from './ChangeStoreBannerModal';
import { getProductSlug, findProductBySlugOrId } from '../../utils/shareUtils';
import {
  CrossSellCustomizerModal,
  CrossSellSelectionResult,
} from '../common/CrossSellCustomizerModal';
import { useOrders } from '../../context/OrderContext';
import { useRouter } from '../../router/RouterContext';
import {
  OfficialStoreSettings,
  getOfficialStoreSettings,
} from '../../lib/officialStoreConfig';
import {
  initPixels,
  initMetaPixel,
  initTikTokPixel,
  initSnapchatPixel,
  trackPageView,
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  ActivePixelTarget,
  setActivePixelTarget,
} from '../../lib/pixelTracker';
import { validateAlgerianMobile } from '../../lib/algerianPhoneValidator';
import { checkOrderCooldown, registerOrderCooldown } from '../../lib/orderRateLimiter';

interface SubmittedOrderDetails {
  orderId: string;
  totalAmount: number;
  productId: string;
  productName: string;
  productImage: string;
  categoryAr?: string;
  quantity: number;
  unitPrice: number;
  variantText?: string;
  wilayaName: string;
  wilayaCode: string;
  commune: string;
  address: string;
  deliveryType: 'home' | 'office';
  shippingFee: number;
  phone: string;
  phone2?: string;
  customerName: string;
  bundleTitle?: string;
  addedItems?: Array<{
    productId: string;
    name: string;
    price: number;
    image: string;
  }>;
}

export function OfficialStorePage() {
  const { navigate, searchParams, path } = useRouter();
  const { createOrder } = useOrders();

  // Official Store Dynamic Settings (customized from Admin Panel)
  const [storeSettings, setStoreSettings] = useState<OfficialStoreSettings>(getOfficialStoreSettings);
  const [showBannerModal, setShowBannerModal] = useState(false);

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setStoreSettings(getOfficialStoreSettings());
    };
    window.addEventListener('official_store_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('official_store_settings_updated', handleSettingsUpdate);
  }, []);

  // Strict Pixel Target Scope Resolution (Strict separation: Official Store vs Injected Marketer)
  const officialPixelTarget = useMemo<ActivePixelTarget | null>(() => {
    // If visitor comes specifically through a marketer referral link on official store
    const fbParam = searchParams.get('fbPixel') || searchParams.get('metaPixel');
    const ttParam = searchParams.get('ttPixel') || searchParams.get('tiktokPixel');
    const snapParam = searchParams.get('snapPixel') || searchParams.get('snapchatPixel');

    if (fbParam || ttParam || snapParam) {
      return {
        scope: 'marketer',
        ownerName: searchParams.get('sellerName') || 'مسوق معتمد',
        metaPixelId: fbParam || null,
        tiktokPixelId: ttParam || null,
        snapchatPixelId: snapParam || null,
      };
    }

    // Default: Official Platform Store exclusively
    if (storeSettings.enablePixelTracking) {
      return {
        scope: 'official_store',
        ownerName: 'متجر المنصة Nouva Store',
        metaPixelId: storeSettings.facebookPixelId || null,
        tiktokPixelId: storeSettings.tiktokPixelId || null,
        snapchatPixelId: storeSettings.snapchatPixelId || null,
        googleAnalyticsId: storeSettings.googleAnalyticsId || null,
        testEventCode: storeSettings.testEventCode || null,
      };
    }

    return null;
  }, [storeSettings, searchParams]);

  // Initialize Tracking Pixels on mount and settings change
  useEffect(() => {
    if (officialPixelTarget) {
      setActivePixelTarget(officialPixelTarget);
      trackPageView(storeSettings.storeName || 'Nouva Store | المتجر الرسمي', officialPixelTarget);
    }
  }, [officialPixelTarget, storeSettings.storeName]);

  // Products from platform storage (respecting data preservation rules)
  const [products, setProducts] = useState<Product[]>(() => {
    return getStoredProducts().filter((p) => p.approvalStatus !== 'REJECTED');
  });

  useEffect(() => {
    const handleUpdate = () => {
      setProducts(getStoredProducts().filter((p) => p.approvalStatus !== 'REJECTED'));
    };
    window.addEventListener('products_updated', handleUpdate);
    return () => window.removeEventListener('products_updated', handleUpdate);
  }, []);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'discount'>('featured');

  // Active Product for Landing Page experience
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [bundleOption, setBundleOption] = useState<'single' | 'double' | 'triple'>('double');

  // Checkout Form fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [selectedWilayaCode, setSelectedWilayaCode] = useState('16'); // Default Algiers
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'office'>('home');
  const [notes, setNotes] = useState('');

  // Submission & Thank You Page state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrderInfo, setSubmittedOrderInfo] = useState<SubmittedOrderDetails | null>(null);

  // Grossell (Post-purchase 1-click cross-sell) states
  const [orderedGrossellIds, setOrderedGrossellIds] = useState<Set<string>>(new Set());
  const [orderingGrossellId, setOrderingGrossellId] = useState<string | null>(null);
  const [grossellThankYouMessage, setGrossellThankYouMessage] = useState<string | null>(null);
  const [customizingGrossell, setCustomizingGrossell] = useState<Product | null>(null);

  // Urgency Countdown Timer (ticking seconds for high conversion)
  const [countdown, setCountdown] = useState({ hours: 1, minutes: 47, seconds: 25 });
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 2, minutes: 30, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const orderFormRef = useRef<HTMLDivElement | null>(null);

  // Sync active product from URL path (/store/:productSlug) or query param (?product=id or ?id=...)
  useEffect(() => {
    if (submittedOrderInfo) return;

    // Check pathname: e.g. /store/name-of-product
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    if (currentPath.startsWith('/store/')) {
      const slugOrId = currentPath.replace(/^\/store\//, '').split('/')[0];
      if (slugOrId) {
        const found = findProductBySlugOrId(products, slugOrId);
        if (found) {
          handleOpenLanding(found, false);
          return;
        }
      }
    }

    const paramId = searchParams.get('product') || searchParams.get('id');
    if (paramId) {
      const found = findProductBySlugOrId(products, paramId);
      if (found) {
        handleOpenLanding(found, false);
      }
    } else if (currentPath === '/store' || currentPath === '/store/') {
      // If navigating back to /store, reset active product
      setActiveProduct(null);
    }
  }, [products, searchParams, path]);

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryAr) set.add(p.categoryAr);
    });
    return Array.from(set);
  }, [products]);

  // Filtered & sorted products (respects admin curation)
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (p.isOfficialStoreEnabled === false) return false;
      if (storeSettings.hiddenProductIds?.includes(p.id)) return false;

      const matchSearch =
        !searchQuery ||
        p.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.descriptionAr?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.categoryAr === selectedCategory;
      return matchSearch && matchCat;
    });

    if (sortBy === 'price-asc') {
      result.sort((a, b) => {
        const pA = a.officialStoreRetailPrice || a.suggestedSellingPrice || 0;
        const pB = b.officialStoreRetailPrice || b.suggestedSellingPrice || 0;
        return pA - pB;
      });
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => {
        const pA = a.officialStoreRetailPrice || a.suggestedSellingPrice || 0;
        const pB = b.officialStoreRetailPrice || b.suggestedSellingPrice || 0;
        return pB - pA;
      });
    } else if (sortBy === 'discount') {
      result.sort((a, b) => {
        const pA = a.officialStoreRetailPrice || a.suggestedSellingPrice || 3000;
        const pB = b.officialStoreRetailPrice || b.suggestedSellingPrice || 3000;
        const discA = (a.officialStoreCompareAtPrice || a.ceilingPrice || pA * 1.35) - pA;
        const discB = (b.officialStoreCompareAtPrice || b.ceilingPrice || pB * 1.35) - pB;
        return discB - discA;
      });
    } else {
      // Default: featured first
      result.sort((a, b) => {
        const aFeat = (a.isOfficialStoreFeatured || storeSettings.featuredProductIds?.includes(a.id)) ? 1 : 0;
        const bFeat = (b.isOfficialStoreFeatured || storeSettings.featuredProductIds?.includes(b.id)) ? 1 : 0;
        return bFeat - aFeat;
      });
    }

    return result;
  }, [products, searchQuery, selectedCategory, sortBy, storeSettings]);

  // Selected Wilaya info & shipping fees
  const selectedWilaya: WilayaInfo = useMemo(() => {
    return ALGERIA_WILAYAS.find((w) => w.code === selectedWilayaCode) || ALGERIA_WILAYAS[15]; // Wilaya 16 (Algiers) default
  }, [selectedWilayaCode]);

  // Calculate pricing for active landing product & upsell packages
  const modalPricing = useMemo(() => {
    if (!activeProduct) return { unitPrice: 0, totalItemsPrice: 0, savings: 0, quantity: 1, originalRef: 0 };
    const base = activeProduct.officialStoreRetailPrice || activeProduct.suggestedSellingPrice || 3500;
    const originalRef = activeProduct.officialStoreCompareAtPrice || activeProduct.ceilingPrice || Math.round(base * 1.4);

    const doubleDiscount = ((activeProduct.officialStoreDoubleDiscount ?? storeSettings.doubleItemDiscountPercent) || 15) / 100;
    const tripleDiscount = ((activeProduct.officialStoreTripleDiscount ?? storeSettings.tripleItemDiscountPercent) || 25) / 100;

    if (bundleOption === 'double') {
      // 2 pieces with 15% discount + FREE shipping incentive
      const discountedUnit = Math.round(base * (1 - doubleDiscount));
      const total = discountedUnit * 2;
      const savings = (originalRef * 2) - total;
      return { unitPrice: discountedUnit, totalItemsPrice: total, savings, quantity: 2, originalRef };
    } else if (bundleOption === 'triple') {
      // 3 pieces with 25% discount + FREE shipping incentive
      const discountedUnit = Math.round(base * (1 - tripleDiscount));
      const total = discountedUnit * 3;
      const savings = (originalRef * 3) - total;
      return { unitPrice: discountedUnit, totalItemsPrice: total, savings, quantity: 3, originalRef };
    } else {
      // 1 piece standard
      const savings = originalRef - base;
      return { unitPrice: base, totalItemsPrice: base, savings, quantity: 1, originalRef };
    }
  }, [activeProduct, bundleOption, storeSettings]);

  const shippingCost = useMemo(() => {
    // If bundle is double or triple, grant 100% FREE shipping as high-converting incentive!
    if (bundleOption === 'double' || bundleOption === 'triple') {
      return 0;
    }
    const standardFee = deliveryType === 'office' ? selectedWilaya.officeFee : selectedWilaya.homeFee;
    if (storeSettings.freeShippingThreshold > 0 && modalPricing.totalItemsPrice >= storeSettings.freeShippingThreshold) {
      return 0;
    }
    return standardFee;
  }, [bundleOption, deliveryType, selectedWilaya, storeSettings, modalPricing]);

  const grandTotal = modalPricing.totalItemsPrice + shippingCost;

  // Complementary Cross-Sell products for the Thank You page
  const relatedGrossellProducts = useMemo(() => {
    if (!submittedOrderInfo) return [];
    const others = products.filter(
      (p) => p.id !== submittedOrderInfo.productId && p.isOfficialStoreEnabled !== false
    );
    // Find up to 2 related products
    const sameCategory = others.filter((p) => p.categoryAr === submittedOrderInfo.categoryAr);
    const candidates = sameCategory.length > 0 ? [...sameCategory, ...others] : others;
    const unique = new Map<string, Product>();
    candidates.forEach((p) => {
      if (!unique.has(p.id) && unique.size < 2) {
        unique.set(p.id, p);
      }
    });
    return Array.from(unique.values());
  }, [submittedOrderInfo, products]);

  // Open Product Landing Page
  // Open Product Landing Page with Clean URL: /store/name-of-product
  const handleOpenLanding = (p: Product, updateUrl = true) => {
    if (updateUrl) {
      const slug = getProductSlug(p);
      navigate(`/store/${slug}`);
      return;
    }
    setActiveProduct(p);
    setSelectedVariant(p.variants && p.variants.length > 0 ? p.variants[0] : null);
    setActiveImageIndex(0);
    setBundleOption('double'); // Default to the highest-converting package (2 pieces + free shipping)
    setSubmittedOrderInfo(null);
    setOrderedGrossellIds(new Set());
    setGrossellThankYouMessage(null);

    // Pre-fill commune from selected wilaya
    if (selectedWilaya.communes && selectedWilaya.communes.length > 0) {
      setCommune(selectedWilaya.communes[0]);
    }

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fire Tracking Pixels (strictly targeted to officialPixelTarget)
    trackViewContent(
      {
        id: p.id,
        name: p.nameAr,
        price: p.officialStoreRetailPrice || p.suggestedSellingPrice || 3500,
        category: p.categoryAr || 'عام',
      },
      officialPixelTarget
    );
    trackAddToCart(
      {
        id: p.id,
        name: p.nameAr,
        price: p.officialStoreRetailPrice || p.suggestedSellingPrice || 3500,
        quantity: 1,
      },
      officialPixelTarget
    );
  };

  const handleBackToCatalog = () => {
    setActiveProduct(null);
    setSubmittedOrderInfo(null);
    navigate('/store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCheckout = () => {
    if (activeProduct) {
      trackInitiateCheckout(
        {
          id: activeProduct.id,
          name: activeProduct.nameAr,
          price: modalPricing.unitPrice,
          quantity: modalPricing.quantity,
        },
        grandTotal,
        officialPixelTarget
      );
    }
    if (orderFormRef.current) {
      orderFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Submit Order from Landing Page
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;

    // 1. Check Anti-spam 24-hour cooldown
    const cooldown = checkOrderCooldown();
    if (cooldown.isLocked) {
      alert(cooldown.message || 'لا يمكن تقديم طلب جديد من هذا الجهاز إلا بعد 24 ساعة.');
      return;
    }

    // 2. Strict Algerian Mobile Phone Validation
    const phoneVal = validateAlgerianMobile(phone);
    if (!phoneVal.isValid) {
      alert(phoneVal.errorMessage || 'يرجى إدخال رقم هاتف نقال جزائري صحيح (05 أو 06 أو 07)');
      return;
    }

    if (phone2.trim()) {
      const phone2Val = validateAlgerianMobile(phone2);
      if (!phone2Val.isValid) {
        alert('رقم الهاتف الاحتياطي غير صحيح: ' + phone2Val.errorMessage);
        return;
      }
    }

    const cleanPhone = phoneVal.cleanNumber;

    if (!customerName.trim()) {
      alert('يرجى كتابة الاسم واللقب الكامل');
      return;
    }

    // Fire InitiateCheckout pixel event
    trackInitiateCheckout(
      {
        id: activeProduct.id,
        name: activeProduct.nameAr,
        price: modalPricing.unitPrice,
        quantity: modalPricing.quantity,
      },
      grandTotal,
      officialPixelTarget
    );

    setIsSubmitting(true);

    try {
      const orderQuantity = modalPricing.quantity;
      const orderItem = {
        productId: activeProduct.id,
        productName: activeProduct.nameAr,
        quantity: orderQuantity,
        unitPrice: modalPricing.unitPrice,
        totalPrice: modalPricing.totalItemsPrice,
        variant: selectedVariant ? `${selectedVariant.color} - ${selectedVariant.size}` : undefined,
        image: activeProduct.images?.[0] || '',
      };

      const result = await createOrder({
        customerName: customerName.trim(),
        phone: cleanPhone,
        phone2: phone2.trim() || undefined,
        wilaya: selectedWilaya.nameAr,
        wilayaCode: selectedWilaya.code,
        commune: commune.trim() || selectedWilaya.communes?.[0] || 'المركز',
        address: address.trim() || `بلدية ${commune || 'المركز'}`,
        deliveryType: deliveryType,
        items: [orderItem],
        totalAmount: grandTotal,
        shippingFee: shippingCost,
        totalProfit: Math.max(0, modalPricing.totalItemsPrice - ((activeProduct.wholesalePrice || modalPricing.totalItemsPrice * 0.7) * orderQuantity)),
        isDirectSupplierSale: true,
        source: 'official_store',
        resellerName: 'المتجر الرسمي Nouva Store',
        resellerEmail: 'admin@nouvamarket.com',
        status: 'PENDING',
        statusAr: 'قيد التأكيد (المتجر الرسمي)',
        statusFr: 'En attente de confirmation',
        createdAt: new Date().toISOString(),
      });

      // Track Purchase in Pixels
      trackPurchase(
        {
          orderId: result.order.id,
          totalAmount: grandTotal,
          currency: 'DZD',
          items: [
            {
              id: activeProduct.id,
              name: activeProduct.nameAr,
              price: modalPricing.unitPrice,
              quantity: orderQuantity,
            },
          ],
        },
        officialPixelTarget
      );

      const bundleTitleName =
        bundleOption === 'triple'
          ? 'باقة 3 قطع (العرض العائلي الفائق)'
          : bundleOption === 'double'
          ? 'باقة قطعتين (الأكثر طلباً)'
          : 'قطعة واحدة';

      setSubmittedOrderInfo({
        orderId: result.order.id,
        totalAmount: grandTotal,
        productId: activeProduct.id,
        productName: activeProduct.nameAr,
        productImage: activeProduct.images?.[0] || '',
        categoryAr: activeProduct.categoryAr,
        quantity: orderQuantity,
        unitPrice: modalPricing.unitPrice,
        variantText: selectedVariant ? `${selectedVariant.color} - ${selectedVariant.size}` : undefined,
        wilayaName: selectedWilaya.nameAr,
        wilayaCode: selectedWilaya.code,
        commune: commune.trim() || selectedWilaya.communes?.[0] || 'المركز',
        address: address.trim() || `بلدية ${commune || 'المركز'}`,
        deliveryType: deliveryType,
        shippingFee: shippingCost,
        phone: cleanPhone,
        phone2: phone2.trim() || undefined,
        customerName: customerName.trim(),
        bundleTitle: bundleTitleName,
        addedItems: [],
      });

      // Register anti-spam 24-hour cooldown
      registerOrderCooldown();

      // Scroll smoothly to top of Thank You Page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Order creation error:', err);
      alert('حدث خطأ أثناء حفظ الطلبية، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Click Grossell Purchase on Thank You Page ("grossel بطريقة احترافية جدا للشراء بظغطة زر وشكره مرة اخرى")
  const handleOrderGrossell = async (
    item: Product,
    customOptions?: CrossSellSelectionResult
  ) => {
    if (orderedGrossellIds.has(item.id) || orderingGrossellId || !submittedOrderInfo) return;

    setOrderingGrossellId(item.id);
    const chosenQuantity = customOptions?.quantity || 1;
    const baseRetail = item.officialStoreRetailPrice || item.suggestedSellingPrice || 3500;
    // 25% exclusive cross-sell discount for 1-click addition to existing package
    const singlePrice = customOptions?.unitPrice || Math.round((baseRetail * 0.75) / 50) * 50;
    const grossellSpecialPrice = customOptions?.totalPrice || (singlePrice * chosenQuantity);

    const chosenVariant = customOptions?.selectedColor || customOptions?.selectedSize
      ? `${customOptions.selectedColor || ''} ${customOptions.selectedSize || ''}`.trim()
      : item.variants?.[0]
      ? `${item.variants[0].color} - ${item.variants[0].size}`
      : undefined;

    const chosenImage = customOptions?.selectedImage || item.images?.[0] || '';

    try {
      const grossellOrderItem = {
        productId: item.id,
        productName: item.nameAr,
        quantity: chosenQuantity,
        unitPrice: singlePrice,
        totalPrice: grossellSpecialPrice,
        variant: chosenVariant,
        image: chosenImage,
      };

      const result = await createOrder({
        customerName: submittedOrderInfo.customerName,
        phone: submittedOrderInfo.phone,
        phone2: submittedOrderInfo.phone2,
        wilaya: submittedOrderInfo.wilayaName,
        wilayaCode: submittedOrderInfo.wilayaCode,
        commune: submittedOrderInfo.commune,
        address: submittedOrderInfo.address,
        deliveryType: submittedOrderInfo.deliveryType,
        items: [grossellOrderItem as any],
        totalAmount: grossellSpecialPrice,
        shippingFee: 0, // Free combined shipping with the main order!
        totalProfit: Math.max(0, grossellSpecialPrice - ((item.wholesalePrice || grossellSpecialPrice * 0.6) * chosenQuantity)),
        isDirectSupplierSale: true,
        source: 'official_store',
        resellerName: 'المتجر الرسمي Nouva Store',
        resellerEmail: 'admin@nouvamarket.com',
        parentOrderId: submittedOrderInfo.orderId,
        crossSellParentOrderId: submittedOrderInfo.orderId,
        status: 'PENDING',
        statusAr: 'طلب مكمل مدمج (المتجر الرسمي)',
        statusFr: 'Commande Complémentaire Grossell',
        notes: `[طلب مكمل مدمج في نفس الشحنة مع الطلبية الأم: ${submittedOrderInfo.orderId}]`,
        createdAt: new Date().toISOString(),
      });

      setOrderedGrossellIds((prev) => new Set(prev).add(item.id));

      // Update the invoice in real-time on the Thank You Page
      setSubmittedOrderInfo((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          totalAmount: prev.totalAmount + grossellSpecialPrice,
          addedItems: [
            ...(prev.addedItems || []),
            {
              productId: item.id,
              name: item.nameAr,
              price: grossellSpecialPrice,
              image: chosenImage,
            },
          ],
        };
      });

      // Warm re-thanking message ("وشكره مرة اخرى")
      setGrossellThankYouMessage(
        `🎉 شكراً جزيلاً لك مرة أخرى على ثقتك! تمت إضافة "${item.nameAr}" (الكمية: ${chosenQuantity}) بنجاح إلى شحنتك وبنفس الطرد وبدون أي مصاريف شحن إضافية!`
      );

      // Track Pixel Purchase for Cross-Sell
      trackPurchase(
        {
          orderId: result.order.id,
          totalAmount: grossellSpecialPrice,
          currency: 'DZD',
          items: [
            {
              id: item.id,
              name: item.nameAr,
              price: grossellSpecialPrice,
              quantity: 1,
            },
          ],
        },
        officialPixelTarget
      );
    } catch (err) {
      console.error('Grossell order error:', err);
      alert('حدث خطأ أثناء إضافة المنتج المكمل، يرجى المحاولة مرة أخرى.');
    } finally {
      setOrderingGrossellId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans" dir="rtl">


      {/* 2. OFFICIAL STORE MAIN HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-3.5 relative flex items-center justify-center">
          {/* Header Action: Return to Catalog button if in Landing / Thank You */}
          {(activeProduct || submittedOrderInfo) && (
            <div className="absolute right-3 sm:right-6 lg:right-8">
              <button
                onClick={handleBackToCatalog}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="hidden sm:inline">العودة للكتالوج 🏠</span>
                <span className="sm:hidden">الكتالوج 🏠</span>
              </button>
            </div>
          )}

          {/* Centered Announcement (En milieu) with larger font and brand emerald accent */}
          <button
            onClick={handleBackToCatalog}
            className="flex items-center justify-center gap-2.5 cursor-pointer group text-center"
          >
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm sm:text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-wide">
              توصيل سريع لجميع الولايات 🚚
            </span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          VIEW A: THANK YOU PAGE WITH GROSSELL (صفحة الشكر والإتمام مع الكروسيل الحصري)
      ========================================================================= */}
      {submittedOrderInfo ? (
        <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full space-y-6">
          {/* 1. Gratitude & Confirmation Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50 dark:ring-emerald-900/30">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                تم استلام طلبك بنجاح 🎉
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                شكراً لثقتكم في متجرنا الرسمي!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                رقم التتبع للطلبية: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{submittedOrderInfo.orderId}</span>
              </p>
            </div>

            {/* Reassurance Call Notice */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-right flex items-start gap-3">
              <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-800 dark:text-emerald-300 font-black text-sm mb-0.5">
                  سيتصل بك فريق التأكيد هاتفياً قريباً
                </strong>
                سنتصل بك على الرقم{' '}
                <strong className="text-emerald-600 font-mono text-sm underline">{submittedOrderInfo.phone}</strong>{' '}
                خلال ساعات قليلة لتأكيد العنوان وبدء الشحن الفوري لباب منزلك.
              </div>
            </div>

            {/* Order Receipt Details */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl text-right text-xs space-y-3 border border-slate-200 dark:border-slate-800">
              <h4 className="font-black text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
                تفاصيل الطلب والفاتورة (الدفع عند الاستلام COD):
              </h4>

              <div className="flex justify-between">
                <span className="text-slate-500">المنتج الأساسي:</span>
                <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                  {submittedOrderInfo.productName} ({submittedOrderInfo.quantity} قطعة)
                </span>
              </div>

              {submittedOrderInfo.variantText && (
                <div className="flex justify-between">
                  <span className="text-slate-500">النوع / اللون:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {submittedOrderInfo.variantText}
                  </span>
                </div>
              )}

              {submittedOrderInfo.bundleTitle && (
                <div className="flex justify-between">
                  <span className="text-slate-500">العرض المختار:</span>
                  <span className="font-bold text-emerald-600">
                    {submittedOrderInfo.bundleTitle}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-500">عنوان التوصيل:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {submittedOrderInfo.wilayaName} - {submittedOrderInfo.commune} ({submittedOrderInfo.deliveryType === 'home' ? 'توصيل للمنزل' : 'إستلام من المكتب'})
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">مصاريف الشحن:</span>
                <span className={`font-bold ${submittedOrderInfo.shippingFee === 0 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                  {submittedOrderInfo.shippingFee === 0 ? 'مجاني 100% 🎁' : `${submittedOrderInfo.shippingFee} دج`}
                </span>
              </div>

              {/* Added Grossell Items Breakdown */}
              {submittedOrderInfo.addedItems && submittedOrderInfo.addedItems.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-[11px] font-black text-emerald-600">
                    المنتجات المكملة المضافة لنفس الشحنة (Grossell):
                  </div>
                  {submittedOrderInfo.addedItems.map((added, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        {added.name}
                      </span>
                      <span className="font-black text-emerald-600 font-mono">
                        +{added.price.toLocaleString()} دج (شحن مجاني)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700 text-sm sm:text-base font-black">
                <span className="text-slate-900 dark:text-white">المبلغ الإجمالي عند الاستلام:</span>
                <span className="text-emerald-600 font-mono text-lg sm:text-xl">
                  {submittedOrderInfo.totalAmount.toLocaleString()} دج
                </span>
              </div>
            </div>

            {/* Quick WhatsApp Confirmation Link */}
            <div className="pt-1">
              <a
                href={`https://wa.me/${storeSettings.whatsappContact || '213550123456'}?text=${encodeURIComponent(
                  `مرحباً، لقد أرسلت طلبية رقم ${submittedOrderInfo.orderId} بقيمة ${submittedOrderInfo.totalAmount} دج من المتجر الرسمي وأريد تأكيدها سريعاً.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-700/20"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تأكيد عبر واتساب</span>
              </a>
            </div>
          </div>

          {/* 2. Re-Thanking Alert for Grossell Addition */}
          {grossellThankYouMessage && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg space-y-1 animate-in fade-in slide-in-from-top-2 text-right">
              <div className="flex items-center gap-2 font-black text-sm">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>تم تحديث طلبك بنجاح!</span>
              </div>
              <p className="text-xs leading-relaxed opacity-95">
                {grossellThankYouMessage}
              </p>
            </div>
          )}

          {/* 3. GROSSELL CROSS-SELL OFFERS */}
          {relatedGrossellProducts.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-amber-500/40 shadow-xl space-y-4 text-right">
              <div className="bg-gradient-to-r from-amber-500/15 via-emerald-600/10 to-teal-600/15 p-4 rounded-2xl border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-700 dark:text-amber-400">
                    <Gift className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                    عرض خاص ومكمل لطلبك 🎁
                  </span>
                  <span className="text-[10px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                    شحن مجاني 100% 🚚
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  يمكنك إضافة هذا المنتج المكمل إلى نفس طردك بخصم خاص (25% تخفيض) وبدون أي مصاريف شحن إضافية بضغطة زر واحدة!
                </p>
              </div>

              {/* Cross-Sell Product Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {relatedGrossellProducts.map((cross) => {
                  const isOrdered = orderedGrossellIds.has(cross.id);
                  const isSubmittingThis = orderingGrossellId === cross.id;
                  const baseRetail = cross.officialStoreRetailPrice || cross.suggestedSellingPrice || 3500;
                  const crossellPrice = Math.round((baseRetail * 0.75) / 50) * 50;

                  return (
                    <div
                      key={cross.id}
                      className={`p-4 rounded-2xl border transition-all duration-300 bg-slate-50 dark:bg-slate-800/80 shadow-xs flex flex-col justify-between space-y-3 ${
                        isOrdered
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex gap-3 items-center">
                        <img
                          src={cross.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                          alt={cross.nameAr}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            منتج مكمل 🎁
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                            {cross.nameAr}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              {crossellPrice.toLocaleString()} دج
                            </span>
                            <span className="text-[10px] text-slate-400 line-through">
                              {baseRetail.toLocaleString()} دج
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Buy CTA Button */}
                      {isOrdered ? (
                        <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>✓ تمت الإضافة</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomizingGrossell(cross);
                          }}
                          disabled={isSubmittingThis || Boolean(orderingGrossellId)}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/20 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingThis ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري الإضافة...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span>إضافة للطرد (+{crossellPrice.toLocaleString()} دج)</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grossell Color / Size / Quantity Customizer Modal */}
          {customizingGrossell && (
            <CrossSellCustomizerModal
              isOpen={Boolean(customizingGrossell)}
              onClose={() => setCustomizingGrossell(null)}
              product={customizingGrossell}
              unitPrice={customizingGrossell.officialStoreRetailPrice || customizingGrossell.suggestedSellingPrice || 3500}
              suggestedDiscountPercent={25}
              onConfirm={(result) => {
                handleOrderGrossell(customizingGrossell, result);
                setCustomizingGrossell(null);
              }}
              isSubmitting={orderingGrossellId === customizingGrossell.id}
            />
          )}

          {/* 4. PROMINENT RETURN TO HOMEPAGE BUTTON */}
          <div className="pt-2 text-center space-y-3">
            <button
              onClick={() => {
                registerOrderCooldown();
                handleBackToCatalog();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-500"
            >
              <Home className="w-5 h-5 text-white" />
              <span>إغلاق الصفحة والعودة للمتجر 🏠</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              تصفح باقي المنتجات مع توصيل لكافة الولايات 🇩🇿
            </p>
          </div>
        </main>
      ) : activeProduct ? (
        /* =========================================================================
           VIEW B: HIGH-CONVERTING LANDING PAGE FOR "اشتري الآن"
           (مثل صفحة الهبوط لمنتجات الرابط مع Upsell)
        ========================================================================= */
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
          {/* Top Urgency Header */}
          <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white rounded-2xl p-3.5 px-5 shadow-lg flex items-center justify-between flex-wrap gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 fill-current animate-pulse text-amber-200" />
              <span className="font-black text-xs sm:text-sm">
                🔥 عرض خاص وحصري لفترة محدودة من المستودع!
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono font-black text-xs sm:text-sm bg-black/20 px-3 py-1 rounded-xl">
              <Clock className="w-4 h-4 text-amber-200" />
              <span>ينتهي خلال:</span>
              <span className="text-amber-200">
                {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* RIGHT COLUMN (DESKTOP): PRODUCT GALLERY & TRUST PILLARS */}
            <div className="lg:col-span-6 space-y-5">
              {/* Main Image Slider with Badges */}
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xl group">
                <img
                  src={activeProduct.images?.[activeImageIndex] || activeProduct.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
                  alt={activeProduct.nameAr}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badges on Gallery */}
                <div className="absolute top-3.5 right-3.5 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>تخفيض خاص</span>
                </div>

                <div className="absolute top-3.5 left-3.5 bg-slate-900/85 backdrop-blur-md text-emerald-300 text-xs font-black px-2.5 py-1 rounded-xl border border-emerald-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>مضمون 100%</span>
                </div>

                {/* Scarcity Bar on Image */}
                <div className="absolute bottom-3 right-3 left-3 bg-slate-900/85 backdrop-blur-md text-white text-xs px-3.5 py-2 rounded-xl flex items-center justify-between border border-white/10">
                  <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <Clock className="w-4 h-4" /> متبقي 3 قطع فقط في المخزون
                  </span>
                  <span className="text-slate-300 text-[10px]">توصيل 24-48 ساعة 🚚</span>
                </div>
              </div>

              {/* Thumbnails row */}
              {activeProduct.images && activeProduct.images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {activeProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition ${
                        activeImageIndex === idx
                          ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* 4 Trust Pillars */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-right flex items-center gap-2.5 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">شحن 58 ولاية</div>
                    <div className="text-[10px] text-slate-500">خلال 24-48 ساعة</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-right flex items-center gap-2.5 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">معاينة قبل الدفع</div>
                    <div className="text-[10px] text-slate-500">افتح الطرد وتأكد</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-right flex items-center gap-2.5 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">ضمان 14 يوماً</div>
                    <div className="text-[10px] text-slate-500">استبدال فوري</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-right flex items-center gap-2.5 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600 shrink-0">
                    <BadgePercent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">شحن مجاني</div>
                    <div className="text-[10px] text-slate-500">للباقات المتعددة</div>
                  </div>
                </div>
              </div>

              {/* Product Full Description Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  وصف ومواصفات المنتج:
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {activeProduct.officialStoreCustomDescription || activeProduct.descriptionAr || 'منتج أصلي عالي الجودة متوفر للتوصيل الفوري مع ضمان شامل من المستودع.'}
                </p>

                {/* Social Proof Reviews Box */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-black text-slate-900 dark:text-white">4.9 / 5</span>
                    <span className="text-[11px] text-slate-400">(+180 تقييم من مشترين حقيقيين)</span>
                  </div>
                  <span className="text-emerald-600 font-bold text-[11px]">
                    ✓ مشتريات موثوقة
                  </span>
                </div>
              </div>
            </div>

            {/* LEFT COLUMN: UPSELL PACKAGES & COD CHECKOUT FORM */}
            <div className="lg:col-span-6 space-y-6" ref={orderFormRef}>
              {/* Product Header & Title */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-right">
                {activeProduct.officialStoreBadge && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-amber-700 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      {activeProduct.officialStoreBadge}
                    </span>
                  </div>
                )}

                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                  {activeProduct.officialStoreCustomTitle || activeProduct.nameAr}
                </h1>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {modalPricing.unitPrice.toLocaleString()}{' '}
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">دج</span>
                  </span>
                  {modalPricing.originalRef > modalPricing.unitPrice && (
                    <span className="text-sm text-slate-400 line-through font-mono">
                      {modalPricing.originalRef.toLocaleString()} دج
                    </span>
                  )}
                  {modalPricing.savings > 0 && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-lg">
                      وفرت {modalPricing.savings.toLocaleString()} دج
                    </span>
                  )}
                </div>
              </div>

              {/* SMART BUNDLES & UPSELL PACKAGES SELECTOR ("مع upsell") */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-emerald-500/30 shadow-md space-y-4 text-right">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-600" />
                    <span>اختر باقة التوفير والكمية (Upsell):</span>
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-black animate-pulse">
                    🎁 شحن مجاني للباقات!
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: Single */}
                  <div
                    onClick={() => setBundleOption('single')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative text-right flex flex-col justify-between ${
                      bundleOption === 'single'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-black text-xs text-slate-900 dark:text-white">قطعة واحدة</div>
                      <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-1 font-mono">
                        {(activeProduct.officialStoreRetailPrice || activeProduct.suggestedSellingPrice || 3500).toLocaleString()} دج
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2">شحن الولاية العادي</div>
                  </div>

                  {/* Option 2: Double (Recommended & Most Popular) */}
                  <div
                    onClick={() => setBundleOption('double')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative text-right flex flex-col justify-between ${
                      bundleOption === 'double'
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="absolute -top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                      الأكثر طلباً ⭐
                    </div>
                    <div>
                      <div className="font-black text-xs text-slate-900 dark:text-white">قطعتين (خصم 15%)</div>
                      <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                        {Math.round((activeProduct.officialStoreRetailPrice || activeProduct.suggestedSellingPrice || 3500) * 0.85 * 2).toLocaleString()} دج
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-black mt-2">
                      🎁 شحن مجاني 100%
                    </div>
                  </div>

                  {/* Option 3: Triple (Family Bundle) */}
                  <div
                    onClick={() => setBundleOption('triple')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative text-right flex flex-col justify-between ${
                      bundleOption === 'triple'
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="absolute -top-3 left-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                      العرض العائلي 🔥
                    </div>
                    <div>
                      <div className="font-black text-xs text-slate-900 dark:text-white">3 قطع (خصم 25%)</div>
                      <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                        {Math.round((activeProduct.officialStoreRetailPrice || activeProduct.suggestedSellingPrice || 3500) * 0.75 * 3).toLocaleString()} دج
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-black mt-2">
                      🎁 شحن مجاني + هدية
                    </div>
                  </div>
                </div>
              </div>

              {/* VARIANTS SELECTOR (COLORS & SIZES) */}
              {activeProduct.variants && activeProduct.variants.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-right">
                  <label className="text-xs font-black text-slate-900 dark:text-white block">
                    اختر اللون أو الموديل:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {activeProduct.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer ${
                          selectedVariant?.id === v.id
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {v.colorHex && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/15 inline-block shrink-0"
                            style={{ backgroundColor: v.colorHex }}
                          />
                        )}
                        <span>{v.color}</span>
                        {v.size && <span className="text-[10px] text-slate-400 font-medium">({v.size})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* EXPRESS COD CHECKOUT FORM */}
              <form onSubmit={handleSubmitOrder} className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-right">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      استمارة الطلب السريع (الدفع عند الاستلام COD)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      أدخل معلوماتك وسيتصل بك الموزع لتسليم الطرد
                    </p>
                  </div>
                </div>

                {/* الصف 1: [الاسم واللقب] + [رقم الهاتف] - متوازيان تماماً */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1 truncate">
                      الاسم واللقب *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="محمد بن علي..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 sm:px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                        رقم الهاتف *
                      </label>
                      {phone.trim().length > 3 && (
                        <span className={`text-[10px] font-bold ${
                          validateAlgerianMobile(phone).isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                        }`}>
                          {validateAlgerianMobile(phone).isValid
                            ? `✓ ${validateAlgerianMobile(phone).operatorAr}`
                            : '05 / 06 / 07'}
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="05 / 06 / 07 XX XX XX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-2.5 sm:px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 font-mono text-right ${
                        phone.trim().length >= 10 && !validateAlgerianMobile(phone).isValid
                          ? 'border-rose-400 focus:ring-rose-400'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* الصف 2: [الولاية (69)] + [البلدية] - متوازيان تماماً */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1 truncate">
                      الولاية (69 ولاية) *
                    </label>
                    <select
                      value={selectedWilayaCode}
                      onChange={(e) => {
                        setSelectedWilayaCode(e.target.value);
                        const match = ALGERIA_WILAYAS.find((w) => w.code === e.target.value);
                        if (match && match.communes.length > 0) {
                          setCommune(match.communes[0]);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 sm:px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium"
                    >
                      {ALGERIA_WILAYAS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1 truncate">
                      البلدية *
                    </label>
                    {selectedWilaya.communes && selectedWilaya.communes.length > 0 ? (
                      <select
                        value={commune}
                        onChange={(e) => setCommune(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 sm:px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium"
                      >
                        {selectedWilaya.communes.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="اسم البلدية..."
                        value={commune}
                        onChange={(e) => setCommune(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 sm:px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    )}
                  </div>
                </div>

                {/* Delivery Type Option */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                    طريقة الاستلام المفضلة:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => setDeliveryType('home')}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        deliveryType === 'home'
                          ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-black'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs">
                        <div>التوصيل لباب المنزل</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {bundleOption === 'single' ? `${selectedWilaya.homeFee} دج` : 'مجاني 🎁'}
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={deliveryType === 'home'}
                        onChange={() => setDeliveryType('home')}
                        className="text-emerald-600"
                      />
                    </label>

                    <label
                      onClick={() => setDeliveryType('office')}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        deliveryType === 'office'
                          ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-black'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs">
                        <div>إستلام من المكتب</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {bundleOption === 'single' ? `${selectedWilaya.officeFee} دج` : 'مجاني 🎁'}
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={deliveryType === 'office'}
                        onChange={() => setDeliveryType('office')}
                        className="text-emerald-600"
                      />
                    </label>
                  </div>
                </div>

                {/* Address or Special Landmark */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    العنوان الدقيق أو علامة مميزة (اختياري)
                  </label>
                  <input
                    type="text"
                    placeholder="الحي، رقم الشارع، بالقرب من المسجد..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* LIVE ORDER BILL SUMMARY */}
                <div className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>قيمة المنتجات ({modalPricing.quantity} قطعة):</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {modalPricing.totalItemsPrice.toLocaleString()} دج
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>تكلفة التوصيل إلى {selectedWilaya.nameAr}:</span>
                    <span className={`font-black ${shippingCost === 0 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                      {shippingCost === 0 ? 'مجاني 100% 🎁' : `${shippingCost} دج`}
                    </span>
                  </div>
                  {modalPricing.savings > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>إجمالي ما قمت بتوفيره:</span>
                      <span className="font-mono">-{modalPricing.savings.toLocaleString()} دج</span>
                    </div>
                  )}
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    <span>الإجمالي عند الاستلام (COD):</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-lg sm:text-xl">
                      {grandTotal.toLocaleString()} دج
                    </span>
                  </div>
                </div>

                {/* Anti-Spam 24-Hour Cooldown Banner or Big Action Submit Button */}
                {checkOrderCooldown().isLocked ? (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold space-y-1.5 text-center animate-in fade-in">
                    <p className="font-black text-sm text-amber-800 dark:text-amber-300">
                      ⚠️ لقد قمت بتقديم طلب سابقاً من هذا الجهاز
                    </p>
                    <p className="leading-relaxed">
                      {checkOrderCooldown().message}
                    </p>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-900/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>جاري تسجيل الطلبية وتأكيدها...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-current text-amber-300" />
                        <span>تأكيد الطلب 🚚</span>
                      </>
                    )}
                  </button>
                )}

                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                  🛡️ لن تدفع أي دينار حتى يصل الطرد إلى يدك وتقوم بمعاينته والتأكد منه شخصياً.
                </p>
              </form>
            </div>
          </div>

          {/* Floating Sticky Mobile Order Bar */}
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 px-4 shadow-2xl flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-slate-500">الإجمالي عند الاستلام:</div>
              <div className="text-base font-black text-emerald-600 font-mono">
                {grandTotal.toLocaleString()} دج
              </div>
            </div>
            <button
              onClick={scrollToCheckout}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 active:scale-95 transition"
            >
              <Zap className="w-4 h-4 fill-current text-amber-300" />
              <span>اطلب الآن 🚚</span>
            </button>
          </div>
        </main>
      ) : (
        /* =========================================================================
           VIEW C: ULTRA-PROFESSIONAL CATALOG GRIDS ("صفحة منتجات المنصة يجب ان تظهر بشكل احترافي جدا grides مع زر اشتري الان")
        ========================================================================= */
        <>
          {/* 3. ULTRA-PROFESSIONAL STORE HERO BANNER */}
          <section className="relative w-full overflow-hidden bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            {/* Clickable High-Resolution Responsive Store Hero Banner */}
            <div className="relative w-full max-h-[460px] overflow-hidden group cursor-pointer" onClick={() => products[0] && handleOpenLanding(products[0])}>
              <img
                src={storeSettings.bannerImageUrl || '/social-banner.png'}
                alt="Nouva Store Banner"
                className="w-full h-auto min-h-[180px] sm:min-h-[260px] md:min-h-[340px] max-h-[460px] object-cover object-center transition-transform duration-700 group-hover:scale-[1.015]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/social-banner.png';
                }}
              />
              {/* Subtle Ambient Vignette & Quick Action Overlay on Desktop */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />


            </div>
          </section>

          {/* 4. CATEGORY PILLS & FILTERS */}
          <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-[65px] z-30 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
              {/* Categories Horizontal Pills */}
              <div className="flex items-center gap-2 flex-nowrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  الكل ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">الترتيب:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="featured">الأكثر طلباً ⭐</option>
                  <option value="discount">أكبر تخفيض 🔥</option>
                  <option value="price-asc">السعر: من الأقل</option>
                  <option value="price-desc">السعر: من الأعلى</option>
                </select>
              </div>
            </div>
          </section>

          {/* 5. ULTRA-PROFESSIONAL ALIEXPRESS-STYLE MOBILE-FIRST CATALOG GRIDS */}
          <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 w-full space-y-4 sm:space-y-6">
            {/* Header / Filter Feedback (Clean & Uncluttered) */}
            <div className="flex items-center justify-end gap-3 px-1">
              {/* Trust Badge Pill */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ضمان استبدال 14 يوم</span>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
                <Package className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">لم يتم العثور على أي منتج</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  جرب تغيير كلمة البحث أو تصفح كافة التصنيفات لاكتشاف المنتجات المتاحة في المستودع.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                >
                  عرض كافة المنتجات
                </button>
              </div>
            ) : (
              /* AliExpress Mobile-First 2-Column Grid on Mobile, 3 on Tablet, 4 on Desktop */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                {filteredProducts.map((prod) => {
                  const basePrice = prod.officialStoreRetailPrice || prod.suggestedSellingPrice || 3500;
                  const originalPrice = prod.officialStoreCompareAtPrice || prod.ceilingPrice || Math.round(basePrice * 1.35);
                  const discountPercent = Math.max(0, Math.round(((originalPrice - basePrice) / originalPrice) * 100));

                  return (
                    <article
                      key={prod.id}
                      onClick={() => handleOpenLanding(prod)}
                      className="group bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-500/60 transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
                    >
                      {/* Top Media Container */}
                      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
                          alt={prod.nameAr}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />

                        {/* Top Badges (AliExpress-style floating pill) */}
                        <div className="absolute top-2 start-2 end-2 flex items-start justify-between gap-1 pointer-events-none">
                          {discountPercent > 0 ? (
                            <span className="bg-red-600 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg shadow-md flex items-center gap-0.5">
                              <Flame className="w-3 h-3 fill-current" />
                              <span>-{discountPercent}%</span>
                            </span>
                          ) : <span />}
                        </div>

                        {/* Custom Official Store Custom Badge if present */}
                        {prod.officialStoreBadge && (
                          <div className="absolute bottom-2 start-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-200" />
                            <span>{prod.officialStoreBadge}</span>
                          </div>
                        )}
                      </div>

                      {/* Content Section (AliExpress Mobile-Optimized Hierarchy) */}
                      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 text-right">
                        <div>
                          {/* Product Title */}

                          {/* Product Title */}
                          <h3
                            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition leading-snug mt-0.5"
                            title={prod.nameAr}
                          >
                            {prod.officialStoreCustomTitle || prod.nameAr}
                          </h3>
                        </div>

                        {/* Rating & Sold Counter (AliExpress Style) */}
                        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                            <span className="font-bold text-slate-800 dark:text-slate-200">4.9</span>
                            <span className="text-[9px] text-slate-400 hidden sm:inline">(+180)</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                            فحص قبل الدفع
                          </span>
                        </div>

                        {/* Price Block & Action Button */}
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                          <div className="flex items-baseline justify-between gap-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                                {basePrice.toLocaleString()}
                              </span>
                              <span className="text-[10px] sm:text-xs font-black text-emerald-600">
                                دج
                              </span>
                            </div>

                            {originalPrice > basePrice && (
                              <span className="text-[10px] sm:text-xs text-slate-400 line-through font-mono">
                                {originalPrice.toLocaleString()} دج
                              </span>
                            )}
                          </div>

                          {/* Prominent High-Converting "اشتري الآن" Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenLanding(prod);
                            }}
                            className="w-full py-2 sm:py-2.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-black text-[11px] sm:text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current text-amber-300 shrink-0" />
                            <span>اشتري الآن 🚚</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        </>
      )}

      {/* 6. STORE FOOTER */}
      <footer className="bg-slate-900 text-slate-300 text-xs border-t border-slate-800 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-base">
                N
              </div>
              <span className="text-base font-black text-white">
                Nouva <span className="text-emerald-400">Store</span>
              </span>
            </div>

            <div className="flex items-center gap-6 text-slate-400">
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4 text-emerald-400" />
                توصيل 58 ولاية
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                معاينة قبل الدفع
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4 text-teal-400" />
                دعم هاتفي 7/7
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>© {new Date().getFullYear()} Nouva Store. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/terms')} className="hover:text-slate-300 cursor-pointer">الشروط والأحكام</button>
              <button onClick={() => navigate('/privacy')} className="hover:text-slate-300 cursor-pointer">سياسة الخصوصية</button>
              <button onClick={() => navigate('/')} className="hover:text-emerald-400 font-bold cursor-pointer">بوابة المنصة للأفلييت</button>
            </div>
          </div>
        </div>
      </footer>
      {/* Modal for changing official store banner */}
      <ChangeStoreBannerModal
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
      />
    </div>
  );
}
