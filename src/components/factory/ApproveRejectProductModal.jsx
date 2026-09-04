import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, XCircle, DollarSign, Tag, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';

export const ApproveRejectProductModal = ({ pendingProduct, onClose }) => {
  const { approveProductByAdmin, rejectProductByAdmin, categories } = useStore();

  const [mode, setMode] = useState('approve'); // 'approve' or 'reject'
  const [wholesalePrice, setWholesalePrice] = useState(60);
  const [suggestedPrice, setSuggestedPrice] = useState(140);
  const [category, setCategory] = useState(categories[0]);
  const [factoryNotes, setFactoryNotes] = useState('Produto aprovado para fabricação com preço de atacado preenchido.');
  const [rejectionReason, setRejectionReason] = useState('Produto fora do padrão de fabricação da nossa empresa.');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (pendingProduct) {
      setSuggestedPrice(pendingProduct.suggestedRetailPrice || 140);
      setWholesalePrice(Math.round((pendingProduct.suggestedRetailPrice || 140) * 0.45));
      setCategory(pendingProduct.category || categories[0]);
      if (pendingProduct.factoryNotes) {
        setFactoryNotes(pendingProduct.factoryNotes);
      }
    }
  }, [pendingProduct]);

  if (!pendingProduct) return null;

  const handleApprove = (e) => {
    e.preventDefault();
    approveProductByAdmin(
      pendingProduct.id,
      Number(wholesalePrice),
      Number(suggestedPrice),
      category,
      factoryNotes
    );
    onClose();
  };

  const handleReject = (e) => {
    e.preventDefault();
    rejectProductByAdmin(pendingProduct.id, rejectionReason);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div>
            <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
              AVALIAÇÃO DE PRODUTO SUGERIDO POR REVENDEDOR
            </span>
            <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
              {pendingProduct.title}
            </h3>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              Sugerido por: <strong>{pendingProduct.resellerName}</strong> ({pendingProduct.resellerEmail})
            </span>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {/* Product Preview Card */}
          <div className="flex items-center gap-3 p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-color)]">
            <img
              src={pendingProduct.image}
              alt={pendingProduct.title}
              className="w-16 h-16 object-cover rounded-lg border border-[var(--border-color)]"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--text-main)] truncate">{pendingProduct.title}</p>
              <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{pendingProduct.description}</p>
              <span className="badge-emerald text-[10px] mt-1 inline-block">
                Preço Desejado Revendedor: R$ {pendingProduct.suggestedRetailPrice?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Reseller Notes Callout */}
          {pendingProduct.resellerNotes && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <MessageSquare size={13} /> Observações / Solicitação do Revendedor:
              </span>
              <p className="text-xs text-[var(--text-main)] font-medium italic leading-relaxed">
                "{pendingProduct.resellerNotes}"
              </p>
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 border-b border-[var(--border-color)] pb-3">
            <button
              type="button"
              onClick={() => setMode('approve')}
              className={`p-2.5 rounded-xl border font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                mode === 'approve'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
              }`}
            >
              <CheckCircle2 size={16} /> Precificar & Aprovar
            </button>
            <button
              type="button"
              onClick={() => setMode('reject')}
              className={`p-2.5 rounded-xl border font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                mode === 'reject'
                  ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
              }`}
            >
              <XCircle size={16} /> Recusar Produto
            </button>
          </div>

          {mode === 'approve' ? (
            <form onSubmit={handleApprove} className="space-y-4">
              <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30 space-y-3">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Defina os Valores de Fabricação & Categoria Oficial
                </span>

                <div>
                  <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">Categoria Oficial do Catálogo</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[var(--text-muted)] font-bold">Custo Fábrica Atacado (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      className="input-field font-extrabold mt-1 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--text-muted)] font-bold">Preço Sugerido Venda (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={suggestedPrice}
                      onChange={(e) => setSuggestedPrice(e.target.value)}
                      className="input-field font-extrabold mt-1 text-base text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] font-bold mb-1">
                    Observações / Resposta da Fábrica ao Revendedor
                  </label>
                  <textarea
                    rows={2}
                    value={factoryNotes}
                    onChange={(e) => setFactoryNotes(e.target.value)}
                    placeholder="ex: Orçamento aprovado! Produto fabricado em acrílico cast 3mm nobre."
                    className="input-field text-xs font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 shrink-0">
                <button type="button" onClick={onClose} className="btn-secondary py-2.5 px-4 font-semibold">
                  Cancelar
                </button>
                <button type="submit" className="btn-emerald py-2.5 px-6 font-bold bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl shadow-md">
                  <CheckCircle2 size={16} /> Confirmar Precificação & Aprovar
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReject} className="space-y-4">
              <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30 space-y-2">
                <label className="block font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle size={14} /> Digite o Motivo da Recusa para o Revendedor:
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="ex: Não temos matéria-prima disponível no momento ou custo inviável..."
                  className="input-field text-xs"
                />
                <span className="text-[10px] text-[var(--text-muted)] block">
                  * Este motivo ficará visível no painel do revendedor para que ele entenda o porquê o produto não pôde ser cadastrado.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 shrink-0">
                <button type="button" onClick={onClose} className="btn-secondary py-2.5 px-4 font-semibold">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary py-2.5 px-6 font-bold bg-red-600 text-white hover:bg-red-500 rounded-xl shadow-md">
                  <XCircle size={16} /> Confirmar Recusa do Produto
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
