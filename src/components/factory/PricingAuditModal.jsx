import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Sparkles, ShieldAlert, Diamond, CheckCircle2, RefreshCw, ArrowRight, DollarSign } from 'lucide-react';
import { analyzeFactoryProductCostAndPriceWithIA } from '../../lib/smdAssistIa';

export const PricingAuditModal = ({ isOpen, onClose }) => {
  const { products, companySettings, materials, updateProduct, showNotification } = useStore();

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState(null);

  if (!isOpen) return null;

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditResults(null);
    showNotification('🧠 Lumen IA auditando custos e margens de todos os produtos...', 'purple');

    try {
      const activeProducts = products.filter(p => p.status !== 'rascunho');
      const results = [];

      for (const prod of activeProducts) {
        const res = await analyzeFactoryProductCostAndPriceWithIA({
          product: prod,
          companyCosts: companySettings,
          materials
        });

        results.push({
          product: prod,
          analysis: res
        });
      }

      setAuditResults(results);
      showNotification('Auditagem de precificação concluída!');
    } catch (e) {
      console.error('Erro ao auditar precificação:', e);
      showNotification('Erro durante a auditagem com IA.', 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleApplySuggestion = (prod, recWholesale, recRetail) => {
    updateProduct(prod.id, {
      wholesalePrice: recWholesale,
      suggestedRetailPrice: recRetail
    });
    showNotification(`Preços atualizados para "${prod.title}"! (Atacado: R$ ${recWholesale.toFixed(2)})`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles size={22} />
            </div>
            <div>
              <span className="badge-purple uppercase tracking-wider text-[10px] mb-1 inline-block">
                AUDITORIA INTELIGENTE DE MARGENS E VALOR AGREGADO
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                Análise de Precificação Lumen IA
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {!auditResults && !isAuditing && (
          <div className="p-8 text-center space-y-4 bg-[var(--bg-surface-hover)] rounded-2xl border border-[var(--border-color)] my-auto">
            <Sparkles size={40} className="mx-auto text-purple-500 animate-pulse" />
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="font-bold text-sm text-[var(--text-main)]">
                Pronto para auditar a precificação de {products.length} produtos?
              </h4>
              <p className="text-xs text-[var(--text-muted)]">
                A Lumen IA vai cruzar seus custos de materiais (Acrílico Espelhado vs MDF) e custos de operação para identificar produtos com risco de prejuízo ou precificados abaixo do seu valor real de mercado.
              </p>
            </div>
            <button
              onClick={handleRunAudit}
              className="btn-purple py-3 px-6 text-xs font-bold shadow-lg flex items-center justify-center gap-2 mx-auto"
            >
              <Sparkles size={16} className="text-amber-300" /> Iniciar Auditagem de Precificação com IA
            </button>
          </div>
        )}

        {isAuditing && (
          <div className="p-12 text-center space-y-4 bg-[var(--bg-surface-hover)] rounded-2xl border border-[var(--border-color)] my-auto">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-[var(--text-main)]">
                Lumen IA analisando nobreza dos materiais e custos fabris...
              </h4>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Processando custos operacionais, NFe e percepção de mercado
              </p>
            </div>
          </div>
        )}

        {auditResults && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl">
              <div>
                <span className="font-bold text-purple-600 dark:text-purple-400 block text-xs">
                  ✅ Auditagem Concluída ({auditResults.length} produtos analisados)
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Confira as sugestões de ajuste para não ter prejuízo e maximizar o lucro.
                </span>
              </div>
              <button
                onClick={handleRunAudit}
                className="btn-secondary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw size={13} /> Reanalisar
              </button>
            </div>

            <div className="space-y-3">
              {auditResults.map(({ product: p, analysis: a }, idx) => {
                const isWarning = a.status === 'alerta_prejuizo' || a.status === 'preco_submedido_dinheiro_mesa';
                return (
                  <div
                    key={p.id || idx}
                    className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                      a.status === 'alerta_prejuizo'
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : a.status === 'preco_submedido_dinheiro_mesa'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-[var(--bg-surface-hover)] border-[var(--border-color)]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-9 h-9 rounded-lg object-cover border border-[var(--border-color)]"
                        />
                        <div>
                          <h5 className="font-bold text-[var(--text-main)] text-xs line-clamp-1">{p.title}</h5>
                          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                            <span>Material: <strong>{p.category || 'Geral'}</strong></span>
                            <span>•</span>
                            <span className="font-semibold text-purple-600 dark:text-purple-400">{a.materialPerception}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${
                        a.status === 'alerta_prejuizo'
                          ? 'bg-rose-500/20 text-rose-600 border-rose-500/40'
                          : a.status === 'preco_submedido_dinheiro_mesa'
                          ? 'bg-amber-500/20 text-amber-600 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40'
                      }`}>
                        {a.statusLabel}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--text-main)] leading-relaxed">
                      {a.analysisSummary}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900 dark:bg-slate-950 p-2.5 rounded-xl text-xs font-mono text-white shadow-inner border border-slate-800">
                      <div className="bg-slate-800/90 p-2 rounded-lg border border-slate-700/60">
                        <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider">Custo Estimado:</span>
                        <strong className="text-white text-xs font-extrabold block mt-0.5">R$ {(a.totalCostEstimate || 0).toFixed(2)}</strong>
                      </div>
                      <div className="bg-slate-800/90 p-2 rounded-lg border border-amber-500/40">
                        <span className="text-amber-400 block text-[10px] uppercase font-bold tracking-wider">Atacado Atual:</span>
                        <strong className="text-amber-300 text-xs font-extrabold block mt-0.5">R$ {(parseFloat(p.wholesalePrice) || 0).toFixed(2)}</strong>
                      </div>
                      <div className="bg-slate-800/90 p-2 rounded-lg border border-emerald-500/40">
                        <span className="text-emerald-400 block text-[10px] uppercase font-bold tracking-wider">Atacado Sugerido IA:</span>
                        <strong className="text-emerald-300 text-xs font-extrabold block mt-0.5">R$ {(a.recommendedWholesalePrice || 0).toFixed(2)}</strong>
                      </div>
                      <div className="bg-slate-800/90 p-2 rounded-lg border border-cyan-500/40">
                        <span className="text-cyan-300 block text-[10px] uppercase font-bold tracking-wider">Varejo Sugerido IA:</span>
                        <strong className="text-cyan-200 text-xs font-extrabold block mt-0.5">R$ {(a.suggestedRetailPrice || 0).toFixed(2)}</strong>
                      </div>
                    </div>

                    {isWarning && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleApplySuggestion(p, a.recommendedWholesalePrice, a.suggestedRetailPrice)}
                          className="btn-gold py-1 px-3 text-[11px] font-bold flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 size={13} /> Aplicar Precificação Recomendada
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
