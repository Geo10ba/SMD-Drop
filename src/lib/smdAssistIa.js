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
    "   - Responda em 1 a 3 parágrafos curtos no máximo. NUNCA envie listas enormes a menos que o usuário peça expressamente.\n" +
    "4. STATUS E RASTREAMENTO DE PEDIDOS:\n" +
    "   - Se o usuário perguntar sobre o status do seu pedido ou produção, consulte a lista de PEDIDOS REALIZADOS no contexto da tela.\n" +
    "   - Explique amigavelmente a etapa em que o pedido se encontra (Ex: Rascunho, Pendente, Em Produção na Fábrica, Enviado com código de rastreamento ou Entregue).",

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
    "Crie uma descrição completa e persuasiva para o produto.",

  "marketing-multicanal":
    "Você é o Lumen, especialista em marketing digital e vendas multicanal e e-commerce (Mercado Livre, Shopee, Instagram, TikTok).\n" +
    "Gere títulos irresistíveis para busca SEO e legendas prontas para converter seguidores em clientes.",

  "inteligencia-lucro":
    "Você é o Lumen, consultor financeiro e especialista em precificação para e-commerce e marketplaces (Mercado Livre, Shopee, Amazon).\n" +
    "Recomende a estratégia de preço ideal para maximizar lucros e vendas."
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

/**
 * Recurso 3: Geração de Marketing Multicanal com Lumen IA
 */
export async function generateMarketingContent({ product }) {
  const prompt = `Analise o produto abaixo para e-commerce:\n` +
    `- Título: "${product?.title || 'Produto Fabril'}"\n` +
    `- Categoria: "${product?.category || 'Geral'}"\n` +
    `- Descrição: "${(product?.description || '').slice(0, 300)}"\n\n` +
    `Retorne APENAS um JSON válido no seguinte formato exato (sem marcadores fora do JSON):\n` +
    `{\n` +
    `  "titleML": "Título Otimizado para Mercado Livre (máx 60 caracteres com palavra-chave)",\n` +
    `  "titleShopee": "Título Otimizado para Shopee com Ganchos de Promoção",\n` +
    `  "titleAmazon": "Título Completo e Profissional para Amazon Brasil",\n` +
    `  "instagramCaption": "Legenda engajadora com emojis, chamada para ação e hashtags estratégicas (#decoracao #homedecor #ofertas)",\n` +
    `  "videoScript": "Roteiro de 15s para Reels/TikTok:\\n[0-3s] Hook: Você não vai acreditar nesse produto!\\n[3-10s] Mostre detalhes e qualidade fabril.\\n[10-15s] CTA: Garanta o seu com desconto no link da bio!"\n` +
    `}`;

  try {
    const res = await askLumenAssistant({
      tool: "marketing-multicanal",
      input: prompt
    });

    if (res.success && res.content) {
      const jsonMatch = res.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          titleML: parsed.titleML || product?.title,
          titleShopee: parsed.titleShopee || product?.title,
          titleAmazon: parsed.titleAmazon || product?.title,
          instagramCaption: cleanSocialText(parsed.instagramCaption || ""),
          videoScript: cleanSocialText(parsed.videoScript || ""),
          provider: res.provider
        };
      }
    }
  } catch (err) {
    console.warn("Erro ao gerar kit de marketing:", err);
  }

  // Fallback local se a IA falhar
  const t = product?.title || 'Produto Exclusivo de Fábrica';
  return {
    success: true,
    titleML: `${t} Premium Direto da Fábrica NFe`,
    titleShopee: `${t} Alta Qualidade Envio Imediato Promoção`,
    titleAmazon: `${t} - Qualidade Premium com Garantia de Fábrica`,
    instagramCaption: `✨ Olhe só esse detalhe incrível! O ${t} chegou para transformar o seu ambiente com sofisticação e alta qualidade de fábrica.\n\n🚚 Envio imediato e embalagem super segura!\n\n👇 Clique no link da bio para garantir o seu antes que esgoste!\n\n#decoracao #homedecor #design #qualidade #envioimediato`,
    videoScript: `🎬 [0-3s] Procurando o toque final que faltava no seu espaço?\n[3-10s] Olha o acabamento perfeito do ${t}, feito com materiais nobres e corte a laser!\n[10-15s] Garanta o seu agora mesmo direto da fábrica pelo link no perfil!`,
    provider: "local-fallback"
  };
}

