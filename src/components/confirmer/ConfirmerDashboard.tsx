import React, { useState, useMemo } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneOff,
  MessageCircle,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  AlertCircle,
  Calendar,
  MapPin,
  Search,
  Filter,
  User,
  RefreshCw,
  FileText,
  Check,
  X,
  ChevronDown,
  TrendingUp,
  BarChart3,
  Award,
  DollarSign,
  History,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Edit3,
  Save,
  Building2,
  Store,
  Tag,
  Boxes,
  HelpCircle,
  Share2,
  Copy,
  Navigation,
  UserCheck,
  CheckCheck,
  Zap,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderStatus } from '../../types';
import { ALGERIA_WILAYAS } from '../../data/algeriaLocations';
import { fetchDriverInfoFromCourierApi } from '../../lib/deliveryApiManager';
import { DateFilterBar, DateFilterMode, matchesDateFilter } from '../common/DateFilterBar';

interface ConfirmerDashboardProps {
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type ConfirmerTab = 'pending' | 'in_transit' | 'my_history' | 'my_stats';

const CALL_RESULTS = [
  { id: 'answered_confirmed', label: 'تم الرد والتأكيد بنجاح ✅', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200' },
  { id: 'no_answer_1', label: 'لم يرد (محاولة 1) 📞', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200' },
  { id: 'no_answer_2', label: 'لم يرد (محاولة 2) 📞', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/60 border-orange-200' },
  { id: 'busy', label: 'الخط مشغول ⏳', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-200' },
  { id: 'switched_off', label: 'الهاتف مغلق / غير متاح 📵', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-300' },
  { id: 'callback_later', label: 'طلب إعادة الاتصال لاحقاً ⏰', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 border-purple-200' },
  { id: 'cancelled_by_customer', label: 'الزبون ألغى الطلب ❌', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200' },
  { id: 'wrong_info', label: 'رقم أو عنوان خاطئ ⚠️', color: 'text-red-700 bg-red-50 dark:bg-red-950/60 border-red-200' },
];

export const COURIER_COORDINATION_STATUSES = [
  { id: 'out_for_delivery', label: 'خرجت مع الموزع للتسليم اليوم (Sortir en livraison) 🛵', shortLabel: 'خرجت للتسليم 🛵', color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/60 border-blue-200' },
  { id: 'notified_buyer', label: 'تم تنبيه المشتري برقم الموزع وبانتظار وصوله 📞', shortLabel: 'تم تنبيه المشتري 📞', color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200' },
  { id: 'driver_called_no_answer', label: 'الموزع اتصل والزبون لم يرد (متابعة عاجلة) ⚠️', shortLabel: 'الزبون لم يرد ⚠️', color: 'text-orange-700 bg-orange-50 dark:bg-orange-950/60 border-orange-200' },
  { id: 'customer_rescheduled', label: 'الزبون طلب تأجيل التسليم (Reporté) ⏰', shortLabel: 'طلب تأجيل ⏰', color: 'text-purple-700 bg-purple-50 dark:bg-purple-950/60 border-purple-200' },
  { id: 'address_clarified', label: 'تم توجيه الموزع للعنوان ونقطة الالتقاء 📍', shortLabel: 'توجيه للعنوان 📍', color: 'text-teal-700 bg-teal-50 dark:bg-teal-950/60 border-teal-200' },
  { id: 'delivered', label: 'تم التسليم بنجاح (Livré) 🎉', shortLabel: 'تم التسليم 🎉', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200' },
  { id: 'returned', label: 'تعذر التسليم / مرتجع للمستودع (Retour) ❌', shortLabel: 'تعذر / مرتجع ❌', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 border-rose-200' },
  { id: 'waiting_pickup', label: 'بانتظار استلام الموزع من المستودع 📦', shortLabel: 'بانتظار الاستلام 📦', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 border-amber-200' },
];

export function ConfirmerDashboard({ onShowToast }: ConfirmerDashboardProps) {
  const { user } = useAuth();
  const {
    orders,
    confirmOrderByAgent,
    claimOrderForConfirmer,
    releaseOrderFromConfirmer,
    logConfirmerCall,
    updateOrderTrackingFollowup,
    updateCourierCoordination,
    updateOrder,
  } = useOrders();

  const [activeTab, setActiveTab] = useState<ConfirmerTab>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'mine' | 'unassigned' | 'others'>('all');

  // Date filter state for confirmer (الكل, اليوم, الاسبوع, الشهر, تحديد تاريخ معين)
  const [dateMode, setDateMode] = useState<DateFilterMode>('all');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Call & Note modal state
  const [selectedOrderForCall, setSelectedOrderForCall] = useState<Order | null>(null);
  const [callResult, setCallResult] = useState<string>('answered_confirmed');
  const [callNote, setCallNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Coordination Desk Modal State (Courier Driver <-> Buyer)
  const [coordinatingOrder, setCoordinatingOrder] = useState<Order | null>(null);
  const [coordDriverName, setCoordDriverName] = useState('');
  const [coordDriverPhone, setCoordDriverPhone] = useState('');
  const [coordDriverCompany, setCoordDriverCompany] = useState('');
  const [coordStatus, setCoordStatus] = useState<any>('out_for_delivery');
  const [coordNotes, setCoordNotes] = useState('');
  const [isSavingCoord, setIsSavingCoord] = useState(false);
  const [showCoordinationGuide, setShowCoordinationGuide] = useState(false);

  // Edit Customer Info Modal
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhone2, setEditPhone2] = useState('');
  const [editWilaya, setEditWilaya] = useState('');
  const [editCommune, setEditCommune] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const agentId = user?.id || 'agent-default';
  const agentName = user?.fullName || 'مؤكد الطلبيات';

  // Extract unique suppliers from orders for filtering
  const suppliersList = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      o.items?.forEach((it) => {
        if (it.supplierEmail) set.add(it.supplierEmail);
      });
      if (o.supplierEmail) set.add(o.supplierEmail);
    });
    return Array.from(set);
  }, [orders]);

  // Statistics specific to this logged in confirmer
  const stats = useMemo(() => {
    // Orders confirmed by this agent
    const myConfirmedOrders = orders.filter(
      (o) => o.confirmedBy === agentId || o.confirmerName === agentName
    );

    // Confirmed today
    const todayStr = new Date().toISOString().split('T')[0];
    const myConfirmedToday = myConfirmedOrders.filter((o) =>
      o.confirmedAt?.startsWith(todayStr)
    );

    // In transit / follow-up
    const myInTransit = myConfirmedOrders.filter(
      (o) => o.status === 'SHIPPED' || o.status === 'PROCESSING' || o.status === 'CONFIRMED'
    );

    // Delivered
    const myDelivered = myConfirmedOrders.filter((o) => o.status === 'DELIVERED');
    const myDeliveredToday = myDelivered.filter((o) => o.deliveredAt?.startsWith(todayStr));

    // Cancelled / Failed
    const myFailedOrCancelled = myConfirmedOrders.filter(
      (o) => o.status === 'FAILED' || o.status === 'CANCELLED'
    );

    // Delivery success rate: delivered / (delivered + failed)
    const closedCount = myDelivered.length + myFailedOrCancelled.length;
    const deliverySuccessRate =
      closedCount > 0 ? Math.round((myDelivered.length / closedCount) * 100) : 100;

    // Total delivered value in DZD
    const deliveredVolumeDzd = myDelivered.reduce(
      (acc, o) => acc + (o.totalAmount || 0) + (o.shippingFee || 0),
      0
    );

    // Pending confirmation orders accessible to this agent (their own orders + unassigned orders)
    const accessiblePendingOrders = orders.filter((o) => {
      if (
        o.adminConfirmed ||
        o.confirmedBy ||
        o.confirmedByRole === 'SUPPLIER' ||
        o.status === 'CONFIRMED' ||
        o.status === 'PROCESSING' ||
        o.status === 'SHIPPED' ||
        o.status === 'CANCELLED' ||
        o.status === 'FAILED' ||
        o.status === 'DELIVERED'
      ) {
        return false;
      }
      const isMine =
        o.assignedConfirmerId === agentId ||
        o.confirmedBy === agentId ||
        o.trackingFollowedBy === agentId;
      const isOthers =
        !isMine &&
        Boolean(o.assignedConfirmerId || o.confirmedBy || o.trackingFollowedBy);

      // Confirmers cannot see orders under processing by other confirmers
      if (user?.role !== 'admin' && isOthers) {
        return false;
      }
      return true;
    });

    return {
      myConfirmedCount: myConfirmedOrders.length,
      myConfirmedTodayCount: myConfirmedToday.length,
      myInTransitCount: myInTransit.length,
      myDeliveredCount: myDelivered.length,
      myDeliveredTodayCount: myDeliveredToday.length,
      myFailedCount: myFailedOrCancelled.length,
      deliverySuccessRate,
      deliveredVolumeDzd,
      globalPendingCount: accessiblePendingOrders.length,
    };
  }, [orders, agentId, agentName, user?.role]);

  // Filtered orders list based on active tab and search
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Tab filtering
      if (activeTab === 'pending') {
        // Must be unconfirmed
        if (
          o.adminConfirmed ||
          o.confirmedBy ||
          o.confirmedByRole === 'SUPPLIER' ||
          o.status === 'CONFIRMED' ||
          o.status === 'PROCESSING' ||
          o.status === 'SHIPPED' ||
          o.status === 'DELIVERED' ||
          o.status === 'CANCELLED' ||
          o.status === 'FAILED'
        ) {
          return false;
        }
      } else if (activeTab === 'in_transit') {
        // Orders in transit or processing, especially confirmed by this agent or needing follow-up
        if (o.status !== 'SHIPPED' && o.status !== 'PROCESSING') {
          return false;
        }
      } else if (activeTab === 'my_history') {
        // Only orders confirmed or followed by this agent
        const isMine = o.confirmedBy === agentId || o.confirmerName === agentName || o.trackingFollowedBy === agentId;
        if (!isMine) return false;
      }

      // 2. Date filter (الكل, اليوم, الاسبوع, الشهر, تحديد تاريخ معين)
      if (!matchesDateFilter(o.createdAt, dateMode, singleDate, startDate, endDate)) {
        return false;
      }

      // 3. Wilaya filter
      if (selectedWilaya !== 'all') {
        if (!o.wilaya?.includes(selectedWilaya) && !o.wilayaCode?.includes(selectedWilaya)) {
          return false;
        }
      }

      // 4. Supplier filter
      if (selectedSupplier !== 'all') {
        const matchesSupplier =
          o.supplierEmail === selectedSupplier ||
          o.items?.some((it) => it.supplierEmail === selectedSupplier);
        if (!matchesSupplier) return false;
      }

      // 5. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = o.customerName?.toLowerCase().includes(q);
        const matchPhone = o.phone?.includes(q) || o.phone2?.includes(q);
        const matchId = o.id?.toLowerCase().includes(q) || o.trackingCode?.toLowerCase().includes(q);
        const matchAddress = o.address?.toLowerCase().includes(q) || o.commune?.toLowerCase().includes(q);
        const matchSeller = o.resellerName?.toLowerCase().includes(q);
        const matchItem = o.items?.some((i) => i.productName?.toLowerCase().includes(q));

        if (!matchName && !matchPhone && !matchId && !matchAddress && !matchSeller && !matchItem) {
          return false;
        }
      }

      // 6. Assignment Exclusivity Filter
      const isMine =
        o.assignedConfirmerId === agentId ||
        o.confirmedBy === agentId ||
        o.trackingFollowedBy === agentId;
      const isOthers =
        !isMine &&
        Boolean(o.assignedConfirmerId || o.confirmedBy || o.trackingFollowedBy);
      const isUnassigned = !isMine && !isOthers;

      // STRICT RULE: لا يمكن للمؤكد رؤية الطلبات التي هي تحت معالجة مؤكدين آخرين
      if (user?.role !== 'admin' && isOthers) {
        return false;
      }

      if (assignmentFilter === 'mine' && !isMine) return false;
      if (assignmentFilter === 'unassigned' && !isUnassigned) return false;
      if (assignmentFilter === 'others' && !isOthers) return false;

      return true;
    });
  }, [orders, activeTab, dateMode, singleDate, startDate, endDate, selectedWilaya, selectedSupplier, searchTerm, assignmentFilter, agentId, agentName, user?.role]);

  // Helper to verify if this order is exclusively locked by another confirmer
  const checkOrderExclusivity = (order: Order): { isLockedByOther: boolean; ownerName: string } => {
    const isAdmin = user?.role === 'admin' || agentId === 'admin';
    if (order.assignedConfirmerId && order.assignedConfirmerId !== agentId && !isAdmin) {
      return { isLockedByOther: true, ownerName: order.assignedConfirmerName || order.assignedConfirmerId };
    }
    if (order.confirmedBy && order.confirmedBy !== agentId && !isAdmin) {
      return { isLockedByOther: true, ownerName: order.confirmerName || order.confirmedBy };
    }
    if (order.trackingFollowedBy && order.trackingFollowedBy !== agentId && !isAdmin && (order.status === 'SHIPPED' || order.status === 'PROCESSING')) {
      return { isLockedByOther: true, ownerName: order.trackingFollowedByName || order.trackingFollowedBy };
    }
    return { isLockedByOther: false, ownerName: '' };
  };

  // Claim and lock order exclusively for current logged-in confirmer
  const handleClaimOrder = async (order: Order) => {
    const res = await claimOrderForConfirmer(order.id, { id: agentId, fullName: agentName });
    if (res.success) {
      onShowToast(res.message, 'success');
    } else {
      onShowToast(res.message, 'error');
    }
  };

  // Release order from current confirmer
  const handleReleaseOrder = async (order: Order) => {
    const res = await releaseOrderFromConfirmer(order.id, agentId);
    if (res.success) {
      onShowToast(res.message, 'info');
    } else {
      onShowToast(res.message, 'error');
    }
  };

  // Open Direct WhatsApp
  const handleOpenWhatsApp = (order: Order) => {
    const lock = checkOrderExclusivity(order);
    if (lock.isLockedByOther) {
      onShowToast(`⚠️ تنبيه: هذه الطلبية مسندة للمؤكد (${lock.ownerName}). يرجى ترك التواصل للمؤكد المسؤول عنها منعاً لازدواجية الاتصالات.`, 'info');
    }

    let cleanPhone = (order.phone || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '213' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('213')) {
      cleanPhone = '213' + cleanPhone;
    }

    const itemsSummary = order.items?.map((it) => `${it.productName} (كمية: ${it.quantity})`).join('، ') || 'طلبك';
    const msg = encodeURIComponent(
      `السلام عليكم ورحمة الله أخي الكريم ${order.customerName}،\nمعك قسم تأكيد الطلبيات من منصة Nouva Market 🛍️.\nنتصل بك بخصوص طلبيتك #${order.trackingCode || order.id}:\n• المنتجات: ${itemsSummary}\n• العنوان: ${order.wilaya} - ${order.commune}\n• المبلغ الإجمالي عند الاستلام: ${(order.totalAmount || 0) + (order.shippingFee || 0)} دج.\nيرجى تأكيد طلبك لتجهيزه وشحنه لك فوراً عبر شركة التوصيل.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  // Open Call Action Modal
  const handleOpenCallModal = (order: Order) => {
    const lock = checkOrderExclusivity(order);
    if (lock.isLockedByOther) {
      onShowToast(
        `⛔ غير مسموح: هذه الطلبية محجوزة ومكلفة للمؤكد (${lock.ownerName}). لا يمكن لمؤكدين بحسابين مختلفين تأكيد نفس الطلبية ومتابعتها.`,
        'error'
      );
      return;
    }

    // Automatically claim for this confirmer if unassigned
    if (!order.assignedConfirmerId && !order.confirmedBy && !order.adminConfirmed) {
      claimOrderForConfirmer(order.id, { id: agentId, fullName: agentName });
    }

    setSelectedOrderForCall(order);
    setCallResult('answered_confirmed');
    setCallNote('');
  };

  // Submit Call Action & Order Confirmation
  const handleSubmitCallAction = async () => {
    if (!selectedOrderForCall) return;

    const lock = checkOrderExclusivity(selectedOrderForCall);
    if (lock.isLockedByOther) {
      onShowToast(
        `⛔ غير مسموح: الطلبية مكلفة لمؤكد آخر (${lock.ownerName}). تم إلغاء العملية لمنع الازدواجية.`,
        'error'
      );
      setSelectedOrderForCall(null);
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedResultObj = CALL_RESULTS.find((r) => r.id === callResult);
      const resultText = selectedResultObj?.label || callResult;

      if (callResult === 'answered_confirmed') {
        // 1. Confirm Order and assign to warehouse & notify seller
        const res = await confirmOrderByAgent(
          selectedOrderForCall.id,
          { id: agentId, fullName: agentName },
          callNote.trim() || 'تم الاتصال بالزبون وتأكيد الطلبية وتثبيت العنوان هاتفياً'
        );

        if (res.success) {
          onShowToast(`✅ تم تأكيد الطلبية #${selectedOrderForCall.id} بنجاح ومزامنتها مع المستودع والمسوق!`, 'success');
        } else {
          onShowToast(res.message || 'حدث خطأ أثناء التأكيد', 'error');
        }
      } else if (callResult === 'cancelled_by_customer') {
        // Customer explicitly cancelled
        logConfirmerCall(
          selectedOrderForCall.id,
          { id: agentId, fullName: agentName },
          resultText,
          callNote.trim() || 'الزبون صرّح بإلغاء الطلبية أثناء المكالمة'
        );
        updateOrderTrackingFollowup(
          selectedOrderForCall.id,
          agentId,
          'CANCELLED',
          `ملغاة من طرف الزبون: ${callNote.trim() || 'الزبون غير مهتم / ألغى'}`,
          agentName
        );
        onShowToast(`تم تسجيل إلغاء الطلبية #${selectedOrderForCall.id} وإشعار المسوق`, 'info');
      } else {
        // Log attempt (did not answer, busy, callback later...)
        logConfirmerCall(
          selectedOrderForCall.id,
          { id: agentId, fullName: agentName },
          resultText,
          callNote.trim()
        );
        onShowToast(`📞 تم تسجيل محاولة الاتصال (${resultText}) للطلبية #${selectedOrderForCall.id}`, 'info');
      }

      setSelectedOrderForCall(null);
      setCallNote('');
    } catch (e: any) {
      onShowToast('حدث خطأ غير متوقع أثناء معالجة الطلبية', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Customer Info Modal
  const handleOpenEditCustomer = (order: Order) => {
    const lock = checkOrderExclusivity(order);
    if (lock.isLockedByOther) {
      onShowToast(
        `⛔ غير مسموح: بيانات هذه الطلبية مقفلة لحسابك لأنها تحت معالجة المؤكد (${lock.ownerName}).`,
        'error'
      );
      return;
    }
    setEditingOrder(order);
    setEditCustomerName(order.customerName || '');
    setEditPhone(order.phone || '');
    setEditPhone2(order.phone2 || '');
    setEditWilaya(order.wilaya || '');
    setEditCommune(order.commune || '');
    setEditAddress(order.address || '');
  };

  // Save Customer Info Edits
  const handleSaveCustomerEdits = async () => {
    if (!editingOrder) return;
    const lock = checkOrderExclusivity(editingOrder);
    if (lock.isLockedByOther) {
      onShowToast(`⛔ الطلبية مقفلة لمؤكد آخر (${lock.ownerName})`, 'error');
      setEditingOrder(null);
      return;
    }

    if (!editCustomerName.trim() || !editPhone.trim()) {
      onShowToast('يرجى كتابة اسم الزبون ورقم الهاتف بشكل صحيح', 'error');
      return;
    }

    try {
      await updateOrder(editingOrder.id, {
        customerName: editCustomerName.trim(),
        phone: editPhone.trim(),
        phone2: editPhone2.trim() || undefined,
        wilaya: editWilaya.trim(),
        commune: editCommune.trim(),
        address: editAddress.trim(),
      });
      onShowToast('تم تحديث بيانات الزبون والعنوان بنجاح 👍', 'success');
      setEditingOrder(null);
    } catch (e) {
      onShowToast('حدث خطأ أثناء تعديل البيانات', 'error');
    }
  };

  // Mark in-transit order as Delivered
  const handleMarkDelivered = (order: Order) => {
    const lock = checkOrderExclusivity(order);
    if (lock.isLockedByOther) {
      onShowToast(
        `⛔ غير مسموح: هذه الطلبية تحت مسؤولية المؤكد (${lock.ownerName}). لا يمكن لمؤكد آخر تحديث مسارها.`,
        'error'
      );
      return;
    }
    updateOrderTrackingFollowup(order.id, agentId, 'DELIVERED', 'تمت المتابعة والتسليم بنجاح للزبون', agentName);
    onShowToast(`🎉 مبروك! تم تسجيل تسليم الطلبية #${order.trackingCode || order.id} بنجاح واحتسابها في إحصائياتك!`, 'success');
  };

  // Mark in-transit order as Failed / Returned
  const handleMarkFailed = (order: Order) => {
    const lock = checkOrderExclusivity(order);
    if (lock.isLockedByOther) {
      onShowToast(
        `⛔ غير مسموح: هذه الطلبية تحت مسؤولية المؤكد (${lock.ownerName}). لا يمكن لمؤكد آخر تحديث مسارها.`,
        'error'
      );
      return;
    }
    const reason = window.prompt('يرجى كتابة سبب عدم الاستلام / الإرجاع (مثال: الزبون رفض الاستلام، عنوان خاطئ):', 'الزبون لم يرد على مندوب التوصيل');
    if (reason !== null) {
      updateOrderTrackingFollowup(order.id, agentId, 'FAILED', reason || 'فشل التسليم', agentName);
      onShowToast(`تم تسجيل إرجاع الطلبية #${order.trackingCode || order.id}`, 'info');
    }
  };

  // Automatic API fetching state
  const [isFetchingDriverFromApi, setIsFetchingDriverFromApi] = useState(false);
  const [fetchingOrderId, setFetchingOrderId] = useState<string | null>(null);

  // Fetch Courier Driver Info automatically via Delivery Partner API
  const handleFetchDriverFromApi = async (order: Order, silent: boolean = false) => {
    setIsFetchingDriverFromApi(true);
    setFetchingOrderId(order.id);
    try {
      const result = await fetchDriverInfoFromCourierApi(order);
      setCoordDriverName(result.driverName);
      setCoordDriverPhone(result.driverPhone);
      setCoordDriverCompany(result.driverCompany);

      // Instantly bind to order in context and database
      updateCourierCoordination(
        order.id,
        {
          driverName: result.driverName,
          driverPhone: result.driverPhone,
          driverCompany: result.driverCompany,
        },
        { id: agentId, fullName: agentName }
      );

      if (!silent) {
        onShowToast(`⚡ ${result.message}`, 'success');
      }
      return result;
    } catch (err) {
      if (!silent) {
        onShowToast('تعذر الاتصال بـ API شركة التوصيل حالياً', 'error');
      }
    } finally {
      setIsFetchingDriverFromApi(false);
      setFetchingOrderId(null);
    }
  };

  // Open Coordination Desk Modal (Courier Driver <-> Buyer)
  const handleOpenCoordination = (order: Order) => {
    const lock = checkOrderExclusivity(order);
    if (lock.isLockedByOther) {
      onShowToast(
        `⛔ غير مسموح: هذه الطلبية تحت متابعة وتنسيق المؤكد (${lock.ownerName}). لا يمكن لمؤكدين بحسابين مختلفين التنسيق على نفس الطلبية منعاً للازدواجية.`,
        'error'
      );
      return;
    }

    setCoordinatingOrder(order);
    setCoordDriverName(order.driverName || '');
    setCoordDriverPhone(order.driverPhone || '');
    setCoordDriverCompany(order.driverCompany || order.deliveryCompanyName || 'شركة التوصيل');
    setCoordStatus(order.coordinationStatus || (order.status === 'DELIVERED' ? 'delivered' : 'out_for_delivery'));
    setCoordNotes(order.coordinationNotes || '');

    // Automatically trigger API fetch if driver phone is not set yet
    if (!order.driverPhone) {
      handleFetchDriverFromApi(order, false);
    }
  };

  // Save Courier Coordination
  const handleSaveCoordination = (newCustomStatus?: OrderStatus) => {
    if (!coordinatingOrder) return;
    const lock = checkOrderExclusivity(coordinatingOrder);
    if (lock.isLockedByOther) {
      onShowToast(`⛔ الطلبية مقفلة لمؤكد آخر (${lock.ownerName})`, 'error');
      setCoordinatingOrder(null);
      return;
    }

    setIsSavingCoord(true);
    try {
      updateCourierCoordination(
        coordinatingOrder.id,
        {
          driverName: coordDriverName.trim() || undefined,
          driverPhone: coordDriverPhone.trim() || undefined,
          driverCompany: coordDriverCompany.trim() || undefined,
          coordinationNotes: coordNotes.trim() || undefined,
          coordinationStatus: coordStatus,
          newStatus: newCustomStatus,
        },
        { id: agentId, fullName: agentName }
      );

      onShowToast(`تم حفظ وتحديث بيانات التنسيق بين الموزع والمشتري للطلبية #${coordinatingOrder.trackingCode || coordinatingOrder.id} بنجاح 👍`, 'success');
      setCoordinatingOrder(null);
    } catch (e) {
      onShowToast('حدث خطأ أثناء حفظ التنسيق', 'error');
    } finally {
      setIsSavingCoord(false);
    }
  };

  // Send WhatsApp to Buyer with Delivery Driver info & reminder
  const handleSendWhatsAppToBuyerWithDriver = (order: Order, driverPhoneOverride?: string, driverNameOverride?: string) => {
    const lock = checkOrderExclusivity(order);
    if (lock.isLockedByOther) {
      onShowToast(`⚠️ تنبيه: هذه الطلبية تحت إشراف المؤكد (${lock.ownerName}).`, 'info');
    }

    let cleanPhone = (order.phone || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '213' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('213')) {
      cleanPhone = '213' + cleanPhone;
    }

    const dPhone = driverPhoneOverride || order.driverPhone || 'سيتصل بك فوراً';
    const dName = driverNameOverride || order.driverName || 'مندوب التوصيل';
    const dCompany = order.driverCompany || order.deliveryCompanyName || 'شركة التوصيل';
    const totalAmount = (order.totalAmount || 0) + (order.shippingFee || 0);

    const msg = encodeURIComponent(
      `السلام عليكم ورحمة الله أخي الكريم ${order.customerName}،\nمعك قسم المتابعة والتوصيل من منصة Nouva Market 🛍️.\n\nنخبرك أن طلبيتك رقم #${order.trackingCode || order.id} خرجت اليوم للتوصيل مع الموزع 🛵:\n• اسم الموزع: ${dName}\n• رقم هاتف الموزع المباشر: ${dPhone}\n• شركة التوصيل / المركز: ${dCompany}\n• المبلغ الإجمالي المطلوب تجهيزه عند الاستلام: ${totalAmount.toLocaleString()} دج.\n\n⚠️ يرجى إبقاء هاتفك مفتوحاً لتفادي تفويت اتصال الموزع وضمان استلام طلبك في أسرع وقت. شكراً لثقتكم بنا!`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  // Copy Buyer Details to Clipboard
  const handleCopyBuyerInfoForDriver = (order: Order) => {
    const totalAmount = (order.totalAmount || 0) + (order.shippingFee || 0);
    const text = `📦 معلومات طرد الزبون #${order.trackingCode || order.id}:\nالاسم: ${order.customerName}\nالهاتف: ${order.phone} ${order.phone2 ? `/ ${order.phone2}` : ''}\nالعنوان: ولاية ${order.wilaya} - بلدية ${order.commune} (${order.address})\nالمبلغ: ${totalAmount} دج`;
    navigator.clipboard.writeText(text);
    onShowToast('تم نسخ بيانات الزبون إلى الحافظة لإرسالها للموزع 📋', 'success');
  };

  // Copy Driver Details to Clipboard
  const handleCopyDriverInfoForBuyer = (order: Order) => {
    const text = `🛵 معلومات الموزع:\nالاسم: ${order.driverName || 'موزع التوصيل'}\nرقم الهاتف: ${order.driverPhone || 'غير متوفر'}\nالشركة: ${order.driverCompany || order.deliveryCompanyName || 'شركة التوصيل'}`;
    navigator.clipboard.writeText(text);
    onShowToast('تم نسخ بيانات الموزع إلى الحافظة لإرسالها للزبون 📋', 'success');
  };

  // Quick Coordination Actions: معالجة التعثرات وتحديث الحالة اللحظية
  const handleQuickCoordinationAction = async (order: Order, actionType: string) => {
    const lock = checkOrderExclusivity(order);
    if (lock.isLockedByOther) {
      onShowToast(
        `⛔ غير مسموح: هذه الطلبية تحت مسؤولية ومتابعة المؤكد (${lock.ownerName}). لا يمكن لمؤكد آخر تغيير حالتها أو التنسيق عليها منعاً للازدواجية.`,
        'error'
      );
      return;
    }

    if (actionType === 'out_for_delivery') {
      // 1. 🛵 خرجت مع الموزع للتسليم اليوم (Sortir en livraison)
      updateCourierCoordination(
        order.id,
        {
          coordinationStatus: 'out_for_delivery',
          newStatus: 'SHIPPED',
        },
        { id: agentId, fullName: agentName }
      );
      onShowToast(`🛵 تم تحديث الحالة: خرجت مع الموزع للتسليم اليوم (Sortir en livraison) للطلبية #${order.trackingCode || order.id}`, 'info');

      // جلب بيانات الموزع تلقائياً عند تغيير حالة الطلبية إلى 'خارج للتوصيل' عبر API شركة التوصيل
      if (!order.driverPhone) {
        await handleFetchDriverFromApi(order, false);
      }
    } else if (actionType === 'notified_buyer') {
      // 2. 📞 تم تنبيه المشتري برقم الموزع وبانتظار وصوله
      updateCourierCoordination(
        order.id,
        {
          coordinationStatus: 'notified_buyer',
        },
        { id: agentId, fullName: agentName }
      );
      onShowToast(`📞 تم تحديث الحالة: تم تنبيه المشتري برقم الموزع وبانتظار وصوله`, 'success');
      handleSendWhatsAppToBuyerWithDriver(order);
    } else if (actionType === 'driver_called_no_answer') {
      // 3. ⚠️ الموزع اتصل والزبون لم يرد (متابعة عاجلة): يقوم المؤكد بالاتصال المباشر بالزبون من رقم الإدارة وتنبيهه
      const existingNotes = order.coordinationNotes ? `${order.coordinationNotes} | ` : '';
      const timeStr = new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
      updateCourierCoordination(
        order.id,
        {
          coordinationStatus: 'driver_called_no_answer',
          coordinationNotes: `${existingNotes}⚠️ الموزع اتصل والزبون لم يرد (${timeStr}) - متابعة عاجلة من الإدارة`,
        },
        { id: agentId, fullName: agentName }
      );
      onShowToast(`⚠️ الموزع اتصل والزبون لم يرد - جاري فتح اتصال مباشر بالزبون (${order.customerName}) من رقم الإدارة...`, 'info');
      window.open(`tel:${order.phone}`, '_self');
    } else if (actionType === 'customer_rescheduled') {
      // 4. ⏰ الزبون طلب تأجيل التسليم (Reporté): تحديد موعد جديد وتدوينه للموزع
      const newDate = window.prompt('⏰ الزبون طلب تأجيل التسليم: يرجى تحديد الموعد الجديد لتدوينه للموزع (مثال: غداً بعد الظهر، السبت صباحاً):', 'غداً صباحاً');
      if (newDate !== null && newDate.trim()) {
        const existingNotes = order.coordinationNotes ? `${order.coordinationNotes} | ` : '';
        updateCourierCoordination(
          order.id,
          {
            coordinationStatus: 'customer_rescheduled',
            coordinationNotes: `${existingNotes}⏰ طلب الزبون تأجيل التسليم إلى: ${newDate.trim()}`,
          },
          { id: agentId, fullName: agentName }
        );
        onShowToast(`⏰ تم تدوين موعد التأجيل الجديد للموزع: ${newDate.trim()}`, 'info');
      }
    } else if (actionType === 'address_clarified') {
      // 5. 📍 تم توجيه الموزع للعنوان ونقطة الالتقاء: كإعطائه معلماً معروفاً (مسجد، مدرسة، ساحة...)
      const landmark = window.prompt('📍 تم توجيه الموزع للعنوان: يرجى تدوين المعلم أو نقطة الالتقاء (مثال: قرب مسجد النور، بجانب مدرسة الفلاح، ساحة البلدية):', 'بجانب المسجد الكبير');
      if (landmark !== null && landmark.trim()) {
        const existingNotes = order.coordinationNotes ? `${order.coordinationNotes} | ` : '';
        updateCourierCoordination(
          order.id,
          {
            coordinationStatus: 'address_clarified',
            coordinationNotes: `${existingNotes}📍 نقطة الالتقاء المحددة للموزع: ${landmark.trim()}`,
          },
          { id: agentId, fullName: agentName }
        );
        onShowToast(`📍 تم حفظ توجيه العنوان ونقطة الالتقاء للموزع بنجاح!`, 'success');
      }
    } else if (actionType === 'delivered') {
      // 6. 🎉 تم التسليم بنجاح (Livré): اعتماد التسليم المباشر واحتسابه في إحصائيات المؤكد
      updateCourierCoordination(
        order.id,
        {
          coordinationStatus: 'delivered',
          newStatus: 'DELIVERED',
        },
        { id: agentId, fullName: agentName }
      );
      handleMarkDelivered(order);
    } else if (actionType === 'returned') {
      // 7. ❌ تعذر التسليم / مرتجع للمستودع (Retour)
      updateCourierCoordination(
        order.id,
        {
          coordinationStatus: 'returned',
          newStatus: 'FAILED',
        },
        { id: agentId, fullName: agentName }
      );
      handleMarkFailed(order);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-3 sm:p-5 overflow-y-auto space-y-4">
      {/* 1.1 COURIER & BUYER COORDINATION GUIDE BANNER */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-500/30 text-white shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black flex items-center gap-2">
                <span>تنسيق الاتصال بين رقم الموزع (Livreur) ورقم المشتري</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
                  دليل عمل المؤكد 🛵
                </span>
              </h3>
              <p className="text-xs text-blue-200/80 mt-0.5">
                نظام الربط والتنسيق المباشر بين الموزع السائق والزبون لرفع نسبة التسليم الناجح وتفادي المرتجعات.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCoordinationGuide((prev) => !prev)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showCoordinationGuide ? 'rotate-180' : ''}`} />
            <span>{showCoordinationGuide ? 'إخفاء الدليل' : 'كيف ينسق المؤكد؟ (عرض الخطوات) 💡'}</span>
          </button>
        </div>

        {showCoordinationGuide && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-blue-500/20 text-xs animate-in fade-in duration-200">
            <div className="p-3 rounded-2xl bg-black/30 border border-blue-500/20 space-y-1.5">
              <div className="font-black text-blue-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-[11px]">1</span>
                <span>جلب بيانات الموزع تلقائياً عبر API شركة التوصيل ⚡:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                عند خروج الشحنة للتوزيع، يضغط المؤكد على الطلبية ليسحب النظام آلياً من API شركة التوصيل (Yalidine, Procolis, ZR Express...): اسم الموزع الميداني، رقم هاتفه المباشر، ومركز التوزيع.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/30 border border-blue-500/20 space-y-1.5">
              <div className="font-black text-blue-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-[11px]">2</span>
                <span>إشعار المشتري برقم الموزع وتأمين الاستلام 🛍️:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                بالضغط على <strong>"إرسال رقم الموزع للزبون عبر واتساب"</strong>، يتلقى المشتري رسالة رسمية باسم الموزع، ورقم هاتفه، والمبلغ الواجب تحضيره نقداً، مع تنبيهه بإبقاء هاتفه مفتوحاً لسرعة الاستلام.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. CONFIRMER PERSONAL KPI CARDS ("لكل مؤكد احصائياته في الداشبورد الخاص به") */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: My Confirmed Total */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>تأكيداتي الإجمالية</span>
            <PhoneCheckIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.myConfirmedCount}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
              +{stats.myConfirmedTodayCount} اليوم
            </span>
          </div>
        </div>

        {/* Metric 2: Global Pending Review Queue */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-bold">
            <span>بانتظار التأكيد (عام)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {stats.globalPendingCount}
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
              كل الموردين
            </span>
          </div>
        </div>

        {/* Metric 3: In Transit & Follow-up */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>قيد المتابعة والشحن</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-blue-600 font-mono">
              {stats.myInTransitCount}
            </span>
            <span className="text-[10px] text-blue-600 font-medium">
              بالطريق
            </span>
          </div>
        </div>

        {/* Metric 4: Successfully Delivered */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <span>تم التسليم بنجاح</span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.myDeliveredCount}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
              +{stats.myDeliveredTodayCount} اليوم
            </span>
          </div>
        </div>

        {/* Metric 5: Delivery Conversion Rate */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>نسبة نجاح التسليم</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-purple-600 font-mono">
              {stats.deliverySuccessRate}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              معدل ممتاز
            </span>
          </div>
        </div>

        {/* Metric 6: Delivered Sales DZD Volume */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>قيمة المسلّمة</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
              {stats.deliveredVolumeDzd.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              دج
            </span>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-emerald-600 text-white shadow-md font-black'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>قيد المراجعة والاتصال ({stats.globalPendingCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('in_transit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'in_transit'
              ? 'bg-emerald-600 text-white shadow-md font-black'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>متابعة الشحن والتوصيل ({stats.myInTransitCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('my_history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'my_history'
              ? 'bg-emerald-600 text-white shadow-md font-black'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل طلبياتي المؤكدة ({stats.myConfirmedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('my_stats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'my_stats'
              ? 'bg-emerald-600 text-white shadow-md font-black'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>إحصائيات أدائي التفصيلية ⭐</span>
        </button>
      </div>

      {/* 4. SEARCH & FILTERS ROW (For order lists) */}
      {activeTab !== 'my_stats' && (
        <div className="space-y-2">
          {/* Date Filter Bar for Confirmer */}
          <DateFilterBar
            dateMode={dateMode}
            setDateMode={setDateMode}
            singleDate={singleDate}
            setSingleDate={setSingleDate}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            accentColor="emerald"
            title="تصفية طلبيات المؤكد حسب التاريخ:"
          />

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث برقم الطلبية، اسم الزبون، رقم الهاتف، كود التتبع، أو اسم المسوق..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Wilaya Filter */}
            <div className="w-full md:w-48">
              <select
                value={selectedWilaya}
                onChange={(e) => setSelectedWilaya(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="all">📍 جميع الولايات (58)</option>
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w.code} value={w.nameAr}>
                    {w.code} - {w.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier Filter (All suppliers) */}
            <div className="w-full md:w-56">
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="all">🏭 جميع الموردين والمصانع</option>
                {suppliersList.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exclusivity & Assignment Filters (منع ازدواجية التأكيد والمتابعة) */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto text-xs font-bold">
            <span className="text-[11px] text-slate-400 px-2 font-bold flex items-center gap-1 shrink-0">
              <Lock className="w-3 h-3 text-emerald-500" />
              تصفية الطلبيات:
            </span>
            <button
              type="button"
              onClick={() => setAssignmentFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                assignmentFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              عرض الكل المتاح ({filteredOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setAssignmentFilter('mine')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                assignmentFilter === 'mine'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>طلبياتي المسندة لي حصرياً 🎯</span>
            </button>
            <button
              type="button"
              onClick={() => setAssignmentFilter('unassigned')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                assignmentFilter === 'unassigned'
                  ? 'bg-amber-600 text-white shadow-xs font-black'
                  : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
              }`}
            >
              <span>🔓 شاغرة ومتاحة للاستلام والتأكيد</span>
            </button>
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setAssignmentFilter('others')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  assignmentFilter === 'others'
                    ? 'bg-rose-700 text-white shadow-xs font-black'
                    : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>تحت معالجة مؤكدين آخرين (إشراف) 🔒</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. CONTENT SECTIONS */}

      {/* VIEW 1 & 2 & 3: ORDERS LIST */}
      {activeTab !== 'my_stats' && (
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 space-y-3">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/50" />
              <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
                لا توجد طلبيات تطابق هذا التصنيف حالياً!
              </h4>
              <p className="text-xs max-w-sm mx-auto">
                {activeTab === 'pending'
                  ? 'رائع! لا توجد طلبيات قيد الانتظار حالياً، كل الطلبيات تم الاتصال بها وتأكيدها.'
                  : 'جرّب تغيير فلاتر البحث أو الولاية أو المورد.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredOrders.map((order, idx) => {
                const isConfirmed = order.adminConfirmed;
                const totalWithShipping = (order.totalAmount || 0) + (order.shippingFee || 0);
                const lock = checkOrderExclusivity(order);
                const isClaimedByMe = (order.assignedConfirmerId === agentId) || (!order.assignedConfirmerId && order.confirmedBy === agentId);
                const isUnassigned = !order.assignedConfirmerId && !order.confirmedBy && !order.adminConfirmed;

                return (
                  <div
                    key={`${order.id || 'ord'}-${idx}`}
                    className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-xs hover:shadow-md transition-all space-y-4 ${
                      lock.isLockedByOther
                        ? 'border-rose-300/80 dark:border-rose-900/60 bg-rose-50/10'
                        : isClaimedByMe
                        ? 'border-emerald-300/80 dark:border-emerald-900/60'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          #{order.trackingCode || order.id}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(order.createdAt).toLocaleDateString('ar-DZ')}
                        </span>

                        {/* Confirmer Lock / Exclusivity Badge */}
                        {order.assignedConfirmerId ? (
                          isClaimedByMe ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                              <CheckCheck className="w-3 h-3 text-emerald-600" />
                              مسندة لك حصرياً 🎯
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-rose-600" />
                              مقفلة للمؤكد: {order.assignedConfirmerName || order.assignedConfirmerId} 🔒
                            </span>
                          )
                        ) : order.confirmedBy ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            مؤكد من: {order.confirmerName || order.confirmedBy}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <span>طلبية شاغرة متاحة 🔓</span>
                          </span>
                        )}

                        {order.callAttempts !== undefined && order.callAttempts > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            📞 {order.callAttempts} اتصالات
                          </span>
                        )}
                      </div>

                      {/* Right Side: Exclusivity Action & Status Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Claim / Release Buttons */}
                        {isUnassigned && (
                          <button
                            type="button"
                            onClick={() => handleClaimOrder(order)}
                            className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-xs transition cursor-pointer"
                            title="حجز واستلام الطلبية لحسابك لمنع أي مؤكد آخر من الاتصال بنفس الزبون"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>استلام الطلبية</span>
                          </button>
                        )}
                        {isClaimedByMe && !order.adminConfirmed && (
                          <button
                            type="button"
                            onClick={() => handleReleaseOrder(order)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                            title="إلغاء حجز الطلبية وإتاحتها لباقي المؤكدين"
                          >
                            <span>تحرير الطلبية 🔓</span>
                          </button>
                        )}

                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : order.status === 'SHIPPED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : order.status === 'CONFIRMED'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : order.status === 'FAILED' || order.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {order.statusAr || order.status}
                        </span>
                      </div>
                    </div>

                    {/* Exclusivity Lock Notice Banner */}
                    {lock.isLockedByOther && (
                      <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-2 font-bold shadow-xs">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            🔒 هذه الطلبية تحت متابعة وتأكيد المؤكد <strong>({lock.ownerName})</strong>. تم قفل التعديل والتأكيد والتنسيق منعاً للازدواجية وتكرار الاتصال بالزبون.
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 shrink-0">
                          ممنوع التعديل
                        </span>
                      </div>
                    )}

                    {/* Customer & Delivery Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Customer Contact Box */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-purple-500" />
                            بيانات الزبون:
                          </span>
                          <button
                            onClick={() => handleOpenEditCustomer(order)}
                            className="text-[10px] text-purple-600 hover:text-purple-500 font-bold flex items-center gap-1"
                            title="تعديل العنوان أو رقم الهاتف"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                        </div>
                        <div className="font-black text-slate-900 dark:text-white text-sm">
                          {order.customerName}
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${order.phone}`}
                            className="font-mono text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                            dir="ltr"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            {order.phone}
                          </a>
                          {order.phone2 && (
                            <span className="font-mono text-slate-500 text-[11px]" dir="ltr">
                              / {order.phone2}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span>
                            {order.wilaya} - {order.commune} ({order.address})
                          </span>
                        </div>
                      </div>

                      {/* Products Summary */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 space-y-2">
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                          <Boxes className="w-3.5 h-3.5 text-blue-500" />
                          المنتجات المطلوبة ({order.items?.length || 0}):
                        </span>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2 truncate">
                                {it.productImage && (
                                  <img
                                    src={it.productImage}
                                    alt={it.productName}
                                    className="w-6 h-6 rounded-md object-cover shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {it.productName}
                                </span>
                                {(it.variantSize || it.variantColor) && (
                                  <span className="text-[10px] text-slate-400">
                                    ({it.variantSize} {it.variantColor})
                                  </span>
                                )}
                              </div>
                              <span className="font-mono font-black text-slate-900 dark:text-white shrink-0">
                                ×{it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-1 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">الإجمالي شامل التوصيل:</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                            {totalWithShipping.toLocaleString()} دج
                          </span>
                        </div>
                      </div>

                      {/* Source, Reseller & Call History */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 space-y-2">
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-amber-500" />
                          المسوق والملاحظات:
                        </span>
                        <div className="text-[11px] flex justify-between">
                          <span className="text-slate-500">المسوق:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {order.resellerName || order.resellerEmail || 'مسوق منصة'}
                          </span>
                        </div>
                        {order.lastCallResult && (
                          <div className="text-[11px] flex justify-between">
                            <span className="text-slate-500">آخر اتصال:</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                              {order.lastCallResult}
                            </span>
                          </div>
                        )}
                        {order.confirmationNote && (
                          <div className="text-[10px] text-slate-500 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 line-clamp-2">
                            📝 {order.confirmationNote}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4. DEDICATED COURIER DRIVER CARD & QUICK COORDINATION (بطاقة معلومات الموزع ومعالجة التعثرات اللحظية) */}
                    <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/30 border border-blue-800/60 space-y-3 shadow-sm">
                      {/* Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-sm font-black shadow-inner">
                            🛵
                          </span>
                          <div>
                            <div className="text-xs font-black text-blue-200 flex items-center gap-1.5">
                              <span>بطاقة موزع التوصيل المعتمد (Livreur Info)</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                                ⚡ عبر API
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              شركة التوصيل: {order.driverCompany || order.deliveryCompanyName || 'Yalidine / ZR / Procolis'}
                            </div>
                          </div>
                        </div>

                        {/* Current Status Badge & Modal Trigger */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {order.coordinationStatus && (
                            <span className={`text-[10px] px-2.5 py-1 rounded-xl font-black border shadow-xs ${
                              COURIER_COORDINATION_STATUSES.find((s) => s.id === order.coordinationStatus)?.color || 'bg-slate-900 text-slate-300 border-slate-700'
                            }`}>
                              {COURIER_COORDINATION_STATUSES.find((s) => s.id === order.coordinationStatus)?.label || order.coordinationStatus}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenCoordination(order)}
                            className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
                            title="فتح مكتب التنسيق الكامل"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>مكتب التنسيق 🔄</span>
                          </button>
                        </div>
                      </div>

                      {/* Driver Information Card (الاسم، الهاتف، الشركة) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                        {/* 1. Driver Name */}
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 block">اسم الموزع (Livreur):</span>
                          <span className="font-black text-white text-xs truncate block" title={order.driverName || 'لم يجلب بعد'}>
                            {order.driverName || (
                              <span className="text-amber-400/80 font-normal">بانتظار السحب عبر API</span>
                            )}
                          </span>
                        </div>

                        {/* 2. Driver Phone */}
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 block">رقم هاتف الموزع المباشر:</span>
                          {order.driverPhone ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <a
                                href={`tel:${order.driverPhone}`}
                                className="px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/80 font-mono font-bold text-xs flex items-center gap-1 transition"
                                title="اتصال مباشر بالموزع"
                              >
                                <Phone className="w-3 h-3 text-emerald-400" />
                                <span>{order.driverPhone}</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyDriverInfoForBuyer(order)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                title="نسخ رقم الموزع"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleFetchDriverFromApi(order)}
                              disabled={isFetchingDriverFromApi && fetchingOrderId === order.id}
                              className="px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                            >
                              {isFetchingDriverFromApi && fetchingOrderId === order.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-blue-200" />
                              ) : (
                                <Zap className="w-3 h-3 text-amber-300" />
                              )}
                              <span>جلب تلقائي عبر API ⚡</span>
                            </button>
                          )}
                        </div>

                        {/* 3. Courier Company / Distribution Center */}
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 block">شركة التوصيل / المركز:</span>
                          <span className="font-bold text-blue-300 text-xs truncate block" title={order.driverCompany || order.deliveryCompanyName}>
                            {order.driverCompany || order.deliveryCompanyName || 'Yalidine Express'}
                          </span>
                        </div>
                      </div>

                      {/* Fast Action: Notify Buyer via WhatsApp */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-900/40">
                        <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">الزبون:</span>
                          <span className="font-bold text-white">{order.customerName}</span>
                          <span className="text-slate-400 font-mono">({order.phone})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppToBuyerWithDriver(order)}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                            title="إرسال رسالة واتساب للزبون تحتوي على اسم ورقم الموزع والمبلغ"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>إرسال رقم الموزع للزبون عبر واتساب 🛍️</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFetchDriverFromApi(order)}
                            disabled={isFetchingDriverFromApi && fetchingOrderId === order.id}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 font-bold text-xs flex items-center gap-1 border border-blue-700/60 transition cursor-pointer"
                            title="تحديث بيانات الموزع من سيرفر التوصيل"
                          >
                            <RefreshCw className={`w-3 h-3 text-amber-300 ${isFetchingDriverFromApi && fetchingOrderId === order.id ? 'animate-spin' : ''}`} />
                            <span>تحديث API</span>
                          </button>
                        </div>
                      </div>

                      {/* Coordination Notes Display if exists */}
                      {order.coordinationNotes && (
                        <div className="text-xs text-amber-200 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/60 flex items-start gap-2">
                          <span className="shrink-0 text-sm">💬</span>
                          <div className="space-y-0.5">
                            <span className="font-bold text-[11px] text-amber-400 block">سجل ملاحظات التنسيق الفوري:</span>
                            <span className="text-slate-200 font-medium leading-relaxed">{order.coordinationNotes}</span>
                          </div>
                        </div>
                      )}

                      {/* ⚡ معالجة التعثرات وتحديث الحالة اللحظية (Quick Coordination Actions) */}
                      <div className="space-y-1.5 pt-2 border-t border-blue-900/50">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-black text-blue-300 flex items-center gap-1">
                            <span>⚡ معالجة التعثرات وتحديث الحالة اللحظية:</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">نقرة واحدة للتطبيق الفوري</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                          {/* 1. خرجت مع الموزع للتسليم اليوم */}
                          <button
                            type="button"
                            onClick={() => handleQuickCoordinationAction(order, 'out_for_delivery')}
                            className={`p-1.5 rounded-xl border text-[11px] font-bold text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                              order.coordinationStatus === 'out_for_delivery'
                                ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/50 shadow-sm'
                                : 'bg-slate-950/70 hover:bg-blue-950/50 text-slate-300 border-slate-800 hover:border-blue-800'
                            }`}
                            title="خرجت مع الموزع للتسليم اليوم (Sortir en livraison) - تجلب بيانات الموزع عبر API فوراً"
                          >
                            <span className="text-sm">🛵</span>
                            <span className="leading-tight">خرجت للتسليم</span>
                          </button>

                          {/* 2. تم تنبيه المشتري برقم الموزع */}
                          <button
                            type="button"
                            onClick={() => handleQuickCoordinationAction(order, 'notified_buyer')}
                            className={`p-1.5 rounded-xl border text-[11px] font-bold text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                              order.coordinationStatus === 'notified_buyer'
                                ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/50 shadow-sm'
                                : 'bg-slate-950/70 hover:bg-indigo-950/50 text-slate-300 border-slate-800 hover:border-indigo-800'
                            }`}
                            title="تم تنبيه المشتري برقم الموزع وبانتظار وصوله"
                          >
                            <span className="text-sm">📞</span>
                            <span className="leading-tight">تنبيه المشتري</span>
                          </button>

                          {/* 3. الموزع اتصل والزبون لم يرد */}
                          <button
                            type="button"
                            onClick={() => handleQuickCoordinationAction(order, 'driver_called_no_answer')}
                            className={`p-1.5 rounded-xl border text-[11px] font-bold text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                              order.coordinationStatus === 'driver_called_no_answer'
                                ? 'bg-orange-600 text-white border-orange-400 ring-2 ring-orange-500/50 shadow-sm animate-pulse'
                                : 'bg-slate-950/70 hover:bg-orange-950/50 text-amber-300 border-slate-800 hover:border-orange-800'
                            }`}
                            title="الموزع اتصل والزبون لم يرد (متابعة عاجلة): يقوم المؤكد بالاتصال المباشر بالزبون من رقم الإدارة وتنبيهه"
                          >
                            <span className="text-sm">⚠️</span>
                            <span className="leading-tight">اتصل ولم يرد</span>
                          </button>

                          {/* 4. الزبون طلب تأجيل التسليم */}
                          <button
                            type="button"
                            onClick={() => handleQuickCoordinationAction(order, 'customer_rescheduled')}
                            className={`p-1.5 rounded-xl border text-[11px] font-bold text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                              order.coordinationStatus === 'customer_rescheduled'
                                ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-500/50 shadow-sm'
                                : 'bg-slate-950/70 hover:bg-purple-950/50 text-slate-300 border-slate-800 hover:border-purple-800'
                            }`}
                            title="الزبون طلب تأجيل التسليم (Reporté): تحديد موعد جديد وتدوينه للموزع"
                          >
                            <span className="text-sm">⏰</span>
                            <span className="leading-tight">طلب تأجيل</span>
                          </button>

                          {/* 5. تم توجيه الموزع للعنوان ونقطة الالتقاء */}
                          <button
                            type="button"
                            onClick={() => handleQuickCoordinationAction(order, 'address_clarified')}
                            className={`p-1.5 rounded-xl border text-[11px] font-bold text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                              order.coordinationStatus === 'address_clarified'
                                ? 'bg-teal-600 text-white border-teal-400 ring-2 ring-teal-500/50 shadow-sm'
                                : 'bg-slate-950/70 hover:bg-teal-950/50 text-slate-300 border-slate-800 hover:border-teal-800'
                            }`}
                            title="تم توجيه الموزع للعنوان ونقطة الالتقاء: كإعطائه معلماً معروفاً (مسجد، مدرسة، ساحة...)"
                          >
                            <span className="text-sm">📍</span>
                            <span className="leading-tight">توجيه للعنوان</span>
                          </button>

                          {/* 6. تم التسليم بنجاح */}
                          <button
                            type="button"
                            onClick={() => handleQuickCoordinationAction(order, 'delivered')}
                            className={`p-1.5 rounded-xl border text-[11px] font-bold text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                              order.coordinationStatus === 'delivered' || order.status === 'DELIVERED'
                                ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/50 shadow-sm'
                                : 'bg-slate-950/70 hover:bg-emerald-950/50 text-emerald-300 border-slate-800 hover:border-emerald-800'
                            }`}
                            title="تم التسليم بنجاح (Livré): اعتماد التسليم المباشر واحتسابه في إحصائيات المؤكد"
                          >
                            <span className="text-sm">🎉</span>
                            <span className="leading-tight">تم التسليم</span>
                          </button>

                          {/* 7. تعذر التسليم / مرتجع للمستودع */}
                          <button
                            type="button"
                            onClick={() => handleQuickCoordinationAction(order, 'returned')}
                            className={`p-1.5 rounded-xl border text-[11px] font-bold text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                              order.coordinationStatus === 'returned' || order.status === 'FAILED'
                                ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/50 shadow-sm'
                                : 'bg-slate-950/70 hover:bg-rose-950/50 text-rose-300 border-slate-800 hover:border-rose-800'
                            }`}
                            title="تعذر التسليم / مرتجع للمستودع (Retour)"
                          >
                            <span className="text-sm">❌</span>
                            <span className="leading-tight">تعذر / مرتجع</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS BAR */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {/* Direct Call & WhatsApp Quick Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`tel:${order.phone}`}
                          className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 transition shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>اتصال بالزبون</span>
                        </a>

                        <button
                          onClick={() => handleOpenWhatsApp(order)}
                          className="px-3 py-2 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-950/80 dark:hover:bg-green-900 text-green-700 dark:text-green-300 font-black text-xs flex items-center gap-1.5 border border-green-200 dark:border-green-800 transition shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب سريع</span>
                        </button>

                        <button
                          onClick={() => handleOpenCallModal(order)}
                          className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 border border-purple-200 dark:border-purple-800 transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>تسجيل نتيجة اتصال 📝</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenCoordination(order)}
                          className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 transition shadow-xs"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>تنسيق الموزع والمشتري 🔄</span>
                        </button>
                      </div>

                      {/* Main Workflow Action: One-Click Confirm or Delivery Follow-up */}
                      <div className="flex items-center gap-2">
                        {!order.adminConfirmed ? (
                          <button
                            onClick={() => handleOpenCallModal(order)}
                            disabled={lock.isLockedByOther}
                            className={`px-4 py-2 rounded-xl text-white font-black text-xs flex items-center gap-2 shadow-md transition ${
                              lock.isLockedByOther
                                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-75'
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20 cursor-pointer'
                            }`}
                            title={lock.isLockedByOther ? `الطلبية مقفلة وتحت مسؤولية المؤكد ${lock.ownerName}` : 'تأكيد الطلبية ونقلها للمستودع'}
                          >
                            {lock.isLockedByOther ? (
                              <>
                                <Lock className="w-4 h-4 text-rose-300" />
                                <span>مقفلة للمؤكد ({lock.ownerName})</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>تأكيد الطلبية ونقلها للمستودع ✅</span>
                              </>
                            )}
                          </button>
                        ) : order.status === 'SHIPPED' || order.status === 'PROCESSING' ? (
                          <>
                            <button
                              onClick={() => handleMarkDelivered(order)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>تم التسليم للزبون بنجاح 🎉</span>
                            </button>
                            <button
                              onClick={() => handleMarkFailed(order)}
                              className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 border border-rose-200 dark:border-rose-900 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>فشل / مرتجع</span>
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: MY DETAILED STATS */}
      {activeTab === 'my_stats' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>بطاقة أداء مؤكد الطلبيات: {agentName}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              إحصائيات دقيقة ومحدثة تلقائياً لمراقبة جودة التأكيد، سرعة الاتصال، ونسبة تحويل الطلبيات إلى تسليم فعلي.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold block">
                  معدل نجاح التوصيل الفعلي
                </span>
                <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 font-mono mt-1">
                  {stats.deliverySuccessRate}%
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {stats.myDeliveredCount} طلبيات مسلّمة بنجاح
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80">
                <span className="text-xs text-purple-700 dark:text-purple-300 font-bold block">
                  تأكيدات اليوم
                </span>
                <div className="text-2xl font-black text-purple-800 dark:text-purple-200 font-mono mt-1">
                  {stats.myConfirmedTodayCount}
                </div>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 block">
                  من إجمالي {stats.myConfirmedCount} تأكيد تراكمي
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80">
                <span className="text-xs text-blue-700 dark:text-blue-300 font-bold block">
                  طلبيات قيد الشحن والتوصيل
                </span>
                <div className="text-2xl font-black text-blue-800 dark:text-blue-200 font-mono mt-1">
                  {stats.myInTransitCount}
                </div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 block">
                  تتطلب المتابعة مع الزبائن للتسليم
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80">
                <span className="text-xs text-amber-700 dark:text-amber-300 font-bold block">
                  إجمالي المبيعات المحققة
                </span>
                <div className="text-2xl font-black text-amber-800 dark:text-amber-200 font-mono mt-1">
                  {stats.deliveredVolumeDzd.toLocaleString()} دج
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                  قيمة الطلبيات المسلّمة فعلياً
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG CALL & CONFIRM ORDER */}
      {selectedOrderForCall && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span>تسجيل نتيجة الاتصال وتأكيد الطلبية</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  الطلبية #{selectedOrderForCall.trackingCode || selectedOrderForCall.id} • {selectedOrderForCall.customerName}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrderForCall(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Customer Recap */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">الهاتف:</span>
                <a href={`tel:${selectedOrderForCall.phone}`} className="font-mono text-emerald-400 font-bold" dir="ltr">
                  📞 {selectedOrderForCall.phone}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">العنوان:</span>
                <span className="font-bold text-white">
                  {selectedOrderForCall.wilaya} - {selectedOrderForCall.commune}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المبلغ الإجمالي:</span>
                <span className="font-bold text-amber-300 font-mono">
                  {((selectedOrderForCall.totalAmount || 0) + (selectedOrderForCall.shippingFee || 0)).toLocaleString()} دج
                </span>
              </div>
            </div>

            {/* Call Result Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                نتيجة الاتصال بالزبون:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CALL_RESULTS.map((res) => {
                  const isSelected = callResult === res.id;
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => setCallResult(res.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {res.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                ملاحظات المكالمة (اختياري):
              </label>
              <textarea
                value={callNote}
                onChange={(e) => setCallNote(e.target.value)}
                placeholder="مثال: أكد الزبون استلامه يوم الثلاثاء بعد العصر، الزبون طلب التأكيد بالواتساب..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedOrderForCall(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSubmitCallAction}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>حفظ وتحديث الطلبية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CUSTOMER INFO */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <span>تعديل بيانات وتفاصيل توصيل الزبون</span>
              </h3>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">اسم الزبون:</label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">رقم الهاتف 1:</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">رقم الهاتف 2 (اختياري):</label>
                  <input
                    type="tel"
                    value={editPhone2}
                    onChange={(e) => setEditPhone2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">الولاية:</label>
                  <input
                    type="text"
                    value={editWilaya}
                    onChange={(e) => setEditWilaya(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">البلدية:</label>
                  <input
                    type="text"
                    value={editCommune}
                    onChange={(e) => setEditCommune(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">العنوان بالتفصيل:</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveCustomerEdits}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COURIER & BUYER COORDINATION DESK */}
      {coordinatingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>مكتب التنسيق بين رقم الموزع والمشتري</span>
                    <span className="text-xs font-mono text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-lg border border-blue-800">
                      #{coordinatingOrder.trackingCode || coordinatingOrder.id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ربط الاتصال المباشر بين موزع شركة التوصيل والزبون لحل أي تعثر وتأمين الاستلام
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCoordinatingOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split View: Buyer Card & Delivery Courier Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* 1. BUYER (CUSTOMER) CARD */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>بيانات المشتري (الزبون):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyBuyerInfoForDriver(coordinatingOrder)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition cursor-pointer"
                    title="نسخ تفاصيل الزبون"
                  >
                    <Copy className="w-3 h-3" />
                    <span>نسخ للموزع</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="font-black text-sm text-white">
                    {coordinatingOrder.customerName}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`tel:${coordinatingOrder.phone}`}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-xs flex items-center gap-1 hover:bg-emerald-500/20"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{coordinatingOrder.phone}</span>
                    </a>
                    {coordinatingOrder.phone2 && (
                      <a
                        href={`tel:${coordinatingOrder.phone2}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs flex items-center gap-1 hover:bg-slate-700"
                        title="رقم إضافي"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{coordinatingOrder.phone2}</span>
                      </a>
                    )}
                  </div>
                  <div className="text-slate-300 flex items-start gap-1.5 text-[11px] pt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      ولاية {coordinatingOrder.wilaya} - بلدية {coordinatingOrder.commune} ({coordinatingOrder.address})
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">المبلغ المطلوب عند الاستلام:</span>
                    <span className="font-black text-emerald-400 font-mono text-xs">
                      {((coordinatingOrder.totalAmount || 0) + (coordinatingOrder.shippingFee || 0)).toLocaleString()} دج
                    </span>
                  </div>
                </div>

                {/* Quick Action to Buyer */}
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppToBuyerWithDriver(coordinatingOrder, coordDriverPhone, coordDriverName)}
                  className="w-full py-2 px-3 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>إرسال رقم الموزع للزبون عبر واتساب 📲</span>
                </button>
              </div>

              {/* 2. COURIER DRIVER (LIVREUR) CARD */}
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/60 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-400" />
                    <span>بيانات موزع التوصيل (Livreur):</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFetchDriverFromApi(coordinatingOrder)}
                      disabled={isFetchingDriverFromApi}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-50"
                      title="سحب وتحديث بيانات الموزع عبر API شركة التوصيل فورياً"
                    >
                      {isFetchingDriverFromApi ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-blue-200" />
                      ) : (
                        <Zap className="w-3 h-3 text-amber-300" />
                      )}
                      <span>{isFetchingDriverFromApi ? 'جاري الجلب...' : 'جلب تلقائي عبر API ⚡'}</span>
                    </button>
                    {coordDriverPhone && (
                      <button
                        type="button"
                        onClick={() => handleCopyDriverInfoForBuyer(coordinatingOrder)}
                        className="text-[11px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 transition cursor-pointer"
                        title="نسخ تفاصيل الموزع"
                      >
                        <Copy className="w-3 h-3" />
                        <span>نسخ للمشتري</span>
                      </button>
                    )}
                  </div>
                </div>

                {isFetchingDriverFromApi && (
                  <div className="p-2.5 rounded-xl bg-blue-900/40 border border-blue-600/50 flex items-center gap-2 text-xs text-blue-200 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300 shrink-0" />
                    <span>جاري الاتصال بـ API شركة التوصيل ({coordinatingOrder.deliveryCompanyName || 'Yalidine / ZR...'}) لجلب معلومات الموزع المكلّف...</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      اسم الموزع (أو مندوب المركز):
                    </label>
                    <input
                      type="text"
                      value={coordDriverName}
                      onChange={(e) => setCoordDriverName(e.target.value)}
                      placeholder="مثال: ياسين موزع وهران / سفيان"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      رقم هاتف الموزع:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="tel"
                        value={coordDriverPhone}
                        onChange={(e) => setCoordDriverPhone(e.target.value)}
                        placeholder="0655123456"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold outline-none focus:border-blue-500 text-xs"
                        dir="ltr"
                      />
                      {coordDriverPhone && (
                        <a
                          href={`tel:${coordDriverPhone}`}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition"
                          title="اتصال هاتفي بالموزع"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      شركة التوصيل / مركز التوزيع:
                    </label>
                    <input
                      type="text"
                      value={coordDriverCompany}
                      onChange={(e) => setCoordDriverCompany(e.target.value)}
                      placeholder="مثال: Yalidine / Procolis / ZR Express"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Coordination Status Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                حالة التنسيق الميداني الحالية:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COURIER_COORDINATION_STATUSES.map((st) => {
                  const isSelected = coordStatus === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setCoordStatus(st.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/30 border-blue-500 text-blue-200 ring-1 ring-blue-500'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coordination Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                ملاحظات التنسيق الفوري (اتفاق الزبون والموزع):
              </label>
              <textarea
                value={coordNotes}
                onChange={(e) => setCoordNotes(e.target.value)}
                placeholder="مثال: تم الاتصال بالزبون وطلب التوصيل بعد 4 زوالاً أمام ثانوية العربي التبسي، أو: الموزع اتصل والزبون في الطريق إلى المنزل..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveCoordination('DELIVERED')}
                  className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  title="حفظ واعتماد تسليم الشحنة للزبون"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تأكيد التسليم بنجاح (Livré)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCoordinatingOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCoordination()}
                  disabled={isSavingCoord}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingCoord ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>حفظ بيانات التنسيق</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhoneCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      <path d="m16 5 2 2 4-4" />
    </svg>
  );
}
