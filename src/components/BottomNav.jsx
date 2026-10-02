import React from 'react';
import { Truck, Users, BarChart3, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, onChangeTab, alertCount = 0 }) {
  const tabs = [
    { id: 'quick', label: 'Lançar', icon: Truck },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'dashboard', label: 'Resumo', icon: BarChart3, badge: alertCount },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-bottom">
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-brand-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.2 shadow">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 leading-none">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
