import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, exportAllDataJSON, exportCSVReport, importDataJSON, initDatabaseDefaults } from '../db/db';
import { isSupabaseConfigured, syncLocalToSupabase, syncSupabaseToLocal } from '../db/supabase';
import { Download, Upload, Plus, Trash2, FileSpreadsheet, RefreshCw, Layers, ShieldCheck, Cloud, CloudUpload, CloudDownload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const crateTypes = useLiveQuery(() => db.crateTypes.toArray()) || [];

  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#22c55e');
  const [newTypeValue, setNewTypeValue] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);

  // Cloud sync state
  const isCloudReady = isSupabaseConfigured();
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncLocalToSupabase();
      if (res.success) {
        setSyncStatus({ type: 'success', text: 'Dados enviados para a nuvem Supabase com sucesso!' });
      } else {
        setSyncStatus({ type: 'error', text: res.error || res.reason || 'Erro ao sincronizar' });
      }
    } catch (err) {
      setSyncStatus({ type: 'error', text: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncFromCloud = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncSupabaseToLocal();
      if (res.success) {
        setSyncStatus({ type: 'success', text: 'Dados baixados da nuvem e atualizados no celular!' });
      } else {
        setSyncStatus({ type: 'error', text: res.error || res.reason || 'Erro ao baixar dados' });
      }
    } catch (err) {
      setSyncStatus({ type: 'error', text: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddCrateType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    await db.crateTypes.add({
      name: newTypeName.trim(),
      color: newTypeColor,
      unitValue: parseFloat(newTypeValue) || 0,
      isDefault: false
    });

    setNewTypeName('');
    setNewTypeValue('');
    setIsAddingType(false);
  };

  const handleDeleteCrateType = async (id, name) => {
    if (crateTypes.length <= 1) {
      alert('Você precisa ter pelo menos um tipo de caixa cadastrado.');
      return;
    }
    if (window.confirm(`Deseja apagar o tipo "${name}"? Movimentações existentes com este tipo serão mantidas.`)) {
      await db.crateTypes.delete(id);
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result;
        const res = await importDataJSON(content);
        if (res.success) {
          alert('Backup restaurado com sucesso!');
        } else {
          alert('Falha ao restaurar backup: ' + res.error);
        }
      } catch (err) {
        alert('Erro ao ler arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (window.confirm('ATENÇÃO: Deseja realmente zerar todos os dados e recarregar os dados de demonstração? Faça um backup antes se quiser guardar os dados atuais!')) {
      await db.transaction('rw', db.clients, db.crateTypes, db.transactions, async () => {
        await db.clients.clear();
        await db.crateTypes.clear();
        await db.transactions.clear();
      });
      await initDatabaseDefaults();
      alert('Dados restaurados com sucesso.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Supabase Cloud Sync Section */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-sky-400" />
            <span>Nuvem Supabase</span>
          </h3>
          {isCloudReady ? (
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Conectado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
              Apenas Local
            </span>
          )}
        </div>

        {isCloudReady ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">
              Sincronize os dados do seu celular com seu banco na nuvem Supabase para compartilhar com outros aparelhos.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                disabled={isSyncing}
                onClick={handleSyncToCloud}
                className="py-2.5 px-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Enviar p/ Nuvem</span>
              </button>

              <button
                disabled={isSyncing}
                onClick={handleSyncFromCloud}
                className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-600 transition"
              >
                <CloudDownload className="w-4 h-4" />
                <span>Baixar da Nuvem</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/70 text-xs space-y-2">
            <p className="text-slate-300 font-medium">
              💡 Para ativar a nuvem Supabase:
            </p>
            <ol className="list-decimal list-inside text-slate-400 space-y-1 text-[11px]">
              <li>Crie um projeto grátis no <span className="text-sky-400">supabase.com</span></li>
              <li>Execute o script <span className="text-brand-400 font-mono">supabase_schema.sql</span> no SQL Editor</li>
              <li>Preencha a URL e a Anon Key no arquivo <span className="text-amber-400 font-mono">.env</span></li>
            </ol>
          </div>
        )}

        {syncStatus && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              syncStatus.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {syncStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{syncStatus.text}</span>
          </div>
        )}
      </div>

      {/* Crate Types Management */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Tipos de Caixas e Vasilhames</span>
          </h3>
          <button
            onClick={() => setIsAddingType(!isAddingType)}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
          >
            {isAddingType ? 'Cancelar' : '+ Novo Tipo'}
          </button>
        </div>

        {/* Add Type Form */}
        {isAddingType && (
          <form onSubmit={handleAddCrateType} className="bg-slate-900 p-3 rounded-xl border border-slate-700 space-y-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nome do Vasilhame</label>
              <input
                type="text"
                required
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Ex: Engradado 300ml, Palete PBR..."
                className="w-full bg-slate-800 text-xs text-white p-2 rounded-lg border border-slate-700 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Cor de Identificação</label>
                <input
                  type="color"
                  value={newTypeColor}
                  onChange={(e) => setNewTypeColor(e.target.value)}
                  className="w-full h-8 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer p-0.5"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Valor Unitário Estimado (R$)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newTypeValue}
                  onChange={(e) => setNewTypeValue(e.target.value)}
                  placeholder="Ex: 35.00"
                  className="w-full bg-slate-800 text-xs text-white p-2 rounded-lg border border-slate-700 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 rounded-lg text-xs transition"
            >
              Salvar Tipo de Vasilhame
            </button>
          </form>
        )}

        {/* List of current crate types */}
        <div className="space-y-1.5">
          {crateTypes.map((ct) => (
            <div
              key={ct.id}
              className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow"
                  style={{ backgroundColor: ct.color }}
                ></span>
                <div>
                  <span className="text-xs font-bold text-slate-200">{ct.name}</span>
                  {ct.unitValue > 0 && (
                    <span className="text-[10px] text-slate-400 ml-2">
                      (R$ {ct.unitValue.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>

              {crateTypes.length > 1 && (
                <button
                  onClick={() => handleDeleteCrateType(ct.id, ct.name)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                  title="Apagar tipo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Backup and Data Export */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Segurança & Backup Local</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Seus dados ficam 100% gravados na memória local do celular (mesmo offline). Exporte cópias de segurança a qualquer momento.
        </p>

        <div className="space-y-2 pt-1">
          {/* Download JSON */}
          <button
            onClick={exportAllDataJSON}
            className="w-full bg-slate-700 hover:bg-slate-600 active:scale-98 text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-600 flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-brand-400" />
            <span>Fazer Download do Backup Completo (.JSON)</span>
          </button>

          {/* Download CSV for Excel */}
          <button
            onClick={exportCSVReport}
            className="w-full bg-slate-700 hover:bg-slate-600 active:scale-98 text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-600 flex items-center justify-center gap-2 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Planilha Excel de Movimentações (.CSV)</span>
          </button>

          {/* Import JSON */}
          <label className="w-full bg-slate-900 hover:bg-slate-850 active:scale-98 text-slate-300 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition">
            <Upload className="w-4 h-4 text-sky-400" />
            <span>Restaurar Dados a Partir de Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Reset System */}
      <div className="pt-2">
        <button
          onClick={handleResetData}
          className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold py-2 px-3 rounded-xl border border-rose-500/30 flex items-center justify-center gap-2 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restaurar Dados de Exemplo / Limpar</span>
        </button>
      </div>

      {/* App Footer Info */}
      <div className="text-center text-[11px] text-slate-500 pt-3">
        Caixas na Rua v1.0 • PWA Offline-First
      </div>
    </div>
  );
}
