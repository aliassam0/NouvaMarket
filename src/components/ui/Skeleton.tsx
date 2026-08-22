import React from 'react';

export function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden p-3 animate-pulse shadow-xs">
      <div className="w-full aspect-4/3 bg-slate-200 dark:bg-slate-800 rounded-xl mb-3" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-3" />
      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-1/3" />
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 animate-pulse shadow-xs mb-3">
      <div className="flex justify-between items-center mb-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-1/4" />
      </div>
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-4" />
      <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
    </div>
  );
}
