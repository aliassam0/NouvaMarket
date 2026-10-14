import React from 'react';
import {
  ShieldCheck,
  Award,
  Users,
  Target,
  Globe,
  Sparkles,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { SeoHead } from '../seo/SeoHead';
import { useRouter } from '../../router/RouterContext';

export function PublicAboutPage({
  onOpenRegister,
  onOpenLogin,
}: {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}) {
  const { navigate } = useRouter();

  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    mainEntity: {
      '@type': 'Organization',
      name: 'Nouva Market - نوفا ماركت الجزائر',
      url: 'https://nouvamarket.com',
      logo: 'https://nouvamarket.com/logo.png',
      description: 'المنصة الجزائرية الأولى لتمكين الشباب وأصحاب المشاريع المصغرة في التجارة الإلكترونية والتسويق بالعمولة وربطهم بالمصانع والموردين المحليين.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'الجزائر العاصمة',
        addressCountry: 'DZ',
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <SeoHead
        title="من نحن | عن منصة نوفا ماركت للتجارة والتسويق بالجزائر"
        description="تعرف على قصة ورؤية نوفا ماركت (Nouva Market). مهمتنا هي تمكين آلاف الشباب الجزائريين من إطلاق مشاريعهم التجارية الناجحة عبر الإنترنت دون الحاجة لرأس مال، وبناء أقوى منظومة لوجستية للتجارة الإلكترونية."
        keywords="عن نوفا ماركت, شركة نوفا ماركت الجزائر, قصة نوفا ماركت, التجارة الالكترونية الجزائر العاصمة, تمكين الشباب الجزائري دروبشيبينغ"
        canonical="https://nouvamarket.com/about"
        jsonLd={aboutJsonLd}
      />

      <PublicNavbar onOpenLogin={onOpenLogin} onOpenRegister={onOpenRegister} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white py-16 sm:py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>رؤيتنا ورسالتنا في السوق الجزائري</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">
              نبني مستقبل التجارة الإلكترونية <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-300">
                بأيادٍ جزائرية وطاقات شابة
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              انطلقت نوفا ماركت بهدف واحد واضح: تمكين أي شاب أو فتاة في الجزائر من بدء نشاط تجاري حقيقي ومربح من منزله، وإزالة كافة العوائق التقليدية مثل رأس المال، التخزين، والشحن.
            </p>
          </div>
        </section>

        {/* Pillars */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black">الرسالة والهدف</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                خلق أكثر من 50,000 فرصة عمل حر ومستقل لشباب الجزائر بحلول عام 2027، وربط المصانع والمستوردين المحليين بقنوات توزيع رقمية حديثة.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black">الشفافية والأمان</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                لوحات تحكم دقيقة، حسابات موثوقة، وتسوية مالية فورية عبر بريدي موب دون أي خصومات غير معلنة أو رسوم خفية.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black">الانتشار الوطني</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                شبكة مستودعات ومراكز تأكيد وتوزيع تغطي كافة الولايات الـ 58 من تمنراست جنوباً إلى الجزائر العاصمة شمالاً.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white dark:bg-slate-900 py-12 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-black text-purple-600">+15,000</div>
              <div className="text-xs text-slate-500 mt-1 font-bold">مسوق وتاجر مسجل</div>
            </div>
            <div>
              <div className="text-3xl font-black text-purple-600">+250,000</div>
              <div className="text-xs text-slate-500 mt-1 font-bold">طرد تم تسليمه بنجاح</div>
            </div>
            <div>
              <div className="text-3xl font-black text-purple-600">58</div>
              <div className="text-xs text-slate-500 mt-1 font-bold">ولاية مشمولة بالتوصيل</div>
            </div>
            <div>
              <div className="text-3xl font-black text-purple-600">+88%</div>
              <div className="text-xs text-slate-500 mt-1 font-bold">نسبة تسليم الطرود المؤكدة</div>
            </div>
          </div>
        </section>

        <section className="py-16 text-center">
          <div className="max-w-2xl mx-auto px-4 space-y-4">
            <h2 className="text-2xl font-black">كن جزءاً من قصة نجاح التجارة الإلكترونية الجزائرية</h2>
            <p className="text-xs text-slate-500">
              سواء كنت مسوقاً مبتدئاً، صاحب خبرة إعلانية، أو مورداً صاحب مستودع، نوفا ماركت هي بوابتك للنمو السريع.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={onOpenRegister}
                className="px-8 py-3 rounded-xl bg-purple-600 text-white font-black text-xs hover:bg-purple-700 transition cursor-pointer"
              >
                انضم إلينا اليوم مجاناً
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
