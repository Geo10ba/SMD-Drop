/**
 * channelPricing.js
 * Motor de Precificação Real por Canal para Dropshipping & Revenda
 * Calcula Ponto de Equilíbrio (Break-Even), Preço Mínimo sem prejuízo e margem líquida real.
 */

export const SALES_CHANNELS = {
  ml_classic: {
    id: 'ml_classic',
    name: 'Mercado Livre Clássico',
    badge: 'ML Clássico',
    commissionPct: 14.0, // 14%
    fixedFeeUnder79: 6.00, // R$ 6,00 para produtos < R$ 79
    mandatoryFreeShippingThreshold: 79.00,
    estimatedSubsidizedShipping: 19.50, // Média Brasil com desconto Mercado Envios
    description: 'Comissão padrão de 14%. Pedidos < R$ 79 têm taxa fixa de R$ 6. Acima de R$ 79 o frete grátis é obrigatório pago pelo vendedor.'
  },
  ml_premium: {
    id: 'ml_premium',
    name: 'Mercado Livre Premium (10x Sem Juros)',
    badge: 'ML Premium',
    commissionPct: 19.0, // 19%
    fixedFeeUnder79: 6.00,
    mandatoryFreeShippingThreshold: 79.00,
    estimatedSubsidizedShipping: 19.50,
    description: 'Comissão de 19% com parcelamento em até 10x sem juros para o cliente final. Mais visibilidade.'
  },
  shopee_standard: {
    id: 'shopee_standard',
    name: 'Shopee Padrão',
    badge: 'Shopee',
    commissionPct: 14.0, // 14%
    fixedFeePerItem: 4.00, // R$ 4,00 por item
    maxCommissionCap: 100.00,
    description: 'Comissão de 14% + R$ 4,00 por item vendido.'
  },
  shopee_fge: {
    id: 'shopee_fge',
    name: 'Shopee Frete Grátis Extra (FGE)',
    badge: 'Shopee FGE',
    commissionPct: 20.0, // 14% comissão + 6% programa FGE
    fixedFeePerItem: 4.00,
    maxCommissionCap: 100.00,
    description: '20% (14% comissão + 6% Programa de Frete Grátis Extra) + R$ 4,00 fixa. Maior conversão com cupons da Shopee.'
  },
  amazon_br: {
    id: 'amazon_br',
    name: 'Amazon Brasil',
    badge: 'Amazon',
    commissionPct: 15.0,
    fixedFeePerItem: 2.00,
    description: 'Comissão de 15% na categoria de decoração/casa + R$ 2,00 por item.'
  },
  direct_sale: {
    id: 'direct_sale',
    name: 'Venda Direta / WhatsApp / Loja Própria',
    badge: 'WhatsApp / Direto',
    commissionPct: 3.99, // Taxa média gateway cartão/Pix
    fixedFeePerItem: 0.00,
    description: 'Venda direta para o cliente final sem comissão de marketplace. Apenas taxa de maquininha/gateway (aprox 3,99%).'
  }
};

export const TAX_REGIMES = [
  { id: 'mei', label: 'MEI (Isento / 0% sobre faturamento)', ratePct: 0.0 },
  { id: 'simples_faixa1', label: 'Simples Nacional - Anexo I (4,0%)', ratePct: 4.0 },
  { id: 'simples_faixa2', label: 'Simples Nacional - Faixa 2 (7,0%)', ratePct: 7.0 },
  { id: 'simples_faixa3', label: 'Simples Nacional - Faixa 3 (9,5%)', ratePct: 9.5 },
  { id: 'custom', label: 'Alíquota Personalizada (%)', ratePct: 5.0 }
];

/**
 * Calcula as taxas do canal para um determinado preço de venda
 */
export function getChannelFees(channelId, salePrice) {
  const channel = SALES_CHANNELS[channelId] || SALES_CHANNELS.ml_classic;
  const p = Math.max(0, Number(salePrice) || 0);

  let commissionAmount = 0;
  let fixedFee = 0;
  let shippingCost = 0;

  if (channelId === 'ml_classic' || channelId === 'ml_premium') {
    commissionAmount = (p * channel.commissionPct) / 100;
    if (p < channel.mandatoryFreeShippingThreshold) {
      fixedFee = channel.fixedFeeUnder79;
      shippingCost = 0;
    } else {
      fixedFee = 0;
      shippingCost = channel.estimatedSubsidizedShipping;
    }
  } else if (channelId === 'shopee_standard' || channelId === 'shopee_fge') {
    const rawComm = (p * channel.commissionPct) / 100;
    commissionAmount = Math.min(rawComm, channel.maxCommissionCap || 100);
    fixedFee = channel.fixedFeePerItem;
    shippingCost = 0;
  } else if (channelId === 'amazon_br') {
    commissionAmount = (p * channel.commissionPct) / 100;
    fixedFee = channel.fixedFeePerItem;
    shippingCost = 0;
  } else {
    // Venda Direta
    commissionAmount = (p * channel.commissionPct) / 100;
    fixedFee = channel.fixedFeePerItem || 0;
    shippingCost = 0;
  }

  const totalChannelFee = commissionAmount + fixedFee + shippingCost;
  return {
    commissionAmount,
    fixedFee,
    shippingCost,
    totalChannelFee
  };
}

/**
 * Calcula o DRE completo e o Lucro Líquido para um preço de venda praticado
 */
