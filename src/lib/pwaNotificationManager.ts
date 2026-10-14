// PWA Push Notifications & Instant Sale Alert Chime/Vibration Manager
// Nouva Market - إشعارات الهاتف الفورية مع رنين وهزّة المبيعة الجديدة

export interface SaleNotificationPayload {
  profit: number;
  orderId?: string;
  productName?: string;
  customerName?: string;
  wilaya?: string;
}

const SETTINGS_KEY = 'nouva_sale_notifications_config';

export interface SaleNotifSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  pushEnabled: boolean;
}

export function getSaleNotifSettings(): SaleNotifSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    soundEnabled: true,
    vibrationEnabled: true,
    pushEnabled: true,
  };
}

export function saveSaleNotifSettings(settings: Partial<SaleNotifSettings>): SaleNotifSettings {
  const current = getSaleNotifSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nouva_sale_settings_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save sale notif settings', e);
  }
  return updated;
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export function getPushPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const perm = await Notification.requestPermission();
    saveSaleNotifSettings({ pushEnabled: perm === 'granted' });
    return perm;
  } catch (e) {
    console.error('Error requesting notification permission', e);
    return Notification.permission;
  }
}

/**
 * صوت رنين مميز للمبيعة (Cash Register "Ka-Ching! 💰" + Golden Coins Chime)
 * Synthesized using Web Audio API for zero latency and crisp, high-fidelity sound on all devices.
 */
export function playSaleChime(): void {
  const settings = getSaleNotifSettings();
  if (!settings.soundEnabled) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const startTime = ctx.currentTime + 0.02;

    // 1. Mechanical cash register "Cha-Ching" impact click
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 2200;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(startTime);

    // 2. Harmonic Golden Bell Chimes (C6 -> E6 -> G6 -> C7)
    // Note 1: E6 (1318.5 Hz) - bright entrance
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, startTime + 0.03);
    gain1.gain.setValueAtTime(0.28, startTime + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.65);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(startTime + 0.03);
    osc1.stop(startTime + 0.65);

    // Note 2: G6 (1567.98 Hz) - harmonious shimmer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1567.98, startTime + 0.07);
    gain2.gain.setValueAtTime(0.24, startTime + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(startTime + 0.07);
    osc2.stop(startTime + 0.75);

    // Note 3: High Golden Ding C7 (2093 Hz) - celebratory resonance
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(2093.0, startTime + 0.12);
    gain3.gain.setValueAtTime(0.35, startTime + 0.12);
    gain3.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.95);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(startTime + 0.12);
    osc3.stop(startTime + 0.95);

    // Note 4: Coins clinking shimmer (E7 2637 Hz)
    const osc4 = ctx.createOscillator();
    const gain4 = ctx.createGain();
    osc4.type = 'sine';
    osc4.frequency.setValueAtTime(2637.02, startTime + 0.16);
    gain4.gain.setValueAtTime(0.2, startTime + 0.16);
    gain4.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);
    osc4.connect(gain4);
    gain4.connect(ctx.destination);
    osc4.start(startTime + 0.16);
    osc4.stop(startTime + 0.6);
  } catch (e) {
    console.warn('Sale chime playback error', e);
  }
}

/**
 * اهتزاز هاتف المسوق بنمط مميز احتفالي
 * Pattern: vibrate 200ms -> pause 100ms -> vibrate 200ms -> pause 100ms -> vibrate 350ms
 */
export function vibratePhoneForSale(): void {
  const settings = getSaleNotifSettings();
  if (!settings.vibrationEnabled) return;

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 350]);
    } catch (e) {
      console.warn('Vibration error', e);
    }
  }
}

/**
 * إرسال إشعار فوري للمبيعة الجديدة بالهاتف والـ PWA
 * إشعار لحظي يهتز في هاتف المسوق مع صوت رنين مميز كلما تحققت مبيعة جديدة: 💰 مبيعة جديدة! ربحك: 2,500 دج.
 */
export function triggerSaleNotification(payload: SaleNotificationPayload): void {
  const profitFormatted = Number(payload.profit || 0).toLocaleString('fr-FR');
  const title = `💰 مبيعة جديدة! ربحك: ${profitFormatted} دج`;
  
  const productText = payload.productName ? `لمنتج "${payload.productName}"` : '';
  const customerText = payload.customerName ? `الزبون: ${payload.customerName}` : 'طلب جديد عبر متجرك';
  const locationText = payload.wilaya ? `(${payload.wilaya})` : '';
  const orderRef = payload.orderId ? ` #${payload.orderId}` : '';

  const body = `🎉 تم تسجيل مبيعة جديدة${orderRef} ${productText} - ${customerText} ${locationText}. تم تسجيل أرباحك في المحفظة!`;

  // 1. Play distinctive cash chime
  playSaleChime();

  // 2. Vibrate phone
  vibratePhoneForSale();

  // 3. Dispatch in-app celebration event for immediate UI toast/banner
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('nouva_instant_sale', {
        detail: {
          title,
          body,
          profit: payload.profit,
          orderId: payload.orderId,
          productName: payload.productName,
          customerName: payload.customerName,
          timestamp: Date.now(),
        },
      })
    );
  }

  // 4. Send PWA / Mobile OS Push Notification
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      const notifOptions: any = {
        body,
        icon: '/pwa-192x192.png',
        badge: '/favicon-32x32.png',
        tag: `sale-${payload.orderId || Date.now()}`,
        renotify: true,
        vibrate: [200, 100, 200, 100, 350],
        data: {
          url: '/#commandes',
          profit: payload.profit,
          orderId: payload.orderId,
        },
      };


      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, notifOptions);
          }).catch(() => {
            new Notification(title, notifOptions);
          });
        } else {
          new Notification(title, notifOptions);
        }
      } catch (err) {
        console.warn('Could not display system notification', err);
      }
    }
  }
}

/**
 * تجربة فورية لإشعار المبيعة (افتراضياً ربح 2,500 دج كما في نص الطلب)
 */
export function testSalePushNotification(amount: number = 2500): void {
  triggerSaleNotification({
    profit: amount,
    orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
    productName: 'ساعة ذكية فاخرة Ultra Pro',
    customerName: 'كريم بلحاج',
    wilaya: '16 - الجزائر العاصمة',
  });
}
