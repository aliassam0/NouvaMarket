import React from 'react';
import {
  ShieldCheck,
  Package,
  Layers,
  Users,
  Wallet,
  CheckCircle2,
  Clock,
  Printer,
  Edit3,
  Search,
  Zap,
  Check,
  TrendingUp,
  FileText,
  Key,
  Globe,
  Truck,
  RefreshCw,
  Sliders,
  Settings,
  Bell,
  Building,
  Tag,
  Percent,
  Warehouse as WarehouseIcon,
  UserCheck,
  Lock,
  Trash2,
  Award,
  Volume2,
  VolumeX,
  X,
  PhoneCall,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Store,
  HelpCircle,
  Menu,
  ChevronDown
} from 'lucide-react';

export type AdminTabKey =
  | 'products'
  | 'approvals'
  | 'sellers'
  | 'wallet'
  | 'inventory'
  | 'couriers'
  | 'suppliers'
  | 'categories'
  | 'coupons'
  | 'rewards'
  | 'users'
  | 'confirmers'
  | 'notifications'
  | 'ai_provider'
  | 'settings';

interface AdminVerticalSidebarProps {
  activeTab: AdminTabKey;
  onSelectTab: (tab: AdminTabKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  counts: {
    totalPendingApprovals: number;
    productsCount: number;
    sellersCount: number;
    pendingSellersCount: number;
    suppliersCount: number;
    confirmersCount: number;
    pendingWithdrawalsCount: number;
    lowStockCount: number;
    categoriesCount: number;
    couponsCount: number;
    rewardsCount: number;
    usersCount: number;
    unreadNotifsCount: number;
  };
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenNotifications: () => void;
}

export function AdminVerticalSidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  counts,
  soundEnabled,
  onToggleSound,
  onOpenNotifications,
}: AdminVerticalSidebarProps) {
  // Navigation sections grouped professionally
  const navGroups = [
    {
      groupTitle: 'الرئيسية والاعتماد',
      items: [
        {
          id: 'approvals' as AdminTabKey,
          label: 'طلبات الانضمام والاعتماد',
          shortLabel: 'الاعتماد',
          icon: UserCheck,
          badge: counts.totalPendingApprovals > 0 ? `${counts.totalPendingApprovals} معلق` : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-black animate-pulse',
        },
        {
          id: 'products' as AdminTabKey,
          label: 'كتالوج وإدارة المنتجات',
          shortLabel: 'المنتجات',
          icon: Layers,
          badge: `${counts.productsCount}`,
          badgeColor: 'bg-purple-900/60 text-purple-300',
        },
      ],
    },
    {
      groupTitle: 'الشركاء والعمليات',
      items: [
        {
          id: 'sellers' as AdminTabKey,
          label: 'شبكة البائعين والمسوقين',
          shortLabel: 'البائعين',
          icon: Users,
          badge: counts.pendingSellersCount > 0 ? `${counts.pendingSellersCount} معلق` : `${counts.sellersCount}`,
          badgeColor: counts.pendingSellersCount > 0 ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-400',
        },
        {
          id: 'suppliers' as AdminTabKey,
          label: 'الموردين والمستودعات',
          shortLabel: 'الموردين',
          icon: Building,
          badge: `${counts.suppliersCount}`,
          badgeColor: 'bg-slate-800 text-slate-400',
        },
        {
          id: 'confirmers' as AdminTabKey,
          label: 'مؤكدو الطلبيات (المراقبة)',
          shortLabel: 'المؤكدين',
          icon: PhoneCall,
          badge: `${counts.confirmersCount}`,
          badgeColor: 'bg-emerald-950 text-emerald-300',
        },
        {
          id: 'couriers' as AdminTabKey,
          label: 'شركات التوصيل وربط API',
          shortLabel: 'التوصيل',
          icon: Truck,
          badge: 'API نشط',
          badgeColor: 'bg-blue-950 text-blue-300',
        },
      ],
    },
    {
      groupTitle: 'المالية والمخازن',
      items: [
        {
          id: 'wallet' as AdminTabKey,
          label: 'الخزينة وسحوبات الأموال',
          shortLabel: 'السحوبات',
          icon: Wallet,
          badge: counts.pendingWithdrawalsCount > 0 ? `${counts.pendingWithdrawalsCount} معلق` : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-black',
        },
        {
          id: 'inventory' as AdminTabKey,
          label: 'المخزون وتنبيهات النفاذ',
          shortLabel: 'المخزون',
          icon: WarehouseIcon,
          badge: counts.lowStockCount > 0 ? `${counts.lowStockCount} تنبيه` : undefined,
          badgeColor: 'bg-rose-500 text-white font-black animate-pulse',
        },
        {
          id: 'categories' as AdminTabKey,
          label: 'فئات وتصنيفات المنتجات',
          shortLabel: 'الفئات',
          icon: Tag,
          badge: `${counts.categoriesCount}`,
          badgeColor: 'bg-slate-800 text-slate-400',
        },
        {
          id: 'coupons' as AdminTabKey,
          label: 'الكوبونات والخصومات',
          shortLabel: 'الكوبونات',
          icon: Percent,
          badge: `${counts.couponsCount}`,
          badgeColor: 'bg-slate-800 text-slate-400',
        },
        {
          id: 'rewards' as AdminTabKey,
          label: 'رتب ومكافآت المسوقين',
          shortLabel: 'الرتب',
          icon: Award,
          badge: `${counts.rewardsCount}`,
          badgeColor: 'bg-slate-800 text-slate-400',
        },
      ],
    },
    {
      groupTitle: 'النظام والذكاء الاصطناعي',
      items: [
        {
          id: 'users' as AdminTabKey,
          label: 'المستخدمين والصلاحيات',
          shortLabel: 'المستخدمين',
          icon: UserCheck,
          badge: `${counts.usersCount}`,
          badgeColor: 'bg-slate-800 text-slate-400',
        },
        {
          id: 'ai_provider' as AdminTabKey,
          label: 'مزود الذكاء الاصطناعي (Gemini)',
          shortLabel: 'الذكاء الاصطناعي',
          icon: Sparkles,
          badge: 'Gemini 3.8',
          badgeColor: 'bg-indigo-950 text-indigo-300 font-bold border border-indigo-700/50',
        },
        {
          id: 'notifications' as AdminTabKey,
          label: 'سجل إشعارات الإدارة',
          shortLabel: 'الإشعارات',
          icon: Bell,
          badge: counts.unreadNotifsCount > 0 ? `${counts.unreadNotifsCount}` : undefined,
          badgeColor: 'bg-rose-500 text-white font-black animate-pulse',
        },
        {
          id: 'settings' as AdminTabKey,
          label: 'إعدادات المنصة العامة',
          shortLabel: 'الإعدادات',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed lg:relative top-0 right-0 z-50 lg:z-20 h-full transition-all duration-300 flex flex-col bg-slate-900/95 dark:bg-slate-900 border-s border-purple-900/50 shadow-2xl backdrop-blur-md select-none shrink-0 ${
          isMobileOpen ? 'translate-x-0 w-72' : 'translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-68'}`}
        dir="rtl"
      >
        {/* Sidebar Header Brand */}
        <div className="p-4 border-b border-purple-900/40 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-black text-sm text-white tracking-tight truncate">
                    لوحة الإدارة العليا
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </div>
                <p className="text-[11px] text-purple-300/80 font-medium truncate">
                  NouvaMarket Super Admin
                </p>
              </div>
            )}
          </div>

          {/* Close on mobile / Collapse toggle on desktop */}
          <div className="flex items-center gap-1">
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-950/60 border border-purple-800/40 transition"
              title={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
            >
              {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Items List with Scroll */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5 scrollbar-thin scrollbar-thumb-purple-900/40">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-purple-400/70">
                  {group.groupTitle}
                </div>
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all group relative cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                          : 'text-slate-300 hover:text-white hover:bg-purple-950/40'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isActive ? 'text-white scale-110' : 'text-purple-400 group-hover:text-purple-300'
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {/* Badges / Counters */}
                      {!isCollapsed && item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 shadow-2xs ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip on Collapsed Mode */}
                      {isCollapsed && item.badge && (
                        <span className="absolute top-1.5 start-1.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-purple-900/40 bg-slate-950/60 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            {!isCollapsed && <span>صوت الإشعارات</span>}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl transition flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-purple-950/60 text-purple-300 hover:bg-purple-900/80 border border-purple-800/40'
                  : 'bg-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'تعطيل نغمة التنبيهات' : 'تفعيل نغمة التنبيهات'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-300" /> : <VolumeX className="w-3.5 h-3.5" />}
              {!isCollapsed && <span>{soundEnabled ? 'مفعل' : 'صامت'}</span>}
            </button>
          </div>

          {!isCollapsed && (
            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-black text-purple-300">
                  👑
                </div>
                <div className="text-[11px] font-bold text-slate-300 truncate">
                  Admin Active
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
