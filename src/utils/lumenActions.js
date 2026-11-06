/**
 * lumenActions.js
 * Utilitários para Ações Executáveis do Assistente Lumen,
 * Calculadora Reversa de Lucro e Métricas Operacionais de Fábrica.
 */

import { SALES_CHANNELS } from './channelPricing';

/**
 * Faz o parsing de tags de ação embutidas na resposta do Lumen:
 * Exemplo: [[ACTION:ADD_TO_CART:p-123:Luminária Acrílico:1]]
 *          [[ACTION:UPDATE_ORDER_STATUS:ord-45:in_production:Mudar para Produção]]
 *          [[ACTION:NAVIGATE:factory:pedidos:Ir para Pedidos]]
 *          [[ACTION:GENERATE_COPY:p-123:Luminária Acrílico]]
 *          [[ACTION:CALCULATE_PRICE:35:40:shopee_fge]]
 *          [[ACTION:FACTORY_BRIEFING]]
 *          [[ACTION:TELEGRAM_NOTIFY:ord-45]]
 */
export function parseLumenActions(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    return { cleanText: '', actions: [] };
  }

  const actionRegex = /\[\[ACTION:([A-Z_]+)(?::([^\]]+))?\]\]/g;
  const actions = [];
  let match;

  while ((match = actionRegex.exec(rawContent)) !== null) {
    const type = match[1];
    const rawParams = match[2] ? match[2].split(':') : [];
    actions.push({
      raw: match[0],
      type,
      params: rawParams
    });
  }

  const cleanText = rawContent.replace(actionRegex, '').trim();

  return { cleanText, actions };
}

/**
 * Calculadora Reversa de Lucro:
 * Dado o custo de atacado e o lucro líquido que o revendedor quer por no bolso (em R$),
 * calcula exatamente o preço de venda necessário no canal desejado.
 */
export function calculateTargetProfitPrice({
  wholesaleCost = 0,
  desiredNetProfit = 0,
  channelId = 'shopee_fge',
  packagingCost = 2.00,
  taxRatePct = 0
}) {
  const cost = Math.max(0, Number(wholesaleCost) || 0);
  const targetProfit = Math.max(0, Number(desiredNetProfit) || 0);
  const pkg = Math.max(0, Number(packagingCost) || 0);
  const taxPct = Math.max(0, Number(taxRatePct) || 0);
  const channel = SALES_CHANNELS[channelId] || SALES_CHANNELS.shopee_fge;

  const baseNeeded = cost + pkg + targetProfit;

  // Função interna para resolver dada taxa fixa e frete
  const solve = (fixedFee, shipping) => {
    const ratePct = channel.commissionPct + taxPct;
    if (ratePct >= 100) return 0;
    const denominator = 1 - (ratePct / 100);
    return (baseNeeded + fixedFee + shipping) / denominator;
  };

  let finalPrice = 0;
  let fixedFeeApplied = 0;
  let shippingApplied = 0;

  if (channelId === 'ml_classic' || channelId === 'ml_premium') {
    const under79 = solve(channel.fixedFeeUnder79 || 6, 0);
    if (under79 < 79) {
      finalPrice = under79;
      fixedFeeApplied = channel.fixedFeeUnder79 || 6;
      shippingApplied = 0;
    } else {
      finalPrice = solve(0, channel.estimatedSubsidizedShipping || 19.50);
      fixedFeeApplied = 0;
      shippingApplied = channel.estimatedSubsidizedShipping || 19.50;
    }
  } else if (channelId === 'shopee_standard' || channelId === 'shopee_fge') {
    fixedFeeApplied = channel.fixedFeePerItem || 4.00;
    shippingApplied = 0;
    finalPrice = solve(fixedFeeApplied, shippingApplied);
  } else {
    fixedFeeApplied = channel.fixedFeePerItem || 0;
    shippingApplied = 0;
    finalPrice = solve(fixedFeeApplied, shippingApplied);
  }

  const roundedPrice = Math.round(finalPrice * 100) / 100;
  const channelCut = Math.round(((roundedPrice * channel.commissionPct / 100) + fixedFeeApplied + shippingApplied) * 100) / 100;
  const realProfit = Math.round((roundedPrice - cost - pkg - channelCut - ((roundedPrice * taxPct) / 100)) * 100) / 100;

  return {
    salePrice: roundedPrice,
    wholesaleCost: cost,
    packagingCost: pkg,
    desiredNetProfit: targetProfit,
    actualNetProfit: realProfit,
    channelId,
    channelName: channel.name,
    commissionPct: channel.commissionPct,
    channelCut,
    fixedFeeApplied,
    shippingApplied
  };
}

