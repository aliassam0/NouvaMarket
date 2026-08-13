import React, { useState } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Truck, User, ShoppingBag, ShieldCheck, Zap, Share2, Repeat, Code, Hash, Globe, FileText } from 'lucide-react';
import { Product, ProductVariant, Order } from '../../types';
import { MOCK_PRODUCTS } from '../../data/mockProducts';
import { ALGERIA_WILAYAS, getWilayaByCode } from '../../data/algeriaLocations';
import { useOrders } from '../../context/OrderContext';
import { useLanguage } from '../../context/LanguageContext';
import { MoneyText } from '../ui/MoneyText';
import { ProfitBadge } from '../ui/ProfitBadge';
import { calculateProfit } from '../../lib/formatters';

interface NewOrderModalProps {
  initialProduct?: Product | null;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export function NewOrderModal({ initialProduct, onClose, onShowToast }: NewOrderModalProps) {
  const { createOrder, getWhatsAppReceiptText } = useOrders();
  const { t, language } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Product & Quantity Selection
  const [selectedProduct, setSelectedProduct] = useState<Product>(initialProduct || MOCK_PRODUCTS[0]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    initialProduct?.variants[0] || MOCK_PRODUCTS[0].variants[0]
  );
  const [sellingPrice, setSellingPrice] = useState<number>(
    initialProduct?.suggestedSellingPrice || MOCK_PRODUCTS[0].suggestedSellingPrice
  );
  const [quantity, setQuantity] = useState<number>(1);

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

  const itemProfit = calculateProfit(selectedProduct.wholesalePrice, sellingPrice);
  const totalProfit = itemProfit * quantity;
  const totalAmount = sellingPrice * quantity;

  const handleSubmitOrder = async () => {
    if (!customerName || !phone) {
      onShowToast('يرجى كتابة اسم ورقم هاتف الزبون الرئيسية');
      return;
    }

    setIsSubmitting(true);
    const effectiveCodeStopdesk = codeStopdesk || `${activeWilaya.code}A`;

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
        {
          productId: selectedProduct.id,
          productName: selectedProduct.nameAr,
          productImage: selectedProduct.images[0],
          variantSize: selectedVariant.size,
          variantColor: selectedVariant.color,
          quantity,
          wholesalePrice: selectedProduct.wholesalePrice,
          sellingPrice,
          profit: itemProfit,
        }
      ],
      totalAmount,
      shippingFee,
      totalProfit,
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
            <Zap className="w-5 h-5 text-emerald-500 fill-current" />
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
          <div className={`h-1.5 flex-1 rounded-full transition ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
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
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ربحك/قطعة: +<MoneyText amount={itemProfit} />
                  </div>
                </div>
              </div>

              {/* Selling Price Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  سعر البيع المختار للزبون (دج):
                </label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        selectedVariant.id === v.id
                          ? 'bg-emerald-600 text-white border-emerald-600'
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
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 font-bold text-slate-800 dark:text-white"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 font-bold text-slate-800 dark:text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Summary Box (الإجمالي على الزبون & ربحك الصافي) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-950/40 dark:to-emerald-950/40 border border-emerald-500/30 grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                    الإجمالي على الزبون:
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    <MoneyText amount={totalAmount + shippingFee} />
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block mb-0.5">
                    ربحك الصافي:
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    +<MoneyText amount={totalProfit} />
                  </span>
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
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
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
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>توصيل للمكتب (Stopdesk=1)</span>
                    <span className="text-[10px] opacity-80">{activeWilaya.officeFee} دج</span>
                  </button>
                </div>

                {deliveryType === 'office' && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">
                      رمز المكتب (CodeStopdesk):
                    </span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
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
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-950/40 dark:to-emerald-950/40 border border-emerald-500/30 grid grid-cols-2 gap-3 text-center mt-3">
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                    الإجمالي على الزبون:
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    <MoneyText amount={totalAmount + shippingFee} />
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block mb-0.5">
                    ربحك الصافي:
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    +<MoneyText amount={totalProfit} />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Confirmation & Receipt */}
          {step === 3 && createdOrderResult && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
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
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span className="text-slate-500">الإجمالي على الزبون:</span>
                  <span className="font-bold text-slate-900 dark:text-white"><MoneyText amount={createdOrderResult.totalAmount + createdOrderResult.shippingFee} /></span>
                </div>
                <div className="flex justify-between text-emerald-600 font-extrabold pt-1">
                  <span>ربحك الصافي:</span>
                  <span>+<MoneyText amount={createdOrderResult.totalProfit} /></span>
                </div>
              </div>

              <button
                onClick={handleShareWhatsAppReceipt}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md"
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
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2"
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
