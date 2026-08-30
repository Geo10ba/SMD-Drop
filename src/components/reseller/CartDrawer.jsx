import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ShoppingBag, Trash2, ArrowRight, Ruler, FileText, CheckCircle2 } from 'lucide-react';

export const CartDrawer = ({ isOpen, onClose, onProceedToCheckout }) => {
  const { cart, removeFromCart } = useStore();

  if (!isOpen) return null;

  const totalWholesaleCost = cart.reduce((acc, item) => acc + (item.unitWholesalePrice * item.quantity), 0);
  const totalSuggestedRetail = cart.reduce((acc, item) => acc + (item.suggestedRetailPrice * item.quantity), 0);
  const totalEstimatedProfit = totalSuggestedRetail - totalWholesaleCost;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[var(--bg-surface)] border-l border-[var(--border-color)] shadow-2xl flex flex-col justify-between animate-fade-in">
          {/* Header */}
          <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit']">
                  Carrinho de Dropshipping
                </h3>
                <span className="text-xs text-[var(--text-muted)]">
                  {cart.length} {cart.length === 1 ? 'item selecionado' : 'itens selecionados'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1"
            >
              ✕
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <ShoppingBag size={48} className="mx-auto text-[var(--text-muted)] opacity-40" />
                <p className="text-sm font-semibold text-[var(--text-muted)]">
                  Seu carrinho de dropshipping está vazio.
                </p>
                <p className="text-xs text-[var(--text-light)]">
                  Navegue pelo catálogo e adicione produtos fixos ou sob medida (m²).
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const isM2 = item.pricingType === 'custom_m2';

                return (
                  <div
                    key={item.cartId}
                    className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-hover)] space-y-3 relative group"
                  >
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-red-500 transition-colors p-1"
                      title="Remover item"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex items-start gap-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-14 h-14 rounded-lg object-cover border border-[var(--border-color)] shrink-0"
                      />
                      <div className="pr-6">
                        <h4 className="text-xs font-bold text-[var(--text-main)] line-clamp-2">
                          {item.title}
                        </h4>
                        {isM2 ? (
                          <div className="mt-1 space-y-0.5">
                            <span className="badge-gold text-[9px] px-1.5 py-0.2">
                              {item.widthCm}cm x {item.heightCm}cm ({item.calculatedM2} m²)
                            </span>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              Acabamento: {item.finishOption}
                            </p>
                            {item.vectorFileName && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <FileText size={11} /> Vetor: {item.vectorFileName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="badge-emerald text-[9px] px-1.5 py-0.2 mt-1 inline-block">
                            Preço Fixo de Tabela
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-xs">
                      <span className="text-[var(--text-muted)]">Custo Atacado Fábrica:</span>
                      <span className="font-extrabold text-[var(--text-main)] font-['Outfit']">
                        R$ {(item.unitWholesalePrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary & Action */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-surface)] space-y-4 shadow-lg">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Custo Total na Fábrica:</span>
                  <span className="font-bold text-[var(--text-main)] text-sm font-['Outfit']">
                    R$ {totalWholesaleCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 p-2 rounded-lg">
                  <span>Lucro Estimado para Você:</span>
                  <span>+ R$ {totalEstimatedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full btn-gold py-3 justify-center text-sm font-bold shadow-lg"
              >
                Avançar para Envio de Pedido <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
