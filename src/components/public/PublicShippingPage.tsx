import React from 'react';
import {
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Package,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { SeoHead } from '../seo/SeoHead';
import { ALGERIA_WILAYAS } from '../../data/algeriaLocations';
import { useRouter } from '../../router/RouterContext';

export function PublicShippingPage({
  onOpenRegister,
  onOpenLogin,
}: {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}) {
  const { navigate } = useRouter();

  const shippingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DeliveryChargeSpecification',
    appliesToDeliveryMethod: 'http://purl.org/goodrelations/v1#DeliveryModeDirectDownload',
    eligibleRegion: 'DZ',
    name: 'شبكة الشحن والتوصيل لـ 58 ولاية جزائرية - نوفا ماركت',
    description: 'توصيل سريع لكافة 58 ولاية جزائرية مع خاصية الدفع عند الاستلام COD وتتبع مباشر للطرد عبر الرسائل النصية القصيرة SMS.',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <SeoHead
        title="الشحن والتوصيل لـ 58 ولاية | نوفا ماركت الجزائر"
        description="تعرف على شبكة الشحن والتوصيل السريع لـ 58 ولاية جزائرية في نوفا ماركت. مدة التوصيل من 24 إلى 48 ساعة، دفع عند الاستلام COD، ونسبة تسليم تتجاوز 88% لضمان أرباحك."
        keywords="توصيل 58 ولاية الجزائر, شركات التوصيل الجزائر, ياليدين الجزائر, ياليدين اكسبريس, زد ار اكسبريس, الدفع عند الاستلام 58 ولاية, شحن طرود الجزائر"
        canonical="https://nouvamarket.com/shipping"
        jsonLd={shippingJsonLd}
      />

      <PublicNavbar onOpenLogin={onOpenLogin} onOpenRegister={onOpenRegister} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white py-16 sm:py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>شبكة لوجستيك متكاملة تغطي كامل التراب الوطني الجزائري</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">
              توصيل سريع وموثوق <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-300">
                لجميع الـ 58 ولاية جزائرية
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              نعمل مع كبرى شركات التوصيل المعتمدة في الجزائر لضمان وصول طرود زبائنك في أسرع وقت، مع تأكيد هاتفي صارم ومتابعة دقيقة لكل طرد حتى استلام المبلغ نقداً.
            </p>
          </div>
        </section>

        {/* Delivery Zones Breakdown */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black">الولايات الشمالية والوسط</h3>
              <p className="text-xs text-purple-600 font-bold">24 إلى 48 ساعة كحد أقصى</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                تشمل الجزائر العاصمة، البليدة، بومرداس، تيبازة، وهران، قسنطينة، سطيف وغيرها مع إمكانية التوصيل لباب المنزل (Domicile) أو المكتب (Stop Desk).
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black">الهضاب العليا والشرق والغرب</h3>
              <p className="text-xs text-indigo-600 font-bold">48 إلى 72 ساعة</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                تشمل باتنة، المسيلة، الجلفة، برج بوعريريج، مستغانم، تلمسان، وسيدي بلعباس مع تتبع آلي ودقيق لحالة الشحنة.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black">ولايات الجنوب الكبير</h3>
              <p className="text-xs text-amber-600 font-bold">3 إلى 5 أيام عمل</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                تغطية لكافة ولايات الجنوب: ورقلة، بسكرة، الوادي، غرداية، بشار، تمنراست، أدرار مع التوصيل لمراكز الاستلام الرئيسية.
              </p>
            </div>
          </div>
        </section>

        {/* 58 Wilayas Grid Preview */}
        <section className="bg-white dark:bg-slate-900 py-12 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-black text-center mb-6">
              قائمة الـ 58 ولاية المشمولة بالشحن والتوصيل في نوفا ماركت
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              {ALGERIA_WILAYAS.map((w) => (
                <div
                  key={w.code}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2"
                >
                  <span className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {w.code}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{w.nameAr}</span>
                </div>
              ))}
            </div>

            <div className="text-center pt-10">
              <button
                onClick={onOpenRegister}
                className="px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-md transition cursor-pointer"
              >
                ابدأ البيع والشحن لكافة الولايات الآن
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
