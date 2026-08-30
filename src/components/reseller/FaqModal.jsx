import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, FileText, Truck, ShieldCheck, Factory, Sparkles } from 'lucide-react';

export const FaqModal = ({ isOpen, onClose }) => {
  const [openIndex, setOpenIndex] = useState(0);

  if (!isOpen) return null;

  const faqs = [
    {
      question: "Como funciona a venda por Mercado Livre / Shopee com anexo de etiqueta?",
      answer: "Quando você realiza uma venda no Mercado Livre ou Shopee, a própria plataforma gera o PDF/ZPL da etiqueta de envio. No momento de fazer o pedido em nosso portal, selecione a opção 'Venda em Marketplace' e anexe a etiqueta. Nossa fábrica cuidará de imprimir, colar na caixa neutra e entregar no ponto de coleta dos Correios/Marketplace sem cobrar frete de você!"
    },
    {
      question: "Como funciona o cálculo de produtos Sob Medida por Metro Quadrado (R$/m²)?",
      answer: "Para produtos como Logomarcas 3D em Acrílico, Letreiros Neon e Placas, você seleciona o produto e digita a Largura (cm) x Altura (cm) desejadas pelo seu cliente. Nossa plataforma calcula instantaneamente a área em m² e aplica nosso valor por m². Você também pode anexar o arquivo da logo (PDF, SVG, DXF, PNG) do seu cliente para nossa equipe cortar a laser."
    },
    {
      question: "O que é Envio Cego (Blind Shipping)?",
      answer: "Envio Cego significa que a encomenda enviada pela nossa fábrica para o seu cliente final não conterá nenhuma marca, logotipo ou nota fiscal com os dados da nossa fábrica como revendedora. A caixa irá neutra com a Declaração de Conteúdo ou com os seus dados de vendedor."
    },
    {
      question: "Qual é o prazo de despacho da fábrica?",
      answer: "Produtos de Preço Fixo (tabela) são despachados em até 24 horas úteis. Produtos Sob Medida que exigem vetorização e corte a laser (logomarcas 3D/Neon) possuem prazo de produção fabril de 2 a 4 dias úteis."
    },
    {
      question: "Quais os formatos aceitos para envio de logomarcas?",
      answer: "Aceitamos arquivos vetoriais em PDF, SVG, DXF, AI, CDR e também fotos em alta resolução em PNG ou JPG. Nossa equipe de designers faz o ajuste fino da arte antes de enviar para as máquinas de corte a laser."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <HelpCircle size={22} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                CENTRAL DE AJUDA & GUIA DE REVENDA
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                Dúvidas Frequentes do Revendedor
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {/* FAQ Accordion Body (No Scroll) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-[var(--border-color)] rounded-xl bg-[var(--bg-surface-hover)] overflow-hidden transition-colors hover:border-amber-500/40"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                className="w-full p-4 text-left font-bold text-xs sm:text-sm text-[var(--text-main)] flex justify-between items-center gap-3"
              >
                <span>{faq.question}</span>
                {openIndex === idx ? (
                  <ChevronUp size={18} className="text-amber-500 shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-[var(--text-muted)] shrink-0" />
                )}
              </button>

              {openIndex === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-color)]/50 bg-[var(--bg-surface)]">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
