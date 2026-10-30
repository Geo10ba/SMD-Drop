import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Percent, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShoppingBag,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Save,
  Check,
  PackageCheck
} from 'lucide-react';
import { 
  SALES_CHANNELS, 
  TAX_REGIMES, 
  calculateRealProfit, 
  calculateBreakEvenAndSuggestions 
} from '../../utils/channelPricing';

export const ProfitCalculatorModal = ({ product, isOpen, onClose, onApplyPrice }) => {
  if (!isOpen || !product) return null;

  const cost = Number(
    product.pricingType === 'custom_m2' 
      ? (product.pricePerM2 || 180) 
      : (product.wholesalePrice || 28)
  );

  const initialSalePrice = Number(
    product.pricingType === 'custom_m2'
      ? (product.suggestedPricePerM2 || 380)
      : (product.suggestedRetailPrice || cost * 2.2)
  );

  const [channelId, setChannelId] = useState('ml_classic');
  const [salePrice, setSalePrice] = useState(initialSalePrice);
  const [monthlyVolume, setMonthlyVolume] = useState(30);

  // Operational cost parameters (Default: Dropshipping SMD where factory covers packaging & MEI tax = 0)
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const [taxRegimeId, setTaxRegimeId] = useState('mei'); // MEI is default (0% tax)
  const [customTaxRate, setCustomTaxRate] = useState(0.0);
  const [packagingCost, setPackagingCost] = useState(0.00); // R$ 0.00 - Factory does and includes packaging!
  const [returnLossPct, setReturnLossPct] = useState(0.0);
  const [adsAcosPct, setAdsAcosPct] = useState(0.0);

  // Active tax rate
  const activeTaxRate = taxRegimeId === 'custom' 
    ? Number(customTaxRate) 
    : (TAX_REGIMES.find(r => r.id === taxRegimeId)?.ratePct ?? 0.0);

  // Calculations
  const breakEvenData = useMemo(() => {
    return calculateBreakEvenAndSuggestions({
      wholesaleCost: cost,
      channelId,
      packagingCost: Number(packagingCost),
      taxRatePct: activeTaxRate,
      returnLossPct: Number(returnLossPct),
      adsAcosPct: Number(adsAcosPct)
    });
  }, [cost, channelId, packagingCost, activeTaxRate, returnLossPct, adsAcosPct]);

  const profitResult = useMemo(() => {
    return calculateRealProfit({
      wholesaleCost: cost,
      salePrice: Number(salePrice),
      channelId,
      packagingCost: Number(packagingCost),
      taxRatePct: activeTaxRate,
      returnLossPct: Number(returnLossPct),
      adsAcosPct: Number(adsAcosPct)
    });
  }, [cost, salePrice, channelId, packagingCost, activeTaxRate, returnLossPct, adsAcosPct]);

  const projectedMonthlyProfit = profitResult.netProfit * monthlyVolume;

  const handleApplyToCatalog = () => {
    if (onApplyPrice) {
      onApplyPrice(product.id, Number(salePrice));
    }
    onClose();
  };

  const channel = SALES_CHANNELS[channelId] || SALES_CHANNELS.ml_classic;

  return createPortal(
    <div className="fixed inset-0 z-[9990] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col p-5 sm:p-6 shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Calculator size={22} />
            </div>
            <div>
              <span className="badge-emerald uppercase tracking-wider text-[10px] mb-1 inline-block">
                PRECIFICAÇÃO REAL POR CANAL • PONTO DE EQUILÍBRIO & MARGEM LÍQUIDA
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit'] flex items-center gap-2">
                {product.title}
                <span className="text-xs bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  Atacado Fábrica: R$ {cost.toFixed(2)}
                </span>
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5 text-xs">
          
          {/* Dynamic Warning Alert: Loss vs Profit */}
          {profitResult.isLoss ? (
            <div className="bg-red-500/15 border-2 border-red-500/50 p-3.5 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-pulse">
              <AlertTriangle size={26} className="shrink-0 text-red-500" />
              <div className="flex-1">
                <span className="font-black uppercase text-[12px] block">
                  🚨 ALERTA DE PREJUÍZO: Você pagará para trabalhar neste canal!
                </span>
                <p className="text-[11px] leading-tight mt-0.5 text-slate-200">
                  Ao vender por <strong>R$ {profitResult.salePrice.toFixed(2)}</strong>, você terá um prejuízo de <strong className="underline text-red-400">R$ {Math.abs(profitResult.netProfit).toFixed(2)} por unidade</strong> após descontar as taxas do canal e o atacado da fábrica. O preço mínimo sem prejuízo é <strong className="text-white">R$ {breakEvenData.breakEvenMinPrice.toFixed(2)}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSalePrice(breakEvenData.breakEvenMinPrice)}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] py-2 px-3.5 rounded-xl shadow-lg whitespace-nowrap cursor-pointer transition-all"
              >
                Ajustar p/ R$ {breakEvenData.breakEvenMinPrice.toFixed(2)}
              </button>
            </div>
          ) : profitResult.netMarginPct < 15 ? (
            <div className="bg-amber-500/15 border border-amber-500/40 p-3 rounded-xl flex items-center gap-3 text-amber-500">
              <AlertTriangle size={20} className="shrink-0 text-amber-500" />
              <div className="flex-1">
                <span className="font-bold text-[11px] block">
                  ⚠️ Margem Baixa: Lucro de apenas {profitResult.netMarginPct.toFixed(1)}% (R$ {profitResult.netProfit.toFixed(2)} livre)
                </span>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Qualquer oscilação de taxa ou cupom pode zerar sua margem. Recomendamos mirar em pelo menos 15% a 20% de margem líquida.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/15 border border-emerald-500/40 p-3 rounded-xl flex items-center gap-3 text-emerald-400">
              <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
              <div>
                <span className="font-bold text-[11px] block">
                  ✨ Margem Saudável e Segura: {profitResult.netMarginPct.toFixed(1)}% Livre ({profitResult.markupOnCost.toFixed(0)}% sobre o atacado)
                </span>
                <p className="text-[10px] text-slate-300">
                  Preço bem estruturado! Cobre todas as tarifas do marketplace e o atacado da fábrica com lucro garantido no seu bolso.
                </p>
              </div>
            </div>
          )}

          {/* 3 Instant Pre-Calculated Recommendations */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider block">
              Sugestões Calculadas Automaticamente para {channel.name}:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Card 1: Ponto de Equilíbrio */}
              <div 
                onClick={() => setSalePrice(breakEvenData.breakEvenMinPrice)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  salePrice === breakEvenData.breakEvenMinPrice
                    ? 'bg-red-500/15 border-red-500 shadow-md ring-2 ring-red-500/30'
                    : 'bg-[var(--bg-surface-hover)] border-[var(--border-color)] hover:border-red-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-red-400 font-bold mb-1">
                  <span>🔴 Preço Mínimo (Zero Prejuízo)</span>
                  <span>Margem 0%</span>
                </div>
                <div className="font-mono text-lg font-black text-[var(--text-main)]">
                  R$ {breakEvenData.breakEvenMinPrice.toFixed(2)}
                </div>
                <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">
                  Cobre exatamente o atacado da fábrica e tarifas do canal.
                </span>
              </div>

              {/* Card 2: Competitivo 15% */}
              <div 
                onClick={() => setSalePrice(breakEvenData.competitivePrice15)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  salePrice === breakEvenData.competitivePrice15
                    ? 'bg-amber-500/15 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-[var(--bg-surface-hover)] border-[var(--border-color)] hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mb-1">
                  <span>🟡 Preço Competitivo</span>
                  <span>Margem 15%</span>
                </div>
                <div className="font-mono text-lg font-black text-amber-500">
                  R$ {breakEvenData.competitivePrice15.toFixed(2)}
                </div>
                <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">
                  Excelente para ganhar tração e Buy Box.
                </span>
              </div>

              {/* Card 3: Lucrativo 30% */}
              <div 
                onClick={() => setSalePrice(breakEvenData.lucrativePrice30)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  salePrice === breakEvenData.lucrativePrice30
                    ? 'bg-emerald-500/15 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-[var(--bg-surface-hover)] border-[var(--border-color)] hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold mb-1">
                  <span>🟢 Preço Lucrativo Recomendado</span>
                  <span>Margem 30%</span>
                </div>
                <div className="font-mono text-lg font-black text-emerald-500">
                  R$ {breakEvenData.lucrativePrice30.toFixed(2)}
                </div>
                <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">
                  Lucro substancial livre em cada pedido.
                </span>
              </div>
            </div>
          </div>

          {/* Main Grid: Parameters vs Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Left Column: Interactive Inputs */}
            <div className="space-y-3.5">
              
              {/* Channel Selector */}
              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">
                  1. Canal de Venda / Marketplace
                </label>
                <select
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-2.5 rounded-xl font-bold text-xs text-[var(--text-main)] focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {Object.values(SALES_CHANNELS).map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                  {channel.description}
                </span>
              </div>

              {/* Sale Price Input */}
              <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)] space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-extrabold text-[var(--text-main)] uppercase text-[11px]">
                    2. Preço de Venda Praticado (R$)
                  </label>
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">
                    Mínimo: R$ {breakEvenData.breakEvenMinPrice.toFixed(2)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-base font-bold text-[var(--text-muted)]">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className={`w-full bg-[var(--bg-surface)] border p-2.5 pl-10 rounded-xl text-xl font-extrabold font-mono focus:outline-none ${
                      profitResult.isLoss 
                        ? 'border-red-500 text-red-500 focus:border-red-600' 
                        : 'border-emerald-500/50 text-emerald-500 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Volume Projection */}
              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">
                  3. Volume Previsto de Vendas (Unidades/mês)
                </label>
                <input
                  type="number"
                  min="1"
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-2.5 rounded-xl font-mono text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Factory Packaging Banner */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <PackageCheck size={20} className="shrink-0 text-emerald-500" />
                <div className="text-[11px] leading-tight">
                  <strong className="block font-bold">Embalagem & Expedição 100% Custeada pela Fábrica</strong>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    A fábrica SMD Drop embala em caixa neutra, plástico bolha, fita e cola a sua etiqueta. O revendedor paga zero de custo extra por embalagem.
                  </span>
                </div>
              </div>

              {/* Collapsible Advanced Parameters */}
              <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedParams(!showAdvancedParams)}
                  className="w-full p-2.5 bg-[var(--bg-surface-hover)] flex items-center justify-between font-bold text-[11px] text-[var(--text-main)] hover:bg-[var(--border-color)]/30 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders size={14} className="text-amber-500" /> Parâmetros Opcionais (Imposto Simples, Tráfego Pago)
                  </span>
                  {showAdvancedParams ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showAdvancedParams && (
                  <div className="p-3 bg-[var(--bg-surface)] space-y-3 border-t border-[var(--border-color)] animate-fade-in">
                    <div>
                      <label className="block font-bold text-[10px] text-[var(--text-muted)] uppercase mb-1">
                        Regime Tributário / Imposto de Venda
                      </label>
                      <select
                        value={taxRegimeId}
                        onChange={(e) => setTaxRegimeId(e.target.value)}
                        className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-1.5 rounded-lg text-xs font-semibold text-[var(--text-main)]"
                      >
                        {TAX_REGIMES.map((r) => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    {taxRegimeId === 'custom' && (
                      <div>
                        <label className="block font-bold text-[10px] text-[var(--text-muted)] uppercase mb-1">
                          Alíquota Efetiva de Imposto (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={customTaxRate}
                          onChange={(e) => setCustomTaxRate(e.target.value)}
                          className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-1.5 rounded-lg font-mono text-xs"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-[10px] text-[var(--text-muted)] uppercase mb-1">
                          Devoluções / Perdas (%)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={returnLossPct}
                          onChange={(e) => setReturnLossPct(e.target.value)}
                          className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-1.5 rounded-lg font-mono text-xs"
                          placeholder="0.0"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[10px] text-[var(--text-muted)] uppercase mb-1">
                          Tráfego Pago / Anúncios ADS (%)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={adsAcosPct}
                          onChange={(e) => setAdsAcosPct(e.target.value)}
                          className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-1.5 rounded-lg font-mono text-xs"
                          placeholder="0.0"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: High-Contrast DRE & Net Profit Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xl space-y-4 border-2 border-slate-700">
              
              {/* Top Big Result */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingUp size={16} /> DRE da Venda por Unidade
                  </span>
                  <span className="text-[11px] bg-slate-800 text-amber-300 border border-slate-600 px-2.5 py-0.5 rounded-lg font-bold">
                    {channel.badge}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 shadow-inner space-y-1">
                  <span className="text-[11px] text-slate-300 block font-bold uppercase tracking-wider">
                    Lucro Líquido Livre no Seu Bolso:
                  </span>
                  <div className="flex items-baseline gap-2.5">
                    <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                      profitResult.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      R$ {profitResult.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-sm font-extrabold ${
                      profitResult.netMarginPct >= 15 ? 'text-emerald-400' : profitResult.netMarginPct > 0 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      ({profitResult.netMarginPct.toFixed(1)}% líquido)
                    </span>
                  </div>
                </div>

                {/* High Contrast Breakdown List */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-700 space-y-2 text-xs">
                  
                  {/* Preço de Venda */}
                  <div className="flex justify-between items-center bg-slate-800/80 p-2 rounded-lg border border-slate-600">
                    <span className="text-white font-extrabold text-[12px]">Preço de Venda Bruto:</span>
                    <span className="font-mono font-black text-white text-sm">R$ {profitResult.salePrice.toFixed(2)}</span>
                  </div>

                  {/* Custo de Atacado Pago à Fábrica */}
                  <div className="flex justify-between items-center py-1 px-1 border-b border-slate-800">
                    <span className="text-white font-bold">(-) Custo Atacado Pago à Fábrica:</span>
                    <span className="font-mono font-black text-rose-300 text-xs">- R$ {profitResult.wholesaleCost.toFixed(2)}</span>
                  </div>

                  {/* Embalagem Custeada pela Fábrica */}
                  <div className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300">
                    <span className="font-bold flex items-center gap-1 text-[11px]">
                      <Check size={13} className="text-emerald-400" /> Caixa, Embalagem & Envio:
                    </span>
                    <span className="font-extrabold text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      R$ 0,00 (Feito pela Fábrica)
                    </span>
                  </div>

                  {/* Taxas do Canal */}
                  <div className="flex justify-between items-center py-1 px-1 border-b border-slate-800">
                    <span className="text-white font-bold">(-) Comissão do Canal ({channel.commissionPct}%):</span>
                    <span className="font-mono font-black text-rose-300 text-xs">- R$ {profitResult.commissionAmount.toFixed(2)}</span>
                  </div>

                  {profitResult.fixedFee > 0 && (
                    <div className="flex justify-between items-center py-1 px-1 border-b border-slate-800">
                      <span className="text-white font-bold">(-) Taxa Fixa por Pedido:</span>
                      <span className="font-mono font-black text-rose-300 text-xs">- R$ {profitResult.fixedFee.toFixed(2)}</span>
                    </div>
                  )}

                  {profitResult.shippingCost > 0 && (
                    <div className="flex justify-between items-center py-1 px-1 border-b border-slate-800">
                      <span className="text-white font-bold">(-) Frete Grátis Obrigatório (&gt; R$ 79):</span>
                      <span className="font-mono font-black text-rose-300 text-xs">- R$ {profitResult.shippingCost.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Imposto */}
                  <div className="flex justify-between items-center py-1 px-1 border-b border-slate-800">
                    <span className="text-white font-bold">
                      (-) Imposto da Nota ({activeTaxRate > 0 ? `${activeTaxRate}%` : 'MEI Isento'}):
                    </span>
                    <span className={`font-mono font-black text-xs ${activeTaxRate > 0 ? 'text-rose-300' : 'text-emerald-400'}`}>
                      {activeTaxRate > 0 ? `- R$ ${profitResult.taxAmount.toFixed(2)}` : 'R$ 0,00'}
                    </span>
                  </div>

                  {/* Custos Opcionais se > 0 */}
                  {profitResult.returnReserveAmount > 0 && (
                    <div className="flex justify-between items-center py-1 px-1 border-b border-slate-800">
                      <span className="text-white font-bold">(-) Reserva Devoluções ({returnLossPct}%):</span>
                      <span className="font-mono font-black text-rose-300 text-xs">- R$ {profitResult.returnReserveAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {profitResult.adsAmount > 0 && (
                    <div className="flex justify-between items-center py-1 px-1 border-b border-slate-800">
                      <span className="text-white font-bold">(-) Tráfego Pago / Anúncios ({adsAcosPct}%):</span>
                      <span className="font-mono font-black text-rose-300 text-xs">- R$ {profitResult.adsAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Monthly projection */}
                <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-300 uppercase font-black block">
                      Faturamento Projetado ({monthlyVolume} un/mês):
                    </span>
                    <span className="text-xs text-white font-mono font-bold">
                      R$ {(profitResult.salePrice * monthlyVolume).toFixed(2)} bruto
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-300 uppercase font-black block">
                      Lucro Líquido no Mês:
                    </span>
                    <span className={`text-base font-black font-mono ${
                      projectedMonthlyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {projectedMonthlyProfit >= 0 ? '+ ' : ''}R$ {projectedMonthlyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={handleApplyToCatalog}
                className="w-full btn-gold py-3 text-xs font-black flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                <Save size={16} /> Aplicar Preço de R$ {profitResult.salePrice.toFixed(2)} no Catálogo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
