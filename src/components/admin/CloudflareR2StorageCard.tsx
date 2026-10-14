import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  XCircle,
  RefreshCw,
  HardDrive,
  Upload,
  Lock,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Zap,
} from 'lucide-react';
import { checkR2StorageStatus, uploadToR2Storage, R2StorageStatus } from '../../lib/r2StorageClient';

interface CloudflareR2StorageCardProps {
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const CloudflareR2StorageCard: React.FC<CloudflareR2StorageCardProps> = ({ onShowToast }) => {
  const [status, setStatus] = useState<R2StorageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingUpload, setIsTestingUpload] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await checkR2StorageStatus();
      setStatus(res);
      if (res.status === 'connected') {
        onShowToast('✔ تم التحقق من اتصال Cloudflare R2 بنجاح!', 'success');
      } else {
        onShowToast(`تنبيه: ${res.message || 'فشل الاتصال بـ Cloudflare R2'}`, 'info');
      }
    } catch (e: any) {
      onShowToast(`خطأ في فحص R2: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestUpload = async () => {
    setIsTestingUpload(true);
    try {
      const testContent = `data:text/plain;base64,${btoa('Nouva Market Cloudflare R2 Storage Test - ' + new Date().toISOString())}`;
      const result = await uploadToR2Storage(testContent, 'docs');
      if (result.success) {
        onShowToast('🎉 نجح رفع ملف اختباري إلى Cloudflare R2 بنجاح!', 'success');
        fetchStatus();
      } else {
        onShowToast(`فشل رفع الملف التجريبي: ${result.error}`, 'error');
      }
    } catch (e: any) {
      onShowToast(`خطأ في الرفع: ${e.message}`, 'error');
    } finally {
      setIsTestingUpload(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6 dir-rtl text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                تخزين الملفات السحابي • Cloudflare R2
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                S3-Compatible
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تخزين دائم وسريع لصور المنتجات، إيصالات المستودع، ووثائق المنصة بتكلفة خروج صفرية ($0 Egress fees).
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          {status?.status === 'connected' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>متصل ونشط 🟢</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 text-xs font-bold">
              <HardDrive className="w-4 h-4 text-amber-600" />
              <span>قيد الفحص / جاهز</span>
            </div>
          )}

          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="إعادة فحص الاتصال"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* R2 Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
        {/* Bucket Name */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold">اسم الحاوية (Bucket):</span>
            <HardDrive className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
            {status?.bucketName || 'nouvamarket-files'}
          </p>
        </div>

        {/* Account ID */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold">معرف الحساب (Account ID):</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate" title={status?.accountId}>
            {status?.accountId || '0242295015c55a6b819f5bf22954a93e'}
          </p>
        </div>

        {/* S3 API Endpoint */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold">واجهة S3 Endpoint:</span>
            <Lock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate" title={status?.endpoint}>
            {status?.endpoint || 'https://0242295015c55a6b819f5bf22954a93e.r2.cloudflarestorage.com'}
          </p>
        </div>
      </div>

      {/* Credentials Summary */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <Lock className="w-3.5 h-3.5 text-purple-600" />
          <span>المفاتيح المعتمدة والمحفوظة في بيئة النظام (.env):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span>Access Key ID:</span>
            <span className="font-bold text-slate-900 dark:text-slate-200">c98512e2dfc8...2976</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span>Secret Access Key:</span>
            <span className="font-bold text-slate-900 dark:text-slate-200">2413233784e3...9f6</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
        <button
          onClick={handleTestUpload}
          disabled={isTestingUpload}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {isTestingUpload ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          <span>رفع ملف تجريبي لاختبار التخزين</span>
        </button>

        <a
          href="https://dash.cloudflare.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>لوحة تحكم Cloudflare R2</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </div>
  );
};
