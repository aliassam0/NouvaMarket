import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Truck, User, ShoppingBag, ShieldCheck, Zap, Share2, Repeat, Code, Hash, Globe, FileText, Sparkles, Layers } from 'lucide-react';
import { Product, ProductVariant, Order } from '../../types';
import { MOCK_PRODUCTS } from '../../data/mockProducts';
import { ALGERIA_WILAYAS, getWilayaByCode } from '../../data/algeriaLocations';
import { useOrders } from '../../context/OrderContext';
import { useLanguage } from '../../context/LanguageContext';
import { MoneyText } from '../ui/MoneyText';
import { ProfitBadge } from '../ui/ProfitBadge';
import { calculateProfit } from '../../lib/formatters';
import { getStoredMarketplaceFees } from '../../lib/supplierHelper';
import { OrderUpsellTiers, generateDefaultTiers, QuantityUpsellTier } from '../common/OrderUpsellTiers';

interface NewOrderModalProps {
  initialProduct?: Product | null;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export function NewOrderModal({ initialProduct, onClose, onShowToast }: NewOrderModalProps) {
  const { createOrder, getWhatsAppReceiptText } = useOrders();
  const { t, language } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Tab mode in Step 1: 'upsell' (tiered quantity offers) vs 'standard' (manual single qty)
  const [orderTab, setOrderTab] = useState<'upsell' | 'standard'>('upsell');

  // Step 1: Product & Quantity Selection
  const [selectedProduct, setSelectedProduct] = useState<Product>(initialProduct || MOCK_PRODUCTS[0]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    initialProduct?.variants[0] || MOCK_PRODUCTS[0].variants[0]
  );
  const [sellingPrice, setSellingPrice] = useState<number>(
    initialProduct?.suggestedSellingPrice || MOCK_PRODUCTS[0].suggestedSellingPrice
  );
  const [quantity, setQuantity] = useState<number>(1);

  // Quantity Upsell Tiers state (1 piece, 2 pieces, 3 pieces, etc.)
  const [quantityTiers, setQuantityTiers] = useState<QuantityUpsellTier[]>(() =>
    generateDefaultTiers(
      initialProduct || MOCK_PRODUCTS[0],
      initialProduct?.suggestedSellingPrice || MOCK_PRODUCTS[0].suggestedSellingPrice,
      (initialProduct || MOCK_PRODUCTS[0]).variants
    )
  );
  const [selectedTierId, setSelectedTierId] = useState<string>('tier-2');

  // Sync tiers when product changes
  useEffect(() => {
    if (selectedProduct) {
      setQuantityTiers(generateDefaultTiers(selectedProduct, sellingPrice, selectedProduct.variants));
    }
  }, [selectedProduct?.id]);

  const activeTier = quantityTiers.find((t) => t.id === selectedTierId) || quantityTiers[0];

  const [selectedUpsellIds, setSelectedUpsellIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    const prod = initialProduct || MOCK_PRODUCTS[0];
    if (prod?.upsells) {
      prod.upsells.forEach((u) => {
        if (u.isDefaultSelected) s.add(u.id);
      });
    }
    return s;
  });

  const availableUpsells = selectedProduct.upsells || [];
  const selectedUpsells = availableUpsells.filter((u) => selectedUpsellIds.has(u.id));
  const upsellsTotalPrice = selectedUpsells.reduce((acc, u) => acc + (Number(u.price) || 0), 0);
  const upsellsTotalProfit = selectedUpsells.reduce((acc, u) => {
    const p = Number(u.profit) || Math.max(0, (Number(u.price) || 0) - (Number(u.wholesalePrice) || 0));
    return acc + p;
  }, 0);

