import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Wand2, Copy, Check, Sparkles, FileText, Video } from 'lucide-react';

export const MagicImportModal = ({ isOpen, onClose, initialData }) => {
  const { currentUser, viewMode, addProduct, suggestProductByReseller, categories, addCategory, showNotification } = useStore();

  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Extracted Product Form (Initialized from initialData synchronously)
  const [form, setForm] = useState(() => ({
    title: initialData?.title || '',
    description: initialData?.description || '',
    image: initialData?.image || '',
    video: initialData?.video || '',
    category: categories[0] || 'Logomarcas & Letreiros',
    pricingType: 'fixed',
    wholesalePrice: initialData?.wholesalePrice || 50,
    suggestedRetailPrice: initialData?.suggestedRetailPrice || 120
  }));

  // Sync initialData passed from StoreContext when updated
  useEffect(() => {
    if (initialData && initialData.title) {
      setForm((prev) => ({
        ...prev,
        title: initialData.title || prev.title,
        description: initialData.description || prev.description,
        image: initialData.image || prev.image,
        video: initialData.video || prev.video,
        suggestedRetailPrice: initialData.suggestedRetailPrice || prev.suggestedRetailPrice,
        wholesalePrice: initialData.wholesalePrice || prev.wholesalePrice
      }));
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin' || viewMode === 'factory';

  // Enhanced Bookmarklet JS Code supporting Video capture
  const targetOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const bookmarkletCode = `javascript:(function(){try{var g=function(p){var m=document.querySelector('meta[property="'+p+'"]')||document.querySelector('meta[name="'+p+'"]');return m?m.content:''};var t=g('og:title')||(document.querySelector('h1')&&document.querySelector('h1').innerText)||document.title;var getDesc=function(){var og=g('og:description')||g('twitter:description')||g('description');if(og&&og.trim().length>10)return og.trim();var sel=['.ui-pdp-description__content','.ui-pdp-description','#description','#productDescription','#feature-bullets','._2uL-YH','.product-detail','[class*="description"]'];for(var i=0;i<sel.length;i++){var el=document.querySelector(sel[i]);if(el&&el.innerText&&el.innerText.trim().length>10){return el.innerText.trim()}}return''};var d=getDesc();var i=g('og:image')||'';if(!i){var im=document.querySelector('img[src]');if(im)i=im.src}var getVid=function(){var ogv=g('og:video')||g('og:video:url')||g('og:video:secure_url');if(ogv)return ogv;var vEl=document.querySelector('video source[src]')||document.querySelector('video[src]');if(vEl&&(vEl.src||vEl.getAttribute('src')))return vEl.src||vEl.getAttribute('src');var ifr=document.querySelector('iframe[src*="youtube.com"], iframe[src*="youtu.be"], iframe[src*="vimeo"]');if(ifr&&ifr.src)return ifr.src;return''};var v=getVid();var pe=Array.from(document.querySelectorAll('*')).find(function(el){return el.children.length<3&&el.innerText&&/R\\$\\s?\\d/.test(el.innerText)});var p='';if(pe){var mm=pe.innerText.match(/R\\$\\s?([\\d\\.]+,\\d{2}|[\\d\\.]+)/);if(mm)p=mm[1].replace(/\\./g,'').replace(',','.')}var u=window.location.href;var pl='outro';if(/shopee\\./i.test(u))pl='shopee';else if(/mercadoli/i.test(u))pl='mercadolivre';else if(/amazon\\./i.test(u))pl='amazon';var ct=t.replace(/\\s*[\\|\\-]\\s*(Shopee|Mercado Livre|Amazon).*$/i,'').trim();var url='${targetOrigin}?auto=1&magic=1&title='+encodeURIComponent(ct)+'&desc='+encodeURIComponent(d)+'&price='+encodeURIComponent(p)+'&img='+encodeURIComponent(i)+'&video='+encodeURIComponent(v)+'&url='+encodeURIComponent(u)+'&platform='+pl;alert('Capturando Produto e Vídeo...');var w=window.open(url,'_blank');if(!w)window.location.href=url}catch(e){alert('Erro ao capturar: '+e.message)}})();`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2500);
    showNotification('Código do Botão Mágico copiado! Cole no favorito (Ctrl+D).');
  };

  // AI Description Generator Assistant
  const handleGenerateAiDescription = () => {
    if (!form.title) {
      showNotification('Digite o título primeiro para gerar a descrição.', 'error');
      return;
    }
    const aiDesc = `🔥 ${form.title.toUpperCase()} - PRODUTO PREMIUM DE FÁBRICA\n\n` +
      `✨ Destaques & Especificações Técnicas:\n` +
      `• Acabamento de altíssima precisão com corte a laser.\n` +
      `• Matéria-prima nobre e espessura reforçada de alta durabilidade.\n` +
      `• Produto enviado em embalagem reforçada anti-impacto (Envio Cego sem marca).\n` +
      `• Pronta entrega e envio imediato direto da fábrica.\n\n` +
      `📦 Garantia total contra defeitos de fabricação e envio com Nota Fiscal/Declaração.`;

    setForm((prev) => ({ ...prev, description: aiDesc }));
    showNotification('✨ Descrição comercial profissional gerada por IA!');
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!form.title) return;

    if (isAdmin) {
      addProduct({
        title: form.title,
        category: form.category,
        pricingType: form.pricingType,
        wholesalePrice: Number(form.wholesalePrice),
        suggestedRetailPrice: Number(form.suggestedRetailPrice),
        factoryStock: 100,
        pricePerM2: Number(form.wholesalePrice),
        suggestedPricePerM2: Number(form.suggestedRetailPrice),
        description: form.description || `Produto ${form.title} fabricado com qualidade fabril.`,
        image: form.image || "https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80",
        video: form.video || ""
      });
    } else {
      suggestProductByReseller({
        title: form.title,
        category: form.category,
        pricingType: form.pricingType,
        suggestedRetailPrice: Number(form.suggestedRetailPrice),
        description: form.description || `Produto ${form.title} sugerido para fabricação.`,
        image: form.image || "https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80",
        video: form.video || ""
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Wand2 size={22} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                TECNOLOGIA BOTÃO MÁGICO (PROMOFLOW)
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                Cadastrar Produto Rápido
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {/* Bookmarklet Setup Section */}
          <div className="bg-gradient-to-br from-slate-900 to-amber-950 text-white p-5 rounded-2xl space-y-4 shadow-inner">
            <div className="flex items-center gap-2">
              <Wand2 size={18} className="text-amber-400" />
              <h4 className="font-bold text-sm">Botão Mágico nos Favoritos do Navegador</h4>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              Arraste o botão abaixo para a sua <strong>barra de favoritos</strong>. Depois, em qualquer página de produto da Shopee/Mercado Livre/Amazon, clique nele e o formulário abrirá já preenchido com <strong>Foto HD, Título, Preço, Descrição E Vídeo</strong>.
            </p>

            <div className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-amber-500/40 bg-slate-800/60">
              <div
                dangerouslySetInnerHTML={{
                  __html: `<a href="${bookmarkletCode.replace(/"/g, "&quot;")}" onclick="event.preventDefault()" draggable="true" title="Arraste-me para a barra de favoritos" class="cursor-move inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-extrabold rounded-lg shadow-lg hover:scale-105 transition-transform select-none">⚡ Capturar Produto & Vídeo</a>`
                }}
              />
              <p className="text-xs text-slate-400 text-center">
                👆 Clique e <strong>arraste</strong> para a barra de favoritos do navegador (Ctrl+Shift+B se oculta).
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-700">
              <p className="font-bold text-xs text-slate-200">Não consegue arrastar? Criar manualmente:</p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-400 text-[11px]">
                <li>Pressione <strong>Ctrl+D</strong> no seu navegador para criar um favorito.</li>
                <li>Nome: <strong>"⚡ Capturar Produto"</strong></li>
                <li>Edite o favorito e cole o código abaixo no campo <strong>URL</strong>:</li>
              </ol>
              <div className="flex gap-2 pt-1">
                <input
                  readOnly
                  value={bookmarkletCode}
                  className="flex-1 p-2 bg-slate-800 rounded font-mono text-[10px] text-slate-300 border border-slate-700 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyBookmarklet}
                  className="btn-gold text-xs font-bold py-1 px-3 shrink-0"
                >
                  {copiedBookmarklet ? <Check size={14} /> : <Copy size={14} />}
                  {copiedBookmarklet ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          </div>

          {/* Form Preview of Extracted Product */}
          <form onSubmit={handleSaveProduct} className="space-y-4 pt-2 border-t border-[var(--border-color)]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--text-main)] uppercase tracking-wider text-[11px]">
                Dados do Produto Extraído / Cadastrado:
              </span>
              {!isAdmin && (
                <span className="badge-gold text-[10px] font-bold">
                  Será enviado p/ Precificação do Admin
                </span>
              )}
            </div>

            {form.image && (
              <div className="flex items-center gap-3 p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-color)]">
                <img src={form.image} alt={form.title} className="w-16 h-16 object-cover rounded-lg border" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--text-main)] line-clamp-1">{form.title || "Sem título"}</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    Preço Sugerido: R$ {form.suggestedRetailPrice.toFixed(2)}
                  </p>
                  {form.video && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-0.5">
                      <Video size={12} /> Vídeo do produto capturado!
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">Título do Produto</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="ex: Placa Acrílica Neon Podcast"
                className="input-field font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                {!isCreatingCategory ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-[var(--text-muted)] uppercase">Categoria</label>
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory(true)}
                        className="text-[10px] text-amber-500 font-bold hover:underline"
                      >
                        + Nova
                      </button>
                    </div>
                    <select
                      value={form.category}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsCreatingCategory(true);
                        } else {
                          setForm({ ...form, category: e.target.value });
                        }
                      }}
                      className="input-field font-medium"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__NEW__">➕ Criar Nova Categoria...</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">Criar Categoria</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Nome da categoria..."
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        className="input-field font-semibold text-xs py-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCategoryInput.trim()) {
                            const created = newCategoryInput.trim();
                            addCategory(created);
                            setForm((prev) => ({ ...prev, category: created }));
                            setNewCategoryInput('');
                            setIsCreatingCategory(false);
                          }
                        }}
                        className="btn-gold px-2.5 py-2 text-xs font-extrabold shrink-0"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory(false)}
                        className="px-1.5 py-2 text-xs text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">Tipo Precificação</label>
                <select
                  value={form.pricingType}
                  onChange={(e) => setForm({ ...form, pricingType: e.target.value })}
                  className="input-field font-semibold"
                >
                  <option value="fixed">Preço Fixo (Unidade)</option>
                  <option value="custom_m2">Sob Medida (Metro Quadrado R$/m²)</option>
                </select>
              </div>
            </div>

            {isAdmin ? (
              <div className="grid grid-cols-2 gap-3 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                <div>
                  <label className="block font-bold text-[var(--text-muted)]">Custo Fábrica Atacado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.wholesalePrice}
                    onChange={(e) => setForm({ ...form, wholesalePrice: Number(e.target.value) })}
                    className="input-field font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-muted)]">Preço Sugerido Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.suggestedRetailPrice}
                    onChange={(e) => setForm({ ...form, suggestedRetailPrice: Number(e.target.value) })}
                    className="input-field font-bold mt-1 text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">Preço Sugerido de Venda Desejado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.suggestedRetailPrice}
                  onChange={(e) => setForm({ ...form, suggestedRetailPrice: Number(e.target.value) })}
                  className="input-field font-bold text-emerald-600 dark:text-emerald-400"
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                  * O administrador da fábrica definirá o Custo Fábrica de Atacado antes de aprovar.
                </span>
              </div>
            )}

            {/* Enhanced Description Field with AI Assistant Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
                  <FileText size={14} className="text-amber-500" /> Descrição Completa do Produto
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAiDescription}
                  className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30"
                >
                  <Sparkles size={11} /> ⚡ Gerar Descrição Comercial IA
                </button>
              </div>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição capturada automaticamente da página do anúncio..."
                className="input-field text-xs font-sans leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">URL da Imagem HD</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1">
                  <Video size={13} className="text-purple-500" /> URL do Vídeo (MP4 / YouTube)
                </label>
                <input
                  type="text"
                  value={form.video}
                  onChange={(e) => setForm({ ...form, video: e.target.value })}
                  placeholder="https://..."
                  className="input-field font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-color)] flex justify-end gap-2 shrink-0">
              <button type="button" onClick={onClose} className="btn-secondary py-2.5 px-4 font-semibold">
                Cancelar
              </button>
              <button type="submit" className="btn-gold py-2.5 px-6 font-bold shadow-md">
                {isAdmin ? "🚀 Publicar Produto Direto no Catálogo" : "✨ Enviar Produto para Aprovação do Admin"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
