import React, { useState } from 'react';
import { Download, Copy, Check, Eye, Share2, Sparkles, Globe, ShieldCheck, TrendingUp, BarChart3, ExternalLink } from 'lucide-react';

interface SocialMediaBannerCardProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function SocialMediaBannerCard({ onShowToast }: SocialMediaBannerCardProps) {
  const [copiedMeta, setCopiedMeta] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activePreviewMode, setActivePreviewMode] = useState<'rendered' | 'meta'>('rendered');

  const ogImageUrl = `${window.location.origin}/og-image.png`;
  const bannerImageUrl = `${window.location.origin}/social-banner.png`;
  const svgImageUrl = `${window.location.origin}/og-image.svg`;

  const metaTagsCode = `<!-- Open Graph / Facebook / WhatsApp -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://nouvamarket.com/" />
<meta property="og:title" content="Nouva Market - منصة التسويق بالعمولة الأولى في الجزائر" />
<meta property="og:description" content="اكبر منصة للتسويق بالعمولة في الجزائر، حقق أرباحك يومياً مع نوفا ماركت" />
<meta property="og:image" content="https://nouvamarket.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="675" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Nouva Market - منصة التسويق بالعمولة الأولى في الجزائر" />
<meta name="twitter:description" content="اكبر منصة للتسويق بالعمولة في الجزائر" />
<meta name="twitter:image" content="https://nouvamarket.com/og-image.png" />`;

  const handleCopyMeta = () => {
    navigator.clipboard.writeText(metaTagsCode);
    setCopiedMeta(true);
    onShowToast('✔ تم نسخ وسوم Open Graph و Twitter للـ SEO بنجاح!', 'success');
    setTimeout(() => setCopiedMeta(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(ogImageUrl);
    setCopiedLink(true);
    onShowToast('✔ تم نسخ رابط الصورة المباشر للشبكات الاجتماعية!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              🖼️
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              صورة المعاينة لوسائل التواصل ومحركات البحث (Social Graph & SEO Banner)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تصميم مخصص بمقاس 16:9 وبدقة عالية للمشاركة عبر فيسبوك، واتساب، وتويتر ومطابق لمعايير Open Graph
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActivePreviewMode('rendered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activePreviewMode === 'rendered'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>معاينة التصميم</span>
          </button>
          <button
            onClick={() => setActivePreviewMode('meta')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activePreviewMode === 'meta'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>أكواد SEO</span>
          </button>
        </div>
      </div>

      {activePreviewMode === 'rendered' ? (
        <div className="space-y-4">
          {/* Banner Graphic Container (16:9 Aspect Ratio) */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-purple-200/60 dark:border-purple-900/50 shadow-md group">
            {/* Display the high-res generated vector SVG / PNG */}
            <img
              src="/og-image.png"
              alt="Nouva Market Social Graph & SEO Banner"
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />

            {/* Subtle Overlay on hover with quick action */}
            <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="px-4 py-2 rounded-2xl bg-white/95 text-slate-900 text-xs font-black shadow-lg backdrop-blur-xs flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <span>دقة فائقة 1200 × 675 (16:9)</span>
              </span>
            </div>
          </div>

          {/* Social Platforms Preview Badges */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="font-bold">المظهر عند المشاركة في:</span>
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">Facebook</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">WhatsApp</span>
              <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium">Twitter (X)</span>
              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">LinkedIn</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">1200 × 675 px • 16:9 Ratio</span>
          </div>

          {/* Action Buttons: Download & Copy */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Download OG PNG */}
            <a
              href="/og-image.png"
              download="nouva-market-og-image.png"
              className="px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition"
            >
              <Download className="w-4 h-4" />
              <span>تحميل PNG (1200×675)</span>
            </a>

            {/* Download Full HD Banner */}
            <a
              href="/social-banner.png"
              download="nouva-market-banner-1080p.png"
              className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center justify-center gap-2 transition border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-4 h-4 text-purple-500" />
              <span>تحميل Full HD (1920×1080)</span>
            </a>

            {/* Download SVG Vector */}
            <a
              href="/og-image.svg"
              download="nouva-market-banner.svg"
              className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center justify-center gap-2 transition border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-4 h-4 text-emerald-500" />
              <span>تحميل فكتور أصلي (SVG)</span>
            </a>
          </div>

          {/* Direct Link Copy */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopyLink}
              className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition border border-purple-200/80 dark:border-purple-800/60"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>نسخ الرابط المباشر للصورة (/og-image.png)</span>
            </button>
          </div>
        </div>
      ) : (
        /* SEO / Meta Code View */
        <div className="space-y-3">
          <div className="p-3.5 bg-slate-950 text-slate-200 rounded-2xl font-mono text-xs overflow-x-auto relative border border-slate-800">
            <pre className="whitespace-pre">{metaTagsCode}</pre>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تم تضمين هذه الوسوم مسبقاً في ملف <code className="text-purple-500 font-mono">index.html</code> للمنصة.
            </p>
            <button
              onClick={handleCopyMeta}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              {copiedMeta ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>نسخ أكواد Meta</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
