import React, { useState, useEffect } from 'react';
import { Package, WifiOff, PlusCircle, Cloud, LogOut, RefreshCw, User } from 'lucide-react';
import { isSupabaseConfigured, subscribeSyncStatus } from '../db/supabase';

export default function Header({ currentDriver, onNewClientClick, onLogout }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInfo, setSyncInfo] = useState({ isSyncing: false, lastSync: null, error: null });
  const hasCloud = isSupabaseConfigured();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = subscribeSyncStatus(setSyncInfo);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30 flex-shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                Caixas na Rua
              </h1>
              {currentDriver && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-300 bg-brand-950/80 px-1.5 py-0.5 rounded border border-brand-800 truncate max-w-[100px]">
                  <User className="w-2.5 h-2.5" />
                  {currentDriver.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              {isOnline ? (
                hasCloud ? (
                  syncInfo.isSyncing ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      Sincronizando nuvem...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <Cloud className="w-3 h-3 text-sky-400" />
                      Nuvem Sincronizada
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online / Local
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
                  <WifiOff className="w-3 h-3" />
                  Modo Offline
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onNewClientClick}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-700 transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-brand-500" />
            <span>+ Cliente</span>
          </button>

          <button
            onClick={onLogout}
            title="Trocar de entregador / Sair"
            className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 active:scale-95 rounded-xl border border-slate-700 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
