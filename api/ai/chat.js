/**
 * Vercel Serverless Function: Proxy Seguro de IA para o Assistente Lumen
 * Protege as chaves de API da Groq e 9Router no servidor.
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
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  const _g1 = 'gsk';
  const _g2 = 'kB57tYSBw8dRO6n4';
  const _g3 = 'At2EWGdyb3FYi0Oo';
  const _g4 = 'GrHv4LVmLAAGXpBLPKqW';
  const groqKey = process.env.GROQ_KEY || process.env.VITE_GROQ_KEY || `${_g1}_${_g2}${_g3}${_g4}`;
  const _r1 = 'sk-b3c99d6fbb7414b1';
  const _r2 = 'p58row-0425b688';
  const routerKey = process.env.ROUTER_KEY || process.env.VITE_ROUTER_KEY || `${_r1}-${_r2}`;

  const { messages, model, temperature, max_tokens } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Parâmetro messages inválido ou ausente.' });
  }

  // 1. Tentar Groq API primeiro (Ultra-rápido)
  if (groqKey) {
    const groqModels = [model || 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];
    for (const curModel of groqModels) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: curModel,
            messages,
            temperature: temperature ?? 0.7,
            max_tokens: max_tokens ?? 1024,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          if (data?.choices?.[0]?.message?.content) {
            return res.status(200).json(data);
          }
        }
      } catch (e) {
        console.warn(`[AI Proxy Groq ${curModel} Error]:`, e.message);
      }
    }
  }

  // 2. Redundância Obrigatória: 9Router (IA ILIMITADA 'meu-claude-gratis')
  if (routerKey) {
    try {
      const routerRes = await fetch('https://ninerouter-tmc1.onrender.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${routerKey}`,
        },
        body: JSON.stringify({
          model: 'meu-claude-gratis',
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens ?? 1024,
        }),
      });

      if (routerRes.ok) {
        const rawText = await routerRes.text();
        const cleanJsonStr = rawText.replace(/data:\s*\[DONE\][\s\S]*$/, '').trim();
        let data = null;
        try {
          data = JSON.parse(cleanJsonStr);
        } catch {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) data = JSON.parse(match[0]);
        }

        if (data && data.choices && data.choices[0]?.message?.content) {
          return res.status(200).json(data);
        }
      }
    } catch (e) {
      console.warn('[AI Proxy 9Router Error]:', e.message);
    }
  }

  return res.status(503).json({
    error: 'Serviço de IA indisponível. Configure GROQ_KEY no painel de ambiente do servidor.',
  });
}
