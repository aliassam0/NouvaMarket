import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { SeoHead } from '../seo/SeoHead';
import { useRouter } from '../../router/RouterContext';

export function PublicTermsPage({
  onOpenRegister,
  onOpenLogin,
}: {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}) {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <SeoHead
        title="شروط الاستخدام والخدمة | نوفا ماركت الجزائر"
        description="شروط وأحكام استخدام منصة نوفا ماركت للتسويق بالعمولة والتجارة الإلكترونية والتوريد في الجزائر."
        canonical="https://nouvamarket.com/terms"
      />

      <PublicNavbar onOpenLogin={onOpenLogin} onOpenRegister={onOpenRegister} />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            شروط الاستخدام والخدمة (Terms of Service)
          </h1>
          <p className="text-xs text-slate-500 mt-1">آخر تحديث: أكتوبر 2026</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">1. مقدمة وقبول الشروط</h2>
            <p>
              مرحباً بك في منصة نوفا ماركت (Nouva Market). باستخدامك للمنصة أو التسجيل كمسوق (Reseller) أو كمورد (Supplier)، فإنك توافق على الالتزام الكامل بهذه الشروط والسياسات المعمول بها في الجمهورية الجزائرية الديمقراطية الشعبية.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">2. التزامات المسوقين (Affiliates / Resellers)</h2>
            <p>
              يلتزم المسوق بعدم تقديم أي معلومات مضللة للمستهلك بخصوص مواصفات السلع، أسعارها، أو ضماناتها. كما يمنع استخدام إعلانات احتيالية أو سبام. يحق للمنصة تجميد أي حساب ينتهك أخلاقيات التجارة النزيهة.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">3. التزامات الموردين والمستودعات (Suppliers)</h2>
            <p>
              يلتزم المورد بمطابقة السلع للمواصفات المعروضة، وضمان سلامة المخزون، والالتزام بأسعار الجملة المحددة. يتم صرف المستحقات المالية للمورد وفق دورة التسويات المعتمدة بعد خصم عمولات التوصيل المنفذة.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">4. سياسة المدفوعات وسحب الأرباح</h2>
            <p>
              تحسب الأرباح بعد تسليم الطرد وقبض المبلغ نقداً من الزبون (COD). يتم تحويل المبالغ عبر تطبيق بريدي موب (BaridiMob) أو الحساب الجاري CCP للحسابات المؤكدة.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">5. الشحن ومرتجع الطرود (الروتور)</h2>
            <p>
              في حال تعذر تسليم الطرد لأسباب تعود لرفض الزبون أو عدم الرد، يعود الطرد للمستودع وتتحمل الأطراف التكاليف التشغيلية وفق عقد الوساطة المبرم.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
