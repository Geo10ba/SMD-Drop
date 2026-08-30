import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  UserPlus, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Store, 
  FileText, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export const RegisterModal = ({ isOpen, onClose, onOpenLegalModal }) => {
  const { registerReseller, showNotification } = useStore();

  const [storeName, setStoreName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Eye toggles for passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mandatory terms checkbox
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Errors state
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Format WhatsApp live mask: (XX) 9XXXX-XXXX
  const handleWhatsappChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }

    setWhatsapp(value);
  };

  // Format CNPJ/CPF live mask
  const handleDocumentChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);

    if (value.length > 11) {
      // CNPJ: 00.000.000/0001-00
      value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`;
    } else if (value.length > 6) {
      // CPF: 000.000.000-00
      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)}.${value.slice(3)}`;
    }

    setDocumentNumber(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Sanitization & Validation
    if (!storeName.trim()) {
      setErrorMessage('Por favor, informe o Nome Fantasia / Razão Social.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor, informe um e-mail comercial válido.');
      return;
    }

    if (whatsapp.replace(/\D/g, '').length < 10) {
      setErrorMessage('Por favor, informe um número de WhatsApp válido.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem. Verifique a confirmação.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Você deve ler e aceitar os Termos de Uso e Política de Privacidade.');
      return;
    }

    // Call Store Context Registration
    const success = registerReseller({
      storeName: storeName.trim(),
      cnpj: documentNumber.trim(),
      phone: whatsapp.trim(),
      email: email.trim().toLowerCase(),
      password
    });

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full max-h-[95vh] flex flex-col p-6 sm:p-7 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3.5 mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <UserPlus size={22} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                CADASTRO DE REVENDEDOR AUTORIZADO
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] font-['Outfit']">
                Criar Conta na SMD Drop
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Grid Layout 2 Colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome da Loja - Ocupa 2 Colunas */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1">
                <Store size={13} className="text-amber-500" /> Nome Fantasia / Razão Social *
              </label>
              <input
                type="text"
                required
                placeholder="ex: Lucas E-Commerce Store"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="input-field font-semibold text-sm py-2.5"
              />
            </div>

            {/* CNPJ ou CPF */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1">
                <FileText size={13} className="text-amber-500" /> CNPJ ou CPF
              </label>
              <input
                type="text"
                placeholder="00.000.000/0001-00"
                value={documentNumber}
                onChange={handleDocumentChange}
                className="input-field font-mono font-semibold py-2.5"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1">
                <Phone size={13} className="text-amber-500" /> WhatsApp Direct *
              </label>
              <input
                type="text"
                required
                placeholder="(11) 99999-9999"
                value={whatsapp}
                onChange={handleWhatsappChange}
                className="input-field font-mono font-bold text-amber-500 py-2.5"
              />
            </div>

            {/* Email Comercial - Ocupa 2 Colunas */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1">
                <Mail size={13} className="text-amber-500" /> E-mail Comercial *
              </label>
              <input
                type="email"
                required
                placeholder="contato@sualoja.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field font-semibold py-2.5"
              />
            {/* Campo Senha */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1">
                <Lock size={13} className="text-amber-500" /> Senha de Acesso *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field font-semibold pr-9 py-2.5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-3 text-[var(--text-muted)] hover:text-amber-500 transition-colors"
                  title={showPassword ? 'Ocultar Senha' : 'Mostrar Senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Senha */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1">
                <Lock size={13} className="text-amber-500" /> Confirmar Senha *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`input-field font-semibold pr-9 py-2.5 ${
                    confirmPassword && confirmPassword === password
                      ? 'border-emerald-500 focus:border-emerald-500'
                      : confirmPassword && confirmPassword !== password
                      ? 'border-red-500 focus:border-red-500'
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-3 text-[var(--text-muted)] hover:text-amber-500 transition-colors"
                  title={showConfirmPassword ? 'Ocultar Senha' : 'Mostrar Senha'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          </div>

          {/* Passwords Match Indicator */}
          {password && confirmPassword && (
            <div className="text-[11px] font-bold">
              {password === confirmPassword ? (
                <span className="text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Senhas coincidem perfeitamente!
                </span>
              ) : (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertCircle size={13} /> As senhas não coincidem.
                </span>
              )}
            </div>
          )}

          {/* Checkbox Obrigatório dos Termos e Condições */}
          <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)] space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-700 bg-slate-900 cursor-pointer"
              />
              <span className="text-[11px] text-[var(--text-main)] leading-snug">
                Li e concordo com os{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegalModal && onOpenLegalModal('terms')}
                  className="text-amber-500 font-bold underline hover:text-amber-400"
                >
                  Termos e Condições de Uso
                </button>{' '}
                e a{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegalModal && onOpenLegalModal('privacy')}
                  className="text-amber-500 font-bold underline hover:text-amber-400"
                >
                  Política de Privacidade & LGPD
                </button>{' '}
                da SMD Drop.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!agreeTerms}
              className={`w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                agreeTerms
                  ? 'btn-gold'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <ShieldCheck size={18} /> Criar Minha Conta de Revendedor <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
