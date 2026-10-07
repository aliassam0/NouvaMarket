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
  ChevronDown,
  Headset
} from 'lucide-react';

export type AdminTabKey =
  | 'products'
  | 'orders'
  | 'approvals'
  | 'sellers'
  | 'wallet'
  | 'inventory'
  | 'couriers'
  | 'suppliers'
  | 'support'
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
    ordersCount?: number;
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
  // Navigation sections grouped professionally in crisp Light theme
  const navGroups = [
    {
      groupTitle: 'الرئيسية',
      items: [
        {
          id: 'orders' as AdminTabKey,
          label: 'الطلبات',
          shortLabel: 'الطلبات',
          icon: Package,
          badge: counts.ordersCount ? `${counts.ordersCount}` : undefined,
          badgeColor: 'bg-violet-100 text-violet-800 border border-violet-200 font-bold',
        },
        {
          id: 'approvals' as AdminTabKey,
          label: 'طلبات الانضمام',
          shortLabel: 'الاعتماد',
          icon: UserCheck,
          badge: counts.totalPendingApprovals > 0 ? `${counts.totalPendingApprovals} معلق` : undefined,
          badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300 font-black animate-pulse',
        },
        {
          id: 'products' as AdminTabKey,
          label: 'المنتجات',
          shortLabel: 'المنتجات',
          icon: Layers,
          badge: `${counts.productsCount}`,
          badgeColor: 'bg-purple-100 text-purple-800 border border-purple-200',
        },
      ],
    },
    {
      groupTitle: 'الشركاء',
      items: [
        {
          id: 'sellers' as AdminTabKey,
          label: 'المسوقين',
          shortLabel: 'المسوقين',
          icon: Users,
          badge: counts.pendingSellersCount > 0 ? `${counts.pendingSellersCount} معلق` : `${counts.sellersCount}`,
          badgeColor: counts.pendingSellersCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700 border border-slate-200',
        },
        {
          id: 'suppliers' as AdminTabKey,
          label: 'البائعين',
          shortLabel: 'البائعين',
          icon: Building,
          badge: `${counts.suppliersCount}`,
          badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200',
        },
        {
          id: 'support' as AdminTabKey,
          label: 'دعم المسوقين',
          shortLabel: 'الدعم',
          icon: Headset,
          badge: 'إسناد وتوزيع',
          badgeColor: 'bg-teal-100 text-teal-800 border border-teal-200',
        },
        {
          id: 'confirmers' as AdminTabKey,
          label: 'فريق التأكيد',
          shortLabel: 'المؤكدين',
          icon: PhoneCall,
          badge: `${counts.confirmersCount}`,
          badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        },
        {
          id: 'couriers' as AdminTabKey,
          label: 'شركات التوصيل',
          shortLabel: 'التوصيل',
          icon: Truck,
          badge: 'نشط',
          badgeColor: 'bg-blue-100 text-blue-800 border border-blue-200',
        },
      ],
    },
    {
      groupTitle: 'المالية والمخزون',
      items: [
        {
          id: 'wallet' as AdminTabKey,
          label: 'الخزينة',
          shortLabel: 'الخزينة',
          icon: Wallet,
          badge: counts.pendingWithdrawalsCount > 0 ? `${counts.pendingWithdrawalsCount} معلق` : undefined,
          badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300 font-black',
        },
        {
          id: 'inventory' as AdminTabKey,
          label: 'المستودع',
          shortLabel: 'المستودع',
          icon: WarehouseIcon,
          badge: counts.lowStockCount > 0 ? `${counts.lowStockCount} تنبيه` : undefined,
          badgeColor: counts.lowStockCount > 0 ? 'bg-rose-100 text-rose-800 border border-rose-300 font-black animate-pulse' : 'bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold',
        },
        {
          id: 'categories' as AdminTabKey,
          label: 'الفئات',
          shortLabel: 'الفئات',
          icon: Tag,
          badge: `${counts.categoriesCount}`,
          badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200',
        },
        {
          id: 'coupons' as AdminTabKey,
          label: 'الكوبونات',
          shortLabel: 'الكوبونات',
          icon: Percent,
          badge: `${counts.couponsCount}`,
          badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200',
        },
        {
          id: 'rewards' as AdminTabKey,
          label: 'الرتب والمكافآت',
          shortLabel: 'الرتب',
          icon: Award,
          badge: `${counts.rewardsCount}`,
          badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200',
        },
      ],
    },
    {
      groupTitle: 'النظام',
      items: [
        {
          id: 'users' as AdminTabKey,
          label: 'فريق العمل',
          shortLabel: 'الفريق',
          icon: UserCheck,
          badge: `${counts.usersCount}`,
          badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200',
        },
        {
          id: 'ai_provider' as AdminTabKey,
          label: 'الذكاء الاصطناعي',
          shortLabel: 'الذكاء الاصطناعي',
          icon: Sparkles,
          badge: 'Gemini',
          badgeColor: 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-200',
        },
        {
          id: 'notifications' as AdminTabKey,
          label: 'الإشعارات',
          shortLabel: 'الإشعارات',
          icon: Bell,
          badge: counts.unreadNotifsCount > 0 ? `${counts.unreadNotifsCount}` : undefined,
          badgeColor: 'bg-rose-500 text-white font-black animate-pulse',
        },
        {
          id: 'settings' as AdminTabKey,
          label: 'الإعدادات',
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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container - Crisp Light Theme */}
      <aside
        className={`fixed lg:relative top-0 right-0 z-50 lg:z-20 h-full transition-all duration-300 flex flex-col bg-white border-s border-slate-200 shadow-xl select-none shrink-0 ${
          isMobileOpen ? 'translate-x-0 w-72' : 'translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-68'}`}
        dir="rtl"
      >
        {/* Sidebar Header Brand */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-black text-sm text-slate-900 tracking-tight truncate">
                    لوحة الإدارة العليا
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  NouvaMarket Super Admin
                </p>
              </div>
            )}
          </div>

          {/* Close on mobile / Collapse toggle on desktop */}
          <div className="flex items-center gap-1">
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 transition"
              title={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
            >
              {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Items List with Scroll */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
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
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all group relative cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25 font-black'
                          : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/80 font-bold'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-purple-600'
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {/* Badges / Counters */}
                      {!isCollapsed && item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 shadow-2xs ${
                            isActive ? 'bg-white/20 text-white border border-white/30' : (item.badgeColor || 'bg-slate-100 text-slate-700')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip on Collapsed Mode */}
                      {isCollapsed && item.badge && (
                        <span className="absolute top-1.5 start-1.5 w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-slate-600 px-1 font-bold">
            {!isCollapsed && <span>صوت الإشعارات</span>}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl transition flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200'
                  : 'bg-slate-200/70 text-slate-500 hover:text-slate-700'
              }`}
              title={soundEnabled ? 'تعطيل نغمة التنبيهات' : 'تفعيل نغمة التنبيهات'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-purple-700" /> : <VolumeX className="w-3.5 h-3.5" />}
              {!isCollapsed && <span>{soundEnabled ? 'مفعل' : 'صامت'}</span>}
            </button>
          </div>

          {!isCollapsed && (
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-xs font-black text-purple-700">
                  👑
                </div>
                <div className="text-[11px] font-black text-slate-800 truncate">
                  Admin Active
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
