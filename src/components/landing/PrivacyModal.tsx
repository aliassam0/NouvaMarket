import React from 'react';
import { X, Lock, ShieldCheck, Mail, Globe } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl relative text-right flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>سياسة الخصوصية</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                آخر تحديث: 1 أغسطس 2026 • منصة Nouva Market
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

        {/* Modal Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
          {/* Welcome Intro */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 space-y-2">
            <h3 className="font-black text-indigo-900 dark:text-indigo-300 text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              مرحبًا بك في Nouva Market
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              نحن نلتزم بحماية خصوصيتك واحترام بياناتك الشخصية، وتوضح هذه السياسة كيفية جمع المعلومات واستخدامها وتخزينها ومشاركتها عند استخدامك لمنصتنا.
            </p>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold leading-relaxed pt-1">
              باستخدامك للمنصة فإنك توافق على الممارسات الموضحة في سياسة الخصوصية هذه.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-indigo-500 pr-3">
              أولاً: البيانات التي نجمعها
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              قد نقوم بجمع الأنواع التالية من البيانات:
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">1. بيانات الحساب</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  الاسم الكامل • البريد الإلكتروني • رقم الهاتف • كلمة المرور (بشكل مشفر) • الدولة • المدينة • اللغة المفضلة.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">2. بيانات الهوية (عند الحاجة)</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  قد نطلب بعض المعلومات للتحقق من هوية المستخدم، مثل: الاسم القانوني، صورة وثيقة الهوية (إذا لزم الأمر)، تاريخ الميلاد، وبيانات الحساب البنكي أو وسيلة استلام الأرباح. (ولا يتم طلب هذه البيانات إلا عند الحاجة وللأغراض النظامية أو الأمنية).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">3. بيانات الطلبات</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  عند تسجيل طلب جديد قد نقوم بجمع: اسم العميل، رقم الهاتف، عنوان التوصيل، الولاية أو المدينة، المنتج المطلوب، الكمية، قيمة الطلب، وملاحظات التوصيل.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">4. البيانات التقنية</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  قد نقوم بجمع معلومات تقنية مثل: عنوان IP، نوع الجهاز، نوع المتصفح، نظام التشغيل، لغة الجهاز، المنطقة الزمنية، معرف الجهاز، وسجل الأخطاء التقنية.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">5. بيانات الاستخدام</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  قد نسجل معلومات حول كيفية استخدامك للمنصة، مثل: الصفحات التي تزورها، مدة الجلسة، المنتجات التي تستعرضها، الطلبات التي تنشئها، عمليات السحب، والنقرات داخل المنصة.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-indigo-500 pr-3">
              ثانياً: كيفية استخدام البيانات
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              نستخدم بياناتك من أجل:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• إنشاء وإدارة حسابك</span>
              <span className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• تنفيذ الطلبات</span>
              <span className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• احتساب العمولات</span>
              <span className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• معالجة عمليات السحب</span>
              <span className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• تقديم الدعم الفني</span>
              <span className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• تحسين أداء المنصة ومنع الاحتيال</span>
              <span className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• حماية الحسابات والالتزام القانوني</span>
              <span className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">• إرسال الإشعارات المتعلقة بحسابك</span>
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold pt-1">
              ولا نستخدم بياناتك لأغراض غير مشروعة أو مخالفة لهذه السياسة.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-indigo-500 pr-3">
              ثالثاً: ملفات تعريف الارتباط (Cookies)
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              قد تستخدم المنصة ملفات تعريف الارتباط لتحسين تجربة الاستخدام، مثل: تذكر تسجيل الدخول، حفظ إعدادات اللغة، تحسين الأداء، تحليل الاستخدام، وحماية الجلسات.
            </p>
            <p className="text-xs text-slate-500">
              يمكنك تعطيل ملفات تعريف الارتباط من إعدادات متصفحك، إلا أن بعض وظائف المنصة قد لا تعمل بالشكل المطلوب.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-indigo-500 pr-3">
              رابعاً: مشاركة البيانات
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold">
              لا نقوم ببيع بياناتك الشخصية لأي طرف.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              وقد نشارك البيانات عند الحاجة مع: شركات الشحن لتنفيذ الطلبات، مزودي خدمات الدفع لتحويل الأموال، مزودي خدمات الاستضافة السحابية، مزودي خدمات البريد الإلكتروني والإشعارات، والجهات الحكومية المختصة إذا كان ذلك مطلوبًا بموجب القانون.
            </p>
            <p className="text-xs text-slate-500">
              وتقتصر مشاركة البيانات على الحد الأدنى اللازم لتنفيذ الخدمة أو الوفاء بالالتزامات القانونية.
            </p>
          </section>

          {/* Section 5 & 6 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
              <h4 className="font-extrabold text-xs text-indigo-900 dark:text-indigo-300">خامساً: حماية البيانات</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                نتخذ إجراءات تقنية وإدارية معقولة مثل: تشفير كلمات المرور، استخدام HTTPS، تقييد الوصول إلى البيانات، مراقبة الأنظمة، والنسخ الاحتياطي الدوري. ورغم ذلك، لا يمكن ضمان أمان أي نظام بنسبة 100%.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
              <h4 className="font-extrabold text-xs text-indigo-900 dark:text-indigo-300">سادساً: الاحتفاظ بالبيانات</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                نحتفظ ببياناتك فقط للمدة اللازمة لتحقيق الأغراض التي جُمعت من أجلها، أو للمدة التي يفرضها القانون. وبعد انتهاء الحاجة إليها، يتم حذفها أو إخفاء هوية أصحابها متى كان ذلك ممكنًا.
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-indigo-500 pr-3">
              سابعاً: حقوق المستخدم
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              يحق لك، وفقًا للقوانين المعمول بها، أن:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pr-2 text-slate-700 dark:text-slate-300">
              <li>الاطلاع على بياناتك الشخصية وطلب تصحيح البيانات غير الدقيقة.</li>
              <li>تحديث بياناتك الشخصية.</li>
              <li>طلب حذف حسابك متى كان ذلك ممكنًا قانونًا.</li>
              <li>طلب نسخة من بياناتك الشخصية.</li>
              <li>الاعتراض على بعض طرق معالجة بياناتك في الحالات التي يسمح بها القانون.</li>
            </ul>
            <p className="text-xs text-slate-500">
              قد نحتاج إلى التحقق من هويتك قبل تنفيذ بعض الطلبات المتعلقة بهذه الحقوق.
            </p>
          </section>

          {/* Section 8 & 9 & 10 */}
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">ثامناً: حذف الحساب</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                يمكنك طلب حذف حسابك في أي وقت من خلال إعدادات الحساب أو عبر التواصل مع فريق الدعم. قد نحتفظ ببعض البيانات بعد حذف الحساب إذا كان الاحتفاظ بها مطلوبًا بموجب القوانين أو لأغراض المحاسبة أو تسوية النزاعات أو منع الاحتيال.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">تاسعاً: خصوصية الأطفال</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                خدمات المنصة غير موجهة للأشخاص الذين تقل أعمارهم عن 18 عامًا، ولا نجمع بياناتهم الشخصية عن قصد. إذا تبين لنا أننا جمعنا بيانات تخص قاصرًا دون موافقة قانونية، فسنعمل على حذفها في أقرب وقت ممكن.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">عاشراً: نقل البيانات</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                قد تتم معالجة أو تخزين بياناتك في مراكز بيانات تقع خارج بلد إقامتك لدى مزودي خدمات موثوقين يلتزمون بإجراءات أمنية مناسبة. ونتخذ التدابير اللازمة لضمان حماية البيانات أثناء نقلها أو معالجتها.
              </p>
            </div>
          </div>

          {/* Section 11 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-r-4 border-indigo-500 pr-3">
              الحادي عشر: تحديث سياسة الخصوصية
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              يجوز لنا تعديل هذه السياسة من وقت لآخر بما يتوافق مع التطورات القانونية أو التقنية أو التشغيلية. وسيتم نشر أي تحديث على هذه الصفحة مع تعديل تاريخ آخر تحديث، ويُعد استمرارك في استخدام المنصة بعد نشر التعديلات موافقةً عليها.
            </p>
          </section>

          {/* Section 12: Contact */}
          <section className="p-5 rounded-2xl bg-indigo-600 text-white space-y-3 text-center">
            <h3 className="text-base font-black flex items-center justify-center gap-2">
              <Mail className="w-5 h-5 text-indigo-200" />
              الثاني عشر: التواصل معنا
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100">
              إذا كانت لديك أي أسئلة أو استفسارات تتعلق بسياسة الخصوصية أو بطريقة معالجة بياناتك، فيمكنك التواصل معنا عبر:
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono font-bold pt-1">
              <span className="flex items-center gap-1.5 bg-indigo-700/60 px-3 py-1.5 rounded-xl border border-indigo-500/40">
                <Mail className="w-3.5 h-3.5" /> contact@NouvaMarket.com
              </span>
              <a
                href="https://www.NouvaMarket.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-indigo-700/60 px-3 py-1.5 rounded-xl border border-indigo-500/40 underline hover:text-indigo-200 transition"
              >
                <Globe className="w-3.5 h-3.5" /> https://www.NouvaMarket.com
              </a>
            </div>
          </section>

          {/* Final Acknowledgment Statement */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 font-bold">
            باستخدامك لمنصة Nouva Market أو إنشاء حساب فيها، فإنك تقر بأنك قرأت سياسة الخصوصية هذه وفهمتها وتوافق على جمع بياناتك واستخدامها ومعالجتها وفقًا لما ورد فيها.
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
