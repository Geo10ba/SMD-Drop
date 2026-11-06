import { describe, it, expect } from 'vitest';
import { 
  generateTelegramMessage, 
  buildTelegramShareLink, 
  TELEGRAM_BOT_USERNAME,
  TELEGRAM_BOT_URL
} from '../telegramNotification';

describe('Telegram Notification Service (100% Grátis)', () => {
  const mockOrder = {
    id: 'ORD-5544',
    resellerName: 'Studio Laser Luxo',
    wholesaleTotal: 340,
    trackingCode: 'BR987654321BR'
  };

  it('generates message for order_created event', () => {
    const msg = generateTelegramMessage(mockOrder, 'order_created');
    expect(msg).toContain('NOVO PEDIDO CONFIRMADO');
    expect(msg).toContain('#ORD-5544');
    expect(msg).toContain('Studio Laser Luxo');
    expect(msg).toContain(`@${TELEGRAM_BOT_USERNAME}`);
  });

  it('generates message for production_started event', () => {
    const msg = generateTelegramMessage(mockOrder, 'production_started');
    expect(msg).toContain('EM PRODUÇÃO & CORTE LASER');
    expect(msg).toContain('#ORD-5544');
    expect(msg).toContain('24h úteis');
  });

  it('generates message for order_shipped event with tracking code', () => {
    const msg = generateTelegramMessage(mockOrder, 'order_shipped');
    expect(msg).toContain('PEDIDO DESPACHADO');
    expect(msg).toContain('#ORD-5544');
    expect(msg).toContain('BR987654321BR');
    expect(msg).toContain('etiqueta cega');
  });

  it('builds direct Telegram share link (t.me/share)', () => {
    const link = buildTelegramShareLink('Aviso SMD Drop', 'https://smddrop.com.br');
    expect(link).toContain('https://t.me/share/url?url=https%3A%2F%2Fsmddrop.com.br&text=Aviso%20SMD%20Drop');
  });

  it('exports correct Telegram Bot URL', () => {
    expect(TELEGRAM_BOT_URL).toBe('https://t.me/smddropbot');
  });
});
