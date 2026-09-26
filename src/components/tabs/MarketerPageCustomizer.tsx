import React, { useState } from 'react';
import {
  Video,
  MessageSquare,
  Star,
  Phone,
  Palette,
  Image as ImageIcon,
  FileText,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Upload,
  ExternalLink,
  HelpCircle,
  Eye,
  RefreshCw,
  X,
  CheckCircle2,
  Flame,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Product, MarketerCustomization, MarketerReview } from '../../types';
import { WhatsAppIcon } from './CustomerShareOrderEnhancements';
import { useAuth } from '../../context/AuthContext';
import { compressImageFile, compressImageArray, compressDataUrl } from '../../utils/imageCompressor';

interface MarketerPageCustomizerProps {
  product: Product;
  initialCustomization?: MarketerCustomization;
  onSave: (customization: MarketerCustomization) => void;
  onPreview?: () => void;
  onClose?: () => void;
}

const COLOR_PRESETS = [
  { name: 'عنبري ذهبي (الافتراضي)', hex: '#fca120', textHex: '#ffffff' },
  { name: 'أخضر زمردي للتحويل', hex: '#10b981', textHex: '#ffffff' },
  { name: 'بنفسجي ملكي', hex: '#7c3aed', textHex: '#ffffff' },
  { name: 'أزرق كلاسيكي', hex: '#2563eb', textHex: '#ffffff' },
  { name: 'أحمر جريء', hex: '#e11d48', textHex: '#ffffff' },
  { name: 'أسود فخم (Luxury)', hex: '#0f172a', textHex: '#ffffff' },
];

