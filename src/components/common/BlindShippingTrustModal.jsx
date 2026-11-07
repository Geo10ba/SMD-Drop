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
  HelpCircle,
  Building2,
  ExternalLink
} from 'lucide-react';

export const BlindShippingTrustModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
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
              POLÍTICA OFICIAL SMD DROP • PADRÃO MARKETPLACE (SHOPEE & MERCADO LIVRE)
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-['Outfit'] text-white">
              Política de Avarias de Transporte, Devoluções & Garantia
            </h2>
          </div>
        </div>

        {/* Corpo Explicativo */}
        <div className="space-y-4">
          {/* Pilar 1: Seguro do Marketplace (Quem resolve avaria) */}
          <div className="bg-slate-950/90 border border-amber-500/30 p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Truck size={18} />
              <span>1. Item Quebrado no Transporte: Cobertura pelo Seguro do Marketplace</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nas vendas com etiqueta da <strong>Shopee Envios</strong> ou <strong>Mercado Envios</strong>, quem contrata e gerencia a logística é o próprio marketplace. Todas as etiquetas possuem <strong>Seguro de Transporte Integrado</strong> contra danos e avarias dos Correios/transportadoras.
            </p>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-2 text-xs">
              <span className="font-extrabold text-amber-300 block text-xs">📋 Como o revendedor procede se o cliente final reclamar de peça danificada:</span>
              <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                <li>O cliente final abre a solicitação de devolução/reembolso no marketplace anexando fotos da caixa amassada e da peça quebrada (motivo: <em>"Item danificado durante o transporte"</em>).</li>
                <li>A <strong>Shopee ou Mercado Livre</strong> analisa as imagens e constata a avaria ocorrida durante o trajeto logístico.</li>
                <li>O marketplace <strong>reembolsa o comprador</strong> e, ao mesmo tempo, <strong>libera o dinheiro integral da venda para o lojista/revendedor</strong> através do Seguro de Envio.</li>
                <li>O revendedor <strong>não tem prejuízo financeiro</strong> nem é penalizado na reputação pelo dano da transportadora.</li>
              </ol>
            </div>
          </div>

          {/* Pilar 2: Padrão Fabril de Embalagem Homologado */}
          <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Package size={18} />
              <span>2. O Papel da Fábrica: Embalagem Anti-Impacto Homologada</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Para garantir que a Shopee e o Mercado Livre <strong>sempre aprovem o sinistro de avaria</strong> e nunca aleguem mau acondicionamento, a SMD Drop adota embalagem técnica reforçada:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-center font-bold text-slate-200">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">Película protetora no acrílico</div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">Plástico bolha triplo de alta densidade</div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">Cantoneiras de absorção de choque</div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">Caixa de papelão onda dupla reforçada</div>
            </div>
          </div>

          {/* Pilar 3: Defeito de Fabricação (Garantia SMD Drop) */}
          <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 size={18} />
              <span>3. Defeito Técnico de Fabricação (Garantia de Fábrica SMD Drop)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Se o problema for de fabricação (ex: fita LED que não acende, fonte 12V com defeito de fábrica ou corte divergente da arte aprovada), a responsabilidade é <strong>100% da fábrica SMD Drop</strong>. Nesses casos, basta acionar nosso suporte e providenciaremos a substituição da peça sem custos de corte para você.
            </p>
          </div>

          {/* Pilar 4: Envio 100% Cego */}
          <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs text-slate-300">
            <div>
              <strong className="text-white block text-xs">Garantia de Logística Cega (Blind Shipping):</strong>
              <p className="text-[11px] text-slate-400 leading-tight">
                Embalagem neutra sem logotipo fabril. Remetente na etiqueta sempre com os dados da sua loja lojista. Zero contato da fábrica com seu cliente final.
              </p>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-1 rounded-lg border border-emerald-500/30 shrink-0">
              100% CEGO
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">
            Dúvidas operacionais? Consulte o <strong>Lumen</strong> no painel.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-gold text-xs font-black py-2.5 px-6 rounded-xl shadow-lg"
          >
            Entendido, Fechar Política
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
