import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PlusCircle, Ruler, Tag, Image as ImageIcon, Sparkles } from 'lucide-react';

export const NewProductModal = ({ isOpen, onClose }) => {
  const { addProduct, categories, addCategory } = useStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Geral');
  const [pricingType, setPricingType] = useState('fixed'); // 'fixed' or 'custom_m2'

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Fixed Price fields
  const [wholesalePrice, setWholesalePrice] = useState(50);
  const [suggestedRetailPrice, setSuggestedRetailPrice] = useState(120);
  const [factoryStock, setFactoryStock] = useState(100);

  // Custom m² fields
  const [pricePerM2, setPricePerM2] = useState(190);
  const [suggestedPricePerM2, setSuggestedPricePerM2] = useState(400);

  const [description, setDescription] = useState('');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;

    addProduct({
      title,
      category,
      pricingType,
      wholesalePrice: Number(wholesalePrice),
      suggestedRetailPrice: Number(suggestedRetailPrice),
      factoryStock: Number(factoryStock),
      pricePerM2: Number(pricePerM2),
      suggestedPricePerM2: Number(suggestedPricePerM2),
      minWidth: 20,
      maxWidth: 300,
      minHeight: 20,
      maxHeight: 200,
      leadTimeDays: pricingType === 'custom_m2' ? 3 : 1,
      description: description || "Produto fabricado com acabamento de alta qualidade.",
      image: image || "https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80",
      ncm: "3926.90.90",
      ean: "789981230" + Math.floor(100 + Math.random() * 900)
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header (Fixed Top) */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <PlusCircle size={22} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                CADASTRAR NOVO PRODUTO DE FÁBRICA
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                Novo Produto Fabricado
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {/* 2-Column Wide Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Título do Produto</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Logomarca 3D Acrílico Dourado"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field font-semibold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  {!isCreatingCategory ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase">Categoria</label>
                        <button
                          type="button"
                          onClick={() => setIsCreatingCategory(true)}
                          className="text-[10px] text-amber-500 font-bold hover:underline"
                        >
                          + Nova
                        </button>
                      </div>
                      <select
                        value={category}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setIsCreatingCategory(true);
                          } else {
                            setCategory(e.target.value);
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
                      <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Criar Categoria</label>
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
                              setCategory(created);
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
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Modelo de Precificação</label>
                  <select
                    value={pricingType}
                    onChange={(e) => setPricingType(e.target.value)}
                    className="input-field font-semibold"
                  >
                    <option value="fixed">Preço Fixo (Unidade)</option>
                    <option value="custom_m2">Sob Medida (R$/m²)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Descrição Técnica</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o material, espessura e acabamento..."
                  className="input-field leading-relaxed"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {pricingType === 'custom_m2' ? (
                <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 space-y-3">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                    <Sparkles size={13} /> Configuração da Precificação por Metro Quadrado (m²)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)]">Custo Fábrica R$ / m²</label>
                      <input
                        type="number"
                        value={pricePerM2}
                        onChange={(e) => setPricePerM2(e.target.value)}
                        className="input-field font-extrabold text-amber-500 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)]">Sugestão Revenda R$ / m²</label>
                      <input
                        type="number"
                        value={suggestedPricePerM2}
                        onChange={(e) => setSuggestedPricePerM2(e.target.value)}
                        className="input-field font-extrabold text-emerald-500 text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30 space-y-3">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                    <Tag size={13} /> Configuração de Preço Fixo e Estoque
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)]">Custo Atacado R$</label>
                      <input
                        type="number"
                        value={wholesalePrice}
                        onChange={(e) => setWholesalePrice(e.target.value)}
                        className="input-field font-extrabold text-amber-500 mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)]">Sugestão Revenda R$</label>
                      <input
                        type="number"
                        value={suggestedRetailPrice}
                        onChange={(e) => setSuggestedRetailPrice(e.target.value)}
                        className="input-field font-extrabold text-emerald-500 mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)]">Estoque Peças</label>
                      <input
                        type="number"
                        value={factoryStock}
                        onChange={(e) => setFactoryStock(e.target.value)}
                        className="input-field font-bold mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">URL da Foto em HD</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>

              {image && (
                <div className="flex items-center gap-3 p-2 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-color)]">
                  <img src={image} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-[var(--border-color)]" />
                  <div className="text-[11px]">
                    <span className="font-bold text-[var(--text-main)] block">Pré-Visualização da Foto HD</span>
                    <span className="text-[var(--text-muted)]">Pronta para exibição no catálogo da loja.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer (Fixed Bottom inside Form) */}
          <div className="pt-4 border-t border-[var(--border-color)] flex justify-end gap-2 shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary py-2.5 px-4 text-xs font-semibold">
              Cancelar
            </button>
            <button type="submit" className="btn-gold py-2.5 px-6 text-xs font-bold shadow-md">
              Salvar Produto no Catálogo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
