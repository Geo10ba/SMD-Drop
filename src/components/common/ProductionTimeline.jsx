import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Circle, 
  AlertTriangle, 
  Sparkles, 
  Scissors, 
  CheckSquare, 
  Package, 
  Truck, 
  CheckCheck,
  CreditCard
} from 'lucide-react';
import { PRODUCTION_STAGES, normalizeProductionStatus, STAGE_ORDER } from '../../utils/productionCycle';

const STAGE_ICONS = {
  pagamento_confirmado: CreditCard,
  aguardando_producao: Clock,
  em_producao: Scissors,
  conferencia_qualidade: CheckSquare,
  aguardando_expedicao: Package,
  enviado: Truck,
  entregue: CheckCheck
};

export const ProductionTimeline = ({ status, timeline = [], compact = false }) => {
  const normCurrent = normalizeProductionStatus(status);
  const currentStageIndex = STAGE_ORDER.indexOf(normCurrent);

  return (
    <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 text-white space-y-4 shadow-lg">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-400" />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Esteira de Produção & Rastreabilidade Fabril
          </span>
        </div>
        <span className="text-[10px] font-mono bg-slate-800 text-amber-300 font-bold px-2 py-0.5 rounded border border-slate-600">
          Estágio {currentStageIndex + 1} de {PRODUCTION_STAGES.length}
        </span>
      </div>

      {/* Stepper Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {PRODUCTION_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const isUpcoming = idx > currentStageIndex;
          const Icon = STAGE_ICONS[stage.id] || Circle;

          // Find timestamp from timeline if exists
          const timelineEntry = Array.isArray(timeline) 
            ? timeline.slice().reverse().find(t => t.stage === stage.id) 
            : null;

          return (
            <div
              key={stage.id}
              className={`p-2.5 rounded-xl border text-center transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'border-amber-400 bg-amber-500/20 shadow-md ring-2 ring-amber-400/30'
                  : isCompleted
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-slate-800 bg-slate-950/60 opacity-50'
              }`}
            >
              {/* Step Number & Icon */}
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-black font-mono w-4 h-4 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-emerald-500 text-slate-950' : (isCurrent ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400')
                }`}>
                  {isCompleted ? '✓' : stage.stepNumber}
                </span>

                <Icon 
                  size={14} 
                  className={isCompleted ? 'text-emerald-400' : (isCurrent ? 'text-amber-400' : 'text-slate-500')} 
                />
              </div>

              {/* Stage Name */}
              <div className="my-auto">
                <span className={`block text-[11px] font-black leading-tight ${
                  isCurrent ? 'text-white' : (isCompleted ? 'text-emerald-300' : 'text-slate-400')
                }`}>
                  {stage.shortLabel}
                </span>
              </div>

              {/* Timestamp if reached */}
              <div className="mt-1.5 pt-1 border-t border-slate-800/80 text-[9px] font-mono truncate">
                {timelineEntry ? (
                  <span className="text-slate-400">
                    {new Date(timelineEntry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : isCurrent ? (
                  <span className="text-amber-300 font-bold">EM ANDAMENTO</span>
                ) : (
                  <span className="text-slate-600">AGUARDANDO</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Description of current stage */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-2 text-xs">
        <Clock size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-bold">
            Etapa Atual: {PRODUCTION_STAGES[currentStageIndex]?.label}
          </strong>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {PRODUCTION_STAGES[currentStageIndex]?.description}
          </p>
        </div>
      </div>
    </div>
  );
};
