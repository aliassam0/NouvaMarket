import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  Link as LinkIcon,
  ShoppingBag,
  ExternalLink,
  ArrowLeft,
  RotateCcw,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getProductShareLinks } from '../../utils/shareUtils';

interface MarketerChecklistProps {
  marketedProducts: Product[];
  onNavigateTab?: (tab: string) => void;
  onOpenShareModal?: (product: Product) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function MarketerChecklist({
  marketedProducts,
  onNavigateTab,
  onOpenShareModal,
  onShowToast,
}: MarketerChecklistProps) {
  const { user } = useAuth();
  const { language } = useLanguage();

  const storageKeyPrefix = `nouvamarket_checklist_${user?.id || 'guest'}`;

  // Local storage states
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem(`${storageKeyPrefix}_collapsed`) === 'true';
  });

  const [testOrderDone, setTestOrderDone] = useState(() => {
    return localStorage.getItem(`${storageKeyPrefix}_test_order_done`) === 'true';
  });

  const [manualOverrides, setManualOverrides] = useState<{
    pixel?: boolean;
    link?: boolean;
    testOrder?: boolean;
  }>(() => {
    try {
      const stored = localStorage.getItem(`${storageKeyPrefix}_overrides`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Keep collapsed state in localStorage
  useEffect(() => {
    localStorage.setItem(`${storageKeyPrefix}_collapsed`, String(isCollapsed));
  }, [isCollapsed, storageKeyPrefix]);

  // Keep overrides in localStorage
  useEffect(() => {
    localStorage.setItem(`${storageKeyPrefix}_overrides`, JSON.stringify(manualOverrides));
  }, [manualOverrides, storageKeyPrefix]);

  // Keep test order done state in localStorage
  useEffect(() => {
    localStorage.setItem(`${storageKeyPrefix}_test_order_done`, String(testOrderDone));
  }, [testOrderDone, storageKeyPrefix]);

  // 1. Pixel evaluation
  const autoHasPixel = Boolean(
    user?.metaPixelId?.trim() ||
    user?.tiktokPixelId?.trim() ||
    user?.snapchatPixelId?.trim()
  );
  const isPixelDone = manualOverrides.pixel !== undefined ? manualOverrides.pixel : autoHasPixel;

  const activePixels: string[] = [];
  if (user?.metaPixelId?.trim()) activePixels.push('Meta');
  if (user?.tiktokPixelId?.trim()) activePixels.push('TikTok');
  if (user?.snapchatPixelId?.trim()) activePixels.push('Snapchat');

  // 2. First link evaluation
  const autoHasLink = marketedProducts.length > 0;
  const isLinkDone = manualOverrides.link !== undefined ? manualOverrides.link : autoHasLink;

  // 3. Test order evaluation
  const isTestOrderDone = manualOverrides.testOrder !== undefined ? manualOverrides.testOrder : testOrderDone;

  // Calculate completion
  const completedCount = [isPixelDone, isLinkDone, isTestOrderDone].filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 3) * 100);

  // Toggle handlers
  const handleTogglePixel = () => {
    const nextVal = !isPixelDone;
    setManualOverrides((prev) => ({ ...prev, pixel: nextVal }));
    if (onShowToast) {
      onShowToast(
        nextVal
          ? 'تم تحديد خطوة "ربط البيكسل" كمكتملة'
          : 'تم إلغاء تحديد خطوة "ربط البيكسل"',
        'info'
      );
    }
  };

  const handleToggleLink = () => {
    const nextVal = !isLinkDone;
    setManualOverrides((prev) => ({ ...prev, link: nextVal }));
    if (onShowToast) {
      onShowToast(
        nextVal
          ? 'تم تحديد خطوة "إنشاء أول رابط" كمكتملة'
          : 'تم إلغاء تحديد خطوة "إنشاء أول رابط"',
        'info'
      );
    }
  };

  const handleToggleTestOrder = () => {
    const nextVal = !isTestOrderDone;
    setTestOrderDone(nextVal);
    setManualOverrides((prev) => ({ ...prev, testOrder: nextVal }));
    if (onShowToast) {
      onShowToast(
        nextVal
          ? 'تم تحديد خطوة "تجربة صفحة الطلب" كمكتملة'
          : 'تم إلغاء تحديد خطوة "تجربة صفحة الطلب"',
        'info'
      );
    }
  };

  // Reset checklist to live evaluated state
  const handleResetChecklist = () => {
    setManualOverrides({});
    setTestOrderDone(false);
    localStorage.removeItem(`${storageKeyPrefix}_overrides`);
    localStorage.removeItem(`${storageKeyPrefix}_test_order_done`);
    if (onShowToast) {
      onShowToast('تمت إعادة مزامنة قائمة التحقق مع بيانات حسابك الحالية', 'info');
    }
  };

  // Launch test order page
  const handleLaunchTestOrder = () => {
    let targetProduct: Product | undefined;
    let targetLinkId = 'link-default';

    if (marketedProducts.length > 0) {
      targetProduct = marketedProducts[0];
      const links = getProductShareLinks(targetProduct.id, targetProduct.suggestedSellingPrice || targetProduct.wholesalePrice + 1000);
      const activeLink = links.find((l) => l.active) || links[0];
      if (activeLink) targetLinkId = activeLink.id;
    }

    if (!targetProduct) {
      if (onShowToast) {
        onShowToast('يرجى إنشاء أول رابط تسويقي أولاً لتجربة صفحة الطلب الخاصة بك', 'error');
      }
      if (onNavigateTab) {
        onNavigateTab('produits');
      }
      return;
    }

    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const sellerParams = user
      ? `&sellerId=${encodeURIComponent(user.id)}&sellerName=${encodeURIComponent(user.storeName || user.fullName || '')}&sellerPhone=${encodeURIComponent(user.phone || '')}&sellerEmail=${encodeURIComponent(user.email || '')}`
      : '';
    const pixelParams = user
      ? `${user.metaPixelId ? `&fbPixel=${encodeURIComponent(user.metaPixelId)}` : ''}${user.tiktokPixelId ? `&ttPixel=${encodeURIComponent(user.tiktokPixelId)}` : ''}${user.snapchatPixelId ? `&snapPixel=${encodeURIComponent(user.snapchatPixelId)}` : ''}`
      : '';

    const shareUrl = `${origin}${pathname}?share=${targetProduct.id}&linkId=${targetLinkId}${sellerParams}${pixelParams}`;

    // Mark as tested
    setTestOrderDone(true);
    setManualOverrides((prev) => ({ ...prev, testOrder: true }));

    // Open link in new tab
    window.open(shareUrl, '_blank');

    if (onShowToast) {
      onShowToast(
        '🚀 تم فتح صفحة الطلب للتجربة في نافذة جديدة! تحقق من استمارة الطلب وعروض Upsell.',
        'success'
      );
    }
  };

  return (
    <div
      id="marketer-onboarding-checklist"
      className="mb-4 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/80 shadow-xs overflow-hidden transition-all duration-300"
    >
      {/* Top Banner / Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-slate-900 border-b border-indigo-100 dark:border-indigo-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {language === 'ar'
                    ? 'قائمة التحقق لانطلاق المسوقين الجدد'
                    : 'Checklist de lancement pour affiliés'}
                </h3>
                {completedCount === 3 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-black flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>جاهز 100% للإعلانات!</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                    {completedCount} من 3 مكتملة ({progressPercent}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'أكمل الخطوات الـ 3 الأساسية لضمان أعلى جاهزية ومعدل تحويل قبل إطلاق حملاتك الإعلانية'
                  : '3 étapes essentielles avant de lancer vos campagnes publicitaires'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <button
              id="btn-reset-checklist"
              type="button"
              onClick={handleResetChecklist}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs flex items-center gap-1 font-semibold"
              title="إعادة مزامنة القائمة مع بياناتك"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">مزامنة</span>
            </button>
            <button
              id="btn-toggle-collapse-checklist"
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
            >
              <span>{isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}</span>
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3.5">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
            <span>مستوى الجاهزية الإعلانية (Ad Readiness)</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completedCount === 3
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Items (Collapsible body) */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Step 1: Pixel Integration */}
          <div
            id="checklist-step-pixel"
            className={`p-3.5 sm:p-4 rounded-2xl border transition ${
              isPixelDone
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/60'
                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={handleTogglePixel}
                  className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer shrink-0"
                  title={isPixelDone ? 'تعليم كغير مكتمل' : 'تعليم كمكتمل'}
                >
                  {isPixelDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  )}
                </button>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black flex items-center justify-center">
                      1
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>ربط البيكسل الإعلاني (Meta, TikTok, Snapchat)</span>
                    </h4>
                    {isPixelDone ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                        جاهز ونشط
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold">
                        مطلوب قبل إطلاق الإعلان
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {isPixelDone && activePixels.length > 0
                      ? `تم ربط البيكسل بنجاح (${activePixels.join('، ')}). سيتم إرسال أحداث الشراء وتأكيد الطلبيات تلقائياً.`
                      : 'أدخل معرّف البيكسل لتتبع زوار صفحة الطلب وحسابات الشراء تلقائياً لتحسين استهداف حملاتك الإعلانية.'}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                <button
                  id="btn-goto-pixel-settings"
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('profil')}
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>{isPixelDone ? 'فحص البيكسل' : 'ربط البيكسل'}</span>
                  <ArrowLeft className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Create First Link */}
          <div
            id="checklist-step-first-link"
            className={`p-3.5 sm:p-4 rounded-2xl border transition ${
              isLinkDone
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/60'
                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={handleToggleLink}
                  className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer shrink-0"
                  title={isLinkDone ? 'تعليم كغير مكتمل' : 'تعليم كمكتمل'}
                >
                  {isLinkDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  )}
                </button>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black flex items-center justify-center">
                      2
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>إنشاء أول رابط تسويقي وتحديد هامش الربح</span>
                    </h4>
                    {isLinkDone ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                        {marketedProducts.length > 0 ? `${marketedProducts.length} منتج نشط` : 'مكتمل'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                        خطوة أساسية
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {isLinkDone && marketedProducts.length > 0
                      ? 'لديك روابط تسويقية مهيأة بأسعار بيع مخصصة وعروض Upsell لتعظيم الأرباح.'
                      : 'اختر منتجاً رابحاً من كتالوج المنتجات، حدد سعر البيع المقترح، وعروض الـ UpSell لزيادة متوسط قيمة السلة.'}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                {marketedProducts.length > 0 ? (
                  <button
                    id="btn-manage-existing-link"
                    type="button"
                    onClick={() => onOpenShareModal && onOpenShareModal(marketedProducts[0])}
                    className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>إدارة الروابط</span>
                  </button>
                ) : (
                  <button
                    id="btn-browse-products-for-link"
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab('produits')}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>اختر منتجاً</span>
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Test Order Page */}
          <div
            id="checklist-step-test-order"
            className={`p-3.5 sm:p-4 rounded-2xl border transition ${
              isTestOrderDone
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/60'
                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={handleToggleTestOrder}
                  className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer shrink-0"
                  title={isTestOrderDone ? 'تعليم كغير مكتمل' : 'تعليم كمكتمل'}
                >
                  {isTestOrderDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  )}
                </button>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black flex items-center justify-center">
                      3
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>تجربة صفحة الطلب (Testing Funnel) والتحقق من التحويل</span>
                    </h4>
                    {isTestOrderDone ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                        تمت التجربة بنجاح
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold">
                        موصى بها بشدة
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    افتح الرابط كزبون وجرب: اختيار المقاس واللون، ظهور عرض UpSell، ملء الاستمارة، وتأكيد الطلب للتأكد من سلاسة الشراء.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                <button
                  id="btn-test-order-funnel"
                  type="button"
                  onClick={handleLaunchTestOrder}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  title="فتح صفحة الطلب الحقيقية للرابط في نافذة جديدة"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>تجربة صفحة الطلب</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pro Ad Tip for Marketers */}
          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium">
              <strong className="font-black text-indigo-900 dark:text-indigo-100 block mb-0.5">
                💡 نصيحة لزيادة المبيعات وعائد الإعلانات (ROAS):
              </strong>
              قم بتفعيل عروض UpSell للقطعة الثانية بسعر مخفض، حيث ترفع متوسط قيمة الطلب بنسبة تصل إلى 35% دون أي زيادة في تكلفة الإعلانات!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
