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
  ChevronUp,
  ChevronDown,
  Zap,
  Tag,
  Gift,
  ShoppingBag,
  Camera,
  Check,
  X,
} from 'lucide-react';
import { Product, ProductVariant, AgeGroup, Gender, UpsellOffer } from '../../types';
import { useCategories } from '../../context/CategoryContext';
import {
  generateProductNameSmart,
  generateProductDescriptionSmart,
} from '../../lib/geminiClientFallback';
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
  const [activeFeePercent, setActiveFeePercent] = useState<number>(() => {
    if (editingProduct.nouvaFeePercent !== undefined && editingProduct.nouvaFeePercent !== null) {
      return editingProduct.nouvaFeePercent;
    }
    return feeSettings.supplierFeePercent ?? 5;
  });

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

  const [productData, setProductData] = useState<Product>(() => {
    if (editingProduct.colorImages && editingProduct.variants) {
      const updatedVariants = editingProduct.variants.map((v) => ({
        ...v,
        image: v.image || (v.color ? editingProduct.colorImages?.[v.color.trim()] : undefined),
      }));
      return { ...editingProduct, variants: updatedVariants };
    }
    return editingProduct;
  });
  const [supplierNetPrice, setSupplierNetPrice] = useState<number>(initialNet);
  const [isGeneratingAiDesc, setIsGeneratingAiDesc] = useState(false);
  const [isGeneratingAiName, setIsGeneratingAiName] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [variantImagePickerIndex, setVariantImagePickerIndex] = useState<number | null>(null);
  const [variantImageUrlInput, setVariantImageUrlInput] = useState('');

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

      const extractedVariants = Array.isArray(firstProduct.variants) && firstProduct.variants.length > 0
        ? firstProduct.variants
        : undefined;

      setProductData((prev) => ({
        ...prev,
        nameAr: firstProduct.nameAr || prev.nameAr,
        descriptionAr: firstProduct.descriptionAr || prev.descriptionAr,
        images: Array.isArray(firstProduct.images) && firstProduct.images.length > 0 ? firstProduct.images : prev.images,
        categoryAr: firstProduct.categoryAr || prev.categoryAr,
        suggestedSellingPrice: firstProduct.suggestedSellingPrice || prev.suggestedSellingPrice,
        floorPrice: firstProduct.floorPrice || prev.floorPrice,
        ceilingPrice: firstProduct.ceilingPrice || prev.ceilingPrice,
        variants: extractedVariants || prev.variants,
        colorImages: firstProduct.colorImages || prev.colorImages,
      }));

      if (firstProduct.supplierNetPrice) {
        setSupplierNetPrice(firstProduct.supplierNetPrice);
      }

      const variantCount = Array.isArray(firstProduct.variants) ? firstProduct.variants.length : 0;
      onShowToast(
        `✨ تم استيراد بيانات المنتج بنجاح! تم استرداد الصور، الأسعار، و(${variantCount}) متغيرات من الألوان والمقاسات.`,
        'success'
      );
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

  // Helper to compress images on upload for fast AI vision & storage efficiency
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(compressedDataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files: File[] = Array.from(e.target.files);
    onShowToast('⏳ جاري معالجة وضغط الصور بجودة عالية...', 'info');

    const compressedUrls: string[] = [];
    for (const file of files) {
      const url = await compressImageFile(file);
      if (url) {
        compressedUrls.push(url);
      }
    }

    if (compressedUrls.length > 0) {
      setProductData((prev) => ({
        ...prev,
        images: [...prev.images, ...compressedUrls],
      }));
      onShowToast(`✔ تم رفع ${compressedUrls.length} صورة بنجاح جاهزة لتحليل الذكاء الاصطناعي!`, 'success');
    }
    e.target.value = '';
  };

  const handleDescriptionImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files: File[] = Array.from(e.target.files);
    onShowToast('⏳ جاري معالجة صور وصف المنتج...', 'info');

    const compressedUrls: string[] = [];
    for (const file of files) {
      const url = await compressImageFile(file);
      if (url) {
        compressedUrls.push(url);
      }
    }

    if (compressedUrls.length > 0) {
      const newItems = compressedUrls.map((url) => ({ url, title: '' }));
      setProductData((prev) => ({
        ...prev,
        descriptionImages: [...(prev.descriptionImages || []), ...newItems],
      }));
      onShowToast(`✔ تم إضافة ${compressedUrls.length} صورة لوصف المنتج بنجاح! يمكنك الآن كتابة عنوان توضيحي لكل صورة.`, 'success');
    }
    e.target.value = '';
  };

  // Helper for uploading or assigning image to a specific color / variant
  const handleVariantFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantIndex: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    onShowToast('⏳ جاري معالجة وضغط صورة اللون...', 'info');
    const compressedUrl = await compressImageFile(file);
    if (compressedUrl) {
      setProductData((prev) => {
        const updated = prev.variants.map((v, idx) =>
          idx === variantIndex ? { ...v, image: compressedUrl } : v
        );
        return { ...prev, variants: updated };
      });
      onShowToast('✔ تم تعيين صورة اللون بنجاح!', 'success');
    }
    e.target.value = '';
  };

  const handleSetVariantImage = (variantIndex: number, imageUrl: string) => {
    setProductData((prev) => {
      const updated = prev.variants.map((v, idx) =>
        idx === variantIndex ? { ...v, image: imageUrl } : v
      );
      return { ...prev, variants: updated };
    });
    setVariantImagePickerIndex(null);
    setVariantImageUrlInput('');
    onShowToast('✔ تم تعيين صورة اللون بنجاح!', 'success');
  };

  const handleRemoveVariantImage = (variantIndex: number) => {
    setProductData((prev) => {
      const updated = prev.variants.map((v, idx) =>
        idx === variantIndex ? { ...v, image: undefined } : v
      );
      return { ...prev, variants: updated };
    });
    onShowToast('تمت إزالة صورة هذا اللون', 'info');
  };

  // Helper to generate AI Product Name with visual recognition and original foreign brand name rule
  const handleGenerateProductName = async () => {
    try {
      setIsGeneratingAiName(true);

      const hasImages = Array.isArray(productData.images) && productData.images.length > 0;
      if (!hasImages) {
        onShowToast('⚠️ يرجى رفع أو إضافة رابط صورة للمنتج أولاً ليتعرف الذكاء الاصطناعي على البراند والنوع بدقة!', 'info');
      }

      onShowToast('🔍 جاري فحص صور المنتج بدقة واستخلاص الاسم الصحيح والبراند الأصلي...', 'info');

      const safeImages = (productData.images || []).filter(
        (img) => typeof img === 'string' && img.trim().length > 0 && !img.startsWith('blob:')
      ).slice(0, 4);

      const result = await generateProductNameSmart({
        currentName: productData.nameAr || '',
        category: productData.categoryAr || '',
        images: safeImages,
      });

      if (result.success && result.productName) {
        setProductData((prev) => ({
          ...prev,
          nameAr: result.productName!,
        }));
        onShowToast('✔ تم التعرف البصري على المنتج والبراند بدقة وتسميته بنجاح!', 'success');
      } else {
        throw new Error(result.error || 'تعذر استخلاص اسم المنتج بالذكاء الاصطناعي');
      }
    } catch (err: any) {
      console.error('Failed to generate product name:', err);
      const errorMessage = err?.message || 'حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي';
      onShowToast(`❌ ${errorMessage}`, 'error');
    } finally {
      setIsGeneratingAiName(false);
    }
  };

  // Helper to generate AIDA product description using Gemini multimodal vision from uploaded images
  const handleGenerateAidaDescription = async () => {
    try {
      setIsGeneratingAiDesc(true);

      const hasImages = Array.isArray(productData.images) && productData.images.length > 0;
      if (!productData.nameAr && !hasImages) {
        onShowToast('⚠️ يرجى كتابة اسم للمنتج أو رفع صور أولاً ليتعرف عليها الذكاء الاصطناعي!', 'info');
      }

      onShowToast('✨ جاري تحليل صور المنتج بالذكاء الاصطناعي وصياغة وصف AIDA إقناعي وراقٍ...', 'info');

      const safeImages = (productData.images || []).filter(
        (img) => typeof img === 'string' && img.trim().length > 0 && !img.startsWith('blob:')
      ).slice(0, 4);

      const result = await generateProductDescriptionSmart({
        productName: productData.nameAr || '',
        category: productData.categoryAr || '',
        images: safeImages,
      });

      if (result.success && result.descriptionAr) {
        setProductData((prev) => ({
          ...prev,
          descriptionAr: result.descriptionAr!,
        }));
        onShowToast('✔ تم التعرف على المنتج وتوليد وصف صفحة الهبوط الإقناعي بنجاح!', 'success');
      } else {
        throw new Error(result.error || 'تعذر توليد وصف المنتج بالذكاء الاصطناعي');
      }
    } catch (err: any) {
      console.error('Failed to generate AIDA description:', err);
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

    // Clean and sanitize upsells
    const sanitizedUpsells: UpsellOffer[] = (productData.upsells || [])
      .filter((u) => u.title && u.title.trim())
      .map((u) => {
        const uPrice = Math.max(0, Number(u.price) || 0);
        const uWholesale = Math.max(0, Number(u.wholesalePrice) || 0);
        const uProfit = Math.max(0, Number(u.profit) || Math.max(0, uPrice - uWholesale));
        const uOriginal = Math.max(uPrice, Number(u.originalPrice) || uPrice);

        return {
          id: u.id || `upsell-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: u.title.trim(),
          description: u.description?.trim() || '',
          image: u.image?.trim() || '',
          price: uPrice,
          originalPrice: uOriginal,
          wholesalePrice: uWholesale,
          profit: uProfit,
          badge: u.badge?.trim() || '',
          isDefaultSelected: !!u.isDefaultSelected,
        };
      });

    // Clean and sanitize colorImages mapping from variants
    const colorImagesDict: Record<string, string> = { ...(productData.colorImages || {}) };
    finalVariants.forEach((v) => {
      if (v.color && v.color.trim() && v.image) {
        colorImagesDict[v.color.trim()] = v.image;
      }
    });

    const updatedProduct: Product = {
      ...productData,
      images: finalImages,
      variants: finalVariants,
      colorImages: Object.keys(colorImagesDict).length > 0 ? colorImagesDict : undefined,
      supplierId: finalSupplierId,
      supplierName: finalSupplierName,
      supplierNetPrice,
      nouvaFeePercent: activeFeePercent,
      wholesalePrice: finalWholesalePrice,
      floorPrice: Math.max(0, Number(productData.floorPrice) || 0),
      suggestedSellingPrice: Math.max(0, Number(productData.suggestedSellingPrice) || 0),
      ceilingPrice: Math.max(0, Number(productData.ceilingPrice) || 0),
      upsells: sanitizedUpsells,
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
            <Edit3 className="w-4 h-4 text-purple-400" />
            <span>{isAddingNewProduct ? 'إضافة منتج جديد للمخزون' : `تعديل المنتج: ${productData.nameAr}`}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs font-bold">
            إغلاق ✕
          </button>
        </div>

        <div className="space-y-3.5 text-xs max-h-[72vh] overflow-y-auto pe-2">
          {/* URL Quick Extraction Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950 border border-purple-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-white flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-purple-400" />
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
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-purple-500 transition placeholder:text-slate-600"
              />
              <button
                type="button"
                disabled={isExtractingUrl}
                onClick={handleExtractFromUrlInModal}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
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
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-[10px] flex items-center gap-1 shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
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
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:border-purple-500 transition"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              💡 الذكاء الاصطناعي يتعرف على الصور ويبقي اسم الماركة (البراند) بالأحرف الأجنبية الأصلية (مثل CeraVe, Eucerin, Nike) ويترجم خصائص المنتج بالعربية.
            </span>
          </div>

          {/* Product Description with AI AIDA Generator */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-purple-900/40 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="text-xs font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>وصف المنتج الإقناعي لصفحة الهبوط (AIDA):</span>
                </label>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  الذكاء الاصطناعي يتعرف على المنتج من الصور ويكتب نصاً تسويقياً راقياً بدون نجوم
                </span>
              </div>

              {/* AIDA Generator Button */}
              <button
                type="button"
                disabled={isGeneratingAiDesc}
                onClick={handleGenerateAidaDescription}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-purple-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-black text-[11px] flex items-center gap-1.5 shadow-md shadow-purple-950/60 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingAiDesc ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    <span>جاري تحليل الصور وتوليد الوصف...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>✨ توليد وصف إقناعي (AIDA)</span>
                  </>
                )}
              </button>
            </div>

            <AutoResizeTextarea
              minRows={4}
              value={productData.descriptionAr || ''}
              onChange={(e) => setProductData({ ...productData, descriptionAr: e.target.value })}
              placeholder="ارفع صور المنتج ثم اضغط على زر توليد الوصف بالذكاء الاصطناعي أعلاه لكتابة وصف إقناعي جذاب ومنسق..."
              className="text-xs sm:text-sm font-medium bg-slate-900 border-slate-800 focus:border-purple-500 text-slate-100"
            />

            {/* Description Images (صور توضيحية لصفحة الهبوط والتفاصيل) */}
            <div className="pt-2 border-t border-slate-900 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black text-purple-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>صور وصف المنتج التوضيحية (Landing Page Feed):</span>
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    تظهر داخل تفاصيل المنتج وفي رابط صفحة الهبوط كمعرض جذاب ومحفز للشراء
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="px-2.5 py-1 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-bold text-[10px] cursor-pointer flex items-center gap-1 transition">
                    <PlusCircle className="w-3 h-3" />
                    <span>+ رفع صور للوصف</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleDescriptionImagesUpload}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const newImg = prompt('أدخل رابط الصورة التوضيحية لوصف المنتج (URL):');
                      if (newImg && newImg.trim()) {
                        const newTitle = prompt('أدخل عنواناً لهذه الصورة (اختياري - يظهر أعلى الصورة في صفحة الهبوط):') || '';
                        setProductData((prev) => ({
                          ...prev,
                          descriptionImages: [
                            ...(prev.descriptionImages || []),
                            { url: newImg.trim(), title: newTitle.trim() },
                          ],
                        }));
                        onShowToast('✔ تم إضافة صورة لوصف المنتج بنجاح!', 'success');
                      }
                    }}
                    className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px]"
                  >
                    + رابط URL
                  </button>
                </div>
              </div>

              {/* List of Description Images with Editable Titles & Spacing Management */}
              {productData.descriptionImages && productData.descriptionImages.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {productData.descriptionImages.map((descItem, i) => {
                    const itemUrl = typeof descItem === 'string' ? descItem : descItem.url;
                    const itemTitle = typeof descItem === 'string' ? '' : (descItem.title || '');

                    return (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2.5 rounded-2xl border border-purple-900/60 bg-slate-950/70 hover:border-purple-600/50 transition"
                      >
                        {/* Thumbnail Image */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0 self-center sm:self-auto">
                          <img
                            src={itemUrl}
                            alt={`صورة الوصف ${i + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute bottom-1 start-1 px-1.5 py-0.5 rounded bg-slate-950/85 text-purple-300 text-[9px] font-mono font-bold">
                            #{i + 1}
                          </span>
                        </div>

                        {/* Editable Title Input */}
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-extrabold text-purple-300 flex items-center gap-1.5">
                            <span>عنوان الصورة في صفحة الهبوط:</span>
                            <span className="text-[9px] text-slate-400 font-normal">
                              (يظهر كعنوان بارز أعلى الصورة مع مسافة تسويقية)
                            </span>
                          </label>
                          <input
                            type="text"
                            value={itemTitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProductData((prev) => {
                                const list = [...(prev.descriptionImages || [])];
                                list[i] = {
                                  url: itemUrl,
                                  title: val,
                                };
                                return { ...prev, descriptionImages: list };
                              });
                            }}
                            placeholder="مثال: جودة خامات تدوم طويلاً / تصميم مريح وأنيق..."
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 text-xs text-white placeholder:text-slate-500 font-medium transition"
                          />
                        </div>

                        {/* Action buttons (Reorder & Delete) */}
                        <div className="flex sm:flex-col items-center justify-end gap-1 shrink-0">
                          {i > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setProductData((prev) => {
                                  const list = [...(prev.descriptionImages || [])];
                                  const temp = list[i - 1];
                                  list[i - 1] = list[i];
                                  list[i] = temp;
                                  return { ...prev, descriptionImages: list };
                                });
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="تحريك لأعلى"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {i < (productData.descriptionImages?.length || 0) - 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setProductData((prev) => {
                                  const list = [...(prev.descriptionImages || [])];
                                  const temp = list[i + 1];
                                  list[i + 1] = list[i];
                                  list[i] = temp;
                                  return { ...prev, descriptionImages: list };
                                });
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="تحريك لأسفل"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setProductData((prev) => ({
                                ...prev,
                                descriptionImages: (prev.descriptionImages || []).filter((_, idx) => idx !== i),
                              }))
                            }
                            className="p-1.5 bg-rose-950/60 hover:bg-rose-600 border border-rose-800/60 text-rose-300 hover:text-white rounded-lg transition"
                            title="حذف الصورة من الوصف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 italic py-1">
                  لم يتم إضافة صور لوصف المنتج بعد. يمكنك رفع لقطات توضيحية أو إنفوجرافيك للمنتج مع إضافة عناوين بارزة لزيادة معدل التحويل والمبيعات.
                </p>
              )}
            </div>
          </div>

          {/* CATEGORY & SUPPLIER SELECTOR GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-purple-400 font-extrabold block mb-1">
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
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-purple-500/60 text-white font-bold cursor-pointer"
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
                <label className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold text-[10px] cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>رفع صور من الجهاز</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
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
                    <span className="absolute bottom-0.5 start-0.5 px-1 py-0.2 rounded bg-purple-600 text-white text-[8px] font-black">
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

                <div className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/80 text-purple-300 font-mono font-black text-[11px]">
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
                <Box className="w-3 h-3 text-purple-400" />
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
                  <div className="col-span-1 sm:col-span-2">
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
                  <div className="col-span-1 sm:col-span-1 text-center">
                    <label className="text-[8px] text-slate-400 block mb-0.5 font-bold">
                      اللون:
                    </label>
                    <div className="flex items-center justify-center">
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
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Color Thumbnail Image (صورة اللون) */}
                  <div className="col-span-1 sm:col-span-3">
                    <label className="text-[8px] text-purple-300 block mb-0.5 font-extrabold flex items-center gap-1">
                      <Camera className="w-2.5 h-2.5 text-purple-400" />
                      <span>صورة هذا اللون:</span>
                    </label>
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 min-h-[34px]">
                      {v.image ? (
                        <div className="relative group shrink-0">
                          <img
                            src={v.image}
                            alt={v.color}
                            className="w-7 h-7 rounded-md object-cover border border-purple-500/60"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantImage(vIdx)}
                            className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow-xs"
                            title="إزالة صورة اللون"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-md border border-dashed border-slate-700 flex items-center justify-center shrink-0 text-slate-500 bg-slate-900/50">
                          <ImageIcon className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setVariantImagePickerIndex(vIdx);
                          setVariantImageUrlInput(v.image || '');
                        }}
                        className={`flex-1 px-1.5 py-1 rounded text-[9px] font-bold truncate transition text-center ${
                          v.image
                            ? 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-800/60'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                        title="تحديد أو رفع صورة اللون"
                      >
                        {v.image ? 'تغيير الصورة' : '+ إضافة صورة'}
                      </button>
                    </div>
                  </div>

                  {/* Stock Count Quantity */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[8px] text-purple-400 block mb-0.5 font-extrabold">
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
                      className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-purple-500/60 text-purple-300 font-mono font-black text-center text-xs"
                    />
                  </div>

                  {/* Delete Variant */}
                  <div className="col-span-1 sm:col-span-1 text-center flex sm:block justify-end">
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-black text-purple-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span>قسم تسعير المنتج (عمولة Nouva وأسعار البيع):</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/30">
                  عمولة Nouva المعتمدة: {activeFeePercent}%
                </span>
              </div>
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
                  <label className="text-[10px] text-purple-300 font-black block mb-1">
                    عمولة Nouva ({activeFeePercent}%):
                  </label>
                  <div className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-purple-500/40 text-purple-300 font-mono font-bold text-xs flex justify-between items-center">
                    <span>+{nouvaFeeAmount}</span>
                    <span className="text-[10px] text-slate-500 font-bold">دج</span>
                  </div>
                  <span className="text-[8px] text-slate-400 block mt-0.5">Marketplace Fee للمنصة</span>
                </div>

                <div>
                  <label className="text-[10px] text-purple-300 font-black block mb-1">
                    سعر البيع للبائع (Wholesale):
                  </label>
                  <div className="px-2.5 py-1.5 rounded-lg bg-purple-950/80 border border-purple-500/60 text-purple-300 font-mono font-black text-xs flex justify-between items-center">
                    <span>{calculatedWholesalePrice}</span>
                    <span className="text-[10px] text-slate-500 font-bold">دج</span>
                  </div>
                  <span className="text-[8px] text-purple-400/80 block mt-0.5">السعر الذي يظهر للمسوقين</span>
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
                <label className="text-[9px] text-purple-400 font-bold block mb-0.5">السعر المقترح:</label>
                <input
                  type="number"
                  value={productData.suggestedSellingPrice || ''}
                  onChange={(e) => setProductData({ ...productData, suggestedSellingPrice: Number(e.target.value) || 0 })}
                  placeholder="مثال: 4900"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-purple-500/50 text-purple-400 font-mono font-bold text-xs"
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
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-purple-300" />
              <span>حفظ المنتج بالكامل</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up dialog to pick or upload image for a specific color/variant */}
      {variantImagePickerIndex !== null && productData.variants[variantImagePickerIndex] && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-white/40 shadow-xs inline-block"
                  style={{ backgroundColor: productData.variants[variantImagePickerIndex].colorHex || '#2563eb' }}
                />
                <h4 className="text-sm font-black text-white">
                  صورة اللون: {productData.variants[variantImagePickerIndex].color || 'اللون المحدد'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setVariantImagePickerIndex(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current preview if exists */}
            {productData.variants[variantImagePickerIndex].image && (
              <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-2xl border border-purple-500/30">
                <img
                  src={productData.variants[variantImagePickerIndex].image}
                  alt="preview"
                  className="w-14 h-14 rounded-xl object-cover border border-purple-500 shadow-md"
                />
                <div className="flex-1 text-xs">
                  <span className="text-slate-200 font-bold block">الصورة الحالية لهذا اللون</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveVariantImage(variantImagePickerIndex);
                    }}
                    className="mt-1.5 text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إزالة الصورة والاعتماد على الصورة العامة</span>
                  </button>
                </div>
              </div>
            )}

            {/* Option 1: Upload from device */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                1. رفع صورة خاصة بهذا اللون من جهازك:
              </label>
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-purple-500/50 bg-purple-950/20 hover:bg-purple-950/40 text-purple-300 cursor-pointer font-bold text-xs transition">
                <Camera className="w-4 h-4 text-purple-400" />
                <span>اضغط لرفع صورة من الجهاز (هاتف / كمبيوتر)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    await handleVariantFileUpload(e, variantImagePickerIndex);
                    setVariantImagePickerIndex(null);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Option 2: Choose from product existing images */}
            {productData.images && productData.images.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 block">
                  2. أو اختر من صور المنتج المرفوعة:
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                  {productData.images.map((imgUrl, imgIdx) => {
                    const isSelected = productData.variants[variantImagePickerIndex].image === imgUrl;
                    return (
                      <button
                        key={imgIdx}
                        type="button"
                        onClick={() => handleSetVariantImage(variantImagePickerIndex, imgUrl)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition group ${
                          isSelected ? 'border-purple-500 ring-2 ring-purple-400' : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-purple-600/50 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white font-black" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Option 3: Direct URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                3. أو أدخل رابط مباشر لصورة اللون (URL):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={variantImageUrlInput}
                  onChange={(e) => setVariantImageUrlInput(e.target.value)}
                  placeholder="https://images.example.com/color.jpg"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (variantImageUrlInput.trim()) {
                      handleSetVariantImage(variantImagePickerIndex, variantImageUrlInput.trim());
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                >
                  تعيين
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setVariantImagePickerIndex(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
