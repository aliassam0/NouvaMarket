import React, { useState } from 'react';
import { ShoppingBag, Check, ArrowRight, Truck, ShieldCheck, User, Phone, MapPin, Building2, PackageCheck, Sparkles, ShoppingCart, RefreshCw, X } from 'lucide-react';
import { Product, Order } from '../../types';
import { ALGERIA_WILAYAS, getWilayaByCode } from '../../data/algeriaLocations';
import { useOrders } from '../../context/OrderContext';
import { useLanguage } from '../../context/LanguageContext';
import { MoneyText } from '../ui/MoneyText';
import { getProductShareConfig, getShareLinkById } from '../../utils/shareUtils';
import { ProductImageSlider } from '../common/ProductImageSlider';
import { isStandardSize, isStandardColor } from '../../utils/variantUtils';

interface CustomerShareOrderViewProps {
  product: Product;
  onBackToApp: () => void;
  onShowToast: (msg: string) => void;
}

export function CustomerShareOrderView({ product, onBackToApp, onShowToast }: CustomerShareOrderViewProps) {
  const { createOrder } = useOrders();
  const { language } = useLanguage();

  const searchParams = new URLSearchParams(window.location.search);
  const linkIdParam = searchParams.get('linkId');

  const shareLink = getShareLinkById(
    product.id,
    linkIdParam,
    product.suggestedSellingPrice || product.wholesalePrice + 1000,
    product.variants[0]?.size || 'Standard',
    product.variants[0]?.color || 'Standard'
  );

  const [activeImage, setActiveImage] = useState(product.images[0] || '');
  const [selectedSize, setSelectedSize] = useState(shareLink.size);
  const [selectedColor, setSelectedColor] = useState(shareLink.color);
  const [quantity, setQuantity] = useState(shareLink.quantity || 1);
  const sellingPrice = shareLink.sellingPrice;

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

  const activeWilaya = getWilayaByCode(selectedWilayaCode);
  const shippingFee = deliveryType === 'home' ? activeWilaya.homeFee : activeWilaya.officeFee;
  const totalAmount = sellingPrice * quantity + shippingFee;

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

  const availableSizes = Array.from(new Set(product.variants.map((v) => v.size))).filter((s) => !isStandardSize(s));
  const availableColors = Array.from(new Set(product.variants.map((v) => v.color))).filter((c) => !isStandardColor(c));
  const hasSpecs = availableSizes.length > 0 || availableColors.length > 0;

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      onShowToast('يرجى إدخال الاسم واللقب لتقديم الطلب');
      return;
    }
    if (!phone.trim() || phone.length < 9) {
      onShowToast('يرجى إدخال رقم هاتف صحيح متكون من 10 أرقام');
      return;
    }

    setIsSubmitting(true);
    const effectiveCodeStopdesk = codeStopdesk || `${activeWilaya.code}A`;

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
      noteFournisseur: noteFournisseur.trim(),
      idExterne: `ORD-LINK-${Math.floor(1000 + Math.random() * 9000)}`,
      items: [
        {
          productId: product.id,
          productName: product.nameAr,
          productImage: activeImage || product.images[0],
          variantSize: selectedSize,
          variantColor: selectedColor,
          quantity,
          wholesalePrice: product.wholesalePrice,
          sellingPrice,
          profit: sellingPrice - product.wholesalePrice,
        },
      ],
      totalAmount,
      shippingFee,
      totalProfit: (sellingPrice - product.wholesalePrice) * quantity,
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
      onShowToast('🎉 تم إرسال طلبك بنجاح! سنتصل بك قريباً لتأكيد الطلب.');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      onShowToast('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28 sm:pb-12">
      {/* Top Header - Hidden on Thank You page to protect seller dashboard privacy */}
      {!isSubmitted && (
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/20">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                    الدفع عند الاستلام 💵
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">توصيل سريع لكافة الولايات 🚚</p>
              </div>
            </div>
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
                  {selectedSize} / {selectedColor} (x{quantity})
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>مكان والتوصيل:</span>
                <span className="font-bold">
                  {activeWilaya.nameAr} ({deliveryType === 'home' ? 'للمنزل' : 'للمكتب Stopdesk'})
                </span>
              </div>
              <div className="flex justify-between items-center font-black text-sm text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2.5">
                <span>المبلغ الإجمالي عند الاستلام:</span>
                <span className="text-purple-600 dark:text-purple-400 text-base">
                  <MoneyText amount={totalAmount} />
                </span>
              </div>
            </div>

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
          <form onSubmit={handleConfirmOrder} className="space-y-4">
            {/* 1. Product Gallery Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <ProductImageSlider
                images={product.images}
                alt={product.nameAr}
                aspectRatio="aspect-4/3 sm:aspect-square"
                showDownloadBtn={false}
                badge={
                  <span className="bg-purple-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md">
                    متوفر جاهز للشحن ⚡
                  </span>
                }
              />

              {/* Name & Price */}
              <div className="pt-1 space-y-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                  {product.nameAr}
                </h2>

                <div className="flex items-baseline justify-between bg-purple-50 dark:bg-purple-950/40 p-3 rounded-2xl border border-purple-200 dark:border-purple-800/80">
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">السعر للقطعة:</span>
                    <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                      <MoneyText amount={sellingPrice} />
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    ضمان جودة المنتج
                  </span>
                </div>

                {product.descriptionAr && (
                  <div className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs mt-3">
                    {product.descriptionAr}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Variants (Size / Color / Quantity) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              {hasSpecs && (
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>المواصفات والكمية</span>
                </h3>
              )}

              {/* Sizes */}
              {availableSizes.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    اختر المقاس: <span className="text-purple-600 font-extrabold">{selectedSize}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`min-h-[42px] min-w-[50px] px-4 py-2 rounded-xl font-extrabold text-xs border transition cursor-pointer flex items-center justify-center ${
                          selectedSize === sz
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 ring-2 ring-purple-500/30'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {availableColors.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    اختر اللون: <span className="text-purple-600 font-extrabold">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((cl) => (
                      <button
                        key={cl}
                        type="button"
                        onClick={() => setSelectedColor(cl)}
                        className={`min-h-[42px] px-4 py-2 rounded-xl font-extrabold text-xs border transition cursor-pointer flex items-center justify-center ${
                          selectedColor === cl
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 ring-2 ring-purple-500/30'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        {cl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Counter */}
              <div className={`flex items-center justify-between ${hasSpecs ? 'pt-2 border-t border-slate-100 dark:border-slate-800' : ''}`}>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">الكمية المطلوبة:</span>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 shadow-xs active:scale-95 text-slate-900 dark:text-white font-black text-base flex items-center justify-center transition"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-black text-base text-slate-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 shadow-xs active:scale-95 text-slate-900 dark:text-white font-black text-base flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Customer Info Form */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                <User className="w-4 h-4 text-purple-600" />
                <span>معلومات المشتري والعنوان</span>
              </h3>

              {/* Full Name Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  الاسم واللقب الكامل <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: محمد بوعلي"
                    className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-800 transition outline-hidden"
                  />
                </div>
              </div>

              {/* Phones Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    رقم الهاتف الرئيسية <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
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
                      onChange={(e) => setPhone2(e.target.value)}
                      placeholder="07XXXXXXXX"
                      className="w-full pr-10 pl-3.5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-800 transition outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Wilaya & Commune */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    الولاية (69 ولاية): <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedWilayaCode}
                    onChange={(e) => {
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

              {/* Address */}
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

              {/* Delivery Options */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">طريقة التوصيل:</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('home')}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                      deliveryType === 'home'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
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
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
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

              {/* Notes / Special Instructions */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">ملاحظات خاصة (اختياري):</label>
                <input
                  type="text"
                  value={noteFournisseur}
                  onChange={(e) => setNoteFournisseur(e.target.value)}
                  placeholder="ملاحظات حول التغليف، توقيت الاتصال..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-purple-500 transition outline-hidden"
                />
              </div>

              {/* Order Total Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>سعر المنتج ({quantity} قطعة):</span>
                  <span className="font-bold">
                    <MoneyText amount={sellingPrice * quantity} />
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>شحن ({activeWilaya.nameAr}):</span>
                  <span className="font-bold">
                    <MoneyText amount={shippingFee} />
                  </span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span>المبلغ الإجمالي الدفع عند الاستلام:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono text-base">
                    <MoneyText amount={totalAmount} />
                  </span>
                </div>
              </div>
            </div>

            {/* Inline Desktop Submit Button */}
            <div className="hidden sm:block pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-black text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>{isSubmitting ? 'جاري إرسال الطلب...' : 'تأكيد الطلب الآن 🛍️'}</span>
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Sticky Bottom Bar on Mobile */}
      {!isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 shadow-2xl">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">المبلغ الإجمالي:</span>
              <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono">
                <MoneyText amount={totalAmount} />
              </span>
            </div>

            <button
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-purple-600 active:bg-purple-700 active:scale-98 text-white font-black text-xs shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : 'تأكيد الطلب 🛍️'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

