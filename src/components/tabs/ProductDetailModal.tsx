import React, { useState } from 'react';
import { X, Share2, Download, Sparkles, CheckCircle2, ChevronLeft, ChevronRight, Zap, Copy, Heart, Layers, Gift, Check, ArrowUpRight } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useOrders } from '../../context/OrderContext';
import { MoneyText } from '../ui/MoneyText';
import { ProfitBadge } from '../ui/ProfitBadge';
import { calculateProfit } from '../../lib/formatters';
import { ProductImageSlider } from '../common/ProductImageSlider';
import { isUnifiedProduct } from '../../utils/variantUtils';
import { ProductDescriptionView } from '../common/ProductDescriptionView';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOrderNow: (product: Product, selectedVariant: ProductVariant, customSellingPrice: number) => void;
  onGenerateAiCopy: (product: Product, sellingPrice: number, profit: number) => void;
  onShowToast: (msg: string) => void;
  onOpenSyncToStore?: (product: Product) => void;
}

export function ProductDetailModal({
  product,
  onClose,
  onOrderNow,
  onGenerateAiCopy,
  onShowToast,
  onOpenSyncToStore,
}: ProductDetailModalProps) {
  const { t, language } = useLanguage();
  const { favorites = [], toggleFavorite } = useOrders();

  if (!product) return null;

  const isFavorited = favorites.includes(product.id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0] || { id: 'v0', size: '1-2y', color: 'أزرق', colorHex: '#000', stockCount: 10 }
  );

  const allImages = React.useMemo(() => {
    const list = [...(product.images || [])];
    if (product.variants) {
      product.variants.forEach((v) => {
        if (v.image && !list.includes(v.image)) {
          list.push(v.image);
        }
      });
    }
    if (product.colorImages) {
      Object.values(product.colorImages).forEach((img) => {
        if (img && !list.includes(img)) {
          list.push(img);
        }
      });
    }
    return list;
  }, [product.images, product.variants, product.colorImages]);

  const selectedVariantImage =
    selectedVariant.image ||
    (selectedVariant.color ? product.colorImages?.[selectedVariant.color.trim()] : undefined);

  // Live Profit Calculator State (Sprint 3 Core Feature)
  const [sellingPrice, setSellingPrice] = useState<number>(product.suggestedSellingPrice);

  const profit = calculateProfit(product.wholesalePrice, sellingPrice);

  const handlePriceSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSellingPrice(Number(e.target.value));
  };

  const handleShareWhatsAppKit = () => {
    const shareText = `*${product.nameAr}* 🛍️\nالفئة العمرية: ${product.ageGroup}\nسعر البيع المميز: ${sellingPrice}دج\n\nتوصيل سريع لجميع 69 ولاية بأسعار تنافسية! 📦\nللحجز والطلب، يرجى الرد على هذه الرسالة.`;

    const encoded = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyMarketingText = () => {
    const text = `${product.nameAr}\n${product.descriptionAr}\nالسعر: ${sellingPrice}دج\nالتوصيل متوفر لـ 69 ولاية والدفع عند الاستلام.`;
    navigator.clipboard.writeText(text);
    onShowToast('تم نسخ النص التسويقي بنجاح!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl overflow-y-auto flex flex-col shadow-2xl relative">
        {/* Modal Top Floating Actions */}
        <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
          {/* Favorite Toggle Button */}
          <button
            type="button"
            onClick={() => {
              toggleFavorite(product.id);
              onShowToast(
                isFavorited ? 'تمت إزالة المنتج من المفضلة' : 'تمت إضافة المنتج إلى المفضلة ❤️'
              );
            }}
            className="pointer-events-auto p-2 rounded-full bg-slate-900/60 text-white backdrop-blur-md hover:bg-slate-900 transition shadow-lg cursor-pointer flex items-center gap-1.5 px-3"
            title={isFavorited ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorited ? 'fill-rose-500 text-rose-500' : 'text-white'
              }`}
            />
            <span className="text-[11px] font-extrabold">
              {isFavorited ? 'مفضل' : 'حفظ'}
            </span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="pointer-events-auto p-2 rounded-full bg-slate-900/60 text-white backdrop-blur-md hover:bg-slate-900 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Image Gallery Slider */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/80">
          <ProductImageSlider
            images={allImages}
            selectedImage={selectedVariantImage}
            alt={product.nameAr}
            aspectRatio="aspect-4/3"
            showDownloadBtn={true}
            onShowToast={onShowToast}
            onImageChange={(idx) => setActiveImageIndex(idx)}
          />
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 text-xs font-bold">
                {product.ageGroup}
              </span>
              <span className="text-xs text-slate-500">{product.categoryAr}</span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {language === 'ar' ? product.nameAr : product.nameFr}
            </h2>
          </div>

          {/* === CORE LIVE PROFIT CALCULATOR (Sprint 3) === */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950 text-white space-y-3 shadow-md border border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t('calc.title')}</span>
              </span>
              <button
                onClick={() => setSellingPrice(product.suggestedSellingPrice)}
                className="text-[11px] font-bold text-violet-300 hover:underline"
              >
                {t('calc.suggested')}
              </button>
            </div>

            {/* Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{t('calc.sellingPrice')}</span>
                <span className="text-base font-black text-white">
                  <MoneyText amount={sellingPrice} />
                </span>
              </div>
              <input
                type="range"
                min={product.floorPrice}
                max={product.ceilingPrice}
                step={100}
                value={sellingPrice}
                onChange={handlePriceSliderChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>أدنى: {product.floorPrice}دج</span>
                <span>أقصى: {product.ceilingPrice}دج</span>
              </div>
            </div>

            {/* Live Net Profit Result */}
            <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/40 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-purple-200 block">{t('calc.netProfit')}</span>
                <span className="text-xs text-slate-300">
                  (الجملة: <MoneyText amount={product.wholesalePrice} />)
                </span>
              </div>
              <div className="text-lg font-black text-purple-300">
                +<MoneyText amount={profit} />
              </div>
            </div>
          </div>

          {/* Upsell Offers & Bundles Display (عروض الـ UpSell وحساب الأرباح) */}
          {product.upsells && product.upsells.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-purple-50/80 via-white to-purple-50/40 dark:from-purple-950/30 dark:via-slate-900/60 dark:to-purple-950/20 border border-purple-200/90 dark:border-purple-800/40 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>عروض الـ UpSell المتاحة لهذا المنتج</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300/40">
                        {product.upsells.length} عروض
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      باقات وعروض كميات ترفع قيمة السلة مع حساب تلقائي لربحك
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.upsells.map((upsell, uIdx) => {
                  const uPrice = Number(upsell.price) || 0;
                  const uWholesale = Number(upsell.wholesalePrice) || 0;
                  // Automatically calculate profit if not provided: (Price - Wholesale)
                  const autoProfit = Number(upsell.profit) || Math.max(0, uPrice - uWholesale);
                  const originalPrice = Number(upsell.originalPrice) || 0;
                  const savings = originalPrice > uPrice ? originalPrice - uPrice : 0;

                  return (
                    <div
                      key={upsell.id || uIdx}
                      className={`p-3 rounded-xl border transition-all duration-200 relative flex flex-col justify-between gap-2.5 ${
                        upsell.isDefaultSelected
                          ? 'bg-purple-500/10 dark:bg-purple-900/25 border-purple-400 dark:border-purple-600 shadow-xs ring-1 ring-purple-400/30'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-purple-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Top row: Title + Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-black text-slate-900 dark:text-white block leading-snug truncate">
                            {upsell.title}
                          </span>
                          {upsell.description && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {upsell.description}
                            </span>
                          )}
                        </div>

                        {upsell.badge ? (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 shrink-0">
                            {upsell.badge}
                          </span>
                        ) : upsell.isDefaultSelected ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0">
                            موصى به
                          </span>
                        ) : null}
                      </div>

                      {/* Middle: Price & Wholesale */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] block">سعر العرض للزبون</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                              <MoneyText amount={uPrice} />
                            </span>
                            {savings > 0 && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {originalPrice} دج
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Automated Profit calculation badge */}
                        <div className="text-end">
                          <span className="text-purple-600 dark:text-purple-400 text-[10px] font-bold block">
                            ربحك الصافي:
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300/40">
                            +<MoneyText amount={autoProfit} />
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Button for this UpSell */}
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOrderNow(product, selectedVariant, uPrice);
                        }}
                        className="w-full py-1.5 px-2 rounded-lg bg-purple-600/10 hover:bg-purple-600 hover:text-white text-purple-700 dark:text-purple-300 dark:hover:text-white border border-purple-300 dark:border-purple-700 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer active:scale-98"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>طلب هذا العرض مباشرة ({uPrice} دج)</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variants Selector */}
          {!isUnifiedProduct(product.variants) && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                اختر المقاس واللون المتاح:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant.id === variant.id;
                  const variantImg =
                    variant.image || (variant.color ? product.colorImages?.[variant.color.trim()] : undefined);

                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                        isSelected
                          ? 'bg-violet-600 text-white border-violet-600 shadow-xs ring-1 ring-violet-400/40'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-300'
                      }`}
                    >
                      {variantImg ? (
                        <img
                          src={variantImg}
                          alt={variant.color}
                          className="w-4 h-4 rounded-full object-cover border border-white/50 inline-block shrink-0"
                        />
                      ) : (
                        <span
                          className="w-3 h-3 rounded-full border border-white/50 inline-block shrink-0"
                          style={{ backgroundColor: variant.colorHex }}
                        />
                      )}
                      <span>{variant.size}</span>
                      <span>•</span>
                      <span>{variant.color}</span>
                      <span className="text-[10px] opacity-80">({variant.stockCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Marketing Kit & AI Generator Tools */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              🛠️ أدوات التسويق الجاهزة:
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={handleShareWhatsAppKit}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>مشاركة الواتساب</span>
              </button>

              <button
                onClick={() => onGenerateAiCopy(product, sellingPrice, profit)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white transition shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>توليد إعلان Gemini AI</span>
              </button>
            </div>

            {/* 1-Click Store Sync button */}
            {onOpenSyncToStore && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSyncToStore(product);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 active:scale-98 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition"
              >
                <span>🚀 تصدير إلى متجري بنقرة واحدة (Shopify / YouCan / WooCommerce)</span>
              </button>
            )}
          </div>

          {/* Product Description */}
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">الوصف والتفاصيل:</h4>
            <ProductDescriptionView
              description={language === 'ar' ? product.descriptionAr : product.descriptionFr}
              descriptionImages={product.descriptionImages}
              productName={language === 'ar' ? product.nameAr : product.nameFr}
            />
          </div>
        </div>

        {/* Modal Bottom CTA Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-3 sticky bottom-0 z-10">
          <button
            onClick={() => {
              onClose();
              onOrderNow(product, selectedVariant, sellingPrice);
            }}
            className="flex-1 py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-lg"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>إنشاء طلبية فورية لهذا المنتج</span>
          </button>
        </div>
      </div>
    </div>
  );
}
