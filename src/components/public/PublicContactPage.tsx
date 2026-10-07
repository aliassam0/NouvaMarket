import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Clock,
  Send,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { SeoHead } from '../seo/SeoHead';
import { useRouter } from '../../router/RouterContext';

export function PublicContactPage({
  onOpenRegister,
  onOpenLogin,
}: {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}) {
  const { navigate } = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [topic, setTopic] = useState('مسوق جديد');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;
    setSubmitted(true);
  };

  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'اتصل بفريق دعم نوفا ماركت الجزائر',
    description: 'تواصل مباشرة مع فريق الدعم الفني وإدارة الموردين في منصة نوفا ماركت الجزائر عبر واتساب أو الهاتف أو البريد الإلكتروني.',
    mainEntity: {
      '@type': 'Organization',
      name: 'نوفا ماركت Nouva Market',
      telephone: '+213-550-000-000',
      email: 'support@nouvamarket.com',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        areaServed: 'DZ',
        availableLanguage: ['Arabic', 'French'],
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <SeoHead
        title="اتصل بنا | مركز المساعدة والدعم الفني | نوفا ماركت الجزائر"
        description="تواصل مع فريق نوفا ماركت للاستفسار عن التسويق بالعمولة، تسجيل الموردين، أو متابعة المدفوعات والطلبيات في الجزائر. دعم فني متواصل عبر واتساب والبريد الإلكتروني."
        keywords="اتصل بنوفا ماركت, رقم هاتف نوفا ماركت, دعم فني دروبشيبينغ الجزائر, واتساب نوفا ماركت, خدمة عملاء نوفا ماركت الجزائر"
        canonical="https://nouvamarket.com/contact"
        jsonLd={contactJsonLd}
      />

      <PublicNavbar onOpenLogin={onOpenLogin} onOpenRegister={onOpenRegister} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white py-16 px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold">
              <MessageCircle className="w-4 h-4 text-amber-400" />
              <span>فريقنا في خدمتك طيلة أيام الأسبوع</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">
              نحن هنا لمساعدتك على النجاح <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-300">
                تواصل معنا في أي وقت
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              سواء كان لديك استفسار حول استخدام المنصة، رغبة في عرض منتجاتك كمورد، أو متابعة لحسابك، فريق دعم نوفا ماركت جاهز للإجابة.
            </p>
          </div>
        </section>

        {/* Contact Cards & Form */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 -mt-8 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Direct Channels */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black">الدعم المباشر عبر واتساب</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  تحدث مباشرة مع مشرف الدعم لحل أي مشكلة أو استفسار فوري.
                </p>
                <a
                  href="https://wa.me/213550000000"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:text-emerald-700 pt-1"
                >
                  <span>فتح محادثة واتساب</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black">البريد الإلكتروني الرسمي</h3>
                <p className="text-xs text-slate-500">
                  للشراكات المؤسسية والموردين ومقترحات التعاون:
                </p>
                <a
                  href="mailto:support@nouvamarket.com"
                  className="text-xs font-bold text-purple-600 block hover:underline"
                >
                  support@nouvamarket.com
                </a>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black">المقر الرئيسي</h3>
                <p className="text-xs text-slate-500">
                  الجزائر العاصمة، الجمهورية الجزائرية الديمقراطية الشعبية
                </p>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>السبت - الخميس: 9:00 ص إلى 6:00 م</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">أرسل لنا رسالة مباشرة</h2>
                <p className="text-xs text-slate-500 mt-1">سنقوم بالرد عليك خلال ساعات العمل الرسمية عبر الهاتف أو واتساب.</p>
              </div>

              {submitted ? (
                <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-black text-emerald-800 dark:text-emerald-200">تم إرسال رسالتك بنجاح!</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    شكراً لتواصلك، سيتصل بك ممثل خدمة العملاء قريباً.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setPhone('');
                      setMessage('');
                    }}
                    className="text-xs font-bold text-emerald-800 underline pt-2 cursor-pointer"
                  >
                    إرسال رسالة أخرى
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">الاسم الكامل *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="محمد بن علي"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">رقم الهاتف (واتساب) *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0550123456"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">نوع الاستفسار</label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="مسوق جديد">استفسار مسوق جديد</option>
                      <option value="توريد بضاعة">عرض منتجات كمورد أو مصنع</option>
                      <option value="متابعة سحب الأرباح">متابعة سحب الأرباح و CCP</option>
                      <option value="أخرى">اقتراح أو موضوع آخر</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">نص الرسالة *</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="اكتب استفسارك بالتفصيل وسنوافيك بالرد السريع..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>إرسال الرسالة الآن</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
