import React from 'react';
import { Printer, QrCode, Barcode, PackageCheck, FileText } from 'lucide-react';

export const LabelPreviewModal = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrintLabel = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8 font-sans">
        {/* Actions Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-amber-600" />
            <h3 className="text-sm font-bold">Visualizador de Etiqueta Térmica (10x15cm)</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 font-bold">
            ✕
          </button>
        </div>

        {/* Thermal Label Format 10x15cm */}
        <div className="border-2 border-slate-900 p-4 rounded bg-white text-slate-900 space-y-3 font-mono text-[11px] shadow-sm">
          {/* Marketplace Header */}
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2">
            <div className="font-extrabold text-sm uppercase tracking-wider">
              {order.dispatchMode === 'marketplace_label' ? (order.marketplace || 'MERCADO ENVIOS') : 'CORREIOS SEDEX'}
            </div>
            <div className="text-[10px] font-bold border border-slate-900 px-1.5 py-0.5 rounded">
              CONTRATO 99123801
            </div>
          </div>

          {/* Barcode Simulator */}
          <div className="text-center py-2 border-b-2 border-slate-900 space-y-1">
            <svg viewBox="0 0 200 40" className="w-full h-12">
              <rect width="200" height="40" fill="#ffffff" />
              {[10, 14, 20, 24, 30, 36, 40, 48, 54, 60, 68, 72, 80, 86, 92, 100, 108, 114, 120, 128, 134, 142, 150, 158, 166, 172, 180, 188].map((x, i) => (
                <rect key={i} x={x} y="0" width={i % 2 === 0 ? 3 : 1.5} height="40" fill="#000000" />
              ))}
            </svg>
            <span className="text-[10px] font-mono font-bold tracking-widest block">
              *{order.trackingCode || "ML-BR9821039"}*
            </span>
          </div>

          {/* Destination Address */}
          <div className="border-b-2 border-slate-900 pb-2 space-y-0.5">
            <span className="font-extrabold uppercase text-[10px] block text-slate-500">DESTINATÁRIO:</span>
            <p className="font-extrabold text-xs">{order.customerData?.name || "Cliente Final"}</p>
            <p>{order.customerData?.address || "Rua Exemplo, 100, Apto 10"}</p>
            <p className="font-bold">{order.customerData?.city || "São Paulo"} - {order.customerData?.state || "SP"}</p>
            <p className="font-mono font-bold text-xs mt-1">CEP: {order.customerData?.zip || "01000-000"}</p>
          </div>

          {/* Remetente Cego */}
          <div className="pt-1 text-[9px] text-slate-600 flex justify-between items-center">
            <div>
              <span className="font-bold block">REMETENTE:</span>
              <p>{order.resellerName || "Loja Autorizada"}</p>
            </div>
            <div className="w-8 h-8">
              <svg viewBox="0 0 50 50" className="w-full h-full">
                <rect width="50" height="50" fill="#000000" />
                <rect x="5" y="5" width="40" height="40" fill="#ffffff" />
                <rect x="15" y="15" width="20" height="20" fill="#000000" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center print:hidden">
          <span className="text-xs text-slate-500 font-medium">Padrão 100mm x 150mm</span>
          <button onClick={handlePrintLabel} className="btn-gold py-2 px-6 text-xs font-bold shadow-md">
            <Printer size={15} /> Imprimir na Térmica
          </button>
        </div>
      </div>
    </div>
  );
};
