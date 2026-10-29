import React, { useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Printer, 
  Ruler, 
  Layers, 
  CheckSquare, 
  Clock, 
  ShieldCheck, 
  Package, 
  Truck, 
  QrCode, 
  Barcode, 
  AlertTriangle,
  Scissors,
  CheckCircle2,
  X
} from 'lucide-react';

export const ProductionOrderModal = ({ order, onClose }) => {
  const { companySettings, updateOrderStatus, showNotification } = useStore();
  const printRef = useRef(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
    if (order.status === 'aguardando_impressao' || order.status === 'pagamento_confirmado' || order.status === 'aguardando_producao') {
      updateOrderStatus(order.id, 'em_producao', null, 'Ficha OP impressa. Arquivo carregado na máquina de corte a laser.');
      showNotification(`Pedido ${order.id} movido para "Em Produção / Corte"!`);
    }
  };

  const items = Array.isArray(order.items) && order.items.length > 0 
    ? order.items 
    : [{
        title: order.title || 'Produto Personalizado Corte Laser',
        materialName: 'Acrílico Premium Espelhado',
        widthCm: 30,
        heightCm: 30,
        quantity: 1,
        finishOption: 'Fita Dupla Face 3M de Alta Fixação'
      }];

  const isMarketplace = order.dispatchMode === 'marketplace_label';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
      {/* Container */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Actions (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
              CHÃO DE FÁBRICA
            </span>
            <span className="text-sm font-bold font-['Outfit']">
              Ficha de Ordem de Produção (OP) • QR Code Único
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-gold text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 shadow-md"
            >
              <Printer size={15} /> Imprimir OP & Iniciar Produção
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Production Sheet Body */}
        <div ref={printRef} className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto bg-white text-slate-900 print:overflow-visible print:p-4 font-sans">
          
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight text-slate-950 font-['Outfit']">
                  SMD <span className="text-amber-600 font-light">DROP</span>
                </span>
                <span className="text-[10px] font-mono border border-slate-900 px-1.5 py-0.5 rounded font-bold uppercase">
                  FÁBRICA CORTE LASER
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 uppercase mt-1">
                ORDEM DE PRODUÇÃO Nº {order.id.replace('ORD-', 'OP-')}
              </h2>
              <p className="text-xs text-slate-600">
                {companySettings?.name || "SMD Drop Produtos Personalizados"} • CNPJ: {companySettings?.cnpj || "45.109.892/0001-99"}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="w-16 h-16 border-2 border-slate-900 p-1 bg-white shrink-0 flex items-center justify-center shadow-sm">
                <QrCode size={54} className="text-slate-950" />
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">BIPAGEM RÁPIDA</span>
                <span className="font-mono text-sm font-black text-slate-950 block">{order.id}</span>
                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-900 text-white rounded font-mono text-[10px] font-bold">
                  {order.status?.toUpperCase() || 'PAGO'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Revendedor / Loja</span>
              <strong className="text-slate-900 block truncate">{order.resellerName}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Canal de Despacho</span>
              <strong className="text-slate-900 block font-mono">
                {isMarketplace ? (order.marketplace || 'Marketplace') : 'Envio Cego Neutro'}
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Rastreamento</span>
              <strong className="text-amber-700 block font-mono">
                {order.trackingCode || "Aguardando Postagem"}
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Prazo de Expedição</span>
              <strong className="text-slate-900 block font-mono">24h a 48h Úteis</strong>
            </div>
          </div>

          {/* Technical Specifications of Items */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Scissors size={14} className="text-amber-600" /> Especificações Técnicas de Corte e Montagem
            </h4>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-200/80 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                    <th className="py-2.5 px-3">Item / Peça</th>
                    <th className="py-2.5 px-3">Matéria-Prima & Estilo</th>
                    <th className="py-2.5 px-3 text-center">Medidas (cm)</th>
                    <th className="py-2.5 px-3 text-center">Área (m²)</th>
                    <th className="py-2.5 px-2 text-center">Qtd</th>
                    <th className="py-2.5 px-3">Acabamento Solicitado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((it, idx) => {
                    const width = it.widthCm || it.productLengthCm || 30;
                    const height = it.heightCm || it.productWidthCm || 30;
                    const calculatedM2 = ((width * height) / 10000).toFixed(3);
                    const material = it.materialName || it.material || 'Acrílico Premium Espelhado Dourado';
                    const finish = it.finishOption || 'Fita Dupla Face 3M instalada + Película Protetora';

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <strong className="text-slate-900 block">{it.title}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">Ref: {it.id || `ITEM-${idx+1}`}</span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {material}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                          {width} x {height} cm
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {calculatedM2} m²
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                          {it.quantity || 1}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                          <div>{finish}</div>
                          {it.vectorPerimeterMeters && (
                            <span className="inline-block mt-1 font-mono text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 font-bold">
                              ⚡ Corte: {it.vectorPerimeterMeters} m (~{it.estimatedLaserMinutes || 3} min laser)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Machine & Production Notes */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
            <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px] uppercase">
              <AlertTriangle size={13} className="text-amber-700" /> Instruções Obrigatórias para a Máquina Laser:
            </span>
            <ul className="list-disc list-inside text-amber-950 text-[11px] space-y-0.5">
              <li>Não remover a película protetora espelhada antes do corte para não riscar o material nobre.</li>
              <li>Manter assistência de ar ligada no corte a laser para evitar marcas de fumaça e queima.</li>
              <li>Em produtos com acrílico espelhado, realizar o corte pelo verso invertido se o arquivo exigir.</li>
            </ul>
          </div>

          {/* Quality Control & Operator Signatures */}
          <div className="border border-slate-300 rounded-xl p-4 space-y-3">
            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
              Checklist de Liberação de Qualidade (Chão de Fábrica):
            </h5>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                "Vetor e Escala Conferidos",
                "Espessura da Chapa Calibrada",
                "Corte Laser Executado sem Queimaduras",
                "Bordas Polidas / Limpeza",
                "Gabarito e Medidas Conferidas",
                "Embalado com Plástico Bolha e Cantoneiras"
              ].map((step, sIdx) => (
                <label key={sIdx} className="flex items-center gap-2 text-slate-700 text-[11px]">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-400 text-amber-600" />
                  <span>{step}</span>
                </label>
              ))}
            </div>

            {/* Signature Lines */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-center text-xs">
              <div>
                <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
                <span className="text-[10px] text-slate-600 block uppercase font-bold">Operador do Laser</span>
              </div>
              <div>
                <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
                <span className="text-[10px] text-slate-600 block uppercase font-bold">Conferência & Embalagem</span>
              </div>
            </div>
          </div>

          {/* Bottom Barcode / Reference Identification */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-slate-500 text-[10px]">
            <span>ID do Pedido: <strong className="font-mono text-slate-900">{order.id}</strong></span>
            <span className="font-mono tracking-widest text-slate-700 font-bold">
              * {order.id} *
            </span>
            <span>Sistema SMD Drop • Plataforma Fabril</span>
          </div>

        </div>
      </div>
    </div>
  );
};
