import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  Video,
  CheckCircle2,
  TrendingUp,
  Target,
  Share2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { SeoHead } from '../seo/SeoHead';
import { useRouter } from '../../router/RouterContext';

export function PublicAcademyPage({
  onOpenRegister,
  onOpenLogin,
}: {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}) {
  const { navigate } = useRouter();
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);

  const lessons = [
    {
      id: 1,
      title: 'كيف تختار منتجاً رابحاً (Winning Product) في السوق الجزائري؟',
      category: 'اختيار المنتجات',
      readTime: '6 دقائق قراءة',
      summary: 'المعايير الخمسة الذهبية للمنتج الرابح: حل مشكلة حقيقية، هامش ربح لا يقل عن 1200 دج، وزن خفيف لتقليل الشحن، وتوفر مخزون مستمر.',
      content: `
        لاختيار منتج يحقق مبيعات ضخمة في الجزائر، يجب مراعاة النقاط التالية:
        1. حل مشكلة ملحة أو تقديم تجربة مبهرة (Wow Factor).
        2. هامش ربح كافٍ: يجب أن يغطي هامش الربح تكلفة الإعلان الممول (CPA) وتكلفة الشحن ونسبة الروتور ويبقى لك صافي لا يقل عن 1000 إلى 1500 دج.
        3. استمرارية التوريد: اختر منتجات متوفرة بكميات كبيرة في مستودع نوفا ماركت حتى لا ينفد المخزون أثناء ذروة حملتك الإعلانية.
        4. سهولة الاستخدام وشرح الفائدة في فيديو لا يتجاوز 15 ثانية على تيك توك.
      `,
    },
    {
      id: 2,
      title: 'دليل إعلانات تيك توك (TikTok Ads) في الجزائر خطوة بخطوة',
      category: 'التسويق والإعلانات',
      readTime: '8 دقائق قراءة',
      summary: 'كيف تطلق حملة تحويلات (Conversions) ناجحة، استهداف الولايات الأكثر طلباً، وتصميم فيديو إعلاني يخطف الأنظار في أول 3 ثوانٍ.',
      content: `
        منصة تيك توك هي الأقوى حالياً في التجارة الإلكترونية بالجزائر:
        1. استخدم أسلوب الإعلانات العفوية (UGC) كأنك زبون يجرب المنتج بنفسه ولا تستخدم إعلانات تلفزيونية تقليدية.
        2. Hook سريع: أظهر المشكلة والحل في أول ثانيتين لجذب انتباه المشاهد.
        3. استهداف الولايات: ركز على الولايات الكبرى (الجزائر، وهران، قسنطينة، سطيف، البليدة) لتسريع الشحن وتخفيض تكلفة الاستحواذ.
      `,
    },
    {
      id: 3,
      title: 'استراتيجيات تقليل نسبة الروتور (Retour) ورفع نسبة التسليم',
      category: 'إدارة العمليات',
      readTime: '5 دقائق قراءة',
      summary: 'أسرار رفع نسبة تسليم الطرود إلى أكثر من 85%: سرعة الاتصال بالزبون، التأكيد عبر واتساب، وخدمة العملاء السريعة.',
      content: `
        الروتور هو العدو الأول للمسوق إن لم يُدر باحترافية:
        1. التأكيد السريع: كلما كان الاتصال بالزبون أسرع بعد تسجيل الطلبية، زادت رغبته والتزامه بالاستلام.
        2. إرسال رسالة تذكيرية يوم خروج الطرد مع الموزع.
        3. تقديم هدايا رمزية أو خصم عند شراء قطعتين (Upsell) لتعظيم قيمة السلة.
      `,
    },
    {
      id: 4,
      title: 'إدارة التدفق المالي واستثمار الأرباح للتوسع في التجارة',
      category: 'المالية والاستثمار',
      readTime: '7 دقائق قراءة',
      summary: 'كيف تدير سيولتك النقدية اليومية، سحب الأرباح عبر بريدي موب، وإعادة ضخ جزء منها في تمويل إعلانات جديدة دون تعريض رأس مالك للخطر.',
      content: `
        النجاح في التجارة الإلكترونية يتطلب انضباطاً مالياً:
        1. افصل أرباحك الشخصية عن ميزانية الإعلانات.
        2. استخدم أرباحك الصافية المسحوبة من نوفا ماركت لاختبار منتجات جديدة وتوسيع فريق عملك.
      `,
    },
  ];

  const academyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'أكاديمية نوفا ماركت للتجارة الإلكترونية',
    url: 'https://nouvamarket.com/academy',
    description: 'أكاديمية تدريبية مجانية لتعليم شباب الجزائر فنون التسويق بالعمولة والدروبشيبينغ وإعلانات وسائل التواصل الاجتماعي.',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <SeoHead
        title="أكاديمية نوفا ماركت | دروس مجانية في التجارة الإلكترونية والتسويق بالجزائر"
        description="تعلم مجاناً كيفية إطلاق الإعلانات الممولة على تيك توك وفيسبوك، اختيار المنتجات الرابحة، تقليل الروتور، وبناء متجر إلكتروني ناجح في الجزائر مع دروس أكاديمية نوفا ماركت."
        keywords="تعليم التجارة الالكترونية في الجزائر, كورس دروبشيبينغ مجاني الجزائر, اعلانات تيك توك الجزائر, تقليل الروتور التجارة الجزائر, اعلانات فيسبوك الجزائر, دورة تسويق الكتروني مجانية"
        canonical="https://nouvamarket.com/academy"
        jsonLd={academyJsonLd}
      />

      <PublicNavbar onOpenLogin={onOpenLogin} onOpenRegister={onOpenRegister} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white py-16 sm:py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>محتوى تعليمي عملي 100% مجاني ومخصص للسوق الجزائري</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">
              أكاديمية نوفا ماركت <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-300">
                لرواد التجارة الإلكترونية في الجزائر
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              تعلم مجاناً كيف تطلق حملاتك الإعلانية الأولى، تصنع فيديوهات تحقق ملايين المشاهدات، وتضاعف أرباحك بالعمولة خطوة بخطوة من خبراء السوق الجزائري.
            </p>
          </div>
        </section>

        {/* Lessons List */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lessons.map((lesson) => (
              <article
                key={lesson.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-black">
                      {lesson.category}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lesson.readTime}</span>
                    </span>
                  </div>

                  <h2 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {lesson.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {lesson.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedArticle(lesson.id)}
                    className="text-xs font-black text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>قراءة الدرس كاملاً</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onOpenRegister}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  >
                    تطبيق عملي في المنصة
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CTA to start */}
        <section className="bg-white dark:bg-slate-900 py-12 border-t border-slate-200 dark:border-slate-800 text-center">
          <div className="max-w-2xl mx-auto px-4 space-y-4">
            <h2 className="text-2xl font-black">جاهز لتطبيق ما تعلمته وتحقيق أرباحك الأولى؟</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              أنشئ حسابك المجاني في دقيقة وابدأ في تسويق أول منتج الآن.
            </p>
            <button
              onClick={onOpenRegister}
              className="px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-md transition cursor-pointer"
            >
              افتح حساب مسوق مجاناً
            </button>
          </div>
        </section>
      </main>

      {/* Article Detail Modal */}
      {selectedArticle !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-4 relative border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute left-4 top-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900"
            >
              ✕
            </button>
            {(() => {
              const item = lessons.find((l) => l.id === selectedArticle);
              if (!item) return null;
              return (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-purple-600">{item.category}</span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{item.title}</h3>
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {item.content}
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedArticle(null);
                        onOpenRegister();
                      }}
                      className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-black text-xs hover:bg-purple-700 transition"
                    >
                      ابدأ التطبيق العملي الآن
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
