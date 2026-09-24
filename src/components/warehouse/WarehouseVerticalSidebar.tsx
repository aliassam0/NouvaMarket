import React from 'react';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  RotateCcw,
  Box,
  Search,
  DollarSign,
  BarChart3,
  Building2,
  X,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Send,
  Plus,
  TrendingUp,
  CreditCard,
  Zap,
  Radio,
  Bell
} from 'lucide-react';
import { MoneyText } from '../ui/MoneyText';

export type WarehouseTab =
  | 'pending'
  | 'preparation'
  | 'delivery'
  | 'completed'
  | 'returned'
  | 'products'
  | 'tracking'
  | 'financial'
  | 'analytics'
  | 'profile';

interface WarehouseVerticalSidebarProps {
  activeTab: WarehouseTab;
  onSelectTab: (tab: WarehouseTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  counts: {
    pendingCount: number;
    preparationCount: number;
    deliveryCount: number;
    completedCount: number;
    returnedCount: number;
    productsCount: number;
  };
  availableBalance: number;
  supplierName: string;
  onOpenPayoutModal: () => void;
  onOpenPickupModal: () => void;
  onOpenAddProduct: () => void;
}

export function WarehouseVerticalSidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  counts,
  availableBalance,
  supplierName,
  onOpenPayoutModal,
  onOpenPickupModal,
  onOpenAddProduct,
}: WarehouseVerticalSidebarProps) {
  const navGroups = [
    {
      groupTitle: 'مراحل تجهيز الطلبيات والشحن',
      items: [
        {
          id: 'pending' as WarehouseTab,
          label: '1. مراجعة وتأكيد الطلبيات',
          shortLabel: '1. المراجعة',
          icon: Clock,
          badge: counts.pendingCount > 0 ? `${counts.pendingCount} طلب` : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-black animate-pulse',
        },
        {
          id: 'preparation' as WarehouseTab,
          label: '2. التحضير وتوليد البوردورو',
          shortLabel: '2. التحضير',
          icon: Package,
          badge: counts.preparationCount > 0 ? `${counts.preparationCount} طرد` : undefined,
          badgeColor: 'bg-violet-950 text-violet-300 font-bold',
        },
        {
          id: 'delivery' as WarehouseTab,
          label: '3. قيد التوصيل مع الشركات',
          shortLabel: '3. التوصيل',
          icon: Truck,
          badge: counts.deliveryCount > 0 ? `${counts.deliveryCount}` : undefined,
          badgeColor: 'bg-blue-950 text-blue-300',
        },
        {
          id: 'completed' as WarehouseTab,
          label: '4. طلبيات مسلمة ومكتملة',
          shortLabel: '4. المسلمة',
          icon: CheckCircle2,
          badge: `${counts.completedCount}`,
          badgeColor: 'bg-emerald-950 text-emerald-300',
        },
        {
          id: 'returned' as WarehouseTab,
          label: '5. المرتجعات والرجوع',
          shortLabel: '5. المرتجعات',
          icon: RotateCcw,
          badge: counts.returnedCount > 0 ? `${counts.returnedCount}` : undefined,
          badgeColor: 'bg-rose-950 text-rose-300',
        },
        {
          id: 'tracking' as WarehouseTab,
          label: 'تتبع الشحنات ومزامنة API',
          shortLabel: 'التتبع والـ API',
          icon: Search,
          badge: 'Live API',
          badgeColor: 'bg-cyan-950 text-cyan-300',
        },
      ],
    },
    {
      groupTitle: 'إدارة المنتجات والمخزون والمالية',
      items: [
        {
          id: 'products' as WarehouseTab,
          label: 'منتجاتي والمخزون الحي',
          shortLabel: 'المنتجات',
          icon: Box,
          badge: `${counts.productsCount} صنف`,
          badgeColor: 'bg-purple-950 text-purple-300',
        },
        {
          id: 'financial' as WarehouseTab,
          label: 'التحصيلات وسحب المستحقات',
          shortLabel: 'المالية',
          icon: DollarSign,
          badge: availableBalance > 0 ? `${Math.round(availableBalance / 1000)}k دج` : undefined,
          badgeColor: 'bg-emerald-500 text-slate-950 font-black',
        },
        {
          id: 'analytics' as WarehouseTab,
          label: 'إحصائيات المبيعات والأداء',
          shortLabel: 'الإحصائيات',
          icon: BarChart3,
        },
        {
          id: 'profile' as WarehouseTab,
          label: 'بيانات المستودع والحساب',
          shortLabel: 'الملف',
          icon: Building2,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Warehouse Vertical Sidebar */}
      <aside
        className={`fixed lg:relative top-0 right-0 z-50 lg:z-20 h-full transition-all duration-300 flex flex-col bg-slate-900/95 dark:bg-slate-900 border-s border-purple-900/50 shadow-2xl backdrop-blur-md select-none shrink-0 ${
          isMobileOpen ? 'translate-x-0 w-72' : 'translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-68'}`}
        dir="rtl"
      >
        {/* Sidebar Header Brand */}
        <div className="p-4 border-b border-purple-900/40 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-violet-500/20 shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-black text-sm text-white tracking-tight truncate">
                    {supplierName || 'المستودع المعتمد'}
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </div>
                <p className="text-[11px] text-purple-300/80 font-medium truncate">
                  مستودع وشريك لوجستي
                </p>
              </div>
            )}
          </div>

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

        {/* Available Balance Box inside Sidebar */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 p-3 rounded-2xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-800/50 shadow-inner">
            <div className="flex items-center justify-between text-[11px] text-purple-300 font-bold">
              <span>مستحقاتك الجاهزة للسحب:</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-black text-emerald-400 font-mono">
                {availableBalance.toLocaleString()} <span className="text-xs">دج</span>
              </span>
              <button
                onClick={onOpenPayoutModal}
                className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-black transition active:scale-95 shadow-sm"
              >
                طلب سحب
              </button>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
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
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
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

                      {!isCollapsed && item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 shadow-2xs ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {isCollapsed && item.badge && (
                        <span className="absolute top-1.5 start-1.5 w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Operations Action in Sidebar Footer */}
        <div className="p-3 border-t border-purple-900/40 bg-slate-950/60 space-y-2 shrink-0">
          <button
            onClick={onOpenPickupModal}
            className="w-full py-2 px-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95"
            title="طلب سيارة جمع الطرود (Demande Ramassage)"
          >
            <Truck className="w-3.5 h-3.5 text-purple-300" />
            {!isCollapsed && <span>طلب راماساج (Ramassage)</span>}
          </button>

          <button
            onClick={onOpenAddProduct}
            className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
            title="إضافة منتج جديد للمستودع"
          >
            <Plus className="w-3.5 h-3.5" />
            {!isCollapsed && <span>+ إضافة منتج جديد</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