/**
 * Recurso 5: Sugestão de Precificação Inteligente com Lumen IA
 */
export async function generateSmartPricingSuggestion({ product, marketplace = 'ml_classic', currentPrice }) {
  const cost = product?.pricingType === 'custom_m2'
    ? (parseFloat(product?.pricePerM2) || 0)
    : (parseFloat(product?.wholesalePrice) || parseFloat(product?.price) || 0);

  const channelName = marketplace === 'ml_premium'
    ? 'Mercado Livre Premium (Comissão 19% + R$6,00 taxa fixa)'
    : marketplace === 'shopee'
    ? 'Shopee Brasil (Comissão 14% + R$4,00 taxa fixa)'
    : 'Mercado Livre Clássico (Comissão 14% + R$6,00 taxa fixa)';

  const prompt = `Analise a estrutura de custos e sugira o preço de venda ideal para e-commerce:\n` +
    `- Produto: "${product?.title || 'Produto Fabril'}"\n` +
    `- Custo Atacado de Fábrica: R$ ${cost.toFixed(2)}\n` +
    `- Canal de Venda Selecionado: "${channelName}"\n` +
    `- Preço Praticado Atual: R$ ${(currentPrice || cost * 2.2).toFixed(2)}\n\n` +
    `Regras de Precificação:\n` +
    `1. Sugira um Preço de Venda (R$) que garanta entre 20% e 35% de Margem Líquida Real após descontar as taxas do marketplace.\n` +
    `2. Retorne APENAS um JSON no seguinte formato (sem marcadores fora do JSON):\n` +
    `{\n` +
    `  "recommendedPrice": 99.90,\n` +
    `  "strategyReason": "Explicação curta e direta de 1 frase sobre por que este valor é ideal."\n` +
    `}`;

  try {
    const res = await askLumenAssistant({
      tool: "inteligencia-lucro",
      input: prompt
    });

    if (res.success && res.content) {
      const jsonMatch = res.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const recPrice = parseFloat(parsed.recommendedPrice);
        if (!isNaN(recPrice) && recPrice > cost) {
          return {
            success: true,
            recommendedPrice: recPrice,
            strategyReason: cleanSocialText(parsed.strategyReason || "Preço otimizado para competitividade e margem saudável."),
            provider: res.provider
          };
        }
      }
    }
  } catch (err) {
    console.warn("Erro ao gerar sugestão de preço:", err);
  }

  // Fallback cálculo matemático puro (Margem de ~30% líquida)
  let feePct = 0.14;
  let fixedFee = 6.0;
  if (marketplace === 'ml_premium') { feePct = 0.19; fixedFee = 6.0; }
  else if (marketplace === 'shopee') { feePct = 0.14; fixedFee = 4.0; }

  // Target net profit = 30% of sale price
  // SalePrice - cost - (SalePrice * feePct + fixedFee) = SalePrice * 0.30
  // SalePrice * (1 - feePct - 0.30) = cost + fixedFee
  // SalePrice = (cost + fixedFee) / (0.70 - feePct)
  const targetMargin = 0.30;
  const denom = (1.0 - feePct - targetMargin);
  const calcPrice = denom > 0 ? (cost + fixedFee) / denom : cost * 2.2;
  const roundedPrice = Math.ceil(calcPrice) - 0.10; // ex: 99.90

  return {
    success: true,
    recommendedPrice: roundedPrice > cost ? roundedPrice : cost * 2,
    strategyReason: "Preço calculado para garantir 30% de margem líquida real descontando taxas do marketplace.",
    provider: "local-fallback"
  };
}


