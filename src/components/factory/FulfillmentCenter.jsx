import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PostalDeclarationModal } from './PostalDeclarationModal';
import { 
  Printer, 
  Download, 
  Truck, 
  CheckCircle2, 
  FileUp, 
  Package, 
  Ruler, 
  Clock, 
  Search,
  ExternalLink,
  ShieldCheck,
  Tag,
  FileText
} from 'lucide-react';

export const FulfillmentCenter = ({ onClose }) => {
  const { orders, updateOrderStatus, showNotification } = useStore();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'aguardando_impressao', 'em_producao', 'despachado'
  const [searchQuery, setSearchQuery] = useState('');
  const [printingOrderId, setPrintingOrderId] = useState(null);
  const [declarationOrder, setDeclarationOrder] = useState(null);

  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.resellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (order.trackingCode && order.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const handlePrintThermalLabel = (order) => {
    setPrintingOrderId(order.id);
    showNotification(`Etiqueta 10x15cm do pedido ${order.id} enviada para a impressora térmica!`);
    setTimeout(() => {
      setPrintingOrderId(null);
      if (order.status === 'aguardando_impressao') {
        updateOrderStatus(order.id, 'em_producao');
      }
    }, 1500);
  };

  const handleDownloadLabelPdf = (order) => {
    const labelFileName = order.labelPdf || `Etiqueta_${order.marketplace || 'Marketplace'}_${order.id}.pdf`;
    const dummyContent = `PDF ETIQUETA ENVIOS MARKETPLACE - PEDIDO ${order.id} - RASTREIO ${order.trackingCode}`;
    const element = document.createElement("a");
    const file = new Blob([dummyContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = labelFileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification(`Etiqueta "${labelFileName}" baixada com sucesso!`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
            MÓDULO DE FULFILLMENT & EXPEDIÇÃO DE FÁBRICA
          </span>
          <h2 className="text-2xl font-bold text-[var(--text-main)] font-['Outfit'] flex items-center gap-2">
            <Truck className="text-[#C59B27]" /> Central de Expedição da Fábrica
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por Pedido ou Revendedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2 text-xs w-64"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'Todos os Pedidos' },
          { id: 'aguardando_impressao', label: 'Aguardando Impressão' },
          { id: 'em_producao', label: 'Em Produção / Separação' },
          { id: 'despachado', label: 'Despachados' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-900 shadow-sm'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Order Cards List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="glass-panel p-12 text-center text-[var(--text-muted)] space-y-2">
            <Package size={40} className="mx-auto opacity-30" />
            <p className="text-sm font-semibold">Nenhum pedido encontrado nesta fila.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isMarketplace = order.dispatchMode === 'marketplace_label';

            return (
              <div
                key={order.id}
                className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-4 relative"
              >
                {/* Top Row: ID, Reseller, Badges */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-extrabold font-mono text-[var(--text-main)]">
                      {order.id}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">
                      Revendedor: <strong className="text-[var(--text-main)]">{order.resellerName}</strong>
                    </span>
                    <span className="text-[10px] text-[var(--text-light)] font-mono">
                      {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isMarketplace ? (
                      <span className={`px-2.5 py-1 rounded text-[11px] font-extrabold whitespace-nowrap ${
                        order.marketplace === 'Mercado Livre' ? 'badge-ml' :
                        order.marketplace === 'Shopee' ? 'badge-shopee' : 'badge-amazon'
                      }`}>
                        ETIQUETA {order.marketplace?.toUpperCase()}
                      </span>
                    ) : (
                      <span className="badge-indigo text-[11px] font-bold whitespace-nowrap">
                        ENVIO DIRETO CEGO (FÁBRICA)
                      </span>
                    )}

                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                      order.status === 'aguardando_impressao' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      order.status === 'em_producao' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {order.status === 'aguardando_impressao' ? 'Aguardando Impressão' :
                       order.status === 'em_producao' ? 'Em Produção / Embalagem' : 'Despachado / Coletado'}
                    </span>
                  </div>
                </div>

                {/* Items in Order */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Itens do Pedido ({order.items.length})
                    </h4>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)] text-xs space-y-1">
                        <div className="flex justify-between font-bold text-[var(--text-main)]">
                          <span>{item.title}</span>
                          <span className="font-mono">R$ {item.unitWholesalePrice.toFixed(2)}</span>
                        </div>
                        {item.pricingType === 'custom_m2' && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold space-y-0.5 pt-1">
                            <p>📐 Dimensões: {item.widthCm}cm x {item.heightCm}cm ({item.calculatedM2} m²)</p>
                            <p>🎨 Acabamento: {item.finishOption}</p>
                            {item.vectorFileName && (
                              <button
                                onClick={() => showNotification(`Download da logo/vetor "${item.vectorFileName}" para corte a laser!`)}
                                className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-bold hover:underline mt-1"
                              >
                                <Download size={11} /> Baixar Arte Logo: {item.vectorFileName}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Shipping / Label Details */}
                  <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)] text-xs space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {isMarketplace ? "Arquivo da Etiqueta Anexada pelo Revendedor" : "Dados de Entrega Direta"}
                    </h4>

                    {isMarketplace ? (
                      <div className="space-y-2 bg-[var(--bg-surface)] p-3 rounded-xl border border-amber-500/30">
                        <p className="text-[var(--text-main)] font-semibold flex items-center gap-1.5 truncate">
                          <FileUp size={16} className="text-amber-500 shrink-0" />
                          <span>Arquivo: <strong className="font-mono">{order.labelPdf || "Etiqueta_Marketplace.pdf"}</strong></span>
                        </p>
                        <button
                          onClick={() => handleDownloadLabelPdf(order)}
                          className="w-full btn-gold py-2 px-3 text-xs font-bold justify-center shadow"
                        >
                          <Download size={14} /> Baixar Arquivo da Etiqueta (PDF/ZPL)
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1 text-[var(--text-muted)]">
                        <p><strong className="text-[var(--text-main)]">{order.customerData?.name}</strong></p>
                        <p>{order.customerData?.address}</p>
                        <p>{order.customerData?.city} - {order.customerData?.state} ({order.customerData?.zip})</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[var(--border-color)] flex justify-between items-center text-xs">
                      <span>Rastreamento:</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {order.trackingCode || "Gerando..."}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions for Factory Staff */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-color)]">
                  <div className="text-xs">
                    <span className="text-[var(--text-muted)]">Fatura Atacado: </span>
                    <strong className="text-base text-[var(--text-main)] font-mono font-extrabold">
                      R$ {order.wholesaleTotal.toFixed(2)}
                    </strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Direct Download PDF Label Button */}
                    <button
                      onClick={() => handleDownloadLabelPdf(order)}
                      className="btn-gold text-xs font-bold py-2 px-3 shadow-sm"
                      title="Baixar PDF da Etiqueta"
                    >
                      <Download size={15} /> Baixar Etiqueta PDF
                    </button>

                    {/* Postal Declaration Button */}
                    <button
                      onClick={() => setDeclarationOrder(order)}
                      className="btn-secondary text-xs font-semibold py-2 px-3"
                      title="Imprimir Declaração de Conteúdo dos Correios"
                    >
                      <FileText size={15} /> Declaração
                    </button>

                    {/* Print Label Button */}
                    <button
                      onClick={() => handlePrintThermalLabel(order)}
                      disabled={printingOrderId === order.id}
                      className="btn-secondary text-xs font-bold py-2 px-3 bg-slate-900 text-white dark:bg-slate-800"
                    >
                      <Printer size={15} />
                      {printingOrderId === order.id ? "Imprimindo 10x15cm..." : "Simular Impressora Thermal"}
                    </button>

                    {/* Change Status Buttons */}
                    {order.status === 'em_producao' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'despachado')}
                        className="btn-primary text-xs font-bold py-2 px-3"
                      >
                        <CheckCircle2 size={15} /> Despachar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Postal Declaration Modal */}
      {declarationOrder && (
        <PostalDeclarationModal
          order={declarationOrder}
          onClose={() => setDeclarationOrder(null)}
        />
      )}
    </div>
  );
};
