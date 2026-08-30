import React, { useState } from 'react';
import { Download, Copy, Check, Image as ImageIcon, FileText, Tag, Barcode, ShieldCheck, Video } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const MediaKitModal = ({ product, onClose }) => {
  const { showNotification } = useStore();
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'title') {
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 2000);
      showNotification('Título copiado para a área de transferência!');
    } else {
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
      showNotification('Descrição copiada para a área de transferência!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Download size={22} />
            </div>
            <div>
              <span className="badge-indigo uppercase tracking-wider text-[10px] mb-1 inline-block">
                KIT DE MÍDIA & ANÚNCIOS (DADOS DA FÁBRICA)
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                {product.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Photos Preview & Download */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <ImageIcon size={14} className="text-indigo-500" /> Fotos HD em Alta Resolução
            </h4>
            
            <div className="rounded-xl overflow-hidden border border-[var(--border-color)] shadow-sm bg-slate-100 dark:bg-slate-800">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-48 object-cover"
              />
            </div>

            <div className="bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="flex items-center gap-1"><Barcode size={13} /> EAN / GTIN:</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{product.ean || "789981230101"}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="flex items-center gap-1"><Tag size={13} /> NCM Fiscal:</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{product.ncm || "3926.90.90"}</span>
              </div>
            </div>

            <button
              onClick={() => showNotification('Download de fotos em HD iniciado em ZIP!')}
              className="w-full btn-secondary justify-center text-xs font-bold py-2.5"
            >
              <Download size={15} /> Baixar Pacote de Fotos (ZIP)
            </button>

            {product.video && (
              <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/30 space-y-2 text-xs">
                <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 uppercase text-[10px]">
                  <Video size={14} /> Vídeo Demonstrativo do Produto
                </span>
                <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                  <video src={product.video} controls className="w-full h-full object-contain" />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Pre-written Copy for Marketplaces */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <FileText size={14} className="text-amber-500" /> Textos Prontos para Mercado Livre & Shopee
            </h4>

            {/* Copy Title */}
            <div className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)] relative">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">
                  Título Sugerido p/ Anúncio (SEO)
                </span>
                <button
                  onClick={() => copyToClipboard(product.mediaKit?.copyTitle || product.title, 'title')}
                  className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 hover:underline"
                >
                  {copiedTitle ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copiedTitle ? "Copiado!" : "Copiar Título"}
                </button>
              </div>
              <p className="text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-color)] font-mono">
                {product.mediaKit?.copyTitle || product.title}
              </p>
            </div>

            {/* Copy Description */}
            <div className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)] relative">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">
                  Descrição Comercial para Cadastro
                </span>
                <button
                  onClick={() => copyToClipboard(product.mediaKit?.copyDescription || product.description, 'desc')}
                  className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 hover:underline"
                >
                  {copiedDesc ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copiedDesc ? "Copiado!" : "Copiar Descrição"}
                </button>
              </div>
              <p className="text-xs text-[var(--text-main)] leading-relaxed bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-color)]">
                {product.mediaKit?.copyDescription || product.description}
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <ShieldCheck size={16} className="shrink-0 mt-0.5" />
              <span>
                <strong>Garantia de Origem da Fábrica:</strong> Todos os textos e imagens deste Kit de Mídia estão autorizados para você cadastrar no Mercado Livre, Shopee, Amazon e loja própria.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
