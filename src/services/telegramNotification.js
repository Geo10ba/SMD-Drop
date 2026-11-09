/**
 * Serviço de Notificações via Telegram para Revendedores e Fábrica da SMD Drop
 * Dispara requisições para a API Serverless (/api/telegram/notify) sem expor segredos,
 * e gera links diretos para compartilhamento e rastreamento via Telegram Web/App (100% GRÁTIS).
 */

export const TELEGRAM_BOT_USERNAME = 'smddropbot';
export const TELEGRAM_BOT_URL = `https://t.me/${TELEGRAM_BOT_USERNAME}`;

/**
 * Normaliza dados para envio de pedido criado
 */
export async function notifyOrderToTelegram(orderData) {
  try {
    const isMkt = orderData.dispatchMode === 'marketplace_label' || Boolean(orderData.labelPdf || orderData.label_pdf_url);
    const mktName = orderData.marketplace || 'Marketplace';
    const fallbackCustomerName = isMkt ? `Conforme Etiqueta (${mktName})` : 'Cliente Final';

    const payload = {
      type: 'order_created',
      orderId: orderData.id || orderData.orderId,
      resellerName: orderData.resellerName,
      resellerEmail: orderData.resellerEmail,
      resellerChatId: orderData.resellerTelegramChatId || orderData.telegramChatId || null,
      customerName: isMkt ? fallbackCustomerName : (orderData.customerName || orderData.customerData?.name || fallbackCustomerName),
      customerCity: isMkt ? 'Destino da Etiqueta' : (orderData.customerCity || orderData.customerData?.city || '-'),
      customerState: isMkt ? 'BR' : (orderData.customerState || orderData.customerData?.state || '-'),
      wholesaleTotal: orderData.wholesaleTotal,
      shippingTotal: orderData.shippingTotal,
      total: orderData.total ?? orderData.wholesaleTotal,
      paymentMethod: orderData.paymentMethod,
      dispatchMode: orderData.dispatchMode,
      marketplace: orderData.marketplace,
      hasLabel: Boolean(orderData.labelPdf || orderData.label_pdf_url),
      hasPixReceipt: Boolean(orderData.pixReceiptFile || orderData.pixReceiptBase64),
      labelFileBase64: orderData.labelFileBase64 || null,
      labelFileName: orderData.labelFileName || orderData.labelPdf || null,
      pixReceiptFile: orderData.pixReceiptFile || null,
      mercadoPagoFee: orderData.mercadoPagoFee || 0,
      items: (orderData.items || []).map(it => ({
        title: it.title || it.name,
        qty: it.qty || it.quantity || 1,
        unitPrice: it.unitPrice || it.price || 0
      }))
    };

    const endpoint = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? 'https://smd-drop.vercel.app/api/telegram/notify'
      : '/api/telegram/notify';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || (data && !data.success)) {
      console.warn('[Telegram Notify Warning]: Falha na resposta da API', res.status, data);
    } else {
      console.log('[Telegram Notify Success]: Notificação entregue ao Telegram!', data);
    }
    return true;
  } catch (err) {
    console.warn('[Telegram Notify Exception]:', err.message);
    return false;
  }
}

/**
 * Notifica sobre avanço de estágio ou despacho do pedido (Corte Laser, Pronto, Expedido)
 */
