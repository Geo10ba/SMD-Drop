/**
 * Vercel Serverless Function: Geração Segura de PIX no Mercado Pago
 * Mantém o ACCESS_TOKEN protegido no servidor.
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
    const amount = Number(Number(payload?.transaction_amount).toFixed(2));

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'transaction_amount inválido ou ausente.' });
    }

    const host = req.headers.host || 'smddrop.com.br';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const origin = `${protocol}://${host}`;

    const bodyPayload = {
      transaction_amount: amount,
      description: payload.description || 'Pagamento Custo Fabril SMD Drop',
      payment_method_id: 'pix',
      notification_url: `${origin}/api/mercadopago/webhook`,
      payer: {
        email: payload.payer?.email || 'revendedor@smddrop.com.br',
        first_name: payload.payer?.first_name || 'Revendedor',
        last_name: payload.payer?.last_name || 'SMD',
      },
    };

    if (payload.payer?.identification?.number) {
      bodyPayload.payer.identification = {
        type: payload.payer.identification.type || 'CPF',
        number: String(payload.payer.identification.number).replace(/\D/g, ''),
      };
    }

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': `pix-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      const errorDetail = data.message || data.cause?.[0]?.description || 'Erro ao gerar PIX com o Mercado Pago.';
      return res.status(mpResponse.status).json({ error: errorDetail, details: data });
    }

    const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;

    return res.status(200).json({
      success: true,
      paymentId: data.id,
      status: data.status,
      qrCode,
      qrCodeBase64,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno no servidor ao gerar PIX.' });
  }
}
