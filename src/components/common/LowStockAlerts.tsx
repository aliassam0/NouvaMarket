import React, { useState } from 'react';
import {
  AlertTriangle,
  PackageX,
  PackagePlus,
  RefreshCw,
  PlusCircle,
  Copy,
  Check,
  MessageSquare,
  X,
  Layers,
  ChevronRight,
  TrendingDown,
  Warehouse,
  ShieldAlert,
  Edit3,
} from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { MoneyText } from '../ui/MoneyText';
import { saveStoredProducts } from '../../data/mockProducts';
import { addSellerNotification } from '../../lib/notificationHelper';

export interface LowStockItem {
  product: Product;
  totalStock: number;
  minThreshold: number;
  status: 'out' | 'critical' | 'low';
}

export function getLowStockProducts(products: Product[]): LowStockItem[] {
  const items: LowStockItem[] = [];

  for (const p of products) {
    const totalStock = p.variants.reduce((acc, v) => acc + (Number(v.stockCount) || 0), 0);
    const minThreshold = p.minStockAlert ?? 15;

    // Trigger alert if total stock is below minThreshold OR if any variant stock is <= 5
    const hasLowVariant = p.variants.some((v) => (Number(v.stockCount) || 0) <= 5);

    if (totalStock <= minThreshold || hasLowVariant) {
      let status: 'out' | 'critical' | 'low' = 'low';
      if (totalStock === 0) {
        status = 'out';
      } else if (totalStock <= 5 || p.variants.some((v) => (Number(v.stockCount) || 0) === 0)) {
        status = 'critical';
      }

      items.push({
        product: p,
        totalStock,
        minThreshold,
        status,
      });
    }
  }

  // Sort: 'out' -> 'critical' -> 'low' -> lowest totalStock
  return items.sort((a, b) => {
    const statusWeight = { out: 0, critical: 1, low: 2 };
    if (statusWeight[a.status] !== statusWeight[b.status]) {
      return statusWeight[a.status] - statusWeight[b.status];
    }
    return a.totalStock - b.totalStock;
  });
}

// ---------------- 1. BANNER COMPONENT ----------------
interface LowStockBannerProps {
  products: Product[];
  onOpenModal: () => void;
  roleName?: string; // 'الأدمن' | 'المستودع'
}

