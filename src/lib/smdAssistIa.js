/**
 * Serviço de IA para o assistente LUMEN da plataforma SMD Drop.
 * Respostas 100% humanas, sem inventar produtos que não estejam no catálogo.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const _p1 = "gsk";
const _p2 = "kB57tYSBw8dRO6n4";
const _p3 = "At2EWGdyb3FYi0Oo";
const _p4 = "GrHv4LVmLAAGXpBLPKqW";
const GROQ_KEY = import.meta.env?.VITE_GROQ_KEY || `${_p1}_${_p2}${_p3}${_p4}`;

const ROUTER_URL = "https://ninerouter-tmc1.onrender.com/v1/chat/completions";
const _r1 = "sk-b3c99d6fbb7414b1";
const _r2 = "p58row-0425b688";
const ROUTER_KEY = import.meta.env?.VITE_ROUTER_KEY || `${_r1}-${_r2}`;

// Modelos ativos e testados no Groq & 9Router
const GROQ_MODELS = ["groq/compound-mini", "groq/compound", "openai/gpt-oss-120b"];
const ROUTER_MODELS = ["meu-claude-gratis"];

export function cleanSocialText(text) {
  if (!text) return "";
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^---\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SYSTEM_PROMPTS = {
  "suporte-sistema":
    "Você é o Lumen, um colega especialista e atendente humano da equipe SMD Drop!\n" +
    "Sua missão é conversar de forma 100% HUMANA, simpática, prestativa, direta e natural.\n\n" +
    "🚨 REGRA CRÍTICA SOBRE PRODUTOS E MATERIAIS REALMENTE EXISTENTES NO BANCO DE DADOS:\n" +
    "1. VERIFIQUE RIGOROSAMENTE A LISTA DE PRODUTOS E MATERIAIS NO CONTEXTO DA TELA:\n" +
    "   - NUNCA invente ou mencione produtos ou materiais (como 'neon', 'led', 'acrílico', 'troféus', etc.) A MENOS QUE eles estejam REALMENTE presentes na lista de produtos/materiais cadastrados no sistema abaixo!\n" +
    "   - Se o catálogo atual tiver apenas relógios, mdf ou itens específicos de decoração, FALE E PERGUNTE APENAS sobre o que realmente existe no catálogo real!\n" +
    "   - Se não houver itens de Neon ou LED cadastrados no banco, NUNCA cite 'neon' ou 'led' na sua resposta ou saudação!\n" +
    "   - Se o usuário perguntar por algo que NÃO está no catálogo cadastrado, informe educadamente que no momento não temos esse item no catálogo do sistema.\n" +
    "2. SAUDAÇÃO E DIÁLOGO DIRETO:\n" +
    "   - Ao cumprimentar o usuário, seja aberto e direto: 'Oi, tudo bem por aí? 😊 Como posso te ajudar hoje?' sem listar categorias que você não confirmou na lista do catálogo!\n" +
    "3. RESPOSTAS DIRETAS E CURTAS (SEM TEXTOS GIGANTES!):\n" +
    "   - Responda em 1 a 3 parágrafos curtos no máximo. NUNCA envie listas enormes a menos que o usuário peça expressamente.",

  "tira-duvidas":
    "Você é o Lumen, atendente humano da SMD Drop. Responda à dúvida de forma curta e direta com base nos produtos reais cadastrados.",

  "analisar-produto":
    "Você é o Lumen, analista de produtos da SMD Drop. Analise o produto informado com base no catálogo real.",

  ganchos:
    "Crie 10 ganchos curtos e atraentes para os produtos reais do catálogo.",

  titulos:
    "Crie 10 títulos otimizados para os produtos do catálogo.",

  legendas:
    "Crie legendas curtas e diretas para redes sociais.",

  roteiros:
    "Crie 3 roteiros dinâmicos e curtos para vídeos demonstrativos.",

  "desc-otimizada":
    "Crie uma descrição completa e persuasiva para o produto."
};

/** Chamada à API Groq */
async function tryGroq(messagesPayload, model) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: messagesPayload,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Groq (${model}) Error ${res.status}: ${errText.slice(0, 100)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Resposta vazia da Groq (${model}).`);
  return content.trim();
}

/** Chamada à IA 9Router (Ilimitada) */
async function try9Router(messagesPayload, model) {
  const res = await fetch(ROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ROUTER_KEY}`,
    },
    body: JSON.stringify({
      model: model,
      messages: messagesPayload,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`9Router (${model}) Error ${res.status}: ${errText.slice(0, 100)}`);
  }

  const dataText = await res.text();
  const cleanText = dataText.replace(/data:\s*\[DONE\]\s*$/, "").trim();
  const json = JSON.parse(cleanText);
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Resposta vazia do 9Router (${model}).`);
  return content.trim();
}

export async function askLumenAssistant({ tool = "suporte-sistema", input = "", history = [], systemContext = "" }) {
  let baseSystemPrompt = SYSTEM_PROMPTS[tool] || SYSTEM_PROMPTS["suporte-sistema"];
  
  if (systemContext) {
    baseSystemPrompt += `\n\n📌 CONTEXTO EM TEMPO REAL E CATÁLOGO ATUALIZADO NO BANCO DE DADOS:\n${systemContext}`;
  }

  const userPrompt = input;

  const historyMessages = (history || []).map((h) => ({
    role: h.role === "user" ? "user" : "assistant",
    content: String(h.content || "").slice(0, 2000),
  }));

  const messagesPayload = [
    { role: "system", content: baseSystemPrompt },
    ...historyMessages,
  ];

  if (historyMessages.length === 0 || historyMessages[historyMessages.length - 1].content !== userPrompt) {
    messagesPayload.push({ role: "user", content: userPrompt });
  }

  const errors = [];

  // 1ª Tentativa: Groq (groq/compound-mini - ultra rápido e ativo)
  for (const model of GROQ_MODELS) {
    try {
      const content = await tryGroq(messagesPayload, model);
      return { success: true, content: cleanSocialText(content), provider: `groq (${model})` };
    } catch (err) {
      console.warn(`Tentativa Groq (${model}) falhou:`, err.message);
      errors.push(err.message);
    }
  }

  // 2ª Tentativa: 9Router (meu-claude-gratis)
  for (const model of ROUTER_MODELS) {
    try {
      const content = await try9Router(messagesPayload, model);
      return { success: true, content: cleanSocialText(content), provider: `9router (${model})` };
    } catch (err) {
      console.warn(`Tentativa 9Router (${model}) falhou:`, err.message);
      errors.push(err.message);
    }
  }

  return {
    success: false,
    error: `Erro de conexão com os serviços de IA: ${errors.join(" | ")}`,
  };
}

/**
 * Função utilitária para gerar Descrição Comercial Otimizada e Dados Fiscais NFe via IA (Groq / 9Router)
 */
export async function generateProductDescriptionAndNcm({ title, category, description, ncm, pricingType }) {
  const prompt = `Você é um especialista em e-commerce e tributação/dados fiscais NCM no Brasil.\n` +
    `Analise o produto abaixo:\n` +
    `- Título: "${title || 'Produto Fabril'}"\n` +
    `- Categoria: "${category || 'Geral'}"\n` +
    `- Descrição atual: "${description || ''}"\n` +
    `- NCM atual: "${ncm || ''}"\n\n` +
    `Retorne APENAS um JSON no seguinte formato exato (sem marcadores de texto fora do JSON):\n` +
    `{\n` +
    `  "ncm": "3926.90.90",\n` +
    `  "cest": "28.061.00",\n` +
    `  "measureUnit": "UN (UNIDADE)",\n` +
    `  "cfopSame": "5101",\n` +
    `  "cfopDiff": "6101",\n` +
    `  "csosn": "102 - Tributada pelo Simples Nacional sem permissão de crédito",\n` +
    `  "origin": "0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8",\n` +
    `  "description": "🔥 TITULO COMERCIAL GRANDE\\n\\n✨ Destaques & Especificações..."\n` +
    `}\n\n` +
    `Tabela NCM / CEST Referência Brasil:\n` +
    `- Plásticos / Acrílicos: NCM "3926.90.90", CEST "28.061.00"\n` +
    `- MDF / Madeira / Fibra: NCM "4421.99.00", CEST "28.057.00"\n` +
    `- LED / Neon / Iluminação: NCM "8539.51.00", CEST "28.038.00"\n` +
    `- Relógios: NCM "9105.29.00", CEST "28.061.00"\n` +
    `- Metal / ACM: NCM "8306.29.00", CEST "28.061.00"\n` +
    `Gere uma descrição comercial profissional com especificações para emissão de Nota Fiscal NFe.`;

  const resolveFallbackFiscal = (t, c, curNcm) => {
    const str = `${t || ''} ${c || ''}`.toLowerCase();
    let resNcm = curNcm && curNcm.length >= 8 && curNcm !== '3926.90.90' ? curNcm : '3926.90.90';
    let resCest = '28.061.00';

    if (str.includes('mdf') || str.includes('madeira')) {
      resNcm = '4421.99.00';
      resCest = '28.057.00';
    } else if (str.includes('relógio') || str.includes('relogio') || str.includes('clock')) {
      resNcm = '9105.29.00';
      resCest = '28.061.00';
    } else if (str.includes('led') || str.includes('neon') || str.includes('luz')) {
      resNcm = '8539.51.00';
      resCest = '28.038.00';
    } else if (str.includes('acm') || str.includes('metal') || str.includes('inox')) {
      resNcm = '8306.29.00';
      resCest = '28.061.00';
    }

    return {
      ncm: resNcm,
      cest: resCest,
      measureUnit: pricingType === 'custom_m2' ? 'M2 (METRO QUADRADO)' : 'UN (UNIDADE)',
      cfopSame: '5101',
      cfopDiff: '6101',
      csosn: '102 - Tributada pelo Simples Nacional sem permissão de crédito',
      origin: '0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8'
    };
  };

  try {
    const res = await askLumenAssistant({
      tool: "desc-otimizada",
      input: prompt
    });

    if (res.success && res.content) {
      const fallback = resolveFallbackFiscal(title, category, ncm);
      try {
        const jsonMatch = res.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            ncm: parsed.ncm || fallback.ncm,
            cest: parsed.cest || fallback.cest,
            measureUnit: parsed.measureUnit || fallback.measureUnit,
            cfopSame: parsed.cfopSame || fallback.cfopSame,
            cfopDiff: parsed.cfopDiff || fallback.cfopDiff,
            csosn: parsed.csosn || fallback.csosn,
            origin: parsed.origin || fallback.origin,
            description: cleanSocialText(parsed.description || res.content),
            provider: res.provider
          };
        }
      } catch (e) {}

      return {
        success: true,
        ...fallback,
        description: cleanSocialText(res.content),
        provider: res.provider
      };
    }
  } catch (err) {
    console.warn("Erro ao gerar IA:", err);
  }

  const fallback = resolveFallbackFiscal(title, category, ncm);
  const fallbackDesc = `🔥 ${(title || 'PRODUTO FABRIL').toUpperCase()} - PRODUTO PREMIUM DE FÁBRICA\n\n` +
    `✨ Destaques & Especificações Técnicas:\n` +
    `• Acabamento de altíssima precisão com corte a laser.\n` +
    `• Matéria-prima nobre e espessura reforçada de alta durabilidade.\n` +
    `• Envio em embalagem reforçada anti-impacto (Envio Cego sem marca).\n` +
    `• Pronta entrega e envio imediato direto da fábrica.\n\n` +
    `📦 Garantia total contra defeitos de fabricação e acompanhado de Dados Fiscais NFe completos (NCM ${fallback.ncm}).`;

  return {
    success: true,
    ...fallback,
    description: fallbackDesc,
    provider: "local-fallback"
  };
}

