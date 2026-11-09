import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../context/StoreContext';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  CheckCircle2, 
  Building2, 
  Printer, 
  Copy, 
  Search, 
  Sparkles, 
  Scale, 
  Truck, 
  Check, 
  Info,
  ExternalLink
} from 'lucide-react';
import { DEFAULT_TERMS_OF_SERVICE, DEFAULT_PRIVACY_POLICY } from '../data/legalDocuments';

export const LegalModal = ({ isOpen, onClose, mode = 'terms', type }) => {
  const { companySettings, showNotification } = useStore();
  const effectiveInitialMode = type || mode || 'terms';
  const [activeTab, setActiveTab] = useState(effectiveInitialMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (type || mode) {
      setActiveTab(type || mode);
    }
  }, [type, mode]);

  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  const isTerms = activeTab === 'terms';

  // Get raw content with robust fallbacks
  const rawContent = useMemo(() => {
    if (isTerms) {
      return (companySettings?.termsContent && companySettings.termsContent.trim().length > 50)
        ? companySettings.termsContent
        : DEFAULT_TERMS_OF_SERVICE.trim();
    } else {
      return (companySettings?.privacyContent && companySettings.privacyContent.trim().length > 50)
        ? companySettings.privacyContent
        : DEFAULT_PRIVACY_POLICY.trim();
    }
  }, [isTerms, companySettings?.termsContent, companySettings?.privacyContent]);

  // Filter content by search term if typed
  const filteredParagraphs = useMemo(() => {
    if (!searchTerm.trim()) return rawContent;
    const term = searchTerm.toLowerCase();
    const blocks = rawContent.split(/\n\s*\n/);
    const matched = blocks.filter(b => b.toLowerCase().includes(term));
    if (matched.length === 0) {
      return `Nenhuma cláusula encontrada contendo "${searchTerm}". Tente buscar por termos como "etiqueta", "avaria", "CDC", "defeito" ou "LGPD".`;
    }
    return matched.join('\n\n---\n\n');
  }, [rawContent, searchTerm]);

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(rawContent);
      setCopied(true);
      showNotification('Documento legal copiado para a área de transferência!', 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9990] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        
        {/* Header & Tabs */}
        <div className="border-b border-[var(--border-color)] pb-4 shrink-0 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-inner ${
                isTerms ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
              }`}>
                {isTerms ? <ShieldCheck size={28} /> : <Lock size={28} />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`uppercase tracking-wider text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    isTerms ? 'badge-gold' : 'badge-emerald'
                  }`}>
                    {isTerms ? <Scale size={11} /> : <Lock size={11} />}
                    {isTerms ? 'BLINDAGEM JURÍDICA FABRIL B2B' : 'LEI FEDERAL Nº 13.709/2018'}
                  </span>
                  <span className="text-[11px] text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Documento Vigente 2026
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--text-main)] font-['Outfit'] leading-tight">
                  {isTerms ? 'Termos e Condições Gerais de Parceria Fabril' : 'Política de Privacidade e Proteção de Dados (LGPD)'}
                </h3>
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-2 rounded-xl hover:bg-[var(--bg-surface-hover)] transition-colors shrink-0"
              title="Fechar"
            >
              ✕
            </button>
          </div>

          {/* Tab Selector & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setActiveTab('terms'); setSearchTerm(''); }}
                className={`py-2 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  isTerms 
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldCheck size={14} />
                Termos e Condições de Uso
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('privacy'); setSearchTerm(''); }}
                className={`py-2 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  !isTerms 
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Lock size={14} />
                Política de Privacidade (LGPD)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="btn-secondary text-xs font-bold py-2 px-3 flex items-center gap-1.5 border border-slate-700 hover:border-amber-500"
                title="Copiar texto integral"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="btn-secondary text-xs font-bold py-2 px-3 flex items-center gap-1.5 border border-slate-700 hover:border-amber-500"
                title="Imprimir ou Salvar em PDF"
              >
                <Printer size={14} /> Imprimir
              </button>
            </div>
          </div>

          {/* Quick Search & Company Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="sm:col-span-2 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar cláusula ou artigo (ex: etiqueta, avaria, Art. 49, DPO)..."
                className="input-field text-xs pl-9 py-2 w-full"
              />
            </div>
            <div className="bg-[var(--bg-surface-hover)] px-3 py-2 rounded-xl border border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="truncate"><strong>{companySettings?.name || 'SMD Drop'}</strong></span>
              <span className="font-mono text-slate-400 text-[10px] shrink-0">CNPJ: {companySettings?.cnpj || '45.109.892/0001-99'}</span>
            </div>
          </div>
        </div>

        {/* Highlights Badges for Peace of Mind */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 shrink-0">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Truck size={14} />
            </div>
            <div className="leading-tight">
              <span className="text-[10px] text-slate-400 block font-semibold">Logística</span>
              <span className="text-[11px] font-black text-white">100% Neutra / Cega</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Scale size={14} />
            </div>
            <div className="leading-tight">
              <span className="text-[10px] text-slate-400 block font-semibold">Personalizados</span>
              <span className="text-[11px] font-black text-white">Exceção Art. 49 CDC</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={14} />
            </div>
            <div className="leading-tight">
              <span className="text-[10px] text-slate-400 block font-semibold">Transporte</span>
              <span className="text-[11px] font-black text-white">Seguro Marketplace</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Lock size={14} />
            </div>
            <div className="leading-tight">
              <span className="text-[10px] text-slate-400 block font-semibold">Dados dos Clientes</span>
              <span className="text-[11px] font-black text-white">Zero Prospecção</span>
            </div>
          </div>
        </div>

        {/* Legal Text Reader */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs leading-relaxed text-[var(--text-main)] font-sans border border-[var(--border-color)] bg-slate-900/30 p-4 sm:p-6 rounded-2xl">
          <div className="max-w-none space-y-4 whitespace-pre-wrap font-sans text-slate-300 selection:bg-amber-500 selection:text-slate-950">
            {filteredParagraphs}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 mt-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info size={13} className="text-amber-500 shrink-0" />
            <span>
              Dúvidas jurídicas ou exercício de direitos LGPD? Contate nosso DPO em: 
              <strong className="text-amber-400 ml-1">privacidade@smddrop.com.br</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto btn-gold py-2.5 px-7 text-xs font-black shadow-lg flex items-center justify-center gap-2"
          >
            <Check size={14} /> Ciente e De Acordo
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
