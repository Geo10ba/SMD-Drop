import dns from 'node:dns';

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Vercel Serverless Function: Notificações no Telegram Bot (@smddropbot)
 * Envia avisos imediatos de novos pedidos, etiquetas anexadas e pagamentos PIX.
 * Executa 100% no servidor para proteger o TELEGRAM_BOT_TOKEN.
 */

export default async function handler(req, res) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram Notify] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados no servidor.');
    return res.status(500).json({ error: 'Credenciais do Telegram não configuradas no servidor.' });
  }

  try {
    const payload = req.body || {};
    const type = payload.type || 'order_created';

    let messageHtml = '';

    const escapeHtml = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    const formatCurrency = (val) => {
      const num = Number(val) || 0;
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const nowStr = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    if (type === 'wallet_recharge') {
      const { resellerName, resellerEmail, amount, method, paymentId } = payload;
      messageHtml = `
💳 <b>NOVA RECARGA DE CARTEIRA</b> 💳

👤 <b>Revendedor:</b> ${escapeHtml(resellerName || 'Revendedor')}
📧 <b>E-mail:</b> ${escapeHtml(resellerEmail || '-')}
💵 <b>Valor Creditado:</b> <b>${formatCurrency(amount)}</b>
🏦 <b>Método:</b> ${escapeHtml(method || 'PIX Automático')}
${paymentId ? `🔖 <b>ID Pagamento:</b> <code>${escapeHtml(paymentId)}</code>\n` : ''}
🕒 <b>Horário:</b> ${nowStr}
✨ <i>Saldo disponível na carteira para produção imediata!</i>
      `.trim();
    } else {
      // Pedido Criado / Compra
      const {
        orderId,
        resellerName,
        resellerEmail,
        customerName,
        customerCity,
        customerState,
        wholesaleTotal,
        shippingTotal,
        total,
        paymentMethod,
        dispatchMode,
        marketplace,
        hasLabel,
        items,
        mercadoPagoFee
      } = payload;

      const isMarketplace = dispatchMode === 'marketplace_label' || hasLabel;
      const labelBadge = isMarketplace 
        ? `🏷️ <b>Etiqueta Anexada:</b> SIM (${escapeHtml(marketplace || 'Marketplace')}) ✅`
        : `🚚 <b>Envio:</b> Fábrica Direta (Sem Etiqueta Externa)`;

      const feeText = Number(mercadoPagoFee) > 0 ? ` (Inclui taxa MP de ${formatCurrency(mercadoPagoFee)})` : '';

      let itemsListText = '';
      if (Array.isArray(items) && items.length > 0) {
        itemsListText = items.map((it, idx) => {
          const title = escapeHtml(it.title || it.name || `Item ${idx + 1}`);
          const qty = it.qty || it.quantity || 1;
          const price = formatCurrency(it.unitPrice || it.price || 0);
          return `  • <b>${qty}x</b> ${title} (${price} un)`;
        }).join('\n');
      } else {
        itemsListText = '  • Itens diversos de comunicação visual';
      }

      messageHtml = `
🚀 <b>NOVA COMPRA REALIZADA NO SMD DROP!</b> 🚀

📦 <b>Pedido:</b> <code>${escapeHtml(orderId || 'ORD-NOVO')}</code>
👤 <b>Revendedor:</b> <b>${escapeHtml(resellerName || 'Revendedor')}</b>
📧 <b>E-mail:</b> ${escapeHtml(resellerEmail || '-')}
${labelBadge}

📍 <b>Destinatário Final:</b> ${escapeHtml(customerName || 'Cliente Final')} (${escapeHtml(customerCity || '-')}/${escapeHtml(customerState || '-')})
💳 <b>Forma de Pagamento:</b> <b>${escapeHtml(paymentMethod || 'PIX')}</b>
💰 <b>Valor Total:</b> <b>${formatCurrency(total || wholesaleTotal)}</b>${feeText}
${Number(shippingTotal) > 0 ? `🚚 <b>Frete:</b> ${formatCurrency(shippingTotal)}\n` : ''}
🛒 <b>Itens do Pedido:</b>
${itemsListText}

🕒 <b>Data/Hora:</b> ${nowStr}
🏭 <i>Pedido registrado e pronto para processamento fabril!</i>
      `.trim();
    }

    // Disparar para a API do Telegram
    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const telegramData = await telegramRes.json();

    if (!telegramRes.ok || !telegramData.ok) {
      console.error('[Telegram Notify Error]:', telegramData);
      return res.status(500).json({ error: 'Erro ao enviar mensagem ao Telegram', details: telegramData });
    }

    // Se o pedido tiver o arquivo da etiqueta anexada em base64, enviar o PDF direto para o bot!
    if (payload.labelFileBase64) {
      try {
        const base64Data = payload.labelFileBase64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = payload.labelFileName || `Etiqueta_${payload.orderId || 'Pedido'}.pdf`;

        const form = new FormData();
        form.append('chat_id', chatId);
        form.append('caption', `📄 <b>Etiqueta de Envio Anexada</b>\n📦 Pedido: <code>${escapeHtml(payload.orderId || 'ORD-NOVO')}</code>\n🏷️ Canal: ${escapeHtml(payload.marketplace || 'Marketplace')}\n👤 Revendedor: ${escapeHtml(payload.resellerName || '-')}`);
        form.append('parse_mode', 'HTML');
        const blob = new Blob([buffer], { type: 'application/pdf' });
        form.append('document', blob, fileName);

        await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
          method: 'POST',
          body: form
        });
      } catch (docErr) {
        console.warn('[Telegram sendDocument Warning]:', docErr.message);
      }
    }

    return res.status(200).json({ success: true, messageId: telegramData.result?.message_id });
  } catch (err) {
    console.error('[Telegram Server Error]:', err);
    return res.status(500).json({ error: err.message });
  }
}
