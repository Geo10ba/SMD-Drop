import { describe, it, expect } from 'vitest';
import { 
  validateCustomM2, 
  validateOrder, 
  validateProduct, 
  validateWalletRecharge 
} from '../schemas';

describe('schemas - Validações com Zod', () => {
  describe('validateCustomM2', () => {
    it('deve aceitar medidas válidas de corte a laser', () => {
      const result = validateCustomM2({
        widthCm: 80,
        heightCm: 25,
        materialName: 'Acrílico Espelhado Dourado',
        pricePerM2: 280,
        quantity: 1
      });
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('deve rejeitar larguras menores que 5cm ou maiores que 300cm', () => {
      const tooSmall = validateCustomM2({
        widthCm: 2,
        heightCm: 20,
        materialName: 'MDF Cru',
        pricePerM2: 85
      });
      expect(tooSmall.success).toBe(false);
      expect(tooSmall.errors.some(e => e.includes('5 cm'))).toBe(true);

      const tooLarge = validateCustomM2({
        widthCm: 350,
        heightCm: 20,
        materialName: 'MDF Cru',
        pricePerM2: 85
      });
      expect(tooLarge.success).toBe(false);
      expect(tooLarge.errors.some(e => e.includes('300 cm'))).toBe(true);
    });
  });

  describe('validateOrder', () => {
    it('deve validar um pedido completo com sucesso', () => {
      const order = {
        resellerName: 'Studio Laser Revenda',
        resellerEmail: 'revenda@laser.com.br',
        dispatchMode: 'marketplace_label',
        marketplace: 'Shopee',
        customerName: 'Maria Silva Oliveira',
        customerAddress: 'Av Paulista, 1000, Bela Vista',
        customerCity: 'São Paulo',
        customerState: 'SP',
        customerZip: '01310-100',
        wholesaleTotal: 85.00,
        shippingTotal: 0,
        total: 85.00,
        items: [
          {
            title: 'Letreiro Acrílico 3D Dourado',
            pricingType: 'custom_m2',
            unitWholesalePrice: 85.00,
            suggestedRetailPrice: 190.00,
            quantity: 1
          }
        ]
      };

      const result = validateOrder(order);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar pedidos sem itens', () => {
      const order = {
        resellerName: 'Revenda',
        resellerEmail: 'revenda@teste.com',
        customerName: 'Cliente Final',
        customerAddress: 'Rua A, 123',
        customerCity: 'Cidade',
        customerState: 'SP',
        customerZip: '12345-678',
        items: [],
        wholesaleTotal: 0,
        total: 0
      };

      const result = validateOrder(order);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('1 item'))).toBe(true);
    });

    it('deve exigir endereço no modo de envio cego direto (direct_blind)', () => {
      const order = {
        resellerName: 'Revenda',
        resellerEmail: 'revenda@teste.com',
        dispatchMode: 'direct_blind',
        customerName: 'Cliente Final',
        customerAddress: '',
        items: [{ title: 'Quadro Decorativo', unitWholesalePrice: 30, suggestedRetailPrice: 80, quantity: 1 }],
        wholesaleTotal: 30,
        total: 30
      };

      const result = validateOrder(order);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Endereço'))).toBe(true);
    });
  });

  describe('validateProduct', () => {
    it('deve validar criação de produto com preços e NCM válidos', () => {
      const product = {
        title: 'Relógio de Parede Minimalista Madeira MDF',
        category: 'Relógios de Parede',
        pricingType: 'fixed',
        wholesalePrice: 45.00,
        suggestedRetailPrice: 110.00,
        factoryStock: 50,
        leadTimeDays: 2,
        weightKg: 0.8,
        ncm: '9105.29.00'
      };

      const result = validateProduct(product);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar produto quando preço sugerido for menor que atacado', () => {
      const product = {
        title: 'Produto Teste Prejuízo',
        category: 'Geral',
        pricingType: 'fixed',
        wholesalePrice: 100.00,
        suggestedRetailPrice: 60.00
      };

      const result = validateProduct(product);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('maior ou igual ao preço de atacado'))).toBe(true);
    });
  });

  describe('validateWalletRecharge', () => {
    it('deve validar valor de recarga dentro dos limites permitidos', () => {
      const valid = validateWalletRecharge({
        amount: 150.00,
        resellerEmail: 'revendedor@loja.com'
      });
      expect(valid.success).toBe(true);

      const tooSmall = validateWalletRecharge({
        amount: 5.00,
        resellerEmail: 'revendedor@loja.com'
      });
      expect(tooSmall.success).toBe(false);
      expect(tooSmall.errors.some(e => e.includes('R$ 10,00'))).toBe(true);
    });
  });
});
