import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getClientBalance } from '../db/db';
import { Search, Phone, MessageSquare, ChevronRight, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { openWhatsAppLink } from '../utils/whatsapp';

export default function ClientList({ onSelectClient, onNewClientClick }) {
  const clients = useLiveQuery(() => db.clients.toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('withDebt'); // 'all', 'withDebt', 'zero'
  const [clientBalances, setClientBalances] = useState({});

  // Recalculate balances whenever clients or transactions change
  useEffect(() => {
    async function loadAllBalances() {
      const balances = {};
      for (const client of clients) {
        balances[client.id] = await getClientBalance(client.id);
      }
      setClientBalances(balances);
    }
    if (clients.length > 0) {
      loadAllBalances();
    }
  }, [clients, transactions]);

  const filteredList = useMemo(() => {
    let list = [...clients];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }

    // Status filter
    if (filterMode === 'withDebt') {
      list = list.filter(c => (clientBalances[c.id]?.totalBalance || 0) > 0);
    } else if (filterMode === 'zero') {
      list = list.filter(c => (clientBalances[c.id]?.totalBalance || 0) <= 0);
    }

    // Sort by highest balance first
    list.sort((a, b) => {
      const balA = clientBalances[a.id]?.totalBalance || 0;
      const balB = clientBalances[b.id]?.totalBalance || 0;
      return balB - balA;
    });

    return list;
  }, [clients, search, filterMode, clientBalances]);

  // Helper to format days since last transaction
  const getDaysStagnant = (lastDateStr) => {
    if (!lastDateStr) return null;
    const diff = new Date() - new Date(lastDateStr);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-3.5">
      {/* Search and Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar cliente ou telefone..."
            className="w-full bg-slate-800 text-white placeholder-slate-400 text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterMode('withDebt')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition border ${
              filterMode === 'withDebt'
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
            }`}
          >
            Com Caixas ({clients.filter(c => (clientBalances[c.id]?.totalBalance || 0) > 0).length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition border ${
              filterMode === 'all'
                ? 'bg-brand-500/20 border-brand-500/60 text-brand-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setFilterMode('zero')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition border ${
              filterMode === 'zero'
                ? 'bg-slate-700 border-slate-600 text-slate-200'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
            }`}
          >
            Zerados
          </button>
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-2.5">
        {filteredList.length > 0 ? (
          filteredList.map((client) => {
            const data = clientBalances[client.id] || { totalBalance: 0, byType: [], lastTransactionDate: null };
            const daysStagnant = getDaysStagnant(data.lastTransactionDate);

            return (
              <div
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 active:scale-99 rounded-2xl p-3.5 transition cursor-pointer shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100 text-sm truncate">
                        {client.name}
                      </h3>
                      {data.totalBalance > 0 && daysStagnant >= 7 && (
                        <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-rose-500/40">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          {daysStagnant}d paradas
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      {client.address || client.phone || 'Sem endereço cadastrado'}
                    </div>

                    {/* Breakdown by crate types */}
                    {data.byType && data.byType.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {data.byType.filter(item => item.balance !== 0).map((item) => (
                          <span
                            key={item.crateTypeId}
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700/80"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            ></span>
                            <span className="text-slate-300">{item.crateName}:</span>
                            <span className="font-bold text-white">{item.balance}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Balance Badge */}
                  <div className="text-right flex flex-col items-end justify-between self-stretch">
                    <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/80 text-center min-w-[70px]">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block leading-tight">
                        Saldo
                      </span>
                      <span
                        className={`text-lg font-black leading-tight ${
                          data.totalBalance > 0
                            ? 'text-amber-400'
                            : data.totalBalance < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {data.totalBalance}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-2 text-slate-400 hover:text-slate-200 text-xs">
                      <span>Ver histórico</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Direct Action Bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {data.lastTransactionDate
                      ? `Último registro: ${new Date(data.lastTransactionDate).toLocaleDateString('pt-BR')}`
                      : 'Nenhuma movimentação ainda'}
                  </span>

                  <div className="flex items-center gap-2">
                    {client.phone && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${client.phone}`);
                          }}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition"
                          title="Ligar"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const msg = `Olá ${client.name}! Passando para conferir o saldo de caixas em posse conosco. Seu saldo atual é de ${data.totalBalance} caixas.`;
                            openWhatsAppLink(client.phone, msg);
                          }}
                          className="p-1.5 bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/50 rounded-lg border border-emerald-500/30 transition flex items-center gap-1 px-2 font-medium"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-3">
            <Package className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">Nenhum cliente encontrado nessa categoria.</p>
            <button
              onClick={onNewClientClick}
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow"
            >
              + Cadastrar Novo Cliente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
