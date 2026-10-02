import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getClientBalance } from '../db/db';
import { formatWhatsAppMessage, openWhatsAppLink } from '../utils/whatsapp';
import { Search, Plus, Minus, Send, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft, Store } from 'lucide-react';

export default function QuickMovement({ onNewClientClick }) {
  const clients = useLiveQuery(() => db.clients.toArray()) || [];
  const crateTypes = useLiveQuery(() => db.crateTypes.toArray()) || [];

  const [searchClient, setSearchClient] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedCrateTypeId, setSelectedCrateTypeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [lastMovementFeedback, setLastMovementFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-select first crate type if not selected
  React.useEffect(() => {
    if (!selectedCrateTypeId && crateTypes.length > 0) {
      setSelectedCrateTypeId(crateTypes[0].id);
    }
  }, [crateTypes, selectedCrateTypeId]);

  // Filter clients by search query
  const filteredClients = useMemo(() => {
    if (!searchClient.trim()) return clients.slice(0, 15);
    const q = searchClient.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.address && c.address.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [clients, searchClient]);

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === Number(selectedClientId));
  }, [clients, selectedClientId]);

  const selectedCrate = useMemo(() => {
    return crateTypes.find(c => c.id === Number(selectedCrateTypeId));
  }, [crateTypes, selectedCrateTypeId]);

  // Current balance of selected client
  const [currentClientBalance, setCurrentClientBalance] = useState(null);
  React.useEffect(() => {
    if (selectedClientId) {
      getClientBalance(Number(selectedClientId)).then(setCurrentClientBalance);
    } else {
      setCurrentClientBalance(null);
    }
  }, [selectedClientId, lastMovementFeedback]);

  // Adjust quantity
  const adjustQty = (amount) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const handleRecord = async (type) => {
    if (!selectedClientId) {
      alert('Por favor, selecione um cliente primeiro!');
      return;
    }
    if (!selectedCrateTypeId) {
      alert('Por favor, selecione um tipo de caixa/vasilhame!');
      return;
    }
    if (quantity <= 0) {
      alert('A quantidade deve ser maior que zero!');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      await db.transactions.add({
        clientId: Number(selectedClientId),
        crateTypeId: Number(selectedCrateTypeId),
        type, // 'DELIVERED' or 'COLLECTED'
        quantity: Number(quantity),
        date: now.toISOString(),
        notes: notes.trim()
      });

      // Recalculate balance for receipt
      const updatedBalance = await getClientBalance(Number(selectedClientId));

      const feedbackData = {
        clientName: selectedClient.name,
        phone: selectedClient.phone,
        operationType: type,
        crateName: selectedCrate?.name || 'Vasilhame',
        quantity: Number(quantity),
        newBalance: updatedBalance.totalBalance,
        date: now,
        notes: notes.trim()
      };

      setLastMovementFeedback(feedbackData);
      setNotes('');
      setQuantity(1);
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar movimentação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Last Movement Feedback & WhatsApp Button */}
      {lastMovementFeedback && (
        <div className="bg-slate-800 border-2 border-brand-500 rounded-2xl p-4 shadow-xl animate-fadeIn space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-brand-400 font-bold uppercase tracking-wider">
                  {lastMovementFeedback.operationType === 'DELIVERED' ? 'Registrado: Deixou' : 'Registrado: Recolheu'}
                </p>
                <h4 className="text-sm font-bold text-white leading-tight">
                  {lastMovementFeedback.clientName}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setLastMovementFeedback(null)}
              className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1"
            >
              ✕ Fechar
            </button>
          </div>

          <div className="flex items-center justify-between text-xs bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/60">
            <div>
              <span className="text-slate-400">Item: </span>
              <span className="font-semibold text-white">{lastMovementFeedback.crateName}</span>
              <span className="text-slate-400 ml-2">Qtd: </span>
              <span className="font-bold text-brand-400">{lastMovementFeedback.quantity}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Saldo Atual: </span>
              <span className="font-black text-amber-400 text-sm">{lastMovementFeedback.newBalance} caixas</span>
            </div>
          </div>

          <button
            onClick={() => {
              const msg = formatWhatsAppMessage(lastMovementFeedback);
              openWhatsAppLink(lastMovementFeedback.phone, msg);
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition text-sm"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Comprovante no WhatsApp</span>
          </button>
        </div>
      )}

      {/* Step 1: Client Selection */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-brand-500" />
            1. Selecione o Cliente / Estabelecimento
          </label>
          {selectedClient && (
            <button
              onClick={() => {
                setSelectedClientId('');
                setSearchClient('');
              }}
              className="text-xs text-brand-400 hover:underline"
            >
              Trocar
            </button>
          )}
        </div>

        {!selectedClientId ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
                placeholder="Buscar cliente por nome..."
                className="w-full bg-slate-900 text-white placeholder-slate-500 text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800">
              {filteredClients.length > 0 ? (
                filteredClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedClientId(c.id);
                      setSearchClient('');
                    }}
                    className="w-full text-left py-2 px-2.5 rounded-lg hover:bg-slate-700/60 active:bg-slate-700 flex items-center justify-between transition"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{c.name}</div>
                      {c.address && (
                        <div className="text-xs text-slate-400 truncate max-w-[240px]">{c.address}</div>
                      )}
                    </div>
                    <span className="text-xs text-brand-400 font-medium">Selecionar →</span>
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">
                  Nenhum cliente encontrado.
                  <button
                    onClick={onNewClientClick}
                    className="block mx-auto mt-2 text-brand-400 font-semibold underline"
                  >
                    + Cadastrar agora
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">{selectedClient.name}</div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                {selectedClient.phone && <span>📱 {selectedClient.phone}</span>}
                {selectedClient.address && <span className="truncate max-w-[160px]">📍 {selectedClient.address}</span>}
              </div>
            </div>

            {currentClientBalance && (
              <div className="text-right pl-2">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Saldo Atual</span>
                <span className={`text-base font-black ${currentClientBalance.totalBalance > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {currentClientBalance.totalBalance} caixas
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Crate Type Selection */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 shadow-sm space-y-2.5">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          2. Tipo de Caixa / Vasilhame
        </label>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {crateTypes.map((crate) => {
            const isSelected = Number(selectedCrateTypeId) === crate.id;
            return (
              <button
                key={crate.id}
                onClick={() => setSelectedCrateTypeId(crate.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand-600 border-brand-400 text-white shadow-md'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: crate.color || '#22c55e' }}
                ></span>
                <span>{crate.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Quantity Controls */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 shadow-sm space-y-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          3. Quantidade de Caixas
        </label>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => adjustQty(-1)}
            className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white flex items-center justify-center font-bold text-xl border border-slate-600 shadow"
          >
            <Minus className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-950 text-white text-center font-black text-3xl py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">unidades</span>
          </div>

          <button
            onClick={() => adjustQty(1)}
            className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white flex items-center justify-center font-bold text-xl border border-slate-600 shadow"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stepper Chips (+5, +10, +20) */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {[5, 10, 20, 50].map((step) => (
            <button
              key={step}
              onClick={() => adjustQty(step)}
              className="py-1.5 bg-slate-900 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-bold rounded-lg border border-slate-700/80 transition"
            >
              +{step}
            </button>
          ))}
        </div>

        {/* Optional Notes */}
        <div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observação rápida (opcional, ex: doca, lote...)"
            className="w-full bg-slate-900 text-xs text-white placeholder-slate-500 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-slate-500"
          />
        </div>
      </div>

      {/* Step 4: Big Action Buttons (Thumb zone) */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {/* Left: Deixei (+) */}
        <button
          disabled={isSubmitting || !selectedClientId}
          onClick={() => handleRecord('DELIVERED')}
          className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white font-extrabold py-4 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-brand-900/40 border border-brand-400/30 transition"
        >
          <div className="flex items-center gap-1.5 text-base">
            <ArrowUpRight className="w-5 h-5" />
            <span>DEIXEI (+)</span>
          </div>
          <span className="text-[11px] font-normal text-brand-100 opacity-90">
            Emprestar ao cliente
          </span>
        </button>

        {/* Right: Recolhi (-) */}
        <button
          disabled={isSubmitting || !selectedClientId}
          onClick={() => handleRecord('COLLECTED')}
          className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white font-extrabold py-4 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-sky-900/40 border border-sky-400/30 transition"
        >
          <div className="flex items-center gap-1.5 text-base">
            <ArrowDownLeft className="w-5 h-5" />
            <span>RECOLHI (-)</span>
          </div>
          <span className="text-[11px] font-normal text-sky-100 opacity-90">
            Devolução / Baixa
          </span>
        </button>
      </div>
    </div>
  );
}