  // Step 2: Customer & Shipping details (Matching POST /Api_v1/Colis payload)
  const [customerName, setCustomerName] = useState(''); // NomComplet
  const [phone, setPhone] = useState(''); // Mobile_1
  const [phone2, setPhone2] = useState(''); // Mobile_2
  const [selectedWilayaCode, setSelectedWilayaCode] = useState('16'); // Wilaya
  const [commune, setCommune] = useState('باب الزوار'); // Commune
  const [address, setAddress] = useState(''); // Adresse
  const [deliveryType, setDeliveryType] = useState<'home' | 'office'>('home'); // Stopdesk (0: home, 1: office)
  const [codeStopdesk, setCodeStopdesk] = useState('16B'); // CodeStopdesk
  const [echange, setEchange] = useState<number>(0); // Echange (0 or 1)
  const [refArticle, setRefArticle] = useState(`REF-${selectedProduct.id.toUpperCase()}`); // Ref_Article
  const [noteFournisseur, setNoteFournisseur] = useState(''); // NoteFournisseur
  const [idExterne, setIdExterne] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`); // ID_Externe
  const [source, setSource] = useState('Facebook'); // Source

  // Step 3 Result State
  const [createdOrderResult, setCreatedOrderResult] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeWilaya = getWilayaByCode(selectedWilayaCode);
  const shippingFee = deliveryType === 'home' ? activeWilaya.homeFee : activeWilaya.officeFee;

  // Calculations based on active tab
  const itemProfitSingle = calculateProfit(selectedProduct.wholesalePrice, sellingPrice);

  const effectiveItemsTotal =
    orderTab === 'upsell' && activeTier
      ? activeTier.totalPrice
      : sellingPrice * quantity;

  const effectiveItemsProfit =
    orderTab === 'upsell' && activeTier
      ? activeTier.netProfit
      : itemProfitSingle * quantity;

  const grossProfit = effectiveItemsProfit + upsellsTotalProfit;
  const feeSettings = getStoredMarketplaceFees();
  const resellerFeeRate = feeSettings.resellerFeePercent || 0;
  const platformResellerCut = Math.round((grossProfit * resellerFeeRate) / 100);
  const totalProfit = Math.max(0, grossProfit - platformResellerCut);
  const totalAmount = effectiveItemsTotal + upsellsTotalPrice;

  const toggleUpsell = (upsellId: string) => {
    setSelectedUpsellIds((prev) => {
      const next = new Set(prev);
      if (next.has(upsellId)) {
        next.delete(upsellId);
      } else {
        next.add(upsellId);
      }
      return next;
    });
  };

  const handleSelectTier = (tier: QuantityUpsellTier) => {
    setSelectedTierId(tier.id);
    setQuantity(tier.quantity);
  };

  const handleSubmitOrder = async () => {
    if (!customerName || !phone) {
      onShowToast('يرجى كتابة اسم ورقم هاتف الزبون الرئيسية');
      return;
    }

    setIsSubmitting(true);
    const effectiveCodeStopdesk = codeStopdesk || `${activeWilaya.code}A`;

    // Construct main order item based on upsell tier or standard order
    let mainOrderItem;
    if (orderTab === 'upsell' && activeTier) {
      const variantDetails =
        activeTier.itemVariants && activeTier.itemVariants.length > 1
          ? activeTier.itemVariants.map((iv) => `قطعة ${iv.itemIndex}: ${iv.size} (${iv.color})`).join(' | ')
          : `${selectedVariant.size} - ${selectedVariant.color}`;

      mainOrderItem = {
        productId: selectedProduct.id,
        productName:
          activeTier.quantity > 1
            ? `${selectedProduct.nameAr} [${activeTier.title}] (${variantDetails})`
            : selectedProduct.nameAr,
        productImage: selectedProduct.images[0],
        variantSize: activeTier.itemVariants?.[0]?.size || selectedVariant.size,
        variantColor: activeTier.itemVariants?.[0]?.color || selectedVariant.color,
        quantity: activeTier.quantity,
        wholesalePrice: selectedProduct.wholesalePrice,
        sellingPrice: Math.round(activeTier.totalPrice / activeTier.quantity),
        profit: Math.round(activeTier.netProfit / activeTier.quantity),
        isUpsell: activeTier.quantity > 1,
        upsellOfferId: activeTier.id,
      };
    } else {
      mainOrderItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.nameAr,
        productImage: selectedProduct.images[0],
        variantSize: selectedVariant.size,
        variantColor: selectedVariant.color,
        quantity,
        wholesalePrice: selectedProduct.wholesalePrice,
        sellingPrice,
        profit: itemProfitSingle,
      };
    }

    const orderPayload: Partial<Order> = {
      customerName,
      phone,
      phone2,
      wilaya: activeWilaya.nameAr,
      wilayaCode: activeWilaya.code,
      commune,
      address,
      deliveryType,
      stopdesk: deliveryType === 'office' ? 1 : 0,
      codeStopdesk: deliveryType === 'office' ? effectiveCodeStopdesk : '',
      echange,
      refArticle: refArticle || `REF-${selectedProduct.id}`,
      noteFournisseur,
      idExterne,
      source,
      items: [
        mainOrderItem,
        ...selectedUpsells.map((u) => ({
          productId: `${selectedProduct.id}-upsell-${u.id}`,
          productName: `[عرض إضافي] ${u.title}`,
          productImage: u.image || selectedProduct.images[0],
          variantSize: 'موحد',
          variantColor: 'افتراضي',
          quantity: 1,
          wholesalePrice: u.wholesalePrice,
          sellingPrice: u.price,
          profit: Number(u.profit) || Math.max(0, u.price - u.wholesalePrice),
          isUpsell: true,
          upsellOfferId: u.id,
        })),
      ],
      totalAmount,
      shippingFee,
      totalProfit,
      grossProfit,
      platformResellerFee: platformResellerCut,
      resellerFeePercent: resellerFeeRate,
    };

    const { order } = await createOrder(orderPayload);
    setCreatedOrderResult(order);
    setIsSubmitting(false);
    setStep(3);
    onShowToast('تم إنشاء وتأكيد الطلبية بنجاح!');
  };

  const handleShareWhatsAppReceipt = () => {
    if (!createdOrderResult) return;
    const text = getWhatsAppReceiptText(createdOrderResult);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/213${phone.replace(/^0/, '')}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl overflow-y-auto flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-slate-900/95 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500 fill-current" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {t('order.newTitle')} (API Colis 69 Wilayas)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar (3 Steps) */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 flex gap-2 border-b border-slate-100 dark:border-slate-800">
          <div className={`h-1.5 flex-1 rounded-full transition ${step >= 1 ? 'bg-purple-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition ${step >= 2 ? 'bg-purple-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition ${step >= 3 ? 'bg-purple-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1 space-y-4">
          {/* STEP 1: Product Selection & Profit */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('order.step1')}
              </h3>

              {/* Product Card */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex gap-3 items-center">
                <img
                  src={selectedProduct.images[0]}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {selectedProduct.nameAr}
                  </h4>
                  <div className="text-[11px] text-slate-500">
                    الجملة: <MoneyText amount={selectedProduct.wholesalePrice} />
                  </div>
                  <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                    ربحك/قطعة: +<MoneyText amount={itemProfitSingle} />
                  </div>
                </div>
              </div>

              {/* Selection Tabs: Upsell Tiers vs Standard Single */}
              <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setOrderTab('upsell')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    orderTab === 'upsell'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                  <span>عروض الـ Upsell والكميات</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-900 text-[9px] font-black">
                    +أرباح 🚀
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderTab('standard')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    orderTab === 'standard'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>طلب عادي (قطعة/يدوي)</span>
                </button>
              </div>

              {/* MODE 1: TIERED QUANTITY UPSELL (1 قطعة، 2 قطع، 3 قطع، الخ...) */}
              {orderTab === 'upsell' && (
                <OrderUpsellTiers
                  product={selectedProduct}
                  baseSellingPrice={sellingPrice}
                  variants={selectedProduct.variants}
                  selectedTierId={selectedTierId}
                  onSelectTier={handleSelectTier}
                  tiers={quantityTiers}
                  onUpdateTiers={setQuantityTiers}
                  availableAddonUpsells={availableUpsells}
                  selectedAddonUpsellIds={selectedUpsellIds}
                  onToggleAddonUpsell={toggleUpsell}
                />
              )}

              {/* MODE 2: STANDARD SINGLE ITEM WITH MANUAL QUANTITY */}
              {orderTab === 'standard' && (
                <div className="space-y-4">
                  {/* Selling Price Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      سعر البيع المختار للزبون (دج):
                    </label>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Variant size selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      المقاس واللون المطلوب:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.variants.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                            selectedVariant.id === v.id
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {v.size} - {v.color}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      الكمية المطلوبة:
                    </span>
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 font-bold text-slate-800 dark:text-white"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 font-bold text-slate-800 dark:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Addon upsell offers for standard mode */}
                  {availableUpsells.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          عروض Upsell الإضافية المتوفرة (أرباح إضافية فورية):
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          {selectedUpsellIds.size} مختار
                        </span>
                      </div>

                      <div className="space-y-2">
                        {availableUpsells.map((upsell) => {
                          const isSelected = selectedUpsellIds.has(upsell.id);
                          const upsellProfit = Number(upsell.profit) || Math.max(0, upsell.price - upsell.wholesalePrice);
                          return (
                            <div
                              key={upsell.id}
                              onClick={() => toggleUpsell(upsell.id)}
                              className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${
                                isSelected
                                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 shadow-xs'
                                  : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-amber-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition ${
                                    isSelected
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'border-2 border-slate-300 dark:border-slate-600'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>

                                {upsell.image && (
                                  <img
                                    src={upsell.image}
                                    alt={upsell.title}
                                    className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                  />
                                )}

                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                                    {upsell.title}
                                  </span>
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                                    +{upsellProfit} دج عمولة إضافية لك
                                  </span>
                                </div>
                              </div>

                              <div className="text-end shrink-0">
                                <span className="text-xs font-black text-slate-900 dark:text-white block">
                                  +{upsell.price} دج
                                </span>
                                {upsell.originalPrice && upsell.originalPrice > upsell.price && (
                                  <span className="text-[10px] text-slate-400 line-through block">
                                    {upsell.originalPrice} دج
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Total Summary Box (الإجمالي على الزبون & ربحك الصافي) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border border-purple-500/30 space-y-2">
                {orderTab === 'upsell' && activeTier && (
                  <div className="flex items-center justify-between text-xs px-1 border-b border-purple-200/60 pb-2">
                    <span className="text-purple-900 font-extrabold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      العرض المحدد: {activeTier.title}
                    </span>
                    {activeTier.savingsAmount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        توفير للزبون: {activeTier.savingsAmount.toLocaleString('ar-DZ')} دج
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                      الإجمالي على الزبون:
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      <MoneyText amount={totalAmount + shippingFee} />
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 dark:bg-purple-950/60 border border-purple-500/30">
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block mb-0.5">
                      ربحك الصافي:
                    </span>
                    <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                      +<MoneyText amount={totalProfit} />
                    </span>
                    {platformResellerCut > 0 && (
                      <span className="text-[9px] text-purple-500 dark:text-purple-400 block mt-0.5 font-bold">
                        (صافي بعد اقتطاع عمولة المنصة {resellerFeeRate}%: -{platformResellerCut} دج)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Customer Details & 69 Algerian Wilayas & Colis Api Fields */}
          {step === 2 && (
            <div className="space-y-3.5">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  بيانات العميل والشحن (API Colis Payload)
                </h3>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-md">
                  69 ولاية متاحة
                </span>
              </div>

              {/* NomComplet */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  الاسم الكامل للزبون (NomComplet) *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: محمد بن علي"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Mobile_1 & Mobile_2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    رقم الهاتف الرئيسي (Mobile_1) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0770707070"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    رقم هاتف ثاني (Mobile_2)
                  </label>
                  <input
                    type="tel"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                    placeholder="0550505050 (اختياري)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Wilayas Select (69 Wilayas) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    الولاية (69 ولاية - Wilaya) *
                  </label>
                  <select
                    value={selectedWilayaCode}
                    onChange={(e) => {
                      setSelectedWilayaCode(e.target.value);
                      const w = getWilayaByCode(e.target.value);
                      if (w.communes.length > 0) setCommune(w.communes[0]);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {ALGERIA_WILAYAS.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Commune */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    البلدية (Commune) *
                  </label>
                  <select
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {activeWilaya.communes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  العنوان التفصيلي (Adresse) *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="شارع الأمير عبد القادر، رقم العمارة..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Delivery mode & CodeStopdesk */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  نوع التوصيل (Stopdesk) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('home')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      deliveryType === 'home'
                        ? 'bg-purple-50 border-purple-500 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>توصيل للمنزل (Stopdesk=0)</span>
                    <span className="text-[10px] opacity-80">{activeWilaya.homeFee} دج</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('office')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      deliveryType === 'office'
                        ? 'bg-purple-50 border-purple-500 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>توصيل للمكتب (Stopdesk=1)</span>
                    <span className="text-[10px] opacity-80">{activeWilaya.officeFee} دج</span>
                  </button>
                </div>

                {deliveryType === 'office' && (
                  <div className="p-2.5 rounded-xl bg-purple-500/10 dark:bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">
                      رمز المكتب (CodeStopdesk):
                    </span>
                    <span className="font-mono font-black text-purple-600 dark:text-purple-400">
                      توليد وتعيين آلي عبر API شركة التوصيل ({activeWilaya.code}A) ✓
                    </span>
                  </div>
                )}
              </div>

              {/* Echange (طرد مبادلة) */}
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  طرد مبادلة (Echange)
                </label>
                <button
                  type="button"
                  onClick={() => setEchange(echange === 1 ? 0 : 1)}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    echange === 1
                      ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950 dark:text-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                  <span>{echange === 1 ? 'نعم - طرد مبادلة (Echange=1)' : 'لا - طرد عادي (Echange=0)'}</span>
                </button>
              </div>

              {/* NoteFournisseur */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ملاحظة المورد (NoteFournisseur)
                </label>
                <input
                  type="text"
                  value={noteFournisseur}
                  onChange={(e) => setNoteFournisseur(e.target.value)}
                  placeholder="ملاحظات الشحن أو التغليف..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Total Summary Box for Step 2 (الإجمالي على الزبون & ربحك الصافي في أسفل الخطوة) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border border-purple-500/30 grid grid-cols-2 gap-3 text-center mt-3">
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                    الإجمالي على الزبون:
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    <MoneyText amount={totalAmount + shippingFee} />
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 dark:bg-purple-950/60 border border-purple-500/30">
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block mb-0.5">
                    ربحك الصافي:
                  </span>
                  <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                    +<MoneyText amount={totalProfit} />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Confirmation & Receipt */}
          {step === 3 && createdOrderResult && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-md">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  تمت إضافة الطلبية بنجاح!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  رقم الطلبية: <span className="font-bold text-slate-900 dark:text-white">{createdOrderResult.id}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-start space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">اسم الزبون:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{createdOrderResult.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الهاتف:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{createdOrderResult.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الولاية والبلدية:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{createdOrderResult.wilaya} ({createdOrderResult.commune})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">نوع التوصيل:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {createdOrderResult.stopdesk === 1 ? `مكتب (Code: ${createdOrderResult.codeStopdesk || 'N/A'})` : 'توصيل للمنزل'}
                  </span>
                </div>
                {createdOrderResult.items && createdOrderResult.items.length > 1 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 block">العناصر والطلبات الإضافية:</span>
                    {createdOrderResult.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="text-slate-700 dark:text-slate-300">
                          {it.isUpsell ? '⚡ عرض: ' : '• '} {it.productName.replace(/^\[عرض إضافي\]\s*/, '')}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          <MoneyText amount={it.sellingPrice * it.quantity} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span className="text-slate-500">الإجمالي على الزبون:</span>
                  <span className="font-bold text-slate-900 dark:text-white"><MoneyText amount={createdOrderResult.totalAmount + createdOrderResult.shippingFee} /></span>
                </div>
                <div className="flex justify-between text-purple-600 font-extrabold pt-1">
                  <span>ربحك الصافي:</span>
                  <span>+<MoneyText amount={createdOrderResult.totalProfit} /></span>
                </div>
              </div>

              <button
                onClick={handleShareWhatsAppReceipt}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>إرسال وصل الطلب للزبون عبر واتساب</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Nav Bar Controls */}
        {step < 3 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-3 sticky bottom-0 z-10">
            {step > 1 && (
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
              >
                رجوع
              </button>
            )}

            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs transition shadow-md"
              >
                المتابعة لبيانات الشحن والزبون
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'جاري التسجيل...' : 'تأكيد وإرسال الطلبية'}</span>
              </button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 z-10">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs transition shadow-md"
            >
              إغلاق وحفظ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
