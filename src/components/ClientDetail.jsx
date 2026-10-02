import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getClientBalance } from '../db/db';
import { ArrowLeft, Trash2, Phone, MessageSquare, Plus, Minus, Send, Calendar, Clock, Edit2 } from 'lucide-react';
import { formatWhatsAppMessage, openWhatsAppLink } from '../utils/whatsapp';

export default function ClientDetail({ clientId, onBack, onEditClient }) {
  const client = useLiveQuery(() => db.clients.get(Number(clientId)), [clientId]);
  const transactions = useLiveQuery(
    () => db.transactions.where('clientId').equals(Number(clientId)).reverse().sortBy('date'),
    [clientId]
  ) || [];
  const crateTypes = useLiveQuery(() => db.crateTypes.toArray()) || [];

  const [balanceData, setBalanceData] = useState({ totalBalance: 0, byType: [] });
  const crateMap = new Map(crateTypes.map(c => [c.id, c]));

  useEffect(() => {
    if (clientId) {
      getClientBalance(Number(clientId)).then(setBalanceData);
    }
  }, [clientId, transactions]);

  const handleDeleteTransaction = async (transId) => {
    if (window.confirm('Deseja realmente apagar esta movimentação? Essa ação alterará o saldo.')) {
      await db.transactions.delete(transId);
    }
  };

  const handleShareFullStatement = () => {
    if (!client) return;
    let msg = `📦 *EXTRATO DE VASILHAMES*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📍 *Cliente:* ${client.name}\n`;
    msg += `📅 *Emitido em:* ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;

    msg += `📊 *SALDO TOTAL ATUAL:* *${balanceData.totalBalance} caixas*\n\n`;
    msg += `*Detalhamento por tipo:*\n`;
    balanceData.byType.forEach(item => {
      msg += `• ${item.crateName}: ${item.balance} un.\n`;
    });

    msg += `\n━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_Controle de caixas e vasilhames do entregador_`;

    openWhatsAppLink(client.phone, msg);
  };

  if (!client) {
    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <p className="text-slate-400">Cliente não encontrado.</p>
        <button onClick={onBack} className="mt-4 text-brand-400 underline">Voltar</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4 text-brand-400" />
          <span>Voltar</span>
        </button>

        <button
          onClick={() => onEditClient(client)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 active:scale-95 transition"
        >
          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Editar Cadastro</span>
        </button>
      </div>

      {/* Client Overview Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">{client.name}</h2>
            {client.phone && <p className="text-xs text-slate-300 mt-0.5">📱 {client.phone}</p>}
            {client.address && <p className="text-xs text-slate-400 mt-0.5">📍 {client.address}</p>}
            {client.notes && <p className="text-xs text-amber-300/80 mt-1 italic">📝 {client.notes}</p>}
          </div>

          <div className="bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 text-center min-w-[80px]">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Saldo</span>
            <span className={`text-2xl font-black ${balanceData.totalBalance > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {balanceData.totalBalance}
            </span>
          </div>
        </div>

        {/* Breakdown by crate type */}
        {balanceData.byType && balanceData.byType.length > 0 && (
          <div className="pt-2 border-t border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Saldo por tipo:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {balanceData.byType.map(item => (
                <div
                  key={item.crateTypeId}
                  className="bg-slate-900/60 p-2 rounded-xl border border-slate-700/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-xs text-slate-200 truncate">{item.crateName}</span>
                  </div>
                  <span className="text-xs font-black text-white ml-1">{item.balance}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons for WhatsApp & Call */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {client.phone && (
            <button
              onClick={() => window.open(`tel:${client.phone}`)}
              className="py-2 px-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5 text-brand-400" />
              <span>Ligar</span>
            </button>
          )}
          <button
            onClick={handleShareFullStatement}
            className={`py-2 px-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow ${
              !client.phone ? 'col-span-2' : ''
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Extrato WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Transactions History Header */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Histórico de Entregas e Coletas ({transactions.length})
        </h3>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {transactions.length > 0 ? (
          transactions.map(t => {
            const isDelivered = t.type === 'DELIVERED';
            const crate = crateMap.get(t.crateTypeId);
            const dateObj = new Date(t.date);

            return (
              <div
                key={t.id}
                className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isDelivered
                        ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    }`}
                  >
                    {isDelivered ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">
                        {isDelivered ? 'Deixou (+)' : 'Recolheu (-)'} {t.quantity} un.
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: crate?.color || '#94a3b8' }}
                      ></span>
                      <span>{crate?.name || 'Vasilhame'}</span>
                    </div>
                    <div className="text-[10px] text-brand-300/90 font-medium">
                      👤 {isDelivered ? 'Entregue por:' : 'Recolhido por:'} <strong className="text-white">{t.driverName || 'Entregador'}</strong>
                    </div>
                    {t.notes && <div className="text-[10px] text-slate-400 italic">"{t.notes}"</div>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <div className="text-[11px] text-slate-400 text-right">
                    <div>{dateObj.toLocaleDateString('pt-BR')}</div>
                    <div>{dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>

                  <button
                    onClick={() => handleDeleteTransaction(t.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                    title="Excluir lançamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 bg-slate-800/40 rounded-xl border border-slate-800">
            Nenhuma movimentação registrada para este cliente.
          </div>
        )}
      </div>
    </div>
  );
}
