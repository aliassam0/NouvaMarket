import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Users,
  Smartphone,
  ArrowRight,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { SeoHead } from '../seo/SeoHead';
import { useRouter } from '../../router/RouterContext';

export function PublicResellersPage({
  onOpenRegister,
  onOpenLogin,
}: {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}) {
  const { navigate } = useRouter();
  const [ordersPerDay, setOrdersPerDay] = useState(10);
  const [profitPerOrder, setProfitPerOrder] = useState(1500);

  const estimatedMonthly = ordersPerDay * profitPerOrder * 30;

  const resellersJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'كيف تبدأ العمل والربح من التسويق بالعمولة في الجزائر مع نوفا ماركت',
    description: 'دليل شامل خطوة بخطوة لبدء التجارة الإلكترونية والدروبشيبينغ في الجزائر بدون رأس مال، تأكيد طلبيات مجاني، وشحن لـ 58 ولاية جزائرية.',
    step: [
      {
        '@type': 'HowToStep',
        name: 'التسجيل المجاني',
        text: 'أنشئ حساب مسوق مجاني على منصة نوفا ماركت في أقل من دقيقة.',
      },
      {
        '@type': 'HowToStep',
        name: 'اختيار المنتجات الرابحة',
        text: 'تصفح كتالوج المنتجات بأسعار الجملة واختر المنتجات المناسبة لجمهورك.',
      },
      {
        '@type': 'HowToStep',
        name: 'التسويق وجلب الطلبيات',
        text: 'انشر إعلاناتك على فيسبوك، تيك توك، أو متجرك الخاص، وسجل بيانات الزبون.',
      },
      {
        '@type': 'HowToStep',
        name: 'استلام الأرباح عبر بريدي موب',
        text: 'بعد تأكيد الطلبية وتسليمها، يتحول صافي ربحك مباشرة لمحفظتك لتسحبه عبر BaridiMob أو CCP.',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <SeoHead
        title="دليل المسوقين والتجار بالعمولة في الجزائر | نوفا ماركت"
        description="تعلم كيف تحقق أكثر من 150,000 دج شهرياً من التسويق بالعمولة والدروبشيبينغ في الجزائر بدون رأس مال وبدون شراء المخزون. نوفر لك المنتجات، تأكيد المكالمات، الشحن السريع، والدفع عند الاستلام."
        keywords="الربح من الانترنت في الجزائر, التسويق بالعمولة الجزائر, دروبشيبينغ الجزائر 2026, التجارة الالكترونية بدون رأس مال, سحب الارباح بريدي موب الجزائر, نوفا ماركت مسوقين"
        canonical="https://nouvamarket.com/resellers"
        jsonLd={resellersJsonLd}
      />

      <PublicNavbar onOpenLogin={onOpenLogin} onOpenRegister={onOpenRegister} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 text-white py-16 sm:py-20 px-4 text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>دليل المبتدئين والمحترفين للربح من التجارة بالعمولة في الجزائر</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">
              ابدأ مشروعك التجاري الخاص <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-300">
                بدون رأس مال وبدون مخاطرة
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              في نوفا ماركت، كل ما تحتاجه هو هاتفك الذكي ومهارتك في الإعلان. نحن نوفر المخزون الحقيقي، نتصل بالزبائن لتأكيد الطلب باسمك، ونشحن الطرد إلى باب بيت الزبون، ثم نحول كامل ربحك الصافي لحسابك BaridiMob.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={onOpenRegister}
                className="px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition cursor-pointer"
              >
                انضم الآن وابدأ البيع مجاناً
              </button>
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition cursor-pointer"
              >
                تصفح المنتجات المتوفرة
              </button>
            </div>
          </div>
        </section>

        {/* Profit Interactive Calculator */}
        <section className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5 mb-6 text-purple-600 dark:text-purple-400">
              <Calculator className="w-6 h-6" />
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                حاسبة الأرباح الشهرية التقديرية
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-600 dark:text-slate-300">عدد الطلبيات المسلمة يومياً:</span>
                    <span className="text-purple-600 text-sm font-black">{ordersPerDay} طلبية / يوم</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={ordersPerDay}
                    onChange={(e) => setOrdersPerDay(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-600 dark:text-slate-300">متوسط هامش الربح للقطعة:</span>
                    <span className="text-purple-600 text-sm font-black">{profitPerOrder.toLocaleString()} دج</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="4000"
                    step="100"
                    value={profitPerOrder}
                    onChange={(e) => setProfitPerOrder(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 p-6 rounded-2xl border border-purple-200 dark:border-purple-800 text-center space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  صافي دخلك الشهري المتوقع:
                </span>
                <div className="text-3xl sm:text-4xl font-black text-purple-700 dark:text-purple-300">
                  {estimatedMonthly.toLocaleString()}{' '}
                  <span className="text-base font-bold text-slate-600 dark:text-slate-400">دج</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                  * محسوب على أساس 30 يوماً من العمل المستمر. يتم تحويل الأرباح لحسابك عبر BaridiMob فور تسليم الشحنات.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black">صفر مخاطرة مالية</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                لا تشتري أي مخزون مسبقاً. تدفع فقط مقابل تكلفة السلعة بعد أن يدفع لك الزبون نقداً عند الاستلام.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black">تأكيد احترافي للمكالمات</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                مركز نداء جزائري يتصل بزبائنك خلال دقائق بالهاتف، لتأكيد العنوان والمقاسات ورفع نسبة استلام الطرود.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black">سحب فوري لأرباحك</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                اطلب سحب أرباحك في أي وقت لحسابك البريدي الجاري CCP أو عبر تطبيق BaridiMob خلال 24 ساعة كحد أقصى.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
