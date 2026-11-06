import { describe, it, expect } from 'vitest';
import { 
  formatWhatsAppNumber, 
  generateWhatsAppMessage, 
  buildWhatsAppLink, 
  NOTIFICATION_EVENTS 
} from '../whatsappNotification';

describe('WhatsApp Notification Service', () => {
  describe('formatWhatsAppNumber', () => {
    it('normalizes Brazilian numbers with DDD into international format 55', () => {
      expect(formatWhatsAppNumber('(11) 98765-4321')).toBe('5511987654321');
      expect(formatWhatsAppNumber('11987654321')).toBe('5511987654321');
      expect(formatWhatsAppNumber('(21) 3344-5566')).toBe('552133445566');
    });

    it('preserves numbers already starting with 55', () => {
      expect(formatWhatsAppNumber('5511987654321')).toBe('5511987654321');
    });

    it('handles empty or invalid inputs gracefully', () => {
      expect(formatWhatsAppNumber('')).toBe('');
      expect(formatWhatsAppNumber(null)).toBe('');
    });
  });

  describe('generateWhatsAppMessage', () => {
    const mockOrder = {
      id: 'ORD-999',
      resellerName: 'Lucas E-Commerce',
      customerName: 'Mariana Silva',
      wholesaleTotal: 250,
      trackingCode: 'BR123456789BR',
      marketplace: 'Shopee',
      items: [
        { title: 'Letreiro Neon Acrílico', qty: 2 }
      ]
    };

    it('generates message for ORDER_CREATED event', () => {
      const msg = generateWhatsAppMessage(mockOrder, NOTIFICATION_EVENTS.ORDER_CREATED);
      expect(msg).toContain('PEDIDO CONFIRMADO NA SMD DROP');
      expect(msg).toContain('#ORD-999');
      expect(msg).toContain('Lucas E-Commerce');
      expect(msg).toContain('Mariana Silva');
      expect(msg).toContain('SHOPEE');
      expect(msg).toContain('Letreiro Neon Acrílico');
    });

    it('generates message for PRODUCTION_STARTED event', () => {
      const msg = generateWhatsAppMessage(mockOrder, NOTIFICATION_EVENTS.PRODUCTION_STARTED);
      expect(msg).toContain('PEDIDO EM PRODUÇÃO & CORTE LASER');
      expect(msg).toContain('#ORD-999');
      expect(msg).toContain('Corte a Laser CNC');
    });

    it('generates message for ORDER_SHIPPED event', () => {
      const msg = generateWhatsAppMessage(mockOrder, NOTIFICATION_EVENTS.ORDER_SHIPPED);
      expect(msg).toContain('SEU PEDIDO FOI DESPACHADO');
      expect(msg).toContain('#ORD-999');
      expect(msg).toContain('BR123456789BR');
      expect(msg).toContain('100% cega');
    });
  });

  describe('buildWhatsAppLink', () => {
    it('generates wa.me link with encoded text', () => {
      const link = buildWhatsAppLink('11987654321', 'Olá mundo');
      expect(link).toContain('https://wa.me/5511987654321?text=Ol%C3%A1%20mundo');
    });
  });
});
