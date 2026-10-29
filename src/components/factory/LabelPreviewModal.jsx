import React, { useState } from 'react';
import { 
  Printer, 
  QrCode, 
  Barcode, 
  PackageCheck, 
  FileText, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  Eye, 
  Download,
  AlertTriangle,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';

export const LabelPreviewModal = ({ order, onClose }) => {
  const [activeView, setActiveView] = useState('thermal_label'); // 'thermal_label' | 'canguru_doc' | 'checklist'
  const [checklist, setChecklist] = useState({
    neutralBox: true,
    neutralTape: true,
    resellerSender: true,
    canguruPouchAttached: true,
    noFactoryPrice: true
  });

  if (!order) return null;

  const isMarketplace = order.dispatchMode === 'marketplace_label';
  const fiscal = order.fiscalData || {};
  const customer = fiscal.customer || order.customerData || {};
  const reseller = fiscal.reseller || {};
  const tracking = order.trackingCode || `ML-BR${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrint = () => {
    window.print();
  };

  const allChecked = Object.values(checklist).every(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl text-white relative animate-fade-in my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <PackageCheck size={24} />
            </div>
            <div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-wider inline-block mb-1">
                LOGÍSTICA CEGA & ETIQUETAGEM TÉRMICA (10x15cm)
              </span>
              <h3 className="text-lg font-black text-white font-['Outfit'] flex items-center gap-2">
                Expedição do Pedido <span className="font-mono text-amber-400">{order.id}</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* View Switcher Tabs (Print Hidden) */}
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2.5 shrink-0 print:hidden overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveView('thermal_label')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'thermal_label'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Barcode size={15} /> 1. Etiqueta Térmica 10x15
          </button>

          <button
            type="button"
            onClick={() => setActiveView('canguru_doc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'canguru_doc'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={15} /> 2. Envelope Canguru ({fiscal.documentType === 'nfe_venda' ? 'DANFE Simplificado' : 'Declaração MEI'})
          </button>

          <button
            type="button"
            onClick={() => setActiveView('checklist')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'checklist'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={15} /> 3. Checklist Logística Cega
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeView === 'thermal_label' && (
            <div className="space-y-3">
              {/* Info notice about who generates label */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-emerald-400 shrink-0" size={18} />
                  <span>
                    Origem da Etiqueta:{' '}
                    <strong className="text-white">
                      {isMarketplace ? `Gerada pelo Revendedor via ${order.marketplace || 'Marketplace'}` : 'Gerada pela Fábrica em nome do Revendedor (Envio Cego)'}
                    </strong>
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-black border border-emerald-500/30">
                  REMETENTE CEGO
                </span>
              </div>

              {/* Thermal Label Simulation 100mm x 150mm */}
              <div className="max-w-md mx-auto bg-white text-slate-950 p-4 rounded-xl border-2 border-slate-950 font-mono text-[11px] space-y-3 shadow-xl leading-tight">
                {/* Channel & Contract Header */}
                <div className="border-b-2 border-slate-950 pb-2 flex justify-between items-center">
                  <div>
                    <span className="font-black text-sm uppercase tracking-wider block">
                      {isMarketplace ? (order.marketplace?.toUpperCase() || 'MERCADO ENVIOS') : 'LOGÍSTICA CEGA SMD'}
                    </span>
                    <span className="text-[9px] text-slate-700 font-sans font-bold">
                      {order.shippingMethod === 'sedex' ? 'SEDEX CONTRATO POSTAL' : 'MERCADO ENVIOS COLETAS'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="bg-slate-950 text-white text-[10px] font-black px-2 py-0.5 rounded">
                      PLP 8492019
                    </span>
                    <span className="block text-[8px] font-sans text-slate-600 mt-0.5">ROTA: SP-CAPITAL-04</span>
                  </div>
                </div>

                {/* Tracking Barcode */}
                <div className="text-center py-2 border-b-2 border-slate-950 space-y-1">
                  <svg viewBox="0 0 200 45" className="w-full h-14">
                    <rect width="200" height="45" fill="#ffffff" />
                    {[8, 11, 15, 18, 22, 28, 32, 38, 42, 48, 54, 58, 65, 70, 75, 82, 88, 93, 100, 106, 112, 118, 125, 132, 138, 145, 152, 158, 165, 172, 180, 188].map((x, i) => (
                      <rect key={i} x={x} y="0" width={i % 3 === 0 ? 3.5 : (i % 2 === 0 ? 2 : 1.2)} height="45" fill="#000000" />
                    ))}
                  </svg>
                  <span className="text-xs font-mono font-black tracking-widest block text-slate-950">
                    {tracking}
                  </span>
                </div>

                {/* Destinatário (Consumidor Final) */}
                <div className="border-b-2 border-slate-950 pb-2 space-y-0.5">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-black uppercase text-[10px] text-slate-700">DESTINATÁRIO:</span>
                    <span className="text-[9px] font-sans font-bold">ENTREGA DOMICILIAR</span>
                  </div>
                  <p className="font-black text-xs text-slate-950">{customer.name || "Cliente Final"}</p>
                  <p className="text-[11px] text-slate-800">{customer.address || "Rua de Entrega, 100"}</p>
                  <p className="font-bold text-slate-900">
                    {customer.city || "São Paulo"} - {customer.state || "SP"}
                  </p>
                  <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-300">
                    <span className="font-black text-sm text-slate-950 font-mono">
                      CEP: {customer.zip || "01000-000"}
                    </span>
                    <span className="text-[9px] font-sans font-bold text-slate-700">
                      {customer.phone || "(11) 99999-9999"}
                    </span>
                  </div>
                </div>

                {/* Remetente 100% Cego (Revendedor) */}
                <div className="pt-1 text-[10px] text-slate-800 flex justify-between items-end">
                  <div className="space-y-0.5">
                    <span className="font-black block uppercase text-[9px] text-slate-600">
                      REMETENTE (OPERAÇÃO REVENDA):
                    </span>
                    <p className="font-black text-slate-950">{reseller.name || order.resellerName || "Loja Revendedora Autorizada"}</p>
                    <p className="text-[9px] text-slate-700">
                      CNPJ/CPF: {reseller.document || "MEI - Isento"}
                    </p>
                    <p className="text-[9px] text-slate-700">
                      {customer.city || "São Paulo"} - {customer.state || "SP"}
                    </p>
                  </div>
                  <div className="w-10 h-10 border border-slate-950 p-0.5 shrink-0 bg-slate-100 flex items-center justify-center">
                    <QrCode size={36} className="text-slate-950" />
                  </div>
                </div>

                {/* Blind Logistics Stamp */}
                <div className="bg-slate-100 p-1.5 rounded text-[8px] text-center font-sans font-bold text-slate-700 uppercase border border-slate-300">
                  🔒 ENVIO DIRETO NEUTRO • SEM MARCAS FABRICANTE • EMBALAGEM PADRONIZADA
                </div>
              </div>
            </div>
          )}

          {activeView === 'canguru_doc' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-2 print:hidden">
                <div className="flex items-center gap-2">
                  <Layers className="text-amber-400 shrink-0" size={18} />
                  <span>
                    Documento para fixação no <strong>Envelope Plástico Canguru (AWB Pouch)</strong> no exterior da caixa.
                  </span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  {fiscal.documentType === 'nfe_venda' ? 'DANFE SIMPLIFICADO' : 'DECLARAÇÃO DE CONTEÚDO'}
                </span>
              </div>

              {/* Canguru Document Simulation */}
              <div className="bg-white text-slate-950 p-4 rounded-xl border-2 border-slate-950 font-mono text-[10px] space-y-2 shadow-xl leading-tight max-w-lg mx-auto">
                <div className="text-center border-b-2 border-slate-950 pb-2">
                  <h4 className="font-black text-xs uppercase">
                    {fiscal.documentType === 'nfe_venda' ? 'DANFE SIMPLIFICADO - DOCUMENTO AUXILIAR DA NF-E' : 'DECLARAÇÃO DE CONTEÚDO POSTAL'}
                  </h4>
                  <p className="text-[9px] text-slate-600 font-sans">
                    {fiscal.documentType === 'nfe_venda' ? 'Conforme Art. 40 Convênio S/N 1970 - Venda à Ordem' : 'Isento de NF-e para consumidor PF - Regime MEI'}
                  </p>
                </div>

                {fiscal.documentType === 'nfe_venda' ? (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <span className="font-bold text-[9px] text-slate-600 block">CHAVE DE ACESSO DA NF-E (44 DÍGITOS):</span>
                      <p className="font-mono font-black text-[11px] text-slate-950 break-all bg-slate-100 p-1.5 rounded border border-slate-300">
                        {fiscal.nfeKey || '35261045109892000199550010000000011000000010'}
                      </p>
                      <svg viewBox="0 0 200 30" className="w-full h-8">
                        <rect width="200" height="30" fill="#ffffff" />
                        {[5, 8, 12, 16, 22, 26, 30, 36, 42, 46, 52, 58, 64, 70, 76, 82, 88, 94, 100, 106, 112, 118, 124, 130, 136, 142, 148, 154, 160, 166, 172, 178, 184, 190].map((x, i) => (
                          <rect key={i} x={x} y="0" width={i % 2 === 0 ? 2.5 : 1.2} height="30" fill="#000000" />
                        ))}
                      </svg>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-300 py-1.5">
                      <div>
                        <span className="font-bold block text-slate-600">EMITENTE (REVENDEDOR):</span>
                        <p className="font-bold">{reseller.name || order.resellerName}</p>
                        <p>CNPJ: {reseller.document || "12.345.678/0001-90"}</p>
                        <p>CFOP: 5.120 (Venda à Ordem)</p>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-600">DESTINATÁRIO:</span>
                        <p className="font-bold">{customer.name}</p>
                        <p>CPF: {customer.cpf || "123.456.789-00"}</p>
                        <p>{customer.city} - {customer.state}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-300 pb-1.5">
                      <div>
                        <span className="font-bold block text-slate-600">REMETENTE:</span>
                        <p className="font-bold">{reseller.name || order.resellerName}</p>
                        <p>CPF/CNPJ: {reseller.document || "MEI - Isento"}</p>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-600">DESTINATÁRIO:</span>
                        <p className="font-bold">{customer.name}</p>
                        <p>CPF: {customer.cpf || "123.456.789-00"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div>
                  <span className="font-bold block text-slate-600 mb-1">CONTEÚDO DO PACOTE:</span>
                  <table className="w-full border-collapse border border-slate-800 text-[9px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-800 p-1 text-left">Item</th>
                        <th className="border border-slate-800 p-1 text-center">Qtd</th>
                        <th className="border border-slate-800 p-1 text-right">Valor Declarado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-800 p-1">{it.title}</td>
                          <td className="border border-slate-800 p-1 text-center">{it.quantity || 1}</td>
                          <td className="border border-slate-800 p-1 text-right">R$ {(Number(it.unitWholesalePrice) * (it.quantity || 1)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[8px] text-slate-600 font-sans leading-tight pt-1">
                  * Instrução de Expedição: Dobre este documento ao meio e introduza no envelope plástico transparente autoadesivo externo, mantendo as informações visíveis para conferência fiscal em trânsito.
                </p>
              </div>
            </div>
          )}

          {activeView === 'checklist' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-amber-400" size={20} />
                  <div>
                    <h4 className="text-sm font-black text-white">
                      Checklist Operacional de Logística Cega da Fábrica
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Obrigatório verificar antes de colar a fita final e bipar a remessa para expedição.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-500">
                    <input
                      type="checkbox"
                      checked={checklist.neutralBox}
                      onChange={(e) => setChecklist({ ...checklist, neutralBox: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-600 focus:ring-0"
                    />
                    <div className="text-xs">
                      <strong className="text-white block">1. Caixa de Papelão 100% Neutra</strong>
                      <span className="text-slate-400 text-[11px]">Sem logomarca, endereço ou telefone da fábrica SMD Drop.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-500">
                    <input
                      type="checkbox"
                      checked={checklist.neutralTape}
                      onChange={(e) => setChecklist({ ...checklist, neutralTape: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-600 focus:ring-0"
                    />
                    <div className="text-xs">
                      <strong className="text-white block">2. Fita Adesiva Transparente ou Parda Neutra</strong>
                      <span className="text-slate-400 text-[11px]">Vedação segura sem fitas personalizadas de terceiros.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-500">
                    <input
                      type="checkbox"
                      checked={checklist.resellerSender}
                      onChange={(e) => setChecklist({ ...checklist, resellerSender: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-600 focus:ring-0"
                    />
                    <div className="text-xs">
                      <strong className="text-white block">3. Etiqueta com Remetente em Nome da Operação de Revenda</strong>
                      <span className="text-slate-400 text-[11px]">Remetente impresso: "{order.resellerName}".</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-500">
                    <input
                      type="checkbox"
                      checked={checklist.canguruPouchAttached}
                      onChange={(e) => setChecklist({ ...checklist, canguruPouchAttached: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-600 focus:ring-0"
                    />
                    <div className="text-xs">
                      <strong className="text-white block">4. Envelope Canguru Externo Afixado</strong>
                      <span className="text-slate-400 text-[11px]">
                        Contendo {fiscal.documentType === 'nfe_venda' ? 'DANFE Simplificado com Chave 44 dígitos' : 'Declaração de Conteúdo Postal assinada'}.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-500">
                    <input
                      type="checkbox"
                      checked={checklist.noFactoryPrice}
                      onChange={(e) => setChecklist({ ...checklist, noFactoryPrice: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-600 focus:ring-0"
                    />
                    <div className="text-xs">
                      <strong className="text-white block">5. Interior Limpo Sem Faturas ou Preços de Atacado</strong>
                      <span className="text-slate-400 text-[11px]">O consumidor final não terá acesso ao custo de fabricação da revenda.</span>
                    </div>
                  </label>
                </div>

                {allChecked ? (
                  <div className="bg-emerald-500/15 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    <span><strong>100% Conforme!</strong> O pacote atende a todos os critérios estritos de Logística Cega e Venda à Ordem.</span>
                  </div>
                ) : (
                  <div className="bg-amber-500/15 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                    <span>Marque todos os itens acima para certificar o pacote antes da expedição física.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Print Hidden) */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-center shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs font-bold py-2 px-4"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-gold text-xs font-black py-2.5 px-5 flex items-center gap-1.5 shadow-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950"
            >
              <Printer size={15} /> Imprimir na Impressora Térmica (10x15)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
