import { describe, it, expect } from 'vitest';
import { 
  SALES_CHANNELS, 
  getChannelFees, 
  calculateRealProfit, 
  calculateBreakEvenAndSuggestions
} from '../channelPricing';

describe('channelPricing - Motor de Precificação e Taxas de Marketplace', () => {
  it('deve definir os canais principais corretamente', () => {
    expect(SALES_CHANNELS.ml_classic).toBeDefined();
    expect(SALES_CHANNELS.ml_premium).toBeDefined();
    expect(SALES_CHANNELS.shopee_standard).toBeDefined();
    expect(SALES_CHANNELS.shopee_fge).toBeDefined();
    expect(SALES_CHANNELS.direct_sale).toBeDefined();
  });

  it('deve calcular taxa fixa do Mercado Livre Clássico para produtos abaixo de R$ 79', () => {
    const fees = getChannelFees('ml_classic', 50.00);
    // Comissão 14% de 50 = 7.00 + taxa fixa 6.00 = 13.00
    expect(fees.commissionAmount).toBe(7.00);
    expect(fees.fixedFee).toBe(6.00);
    expect(fees.shippingCost).toBe(0);
    expect(fees.totalChannelFee).toBe(13.00);
  });

  it('deve calcular frete subsidiado do Mercado Livre para produtos acima ou igual a R$ 79', () => {
    const fees = getChannelFees('ml_classic', 100.00);
    // Comissão 14% de 100 = 14.00, sem taxa fixa de R$ 6, com frete subsidiado de 19.50
    expect(fees.commissionAmount).toBe(14.00);
    expect(fees.fixedFee).toBe(0);
    expect(fees.shippingCost).toBe(19.50);
    expect(fees.totalChannelFee).toBe(33.50);
  });

  it('deve calcular taxas da Shopee padrão com taxa fixa por item', () => {
    const fees = getChannelFees('shopee_standard', 80.00);
    // 14% de 80 = 11.20 + 4.00 = 15.20
    expect(fees.commissionAmount).toBeCloseTo(11.20, 2);
    expect(fees.fixedFee).toBe(4.00);
    expect(fees.totalChannelFee).toBeCloseTo(15.20, 2);
  });

  it('deve calcular o lucro líquido real e margem corretamente', () => {
    const result = calculateRealProfit({
      wholesaleCost: 35.00,
      salePrice: 120.00,
      channelId: 'shopee_standard',
      packagingCost: 3.00,
      taxRatePct: 4.0, // Simples 4%
      returnLossPct: 2.0,
      adsAcosPct: 5.0
    });

    expect(result.wholesaleCost).toBe(35.00);
    expect(result.salePrice).toBe(120.00);
    expect(result.totalProductCost).toBe(38.00); // 35 + 3
    expect(result.netProfit).toBeGreaterThan(0);
    expect(result.isLoss).toBe(false);
    expect(result.netMarginPct).toBeGreaterThan(0);
  });

  it('deve detectar prejuízo quando o preço de venda for inferior aos custos e taxas', () => {
    const result = calculateRealProfit({
      wholesaleCost: 80.00,
      salePrice: 70.00,
      channelId: 'ml_classic'
    });

    expect(result.isLoss).toBe(true);
    expect(result.netProfit).toBeLessThan(0);
  });

  it('deve calcular ponto de equilíbrio (Break-Even) e sugestões de preço', () => {
    const suggestions = calculateBreakEvenAndSuggestions({
      wholesaleCost: 40.00,
      channelId: 'shopee_standard',
      packagingCost: 2.00,
      taxRatePct: 0
    });

    expect(suggestions.breakEvenMinPrice).toBeGreaterThan(42.00);
    expect(suggestions.competitivePrice15).toBeGreaterThan(suggestions.breakEvenMinPrice);
    expect(suggestions.lucrativePrice30).toBeGreaterThan(suggestions.competitivePrice15);

    // Se vender no breakEvenMinPrice, o lucro líquido deve ser aproximadamente zero
    const dre = calculateRealProfit({
      wholesaleCost: 40.00,
      salePrice: suggestions.breakEvenMinPrice,
      channelId: 'shopee_standard',
      packagingCost: 2.00,
      taxRatePct: 0
    });
    expect(dre.netProfit).toBeCloseTo(0, 0);
  });
});