export function MarketerPageCustomizer({
  product,
  initialCustomization,
  onSave,
  onPreview,
  onClose,
}: MarketerPageCustomizerProps) {
  const { user } = useAuth();

  // Active sub-section within the customizer:
  // 'video' | 'reviews' | 'whatsapp' | 'color' | 'main_images' | 'desc_images' | 'description'
  const [activeSection, setActiveSection] = useState<
    'video' | 'reviews' | 'whatsapp' | 'color' | 'main_images' | 'desc_images' | 'description'
  >('video');

  // State for all 7 elements
  // 1. Video
  const [videoUrl, setVideoUrl] = useState(initialCustomization?.videoUrl || '');
  const [videoTitle, setVideoTitle] = useState(
    initialCustomization?.videoTitle || 'شاهد تجربة واستخدام المنتج على أرض الواقع 🎥'
  );

  // 2. Reviews
  const [showReviews, setShowReviews] = useState(initialCustomization?.showReviews ?? true);
  const [reviews, setReviews] = useState<MarketerReview[]>(
    initialCustomization?.reviews && initialCustomization.reviews.length > 0
      ? initialCustomization.reviews
      : []
  );

  // 3. WhatsApp
  const [showWhatsApp, setShowWhatsApp] = useState(initialCustomization?.showWhatsApp ?? true);
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialCustomization?.whatsappNumber || user?.phone || ''
  );
  const [whatsappMessage, setWhatsappMessage] = useState(
    initialCustomization?.whatsappMessage ||
      `مرحباً، أود الاستفسار بخصوص منتج ${product.nameAr}`
  );

  // 4. Button Color
  const [buttonColor, setButtonColor] = useState(initialCustomization?.buttonColor || '#fca120');

  // 5. Custom Main Images
  const [customMainImages, setCustomMainImages] = useState<string[]>(
    initialCustomization?.customMainImages || []
  );
  const [newMainImageUrl, setNewMainImageUrl] = useState('');

  // 6. Custom Description Images
  const [customDescriptionImages, setCustomDescriptionImages] = useState<string[]>(
    initialCustomization?.customDescriptionImages || []
  );
  const [newDescImageUrl, setNewDescImageUrl] = useState('');

  // 7. Custom Description
  const [customDescription, setCustomDescription] = useState(
    initialCustomization?.customDescription ?? ''
  );

  // Helper to generate default realistic reviews
  const handleAddDefaultReviews = () => {
    const defaultList: MarketerReview[] = [
      {
        id: `rev-${Date.now()}-1`,
        name: 'أمينة ب.',
        city: 'وهران',
        rating: 5,
        comment: 'وصلني المنتج في 48 ساعة فقط مطابق للصور تماماً وجودته عالية جداً، شكراً لكم!',
        date: 'منذ يومين',
      },
      {
        id: `rev-${Date.now()}-2`,
        name: 'كريم م.',
        city: 'الجزائر العاصمة',
        rating: 5,
        comment: 'خدمة احترافية وتغليف ممتاز، والأهم الدفع بعد المعاينة عند الاستلام. أنصح بالشراء.',
        date: 'منذ 3 أيام',
      },
      {
        id: `rev-${Date.now()}-3`,
        name: 'سارة ل.',
        city: 'قسنطينة',
        rating: 5,
        comment: 'عجبني بزاف، طلبت قطعتين واستفدت من تخفيض الـ UpSell، تجربة تسوق رائعة!',
        date: 'منذ أسبوع',
      },
    ];
    setReviews(defaultList);
    setShowReviews(true);
  };

  // Add a single custom review
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewCity, setNewReviewCity] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewImage, setNewReviewImage] = useState('');

  const handleAddNewReview = () => {
    if (!newReviewName.trim() || !newReviewComment.trim()) return;
    const rev: MarketerReview = {
      id: `rev-${Date.now()}`,
      name: newReviewName.trim(),
      city: newReviewCity.trim() || 'الجزائر',
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      image: newReviewImage.trim() || undefined,
      date: 'مؤخراً',
    };
    setReviews((prev) => [rev, ...prev]);
    setNewReviewName('');
    setNewReviewCity('');
    setNewReviewRating(5);
    setNewReviewComment('');
    setNewReviewImage('');
    setShowReviews(true);
  };

  const handleRemoveReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  // Image upload helpers (auto-compresses to optimal web dimensions < 60KB to prevent quota errors)
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'main' | 'desc' | 'review'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const maxDim = type === 'review' ? 600 : 800;
      const quality = type === 'review' ? 0.68 : 0.72;
      const compressed = await compressImageFile(file, maxDim, quality);

      if (compressed) {
        if (type === 'main') {
          setCustomMainImages((prev) => [...prev, compressed].slice(0, 6));
        } else if (type === 'desc') {
          setCustomDescriptionImages((prev) => [...prev, compressed].slice(0, 6));
        } else if (type === 'review') {
          setNewReviewImage(compressed);
        }
      }
    } catch (err) {
      console.warn('Error compressing uploaded file:', err);
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  // Save current customization with automatic budget compression
  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // Ensure all custom images are compressed to keep quota tiny
      const compressedMain = await compressImageArray(customMainImages, 800, 0.72, 6);
      const compressedDesc = await compressImageArray(customDescriptionImages, 800, 0.72, 6);

      const processedReviews = await Promise.all(
        reviews.slice(0, 12).map(async (r) => {
          if (r.image && r.image.startsWith('data:image/') && r.image.length > 80 * 1024) {
            const compressedProof = await compressDataUrl(r.image, 600, 0.68);
            return { ...r, image: compressedProof };
          }
          return r;
        })
      );

      const data: MarketerCustomization = {
        videoUrl: videoUrl.trim() || undefined,
        videoTitle: videoTitle.trim() || undefined,
        showReviews,
        reviews: processedReviews.length > 0 ? processedReviews : undefined,
        showWhatsApp,
        whatsappNumber: whatsappNumber.trim() || undefined,
        whatsappMessage: whatsappMessage.trim() || undefined,
        buttonColor: buttonColor || '#fca120',
        customMainImages: compressedMain.length > 0 ? compressedMain : undefined,
        customDescriptionImages: compressedDesc.length > 0 ? compressedDesc : undefined,
        customDescription: customDescription.trim() ? customDescription.trim() : undefined,
      };
      onSave(data);
    } catch (err) {
      console.warn('Notice saving customization:', err);
      // Fallback save directly
      const fallbackData: MarketerCustomization = {
        videoUrl: videoUrl.trim() || undefined,
        videoTitle: videoTitle.trim() || undefined,
        showReviews,
        reviews: reviews.length > 0 ? reviews : undefined,
        showWhatsApp,
        whatsappNumber: whatsappNumber.trim() || undefined,
        whatsappMessage: whatsappMessage.trim() || undefined,
        buttonColor: buttonColor || '#fca120',
        customMainImages: customMainImages.length > 0 ? customMainImages.slice(0, 6) : undefined,
        customDescriptionImages:
          customDescriptionImages.length > 0 ? customDescriptionImages.slice(0, 6) : undefined,
        customDescription: customDescription.trim() ? customDescription.trim() : undefined,
      };
      onSave(fallbackData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-amber-500/10 border border-purple-200 dark:border-purple-900/60 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/20">
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                تخصيص وتمييز صفحة الرابط (Differentiating Elements)
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-black">
                رفع معدل التحويل 🚀
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              اجعل صفحتك فريدة وتتغلب على المنافسين لنفس المنتج بإضافة فيديو تجربة، تقييمات حقيقية، زر واتساب، وألوان مخصصة.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs for the 7 Elements */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {[
          { id: 'video', label: '1. فيديو التجربة (Reel/Video)', icon: Video },
          { id: 'reviews', label: '2. تقييمات الزبائن (Social Proof)', icon: Star },
          { id: 'whatsapp', label: '3. زر واتساب العائم', icon: Phone },
          { id: 'color', label: '4. لون الأزرار', icon: Palette },
          { id: 'main_images', label: '5. صورة المنتج الرئيسية', icon: ImageIcon },
          { id: 'desc_images', label: '6. صور الوصف', icon: Upload },
          { id: 'description', label: '7. الوصف المخصص', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer border shrink-0 ${
                isActive
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content for each section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        {/* 1. Video Reel / UGC */}
        {activeSection === 'video' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-purple-600" />
                  <span>فيديو مراجعة أو تجربة للمنتج (UGC / Reels / Shorts)</span>
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  فيديوهات المراجعة القصيرة تزيد ثقة المشتري بنسبة تتجاوز 40% وتخفض التردد في الشراء.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رابط الفيديو (YouTube Shorts / Reels / TikTok / رابط فيديو MP4):
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/shorts/... أو https://www.tiktok.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان أو نص محفّز فوق الفيديو:
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="شاهد تجربة واستخدام المنتج على أرض الواقع 🎥"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {videoUrl ? (
                <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>تم تحديد رابط الفيديو بنجاح، سيظهر بشكل أنيق ومدمج في صفحة الطلب.</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 text-center">
                  💡 ضع رابط فيديو يوتيوب أو تيك توك للمنتج لجعل الزبون يشاهده مباشرة داخل الصفحة.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Customer Reviews & Social Proof */}
        {activeSection === 'reviews' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h5 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>آراء وتقييمات زبائن مع صور (Social Proof & Reviews)</span>
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  عرض تقييمات إيجابية وصور حقيقية يمنح الزبون دليلاً اجتماعياً قوياً لتأكيد الطلب.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddDefaultReviews}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>إضافة تقييمات مقترحة فورية</span>
                </button>
              </div>
            </div>

            {/* Toggle switch */}
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={showReviews}
                onChange={(e) => setShowReviews(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500"
              />
              <span>تفعيل قسم آراء وتقييمات الزبائن في صفحة الطلب</span>
            </label>

            {/* Existing reviews list */}
            {reviews.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                  التقييمات المضافة ({reviews.length}):
                </span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{rev.name}</span>
                          {rev.city && (
                            <span className="text-[10px] text-slate-400 font-medium">({rev.city})</span>
                          )}
                          <div className="flex items-center gap-0.5">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          &quot;{rev.comment}&quot;
                        </p>
                        {rev.image && (
                          <div className="mt-1 w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img src={rev.image} alt="Review proof" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveReview(rev.id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                        title="حذف التقييم"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form to add a new review */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                + إضافة تقييم جديد:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  placeholder="اسم الزبون (مثال: نوال س.)"
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
                <input
                  type="text"
                  value={newReviewCity}
                  onChange={(e) => setNewReviewCity(e.target.value)}
                  placeholder="المدينة / الولاية (مثال: البليدة)"
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <textarea
                  rows={2}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="تعليق الزبون ورأيه في جودة وسرعة استلام المنتج..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Rating stars picker */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">التقييم:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="cursor-pointer p-0.5"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= newReviewRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Upload proof image */}
                <label className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{newReviewImage ? 'تم اختيار صورة الإثبات' : 'صورة محادثة أو للمنتج'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileUpload(e, 'review')}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleAddNewReview}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer transition shadow-2xs"
                >
                  إضافة التقييم
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Direct WhatsApp Chat Button */}
        {activeSection === 'whatsapp' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h5 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>زر مباشر للتواصل السريع (Direct WhatsApp Chat Button)</span>
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                زر عائم للواتساب يسمح للزبائن المترددين بطرح استفساراتهم وتأكيد طلبياتهم فوراً، مما يسترجع حتى 25% من المبيعات الضائعة.
              </p>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={showWhatsApp}
                onChange={(e) => setShowWhatsApp(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
              />
              <span>تفعيل زر واتساب العائم في صفحة الطلب</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم هاتف الواتساب (مع رمز الدولة أو بدون 0):
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="06xxxxxxxx أو 213xxxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الرسالة التلقائية المجهزة للزبون:
                </label>
                <input
                  type="text"
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="مرحباً، أود الاستفسار حول..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                />
              </div>
            </div>

            {/* Live preview */}
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md">
                  <WhatsAppIcon className="w-5 h-5 fill-current" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                    معاينة الزر العائم
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    سيثبت الزر في أسفل الصفحة لسهولة النقر من الهاتف والحاسوب
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 text-[10px] font-black">
                {showWhatsApp ? 'مفعل' : 'معطل'}
              </span>
            </div>
          </div>
        )}

        {/* 4. Button Color */}
        {activeSection === 'color' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h5 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-600" />
                <span>إمكانية تغيير لون الأزرار في صفحة رابط المنتج الخاص بالمسوق</span>
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                اختر لوناً متناسقاً مع هوية علامتك التجارية أو ألوان منتجك لزيادة الجاذبية البصرية.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                الألوان المقترحة الأكثر تحويلاً:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = buttonColor === preset.hex;
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setButtonColor(preset.hex)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-xs font-bold ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/10 shadow-2xs shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span className="truncate">{preset.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center gap-3 pt-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  أو اختر كود لون مخصص (Hex):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5"
                  />
                  <input
                    type="text"
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                    className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>

              {/* Live Preview of Button */}
              <div className="pt-3">
                <span className="text-xs font-bold text-slate-500 block mb-2">
                  معاينة زر الشراء باللون المختار:
                </span>
                <button
                  type="button"
                  style={{ backgroundColor: buttonColor }}
                  className="w-full py-3.5 px-6 rounded-2xl text-white font-black text-base shadow-md transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>اشتري الان - تأكيد الطلب السريع ⚡</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Custom Main Images */}
        {activeSection === 'main_images' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  <span>إمكانية إضافة صور المنتج الرئيسية المخصصة</span>
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  أضف صورك الخاصة للمنتج (صور واقعية، تصوير كاميرا هاتف، فتح صندوق) لتظهر في واجهة المعرض الرئيسية أولاً.
                </p>
              </div>
            </div>

            {/* Existing custom images */}
            {customMainImages.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                  الصور المخصصة المضافة ({customMainImages.length}):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {customMainImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden aspect-square border border-slate-200 dark:border-slate-700 group bg-slate-100 dark:bg-slate-800"
                    >
                      <img src={img} alt="Custom product" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setCustomMainImages((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 transition cursor-pointer"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Image URL or Upload */}
            <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                + إضافة صورة رئيسية جديدة:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={newMainImageUrl}
                  onChange={(e) => setNewMainImageUrl(e.target.value)}
                  placeholder="رابط الصورة (URL) https://..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newMainImageUrl.trim()) {
                      setCustomMainImages((prev) => [...prev, newMainImageUrl.trim()]);
                      setNewMainImageUrl('');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                >
                  إضافة الرابط
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>أو رفع صورة من جهازك مباشرة:</span>
                <label className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع صورة من الجهاز</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileUpload(e, 'main')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 6. Custom Description Images */}
        {activeSection === 'desc_images' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h5 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-purple-600" />
                <span>إمكانية إضافة صور المنتج التي تظهر في الوصف</span>
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                أضف لافتات ورسومات بيانية توضيحية ومواصفات بصرية مخصصة تعرض داخل قسم الوصف التسويقي.
              </p>
            </div>

            {/* Existing custom description images */}
            {customDescriptionImages.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                  صور الوصف المضافة ({customDescriptionImages.length}):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {customDescriptionImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-700 group bg-slate-100 dark:bg-slate-800"
                    >
                      <img src={img} alt="Description banner" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setCustomDescriptionImages((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 transition cursor-pointer"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Image URL or Upload */}
            <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                + إضافة صورة جديدة للوصف:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={newDescImageUrl}
                  onChange={(e) => setNewDescImageUrl(e.target.value)}
                  placeholder="رابط صورة الوصف (URL) https://..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newDescImageUrl.trim()) {
                      setCustomDescriptionImages((prev) => [...prev, newDescImageUrl.trim()]);
                      setNewDescImageUrl('');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                >
                  إضافة
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>أو رفع صورة من جهازك:</span>
                <label className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع صورة توضيحية للوصف</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileUpload(e, 'desc')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 7. Custom Description */}
        {activeSection === 'description' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h5 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>إمكانية تغيير وتخصيص الوصف التسويقي للمنتج</span>
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  اكتب نسختك الإعلانية المقنعة (Copywriting) لإبراز مميزات المنتج وحل المشكلات بطريقتك الخاصة.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomDescription(product.descriptionAr || '')}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>نسخ وصف المخزن الأصلي لتعديله</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نص الوصف المخصص للمسوق:
              </label>
              <textarea
                rows={6}
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="اكتب وصفاً جذاباً، مميزات المنتج، طريقة الاستخدام، والضمانات..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium leading-relaxed outline-hidden focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                * في حال ترك هذه الخانة فارغة، سيتم عرض وصف المخزن الافتراضي تلقائياً.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons: Save & Preview */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {onPreview && (
          <button
            type="button"
            disabled={isSaving || isProcessingImage}
            onClick={async () => {
              await handleSaveAll();
              onPreview();
            }}
            className="px-4 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-60"
          >
            <Eye className="w-4 h-4" />
            <span>حفظ ومعاينة صفحة الطلب الحية 👁️</span>
          </button>
        )}

        <div className="flex items-center gap-2 mr-auto">
          {onClose && (
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition shadow-2xs disabled:opacity-50"
            >
              إلغاء
            </button>
          )}
          <button
            type="button"
            disabled={isSaving || isProcessingImage}
            onClick={handleSaveAll}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition shadow-md shadow-purple-600/25 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>جاري الحفظ والتحسين...</span>
              </>
            ) : isProcessingImage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>جاري معالجة الصور...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>حفظ التخصيصات لهذا الرابط ✔</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
