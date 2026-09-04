import React, { useState } from 'react';
import { Download, Copy, Check, Image as ImageIcon, FileText, Tag, Barcode, ShieldCheck, Video, Layers, Package, Scale, FileCheck, ExternalLink, Plus } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ResellerProductImagesModal } from './ResellerProductImagesModal';

export const MediaKitModal = ({ product, onClose }) => {
  const { showNotification } = useStore();
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'variations' | 'dimensions' | 'fiscal' | 'photos'
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);

  if (!product) return null;

  const variations = Array.isArray(product.variations) ? product.variations : [];
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image || product.image_url || 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80'];

  const dims = product.dimensions || { length: 30, width: 30, height: 10 };

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
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Download size={22} />
            </div>
            <div>
              <span className="badge-indigo uppercase tracking-wider text-[10px] mb-1 inline-block">
                FICHA TÉCNICA & KIT DE MÍDIA COMPLETO
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-4 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <FileText size={14} /> Dados Gerais & Descrição
          </button>

          <button
            onClick={() => setActiveTab('variations')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'variations'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Layers size={14} /> Variações Shopee
            <span className="ml-1 bg-slate-900/20 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
              {variations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dimensions')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'dimensions'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Package size={14} /> Pesos & Dimensões
          </button>

          <button
            onClick={() => setActiveTab('fiscal')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'fiscal'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <FileCheck size={14} /> Dados Fiscais (NCM)
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'photos'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <ImageIcon size={14} /> Fotos HD
            <span className="ml-1 bg-slate-900/20 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
              {images.length}
            </span>
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1">

          {/* TAB 1: DADOS GERAIS & DESCRIÇÃO */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Photos Preview & Quick Data */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-indigo-500" /> Foto Principal
                </h4>
                
                <div className="rounded-xl overflow-hidden border border-[var(--border-color)] shadow-sm bg-slate-100 dark:bg-slate-800">
                  <img
                    src={product.image || images[0]}
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
                  <Download size={15} /> Baixar Pacote de Fotos ({images.length} fotos)
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
                  <p className="text-xs text-[var(--text-main)] leading-relaxed bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-color)] whitespace-pre-line">
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
          )}

          {/* TAB 2: VARIAÇÕES SHOPEE */}
          {activeTab === 'variations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Layers size={14} className="text-amber-500" /> Tabela de Variações ({variations.length} itens cadastrados)
                </h4>
              </div>

              {variations.length === 0 ? (
                <div className="p-8 text-center bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] text-xs">
                  Este produto possui variação única (sem opções de cor/tamanho cadastradas).
                </div>
              ) : (
                <div className="overflow-x-auto border border-[var(--border-color)] rounded-xl shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px] font-bold">
                        <th className="py-2.5 px-3">Nome da Variação</th>
                        <th className="py-2.5 px-3">SKU Variação</th>
                        <th className="py-2.5 px-3 text-right">Custo Atacado (R$)</th>
                        <th className="py-2.5 px-3 text-right">Sugestão Revenda (R$)</th>
                        <th className="py-2.5 px-3 text-center">Estoque (un)</th>
                        <th className="py-2.5 px-3">GTIN / EAN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {variations.map((v, idx) => (
                        <tr key={v.id || idx} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[var(--text-main)]">
                            {v.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[var(--text-muted)]">
                            {v.sku || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-amber-500 font-mono">
                            R$ {(parseFloat(v.wholesalePrice) || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-emerald-500 font-mono">
                            R$ {(parseFloat(v.price) || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold font-mono text-[var(--text-main)]">
                            {v.stock || 100}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[var(--text-muted)]">
                            {v.gtin || product.ean || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PESOS & DIMENSÕES */}
          {activeTab === 'dimensions' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Package size={14} className="text-indigo-500" /> Especificações Físicas para Frete e Logística
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">Peso Bruto (kg)</span>
                  <p className="text-lg font-extrabold text-[var(--text-main)] font-mono">
                    {product.weightKg ?? 0.5} kg
                  </p>
                </div>

                <div className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">Comprimento (cm)</span>
                  <p className="text-lg font-extrabold text-[var(--text-main)] font-mono">
                    {dims.length || 30} cm
                  </p>
                </div>

                <div className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">Largura (cm)</span>
                  <p className="text-lg font-extrabold text-[var(--text-main)] font-mono">
                    {dims.width || 30} cm
                  </p>
                </div>

                <div className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">Altura (cm)</span>
                  <p className="text-lg font-extrabold text-[var(--text-main)] font-mono">
                    {dims.height || 10} cm
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DADOS FISCAIS */}
          {activeTab === 'fiscal' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <FileCheck size={14} className="text-amber-500" /> Parâmetros Fiscais e Tributários para Emissão de Nota Fiscal
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">NCM Fiscal</span>
                  <p className="font-extrabold text-[var(--text-main)] font-mono">{product.ncm || '3926.90.90'}</p>
                </div>

                <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">CEST</span>
                  <p className="font-extrabold text-[var(--text-main)] font-mono">{product.cest || 'Não informado'}</p>
                </div>

                <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">Unidade de Medida</span>
                  <p className="font-extrabold text-[var(--text-main)]">{product.measureUnit || 'UN (UNIDADE)'}</p>
                </div>

                <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">CFOP Estadual</span>
                  <p className="font-extrabold text-[var(--text-main)] font-mono">{product.cfopSame || '5101'}</p>
                </div>

                <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">CFOP Interestadual</span>
                  <p className="font-extrabold text-[var(--text-main)] font-mono">{product.cfopDiff || '6101'}</p>
                </div>

                <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">Origem do Produto</span>
                  <p className="font-extrabold text-[var(--text-main)]">{product.origin || '0 - Nacional'}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FOTOS HD */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-indigo-500" /> Galeria Completa de Fotos HD ({images.length} fotos)
                </h4>
                <button
                  type="button"
                  onClick={() => setIsImagesModalOpen(true)}
                  className="btn-gold py-1.5 px-3 text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Plus size={14} /> Adicionar Fotos ao Catálogo
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="group relative bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                    <img
                      src={imgUrl}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <a
                      href={imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs transition-opacity gap-1"
                    >
                      <ExternalLink size={16} /> Abrir HD
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Add/Edit Product Images Modal */}
        {isImagesModalOpen && (
          <ResellerProductImagesModal
            product={product}
            onClose={() => setIsImagesModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

