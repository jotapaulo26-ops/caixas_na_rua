import React, { useState, useEffect } from 'react';
import { db } from '../db/db';
import { triggerAutoSync } from '../db/supabase';
import { X, Save, Trash2, Store, Phone, MapPin, FileText } from 'lucide-react';

export default function ClientModal({ isOpen, onClose, clientToEdit = null, onSaved }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name || '');
      setPhone(clientToEdit.phone || '');
      setAddress(clientToEdit.address || '');
      setNotes(clientToEdit.notes || '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }

    setIsSaving(true);
    try {
      if (clientToEdit && clientToEdit.id) {
        await db.clients.update(clientToEdit.id, {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes.trim(),
        });
        if (onSaved) onSaved(clientToEdit.id);
      } else {
        const newId = await db.clients.add({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes.trim(),
          createdAt: new Date().toISOString(),
        });
        if (onSaved) onSaved(newId);
      }
      triggerAutoSync();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToEdit) return;
    const confirm = window.confirm(
      `Tem certeza que deseja apagar o cliente "${clientToEdit.name}" e todas as suas movimentações de caixas?`
    );
    if (confirm) {
      await db.transaction('rw', db.clients, db.transactions, async () => {
        await db.transactions.where('clientId').equals(clientToEdit.id).delete();
        await db.clients.delete(clientToEdit.id);
      });
      triggerAutoSync();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-brand-500" />
            <span>{clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nome / Estabelecimento *
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Mercado Santa Luzia"
                className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              WhatsApp / Telefone (com DDD)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 11988887777"
                className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Endereço / Referência
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Av. Brasil, 450 - Doca 2"
                className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Observações
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Falar com o encarregado Márcio"
                className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {clientToEdit && (
              <button
                type="button"
                onClick={handleDeleteClient}
                className="px-3 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl border border-rose-500/40 flex items-center justify-center transition"
                title="Apagar cliente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-900/40 transition text-sm"
            >
              <Save className="w-4 h-4" />
              <span>{clientToEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
