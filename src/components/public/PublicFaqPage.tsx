import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  ChevronDown,
  Sparkles,
  Search,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { SeoHead } from '../seo/SeoHead';
import { useRouter } from '../../router/RouterContext';

export function PublicFaqPage({
  onOpenRegister,
  onOpenLogin,
}: {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}) {
  const { navigate } = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [faqFilter, setFaqFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: 'resellers',
      q: 'ما هو التسويق بالعمولة (Affiliate / Reselling) في نوفا ماركت؟',
      a: 'هو نموذج عمل يمكنك من بيع منتجات حقيقية متوفرة في مستودعاتنا دون الحاجة لشرائها مسبقاً. تختار المنتج وتحدد سعرك، وحين تأتيك طلبية نقوم نحن بتأكيدها هاتفياً وتوصيلها للزبون، ثم نحول لك صافي أرباحك مباشرة عبر بريدي موب.',
    },
    {
      category: 'resellers',
      q: 'هل أحتاج إلى رأس مال للبدء في نوفا ماركت؟',
      a: 'لا، التسجيل والعمل في منصة نوفا ماركت مجاني 100% ولا يتطلب أي رأس مال مسبق. تدفع تكلفة البضاعة فقط بعد أن يستلم الزبون الطرد ويدفع ثمنه نقداً عند الاستلام.',
    },
    {
      category: 'payments',
      q: 'كيف ومتى يتم سحب الأرباح في الجزائر؟',
      a: 'يمكنك سحب أرباحك فور تسليم الشحنات للزبائن. نوفر السحب الفوري عبر تطبيق بريدي موب (BaridiMob) خلال 24 ساعة، وكذلك عبر الحساب البريدي الجاري CCP لجميع ولايات الوطن.',
    },
    {
      category: 'shipping',
      q: 'من يتكفل بتأكيد الطلبيات والشحن لـ 58 ولاية؟',
      a: 'منصة نوفا ماركت توفر فريق كول سنتر جزائري محترف يتصل بزبائنك لتأكيد العنوان والمقاسات. بمجرد التأكيد، يتم تغليف الطرد وشحنه آلياً عبر شبكة شركاء الشحن والتوصيل لجميع الولايات الـ 58.',
    },
    {
      category: 'suppliers',
      q: 'كيف أعرض منتجاتي كمورد أو مصنع في المنصة؟',
      a: 'يمكنك فتح حساب مورد عبر استمارة التسجيل الرسمية، وإدخال بيانات المستودع والسلع. سيقوم فريق إدارة المخزون بالتواصل معك خلال 24 ساعة لاعتماد المنتجات وإدراجها لآلاف المسوقين فوراً.',
    },
    {
      category: 'shipping',
      q: 'ماذا يحدث إذا رفض الزبون استلام الطرد (الروتور Retour)؟',
      a: 'في حالة الروتور يعود الطرد لمستودع المنصة أو المورد. نعمل عبر التأكيد الهاتفي الصارم المسبق وإرسال إشعارات SMS للزبون لخفض نسبة الروتور لأدنى مستوى في السوق الجزائري.',
    },
    {
      category: 'resellers',
      q: 'أين يمكنني نشر وإعلان المنتجات؟',
      a: 'يمكنك البيع عبر كافة القنوات المتاحة: إعلانات ممولة على تيك توك وفيسبوك وانستغرام، متجر شوبيفاي أو يوكان، متجر فيسبوك ماركت بليس، أو حتى عبر حساباتك الشخصية وقنوات تيليغرام.',
    },
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      const matchCat = faqFilter === 'all' || item.category === faqFilter;
      const matchSearch =
        !searchQuery.trim() ||
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [faqs, faqFilter, searchQuery]);

  // Schema.org FAQPage for Google Rich Snippets
  const faqJsonLd = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.a,
        },
      })),
    };
  }, [faqs]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <SeoHead
        title="الأسئلة الشائعة حول التسويق بالعمولة والدروبشيبينغ | نوفا ماركت"
        description="إجابات شاملة لجميع استفسارات المسوقين والموردين في الجزائر: طريقة التسجيل، سحب الأرباح عبر بريدي موب، شحن 58 ولاية، تأكيد المكالمات، وكيف تبدأ بدون رأس مال."
        keywords="اسئلة شائعة نوفا ماركت, كيفية سحب الارباح بريدي موب, شروط التسويق بالعمولة الجزائر, كيف ابدا دروبشيبينغ الجزائر, حل مشكلة الروتور الجزائر, استفسارات التجارة الالكترونية الجزائر"
        canonical="https://nouvamarket.com/faq"
        jsonLd={faqJsonLd}
      />

      <PublicNavbar onOpenLogin={onOpenLogin} onOpenRegister={onOpenRegister} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-900 text-white py-16 sm:py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>مركز المساعدة والإجابات الرسمية</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">
              الأسئلة الأكثر شيوعاً <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-300">
                كل ما تحتاج لمعرفته عن نوفا ماركت
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              إجابات واضحة ومباشرة حول كيفية عمل المنصة، استلام الأرباح، الشحن، وشروط الانضمام للمسوقين والموردين.
            </p>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="max-w-4xl mx-auto px-4 -mt-6 relative z-20">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في الأسئلة الشائعة..."
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'resellers', label: 'المسوقين' },
                { id: 'payments', label: 'الأرباح والدفع' },
                { id: 'shipping', label: 'الشحن والتوصيل' },
                { id: 'suppliers', label: 'الموردين' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFaqFilter(f.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    faqFilter === f.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs Accordion */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-right font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-purple-600 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center pt-12 space-y-3">
            <h3 className="text-base font-bold">لديك سؤال آخر لم تجد إجابته هنا؟</h3>
            <p className="text-xs text-slate-500">فريق الدعم الفني الجزائري مستعد لمساعدتك على مدار الساعة عبر واتساب.</p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => navigate('/contact')}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer"
              >
                تواصل مع فريق الدعم
              </button>
              <button
                onClick={onOpenRegister}
                className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 transition cursor-pointer"
              >
                فتح حساب جديد
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
