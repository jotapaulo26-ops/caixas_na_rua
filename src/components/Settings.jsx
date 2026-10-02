import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, exportAllDataJSON, exportCSVReport, importDataJSON, initDatabaseDefaults } from '../db/db';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  syncLocalToSupabase,
  syncSupabaseToLocal
} from '../db/supabase';
import {
  Download,
  Upload,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  Layers,
  ShieldCheck,
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  Key,
  Database,
  ExternalLink,
  Copy
} from 'lucide-react';

export default function Settings() {
  const crateTypes = useLiveQuery(() => db.crateTypes.toArray()) || [];

  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#22c55e');
  const [newTypeValue, setNewTypeValue] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);

  // Cloud configuration
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isCloudConfigOpen, setIsCloudConfigOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.key);
  }, []);

  const handleSaveCloudConfig = async (e) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      alert('Por favor, informe a URL e a Chave Anon do Supabase.');
      return;
    }

    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setIsTesting(true);
    setSyncStatus(null);

    const test = await testSupabaseConnection();
    setIsTesting(false);

    if (test.success) {
      setSyncStatus({ type: 'success', text: 'Conectado com sucesso ao Supabase!' });
      setIsCloudConfigOpen(false);
    } else {
      setSyncStatus({ type: 'error', text: test.error });
    }
  };

  const handleDisconnectCloud = () => {
    if (window.confirm('Deseja desconectar o projeto Supabase deste aparelho?')) {
      clearSupabaseConfig();
      setSupabaseUrl('');
      setSupabaseKey('');
      setSyncStatus({ type: 'info', text: 'Supabase desconectado. O app voltou ao modo 100% local.' });
    }
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncLocalToSupabase();
      if (res.success) {
        setSyncStatus({ type: 'success', text: 'Dados enviados para o Supabase com sucesso!' });
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
        setSyncStatus({ type: 'success', text: 'Dados baixados da nuvem e salvos no celular!' });
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
    if (window.confirm(`Deseja apagar o tipo "${name}"?`)) {
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
    if (window.confirm('Deseja realmente recarregar os dados de exemplo?')) {
      await db.transaction('rw', db.clients, db.crateTypes, db.transactions, async () => {
        await db.clients.clear();
        await db.crateTypes.clear();
        await db.transactions.clear();
      });
      await initDatabaseDefaults();
      alert('Dados restaurados com sucesso.');
    }
  };

  const isConfigured = getSupabaseConfig().isConfigured;

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Supabase Cloud Connection Card */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Supabase: "Coletor de Caixas"
              </h3>
              <p className="text-[11px] text-slate-400">
                {isConfigured ? 'Projeto vinculado' : 'Nenhum projeto conectado'}
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isConfigured
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {isConfigured ? 'Conectado' : 'Apenas Local'}
          </span>
        </div>

        {/* Sync Buttons if connected */}
        {isConfigured && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isSyncing}
                onClick={handleSyncToCloud}
                className="py-2.5 px-3 bg-sky-600 hover:bg-sky-500 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Enviar p/ Nuvem</span>
              </button>

              <button
                disabled={isSyncing}
                onClick={handleSyncFromCloud}
                className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 active:scale-95 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-600 transition"
              >
                <CloudDownload className="w-4 h-4" />
                <span>Baixar da Nuvem</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                onClick={() => setIsCloudConfigOpen(!isCloudConfigOpen)}
                className="text-sky-400 hover:underline text-[11px]"
              >
                {isCloudConfigOpen ? 'Ocultar Credenciais' : 'Alterar Credenciais'}
              </button>
              <button
                onClick={handleDisconnectCloud}
                className="text-rose-400 hover:underline text-[11px]"
              >
                Desconectar
              </button>
            </div>
          </div>
        )}

        {/* Cloud Credentials Form */}
        {(!isConfigured || isCloudConfigOpen) && (
          <form onSubmit={handleSaveCloudConfig} className="bg-slate-900/90 p-3 rounded-xl border border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Credenciais do Projeto no Supabase
              </span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-sky-400 hover:underline flex items-center gap-0.5"
              >
                Painel Supabase <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                Project URL (https://xxxx.supabase.co)
              </label>
              <input
                type="url"
                required
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://sua-id.supabase.co"
                className="w-full bg-slate-800 text-xs text-white p-2 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                Anon Public Key (chave pública do projeto)
              </label>
              <input
                type="text"
                required
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                className="w-full bg-slate-800 text-xs text-white p-2 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isTesting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Testando Conexão...' : 'Conectar Projeto Supabase'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Sync Status Banner */}
        {syncStatus && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              syncStatus.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : syncStatus.type === 'info'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {syncStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="leading-tight">{syncStatus.text}</span>
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
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Cor</label>
                <input
                  type="color"
                  value={newTypeColor}
                  onChange={(e) => setNewTypeColor(e.target.value)}
                  className="w-full h-8 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer p-0.5"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Valor Unitário (R$)</label>
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

      {/* Backup and Local Data */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Segurança & Backup Local</span>
        </h3>

        <div className="space-y-2 pt-1">
          <button
            onClick={exportAllDataJSON}
            className="w-full bg-slate-700 hover:bg-slate-600 active:scale-98 text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-600 flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-brand-400" />
            <span>Fazer Download do Backup (.JSON)</span>
          </button>

          <button
            onClick={exportCSVReport}
            className="w-full bg-slate-700 hover:bg-slate-600 active:scale-98 text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-600 flex items-center justify-center gap-2 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Planilha Excel (.CSV)</span>
          </button>

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
      <div className="pt-1">
        <button
          onClick={handleResetData}
          className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold py-2 px-3 rounded-xl border border-rose-500/30 flex items-center justify-center gap-2 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restaurar Dados de Exemplo</span>
        </button>
      </div>

      <div className="text-center text-[11px] text-slate-500 pt-2">
        Caixas na Rua v1.0 • GitHub: <a href="https://github.com/jotapaulo26-ops/caixas_na_rua" target="_blank" rel="noreferrer" className="text-slate-400 hover:underline">caixas_na_rua</a>
      </div>
    </div>
  );
}
