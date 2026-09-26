/**
 * Google Gemini AI Client Fallback & Persistence Manager
 * Ensures robust Gemini AI operation on both full-stack Node.js servers
 * and static web hosts like Hostinger (hPanel / LiteSpeed / Apache).
 */

const STORAGE_KEY_CONFIG = 'nouvamarket_ai_config';
const STORAGE_KEY_CUSTOM_KEY = 'nouvamarket_custom_gemini_key';
const STORAGE_KEY_CUSTOM_MODEL = 'nouvamarket_custom_gemini_model';

export interface ClientAiConfig {
  provider: 'gemini' | 'openrouter';
  geminiApiKey: string;
  geminiModel: string;
  temperature: number;
  isEnabled: boolean;
  isEnvKey?: boolean;
  hasGeminiKey?: boolean;
  geminiKeyMasked?: string;
}

const DEFAULT_MODEL = 'gemini-3.6-flash';
const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

/**
 * Get stored AI configuration from localStorage
 */
export function getStoredAiConfig(): ClientAiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    const customKey = localStorage.getItem(STORAGE_KEY_CUSTOM_KEY) || '';
    const customModel = localStorage.getItem(STORAGE_KEY_CUSTOM_MODEL) || DEFAULT_MODEL;

    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        provider: parsed.provider || 'gemini',
        geminiApiKey: customKey || parsed.geminiApiKey || '',
        geminiModel: customModel || parsed.geminiModel || DEFAULT_MODEL,
        temperature: typeof parsed.temperature === 'number' ? parsed.temperature : 0.3,
        isEnabled: parsed.isEnabled !== false,
        hasGeminiKey: Boolean(customKey || parsed.geminiApiKey),
        geminiKeyMasked: maskKey(customKey || parsed.geminiApiKey || ''),
      };
    }

    return {
      provider: 'gemini',
      geminiApiKey: customKey,
      geminiModel: customModel,
      temperature: 0.3,
      isEnabled: true,
      hasGeminiKey: Boolean(customKey),
      geminiKeyMasked: maskKey(customKey),
    };
  } catch {
    return {
      provider: 'gemini',
      geminiApiKey: '',
      geminiModel: DEFAULT_MODEL,
      temperature: 0.3,
      isEnabled: true,
      hasGeminiKey: false,
      geminiKeyMasked: '',
    };
  }
}

/**
 * Save AI configuration to localStorage
 */
export function saveStoredAiConfig(config: Partial<ClientAiConfig>): void {
  try {
    const current = getStoredAiConfig();
    const updated = { ...current, ...config };

    if (config.geminiApiKey !== undefined) {
      const cleanKey = (config.geminiApiKey || '').replace(/[\u200B-\u200D\uFEFF\r\n\t\s'"]/g, '').trim();
      if (cleanKey && cleanKey !== 'USE_ENV') {
        localStorage.setItem(STORAGE_KEY_CUSTOM_KEY, cleanKey);
        updated.geminiApiKey = cleanKey;
        updated.hasGeminiKey = true;
        updated.geminiKeyMasked = maskKey(cleanKey);
      } else if (cleanKey === 'USE_ENV') {
        localStorage.removeItem(STORAGE_KEY_CUSTOM_KEY);
        updated.geminiApiKey = '';
      }
    }

    if (config.geminiModel) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_MODEL, config.geminiModel);
      updated.geminiModel = config.geminiModel;
    }

    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save AI config to localStorage:', e);
  }
}

function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

/**
 * Helper to check if a response text looks like an HTML 404 error page
 * (e.g. Hostinger default 404 page)
 */
export function isHtmlResponse(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim().toLowerCase();
  return (
    trimmed.startsWith('<!doctype html') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<head>') ||
    trimmed.includes('prefix="content:') ||
    trimmed.includes('404 not found')
  );
}

/**
 * Call Gemini REST API directly from the browser
 */
