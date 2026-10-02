import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getHubStats } from '../db/db';
import { triggerAutoSync } from '../db/supabase';
import {
  Warehouse,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  Layers,
  Clock,
  User,
  ChevronDown
} from 'lucide-react';

export default function HubReturn({ currentDriver }) {
  const crateTypes = useLiveQuery(() => db.crateTypes.toArray()) || [];
  const hubReturns = useLiveQuery(() => db.hubReturns.reverse().sortBy('date')) || [];

  const [selectedCrateTypeId, setSelectedCrateTypeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hubStats, setHubStats] = useState({
    totalBoxesInHub: 0,
    byCrateType: [],
    totalDischarges: 0
  });

  useEffect(() => {
    if (!selectedCrateTypeId && crateTypes.length > 0) {
      setSelectedCrateTypeId(crateTypes[0].id);
    }
  }, [crateTypes, selectedCrateTypeId]);

  useEffect(() => {
    getHubStats().then(setHubStats);
  }, [hubReturns, crateTypes]);

  const adjustQty = (amount) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const handleDischarge = async (e) => {
    e.preventDefault();
    if (!selectedCrateTypeId) {
      alert('Selecione um tipo de vasilhame.');
      return;
    }
    if (quantity <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const crate = crateTypes.find(c => c.id === Number(selectedCrateTypeId));
      const now = new Date();

      await db.hubReturns.add({
        driverId: currentDriver?.id || null,
        driverName: currentDriver?.name || 'Entregador',
        crateTypeId: Number(selectedCrateTypeId),
        quantity: Number(quantity),
        date: now.toISOString(),
        notes: notes.trim()
      });

      // Background auto-sync with Supabase
      triggerAutoSync();

      setFeedback({
        crateName: crate?.name || 'Vasilhames',
        quantity: Number(quantity),
        driverName: currentDriver?.name || 'Entregador'
      });

      setQuantity(1);
      setNotes('');
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar descarga no galpão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const crateMap = new Map(crateTypes.map(c => [c.id, c]));

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Top Banner: Galpão Central Overview */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                Ponto de Devolução
              </span>
              <h2 className="text-lg font-black text-white leading-tight">
                Galpão Central / Base
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Devolvido</span>
            <span className="text-2xl font-black text-indigo-300">{hubStats.totalBoxesInHub}</span>
          </div>
        </div>

        {/* Breakdown by crate type in Hub */}
        {hubStats.byCrateType.length > 0 && (
          <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
            {hubStats.byCrateType.map(item => (
              <span
                key={item.crateTypeId}
                className="inline-flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-[11px]"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-300">{item.name}:</span>
                <span className="font-bold text-white">{item.total}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-300 shadow">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Descarga de <strong>{feedback.quantity}x {feedback.crateName}</strong> registrada por <strong>{feedback.driverName}</strong>!
            </span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white px-1 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Discharge Form */}
      <form onSubmit={handleDischarge} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Package className="w-4 h-4 text-indigo-400" />
          <span>Registrar Descarga de Caixas no Galpão</span>
        </h3>

        {/* Crate Type Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Tipo de Vasilhame a Descarregar
          </label>
          <div className="relative">
            <select
              value={selectedCrateTypeId}
              onChange={(e) => setSelectedCrateTypeId(Number(e.target.value))}
              className="w-full bg-slate-800 text-white text-sm font-semibold p-3.5 pr-10 rounded-xl border border-slate-700 appearance-none focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {crateTypes.map((crate) => (
                <option key={crate.id} value={crate.id}>
                  {crate.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-4 text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Quantity Stepper */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Quantidade Descarregada
          </label>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => adjustQty(-1)}
              className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-bold text-xl border border-slate-700"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="flex-1 text-center">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 text-white text-center font-black text-3xl py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">unidades no galpão</span>
            </div>

            <button
              type="button"
              onClick={() => adjustQty(1)}
              className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-bold text-xl border border-slate-700"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick step chips */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[5, 10, 20, 50].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => adjustQty(step)}
                className="py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition"
              >
                +{step}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações (ex: Carga do dia, caminhão 2...)"
            className="w-full bg-slate-800 text-xs text-white placeholder-slate-500 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-98 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 transition text-sm"
        >
          <Warehouse className="w-4 h-4" />
          <span>Confirmar Descarga no Galpão</span>
        </button>
      </form>

      {/* History of Discharges at Hub */}
      <div className="space-y-2 pt-1">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Histórico de Descargas no Galpão ({hubReturns.length})
        </h4>

        {hubReturns.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {hubReturns.map((item) => {
              const crate = crateMap.get(item.crateTypeId);
              const dateObj = new Date(item.date);

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">
                        {item.quantity}x {crate?.name || 'Vasilhames'}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: crate?.color || '#818cf8' }}
                      ></span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-indigo-400">
                      <User className="w-3 h-3" />
                      <span>Descarregado por: <strong>{item.driverName || 'Entregador'}</strong></span>
                    </div>

                    {item.notes && (
                      <p className="text-[10px] text-slate-400 italic">"{item.notes}"</p>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 text-right">
                    <div>{dateObj.toLocaleDateString('pt-BR')}</div>
                    <div>{dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
            Nenhuma descarga registrada no galpão central até o momento.
          </div>
        )}
      </div>
    </div>
  );
}
