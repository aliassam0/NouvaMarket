import React, { useState } from 'react';
import { Sparkles, Check, Tag, Plus, Edit2, ChevronDown, ChevronUp, Layers, Gift, Percent, ArrowUpRight, DollarSign } from 'lucide-react';
import { Product, ProductVariant, UpsellOffer } from '../../types';
import { MoneyText } from '../ui/MoneyText';

export interface QuantityUpsellTier {
  id: string;
  quantity: number;
  title: string;
  badge?: string;
  totalPrice: number;
  originalTotalPrice: number;
  unitPrice: number;
  savingsAmount: number;
  wholesaleCost: number;
  netProfit: number;
  isPopular?: boolean;
  itemVariants: {
    itemIndex: number;
    variantId: string;
    size: string;
    color: string;
  }[];
}

interface OrderUpsellTiersProps {
  product: Product;
  baseSellingPrice: number;
  variants: ProductVariant[];
  selectedTierId: string | null;
  onSelectTier: (tier: QuantityUpsellTier) => void;
  tiers: QuantityUpsellTier[];
  onUpdateTiers: (updatedTiers: QuantityUpsellTier[]) => void;
  availableAddonUpsells?: UpsellOffer[];
  selectedAddonUpsellIds?: Set<string>;
  onToggleAddonUpsell?: (upsellId: string) => void;
}

export function generateDefaultTiers(
  product: Product,
  baseSellingPrice: number,
  variants: ProductVariant[]
): QuantityUpsellTier[] {
  const defaultVar = variants[0] || { id: 'var-default', size: 'موحد', color: 'افتراضي' };
  const wholesale = product.wholesalePrice || 0;

  // Tier 1: 1 piece
  const t1Original = baseSellingPrice;
  const t1Total = baseSellingPrice;
  const t1Profit = Math.max(0, t1Total - wholesale);

  // Tier 2: 2 pieces (around 10-15% discount on 2nd piece, nicely rounded)
  const t2Original = baseSellingPrice * 2;
  const rawDiscount2 = Math.round((baseSellingPrice * 0.2) / 100) * 100 || 500;
  const t2Total = Math.max(wholesale * 2 + 500, t2Original - rawDiscount2);
  const t2Profit = Math.max(0, t2Total - wholesale * 2);

  // Tier 3: 3 pieces (larger discount, best seller bundle)
  const t3Original = baseSellingPrice * 3;
  const rawDiscount3 = Math.round((baseSellingPrice * 0.45) / 100) * 100 || 1200;
  const t3Total = Math.max(wholesale * 3 + 1000, t3Original - rawDiscount3);
  const t3Profit = Math.max(0, t3Total - wholesale * 3);

  return [
    {
      id: 'tier-1',
      quantity: 1,
      title: 'قطعة واحدة (الطلب الأساسي)',
      badge: 'الطلب الفردي',
      totalPrice: t1Total,
      originalTotalPrice: t1Original,
      unitPrice: t1Total,
      savingsAmount: 0,
      wholesaleCost: wholesale,
      netProfit: t1Profit,
      isPopular: false,
      itemVariants: [
        { itemIndex: 1, variantId: defaultVar.id, size: defaultVar.size, color: defaultVar.color },
      ],
    },
    {
      id: 'tier-2',
      quantity: 2,
      title: 'قطعتين (عرض التوفير المزدوج)',
      badge: `وفر ${t2Original - t2Total} دج ⚡`,
      totalPrice: t2Total,
      originalTotalPrice: t2Original,
      unitPrice: Math.round(t2Total / 2),
      savingsAmount: Math.max(0, t2Original - t2Total),
      wholesaleCost: wholesale * 2,
      netProfit: t2Profit,
      isPopular: true,
      itemVariants: [
        { itemIndex: 1, variantId: defaultVar.id, size: defaultVar.size, color: defaultVar.color },
        { itemIndex: 2, variantId: defaultVar.id, size: defaultVar.size, color: defaultVar.color },
      ],
    },
    {
      id: 'tier-3',
      quantity: 3,
      title: '3 قطع (العرض الذهبي الأكثر ربحية)',
      badge: `وفر ${t3Original - t3Total} دج 🔥`,
      totalPrice: t3Total,
      originalTotalPrice: t3Original,
      unitPrice: Math.round(t3Total / 3),
      savingsAmount: Math.max(0, t3Original - t3Total),
      wholesaleCost: wholesale * 3,
      netProfit: t3Profit,
      isPopular: false,
      itemVariants: [
        { itemIndex: 1, variantId: defaultVar.id, size: defaultVar.size, color: defaultVar.color },
        { itemIndex: 2, variantId: defaultVar.id, size: defaultVar.size, color: defaultVar.color },
        { itemIndex: 3, variantId: defaultVar.id, size: defaultVar.size, color: defaultVar.color },
      ],
    },
  ];
}

