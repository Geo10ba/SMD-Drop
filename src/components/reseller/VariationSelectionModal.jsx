import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../context/StoreContext';
import { ShoppingBag, Layers, Tag, Check, AlertCircle, X, ChevronRight } from 'lucide-react';

export const VariationSelectionModal = ({ product, onClose }) => {
  const { addToCart } = useStore();

  const variations = Array.isArray(product?.variations) ? product.variations : [];
  
  const [selectedVarIndex, setSelectedVarIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  const selectedVar = variations[selectedVarIndex] || {
    id: 'default',
    name: 'Padrão',
    price: product?.suggestedRetailPrice || 0,
    wholesalePrice: product?.wholesalePrice || 0,
    stock: product?.factoryStock || 100
  };

  const [customSellingPrice, setCustomSellingPrice] = useState(selectedVar.price || product?.suggestedRetailPrice || 0);

  if (!product) return null;

  const handleSelectVariation = (idx) => {
    setSelectedVarIndex(idx);
    const v = variations[idx];
    if (v) {
      setCustomSellingPrice(v.price || product.suggestedRetailPrice || 0);
    }
  };

  const handleAddToCart = () => {
    addToCart({
      ...product,
      id: `${product.id}-var-${selectedVar.id || selectedVarIndex}`,
      title: `${product.title} (${selectedVar.name})`,
      selectedVariation: selectedVar,
      variationName: selectedVar.name,
      wholesalePrice: selectedVar.wholesalePrice || product.wholesalePrice,
      suggestedRetailPrice: selectedVar.price || product.suggestedRetailPrice,
      customSellingPrice: Number(customSellingPrice) || selectedVar.price || product.suggestedRetailPrice,
      quantity: Number(quantity) || 1
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-lg w-full flex flex-col p-5 sm:p-6 shadow-2xl relative my-auto animate-none text-xs">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Layers size={22} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                SELEÇÃO DE VARIAÇÃO & MODELO
              </span>
              <h3 className="text-base font-bold text-[var(--text-main)] font-['Outfit'] line-clamp-1">
                {product.title}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {/* Product Preview Card */}
        <div className="flex items-center gap-3 p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-color)] mb-4">
          <img
            src={product.image || "https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80"}
            alt={product.title}
            className="w-14 h-14 rounded-lg object-cover border border-[var(--border-color)] shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-amber-500 uppercase">{product.category}</span>
            <p className="font-bold text-[var(--text-main)] truncate">{product.title}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Escolha a cor, tamanho ou modelo desejado abaixo ({variations.length} disponíveis).
            </p>
          </div>
        </div>

        {/* Variations List Dropdown & Grid */}
        <div className="space-y-3 mb-4">
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase">
            Escolha a Variação ({variations.length} modelos)
          </label>

          <select
            value={selectedVarIndex}
            onChange={(e) => handleSelectVariation(Number(e.target.value))}
            className="input-field font-semibold text-sm py-2.5"
          >
            {variations.map((v, idx) => (
              <option key={v.id || idx} value={idx}>
                {v.name} — Atacado: R$ {(v.wholesalePrice || 0).toFixed(2)} | Estoque: {v.stock || 0} un
              </option>
            ))}
          </select>

          {/* Selected Variation Highlight Details */}
          <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider">
                Variação Selecionada:
              </span>
              <span className="badge-emerald text-[10px] font-bold">
                Estoque: {selectedVar.stock || 100} peças
              </span>
            </div>
            
            <p className="font-bold text-sm text-[var(--text-main)]">
              {selectedVar.name}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-emerald-500/20">
              <div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Seu Custo Atacado:</span>
                <span className="font-extrabold text-amber-500 text-sm font-mono">
                  R$ {(selectedVar.wholesalePrice || product.wholesalePrice || 0).toFixed(2)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Preço de Venda ao Cliente:</span>
                <div className="relative mt-0.5">
                  <span className="absolute left-2 top-1 text-[10px] font-bold text-[var(--text-muted)]">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={customSellingPrice}
                    onChange={(e) => setCustomSellingPrice(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg py-1 pl-6 pr-2 font-extrabold text-emerald-500 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quantity and Actions */}
        <div className="pt-3 border-t border-[var(--border-color)] flex items-center gap-3">
          <div className="w-28">
            <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Quantidade</label>
            <input
              type="number"
              min="1"
              max={selectedVar.stock || 999}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="input-field py-1.5 text-center font-extrabold text-sm"
            />
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 btn-gold py-3 px-4 font-bold text-xs shadow-md flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} /> Adicionar Variação ao Carrinho
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
