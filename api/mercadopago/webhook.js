/**
 * Vercel Serverless Function: Webhook do Mercado Pago
 * Recebe notificações automáticas de pagamentos e atualiza o status do pedido
 * para "em_producao" no Supabase automaticamente.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.VITE_MERCADOPAGO_ACCESS_TOKEN;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aghbrlihahygczzvxvim.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  try {
    // Obter ID do pagamento notificado
    const paymentId = req.query?.['data.id'] || req.query?.id || req.body?.data?.id || req.body?.id;
    const topic = req.query?.type || req.query?.topic || req.body?.type || req.body?.action;

    if (!paymentId || (topic && !topic.includes('payment'))) {
      // Retorna 200 para eventos não relacionados a pagamento
      return res.status(200).json({ received: true, ignored: true });
    }

    if (!accessToken) {
      console.warn('[Mercado Pago Webhook]: MERCADOPAGO_ACCESS_TOKEN não configurado.');
      return res.status(200).json({ received: true, warning: 'No access token' });
    }

    // Consultar dados do pagamento no Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!mpRes.ok) {
      console.warn(`[Mercado Pago Webhook] Erro ao consultar pagamento ${paymentId}: ${mpRes.statusText}`);
      return res.status(200).json({ received: true, error: 'Could not fetch payment' });
    }

    const payment = await mpRes.json();
    const status = payment.status; // 'approved', 'pending', 'rejected', etc.
    const externalRef = payment.external_reference; // ex: 'ORD-1234' ou 'order-123'

    // Se o pagamento foi aprovado, atualizar status no Supabase
    if (status === 'approved' && externalRef && supabaseUrl && supabaseKey) {
      const orderId = externalRef.replace('order-', '').replace('ORD-MP-', 'ORD-');

      const updateRes = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          status: 'em_producao',
        }),
      });

      console.log(`[Mercado Pago Webhook] Pedido ${orderId} atualizado para 'em_producao'. HTTP: ${updateRes.status}`);

      // Notificar aprovação automática no Telegram (@smddropbot) se configurado
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
      const telegramChatId = process.env.TELEGRAM_CHAT_ID;
      if (telegramToken && telegramChatId) {
        try {
          const valor = Number(payment.transaction_amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const textMsg = `✅ <b>PAGAMENTO PIX MERCADO PAGO CONFIRMADO!</b>\n\n📦 <b>Pedido:</b> <code>${orderId}</code>\n💵 <b>Valor Pago:</b> ${valor}\n🔖 <b>ID Transação:</b> <code>${paymentId}</code>\n🏭 <b>Status:</b> Em Produção (Liberado na esteira fabril!)\n🕒 <b>Horário:</b> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

          await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: textMsg,
              parse_mode: 'HTML'
            })
          });
        } catch (tgErr) {
          console.warn('[Mercado Pago Webhook Telegram Warning]:', tgErr.message);
        }
      }
    }

    return res.status(200).json({ received: true, status, paymentId });
  } catch (err) {
    console.error('[Mercado Pago Webhook Error]:', err);
    return res.status(200).json({ received: true, error: err.message });
  }
}
