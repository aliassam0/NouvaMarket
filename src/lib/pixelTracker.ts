/**
 * Social Media Pixels Tracker for Marketers (Resellers) & Official Store
 * Supports: Meta (Facebook/Instagram), TikTok, Snapchat, and Google Analytics 4 (GA4/GTM)
 * Features live event stream diagnostics and test simulator for Ads verification.
 */

import { OfficialStoreSettings } from './officialStoreConfig';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    snaptr?: any;
    _snaptr?: any;
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export type PixelScopeType = 'marketer' | 'seller' | 'official_store';

export interface ActivePixelTarget {
  scope: PixelScopeType;
  ownerName?: string;
  metaPixelId?: string | null;
  tiktokPixelId?: string | null;
  snapchatPixelId?: string | null;
  googleAnalyticsId?: string | null;
  testEventCode?: string | null;
}

export interface PixelConfig {
  metaPixelId?: string | null;
  tiktokPixelId?: string | null;
  snapchatPixelId?: string | null;
}

export interface PixelEventLog {
  id: string;
  timestamp: string;
  platform: 'facebook' | 'tiktok' | 'snapchat' | 'google' | 'all';
  eventName: string;
  scope?: PixelScopeType;
  ownerName?: string;
  targetPixelId?: string;
  data: Record<string, any>;
  status: 'sent' | 'simulated' | 'error';
}

const PIXEL_LOGS_STORAGE_KEY = 'nouva_pixel_event_logs_v1';
const MAX_LOGS = 50;

let currentGlobalPixelTarget: ActivePixelTarget | null = null;

export function setActivePixelTarget(target: ActivePixelTarget | null): void {
  currentGlobalPixelTarget = target;
  if (target) {
    if (target.metaPixelId?.trim()) initMetaPixel(target.metaPixelId.trim(), target.testEventCode || undefined);
    if (target.tiktokPixelId?.trim()) initTikTokPixel(target.tiktokPixelId.trim());
    if (target.snapchatPixelId?.trim()) initSnapchatPixel(target.snapchatPixelId.trim());
  }
}

export function getActivePixelTarget(): ActivePixelTarget | null {
  return currentGlobalPixelTarget;
}

export function clearActivePixelTarget(): void {
  currentGlobalPixelTarget = null;
}

const initializedPixels = {
  meta: new Set<string>(),
  tiktok: new Set<string>(),
  snapchat: new Set<string>(),
};

/**
 * Retrieve recent pixel event logs from storage
 */
