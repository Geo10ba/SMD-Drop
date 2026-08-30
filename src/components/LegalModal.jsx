import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Lock, FileText, CheckCircle2, Building2, ExternalLink } from 'lucide-react';

export const LegalModal = ({ isOpen, onClose, mode = 'terms' }) => {
  const { companySettings } = useStore();

  if (!isOpen) return null;

  const isTerms = mode === 'terms';
  const title = isTerms 
    ? 'Termos e Condições de Uso (Blindagem Fabril & Dropshipping)' 
    : 'Política de Privacidade e Proteção de Dados (LGPD)';

  const content = isTerms ? companySettings.termsContent : companySettings.privacyContent;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col p-5 sm:p-7 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isTerms ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {isTerms ? <ShieldCheck size={24} /> : <Lock size={24} />}
            </div>
            <div>
              <span className={`uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 rounded inline-block mb-1 ${
                isTerms ? 'badge-gold' : 'badge-emerald'
              }`}>
                {isTerms ? 'BLINDAGEM JURÍDICA FABRIL & CDC' : 'CONFORMIDADE COM A LGPD (LEI 13.709/2018)'}
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit'] leading-tight">
                {title}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs leading-relaxed text-[var(--text-main)] font-sans whitespace-pre-line">
          <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-amber-500 shrink-0" />
              <span>
                <strong>{companySettings.name}</strong> • CNPJ: {companySettings.cnpj}
              </span>
            </div>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={13} /> Documento Vigente
            </span>
          </div>

          <div className="bg-slate-900/5 dark:bg-slate-900/40 p-4 rounded-xl border border-[var(--border-color)] space-y-3">
            {content}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 mt-2">
          <p className="text-[10px] text-[var(--text-muted)]">
            Documento registrado e protegido pela infraestrutura jurídica de <strong>{companySettings.name}</strong>.
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto btn-gold py-2 px-6 text-xs font-bold shadow-md"
          >
            Ciente e De Acordo
          </button>
        </div>
      </div>
    </div>
  );
};
