import React from 'react';
import {
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Heart,
  Globe,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from '../../router/RouterContext';

export function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="Nouva Market Logo"
                className="w-10 h-10 object-contain drop-shadow-md"
              />
              <span className="text-xl font-black text-white tracking-tight">
                Nouva Market <span className="text-purple-400">نوفا ماركت</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              أكبر منصة للتسويق بالعمولة والدروبشيبينغ في الجزائر. نربط المسوقين وأصحاب المتاجر الإلكترونية بأفضل الموردين والمصانع المحلية مع ضمان التأكيد الهاتفي السريع والشحن لـ 58 ولاية وتسوية الأرباح عبر بريدي موب و CCP.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>دفع فوري BaridiMob & CCP</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                <span>شحن وتوصيل 58 ولاية</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">الروابط الرئيسية</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="text-slate-400 hover:text-purple-400 transition">الصفحة الرئيسية</Link>
              </li>
              <li>
                <Link to="/products" className="text-slate-400 hover:text-purple-400 transition">كتالوج المنتجات وسوق الجملة</Link>
              </li>
              <li>
                <Link to="/suppliers" className="text-slate-400 hover:text-purple-400 transition">بوابة الموردين والمستودعات</Link>
              </li>
              <li>
                <Link to="/resellers" className="text-slate-400 hover:text-purple-400 transition">دليل المسوقين والتجار</Link>
              </li>
              <li>
                <Link to="/academy" className="text-slate-400 hover:text-purple-400 transition">أكاديمية التجارة الإلكترونية</Link>
              </li>
            </ul>
          </div>

          {/* Logistics & Support */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">الشحن والخدمات</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/shipping" className="text-slate-400 hover:text-purple-400 transition">شبكة التوصيل لـ 58 ولاية</Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-400 hover:text-purple-400 transition">الأسئلة الشائعة والإجابات</Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-purple-400 transition">عن منصة نوفا ماركت</Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-purple-400 transition">اتصل بنا ومركز المساعدة</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">قانوني وتواصل</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/terms" className="text-slate-400 hover:text-purple-400 transition">شروط الاستخدام والخدمة</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-purple-400 transition">سياسة الخصوصية</Link>
              </li>
              <li className="pt-2 text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>الجزائر العاصمة، الجزائر</span>
              </li>
              <li className="text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>support@nouvamarket.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Nouva Market - نوفا ماركت. جميع الحقوق محفوظة في الجمهورية الجزائرية الديمقراطية الشعبية.
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/terms" className="hover:text-slate-300 transition">الشروط</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-slate-300 transition">الخصوصية</Link>
            <span>•</span>
            <Link to="/faq" className="hover:text-slate-300 transition">الأسئلة</Link>
            <span>•</span>
            <Link to="/products" className="hover:text-slate-300 transition">المنتجات</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
