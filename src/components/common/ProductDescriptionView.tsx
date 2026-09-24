import React, { useState } from 'react';
import { Sparkles, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DescriptionImageItem } from '../../types';

interface ProductDescriptionViewProps {
  description: string;
  descriptionImages?: (string | DescriptionImageItem)[];
  productName?: string;
  className?: string;
  isLandingPage?: boolean;
  hideImageHeader?: boolean;
  clickable?: boolean;
}

interface NormalizedImageItem {
  url: string;
  title: string;
}

export function ProductDescriptionView({
  description,
  descriptionImages = [],
  productName = '',
  className = '',
  isLandingPage = false,
  hideImageHeader = false,
  clickable = true,
}: ProductDescriptionViewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

  // Normalize description images to support both legacy string[] and { url, title }[]
  const normalizedImages: NormalizedImageItem[] = (descriptionImages || [])
    .map((item) => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        return trimmed ? { url: trimmed, title: '' } : null;
      }
      if (item && typeof item === 'object' && typeof item.url === 'string' && item.url.trim()) {
        return { url: item.url.trim(), title: (item.title || '').trim() };
      }
      return null;
    })
    .filter((x): x is NormalizedImageItem => x !== null);

  const images = normalizedImages.map((img) => img.url);

  const handleOpenLightbox = (imgUrl: string, idx: number) => {
    setSelectedImage(imgUrl);
    setActiveImageIdx(idx);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (activeImageIdx + 1) % images.length;
    setActiveImageIdx(nextIdx);
    setSelectedImage(images[nextIdx]);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIdx = (activeImageIdx - 1 + images.length) % images.length;
    setActiveImageIdx(prevIdx);
    setSelectedImage(images[prevIdx]);
  };

  // Helper to format persuasive description lines with doubled size for landing page
  const renderFormattedDescription = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className={isLandingPage ? 'h-3 sm:h-4' : 'h-2'} />;
      }

      // Check if line is a prominent callout, feature, or header
      const isCallout =
        trimmed.startsWith('✨') ||
        trimmed.startsWith('🌸') ||
        trimmed.startsWith('🎀') ||
        trimmed.startsWith('💎') ||
        trimmed.startsWith('📦') ||
        trimmed.startsWith('🚚') ||
        trimmed.startsWith('📩') ||
        trimmed.startsWith('🌷') ||
        trimmed.startsWith('⭐') ||
        trimmed.startsWith('🔥') ||
        trimmed.startsWith('✅') ||
        trimmed.startsWith('🏷️') ||
        trimmed.startsWith('⚡');

      const isHeading =
        trimmed.endsWith(':') ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('مميزات') ||
        trimmed.startsWith('مواصفات');

      if (isCallout) {
        return (
          <div
            key={idx}
            className={`flex items-start gap-3 py-1 ${
              isLandingPage ? 'my-1 sm:my-1.5' : ''
            }`}
          >
            <span
              className={`${
                isLandingPage ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'
              } shrink-0 select-none pt-0.5`}
            >
              {trimmed.slice(0, 2)}
            </span>
            <span
              className={`${
                isLandingPage
                  ? 'text-base sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed'
                  : 'text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed'
              }`}
            >
              {trimmed.slice(2).trim()}
            </span>
          </div>
        );
      }

      if (isHeading) {
        return (
          <h4
            key={idx}
            className={`${
              isLandingPage
                ? 'text-lg sm:text-2xl font-black text-purple-700 dark:text-purple-400 mt-3 mb-1.5 leading-snug'
                : 'text-sm font-black text-purple-600 dark:text-purple-400 mt-2 mb-1'
            }`}
          >
            {trimmed.replace(/^#+\s*/, '')}
          </h4>
        );
      }

      return (
        <p
          key={idx}
          className={`${
            isLandingPage
              ? 'text-base sm:text-xl text-slate-800 dark:text-slate-100 leading-relaxed sm:leading-loose font-bold'
              : 'text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium'
          }`}
        >
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className={`space-y-5 sm:space-y-6 ${className}`}>
      {/* 1. Formatted Description Text Block with Doubled Font Size for Landing Page */}
      {description && (
        <div
          className={`rounded-3xl border transition ${
            isLandingPage
              ? 'bg-gradient-to-b from-purple-50/80 via-white to-purple-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-purple-950/20 border-2 border-purple-200/90 dark:border-purple-800/60 p-4 sm:p-6 shadow-sm'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 p-4 shadow-xs'
          }`}
        >
          <div
            className={`text-start ${
              isLandingPage ? 'space-y-2 sm:space-y-3' : 'space-y-1'
            }`}
          >
            {renderFormattedDescription(description)}
          </div>
        </div>
      )}

      {/* 2. Visual Description Landing Page Images with Titles & Spacing (Mobile-first High-Converting Layout) */}
      {normalizedImages.length > 0 && (
        <div className="space-y-6 sm:space-y-8">
          {!hideImageHeader && (
            <div className="flex items-center justify-between px-1">
              <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>
                  {isLandingPage
                    ? 'تفاصيل ومميزات المنتج بالصور:'
                    : 'صور توضيحية ومواصفات بالصور:'}
                </span>
              </h5>
              <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                {normalizedImages.length} {normalizedImages.length === 1 ? 'صورة' : 'صور'}
              </span>
            </div>
          )}

          {/* Render Each Image Block with its Title and Dedicated Spacing */}
          {normalizedImages.map((item, idx) => (
            <div key={idx} className="space-y-2.5 sm:space-y-3.5">
              {/* Image Title / Headline with Generous Spacing Before the Image */}
              {item.title && item.title.trim().length > 0 && (
                <div className="px-1 text-start">
                  <h4
                    className={`${
                      isLandingPage
                        ? 'text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight'
                        : 'text-sm sm:text-base font-extrabold text-slate-900 dark:text-white'
                    } flex items-center gap-2.5 leading-snug`}
                  >
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0 shadow-xs" />
                    <span>{item.title}</span>
                  </h4>
                </div>
              )}

              {/* Responsive Full-Height Image Container */}
              <div
                onClick={clickable ? () => handleOpenLightbox(item.url, idx) : undefined}
                className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900 shadow-xs ${
                  clickable
                    ? 'group cursor-pointer hover:shadow-md transition duration-200'
                    : 'cursor-default select-none'
                }`}
              >
                <img
                  src={item.url}
                  alt={
                    item.title ||
                    (productName
                      ? `${productName} - صورة ${idx + 1}`
                      : `تفاصيل المنتج ${idx + 1}`)
                  }
                  className={`w-full h-auto block object-contain select-none ${
                    !clickable ? 'pointer-events-none' : ''
                  }`}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  draggable={false}
                />

                {normalizedImages.length > 1 && (
                  <div className="absolute top-2.5 end-2.5 z-10">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs select-none">
                      {idx + 1} / {normalizedImages.length}
                    </span>
                  </div>
                )}

                {clickable && (
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center pointer-events-none">
                    <span className="p-2.5 rounded-xl bg-slate-900/75 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>انقر للتكبير والتفاصيل الكاملة</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Lightbox Modal for high-res preview on tap (Supports very tall images with smooth scrolling) */}
      {clickable && selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-60 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full max-h-[92vh] flex flex-col items-center"
          >
            {/* Top Bar with Info & Close Button */}
            <div className="w-full flex items-center justify-between pb-2.5 px-1 text-white">
              <span className="text-xs font-bold text-slate-300">
                {images.length > 1
                  ? `صورة ${activeImageIdx + 1} من ${images.length}`
                  : 'معاينة تفاصيل المنتج'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Container for Long/Tall Infographic Images */}
            <div className="relative w-full overflow-y-auto max-h-[82vh] rounded-2xl bg-black/60 border border-white/10 overscroll-contain shadow-2xl">
              <img
                src={selectedImage}
                alt="تفاصيل المنتج كاملة"
                className="w-full h-auto block object-contain select-none"
                referrerPolicy="no-referrer"
              />

              {images.length > 1 && (
                <div className="sticky bottom-4 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="pointer-events-auto p-2.5 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white backdrop-blur-xs transition cursor-pointer shadow-lg"
                    title="السابق"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="pointer-events-auto p-2.5 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white backdrop-blur-xs transition cursor-pointer shadow-lg"
                    title="التالي"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex items-center gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveImageIdx(i);
                      setSelectedImage(images[i]);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      activeImageIdx === i ? 'w-6 bg-purple-500' : 'w-2 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
