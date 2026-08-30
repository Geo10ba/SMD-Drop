import React, { useState } from 'react';
import { Truck, CheckCircle2, Clock, PackageCheck, MapPin, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const TrackingModal = ({ isOpen, onClose, initialTrackingCode = '' }) => {
  const { orders } = useStore();
  const [searchCode, setSearchCode] = useState(initialTrackingCode || 'ML-BR9821039');

  if (!isOpen) return null;

  // Find matching order or simulate tracking data
  const matchedOrder = orders.find((o) => o.trackingCode?.toLowerCase() === searchCode.toLowerCase() || o.id.toLowerCase() === searchCode.toLowerCase());

  const trackingSteps = [
    {
      title: "Pedido Recebido na Fábrica",
      description: "Pagamento do custo de atacado confirmado e fila de expedição iniciada.",
      time: "28/08/2026 14:30",
      completed: true
    },
    {
      title: "Etiqueta Impressa & Separação de Material",
      description: matchedOrder?.dispatchMode === 'marketplace_label' ? `Etiqueta ${matchedOrder.marketplace} impressa no formato térmico 10x15cm.` : "Conferência de embalagem neutra de envio direto.",
      time: "28/08/2026 16:10",
      completed: true
    },
    {
      title: "Corte a Laser / Produção Sob Medida",
      description: "Verificação dimensional e embalagem de proteção contra impactos.",
      time: "29/08/2026 09:00",
      completed: matchedOrder ? matchedOrder.status !== 'aguardando_impressao' : true
    },
    {
      title: "Despachado no Ponto de Coleta / Correios",
      description: "Pacote coletado e em trânsito para a entrega final.",
      time: "29/08/2026 11:45",
      completed: matchedOrder ? matchedOrder.status === 'despachado' || matchedOrder.status === 'entregue' : false
    },
    {
      title: "Entregue ao Destinatário Final",
      description: "Entregue com sucesso no endereço cadastrado.",
      time: "Em andamento",
      completed: matchedOrder ? matchedOrder.status === 'entregue' : false
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-fade-in my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Truck size={22} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                RASTREAMENTO DE DESPACHO AO VIVO
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                Rastrear Pedido de Fábrica
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="space-y-6">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Digite o código de rastreio ou número do pedido..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="input-field pl-10 pr-24 py-2.5 font-mono font-bold text-xs"
            />
            <button className="absolute right-2 top-2 btn-gold text-xs font-bold py-1 px-3">
              Buscar
            </button>
          </div>

          {/* Timeline Steps */}
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[var(--border-color)]">
            {trackingSteps.map((step, idx) => (
              <div key={idx} className="relative flex items-start gap-4 pl-8">
                <div className={`absolute left-0 top-0.5 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow ${
                  step.completed
                    ? 'bg-amber-500 text-slate-900 border-2 border-amber-400'
                    : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] border border-[var(--border-color)]'
                }`}>
                  {step.completed ? <CheckCircle2 size={16} /> : idx + 1}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold ${step.completed ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                      {step.title}
                    </h4>
                    <span className="text-[10px] text-[var(--text-light)] font-mono">{step.time}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)] text-xs space-y-1 flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Código de Rastreamento:</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
              {searchCode || "ML-BR9821039"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