/**
 * Compila as métricas operacionais da fábrica para o Daily Briefing do Lumen.
 */
export function buildFactoryBriefingMetrics({ orders = [], materials = [], products = [] }) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const pendingOrders = safeOrders.filter(o => o.status === 'pending' || o.status === 'draft');
  const productionOrders = safeOrders.filter(o => o.status === 'in_production');
  const shippedOrders = safeOrders.filter(o => o.status === 'shipped');
  const deliveredOrders = safeOrders.filter(o => o.status === 'delivered');

  const activeOrders = safeOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const pipelineWholesaleTotal = activeOrders.reduce((acc, o) => {
    return acc + (Number(o.wholesaleTotal || o.total || 0));
  }, 0);

  // Gargalos: pedidos não entregues com mais de 48h desde a criação
  const now = Date.now();
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

  const stalledOrders = activeOrders.filter(o => {
    if (!o.createdAt) return false;
    const createdTime = new Date(o.createdAt).getTime();
    if (isNaN(createdTime)) return false;
    return (now - createdTime) > FORTY_EIGHT_HOURS_MS;
  });

  const lowStockMaterials = safeMaterials.filter(m => {
    return m.stockM2 !== undefined && Number(m.stockM2) <= 2;
  });

  return {
    totalOrders: safeOrders.length,
    activeCount: activeOrders.length,
    pendingCount: pendingOrders.length,
    productionCount: productionOrders.length,
    shippedCount: shippedOrders.length,
    deliveredCount: deliveredOrders.length,
    pipelineWholesaleTotal: Math.round(pipelineWholesaleTotal * 100) / 100,
    stalledOrdersCount: stalledOrders.length,
    stalledOrders,
    lowStockMaterialsCount: lowStockMaterials.length,
    lowStockMaterials,
    productsCount: safeProducts.length
  };
}

/**
 * Gera um texto pronto e estruturado de Briefing Matinal para o Dono da Fábrica.
 */
export function generateFactoryBriefingText(metrics, ownerName = 'Geovan') {
  const {
    activeCount,
    pendingCount,
    productionCount,
    shippedCount,
    pipelineWholesaleTotal,
    stalledOrdersCount,
    lowStockMaterialsCount,
    productsCount
  } = metrics;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  let alertText = '';
  if (stalledOrdersCount > 0) {
    alertText += `\n⚠️ ATENÇÃO: Identifiquei ${stalledOrdersCount} pedido(s) em esteira há mais de 48h sem despacho. Vale priorizar para manter a pontuação dos revendedores alta!`;
  }
  if (lowStockMaterialsCount > 0) {
    alertText += `\n📦 ALERTA DE INSUMOS: ${lowStockMaterialsCount} material(is) com estoque crítico no sistema.`;
  }

  return (
    `☕ ${greeting}, ${ownerName}! Aqui está o seu Briefing Executivo da Fábrica SMD Drop:\n\n` +
    `📊 SITUAÇÃO DA ESTEIRA:\n` +
    `• Pedidos Ativos em Andamento: ${activeCount}\n` +
    `• Aguardando Início/Aprovação: ${pendingCount}\n` +
    `• Na Linha de Produção (Laser/Neon): ${productionCount}\n` +
    `• Despachados/Em Trânsito: ${shippedCount}\n` +
    `• Faturamento de Atacado em Esteira: R$ ${pipelineWholesaleTotal.toFixed(2)}\n` +
    `• Catálogo Oficial: ${productsCount} produtos cadastrados.\n` +
    alertText + '\n\n' +
    `O que você deseja comandar agora?`
  );
}
