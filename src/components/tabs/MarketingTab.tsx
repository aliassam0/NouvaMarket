import React, { useState, useEffect } from 'react';
import { AutoResizeTextarea } from '../ui/AutoResizeTextarea';
import { Sparkles, Copy, Share2, Check, Send, RefreshCw, Wand2, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getStoredProducts } from '../../data/mockProducts';
import { Product } from '../../types';

interface MarketingTabProps {
  initialProduct?: Product | null;
  onShowToast: (msg: string) => void;
  onReturnToOrder?: (product: Product) => void;
}

export function MarketingTab({ initialProduct, onShowToast, onReturnToOrder }: MarketingTabProps) {
  const { t } = useLanguage();

  const [productsList, setProductsList] = useState<Product[]>(getStoredProducts);

  useEffect(() => {
    const sync = () => setProductsList(getStoredProducts());
    window.addEventListener('products_updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('products_updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const [selectedProduct, setSelectedProduct] = useState<Product>(
    initialProduct || productsList[0] || getStoredProducts()[0]
  );
  const [platform, setPlatform] = useState<'WhatsApp' | 'Instagram' | 'TikTok' | 'Facebook' | 'LandingPage_PASO'>('WhatsApp');
  const [tone, setTone] = useState('حماسية وجذابة مع إيموجي وتأكيد التوصيل 58 ولاية');
  const [sellingPrice, setSellingPrice] = useState<number>(selectedProduct.suggestedSellingPrice);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<string>(
    `✨ أحدث المنتجات والتكنولوجيا بين يديك! ✨\n🛍️ ${selectedProduct.nameAr}\n\nجودة عالية، تصميم فاخر، وتكنولوجيا متطورة تضمن لك أداءً ممتازاً واستخداماً سهلاً يومياً! 😍\n\n🔥 **السعر العرض الخاص:** ${selectedProduct.suggestedSellingPrice}دج فقط!\n🚚 **التوصيل السريع متوفر لـ 58 ولاية!**\n💵 **الدفع عند الاستلام** (تتفقد سلعتك قبل ما تخلص).\n\n📲 **للطلب أرسل رسالة أو اتصل بنا الآن!**`
  );

  const handleGenerateCopy = async () => {
    setIsGenerating(true);
    try {
      if (platform === 'LandingPage_PASO') {
        const res = await fetch('/api/admin/ai/generate-product-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: selectedProduct.nameAr,
            category: selectedProduct.categoryAr,
            images: selectedProduct.images || [],
          }),
        });
        const data = await res.json();
        if (data.descriptionAr) {
          setGeneratedText(data.descriptionAr);
          onShowToast('✔ تم التعرف على صور المنتج وتوليد وصف صفحة الهبوط بصيغة PASO!');
          return;
        }
      }

      const res = await fetch('/api/reseller/ai/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct.nameAr,
          productDescription: selectedProduct.descriptionAr,
          platform,
          tone,
          price: sellingPrice,
          profit: sellingPrice - selectedProduct.wholesalePrice,
          ageGroup: selectedProduct.ageGroup,
        }),
      });

      const data = await res.json();
      if (data.generatedText) {
        setGeneratedText(data.generatedText);
        onShowToast('تم إنشاء النص الإعلاني الذكي بواسطة Gemini AI!');
      }
    } catch (e) {
      onShowToast('حدث خطأ أثناء الاتصال بـ Gemini AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generatedText);
    onShowToast('تم نسخ النص الإعلاني إلى الحافظة!');
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(generatedText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="flex-1 pb-24 overflow-y-auto p-4 text-slate-900 dark:text-slate-100 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-violet-600" />
          <span>{t('marketing.title')}</span>
        </h1>
        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] font-bold shadow-xs">
          Gemini AI Powered ⚡
        </span>
      </div>

      {/* Product Selector */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
          اختر السلعة المراد التسويق لها:
        </label>
        <select
          value={selectedProduct.id}
          onChange={(e) => {
            const p = productsList.find((item) => item.id === e.target.value);
            if (p) {
              setSelectedProduct(p);
              setSellingPrice(p.suggestedSellingPrice);
            }
          }}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
        >
          {productsList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nameAr} ({p.suggestedSellingPrice}دج)
            </option>
          ))}
        </select>

        {/* Platform Picker */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            {t('marketing.platform')}:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-bold">
            {(
              [
                { id: 'WhatsApp', label: 'WhatsApp' },
                { id: 'Instagram', label: 'Instagram' },
                { id: 'TikTok', label: 'TikTok' },
                { id: 'Facebook', label: 'Facebook' },
                { id: 'LandingPage_PASO', label: '✨ صفحة هبوط (PASO)' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`py-2 px-1 rounded-xl transition border text-center font-bold text-[11px] ${
                  platform === p.id
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateCopy}
          disabled={isGenerating}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-purple-700 hover:from-violet-500 hover:to-purple-500 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'جاري توليد الإعلان الذكي...' : 'توليد منشور تسويقي بـ Gemini AI'}</span>
        </button>
      </div>

      {/* Generated Copy Output Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50/80 via-white to-purple-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/50 border border-violet-200/80 dark:border-violet-800/50 shadow-md space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-violet-900 dark:text-violet-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>النص التسويقي الجاهز للنشر:</span>
          </span>
          <span className="text-[10px] text-violet-600/80 dark:text-violet-400/80 font-mono font-bold bg-violet-100/80 dark:bg-violet-950/80 px-2 py-0.5 rounded-full border border-violet-200/50 dark:border-violet-800/50">
            {generatedText.length} حرف
          </span>
        </div>

        <AutoResizeTextarea
          value={generatedText}
          onChange={(e) => setGeneratedText(e.target.value)}
          minRows={6}
          placeholder="أدخل أو صغ نص الإعلان هنا..."
          className="bg-white/90 dark:bg-slate-950/90 border-violet-200/80 dark:border-violet-900/60 text-slate-900 dark:text-slate-100 text-sm sm:text-base font-medium leading-relaxed whitespace-pre-line shadow-xs focus:ring-2 focus:ring-violet-500/30"
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopyText}
            className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{t('marketing.copyBtn')}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة مباشرة واتساب</span>
          </button>
        </div>

        {/* Return to Complete Order Button (Last button under Copy & Share) */}
        <button
          onClick={() => {
            if (onReturnToOrder) {
              onReturnToOrder(selectedProduct);
            }
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-500 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-md border border-purple-500/30"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>العودة لإتمام الطلب</span>
        </button>
      </div>
    </div>
  );
}
