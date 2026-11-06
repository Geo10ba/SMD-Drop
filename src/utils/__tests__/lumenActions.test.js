import { describe, it, expect } from 'vitest';
import {
  parseLumenActions,
  calculateTargetProfitPrice,
  buildFactoryBriefingMetrics,
  generateFactoryBriefingText
} from '../lumenActions';

describe('lumenActions Parser', () => {
  it('should parse single action tag correctly and return clean text', () => {
    const raw = 'O produto foi localizado com sucesso!\n[[ACTION:ADD_TO_CART:prod-1:Luminária Neon:2]]';
    const { cleanText, actions } = parseLumenActions(raw);

    expect(cleanText).toBe('O produto foi localizado com sucesso!');
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('ADD_TO_CART');
    expect(actions[0].params).toEqual(['prod-1', 'Luminária Neon', '2']);
  });

  it('should parse multiple action tags in the same message', () => {
    const raw = 'Pronto para despachar.\n[[ACTION:UPDATE_ORDER_STATUS:ord-10:in_production:Iniciar Produção]][[ACTION:NAVIGATE:factory:pedidos:Ir para Pedidos]]';
    const { cleanText, actions } = parseLumenActions(raw);

    expect(cleanText).toBe('Pronto para despachar.');
    expect(actions).toHaveLength(2);
    expect(actions[0].type).toBe('UPDATE_ORDER_STATUS');
    expect(actions[1].type).toBe('NAVIGATE');
  });

  it('should handle text with no action tags safely', () => {
    const raw = 'Apenas uma resposta normal do Lumen sem tags.';
    const { cleanText, actions } = parseLumenActions(raw);

    expect(cleanText).toBe(raw);
    expect(actions).toHaveLength(0);
  });
});

describe('calculateTargetProfitPrice (Reverse Pricing)', () => {
  it('should correctly calculate selling price to net target profit on Shopee FGE', () => {
    // Wholesale cost: 35, Desired profit: 40, Packaging: 2, Shopee FGE: 20% + R$ 4
    // Base needed: 35 + 2 + 40 = 77
    // Total needed with fixed fee: 77 + 4 = 81
    // Price = 81 / 0.8 = 101.25
    const res = calculateTargetProfitPrice({
      wholesaleCost: 35,
      desiredNetProfit: 40,
      channelId: 'shopee_fge',
      packagingCost: 2
    });

    expect(res.salePrice).toBe(101.25);
    expect(res.actualNetProfit).toBe(40);
  });

  it('should handle zero costs gracefully', () => {
    const res = calculateTargetProfitPrice({
      wholesaleCost: 0,
      desiredNetProfit: 10,
      channelId: 'shopee_standard'
    });

    expect(res.salePrice).toBeGreaterThan(10);
    expect(res.actualNetProfit).toBeCloseTo(10, 1);
  });
});

describe('buildFactoryBriefingMetrics & generateFactoryBriefingText', () => {
  it('should compile pipeline metrics and detect stalled orders', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const mockOrders = [
      { id: '1', status: 'pending', wholesaleTotal: 100, createdAt: threeDaysAgo },
      { id: '2', status: 'in_production', wholesaleTotal: 150, createdAt: oneHourAgo },
      { id: '3', status: 'delivered', wholesaleTotal: 200, createdAt: threeDaysAgo }
    ];

    const mockMaterials = [
      { id: 'm1', name: 'Acrílico Dourado', stockM2: 1.5 },
      { id: 'm2', name: 'MDF 3mm', stockM2: 20 }
    ];

    const metrics = buildFactoryBriefingMetrics({
      orders: mockOrders,
      materials: mockMaterials,
      products: [{ id: 'p1' }, { id: 'p2' }]
    });

    expect(metrics.totalOrders).toBe(3);
    expect(metrics.activeCount).toBe(2);
    expect(metrics.pipelineWholesaleTotal).toBe(250);
    expect(metrics.stalledOrdersCount).toBe(1); // Order 1 is pending and > 48h
    expect(metrics.lowStockMaterialsCount).toBe(1); // Acrílico Dourado <= 2m²

    const briefing = generateFactoryBriefingText(metrics, 'Geovan');
    expect(briefing).toContain('Geovan');
    expect(briefing).toContain('R$ 250.00');
    expect(briefing).toContain('ATENÇÃO: Identifiquei 1 pedido(s) em esteira há mais de 48h');
    expect(briefing).toContain('ALERTA DE INSUMOS: 1 material(is)');
  });
});
