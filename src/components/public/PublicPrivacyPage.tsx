import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { SeoHead } from '../seo/SeoHead';

export function PublicPrivacyPage({
  onOpenRegister,
  onOpenLogin,
}: {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <SeoHead
        title="سياسة الخصوصية وحماية البيانات | نوفا ماركت الجزائر"
        description="سياسة حماية البيانات وخصوصية المستخدمين والزبائن في منصة نوفا ماركت للتجارة والتسويق بالعمولة بالجزائر."
        canonical="https://nouvamarket.com/privacy"
      />

      <PublicNavbar onOpenLogin={onOpenLogin} onOpenRegister={onOpenRegister} />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            سياسة الخصوصية (Privacy Policy)
          </h1>
          <p className="text-xs text-slate-500 mt-1">آخر تحديث: أكتوبر 2026</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">1. التزامنا بحماية الخصوصية</h2>
            <p>
              نحن في نوفا ماركت ندرك تماماً أهمية حماية خصوصية بياناتك الشخصية وبيانات زبائنك. نلتزم بعدم بيع أو تأجير أي معلومات لطرف ثالث لأغراض دعائية.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">2. المعلومات التي نقوم بجمعها</h2>
            <p>
              نقوم بجمع المعلومات الضرورية فقط لإتمام عمليات التجارة والشحن والتسويات: الاسم، رقم الهاتف، الولاية والعنوان، ومعلومات حساب BaridiMob / CCP لتحويل الأرباح.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">3. مشاركة البيانات مع شركات الشحن</h2>
            <p>
              تتم مشاركة بيانات الزبون (الاسم، الهاتف، العنوان) حصرياً مع شركات التوصيل المعتمدة (Yalidine, ZR Express) لغرض توصيل الطرد فقط لا غير.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">4. أمن وتشفير البيانات</h2>
            <p>
              نستخدم بروتوكولات تشفير آمنة (SSL/TLS) لحماية حركة البيانات وحفظ كلمات المرور بشكل مشفر.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
