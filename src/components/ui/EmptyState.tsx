import React from 'react';
import { PackageX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = <PackageX className="w-12 h-12 text-slate-400" />,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 my-4">
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 text-slate-500">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-98 text-white text-xs font-bold transition shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