export async function notifyOrderStatusToTelegram(orderData, newStatus, trackingCode = null, note = '') {
  try {
    const isMkt = orderData.dispatchMode === 'marketplace_label' || Boolean(orderData.labelPdf || orderData.label_pdf_url);
    const mktName = orderData.marketplace || 'Marketplace';
    const fallbackCustomerName = isMkt ? `Conforme Etiqueta (${mktName})` : 'Cliente Final';

    const payload = {
      type: newStatus === 'enviado' ? 'order_shipped' : (newStatus === 'corte_laser' || newStatus === 'em_producao' ? 'production_started' : 'order_status_updated'),
      orderId: orderData.id || orderData.orderId,
      newStatus,
      statusLabel: note,
      resellerName: orderData.resellerName,
      resellerEmail: orderData.resellerEmail,
      resellerChatId: orderData.resellerTelegramChatId || orderData.telegramChatId || null,
      customerName: isMkt ? fallbackCustomerName : (orderData.customerName || orderData.customerData?.name || fallbackCustomerName),
      customerCity: isMkt ? 'Destino da Etiqueta' : (orderData.customerCity || orderData.customerData?.city || '-'),
      customerState: isMkt ? 'BR' : (orderData.customerState || orderData.customerData?.state || '-'),
      trackingCode: trackingCode || orderData.trackingCode || null,
      marketplace: orderData.marketplace || 'Marketplace',
      total: orderData.wholesaleTotal || orderData.total,
      items: (orderData.items || []).map(it => ({
        title: it.title || it.name,
        qty: it.qty || it.quantity || 1
      }))
    };

    const endpoint = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? 'https://smd-drop.vercel.app/api/telegram/notify'
      : '/api/telegram/notify';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || (data && !data.success)) {
      console.warn('[Telegram Status Warning]: Falha na resposta da API', res.status, data);
    }
    return true;
  } catch (err) {
    console.warn('[Telegram Status Exception]:', err.message);
    return false;
  }
}

/**
 * Notifica sobre uma recarga de saldo na carteira
 */
export async function notifyWalletRechargeToTelegram({ resellerName, resellerEmail, amount, method, paymentId, resellerChatId }) {
  try {
    const payload = {
      type: 'wallet_recharge',
      resellerName,
      resellerEmail,
      resellerChatId: resellerChatId || null,
      amount,
      method: method || 'PIX Automático Mercado Pago',
      paymentId
    };

    const res = await fetch('/api/telegram/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn('[Telegram Wallet Warning]: Falha na resposta da API', res.status);
    }
    return true;
  } catch (err) {
    console.warn('[Telegram Wallet Exception]:', err.message);
    return false;
  }
}

/**
 * Gera texto formatado para envio direto ou compartilhamento via Telegram
 */
export function generateTelegramMessage(order, eventType = 'order_created') {
  const orderId = order.id || order.orderId || 'S/N';
  const resellerName = order.resellerName || 'Parceiro';
  const tracking = order.trackingCode || 'Gerando...';
  const total = Number(order.wholesaleTotal || order.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (eventType === 'order_shipped') {
    return (
      `🚚 *PEDIDO DESPACHADO - SMD DROP*\n\n` +
      `Olá, *${resellerName}*!\n` +
      `Seu pedido *#${orderId}* já foi despachado com etiqueta cega.\n` +
      `📍 *Código de Rastreio:* ${tracking}\n` +
      `💰 *Total:* ${total}\n\n` +
      `Acompanhe as atualizações pelo bot @${TELEGRAM_BOT_USERNAME}!`
    );
  }

  if (eventType === 'production_started') {
    return (
      `⚡ *EM PRODUÇÃO & CORTE LASER - SMD DROP*\n\n` +
      `Olá, *${resellerName}*!\n` +
      `O pedido *#${orderId}* entrou na linha de corte a laser da fábrica.\n` +
      `Despacho ágil garantido em até 24h úteis!`
    );
  }

  return (
    `🎉 *NOVO PEDIDO CONFIRMADO - SMD DROP*\n\n` +
    `Olá, *${resellerName}*!\n` +
    `Pedido *#${orderId}* recebido com sucesso!\n` +
    `💰 *Valor Atacado:* ${total}\n` +
    `Status: Em Fila de Fabricação.\n\n` +
    `Atualizações em tempo real pelo bot @${TELEGRAM_BOT_USERNAME}!`
  );
}

/**
 * Constrói link direto para compartilhar no Telegram (t.me/share)
 */
export function buildTelegramShareLink(text, url = '') {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = url ? encodeURIComponent(url) : '';
  if (encodedUrl) {
    return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  }
  return `https://t.me/share/url?text=${encodedText}`;
}

/**
 * Abre o Telegram diretamente com a mensagem formatada
 */
export function openTelegramShare(text, url = '') {
  const link = buildTelegramShareLink(text, url);
  if (typeof window !== 'undefined') {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
  return link;
}
