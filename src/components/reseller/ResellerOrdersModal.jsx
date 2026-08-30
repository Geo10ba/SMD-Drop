import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PackageCheck, Truck, Clock, FileText, CheckCircle2, Search, ExternalLink } from 'lucide-react';
import { TrackingModal } from '../TrackingModal';

export const ResellerOrdersModal = ({ isOpen, onClose }) => {
  const { orders } = useStore();
  const [selectedTrackingCode, setSelectedTrackingCode] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <PackageCheck size={22} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                HISTÓRICO DE VENDAS & EXPEDIÇÃO FÁBRICA
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                Meus Pedidos de Revenda
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {/* Orders Grid (No Scroll) */}
        <div className="flex-1 overflow-y-auto pr-1">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <PackageCheck size={40} className="mx-auto opacity-30 mb-2" />
              <p className="text-sm font-semibold">Você ainda não possui pedidos enviados para a fábrica.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => {
                const isMarketplace = order.dispatchMode === 'marketplace_label';

                return (
                  <div
                    key={order.id}
                    className="bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-amber-500/40 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 text-xs">
                        <div className="flex items-center gap-2 font-mono font-bold text-[var(--text-main)]">
                          <span className="text-amber-500">{order.id}</span>
                          <span className="text-[10px] font-sans text-[var(--text-muted)] font-normal">
                            • {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isMarketplace ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              order.marketplace === 'Mercado Livre' ? 'badge-ml' : 'badge-shopee'
                            }`}>
                              {order.marketplace}
                            </span>
                          ) : (
                            <span className="badge-indigo text-[10px]">Envio Direto</span>
                          )}

                          <span className="badge-gold text-[10px]">
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[var(--text-main)] font-medium">
                            <span className="truncate pr-2">• {item.title} {item.pricingType === 'custom_m2' ? `(${item.widthCm}x${item.heightCm}cm)` : ''}</span>
                            <span className="font-mono font-bold shrink-0">R$ {item.unitWholesalePrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="flex justify-between items-center pt-2 border-t border-[var(--border-color)] text-xs mt-2">
                      <span className="text-[var(--text-muted)] text-[11px]">
                        Custo Atacado: <strong className="text-amber-500 font-mono">R$ {order.wholesaleTotal.toFixed(2)}</strong>
                      </span>

                      <button
                        onClick={() => setSelectedTrackingCode(order.trackingCode || order.id)}
                        className="btn-gold text-[11px] font-bold py-1.5 px-3 flex items-center gap-1 shadow-sm"
                      >
                        <Truck size={13} /> Rastrear ({order.trackingCode || "Ativo"})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tracking Modal Sub-level */}
        {selectedTrackingCode && (
          <TrackingModal
            isOpen={!!selectedTrackingCode}
            onClose={() => setSelectedTrackingCode(null)}
            initialTrackingCode={selectedTrackingCode}
          />
        )}
      </div>
    </div>
  );
};