export function calculateRealProfit({
  wholesaleCost,
  salePrice,
  channelId = 'ml_classic',
  packagingCost = 0.00,
  taxRatePct = 0.0,
  returnLossPct = 0.0,
  adsAcosPct = 0.0
}) {
  const cost = Math.max(0, Number(wholesaleCost) || 0);
  const price = Math.max(0, Number(salePrice) || 0);
  const pkg = Math.max(0, Number(packagingCost) || 0);
  const taxPct = Math.max(0, Number(taxRatePct) || 0);
  const returnPct = Math.max(0, Number(returnLossPct) || 0);
  const adsPct = Math.max(0, Number(adsAcosPct) || 0);

  // 1. Taxas do Canal
  const { commissionAmount, fixedFee, shippingCost, totalChannelFee } = getChannelFees(channelId, price);

  // 2. Imposto sobre faturamento
  const taxAmount = (price * taxPct) / 100;

  // 3. Reserva para devoluções e avarias
  const returnReserveAmount = (price * returnPct) / 100;

  // 4. Anúncios / ACOS
  const adsAmount = (price * adsPct) / 100;

  // 5. Total de Deduções
  const totalDeductions = totalChannelFee + taxAmount + returnReserveAmount + adsAmount;

  // 6. Custo Operacional do Produto
  const totalProductCost = cost + pkg;

  // 7. Lucro Líquido Real
  const netProfit = price - totalProductCost - totalDeductions;
  const netMarginPct = price > 0 ? (netProfit / price) * 100 : 0;
  const markupOnCost = cost > 0 ? (netProfit / cost) * 100 : 0;

  return {
    salePrice: price,
    wholesaleCost: cost,
    packagingCost: pkg,
    commissionAmount,
    fixedFee,
    shippingCost,
    totalChannelFee,
    taxAmount,
    returnReserveAmount,
    adsAmount,
    totalDeductions,
    totalProductCost,
    netProfit,
    netMarginPct,
    markupOnCost,
    isLoss: netProfit < 0
  };
}

/**
 * Calcula o PONTO DE EQUILÍBRIO (Preço Mínimo para NÃO ter prejuízo: Lucro = 0)
 * e os preços sugeridos para metas de margem (15% e 30%).
 */
export function calculateBreakEvenAndSuggestions({
  wholesaleCost,
  channelId = 'ml_classic',
  packagingCost = 0.00,
  taxRatePct = 0.0,
  returnLossPct = 0.0,
  adsAcosPct = 0.0
}) {
  const cost = Math.max(0, Number(wholesaleCost) || 0);
  const pkg = Math.max(0, Number(packagingCost) || 0);
  const taxPct = Math.max(0, Number(taxRatePct) || 0);
  const returnPct = Math.max(0, Number(returnLossPct) || 0);
  const adsPct = Math.max(0, Number(adsAcosPct) || 0);
  const channel = SALES_CHANNELS[channelId] || SALES_CHANNELS.ml_classic;

  const totalBaseCost = cost + pkg;

  // Helper para resolver o preço dado um percentual de margem pretendida e custos fixos
  const solvePrice = (fixedExpense, targetMarginPct = 0) => {
    const totalRateFraction = (channel.commissionPct + taxPct + returnPct + adsPct + targetMarginPct) / 100;
    if (totalRateFraction >= 1) return 0;
    const denominator = 1 - totalRateFraction;
    return (totalBaseCost + fixedExpense) / denominator;
  };

  let minPriceBreakEven = 0;
  let priceCompetitive15 = 0;
  let priceLucrative30 = 0;

  if (channelId === 'ml_classic' || channelId === 'ml_premium') {
    // No Mercado Livre temos a descontinuidade dos R$ 79,00:
    // Cenário A: Preço < R$ 79 (Taxa fixa de R$ 6, frete R$ 0)
    const priceUnder79 = solvePrice(channel.fixedFeeUnder79, 0);
    // Cenário B: Preço >= R$ 79 (Taxa fixa R$ 0, frete subsidiado R$ 19.50)
    const priceOver79 = solvePrice(channel.estimatedSubsidizedShipping, 0);

    if (priceUnder79 < 79) {
      minPriceBreakEven = Math.round(priceUnder79 * 100) / 100;
    } else {
      minPriceBreakEven = Math.round(priceOver79 * 100) / 100;
    }

    // Para margem de 15%
    const p15Under = solvePrice(channel.fixedFeeUnder79, 15);
    const p15Over = solvePrice(channel.estimatedSubsidizedShipping, 15);
    priceCompetitive15 = p15Under < 79 ? p15Under : p15Over;

    // Para margem de 30%
    const p30Under = solvePrice(channel.fixedFeeUnder79, 30);
    const p30Over = solvePrice(channel.estimatedSubsidizedShipping, 30);
    priceLucrative30 = p30Under < 79 ? p30Under : p30Over;
  } else if (channelId === 'shopee_standard' || channelId === 'shopee_fge') {
    minPriceBreakEven = solvePrice(channel.fixedFeePerItem, 0);
    priceCompetitive15 = solvePrice(channel.fixedFeePerItem, 15);
    priceLucrative30 = solvePrice(channel.fixedFeePerItem, 30);
  } else if (channelId === 'amazon_br') {
    minPriceBreakEven = solvePrice(channel.fixedFeePerItem, 0);
    priceCompetitive15 = solvePrice(channel.fixedFeePerItem, 15);
    priceLucrative30 = solvePrice(channel.fixedFeePerItem, 30);
  } else {
    // Venda Direta
    minPriceBreakEven = solvePrice(0, 0);
    priceCompetitive15 = solvePrice(0, 15);
    priceLucrative30 = solvePrice(0, 30);
  }

  return {
    breakEvenMinPrice: Math.round(minPriceBreakEven * 100) / 100,
    competitivePrice15: Math.round(priceCompetitive15 * 100) / 100,
    lucrativePrice30: Math.round(priceLucrative30 * 100) / 100
  };
}
