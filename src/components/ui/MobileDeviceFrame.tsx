import React from 'react';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
}

export function MobileDeviceFrame({ children }: MobileDeviceFrameProps) {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-violet-500 selection:text-white flex flex-col items-center justify-start antialiased overflow-x-hidden">
      <div className="w-full min-h-screen flex flex-col relative">
        {children}
      </div>
    </div>
  );
}

