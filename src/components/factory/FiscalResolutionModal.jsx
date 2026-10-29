import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  X, 
  Save, 
  Building2, 
  User, 
  MapPin,
  Lock,
  Unlock
} from 'lucide-react';

export const FiscalResolutionModal = ({ order, onClose }) => {
  const { updateOrderFiscalData, showNotification } = useStore();

  const fiscal = order?.fiscalData || {};
  const currentReseller = fiscal.reseller || {};
  const currentCustomer = fiscal.customer || order?.customerData || {};

  const [fiscalRegime, setFiscalRegime] = useState(currentReseller.fiscalRegime || 'mei');
  const [nfeKey, setNfeKey] = useState(fiscal.nfeKey || '');
  const [customerName, setCustomerName] = useState(currentCustomer.name || '');
  const [customerCpf, setCustomerCpf] = useState(currentCustomer.cpf || '');
  const [customerAddress, setCustomerAddress] = useState(currentCustomer.address || '');
  const [customerZip, setCustomerZip] = useState(currentCustomer.zip || '');

  if (!order) return null;

  const handleSaveFiscal = () => {
    const cleanKey = nfeKey.replace(/\D/g, '');
    const cleanCpf = customerCpf.replace(/\D/g, '');

    if (fiscalRegime === 'simples' && cleanKey.length !== 44) {
      showNotification('A Chave de Acesso da NF-e precisa ter exatamente 44 dígitos numéricos.', 'error');
      return;
    }

    if (order.dispatchMode === 'direct_blind_shipping') {
      if (!customerName || customerName.trim().length < 3) {
        showNotification('Nome completo do consumidor final é obrigatório.', 'error');
        return;
      }
      if (cleanCpf.length !== 11) {
        showNotification('CPF do consumidor deve ter 11 dígitos.', 'error');
        return;
      }
    }

    updateOrderFiscalData(order.id, {
      fiscalRegime,
      documentType: fiscalRegime === 'mei' ? 'declaracao_conteudo' : 'nfe_venda',
      nfeKey: cleanKey,
      customer: {
        name: customerName,
        cpf: customerCpf,
        address: customerAddress,
        zip: customerZip
      },
      hasLabelAttached: Boolean(order.labelPdf)
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-white relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-700 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-wider inline-block mb-1">
                CONFORMIDADE FISCAL • VENDA À ORDEM
              </span>
              <h3 className="text-lg font-black text-white font-['Outfit'] flex items-center gap-2">
                Regularizar Pedido <span className="font-mono text-amber-400">{order.id}</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs">
          {/* Missing Reasons Notice */}
          {fiscal.missingReasons && fiscal.missingReasons.length > 0 && (
            <div className="bg-rose-500/15 border-2 border-rose-500/40 p-3 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-300 text-xs">
                <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                <span>Pendências que estão travando a expedição:</span>
              </div>
              <ul className="list-disc pl-5 text-[11px] text-rose-200 space-y-0.5">
                {fiscal.missingReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Regime Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">
              Regime Fiscal do Revendedor
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFiscalRegime('mei')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  fiscalRegime === 'mei'
                    ? 'border-amber-400 bg-amber-500/20 text-white font-bold'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                <span className="block font-bold text-xs text-white">MEI (Isento NF-e)</span>
                <span className="text-[10px] text-slate-300">Declaração de Conteúdo Postal</span>
              </button>

              <button
                type="button"
                onClick={() => setFiscalRegime('simples')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  fiscalRegime === 'simples'
                    ? 'border-amber-400 bg-amber-500/20 text-white font-bold'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                <span className="block font-bold text-xs text-white">Simples Nacional / ME</span>
                <span className="text-[10px] text-slate-300">NF-e de Venda (CFOP 5.120)</span>
              </button>
            </div>
          </div>

          {/* NF-e Key Input */}
          {fiscalRegime === 'simples' && (
            <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-700">
              <label className="block text-[11px] font-bold text-amber-300">
                Chave de Acesso da NF-e (44 dígitos numéricos)
              </label>
              <input
                type="text"
                maxLength={44}
                value={nfeKey}
                onChange={(e) => setNfeKey(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 35261045109892000199550010000000011000000010"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs font-mono text-white font-bold focus:border-amber-400 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block">
                Dígitos digitados: <strong className={nfeKey.replace(/\D/g, '').length === 44 ? 'text-emerald-400' : 'text-amber-400'}>{nfeKey.replace(/\D/g, '').length} / 44</strong>
              </span>
            </div>
          )}

          {/* Customer Data Form */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-700 space-y-2.5">
            <span className="text-[11px] font-black uppercase text-slate-300 block">
              Dados do Consumidor Final (Destinatário)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Nome do Cliente</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">CPF do Cliente</label>
                <input
                  type="text"
                  value={customerCpf}
                  onChange={(e) => setCustomerCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Endereço Completo</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">CEP</label>
                <input
                  type="text"
                  value={customerZip}
                  onChange={(e) => setCustomerZip(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-4 border-t border-slate-700 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs font-bold py-2 px-4"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveFiscal}
            className="btn-gold text-xs font-black py-2.5 px-5 flex items-center gap-1.5 shadow-lg bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950"
          >
            <Unlock size={15} /> Salvar & Validar Expedição
          </button>
        </div>
      </div>
    </div>
  );
};
