import React, { useState, useEffect } from 'react';
import {
  Target,
  Activity,
  Save,
  Radio,
  ExternalLink,
  Info,
  Send,
  Loader2,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Terminal,
  Trash2,
} from 'lucide-react';
import { OfficialStoreSettings } from '../../lib/officialStoreConfig';
import {
  verifyPixelApi,
  verifyAllPixelsApi,
  initMetaPixel,
  initTikTokPixel,
  initSnapchatPixel,
  trackPixelPageView,
  trackPixelViewContent,
  simulateTestEvent,
  getPixelLogs,
  clearPixelLogs,
  PixelEventLog,
} from '../../lib/pixelTracker';

interface PixelStatusItem {
  status: 'active' | 'inactive' | 'checking';
  active: boolean;
  message: string;
  statusCode?: number;
  lastChecked?: string;
}

function PixelStatusBadge({
  id,
  status,
  active,
  message,
}: {
  id: string;
  status: 'active' | 'inactive' | 'checking';
  active: boolean;
  message: string;
  statusCode?: number;
}) {
  if (status === 'checking') {
    return (
      <div
        id={id}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs shrink-0"
      >
        <Loader2 className="w-3 h-3 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>جاري الفحص...</span>
      </div>
    );
  }

  if (active) {
    return (
      <div
        id={id}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs shrink-0"
        title={message || 'البيكسل نشط ومستجيب من الـ API'}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span>نشط</span>
        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 font-bold">
          API 200
        </span>
      </div>
    );
  }

  return (
    <div
      id={id}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs shrink-0"
      title={message || 'البيكسل معطل بناءً على استجابة الـ API'}
    >
      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
      <span>معطل</span>
      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200 font-bold">
        API Inactive
      </span>
    </div>
  );
}

