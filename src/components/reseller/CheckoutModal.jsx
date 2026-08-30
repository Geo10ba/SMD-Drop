import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import confetti from 'canvas-confetti';
import { 
  FileUp, 
  Truck, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  PackageCheck,
  Building2,
  Sparkles
} from 'lucide-react';

export const CheckoutModal = ({ isOpen, onClose }) => {
  const { cart, submitOrder } = useStore();

  const [step, setStep] = useState(1); // 1: Dispatch Mode & Details, 2: PIX Payment
  const [dispatchMode, setDispatchMode] = useState('marketplace_label'); // 'marketplace_label' or 'direct_blind_shipping'
  const [marketplace, setMarketplace] = useState('Mercado Livre');
  const [labelPdfFile, setLabelPdfFile] = useState(null);

  // Customer delivery details for direct shipping
  const [customerData, setCustomerData] = useState({
    name: 'Carlos Alberto Santos',
    cpf: '341.982.109-88',
    address: 'Rua Bela Cintra, 890, Apto 102',
    city: 'São Paulo',
    state: 'SP',
    zip: '01415-000'
  });

  const [shippingMethod, setShippingMethod] = useState('sedex'); // 'pac', 'sedex', 'jadlog'
  const [loadingCep, setLoadingCep] = useState(false);

  // Auto-fetch address from ViaCEP API
  const handleCepChange = async (newZip) => {
    setCustomerData((prev) => ({ ...prev, zip: newZip }));
    const cleanZip = newZip.replace(/\D/g, '');
    if (cleanZip.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setCustomerData((prev) => ({
            ...prev,
            address: `${data.logradouro}, `,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  if (!isOpen || cart.length === 0) return null;

  const wholesaleSubtotal = cart.reduce((acc, item) => acc + (item.unitWholesalePrice * item.quantity), 0);
  
  // Calculate factory shipping cost based on mode
  let factoryShippingCost = 0;
  if (dispatchMode === 'direct_blind_shipping') {
    if (shippingMethod === 'pac') factoryShippingCost = 22.50;
    if (shippingMethod === 'sedex') factoryShippingCost = 38.90;
    if (shippingMethod === 'jadlog') factoryShippingCost = 29.00;
  }

  const finalTotal = wholesaleSubtotal + factoryShippingCost;

  const handleLabelUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLabelPdfFile(file.name);
    }
  };

  const handleFinalizeOrder = () => {
    submitOrder({
      resellerName: "Sua Loja / Revendedor Autorizado",
      dispatchMode,
      marketplace: dispatchMode === 'marketplace_label' ? marketplace : null,
      labelPdf: labelPdfFile || (dispatchMode === 'marketplace_label' ? `Etiqueta_${marketplace.replace(' ', '')}_${Date.now()}.pdf` : null),
      customerData: dispatchMode === 'direct_blind_shipping' ? customerData : { name: "Cliente " + marketplace, city: "Marketplace Fulfillment" },
      items: cart,
      wholesaleTotal: wholesaleSubtotal,
      shippingTotal: factoryShippingCost,
      total: finalTotal,
      trackingCode: dispatchMode === 'marketplace_label' ? `ML-BR${Math.floor(100000 + Math.random() * 900000)}` : `SS${Math.floor(100000000 + Math.random() * 900000000)}BR`
    });

    // Trigger fireworks animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col p-5 sm:p-7 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <PackageCheck size={22} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                FINALIZAR PEDIDO DE DROPSHIPING
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                {step === 1 ? "1. Escolha a Modalidade de Envio" : "2. Pagamento do Valor de Custo à Fábrica"}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {step === 1 ? (
            <div className="space-y-6">
              {/* Dispatch Mode Selector Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option A: Marketplace Label */}
                <div
                  onClick={() => setDispatchMode('marketplace_label')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    dispatchMode === 'marketplace_label'
                      ? 'border-amber-500 bg-amber-500/5 shadow-md'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileUp size={16} /> Venda em Marketplace
                    </span>
                    <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      FRETE R$ 0,00
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">
                    Anexar Etiqueta Própria (ML / Shopee / Amazon)
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    Você faz o upload do PDF da etiqueta gerada pelo marketplace. A fábrica imprime, embala e entrega no ponto de coleta!
                  </p>
                </div>

                {/* Option B: Direct Blind Shipping */}
                <div
                  onClick={() => setDispatchMode('direct_blind_shipping')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    dispatchMode === 'direct_blind_shipping'
                      ? 'border-amber-500 bg-amber-500/5 shadow-md'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck size={16} /> Envio Direto Cego
                    </span>
                    <span className="bg-slate-200 dark:bg-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Frete Fábrica
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">
                    Envio para Loja Própria (Blind Shipping)
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    Digite o endereço do seu cliente final. A fábrica faz o despacho direto com caixa neutra e sem dados de terceiros.
                  </p>
                </div>
              </div>

              {/* Mode Specific Inputs */}
              {dispatchMode === 'marketplace_label' ? (
                <div className="bg-[var(--bg-surface-hover)] p-5 rounded-2xl border border-[var(--border-color)] space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                      Selecione o Marketplace da Venda
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Mercado Livre', 'Shopee', 'Amazon', 'Shein'].map((mp) => (
                        <button
                          key={mp}
                          type="button"
                          onClick={() => setMarketplace(mp)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                            marketplace === mp
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-color)]'
                          }`}
                        >
                          {mp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload File Box */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                      Anexar Arquivo da Etiqueta PDF / ZPL
                    </label>
                    <div className="border-2 border-dashed border-[var(--border-hover)] rounded-xl p-5 text-center hover:border-amber-500 transition-colors relative bg-[var(--bg-surface)]">
                      <input
                        type="file"
                        onChange={handleLabelUpload}
                        accept=".pdf,.zpl,.zip"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="flex flex-col items-center gap-1.5">
                        <FileUp size={24} className="text-amber-500" />
                        <span className="text-xs font-bold text-[var(--text-main)]">
                          {labelPdfFile ? `Anexado: ${labelPdfFile}` : `Arraste ou clique para anexar etiqueta da ${marketplace}`}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          Formato em PDF ou ZPL pré-pago pelo marketplace.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Direct Shipping Address Inputs */
                <div className="bg-[var(--bg-surface-hover)] p-5 rounded-2xl border border-[var(--border-color)] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Dados de Entrega do Cliente Final
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-[var(--text-muted)] font-medium">Nome Completo</label>
                      <input
                        type="text"
                        value={customerData.name}
                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                        className="input-field mt-1 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[var(--text-muted)] font-medium">CPF do Cliente</label>
                      <input
                        type="text"
                        value={customerData.cpf}
                        onChange={(e) => setCustomerData({ ...customerData, cpf: e.target.value })}
                        className="input-field mt-1 font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-[var(--text-muted)] font-medium">Endereço de Entrega</label>
                      <input
                        type="text"
                        value={customerData.address}
                        onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                        className="input-field mt-1 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[var(--text-muted)] font-medium">Cidade / UF</label>
                      <input
                        type="text"
                        value={`${customerData.city} - ${customerData.state}`}
                        onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                        className="input-field mt-1 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[var(--text-muted)] font-medium">
                        CEP de Destino {loadingCep && <span className="text-amber-500 font-bold">(Buscando endereço...)</span>}
                      </label>
                      <input
                        type="text"
                        value={customerData.zip}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        className="input-field mt-1 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Shipping Carrier Selector */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                      Selecione o Frete de Fábrica
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setShippingMethod('pac')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          shippingMethod === 'pac'
                            ? 'border-amber-500 bg-amber-500/10 font-bold'
                            : 'border-[var(--border-color)] bg-[var(--bg-surface)]'
                        }`}
                      >
                        <span className="block text-xs font-bold">PAC Correios</span>
                        <span className="text-[11px] text-[var(--text-muted)]">R$ 22,50 (5 dias)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShippingMethod('sedex')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          shippingMethod === 'sedex'
                            ? 'border-amber-500 bg-amber-500/10 font-bold'
                            : 'border-[var(--border-color)] bg-[var(--bg-surface)]'
                        }`}
                      >
                        <span className="block text-xs font-bold">SEDEX Expresso</span>
                        <span className="text-[11px] text-[var(--text-muted)]">R$ 38,90 (2 dias)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShippingMethod('jadlog')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          shippingMethod === 'jadlog'
                            ? 'border-amber-500 bg-amber-500/10 font-bold'
                            : 'border-[var(--border-color)] bg-[var(--bg-surface)]'
                        }`}
                      >
                        <span className="block text-xs font-bold">Jadlog Express</span>
                        <span className="text-[11px] text-[var(--text-muted)]">R$ 29,00 (3 dias)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Instant PIX Payment */
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 text-center space-y-4 shadow-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <QrCode size={14} /> PIX INSTANTÂNEO COM DESCONTO DE FÁBRICA
                </div>

                <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect width="100" height="100" fill="#ffffff" />
                    <path d="M10 10h30v30h-30zM60 10h30v30h-30zM10 60h30v30h-30z" fill="#0f172a" />
                    <path d="M15 15h20v20h-20zM65 15h20v20h-20zM15 65h20v20h-20z" fill="#ffffff" />
                    <path d="M20 20h10v10h-10zM70 20h10v10h-10zM20 70h10v10h-10z" fill="#0f172a" />
                    <circle cx="50" cy="50" r="12" fill="#c59b27" />
                  </svg>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block font-medium">Valor Total da Fatura da Fábrica:</span>
                  <span className="text-3xl font-extrabold text-amber-400 font-['Outfit']">
                    R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 max-w-md mx-auto text-xs text-slate-300 flex items-center justify-between font-mono">
                  <span className="truncate pr-2">00020126580014br.gov.bcb.pix0136smd-drop-factory-pix</span>
                  <button
                    onClick={() => alert("Código PIX Copiado!")}
                    className="bg-amber-500 text-slate-900 px-2.5 py-1 rounded font-bold text-[10px] shrink-0 hover:bg-amber-400"
                  >
                    COPIAR
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Fixed Bottom) */}
        <div className="pt-4 border-t border-[var(--border-color)] flex justify-between items-center shrink-0">
          {step === 1 ? (
            <>
              <div>
                <span className="text-xs text-[var(--text-muted)] block">Total a Pagar à Fábrica:</span>
                <span className="text-2xl font-extrabold text-[var(--text-main)] font-['Outfit']">
                  R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={() => setStep(2)}
                className="btn-gold py-3 px-6 text-sm font-bold shadow-lg"
              >
                Avançar p/ Pagamento PIX <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="btn-secondary text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                onClick={handleFinalizeOrder}
                className="btn-gold py-3 px-8 text-sm font-bold shadow-lg"
              >
                <CheckCircle2 size={18} /> Confirmar Pagamento e Enviar à Fábrica
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
