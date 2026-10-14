import React, { useState } from 'react';
import { Video, Star, ShieldCheck, ExternalLink, Phone } from 'lucide-react';
import { MarketerReview } from '../../types';

/**
 * Authentic WhatsApp vector icon matching official brand logo
 */
export function WhatsAppIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.53 11.23c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43l-.48-.01c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08s.89 2.41 1.02 2.58c.12.17 1.76 2.68 4.25 3.76.59.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29" />
    </svg>
  );
}

export function getEmbedVideoInfo(rawUrl: string): {
  type: 'youtube' | 'instagram' | 'tiktok' | 'direct' | 'link';
  embedUrl: string;
} {
  if (!rawUrl) return { type: 'link', embedUrl: '' };
  const trimmed = rawUrl.trim();

  // YouTube Shorts
  const ytShortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (ytShortsMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytShortsMatch[1]}?autoplay=0&rel=0`,
    };
  }

  // YouTube Regular watch / youtu.be
  const ytWatchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytWatchMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytWatchMatch[1]}?autoplay=0&rel=0`,
    };
  }

  // Instagram Reels / Posts
  const igMatch = trimmed.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
  if (igMatch) {
    return {
      type: 'instagram',
      embedUrl: `https://www.instagram.com/reel/${igMatch[1]}/embed/`,
    };
  }

  // TikTok
  const ttMatch = trimmed.match(/tiktok\.com\/@[^/]+\/video\/([0-9]+)/);
  if (ttMatch) {
    return {
      type: 'tiktok',
      embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`,
    };
  }

  // Direct video file (mp4, webm, mov, ogg)
  if (trimmed.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || trimmed.startsWith('data:video/')) {
    return { type: 'direct', embedUrl: trimmed };
  }

  return { type: 'link', embedUrl: trimmed };
}

/**
 * 1. Video UGC / Reels Embed Player
 */
export function VideoEmbedPlayer({
  url,
  title,
}: {
  url: string;
  title?: string;
}) {
  const info = getEmbedVideoInfo(url);

  if (!url || !url.trim()) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              {title || 'شاهد مراجعة وتجربة حقيقية للمنتج 🎥'}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              فيديو تجربة عملية (UGC Video)
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-black flex items-center gap-1 border border-rose-200 dark:border-rose-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span>فيديو حصري</span>
        </span>
      </div>

      {/* Embed Container */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 shadow-inner flex items-center justify-center">
        {info.type === 'youtube' && (
          <div className="w-full aspect-9/16 sm:aspect-video max-h-[460px]">
            <iframe
              src={info.embedUrl}
              title="YouTube Product Review"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {info.type === 'instagram' && (
          <div className="w-full min-h-[420px] max-h-[500px]">
            <iframe
              src={info.embedUrl}
              title="Instagram Reel Review"
              className="w-full h-[480px] border-0"
              allowFullScreen
            />
          </div>
        )}

        {info.type === 'tiktok' && (
          <div className="w-full min-h-[460px]">
            <iframe
              src={info.embedUrl}
              title="TikTok Video Review"
              className="w-full h-[480px] border-0"
              allowFullScreen
            />
          </div>
        )}

        {info.type === 'direct' && (
          <video
            src={info.embedUrl}
            controls
            playsInline
            className="w-full max-h-[450px] object-contain rounded-2xl"
          />
        )}

        {info.type === 'link' && (
          <div className="p-8 text-center space-y-3">
            <Video className="w-12 h-12 text-purple-400 mx-auto" />
            <p className="text-xs text-white font-bold">
              شاهد مراجعة واستعراض المنتج عبر الرابط الخارجي
            </p>
            <a
              href={info.embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
            >
              <span>فتح الفيديو الآن</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 2. Customer Reviews & Social Proof Section
 */
export function CustomerReviewsSection({
  reviews,
}: {
  reviews: MarketerReview[];
}) {
  const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);

  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>آراء وتجارب الزبائن الموثقة</span>
              <span className="text-amber-500">⭐</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">
              تقييم 5.0 من 5 استناداً لآراء مشترين حقيقيين
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-[10px] font-black flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>مشترين موثقين 100%</span>
        </span>
      </div>

      {/* Reviews Cards */}
      <div className="space-y-3">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-xs">
                  {rev.name.charAt(0)}
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                    {rev.name}
                  </span>
                  {rev.city && (
                    <span className="text-[10px] text-slate-400 font-medium">{rev.city}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {[...Array(rev.rating || 5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              &quot;{rev.comment}&quot;
            </p>

            {rev.image && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedProofImg(rev.image!)}
                  className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 w-16 h-16 sm:w-20 sm:h-20 group cursor-pointer block"
                  title="انقر لتكبير صورة تجربة الزبون"
                >
                  <img
                    src={rev.image}
                    alt="Customer proof"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <span className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[9px] text-white font-black">
                    تكبير 🔍
                  </span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal for Review Photo */}
      {selectedProofImg && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedProofImg(null)}
        >
          <div
            className="relative max-w-sm max-h-[85vh] rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedProofImg}
              alt="Proof full"
              className="max-w-full max-h-[75vh] object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setSelectedProofImg(null)}
              className="mt-2 w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 3. Direct Floating WhatsApp Contact Button
 */
export function FloatingWhatsAppButton({
  phone,
  message,
  productName,
}: {
  phone?: string;
  message?: string;
  productName: string;
}) {
  if (!phone) return null;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return null;

  const finalPhone = cleanPhone.startsWith('0') ? '213' + cleanPhone.slice(1) : cleanPhone;
  const defaultMsg = message || `مرحباً، أود الاستفسار بخصوص منتج ${productName}`;
  const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(defaultMsg)}`;

  return (
    <div className="fixed bottom-22 sm:bottom-24 left-3.5 sm:left-6 z-40 flex items-center gap-2 group animate-fade-in">
      {/* Tooltip bubble on desktop */}
      <span className="hidden sm:inline-block px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-[11px] font-bold shadow-lg backdrop-blur-xs border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        تواصل معنا عبر واتساب 💬
      </span>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        title="تواصل مباشر عبر واتساب"
      >
        <WhatsAppIcon className="w-7 h-7 sm:w-8 sm:h-8 fill-current text-white relative z-10" />
      </a>
    </div>
  );
}
