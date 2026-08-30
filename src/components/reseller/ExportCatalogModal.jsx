import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Download, FileSpreadsheet, CheckCircle2, Sparkles, Building2 } from 'lucide-react';

export const ExportCatalogModal = ({ isOpen, onClose }) => {
  const { products, showNotification } = useStore();
  const [platform, setPlatform] = useState('shopify'); // shopify, nuvemshop, yampi
  const [markupMultiplier, setMarkupMultiplier] = useState(2.2);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (platform === 'shopify') {
      csvContent += "Handle,Title,Body (HTML),Vendor,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Grams,Variant Inventory Qty,Variant Inventory Policy,Variant Fulfillment Service,Variant Price,Variant Compare At Price,Variant Requires Shipping,Variant Taxable,Image Src\n";
      
      products.forEach((p) => {
        const handle = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const price = p.pricingType === 'custom_m2' ? (p.pricePerM2 * markupMultiplier).toFixed(2) : (p.wholesalePrice * markupMultiplier).toFixed(2);
        const compareAtPrice = (price * 1.25).toFixed(2);

        csvContent += `"${handle}","${p.title}","${p.description}","SMD Drop","${p.category}","Dropship,Fabrica",TRUE,"Title","Default Title","${p.ean || p.id}",500,99,"deny","manual",${price},${compareAtPrice},TRUE,TRUE,"${p.image}"\n`;
      });
    } else {
      // Nuvemshop / Yampi
      csvContent += "Identificador,Nome,Categoria,Preco,Preco_Promocional,Estoque,Descricao,Imagem\n";
      products.forEach((p) => {
        const price = p.pricingType === 'custom_m2' ? (p.pricePerM2 * markupMultiplier).toFixed(2) : (p.wholesalePrice * markupMultiplier).toFixed(2);
        const compareAtPrice = (price * 1.25).toFixed(2);
        csvContent += `"${p.id}","${p.title}","${p.category}",${compareAtPrice},${price},99,"${p.description}","${p.image}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `catalogo_fabrica_${platform}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`Catálogo CSV para ${platform.toUpperCase()} exportado com sucesso!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <span className="badge-emerald uppercase tracking-wider text-[10px] mb-1 inline-block">
                EXPORTADOR DE CATÁLOGO EM MASSA (CSV)
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                Exportar para E-Commerce
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
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPlatform('shopify')}
                className={`p-3 rounded-xl border font-bold text-center transition-all ${
                  platform === 'shopify'
                    ? 'border-emerald-500 bg-emerald-500/10 text-[var(--text-main)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
                }`}
              >
                Shopify
              </button>

              <button
                type="button"
                onClick={() => setPlatform('nuvemshop')}
                className={`p-3 rounded-xl border font-bold text-center transition-all ${
                  platform === 'nuvemshop'
                    ? 'border-emerald-500 bg-emerald-500/10 text-[var(--text-main)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
                }`}
              >
                Nuvemshop
              </button>

              <button
                type="button"
                onClick={() => setPlatform('yampi')}
                className={`p-3 rounded-xl border font-bold text-center transition-all ${
                  platform === 'yampi'
                    ? 'border-emerald-500 bg-emerald-500/10 text-[var(--text-main)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
                }`}
              >
                Yampi / Cartpanda
              </button>
            </div>
          </div>

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
            <p>• {products.length} produtos cadastrados com descrições, fotos HD e NCM.</p>
            <p>• Preços de venda ajustados automaticamente para {markupMultiplier}x do custo de fábrica.</p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleExportCSV}
              className="w-full btn-gold justify-center py-3 text-sm font-bold shadow-lg"
            >
              <Download size={16} /> Baixar Planilha CSV para {platform.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
