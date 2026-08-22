import React, { useState } from 'react';
import {
  Link as LinkIcon,
  Sparkles,
  Download,
  X,
  CheckCircle2,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Building,
  Tag,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Product } from '../../types';

interface ProductUrlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProducts: (products: Product[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  defaultSupplierId?: string;
  defaultSupplierName?: string;
}

export function ProductUrlImportModal({
  isOpen,
  onClose,
  onImportProducts,
  onShowToast,
  defaultSupplierId,
  defaultSupplierName,
}: ProductUrlImportModalProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<Product[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleFetchFromUrl = async () => {
    if (!urlInput.trim()) {
      onShowToast('⚠️ يرجى إدخال رابط منتج أو متجر إلكتروني أولاً', 'info');
      return;
    }

    try {
      setIsLoading(true);
      onShowToast('🔍 جاري الاتصال بالرابط وقراءة الصور والأسعار والتفاصيل بالذكاء الاصطناعي...', 'info');

      const response = await fetch('/api/admin/ai/extract-products-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Failed to parse response as JSON:', responseText.substring(0, 200));
        throw new Error('تعذر قراءة بيانات الرابط من الخادم، يرجى التأكد من أن الرابط مباشر وصحيح');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل استخراج المنتجات من الرابط');
      }

      if (Array.isArray(data.products) && data.products.length > 0) {
        setExtractedProducts(data.products);
        // Select all products by default
        const allIndices = new Set<number>(data.products.map((_: any, idx: number) => idx));
        setSelectedIndices(allIndices);
        onShowToast(`🎉 تم العثور على ${data.products.length} منتج(ات) بنجاح!`, 'success');
      } else {
        onShowToast('⚠️ لم يتم العثور على منتجات واضحة في الرابط، يرجى التأكد من الرابط', 'error');
      }
    } catch (err: any) {
      console.error('Error importing from URL:', err);
      onShowToast(`❌ خطأ: ${err.message || 'حدث خطأ أثناء الاتصال بالرابط'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectIndex = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === extractedProducts.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(extractedProducts.map((_, i) => i)));
    }
  };

  const handleUpdateProductField = (index: number, field: keyof Product, value: any) => {
    setExtractedProducts((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const handleConfirmImport = () => {
    const productsToImport = extractedProducts
      .filter((_, idx) => selectedIndices.has(idx))
      .map((p) => ({
        ...p,
        id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        supplierId: defaultSupplierId || p.supplierId || 'sup-01',
        supplierName: defaultSupplierName || p.supplierName || 'مورد الجزائر',
      }));

    if (productsToImport.length === 0) {
      onShowToast('⚠️ يرجى تحديد منتج واحد على الأقل للاستيراد', 'info');
      return;
    }

    onImportProducts(productsToImport);
    onShowToast(`✅ تم استيراد ${productsToImport.length} منتج بنجاح للمخزون!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>استيراد منتج أو عدة منتجات من رابط الإلكتروني</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-extrabold border border-purple-500/20">
                  AI Auto-Scraper
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                استخراج الصور، الاسم، الوصف، سعر التكلفة، السعر المقترح، أدنى وأقصى سعر تلقائياً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* URL Input Bar */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shrink-0">
          <label className="text-xs font-extrabold text-purple-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ضع رابط صفحة المنتج أو المتجر:</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              يدعم روابط الشوبيفاي، علي إكسبرس، شي إن، جوميا، وأي متجر إلكتروني
            </span>
          </label>

          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="مثال: https://my-store.com/products/cerave-moisturizing-cream"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-purple-500 transition placeholder:text-slate-600"
              />
            </div>

            <button
              onClick={handleFetchFromUrl}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-500 hover:to-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  <span>جاري استيراد المنتجات...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>استرداد البيانات والمنتجات</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Extracted Products List / Grid */}
        <div className="flex-1 overflow-y-auto pe-1 space-y-3 min-h-[220px]">
          {extractedProducts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-3 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 mx-auto flex items-center justify-center">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-300">أدخل رابط المنتج للبدء بالاستخراج الذكي</h4>
                <p className="text-[10px] text-slate-500 max-w-md mx-auto">
                  يقوم الذكاء الاصطناعي بقراءة الصفحة، استخلاص صور عالية الجودة، الاسم باللغة العربية مع إبقاء اسم البراند أجنبي، وكتابة الوصف وحساب أسعار الجملة والقطاعي.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {selectedIndices.size === extractedProducts.length
                        ? 'إلغاء تحديد الكل'
                        : 'تحديد جميع المنتجات'}
                    </span>
                  </button>
                  <span className="text-xs text-slate-400 font-bold">
                    ({selectedIndices.size} من أصل {extractedProducts.length} محددة)
                  </span>
                </div>

                {defaultSupplierName && (
                  <span className="text-[10px] text-purple-400 font-extrabold flex items-center gap-1 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-800/40">
                    <Building className="w-3 h-3 text-purple-400" />
                    <span>سيتم النسبة للمورد: {defaultSupplierName}</span>
                  </span>
                )}
              </div>

              {/* Product Cards */}
              {extractedProducts.map((p, idx) => {
                const isSelected = selectedIndices.has(idx);
                return (
                  <div
                    key={p.id || idx}
                    className={`p-4 rounded-2xl border transition-all space-y-3 text-xs ${
                      isSelected
                        ? 'bg-slate-950 border-purple-500/70 shadow-lg'
                        : 'bg-slate-950/50 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectIndex(idx)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 mt-1 cursor-pointer"
                      />

                      {/* Main Image Thumbnail */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                        {p.images && p.images[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.nameAr}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                        {p.images && p.images.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-slate-950/80 text-white text-[9px] font-bold px-1 rounded">
                            +{p.images.length - 1}
                          </span>
                        )}
                      </div>

                      {/* Product Info Inputs */}
                      <div className="flex-1 space-y-2">
                        {/* Name */}
                        <div>
                          <label className="text-[10px] text-purple-400 font-extrabold block mb-0.5">
                            اسم المنتج:
                          </label>
                          <input
                            type="text"
                            value={p.nameAr}
                            onChange={(e) => handleUpdateProductField(idx, 'nameAr', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-bold text-xs focus:border-purple-500"
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="text-[10px] text-slate-400 font-extrabold block mb-0.5">
                            وصف المنتج المسترد:
                          </label>
                          <textarea
                            value={p.descriptionAr}
                            onChange={(e) => handleUpdateProductField(idx, 'descriptionAr', e.target.value)}
                            rows={2}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:border-purple-500 resize-y"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Prices Grid - ALL 4 requested prices */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 bg-slate-900/50 p-2.5 rounded-xl">
                      <div>
                        <label className="text-[9px] text-purple-400 font-extrabold block mb-0.5">
                          سعر التكلفة/المورد (DZD):
                        </label>
                        <input
                          type="number"
                          value={p.supplierNetPrice || ''}
                          onChange={(e) => handleUpdateProductField(idx, 'supplierNetPrice', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-purple-500/40 text-white font-mono font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-purple-400 font-extrabold block mb-0.5">
                          السعر المقترح (DZD):
                        </label>
                        <input
                          type="number"
                          value={p.suggestedSellingPrice || ''}
                          onChange={(e) => handleUpdateProductField(idx, 'suggestedSellingPrice', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-purple-500/40 text-purple-300 font-mono font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-amber-400 font-extrabold block mb-0.5">
                          أدنى سعر للبيع (DZD):
                        </label>
                        <input
                          type="number"
                          value={p.floorPrice || ''}
                          onChange={(e) => handleUpdateProductField(idx, 'floorPrice', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-rose-400 font-extrabold block mb-0.5">
                          أقصى سعر للبيع (DZD):
                        </label>
                        <input
                          type="number"
                          value={p.ceilingPrice || ''}
                          onChange={(e) => handleUpdateProductField(idx, 'ceilingPrice', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-rose-500/40 text-rose-300 font-mono font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={selectedIndices.size === 0}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>استيراد المنتجات المحددة للمخزون ({selectedIndices.size})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
