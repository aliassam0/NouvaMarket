/**
 * Ultra-Robust Algerian Mobile Phone Validator
 * دالة قوية وشاملة للتحقق من أرقام الهواتف النقالة في الجزائر (موبيليس، جازي، أوريدو)
 * 
 * القواعد الصارمة:
 * 1. تحويل الأرقام المكتوبة بالعربية الشرقية (٠١٢٣٤٥٦٧٨٩) إلى أرقام لاتينية قياسية.
 * 2. إزالة كافة الفواصل والمسافات والرموز والشرطات.
 * 3. دعم وتوحيد الصيغة الدولية (+213 أو 00213 أو 213) وإعادتها للصيغة القياسية (05, 06, 07).
 * 4. التحقق الصارم من الطول: 10 أرقام بالضبط.
 * 5. التحقق من بادئات متعاملي الهاتف النقال الجزائري:
 *    - 05: أوريدو (Ooredoo)
 *    - 06: موبيليس (Mobilis)
 *    - 07: جازي (Djezzy)
 * 6. رفض الأرقام الوهمية أو المتكررة (مثل 0555555555, 0600000000, 0711111111).
 * 7. رفض الأرقام المتسلسلة (مثل 0501234567, 0787654321, 0612345678).
 * 8. رفض الهواتف الثابتة (021, 023, 025, 031, ...) لأنها لا تدعم الاتصال السريع أو واتساب سائق التوصيل.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  cleanNumber: string; // 10-digit standard format (e.g. 0550123456)
  operator?: 'Mobilis' | 'Djezzy' | 'Ooredoo';
  operatorAr?: string;
  errorMessage?: string;
}

/**
 * تحويل الأرقام الهندية/العربية الشرقية إلى أرقام غربية عادية
 */
export function convertEasternToArabicDigits(str: string): string {
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (w) => {
    return String(easternDigits.indexOf(w));
  });
}

/**
 * دالة قوية جداً للتحقق من صحة رقم الهاتف النقال الجزائري
 */
