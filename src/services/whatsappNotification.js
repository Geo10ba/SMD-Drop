/**
 * Serviço de Notificações via WhatsApp para Revendedores da SMD Drop
 * Suporta:
 * 1. Disparo direto via WhatsApp Web / WhatsApp Mobile (sem custo de API)
 * 2. Integração com Webhook Serverless (Evolution API / Z-API / WhatsApp Cloud)
 */

export const NOTIFICATION_EVENTS = {
  ORDER_CREATED: 'ORDER_CREATED',
  PRODUCTION_STARTED: 'PRODUCTION_STARTED',
  ORDER_READY: 'ORDER_READY',
  ORDER_SHIPPED: 'ORDER_SHIPPED',
  WALLET_RECHARGED: 'WALLET_RECHARGED'
};

/**
 * Normaliza número de telefone para o padrão WhatsApp internacional (DDI + DDD + Número)
 */
export function formatWhatsAppNumber(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  // Se já tem DDI 55
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Se tem DDD + Número (10 ou 11 dígitos, ex: 11987654321)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

/**
 * Gera mensagem formatada para WhatsApp de acordo com o estágio do pedido
 */
export function generateWhatsAppMessage(order, eventType = NOTIFICATION_EVENTS.ORDER_CREATED) {
  const orderId = order.id || order.orderId || 'S/N';
  const resellerName = order.resellerName || 'Parceiro';
  const customerName = order.customerName || order.customerData?.name || 'Cliente Final';
  const total = Number(order.wholesaleTotal || order.total || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  const trackingCode = order.trackingCode || 'Disponível em breve';
  const marketplace = (order.marketplace || 'Marketplace / Venda Direta').toUpperCase();

  const itemsList = (order.items || [])
    .map(it => `  • ${it.qty || it.quantity || 1}x ${it.title || it.name}`)
    .join('\n');

  switch (eventType) {
    case NOTIFICATION_EVENTS.ORDER_CREATED:
      return (
        `🎉 *PEDIDO CONFIRMADO NA SMD DROP!* 🎉\n\n` +
        `Olá, *${resellerName}*!\n` +
        `Recebemos o seu pedido de atacado *#${orderId}* com sucesso.\n\n` +
        `📦 *Detalhes do Pedido:*\n` +
        (itemsList ? `${itemsList}\n` : '') +
        `💰 *Total no Atacado:* ${total}\n` +
        `🛒 *Canal de Venda:* ${marketplace}\n` +
        `👤 *Destinatário:* ${customerName}\n\n` +
        `⚡ *Próximo Passo:* As peças já entraram na fila de corte a laser da fábrica. Despachamos em até 24h úteis com Etiqueta Cega!\n\n` +
        `Acompanhe em tempo real pelo seu painel da SMD Drop.`
      );

    case NOTIFICATION_EVENTS.PRODUCTION_STARTED:
      return (
        `⚡ *PEDIDO EM PRODUÇÃO & CORTE LASER!* ⚡\n\n` +
        `Olá, *${resellerName}*!\n` +
        `Seu pedido *#${orderId}* começou a ser cortado a laser e montado pela nossa equipe fabril.\n\n` +
        `📦 *Itens em fabricação:*\n` +
        (itemsList ? `${itemsList}\n` : '') +
        `🏭 *Status:* Corte a Laser CNC & Controle de Qualidade\n\n` +
        `Assim que for embalado e etiquetado, avisaremos você por aqui!`
      );

    case NOTIFICATION_EVENTS.ORDER_READY:
      return (
        `✅ *PEDIDO EMBALADO & PRONTO PARA COLETA!* ✅\n\n` +
        `Olá, *${resellerName}*!\n` +
        `O pedido *#${orderId}* foi finalizado no controle de qualidade e devidamente embalado em caixa anti-impacto neutra.\n\n` +
        `📦 Aguardando coleta do transportador/correios.`
      );

    case NOTIFICATION_EVENTS.ORDER_SHIPPED:
      return (
        `🚚 *SEU PEDIDO FOI DESPACHADO!* 🚚\n\n` +
        `Olá, *${resellerName}*!\n` +
        `Ótima notícia: o pedido *#${orderId}* já foi despachado pela fábrica SMD Drop!\n\n` +
        `👤 *Cliente:* ${customerName}\n` +
        `🏷️ *Canal:* ${marketplace}\n` +
        `📍 *Código de Rastreamento:* *${trackingCode}*\n\n` +
        `Seu cliente receberá o pacote com a sua identificação na etiqueta e embalagem 100% cega.\n` +
        `Boas vendas e conte sempre com a SMD Drop!`
      );

    default:
      return `Olá, *${resellerName}*! Atualização do pedido *#${orderId}*: status atual ${order.status}.`;
  }
}

/**
 * Gera URL direta do WhatsApp Web / App para notificar com 1 clique
 */
export function buildWhatsAppLink(phone, message) {
  const cleanPhone = formatWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(message);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Abre o WhatsApp diretamente em nova aba
 */
export function openWhatsAppNotification(phone, message) {
  const url = buildWhatsAppLink(phone, message);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return url;
}

/**
 * Disparo automático com fallback (chama API backend se existir ou retorna link)
 */
export async function notifyResellerViaWhatsApp({ order, phone, eventType, autoOpen = false }) {
  const targetPhone = phone || order.resellerPhone || order.phone || '';
  const message = generateWhatsAppMessage(order, eventType);

  // 1. Tentar webhook serverless se configurado
  try {
    const res = await fetch('/api/whatsapp/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: targetPhone,
        message,
        orderId: order.id,
        eventType
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.sent) {
        return { success: true, method: 'api', message };
      }
    }
  } catch (e) {
    // Falha silenciosa do webhook, segue para link direto
  }

  // 2. Se autoOpen for true ou o usuário clicar, abre WhatsApp Web/Mobile
  if (autoOpen) {
    openWhatsAppNotification(targetPhone, message);
  }

  return {
    success: true,
    method: 'link',
    url: buildWhatsAppLink(targetPhone, message),
    message
  };
}