export async function callGeminiDirectRest(
  apiKey: string,
  model: string,
  prompt: string,
  systemInstruction?: string,
  imageBase64List?: string[]
): Promise<{ success: boolean; text?: string; error?: string; modelUsed?: string; latencyMs?: number }> {
  const cleanKey = (apiKey || '').replace(/[\u200B-\u200D\uFEFF\r\n\t\s'"]/g, '').trim();
  if (!cleanKey) {
    return {
      success: false,
      error: 'يرجى إدخال مفتاح Google Gemini API صالح في الإعدادات.',
    };
  }

  const candidateModels = [
    model && model.trim() ? model.trim() : DEFAULT_MODEL,
    ...CANDIDATE_MODELS,
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  const startTime = Date.now();
  let lastError = '';

  for (const targetModel of candidateModels) {
    try {
      const parts: any[] = [];
      if (prompt) {
        parts.push({ text: prompt });
      }

      if (Array.isArray(imageBase64List)) {
        for (const img of imageBase64List) {
          if (!img || typeof img !== 'string') continue;
          let mimeType = 'image/jpeg';
          let base64Data = img;

          if (img.startsWith('data:')) {
            const match = img.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              mimeType = match[1];
              base64Data = match[2];
            }
          }

          if (base64Data && !base64Data.startsWith('http')) {
            parts.push({
              inlineData: {
                mimeType,
                data: base64Data,
              },
            });
          }
        }
      }

      const requestBody: any = {
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
      };

      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.error) {
        const errObj = responseData.error || {};
        const errMsg = errObj.message || `HTTP ${response.status}`;
        lastError = errMsg;
        console.warn(`Direct Gemini API call failed for model ${targetModel}:`, errMsg);
        continue;
      }

      const candidate = responseData.candidates?.[0];
      const textPart = candidate?.content?.parts?.[0]?.text || '';

      return {
        success: true,
        text: textPart,
        modelUsed: targetModel,
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn(`Direct Gemini request exception for model ${targetModel}:`, lastError);
    }
  }

  // Format user-friendly Arabic error message
  let userFriendly = 'فشل الاتصال بـ Google Gemini API. يرجى التحقق من المفتاح واتصالك بالإنترنت.';
  if (lastError.includes('API_KEY_INVALID') || lastError.includes('API key not valid') || lastError.includes('403') || lastError.includes('401')) {
    userFriendly = 'مفتاح Google Gemini API المدخل غير صالح أو منتهي الصلاحية. يرجى التأكد من نسخه بدقة من Google AI Studio.';
  } else if (lastError.includes('quota') || lastError.includes('429') || lastError.includes('RESOURCE_EXHAUSTED')) {
    userFriendly = 'تم تجاوز حد الاستهلاك المسموح به للمفتاح أو الحصة المجانية مؤقتاً (Quota Limit Exceeded). يرجى التحقق من إعدادات حسابك في Google AI Studio.';
  } else if (lastError.includes('NOT_FOUND') || lastError.includes('404')) {
    userFriendly = 'النموذج المحدد غير متاح لحسابك حالياً. يرجى اختيار نموذج آخر مثل gemini-3.6-flash.';
  } else if (lastError) {
    userFriendly = `خطأ في اتصال Gemini API: ${lastError}`;
  }

  return {
    success: false,
    error: userFriendly,
  };
}

/**
 * Robust connection test that tries the Express backend first,
 * and seamlessly falls back to Direct Gemini REST API if running on
 * static hosting like Hostinger (where /api returns HTML 404).
 */
export async function testGeminiConnectionSmart(
  apiKey?: string,
  model?: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  latencyMs?: number;
  model?: string;
  source?: 'backend' | 'direct_web';
}> {
  const stored = getStoredAiConfig();
  const effectiveKey = (apiKey || stored.geminiApiKey || '').replace(/[\u200B-\u200D\uFEFF\r\n\t\s'"]/g, '').trim();
  const effectiveModel = model || stored.geminiModel || DEFAULT_MODEL;

  // 1. Try server endpoint first
  try {
    const payload: any = { model: effectiveModel };
    if (apiKey) payload.apiKey = apiKey;

    const res = await fetch('/api/admin/ai/test-connection', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    // If server responded with JSON (not HTML 404 from Hostinger)
    if (!isHtmlResponse(text)) {
      try {
        const data = JSON.parse(text);
        if (res.ok && data.success) {
          if (effectiveKey) saveStoredAiConfig({ geminiApiKey: effectiveKey, geminiModel: effectiveModel });
          return {
            success: true,
            message: data.responseMessage,
            latencyMs: data.latencyMs,
            model: data.model,
            source: 'backend',
          };
        } else if (data.error) {
          return {
            success: false,
            error: data.error,
            source: 'backend',
          };
        }
      } catch {
        // Fall through to direct test
      }
    }
  } catch {
    // Backend unreachable, fall through to direct web test
  }

  // 2. Direct browser test (for Hostinger, Netlify, Vercel, or static web hosting)
  if (!effectiveKey) {
    return {
      success: false,
      error: 'يرجى إدخال مفتاح Google Gemini API في الحقل أعلاه أولاً ليتمكن النظام من اختباره مباشرة.',
    };
  }

  const testPrompt = 'فحص اتصال منصة Nouva Market. اكتب سطر ترحيبي واحد يؤكد نجاح الاتصال بـ Google Gemini API بنجاح وسرعة.';
  const directResult = await callGeminiDirectRest(effectiveKey, effectiveModel, testPrompt);

  if (directResult.success) {
    saveStoredAiConfig({
      geminiApiKey: effectiveKey,
      geminiModel: directResult.modelUsed || effectiveModel,
    });

    return {
      success: true,
      message: directResult.text || 'تم الاتصال بنجاح بـ Google Gemini API مباشرة عبر المتصفح (Web Client Mode)!',
      latencyMs: directResult.latencyMs || 600,
      model: directResult.modelUsed || effectiveModel,
      source: 'direct_web',
    };
  } else {
    return {
      success: false,
      error: directResult.error || 'فشل الاتصال بـ Google Gemini API',
      source: 'direct_web',
    };
  }
}

/**
 * Smart product name generator (Backend first, browser direct fallback for Hostinger)
 */
export async function generateProductNameSmart(params: {
  currentName?: string;
  category?: string;
  images?: string[];
}): Promise<{ success: boolean; productName?: string; error?: string }> {
  // 1. Try server endpoint first
  try {
    const res = await fetch('/api/admin/ai/generate-product-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const text = await res.text();
    if (!isHtmlResponse(text)) {
      const data = JSON.parse(text);
      if (res.ok && data.success && data.productName) {
        return { success: true, productName: data.productName };
      }
    }
  } catch {}

  // 2. Direct client fallback using stored key
  const cfg = getStoredAiConfig();
  if (!cfg.geminiApiKey) {
    return { success: false, error: 'يرجى إدخال وتفعيل مفتاح Google Gemini API في إعدادات الأدمن أولاً.' };
  }

  const prompt = `أنت خبير تسمية منتجات التجارة الإلكترونية بالجزائر.
الاسم الحالي: ${params.currentName || 'غير محدد'}
التصنيف: ${params.category || 'غير محدد'}
المطلوب: توليد اسم تسويقي جذاب، دقيق ومختصر للمنتج بالعربية مع إبقاء اسم الماركة/البراند بالأحرف الأصلية إن وجد.
أعد فقط اسم المنتج في سطر واحد دون أي مقدمات أو علامات تنصيص.`;

  const res = await callGeminiDirectRest(cfg.geminiApiKey, cfg.geminiModel, prompt, undefined, params.images);
  if (res.success && res.text) {
    return { success: true, productName: res.text.replace(/["'«»]/g, '').trim() };
  }
  return { success: false, error: res.error || 'تعذر توليد الاسم بالذكاء الاصطناعي' };
}

/**
 * Smart product description generator (Backend first, browser direct fallback for Hostinger)
 */
export async function generateProductDescriptionSmart(params: {
  productName: string;
  category?: string;
  images?: string[];
}): Promise<{ success: boolean; descriptionAr?: string; error?: string }> {
  // 1. Try server endpoint first
  try {
    const res = await fetch('/api/admin/ai/generate-product-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const text = await res.text();
    if (!isHtmlResponse(text)) {
      const data = JSON.parse(text);
      if (res.ok && (data.descriptionAr || data.description)) {
        return { success: true, descriptionAr: data.descriptionAr || data.description };
      }
    }
  } catch {}

  // 2. Direct client fallback using stored key
  const cfg = getStoredAiConfig();
  if (!cfg.geminiApiKey) {
    return { success: false, error: 'يرجى إدخال وتفعيل مفتاح Google Gemini API في إعدادات الأدمن أولاً.' };
  }

  const prompt = `أنت خبير صياغة صفحات الهبوط الإقناعية AIDA وكتابة الإعلانات للتجارة الإلكترونية في الجزائر.
اسم المنتج: ${params.productName}
التصنيف: ${params.category || 'عام'}

اكتب وصفاً تسويقياً شاملاً، إقناعياً وراقياً للمنتج وفق نموذج AIDA:
- Attention: خطاف انتباه جذاب ومؤثر
- Interest: استعراض المميزات والفوائد ونقاط القوة
- Desire: إثارة الرغبة والنتائج والشعور بالفخامة
- Action: دعوة صريحة للطلب مع التوصيل والدفع عند الاستلام

استخدم اللغة العربية الفصحى المبسطة مع إيموجي أنيقة وتنسيق مريح للعين.`;

  const res = await callGeminiDirectRest(cfg.geminiApiKey, cfg.geminiModel, prompt, undefined, params.images);
  if (res.success && res.text) {
    return { success: true, descriptionAr: res.text.trim() };
  }
  return { success: false, error: res.error || 'تعذر توليد الوصف بالذكاء الاصطناعي' };
}

/**
 * Smart marketing copy generator (Backend first, browser direct fallback for Hostinger)
 */
export async function generateMarketingCopySmart(params: {
  productName: string;
  productDescription?: string;
  platform: string;
  tone: string;
  price?: number;
  profit?: number;
  ageGroup?: string;
}): Promise<{ success: boolean; generatedText?: string; error?: string }> {
  // 1. Try server endpoint first
  try {
    const res = await fetch('/api/reseller/ai/generate-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const text = await res.text();
    if (!isHtmlResponse(text)) {
      const data = JSON.parse(text);
      if (res.ok && data.generatedText) {
        return { success: true, generatedText: data.generatedText };
      }
    }
  } catch {}

  // 2. Direct client fallback using stored key
  const cfg = getStoredAiConfig();
  if (!cfg.geminiApiKey) {
    return { success: false, error: 'يرجى تزويد مفتاح Google Gemini API في إعدادات الأدمن أولاً.' };
  }

  const prompt = `أنت خبير ومسوّق إلكتروني محترف في الجزائر.
اكتب نصاً إعلانياً جذاباً مخصصاً لمنصة: ${params.platform}
اسم المنتج: ${params.productName}
وصف المنتج: ${params.productDescription || ''}
السعر: ${params.price || ''} دج
نبرة الصوت: ${params.tone}
الفئة العمرية: ${params.ageGroup || 'الجميع'}

المطلوب: كتابة إعلان بيعي جاهز للنشر متوافق مع المنصة المختارة بالدارجة الجزائرية المهذبة أو العربية السلسة مع التركيز على التوصيل السريع لـ 58 ولاية والدفع عند الاستلام.`;

  const res = await callGeminiDirectRest(cfg.geminiApiKey, cfg.geminiModel, prompt);
  if (res.success && res.text) {
    return { success: true, generatedText: res.text.trim() };
  }
  return { success: false, error: res.error || 'تعذر إنشاء النص الإعلاني' };
}

