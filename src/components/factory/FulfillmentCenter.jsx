import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PostalDeclarationModal } from './PostalDeclarationModal';
import { ProductionOrderModal } from './ProductionOrderModal';
import { FiscalResolutionModal } from './FiscalResolutionModal';
import { LabelPreviewModal } from './LabelPreviewModal';
import { ProductionTimeline } from '../common/ProductionTimeline';
import { 
  PRODUCTION_STAGES, 
  normalizeProductionStatus, 
  getNextProductionStage, 
  getPrevProductionStage, 
  getStageInfo 
} from '../../utils/productionCycle';
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
  FileText, 
  Scissors, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Barcode,
  CheckCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const FulfillmentCenter = ({ onClose }) => {
  const { 
    orders, 
    updateOrderStatus, 
    advanceProductionStage, 
    rollbackProductionStage, 
    showNotification 
  } = useStore();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scannerInput, setScannerInput] = useState('');
  const [printingOrderId, setPrintingOrderId] = useState(null);
  const [declarationOrder, setDeclarationOrder] = useState(null);
  const [productionOrder, setProductionOrder] = useState(null);
  const [fiscalOrderToResolve, setFiscalOrderToResolve] = useState(null);
  const [labelPreviewOrder, setLabelPreviewOrder] = useState(null);

  const handleScanSubmit = (e) => {
    e.preventDefault();
    const cleanCode = scannerInput.trim();
    if (!cleanCode) return;

    const found = orders.find(o => 
      o.id.toLowerCase() === cleanCode.toLowerCase() ||
      o.id.replace('ORD-', '').toLowerCase() === cleanCode.replace(/^(ORD-|OP-)/i, '').toLowerCase() ||
      (o.trackingCode && o.trackingCode.toLowerCase() === cleanCode.toLowerCase())
    );

    if (found) {
      advanceProductionStage(found.id, 'Avanço por bipagem de código óptico/QR Code');
      setScannerInput('');
    } else {
      showNotification(`Código ou pedido "${cleanCode}" não localizado na fila.`, 'error');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const norm = normalizeProductionStatus(order.status);
    const matchesTab = activeTab === 'all' || norm === activeTab;
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

      {/* Terminal de Bipagem Rápida por Código de Barras / QR Code */}
      <div className="bg-slate-900 border-2 border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Barcode size={22} />
          </div>
          <div>
            <span className="text-xs font-black uppercase text-amber-300 block tracking-wider">
              Terminal de Bipagem Rápida (Chão de Fábrica)
            </span>
            <span className="text-[11px] text-slate-300">
              Aponte o leitor óptico para o QR Code da OP ou digite o ID do pedido para avançar automaticamente o estágio na esteira.
            </span>
          </div>
        </div>

        <form onSubmit={handleScanSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Barcode size={16} className="absolute left-3 top-3 text-amber-400" />
            <input
              type="text"
              placeholder="Bipar QR Code (Ex: ORD-1234)..."
              value={scannerInput}
              onChange={(e) => setScannerInput(e.target.value)}
              className="input-field pl-9 text-xs font-mono font-bold bg-slate-950 border-amber-500/50 text-white placeholder-slate-500 py-2.5 w-full focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button type="submit" className="btn-gold py-2.5 px-5 text-xs font-black shrink-0 shadow-md">
            Bipar
          </button>
        </form>
      </div>

      {/* Tabs por Estágio Canônico (7 Fases) */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <span>Todos</span>
          <span className="bg-slate-950/20 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            {orders.length}
          </span>
        </button>

        {PRODUCTION_STAGES.map((st) => {
          const count = orders.filter(o => normalizeProductionStatus(o.status) === st.id).length;
          return (
            <button
              key={st.id}
              onClick={() => setActiveTab(st.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === st.id
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>{st.shortLabel}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                  activeTab === st.id ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
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

                    {/* Canonical Production Stage Badge */}
                    {(() => {
                      const stage = getStageInfo(order.status);
                      return (
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${stage.badgeClass}`}>
                          <span>{stage.icon}</span>
                          <span>{stage.shortLabel}</span>
                        </span>
                      );
                    })()}

                    {/* Fiscal Status Badge */}
                    {order.fiscalData && !order.fiscalData.isFiscalComplete ? (
                      <button
                        onClick={() => setFiscalOrderToResolve(order)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1 transition-all"
                        title="Clique para regularizar requisitos fiscais"
                      >
                        <Lock size={12} className="text-rose-400" /> BLOQUEIO FISCAL
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck size={12} className="text-emerald-400" /> FISCAL OK
                      </span>
                    )}
                  </div>
                </div>

                {/* Fiscal Lock Alert Banner */}
                {order.fiscalData && !order.fiscalData.isFiscalComplete && (
                  <div className="bg-rose-500/15 border-2 border-rose-500/40 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Expedição Travada: Não Conformidade Fiscal (Venda à Ordem)</strong>
                        <span className="text-[11px] text-rose-300">{order.fiscalData.missingReasons?.join(' • ') || 'Requisitos fiscais pendentes'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setFiscalOrderToResolve(order)}
                      className="btn-gold py-1.5 px-3 text-xs font-black shrink-0 shadow flex items-center gap-1"
                    >
                      <Unlock size={13} /> Regularizar Fiscal
                    </button>
                  </div>
                )}

                {/* Production Cycle Timeline Visualizer */}
                <div className="bg-[var(--bg-surface-hover)]/70 p-3 rounded-xl border border-[var(--border-color)]">
                  <ProductionTimeline status={order.status} timeline={order.timeline || []} />
                </div>

                {/* Items in Order */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Itens do Pedido ({(order.items || []).length})
                    </h4>
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)] text-xs space-y-1">
                        <div className="flex justify-between font-bold text-[var(--text-main)]">
                          <span>{item.title}</span>
                          <span className="font-mono">R$ {(Number(item.unitWholesalePrice) || 0).toFixed(2)}</span>
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
                      R$ {(Number(order.wholesaleTotal) || 0).toFixed(2)}
                    </strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Laser Cutting Production Order (OP) Button */}
                    <button
                      onClick={() => setProductionOrder(order)}
                      className="btn-secondary text-xs font-bold py-2 px-3 border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5 shadow-sm"
                      title="Ficha Técnica de Ordem de Produção (OP) para Operador de Laser"
                    >
                      <Scissors size={14} className="text-amber-500" /> OP Laser
                    </button>

                    {/* Postal Declaration Button */}
                    <button
                      onClick={() => setDeclarationOrder(order)}
                      className="btn-secondary text-xs font-semibold py-2 px-3"
                      title="Imprimir Declaração de Conteúdo dos Correios"
                    >
                      <FileText size={15} /> Declaração
                    </button>

                    {/* Preview Blind Thermal Label & Canguru Button */}
                    <button
                      onClick={() => setLabelPreviewOrder(order)}
                      className="btn-secondary text-xs font-bold py-2 px-3 border border-amber-500/40 text-amber-500 hover:bg-amber-500/10 flex items-center gap-1.5 shadow-sm"
                      title="Visualizar Etiqueta Térmica 10x15cm, Envelope Canguru e Checklist Cego"
                    >
                      <Barcode size={15} /> Etiqueta 10x15 (Cega)
                    </button>

                    {/* Print Label Button */}
                    <button
                      onClick={() => handlePrintThermalLabel(order)}
                      disabled={printingOrderId === order.id}
                      className="btn-secondary text-xs font-bold py-2 px-3 bg-slate-900 text-white dark:bg-slate-800"
                    >
                      <Printer size={15} />
                      {printingOrderId === order.id ? "Imprimindo 10x15cm..." : "Imprimir Etiqueta Térmica"}
                    </button>

                    {/* Sequential Production Advance Button with QC and Fiscal Lock */}
                    {(() => {
                      const normStatus = normalizeProductionStatus(order.status);
                      const nextStage = getNextProductionStage(normStatus);

                      return (
                        <div className="flex items-center gap-2">
                          {/* Rollback QC Button if in Quality Check */}
                          {normStatus === 'conferencia_qualidade' && (
                            <button
                              onClick={() => rollbackProductionStage(order.id, 'Reprovado no teste de qualidade/esquadro. Retornado para retrabalho.')}
                              className="px-3 py-2 text-xs font-black rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1 transition-all shadow-sm"
                              title="Reprovar inspeção e devolver para a produção"
                            >
                              <RotateCcw size={14} className="text-rose-400" /> Reprovar QC
                            </button>
                          )}

                          {/* Advance Button */}
                          {nextStage ? (
                            <button
                              onClick={() => {
                                if (nextStage.id === 'enviado' && order.fiscalData && !order.fiscalData.isFiscalComplete) {
                                  setFiscalOrderToResolve(order);
                                } else {
                                  advanceProductionStage(order.id);
                                }
                              }}
                              className={`text-xs font-black py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md ${
                                nextStage.id === 'enviado' && order.fiscalData && !order.fiscalData.isFiscalComplete
                                  ? 'bg-rose-950/80 text-rose-300 border-2 border-rose-500 hover:bg-rose-900/90 cursor-pointer animate-pulse'
                                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black'
                              }`}
                              title={
                                nextStage.id === 'enviado' && order.fiscalData && !order.fiscalData.isFiscalComplete
                                  ? "Expedição bloqueada por falta de conformidade fiscal. Clique para regularizar!"
                                  : `Avançar para: ${nextStage.label}`
                              }
                            >
                              {nextStage.id === 'enviado' && order.fiscalData && !order.fiscalData.isFiscalComplete ? (
                                <>
                                  <Lock size={14} className="text-rose-400" /> Trava Fiscal: Resolver
                                </>
                              ) : (
                                <>
                                  <CheckCheck size={15} /> Avançar: {nextStage.shortLabel}
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle2 size={14} className="text-emerald-400" /> Ciclo Concluído
                            </span>
                          )}
                        </div>
                      );
                    })()}
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

      {/* Production Order Technical Sheet Modal */}
      {productionOrder && (
        <ProductionOrderModal
          order={productionOrder}
          onClose={() => setProductionOrder(null)}
        />
      )}

      {/* Fiscal Resolution & Dispatch Unlock Modal */}
      {fiscalOrderToResolve && (
        <FiscalResolutionModal
          order={fiscalOrderToResolve}
          onClose={() => setFiscalOrderToResolve(null)}
        />
      )}

      {/* Blind Shipping Thermal Label & Canguru Pouch Preview Modal */}
      {labelPreviewOrder && (
        <LabelPreviewModal
          order={labelPreviewOrder}
          onClose={() => setLabelPreviewOrder(null)}
        />
      )}
    </div>
  );
};
