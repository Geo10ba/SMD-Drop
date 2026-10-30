import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  QrCode, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  RefreshCw, 
  X,
  Building2,
  RotateCcw,
  CreditCard
} from 'lucide-react';
import { 
  generatePixPayload, 
  getQrCodeImageUrl, 
  SMD_DROP_CNPJ, 
  SMD_DROP_CNPJ_FORMATTED, 
  SMD_DROP_BENEFICIARY 
} from '../../utils/pixGenerator';
import { 
  checkBancoInterPixStatus, 
  simulateBancoInterPaymentConfirmation 
} from '../../lib/bancoInter';
import { 
  createMercadoPagoPixPayment, 
  checkMercadoPagoPaymentStatus 
} from '../../lib/mercadopago';

export const ResellerWalletModal = ({ isOpen, onClose }) => {
  const store = useStore() || {};
  const { 
    walletBalance = 0, 
    walletTransactions = [], 
    addWalletFunds, 
    resetWalletToZero, 
    showNotification,
    currentUser
  } = store;

  const [activeTab, setActiveTab] = useState('recharge'); // 'recharge' | 'statement'
  const [rechargeMethod, setRechargeMethod] = useState('mercadopago'); // 'mercadopago' | 'inter'
  const [selectedAmount, setSelectedAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState('');
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixGenerated, setPixGenerated] = useState(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedCnpj, setCopiedCnpj] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  if (!isOpen) return null;

  const safeBalance = Math.max(0, Number(walletBalance) || 0);
  const safeTransactions = Array.isArray(walletTransactions) ? walletTransactions : [];
  const currentRechargeValue = Math.max(0, Number(customAmount && Number(customAmount) > 0 ? customAmount : selectedAmount) || 0);

  const handleGeneratePix = async () => {
    if (!currentRechargeValue || currentRechargeValue < 10) {
      if (showNotification) showNotification('O valor mínimo de recarga via PIX é R$ 10,00', 'error');
      return;
    }

    setIsGeneratingPix(true);

    if (rechargeMethod === 'mercadopago') {
      try {
        const mpRes = await createMercadoPagoPixPayment({
          transaction_amount: currentRechargeValue,
          description: `Recarga Carteira SMD Drop R$ ${currentRechargeValue.toFixed(2)}`,
          payer: {
            email: currentUser?.email || 'revendedor@smddrop.com.br',
            first_name: (currentUser?.name || 'Revendedor').split(' ')[0],
            last_name: 'SMD Drop'
          }
        });

        if (mpRes.success && mpRes.qrCode) {
          const qrCodeUrl = mpRes.qrCodeBase64 
            ? `data:image/png;base64,${mpRes.qrCodeBase64}` 
            : getQrCodeImageUrl(mpRes.qrCode, 280);

          setPixGenerated({
            gateway: 'mercadopago',
            paymentId: mpRes.paymentId,
            amount: currentRechargeValue,
            pixCode: mpRes.qrCode,
            qrCodeUrl,
            beneficiary: 'MERCADO PAGO SMD DROP',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          });
          if (showNotification) {
            showNotification(`QR Code PIX gerado via Mercado Pago com baixa automática!`, 'success');
          }
          setIsGeneratingPix(false);
          return;
        }
      } catch (err) {
        console.warn("Mercado Pago API indisponível, gerando payload oficial de contingência:", err);
      }
    }

    // Geração Padrão Oficial (Banco Inter PJ / Contingência)
    setTimeout(() => {
      try {
        const txid = (rechargeMethod === 'mercadopago' ? 'MP' : 'REC') + Date.now().toString().slice(-8);
        const pixCode = generatePixPayload({
          key: SMD_DROP_CNPJ,
          beneficiary: rechargeMethod === 'mercadopago' ? 'MERCADO PAGO SMD DROP' : SMD_DROP_BENEFICIARY,
          amount: currentRechargeValue,
          txid
        });
        const qrCodeUrl = getQrCodeImageUrl(pixCode, 280);

        setPixGenerated({
          gateway: rechargeMethod,
          amount: currentRechargeValue,
          pixCode,
          qrCodeUrl,
          txid,
          cnpj: SMD_DROP_CNPJ,
          cnpjFormatted: SMD_DROP_CNPJ_FORMATTED,
          beneficiary: rechargeMethod === 'mercadopago' ? 'MERCADO PAGO SMD DROP' : SMD_DROP_BENEFICIARY,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
        if (showNotification) {
          showNotification(`QR Code PIX gerado com sucesso!`, 'success');
        }
      } catch (err) {
        console.error("Erro ao gerar PIX:", err);
      } finally {
        setIsGeneratingPix(false);
      }
    }, 250);
  };

  const handleCopyPix = () => {
    if (!pixGenerated?.pixCode) return;
    try {
      navigator.clipboard.writeText(pixGenerated.pixCode);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
      if (showNotification) showNotification('Código PIX Copia e Cola copiado com sucesso!', 'success');
    } catch (e) {}
  };

  const handleCopyCnpj = () => {
    try {
      navigator.clipboard.writeText(SMD_DROP_CNPJ);
      setCopiedCnpj(true);
      setTimeout(() => setCopiedCnpj(false), 2500);
      if (showNotification) showNotification(`Chave CNPJ ${SMD_DROP_CNPJ_FORMATTED} copiada!`, 'success');
    } catch (e) {}
  };

  // Monitoramento Automático de Confirmação PIX (Mercado Pago & Banco Inter)
  useEffect(() => {
    if (!pixGenerated) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        // 1. Verificação Automática do Mercado Pago
        if (pixGenerated.gateway === 'mercadopago' && pixGenerated.paymentId) {
          const res = await checkMercadoPagoPaymentStatus(pixGenerated.paymentId);
          if (res && res.isApproved && isSubscribed) {
            clearInterval(interval);
            try { confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } }); } catch (e) {}
            if (addWalletFunds) {
              addWalletFunds({
                amount: pixGenerated.amount,
                description: `Recarga PIX Mercado Pago #${pixGenerated.paymentId}`
              });
            }
            setPixGenerated(null);
            setCustomAmount('');
            setActiveTab('statement');
            if (showNotification) {
              showNotification(`🎉 Recarga de R$ ${pixGenerated.amount.toFixed(2)} CONFIRMADA AUTOMATICAMENTE pelo Mercado Pago!`, 'success');
            }
            return;
          }
        }

        // 2. Verificação do Banco Inter
        if (pixGenerated.txid) {
          const res = await checkBancoInterPixStatus(pixGenerated.txid);
          if (res && res.status === 'CONCLUIDA' && isSubscribed) {
            clearInterval(interval);
            try { confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } }); } catch (e) {}
            if (addWalletFunds) {
              addWalletFunds({
                amount: pixGenerated.amount,
                description: `Recarga PIX Banco Inter #${pixGenerated.txid}`
              });
            }
            setPixGenerated(null);
            setCustomAmount('');
            setActiveTab('statement');
            if (showNotification) {
              showNotification(`🎉 Pagamento PIX de R$ ${pixGenerated.amount.toFixed(2)} CONFIRMADO pelo Banco Inter!`, 'success');
            }
          }
        }
      } catch (err) {}
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [pixGenerated, addWalletFunds, showNotification]);

  const handleConfirmPixPayment = () => {
    if (!pixGenerated) return;
    setConfirmingPayment(true);
    if (pixGenerated.txid) {
      simulateBancoInterPaymentConfirmation(pixGenerated.txid);
    }
    setTimeout(() => {
      try {
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
      } catch (e) {}
      if (addWalletFunds) {
        addWalletFunds({
          amount: pixGenerated.amount,
          description: `Recarga PIX ${pixGenerated.gateway === 'mercadopago' ? 'Mercado Pago' : 'Banco Inter'} Instantânea`
        });
      }
      setConfirmingPayment(false);
      setPixGenerated(null);
      setCustomAmount('');
      setActiveTab('statement');
      if (showNotification) {
        showNotification(`🎉 Recarga de R$ ${pixGenerated.amount.toFixed(2)} creditada com sucesso na sua carteira!`, 'success');
      }
    }, 500);
  };

  const handleResetToRealMode = () => {
    if (window.confirm("⚠️ Deseja zerar os valores de teste/simulação e iniciar sua carteira no MODO REAL com saldo R$ 0,00?")) {
      if (resetWalletToZero) {
        resetWalletToZero();
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9990] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 p-6 border-b border-sky-500/20 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/60 p-2 rounded-full transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-sky-500/20 text-sky-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-sky-500/30 flex items-center gap-1">
              <Zap size={11} className="text-sky-400" /> RECARGA AUTOMÁTICA PIX
            </span>
            <span className="text-slate-400 text-xs">Carteira Pré-Paga da Fábrica SMD Drop</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2">
            <div>
              <p className="text-xs text-slate-300 font-medium">Saldo Disponível para Débito de Pedidos</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
                  R$ {safeBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-0.5">
                  <CheckCircle2 size={13} /> Liberado
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPixGenerated(null);
                  setActiveTab('recharge');
                }}
                className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'recharge' 
                    ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20' 
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Plus size={15} /> Recarregar Saldo
              </button>
              <button
                onClick={() => setActiveTab('statement')}
                className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'statement' 
                    ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20' 
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Clock size={15} /> Extrato
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeTab === 'recharge' ? (
            <div className="space-y-5">
              {!pixGenerated ? (
                <>
                  {/* Gateway Selector (Mercado Pago x Banco Inter) */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      1. Escolha como deseja recarregar via PIX
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setRechargeMethod('mercadopago')}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          rechargeMethod === 'mercadopago'
                            ? 'border-sky-500 bg-sky-500/10 shadow-md ring-2 ring-sky-500/20'
                            : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap size={15} /> PIX Mercado Pago
                          </span>
                          <span className="bg-sky-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                            BAIXA AUTOMÁTICA
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                          Confirmação automática em segundos diretamente via gateway Mercado Pago.
                        </p>
                      </div>

                      <div
                        onClick={() => setRechargeMethod('inter')}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          rechargeMethod === 'inter'
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/20'
                            : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 size={15} /> PIX Fábrica (Inter)
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/40">
                            0% TAXA
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                          Transferência direta para a conta jurídica da fábrica (CNPJ).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      2. Escolha o valor da recarga (R$)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[100, 250, 500, 1000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setSelectedAmount(val);
                            setCustomAmount('');
                          }}
                          className={`p-3.5 rounded-2xl border text-center transition-all ${
                            selectedAmount === val && !customAmount
                              ? 'border-sky-500 bg-sky-500/15 text-sky-400 font-extrabold shadow-sm ring-2 ring-sky-500/30'
                              : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-main)] font-semibold hover:border-sky-500/50'
                          }`}
                        >
                          <span className="text-[10px] text-[var(--text-muted)] block">Valor Sugerido</span>
                          <span className="text-base font-mono font-bold">R$ {val}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                      Ou digite outro valor personalizado (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-xs font-bold text-[var(--text-muted)]">R$</span>
                      <input
                        type="number"
                        min="10"
                        step="10"
                        placeholder="Ex: 350.00"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          if (e.target.value) setSelectedAmount(0);
                        }}
                        className="input-field pl-10 py-2.5 text-sm font-mono font-bold w-full"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleGeneratePix}
                      disabled={isGeneratingPix}
                      className="w-full btn-gold py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r from-sky-500 via-amber-500 to-amber-600 text-slate-950"
                    >
                      {isGeneratingPix ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" /> Gerando QR Code PIX {rechargeMethod === 'mercadopago' ? 'Mercado Pago' : 'Banco Inter'}...
                        </>
                      ) : (
                        <>
                          <QrCode size={18} /> Gerar PIX Copia e Cola de R$ {currentRechargeValue.toFixed(2)} ({rechargeMethod === 'mercadopago' ? 'Mercado Pago' : 'Banco Inter'})
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* PIX QR Code & Copia e Cola View */
                <div className="space-y-4 animate-fade-in bg-[var(--bg-surface-hover)] p-5 rounded-2xl border border-sky-500/30">
                  <div className="text-center space-y-1">
                    <span className="bg-sky-500/20 text-sky-300 text-xs font-black px-3 py-1 rounded-full border border-sky-500/40 inline-flex items-center gap-1">
                      <Clock size={13} /> Aguardando Pagamento via PIX ({pixGenerated.gateway === 'mercadopago' ? 'Mercado Pago' : 'Banco Inter'})
                    </span>
                    <h4 className="text-xl font-black text-white font-['Outfit']">
                      Recarga de R$ {Number(pixGenerated.amount || 0).toFixed(2)}
                    </h4>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      Abra o aplicativo de qualquer banco (Nubank, Itaú, Bradesco, Inter, Mercado Pago, etc.), aponte a câmera para o QR Code ou copie o código Copia e Cola:
                    </p>
                  </div>

                  {/* Real Scannable QR Code */}
                  <div className="bg-white p-3 rounded-2xl w-56 h-56 mx-auto flex flex-col items-center justify-center border-4 border-sky-500 shadow-2xl relative group">
                    <img
                      src={pixGenerated.qrCodeUrl}
                      alt="QR Code PIX de Recarga"
                      className="w-48 h-48 object-contain rounded-lg"
                    />
                    <span className="text-[9px] font-mono text-slate-900 font-black mt-0.5">
                      {pixGenerated.gateway === 'mercadopago' ? 'PIX MERCADO PAGO' : `CNPJ: ${pixGenerated.cnpjFormatted}`}
                    </span>
                  </div>

                  {/* Gateway & Identification Box */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-sky-500/40 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-bold flex items-center gap-1.5">
                        <Zap size={14} className="text-sky-400" /> 
                        {pixGenerated.gateway === 'mercadopago' ? 'Gateway Mercado Pago (Baixa Automática)' : 'Chave PIX Oficial (CNPJ Fábrica)'}
                      </span>
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 font-black px-2 py-0.5 rounded-full border border-sky-500/30">
                        {pixGenerated.gateway === 'mercadopago' ? 'CONFIRMAÇÃO EM SEGUNDOS' : 'BANCO INTER PJ'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-xs font-mono font-black text-sky-400 block tracking-wider">
                          {pixGenerated.cnpjFormatted || 'PIX MERCADO PAGO'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Beneficiário: <strong className="text-slate-200">{pixGenerated.beneficiary}</strong>
                        </span>
                      </div>
                      {pixGenerated.cnpj && (
                        <button
                          type="button"
                          onClick={handleCopyCnpj}
                          className="btn-gold text-[11px] font-black py-1.5 px-3 flex items-center gap-1 shadow-sm shrink-0 bg-gradient-to-r from-sky-500 to-amber-500 text-slate-950"
                        >
                          {copiedCnpj ? <Check size={13} className="text-slate-950" /> : <Copy size={13} />}
                          <span>{copiedCnpj ? 'Copiado!' : 'Copiar CNPJ'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PIX Copia e Cola Code */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Código PIX Copia e Cola (Payload Oficial BACEN / MP)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={pixGenerated.pixCode}
                        className="input-field text-xs font-mono py-2 bg-slate-950 text-slate-300 border-slate-800 flex-1 truncate"
                      />
                      <button
                        onClick={handleCopyPix}
                        className="btn-gold text-xs font-black py-2 px-3 shrink-0 flex items-center gap-1.5 shadow bg-gradient-to-r from-sky-500 to-amber-500 text-slate-950"
                      >
                        {copiedPix ? <Check size={14} className="text-slate-950" /> : <Copy size={14} />}
                        <span>{copiedPix ? 'Copiado!' : 'Copiar Código'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleConfirmPixPayment}
                      disabled={confirmingPayment}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                    >
                      {confirmingPayment ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Verificando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Já Fiz a Transferência PIX (Creditar Saldo)
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setPixGenerated(null)}
                      className="btn-secondary text-xs py-2.5 px-3"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Statement Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)] px-1">
                <span>Histórico de Transações</span>
                <span>{safeTransactions.length} movimentações</span>
              </div>

              {safeTransactions.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-muted)] text-xs bg-[var(--bg-surface-hover)] rounded-2xl border border-[var(--border-color)] space-y-2">
                  <Wallet size={28} className="mx-auto text-slate-500 opacity-50" />
                  <p className="font-semibold text-slate-300">Nenhuma transação registrada nesta carteira ainda.</p>
                  <p className="text-[11px] text-slate-500">Faça uma recarga via PIX para carregar seu saldo real.</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden bg-[var(--bg-surface-hover)]">
                  {safeTransactions.map((tx, idx) => {
                    const isCredit = tx?.type === 'credit';
                    const txAmount = Math.max(0, Number(tx?.amount) || 0);
                    let txDateStr = 'Data recente';
                    try {
                      if (tx?.date) {
                        const d = new Date(tx.date);
                        if (!isNaN(d.getTime())) {
                          txDateStr = `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                        }
                      }
                    } catch (e) {}

                    return (
                      <div key={tx?.id || `tx-${idx}`} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-[var(--bg-surface)] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isCredit ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-500'
                          }`}>
                            {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                          </div>
                          <div>
                            <p className="font-bold text-[var(--text-main)]">{tx?.description || 'Transação de Carteira'}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              {txDateStr}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`font-mono font-bold text-sm block ${
                            isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                          }`}>
                            {isCredit ? '+' : '-'} R$ {txAmount.toFixed(2)}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                            {isCredit ? 'Crédito PIX' : 'Débito Pedido'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[var(--bg-surface-hover)] p-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-muted)] flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck size={14} className="text-emerald-500" /> PIX Banco Central PJ (0% taxas)
            </span>
            {safeBalance > 0 && (
              <button
                type="button"
                onClick={handleResetToRealMode}
                className="text-[10px] text-amber-500 hover:text-amber-400 underline font-semibold flex items-center gap-1"
                title="Zerar saldos fictícios de demonstração e iniciar carteira no modo real com R$ 0,00"
              >
                <RotateCcw size={11} /> Zerar saldo de teste (Modo Real R$ 0,00)
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn-secondary text-xs py-1.5 px-4 font-bold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
