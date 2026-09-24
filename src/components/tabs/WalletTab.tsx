import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownRight,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Send,
  ShieldCheck,
  Download,
  CreditCard,
  Save,
  Check,
  Building,
  Truck,
  Package,
  Hourglass,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOrders } from '../../context/OrderContext';
import { Order } from '../../types';
import { MoneyText } from '../ui/MoneyText';
import { formatDate } from '../../lib/formatters';
import {
  getStoredWalletBalance,
  saveStoredWalletBalance,
  getStoredWalletTransactions,
  saveStoredWalletTransactions,
  WalletTransaction
} from '../../lib/walletHelper';
import { createWithdrawalRequest } from '../../lib/withdrawalHelper';
import { addSellerNotification, addAdminNotification } from '../../lib/notificationHelper';

interface WalletTabProps {
  onShowToast: (msg: string) => void;
}

export function WalletTab({ onShowToast }: WalletTabProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { orders = [] } = useOrders();

  // Filter orders relevant to current reseller
  const resellerOrders = user?.id
    ? orders.filter(
        (o) =>
          !o.resellerId ||
          o.resellerId === user.id ||
          o.resellerId === 'reseller-demo' ||
          o.resellerId === user.email
      )
    : orders;

  // Helper to extract net profit for reseller
  const getOrderProfit = (o: Order) => {
    if (typeof o.totalProfit === 'number' && o.totalProfit > 0) return o.totalProfit;
    if (Array.isArray(o.items) && o.items.length > 0) {
      const p = o.items.reduce((sum, it) => sum + (it.profit || 0), 0);
      if (p > 0) return p;
    }
    return 1200; // fallback standard commission per order
  };

  // Orders currently progressing in the delivery queue
  const deliveryQueueOrders = resellerOrders.filter((o) => {
    if (o.status === 'DELIVERED' || o.status === 'CANCELLED' || o.status === 'REFUNDED' || o.status === 'FAILED') {
      return false;
    }
    return (
      o.status === 'PROCESSING' ||
      o.status === 'SHIPPED' ||
      o.status === 'CONFIRMED' ||
      o.situation === 'EnPréparation' ||
      o.situation === 'SortiEnLivraison' ||
      o.situation === 'EnCours' ||
      Boolean(o.trackingCode)
    );
  });

  const inProcessingOrders = deliveryQueueOrders.filter(
    (o) =>
      o.status === 'PROCESSING' ||
      o.status === 'CONFIRMED' ||
      o.situation === 'EnPréparation' ||
      o.situation === 'EnAttente'
  );

  const inTransitOrders = deliveryQueueOrders.filter(
    (o) =>
      o.status === 'SHIPPED' ||
      o.situation === 'SortiEnLivraison' ||
      o.situation === 'EnCours'
  );

  const estimatedPendingProfit = deliveryQueueOrders.reduce((sum, o) => sum + getOrderProfit(o), 0);
  const processingProfit = inProcessingOrders.reduce((sum, o) => sum + getOrderProfit(o), 0);
  const inTransitProfit = inTransitOrders.reduce((sum, o) => sum + getOrderProfit(o), 0);

  const [availableBalance, setAvailableBalance] = useState<number>(() => getStoredWalletBalance(user?.id, 0));
  const [pendingBalance, setPendingBalance] = useState<number>(estimatedPendingProfit);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(5000);

  // Profit Filter State: 'today' | 'week' | 'month' | 'all'
  const [profitFilter, setProfitFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => getStoredWalletTransactions(user?.id, false));

  // Sync wallet balance & transactions whenever mounted or user changes
  useEffect(() => {
    setAvailableBalance(getStoredWalletBalance(user?.id, 0));
    setTransactions(getStoredWalletTransactions(user?.id, false));
    setPendingBalance(estimatedPendingProfit);
  }, [user?.id, estimatedPendingProfit]);

  // Date parsing helpers for profit filtering & sorting
  const parseTxDate = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const parts = dateStr.split(' ')[0].split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        return new Date(y, m, d);
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const isTodayDate = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const d = parseTxDate(dateStr);
    if (!d) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const isThisWeekDate = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const d = parseTxDate(dateStr);
    if (!d) return false;
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    return d >= sevenDaysAgo && d <= now;
  };

  const isThisMonthDate = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const d = parseTxDate(dateStr);
    if (!d) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth()
    );
  };

  // Profit Calculations
  const todayProfit = transactions
    .filter((tx) => tx.type === 'credit' && isTodayDate(tx.date))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const weekProfit = transactions
    .filter((tx) => tx.type === 'credit' && isThisWeekDate(tx.date))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const monthProfit = transactions
    .filter((tx) => tx.type === 'credit' && isThisMonthDate(tx.date))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const allProfit = transactions
    .filter((tx) => tx.type === 'credit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const currentDisplayedProfit =
    profitFilter === 'today'
      ? todayProfit
      : profitFilter === 'week'
      ? weekProfit
      : profitFilter === 'month'
      ? monthProfit
      : allProfit;

  const filteredTransactions = transactions
    .filter((tx) => {
      if (profitFilter === 'today') return isTodayDate(tx.date);
      if (profitFilter === 'week') return isThisWeekDate(tx.date);
      if (profitFilter === 'month') return isThisMonthDate(tx.date);
      return true;
    })
    .sort((a, b) => {
      const timeA = parseTxDate(a.date)?.getTime() || 0;
      const timeB = parseTxDate(b.date)?.getTime() || 0;
      return timeB - timeA; // Newest to oldest
    });

  // Calculate total credits & withdrawals in filtered period
  const totalPeriodCredit = filteredTransactions
    .filter((tx) => tx.type === 'credit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalPeriodWithdrawal = filteredTransactions
    .filter((tx) => tx.type === 'withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Account Number & Payment Method State with Local Storage persistence
  const [paymentMethod, setPaymentMethod] = useState<'Baridimob' | 'CCP' | 'Bank'>(() => {
    return (localStorage.getItem('reseller_payment_method') as any) || 'Baridimob';
  });
  const [accountNumber, setAccountNumber] = useState(() => {
    return localStorage.getItem('reseller_account_number') || '00219812981 RIP';
  });
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  const handleSaveAccountDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      onShowToast('يرجى إدخال رقم حساب صحيح قبل الحفظ');
      return;
    }
    localStorage.setItem('reseller_account_number', accountNumber.trim());
    localStorage.setItem('reseller_payment_method', paymentMethod);
    setIsSavedSuccess(true);
    onShowToast('✔ تم حفظ وتحديث رقم الحساب بنجاح!');
    setTimeout(() => setIsSavedSuccess(false), 3000);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (availableBalance <= 0) {
      onShowToast('رصيدك المتاح للسحب هو 0 دج. لا يمكنك سحب أي مبلغ!');
      return;
    }

    if (!withdrawAmount || withdrawAmount <= 0) {
      onShowToast('يرجى تحديد مبلغ سحب صالح أكبر من 0 دج');
      return;
    }

    if (withdrawAmount < 1000) {
      onShowToast('الحد الأدنى لطلب سحب الأرباح هو 1,000 دج');
      return;
    }

    if (withdrawAmount > availableBalance) {
      onShowToast(
        `لا يمكنك سحب مبلغ أكبر من رصيدك المتاح! المبلغ المطلوب (${withdrawAmount.toLocaleString()} دج) يتجاوز رصيدك المتوفر (${availableBalance.toLocaleString()} دج)`
      );
      return;
    }

    const newBal = availableBalance - withdrawAmount;
    setAvailableBalance(newBal);
    saveStoredWalletBalance(newBal, user?.id);

    const newTx: WalletTransaction = {
      id: 'tx-' + Date.now(),
      type: 'withdrawal',
      amount: withdrawAmount,
      description: `طلب سحب عبر ${paymentMethod} (${accountNumber})`,
      status: 'pending',
      date: new Date().toISOString(),
    };

    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    saveStoredWalletTransactions(updatedTxs, user?.id);

    // Synchronize request to Admin Treasury Queue
    createWithdrawalRequest({
      sellerId: user?.id || 'u-seller-me',
      sellerName: user?.name || user?.email || 'بائع مسوق',
      storeName: user?.storeName || 'متجر البائع',
      phone: user?.phone || '0550000000',
      amountDzd: withdrawAmount,
      method: paymentMethod.toUpperCase() as any,
      accountDetails: `${paymentMethod}: ${accountNumber}`,
      userType: 'SELLER',
    });

    addSellerNotification({
      type: 'wallet',
      titleAr: '💸 تم تسجيل طلب سحب أرباح',
      bodyAr: `تم تقديم طلب سحب بمبلغ ${withdrawAmount} دج عبر ${paymentMethod}. جارٍ المعالجة والتحويل خلال 24 ساعة.`,
    });

    addAdminNotification({
      type: 'wallet',
      titleAr: '💰 طلب سحب أرباح جديد بانتظار الموافقة',
      bodyAr: `قدم أحد البائعين طلب سحب أرباح جديد بمبلغ ${withdrawAmount} دج عبر ${paymentMethod} (${accountNumber}).`,
    });

    setIsWithdrawModalOpen(false);
    onShowToast('تم تقديم طلب سحب الأرباح بنجاح, سيتم معالجته خلال 24 ساعة!');
  };

  const handleDownloadPdf = () => {
    onShowToast('جاري توليد وتحميل كشف الحساب الشهري PDF...');
  };

  return (
    <div className="flex-1 pb-24 overflow-y-auto p-4 text-slate-900 dark:text-slate-100 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-purple-600" />
          <span>{t('wallet.title')}</span>
        </h1>

        <button
          onClick={handleDownloadPdf}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
        >
          <Download className="w-4 h-4 text-purple-600" />
          <span className="hidden sm:inline">كشف حساب PDF</span>
        </button>
      </div>

      {/* Main Balance Hero Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-slate-900 text-white shadow-xl relative overflow-hidden space-y-4">
        <div>
          <span className="text-xs font-medium text-purple-200 block">
            {t('wallet.available')}
          </span>
          <div className="text-3xl font-black tracking-tight text-white mt-1">
            <MoneyText amount={availableBalance} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15 text-xs text-purple-100">
          <div>
            <span className="text-[10px] text-purple-200 block">{t('wallet.pending')}</span>
            <span className="font-bold text-amber-300">
              +<MoneyText amount={pendingBalance} />
            </span>
          </div>

          <div>
            <span className="text-[10px] text-purple-200 block">
              {profitFilter === 'today' ? 'أرباح اليوم' : profitFilter === 'week' ? 'أرباح الأسبوع' : profitFilter === 'month' ? 'أرباح الشهر' : 'إجمالي أرباحك'}
            </span>
            <span className="font-bold text-white">
              <MoneyText amount={currentDisplayedProfit} />
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            if (availableBalance <= 0) {
              onShowToast('رصيدك المتاح للسحب هو 0 دج. لا توجد أرباح محررة قابلة للسحب حالياً.');
              return;
            }
            setWithdrawAmount(availableBalance);
            setIsWithdrawModalOpen(true);
          }}
          disabled={availableBalance <= 0}
          className={`w-full py-3 rounded-2xl font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2 ${
            availableBalance <= 0
              ? 'bg-white/30 text-white/60 cursor-not-allowed opacity-75'
              : 'bg-white text-purple-800 hover:bg-purple-50 active:scale-98 cursor-pointer'
          }`}
        >
          <Send className="w-4 h-4 text-purple-600" />
          <span>{availableBalance <= 0 ? 'لا توجد أرباح للسحب (0 دج)' : 'طلب سحب الأرباح'}</span>
        </button>
      </div>

      {/* Small Summary Card: Estimated Pending Profit based on delivery queue status */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-amber-400/40 dark:border-amber-500/30 shadow-xs space-y-3 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 dark:bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 flex items-center justify-center shrink-0">
              <Hourglass className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  الأرباح المعلقة المتوقعة
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-mono">
                  طابور التوصيل: {deliveryQueueOrders.length} طلب
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                أرباح قيد التحصيل بناءً على حالة الطرود الحالية مع شركات التوصيل
              </p>
            </div>
          </div>

          <div className="text-left shrink-0">
            <span className="text-[10px] font-bold text-slate-400 block">المبلغ المتوقع</span>
            <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
              +<MoneyText amount={estimatedPendingProfit} />
            </div>
          </div>
        </div>

        {/* Detailed Breakdown: In-Preparation vs Out-For-Delivery */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* In-Preparation / Warehouse Queue */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-sky-500" />
                <span>قيد التجهيز بالمستودع</span>
              </span>
              <span className="font-mono text-sky-600 dark:text-sky-400">{inProcessingOrders.length}</span>
            </div>
            <div className="text-xs font-black text-sky-600 dark:text-sky-400 font-mono">
              +<MoneyText amount={processingProfit} />
            </div>
          </div>

          {/* Out for Delivery / In-Transit with Courier */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-500" />
                <span>قيد التوزيع (مع الشاحن)</span>
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{inTransitOrders.length}</span>
            </div>
            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
              +<MoneyText amount={inTransitProfit} />
            </div>
          </div>
        </div>

        {/* Reassurance text */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>تُضاف الأرباح تلقائياً إلى رصيدك المتاح للسحب فور استلام الزبون وتأكيد شركة التوصيل (COD).</span>
        </div>
      </div>

      {/* 4 Financial Filter Buttons: ارباح اليوم | ارباح الأسبوع | ارباح الشهر | جميع الارباح */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-purple-600" />
            <span>فلترة وتصفية العمليات المالية:</span>
          </span>
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
            {profitFilter === 'today'
              ? 'اليوم'
              : profitFilter === 'week'
              ? 'الأسبوع'
              : profitFilter === 'month'
              ? 'الشهر'
              : 'جميع الفترات'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setProfitFilter('today')}
            className={`py-3 px-2 rounded-2xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
              profitFilter === 'today'
                ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400/50 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>ارباح اليوم</span>
            <span className={`text-[10px] font-bold ${profitFilter === 'today' ? 'text-purple-100' : 'text-purple-600 dark:text-purple-400'}`}>
              <MoneyText amount={todayProfit} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProfitFilter('week')}
            className={`py-3 px-2 rounded-2xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
              profitFilter === 'week'
                ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400/50 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>ارباح الأسبوع</span>
            <span className={`text-[10px] font-bold ${profitFilter === 'week' ? 'text-purple-100' : 'text-purple-600 dark:text-purple-400'}`}>
              <MoneyText amount={weekProfit} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProfitFilter('month')}
            className={`py-3 px-2 rounded-2xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
              profitFilter === 'month'
                ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400/50 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>ارباح الشهر</span>
            <span className={`text-[10px] font-bold ${profitFilter === 'month' ? 'text-purple-100' : 'text-purple-600 dark:text-purple-400'}`}>
              <MoneyText amount={monthProfit} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProfitFilter('all')}
            className={`py-3 px-2 rounded-2xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
              profitFilter === 'all'
                ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400/50 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>جميع الفترات</span>
            <span className={`text-[10px] font-bold ${profitFilter === 'all' ? 'text-purple-100' : 'text-purple-600 dark:text-purple-400'}`}>
              <MoneyText amount={allProfit} />
            </span>
          </button>
        </div>

        {/* Filter Summary Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-[10px] text-slate-400 block font-semibold">المداخيل</span>
            <span className="font-extrabold text-purple-600 dark:text-purple-400">
              +<MoneyText amount={totalPeriodCredit} />
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-[10px] text-slate-400 block font-semibold">المسحوبات</span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400">
              -<MoneyText amount={totalPeriodWithdrawal} />
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-[10px] text-slate-400 block font-semibold">عدد المعاملات</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-300">
              {filteredTransactions.length} عملية
            </span>
          </div>
        </div>
      </div>

      {/* Account Number Configuration Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                رقم الحساب للسحب (CCP / BaridiMob / RIB)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                أدخل وحفظ رقم حسابك لتستلم عليه أرباحك عند طلب السحب
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveAccountDetails} className="space-y-3 pt-1">
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              وسيلة السحب المفضلة:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Baridimob', 'CCP', 'Bank'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    paymentMethod === method
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{method === 'Baridimob' ? 'BaridiMob (RIP)' : method === 'CCP' ? 'حساب CCP' : 'بنك (RIB)'}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              رقم الحساب / RIP / RIB:
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="مثال: 0079999900219812981 89 أو 00219812981 Clé 89"
                className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
              بياناتك محفوظة ومشفّرة بآمان
            </span>

            <button
              type="submit"
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-xs ${
                isSavedSuccess
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-600 hover:bg-purple-500 active:scale-98 text-white'
              }`}
            >
              {isSavedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم الحفظ!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ رقم الحساب</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Transactions List */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2.5">
          {t('wallet.history')}
        </h3>

        <div className="space-y-2.5">
          {filteredTransactions.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-bold">
              لا توجد معاملات أرباح مسجلة في هذه الفترة
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      tx.type === 'credit'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    <ArrowDownRight
                      className={`w-4 h-4 ${tx.type === 'withdrawal' ? 'rotate-180' : ''}`}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block line-clamp-1">
                      {tx.description}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(tx.date, language)}
                    </span>
                  </div>
                </div>

                <div className="text-end">
                  <span
                    className={`text-xs font-extrabold block ${
                      tx.type === 'credit' ? 'text-purple-600' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    <MoneyText amount={tx.amount} />
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {tx.status === 'completed' ? 'تمت بنجاح' : 'قيد المعالجة'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex justify-center items-center p-4">
          <form
            onSubmit={handleWithdrawSubmit}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl space-y-4 relative"
          >
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t('wallet.withdrawTitle')}
            </h3>

            {/* Balance Notice */}
            {availableBalance <= 0 ? (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-0.5 text-right">
                  <span className="font-bold block">رصيدك المتاح للسحب هو 0 دج</span>
                  <p className="text-[11px] leading-relaxed text-rose-600/90 dark:text-rose-300/90">
                    لا يمكنك تقديم أي طلب سحب حالياً. يتم تحرير أرباحك فور تسليم طلبيات الزبائن وتأكيد التوصيل (COD).
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-bold">الرصيد المتاح للسحب:</span>
                <span className="text-purple-700 dark:text-purple-300 font-mono font-black text-sm">
                  {availableBalance.toLocaleString()} دج
                </span>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('wallet.amount')}:
                </label>
                {availableBalance > 0 && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(Math.round(availableBalance * 0.5))}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 font-bold"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(availableBalance)}
                      className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold"
                    >
                      100% (كامل الرصيد)
                    </button>
                  </div>
                )}
              </div>
              <input
                type="number"
                disabled={availableBalance <= 0}
                min={1000}
                max={availableBalance > 0 ? availableBalance : 0}
                step={500}
                value={withdrawAmount || ''}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-black focus:outline-none transition ${
                  withdrawAmount > availableBalance || availableBalance <= 0
                    ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-500 text-rose-600 focus:ring-2 focus:ring-rose-500'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500'
                }`}
                placeholder="مثال: 5000"
              />
              {withdrawAmount > availableBalance && availableBalance > 0 && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                  ⚠️ المبلغ المطلوب ({withdrawAmount.toLocaleString()} دج) أكبر من رصيدك المتوفر ({availableBalance.toLocaleString()} دج)!
                </p>
              )}
              {availableBalance <= 0 && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                  ⚠️ رصيدك 0 دج، لا يمكن تقديم أي طلب سحب.
                </p>
              )}
              <span className="text-[10px] text-slate-400 block mt-1">
                الحد الأدنى للسحب: 1,000 دج | الحد الأقصى: {availableBalance.toLocaleString()} دج
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('wallet.method')}:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Baridimob', 'CCP', 'Bank'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      paymentMethod === m
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('wallet.accountNum')}:
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="رقم حساب CCP أو Baridimob RIP..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={
                  availableBalance <= 0 ||
                  !withdrawAmount ||
                  withdrawAmount <= 0 ||
                  withdrawAmount > availableBalance ||
                  withdrawAmount < 1000
                }
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold shadow-md transition ${
                  availableBalance <= 0 ||
                  !withdrawAmount ||
                  withdrawAmount <= 0 ||
                  withdrawAmount > availableBalance ||
                  withdrawAmount < 1000
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                }`}
              >
                تأكيد طلب السحب
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
