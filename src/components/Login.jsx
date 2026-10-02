import React, { useState } from 'react';
import { Package, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Check credentials: Jançanti / 260497
    if (cleanUser === 'jançanti' || cleanUser === 'jancanti') {
      if (cleanPass === '260497') {
        setIsLoading(true);
        setTimeout(() => {
          localStorage.setItem('caixas_auth_user', 'Jançanti');
          localStorage.setItem('caixas_auth_token', 'logged_in_' + Date.now());
          setIsLoading(false);
          onLoginSuccess();
        }, 300);
        return;
      }
    }

    setError('Usuário ou senha incorretos. Verifique suas credenciais.');
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
            Controle de Vasilhames e Entregas
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              <span>Acesso ao Sistema</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Identifique-se para gerenciar suas entregas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nome do Usuário
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome (ex: Jançanti)"
                  className="w-full bg-slate-800 text-white placeholder-slate-500 text-sm pl-9 pr-3 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500"
                />
              </div>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha numérica"
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
              className="w-full bg-brand-600 hover:bg-brand-500 active:scale-98 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-900/40 transition text-sm"
            >
              <span>{isLoading ? 'Entrando...' : 'Entrar no Aplicativo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          Uso seguro • Sessão protegida no aparelho
        </div>
      </div>
    </div>
  );
}
