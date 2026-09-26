import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Boxes,
  Headphones,
  ShieldCheck,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';

export type DashboardRole = 'reseller' | 'warehouse' | 'confirmer' | 'admin';

interface DashboardConfig {
  id: DashboardRole;
  label: string;
  shortLabel: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  badgeBg: string;
}

const DASHBOARDS: DashboardConfig[] = [
  {
    id: 'reseller',
    label: 'لوحة المسوّق',
    shortLabel: 'المسوّق',
    tagline: 'الكتالوج، المتاجر والأرباح',
    icon: ShoppingBag,
    accentColor: 'purple',
    activeBg: 'bg-purple-600 text-white shadow-md shadow-purple-500/20',
    activeText: 'text-purple-600 dark:text-purple-400',
    activeBorder: 'border-purple-200 dark:border-purple-800',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  },
  {
    id: 'warehouse',
    label: 'لوحة المورّد',
    shortLabel: 'المورّد',
    tagline: 'المستودع، المخزون والتسويات',
    icon: Boxes,
    accentColor: 'amber',
    activeBg: 'bg-amber-600 text-white shadow-md shadow-amber-500/20',
    activeText: 'text-amber-600 dark:text-amber-400',
    activeBorder: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    id: 'confirmer',
    label: 'واجهة المؤكد',
    shortLabel: 'المؤكد',
    tagline: 'تأكيد الطلبيات وتتبع الشحن',
    icon: Headphones,
    accentColor: 'emerald',
    activeBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20',
    activeText: 'text-emerald-600 dark:text-emerald-400',
    activeBorder: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    id: 'admin',
    label: 'لوحة الأدمن',
    shortLabel: 'الأدمن',
    tagline: 'الرقابة الشاملة وإدارة النظام',
    icon: ShieldCheck,
    accentColor: 'indigo',
    activeBg: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20',
    activeText: 'text-indigo-600 dark:text-indigo-400',
    activeBorder: 'border-indigo-200 dark:border-indigo-800',
    badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  },
];

interface DashboardSwitcherProps {
  currentRole: DashboardRole;
  onSwitchRole: (role: DashboardRole) => void;
  canSwitchAll?: boolean;
  className?: string;
}

export const DashboardSwitcher: React.FC<DashboardSwitcherProps> = ({
  currentRole,
  onSwitchRole,
  canSwitchAll = true,
  className = '',
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeConfig = DASHBOARDS.find((d) => d.id === currentRole) || DASHBOARDS[0];
  const ActiveIcon = activeConfig.icon;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenMobile(false);
      }
    }
    if (isOpenMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpenMobile]);

  // If the user has a fixed role and cannot switch
  if (!canSwitchAll) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold ${className}`}
      >
        <div className={`w-2 h-2 rounded-full ${
          currentRole === 'admin' ? 'bg-indigo-500' :
          currentRole === 'confirmer' ? 'bg-emerald-500' :
          currentRole === 'warehouse' ? 'bg-amber-500' : 'bg-purple-500'
        } animate-pulse`} />
        <ActiveIcon className="w-3.5 h-3.5" />
        <span>{activeConfig.label}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Desktop Executive Segmented Control */}
      <div className="hidden lg:flex items-center p-1 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-700/90 shadow-2xs">
        {DASHBOARDS.map((dash) => {
          const Icon = dash.icon;
          const isActive = dash.id === currentRole;

          return (
            <button
              key={dash.id}
              onClick={() => onSwitchRole(dash.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none ${
                isActive
                  ? dash.activeBg
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
              title={`${dash.label}: ${dash.tagline}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'opacity-80'}`} />
              <span>{dash.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white/90 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Medium Screens (Tablets): Compact Segmented Icons + Short Label */}
      <div className="hidden md:flex lg:hidden items-center p-1 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-700/90 shadow-2xs">
        {DASHBOARDS.map((dash) => {
          const Icon = dash.icon;
          const isActive = dash.id === currentRole;

          return (
            <button
              key={dash.id}
              onClick={() => onSwitchRole(dash.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? dash.activeBg
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
              title={`${dash.label}: ${dash.tagline}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold">{dash.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile: Compact Dropdown Button with Active Badge */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer shadow-2xs ${
            currentRole === 'reseller'
              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800'
              : currentRole === 'warehouse'
              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
              : currentRole === 'confirmer'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800'
          }`}
          title="تبديل الواجهة"
        >
          <ActiveIcon className="w-3.5 h-3.5" />
          <span className="font-black">{activeConfig.label}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${
              isOpenMobile ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Floating Mobile Dropdown Menu */}
        {isOpenMobile && (
          <div
            className="absolute top-full start-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
            dir="rtl"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
              <span>مساحات العمل (الداشبوردات الأربعة)</span>
              <Sparkles className="w-3 h-3 text-purple-500" />
            </div>

            <div className="space-y-1">
              {DASHBOARDS.map((dash) => {
                const Icon = dash.icon;
                const isActive = dash.id === currentRole;

                return (
                  <button
                    key={dash.id}
                    onClick={() => {
                      onSwitchRole(dash.id);
                      setIsOpenMobile(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-start transition cursor-pointer ${
                      isActive
                        ? `${dash.badgeBg} font-black`
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isActive
                            ? 'bg-white dark:bg-slate-800 shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black leading-tight">{dash.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {dash.tagline}
                        </div>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
