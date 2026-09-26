import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Download, FileSpreadsheet, CheckCircle2, Sparkles, Building2, ShoppingBag, ShieldCheck, Video, Tag } from 'lucide-react';
import { downloadMarketplaceCSV } from '../../lib/marketplaceExporters';

export const ExportCatalogModal = ({ isOpen, onClose }) => {
  const { products, showNotification } = useStore();
  const [platform, setPlatform] = useState('shopee'); // shopee, tiktok, mercadolivre, shopify, nuvemshop, yampi
  const [markupMultiplier, setMarkupMultiplier] = useState(2.2);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    const ok = downloadMarketplaceCSV(platform, products, markupMultiplier);
    if (ok) {
      showNotification(`Catálogo CSV para ${platform.toUpperCase()} exportado com sucesso! (${products.length} produtos)`);
      onClose();
    } else {
      showNotification('Erro ao gerar planilha de exportação.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <span className="badge-indigo uppercase tracking-wider text-[10px] mb-1 inline-block">
                EXPORTADOR DE CATÁLOGO EM MASSA (CSV)
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                Exportar para E-Commerce & Marketplaces
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-5 text-xs">
          {/* Target Platform Selector */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              1. Selecione a Plataforma de Venda
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlatform('shopee')}
                className={`p-2.5 rounded-xl border font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                  platform === 'shopee'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold shadow-sm'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
                }`}
              >
                <ShoppingBag size={15} /> Shopee (Criação)
              </button>

              <button
                type="button"
                onClick={() => setPlatform('tiktok')}
                className={`p-2.5 rounded-xl border font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                  platform === 'tiktok'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-extrabold shadow-sm'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
                }`}
              >
                🎵 TikTok Shop
              </button>

              <button
                type="button"
                onClick={() => setPlatform('mercadolivre')}
                className={`p-2.5 rounded-xl border font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                  platform === 'mercadolivre'
                    ? 'border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-extrabold shadow-sm'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
                }`}
              >
                💛 Mercado Livre
              </button>

              <button
                type="button"
                onClick={() => setPlatform('shopify')}
                className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                  platform === 'shopify'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 font-extrabold shadow-sm'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
                }`}
              >
                🟢 Shopify
              </button>

              <button
                type="button"
                onClick={() => setPlatform('nuvemshop')}
                className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                  platform === 'nuvemshop'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 font-extrabold shadow-sm'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
                }`}
              >
                🔵 Nuvemshop
              </button>

              <button
                type="button"
                onClick={() => setPlatform('yampi')}
                className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                  platform === 'yampi'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-600 font-extrabold shadow-sm'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
                }`}
              >
                🟣 Yampi / Cartpanda
              </button>
            </div>
          </div>

          {/* Compatibility Notices */}
          {platform === 'shopee' && (
            <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-xl space-y-1 text-[11px] text-orange-700 dark:text-orange-300">
              <div className="flex items-center gap-1.5 font-bold text-orange-600 dark:text-orange-400">
                <ShieldCheck size={15} />
                <span>Shopee Criação Básica em Massa (Universal)</span>
              </div>
              <p>
                Utiliza o padrão universal de cadastro da Shopee sem IDs de loja, funcionando em qualquer conta de vendedor.
              </p>
            </div>
          )}

          {platform === 'tiktok' && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl space-y-1 text-[11px] text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                <ShieldCheck size={15} />
                <span>TikTok Shop Batch Upload Template</span>
              </div>
              <p>
                Planilha no formato oficial do TikTok Seller Center para importação de catálogo com peso, medidas e imagens.
              </p>
            </div>
          )}

          {platform === 'mercadolivre' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl space-y-1 text-[11px] text-yellow-700 dark:text-yellow-300">
              <div className="flex items-center gap-1.5 font-bold text-yellow-600 dark:text-yellow-400">
                <ShieldCheck size={15} />
                <span>Mercado Livre - Carga em Massa (Títulos até 60 chars)</span>
              </div>
              <p>
                Títulos ajustados para o limite do Mercado Livre com peso em gramas e links das fotos em HD.
              </p>
            </div>
          )}

          {/* Markup Multiplier */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              2. Escolha a Margem de Revenda (Markup)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1.8, label: '1.8x Custo (+80%)' },
                { val: 2.2, label: '2.2x Custo (+120%)' },
                { val: 2.5, label: '2.5x Custo (+150%)' }
              ].map((m) => (
                <button
                  key={m.val}
                  type="button"
                  onClick={() => setMarkupMultiplier(m.val)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                    markupMultiplier === m.val
                      ? 'border-amber-500 bg-amber-500/10 text-[var(--text-main)]'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)] space-y-1 text-[11px] text-[var(--text-muted)]">
            <p className="font-semibold text-[var(--text-main)]">📦 Resumo da Exportação:</p>
            <p>• {products.length} produtos cadastrados com descrições, fotos HD e dimensões.</p>
            <p>• Preços de venda ajustados automaticamente para {markupMultiplier}x do custo de fábrica.</p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleExportCSV}
              className="w-full btn-gold justify-center py-3 text-sm font-bold shadow-lg flex items-center gap-2"
            >
              <Download size={16} /> Baixar Planilha CSV para {platform.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

