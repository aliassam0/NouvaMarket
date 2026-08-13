import React, { useState } from 'react';
import { AutoResizeTextarea } from '../ui/AutoResizeTextarea';
import {
  Edit3,
  Plus,
  Trash2,
  Image as ImageIcon,
  PlusCircle,
  Sliders,
  CheckCircle2,
  Box,
  Layers,
  Sparkles,
  DollarSign,
  Percent,
  Building,
  Link as LinkIcon,
  Download,
} from 'lucide-react';
import { Product, ProductVariant, AgeGroup, Gender } from '../../types';
import { useCategories } from '../../context/CategoryContext';
import { getStoredMarketplaceFees, getStoredSuppliers } from '../../lib/supplierHelper';

interface ProductEditModalProps {
  editingProduct: Product | null;
  isAddingNewProduct: boolean;
  onClose: () => void;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  categories?: Array<{ id: string; nameAr: string; icon: string }>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: 'admin' | 'warehouse' | 'reseller';
}

export function ProductEditModal({
  editingProduct,
  isAddingNewProduct,
  onClose,
  onSaveProduct,
  onDeleteProduct,
  categories: categoriesProp,
  onShowToast,
  userRole = 'admin',
}: ProductEditModalProps) {
  const { categories: ctxCategories } = useCategories();
  const categories = categoriesProp || ctxCategories;

  if (!editingProduct) return null;

  const feeSettings = getStoredMarketplaceFees();
  const activeFeePercent = editingProduct.nouvaFeePercent ?? feeSettings.supplierFeePercent;

  const initialNet = editingProduct.supplierNetPrice ||
    (editingProduct.wholesalePrice ? Math.round(editingProduct.wholesalePrice / (1 + activeFeePercent / 100)) : 3000);

  const suppliersList = getStoredSuppliers();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(() => {
    if (editingProduct.supplierId) return editingProduct.supplierId;
    if (editingProduct.supplierName) {
      const found = suppliersList.find(
        (s) => s.companyName === editingProduct.supplierName || s.fullName === editingProduct.supplierName
      );
      if (found) return found.id;
    }
    return suppliersList[0]?.id || 'sup-01';
  });

  const [productData, setProductData] = useState<Product>(editingProduct);
  const [supplierNetPrice, setSupplierNetPrice] = useState<number>(initialNet);
  const [isGeneratingAiDesc, setIsGeneratingAiDesc] = useState(false);
  const [isGeneratingAiName, setIsGeneratingAiName] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);

  const handleExtractFromUrlInModal = async () => {
    if (!importUrl.trim()) {
      onShowToast('⚠️ يرجى إدخال رابط المنتج أولاً', 'info');
      return;
    }
    try {
      setIsExtractingUrl(true);
      onShowToast('🔍 جاري استخراج الصور، الاسم، الوصف، والأسعار من الرابط...', 'info');

      const res = await fetch('/api/admin/ai/extract-products-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      });
      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Failed to parse response as JSON in ProductEditModal:', responseText.substring(0, 200));
        throw new Error('تعذر قراءة بيانات الرابط من الخادم، يرجى التأكد من أن الرابط مباشر وصحيح');
      }

      if (!res.ok || !data.success || !Array.isArray(data.products) || data.products.length === 0) {
        throw new Error(data.error || 'تعذر استخراج بيانات المنتج من الرابط');
      }

      const firstProduct = data.products[0];

      setProductData((prev) => ({
        ...prev,
        nameAr: firstProduct.nameAr || prev.nameAr,
        descriptionAr: firstProduct.descriptionAr || prev.descriptionAr,
        images: Array.isArray(firstProduct.images) && firstProduct.images.length > 0 ? firstProduct.images : prev.images,
        categoryAr: firstProduct.categoryAr || prev.categoryAr,
        suggestedSellingPrice: firstProduct.suggestedSellingPrice || prev.suggestedSellingPrice,
        floorPrice: firstProduct.floorPrice || prev.floorPrice,
        ceilingPrice: firstProduct.ceilingPrice || prev.ceilingPrice,
      }));

      if (firstProduct.supplierNetPrice) {
        setSupplierNetPrice(firstProduct.supplierNetPrice);
      }

      onShowToast('✨ تم استيراد بيانات المنتج والأسعار والصور من الرابط بنجاح!', 'success');
    } catch (err: any) {
      console.error('Error extracting from URL in modal:', err);
      onShowToast(`❌ خطأ: ${err.message || 'فشل استخراج بيانات الرابط'}`, 'error');
    } finally {
      setIsExtractingUrl(false);
    }
  };

  const nouvaFeeAmount = Math.round((supplierNetPrice * activeFeePercent) / 100);
  const calculatedWholesalePrice = supplierNetPrice + nouvaFeeAmount;

  const handleNetPriceChange = (val: number) => {
    setSupplierNetPrice(val);
    const fee = Math.round((val * activeFeePercent) / 100);
    setProductData((prev) => ({
      ...prev,
      supplierNetPrice: val,
      wholesalePrice: val + fee,
    }));
  };

  const totalStock = productData.variants.reduce((acc, v) => acc + (Number(v.stockCount) || 0), 0);

  // Helper to generate AI Product Name with visual recognition and original foreign brand name rule
  const handleGenerateProductName = async () => {
    try {
      setIsGeneratingAiName(true);

      const hasImages = Array.isArray(productData.images) && productData.images.length > 0;
      if (!hasImages) {
        onShowToast('⚠️ يرجى رفع أو إضافة رابط صورة للمنتج أولاً ليتعرف الذكاء الاصطناعي على البراند والنوع!', 'info');
      }

      onShowToast('🔍 جاري تحليل الصور واستخلاص اسم المنتج والبراند بالأحرف الأصلية...', 'info');

      const safeImages = (productData.images || []).filter(
        (img) => typeof img === 'string' && img.trim().length > 0 && (!img.startsWith('data:') || img.length < 500000)
      ).slice(0, 3);

      const res = await fetch('/api/admin/ai/generate-product-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentName: productData.nameAr || '',
          category: productData.categoryAr || '',
          images: safeImages,
        }),
      });

      const resText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch (e) {
        throw new Error('تعذر معالجة استجابة الخادم أثناء توليد الاسم');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'تعذر استخلاص اسم المنتج من الخادم');
      }

      if (data.productName) {
        setProductData((prev) => ({
          ...prev,
          nameAr: data.productName,
        }));
        onShowToast('✔ تم استخلاص اسم المنتج والبراند بأحرف أجنبية أصيلة بنجاح!', 'success');
      } else {
        onShowToast('⚠️ تعذر استخلاص اسم المنتج. يرجى المحاولة مجدداً.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to generate product name:', err);
      const errorMessage = err?.message || 'حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي';
      onShowToast(`❌ ${errorMessage}`, 'error');
    } finally {
      setIsGeneratingAiName(false);
    }
  };

  // Helper to generate PASO product description using Gemini multimodal vision from uploaded images
  const handleGeneratePasoDescription = async () => {
    try {
      setIsGeneratingAiDesc(true);

      const hasImages = Array.isArray(productData.images) && productData.images.length > 0;
      if (!productData.nameAr && !hasImages) {
        onShowToast('⚠️ يرجى كتابة اسم للمنتج أو رفع صور أولاً ليتعرف عليها الذكاء الاصطناعي!', 'info');
      }

      onShowToast('✨ جاري تحليل صور المنتج بالذكاء الاصطناعي وصياغة وصف PASO لصفحة الهبوط...', 'info');

      const safeImages = (productData.images || []).filter(
        (img) => typeof img === 'string' && img.trim().length > 0 && (!img.startsWith('data:') || img.length < 500000)
      ).slice(0, 3);

      const res = await fetch('/api/admin/ai/generate-product-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productData.nameAr || '',
          category: productData.categoryAr || '',
          images: safeImages,
        }),
      });

      const resText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch (e) {
        throw new Error('تعذر معالجة استجابة الخادم أثناء توليد الوصف');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'تعذر توليد وصف المنتج من الخادم');
      }

      if (data.descriptionAr) {
        setProductData((prev) => ({
          ...prev,
          descriptionAr: data.descriptionAr,
        }));
        onShowToast('✔ تم التعرف على المنتج بالذكاء الاصطناعي وتوليد وصف صفحة الهبوط (PASO) بنجاح!', 'success');
      } else {
        onShowToast('⚠️ تعذر توليد الوصف. يرجى إعادة المحاولة.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to generate PASO description:', err);
      const errorMessage = err?.message || 'حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي';
      onShowToast(`❌ ${errorMessage}`, 'error');
    } finally {
      setIsGeneratingAiDesc(false);
    }
  };

  // Helper to handle saving
  const handleSave = () => {
    if (!productData.nameAr.trim()) {
      onShowToast('⚠️ يرجى كتابة اسم المنتج بالعربية!', 'error');
      return;
    }

    // Ensure images array is not empty
    const finalImages = productData.images.length > 0
      ? productData.images
      : ['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=600'];

    // Ensure variants array is not empty
    const finalVariants = productData.variants.length > 0
      ? productData.variants.map((v) => ({
          ...v,
          stockCount: Math.max(0, Number(v.stockCount) || 0),
        }))
      : [
          {
            id: `v-${Date.now()}`,
            size: 'موحد',
            color: 'افتراضي',
            colorHex: '#2563eb',
            stockCount: 50,
          },
        ];

    const finalWholesalePrice = calculatedWholesalePrice || Math.max(0, Number(productData.wholesalePrice) || 0);

    const matchedSup = suppliersList.find((s) => s.id === selectedSupplierId) || suppliersList[0];
    const finalSupplierId = matchedSup ? matchedSup.id : (productData.supplierId || 'sup-01');
    const finalSupplierName = matchedSup ? (matchedSup.companyName || matchedSup.fullName) : (productData.supplierName || 'مورد الجزائر');

    const updatedProduct: Product = {
      ...productData,
      images: finalImages,
      variants: finalVariants,
      supplierId: finalSupplierId,
      supplierName: finalSupplierName,
      supplierNetPrice,
      nouvaFeePercent: activeFeePercent,
      wholesalePrice: finalWholesalePrice,
      floorPrice: Math.max(0, Number(productData.floorPrice) || 0),
      suggestedSellingPrice: Math.max(0, Number(productData.suggestedSellingPrice) || 0),
      ceilingPrice: Math.max(0, Number(productData.ceilingPrice) || 0),
      approvalStatus: userRole === 'admin'
        ? (productData.approvalStatus || 'APPROVED')
        : (isAddingNewProduct ? 'PENDING' : (productData.approvalStatus || 'PENDING')),
    };

    onSaveProduct(updatedProduct);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 my-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <span>{isAddingNewProduct ? 'إضافة منتج جديد للمخزون' : `تعديل المنتج: ${productData.nameAr}`}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs font-bold">
            إغلاق ✕
          </button>
        </div>

        <div className="space-y-3.5 text-xs max-h-[72vh] overflow-y-auto pe-2">
          {/* URL Quick Extraction Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-white flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-indigo-400" />
                <span>تعبئة بيانات المنتج تلقائياً من رابط (URL):</span>
              </label>
              <span className="text-[9px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                استرداد الصور + الأسعار + الاسم + الوصف
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="ضع رابط المنتج هنا (مثال: https://store.com/item-123)"
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-indigo-500 transition placeholder:text-slate-600"
              />
              <button
                type="button"
                disabled={isExtractingUrl}
                onClick={handleExtractFromUrlInModal}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isExtractingUrl ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    <span>جاري الاستيراد...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>استرداد البيانات</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Product Name with AI Name Generator */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="text-[10px] text-slate-300 font-extrabold block">اسم المنتج (بالعربية):</label>
              <button
                type="button"
                disabled={isGeneratingAiName}
                onClick={handleGenerateProductName}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-[10px] flex items-center gap-1 shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                title="التعرف البصري من الصور لاستخلاص الاسم بدون ترجمة البراند"
              >
                {isGeneratingAiName ? (
                  <>
                    <Sparkles className="w-3 h-3 animate-spin text-amber-300" />
                    <span>جاري تحليل الصورة والبراند...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>✨ استخلاص اسم المنتج والبراند بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={productData.nameAr}
              onChange={(e) => setProductData({ ...productData, nameAr: e.target.value })}
              placeholder="مثال: CeraVe كريم ترطيب مكثف للبشرة الجافة والعادية 453g"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:border-indigo-500 transition"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              💡 الذكاء الاصطناعي يتعرف على الصور ويبقي اسم الماركة (البراند) بالأحرف الأجنبية الأصلية (مثل CeraVe, Eucerin, Nike) ويترجم خصائص المنتج بالعربية.
            </span>
          </div>

          {/* Product Description with AI PASO Generator */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-indigo-900/40 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="text-xs font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>وصف المنتج الإقناعي لصفحة الهبوط (PASO):</span>
                </label>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  الذكاء الاصطناعي يتعرف على المنتج من الصور المحملة ويكتب صيغة PASO الإقناعية
                </span>
              </div>

              {/* PASO Generator Button */}
              <button
                type="button"
                disabled={isGeneratingAiDesc}
                onClick={handleGeneratePasoDescription}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-black text-[11px] flex items-center gap-1.5 shadow-md shadow-indigo-950/60 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingAiDesc ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    <span>جاري تحليل الصور وتوليد الوصف...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>✨ توليد وصف (PASO) بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>
            </div>

            <AutoResizeTextarea
              minRows={4}
              value={productData.descriptionAr || ''}
              onChange={(e) => setProductData({ ...productData, descriptionAr: e.target.value })}
              placeholder="ارفع صور المنتج ثم اضغط على زر توليد الوصف بالذكاء الاصطناعي أعلاه لكتابة وصف إقناعي لصفحة الهبوط بصيغة PASO..."
              className="text-xs sm:text-sm font-medium bg-slate-900 border-slate-800 focus:border-indigo-500 text-slate-100"
            />

            {/* PASO Indicators Badge */}
            {productData.descriptionAr && (productData.descriptionAr.includes('PASO') || productData.descriptionAr.includes('المشكلة')) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] border-t border-slate-900">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1">
                  🎯 1. المشكلة (Problem)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold flex items-center gap-1">
                  🔥 2. الإثارة (Agitate)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1">
                  💡 3. الحل (Solution)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold flex items-center gap-1">
                  ✨ 4. النتيجة والعرض (Outcome)
                </span>
              </div>
            )}
          </div>

          {/* CATEGORY & SUPPLIER SELECTOR GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-indigo-400 font-extrabold block mb-1">
                الفئة والتصنيف:
              </label>
              <select
                value={productData.categoryAr}
                onChange={(e) => {
                  const selectedCat = categories.find((c) => c.nameAr === e.target.value);
                  setProductData({
                    ...productData,
                    categoryAr: e.target.value,
                    categoryFr: selectedCat?.nameFr || e.target.value,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-indigo-500/60 text-white font-bold cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.nameAr}>
                    {c.icon} {c.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-purple-400 font-extrabold flex items-center justify-between mb-1">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-purple-400" />
                  <span>المورد (Supplier):</span>
                </span>
                <span className="text-[8px] text-purple-300 font-normal">مطلوب</span>
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => {
                  const supId = e.target.value;
                  setSelectedSupplierId(supId);
                  const matched = suppliersList.find((s) => s.id === supId);
                  if (matched) {
                    setProductData((prev) => ({
                      ...prev,
                      supplierId: matched.id,
                      supplierName: matched.companyName || matched.fullName,
                    }));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-purple-500/70 text-white font-bold cursor-pointer focus:border-purple-400 transition"
              >
                {suppliersList.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    🏭 {sup.companyName || sup.fullName} ({sup.wilaya})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* IMAGES UPLOAD AND LINKS */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-black text-pink-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                <span>صور المنتج:</span>
              </span>

              <div className="flex items-center gap-2">
                {/* File Upload Button */}
                <label className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-extrabold text-[10px] cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>رفع صور من الجهاز</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (!e.target.files || e.target.files.length === 0) return;
                      const files = Array.from(e.target.files) as File[];
                      files.forEach((file: File) => {
                        const reader = new FileReader();
                        reader.onload = (uploadEvent) => {
                          if (uploadEvent.target?.result) {
                            const dataUrl = uploadEvent.target.result as string;
                            setProductData((prev) => ({
                              ...prev,
                              images: [...prev.images, dataUrl],
                            }));
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                      onShowToast('✔ تم رفع ومعالجة الصور المرفقة بنجاح!', 'success');
                    }}
                  />
                </label>

                {/* URL Prompt Button */}
                <button
                  type="button"
                  onClick={() => {
                    const newImg = prompt('أدخل رابط الصورة الجديدة (URL):');
                    if (newImg && newImg.trim()) {
                      setProductData({
                        ...productData,
                        images: [...productData.images, newImg.trim()],
                      });
                      onShowToast('✔ تم إضافة رابط الصورة بنجاح!', 'success');
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px]"
                >
                  + رابط URL
                </button>
              </div>
            </div>

            {/* Images Thumbnail Gallery */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {productData.images.map((imgUrl, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-square">
                  <img src={imgUrl} alt={`Product ${i}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                    {productData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setProductData({
                            ...productData,
                            images: productData.images.filter((_, idx) => idx !== i),
                          })
                        }
                        className="p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-500 text-[10px]"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {i === 0 && (
                    <span className="absolute bottom-0.5 start-0.5 px-1 py-0.2 rounded bg-indigo-600 text-white text-[8px] font-black">
                      الرئيسية
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* QUANTITIES & VARIANTS SECTION (الكمية لكل لون ومقاس ونوع أو نوع موحد) */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-[11px] font-black text-amber-400 block">
                    الكمية والمخزون (لكل لون، مقاس، ونوع):
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    تحديد كمية المخزن لكل خيار أو اعتماد نوع موحد بدون متغيرات
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-amber-300">⚠️ حد التنبيه:</span>
                  <input
                    type="number"
                    min={1}
                    value={productData.minStockAlert ?? 15}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        minStockAlert: Math.max(1, Number(e.target.value) || 15),
                      })
                    }
                    className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-white font-black text-center text-[10px]"
                  />
                  <span className="text-[9px] text-slate-400">قطع</span>
                </div>

                <div className="px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 font-mono font-black text-[11px]">
                  الإجمالي: {totalStock} قطعة
                </div>
              </div>
            </div>

            {/* Quick Template Switch Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-900">
              <button
                type="button"
                onClick={() => {
                  const newVar: ProductVariant = {
                    id: `v-${Date.now()}`,
                    size: '24M',
                    color: 'أزرق',
                    colorHex: '#2563eb',
                    stockCount: 20,
                  };
                  setProductData({
                    ...productData,
                    variants: [...productData.variants, newVar],
                  });
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-950 text-amber-300 border border-amber-800/60 font-bold text-[10px] hover:bg-amber-900 transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ إضافة لون / مقاس جديد</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const singleVar: ProductVariant = {
                    id: `v-single-${Date.now()}`,
                    size: 'موحد',
                    color: 'افتراضي / نوع موحد',
                    colorHex: '#3b82f6',
                    stockCount: totalStock || 50,
                  };
                  setProductData({
                    ...productData,
                    variants: [singleVar],
                  });
                  onShowToast('✔ تم التحويل إلى نوع موحد بدون ألوان أو مقاسات');
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[10px] transition flex items-center gap-1"
              >
                <Box className="w-3 h-3 text-indigo-400" />
                <span>نوع واحد موحد (بدون ألوان أو مقاسات)</span>
              </button>
            </div>

            {/* Variants Rows */}
            <div className="space-y-2 pt-1">
              {productData.variants.map((v, vIdx) => (
                <div
                  key={v.id || vIdx}
                  className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center bg-slate-900 p-2.5 rounded-2xl border border-slate-800 text-[10px]"
                >
                  {/* Size / Type */}
                  <div className="col-span-1 sm:col-span-3">
                    <label className="text-[8px] text-slate-400 block mb-0.5 font-bold">
                      المقاس / النوع:
                    </label>
                    <input
                      type="text"
                      value={v.size}
                      placeholder="موحد / 24M / XL"
                      onChange={(e) => {
                        const val = e.target.value;
                        const updatedVars = productData.variants.map((varItem, idx) =>
                          idx === vIdx ? { ...varItem, size: val } : varItem
                        );
                        setProductData({ ...productData, variants: updatedVars });
                      }}
                      className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold"
                    />
                  </div>

                  {/* Color / Variant Name */}
                  <div className="col-span-1 sm:col-span-3">
                    <label className="text-[8px] text-slate-400 block mb-0.5 font-bold">
                      اسم اللون / الخيار:
                    </label>
                    <input
                      type="text"
                      value={v.color}
                      placeholder="أزرق / أسود / افتراضي"
                      onChange={(e) => {
                        const val = e.target.value;
                        const updatedVars = productData.variants.map((varItem, idx) =>
                          idx === vIdx ? { ...varItem, color: val } : varItem
                        );
                        setProductData({ ...productData, variants: updatedVars });
                      }}
                      className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold"
                    />
                  </div>

                  {/* Color Hex Picker */}
                  <div className="col-span-1 sm:col-span-2 text-center">
                    <label className="text-[8px] text-slate-400 block mb-0.5 font-bold">
                      اللون Visual:
                    </label>
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="color"
                        value={v.colorHex || '#2563eb'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updatedVars = productData.variants.map((varItem, idx) =>
                            idx === vIdx ? { ...varItem, colorHex: val } : varItem
                          );
                          setProductData({ ...productData, variants: updatedVars });
                        }}
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Stock Count Quantity */}
                  <div className="col-span-1 sm:col-span-3">
                    <label className="text-[8px] text-emerald-400 block mb-0.5 font-extrabold">
                      الكمية بالمخزن:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={v.stockCount || ''}
                      placeholder="0"
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        const updatedVars = productData.variants.map((varItem, idx) =>
                          idx === vIdx ? { ...varItem, stockCount: val } : varItem
                        );
                        setProductData({ ...productData, variants: updatedVars });
                      }}
                      className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-emerald-500/60 text-emerald-300 font-mono font-black text-center text-xs"
                    />
                  </div>

                  {/* Delete Variant */}
                  <div className="col-span-2 sm:col-span-1 text-center flex sm:block justify-end">
                    <button
                      type="button"
                      disabled={productData.variants.length <= 1}
                      onClick={() => {
                        const updatedVars = productData.variants.filter((_, idx) => idx !== vIdx);
                        setProductData({ ...productData, variants: updatedVars });
                      }}
                      className="p-1.5 bg-slate-950 sm:bg-transparent rounded-lg text-rose-400 hover:text-rose-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="حذف هذا الخيار"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PRICING MATRIX: Supplier Net, Nouva Fee %, Wholesale Price, Floor, Suggested, Ceiling */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-indigo-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>قسم تسعير المنتج (عمولة Nouva والأسعار):</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/30">
                عمولة Nouva المعتمدة: {activeFeePercent}%
              </span>
            </div>

            {/* Net Supplier Price & Calculated Wholesale Price */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] text-amber-300 font-black block mb-1">
                    سعر المنتج للمورد (صافي):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={supplierNetPrice || ''}
                      onChange={(e) => handleNetPriceChange(Number(e.target.value) || 0)}
                      placeholder="مثال: 3000"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-amber-500/60 text-amber-200 font-mono font-bold text-xs"
                    />
                    <span className="absolute end-2 top-1.5 text-[10px] text-slate-500 font-bold">دج</span>
                  </div>
                  <span className="text-[8px] text-slate-400 block mt-0.5">الصافي للمورد عند التوصيل</span>
                </div>

                <div>
                  <label className="text-[10px] text-indigo-300 font-black block mb-1">
                    عمولة Nouva ({activeFeePercent}%):
                  </label>
                  <div className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-indigo-500/40 text-indigo-300 font-mono font-bold text-xs flex justify-between items-center">
                    <span>+{nouvaFeeAmount}</span>
                    <span className="text-[10px] text-slate-500 font-bold">دج</span>
                  </div>
                  <span className="text-[8px] text-slate-400 block mt-0.5">Marketplace Fee تلقائية</span>
                </div>

                <div>
                  <label className="text-[10px] text-emerald-300 font-black block mb-1">
                    سعر البيع للبائع (Wholesale):
                  </label>
                  <div className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-mono font-black text-xs flex justify-between items-center">
                    <span>{calculatedWholesalePrice}</span>
                    <span className="text-[10px] text-slate-500 font-bold">دج</span>
                  </div>
                  <span className="text-[8px] text-emerald-400/80 block mt-0.5">السعر الذي يظهر للمسوقين</span>
                </div>
              </div>
            </div>

            {/* Floor, Suggested, Ceiling */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="text-[9px] text-slate-400 block mb-0.5">أقل سعر بيع:</label>
                <input
                  type="number"
                  value={productData.floorPrice || ''}
                  onChange={(e) => setProductData({ ...productData, floorPrice: Number(e.target.value) || 0 })}
                  placeholder="مثال: 4200"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] text-emerald-400 font-bold block mb-0.5">السعر المقترح:</label>
                <input
                  type="number"
                  value={productData.suggestedSellingPrice || ''}
                  onChange={(e) => setProductData({ ...productData, suggestedSellingPrice: Number(e.target.value) || 0 })}
                  placeholder="مثال: 4900"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-emerald-500/50 text-emerald-400 font-mono font-bold text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-0.5">أكبر سعر بيع:</label>
                <input
                  type="number"
                  value={productData.ceilingPrice || ''}
                  onChange={(e) => setProductData({ ...productData, ceilingPrice: Number(e.target.value) || 0 })}
                  placeholder="مثال: 5500"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          {!isAddingNewProduct && onDeleteProduct ? (
            <div>
              {isConfirmingDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-rose-400 font-bold">تأكيد الحذف النهائي؟</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteProduct(productData.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xs"
                  >
                    نعم، حذف
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    تراجع
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>حذف هذا المنتج</span>
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>حفظ المنتج بالكامل</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
