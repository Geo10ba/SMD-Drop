import React, { useState } from 'react';
import { 
  Package, 
  Truck, 
  User, 
  MapPin, 
  Download, 
  FileText, 
  Save, 
  CheckCircle2, 
  Clock, 
  X, 
  Printer,
  FileUp,
  Tag
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PostalDeclarationModal } from './PostalDeclarationModal';

export const OrderDetailsModal = ({ order, onClose }) => {
  const { updateOrderStatus, showNotification } = useStore();
  const [trackingCode, setTrackingCode] = useState(order?.trackingCode || '');
  const [status, setStatus] = useState(order?.status || 'aguardando_impressao');
  const [isPostalModalOpen, setIsPostalModalOpen] = useState(false);

  if (!order) return null;

  const isMarketplace = order.dispatchMode === 'marketplace_label';
  const wholesaleTotal = Number(order.wholesaleTotal ?? order.total ?? 0) || 0;

  const handleSaveTrackingAndStatus = () => {
    updateOrderStatus(order.id, status, trackingCode.trim() || null);
    showNotification(`Status e código de rastreio do pedido ${order.id} salvos com sucesso!`, 'success');
    onClose();
  };

  const handleDownloadLabelPdf = () => {
    const labelFileName = order.labelPdf || `Etiqueta_${order.marketplace || 'Marketplace'}_${order.id}.pdf`;
    const dummyContent = `PDF ETIQUETA ENVIOS MARKETPLACE - PEDIDO ${order.id} - RASTREIO ${trackingCode || order.trackingCode || 'N/A'}`;
    const element = document.createElement("a");
    const file = new Blob([dummyContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = labelFileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification(`Etiqueta "${labelFileName}" baixada!`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Package size={22} />
              </div>
              <div>
                <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                  DETALHES COMPLETOS DO PEDIDO
                </span>
                <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit'] flex items-center gap-2">
                  Pedido <span className="font-mono text-amber-500">{order.id}</span>
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            {/* Top Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)] space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] flex items-center gap-1">
                  <User size={12} className="text-amber-500" /> Revendedor Responsável
                </span>
                <p className="font-extrabold text-[var(--text-main)] text-sm">{order.resellerName || 'Revendedor'}</p>
                <p className="text-[var(--text-muted)] font-mono text-[11px]">{order.resellerEmail || 'Sem email cadastrado'}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Criado em: {new Date(order.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)] space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] flex items-center gap-1">
                  <Truck size={12} className="text-amber-500" /> Modalidade de Envio
                </span>
                <div>
                  {isMarketplace ? (
                    <span className="badge-ml font-extrabold text-[11px]">
                      Etiqueta {order.marketplace || 'Marketplace'}
                    </span>
                  ) : (
                    <span className="badge-indigo font-extrabold text-[11px]">
                      Envio Direto Cego (Fábrica)
                    </span>
                  )}
                </div>
                <p className="text-[var(--text-muted)] text-[11px]">
                  Pagamento: <strong className="text-[var(--text-main)]">{order.paymentMethod || 'PIX Direto'}</strong>
                </p>
                <p className="text-[var(--text-muted)] text-[11px]">
                  Total Atacado: <strong className="text-emerald-500 font-mono font-extrabold text-sm">R$ {wholesaleTotal.toFixed(2)}</strong>
                </p>
              </div>
            </div>

            {/* Destination Address if Direct Shipping */}
            {!isMarketplace && order.customerData && (
              <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)] space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] flex items-center gap-1">
                  <MapPin size={12} className="text-amber-500" /> Destinatário Final (Envio Cego)
                </span>
                <p className="font-extrabold text-[var(--text-main)]">{order.customerData.name} {order.customerData.cpf ? `• CPF: ${order.customerData.cpf}` : ''}</p>
                <p className="text-[var(--text-muted)]">{order.customerData.address}</p>
                <p className="text-[var(--text-muted)]">
                  {order.customerData.city} - {order.customerData.state} • CEP: <span className="font-mono">{order.customerData.zip}</span>
                </p>
              </div>
            )}

            {/* Items in Order */}
            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-[var(--text-muted)] text-[11px]">
                Itens Fabricados / Separados ({(order.items || []).length})
              </h4>
              <div className="space-y-2">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-[var(--text-main)]">{item.title}</p>
                      {item.pricingType === 'custom_m2' && (
                        <p className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                          📐 {item.widthCm}cm x {item.heightCm}cm ({item.calculatedM2} m²) • {item.finishOption}
                        </p>
                      )}
                      <p className="text-[10px] text-[var(--text-muted)]">Qtd: {item.quantity || 1} unidade(s)</p>
                    </div>
                    <div className="font-mono font-extrabold text-right text-sm text-[var(--text-main)]">
                      R$ {(Number(item.unitWholesalePrice) || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Code and Status Controls */}
            <div className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-amber-500/30 space-y-3">
              <span className="text-[10px] font-extrabold uppercase text-amber-500 block">
                ⚡ Gestão de Rastreamento & Status da Fábrica
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
                    Código de Rastreamento
                  </label>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="Ex: ML-BR9821039 ou SS123456789BR"
                    className="input-field text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
                    Status do Pedido
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input-field text-xs font-bold"
                  >
                    <option value="aguardando_impressao">Aguardando Impressão</option>
                    <option value="em_producao">Em Produção / Corte</option>
                    <option value="despachado">Despachado / Coletado</option>
                    <option value="entregue">Entregue com Sucesso</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {isMarketplace && (
                <button
                  type="button"
                  onClick={handleDownloadLabelPdf}
                  className="btn-secondary text-xs font-bold py-2 px-3 flex items-center gap-1.5"
                >
                  <Download size={14} /> Baixar Etiqueta (PDF)
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPostalModalOpen(true)}
                className="btn-secondary text-xs font-bold py-2 px-3 flex items-center gap-1.5"
              >
                <FileText size={14} /> Declaração Correios
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs font-bold py-2 px-3"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTrackingAndStatus}
                className="btn-gold text-xs font-bold py-2 px-4 flex items-center gap-1.5 shadow-md"
              >
                <Save size={14} /> Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>

      {isPostalModalOpen && (
        <PostalDeclarationModal
          order={order}
          onClose={() => setIsPostalModalOpen(false)}
        />
      )}
    </>
  );
};
