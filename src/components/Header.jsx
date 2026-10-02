import React, { useState, useEffect } from 'react';
import { Package, WifiOff, PlusCircle, Cloud, CloudOff } from 'lucide-react';
import { isSupabaseConfigured } from '../db/supabase';

export default function Header({ onNewClientClick }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const hasCloud = isSupabaseConfigured();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-tight">
              Caixas na Rua
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {hasCloud ? 'Online / Nuvem' : 'Online / Local'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
                  <WifiOff className="w-3 h-3" />
                  Modo Offline Ativo
                </span>
              )}

              {hasCloud ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-sky-400 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-800">
                  <Cloud className="w-2.5 h-2.5" /> Supabase
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <button
          onClick={onNewClientClick}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition"
        >
          <PlusCircle className="w-4 h-4 text-brand-500" />
          <span>+ Cliente</span>
        </button>
      </div>
    </header>
  );
}
