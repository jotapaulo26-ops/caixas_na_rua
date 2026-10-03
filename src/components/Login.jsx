import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, registerDriver, authenticateDriver } from '../db/db';
import { triggerAutoSync, syncSupabaseToLocal, isSupabaseConfigured } from '../db/supabase';
import { Package, Lock, User, Phone, ArrowRight, UserPlus, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const drivers = useLiveQuery(() => db.drivers.toArray()) || [];

  const [mode, setMode] = useState('login'); // 'login' or 'register'

  // Login form state
  const [loginName, setLoginName] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Baixa os entregadores da nuvem logo ao abrir a tela
  useEffect(() => {
    if (isSupabaseConfigured() && navigator.onLine) {
      syncSupabaseToLocal().catch(() => {});
    }
  }, []);

  // If no drivers exist at all, auto switch to register mode
  useEffect(() => {
    if (drivers && drivers.length === 0) {
      setMode('register');
    }
  }, [drivers]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let driver;
      try {
        driver = await authenticateDriver({ name: loginName, password: loginPass });
      } catch (firstErr) {
        if (isSupabaseConfigured() && navigator.onLine) {
          await syncSupabaseToLocal();
          driver = await authenticateDriver({ name: loginName, password: loginPass });
        } else {
          throw firstErr;
        }
      }

      localStorage.setItem('caixas_auth_user', JSON.stringify(driver));
      localStorage.setItem('caixas_auth_token', 'driver_' + driver.id);
      setIsLoading(false);
      onLoginSuccess(driver);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Usuário ou senha incorretos.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regName.trim()) {
      setError('Por favor, informe seu nome de entregador.');
      return;
    }
    if (!regPass.trim()) {
      setError('Por favor, digite uma senha de acesso.');
      return;
    }

    setIsLoading(true);
    try {
      const newDriver = await registerDriver({
        name: regName,
        phone: regPhone,
        password: regPass
      });

      // Auto sync with cloud in background
      triggerAutoSync();

      localStorage.setItem('caixas_auth_user', JSON.stringify(newDriver));
      localStorage.setItem('caixas_auth_token', 'driver_' + newDriver.id);
      setIsLoading(false);
      onLoginSuccess(newDriver);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Erro ao cadastrar entregador.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* App Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto shadow-xl shadow-brand-600/30">
            <Package className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Caixas na Rua
          </h1>
          <p className="text-xs text-slate-400">
            Controle de Vasilhames para Entregadores
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          {/* Tabs: Entrar vs Criar Conta */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Criar Conta</span>
            </button>
          </div>

          {/* Mode: Login */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Selecione ou digite seu Nome
                </label>
                {drivers.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      className="w-full bg-slate-800 text-white text-sm font-semibold p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500 cursor-pointer"
                    >
                      <option value="">-- Escolha seu usuário --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      placeholder="Ou digite seu nome..."
                      className="w-full bg-slate-800 text-white placeholder-slate-500 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      placeholder="Nome do entregador"
                      className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm pl-9 pr-3 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm pl-9 pr-3 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-600 hover:bg-brand-500 active:scale-98 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-900/40 transition text-sm pt-2"
              >
                <span>{isLoading ? 'Entrando...' : 'Entrar no Aplicativo'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Mode: Register */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nome do Entregador *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Jançanti, Carlos..."
                    className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm pl-9 pr-3 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  WhatsApp / Celular (Opcional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Ex: 11999998888"
                    className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm pl-9 pr-3 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Criar Senha de Acesso *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    placeholder="Digite uma senha"
                    className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm pl-9 pr-3 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-600 hover:bg-brand-500 active:scale-98 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-900/40 transition text-sm pt-2"
              >
                <span>{isLoading ? 'Cadastrando...' : 'Cadastrar e Entrar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-[11px] text-slate-500">
          Identificação de entregadores • Cada entrega registra seu autor
        </div>
      </div>
    </div>
  );
}
