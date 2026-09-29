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
  Bell,
  Boxes,
} from 'lucide-react';
import { MoneyText } from '../ui/MoneyText';

export type WarehouseTab =
  | 'pipeline'
  | 'pending'
  | 'preparation'
  | 'delivery'
  | 'completed'
  | 'returned'
  | 'inbound'
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
    pipelineCount?: number;
  };
  availableBalance: number;
  supplierName: string;
  isPlatformWarehouse?: boolean;
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
  isPlatformWarehouse = false,
  onOpenPayoutModal,
  onOpenPickupModal,
  onOpenAddProduct,
}: WarehouseVerticalSidebarProps) {
  const navGroups = isPlatformWarehouse
    ? [
        {
          groupTitle: 'تجهيز الشحنات والعمليات اللوجستية',
          items: [
            {
              id: 'preparation' as WarehouseTab,
              label: '1. بيان تحضير الطلبيات',
              shortLabel: 'بيان التحضير',
              icon: Package,
              badge: counts.preparationCount > 0 ? `${counts.preparationCount} طرد` : undefined,
              badgeColor: 'bg-violet-100 text-violet-800 border border-violet-200 font-bold',
            },
            {
              id: 'delivery' as WarehouseTab,
              label: '2. وصل تسليم الناقل (Bordereau)',
              shortLabel: 'وصل الناقل',
              icon: Truck,
              badge: counts.deliveryCount > 0 ? `${counts.deliveryCount}` : undefined,
              badgeColor: 'bg-blue-100 text-blue-800 border border-blue-200 font-semibold',
            },
            {
              id: 'completed' as WarehouseTab,
              label: '3. مطابقة كاش الـ COD',
              shortLabel: 'مطابقة COD',
              icon: CheckCircle2,
              badge: `${counts.completedCount}`,
              badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold',
            },
            {
              id: 'returned' as WarehouseTab,
              label: '4. فحص جودة المرتجعات QC',
              shortLabel: 'فحص المرتجعات',
              icon: RotateCcw,
              badge: counts.returnedCount > 0 ? `${counts.returnedCount}` : undefined,
              badgeColor: 'bg-rose-100 text-rose-800 border border-rose-200 font-semibold',
            },
          ],
        },
        {
          groupTitle: 'المخزون ومعدلات التوصيل بالولايات',
          items: [
            {
              id: 'inbound' as WarehouseTab,
              label: 'استقبال كراتين التوريد',
              shortLabel: 'كراتين التوريد',
              icon: Boxes,
              badge: 'توريد',
              badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
            },
            {
              id: 'products' as WarehouseTab,
              label: 'مواقع الأرفف والمخزون',
              shortLabel: 'الأرفف والمخزون',
              icon: Box,
              badge: `${counts.productsCount} صنف`,
              badgeColor: 'bg-purple-100 text-purple-800 border border-purple-200 font-semibold',
            },
            {
              id: 'tracking' as WarehouseTab,
              label: 'معدلات التوصيل بالولايات',
              shortLabel: 'معدلات التوصيل',
              icon: Search,
              badge: '58 ولاية',
              badgeColor: 'bg-cyan-100 text-cyan-800 border border-cyan-200 font-semibold',
            },
          ],
        },
        {
          groupTitle: 'المالية وأتعاب التغليف والسحب',
          items: [
            {
              id: 'financial' as WarehouseTab,
              label: 'التحصيلات وأتعاب التغليف والسحب (Card 4)',
              shortLabel: 'أتعاب التغليف والتحصيلات',
              icon: DollarSign,
              badge: 'Pick & Pack 📦',
              badgeColor: 'bg-amber-100 text-amber-800 border border-amber-300 font-black',
            },
            {
              id: 'analytics' as WarehouseTab,
              label: 'إحصائيات الأداء ومعدلات التوصيل',
              shortLabel: 'الإحصائيات',
              icon: BarChart3,
            },
            {
              id: 'profile' as WarehouseTab,
              label: 'بيانات المستودع وحسابات الدفع',
              shortLabel: 'الملف والحساب',
              icon: Building2,
            },
          ],
        },
      ]
    : [
        {
          groupTitle: 'متابعة حركة الطلبيات والسلع (مزامنة فورية)',
          items: [
            {
              id: 'pipeline' as WarehouseTab,
              label: 'متابعة حركة الطلبيات (المزامنة الحية)',
              shortLabel: 'حركة الطلبيات',
              icon: Package,
              badge: counts.pipelineCount && counts.pipelineCount > 0 ? `${counts.pipelineCount} طلب` : undefined,
              badgeColor: 'bg-violet-100 text-violet-800 border border-violet-200 font-bold',
            },
            {
              id: 'products' as WarehouseTab,
              label: '1. منتجاتي وأسعار الجملة',
              shortLabel: '1. المنتجات',
              icon: Box,
              badge: `${counts.productsCount} صنف`,
              badgeColor: 'bg-purple-100 text-purple-800 border border-purple-200 font-semibold',
            },
            {
              id: 'inbound' as WarehouseTab,
              label: '2. شحنات التوريد لمستودع المنصة',
              shortLabel: '2. إرسال شحنة',
              icon: Boxes,
              badge: 'إرسال توريد 🚚',
              badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
            },
            {
              id: 'completed' as WarehouseTab,
              label: '3. مبيعات الجملة المحققة',
              shortLabel: '3. مبيعات الجملة',
              icon: CheckCircle2,
              badge: `${counts.completedCount}`,
              badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold',
            },
            {
              id: 'returned' as WarehouseTab,
              label: '4. سجل السلع المرتجعة للمخزون',
              shortLabel: '4. المرتجعات',
              icon: RotateCcw,
              badge: counts.returnedCount > 0 ? `${counts.returnedCount}` : undefined,
              badgeColor: 'bg-rose-100 text-rose-800 border border-rose-200 font-semibold',
            },
          ],
        },
        {
          groupTitle: 'الأرباح وسحب المستحقات والملف',
          items: [
            {
              id: 'financial' as WarehouseTab,
              label: isPlatformWarehouse ? 'التحصيلات وأتعاب التغليف والسحب' : 'مستحقات مبيعات الجملة والسحب',
              shortLabel: isPlatformWarehouse ? 'التحصيلات والأتعاب' : 'مستحقات الجملة',
              icon: DollarSign,
              badge: availableBalance > 0 ? `${Math.round(availableBalance / 1000)}k دج` : undefined,
              badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-black',
            },
            {
              id: 'analytics' as WarehouseTab,
              label: 'إحصائيات المبيعات والأداء',
              shortLabel: 'الإحصائيات',
              icon: BarChart3,
            },
            {
              id: 'profile' as WarehouseTab,
              label: 'الملف وحسابات الدفع CCP / BaridiMob',
              shortLabel: 'الملف والحساب',
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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Warehouse Vertical Sidebar - Crisp Clean Light Design */}
      <aside
        className={`fixed lg:relative top-0 right-0 z-50 lg:z-20 h-full transition-all duration-300 flex flex-col bg-white border-s border-slate-200 shadow-xl select-none shrink-0 ${
          isMobileOpen ? 'translate-x-0 w-72' : 'translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-68'}`}
        dir="rtl"
      >
        {/* Sidebar Header Brand */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 ${
              isPlatformWarehouse
                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-500/20'
                : 'bg-gradient-to-br from-amber-600 to-orange-600 shadow-amber-500/20'
            }`}>
              {isPlatformWarehouse ? (
                <Boxes className="w-5 h-5 text-white" />
              ) : (
                <Building2 className="w-5 h-5 text-white" />
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-black text-sm text-slate-900 tracking-tight truncate">
                    {isPlatformWarehouse
                      ? 'مستودع المنصة'
                      : supplierName || 'بوابة المورّد'}
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {isPlatformWarehouse
                    ? 'مركز التجهيز والشحن اللوجستي'
                    : 'حساب توريد السلع بالجملة'}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-violet-700 hover:bg-violet-50 border border-slate-200 transition"
              title={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
            >
              {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Available Balance Box inside Sidebar */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 p-3 rounded-2xl bg-gradient-to-br from-violet-50/80 to-indigo-50/60 border border-violet-100 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold">
              <span>{isPlatformWarehouse ? 'تحصيلات المنصة المؤكدة:' : 'مستحقاتك الجاهزة للسحب:'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-1">
              <span className="text-base font-black text-emerald-600 font-mono">
                {availableBalance.toLocaleString()} <span className="text-xs">دج</span>
              </span>
              <button
                onClick={onOpenPayoutModal}
                className={`px-2.5 py-1 rounded-lg text-white text-[11px] font-black transition active:scale-95 shadow-xs ${
                  isPlatformWarehouse
                    ? 'bg-violet-600 hover:bg-violet-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                title={isPlatformWarehouse ? 'ترحيل التحصيلات إلى خزينة المنصة المركزية' : 'طلب سحب المستحقات'}
              >
                {isPlatformWarehouse ? 'ترحيل للخزينة' : 'طلب سحب'}
              </button>
            </div>
            {isPlatformWarehouse && (
              <div className="mt-1.5 pt-1.5 border-t border-violet-200/60 text-[9px] text-slate-500 flex items-center justify-between font-medium">
                <span>عوائد السلع + رسوم التغليف</span>
                <span className="text-violet-700 font-black">خزينة المنصة 🏛️</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation Sections */}
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
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25 font-black'
                          : 'text-slate-600 hover:text-violet-700 hover:bg-violet-50/80 font-bold'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-violet-600'
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 shadow-2xs ${
                            isActive ? 'bg-white/20 text-white border border-white/30' : (item.badgeColor || 'bg-slate-100 text-slate-700')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {isCollapsed && item.badge && (
                        <span className="absolute top-1.5 start-1.5 w-2 h-2 rounded-full bg-violet-600 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Operations Action in Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80 space-y-2 shrink-0">
          {isPlatformWarehouse ? (
            <button
              onClick={onOpenPickupModal}
              className="w-full py-2 px-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-800 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
              title="طلب سيارة جمع الطرود من المستودع المركزي (Demande Ramassage)"
            >
              <Truck className="w-3.5 h-3.5 text-violet-600" />
              {!isCollapsed && <span>طلب راماساج للمستودع</span>}
            </button>
          ) : (
            <button
              onClick={() => onSelectTab('inbound')}
              className="w-full py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
              title="إرسال شحنة توريد بضاعة جديدة لمستودع المنصة المركزي"
            >
              <Boxes className="w-3.5 h-3.5 text-emerald-600" />
              {!isCollapsed && <span>📦 إرسال شحنة توريد للمستودع</span>}
            </button>
          )}

          <button
            onClick={onOpenAddProduct}
            className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
            title={isPlatformWarehouse ? "إضافة صنف جديد للمخزون المركزي" : "إضافة منتج جديد بسعر الجملة"}
          >
            <Plus className="w-3.5 h-3.5" />
            {!isCollapsed && <span>+ إضافة منتج جديد</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
