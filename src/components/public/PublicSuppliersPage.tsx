import React, { useState } from 'react';
import {
  Boxes,
  Truck,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Users,
  Building2,
  PhoneCall,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { SeoHead } from '../seo/SeoHead';
import { useRouter } from '../../router/RouterContext';

export function PublicSuppliersPage({
  onOpenRegister,
  onOpenLogin,
}: {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}) {
  const { navigate } = useRouter();

  const suppliersJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'B2B Wholesale & Supplier Fulfillment Portal',
    provider: {
      '@type': 'Organization',
      name: 'Nouva Market - نوفا ماركت',
      url: 'https://nouvamarket.com',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Algeria',
    },
    description: 'بوابة الموردين والمصانع الرسمية في منصة نوفا ماركت. تتيح للموردين وأصحاب المستودعات تصريف بضائعهم بالجملة عبر آلاف المسوقين بالعمولة في 58 ولاية جزائرية.',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <SeoHead
        title="بوابة الموردين وأصحاب المصانع بالجملة | نوفا ماركت الجزائر"
        description="هل أنت مورد، مستورد أو صاحب مصنع في الجزائر؟ اعرض منتجاتك على نوفا ماركت وقم ببيع آلاف القطع يومياً عبر أكبر شبكة مسوقين بالعمولة مع تسويات مالية سريعة ومضمونة عبر CCP و BaridiMob."
        keywords="موردين جملة الجزائر, مصانع الجزائر, مستوردين الجزائر, سوق الجملة العلمة بئر خادم الحميز, تصريف المخزون الجزائر, بيع بالجملة للتجار, توريد بضائع الجزائر"
        canonical="https://nouvamarket.com/suppliers"
        jsonLd={suppliersJsonLd}
      />

      <PublicNavbar onOpenLogin={onOpenLogin} onOpenRegister={onOpenRegister} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 text-white py-16 sm:py-20 px-4 relative overflow-hidden">
          <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold">
              <Boxes className="w-4 h-4 text-amber-400" />
              <span>البوابة الرسمية للموردين والمصانع الجزائرية</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
              صرف مخزونك وضاعف مبيعاتك بالجملة مع{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-300">
                +15,000 مسوق نشط
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
              لا داعي لصرف ملايين الدينارات على الإعلانات أو البحث عن زبائن التجزئة. ضع منتجاتك في مستودع نوفا ماركت، ودع شبكة مسوقينا تتولى البيع والتسويق في كافة ولايات الوطن، مع تسديد مستحقاتك بانتظام ودقة.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={onOpenRegister}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition cursor-pointer"
              >
                انضم كمورد معتمد مجاناً
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition cursor-pointer"
              >
                تواصل مع إدارة التوريد
              </button>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black">لماذا يفضل كبار الموردين والمستوردين نوفا ماركت؟</h2>
            <p className="text-xs sm:text-sm text-slate-500">منظومة توريد ولوجستيك رقمية صممت خصيصاً للسوق الجزائري</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black">تصريف فوري لكميات الجملة</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                مسوقونا المحترفون ينشرون إعلانات ممولة يومياً على فيسبوك وتيك توك، مما يضمن حركة دوران سريعة لبضائعك وتفريغ المستودعات في أيام معدودة.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black">تسويات مالية دقيقة ومضمونة</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                تحويل مباشر لأموال طلبياتك المستلمة دورياً عبر بريدي موب (BaridiMob) أو CCP أو تحويل بنكي رسمي بدون تأخير وبشفافية رقمية كاملة.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black">لوجستيك شحن وتأكيد متكامل</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                فريق كول سنتر جزائري لتأكيد الطلبيات، وربط آلي مع كبرى شركات التوصيل يضمن أعلى نسبة تسليم (Delivery Rate) وتقليل الروتور.
              </p>
            </div>
          </div>
        </section>

        {/* Steps to join */}
        <section className="bg-white dark:bg-slate-900 py-16 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-black text-center mb-12">كيف تبدأ التوريد في 3 خطوات بسيطة؟</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  1
                </div>
                <h3 className="text-base font-bold">سجل حساب مورد</h3>
                <p className="text-xs text-slate-500">
                  املأ استمارة المورد بمعلومات المستودع وطبيعة السلع وأرقام الاتصال.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  2
                </div>
                <h3 className="text-base font-bold">مراجعة وإدراج المنتجات</h3>
                <p className="text-xs text-slate-500">
                  يتواصل معك فريق إدارة المخزون للتحقق من الجودة وتحديد أسعار الجملة التنافسية.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  3
                </div>
                <h3 className="text-base font-bold">انطلاق المبيعات واستلام الأرباح</h3>
                <p className="text-xs text-slate-500">
                  يبدأ آلاف المسوقين ببيع منتجاتك فوراً، وتستلم تسوياتك المالية بشكل منتظم.
                </p>
              </div>
            </div>

            <div className="text-center pt-10">
              <button
                onClick={onOpenRegister}
                className="px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-lg shadow-purple-600/20 active:scale-95 transition cursor-pointer"
              >
                افتح حساب موردك الآن
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