export function LowStockBanner({ products, onOpenModal, roleName = 'المستودع والإدارة' }: LowStockBannerProps) {
  const lowStockItems = getLowStockProducts(products);
  if (lowStockItems.length === 0) return null;

  const outCount = lowStockItems.filter((i) => i.status === 'out').length;
  const criticalCount = lowStockItems.filter((i) => i.status === 'critical').length;

  return (
    <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white shadow-xl border border-amber-400/40 space-y-3 relative overflow-hidden transition-all animate-fade-in">
      {/* Decorative background circle */}
      <div className="absolute -end-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md text-amber-200 border border-white/20 shrink-0 shadow-inner">
            <ShieldAlert className="w-6 h-6 animate-pulse text-amber-300" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>تنبيه هائم: انخفاض المخزون عن الحد الأدنى!</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-amber-100 font-extrabold text-[10px] border border-white/30">
                {roleName}
              </span>
            </div>

            <p className="text-[11px] text-amber-100/90 font-medium mt-0.5 leading-relaxed">
              يوجد <span className="font-black text-white underline">{lowStockItems.length} منتجات</span> انخفض
              مخزونها تحت الحد الأدنى المحدد لضمان استمرارية التوريد والمبيعات.
            </p>
          </div>
        </div>

        {/* Action Button & Badges */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {outCount > 0 && (
            <span className="px-2.5 py-1 rounded-xl bg-rose-950/80 text-rose-200 font-black text-[10px] border border-rose-500/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              {outCount} نفذت بالكامل
            </span>
          )}

          {criticalCount > 0 && (
            <span className="px-2.5 py-1 rounded-xl bg-orange-950/80 text-amber-200 font-black text-[10px] border border-amber-500/50">
              {criticalCount} حرج جداً
            </span>
          )}

          <button
            onClick={onOpenModal}
            className="px-4 py-2 rounded-2xl bg-white hover:bg-amber-50 text-slate-900 font-black text-xs shadow-lg hover:shadow-xl transition flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>إدارة شحنات التوريد ({lowStockItems.length})</span>
            <ChevronRight className="w-4 h-4 text-amber-600 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- 2. MODAL REPLENISHMENT COMPONENT ----------------
interface LowStockModalProps {
  products: Product[];
  onClose: () => void;
  onProductsUpdated: (updated: Product[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function LowStockModal({
  products,
  onClose,
  onProductsUpdated,
  onShowToast,
}: LowStockModalProps) {
  const [productList, setProductList] = useState<Product[]>(products);
  const lowStockItems = getLowStockProducts(productList);

  // Quick Restock State: { [productId]: numberToAdd }
  const [addQuantityInputs, setAddQuantityInputs] = useState<Record<string, number>>({});
  const [copiedChecklist, setCopiedChecklist] = useState(false);
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(15);

  // Helper to add stock quantity to a product (distributed evenly across variants or first variant)
  const handleRestockProduct = (productId: string) => {
    const qtyToAdd = addQuantityInputs[productId] || 20;
    if (qtyToAdd <= 0) return;

    const updated = productList.map((p) => {
      if (p.id !== productId) return p;

      // Distribute added quantity evenly across variants
      const varCount = p.variants.length || 1;
      const perVar = Math.max(1, Math.floor(qtyToAdd / varCount));
      const remainder = qtyToAdd - perVar * varCount;

      const updatedVariants = p.variants.map((v, idx) => ({
        ...v,
        stockCount: (v.stockCount || 0) + perVar + (idx === 0 ? remainder : 0),
      }));

      return {
        ...p,
        variants: updatedVariants,
      };
    });

    const restockedProd = productList.find((p) => p.id === productId);
    const newTotalStock = restockedProd
      ? restockedProd.variants.reduce((acc, v) => acc + (v.stockCount || 0), 0) + qtyToAdd
      : qtyToAdd;

    addSellerNotification({
      type: 'stock_update',
      titleAr: '⚡ تجديد وتوفير مخزون المنتج!',
      bodyAr: `تم تزويد وتجديد مخزون المنتج "${restockedProd?.nameAr || ''}" بـ +${qtyToAdd} قطعة جديدة! [إجمالي المخزون الآن: ${newTotalStock} قطعة].`,
      productId,
      productNameAr: restockedProd?.nameAr,
    });

    setProductList(updated);
    saveStoredProducts(updated);
    onProductsUpdated(updated);

    // Reset input
    setAddQuantityInputs((prev) => ({ ...prev, [productId]: 20 }));
    onShowToast(`✔ تم تزويد المنتج بـ +${qtyToAdd} قطعة بنجاح وإرسال إشعار للبائعين!`, 'success');
  };

  // Helper to update minStockAlert threshold
  const handleSaveThreshold = (productId: string) => {
    const updated = productList.map((p) => (p.id === productId ? { ...p, minStockAlert: tempThreshold } : p));
    setProductList(updated);
    saveStoredProducts(updated);
    onProductsUpdated(updated);
    setEditingThresholdId(null);
    onShowToast(`✔ تم تحديث الحد الأدنى للتنبيه إلى ${tempThreshold} قطعة بنجاح!`, 'success');
  };

  // Copy Supplier Replenishment List
  const handleCopySupplierChecklist = () => {
    if (lowStockItems.length === 0) return;

    let text = `📦 **قائمة الشحنات والتوريد المطلوبة (تنبيه نقص المخزون)**\n`;
    text += `تاريخ الطلب: ${new Date().toLocaleDateString('ar-DZ')}\n\n`;

    lowStockItems.forEach((item, idx) => {
      text += `${idx + 1}. **${item.product.nameAr}**\n`;
      text += `   - المخزون الحالي: ${item.totalStock} قطعة (الحد الأدنى المطلوب: ${item.minThreshold} قطعة)\n`;
      text += `   - الكمية الموصى بتوريدها: ${Math.max(30, item.minThreshold * 2 - item.totalStock)} قطعة\n`;
      item.product.variants.forEach((v) => {
        text += `     • ${v.size} (${v.color}): المتبقي ${v.stockCount} قطعة\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedChecklist(true);
    onShowToast('📋 تم نسخ قائمة التوريد للموردين بنجاح!');
    setTimeout(() => setCopiedChecklist(false), 3000);
  };

  const handleShareSupplierWhatsApp = () => {
    if (lowStockItems.length === 0) return;

    let text = `📦 *طلب شحنة توريد جديدة - مخزون منخفض*\n\n`;
    lowStockItems.forEach((item, idx) => {
      text += `${idx + 1}. *${item.product.nameAr}*\n`;
      text += `   المتبقي بالمخزن: ${item.totalStock} قطعة | المطلوبة: +${Math.max(30, item.minThreshold * 2 - item.totalStock)} قطعة\n`;
    });

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <AlertTriangle className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black">مركز تنبيهات المخزون والتوريد (الحد الأدنى)</h2>
              <p className="text-[11px] text-amber-100/90 font-medium">
                متابعة المنتجات وشحنات التوريد لمنع انقطاع السلع بالمخزن
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-3 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-extrabold text-xs border border-amber-500/30 flex items-center gap-1">
              <Warehouse className="w-3.5 h-3.5" />
              <span>{lowStockItems.length} منتج بحاجة للتزويد</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySupplierChecklist}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                copiedChecklist
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50'
              }`}
            >
              {copiedChecklist ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
              <span>{copiedChecklist ? 'تم نسخ قائمة التزويد' : 'نسخ قائمة التزويد'}</span>
            </button>

            <button
              onClick={handleShareSupplierWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>إرسال للمورد (واتساب)</span>
            </button>
          </div>
        </div>

        {/* Items Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1 bg-slate-50 dark:bg-slate-900">
          {lowStockItems.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto text-2xl font-black">
                ✔
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                جميع المنتجات توجد بكميات كافية أعلى من الحد الأدنى!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                لا توجد أي سلع أو أنواع منخفضة المخزون حالياً. سيقوم النظام بتنبيهك تلقائياً عند وصول أي كمية للحد الأدنى.
              </p>
            </div>
          ) : (
            lowStockItems.map((item) => {
              const { product: p, totalStock, minThreshold, status } = item;
              const inputQty = addQuantityInputs[p.id] ?? 20;
              const percent = Math.min(100, Math.round((totalStock / minThreshold) * 100));

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-3xl border transition-all space-y-3.5 shadow-xs ${
                    status === 'out'
                      ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                      : status === 'critical'
                      ? 'bg-orange-50/70 dark:bg-orange-950/20 border-orange-300 dark:border-orange-900/60'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Top Row: Info & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                      <img
                        src={p.images[0]}
                        alt={p.nameAr}
                        className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-900 dark:text-white text-xs">{p.nameAr}</h4>
                          {status === 'out' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center gap-1 shadow-xs animate-bounce">
                              <PackageX className="w-3 h-3" />
                              نفذت الكمية بالكامل (0 قطعة)
                            </span>
                          ) : status === 'critical' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white font-black text-[10px] flex items-center gap-1 shadow-xs">
                              <TrendingDown className="w-3 h-3" />
                              حرِج جداً ({totalStock} قطعة متبقية)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] border border-amber-500/30">
                              ⚠️ منخفض عن الحد الأدنى ({totalStock} قطعة)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                          <span>الفئة: {p.categoryAr}</span>
                          <span>•</span>
                          <span>سعر الجملة: <MoneyText amount={p.wholesalePrice} /></span>
                        </div>
                      </div>
                    </div>

                    {/* Stock vs Threshold Progress & Edit */}
                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto bg-slate-100 dark:bg-slate-900/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="text-start">
                        <div className="flex items-center gap-1 text-[11px] font-extrabold">
                          <span className="text-slate-500">المخزون الحالي:</span>
                          <span
                            className={`font-mono font-black ${
                              totalStock === 0
                                ? 'text-rose-600'
                                : totalStock <= 5
                                ? 'text-orange-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {totalStock} قطعة
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <span>الحد الأدنى للتنبيه:</span>
                          {editingThresholdId === p.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                value={tempThreshold}
                                onChange={(e) => setTempThreshold(Number(e.target.value))}
                                className="w-12 px-1 py-0.5 rounded bg-white dark:bg-slate-800 border text-slate-900 dark:text-white font-bold text-center text-[10px]"
                              />
                              <button
                                onClick={() => handleSaveThreshold(p.id)}
                                className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-black text-[9px]"
                              >
                                حفظ
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingThresholdId(p.id);
                                setTempThreshold(minThreshold);
                              }}
                              className="font-mono font-black text-slate-700 dark:text-slate-300 underline hover:text-purple-600 flex items-center gap-0.5 cursor-pointer"
                              title="تعديل الحد الأدنى للتنبيه"
                            >
                              <span>{minThreshold} قطعة</span>
                              <Edit3 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Stock Level Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>مستوى التزويد الحالي بالنسبة للحد الأدنى:</span>
                      <span className="font-mono">{percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          status === 'out'
                            ? 'bg-rose-600'
                            : status === 'critical'
                            ? 'bg-orange-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(5, percent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Variants Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                    {p.variants.map((v) => {
                      const isLowVar = (v.stockCount || 0) <= 5;
                      return (
                        <div
                          key={v.id}
                          className={`p-2 rounded-xl border flex items-center justify-between font-bold ${
                            v.stockCount === 0
                              ? 'bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                              : isLowVar
                              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="truncate">{v.size} ({v.color})</span>
                          <span className="font-mono font-black shrink-0">{v.stockCount} قطعة</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Restock Action Form */}
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <PackagePlus className="w-4 h-4 text-purple-600 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-xs">
                          إعادة التزويد وسجل وصول شحنة جديدة:
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          إضافة عدد القطع الواردة للمستودع وتوزيعها تلقائياً على الأنواع
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative w-28">
                        <input
                          type="number"
                          min={1}
                          value={inputQty}
                          onChange={(e) =>
                            setAddQuantityInputs((prev) => ({
                              ...prev,
                              [p.id]: Math.max(1, Number(e.target.value) || 1),
                            }))
                          }
                          className="w-full px-2 py-1.5 pe-8 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-xs text-center"
                        />
                        <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                          قطعة
                        </span>
                      </div>

                      <button
                        onClick={() => handleRestockProduct(p.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>تزويد الشحنة (+{inputQty})</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