export function validateAlgerianMobile(rawPhone: string): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      isValid: false,
      cleanNumber: '',
      errorMessage: 'يرجى إدخال رقم الهاتف النقال',
    };
  }

  // 1. تحويل الأرقام العربية الشرقية وإزالة المسافات والرموز
  let sanitized = convertEasternToArabicDigits(rawPhone.trim());
  sanitized = sanitized.replace(/[\s\-\.\(\)\_\/\\]/g, '');

  // 2. معالجة الصيغة الدولية
  if (sanitized.startsWith('+213')) {
    sanitized = '0' + sanitized.slice(4);
  } else if (sanitized.startsWith('00213')) {
    sanitized = '0' + sanitized.slice(5);
  } else if (sanitized.startsWith('213') && sanitized.length >= 11) {
    sanitized = '0' + sanitized.slice(3);
  } else if ((sanitized.startsWith('5') || sanitized.startsWith('6') || sanitized.startsWith('7')) && sanitized.length === 9) {
    // الزبون كتب الرقم بدون الصفر الأول (مثال: 550123456)
    sanitized = '0' + sanitized;
  }

  // 3. التحقق من وجود أحرف غير رقمية
  if (!/^\d+$/.test(sanitized)) {
    return {
      isValid: false,
      cleanNumber: sanitized,
      errorMessage: 'رقم الهاتف يجب أن يحتوي على أرقام فقط',
    };
  }

  // 4. التحقق من الأرقام الثابتة الأرضية (غير مقبولة في التوصيل السريع)
  if (/^0(21|23|24|25|26|27|29|31|32|33|34|35|36|37|38|41|43|44|45|46|48|49)/.test(sanitized)) {
    return {
      isValid: false,
      cleanNumber: sanitized,
      errorMessage: 'هذا رقم هاتف ثابت، يرجى كتابة رقم هاتف نقال (05 أو 06 أو 07) لضمان اتصال الموزع بك',
    };
  }

  // 5. التحقق من الطول الإجمالي (يجب أن يكون 10 أرقام بالضبط)
  if (sanitized.length < 10) {
    return {
      isValid: false,
      cleanNumber: sanitized,
      errorMessage: `رقم الهاتف غير مكتمل (${sanitized.length} من 10 أرقام)`,
    };
  }

  if (sanitized.length > 10) {
    return {
      isValid: false,
      cleanNumber: sanitized,
      errorMessage: 'رقم الهاتف طويل جداً (يجب أن يكون 10 أرقام فقط)',
    };
  }

  // 6. التحقق من بادئة متعامل الهاتف النقال الجزائري
  const prefix = sanitized.slice(0, 2);
  let operator: 'Mobilis' | 'Djezzy' | 'Ooredoo' | undefined;
  let operatorAr = '';

  if (prefix === '05') {
    operator = 'Ooredoo';
    operatorAr = 'أوريدو (Ooredoo)';
  } else if (prefix === '06') {
    operator = 'Mobilis';
    operatorAr = 'موبيليس (Mobilis)';
  } else if (prefix === '07') {
    operator = 'Djezzy';
    operatorAr = 'جازي (Djezzy)';
  } else {
    return {
      isValid: false,
      cleanNumber: sanitized,
      errorMessage: 'رقم الهاتف يجب أن يبدأ بـ 05 (أوريدو) أو 06 (موبيليس) أو 07 (جازي)',
    };
  }

  // 7. كشف الأرقام الوهمية أو المتكررة (Anti-Spam / Anti-Fake Pattern Detection)
  const body = sanitized.slice(2); // آخر 8 أرقام

  // أ) كل الأرقام متطابقة مثل 0555555555 أو 0600000000
  if (/^(\d)\1+$/.test(sanitized)) {
    return {
      isValid: false,
      cleanNumber: sanitized,
      errorMessage: 'رقم الهاتف غير صحيح (أرقام متطابقة وهمية)',
    };
  }

  // ب) آخر 8 أرقام متطابقة مثل 0500000000 أو 0711111111 أو 0699999999
  if (/^(\d)\1{7}$/.test(body)) {
    return {
      isValid: false,
      cleanNumber: sanitized,
      errorMessage: 'رقم الهاتف غير حقيقي، يرجى كتابة رقمك الفعلي',
    };
  }

  // ج) تسلسل تصاعدي أو تنازلي مثل 0501234567 أو 0612345678 أو 0787654321
  const ascending = '0123456789';
  const descending = '9876543210';
  if (ascending.includes(body) || descending.includes(body) || ascending.includes(sanitized) || descending.includes(sanitized)) {
    return {
      isValid: false,
      cleanNumber: sanitized,
      errorMessage: 'رقم الهاتف متسلسل ووهمي، يرجى كتابة رقم هاتفك الصحيح',
    };
  }

  // د) أنماط التكرار الثنائي البسيط مثل 0512121212 أو 0701010101
  if (/^(\d{2})\1{3}$/.test(body)) {
    return {
      isValid: false,
      cleanNumber: sanitized,
      errorMessage: 'رقم الهاتف مكرر ووهمي، يرجى إدخال رقم هاتف حقيقي',
    };
  }

  // هـ) التكرار الرباعي مثل 0512341234
  if (/^(\d{4})\1$/.test(body)) {
    return {
      isValid: false,
      cleanNumber: sanitized,
      errorMessage: 'رقم الهاتف غير صالح، يرجى التحقق من الرقم',
    };
  }

  // الرقم سليم 100%
  return {
    isValid: true,
    cleanNumber: sanitized,
    operator,
    operatorAr,
  };
}

/**
 * تنسيق وعرض الرقم بشكل جميل للقراءة: 0550 12 34 56
 */
export function formatAlgerianPhoneDisplay(phone: string): string {
  const result = validateAlgerianMobile(phone);
  const n = result.cleanNumber;
  if (n.length === 10) {
    return `${n.slice(0, 4)} ${n.slice(4, 6)} ${n.slice(6, 8)} ${n.slice(8, 10)}`;
  }
  return phone;
}
