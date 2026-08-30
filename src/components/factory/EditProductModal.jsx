import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Edit2, Tag, Image as ImageIcon, Save, Trash2, Sparkles, Eye } from 'lucide-react';

export const EditProductModal = ({ product, onClose }) => {
  const { updateProduct, deleteProduct, categories } = useStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [pricingType, setPricingType] = useState('fixed');

  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [suggestedRetailPrice, setSuggestedRetailPrice] = useState(0);
  const [factoryStock, setFactoryStock] = useState(0);

  const [pricePerM2, setPricePerM2] = useState(0);
  const [suggestedPricePerM2, setSuggestedPricePerM2] = useState(0);

  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    if (product) {
      setTitle(product.title || '');
      setCategory(product.category || categories[0]);
      setPricingType(product.pricingType || 'fixed');
      setWholesalePrice(product.wholesalePrice || 0);
      setSuggestedRetailPrice(product.suggestedRetailPrice || 0);
      setFactoryStock(product.factoryStock || 0);
      setPricePerM2(product.pricePerM2 || 0);
      setSuggestedPricePerM2(product.suggestedPricePerM2 || 0);
      setDescription(product.description || '');
      setImage(product.image || '');
    }
  }, [product]);

  if (!product) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProduct(product.id, {
      title,
      category,
      pricingType,
      wholesalePrice: Number(wholesalePrice),
      suggestedRetailPrice: Number(suggestedRetailPrice),
      factoryStock: Number(factoryStock),
      pricePerM2: Number(pricePerM2),
      suggestedPricePerM2: Number(suggestedPricePerM2),
      description,
      image
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${product.title}"?`)) {
      deleteProduct(product.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Edit2 size={22} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                PAINEL DO FABRICANTE • EDITAR PRODUTO
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                {product.title}
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field font-semibold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
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
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Descrição do Produto</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field leading-relaxed"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {pricingType === 'custom_m2' ? (
                <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 space-y-3">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                    <Sparkles size={13} /> Valores por Metro Quadrado (R$/m²)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)]">Custo Fábrica R$ / m²</label>
                      <input
                        type="number"
                        step="0.01"
                        value={pricePerM2}
                        onChange={(e) => setPricePerM2(e.target.value)}
                        className="input-field font-extrabold text-amber-500 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)]">Sugestão Revenda R$ / m²</label>
                      <input
                        type="number"
                        step="0.01"
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
                    <Tag size={13} /> Valores Fixos e Estoque Físico
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)]">Custo Atacado R$</label>
                      <input
                        type="number"
                        step="0.01"
                        value={wholesalePrice}
                        onChange={(e) => setWholesalePrice(e.target.value)}
                        className="input-field font-extrabold text-amber-500 mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)]">Sugestão Revenda R$</label>
                      <input
                        type="number"
                        step="0.01"
                        value={suggestedRetailPrice}
                        onChange={(e) => setSuggestedRetailPrice(e.target.value)}
                        className="input-field font-extrabold text-emerald-500 mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)]">Estoque (Un)</label>
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
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">URL da Imagem HD</label>
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
                    <span className="font-bold text-[var(--text-main)] block">Pré-Visualização da Imagem</span>
                    <span className="text-[var(--text-muted)]">Imagem pronta para exibição HD no catálogo.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-color)] flex justify-between items-center shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-500/10 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={15} /> Excluir Produto
            </button>

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary py-2.5 px-4 text-xs font-semibold">
                Cancelar
              </button>
              <button type="submit" className="btn-gold py-2.5 px-6 text-xs font-bold shadow-md">
                <Save size={15} /> Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