interface OfficialStorePixelTrackingCardProps {
  settings: OfficialStoreSettings;
  onSaveSettings: (updates: Partial<OfficialStoreSettings>) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function OfficialStorePixelTrackingCard({
  settings,
  onSaveSettings,
  onShowToast,
}: OfficialStorePixelTrackingCardProps) {
  const [facebookPixelId, setFacebookPixelId] = useState(settings.facebookPixelId || '');
  const [testEventCode, setTestEventCode] = useState(settings.testEventCode || '');
  const [tiktokPixelId, setTiktokPixelId] = useState(settings.tiktokPixelId || '');
  const [snapchatPixelId, setSnapchatPixelId] = useState(settings.snapchatPixelId || '');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(settings.googleAnalyticsId || '');
  const [enablePixelTracking, setEnablePixelTracking] = useState(
    settings.enablePixelTracking !== undefined ? settings.enablePixelTracking : true
  );

  const [isSavingPixels, setIsSavingPixels] = useState(false);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [simulatingEvent, setSimulatingEvent] = useState<string | null>(null);
  const [pixelLogs, setPixelLogs] = useState<PixelEventLog[]>(() => getPixelLogs());

  const [metaStatus, setMetaStatus] = useState<PixelStatusItem>({
    status: settings.facebookPixelId ? 'checking' : 'inactive',
    active: false,
    message: settings.facebookPixelId ? 'جاري فحص استجابة الـ API...' : 'معطل (لم يتم إدخال معرّف البيكسل)',
  });

  const [tiktokStatus, setTiktokStatus] = useState<PixelStatusItem>({
    status: settings.tiktokPixelId ? 'checking' : 'inactive',
    active: false,
    message: settings.tiktokPixelId ? 'جاري فحص استجابة الـ API...' : 'معطل (لم يتم إدخال معرّف البيكسل)',
  });

  const [snapchatStatus, setSnapchatStatus] = useState<PixelStatusItem>({
    status: settings.snapchatPixelId ? 'checking' : 'inactive',
    active: false,
    message: settings.snapchatPixelId ? 'جاري فحص استجابة الـ API...' : 'معطل (لم يتم إدخال معرّف البيكسل)',
  });

  // Sync inputs when settings change from outside
  useEffect(() => {
    if (settings.facebookPixelId !== undefined) setFacebookPixelId(settings.facebookPixelId);
    if (settings.testEventCode !== undefined) setTestEventCode(settings.testEventCode);
    if (settings.tiktokPixelId !== undefined) setTiktokPixelId(settings.tiktokPixelId);
    if (settings.snapchatPixelId !== undefined) setSnapchatPixelId(settings.snapchatPixelId);
    if (settings.googleAnalyticsId !== undefined) setGoogleAnalyticsId(settings.googleAnalyticsId);
    if (settings.enablePixelTracking !== undefined) setEnablePixelTracking(settings.enablePixelTracking);
  }, [
    settings.facebookPixelId,
    settings.testEventCode,
    settings.tiktokPixelId,
    settings.snapchatPixelId,
    settings.googleAnalyticsId,
    settings.enablePixelTracking,
  ]);

  // Listen to pixel event logging stream
  useEffect(() => {
    const handleLog = () => setPixelLogs(getPixelLogs());
    window.addEventListener('nouva_pixel_event_logged', handleLog);
    return () => window.removeEventListener('nouva_pixel_event_logged', handleLog);
  }, []);

  // Handler: check single pixel
  const handleCheckSinglePixel = async (platform: 'meta' | 'tiktok' | 'snapchat', pixelId: string) => {
    const setStatus =
      platform === 'meta' ? setMetaStatus : platform === 'tiktok' ? setTiktokStatus : setSnapchatStatus;

    if (!pixelId.trim()) {
      setStatus({
        status: 'inactive',
        active: false,
        message: 'معطل (لم يتم إدخال معرّف البيكسل)',
        statusCode: 400,
      });
      return;
    }

    setStatus((prev) => ({ ...prev, status: 'checking', message: 'جاري فحص استجابة الـ API...' }));
    try {
      const res = await verifyPixelApi(platform, pixelId);
      setStatus({
        status: res.active ? 'active' : 'inactive',
        active: res.active,
        message: res.message,
        statusCode: res.statusCode,
        lastChecked: new Date().toLocaleTimeString('ar-DZ'),
      });
    } catch {
      setStatus({
        status: 'inactive',
        active: false,
        message: 'خطأ في الاتصال بخادم فحص الـ API',
        statusCode: 500,
      });
    }
  };

  // Handler: check all pixels
  const handleCheckAllPixels = async () => {
    setIsCheckingAll(true);
    setMetaStatus((prev) => ({ ...prev, status: 'checking' }));
    setTiktokStatus((prev) => ({ ...prev, status: 'checking' }));
    setSnapchatStatus((prev) => ({ ...prev, status: 'checking' }));

    try {
      const res = await verifyAllPixelsApi({
        metaPixelId: facebookPixelId.trim(),
        tiktokPixelId: tiktokPixelId.trim(),
        snapchatPixelId: snapchatPixelId.trim(),
      });

      setMetaStatus({
        status: res.meta.active ? 'active' : 'inactive',
        active: res.meta.active,
        message: res.meta.message,
        statusCode: res.meta.statusCode,
        lastChecked: new Date().toLocaleTimeString('ar-DZ'),
      });
      setTiktokStatus({
        status: res.tiktok.active ? 'active' : 'inactive',
        active: res.tiktok.active,
        message: res.tiktok.message,
        statusCode: res.tiktok.statusCode,
        lastChecked: new Date().toLocaleTimeString('ar-DZ'),
      });
      setSnapchatStatus({
        status: res.snapchat.active ? 'active' : 'inactive',
        active: res.snapchat.active,
        message: res.snapchat.message,
        statusCode: res.snapchat.statusCode,
        lastChecked: new Date().toLocaleTimeString('ar-DZ'),
      });

      if (onShowToast) {
        onShowToast(`تم فحص استجابة الـ API للبيكسلات: ${res.activeCount} من 3 نشطة`, 'info');
      }
    } catch {
      if (onShowToast) onShowToast('تم تحديث فحص البيكسلات', 'info');
    } finally {
      setIsCheckingAll(false);
    }
  };

  // Debounced auto-checks on input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleCheckSinglePixel('meta', facebookPixelId);
    }, 600);
    return () => clearTimeout(timer);
  }, [facebookPixelId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleCheckSinglePixel('tiktok', tiktokPixelId);
    }, 600);
    return () => clearTimeout(timer);
  }, [tiktokPixelId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleCheckSinglePixel('snapchat', snapchatPixelId);
    }, 600);
    return () => clearTimeout(timer);
  }, [snapchatPixelId]);

  const handleSavePixels = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPixels(true);
    const updates: Partial<OfficialStoreSettings> = {
      enablePixelTracking,
      facebookPixelId: facebookPixelId.trim(),
      testEventCode: testEventCode.trim(),
      tiktokPixelId: tiktokPixelId.trim(),
      snapchatPixelId: snapchatPixelId.trim(),
      googleAnalyticsId: googleAnalyticsId.trim(),
    };
    onSaveSettings(updates);

    try {
      await handleCheckAllPixels();
    } catch {}
    setIsSavingPixels(false);
    if (onShowToast) {
      onShowToast('✅ تم حفظ إعدادات بيكسل متجر المنصة والتحقق من استجابة الـ API بنجاح!', 'success');
    }
  };

  const handleFireTestEvent = (platform: 'meta' | 'tiktok' | 'snapchat') => {
    const pId =
      platform === 'meta'
        ? facebookPixelId.trim()
        : platform === 'tiktok'
        ? tiktokPixelId.trim()
        : snapchatPixelId.trim();

    if (!pId) {
      if (onShowToast) onShowToast('يرجى إدخال معرّف البيكسل أولاً وحفظه لإرسال حدث تجريبي', 'error');
      return;
    }

    try {
      if (platform === 'meta') {
        initMetaPixel(pId, testEventCode);
        trackPixelPageView();
        trackPixelViewContent({
          productId: 'test-official-item',
          productName: 'منتج تجريبي لمتجر المنصة',
          price: 3500,
        });
      } else if (platform === 'tiktok') {
        initTikTokPixel(pId);
        trackPixelPageView();
      } else {
        initSnapchatPixel(pId);
        trackPixelPageView();
      }
      if (onShowToast) {
        onShowToast(`🎯 تم إرسال حدث اختباري (Test Event) بنجاح لمنصة ${platform.toUpperCase()}!`, 'success');
      }
    } catch {
      if (onShowToast) onShowToast('حدث خطأ أثناء إرسال الحدث التجريبي', 'error');
    }
  };

  const handleSimulate = (ev: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase') => {
    setSimulatingEvent(ev);
    try {
      simulateTestEvent(ev);
      if (onShowToast) onShowToast(`تم إرسال حدث المحاكاة: ${ev}`, 'info');
    } finally {
      setTimeout(() => setSimulatingEvent(null), 400);
    }
  };

  const activeCount = [metaStatus.active, tiktokStatus.active, snapchatStatus.active].filter(Boolean).length;

  return (
    <form
      onSubmit={handleSavePixels}
      className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 text-right"
    >
      {/* Top Header & Fast Action Buttons */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2 flex-wrap">
              <span>ربط بيكسل وسائل التواصل الاجتماعي (PIXEL TRACKING)</span>
              {activeCount > 0 ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{activeCount} نشط من 3</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>معطل (0 نشط)</span>
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              تتبع الزيارات وتأكيد المبيعات تلقائياً مع التحقق الحي من استجابة الـ API لكل منصة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="btn-official-verify-all-pixels"
            type="button"
            onClick={handleCheckAllPixels}
            disabled={isCheckingAll}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition disabled:opacity-50"
            title="فحص استجابة الـ API لجميع البيكسلات في آن واحد"
          >
            <Activity className={`w-3.5 h-3.5 ${isCheckingAll ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>{isCheckingAll ? 'جاري الفحص...' : 'فحص استجابة الـ API'}</span>
          </button>
          <button
            id="btn-official-save-pixel-settings"
            type="submit"
            disabled={isSavingPixels}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingPixels ? 'جاري الحفظ...' : 'حفظ إعدادات البيكسل'}</span>
          </button>
        </div>
      </div>

      {/* Main Pixels Inputs */}
      <div className="space-y-3.5 text-xs font-bold">
        {/* 1. Meta Pixel (Facebook & Instagram) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Radio className="w-4 h-4" />
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                Meta Pixel (Facebook & Instagram)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">معرّف البيكسل الرقمي</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                id="input-official-meta-pixel-id"
                type="text"
                value={facebookPixelId}
                onChange={(e) => setFacebookPixelId(e.target.value)}
                placeholder="مثال: 128495029482710"
                className={`w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-white font-mono text-left dir-ltr placeholder:text-slate-400 placeholder:text-right transition ${
                  metaStatus.status === 'checking'
                    ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/10'
                    : metaStatus.active
                    ? 'border-emerald-500/80 dark:border-emerald-600 ring-2 ring-emerald-500/10'
                    : facebookPixelId.trim()
                    ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0 justify-between sm:justify-end">
              <PixelStatusBadge
                id="official-status-badge-meta-pixel"
                status={metaStatus.status}
                active={metaStatus.active}
                message={metaStatus.message}
                statusCode={metaStatus.statusCode}
              />
              <button
                type="button"
                onClick={() => handleCheckSinglePixel('meta', facebookPixelId)}
                disabled={metaStatus.status === 'checking'}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50 shrink-0"
                title="إعادة فحص استجابة الـ API"
              >
                <Activity className="w-3 h-3 text-indigo-500" />
                <span>فحص</span>
              </button>
              <button
                type="button"
                onClick={() => handleFireTestEvent('meta')}
                className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 border border-blue-200 dark:border-blue-800"
                title="إرسال حدث تجريبي"
              >
                <Send className="w-3 h-3" />
                <span>تجربة</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5 text-[11px] font-medium">
              {metaStatus.status === 'checking' ? (
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>جاري فحص استجابة الـ API من خوادم Meta...</span>
                </span>
              ) : metaStatus.active ? (
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{metaStatus.message}</span>
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{metaStatus.message}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="text-slate-400">الأحداث المفعّلة:</span>
              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                PageView
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                ViewContent
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                InitiateCheckout
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                Purchase (DZD)
              </span>
            </div>
          </div>

          {/* Test Event Code for Meta Events Manager */}
          <div className="pt-1.5">
            <input
              type="text"
              placeholder="Test Event Code (اختياري - للاختبار في Meta Test Events Manager)"
              value={testEventCode}
              onChange={(e) => setTestEventCode(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-600 dark:text-slate-300"
            />
          </div>
        </div>

        {/* 2. TikTok Pixel */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Radio className="w-4 h-4" />
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                TikTok Pixel
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">TikTok Pixel ID</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                id="input-official-tiktok-pixel-id"
                type="text"
                value={tiktokPixelId}
                onChange={(e) => setTiktokPixelId(e.target.value)}
                placeholder="مثال: C5ABC123DEF456789GHI"
                className={`w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-white font-mono text-left dir-ltr placeholder:text-slate-400 placeholder:text-right transition ${
                  tiktokStatus.status === 'checking'
                    ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/10'
                    : tiktokStatus.active
                    ? 'border-emerald-500/80 dark:border-emerald-600 ring-2 ring-emerald-500/10'
                    : tiktokPixelId.trim()
                    ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0 justify-between sm:justify-end">
              <PixelStatusBadge
                id="official-status-badge-tiktok-pixel"
                status={tiktokStatus.status}
                active={tiktokStatus.active}
                message={tiktokStatus.message}
                statusCode={tiktokStatus.statusCode}
              />
              <button
                type="button"
                onClick={() => handleCheckSinglePixel('tiktok', tiktokPixelId)}
                disabled={tiktokStatus.status === 'checking'}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50 shrink-0"
                title="إعادة فحص استجابة الـ API"
              >
                <Activity className="w-3 h-3 text-indigo-500" />
                <span>فحص</span>
              </button>
              <button
                type="button"
                onClick={() => handleFireTestEvent('tiktok')}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 border border-rose-200 dark:border-rose-800"
                title="إرسال حدث تجريبي"
              >
                <Send className="w-3 h-3" />
                <span>تجربة</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5 text-[11px] font-medium">
              {tiktokStatus.status === 'checking' ? (
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>جاري فحص استجابة الـ API من خوادم TikTok...</span>
                </span>
              ) : tiktokStatus.active ? (
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{tiktokStatus.message}</span>
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{tiktokStatus.message}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="text-slate-400">الأحداث المفعّلة:</span>
              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono">
                page
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono">
                ViewContent
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono">
                InitiateCheckout
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                PlaceAnOrder & CompletePayment
              </span>
            </div>
          </div>
        </div>

        {/* 3. Snapchat Pixel */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Radio className="w-4 h-4" />
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                Snapchat Pixel
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Snap Pixel ID</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                id="input-official-snapchat-pixel-id"
                type="text"
                value={snapchatPixelId}
                onChange={(e) => setSnapchatPixelId(e.target.value)}
                placeholder="مثال: 9c2b4e8a-1234-5678-abcd-0123456789ab"
                className={`w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-white font-mono text-left dir-ltr placeholder:text-slate-400 placeholder:text-right transition ${
                  snapchatStatus.status === 'checking'
                    ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/10'
                    : snapchatStatus.active
                    ? 'border-emerald-500/80 dark:border-emerald-600 ring-2 ring-emerald-500/10'
                    : snapchatPixelId.trim()
                    ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0 justify-between sm:justify-end">
              <PixelStatusBadge
                id="official-status-badge-snapchat-pixel"
                status={snapchatStatus.status}
                active={snapchatStatus.active}
                message={snapchatStatus.message}
                statusCode={snapchatStatus.statusCode}
              />
              <button
                type="button"
                onClick={() => handleCheckSinglePixel('snapchat', snapchatPixelId)}
                disabled={snapchatStatus.status === 'checking'}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50 shrink-0"
                title="إعادة فحص استجابة الـ API"
              >
                <Activity className="w-3 h-3 text-indigo-500" />
                <span>فحص</span>
              </button>
              <button
                type="button"
                onClick={() => handleFireTestEvent('snapchat')}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 border border-amber-200 dark:border-amber-800"
                title="إرسال حدث تجريبي"
              >
                <Send className="w-3 h-3" />
                <span>تجربة</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5 text-[11px] font-medium">
              {snapchatStatus.status === 'checking' ? (
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>جاري فحص استجابة الـ API من خوادم Snapchat...</span>
                </span>
              ) : snapchatStatus.active ? (
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{snapchatStatus.message}</span>
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{snapchatStatus.message}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="text-slate-400">الأحداث المفعّلة:</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
                PAGE_VIEW
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
                VIEW_CONTENT
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
                START_CHECKOUT
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                PURCHASE (DZD)
              </span>
            </div>
          </div>
        </div>

        {/* 4. Google Analytics GA4 */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Radio className="w-4 h-4" />
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                Google Analytics (GA4 / GTM)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Measurement ID (G-XXXXXXXX)</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={googleAnalyticsId}
              onChange={(e) => setGoogleAnalyticsId(e.target.value)}
              placeholder="مثال: G-ABCDEF1234"
              className="w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-left dir-ltr placeholder:text-slate-400 placeholder:text-right"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
            <span className="text-slate-400">الأحداث المفعّلة:</span>
            <span className="px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-mono">
              page_view
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-mono">
              view_item
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-mono">
              add_to_cart
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-mono">
              begin_checkout
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
              purchase
            </span>
          </div>
        </div>
      </div>

      {/* Pixel Live Test Simulator */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-emerald-600" />
            <span>محاكي إرسال الأحداث وتدفق الإشارات (Live Diagnostics)</span>
          </span>
          <button
            type="button"
            onClick={() => clearPixelLogs()}
            className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 cursor-pointer transition"
          >
            <Trash2 className="w-3 h-3" />
            <span>مسح السجل</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'] as const).map((ev) => (
            <button
              key={ev}
              type="button"
              onClick={() => handleSimulate(ev)}
              disabled={Boolean(simulatingEvent)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Zap className={`w-3 h-3 ${simulatingEvent === ev ? 'animate-bounce text-amber-400' : 'text-amber-500'}`} />
              <span>{ev}</span>
            </button>
          ))}
        </div>

        {/* Events log stream */}
        <div className="max-h-36 overflow-y-auto space-y-1 pt-1 font-mono text-[11px] border-t border-slate-200/60 dark:border-slate-700/60">
          {pixelLogs.length === 0 ? (
            <div className="text-[11px] text-slate-400 py-1 text-center">لا توجد أحداث مسجلة بعد. اضغط على أي زر أعلاه لاختبار الإرسال.</div>
          ) : (
            pixelLogs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓ {log.eventName}</span>
                  <span className="text-[10px] text-slate-400">({log.platform})</span>
                </div>
                <span className="text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleTimeString('ar-DZ')}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Explanatory footer banner requested by user */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 text-xs space-y-1.5">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-black">
          <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>كيف يعمل التتبع التلقائي والتحقق من الـ API؟</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          بمجرد إدخال معرّفات البيكسل، يقوم النظام بالاتصال بنقاط نهاية الـ API الخاصة بكل منصة للتحقق الفوري من استجابتها وظهور شارة الحالة (نشط / معطل). عند حفظ الإعدادات، يتم تفعيل التتبع في كافة روابط المنتجات ليرسل إشعارات الشراء (Purchase) وتأكيد الطلبات بدقة.
        </p>
      </div>
    </form>
  );
}
