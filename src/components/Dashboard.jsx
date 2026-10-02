import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getGlobalStats } from '../db/db';
import { Package, AlertTriangle, Users, DollarSign, Send, Clock, ChevronRight } from 'lucide-react';
import { openWhatsAppLink } from '../utils/whatsapp';

export default function Dashboard({ onSelectClient }) {
  const [stats, setStats] = useState({
    totalCratesInStreet: 0,
    totalEstimatedValue: 0,
    clientsWithDebt: 0,
    totalClients: 0,
    byCrateType: [],
    stagnantClients: []
  });

  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const clients = useLiveQuery(() => db.clients.toArray()) || [];

  useEffect(() => {
    getGlobalStats().then(setStats);
  }, [transactions, clients]);

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Total Crates */}
        <div className="col-span-2 bg-gradient-to-br from-brand-600/30 to-brand-900/40 border border-brand-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-brand-300 uppercase tracking-wider block">
              Total de Caixas na Rua
            </span>
            <div className="text-3xl font-black text-white mt-1">
              {stats.totalCratesInStreet}{' '}
              <span className="text-xs font-semibold text-brand-200">unidades</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Distribuídas em {stats.clientsWithDebt} de {stats.totalClients} estabelecimentos
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Package className="w-7 h-7" />
          </div>
        </div>

        {/* Card 2: Clientes com Saldo */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <Users className="w-4 h-4 text-sky-400" />
            <span>Com Caixas</span>
          </div>
          <div className="text-xl font-black text-white">
            {stats.clientsWithDebt}{' '}
            <span className="text-xs font-normal text-slate-400">clientes</span>
          </div>
        </div>

        {/* Card 3: Valor Estimado */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Valor Estimado</span>
          </div>
          <div className="text-xl font-black text-amber-300">
            {stats.totalEstimatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
      </div>

      {/* Stagnant Crates Alert Section */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Caixas Paradas (+7 dias sem giro)</span>
          </h3>
          <span className="bg-rose-500/20 text-rose-300 text-[11px] font-black px-2 py-0.5 rounded-full border border-rose-500/40">
            {stats.stagnantClients.length}
          </span>
        </div>

        {stats.stagnantClients.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {stats.stagnantClients.map((item) => (
              <div
                key={item.client.id}
                onClick={() => onSelectClient(item.client.id)}
                className="bg-slate-900/80 hover:bg-slate-900 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between gap-2 cursor-pointer transition"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white truncate max-w-[160px]">
                      {item.client.name}
                    </span>
                    <span className="bg-rose-950 text-rose-400 text-[10px] font-bold px-1.5 py-0.2 rounded border border-rose-800">
                      {item.daysStagnant} dias
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Saldo retido: <span className="font-bold text-amber-400">{item.balance} caixas</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.client.phone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const msg = `Olá ${item.client.name}, tudo bem? Notamos que temos ${item.balance} caixas em aberto há cerca de ${item.daysStagnant} dias sem movimentação. Gostaria de combinar uma data para passarmos e fazer o recolhimento das caixas vazias. Obrigado!`;
                        openWhatsAppLink(item.client.phone, msg);
                      }}
                      className="p-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-400 rounded-lg border border-emerald-500/30 transition"
                      title="Cobrar via WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
            Nenhuma caixa parada há mais de 7 dias! Seu giro de caixas está em dia. 👏
          </div>
        )}
      </div>

      {/* Breakdown by Crate Type */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Distribuição por Tipo de Vasilhame
        </h3>

        <div className="space-y-2.5">
          {stats.byCrateType.length > 0 ? (
            stats.byCrateType.map((ct, idx) => {
              const percentage = stats.totalCratesInStreet > 0
                ? Math.round((Math.max(0, ct.total) / stats.totalCratesInStreet) * 100)
                : 0;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ct.color }}></span>
                      {ct.name}
                    </span>
                    <span className="font-bold text-white">
                      {ct.total} un. <span className="text-slate-400 font-normal">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, percentage))}%`,
                        backgroundColor: ct.color || '#22c55e'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-xs text-slate-400">
              Nenhuma caixa lançada no sistema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
