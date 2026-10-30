import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  ExternalLink,
  Wallet,
  Zap,
  Plus,
  FileText,
  FileCheck
} from 'lucide-react';
import { calculateMelhorEnvioShipping } from '../../lib/melhorenvio';
import { createMercadoPagoPixPayment, createMercadoPagoPreference } from '../../lib/mercadopago';
import { 
  generatePixPayload, 
  getQrCodeImageUrl, 
  SMD_DROP_CNPJ, 
  SMD_DROP_CNPJ_FORMATTED, 
  SMD_DROP_BENEFICIARY 
} from '../../utils/pixGenerator';

export const CheckoutModal = ({ isOpen, onClose, onOpenWallet }) => {
  const { cart, submitOrder, showNotification, currentUser, walletBalance } = useStore();

  const [step, setStep] = useState(1); // 1: Dispatch Mode & Details, 2: Payment Method & Finalization
  const [dispatchMode, setDispatchMode] = useState('marketplace_label'); // 'marketplace_label' or 'direct_blind_shipping'
  const [marketplace, setMarketplace] = useState('Mercado Livre');
  const [labelPdfFile, setLabelPdfFile] = useState(null);
  const [labelFileBase64, setLabelFileBase64] = useState(null);

  // Fiscal Tripartite Configuration (Art. 40 Convênio S/N 1970)
  const [fiscalRegime, setFiscalRegime] = useState('mei'); // 'mei' | 'simples'
  const [nfeKey, setNfeKey] = useState('');
  const [informNfeLater, setInformNfeLater] = useState(false);

  // Payment Method State: 'wallet' (0% fee - instant debit), 'pix_direct' (0% fee) or 'mercadopago' (+5% surcharge)
  const [paymentMethod, setPaymentMethod] = useState('wallet');

  // Mercado Envios shipping state
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Customer delivery details for direct shipping
  const [customerData, setCustomerData] = useState({
    name: 'Carlos Alberto Santos',
    cpf: '341.982.109-88',
    phone: '(11) 98765-4321',
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

  const wholesaleSubtotal = cart.reduce((acc, item) => {
    const itemPrice = Number(item.unitWholesalePrice ?? item.wholesalePrice ?? item.price ?? 0) || 0;
    const itemQty = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
    return acc + (itemPrice * itemQty);
  }, 0);
  
  // Calculate factory shipping cost based on mode
  let factoryShippingCost = 0;
  if (dispatchMode === 'direct_blind_shipping') {
    if (selectedShippingOption) {
      factoryShippingCost = Number(selectedShippingOption.price) || 0;
    } else {
      if (shippingMethod === 'pac') factoryShippingCost = 22.50;
      if (shippingMethod === 'sedex') factoryShippingCost = 38.90;
      if (shippingMethod === 'jadlog') factoryShippingCost = 29.00;
    }
  }

  const baseTotal = (Number(wholesaleSubtotal) || 0) + (Number(factoryShippingCost) || 0);
  
  // 5% Mercado Pago Fee Surcharge when Mercado Pago is selected
  const mercadoPagoFee = paymentMethod === 'mercadopago' ? baseTotal * 0.05 : 0;
  const finalTotal = Math.max(0, Number(baseTotal + mercadoPagoFee) || 0);

  const handleLabelUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setLabelPdfFile(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setLabelFileBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleProceedToStep2 = () => {
    if (dispatchMode === 'marketplace_label') {
      if (!labelPdfFile) {
        showNotification('Por favor, anexe a etiqueta de envio (PDF ou ZPL) do marketplace antes de avançar.', 'error');
        return;
      }
    }

    if (dispatchMode === 'direct_blind_shipping') {
      if (!customerData.name || customerData.name.trim().length < 3) {
        showNotification('Informe o nome completo do cliente final.', 'error');
        return;
      }
      const cleanCpf = (customerData.cpf || '').replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        showNotification('CPF do cliente inválido (deve conter 11 dígitos).', 'error');
        return;
      }
      if (!customerData.address || customerData.address.trim().length < 5) {
        showNotification('Endereço completo de entrega é obrigatório.', 'error');
        return;
      }
    }

    if (fiscalRegime === 'simples' && !informNfeLater) {
      const cleanKey = (nfeKey || '').replace(/\D/g, '');
      if (cleanKey.length !== 44) {
        showNotification('A Chave da NF-e precisa ter exatamente 44 números, ou marque "Informar chave depois".', 'error');
        return;
      }
    }

    setStep(2);
  };

  const handleFinalizeOrder = () => {
    submitOrder({
      resellerName: currentUser?.name || "Sua Loja / Revendedor Autorizado",
      resellerEmail: currentUser?.email || "revendedor@smddrop.com.br",
      resellerDocument: currentUser?.cnpj || "MEI - Isento",
      fiscalRegime,
      documentType: fiscalRegime === 'mei' ? 'declaracao_conteudo' : 'nfe_venda',
      nfeKey: informNfeLater ? '' : nfeKey.replace(/\D/g, ''),
      dispatchMode,
      paymentMethod: paymentMethod === 'mercadopago' ? 'PIX Mercado Pago (+5%)' : (paymentMethod === 'wallet' ? 'Carteira Pré-Paga (0%)' : 'PIX Fábrica (0%)'),
      marketplace: dispatchMode === 'marketplace_label' ? marketplace : null,
      labelPdf: labelPdfFile || (dispatchMode === 'marketplace_label' ? `Etiqueta_${marketplace.replace(' ', '')}_${Date.now()}.pdf` : null),
      labelFileBase64,
      labelFileName: labelPdfFile,
      customerData: dispatchMode === 'direct_blind_shipping' ? customerData : { 
        name: customerData.name || ("Cliente " + marketplace), 
        cpf: customerData.cpf || "",
        phone: customerData.phone || "",
        city: customerData.city || "Marketplace Fulfillment",
        address: customerData.address || "Conforme Etiqueta Marketplace",
        state: customerData.state || "SP",
        zip: customerData.zip || "01000-000"
      },
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

  return createPortal(
    <div className="fixed inset-0 z-[9990] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col p-5 sm:p-7 shadow-2xl relative my-auto">
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

              {/* Seção de Enquadramento Fiscal de Venda à Ordem (Art. 40 Convênio S/N 1970) */}
              <div className="bg-slate-900 border-2 border-slate-700 p-4 rounded-2xl space-y-3 shadow-md">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="text-amber-400" size={18} />
                    <span className="text-xs font-black uppercase text-white tracking-wider">
                      Perfil Fiscal do Revendedor (Venda à Ordem)
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-amber-300 font-bold px-2 py-0.5 rounded border border-slate-600">
                    Art. 40 Convênio S/N 1970
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* Opção MEI */}
                  <div
                    onClick={() => setFiscalRegime('mei')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      fiscalRegime === 'mei'
                        ? 'border-amber-400 bg-amber-500/20 text-white shadow-sm'
                        : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-white text-xs">MEI (Isento NF-e p/ PF)</span>
                      <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded">
                        DECLARAÇÃO
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      Acompanha Declaração de Conteúdo emitida em seu nome como remetente. Sem exigência de emissão de NF-e para consumidor PF.
                    </p>
                  </div>

                  {/* Opção Simples Nacional / ME */}
                  <div
                    onClick={() => setFiscalRegime('simples')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      fiscalRegime === 'simples'
                        ? 'border-amber-400 bg-amber-500/20 text-white shadow-sm'
                        : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-white text-xs">Simples Nacional / ME</span>
                      <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">
                        NF-e 5.120
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      Operação com NF-e de Venda à Ordem (CFOP 5.120 / 6.120). A fábrica emite a NF-e de Remessa física (CFOP 5.923).
                    </p>
                  </div>
                </div>

                {fiscalRegime === 'simples' && (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-700 space-y-2 mt-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="text-[11px] font-bold text-amber-300">
                        Chave de Acesso da NF-e de Venda (44 dígitos numéricos)
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={informNfeLater}
                          onChange={(e) => setInformNfeLater(e.target.checked)}
                          className="rounded border-slate-600 text-amber-500 focus:ring-0"
                        />
                        <span>Informar chave depois da venda</span>
                      </label>
                    </div>

                    {!informNfeLater ? (
                      <input
                        type="text"
                        maxLength={44}
                        value={nfeKey}
                        onChange={(e) => setNfeKey(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex: 35261045109892000199550010000000011000000010 (44 dígitos)"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 font-bold focus:border-amber-400 focus:outline-none"
                      />
                    ) : (
                      <div className="bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30 text-[11px] text-amber-200">
                        ⚠️ <strong>Trava de Expedição Ativada:</strong> O pedido entrará na fila de produção, mas o despacho físico ficará bloqueado pela fábrica até a inclusão da Chave da NF-e para transporte seguro.
                      </div>
                    )}
                  </div>
                )}
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                        Upload da Etiqueta de Envio (PDF ou ZPL)
                        <span className="text-rose-500 font-extrabold text-[11px]">* Obrigatório</span>
                      </label>
                      {labelPdfFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setLabelPdfFile(null);
                            setLabelFileBase64(null);
                          }}
                          className="text-[11px] text-rose-400 hover:underline font-bold"
                        >
                          Remover / Trocar
                        </button>
                      )}
                    </div>
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center relative transition-all ${
                      labelPdfFile 
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-sm' 
                        : 'border-amber-500/60 hover:border-amber-500 bg-[var(--bg-surface)]'
                    }`}>
                      <input
                        type="file"
                        onChange={handleLabelUpload}
                        accept=".pdf,.zpl,.txt"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {labelPdfFile ? (
                        <div className="space-y-1">
                          <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-400 block truncate px-2">
                            Etiqueta anexada: {labelPdfFile}
                          </span>
                          <span className="text-[10px] text-emerald-300">
                            ✓ Arquivo pronto para impressão fabril. Você já pode avançar!
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <FileUp size={24} className="mx-auto text-amber-500 mb-0.5 animate-bounce" />
                          <span className="text-xs font-bold text-[var(--text-main)] block">
                            Clique ou arraste o PDF da etiqueta do marketplace
                          </span>
                          <span className="text-[10px] text-amber-500 font-medium block">
                            ⚠️ Anexo obrigatório para liberar a próxima etapa
                          </span>
                        </div>
                      )}
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

              {/* Garantia de Logística Cega & Embalagem Neutra */}
              <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs text-slate-300 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <strong className="text-white block text-xs">Garantia SMD de Logística Cega (Blind Shipping):</strong>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      Caixa e fitas 100% neutras. Remetente na etiqueta sempre como <strong className="text-amber-400">{currentUser?.name || "sua loja"}</strong>. Documento fiscal afixado no envelope canguru externo. Zero menções à fábrica.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-1 rounded-lg border border-emerald-500/30 shrink-0 hidden sm:block">
                  100% CEGO
                </span>
              </div>
            </div>
          ) : (
            /* Step 2: Payment Options (PIX 0% vs Mercado Pago +5%) */
            <div className="space-y-6 animate-fade-in">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Escolha o Método de Pagamento do Custo Fabril
              </span>

              {/* Payment Method Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Option 1: Carteira Pré-Paga (0% Fee - Débito Imediato) */}
                <div
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'wallet'
                      ? 'border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-500/20'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet size={16} /> Carteira Saldo
                    </span>
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                      IMEDIATO
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-[var(--text-main)] mb-1">
                    Saldo: R$ {(Number(walletBalance) || 0).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                    Débito automático instantâneo sem taxas e aprovação imediata.
                  </p>
                </div>

                {/* Option 2: Direct PIX (0% Fee) */}
                <div
                  onClick={() => setPaymentMethod('pix_direct')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'pix_direct'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <QrCode size={16} /> PIX Fábrica
                    </span>
                    <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      0% TAXA
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-[var(--text-main)] mb-1">
                    Copia e Cola
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                    Gera QR Code PIX para pagamento avulso deste pedido.
                  </p>
                </div>

                {/* Option 3: Mercado Pago PIX (+5% Surcharge) */}
                <div
                  onClick={() => setPaymentMethod('mercadopago')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'mercadopago'
                      ? 'border-sky-500 bg-sky-500/10 shadow-md ring-2 ring-sky-500/20'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-sky-500 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <QrCode size={16} /> PIX Mercado Pago
                    </span>
                    <span className="bg-amber-500/20 border border-amber-500/40 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-full">
                      +5% TAXA
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-[var(--text-main)] mb-1">
                    Copia e Cola & QR Code
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                    Pagamento PIX via Mercado Pago com taxa de processamento (+5%).
                  </p>
                </div>
              </div>

              {/* Payment Details Box */}
              {paymentMethod === 'wallet' && (
                <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 text-white rounded-2xl p-6 border border-amber-500/30 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="text-amber-400" size={20} />
                      <span className="font-extrabold text-sm text-white">Débito Instantâneo da Carteira</span>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/30">
                      0% Taxas Adicionais
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Total do Pedido Atacado:</span>
                      <span className="font-mono font-bold">R$ {finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Seu Saldo Disponível na Carteira:</span>
                      <span className="font-mono font-bold text-amber-400">R$ {(Number(walletBalance) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                      <span>Saldo Restante após o Débito:</span>
                      <span className={`font-mono ${walletBalance >= finalTotal ? 'text-emerald-400' : 'text-rose-400'}`}>
                        R$ {Math.max(0, (walletBalance - finalTotal)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {walletBalance >= finalTotal ? (
                    <div className="bg-emerald-500/15 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span>Saldo suficiente! O pedido será debitado e enviado imediatamente para a esteira fabril.</span>
                    </div>
                  ) : (
                    <div className="bg-rose-500/15 border border-rose-500/30 p-3.5 rounded-xl text-xs text-rose-300 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-rose-400">
                        <AlertTriangle size={16} className="shrink-0" />
                        <span>Saldo insuficiente na carteira (Faltam R$ {(finalTotal - walletBalance).toFixed(2)})</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Faça uma recarga rápida via PIX para liberar o pedido na hora:
                      </p>
                      {onOpenWallet && (
                        <button
                          type="button"
                          onClick={onOpenWallet}
                          className="btn-gold text-xs font-bold py-2 px-3 flex items-center gap-1.5 shadow"
                        >
                          <Plus size={14} /> Fazer Recarga Rápida via PIX na Carteira
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'pix_direct' && (
                <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/30 text-white rounded-2xl p-6 text-center space-y-4 shadow-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/30">
                    <QrCode size={14} /> PIX INSTANTÂNEO DIRETO PARA A FÁBRICA (0% TAXA)
                  </div>

                  {(() => {
                    const orderPixCode = generatePixPayload({
                      key: SMD_DROP_CNPJ,
                      beneficiary: SMD_DROP_BENEFICIARY,
                      amount: finalTotal,
                      txid: 'PED' + Date.now().toString().slice(-8)
                    });
                    const qrUrl = getQrCodeImageUrl(orderPixCode, 240);

                    return (
                      <div className="space-y-4">
                        {/* Real Scannable QR Code */}
                        <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl shadow-2xl border-4 border-emerald-500 flex flex-col items-center justify-center">
                          <img
                            src={qrUrl}
                            alt={`QR Code PIX CNPJ ${SMD_DROP_CNPJ_FORMATTED}`}
                            className="w-44 h-44 object-contain rounded-lg"
                          />
                          <span className="text-[9px] font-mono text-slate-950 font-black mt-0.5">
                            CNPJ: {SMD_DROP_CNPJ_FORMATTED}
                          </span>
                        </div>

                        <div>
                          <span className="text-xs text-slate-400 block font-medium">Valor Total da Fatura da Fábrica:</span>
                          <span className="text-3xl font-black text-emerald-400 font-['Outfit']">
                            R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* CNPJ Key Box */}
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between font-mono max-w-md mx-auto">
                          <div className="text-left">
                            <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Chave PIX (CNPJ)</span>
                            <span className="text-emerald-400 font-black">{SMD_DROP_CNPJ_FORMATTED}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(SMD_DROP_CNPJ);
                              showNotification(`Chave CNPJ ${SMD_DROP_CNPJ_FORMATTED} copiada!`);
                            }}
                            className="btn-gold text-[10px] font-black py-1 px-2.5 rounded shrink-0 shadow"
                          >
                            COPIAR CNPJ
                          </button>
                        </div>

                        {/* Full EMVCo Payload Box */}
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between font-mono max-w-md mx-auto">
                          <span className="truncate pr-2 text-[11px] text-slate-400">{orderPixCode}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(orderPixCode);
                              showNotification('Código PIX Copia e Cola copiado com sucesso!');
                            }}
                            className="btn-gold text-[10px] font-black py-1 px-2.5 rounded shrink-0 shadow"
                          >
                            COPIAR CÓDIGO
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {paymentMethod === 'mercadopago' && (
                <div className="bg-gradient-to-br from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/40 text-white rounded-2xl p-6 text-center space-y-4 shadow-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-xs font-black border border-sky-500/40">
                    <QrCode size={14} /> PIX MERCADO PAGO (+5% TAXA DO GATEWAY)
                  </div>

                  {/* Pricing Breakdown Box */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs max-w-md mx-auto space-y-1.5 text-left">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal Atacado + Frete:</span>
                      <span className="font-mono font-bold">R$ {baseTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-amber-400 font-semibold">
                      <span>Taxa Processamento Mercado Pago (+5%):</span>
                      <span className="font-mono font-bold">+ R$ {mercadoPagoFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
                      <span>Total Fatura PIX Mercado Pago:</span>
                      <span className="font-mono text-sky-400 text-base">R$ {finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {(() => {
                    const mpPixCode = generatePixPayload({
                      key: SMD_DROP_CNPJ,
                      beneficiary: "MERCADO PAGO SMD DROP",
                      amount: finalTotal,
                      txid: 'MP' + Date.now().toString().slice(-8)
                    });
                    const qrUrl = getQrCodeImageUrl(mpPixCode, 240);

                    return (
                      <div className="space-y-4">
                        {/* Real Scannable QR Code */}
                        <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl shadow-2xl border-4 border-sky-500 flex flex-col items-center justify-center">
                          <img
                            src={qrUrl}
                            alt="QR Code PIX Mercado Pago"
                            className="w-44 h-44 object-contain rounded-lg"
                          />
                          <span className="text-[9px] font-mono text-sky-950 font-black mt-0.5">
                            PIX MERCADO PAGO
                          </span>
                        </div>

                        <div>
                          <span className="text-xs text-slate-400 block font-medium">Valor Total PIX com Taxa (+5%):</span>
                          <span className="text-3xl font-black text-sky-400 font-['Outfit']">
                            R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* CNPJ Key Box */}
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between font-mono max-w-md mx-auto">
                          <div className="text-left">
                            <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Chave PIX (Fábrica / MP)</span>
                            <span className="text-sky-400 font-black">{SMD_DROP_CNPJ_FORMATTED}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(SMD_DROP_CNPJ);
                              showNotification(`Chave CNPJ ${SMD_DROP_CNPJ_FORMATTED} copiada!`);
                            }}
                            className="btn-gold text-[10px] font-black py-1 px-2.5 rounded shrink-0 shadow bg-gradient-to-r from-sky-500 to-amber-500 text-slate-950"
                          >
                            COPIAR CHAVE
                          </button>
                        </div>

                        {/* Full EMVCo Payload Box */}
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between font-mono max-w-md mx-auto">
                          <span className="truncate pr-2 text-[11px] text-slate-400">{mpPixCode}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(mpPixCode);
                              showNotification('Código PIX Mercado Pago Copia e Cola copiado com sucesso!');
                            }}
                            className="btn-gold text-[10px] font-black py-1 px-2.5 rounded shrink-0 shadow bg-gradient-to-r from-sky-500 to-amber-500 text-slate-950"
                          >
                            COPIAR CÓDIGO PIX MP
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                          ⚡ Escaneie o QR Code ou copie o código acima no app do seu banco ou Mercado Pago. Após realizar a transferência, clique no botão abaixo para confirmar e despachar seu pedido!
                        </p>
                      </div>
                    );
                  })()}
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
              <div className="flex items-center gap-3">
                {dispatchMode === 'marketplace_label' && !labelPdfFile && (
                  <span className="text-[11px] font-bold text-amber-500 hidden sm:inline-flex items-center gap-1 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/30">
                    <AlertTriangle size={14} className="shrink-0" /> Anexe a etiqueta para avançar
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  disabled={dispatchMode === 'marketplace_label' && !labelPdfFile}
                  className={`py-3 px-6 text-sm font-bold shadow-lg flex items-center gap-2 rounded-xl transition-all ${
                    dispatchMode === 'marketplace_label' && !labelPdfFile
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-75'
                      : 'btn-gold'
                  }`}
                  title={dispatchMode === 'marketplace_label' && !labelPdfFile ? 'Anexe a etiqueta de envio do marketplace para liberar' : ''}
                >
                  Avançar para Pagamento <ArrowRight size={16} />
                </button>
              </div>
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

              {paymentMethod === 'wallet' ? (
                <button
                  type="button"
                  disabled={walletBalance < finalTotal}
                  onClick={handleFinalizeOrder}
                  className={`py-3 px-8 text-sm font-bold shadow-lg flex items-center gap-2 ${
                    walletBalance >= finalTotal
                      ? 'btn-gold bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 hover:brightness-110'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed rounded-xl'
                  }`}
                >
                  <Zap size={18} /> Pagar R$ {finalTotal.toFixed(2)} com Saldo e Enviar à Fábrica
                </button>
              ) : paymentMethod === 'mercadopago' ? (
                <button
                  type="button"
                  onClick={handleFinalizeOrder}
                  className="btn-gold py-3 px-8 text-sm font-bold shadow-lg flex items-center gap-2 bg-gradient-to-r from-sky-500 via-amber-500 to-amber-600 text-slate-950 font-black hover:brightness-110"
                >
                  <CheckCircle2 size={18} /> Confirmar Pagamento PIX MP (R$ {finalTotal.toFixed(2)}) e Enviar à Fábrica
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalizeOrder}
                  className="btn-gold py-3 px-8 text-sm font-bold shadow-lg flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Confirmar Pagamento PIX Fábrica e Enviar à Fábrica
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
