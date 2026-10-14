import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { language } = useLanguage();

  return (
    <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 my-4 text-center">
      <div className="inline-flex p-3 rounded-full bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-300 mb-2">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200 mb-1">
        {title || (language === 'ar' ? 'تعذر تحميل البيانات' : 'Erreur de chargement')}
      </h3>
      <p className="text-xs text-rose-600 dark:text-rose-400 max-w-xs mx-auto mb-3">
        {message || (language === 'ar' ? 'يرجى التحقق من الاتصال بالشبكة وإعادة المحاولة.' : 'Veuillez vérifier votre connexion et réessayer.')}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'إعادة المحاولة' : 'Réessayer'}</span>
        </button>
      )}
    </div>
  );
}
