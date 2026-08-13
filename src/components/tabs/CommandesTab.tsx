import React, { useState } from 'react';
import { Package, Search, Clock, CheckCircle2, Truck, AlertTriangle, XCircle, Share2, Eye, RefreshCw, Printer, ShieldCheck, Code, Check, Pencil, Lock, Trash2, Send, Zap, Radio, Globe, Key, FileSearch, AlertCircle, MapPin } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useLanguage } from '../../context/LanguageContext';
import { Order, OrderStatus } from '../../types';
import { MoneyText } from '../ui/MoneyText';
import { ProfitBadge } from '../ui/ProfitBadge';
import { formatDate } from '../../lib/formatters';
import { DateFilterBar, DateFilterMode, matchesDateFilter } from '../common/DateFilterBar';
import { UnifiedOrderStatusBadge } from '../ui/UnifiedOrderStatusBadge';
import { ShipmentTrackingTool } from '../common/ShipmentTrackingTool';
import { ShippingRatesModal } from '../common/ShippingRatesModal';

function CodStepsProgress({ order }: { order: Order }) {
  const isLinkOrder = order.status === 'LINK_ORDER';
  const isConfirmed = order.adminConfirmed || order.status === 'CONFIRMED';
  const isFailedConfirmation = (order.status === 'CANCELLED' || !!order.failureReason) && !isConfirmed && !isLinkOrder;
  const isReturned = (order.status === 'FAILED' || order.situation === 'Retour') && isConfirmed;
  const isDelivered = order.status === 'DELIVERED' || order.situation === 'Livré';
  const isShipped = isDelivered || order.status === 'SHIPPED' || order.avancement === 'En livraison' || order.situation === 'EnTransit' || order.situation === 'EnCours';
  const isPreparing = isShipped || order.status === 'PROCESSING' || order.situation === 'EnPréparation' || order.situation === 'EnTraitement';

  const resellerStatusLabel = isLinkOrder
    ? 'طلب من الرابط'
    : isFailedConfirmation
    ? 'فشل التأكيد'
    : isReturned
    ? 'مرتجع'
    : isDelivered
    ? 'تم التوصيل'
    : isShipped
    ? 'قيد التوصيل'
    : isPreparing
    ? 'قيد التحضير'
    : isConfirmed
    ? 'تم التأكيد'
    : 'قيد المراجعة';

  const steps = [
    { id: 0, label: 'طلب من الرابط', active: isLinkOrder, completed: !isLinkOrder, icon: Share2 },
    { id: 1, label: 'قيد المراجعة', active: !isLinkOrder && !isConfirmed && !isPreparing && !isFailedConfirmation, completed: isConfirmed || isPreparing, icon: FileSearch },
    { id: 2, label: 'تم التأكيد', active: isConfirmed && !isPreparing && !isFailedConfirmation, completed: isPreparing, icon: ShieldCheck },
    { id: 3, label: 'قيد التحضير', active: isPreparing && !isShipped && !isFailedConfirmation, completed: isShipped, icon: Clock },
    { id: 4, label: 'قيد التوصيل', active: isShipped && !isDelivered && !isReturned, completed: isDelivered, icon: Truck },
    { id: 5, label: 'تم التوصيل', active: isDelivered, completed: isDelivered, icon: CheckCircle2 },
  ];

  return (
    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
      <div className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-slate-300">
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>حالة الطلب:</span>
        </span>
        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
          isLinkOrder
            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 font-extrabold'
            : isFailedConfirmation
            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
            : isReturned
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            : isDelivered
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            : isShipped
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
            : isPreparing
            ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
            : isConfirmed
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
        }`}>
          {resellerStatusLabel}
        </span>
      </div>

      {isFailedConfirmation && (
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] space-y-1">
          <div className="font-extrabold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>سبب عدم التأكيد: {order.failureReason || order.cancellationReason || 'معلومات ناقصة'}</span>
          </div>
          <p className="text-[10px] text-rose-600 dark:text-rose-400">
            يمكنك اضغط زر "تعديل المعلومات" لتصحيح البيانات وإعادة إرسال الطلب للمراجعة.
          </p>
        </div>
      )}

      {!isFailedConfirmation && !isReturned && (
        <div className="grid grid-cols-6 gap-1 pt-1">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div key={st.id} className="flex flex-col items-center text-center">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                    st.completed
                      ? 'bg-emerald-600 text-white'
                      : st.active
                      ? 'bg-amber-500 text-white ring-2 ring-amber-300 dark:ring-amber-800 animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span
                  className={`text-[8px] sm:text-[9px] font-extrabold mt-1 leading-tight ${
                    st.active || st.completed
                      ? 'text-slate-900 dark:text-white font-black'
                      : 'text-slate-400'
                  }`}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function isFailedOrCancelledOrder(order: Order): boolean {
  return (
    order.status === 'FAILED' ||
    order.status === 'CANCELLED' ||
    order.situation === 'Retour' ||
    order.situation === 'Échec' ||
    order.situation === 'Annulé' ||
    order.situation === 'Supprimé' ||
    Boolean(order.failureReason) ||
    Boolean(order.cancellationReason)
  );
}

export function CommandesTab() {
  const { orders, pendingLinkOrdersCount, filterStatus, setFilterStatus, getFilteredOrders, confirmAndShipOrder, updateOrder, updateOrderStatus, markReadyToShip, deleteParcel, retryDelivery, resubmitOrder, deleteOrder } = useOrders();
  const { t, language } = useLanguage();

  const [selectedOrderTracking, setSelectedOrderTracking] = useState<Order | null>(null);
  const [selectedApiDetails, setSelectedApiDetails] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchPhone, setSearchPhone] = useState('');
  const [viewRole, setViewRole] = useState<'reseller' | 'admin_warehouse'>('reseller');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modals & Navigation State
  const [showShippingRatesModal, setShowShippingRatesModal] = useState(false);
  const [showTrackingTool, setShowTrackingTool] = useState(false);

  // Webhook Real-time State
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookTrackingInput, setWebhookTrackingInput] = useState('EC1234AAA');
  const [webhookSituationInput, setWebhookSituationInput] = useState('Livré');
  const [webhookAvancementInput, setWebhookAvancementInput] = useState('En livraison');
  const [testWebhookResponse, setTestWebhookResponse] = useState<any>(null);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  // Edit Form State
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhone2, setEditPhone2] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editWilaya, setEditWilaya] = useState('');
  const [editCommune, setEditCommune] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editNote, setEditNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updatedSuccessLabelUrl, setUpdatedSuccessLabelUrl] = useState<string | null>(null);

  // Date Filtering State
  const [dateMode, setDateMode] = useState<DateFilterMode>('today');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const parseOrderTimestamp = (createdAtStr?: string): number => {
    if (!createdAtStr) return 0;
    if (createdAtStr.includes('/')) {
      const parts = createdAtStr.split(' ')[0].split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        return new Date(y, m, d).getTime();
      }
    }
    const t = new Date(createdAtStr).getTime();
    return isNaN(t) ? 0 : t;
  };

  const filtered = getFilteredOrders()
    .filter(
      (o) =>
        (o.customerName.toLowerCase().includes(searchPhone.toLowerCase()) ||
          o.phone.includes(searchPhone) ||
          o.id.toLowerCase().includes(searchPhone.toLowerCase())) &&
        matchesDateFilter(o.createdAt, dateMode, singleDate, startDate, endDate)
    )
    .sort((a, b) => parseOrderTimestamp(b.createdAt) - parseOrderTimestamp(a.createdAt));

  const handleConfirmAndSendToDelivery = async (orderId: string) => {
    setConfirmingId(orderId);
    const res = await confirmAndShipOrder(orderId);
    setConfirmingId(null);
    if (res.message) showNotice(res.message);
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { message: msg, type: 'success' },
        })
      );
    }
  };

  const handleRunWebhookTest = async (overrideTracking?: string) => {
    setIsSendingWebhook(true);
    setTestWebhookResponse(null);
    const targetTracking = overrideTracking || webhookTrackingInput || 'EC1234AAA';

    try {
      const res = await fetch('/api/delivery/webhook/trigger-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking: targetTracking,
          situation: webhookSituationInput,
          avancement: webhookAvancementInput,
        }),
      });
      const data = await res.json();
      setIsSendingWebhook(false);
      setTestWebhookResponse(data);
      if (data.success) {
        showNotice('✔ Test OK - تم إرسال Callback الـ Webhook وتحديث حالة الطرد المباشر!');
      }
    } catch (err) {
      setIsSendingWebhook(false);
      setTestWebhookResponse({ error: 'فشل إرسال Webhook' });
    }
  };

  const handlePrintLabel = (order: Order) => {
    const url = order.bordereauUrl || `/api/delivery/label/${order.id}?tracking=${order.trackingCode || 'TC' + order.id.replace('ORD-', '') + 'LHJ'}`;
    window.open(url, '_blank');
  };

  const isOrderLocked = (order: Order) => {
    return (
      !!order.adminConfirmed ||
      !!(order as any).warehouseConfirmed ||
      !!order.isLockedForEdit ||
      !!order.confirmedAt ||
      order.status === 'CONFIRMED' ||
      order.status === 'PROCESSING' ||
      order.status === 'SHIPPED' ||
      order.status === 'DELIVERED' ||
      order.situation === 'EnTraitement' ||
      order.situation === 'EnPréparation' ||
      order.situation === 'EnTransit' ||
      order.situation === 'Livré' ||
      order.situation === 'Confirmé'
    );
  };

  const openEditModal = (order: Order) => {
    if (isOrderLocked(order)) {
      showNotice('لا يمكن تعديل هذه الطلبية لأنها مؤكدة ومقفلة بالمستودع');
      return;
    }
    setEditingOrder(order);
    setEditCustomerName(order.customerName);
    setEditPhone(order.phone);
    setEditPhone2(order.phone2 || '');
    setEditAddress(order.address);
    setEditWilaya(order.wilaya);
    setEditCommune(order.commune);
    setEditTotal(String(order.totalAmount + (order.shippingFee || 0)));
    setEditNote(order.noteFournisseur || '');
    setUpdateError(null);
    setUpdatedSuccessLabelUrl(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setIsUpdating(true);
    setUpdateError(null);

    const parsedTotal = parseFloat(editTotal) || editingOrder.totalAmount;

    const res = await resubmitOrder(editingOrder.id, {
      customerName: editCustomerName,
      phone: editPhone,
      phone2: editPhone2,
      address: editAddress,
      wilaya: editWilaya,
      commune: editCommune,
      totalAmount: Math.max(0, parsedTotal - (editingOrder.shippingFee || 0)),
      noteFournisseur: editNote,
      status: 'PENDING_SYNC' as OrderStatus,
      statusAr: 'قيد المراجعة',
      statusFr: 'En révision',
      failureReason: undefined,
      cancellationReason: undefined,
      adminConfirmed: false,
      isLockedForEdit: false,
    });

    setIsUpdating(false);

    if (!res.success) {
      setUpdateError('حدث خطأ أثناء تعديل وإعادة تقديم الطرد');
    } else {
      setEditingOrder(null);
      showNotice('✔ تم تحديث وإعادة تقديم الطلب للمستودع بنجاح (قيد المراجعة)!');
    }
  };

  const handleMarkReadyToShip = async (order: Order) => {
    const tracking = order.trackingCode || ("TC" + order.id.replace("ORD-", "") + "LHJ");
    const res = await markReadyToShip([tracking]);
    showNotice(res.message || 'تم تحويل الطرد إلى حالة En Traitement (جاهز للشحن)');
  };

  const handleDeleteParcel = async (order: Order) => {
    if (!confirm(`هل أنت تأكد من إلغاء وحذف الطرد رقم ${order.id} من نظام شركة التوصيل؟`)) return;
    const tracking = order.trackingCode || ("TC" + order.id.replace("ORD-", "") + "LHJ");
    const res = await deleteParcel([tracking]);
    showNotice(res.message || 'تم إلغاء وحذف الطرد بنجاح');
  };

  const getStatusBadge = (status: OrderStatus, textAr: string, textFr: string, order?: Order) => {
    if (status === 'LINK_ORDER' || order?.status === 'LINK_ORDER') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 border border-amber-300">
          <Share2 className="w-3.5 h-3.5 text-amber-600" />
          <span>طلب من الرابط</span>
        </span>
      );
    }

    if (order?.status === 'CANCELLED' || order?.status === 'FAILED' || order?.situation === 'Annulé') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1 border border-rose-200 dark:border-rose-800">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>ملغاة من الأدمن</span>
        </span>
      );
    }

    if (order?.adminConfirmed || status === 'CONFIRMED') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>مؤكدة</span>
        </span>
      );
    }

    if (status === 'PENDING_SYNC' || !order?.adminConfirmed) {
      return null;
    }

    switch (status) {
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? textAr : textFr}</span>
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 text-[11px] font-bold flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? textAr : textFr}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? textAr : textFr}</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 pb-24 overflow-y-auto p-4 text-slate-900 dark:text-slate-100 space-y-4">
      {/* Toast Notification Banner */}
      {actionNotice && (
        <div className="fixed top-4 inset-x-4 z-50 p-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center justify-between border border-emerald-400 animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-violet-600" />
          <span>{t('orders.title')}</span>
        </h1>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Shipping Rates Button */}
          <button
            onClick={() => setShowShippingRatesModal(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>🚚 أسعار التوصيل (68 ولاية)</span>
          </button>

          {/* Shipment Tracking Toggle Button */}
          <button
            onClick={() => setShowTrackingTool(!showTrackingTool)}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md transition ${
              showTrackingTool
                ? 'bg-violet-600 text-white ring-2 ring-violet-400'
                : 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{showTrackingTool ? 'إخفاء أداة التتبع' : '📦 تتبع الشحنة'}</span>
          </button>

          {viewRole === 'admin_warehouse' && (
            <button
              onClick={() => setShowWebhookModal(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>⚡ Webhook</span>
            </button>
          )}

          <span className="text-xs text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            {filtered.length} طلبية
          </span>
        </div>
      </div>

      {/* Embedded Shipment Tracking Section */}
      {showTrackingTool && (
        <div className="animate-fadeIn">
          <ShipmentTrackingTool onShowNotice={showNotice} />
        </div>
      )}

      {/* Shipping Rates Modal */}
      {showShippingRatesModal && (
        <ShippingRatesModal onClose={() => setShowShippingRatesModal(false)} />
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          placeholder="ابحث برقم الهاتف، الاسم، أو رقم الطلب..."
          className="w-full ps-10 pe-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-xs"
        />
      </div>

      {/* Date Filter Bar */}
      <DateFilterBar
        dateMode={dateMode}
        setDateMode={setDateMode}
        singleDate={singleDate}
        setSingleDate={setSingleDate}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />

      {/* Pending Link Orders Banner */}
      {viewRole === 'reseller' && pendingLinkOrdersCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border-2 border-amber-500/40 dark:border-amber-500/30 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <span>تنبيه: يوجد {pendingLinkOrdersCount} طلبات جديدة واردة من روابط المشاركة</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black">
                  تنتظر التأكيد
                </span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                قم بمراجعة بيانات الزبون وتأكيد نقل الطلب بنقرة واحدة إلى المراجعة والمستودع.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus('LINK_ORDER')}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition cursor-pointer shadow-xs ${
              filterStatus === 'LINK_ORDER'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            تصفية الطلبات ➔
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', labelAr: 'الكل', labelFr: 'Toutes' },
          ...(viewRole === 'reseller'
            ? [
                {
                  id: 'LINK_ORDER',
                  labelAr: '🔗 طلب من الرابط',
                  labelFr: 'Commandes via lien',
                  badge: pendingLinkOrdersCount,
                },
              ]
            : []),
          { id: 'REVIEW', labelAr: '🔍 قيد المراجعة', labelFr: 'En révision' },
          { id: 'CONFIRMED', labelAr: 'تم التأكيد', labelFr: 'Confirmée' },
          { id: 'PROCESSING', labelAr: 'قيد التحضير', labelFr: 'En préparation' },
          { id: 'SHIPPED', labelAr: 'قيد التوصيل', labelFr: 'En transit' },
          { id: 'DELIVERED', labelAr: 'تم التسليم', labelFr: 'Livrées' },
          { id: 'FAILED', labelAr: 'فشل التسليم', labelFr: 'Échecs' },
        ].map((tab) => {
          const badgeVal = tab.badge || 0;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <span>{language === 'ar' ? tab.labelAr : tab.labelFr}</span>
              {badgeVal > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black leading-none animate-pulse">
                  {badgeVal}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
          لا توجد طلبات في هذه القائمة حالياً.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            let cardBorderStyle = 'border-2 border-slate-200 dark:border-slate-700/80 border-s-4 border-s-amber-500';
            if (order.status === 'DELIVERED' || order.situation === 'Livre') {
              cardBorderStyle = 'border-2 border-emerald-200 dark:border-emerald-900/80 border-s-4 border-s-emerald-500';
            } else if (order.status === 'FAILED' || order.status === 'CANCELLED' || order.situation === 'Retour') {
              cardBorderStyle = 'border-2 border-rose-200 dark:border-rose-900/80 border-s-4 border-s-rose-500';
            } else if (order.status === 'SHIPPED' || order.situation === 'EnTransit' || order.situation === 'EnTraitement') {
              cardBorderStyle = 'border-2 border-violet-200 dark:border-violet-900/80 border-s-4 border-s-violet-500';
            } else if (order.status === 'PROCESSING' || order.adminConfirmed) {
              cardBorderStyle = 'border-2 border-blue-200 dark:border-blue-900/80 border-s-4 border-s-blue-500';
            }

            return (
              <div
                key={order.id}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900 ${cardBorderStyle} shadow-xs hover:shadow-md transition-all duration-200 space-y-3`}
              >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {order.customerName} ({order.phone})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    رقم: {order.id} • {formatDate(order.createdAt, language)}
                  </span>
                </div>
                {getStatusBadge(order.status, order.statusAr, order.statusFr, order)}
              </div>

              {/* COD Steps Progress Stepper (البائع) */}
              <CodStepsProgress order={order} />

              {order.status === 'LINK_ORDER' && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-extrabold text-amber-900 dark:text-amber-200">
                    <span>🔗 طلب جديد وارد عبر رابط المنتج</span>
                    <span className="text-[10px] bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded-full font-black">
                      في انتظار موافقة البائع
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        updateOrderStatus(order.id, 'PENDING_SYNC');
                        updateOrder(order.id, {
                          status: 'PENDING_SYNC',
                          statusAr: '🔍 قيد المراجعة (في انتظار التأكيد)',
                          statusFr: 'En révision',
                          situation: 'En révision',
                          source: order.source || 'LINK'
                        });
                        showNotice('✔ تم تأكيد الطلب بنجاح ونقله إلى سجل قيد المراجعة!');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>✅ تأكيد نقل لقيد المراجعة</span>
                    </button>

                    <button
                      onClick={() => {
                        deleteOrder(order.id);
                        showNotice('🗑️ تم حذف الطلب نهائياً بناءً على إلغاء البائع');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>❌ إلغاء وحذف الطلب</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Items summary */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="line-clamp-1">
                      • {it.productName} ({it.variantSize}) × {it.quantity}
                    </span>
                    <span className="font-bold">
                      <MoneyText amount={it.sellingPrice * it.quantity} />
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery Wilaya & Tracking */}
              <div className="flex justify-between items-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                <div>
                  <span>📍 {order.wilaya} - {order.commune}</span>
                  {order.noteFournisseur && (
                    <span className="block text-[10px] text-violet-600 font-bold">ملاحظة: {order.noteFournisseur}</span>
                  )}
                </div>
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {order.trackingCode || ("TC" + order.id.replace("ORD-", "") + "LHJ")}
                </span>
              </div>

              {/* Unified Order Status */}
              <UnifiedOrderStatusBadge order={order} />

              {/* Admin & Warehouser Confirmation & Status Bar - Admin & Warehouse Only */}
              {viewRole === 'admin_warehouse' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      إدارة شحنة شركة التوصيل:
                    </span>
                    {order.isLockedForEdit || order.situation === 'EnTraitement' ? (
                      <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        جاهزة للشحن (En Traitement) - مقفلة
                      </span>
                    ) : order.adminConfirmed ? (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        مؤكدة وفي حالة 'En Préparation'
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-600">في انتظار التأكيد والشحن</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {!order.adminConfirmed ? (
                      <button
                        onClick={() => handleConfirmAndSendToDelivery(order.id)}
                        disabled={confirmingId === order.id}
                        className="col-span-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Truck className="w-4 h-4" />
                        <span>
                          {confirmingId === order.id
                            ? 'جاري إرسال الطرد لـ POST /Api_v1/Colis ...'
                            : 'تأكيد الطرد وإرساله لشركة التوصيل'}
                        </span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleMarkReadyToShip(order)}
                          disabled={order.isLockedForEdit || order.situation === 'EnTraitement'}
                          className="py-2 px-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-300 text-white text-[11px] font-bold transition flex items-center justify-center gap-1"
                          title="PUT /Api_v1/aExpédier"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>تحويل لـ جاهز للشحن</span>
                        </button>

                        <button
                          onClick={() => handleDeleteParcel(order)}
                          className="py-2 px-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[11px] font-bold transition flex items-center justify-center gap-1"
                          title="PUT /Api_v1/Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>إلغاء / حذف الطرد</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Cancellation & Failure Reason Banner for Seller with Edit & Delete options */}
              {isFailedOrCancelledOrder(order) && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-black text-rose-700 dark:text-rose-300">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>طرد فشل تسليمه أو ألغي من المستودع/شركة التوصيل</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 text-[10px] font-black">
                      إلغاء / فشل تسليم
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-rose-800 dark:text-rose-200">
                    سبب الفشل / الإلغاء: <span className="underline font-black">{order.cancellationReason || order.failureReason || order.statusAr || 'فشل التسليم'}</span>
                  </div>

                  {/* Seller Quick Action Buttons on Failed Delivery Order */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200/60 dark:border-rose-900/40">
                    {!isOrderLocked(order) && (
                      <button
                        onClick={() => openEditModal(order)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>تعديل البيانات وإعادة الإرسال</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`هل أنت تأكد من رغبتك في حذف الطلبية رقم ${order.id} من سجل الطلبيات؟`)) {
                          deleteOrder(order.id);
                          showNotice('✔ تم حذف الطلبية بنجاح من سجل الطلبيات');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-200 hover:bg-rose-300 dark:bg-rose-900/80 dark:hover:bg-rose-800 text-rose-900 dark:text-rose-100 font-extrabold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الطلبية من السجل</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Card Footer: Profit & Actions */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block">ربحك المقدر:</span>
                  <ProfitBadge profit={order.totalProfit} size="sm" />
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Reseller Edit Order Button: Hidden after warehouse/admin confirmation or lock */}
                  {!isOrderLocked(order) && (
                    <button
                      onClick={() => openEditModal(order)}
                      className="p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950 dark:text-amber-300 cursor-pointer"
                      title="تعديل معلومات الطرد وإعادة الإرسال"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                  )}

                  {/* Reseller Delete Order Button: Allowed for failed delivery/cancelled orders or unconfirmed orders */}
                  {(isFailedOrCancelledOrder(order) || (!order.adminConfirmed && order.status === 'PENDING_SYNC')) && (
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت تأكد من رغبتك في حذف الطلبية رقم ${order.id} من سجل الطلبيات؟`)) {
                          deleteOrder(order.id);
                          showNotice('✔ تم حذف الطلبية بنجاح من سجل الطلبيات');
                        }
                      }}
                      className="p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300 cursor-pointer"
                      title="حذف الطلبية من سجل الطلبيات"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  )}

                  {/* Print Label Button - Admin & Warehouse Only */}
                  {viewRole === 'admin_warehouse' && (
                    <button
                      onClick={() => handlePrintLabel(order)}
                      className="p-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-800 dark:bg-violet-950 dark:text-violet-300 font-bold text-xs flex items-center gap-1 transition"
                      title="طباعة ملصق الشحن / Étiquette"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>الملصق</span>
                    </button>
                  )}

                  {/* View API Details Button - Admin Only */}
                  {viewRole === 'admin_warehouse' && (
                    <button
                      onClick={() => setSelectedApiDetails(order)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 transition"
                      title="معاينة حمولات API"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>API</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* EDIT ORDER MODAL (PUT /Api_v1/Colis/{Tracking}) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-5 shadow-2xl space-y-4 relative border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingOrder(null)}
              className="absolute top-4 end-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Pencil className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  تعديل معلومات الطرد #{editingOrder.id}
                </h3>
                <span className="text-[11px] text-slate-500 block">
                  سيتم إرسال التحديث مباشرة لشركة التوصيل عبر PUT /Api_v1/Colis/{editingOrder.trackingCode || 'TC'}
                </span>
              </div>
            </div>

            {updateError && (
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            {updatedSuccessLabelUrl && (
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-900 text-xs font-bold space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تم تعديل معلومات الطرد بنجاح وتجهيز الملصق الجديد!</span>
                </div>
                <button
                  onClick={() => window.open(updatedSuccessLabelUrl, '_blank')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الملصق الجديد ببيانات صحيحة</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">الاسم الكامل للزبون:</label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">الهاتف الرئيسي:</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">الهاتف الثاني:</label>
                  <input
                    type="text"
                    value={editPhone2}
                    onChange={(e) => setEditPhone2(e.target.value)}
                    placeholder="اختياري"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">الولاية:</label>
                  <input
                    type="text"
                    value={editWilaya}
                    onChange={(e) => setEditWilaya(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">البلدية:</label>
                  <input
                    type="text"
                    value={editCommune}
                    onChange={(e) => setEditCommune(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">العنوان الدقيق:</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">المبلغ الإجمالي عند الاستلام (دج):</label>
                <input
                  type="number"
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">ملاحظات للموصل:</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="مثال: الاتصال قبل الوصول بـ 30 دقيقة"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Pencil className="w-4 h-4" />
                  <span>{isUpdating ? 'جاري التعديل عبر API...' : 'حفظ وتحديث شركة التوصيل'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery API Inspector Modal */}
      {selectedApiDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-slate-900 text-white rounded-3xl p-5 shadow-2xl space-y-4 relative border border-slate-800 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedApiDetails(null)}
              className="absolute top-4 end-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Code className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  توثيق واختبار جميع Endpoints التوصيل
                </h3>
                <span className="text-[10px] text-slate-400 block">
                  طرد رقم: {selectedApiDetails.id} • Tracking: {selectedApiDetails.trackingCode || 'TC'}
                </span>
              </div>
            </div>

            {/* Request Headers */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-emerald-400 block">Headers المطلوبة:</label>
              <pre className="p-3 rounded-xl bg-slate-950 text-[10px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
{`key: 3490e731e3db4d8c841991987d3cab0f
token: b8386c67-f0ce-4ce5-bc3b-cf3246a90819
Content-Type: application/json`}
              </pre>
            </div>

            {/* Endpoint 1: Add Colis */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-emerald-400 block">1. إضافة طردجديد: POST /Api_v1/Colis</label>
              <pre className="p-3 rounded-xl bg-slate-950 text-[10px] font-mono text-emerald-300 overflow-x-auto border border-slate-800">
{JSON.stringify({
  Colis: [
    {
      Echange: 0,
      Stopdesk: selectedApiDetails.deliveryType === 'office' ? 1 : 0,
      NomComplet: selectedApiDetails.customerName,
      Mobile_1: selectedApiDetails.phone,
      Mobile_2: selectedApiDetails.phone2 || "",
      Adresse: selectedApiDetails.address,
      Wilaya: selectedApiDetails.wilaya.split(' ')[0] || "16",
      Commune: selectedApiDetails.commune,
      Article: selectedApiDetails.items.map(i => i.productName).join(' + '),
      Total: String(selectedApiDetails.totalAmount + selectedApiDetails.shippingFee),
      ID_Externe: selectedApiDetails.id
    }
  ]
}, null, 2)}
              </pre>
            </div>

            {/* Endpoint 2: PUT /Api_v1/Colis/{Tracking} */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-amber-400 block">2. تعديل معلومات طرد: PUT /Api_v1/Colis/{selectedApiDetails.trackingCode || 'TC'}</label>
              <pre className="p-3 rounded-xl bg-slate-950 text-[10px] font-mono text-amber-300 overflow-x-auto border border-slate-800">
{JSON.stringify({
  Colis: {
    NomComplet: selectedApiDetails.customerName,
    Mobile_1: selectedApiDetails.phone,
    Mobile_2: selectedApiDetails.phone2 || "",
    Adresse: selectedApiDetails.address,
    Commune: selectedApiDetails.commune,
    Wilaya: selectedApiDetails.wilaya,
    Article: selectedApiDetails.items.map(i => i.productName).join(' + '),
    Ref_Article: selectedApiDetails.id,
    NoteFournisseur: selectedApiDetails.noteFournisseur || "قبل 16h",
    Total: String(selectedApiDetails.totalAmount + selectedApiDetails.shippingFee),
    ID_Externe: selectedApiDetails.id
  }
}, null, 2)}
              </pre>
            </div>

            {/* Endpoint 3: PUT /Api_v1/aExpédier */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-violet-400 block">3. تحويل لـ جاهز للشحن: PUT /Api_v1/aExpédier</label>
              <pre className="p-3 rounded-xl bg-slate-950 text-[10px] font-mono text-violet-300 overflow-x-auto border border-slate-800">
{JSON.stringify({
  Colis: [
    { Tracking: selectedApiDetails.trackingCode || "TC317LHJ" }
  ]
}, null, 2)}
              </pre>
            </div>

            {/* Endpoint 4: PUT /Api_v1/Supprimer */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-rose-400 block">4. إلغاء/حذف طرد: PUT /Api_v1/Supprimer</label>
              <pre className="p-3 rounded-xl bg-slate-950 text-[10px] font-mono text-rose-300 overflow-x-auto border border-slate-800">
{JSON.stringify({
  Colis: [
    { Tracking: selectedApiDetails.trackingCode || "TC317LHJ" }
  ]
}, null, 2)}
              </pre>
            </div>

            {/* Endpoint 5: GET /Api_v1/Colis (Afficher tous les colis) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-cyan-400 block">5. استرجاع جميع الطرود: GET /Api_v1/Colis (Header: Page: 1)</label>
              <pre className="p-3 rounded-xl bg-slate-950 text-[10px] font-mono text-cyan-300 overflow-x-auto border border-slate-800">
{JSON.stringify({
  Quota: {
    Consommer_1min: 1,
    Consommer_1h: 1,
    Consommer_24h: 1,
    Limite_1min: 40,
    Limite_1h: 1500,
    Limite_24h: 15000
  },
  Nb_Colis: 1,
  Nb_Page: 1,
  Current_Page: 1,
  Colis: [
    {
      Date_Création_D: formatDate(selectedApiDetails.createdAt, 'fr'),
      Tracking: selectedApiDetails.trackingCode || "TC317LHJ",
      ID_Externe: selectedApiDetails.id,
      label: `/api/delivery/label/${selectedApiDetails.id}`,
      Stopdesk: selectedApiDetails.deliveryType === 'office' ? 1 : 0,
      IDWilaya: parseInt(selectedApiDetails.wilaya) || 16,
      Echange: 0,
      Total: selectedApiDetails.totalAmount + selectedApiDetails.shippingFee,
      NomComplet: selectedApiDetails.customerName,
      Mobile_1: selectedApiDetails.phone,
      Adresse: selectedApiDetails.address,
      Commune_Bureau: selectedApiDetails.commune,
      Article: selectedApiDetails.items.map(i => i.productName).join(' + '),
      Ref_Article: selectedApiDetails.id,
      NoteFournisseur: selectedApiDetails.noteFournisseur || "",
      Date_Action_D: formatDate(selectedApiDetails.createdAt, 'fr'),
      Avancement: selectedApiDetails.avancement || "En Préparation",
      Situation: selectedApiDetails.situation || "EnCours",
      Commentaire: "طرد مسجل في النظام",
      Date_Livrée: null
    }
  ]
}, null, 2)}
              </pre>
            </div>

            {/* Endpoint 6: GET /Api_v1/Colis/Tracking/{Tracking} */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-teal-400 block">6. الاستعلام بكود التتبع: GET /Api_v1/Colis/Tracking/{selectedApiDetails.trackingCode || 'TC317LHJ'}</label>
              <pre className="p-3 rounded-xl bg-slate-950 text-[10px] font-mono text-teal-300 overflow-x-auto border border-slate-800">
{`GET /Api_v1/Colis/Tracking/${selectedApiDetails.trackingCode || 'TC317LHJ'}
Headers: { key: "3490e731e3db4d8c841991987d3cab0f", token: "b8386c67-f0ce-4ce5-bc3b-cf3246a90819" }`}
              </pre>
            </div>

            {/* Endpoint 7: POST /Api_v1/Colis/Liste */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-indigo-400 block">7. استرجاع قائمة طرود محددة: POST /Api_v1/Colis/Liste</label>
              <pre className="p-3 rounded-xl bg-slate-950 text-[10px] font-mono text-indigo-300 overflow-x-auto border border-slate-800">
{JSON.stringify({
  Colis: [
    { Tracking: selectedApiDetails.trackingCode || "TC317LHJ" }
  ]
}, null, 2)}
              </pre>
            </div>

            {/* Filter Date Endpoints */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-fuchsia-400 block">8. الفلترة بالتاريخ (Date_Creation / Date_Livree / Date_last_status):</label>
              <pre className="p-3 rounded-xl bg-slate-950 text-[10px] font-mono text-fuchsia-300 overflow-x-auto border border-slate-800">
{`GET /Api_v1/Colis/Date_Creation/2025-01-01
GET /Api_v1/Colis/Date_Livree/2025-01-01
GET /Api_v1/Colis/Date_last_status/2025-01-01`}
              </pre>
            </div>

            {/* Endpoint 9 & 10: Historique Endpoints */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-orange-400 block">9. استرجاع سجل تاريخ الإجراءات: GET /Api_v1/Historique/Tracking/{selectedApiDetails.trackingCode || 'TC317LHJ'}</label>
              <pre className="p-3 rounded-xl bg-slate-950 text-[10px] font-mono text-orange-300 overflow-x-auto border border-slate-800">
{JSON.stringify({
  Quota: {
    Consommer_1min: 4,
    Consommer_1h: 17,
    Consommer_24h: 68,
    Limite_1min: 40,
    Limite_1h: 1500,
    Limite_24h: 15000
  },
  Nb_Action: 1,
  Nb_Page: 1,
  Current_Page: 1,
  Historique: [
    {
      Date_Création: "29/07/24 06:30",
      Tracking: selectedApiDetails.trackingCode || "TC042AAA",
      Bureau: selectedApiDetails.commune ? `${selectedApiDetails.commune.toUpperCase()} 1` : "ORAN 1",
      Ville: parseInt(selectedApiDetails.wilaya) || 31,
      ServiceClient_Bureau: "0560606060",
      Avancement: selectedApiDetails.avancement || "En Préparation",
      Situation: selectedApiDetails.situation || "EnCours",
      Commentaire: selectedApiDetails.noteFournisseur || "سجل إجراءات الطرد"
    }
  ]
}, null, 2)}
              </pre>
            </div>

            {/* Endpoint 11: GET /Api_v1/Commune & /Api_v1/Commune/31 */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-emerald-400 block">11. قائمة البلديات المسجلة: GET /Api_v1/Commune/31</label>
              <pre className="p-3 rounded-xl bg-slate-950 text-[10px] font-mono text-emerald-300 overflow-x-auto border border-slate-800">
{JSON.stringify({
  Quota: {
    Consommer_1min: 1,
    Consommer_1h: 2,
    Consommer_24h: 5,
    Limite_1min: 40,
    Limite_1h: 1500,
    Limite_24h: 15000
  },
  Wilaya: "31",
  Nb_Commune: 4,
  Communes: [
    { ID: 3101, Nom: "Oran", IDWilaya: 31, CodePostal: "31000", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 3102, Nom: "Es Senia", IDWilaya: 31, CodePostal: "31100", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 3103, Nom: "Bir El Djir", IDWilaya: 31, CodePostal: "31015", LivraisonDomicile: 1, Stopdesk: 1 },
    { ID: 3104, Nom: "Arzew", IDWilaya: 31, CodePostal: "31200", LivraisonDomicile: 1, Stopdesk: 1 }
  ]
}, null, 2)}
              </pre>
            </div>

            {/* Endpoint 12: GET /Api_v1/Stopdesk & /Api_v1/Stopdesk/31 */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-sky-400 block">12. قائمة مكاتب التوصيل (Stopdesk / Bureaux): GET /Api_v1/Stopdesk/31</label>
              <pre className="p-3 rounded-xl bg-slate-950 text-[10px] font-mono text-sky-300 overflow-x-auto border border-slate-800">
{JSON.stringify({
  Quota: {
    Consommer_1min: 1,
    Consommer_1h: 2,
    Consommer_24h: 5,
    Limite_1min: 40,
    Limite_1h: 1500,
    Limite_24h: 15000
  },
  Wilaya: "31",
  Nb_Stopdesk: 3,
  Stopdesks: [
    { CodeStopdesk: "31A", Nom: "Bureau Central Oran Ville", IDWilaya: 31, Adresse: "Rue Larbi Ben M'hidi, Oran", Telephone: "0560112233", Commune: "Oran" },
    { CodeStopdesk: "31B", Nom: "Bureau Es Senia Depot", IDWilaya: 31, Adresse: "Zone Industrielle Es Senia", Telephone: "0560112234", Commune: "Es Senia" },
    { CodeStopdesk: "31C", Nom: "Bureau Bir El Djir Akid", IDWilaya: 31, Adresse: "Cité Akid Lotfi, Bir El Djir", Telephone: "0560112235", Commune: "Bir El Djir" }
  ]
}, null, 2)}
              </pre>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handlePrintLabel(selectedApiDetails)}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>فتح وصل الشحن والطباعة</span>
              </button>
              <button
                onClick={() => setSelectedApiDetails(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {selectedOrderTracking && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setSelectedOrderTracking(null)}
              className="absolute top-4 end-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              تتبع مسار الطلبية #{selectedOrderTracking.id}
            </h3>

            {/* Vertical timeline */}
            <div className="space-y-4 ps-2 border-s-2 border-violet-500 text-xs my-3">
              <div className="ps-3 relative">
                <div className="w-3 h-3 bg-violet-600 rounded-full absolute -start-[19px] top-0.5 border-2 border-white" />
                <span className="font-bold text-slate-900 dark:text-white block">تم تسجيل الطلبية بالمنصة</span>
                <span className="text-[10px] text-slate-400">{formatDate(selectedOrderTracking.createdAt, language)}</span>
              </div>

              <div className="ps-3 relative">
                <div className="w-3 h-3 bg-emerald-500 rounded-full absolute -start-[19px] top-0.5 border-2 border-white" />
                <span className="font-bold text-slate-900 dark:text-white block">حالة الطرد في شركة التوصيل</span>
                <span className="text-[10px] text-slate-400">
                  {selectedOrderTracking.situation === 'EnTraitement' ? 'En Traitement (جاهزة للشحن)' : 'En Préparation (قيد التحضير)'}
                </span>
              </div>

              <div className="ps-3 relative">
                <div className="w-3 h-3 bg-blue-500 rounded-full absolute -start-[19px] top-0.5 border-2 border-white" />
                <span className="font-bold text-slate-900 dark:text-white block">كود التتبع والتوصيل</span>
                <span className="text-[10px] text-slate-400">
                  {selectedOrderTracking.trackingCode || ("TC" + selectedOrderTracking.id.replace("ORD-", "") + "LHJ")}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handlePrintLabel(selectedOrderTracking)}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الملصق</span>
              </button>
              <button
                onClick={() => setSelectedOrderTracking(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowWebhookModal(false)}
              className="absolute top-4 end-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  تتبع الطرود في الوقت المباشر (Webhook)
                </h3>
                <p className="text-[11px] text-slate-400">Suivi des colis en temps réel - Livraison Callback</p>
              </div>
            </div>

            {/* Config details */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block">Nom du Webhook</label>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs flex items-center justify-between">
                  <span>Livraison_Callback</span>
                  <Radio className="w-4 h-4 text-cyan-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block">Clé Secrète</label>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 font-mono text-xs flex items-center justify-between overflow-x-auto">
                  <span>sec_ecom_3490e731e3db4d8c841991987d3cab0f</span>
                  <Key className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block">URL du Webhook</label>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-300 font-mono text-[11px] break-all flex items-center justify-between">
                  <span>https://api.tassyir.io/business/673539960388721011/ecom-delivery-webhook</span>
                  <Globe className="w-4 h-4 text-sky-400 shrink-0 ms-1" />
                </div>
              </div>
            </div>

            {/* Test Trigger Control */}
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>محاكاة واختبار إرسال الـ Webhook (Test Simulator)</span>
                </span>
                <button
                  onClick={() => handleRunWebhookTest()}
                  disabled={isSendingWebhook}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>✔ Test OK</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">كود التتبع (Tracking):</label>
                  <input
                    type="text"
                    value={webhookTrackingInput}
                    onChange={(e) => setWebhookTrackingInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Situation / Avancement:</label>
                  <select
                    value={webhookSituationInput}
                    onChange={(e) => {
                      setWebhookSituationInput(e.target.value);
                      if (e.target.value === 'Livré') setWebhookAvancementInput('En livraison');
                      else if (e.target.value === 'Annuler') setWebhookAvancementInput('Retour Fournisseur');
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  >
                    <option value="Livré">Livré (تم التسليم)</option>
                    <option value="EnCours">EnCours (قيد التوصيل)</option>
                    <option value="Annuler">Annuler (ملغاة)</option>
                    <option value="Reporté">Reporté (مؤجلة)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Test Payload JSON Output */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400">شكل حمولة البيانات (Webhook Payload Structure):</label>
                {testWebhookResponse && (
                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                    ✔ Test OK (200)
                  </span>
                )}
              </div>
              <pre className="p-3.5 rounded-2xl bg-slate-950 text-[10.5px] font-mono text-cyan-300 overflow-x-auto border border-slate-800 leading-relaxed">
{JSON.stringify({
  Source: "",
  Nom: "Livraison_Callback",
  id: 12345,
  occurred_at: "2025-10-20T14:10:00",
  data: {
    Tracking: webhookTrackingInput || "EC1234AAA",
    Situation: webhookSituationInput || "Livré",
    IDSituation: webhookSituationInput === "Livré" ? 7 : 1,
    Avancement: webhookAvancementInput || "En livraison",
    IDAvancement: 5
  }
}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowWebhookModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