export function OrderUpsellTiers({
  product,
  baseSellingPrice,
  variants,
  selectedTierId,
  onSelectTier,
  tiers,
  onUpdateTiers,
  availableAddonUpsells = [],
  selectedAddonUpsellIds = new Set(),
  onToggleAddonUpsell,
}: OrderUpsellTiersProps) {
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState<string>('');
  const [isAddingCustomTier, setIsAddingCustomTier] = useState(false);
  const [customQty, setCustomQty] = useState<number>(4);
  const [customPrice, setCustomPrice] = useState<number>(baseSellingPrice * 4 - 2000);
  const [showVariantsAccordion, setShowVariantsAccordion] = useState(true);

  const selectedTier = tiers.find((t) => t.id === selectedTierId) || tiers[0];
  const wholesale = product.wholesalePrice || 0;

  // Handle tier price update
  const handleSavePriceEdit = (tierId: string) => {
    const newPrice = Number(editPriceVal);
    if (!newPrice || newPrice <= 0) {
      setEditingTierId(null);
      return;
    }

    const updated = tiers.map((tier) => {
      if (tier.id === tierId) {
        const originalTotal = baseSellingPrice * tier.quantity;
        const wholesaleCost = wholesale * tier.quantity;
        const savings = Math.max(0, originalTotal - newPrice);
        const profit = Math.max(0, newPrice - wholesaleCost);

        return {
          ...tier,
          totalPrice: newPrice,
          originalTotalPrice: originalTotal,
          unitPrice: Math.round(newPrice / tier.quantity),
          savingsAmount: savings,
          wholesaleCost,
          netProfit: profit,
          badge: savings > 0 ? `وفر ${savings} دج ⚡` : undefined,
        };
      }
      return tier;
    });

    onUpdateTiers(updated);
    setEditingTierId(null);

    // If currently selected, re-select updated
    const newSelected = updated.find((t) => t.id === tierId);
    if (newSelected && selectedTierId === tierId) {
      onSelectTier(newSelected);
    }
  };

  // Add custom quantity tier
  const handleAddCustomTier = () => {
    if (customQty < 1 || customPrice <= 0) return;

    const originalTotal = baseSellingPrice * customQty;
    const wholesaleCost = wholesale * customQty;
    const savings = Math.max(0, originalTotal - customPrice);
    const profit = Math.max(0, customPrice - wholesaleCost);
    const defaultVar = variants[0] || { id: 'var-default', size: 'موحد', color: 'افتراضي' };

    const newTier: QuantityUpsellTier = {
      id: `tier-custom-${Date.now()}`,
      quantity: customQty,
      title: `${customQty} قطع (عرض خاص مخصص)`,
      badge: savings > 0 ? `وفر ${savings} دج ✨` : 'عرض مخصص',
      totalPrice: customPrice,
      originalTotalPrice: originalTotal,
      unitPrice: Math.round(customPrice / customQty),
      savingsAmount: savings,
      wholesaleCost,
      netProfit: profit,
      isPopular: false,
      itemVariants: Array.from({ length: customQty }, (_, i) => ({
        itemIndex: i + 1,
        variantId: defaultVar.id,
        size: defaultVar.size,
        color: defaultVar.color,
      })),
    };

    const updated = [...tiers, newTier];
    onUpdateTiers(updated);
    onSelectTier(newTier);
    setIsAddingCustomTier(false);
  };

  // Update variant for a specific item inside the selected tier
  const handleItemVariantChange = (itemIdx: number, variant: ProductVariant) => {
    if (!selectedTier) return;

    const updatedVariants = selectedTier.itemVariants.map((iv) => {
      if (iv.itemIndex === itemIdx) {
        return {
          ...iv,
          variantId: variant.id,
          size: variant.size,
          color: variant.color,
        };
      }
      return iv;
    });

    const updatedTier: QuantityUpsellTier = {
      ...selectedTier,
      itemVariants: updatedVariants,
    };

    const updatedTiers = tiers.map((t) => (t.id === selectedTier.id ? updatedTier : t));
    onUpdateTiers(updatedTiers);
    onSelectTier(updatedTier);
  };

  // Apply one variant to all items in bundle
  const handleApplyVariantToAll = (variant: ProductVariant) => {
    if (!selectedTier) return;

    const updatedVariants = selectedTier.itemVariants.map((iv) => ({
      ...iv,
      variantId: variant.id,
      size: variant.size,
      color: variant.color,
    }));

    const updatedTier: QuantityUpsellTier = {
      ...selectedTier,
      itemVariants: updatedVariants,
    };

    const updatedTiers = tiers.map((t) => (t.id === selectedTier.id ? updatedTier : t));
    onUpdateTiers(updatedTiers);
    onSelectTier(updatedTier);
  };

  return (
    <div className="space-y-4">
      {/* Informative Header Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <span>استراتيجية مضاعفة المبيعات (Tiered Upsell)</span>
            <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white text-[9px] font-black">
              أرباح مضاعفة
            </span>
          </h4>
          <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
            اختر العرض المناسب للزبون (1 أو 2 أو 3 قطع أو أكثر) بسعر مخفض ومغري لتشجيعه على زيادة مشترياته ومضاعفة أرباحك الصافية.
          </p>
        </div>
      </div>

      {/* Tier Cards Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            باقات الكميات المتاحة:
          </span>
          <button
            type="button"
            onClick={() => setIsAddingCustomTier(!isAddingCustomTier)}
            className="text-[11px] font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة باقة مخصصة</span>
          </button>
        </div>

        {/* Custom Tier Creation Inline Box */}
        {isAddingCustomTier && (
          <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-300 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-purple-600" />
                إنشاء باقة كميات جديدة (الخ...):
              </span>
              <button
                type="button"
                onClick={() => setIsAddingCustomTier(false)}
                className="text-[11px] text-slate-500 hover:text-slate-700"
              >
                إلغاء
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">عدد القطع:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={customQty}
                  onChange={(e) => {
                    const q = Math.max(1, Number(e.target.value));
                    setCustomQty(q);
                    setCustomPrice(baseSellingPrice * q - q * 400);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">سعر البيع الإجمالي (دج):</label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs font-bold text-slate-900 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-1">
              <span className="text-slate-600">
                التكلفة: <MoneyText amount={wholesale * customQty} />
              </span>
              <span className="font-extrabold text-emerald-600">
                ربحك المقدر: +<MoneyText amount={Math.max(0, customPrice - wholesale * customQty)} />
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddCustomTier}
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition shadow-xs"
            >
              حفظ وإضافة هذه الباقة
            </button>
          </div>
        )}

        {/* List of Tiers */}
        {tiers.map((tier) => {
          const isSelected = selectedTier?.id === tier.id;
          const isEditing = editingTierId === tier.id;
          const baseProfitSingle = Math.max(0, baseSellingPrice - wholesale);
          const extraProfit = Math.max(0, tier.netProfit - baseProfitSingle);

          return (
            <div
              key={tier.id}
              onClick={() => {
                if (!isEditing) onSelectTier(tier);
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-purple-50/70 border-purple-600 shadow-md ring-1 ring-purple-600'
                  : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50/60 shadow-xs'
              }`}
            >
              {/* Top Row: Radio, Title & Badges */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'border-2 border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900">
                        {tier.title}
                      </span>
                      {tier.isPopular && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black">
                          الأكثر طلباً 🔥
                        </span>
                      )}
                      {tier.badge && !tier.isPopular && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-extrabold border border-amber-300">
                          {tier.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{tier.quantity} قطعة</span>
                      <span>•</span>
                      <span>
                        سعر القطعة داخل العرض: <strong className="text-slate-800">{tier.unitPrice.toLocaleString('ar-DZ')} دج</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price Display / Edit button */}
                <div className="text-end shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        autoFocus
                        value={editPriceVal}
                        onChange={(e) => setEditPriceVal(e.target.value)}
                        className="w-20 px-2 py-1 rounded-lg border border-purple-500 bg-white text-xs font-black text-slate-900 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleSavePriceEdit(tier.id)}
                        className="p-1 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 justify-end">
                      <div>
                        <div className="text-sm font-black text-purple-700">
                          <MoneyText amount={tier.totalPrice} />
                        </div>
                        {tier.savingsAmount > 0 && (
                          <div className="text-[10px] text-slate-400 line-through">
                            <MoneyText amount={tier.originalTotalPrice} />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTierId(tier.id);
                          setEditPriceVal(String(tier.totalPrice));
                        }}
                        title="تعديل سعر هذه الشريحة"
                        className="p-1 rounded-lg hover:bg-purple-100 text-slate-400 hover:text-purple-600 transition"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Reseller Net Profit and Savings */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>ربحك الصافي: +<MoneyText amount={tier.netProfit} /></span>
                  {extraProfit > 0 && (
                    <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-1.5 py-0.2 rounded-md">
                      (+{extraProfit.toLocaleString('ar-DZ')} دج زيادة!)
                    </span>
                  )}
                </div>

                {tier.savingsAmount > 0 && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    توفير للزبون: <MoneyText amount={tier.savingsAmount} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Variant Selection per Unit when Multiple Items are in selected tier */}
      {selectedTier && selectedTier.quantity > 1 && variants.length > 1 && (
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowVariantsAccordion(!showVariantsAccordion)}
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-black text-slate-900">
                تخصيص المقاس واللون لكل قطعة في الباقة ({selectedTier.quantity} قطع)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-purple-600 font-bold">
                {showVariantsAccordion ? 'إخفاء' : 'عرض التفاصيل'}
              </span>
              {showVariantsAccordion ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          {showVariantsAccordion && (
            <div className="space-y-2.5 pt-1">
              <p className="text-[11px] text-slate-500">
                يمكنك تحديد خيارات مختلفة لكل قطعة لضمان تجهيزها بدقة في المستودع:
              </p>

              {/* Quick apply first variant to all */}
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl text-[11px]">
                <span className="text-slate-600">تطبيق سريع على كل القطع:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {variants.slice(0, 3).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleApplyVariantToAll(v)}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-purple-500 text-[10px] font-bold text-slate-700 transition"
                    >
                      {v.size} - {v.color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Item Selectors */}
              <div className="space-y-2">
                {selectedTier.itemVariants.map((itemVar) => (
                  <div
                    key={itemVar.itemIndex}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-extrabold text-purple-800 shrink-0">
                      القطعة #{itemVar.itemIndex}:
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {variants.map((v) => {
                        const isMatch = itemVar.variantId === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleItemVariantChange(itemVar.itemIndex, v)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                              isMatch
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                            }`}
                          >
                            {v.size} - {v.color}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optional Accessory Addon Upsells */}
      {availableAddonUpsells.length > 0 && onToggleAddonUpsell && (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-600" />
              عروض تكميلية إضافية (Cross-sell Addons):
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800">
              {selectedAddonUpsellIds.size} مختار
            </span>
          </div>

          <div className="space-y-2">
            {availableAddonUpsells.map((addon) => {
              const isSelected = selectedAddonUpsellIds.has(addon.id);
              const profitAmt = Number(addon.profit) || Math.max(0, addon.price - addon.wholesalePrice);

              return (
                <div
                  key={addon.id}
                  onClick={() => onToggleAddonUpsell(addon.id)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-white border-amber-500 shadow-xs'
                      : 'bg-white/80 border-amber-200 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'border-2 border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    {addon.image && (
                      <img
                        src={addon.image}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    )}

                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {addon.title}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-extrabold">
                        +{profitAmt} دج ربح إضافي
                      </span>
                    </div>
                  </div>

                  <div className="text-end shrink-0">
                    <span className="text-xs font-black text-slate-900 block">
                      +{addon.price} دج
                    </span>
                    {addon.originalPrice && addon.originalPrice > addon.price && (
                      <span className="text-[10px] text-slate-400 line-through block">
                        {addon.originalPrice} دج
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
  );
}
