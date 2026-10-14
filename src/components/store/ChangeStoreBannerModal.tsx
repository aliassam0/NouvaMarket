import React, { useState } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Sparkles,
  Flame,
  Truck,
  Smartphone,
  ShoppingBag,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import {
  getOfficialStoreSettings,
  saveOfficialStoreSettings,
  OfficialStoreSettings,
} from '../../lib/officialStoreConfig';

interface ChangeStoreBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

// Curated high-converting e-commerce banner presets (Algerian market tailored)
export const BANNER_PRESETS = [
  {
    id: 'default',
    title: '🌟 البانر الرسمي لمنصة Nouva',
    description: 'البانر الأصلي المعتمد ذو التصميم الشامل والهوية الرسمية للمنصة',
    url: '/social-banner.png',
    icon: Sparkles,
    tag: 'افتراضي رسمي',
  },
  {
    id: 'mega-sale',
    title: '🔥 بانر التخفيضات الكبرى والعروض الحصرية',
    description: 'تصميم عالي الجاذبية يركز على الخصومات القوية وتخفيضات نهاية الأسبوع',
    url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80',
    icon: Flame,
    tag: 'الأعلى تحويلاً',
  },
  {
    id: 'tech-gadgets',
    title: '📱 بانر الإلكترونيات والأجهزة الذكية',
    description: 'ستايل عصري حديث مثالي لمنتجات التكنولوجيا والملحقات والأجهزة الإلكترونية',
    url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1600&q=80',
    icon: Smartphone,
    tag: 'تقنية وأجهزة',
  },
  {
    id: 'fashion-lifestyle',
    title: '👗 بانr الموضة والجمال والعناية',
    description: 'ألوان جذابة ولمسة أنيقة مخصصة لمنتجات العناية بالبشرة، الأزياء ومستحضرات التجميل',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
    icon: ShoppingBag,
    tag: 'موضة وجمال',
  },
  {
    id: 'fast-shipping',
    title: '🚚 بانر التوصيل السريع 58 ولاية والدفع بعد الفحص',
    description: 'يرسخ الأمان وثقة الزبائن في الشحن السريع إلى باب المنزل والدفع عند الاستلام',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80',
    icon: Truck,
    tag: 'ثقة وتوصيل',
  },
];

export function ChangeStoreBannerModal({
  isOpen,
  onClose,
  onSuccessToast,
}: ChangeStoreBannerModalProps) {
  if (!isOpen) return null;

  const currentSettings = getOfficialStoreSettings();
  const [bannerUrl, setBannerUrl] = useState<string>(
    currentSettings.bannerImageUrl || '/social-banner.png'
  );
  const [bannerBadge, setBannerBadge] = useState<string>(
    currentSettings.bannerBadge || 'توصيل سريع لجميع الولايات 🚚'
  );
  const [announcementText, setAnnouncementText] = useState<string>(
    currentSettings.announcementText ||
      '🚚 توصيل سريع لـ 58 ولاية • الدفع عند الاستلام مع حق الفحص والمعاينة • ضمان الاستبدال 7 أيام'
  );
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handle local file upload with canvas compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 10MB raw)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 10 ميغابايت.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsUploading(false);
        setUploadError('تعذر قراءة الصورة، يرجى المحاولة مرة أخرى.');
        return;
      }

      // Optimize image via Canvas to prevent localStorage quota issues
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 700;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setBannerUrl(compressedDataUrl);
          setIsUploading(false);
        } else {
          setBannerUrl(dataUrl);
          setIsUploading(false);
        }
      };
      img.onerror = () => {
        setBannerUrl(dataUrl);
        setIsUploading(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setIsUploading(false);
      setUploadError('حدث خطأ أثناء تحميل الملف.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyPreset = (url: string) => {
    setBannerUrl(url);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    setBannerUrl(customUrlInput.trim());
    setCustomUrlInput('');
  };

  const handleSave = () => {
    saveOfficialStoreSettings({
      bannerImageUrl: bannerUrl.trim() || '/social-banner.png',
      bannerBadge: bannerBadge.trim() || 'توصيل سريع لجميع الولايات 🚚',
      announcementText: announcementText.trim() || '🚚 توصيل سريع لـ 58 ولاية • الدفع عند الاستلام',
    });

    if (onSuccessToast) {
      onSuccessToast('🎉 تم حفظ وتطبيق بانر متجر المنصة بنجاح!');
    }
    onClose();
  };

  const handleResetToDefault = () => {
    setBannerUrl('/social-banner.png');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-fade-in"
      dir="rtl"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>تغيير بانر متجر المنصة الرسمي</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  تحديث مباشر
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اختر صورة من جهازك، أو ضع رابطاً، أو حدد أحد البانرات الاحترافية الجاهزة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Live Banner Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>معاينة البانر الحالي للمتجر:</span>
              </label>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[11px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة البانر الافتراضي</span>
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-lg bg-slate-950 max-h-[220px]">
              <img
                src={bannerUrl || '/social-banner.png'}
                alt="Banner Preview"
                className="w-full h-auto max-h-[220px] object-cover object-center"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/social-banner.png';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 end-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-black text-[10px] shadow-md flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>معاينة حية مفعّلة</span>
                </span>
              </div>
            </div>
          </div>

          {/* 2. Upload or Custom URL options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload from device */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-500 transition space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                  رفع صورة جديدة من جهازك
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  PNG, JPG أو WebP بأبعاد عريضة موصى بها (1200x400)
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'جاري المعالجة...' : 'تصفح الملفات من جهازك'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
              {uploadError && (
                <p className="text-[11px] text-rose-500 font-bold">{uploadError}</p>
              )}
            </div>

            {/* Custom URL Input */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  أو إدخال رابط صورة خارجي:
                </span>
              </div>
              <input
                type="text"
                placeholder="https://example.com/banner.jpg"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-left"
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                disabled={!customUrlInput.trim()}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs transition disabled:opacity-50"
              >
                تطبيق الرابط على المعاينة
              </button>
            </div>
          </div>

          {/* 3. Ready Curated Presets */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
              اختيار بانر احترافي جاهز بنقرة واحدة:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BANNER_PRESETS.map((preset) => {
                const isSelected = bannerUrl === preset.url;
                const Icon = preset.icon;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset.url)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 relative group ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 relative">
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {preset.title}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {preset.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {preset.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Additional Banner Badges & Announcement Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
              نصوص وشريط الإعلان المرفق مع المتجر (اختياري):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  وسم البانر الرسمي:
                </label>
                <input
                  type="text"
                  value={bannerBadge}
                  onChange={(e) => setBannerBadge(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  شريط الإعلان العلوي:
                </label>
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>حفظ وتطبيق البانر فوراً</span>
          </button>
        </div>
      </div>
    </div>
  );
}
