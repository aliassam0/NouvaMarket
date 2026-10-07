import React, { useEffect } from 'react';

export interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  ogImageAlt?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_TITLE = 'نوفا ماركت | Nouva Market - أول منصة للتسويق بالعمولة والدروبشيبينغ في الجزائر';
const DEFAULT_DESCRIPTION = 'انضم إلى نوفا ماركت (Nouva Market)، المنصة رقم #1 للتسويق بالعمولة والتجارة الإلكترونية في الجزائر. آلاف المنتجات بأسعار الجملة، تأكيد هاتفي احترافي، شحن لـ 58 ولاية، ودفع فوري للأرباح عبر CCP و BaridiMob.';
const DEFAULT_KEYWORDS = 'نوفا ماركت, Nouva Market, التسويق بالعمولة في الجزائر, دروبشيبينغ الجزائر, الربح من الانترنت بالجزائر, التجارة الالكترونية الجزائر, منتجات الجملة الجزائر, الدفع عند الاستلام COD الجزائر, بريدي موب BaridiMob, ccp الجزائر, موردين الجزائر';
const DEFAULT_OG_IMAGE = 'https://nouvamarket.com/og-image.png';
const SITE_URL = 'https://nouvamarket.com';

export function SeoHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt = 'Nouva Market - منصة التسويق بالعمولة في الجزائر',
  noIndex = false,
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    // 1. Title
    const fullTitle = title ? (title.includes('Nouva Market') || title.includes('نوفا ماركت') ? title : `${title} | نوفا ماركت Nouva Market`) : DEFAULT_TITLE;
    document.title = fullTitle;

    // Helper to set or create a meta tag
    const setMeta = (attrName: 'name' | 'property', attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Primary Meta Tags
    setMeta('name', 'description', description);
    setMeta('name', 'keywords', keywords);
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMeta('name', 'googlebot', noIndex ? 'noindex, nofollow' : 'index, follow');

    // 3. Canonical Link
    const currentCanonical = canonical || (typeof window !== 'undefined' ? `${SITE_URL}${window.location.pathname}` : SITE_URL);
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', currentCanonical);

    // 4. OpenGraph Tags
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', currentCanonical);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:image:alt', ogImageAlt);
    setMeta('property', 'og:site_name', 'نوفا ماركت Nouva Market');
    setMeta('property', 'og:locale', 'ar_DZ');

    // 5. Twitter Card Tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);

    // 6. Structured Data (JSON-LD)
    const scriptId = 'dynamic-jsonld-seo';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    } else if (scriptEl) {
      scriptEl.remove();
    }
  }, [title, description, keywords, canonical, ogType, ogImage, ogImageAlt, noIndex, jsonLd]);

  return null;
}
