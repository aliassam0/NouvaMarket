import React, { useState } from 'react';
import {
  Menu,
  X,
  Package,
  Boxes,
  Users,
  GraduationCap,
  Truck,
  HelpCircle,
  LogIn,
  UserPlus,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react';
import { useRouter, Link } from '../../router/RouterContext';
import { useAuth } from '../../context/AuthContext';

interface PublicNavbarProps {
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

export function PublicNavbar({ onOpenLogin, onOpenRegister }: PublicNavbarProps) {
  const { path, navigate } = useRouter();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'الرئيسية' },
    { to: '/products', label: 'المنتجات والكتالوج', badge: 'جديد' },
    { to: '/suppliers', label: 'بوابة الموردين' },
    { to: '/resellers', label: 'دليل المسوقين' },
    { to: '/academy', label: 'الأكاديمية التعليمية' },
    { to: '/shipping', label: 'الشحن والتوصيل' },
    { to: '/faq', label: 'الأسئلة الشائعة' },
  ];

  const handleAuthAction = (action: 'login' | 'register') => {
    setMobileMenuOpen(false);
    if (user) {
      navigate('/dashboard');
      return;
    }
    if (action === 'login') {
      if (onOpenLogin) onOpenLogin();
      else navigate('/login');
    } else {
      if (onOpenRegister) onOpenRegister();
      else navigate('/register');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <img
            src="/logo.svg"
            alt="Nouva Market Logo - نوفا ماركت"
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-purple-600 transition-colors">
              Nouva Market
            </span>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
              نوفا ماركت • الجزائر
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
          {navLinks.map((link) => {
            const isActive = path === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  isActive
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 font-black'
                    : 'hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-md uppercase tracking-wider">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              <span>دخول حسابي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAuthAction('login')}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-purple-50 dark:hover:bg-purple-950/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-purple-600" />
                <span>تسجيل الدخول</span>
              </button>
              <button
                onClick={() => handleAuthAction('register')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-purple-600/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-purple-200" />
                <span>انضم كمسوق / مورد</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="القائمة الرئيسية"
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = path === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between ${
                    isActive
                      ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 font-black'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-500 text-white rounded">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>دخول لوحة التحكم</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAuthAction('login')}
                  className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-purple-600" />
                  <span>دخول</span>
                </button>
                <button
                  onClick={() => handleAuthAction('register')}
                  className="py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>حساب جديد</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
