import React from 'react';
import { Printer, FileText, Building2, User, ShieldCheck } from 'lucide-react';

export const PostalDeclarationModal = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 font-sans">
        {/* Actions Bar */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="text-amber-600" size={20} />
            <h3 className="text-lg font-bold">Declaração de Conteúdo (Correios / Transporte)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-gold py-2 px-4 text-xs font-bold">
              <Printer size={15} /> Imprimir Declaração
            </button>
            <button onClick={onClose} className="btn-secondary py-2 px-3 text-xs font-bold">
              ✕
            </button>
          </div>
        </div>

        {/* Printable Content Official Format */}
        <div className="border border-slate-800 p-4 text-xs space-y-4 font-mono leading-tight">
          <div className="text-center border-b border-slate-800 pb-2">
            <h2 className="text-sm font-extrabold uppercase">DECLARAÇÃO DE CONTEÚDO</h2>
            <p className="text-[10px] text-slate-600">(Em conformidade com a legislação postal vigente)</p>
          </div>

          {/* Sender & Addressee */}
          <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-3">
            {/* Remetente (Fábrica) */}
            <div className="space-y-1">
              <span className="font-bold block uppercase underline">REMETENTE (FÁBRICA):</span>
              <p className="font-bold">SMD DROP PRODUTOS PERSONALIZADOS</p>
              <p>CNPJ: 45.109.892/0001-99</p>
              <p>Endereço: Av. Industrial, 450 - Distrito Industrial</p>
              <p>Cidade/UF: São Paulo - SP | CEP: 03100-000</p>
            </div>

            {/* Destinatário (Cliente Final) */}
            <div className="space-y-1">
              <span className="font-bold block uppercase underline">DESTINATÁRIO:</span>
              <p className="font-bold">{order.customerData?.name || "Cliente Final"}</p>
              <p>CPF/CNPJ: {order.customerData?.cpf || "123.456.789-00"}</p>
              <p>Endereço: {order.customerData?.address || "Rua de Entrega, 100"}</p>
              <p>Cidade/UF: {order.customerData?.city || "São Paulo"} - {order.customerData?.state || "SP"} | CEP: {order.customerData?.zip || "01000-000"}</p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <span className="font-bold block uppercase mb-1">IDENTIFICAÇÃO DOS BENS:</span>
            <table className="w-full border-collapse border border-slate-800 text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-800 font-bold">
                  <th className="border border-slate-800 p-1 text-left">Item</th>
                  <th className="border border-slate-800 p-1 text-left">Discriminação do Conteúdo</th>
                  <th className="border border-slate-800 p-1 text-center">Qtd</th>
                  <th className="border border-slate-800 p-1 text-right">Valor R$</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-800 p-1 text-center">{idx + 1}</td>
                    <td className="border border-slate-800 p-1">
                      {item.title} {item.pricingType === 'custom_m2' ? `(${item.widthCm}x${item.heightCm}cm)` : ''}
                    </td>
                    <td className="border border-slate-800 p-1 text-center">{item.quantity}</td>
                    <td className="border border-slate-800 p-1 text-right">R$ {(item.unitWholesalePrice * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Signature */}
          <div className="pt-4 text-[10px] space-y-3">
            <p>
              Declaro que não me enquadro na condição de contribuinte habitual do ICMS e que o conteúdo discriminado não constitui objeto de mercancia habitual ou comercialização direta neste ato.
            </p>
            <div className="flex justify-between items-end pt-6">
              <span>Data: ___/___/2026</span>
              <span className="border-t border-slate-800 pt-1 px-8">Assinatura do Remetente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
