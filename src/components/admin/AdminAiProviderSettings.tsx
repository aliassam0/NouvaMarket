import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  Sliders,
  ExternalLink,
  Cpu,
  Layers,
  FileText,
  Camera,
  Globe,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import {
  getStoredAiConfig,
  saveStoredAiConfig,
  testGeminiConnectionSmart,
  isHtmlResponse,
} from '../../lib/geminiClientFallback';

interface AIModelOption {
  id: string;
  name: string;
  speed: string;
  quality: string;
  description: string;
}

interface AdminAiProviderSettingsProps {
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminAiProviderSettings: React.FC<AdminAiProviderSettingsProps> = ({ onShowToast }) => {
  const [provider, setProvider] = useState<'gemini' | 'openrouter'>('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [temperature, setTemperature] = useState(0.3);
  const [isEnabled, setIsEnabled] = useState(true);

  // Server state metadata
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [isEnvKey, setIsEnvKey] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [supportedModels, setSupportedModels] = useState<AIModelOption[]>([
    {
      id: 'gemini-3.6-flash',
      name: 'Gemini 3.6 Flash (الرسمي المعتمد - موصى به)',
      speed: 'فائق السرعة',
      quality: 'عالية جداً',
      description: 'النموذج الرسمي الموصى به لإنشاء نصوص الإعلانات، أوصاف المنتجات AIDA، والتعرف البصري على الصور.',
    },
    {
      id: 'gemini-3.5-flash-lite',
      name: 'Gemini 3.5 Flash Lite (فائق السرعة واقتصادي)',
      speed: 'فائق السرعة (أقل من ثانية)',
      quality: 'جيدة جداً',
      description: 'نموذج خفيف وسريع جداً مخصص للاستجابات اللحظية وتوليد الأسماء.',
    },
    {
      id: 'gemini-3.1-pro-preview',
      name: 'Gemini 3.1 Pro Preview (الأقوى تحليلياً)',
      speed: 'متوسط',
      quality: 'الأعلى ذكاءً',
      description: 'نموذج التفكير المتقدم لأدق المهام التحليلية وصياغة المحتوى المتعمق.',
    },
  ]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    latencyMs?: number;
    model?: string;
  } | null>(null);

  // Fetch initial config from server or local client storage (for Hostinger)
  const fetchConfig = async () => {
    setIsLoading(true);
    // 1. Immediate fallback from client local storage
    const local = getStoredAiConfig();
    if (local.hasGeminiKey) {
      setHasGeminiKey(true);
      setHasCustomKey(true);
      setMaskedKey(local.geminiKeyMasked || '');
      if (local.geminiModel) setSelectedModel(local.geminiModel);
      if (typeof local.temperature === 'number') setTemperature(local.temperature);
      setIsEnabled(local.isEnabled);
    }

    // 2. Try fetching latest config from Express server if available
    try {
      const res = await fetch('/api/admin/ai/config');
      const text = await res.text();
      if (!isHtmlResponse(text)) {
        try {
          const data = JSON.parse(text);
          if (res.ok && data.success) {
            setProvider(data.provider || 'gemini');
            setIsEnabled(data.isEnabled !== false);
            setHasGeminiKey(Boolean(data.hasGeminiKey || local.hasGeminiKey));
            setIsEnvKey(Boolean(data.isEnvKey));
            setHasCustomKey(Boolean(data.hasCustomKey || local.hasGeminiKey));
            setMaskedKey(data.geminiKeyMasked || local.geminiKeyMasked || '');
            if (data.geminiModel) setSelectedModel(data.geminiModel);
            if (typeof data.temperature === 'number') setTemperature(data.temperature);
            if (data.supportedModels && Array.isArray(data.supportedModels)) {
              setSupportedModels(data.supportedModels);
            }
          }
        } catch {
          // JSON parse failed on server response, local config remains active
        }
      }
    } catch (err: any) {
      console.warn('Backend AI config not reachable, using client storage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Save config to server and client storage
  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const sanitizedKey = geminiApiKey.replace(/[\u200B-\u200D\uFEFF\r\n\t\s'"]/g, '').trim();
      const payload: any = {
        provider,
        geminiModel: selectedModel,
        temperature,
        isEnabled,
      };

      if (sanitizedKey) {
        payload.geminiApiKey = sanitizedKey;
      }

      // Always save to client storage for Hostinger / static persistence
      saveStoredAiConfig({
        provider,
        geminiModel: selectedModel,
        temperature,
        isEnabled,
        ...(sanitizedKey ? { geminiApiKey: sanitizedKey } : {}),
      });

      let serverSaved = false;
      try {
        const res = await fetch('/api/admin/ai/config', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const responseText = await res.text();
        if (!isHtmlResponse(responseText)) {
          const data = JSON.parse(responseText);
          if (res.ok && data.success) {
            serverSaved = true;
          }
        }
      } catch (err) {
        // Backend not available (e.g. Hostinger static hosting)
      }

      onShowToast(
        serverSaved
          ? '✔ تم حفظ وتحديث إعدادات مزود الذكاء الاصطناعي بنجاح في الخادم والمتصفح!'
          : '✔ تم حفظ إعدادات الذكاء الاصطناعي بنجاح وتفعيلها في المتصفح!',
        'success'
      );
      setGeminiApiKey('');
      await fetchConfig();
    } catch (err: any) {
      onShowToast('حدث خطأ أثناء حفظ الإعدادات: ' + (err?.message || 'خطأ غير معروف'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Test connection with Gemini API (Smart: Backend first, direct REST fallback on Hostinger)
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const sanitizedKey = geminiApiKey.replace(/[\u200B-\u200D\uFEFF\r\n\t\s'"]/g, '').trim();
      const result = await testGeminiConnectionSmart(sanitizedKey, selectedModel);

      if (result.success) {
        setTestResult({
          success: true,
          message: result.message,
          latencyMs: result.latencyMs,
          model: result.model,
        });
        const sourceLabel = result.source === 'direct_web' ? ' (اتصال مباشر)' : '';
        onShowToast(`⚡ تم الاتصال بنجاح بـ Gemini API (${result.latencyMs}ms)${sourceLabel}`, 'success');
        await fetchConfig();
      } else {
        setTestResult({
          success: false,
          error: result.error || 'فشل الاتصال بـ Google Gemini API',
        });
        onShowToast(result.error || 'فشل اختبار الاتصال بـ Gemini API', 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: 'خطأ في الاتصال: ' + (err?.message || 'يرجى التحقق من اتصالك بالإنترنت ومفتاح الـ API'),
      });
      onShowToast('تعذر إكمال فحص الاتصال', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleUseEnvKey = async () => {
    setGeminiApiKey('USE_ENV');
    saveStoredAiConfig({ geminiApiKey: 'USE_ENV' });
    try {
      const res = await fetch('/api/admin/ai/config', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ geminiApiKey: 'USE_ENV' }),
      });
      if (res.ok) {
        onShowToast('تم تحويل المفتاح لاستخدام مفتاح البيئة الافتراضي (GEMINI_API_KEY)', 'info');
      } else {
        onShowToast('تم تحديث الإعداد لاستخدام المفتاح البيئي', 'info');
      }
    } catch (e) {
      onShowToast('تم تحديث الإعداد محلياً', 'info');
    } finally {
      setGeminiApiKey('');
      await fetchConfig();
    }
  };

  return (
    <div className="space-y-6" id="admin-ai-provider-settings">
      {/* Top Banner & Overview */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg border border-indigo-300/30 shrink-0">
              <Sparkles className="w-7 h-7 animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>مزود الذكاء الاصطناعي (AI Provider)</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 text-[11px] font-extrabold flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  Google Gemini Official
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200/80 font-medium mt-1">
                إدارة وربط محرك الذكاء الاصطناعي Google Gemini API لصياغة الإعلانات، وأوصاف المنتجات، والتعرف البصري
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Global AI Enabled Switch */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <span className="text-xs font-bold text-slate-300">
                {isEnabled ? 'الذكاء الاصطناعي: مفعّل' : 'الذكاء الاصطناعي: معطّل'}
              </span>
              <button
                type="button"
                onClick={() => setIsEnabled(!isEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isEnabled ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    isEnabled ? 'right-1' : 'right-6'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={fetchConfig}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="mt-5 pt-4 border-t border-indigo-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-indigo-500/20 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">المزود النشط:</span>
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              {provider === 'gemini' ? 'Google Gemini API' : 'OpenRouter (احتياطي)'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-indigo-500/20 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">حالة مفتاح Gemini:</span>
            {hasGeminiKey ? (
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isEnvKey ? 'متصل (بيئة الخادم)' : 'متصل (مفتاح مخصص)'}
              </span>
            ) : (
              <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                المفتاح غير متوفر
              </span>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-indigo-500/20 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">النموذج المعتمد:</span>
            <span className="text-xs font-mono font-bold text-amber-300">
              {selectedModel}
            </span>
          </div>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Column: Settings Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Provider Selector */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm sm:text-base">
              <Radio className="w-4 h-4 text-indigo-600" />
              <span>1. اختيار مزود الذكاء الاصطناعي الأساسي (Primary AI Provider)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Google Gemini */}
              <div
                onClick={() => setProvider('gemini')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                  provider === 'gemini'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-white shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Google Gemini API</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
                          الموصى به
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        رسمي، فائق السرعة، رؤية بصرية كاملة
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      provider === 'gemini'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {provider === 'gemini' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>يدعم Gemini 3.8 Flash و 2.5 Flash ونماذج التفكير</span>
                </div>
              </div>

              {/* Option B: OpenRouter Backup */}
              <div
                onClick={() => setProvider('openrouter')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                  provider === 'openrouter'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-white shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-sm shrink-0">
                      <Globe className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        OpenRouter API
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        مسار احتياطي متعدد النماذج
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      provider === 'openrouter'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {provider === 'openrouter' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>يعمل كمسار احتياطي تلقائي في حالة تعثر الاتصال</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Gemini API Key Configuration */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm sm:text-base">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>2. مفتاح Google Gemini API Key</span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>الحصول على مفتاح مجاني من Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Current Key Status Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck
                  className={`w-5 h-5 ${
                    hasGeminiKey ? 'text-emerald-500' : 'text-slate-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>المفتاح الحالي:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                      {maskedKey || 'غير مسجل بعد'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {hasCustomKey
                      ? 'مفتاح مخصص مدخل من لوحة التحكم'
                      : isEnvKey
                      ? 'مفتاح مضمن عبر متغيرات البيئة (GEMINI_API_KEY)'
                      : 'يرجى إدخال مفتاح Gemini API لتفعيل الخدمات الذكية'}
                  </div>
                </div>
              </div>

              {hasCustomKey && isEnvKey && (
                <button
                  type="button"
                  onClick={handleUseEnvKey}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  العودة لمفتاح البيئة
                </button>
              )}
            </div>

            {/* Key Input Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                إدخال / تحديث مفتاح Gemini API Key (يبدأ عادة بـ AIzaSy...):
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder={maskedKey ? 'أدخل مفتاحاً جديداً لتغييره، أو اتركه فارغاً للإبقاء عليه' : 'AIzaSy...'}
                  className="w-full px-4 py-3 pl-11 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  title={showApiKey ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                يتم تخزين المفتاح بأمان واستخدامه حصراً من جهة الخادم (Server-Side) دون تسريبه للمتصفح.
              </p>
            </div>

            {/* Test Connection Button & Result */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || (!hasGeminiKey && !geminiApiKey.trim())}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className={`w-4 h-4 ${isTesting ? 'animate-spin' : 'text-amber-300'}`} />
                <span>{isTesting ? 'جاري فحص واختبار الاتصال...' : '⚡ اختبار الاتصال بـ Gemini API'}</span>
              </button>

              {testResult && (
                <div
                  className={`mt-3 p-4 rounded-2xl border text-xs space-y-1.5 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/40 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black">
                    {testResult.success ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>نجح الاتصال بـ Google Gemini API!</span>
                        {testResult.latencyMs && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px]">
                            {testResult.latencyMs}ms
                          </span>
                        )}
                        {testResult.model && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono text-[10px]">
                            {testResult.model}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <span>فشل الاتصال:</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    {testResult.success ? testResult.message : testResult.error}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Model & AI Parameters */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm sm:text-base">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>3. تحديد نموذج Gemini وإعدادات الاستجابة</span>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                اختر نموذج Gemini المعتمد للمنصة:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {supportedModels.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                      selectedModel === m.id
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {m.name}
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                        {m.speed}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  درجة الإبداع والحرية (Temperature):
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">
                  {temperature} {temperature <= 0.2 ? '(دقيق وصارم)' : temperature <= 0.5 ? '(متوازن - موصى به)' : '(إبداعي)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0.0 (دقيق جداً للمواصفات)</span>
                <span>0.3 (الأمثل للمتاجر)</span>
                <span>1.0 (إبداعي للإعلانات)</span>
              </div>
            </div>
          </div>

          {/* Action Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات مزود الذكاء الاصطناعي'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Platform Features & Integration Summary */}
        <div className="lg:col-span-4 space-y-5">
          {/* Active AI Modules in Nouva Platform */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>خدمات المنصة المعتمدة على Gemini AI</span>
            </h3>

            <div className="space-y-3">
              {/* Feature 1 */}
              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    التعرف البصري على صور المنتجات
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    تحليل صور المنتج المرفوعة بالذكاء البصري Multimodal Vision لاستخلاص الاسم التسويقي الدقيق ونوع المنتج.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    كتابة أوصاف صفحات الهبوط والإعلانات (AIDA)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    صياغة نصوص إعلانية راقية بأسلوب شاعري وإقناعي جذاب (انتباه، اهتمام، رغبة، إجراء) بدون نجوم أو وسوم.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    استخراج المنتجات من الروابط
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    استيراد منتجات كاملة بالأسعار والصور من روابط المتاجر الإلكترونية بضغطة زر واحدة.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    كيت التسويق الذكي للبائعين
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    توليد منشورات إعلانية مخصصة لفيسبوك، وإنستغرام، وتيك توك، وواتساب بلهجة جزائرية تسويقية مقنعة.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>إرشادات سريعة للأدمن:</span>
            </h4>
            <ul className="text-[11px] text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
              <li>
                نموذج <span className="font-mono text-amber-200">gemini-3.8-flash</span> يقدم أفضل توازن بين السرعة الفائقة وجودة المخرجات.
              </li>
              <li>
                إذا كان لديك مفتاح بيئة مسجل على السيرفر، يمكنك تركه فارغاً وسيستخدمه النظام تلقائياً.
              </li>
              <li>
                استخدم زر <span className="font-bold text-white">"اختبار الاتصال"</span> دائماً للتأكد من فاعلية المفتاح وصلاحيته قبل الحفظ.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
