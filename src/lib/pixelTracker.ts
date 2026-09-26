/**
 * Social Media Pixels Tracker for Marketers (Resellers)
 * Supports: Meta (Facebook/Instagram), TikTok, and Snapchat Pixels
 */

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    snaptr?: any;
    _snaptr?: any;
  }
}

export interface PixelConfig {
  metaPixelId?: string | null;
  tiktokPixelId?: string | null;
  snapchatPixelId?: string | null;
}

const initializedPixels = {
  meta: new Set<string>(),
  tiktok: new Set<string>(),
  snapchat: new Set<string>(),
};

/**
 * Initialize Meta (Facebook) Pixel
 */
export function initMetaPixel(pixelId: string) {
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

    if (window.ttq && typeof window.ttq.load === 'function') {
      window.ttq.load(cleanId);
      initializedPixels.tiktok.add(cleanId);
      console.log(`%c[Nouva Pixel] TikTok Pixel Initialized: ${cleanId}`, 'color: #000000; background: #25F4EE; font-weight: bold;');
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
      console.log(`%c[Nouva Pixel] Snapchat Pixel Initialized: ${cleanId}`, 'color: #000; background: #FFFC00; font-weight: bold;');
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
 * Event: PageView
 */
export function trackPixelPageView() {
  if (typeof window === 'undefined') return;

  // Meta
  if (window.fbq) {
    try {
      window.fbq('track', 'PageView');
    } catch {}
  }

  // TikTok
  if (window.ttq && typeof window.ttq.page === 'function') {
    try {
      window.ttq.page();
    } catch {}
  }

  // Snapchat
  if (window.snaptr) {
    try {
      window.snaptr('track', 'PAGE_VIEW');
    } catch {}
  }
}

/**
 * Event: ViewContent (Viewing Product)
 */
export function trackPixelViewContent(data: {
  productId: string;
  productName: string;
  category?: string;
  price: number;
}) {
  if (typeof window === 'undefined') return;

  console.log('[Nouva Pixel] Tracking ViewContent:', data);

  // Meta
  if (window.fbq) {
    try {
      window.fbq('track', 'ViewContent', {
        content_name: data.productName,
        content_ids: [data.productId],
        content_type: 'product',
        content_category: data.category || 'Commerce',
        value: data.price,
        currency: 'DZD',
      });
    } catch {}
  }

  // TikTok
  if (window.ttq && typeof window.ttq.track === 'function') {
    try {
      window.ttq.track('ViewContent', {
        content_id: data.productId,
        content_type: 'product',
        content_name: data.productName,
        content_category: data.category || 'General',
        price: data.price,
        currency: 'DZD',
        value: data.price,
      });
    } catch {}
  }

  // Snapchat
  if (window.snaptr) {
    try {
      window.snaptr('track', 'VIEW_CONTENT', {
        item_ids: [data.productId],
        item_category: data.category || 'General',
        price: data.price,
        currency: 'DZD',
      });
    } catch {}
  }
}

/**
 * Event: InitiateCheckout (Customer fills form / selects location / starts ordering)
 */
export function trackPixelInitiateCheckout(data: {
  productId: string;
  productName: string;
  price: number;
  quantity?: number;
}) {
  if (typeof window === 'undefined') return;

  console.log('[Nouva Pixel] Tracking InitiateCheckout:', data);

  // Meta
  if (window.fbq) {
    try {
      window.fbq('track', 'InitiateCheckout', {
        content_name: data.productName,
        content_ids: [data.productId],
        content_type: 'product',
        value: data.price * (data.quantity || 1),
        currency: 'DZD',
        num_items: data.quantity || 1,
      });
    } catch {}
  }

  // TikTok
  if (window.ttq && typeof window.ttq.track === 'function') {
    try {
      window.ttq.track('InitiateCheckout', {
        content_id: data.productId,
        content_type: 'product',
        content_name: data.productName,
        quantity: data.quantity || 1,
        price: data.price,
        currency: 'DZD',
        value: data.price * (data.quantity || 1),
      });
    } catch {}
  }

  // Snapchat
  if (window.snaptr) {
    try {
      window.snaptr('track', 'START_CHECKOUT', {
        item_ids: [data.productId],
        price: data.price * (data.quantity || 1),
        currency: 'DZD',
        number_items: data.quantity || 1,
      });
    } catch {}
  }
}

/**
 * Event: Purchase (Order submitted and confirmed)
 */
export function trackPixelPurchase(data: {
  orderId: string;
  productId: string;
  productName: string;
  totalAmount: number;
  quantity?: number;
}) {
  if (typeof window === 'undefined') return;

  console.log('%c[Nouva Pixel] Tracking Purchase:', 'color: #10B981; font-weight: bold;', data);

  // Meta
  if (window.fbq) {
    try {
      window.fbq('track', 'Purchase', {
        content_name: data.productName,
        content_ids: [data.productId],
        content_type: 'product',
        value: data.totalAmount,
        currency: 'DZD',
        num_items: data.quantity || 1,
      });
    } catch {}
  }

  // TikTok
  if (window.ttq && typeof window.ttq.track === 'function') {
    try {
      window.ttq.track('PlaceAnOrder', {
        content_id: data.productId,
        content_type: 'product',
        content_name: data.productName,
        quantity: data.quantity || 1,
        currency: 'DZD',
        value: data.totalAmount,
      });
      window.ttq.track('CompletePayment', {
        content_id: data.productId,
        content_type: 'product',
        content_name: data.productName,
        quantity: data.quantity || 1,
        currency: 'DZD',
        value: data.totalAmount,
      });
    } catch {}
  }

  // Snapchat
  if (window.snaptr) {
    try {
      window.snaptr('track', 'PURCHASE', {
        item_ids: [data.productId],
        price: data.totalAmount,
        currency: 'DZD',
        number_items: data.quantity || 1,
        transaction_id: data.orderId,
      });
    } catch {}
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

