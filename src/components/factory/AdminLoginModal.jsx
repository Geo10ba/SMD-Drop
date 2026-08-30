import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Lock, Mail, Key, ShieldCheck, Factory, AlertCircle } from 'lucide-react';

export const AdminLoginModal = ({ isOpen, onClose }) => {
  const { adminEmail, loginAsAdmin } = useStore();
  const [emailInput, setEmailInput] = useState(adminEmail);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const success = loginAsAdmin(emailInput, passwordInput);
    if (success) {
      onClose();
    } else {
      setErrorMsg(`Acesso negado. Apenas o email do administrador (${adminEmail}) possui acesso ao Painel da Fábrica.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col p-5 sm:p-7 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Lock size={22} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                ACESSO RESTRITO DE FÁBRICA
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                Login de Administrador
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] font-bold p-1">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-xs text-red-600 dark:text-red-400 mb-4 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">
                Email do Administrador da Fábrica
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@smddrop.com.br"
                  className="input-field pl-10 font-mono font-semibold"
                />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                Padrão configurado: <strong>{adminEmail}</strong>
              </span>
            </div>

            <div>
              <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <Key size={16} className="absolute left-3 top-3 text-[var(--text-muted)]" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 font-mono"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full btn-gold justify-center py-3 text-sm font-bold shadow-lg"
              >
                <ShieldCheck size={18} /> Autenticar como Administrador
              </button>
            </div>

            <p className="text-[11px] text-center text-[var(--text-muted)] pt-3 border-t border-[var(--border-color)]">
              É um revendedor?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenRegister) onOpenRegister();
                }}
                className="text-amber-500 font-bold underline hover:text-amber-400"
              >
                Cadastre sua loja de revenda aqui
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
