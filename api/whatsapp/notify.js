/**
 * Vercel Serverless Function: Proxy Seguro de Notificações WhatsApp
 * Permite integração opcional com Evolution API, Z-API ou Twilio/WhatsApp Cloud.
 * Protege chaves e URLs de instâncias no servidor.
 */

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  const { phone, message, orderId, eventType } = req.body || {};

  if (!phone || !message) {
    return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios.' });
  }

  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappApiKey = process.env.WHATSAPP_API_KEY;

  // Se o proprietário da fábrica configurou uma API do WhatsApp (ex: Evolution API ou Z-API)
  if (whatsappApiUrl && whatsappApiKey) {
    try {
      const cleanPhone = String(phone).replace(/\D/g, '');
      const response = await fetch(whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': whatsappApiKey,
          'Authorization': `Bearer ${whatsappApiKey}`
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: message,
          message: message
        })
      });

      if (response.ok) {
        return res.status(200).json({ sent: true, provider: 'api' });
      }
    } catch (e) {
      console.warn('[WhatsApp API Exception]:', e.message);
    }
  }

  // Se não houver API externa configurada, retorna modo link direto (WhatsApp Web / Mobile)
  return res.status(200).json({
    sent: false,
    mode: 'manual_link',
    message: 'Nenhuma API externa configurada no servidor. Notificação disponível via link direto wa.me.'
  });
}
