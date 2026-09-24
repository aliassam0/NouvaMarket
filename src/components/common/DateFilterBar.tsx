import React from 'react';
import { Calendar, CalendarRange, Clock, Sparkles, X, Check, Filter } from 'lucide-react';

export type DateFilterMode = 'today' | 'month' | 'range' | 'all';

function parseDate(createdAtStr: string): Date | null {
  if (!createdAtStr) return null;
  if (typeof createdAtStr !== 'string') return null;

  // Handle DD/MM/YYYY or DD/MM/YYYY HH:MM
  if (createdAtStr.includes('/')) {
    const parts = createdAtStr.split(' ')[0].split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(y, m, d);
      }
    }
  }

  // Handle YYYY-MM-DD
  const d = new Date(createdAtStr);
  return isNaN(d.getTime()) ? null : d;
}

export function matchesDateFilter(
  createdAtStr: string,
  dateMode: DateFilterMode,
  _singleDate: string,
  startDate: string,
  endDate: string
): boolean {
  if (dateMode === 'all') return true;
  if (!createdAtStr) return true;

  const createdDate = parseDate(createdAtStr);
  if (!createdDate) return true;

  const today = new Date();

  const y = createdDate.getFullYear();
  const m = String(createdDate.getMonth() + 1).padStart(2, '0');
  const d = String(createdDate.getDate()).padStart(2, '0');
  const orderDateStr = `${y}-${m}-${d}`;

  const todayY = today.getFullYear();
  const todayM = String(today.getMonth() + 1).padStart(2, '0');
  const todayD = String(today.getDate()).padStart(2, '0');
  const todayStr = `${todayY}-${todayM}-${todayD}`;

  if (dateMode === 'today') {
    return orderDateStr === todayStr;
  }

  if (dateMode === 'month') {
    return (
      createdDate.getFullYear() === today.getFullYear() &&
      createdDate.getMonth() === today.getMonth()
    );
  }

  if (dateMode === 'range') {
    if (startDate && orderDateStr < startDate) return false;
    if (endDate && orderDateStr > endDate) return false;
    return true;
  }

  return true;
}

interface DateFilterBarProps {
  dateMode: DateFilterMode;
  setDateMode: (mode: DateFilterMode) => void;
  singleDate: string;
  setSingleDate: (d: string) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
}

export function DateFilterBar({
  dateMode,
  setDateMode,
  singleDate: _singleDate,
  setSingleDate: _setSingleDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: DateFilterBarProps) {
  // Helpers for quick presets
  const handleQuickPreset = (preset: 'today' | 'last7' | 'thisMonth') => {
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = String(now.getMonth() + 1).padStart(2, '0');
    const todayD = String(now.getDate()).padStart(2, '0');
    const todayStr = `${todayY}-${todayM}-${todayD}`;

    if (preset === 'today') {
      setDateMode('today');
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'last7') {
      setDateMode('range');
      const past = new Date();
      past.setDate(now.getDate() - 6);
      const pastY = past.getFullYear();
      const pastM = String(past.getMonth() + 1).padStart(2, '0');
      const pastD = String(past.getDate()).padStart(2, '0');
      setStartDate(`${pastY}-${pastM}-${pastD}`);
      setEndDate(todayStr);
    } else if (preset === 'thisMonth') {
      setDateMode('month');
      const firstDayStr = `${todayY}-${todayM}-01`;
      setStartDate(firstDayStr);
      setEndDate(todayStr);
    }
  };

  const getActiveFilterLabel = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateMode === 'today') return `اليوم (${todayStr})`;
    if (dateMode === 'month') return `هذا الشهر (${new Date().toLocaleString('ar-EG', { month: 'long', year: 'numeric' })})`;
    if (dateMode === 'range') {
      if (startDate && endDate) return `من ${startDate} إلى ${endDate}`;
      if (startDate) return `ابتداءً من ${startDate}`;
      if (endDate) return `حتى ${endDate}`;
      return 'فترة مخصصة (حدد التاريخ)';
    }
    return 'جميع الأوقات';
  };

  return (
    <div className="p-3 bg-gradient-to-r from-white via-slate-50 to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/30 border border-purple-100 dark:border-purple-950/60 rounded-2xl shadow-xs space-y-2.5 text-xs">
      {/* Header & Mode Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <CalendarRange className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
              <span>تصفية الطلبات حسب التاريخ:</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold border border-purple-200 dark:border-purple-800/50">
                {getActiveFilterLabel()}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Segment Selector */}
        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/90 p-1 rounded-xl shadow-inner max-w-full overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setDateMode('today')}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer text-[11px] flex items-center gap-1 whitespace-nowrap ${
              dateMode === 'today'
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>اليوم</span>
          </button>

          <button
            type="button"
            onClick={() => setDateMode('month')}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer text-[11px] flex items-center gap-1 whitespace-nowrap ${
              dateMode === 'month'
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>الشهر</span>
          </button>

          <button
            type="button"
            onClick={() => setDateMode('range')}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer text-[11px] flex items-center gap-1 whitespace-nowrap ${
              dateMode === 'range'
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>فترة زمنية (من - إلى) 🗓️</span>
          </button>

          <button
            type="button"
            onClick={() => setDateMode('all')}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer text-[11px] whitespace-nowrap ${
              dateMode === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            الكل
          </button>
        </div>
      </div>

      {/* Date Range Selector Box */}
      {dateMode === 'range' && (
        <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 flex-wrap animate-fadeIn">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <span className="font-extrabold text-slate-500 dark:text-slate-400 text-[11px] shrink-0">من:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent font-mono text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              />
            </div>

            <span className="text-slate-400 font-bold hidden sm:inline">←</span>

            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <span className="font-extrabold text-slate-500 dark:text-slate-400 text-[11px] shrink-0">إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent font-mono text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 hover:bg-rose-200 text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
                title="إعادة ضبط الفترة"
              >
                <X className="w-3.5 h-3.5" />
                <span>إلغاء النطاق</span>
              </button>
            )}
          </div>

          {/* Quick Presets inside Range Mode */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold">اختصار:</span>
            <button
              type="button"
              onClick={() => handleQuickPreset('today')}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition cursor-pointer"
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('last7')}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition cursor-pointer"
            >
              آخر 7 أيام
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('thisMonth')}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition cursor-pointer"
            >
              هذا الشهر
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

