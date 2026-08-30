import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, Percent, ArrowRight, ShieldCheck } from 'lucide-react';

export const ProfitCalculatorModal = ({ product, isOpen, onClose }) => {
  const [salePrice, setSalePrice] = useState(
    product ? (product.pricingType === 'custom_m2' ? product.suggestedPricePerM2 : product.suggestedRetailPrice) : 100
  );
  const [marketplace, setMarketplace] = useState('ml_classic'); // 'ml_classic', 'ml_premium', 'shopee'
  const [monthlyVolume, setMonthlyVolume] = useState(30);

  if (!isOpen || !product) return null;

  const cost = product.pricingType === 'custom_m2' ? product.pricePerM2 : product.wholesalePrice;

  // Fee calculation logic
  let marketplaceFeePercent = 0;
  let fixedFee = 0;

  if (marketplace === 'ml_classic') {
    marketplaceFeePercent = 0.14; // 14% Mercado Livre Clássico
    fixedFee = salePrice < 79 ? 6.00 : 0.00;
  } else if (marketplace === 'ml_premium') {
    marketplaceFeePercent = 0.19; // 19% Mercado Livre Premium (Parcelado Sem Juros)
    fixedFee = salePrice < 79 ? 6.00 : 0.00;
  } else if (marketplace === 'shopee') {
    marketplaceFeePercent = 0.14; // 14% Shopee Padrão
    fixedFee = 4.00;
  }

  const marketplaceFeeAmount = (salePrice * marketplaceFeePercent) + fixedFee;
  const netProfitPerUnit = salePrice - cost - marketplaceFeeAmount;
  const netMarginPercent = salePrice > 0 ? ((netProfitPerUnit / salePrice) * 100).toFixed(1) : "0.0";
  const projectedMonthlyProfit = netProfitPerUnit * monthlyVolume;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Calculator size={22} />
            </div>
            <div>
              <span className="badge-emerald uppercase tracking-wider text-[10px] mb-1 inline-block">
                SIMULADOR DE LUCRO LÍQUIDO NO MARKETPLACE
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                {product.title}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Inputs */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">
                  Selecione o Canal de Venda
                </label>
                <select
                  value={marketplace}
                  onChange={(e) => setMarketplace(e.target.value)}
                  className="input-field font-semibold"
                >
                  <option value="ml_classic">Mercado Livre (Anúncio Clássico - 14% + R$6)</option>
                  <option value="ml_premium">Mercado Livre (Anúncio Premium 6x S/Juros - 19% + R$6)</option>
                  <option value="shopee">Shopee Brasil (Comissão 14% + R$4)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">
                  Seu Preço de Venda Praticado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="input-field text-base font-extrabold text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">
                  Projeção de Vendas Mensais (Unidades)
                </label>
                <input
                  type="number"
                  min="1"
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                  className="input-field font-bold"
                />
              </div>

              <div className="bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)] space-y-1.5 text-[11px] text-[var(--text-muted)]">
                <div className="flex justify-between">
                  <span>Custo Atacado de Fábrica:</span>
                  <span className="font-mono font-bold text-[var(--text-main)]">R$ {cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxas Retidas do Marketplace:</span>
                  <span className="font-mono font-bold text-red-500">- R$ {marketplaceFeeAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Profit Results Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  <TrendingUp size={15} /> Resultado da Simulação
                </span>

                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-xs text-slate-400 block font-medium">Lucro Líquido Real por Unidade:</span>
                  <span className={`text-3xl font-extrabold font-['Outfit'] ${netProfitPerUnit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    R$ {netProfitPerUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-emerald-300 block font-semibold">
                    Margem Líquida: {netMarginPercent}% sobre a venda
                  </span>
                </div>

                <div className="bg-emerald-950/60 p-4 rounded-xl border border-emerald-500/30 space-y-1">
                  <span className="text-xs text-emerald-300 block font-medium">Projeção Mensal com {monthlyVolume} vendas:</span>
                  <span className="text-2xl font-extrabold text-emerald-400 font-['Outfit']">
                    + R$ {projectedMonthlyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-700">
                *Cálculo já desconta a taxa de envio grátis do marketplace quando aplicável.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
