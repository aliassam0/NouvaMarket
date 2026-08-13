import React, { useState } from 'react';
import {
  Truck,
  Search,
  X,
  Building2,
  Home,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react';
import { ALGERIA_WILAYAS, WilayaInfo } from '../../data/algeriaLocations';

interface ShippingRatesModalProps {
  onClose: () => void;
}

export function ShippingRatesModal({ onClose }: ShippingRatesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<'all' | 'center' | 'east' | 'west' | 'south'>('all');

  const filteredWilayas = ALGERIA_WILAYAS.filter((w) => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      w.nameAr.toLowerCase().includes(cleanSearch) ||
      w.nameFr.toLowerCase().includes(cleanSearch) ||
      w.code.includes(cleanSearch);

    const wilayaNum = parseInt(w.code, 10);

    if (regionFilter === 'center') {
      const isCenter = [16, 9, 35, 42, 10, 26, 44, 15, 27].includes(wilayaNum);
      return matchesSearch && isCenter;
    }
    if (regionFilter === 'east') {
      const isEast = [25, 23, 19, 6, 21, 4, 5, 12, 24, 34, 36, 40, 41, 43, 51, 55, 57, 60, 61, 62].includes(wilayaNum);
      return matchesSearch && isEast;
    }
    if (regionFilter === 'west') {
      const isWest = [31, 13, 22, 20, 29, 46, 48, 14, 38].includes(wilayaNum);
      return matchesSearch && isWest;
    }
    if (regionFilter === 'south') {
      const isSouth = wilayaNum >= 30 || [1, 3, 7, 8, 11, 17, 30, 32, 33, 37, 39, 45, 47, 49, 50, 52, 53, 54, 56, 58, 59, 63, 64, 65, 66, 67, 68, 69].includes(wilayaNum);
      return matchesSearch && isSouth;
    }

    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>أسعار التوصيل لجميع الولايات (68 ولاية)</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-mono">
                  الأسعار الحقيقية
                </span>
              </h2>
              <p className="text-xs text-violet-100 opacity-90 mt-0.5">
                جدول أسعار التوصيل الرسمية المعتمدة مع شركة Ecom Delivery (المنزل والمكتب)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-3 bg-violet-50 dark:bg-violet-950/40 border-b border-violet-200 dark:border-violet-900 text-violet-900 dark:text-violet-200 text-xs flex items-center justify-between gap-2 px-5 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-violet-600 shrink-0" />
            <span>عرض أسعار التوصيل الحقيقية المعتمدة بالتفصيل لكل ولاية (التوصيل للمنزل والمكتب).</span>
          </div>
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-violet-200 dark:bg-violet-900 text-violet-900 dark:text-violet-100 font-mono">
            Ecom Official Rates
          </span>
        </div>

        {/* Search & Region Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم الولاية، كود الولاية (مثال: 16 - الجزائر أو 31)..."
              className="w-full ps-10 pe-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className="text-slate-400 text-[11px] me-1">المنطقة:</span>
            {[
              { id: 'all', label: 'جميع الولايات (68)' },
              { id: 'center', label: 'الوسط' },
              { id: 'east', label: 'الشرق' },
              { id: 'west', label: 'الغرب' },
              { id: 'south', label: 'الجنوب الكبير' },
            ].map((reg) => (
              <button
                key={reg.id}
                onClick={() => setRegionFilter(reg.id as any)}
                className={`px-3 py-1 rounded-xl text-xs transition ${
                  regionFilter === reg.id
                    ? 'bg-violet-600 text-white font-extrabold shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredWilayas.map((w) => (
              <div
                key={w.code}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 hover:border-violet-500 transition shadow-xs space-y-2.5"
              >
                {/* Wilaya Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                      {w.code}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {w.nameAr}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{w.estimatedDays || '24-48 ساعة'}</span>
                  </span>
                </div>

                {/* Prices Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Home Delivery */}
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 flex flex-col justify-between">
                    <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1">
                      <Home className="w-3 h-3 text-emerald-500" />
                      <span>للمنزل</span>
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                      {w.homeFee} دج
                    </span>
                  </div>

                  {/* Office Stopdesk */}
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 flex flex-col justify-between">
                    <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-blue-500" />
                      <span>المكتب (Stopdesk)</span>
                    </span>
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
                      {w.officeFee} دج
                    </span>
                  </div>
                </div>

                {/* Communes count */}
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                  <span>البلديات المتاحة: {w.communes?.length || 0} بلدية</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">تغطية كاملة</span>
                </div>
              </div>
            ))}
          </div>

          {filteredWilayas.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs font-bold">
              لا توجد ولاية مطابقة لنتيجة البحث "{searchTerm}"
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs font-bold">
          <span className="text-slate-500">
            إجمالي المعروض: <strong>{filteredWilayas.length}</strong> ولاية
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black hover:opacity-90 transition shadow-md"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
