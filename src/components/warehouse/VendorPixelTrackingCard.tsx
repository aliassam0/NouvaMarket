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
} from 'lucide-react';
import { SupplierProfile } from '../../types';
import {
  verifyPixelApi,
  verifyAllPixelsApi,
  initMetaPixel,
  initTikTokPixel,
  initSnapchatPixel,
  trackPixelPageView,
  trackPixelViewContent,
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

interface VendorPixelTrackingCardProps {
  supplierProfile: SupplierProfile;
  onUpdateProfile: (updates: Partial<SupplierProfile>) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function VendorPixelTrackingCard({
  supplierProfile,
  onUpdateProfile,
  onShowToast,
}: VendorPixelTrackingCardProps) {
  const [metaPixelId, setMetaPixelId] = useState(supplierProfile.metaPixelId || '');
  const [tiktokPixelId, setTiktokPixelId] = useState(supplierProfile.tiktokPixelId || '');
  const [snapchatPixelId, setSnapchatPixelId] = useState(supplierProfile.snapchatPixelId || '');
  const [isSavingPixels, setIsSavingPixels] = useState(false);
  const [isCheckingAll, setIsCheckingAll] = useState(false);

  const [metaStatus, setMetaStatus] = useState<PixelStatusItem>({
    status: supplierProfile.metaPixelId ? 'checking' : 'inactive',
    active: false,
    message: supplierProfile.metaPixelId ? 'جاري فحص استجابة الـ API...' : 'معطل (لم يتم إدخال معرّف)',
  });

  const [tiktokStatus, setTiktokStatus] = useState<PixelStatusItem>({
    status: supplierProfile.tiktokPixelId ? 'checking' : 'inactive',
    active: false,
    message: supplierProfile.tiktokPixelId ? 'جاري فحص استجابة الـ API...' : 'معطل (لم يتم إدخال معرّف)',
  });

  const [snapchatStatus, setSnapchatStatus] = useState<PixelStatusItem>({
    status: supplierProfile.snapchatPixelId ? 'checking' : 'inactive',
    active: false,
    message: supplierProfile.snapchatPixelId ? 'جاري فحص استجابة الـ API...' : 'معطل (لم يتم إدخال معرّف)',
  });

  // Keep inputs synced when supplierProfile changes externally
  useEffect(() => {
    if (supplierProfile.metaPixelId !== undefined) {
      setMetaPixelId(supplierProfile.metaPixelId);
    }
  }, [supplierProfile.metaPixelId]);

  useEffect(() => {
    if (supplierProfile.tiktokPixelId !== undefined) {
      setTiktokPixelId(supplierProfile.tiktokPixelId);
    }
  }, [supplierProfile.tiktokPixelId]);

  useEffect(() => {
    if (supplierProfile.snapchatPixelId !== undefined) {
      setSnapchatPixelId(supplierProfile.snapchatPixelId);
    }
  }, [supplierProfile.snapchatPixelId]);

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

    setStatus((prev) => ({ ...prev, status: 'checking' }));
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
        metaPixelId: metaPixelId.trim(),
        tiktokPixelId: tiktokPixelId.trim(),
        snapchatPixelId: snapchatPixelId.trim(),
      });

      setMetaStatus({
        status: res.meta.active ? 'active' : 'inactive',
        active: res.meta.active,
        message: res.meta.message,
        statusCode: res.meta.statusCode,
      });
      setTiktokStatus({
        status: res.tiktok.active ? 'active' : 'inactive',
        active: res.tiktok.active,
        message: res.tiktok.message,
        statusCode: res.tiktok.statusCode,
      });
      setSnapchatStatus({
        status: res.snapchat.active ? 'active' : 'inactive',
        active: res.snapchat.active,
        message: res.snapchat.message,
        statusCode: res.snapchat.statusCode,
      });

      onShowToast(`تم فحص استجابة الـ API للبيكسلات: ${res.activeCount} من 3 نشطة`, 'info');
    } catch {
      onShowToast('تم تحديث فحص البيكسلات', 'info');
    } finally {
      setIsCheckingAll(false);
    }
  };

  // Debounced checks on input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleCheckSinglePixel('meta', metaPixelId);
    }, 600);
    return () => clearTimeout(timer);
  }, [metaPixelId]);

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
    const updates = {
      metaPixelId: metaPixelId.trim(),
      tiktokPixelId: tiktokPixelId.trim(),
      snapchatPixelId: snapchatPixelId.trim(),
    };
    onUpdateProfile(updates);

    try {
      await handleCheckAllPixels();
    } catch {}
    setIsSavingPixels(false);
    onShowToast('✅ تم حفظ إعدادات البيكسل للبائع والتحقق من استجابة الـ API بنجاح!', 'success');
  };

  const handleFireTestEvent = (platform: 'meta' | 'tiktok' | 'snapchat') => {
    const pId =
      platform === 'meta'
        ? metaPixelId.trim()
        : platform === 'tiktok'
        ? tiktokPixelId.trim()
        : snapchatPixelId.trim();

    if (!pId) {
      onShowToast('يرجى إدخال معرّف البيكسل أولاً وحفظه لإرسال حدث تجريبي', 'error');
      return;
    }

    try {
      if (platform === 'meta') {
        initMetaPixel(pId);
        trackPixelPageView();
        trackPixelViewContent({
          productId: 'test-item-vendor',
          productName: 'منتج تجريبي للبائع',
          price: 2500,
        });
      } else if (platform === 'tiktok') {
        initTikTokPixel(pId);
        trackPixelPageView();
      } else {
        initSnapchatPixel(pId);
        trackPixelPageView();
      }
      onShowToast(`🎯 تم إرسال حدث اختباري (Test Event) بنجاح لمنصة ${platform.toUpperCase()}!`, 'success');
    } catch {
      onShowToast('حدث خطأ أثناء إرسال الحدث التجريبي', 'error');
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
              تتبع الزيارات وتأكيد المبيعات والطلبيات عبر روابط منتجاتك تلقائياً مع التحقق الحي من استجابة الـ API
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="btn-vendor-verify-all-pixels"
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
            id="btn-vendor-save-pixel-settings"
            type="submit"
            disabled={isSavingPixels}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingPixels ? 'جاري الحفظ...' : 'حفظ إعدادات البيكسل'}</span>
          </button>
        </div>
      </div>

      {/* Main 3 Pixels Inputs */}
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
            <span className="text-[10px] text-slate-400 font-normal">معرّف البيكسل الرقمي (15-16 رقماً)</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                id="input-vendor-meta-pixel-id"
                type="text"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                placeholder="مثال: 128495029482710"
                className={`w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-white font-mono text-left dir-ltr placeholder:text-slate-400 placeholder:text-right transition ${
                  metaStatus.status === 'checking'
                    ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/10'
                    : metaStatus.active
                    ? 'border-emerald-500/80 dark:border-emerald-600 ring-2 ring-emerald-500/10'
                    : metaPixelId.trim()
                    ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0 justify-between sm:justify-end">
              <PixelStatusBadge
                id="vendor-status-badge-meta-pixel"
                status={metaStatus.status}
                active={metaStatus.active}
                message={metaStatus.message}
                statusCode={metaStatus.statusCode}
              />
              <button
                type="button"
                onClick={() => handleCheckSinglePixel('meta', metaPixelId)}
                disabled={metaStatus.status === 'checking'}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50 shrink-0"
                title="إعادة فحص استجابة الـ API"
              >
                <Activity className="w-3 h-3 text-indigo-500" />
                <span>إعادة فحص</span>
              </button>
              <button
                type="button"
                onClick={() => handleFireTestEvent('meta')}
                className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 border border-blue-200 dark:border-blue-800"
                title="إرسال حدث PageView تجريبي للتحقق من وصول الإشارات"
              >
                <Send className="w-3 h-3" />
                <span>حدث تجريبي</span>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-normal">
            تجد المعرّف في: Meta Events Manager &gt; Settings &gt; Dataset / Pixel ID.
          </p>
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
            <span className="text-[10px] text-slate-400 font-normal">TikTok Pixel ID (حروف وأرقام)</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                id="input-vendor-tiktok-pixel-id"
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
                id="vendor-status-badge-tiktok-pixel"
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
                <span>إعادة فحص</span>
              </button>
              <button
                type="button"
                onClick={() => handleFireTestEvent('tiktok')}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 border border-rose-200 dark:border-rose-800"
                title="إرسال حدث تجريبي"
              >
                <Send className="w-3 h-3" />
                <span>حدث تجريبي</span>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-normal">
            تجد المعرّف في: TikTok Ads Manager &gt; Assets &gt; Events &gt; Web Events.
          </p>
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
            <span className="text-[10px] text-slate-400 font-normal">Snap Pixel ID (صيغة UUID)</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                id="input-vendor-snapchat-pixel-id"
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
                id="vendor-status-badge-snapchat-pixel"
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
                <span>إعادة فحص</span>
              </button>
              <button
                type="button"
                onClick={() => handleFireTestEvent('snapchat')}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 border border-amber-200 dark:border-amber-800"
                title="إرسال حدث تجريبي"
              >
                <Send className="w-3 h-3" />
                <span>حدث تجريبي</span>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-normal">
            تجد المعرّف في: Snap Ads Manager &gt; Events Manager &gt; Pixel Code.
          </p>
        </div>
      </div>

      {/* Auto-Tracking Events Pipeline Info Card */}
      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 text-xs space-y-2">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-black">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>الأحداث التي يتم تعقبها تلقائياً عند زيارة واستخدام روابط منتجاتك (Automatic Events):</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50">
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block">PageView</span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">زيارة صفحة المنتج</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50">
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">ViewContent</span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">معاينة التفاصيل والسعر</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50">
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 block">InitiateCheckout</span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">بدء تعبئة استمارة الشراء</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50">
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">Purchase</span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">تأكيد الطلبية وقيمتها</span>
          </div>
        </div>
      </div>
    </form>
  );
}