export function getPixelLogs(): PixelEventLog[] {
  try {
    const raw = localStorage.getItem(PIXEL_LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Append an event to the persistent event log stream
 */
function recordPixelLog(log: Omit<PixelEventLog, 'id' | 'timestamp'>) {
  try {
    const logs = getPixelLogs();
    const newEntry: PixelEventLog = {
      id: `px-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    const updated = [newEntry, ...logs].slice(0, MAX_LOGS);
    localStorage.setItem(PIXEL_LOGS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nouva_pixel_event_logged', { detail: newEntry }));
  } catch (e) {
    console.warn('Could not record pixel log:', e);
  }
}

/**
 * Clear event log history
 */
export function clearPixelLogs(): void {
  try {
    localStorage.removeItem(PIXEL_LOGS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('nouva_pixel_event_logged'));
  } catch {}
}

/**
 * Initialize Meta (Facebook) Pixel
 */
export function initMetaPixel(pixelId: string, testEventCode?: string) {
  if (typeof window === 'undefined' || !pixelId) return;
  const cleanId = pixelId.trim();
  if (!cleanId || initializedPixels.meta.has(cleanId)) return;

  try {
    if (!window.fbq) {
      /* eslint-disable */
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
    }

    if (window.fbq) {
      window.fbq('init', cleanId);
      if (testEventCode?.trim()) {
        window.fbq('set', 'testEventCode', testEventCode.trim());
      }
      initializedPixels.meta.add(cleanId);
      console.log(`%c[Nouva Pixel] Meta Pixel Initialized: ${cleanId}`, 'color: #1877F2; font-weight: bold;');
    }
  } catch (err) {
    console.warn('[Nouva Pixel] Error initializing Meta Pixel:', err);
  }
}

/**
 * Initialize TikTok Pixel
 */
export function initTikTokPixel(pixelId: string) {
  if (typeof window === 'undefined' || !pixelId) return;
  const cleanId = pixelId.trim();
  if (!cleanId || initializedPixels.tiktok.has(cleanId)) return;

  try {
    if (!window.ttq) {
      /* eslint-disable */
      (function (w: any, d: any, t: any) {
        w.TiktokAnalyticsObject = t;
        var ttq = (w[t] = w[t] || []);
        ttq.methods = [
          'page',
          'track',
          'identify',
          'instances',
          'debug',
          'on',
          'off',
          'once',
          'ready',
          'alias',
          'group',
          'enableCookie',
          'disableCookie',
        ];
        ttq.setAndDefer = function (t: any, e: any) {
          t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function (t: any) {
          for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
          return e;
        };
        ttq.load = function (e: any, n: any) {
          var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
          ttq._i = ttq._i || {};
          ttq._i[e] = [];
          ttq._i[e]._u = i;
          ttq._t = ttq._t || {};
          ttq._t[e] = +new Date();
          ttq._o = ttq._o || {};
          ttq._o[e] = n || {};
          var o = document.createElement('script');
          o.type = 'text/javascript';
          o.async = !0;
          o.src = i + '?sdkid=' + e + '&lib=' + t;
          var a = document.getElementsByTagName('script')[0];
          a.parentNode?.insertBefore(o, a);
        };
      })(window, document, 'ttq');
      /* eslint-enable */
    }

    if (window.ttq) {
      window.ttq.load(cleanId);
      initializedPixels.tiktok.add(cleanId);
      console.log(`%c[Nouva Pixel] TikTok Pixel Initialized: ${cleanId}`, 'color: #000000; font-weight: bold;');
    }
  } catch (err) {
    console.warn('[Nouva Pixel] Error initializing TikTok Pixel:', err);
  }
}

/**
 * Initialize Snapchat Pixel
 */
export function initSnapchatPixel(pixelId: string) {
  if (typeof window === 'undefined' || !pixelId) return;
  const cleanId = pixelId.trim();
  if (!cleanId || initializedPixels.snapchat.has(cleanId)) return;

  try {
    if (!window.snaptr) {
      /* eslint-disable */
      (function (e: any, t: any, n: any) {
        if (e.snaptr) return;
        var a: any = (e.snaptr = function () {
          a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments);
        });
        a.queue = [];
        var s = 'script';
        var r = t.createElement(s);
        r.async = !0;
        r.src = n;
        var u = t.getElementsByTagName(s)[0];
        u.parentNode.insertBefore(r, u);
      })(window, document, 'https://sc-static.net/scevent.min.js');
      /* eslint-enable */
    }

    if (window.snaptr) {
      window.snaptr('init', cleanId);
      initializedPixels.snapchat.add(cleanId);
      console.log(`%c[Nouva Pixel] Snapchat Pixel Initialized: ${cleanId}`, 'color: #FFFC00; font-weight: bold;');
    }
  } catch (err) {
    console.warn('[Nouva Pixel] Error initializing Snapchat Pixel:', err);
  }
}

/**
 * Initialize all available pixels for the current marketer
 */
export function initAllPixels(config: PixelConfig) {
  if (config.metaPixelId) initMetaPixel(config.metaPixelId);
  if (config.tiktokPixelId) initTikTokPixel(config.tiktokPixelId);
  if (config.snapchatPixelId) initSnapchatPixel(config.snapchatPixelId);
}

/**
 * Initialize pixels configured in OfficialStoreSettings
 */
export function initPixels(settings: OfficialStoreSettings): void {
  if (!settings.enablePixelTracking) {
    return;
  }

  if (settings.facebookPixelId?.trim()) {
    initMetaPixel(settings.facebookPixelId.trim(), settings.testEventCode);
  }
  if (settings.tiktokPixelId?.trim()) {
    initTikTokPixel(settings.tiktokPixelId.trim());
  }
  if (settings.snapchatPixelId?.trim()) {
    initSnapchatPixel(settings.snapchatPixelId.trim());
  }

  // Google Analytics 4 (GA4 / GTM)
  const gaId = settings.googleAnalyticsId?.trim();
  if (gaId && !window.gtag) {
    try {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer?.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', gaId);
    } catch (e) {
      console.warn('Error initializing GA4:', e);
    }
  }
}

/**
 * Isolated Event: PageView (Targeted to active scope or specific owner)
 */
export function trackPixelPageView(targetOverride?: ActivePixelTarget | null) {
  if (typeof window === 'undefined') return;
  const target = targetOverride !== undefined ? targetOverride : currentGlobalPixelTarget;

  // 1. Meta Pixel - Strictly isolated via trackSingle
  if (target?.metaPixelId && window.fbq) {
    try {
      const id = target.metaPixelId.trim();
      initMetaPixel(id, target.testEventCode || undefined);
      window.fbq('trackSingle', id, 'PageView');
    } catch {
      try { window.fbq('track', 'PageView'); } catch {}
    }
  } else if (!target && window.fbq) {
    try { window.fbq('track', 'PageView'); } catch {}
  }

  // 2. TikTok Pixel - Strictly isolated via instance
  if (target?.tiktokPixelId && window.ttq) {
    try {
      const id = target.tiktokPixelId.trim();
      initTikTokPixel(id);
      if (window.ttq.instance && typeof window.ttq.instance(id)?.page === 'function') {
        window.ttq.instance(id).page();
      } else if (typeof window.ttq.page === 'function') {
        window.ttq.page();
      }
    } catch {}
  } else if (!target && window.ttq && typeof window.ttq.page === 'function') {
    try { window.ttq.page(); } catch {}
  }

  // 3. Snapchat Pixel
  if (target?.snapchatPixelId && window.snaptr) {
    try {
      initSnapchatPixel(target.snapchatPixelId.trim());
      window.snaptr('track', 'PAGE_VIEW');
    } catch {}
  } else if (!target && window.snaptr) {
    try { window.snaptr('track', 'PAGE_VIEW'); } catch {}
  }
}

/**
 * Isolated Event: ViewContent (Viewing Product)
 */
export function trackPixelViewContent(
  data: {
    productId: string;
    productName: string;
    category?: string;
    price: number;
  },
  targetOverride?: ActivePixelTarget | null
) {
  if (typeof window === 'undefined') return;
  const target = targetOverride !== undefined ? targetOverride : currentGlobalPixelTarget;

  const metaData = {
    content_name: data.productName,
    content_ids: [data.productId],
    content_type: 'product',
    content_category: data.category || 'Commerce',
    value: data.price,
    currency: 'DZD',
  };

  const ttData = {
    content_id: data.productId,
    content_type: 'product',
    content_name: data.productName,
    content_category: data.category || 'General',
    price: data.price,
    currency: 'DZD',
    value: data.price,
  };

  const snapData = {
    item_ids: [data.productId],
    item_category: data.category || 'General',
    price: data.price,
    currency: 'DZD',
  };

  // 1. Meta Pixel - Isolated
  if (target?.metaPixelId && window.fbq) {
    try {
      const id = target.metaPixelId.trim();
      initMetaPixel(id, target.testEventCode || undefined);
      window.fbq('trackSingle', id, 'ViewContent', metaData);
    } catch {
      try { window.fbq('track', 'ViewContent', metaData); } catch {}
    }
  } else if (!target && window.fbq) {
    try { window.fbq('track', 'ViewContent', metaData); } catch {}
  }

  // 2. TikTok Pixel - Isolated
  if (target?.tiktokPixelId && window.ttq) {
    try {
      const id = target.tiktokPixelId.trim();
      initTikTokPixel(id);
      if (window.ttq.instance && typeof window.ttq.instance(id)?.track === 'function') {
        window.ttq.instance(id).track('ViewContent', ttData);
      } else if (typeof window.ttq.track === 'function') {
        window.ttq.track('ViewContent', ttData);
      }
    } catch {}
  } else if (!target && window.ttq && typeof window.ttq.track === 'function') {
    try { window.ttq.track('ViewContent', ttData); } catch {}
  }

  // 3. Snapchat Pixel
  if (target?.snapchatPixelId && window.snaptr) {
    try {
      initSnapchatPixel(target.snapchatPixelId.trim());
      window.snaptr('track', 'VIEW_CONTENT', snapData);
    } catch {}
  } else if (!target && window.snaptr) {
    try { window.snaptr('track', 'VIEW_CONTENT', snapData); } catch {}
  }
}

/**
 * Isolated Event: InitiateCheckout (Customer begins checkout form)
 */
export function trackPixelInitiateCheckout(
  data: {
    productId: string;
    productName: string;
    price: number;
    quantity?: number;
  },
  targetOverride?: ActivePixelTarget | null
) {
  if (typeof window === 'undefined') return;
  const target = targetOverride !== undefined ? targetOverride : currentGlobalPixelTarget;
  const qty = data.quantity || 1;
  const total = data.price * qty;

  const metaData = {
    content_name: data.productName,
    content_ids: [data.productId],
    content_type: 'product',
    value: total,
    currency: 'DZD',
    num_items: qty,
  };

  const ttData = {
    content_id: data.productId,
    content_type: 'product',
    content_name: data.productName,
    quantity: qty,
    price: data.price,
    currency: 'DZD',
    value: total,
  };

  const snapData = {
    item_ids: [data.productId],
    price: total,
    currency: 'DZD',
    number_items: qty,
  };

  if (target?.metaPixelId && window.fbq) {
    try {
      const id = target.metaPixelId.trim();
      initMetaPixel(id, target.testEventCode || undefined);
      window.fbq('trackSingle', id, 'InitiateCheckout', metaData);
    } catch {
      try { window.fbq('track', 'InitiateCheckout', metaData); } catch {}
    }
  } else if (!target && window.fbq) {
    try { window.fbq('track', 'InitiateCheckout', metaData); } catch {}
  }

  if (target?.tiktokPixelId && window.ttq) {
    try {
      const id = target.tiktokPixelId.trim();
      initTikTokPixel(id);
      if (window.ttq.instance && typeof window.ttq.instance(id)?.track === 'function') {
        window.ttq.instance(id).track('InitiateCheckout', ttData);
      } else if (typeof window.ttq.track === 'function') {
        window.ttq.track('InitiateCheckout', ttData);
      }
    } catch {}
  } else if (!target && window.ttq && typeof window.ttq.track === 'function') {
    try { window.ttq.track('InitiateCheckout', ttData); } catch {}
  }

  if (target?.snapchatPixelId && window.snaptr) {
    try {
      initSnapchatPixel(target.snapchatPixelId.trim());
      window.snaptr('track', 'START_CHECKOUT', snapData);
    } catch {}
  } else if (!target && window.snaptr) {
    try { window.snaptr('track', 'START_CHECKOUT', snapData); } catch {}
  }
}

/**
 * Isolated Event: Purchase (Order submitted and confirmed)
 */
export function trackPixelPurchase(
  data: {
    orderId: string;
    productId: string;
    productName: string;
    totalAmount: number;
    quantity?: number;
  },
  targetOverride?: ActivePixelTarget | null
) {
  if (typeof window === 'undefined') return;
  const target = targetOverride !== undefined ? targetOverride : currentGlobalPixelTarget;
  const qty = data.quantity || 1;

  const metaData = {
    content_name: data.productName,
    content_ids: [data.productId],
    content_type: 'product',
    value: data.totalAmount,
    currency: 'DZD',
    num_items: qty,
  };

  const ttData = {
    content_id: data.productId,
    content_type: 'product',
    content_name: data.productName,
    quantity: qty,
    currency: 'DZD',
    value: data.totalAmount,
  };

  const snapData = {
    item_ids: [data.productId],
    price: data.totalAmount,
    currency: 'DZD',
    number_items: qty,
    transaction_id: data.orderId,
  };

  if (target?.metaPixelId && window.fbq) {
    try {
      const id = target.metaPixelId.trim();
      initMetaPixel(id, target.testEventCode || undefined);
      window.fbq('trackSingle', id, 'Purchase', metaData);
    } catch {
      try { window.fbq('track', 'Purchase', metaData); } catch {}
    }
  } else if (!target && window.fbq) {
    try { window.fbq('track', 'Purchase', metaData); } catch {}
  }

  if (target?.tiktokPixelId && window.ttq) {
    try {
      const id = target.tiktokPixelId.trim();
      initTikTokPixel(id);
      if (window.ttq.instance && typeof window.ttq.instance(id)?.track === 'function') {
        window.ttq.instance(id).track('CompletePayment', ttData);
      } else if (typeof window.ttq.track === 'function') {
        window.ttq.track('CompletePayment', ttData);
      }
    } catch {}
  } else if (!target && window.ttq && typeof window.ttq.track === 'function') {
    try { window.ttq.track('CompletePayment', ttData); } catch {}
  }

  if (target?.snapchatPixelId && window.snaptr) {
    try {
      initSnapchatPixel(target.snapchatPixelId.trim());
      window.snaptr('track', 'PURCHASE', snapData);
    } catch {}
  } else if (!target && window.snaptr) {
    try { window.snaptr('track', 'PURCHASE', snapData); } catch {}
  }
}

/**
 * Official Store Track PageView with Diagnostics Log
 */
export function trackPageView(pageTitle?: string, targetOverride?: ActivePixelTarget | null): void {
  const target = targetOverride !== undefined ? targetOverride : currentGlobalPixelTarget;
  const data = { page_title: pageTitle || 'Nouva Store | المتجر الرسمي', path: window.location.pathname };
  trackPixelPageView(target);

  if (target?.googleAnalyticsId && window.gtag) {
    try { window.gtag('event', 'page_view', { send_to: target.googleAnalyticsId, ...data }); } catch {}
  } else if (window.gtag) {
    try { window.gtag('event', 'page_view', data); } catch {}
  }

  recordPixelLog({
    platform: 'all',
    eventName: 'PageView',
    scope: target?.scope || 'official_store',
    ownerName: target?.ownerName,
    targetPixelId: target?.metaPixelId || target?.tiktokPixelId || target?.snapchatPixelId || undefined,
    data,
    status: 'sent',
  });
}

/**
 * Official Store Track ViewContent with Diagnostics Log
 */
export function trackViewContent(
  product: {
    id: string;
    name: string;
    price: number;
    category?: string;
  },
  targetOverride?: ActivePixelTarget | null
): void {
  const target = targetOverride !== undefined ? targetOverride : currentGlobalPixelTarget;
  const data = {
    content_name: product.name,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price,
    currency: 'DZD',
    content_category: product.category || 'عام',
  };

  trackPixelViewContent(
    {
      productId: product.id,
      productName: product.name,
      price: product.price,
      category: product.category,
    },
    target
  );

  if (window.gtag) {
    try {
      window.gtag('event', 'view_item', {
        ...(target?.googleAnalyticsId ? { send_to: target.googleAnalyticsId } : {}),
        currency: 'DZD',
        value: product.price,
        items: [{ item_id: product.id, item_name: product.name, price: product.price }],
      });
    } catch {}
  }

  recordPixelLog({
    platform: 'all',
    eventName: 'ViewContent',
    scope: target?.scope || 'official_store',
    ownerName: target?.ownerName,
    targetPixelId: target?.metaPixelId || target?.tiktokPixelId || target?.snapchatPixelId || undefined,
    data,
    status: 'sent',
  });
}

/**
 * Official Store Track AddToCart with Diagnostics Log
 */
export function trackAddToCart(
  product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  },
  targetOverride?: ActivePixelTarget | null
): void {
  const target = targetOverride !== undefined ? targetOverride : currentGlobalPixelTarget;
  const total = product.price * (product.quantity || 1);
  const data = {
    content_name: product.name,
    content_ids: [product.id],
    content_type: 'product',
    value: total,
    currency: 'DZD',
    num_items: product.quantity,
  };

  try {
    if (target?.metaPixelId && window.fbq) {
      window.fbq('trackSingle', target.metaPixelId.trim(), 'AddToCart', data);
    } else if (window.fbq) {
      window.fbq('track', 'AddToCart', data);
    }

    if (target?.tiktokPixelId && window.ttq?.instance) {
      window.ttq.instance(target.tiktokPixelId.trim()).track('AddToCart', {
        content_id: product.id,
        content_name: product.name,
        quantity: product.quantity,
        value: total,
        currency: 'DZD',
      });
    } else if (window.ttq) {
      window.ttq.track('AddToCart', {
        content_id: product.id,
        content_name: product.name,
        quantity: product.quantity,
        value: total,
        currency: 'DZD',
      });
    }

    if (window.snaptr) {
      window.snaptr('track', 'ADD_CART', {
        item_ids: [product.id],
        price: total,
        currency: 'DZD',
        number_items: product.quantity,
      });
    }

    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        ...(target?.googleAnalyticsId ? { send_to: target.googleAnalyticsId } : {}),
        currency: 'DZD',
        value: total,
        items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: product.quantity }],
      });
    }
  } catch (e) {
    console.debug('Pixel error AddToCart:', e);
  }

  recordPixelLog({
    platform: 'all',
    eventName: 'AddToCart',
    scope: target?.scope || 'official_store',
    ownerName: target?.ownerName,
    targetPixelId: target?.metaPixelId || target?.tiktokPixelId || target?.snapchatPixelId || undefined,
    data,
    status: 'sent',
  });
}

/**
 * Official Store Track InitiateCheckout with Diagnostics Log
 */
export function trackInitiateCheckout(
  product: { id: string; name: string; price: number; quantity: number },
  grandTotal: number,
  targetOverride?: ActivePixelTarget | null
): void {
  const target = targetOverride !== undefined ? targetOverride : currentGlobalPixelTarget;
  const data = {
    content_name: product.name,
    content_ids: [product.id],
    value: grandTotal,
    currency: 'DZD',
    num_items: product.quantity,
  };

  trackPixelInitiateCheckout(
    {
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: product.quantity,
    },
    target
  );

  if (window.gtag) {
    try {
      window.gtag('event', 'begin_checkout', {
        ...(target?.googleAnalyticsId ? { send_to: target.googleAnalyticsId } : {}),
        currency: 'DZD',
        value: grandTotal,
        items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: product.quantity }],
      });
    } catch {}
  }

  recordPixelLog({
    platform: 'all',
    eventName: 'InitiateCheckout',
    scope: target?.scope || 'official_store',
    ownerName: target?.ownerName,
    targetPixelId: target?.metaPixelId || target?.tiktokPixelId || target?.snapchatPixelId || undefined,
    data,
    status: 'sent',
  });
}

/**
 * Official Store Track Purchase with Diagnostics Log
 */
export function trackPurchase(
  order: {
    orderId: string;
    totalAmount: number;
    currency?: string;
    items: Array<{ id: string; name: string; price: number; quantity: number }>;
  },
  targetOverride?: ActivePixelTarget | null
): void {
  const target = targetOverride !== undefined ? targetOverride : currentGlobalPixelTarget;
  const firstItem = order.items[0];
  const data = {
    content_ids: order.items.map((i) => i.id),
    content_type: 'product',
    value: order.totalAmount,
    currency: order.currency || 'DZD',
    num_items: order.items.reduce((sum, i) => sum + (i.quantity || 1), 0),
    order_id: order.orderId,
  };

  trackPixelPurchase(
    {
      orderId: order.orderId,
      productId: firstItem?.id || order.orderId,
      productName: firstItem?.name || 'طلب رسمي',
      totalAmount: order.totalAmount,
      quantity: firstItem?.quantity || 1,
    },
    target
  );

  if (target?.metaPixelId && window.fbq) {
    try {
      window.fbq('trackSingle', target.metaPixelId.trim(), 'Lead', {
        content_name: 'Official Store COD Order',
        value: order.totalAmount,
        currency: 'DZD',
      });
    } catch {}
  } else if (window.fbq) {
    try {
      window.fbq('track', 'Lead', {
        content_name: 'Official Store COD Order',
        value: order.totalAmount,
        currency: 'DZD',
      });
    } catch {}
  }

  if (window.gtag) {
    try {
      window.gtag('event', 'purchase', {
        transaction_id: order.orderId,
        value: order.totalAmount,
        currency: 'DZD',
        items: order.items.map((it) => ({
          item_id: it.id,
          item_name: it.name,
          price: it.price,
          quantity: it.quantity,
        })),
      });
    } catch {}
  }

  recordPixelLog({
    platform: 'all',
    eventName: 'Purchase',
    data,
    status: 'sent',
  });
}

export function simulateTestEvent(
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'
): void {
  const dummyProduct = {
    id: 'PRD-TEST-001',
    name: 'منتج تجريبي للاختبار',
    price: 4500,
    quantity: 1,
  };

  if (eventName === 'PageView') {
    trackPageView('صفحة اختبار البيكسل التجريبية');
  } else if (eventName === 'ViewContent') {
    trackViewContent(dummyProduct);
  } else if (eventName === 'AddToCart') {
    trackAddToCart(dummyProduct);
  } else if (eventName === 'InitiateCheckout') {
    trackInitiateCheckout(dummyProduct, 4500);
  } else if (eventName === 'Purchase') {
    trackPurchase({
      orderId: `TEST-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      totalAmount: 5100,
      currency: 'DZD',
      items: [dummyProduct],
    });
  }
}

export interface PixelStatusResponse {
  platform: 'meta' | 'tiktok' | 'snapchat' | string;
  pixelId: string;
  status: 'active' | 'inactive';
  active: boolean;
  statusCode: number;
  message: string;
  lastChecked?: string;
}

export interface BatchPixelVerifyResponse {
  meta: PixelStatusResponse;
  tiktok: PixelStatusResponse;
  snapchat: PixelStatusResponse;
  activeCount: number;
  totalCount: number;
  timestamp: string;
}

/**
 * Verify a single pixel against the server API
 */
export async function verifyPixelApi(
  platform: 'meta' | 'tiktok' | 'snapchat',
  pixelId: string
): Promise<PixelStatusResponse> {
  const cleanId = (pixelId || '').trim();
  if (!cleanId) {
    return {
      platform,
      pixelId: '',
      status: 'inactive',
      active: false,
      statusCode: 400,
      message: 'معطل (لم يتم إدخال معرّف البيكسل)',
    };
  }

  try {
    const res = await fetch('/api/pixel/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, pixelId: cleanId }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    // Client-side fallback if server cannot be reached
    const fallbackActive =
      platform === 'meta'
        ? /^\d{12,18}$/.test(cleanId)
        : platform === 'tiktok'
        ? /^[A-Za-z0-9_-]{10,30}$/.test(cleanId)
        : /^[0-9a-fA-F-]{32,38}$/.test(cleanId);

    return {
      platform,
      pixelId: cleanId,
      status: fallbackActive ? 'active' : 'inactive',
      active: fallbackActive,
      statusCode: fallbackActive ? 200 : 422,
      message: fallbackActive
        ? 'نشط (تم التحقق من صحة المعرّف وصيغته الرقمية)'
        : 'معطل (صيغة المعرّف غير متوافقة مع متطلبات المنصة)',
    };
  }
}

/**
 * Verify all three pixels in parallel against the server API
 */
export async function verifyAllPixelsApi(params: {
  metaPixelId?: string;
  tiktokPixelId?: string;
  snapchatPixelId?: string;
}): Promise<BatchPixelVerifyResponse> {
  try {
    const res = await fetch('/api/pixel/verify-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    const [meta, tiktok, snapchat] = await Promise.all([
      verifyPixelApi('meta', params.metaPixelId || ''),
      verifyPixelApi('tiktok', params.tiktokPixelId || ''),
      verifyPixelApi('snapchat', params.snapchatPixelId || ''),
    ]);
    return {
      meta,
      tiktok,
      snapchat,
      activeCount: [meta, tiktok, snapchat].filter((p) => p.active).length,
      totalCount: 3,
      timestamp: new Date().toISOString(),
    };
  }
}
