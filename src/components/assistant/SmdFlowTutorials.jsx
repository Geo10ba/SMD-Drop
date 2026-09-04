import React, { useState } from "react";
import { Link2, Trophy, Zap, ArrowRight, ChevronLeft, BookOpen } from "lucide-react";

export const TUTORIAL_GUIDES = [
  {
    id: "orcamento-m2",
    title: "📐 Como Orçar Acrílico Sob Medida (R$/m²)",
    subtitle: "Aprenda a calcular preços instantâneos para placas e letreiros em qualquer dimensão",
    icon: <Zap className="w-5 h-5" />,
    badge: "Essencial #1",
    colorTheme: "amber",
    steps: [
      {
        number: 1,
        title: "Abrir a Calculadora sob Medida",
        description: "No topo do menu, clique em 'Calculadora m²'. Digite a Largura (cm) e Altura (cm) desejadas.",
        highlight: "Exemplo: 60cm x 40cm (0.24 m²)",
      },
      {
        number: 2,
        title: "Escolher Espessura e Material",
        description: "Selecione entre Acrílico Cast 2mm, 3mm, 5mm ou Letreiro Neon LED. O sistema calcula a taxa por m² automaticamente.",
      },
      {
        number: 3,
        title: "Preço de Atacado x Preço de Venda",
        description: "Veja o custo real cobrado pela fábrica SMD e o valor final sugerido para seu cliente final.",
      },
    ],
  },
  {
    id: "envio-cego",
    title: "📦 Como Funciona o Envio Cego (Dropshipping)",
    subtitle: "Nós fabricamos e enviamos direto ao cliente final com a SUA etiqueta",
    icon: <Trophy className="w-5 h-5" />,
    badge: "Logística",
    colorTheme: "indigo",
    steps: [
      {
        number: 1,
        title: "Vender no Mercado Livre, Shopee ou Amazon",
        description: "O seu cliente compra o produto na sua loja online ou marketplace.",
      },
      {
        number: 2,
        title: "Baixar a Etiqueta de Envio (PDF/ZPL)",
        description: "Obtenha a etiqueta gerada pelo marketplace e envie para a fábrica SMD no fechamento do pedido.",
      },
      {
        number: 3,
        title: "Despacho Anônimo",
        description: "A fábrica imprime sua etiqueta, embala a peça com máxima proteção contra quebras e despacha no correio/coleta sem nenhuma marca SMD!",
      },
    ],
  },
  {
    id: "margem-revenda",
    title: "💎 Como Multiplicar seus Lucros em Acrílicos",
    subtitle: "Estratégia de precificação para conquistar margens de até 200%",
    icon: <Link2 className="w-5 h-5" />,
    badge: "Vendas",
    colorTheme: "purple",
    steps: [
      {
        number: 1,
        title: "Produtos Personalizados Têm Alto Valor Agregado",
        description: "Letreiros Neon e placas de acrílico com logo da empresa do cliente não são commoditizados — cobrem pelo design e exclusividade!",
      },
      {
        number: 2,
        title: "Ofereça Projetos Completos",
        description: "Adicione kits de espaçadores em inox e fontes 12v no orçamento final para aumentar o ticket médio.",
      },
    ],
  },
];

export function SmdFlowTutorials({ onClose }) {
  const [selectedGuide, setSelectedGuide] = useState(null);

  const getThemeClasses = (theme) => {
    switch (theme) {
      case "amber":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          badge: "bg-amber-500 text-slate-950 font-bold",
          btn: "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold",
        };
      case "indigo":
        return {
          bg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
          badge: "bg-indigo-600 text-white font-bold",
          btn: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold",
        };
      case "purple":
        return {
          bg: "bg-purple-500/10 border-purple-500/30 text-purple-400",
          badge: "bg-purple-600 text-white font-bold",
          btn: "bg-purple-600 hover:bg-purple-700 text-white font-bold",
        };
      default:
        return {
          bg: "bg-slate-800 border-slate-700 text-slate-200",
          badge: "bg-slate-700 text-white",
          btn: "bg-purple-600 hover:bg-purple-700 text-white font-bold",
        };
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 text-slate-100 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
        {selectedGuide ? (
          <button
            onClick={() => setSelectedGuide(null)}
            className="flex items-center gap-1 font-bold text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar à lista
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs">Guia Prático do Lumen</h3>
              <p className="text-[10px] text-slate-400">Passo a passo simples para alavancar seu negócio</p>
            </div>
          </div>
        )}
      </div>

      {/* Guide Detail View */}
      {selectedGuide ? (
        <div className="space-y-3">
          <div className={`p-3 rounded-xl border ${getThemeClasses(selectedGuide.colorTheme).bg} flex items-start gap-2.5`}>
            <div className="p-2 rounded-lg bg-slate-900/80 shrink-0">
              {selectedGuide.icon}
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-xs">{selectedGuide.title}</h4>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${getThemeClasses(selectedGuide.colorTheme).badge}`}>
                  {selectedGuide.badge}
                </span>
              </div>
              <p className="text-[11px] opacity-80">{selectedGuide.subtitle}</p>
            </div>
          </div>

          <div className="space-y-2">
            {selectedGuide.steps.map((step) => (
              <div
                key={step.number}
                className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5"
              >
                <div className="w-5 h-5 rounded-full bg-purple-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {step.number}
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <h5 className="font-bold text-xs">{step.title}</h5>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{step.description}</p>
                  {step.highlight && (
                    <div className="mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-purple-300 border border-purple-500/20 inline-block">
                      {step.highlight}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              if (onClose) onClose();
            }}
            className={`w-full py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${getThemeClasses(selectedGuide.colorTheme).btn}`}
          >
            Entendido, Vamos Praticar! <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Guides List */
        <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
          {TUTORIAL_GUIDES.map((guide) => {
            const theme = getThemeClasses(guide.colorTheme);
            return (
              <div
                key={guide.id}
                onClick={() => setSelectedGuide(guide)}
                className={`p-3 rounded-xl border ${theme.bg} hover:border-purple-400 cursor-pointer transition flex items-center justify-between gap-2`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-900/80 shrink-0">
                    {guide.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs truncate">{guide.title}</h4>
                    <p className="text-[10px] opacity-75 truncate">{guide.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0 opacity-70" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
