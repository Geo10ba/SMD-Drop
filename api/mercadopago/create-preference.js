/**
 * Vercel Serverless Function: Criação Segura de Preferência no Mercado Pago
 * Mantém o ACCESS_TOKEN protegido no servidor, longe do navegador.
 */

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.VITE_MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ 
      error: 'MERCADOPAGO_ACCESS_TOKEN não configurado nas variáveis de ambiente do servidor.' 
    });
  }

  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ error: 'Payload inválido: lista de itens obrigatória.' });
    }

    const host = req.headers.host || 'smddrop.com.br';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const origin = `${protocol}://${host}`;

    const bodyPayload = {
      items: payload.items.map((item) => ({
        title: String(item.title || 'Produto SMD Drop'),
        quantity: Number(item.quantity) || 1,
        currency_id: 'BRL',
        unit_price: Number(Number(item.unit_price).toFixed(2)),
      })),
      payer: {
        name: payload.payer?.name || 'Revendedor SMD Drop',
        email: payload.payer?.email || 'revendedor@smddrop.com.br',
      },
      back_urls: {
        success: `${origin}/#pedidos?status=success`,
        failure: `${origin}/#checkout?status=failure`,
        pending: `${origin}/#pedidos?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${origin}/api/mercadopago/webhook`,
      external_reference: payload.external_reference || `order-${Date.now()}`,
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      const errorMsg = data.message || data.cause?.[0]?.description || 'Erro ao comunicar com API Mercado Pago.';
      return res.status(mpResponse.status).json({ error: errorMsg, details: data });
    }

    return res.status(200).json({
      success: true,
      id: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno no servidor.' });
  }
}
