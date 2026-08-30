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
  Sparkles,
  CreditCard,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { calculateMelhorEnvioShipping } from '../../lib/melhorenvio';
import { createMercadoPagoPixPayment, createMercadoPagoPreference } from '../../lib/mercadopago';

export const CheckoutModal = ({ isOpen, onClose }) => {
  const { cart, submitOrder, showNotification } = useStore();

  const [step, setStep] = useState(1); // 1: Dispatch Mode & Details, 2: Payment Method & Finalization
  const [dispatchMode, setDispatchMode] = useState('marketplace_label'); // 'marketplace_label' or 'direct_blind_shipping'
  const [marketplace, setMarketplace] = useState('Mercado Livre');
  const [labelPdfFile, setLabelPdfFile] = useState(null);

  // Payment Method State: 'pix_direct' (0% fee) or 'mercadopago' (+5% surcharge)
  const [paymentMethod, setPaymentMethod] = useState('pix_direct');
  const [loadingMp, setLoadingMp] = useState(false);

  // Mercado Envios shipping state
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

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

  // Auto-fetch address from ViaCEP API & calculate Mercado Envios shipping
  const handleCepChange = async (newZip) => {
    setCustomerData((prev) => ({ ...prev, zip: newZip }));
    const cleanZip = newZip.replace(/\D/g, '');
    if (cleanZip.length === 8) {
      setLoadingCep(true);
      setLoadingShipping(true);
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

        // Calculate live shipping rates via Mercado Envios module
        const shippingRes = await calculateMelhorEnvioShipping({ toPostalCode: cleanZip });
        if (shippingRes.success && shippingRes.options.length > 0) {
          setShippingOptions(shippingRes.options);
          setSelectedShippingOption(shippingRes.options[0]);
        }
      } catch (err) {
        console.error("Erro ao buscar CEP / Frete:", err);
      } finally {
        setLoadingCep(false);
        setLoadingShipping(false);
      }
    }
  };

  if (!isOpen || cart.length === 0) return null;

  const wholesaleSubtotal = cart.reduce((acc, item) => acc + (item.unitWholesalePrice * item.quantity), 0);
  
  // Calculate factory shipping cost based on mode
  let factoryShippingCost = 0;
  if (dispatchMode === 'direct_blind_shipping') {
    if (selectedShippingOption) {
      factoryShippingCost = selectedShippingOption.price;
    } else {
      if (shippingMethod === 'pac') factoryShippingCost = 22.50;
      if (shippingMethod === 'sedex') factoryShippingCost = 38.90;
      if (shippingMethod === 'jadlog') factoryShippingCost = 29.00;
    }
  }

  const baseTotal = wholesaleSubtotal + factoryShippingCost;
  
  // 5% Mercado Pago Fee Surcharge when Mercado Pago is selected
  const mercadoPagoFee = paymentMethod === 'mercadopago' ? baseTotal * 0.05 : 0;
  const finalTotal = baseTotal + mercadoPagoFee;

  const handleLabelUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLabelPdfFile(file.name);
    }
  };

  const handleMercadoPagoCheckout = async () => {
    setLoadingMp(true);
    try {
      const res = await createMercadoPagoPreference({
        items: cart.map(item => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unitWholesalePrice * 1.05 // Includes 5% surcharge
        })),
        payer: {
          name: customerData.name || "Revendedor SMD Drop",
          email: "revendedor@smddrop.com.br"
        },
        external_reference: `ORD-MP-${Date.now()}`
      });

      if (res.success && res.initPoint) {
        showNotification("Redirecionando para o Checkout do Mercado Pago (+5% taxa aplicada)...");
        window.open(res.initPoint, "_blank");
        handleFinalizeOrder();
      } else {
        alert(res.error || "Erro ao conectar com a API do Mercado Pago. Finalizando pelo PIX Direto.");
        handleFinalizeOrder();
      }
    } catch (err) {
      console.error(err);
      handleFinalizeOrder();
    } finally {
      setLoadingMp(false);
    }
  };

  const handleFinalizeOrder = () => {
    submitOrder({
      resellerName: "Sua Loja / Revendedor Autorizado",
      dispatchMode,
      paymentMethod: paymentMethod === 'mercadopago' ? 'Mercado Pago (+5%)' : 'PIX Direto (0%)',
      marketplace: dispatchMode === 'marketplace_label' ? marketplace : null,
      labelPdf: labelPdfFile || (dispatchMode === 'marketplace_label' ? `Etiqueta_${marketplace.replace(' ', '')}_${Date.now()}.pdf` : null),
      customerData: dispatchMode === 'direct_blind_shipping' ? customerData : { name: "Cliente " + marketplace, city: "Marketplace Fulfillment" },
      items: cart,
      wholesaleTotal: wholesaleSubtotal,
      shippingTotal: factoryShippingCost,
      mercadoPagoFee: mercadoPagoFee,
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
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col p-5 sm:p-7 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <PackageCheck size={22} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                FINALIZAR PEDIDO DE DROPSHIPPING
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                {step === 1 ? "1. Escolha a Modalidade de Envio" : "2. Escolha o Pagamento à Fábrica"}
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
                      Mercado Envios
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">
                    Envio para Loja Própria (Blind Shipping)
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    Digite o endereço do seu cliente final. A fábrica calcula o frete real via Mercado Envios e despacha em caixa neutra.
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
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                              : 'bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-color)]'
                          }`}
                        >
                          {mp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                      Upload da Etiqueta de Envio (PDF ou ZPL)
                    </label>
                    <div className="border-2 border-dashed border-[var(--border-hover)] rounded-xl p-4 text-center relative bg-[var(--bg-surface)] hover:border-amber-500 transition-colors">
                      <input
                        type="file"
                        onChange={handleLabelUpload}
                        accept=".pdf,.zpl,.txt"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <FileUp size={24} className="mx-auto text-amber-500 mb-1" />
                      <span className="text-xs font-semibold text-[var(--text-main)] block">
                        {labelPdfFile ? `Etiqueta Anexada: ${labelPdfFile}` : "Clique ou arraste o PDF da etiqueta do marketplace"}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">Aceita arquivos de etiqueta da Shopee, Mercado Livre e Amazon</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--bg-surface-hover)] p-5 rounded-2xl border border-[var(--border-color)] space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    Dados do Cliente Final para Entrega Neutra (Sem Nota/Marca de Terceiros)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)]">Nome do Cliente</label>
                      <input
                        type="text"
                        value={customerData.name}
                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                        className="input-field font-semibold mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)]">CPF do Cliente</label>
                      <input
                        type="text"
                        value={customerData.cpf}
                        onChange={(e) => setCustomerData({ ...customerData, cpf: e.target.value })}
                        className="input-field font-semibold mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-[var(--text-muted)]">Endereço Completo</label>
                      <input
                        type="text"
                        value={customerData.address}
                        onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                        className="input-field font-semibold mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)]">CEP de Destino</label>
                      <input
                        type="text"
                        value={customerData.zip}
                        onChange={(e) => handleCepChange(e.target.value)}
                        className="input-field font-bold font-mono text-amber-500 mt-1"
                      />
                    </div>
                  </div>

                  {/* Mercado Envios Shipping Options */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center justify-between">
                      <span>Cotação Mercado Envios / Correios</span>
                      {loadingShipping && <span className="text-amber-500 text-[10px]">Calculando frete real...</span>}
                    </label>

                    {shippingOptions.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {shippingOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedShippingOption(opt)}
                            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                              selectedShippingOption?.id === opt.id
                                ? 'border-amber-500 bg-amber-500/10 font-bold shadow-sm'
                                : 'border-[var(--border-color)] bg-[var(--bg-surface)]'
                            }`}
                          >
                            <div>
                              <span className="block text-xs font-bold text-[var(--text-main)]">{opt.name}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">Prazo estimado: {opt.deliveryTime} dias úteis</span>
                            </div>
                            <span className="font-mono font-extrabold text-amber-500 text-xs">
                              R$ {opt.price.toFixed(2)}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Payment Options (PIX 0% vs Mercado Pago +5%) */
            <div className="space-y-6 animate-fade-in">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Escolha o Método de Pagamento do Custo Fabril
              </span>

              {/* Payment Method Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Direct PIX (0% Fee) */}
                <div
                  onClick={() => setPaymentMethod('pix_direct')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'pix_direct'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-md'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <QrCode size={16} /> PIX Direto Fábrica
                    </span>
                    <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      0% TAXA
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Pagamento instantâneo via QR Code PIX direto sem taxas adicionais.
                  </p>
                </div>

                {/* Option 2: Mercado Pago (+5% Surcharge) */}
                <div
                  onClick={() => setPaymentMethod('mercadopago')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'mercadopago'
                      ? 'border-amber-500 bg-amber-500/10 shadow-md'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={16} /> Mercado Pago
                    </span>
                    <span className="bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                      +5% TAXA
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Cartão de crédito em até 12x ou Checkout Pro (+ 5% de taxa de processamento do MP).
                  </p>
                </div>
              </div>

              {/* Payment Details Box */}
              {paymentMethod === 'mercadopago' ? (
                <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 text-white rounded-2xl p-6 border border-amber-500/40 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="text-amber-400" size={20} />
                      <span className="font-extrabold text-sm text-amber-300">Mercado Pago Checkout Pro</span>
                    </div>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-500/40">
                      +5% Acréscimo Aplicado
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal Atacado + Frete:</span>
                      <span className="font-mono font-bold">R$ {baseTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-amber-400 font-semibold">
                      <span>Taxa Processamento Mercado Pago (+5%):</span>
                      <span className="font-mono font-bold">+ R$ {mercadoPagoFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-amber-500/30">
                      <span>Total Fatura Mercado Pago:</span>
                      <span className="font-mono text-amber-400">R$ {finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 leading-relaxed">
                    ⚡ Ao clicar no botão abaixo, a taxa de 5% (R$ {mercadoPagoFee.toFixed(2)}) será incluída na sua preferência do Mercado Pago para você pagar em até 12x ou utilizar o saldo MP!
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 text-center space-y-4 shadow-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    <QrCode size={14} /> PIX INSTANTÂNEO COM DESCONTO DE FÁBRICA (0% TAXA)
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
                    <span className="text-xs text-slate-400 block font-medium">Valor Total da Fatura da Fábrica (Sem Taxa):</span>
                    <span className="text-3xl font-extrabold text-amber-400 font-['Outfit']">
                      R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 max-w-md mx-auto text-xs text-slate-300 flex items-center justify-between font-mono">
                    <span className="truncate pr-2">00020126580014br.gov.bcb.pix0136smd-drop-factory-pix</span>
                    <button
                      type="button"
                      onClick={() => alert("Código PIX Copiado!")}
                      className="bg-amber-500 text-slate-900 px-2.5 py-1 rounded font-bold text-[10px] shrink-0 hover:bg-amber-400"
                    >
                      COPIAR
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions (Fixed Bottom) */}
        <div className="pt-4 border-t border-[var(--border-color)] flex justify-between items-center shrink-0">
          {step === 1 ? (
            <>
              <div>
                <span className="text-xs text-[var(--text-muted)] block">Subtotal Atacado + Frete:</span>
                <span className="text-2xl font-extrabold text-[var(--text-main)] font-['Outfit']">
                  R$ {baseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-gold py-3 px-6 text-sm font-bold shadow-lg"
              >
                Avançar para Pagamento <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary text-xs font-semibold"
              >
                Voltar
              </button>

              {paymentMethod === 'mercadopago' ? (
                <button
                  type="button"
                  disabled={loadingMp}
                  onClick={handleMercadoPagoCheckout}
                  className="btn-gold py-3 px-8 text-sm font-bold shadow-lg flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500"
                >
                  <CreditCard size={18} /> Pagar R$ {finalTotal.toFixed(2)} via Mercado Pago (+5%)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalizeOrder}
                  className="btn-gold py-3 px-8 text-sm font-bold shadow-lg"
                >
                  <CheckCircle2 size={18} /> Confirmar Pagamento PIX e Enviar à Fábrica
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
