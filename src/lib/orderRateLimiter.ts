/**
 * Anti-Spam 24-Hour Order Lockout & Cooldown Manager
 * يمنع الزبون من إرسال طلب جديد من نفس الجهاز أو الشبكة (IP) إلا بعد مرور 24 ساعة
 */

const STORAGE_LOCK_KEY = 'nouva_order_lock_until_v2';
const STORAGE_LAST_ORDER_KEY = 'nouva_last_order_info_v2';
const COOLDOWN_DURATION_MS = 24 * 60 * 60 * 1000; // 24 ساعة بالمللي ثانية

export interface CooldownStatus {
  isLocked: boolean;
  remainingHours: number;
  remainingMinutes: number;
  lockedUntil: number | null;
  message?: string;
}

/**
 * فحص ما إذا كان الزبون خاضعاً لقفل الـ 24 ساعة
 */
export function checkOrderCooldown(): CooldownStatus {
  if (typeof window === 'undefined') {
    return { isLocked: false, remainingHours: 0, remainingMinutes: 0, lockedUntil: null };
  }

  try {
    const rawLockedUntil = localStorage.getItem(STORAGE_LOCK_KEY);
    if (!rawLockedUntil) {
      return { isLocked: false, remainingHours: 0, remainingMinutes: 0, lockedUntil: null };
    }

    const lockedUntil = parseInt(rawLockedUntil, 10);
    const now = Date.now();

    if (isNaN(lockedUntil) || now >= lockedUntil) {
      // انتهت فترة الـ 24 ساعة
      localStorage.removeItem(STORAGE_LOCK_KEY);
      return { isLocked: false, remainingHours: 0, remainingMinutes: 0, lockedUntil: null };
    }

    const remainingMs = lockedUntil - now;
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      isLocked: true,
      remainingHours,
      remainingMinutes,
      lockedUntil,
      message: `لقد قمت بإرسال طلب سابقاً. لضمان معالجة طلبيتك بدقة وعدم تكرار الشحن، يمكنك تقديم طلب جديد بعد مرور 24 ساعة (المتبقي: ${remainingHours} ساعة و ${remainingMinutes} دقيقة).`,
    };
  } catch {
    return { isLocked: false, remainingHours: 0, remainingMinutes: 0, lockedUntil: null };
  }
}

/**
 * تسجيل قفل الـ 24 ساعة عند إتمام الطلب أو عند إغلاق صفحة الشكر
 */
export function registerOrderCooldown(): void {
  if (typeof window === 'undefined') return;

  try {
    const now = Date.now();
    const lockUntil = now + COOLDOWN_DURATION_MS;
    localStorage.setItem(STORAGE_LOCK_KEY, String(lockUntil));
    localStorage.setItem(STORAGE_LAST_ORDER_KEY, JSON.stringify({ timestamp: now, lockUntil }));

    // إرسال إشعار للخادم أيضاً لتسجيل عنوان الـ IP
    fetch('/api/orders/record-ip-cooldown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lockUntil }),
    }).catch(() => {
      // الصمت في حالة عدم توفر الاتصال، التخزين المحلي كافٍ
    });
  } catch (err) {
    console.warn('Could not register order cooldown:', err);
  }
}

/**
 * مسح القفل (لأغراض المعاينة من طرف الإدارة فقط)
 */
export function clearOrderCooldown(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_LOCK_KEY);
    localStorage.removeItem(STORAGE_LAST_ORDER_KEY);
  } catch (err) {
    console.warn('Could not clear order cooldown:', err);
  }
}
