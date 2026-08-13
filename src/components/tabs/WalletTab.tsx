import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownRight, Clock, FileText, CheckCircle2, AlertCircle, Send, ShieldCheck, Download, CreditCard, Save, Check, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { MoneyText } from '../ui/MoneyText';
import { formatDate } from '../../lib/formatters';
import {
  getStoredWalletBalance,
  saveStoredWalletBalance,
  getStoredWalletTransactions,
  saveStoredWalletTransactions,
  WalletTransaction
} from '../../lib/walletHelper';
import { addSellerNotification, addAdminNotification } from '../../lib/notificationHelper';

interface WalletTabProps {
  onShowToast: (msg: string) => void;
}

export function WalletTab({ onShowToast }: WalletTabProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [availableBalance, setAvailableBalance] = useState<number>(() => getStoredWalletBalance(user?.id, 0));
  const [pendingBalance, setPendingBalance] = useState<number>(0);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(5000);

  // Profit Filter State: 'today' | 'week' | 'month' | 'all'
  const [profitFilter, setProfitFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => getStoredWalletTransactions(user?.id, false));

  // Sync wallet balance & transactions whenever mounted or user changes
  useEffect(() => {
    setAvailableBalance(getStoredWalletBalance(user?.id, 0));
    setTransactions(getStoredWalletTransactions(user?.id, false));
  }, [user?.id]);

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
    if (withdrawAmount > availableBalance) {
      onShowToast('الرصيد المتاح غير كافٍ لهذا السحب');
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
          <Wallet className="w-5 h-5 text-emerald-600" />
          <span>{t('wallet.title')}</span>
        </h1>

        <button
          onClick={handleDownloadPdf}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">كشف حساب PDF</span>
        </button>
      </div>

      {/* Main Balance Hero Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white shadow-xl relative overflow-hidden space-y-4">
        <div>
          <span className="text-xs font-medium text-emerald-200 block">
            {t('wallet.available')}
          </span>
          <div className="text-3xl font-black tracking-tight text-white mt-1">
            <MoneyText amount={availableBalance} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15 text-xs text-emerald-100">
          <div>
            <span className="text-[10px] text-emerald-200 block">{t('wallet.pending')}</span>
            <span className="font-bold text-amber-300">
              +<MoneyText amount={pendingBalance} />
            </span>
          </div>

          <div>
            <span className="text-[10px] text-emerald-200 block">
              {profitFilter === 'today' ? 'أرباح اليوم' : profitFilter === 'week' ? 'أرباح الأسبوع' : profitFilter === 'month' ? 'أرباح الشهر' : 'إجمالي أرباحك'}
            </span>
            <span className="font-bold text-white">
              <MoneyText amount={currentDisplayedProfit} />
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsWithdrawModalOpen(true)}
          className="w-full py-3 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 active:scale-98 font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4 text-emerald-600" />
          <span>طلب سحب الأرباح</span>
        </button>
      </div>

      {/* 4 Financial Filter Buttons: ارباح اليوم | ارباح الأسبوع | ارباح الشهر | جميع الارباح */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>فلترة وتصفية العمليات المالية:</span>
          </span>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
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
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>ارباح اليوم</span>
            <span className={`text-[10px] font-bold ${profitFilter === 'today' ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
              <MoneyText amount={todayProfit} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProfitFilter('week')}
            className={`py-3 px-2 rounded-2xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
              profitFilter === 'week'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>ارباح الأسبوع</span>
            <span className={`text-[10px] font-bold ${profitFilter === 'week' ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
              <MoneyText amount={weekProfit} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProfitFilter('month')}
            className={`py-3 px-2 rounded-2xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
              profitFilter === 'month'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>ارباح الشهر</span>
            <span className={`text-[10px] font-bold ${profitFilter === 'month' ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
              <MoneyText amount={monthProfit} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProfitFilter('all')}
            className={`py-3 px-2 rounded-2xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
              profitFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50 scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>جميع الفترات</span>
            <span className={`text-[10px] font-bold ${profitFilter === 'all' ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
              <MoneyText amount={allProfit} />
            </span>
          </button>
        </div>

        {/* Filter Summary Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-[10px] text-slate-400 block font-semibold">المداخيل</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
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
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
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
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
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
                className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              بياناتك محفوظة ومشفّرة بآمان
            </span>

            <button
              type="submit"
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-xs ${
                isSavedSuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white'
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
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
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
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
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

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('wallet.amount')}:
              </label>
              <input
                type="number"
                min={1000}
                max={availableBalance}
                step={500}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
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
                        ? 'bg-emerald-600 text-white border-emerald-600'
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
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
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
