import React, { useState } from 'react';
import { User, ShieldCheck, LogOut, CheckCircle2, Phone, Building2, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface ProfilTabProps {
  onOpenDevTools?: () => void;
  onOpenGamification: () => void;
  onShowToast: (msg: string) => void;
  onLogout?: () => void;
}

export function ProfilTab({ onOpenGamification, onShowToast, onLogout }: ProfilTabProps) {
  const { user, updateProfile, submitKyc, logout } = useAuth();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [storeName, setStoreName] = useState(user?.storeName || '');
  const [wilaya, setWilaya] = useState(user?.wilaya || '16 - Alger');

  const [isEditing, setIsEditing] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [cinNumber, setCinNumber] = useState('');
  const [ccpNumber, setCcpNumber] = useState('00219812981 RIP');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ fullName, storeName, wilaya });
    setIsEditing(false);
    onShowToast('تم تحديث معلومات متجرك بنجاح!');
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitKyc(cinNumber, 'front.jpg', 'back.jpg', ccpNumber);
    setIsKycModalOpen(false);
    onShowToast('تم إرسال مستندات الهوية, جاري المراجعة في غضون دقائق!');
  };

  return (
    <div className="flex-1 pb-24 overflow-y-auto p-4 text-slate-900 dark:text-slate-100 space-y-4">
      {/* Profile Header */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white font-black text-xl flex items-center justify-center border-2 border-violet-400 shadow-xs shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {user?.fullName}
            </h2>
            <span className="text-xs text-slate-500 block">{user?.storeName}</span>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              {user?.email && <span className="text-purple-500 font-bold">{user.email}</span>}
              {user?.phone && <span>• {user.phone}</span>}
            </div>
          </div>
        </div>

        {/* KYC Status Badge */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {t('profile.kycStatus')}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold">
              مؤكد وموثق (Approved)
            </span>
          </div>
        </div>
      </div>

      {/* Settings Menu Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase px-1">إعدادات الحساب والمتجر:</h3>

        {/* Gamification Level Button */}
        <button
          onClick={onOpenGamification}
          className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-bold transition hover:bg-slate-50"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>مستوى الحساب والمكافآت</span>
          </div>
          <span className="text-amber-500">{user?.rankAr || 'المستوى البرونزي'} 🌟</span>
        </button>

        {/* Logout */}
        <button
          onClick={() => {
            logout();
            if (onLogout) onLogout();
          }}
          className="w-full p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-between text-xs font-bold transition hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4" />
            <span>{t('profile.logout')}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
