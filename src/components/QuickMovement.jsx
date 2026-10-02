import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getClientBalance } from '../db/db';
import { triggerAutoSync } from '../db/supabase';
import { formatWhatsAppMessage, openWhatsAppLink } from '../utils/whatsapp';
import {
  Search,
  Plus,
  Minus,
  Send,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Store,
  Layers,
  ChevronDown,
  X,
  Sparkles
} from 'lucide-react';

export default function QuickMovement({ onNewClientClick, currentDriver }) {
  const clients = useLiveQuery(() => db.clients.toArray()) || [];
  const crateTypes = useLiveQuery(() => db.crateTypes.toArray()) || [];

  const [searchClient, setSearchClient] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedCrateTypeId, setSelectedCrateTypeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [lastMovementFeedback, setLastMovementFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New category inline modal
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#22c55e');
  const [newCatValue, setNewCatValue] = useState('');

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

  // Create new category inline
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const newId = await db.crateTypes.add({
        name: newCatName.trim(),
        color: newCatColor,
        unitValue: parseFloat(newCatValue) || 0,
        isDefault: false
      });

      setSelectedCrateTypeId(newId);
      setNewCatName('');
      setNewCatValue('');
      setIsNewCategoryOpen(false);

      // Auto sync to cloud in background
      triggerAutoSync();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar categoria.');
    }
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
        notes: notes.trim(),
        driverId: currentDriver?.id || null,
        driverName: currentDriver?.name || 'Entregador'
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
        driverName: currentDriver?.name || 'Entregador',
        date: now,
        notes: notes.trim()
      };

      setLastMovementFeedback(feedbackData);
      setNotes('');
      setQuantity(1);

      // Subir automaticamente para a nuvem em segundo plano
      triggerAutoSync();
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

      {/* Step 2: Crate Type Selection in List + New Category Option */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-500" />
            2. Tipo de Caixa / Vasilhame
          </label>
          <button
            onClick={() => setIsNewCategoryOpen(true)}
            className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 bg-brand-500/10 px-2 py-1 rounded-lg border border-brand-500/30 active:scale-95 transition"
          >
            <Sparkles className="w-3 h-3 text-brand-400" />
            <span>+ Nova Categoria</span>
          </button>
        </div>

        {/* Crate Selection List / Dropdown */}
        <div className="space-y-2">
          <div className="relative">
            <select
              value={selectedCrateTypeId}
              onChange={(e) => setSelectedCrateTypeId(Number(e.target.value))}
              className="w-full bg-slate-900 text-white text-sm font-semibold p-3.5 pr-10 rounded-xl border border-slate-700 appearance-none focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              {crateTypes.map((crate) => (
                <option key={crate.id} value={crate.id}>
                  {crate.name} {crate.unitValue > 0 ? `(R$ ${crate.unitValue.toFixed(2)})` : ''}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-4 text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Visual Preview Tag of Selected Item */}
          {selectedCrate && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow"
                  style={{ backgroundColor: selectedCrate.color || '#22c55e' }}
                ></span>
                <span className="font-bold text-slate-200">{selectedCrate.name}</span>
              </div>
              <span className="text-slate-400 text-[11px]">
                {selectedCrate.unitValue > 0 ? `Valor ref: R$ ${selectedCrate.unitValue.toFixed(2)}` : 'Sem valor unitário'}
              </span>
            </div>
          )}
        </div>

        {/* Inline Modal for Creating New Category */}
        {isNewCategoryOpen && (
          <div className="bg-slate-900 border border-brand-500/50 rounded-xl p-3.5 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-400" />
                <span>Criar Nova Categoria de Vasilhame</span>
              </h4>
              <button
                onClick={() => setIsNewCategoryOpen(false)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Caixa de Madeira Pequena, Tambor 50L..."
                  className="w-full bg-slate-800 text-xs text-white p-2 rounded-lg border border-slate-700 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Cor Visual
                  </label>
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-full h-8 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer p-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Valor Estimado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newCatValue}
                    onChange={(e) => setNewCatValue(e.target.value)}
                    placeholder="Ex: 30.00"
                    className="w-full bg-slate-800 text-xs text-white p-2 rounded-lg border border-slate-700 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryOpen(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 rounded-lg text-xs transition shadow"
                >
                  Salvar e Selecionar
                </button>
              </div>
            </form>
          </div>
        )}
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
