import React from 'react';
import { X, ShieldCheck, FileText, Globe } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl relative text-right flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>شروط الاستخدام</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                تاريخ النفاذ: 1 أغسطس 2026 • منصة Nouva Market
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Printable / Readable Document */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
          {/* Welcome Intro */}
          <div className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50 space-y-2">
            <h3 className="font-black text-purple-900 dark:text-purple-300 text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              مرحبًا بك في Nouva Market
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              تنظم شروط الاستخدام هذه (“الشروط”) استخدامك لموقعنا الإلكتروني وتطبيقاتنا وجميع الخدمات التي نقدمها (ويشار إليها مجتمعة بـ”المنصة”).
            </p>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold leading-relaxed pt-1">
              يرجى قراءة هذه الشروط بعناية قبل إنشاء حساب أو استخدام المنصة. باستخدامك للمنصة أو إنشاء حساب فيها فإنك تقر بأنك قرأت هذه الشروط وفهمتها ووافقت على الالتزام بها.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              أولاً: التعريفات
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              يقصد بالمصطلحات التالية المعاني الموضحة أمام كل منها ما لم يقتضِ السياق خلاف ذلك:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
              <li><strong className="text-slate-900 dark:text-slate-200">المنصة:</strong> Nouva Market وجميع المواقع والتطبيقات والخدمات التابعة لها.</li>
              <li><strong className="text-slate-900 dark:text-slate-200">الشركة:</strong> الجهة المالكة والمشغلة للمنصة.</li>
              <li><strong className="text-slate-900 dark:text-slate-200">المسوّق (Reseller):</strong> شخص أو مؤسسة توافق المنصة على منحه صلاحية تسويق منتجاتها والعمل كوكيل بيع معتمد لها وفق هذه الشروط.</li>
              <li><strong className="text-slate-900 dark:text-slate-200">العميل:</strong> الشخص الذي يقوم بشراء المنتجات من خلال المنصة.</li>
              <li><strong className="text-slate-900 dark:text-slate-200">المنتجات:</strong> جميع السلع التي تعرضها المنصة للبيع.</li>
              <li><strong className="text-slate-900 dark:text-slate-200">الطلب:</strong> عملية شراء يتم تسجيلها داخل المنصة.</li>
              <li><strong className="text-slate-900 dark:text-slate-200">المحفظة:</strong> رصيد إلكتروني داخلي داخل حساب المسوق يستخدم لتسجيل العمولات والمكافآت والسحوبات.</li>
              <li><strong className="text-slate-900 dark:text-slate-200">العمولة:</strong> المبلغ المستحق للمسوّق مقابل إتمام عملية بيع ناجحة وفق سياسات المنصة.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              ثانياً: أهلية الاستخدام
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              باستخدام المنصة فإنك تقر بأن:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pr-2 text-slate-700 dark:text-slate-300">
              <li>لديك الأهلية القانونية للتعاقد.</li>
              <li>جميع البيانات التي تقدمها صحيحة ودقيقة.</li>
              <li>ستقوم بتحديث بياناتك عند تغيرها.</li>
              <li>ستستخدم المنصة بما يتوافق مع القوانين والأنظمة المعمول بها.</li>
            </ul>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold pt-1">
              ويحق للمنصة رفض أو إلغاء أي حساب لا يستوفي هذه الشروط.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              ثالثاً: طبيعة عمل المنصة
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              تملك المنصة المنتجات المعروضة للبيع أو تمتلك الحق القانوني في بيعها. وتقوم المنصة بالسماح للمسوّقين المعتمدين بتسويق هذه المنتجات نيابة عنها.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
              <p className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white mb-2">وتتولى المنصة مسؤولية:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• امتلاك المنتجات</span>
                <span className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• إدارة المخزون</span>
                <span className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• مراجعة الطلبات</span>
                <span className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• تجهيز الطلبات</span>
                <span className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• التغليف والشحن</span>
                <span className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• خدمة العملاء والضمان</span>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              رابعاً: علاقة المسوّق بالمنصة
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              عند التسجيل كمسوّق فإنك توافق صراحة على أن:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pr-2 text-slate-700 dark:text-slate-300">
              <li>تعمل كوكيل بيع معتمد للمنصة.</li>
              <li>لا تمتلك المنتجات المعروضة للبيع.</li>
              <li>لا تقوم بشراء مخزون من المنصة.</li>
              <li>لا تتحمل مخاطر تلف أو خسارة المخزون.</li>
              <li>يقتصر دورك على التسويق وجلب العملاء وإدخال الطلبات عبر المنصة.</li>
            </ul>
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold">ولا يعتبر التسجيل في المنصة بأي حال:</p>
              <p>شراكة • عقد عمل • وكالة حصرية • مشروعاً مشتركاً. (ويظل كل مسوق مستقلاً في نشاطه).</p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              خامساً: إنشاء الحساب
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              يلتزم المستخدم عند إنشاء الحساب بما يلي:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pr-2 text-slate-700 dark:text-slate-300">
              <li>تقديم بيانات صحيحة.</li>
              <li>الحفاظ على سرية كلمة المرور.</li>
              <li>عدم مشاركة الحساب مع الآخرين.</li>
              <li>إخطار المنصة فوراً عند الاشتباه بأي استخدام غير مصرح به.</li>
            </ul>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              وتتحمل مسؤولية جميع الأنشطة التي تتم من خلال حسابك.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              سادساً: التزامات المسوق
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2">
                <h4 className="font-extrabold text-xs text-purple-800 dark:text-purple-300">✅ يلتزم المسوق بما يلي:</h4>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  <li>• تسويق المنتجات بأمانة واستخدام الصور والوصف الرسمي.</li>
                  <li>• عدم تقديم معلومات مضللة للعملاء.</li>
                  <li>• احترام الحد الأدنى والحد الأعلى للأسعار المحددة.</li>
                  <li>• الحصول على موافقة العميل قبل إدخال بياناته.</li>
                  <li>• التعامل باحترافية والالتزام بجميع الأنظمة والقوانين.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-2">
                <h4 className="font-extrabold text-xs text-rose-800 dark:text-rose-300">🚫 ويحظر على المسوق:</h4>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  <li>• إنشاء طلبات وهمية أو تزوير بيانات العملاء.</li>
                  <li>• استخدام وسائل احتيالية للحصول على عمولات.</li>
                  <li>• استغلال الثغرات التقنية أو الإساءة للمنصة.</li>
                  <li>• تقديم وعود غير صحيحة للعملاء.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              سابعاً: الأسعار
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              تحدد المنصة لكل منتج: سعر التكلفة أو الجملة، والحد الأدنى للبيع، والحد الأعلى للبيع (إن وجد)، والسعر المقترح للبيع.
            </p>
            <p className="text-xs font-bold text-purple-700 dark:text-purple-400">
              ويحق للمسوّق تحديد سعر البيع ضمن الحدود التي تحددها المنصة فقط.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              ثامناً: الطلبات
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              لا يعتبر الطلب مقبولاً إلا بعد: إدخال بيانات العميل، ومراجعة الطلب، والتحقق من توفر المنتج، واعتامده من المنصة.
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <span className="font-extrabold text-slate-900 dark:text-white block mb-1">ويحق للمنصة رفض أو إلغاء أي طلب في الحالات التالية:</span>
              <p>وجود بيانات غير صحيحة • الاشتباه في الاحتيال • نفاد المخزون • خطأ في السعر • تكرار الطلب • مخالفة شروط الاستخدام.</p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              تاسعاً: العمولات
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              يستحق المسوق العمولة فقط بعد تحقق جميع الشروط التالية:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pr-2 text-slate-700 dark:text-slate-300">
              <li>اعتماد الطلب.</li>
              <li>تسليم الطلب بنجاح وفق سياسة المنصة.</li>
              <li>تحصيل قيمة الطلب.</li>
              <li>عدم إلغاء أو إرجاع الطلب.</li>
            </ul>
            <p className="text-xs font-bold text-slate-500">
              ولا تعتبر أي عمولة مستحقة قبل تحقق هذه الشروط.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              عاشراً: المحفظة
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              المحفظة هي سجل مالي داخلي يستخدم لتسجيل العمولات، والمكافآت، والتسويات، وعمليات السحب.
            </p>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              ولا تعتبر المحفظة حساباً بنكياً أو وسيلة استثمار أو حساباً يحقق فوائد مالية، ولا يترتب عليها أي فوائد أو أرباح.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              الحادي عشر: السحب
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              يجوز للمسوّق طلب سحب رصيده وفق سياسة المنصة. وقد تطلب المنصة التحقق من الهوية قبل تنفيذ عمليات السحب. ويجوز تعليق السحب مؤقتاً عند الاشتباه بوجود نشاط غير مشروع أو مخالف.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              الثاني عشر: السلوك المحظور
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              يحظر استخدام المنصة في: الاحتيال، غسل الأموال، انتهاك حقوق الملكية الفكرية، بيع أو تسويق منتجات مخالفة للقانون أو الشريعة الإسلامية أو سياسات المنصة، إساءة استخدام بيانات العملاء، أو محاولة اختراق المنصة والتأثير على عملها.
            </p>
          </section>

          {/* Section 13 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              الثالث عشر: الملكية الفكرية
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              جميع الحقوق المتعلقة بالمنصة محفوظة للشركة، بما في ذلك: العلامة التجارية، الشعارات، البرمجيات، التصميم، الصور، قواعد البيانات، النصوص، والمحتوى. ولا يجوز نسخ أو إعادة استخدام أي جزء منها دون موافقة كتابية مسبقة.
            </p>
          </section>

          {/* Section 14 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-purple-500 pr-3">
              الرابع عشر: تعليق أو إنهاء الحساب
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              يجوز للمنصة تعليق أو إنهاء أي حساب في حال: مخالفة هذه الشروط، الاحتيال، تقديم بيانات كاذبة، الإساءة إلى المنصة، الإضرار بالعملاء، أو مخالفة القوانين.
            </p>
          </section>

          {/* Section 15 & 16 & 17 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">الخامس عشر: حدود المسؤولية</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                تبذل المنصة أقصى جهدها لضمان جودة الخدمات، إلا أنها لا تتحمل المسؤولية عن أي خسائر غير مباشرة أو أضرار خارجة عن إرادتها.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">السادس عشر: تعديل الشروط</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                تحتفظ المنصة بحق تعديل هذه الشروط في أي وقت، وتصبح نافذة بمجرد نشرها على المنصة.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">السابع عشر: القانون المطابق</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                تخضع هذه الشروط للقوانين المعمول بها في الدولة التي تُسجل فيها الشركة المالكة للمنصة.
              </p>
            </div>
          </div>

          {/* Section 18: Contact */}
          <section className="p-5 rounded-2xl bg-purple-600 text-white space-y-2 text-center">
            <h3 className="text-base font-black flex items-center justify-center gap-2">
              <Globe className="w-5 h-5 text-purple-200" />
              الثامن عشر: التواصل معنا
            </h3>
            <p className="text-xs sm:text-sm text-purple-50">
              إذا كانت لديك أي استفسارات حول شروط الاستخدام، يمكنك التواصل معنا عبر الموقع الرسمي:
            </p>
            <a
              href="https://www.NouvaMarket.com"
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-1 font-mono font-extrabold text-white underline hover:text-purple-200 transition text-sm"
            >
              https://www.NouvaMarket.com
            </a>
          </section>

          {/* Final Acknowledgment Statement */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 font-bold">
            باستخدامك للمنصة أو إنشاء حساب فيها، فإنك تقر بأنك قرأت هذه الشروط وفهمتها ووافقت على الالتزام بجميع أحكامها.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Nouva Market © 2026</span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-xs transition cursor-pointer shadow-sm"
          >
            موافق وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
