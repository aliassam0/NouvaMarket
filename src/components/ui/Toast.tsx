import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  if (!toast) return null;

  const bgClass =
    toast.type === 'success'
      ? 'bg-slate-900/95 dark:bg-emerald-950/95 border-emerald-500/50 text-white'
      : toast.type === 'error'
      ? 'bg-slate-900/95 dark:bg-rose-950/95 border-rose-500/50 text-white'
      : 'bg-slate-900/95 dark:bg-slate-800/95 border-violet-500/50 text-white';

  return (
    <div className="fixed bottom-20 inset-x-4 max-w-sm mx-auto z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div
        className={`flex items-center justify-between p-3.5 rounded-2xl border shadow-xl backdrop-blur-md text-xs font-semibold ${bgClass}`}
      >
        <div className="flex items-center gap-2.5">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-violet-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
