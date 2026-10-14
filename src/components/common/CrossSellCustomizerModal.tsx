import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Sparkles,
  ShoppingBag,
  Check,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  Layers,
  Palette,
  Ruler,
  AlertCircle,
  Truck,
  Zap,
} from 'lucide-react';
import { Product } from '../../types';

export interface CrossSellSelectionResult {
  selectedColor?: string;
  selectedSize?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedImage?: string;
}

export interface CrossSellCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  unitPrice: number;
  suggestedDiscountPercent?: number;
  onConfirm: (result: CrossSellSelectionResult) => void;
  isSubmitting?: boolean;
}

export const CrossSellCustomizerModal: React.FC<CrossSellCustomizerModalProps> = ({
  isOpen,
  onClose,
  product,
  unitPrice,
  suggestedDiscountPercent,
  onConfirm,
  isSubmitting = false,
}) => {
  if (!isOpen || !product) return null;

  // Extract unique available colors and sizes from variants
  const { colorsList, sizesList, defaultColor, defaultSize } = useMemo(() => {
    const rawVariants = product.variants || [];
    const colorSet = new Set<string>();
    const sizeSet = new Set<string>();

    rawVariants.forEach((v) => {
      if (v.color && v.color.trim()) colorSet.add(v.color.trim());
      if (v.size && v.size.trim()) sizeSet.add(v.size.trim());
    });

    const colors = Array.from(colorSet);
    const sizes = Array.from(sizeSet);

    return {
      colorsList: colors,
      sizesList: sizes,
      defaultColor: colors[0] || undefined,
      defaultSize: sizes[0] || undefined,
    };
  }, [product]);

  const [selectedColor, setSelectedColor] = useState<string | undefined>(defaultColor);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(defaultSize);
  const [quantity, setQuantity] = useState<number>(1);

  // Sync state if product changes
  useEffect(() => {
    setSelectedColor(defaultColor);
    setSelectedSize(defaultSize);
    setQuantity(1);
  }, [product, defaultColor, defaultSize]);

  // Determine current image based on selected color or fallback
  const currentImage = useMemo(() => {
    if (selectedColor && product.colorImages && product.colorImages[selectedColor]) {
      return product.colorImages[selectedColor];
    }
    if (selectedColor && product.variants) {
      const matchVariant = product.variants.find((v) => v.color === selectedColor && v.image);
      if (matchVariant?.image) return matchVariant.image;
    }
    return product.images?.[0] || '';
  }, [selectedColor, product]);

  // Calculate pricing
  const effectiveUnitPrice = useMemo(() => {
    if (suggestedDiscountPercent && suggestedDiscountPercent > 0) {
      const discounted = Math.round((unitPrice * (1 - suggestedDiscountPercent / 100)) / 50) * 50;
      return Math.max(discounted, 100);
    }
    return unitPrice;
  }, [unitPrice, suggestedDiscountPercent]);

  const totalPrice = effectiveUnitPrice * quantity;
  const originalTotal = unitPrice * quantity;
  const savings = originalTotal - totalPrice;

  const handleConfirm = () => {
    onConfirm({
      selectedColor,
      selectedSize,
      quantity,
      unitPrice: effectiveUnitPrice,
      totalPrice,
      selectedImage: currentImage,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full shadow-sm">
                  عرض خاص إضافي 🔥
                </span>
                <span className="text-xs text-emerald-100 font-medium">في نفس الطرد</span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight mt-0.5 line-clamp-1">
                تخصيص وإضافة المنتج للطلبية
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* Product Overview Card */}
          <div className="flex items-start gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-sm">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.nameAr}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                  <Package className="w-8 h-8" />
                </div>
              )}
              {suggestedDiscountPercent ? (
                <span className="absolute top-1 right-1 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow">
                  -{suggestedDiscountPercent}%
                </span>
              ) : null}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-black text-sm sm:text-base text-slate-900 leading-snug line-clamp-2">
                {product.nameAr}
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                {product.categoryAr || 'منتج مميز'}
              </p>

              {/* Price Details */}
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-black text-lg sm:text-xl text-emerald-600">
                  {effectiveUnitPrice.toLocaleString()} دج
                </span>
                {suggestedDiscountPercent && savings > 0 && (
                  <span className="text-xs text-slate-400 line-through">
                    {unitPrice.toLocaleString()} دج
                  </span>
                )}
              </div>

              {/* Free delivery with original order badge */}
              <div className="inline-flex items-center gap-1.5 mt-2 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-emerald-200/60">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>شحن موحّد مع نفس الطرد دون تكلفة توصيل إضافية! 🚚</span>
              </div>
            </div>
          </div>

          {/* Color Selection (if available) */}
          {colorsList.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <span>اختر اللون:</span>
                </label>
                {selectedColor && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {selectedColor}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {colorsList.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selection (if available) */}
          {sizesList.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-emerald-600" />
                  <span>اختر المقاس:</span>
                </label>
                {selectedSize && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {selectedSize}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {sizesList.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-10 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{size}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>الكمية المطلوبة:</span>
            </label>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                كم قطعة ترغب بإضافتها لطردك؟
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1 || isSubmitting}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-black text-base text-slate-900 w-6 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.min(10, prev + 1))}
                  disabled={quantity >= 10 || isSubmitting}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Total Summary Callout */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 font-bold block">
                المجموع الإضافي الصافي:
              </span>
              {savings > 0 && (
                <span className="text-[11px] text-emerald-700 font-semibold">
                  وفرت {savings.toLocaleString()} دج بفضل عرض الحزمة! 🎁
                </span>
              )}
            </div>
            <div className="text-left font-black text-xl text-emerald-700">
              {totalPrice.toLocaleString()} <span className="text-xs font-bold">دج</span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer text-center"
          >
            إلغاء التراجع
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-2 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري الإضافة للطلب...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>تأكيد الإضافة بضغطة زر 🚀</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrossSellCustomizerModal;
