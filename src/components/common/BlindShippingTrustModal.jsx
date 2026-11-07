import React from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldCheck, 
  Package, 
  Truck, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  Sparkles,
  RefreshCw,
  Building2
} from 'lucide-react';

export const BlindShippingTrustModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-auto text-white space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <ShieldCheck size={26} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
              POLÍTICA OFICIAL SMD DROP • PADRÃO INDUSTRIAL B2B
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-['Outfit'] text-white">
              Garantia Anti-Quebra & Envio 100% Cego
            </h2>
          </div>
        </div>

        {/* 3 Pilares Principais */}
        <div className="space-y-4">
          {/* Pilar 1: Anti-Quebra */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Package size={18} />
              <span>1. Embalagem Anti-Impacto com Cantoneiras & Refabricação Prioritária</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sabemos que acrílico espelhado e neon LED são peças nobres. Por isso, cada pedido é embalado com <strong>película protetora anti-risco</strong>, <strong>plástico bolha triplo de alta gramatura</strong> e <strong>cantoneiras rígidas de proteção</strong> em caixas de onda dupla.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-amber-400" />
              <span><strong>Compromisso SMD:</strong> Se a transportadora quebrar a peça no trajeto, basta o revendedor enviar foto da caixa e a fábrica refabrica a peça com <strong>prioridade máxima</strong> sem custo adicional de corte!</span>
            </div>
          </div>

          {/* Pilar 2: Envio Cego (Blind Shipping) */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Truck size={18} />
              <span>2. Envio 100% Cego e Neutro (Blind Shipping)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sua marca é o seu maior patrimônio. Despachamos em caixas 100% neutras sem logotipo, fita personalizada ou menção à fábrica SMD Drop.
            </p>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>O remetente na etiqueta de envio é <strong>sempre o nome da sua loja</strong>.</li>
              <li>A nota fiscal ou declaração de conteúdo vai dobrada no envelope plástico canguru externo.</li>
              <li>O seu cliente final nunca saberá que o produto foi despachado direto da fábrica.</li>
            </ul>
          </div>

          {/* Pilar 3: Segurança Fiscal */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <FileCheck size={18} />
              <span>3. Enquadramento Fiscal Legítimo (Venda à Ordem)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Operação amparada pelo <strong>Art. 40 do Convênio SINIEF S/N 1970</strong> (Remessa por Conta e Ordem de Terceiros).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">Revendedores MEI:</strong>
                Isentos de emissão de NF-e para pessoa física. Acompanha Declaração de Conteúdo em seu nome.
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">Simples / ME / EPP:</strong>
                Basta anexar a chave de 44 dígitos da NF-e emitida pela sua empresa para o consumidor final.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="btn-gold text-xs font-black py-2.5 px-6 rounded-xl shadow-lg"
          >
            Entendido, Fechar Garantia
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
