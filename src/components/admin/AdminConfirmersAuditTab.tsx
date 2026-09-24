import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  UserCheck,
  ShieldCheck,
  Award,
  TrendingUp,
  PackageCheck,
  Truck,
  Clock,
  Search,
  Eye,
  Edit3,
  UserPlus,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  ExternalLink,
  X,
  Phone,
  FileText,
  Boxes,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Order, SystemUser } from '../../types';

interface AdminConfirmersAuditTabProps {
  orders: Order[];
  systemUsers: SystemUser[];
  onOpenAddUserModal: () => void;
  onEditUser: (user: SystemUser) => void;
  onToggleUserStatus: (user: SystemUser) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSwitchToConfirmerDashboard?: (confirmer?: any) => void;
}

export function AdminConfirmersAuditTab({
  orders,
  systemUsers,
  onOpenAddUserModal,
  onEditUser,
  onToggleUserStatus,
  onShowToast,
  onSwitchToConfirmerDashboard,
}: AdminConfirmersAuditTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectingUser, setInspectingUser] = useState<SystemUser | null>(null);

  // Filter system users who have the ORDER_CONFIRMER role or have confirmed orders
  const confirmersList = useMemo(() => {
    return systemUsers.filter((u) => u.role === 'ORDER_CONFIRMER' || u.role === 'ADMIN');
  }, [systemUsers]);

  // Compute individual performance audit for each confirmer
  const confirmerPerformanceList = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return confirmersList.map((user) => {
      // Find orders confirmed by this user
      const userConfirmedOrders = orders.filter(
        (o) => o.confirmedBy === user.id || o.confirmerName === user.fullName
      );

      const confirmedToday = userConfirmedOrders.filter((o) =>
        o.confirmedAt?.startsWith(todayStr)
      );

      const inTransit = userConfirmedOrders.filter(
        (o) => o.status === 'SHIPPED' || o.status === 'PROCESSING' || (o.adminConfirmed && o.status === 'CONFIRMED')
      );

      const delivered = userConfirmedOrders.filter((o) => o.status === 'DELIVERED');
      const deliveredToday = delivered.filter((o) => o.deliveredAt?.startsWith(todayStr));

      const failedOrCancelled = userConfirmedOrders.filter(
        (o) => o.status === 'FAILED' || o.status === 'CANCELLED'
      );

      const closedOrdersCount = delivered.length + failedOrCancelled.length;
      const successRate =
        closedOrdersCount > 0
          ? Math.round((delivered.length / closedOrdersCount) * 100)
          : userConfirmedOrders.length > 0
          ? 100
          : 0;

      const deliveredSalesDzd = delivered.reduce(
        (acc, o) => acc + (o.totalAmount || 0) + (o.shippingFee || 0),
        0
      );

      const totalCallsCount = userConfirmedOrders.reduce(
        (acc, o) => acc + (o.callAttempts || 1),
        0
      );

      return {
        user,
        totalConfirmed: userConfirmedOrders.length,
        confirmedToday: confirmedToday.length,
        inTransit: inTransit.length,
        delivered: delivered.length,
        deliveredToday: deliveredToday.length,
        failedOrCancelled: failedOrCancelled.length,
        successRate,
        deliveredSalesDzd,
        totalCallsCount,
        ordersList: userConfirmedOrders,
      };
    });
  }, [confirmersList, orders]);

  // Team Summary Metrics
  const teamMetrics = useMemo(() => {
    let totalConfirmedAll = 0;
    let totalDeliveredAll = 0;
    let totalInTransitAll = 0;
    let totalDeliveredSalesAll = 0;

    confirmerPerformanceList.forEach((c) => {
      totalConfirmedAll += c.totalConfirmed;
      totalDeliveredAll += c.delivered;
      totalInTransitAll += c.inTransit;
      totalDeliveredSalesAll += c.deliveredSalesDzd;
    });

    const closed = totalDeliveredAll;
    const avgDeliveryRate =
      totalConfirmedAll > 0
        ? Math.round((totalDeliveredAll / (totalDeliveredAll + (totalConfirmedAll - totalDeliveredAll - totalInTransitAll || 1))) * 100)
        : 100;

    // Best performer
    const topPerformer = [...confirmerPerformanceList].sort(
      (a, b) => b.delivered - a.delivered || b.totalConfirmed - a.totalConfirmed
    )[0];

    return {
      totalConfirmers: confirmersList.length,
      totalConfirmedAll,
      totalDeliveredAll,
      totalInTransitAll,
      totalDeliveredSalesAll,
      avgDeliveryRate: Math.min(100, Math.max(0, avgDeliveryRate)),
      topPerformerName: topPerformer?.user?.fullName || 'لا يوجد بعد',
    };
  }, [confirmerPerformanceList, confirmersList]);

  // Filtered by search term
  const filteredConfirmerPerformance = useMemo(() => {
    if (!searchTerm.trim()) return confirmerPerformanceList;
    const q = searchTerm.toLowerCase().trim();
    return confirmerPerformanceList.filter(
      (c) =>
        c.user.fullName.toLowerCase().includes(q) ||
        c.user.email.toLowerCase().includes(q)
    );
  }, [confirmerPerformanceList, searchTerm]);

  return (
    <div className="space-y-4">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <PhoneCall className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                لوحة تدقيق ومراقبة أداء مؤكدي الطلبيات (Order Confirmers Audit)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                متابعة دقيقة لعدد الطلبيات المؤكدة لكل مؤكد، وعدد الطلبيات المتابعة حتى التسليم النهائي، ونسبة النجاح.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenAddUserModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ إضافة مؤكد طلبات جديد</span>
        </button>
      </div>

      {/* 2. Team Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">فريق المؤكدين</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {teamMetrics.totalConfirmers}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
              موظف نشط
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">إجمالي المؤكدة</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-purple-600 font-mono">
              {teamMetrics.totalConfirmedAll}
            </span>
            <span className="text-[10px] text-purple-600 font-medium">
              طلبية
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">متابعة حتى التسليم</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-600 font-mono">
              {teamMetrics.totalDeliveredAll}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">
              مسلّمة بنجاح
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">قيد الشحن والمتابعة</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-blue-600 font-mono">
              {teamMetrics.totalInTransitAll}
            </span>
            <span className="text-[10px] text-blue-600 font-medium">
              في الطريق
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">معدل نجاح الفريق</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-amber-500 font-mono">
              {teamMetrics.avgDeliveryRate}%
            </span>
            <span className="text-[10px] text-amber-600 font-bold">
              نسبة التسليم
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">المبيعات المسلّمة</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
              {teamMetrics.totalDeliveredSalesAll.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              دج
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="ابحث باسم مؤكد الطلبيات أو البريد الإلكتروني..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full ps-9 pe-3 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition"
        />
      </div>

      {/* 4. Detailed Audit Table of Each Confirmer */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-bold">
              <tr>
                <th className="p-3.5 text-start">مؤكد الطلبيات</th>
                <th className="p-3.5 text-center">الحالة</th>
                <th className="p-3.5 text-center">إجمالي المؤكدة</th>
                <th className="p-3.5 text-center">تأكيدات اليوم</th>
                <th className="p-3.5 text-center">قيد التوصيل</th>
                <th className="p-3.5 text-center">تمت متابعتها حتى التسليم</th>
                <th className="p-3.5 text-center">فشل / ملغاة</th>
                <th className="p-3.5 text-center">نسبة نجاح التسليم</th>
                <th className="p-3.5 text-center">قيمة المبيعات المسلّمة</th>
                <th className="p-3.5 text-center">إجراءات وتدقيق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredConfirmerPerformance.map((item) => {
                const u = item.user;
                const isSuperAdmin = u.id === 'usr-1';

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Confirmer Info */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-emerald-600 text-xs">
                          {u.fullName.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {u.role === 'ADMIN' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                أدمن
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onToggleUserStatus(u)}
                        disabled={isSuperAdmin}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                        } ${isSuperAdmin ? 'opacity-80 cursor-default' : 'hover:opacity-80 cursor-pointer'}`}
                      >
                        {u.status === 'ACTIVE' ? 'نشط' : 'معطّل'}
                      </button>
                    </td>

                    {/* Total Confirmed */}
                    <td className="p-3.5 text-center">
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm bg-purple-50 dark:bg-purple-950/50 px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800">
                        {item.totalConfirmed}
                      </span>
                    </td>

                    {/* Confirmed Today */}
                    <td className="p-3.5 text-center">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        +{item.confirmedToday}
                      </span>
                    </td>

                    {/* In Transit */}
                    <td className="p-3.5 text-center">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {item.inTransit}
                      </span>
                    </td>

                    {/* Delivered */}
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center gap-1 font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.delivered}</span>
                      </div>
                    </td>

                    {/* Failed / Cancelled */}
                    <td className="p-3.5 text-center">
                      <span className="font-mono font-bold text-rose-500">
                        {item.failedOrCancelled}
                      </span>
                    </td>

                    {/* Success Rate */}
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className={`font-mono font-black text-xs ${
                          item.successRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : item.successRate >= 60 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {item.successRate}%
                        </span>
                      </div>
                    </td>

                    {/* Delivered Sales DZD */}
                    <td className="p-3.5 text-center font-mono font-black text-slate-900 dark:text-white">
                      {item.deliveredSalesDzd.toLocaleString()} دج
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setInspectingUser(u)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[11px] flex items-center gap-1 border border-purple-200 dark:border-purple-800 transition"
                          title="فحص وتدقيق تفاصيل كل طلبيات هذا المؤكد"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>تدقيق الطلبيات ({item.totalConfirmed})</span>
                        </button>

                        <button
                          onClick={() => onEditUser(u)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                          title="تعديل الحساب وكلمة السر"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: DETAILED AUDIT INSPECTION FOR A SPECIFIC CONFIRMER */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-5">
          <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-black text-sm">
                  {inspectingUser.fullName.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <span>تدقيق ومراقبة طلبيات المؤكد:</span>
                    <span className="text-emerald-400">{inspectingUser.fullName}</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono" dir="ltr">
                    {inspectingUser.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onSwitchToConfirmerDashboard && (
                  <button
                    onClick={() => {
                      setInspectingUser(null);
                      onSwitchToConfirmerDashboard(inspectingUser);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">معاينة واجهة المؤكد</span>
                  </button>
                )}
                <button
                  onClick={() => setInspectingUser(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Orders list for this confirmer */}
            {(() => {
              const userOrders = orders.filter(
                (o) => o.confirmedBy === inspectingUser.id || o.confirmerName === inspectingUser.fullName
              );

              return (
                <div className="flex-1 overflow-y-auto space-y-3 pe-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold pb-1">
                    <span>إجمالي الطلبيات المسجلة لهذا المؤكد: ({userOrders.length})</span>
                    <span>
                      مسلّمة: {userOrders.filter((o) => o.status === 'DELIVERED').length} • قيد الشحن:{' '}
                      {userOrders.filter((o) => o.status === 'SHIPPED').length}
                    </span>
                  </div>

                  {userOrders.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                      لم يقم هذا الموظف بتأكيد أي طلبيات حتى الآن.
                    </div>
                  ) : (
                    userOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-emerald-400">
                              #{order.trackingCode || order.id}
                            </span>
                            <span className="text-slate-400">
                              الزبون: <strong className="text-white">{order.customerName}</strong>
                            </span>
                            <span className="text-slate-400 font-mono" dir="ltr">
                              ({order.phone})
                            </span>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                              order.status === 'DELIVERED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : order.status === 'SHIPPED'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-purple-950 text-purple-300 border border-purple-800'
                            }`}
                          >
                            {order.statusAr || order.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl">
                          <div>
                            <span>العنوان: </span>
                            <strong className="text-slate-200">
                              {order.wilaya} - {order.commune}
                            </strong>
                          </div>
                          <div>
                            <span>تاريخ التأكيد: </span>
                            <strong className="text-slate-200 font-mono">
                              {order.confirmedAt ? new Date(order.confirmedAt).toLocaleString('ar-DZ') : 'غير مسجل'}
                            </strong>
                          </div>
                          <div>
                            <span>المبلغ: </span>
                            <strong className="text-amber-300 font-mono">
                              {((order.totalAmount || 0) + (order.shippingFee || 0)).toLocaleString()} دج
                            </strong>
                          </div>
                        </div>

                        {order.confirmationNote && (
                          <div className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded-xl border border-slate-800">
                            📝 ملاحظة التأكيد: {order.confirmationNote}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setInspectingUser(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                إغلاق نافذة التدقيق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
