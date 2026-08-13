import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Sparkles, Maximize2, X, ZoomIn } from 'lucide-react';
import { downloadAllImages, downloadSingleImage } from '../../utils/imageDownloader';

interface ProductImageSliderProps {
  images: string[];
  alt: string;
  aspectRatio?: string;
  badge?: React.ReactNode;
  showDownloadBtn?: boolean;
  onShowToast?: (msg: string) => void;
  onImageChange?: (index: number) => void;
}

export function ProductImageSlider({
  images,
  alt,
  aspectRatio = 'aspect-4/3',
  badge,
  showDownloadBtn = true,
  onShowToast,
  onImageChange,
}: ProductImageSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  const safeImages = images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600'];

  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenOpen) {
        setIsFullscreenOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenOpen]);

  const handleDownloadAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    await downloadAllImages(safeImages, alt, onShowToast);
    setIsDownloading(false);
  };

  const handleDownloadCurrent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentUrl = safeImages[activeIndex];
    const cleanName = alt.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_').slice(0, 20) || 'product';
    const ext = currentUrl.includes('.png') ? 'png' : 'jpg';
    const filename = `${cleanName}_${activeIndex + 1}.${ext}`;
    
    if (onShowToast) onShowToast(`📥 جاري تحميل الصورة رقم ${activeIndex + 1}...`);
    await downloadSingleImage(currentUrl, filename);
    if (onShowToast) onShowToast(`✔ تم تحميل الصورة بنجاح`);
  };

  // Handle scroll snap index detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const width = container.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(container.scrollLeft / width);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < safeImages.length) {
        setActiveIndex(newIndex);
        if (onImageChange) onImageChange(newIndex);
      }
    }
  };

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const width = container.clientWidth;
    container.scrollTo({
      left: index * width,
      behavior: 'smooth',
    });
    setActiveIndex(index);
    if (onImageChange) onImageChange(index);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex > 0) {
      scrollToIndex(activeIndex - 1);
    } else {
      scrollToIndex(safeImages.length - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex < safeImages.length - 1) {
      scrollToIndex(activeIndex + 1);
    } else {
      scrollToIndex(0);
    }
  };

  // Mouse Drag to Scroll handlers for smooth desktop swiping
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftStart.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  return (
    <div className="space-y-2 w-full">
      {/* Top Bar for Seller with Download All button above images */}
      {showDownloadBtn && (
        <div className="flex items-center justify-between gap-2 px-1 py-0.5">
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>معرض الصور للتسويق ({safeImages.length})</span>
          </span>
          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={isDownloading}
            title="تحميل كافة صور المنتج بجودة عالية للتسويق"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition transform active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'جاري التحميل...' : 'تحميل جميع الصور'}</span>
          </button>
        </div>
      )}

      {/* Main Image Slider */}
      <div className={`relative w-full ${aspectRatio} bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden group border border-slate-200 dark:border-slate-700/80 shadow-xs select-none`}>
        {/* Custom Optional Badge */}
        {badge && <div className="absolute top-3 right-3 z-10">{badge}</div>}

        {/* Counter Pill & Fullscreen Zoom Icon */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          {safeImages.length > 1 && (
            <div className="bg-slate-900/70 backdrop-blur-md text-white font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-full border border-white/20">
              {activeIndex + 1} / {safeImages.length}
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsFullscreenOpen(true)}
            aria-label="عرض الصورة بحجم كامل"
            className="p-1.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md transition shadow-md cursor-pointer border border-white/20"
            title="انقر لعرض الصورة بالحجم الكامل والتحميل"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Swipable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth cursor-pointer touch-pan-x"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {safeImages.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setIsFullscreenOpen(true)}
              className="w-full h-full shrink-0 snap-center relative flex items-center justify-center bg-slate-100 dark:bg-slate-800 group/item"
            >
              <img
                src={img}
                alt={`${alt} - ${idx + 1}`}
                className="w-full h-full object-cover pointer-events-none"
                referrerPolicy="no-referrer"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/item:opacity-100 transition flex items-center justify-center pointer-events-none">
                <span className="bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <ZoomIn className="w-4 h-4 text-emerald-400" />
                  <span>انقر للتكبير والتحميل</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Chevrons */}
        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="الصورة السابقة"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition opacity-90 sm:opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="الصورة التالية"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition opacity-90 sm:opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots indicator at bottom center */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-2.5 inset-x-0 z-10 flex justify-center items-center gap-1.5 pointer-events-none">
            {safeImages.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex === idx
                    ? 'w-6 bg-emerald-500 shadow-sm'
                    : 'w-1.5 bg-white/60 dark:bg-slate-400/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails Strip */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToIndex(idx)}
              className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                activeIndex === idx
                  ? 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20 scale-105'
                  : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreenOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-fadeIn"
          onClick={() => setIsFullscreenOpen(false)}
        >
          {/* Top Bar inside Lightbox */}
          <div
            className="flex items-center justify-between gap-3 text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base line-clamp-1">{alt}</span>
              <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                {activeIndex + 1} / {safeImages.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Download buttons only if showDownloadBtn is true */}
              {showDownloadBtn && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadCurrent}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer"
                    title="تحميل هذه الصورة بالحجم الكامل"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">تحميل هذه الصورة</span>
                    <span className="sm:hidden">تحميل</span>
                  </button>

                  {safeImages.length > 1 && (
                    <button
                      type="button"
                      onClick={handleDownloadAll}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
                      title="تحميل جميع الصور"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">تحميل الكل ({safeImages.length})</span>
                    </button>
                  )}
                </>
              )}

              {/* Close X */}
              <button
                type="button"
                onClick={() => setIsFullscreenOpen(false)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
                aria-label="إغلاق العرض الكامل"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Fullsize Image Area */}
          <div
            className="flex-1 relative flex items-center justify-center my-3 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={safeImages[activeIndex]}
              alt={`${alt} full`}
              className="max-h-[78vh] max-w-[95vw] object-contain rounded-xl shadow-2xl transition-all duration-300"
              referrerPolicy="no-referrer"
            />

            {/* Navigation Chevrons inside Lightbox */}
            {safeImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1));
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md transition shadow-xl border border-white/10 cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md transition shadow-xl border border-white/10 cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Thumbnails Footer */}
          {safeImages.length > 1 && (
            <div
              className="flex justify-center gap-2 overflow-x-auto py-2 scrollbar-none z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {safeImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                    activeIndex === idx
                      ? 'border-emerald-400 ring-2 ring-emerald-500/40 scale-105 opacity-100'
                      : 'border-slate-800 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

