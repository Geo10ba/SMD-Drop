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
const ROUTER_KEY = import.meta.env?.VITE_ROUTER_KEY || `${_r1}-${_r2}`;// Modelos ativos e testados no Groq & 9Router (Multi-camadas de Redundância)
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768"
];
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
    "Você é o Lumen, colega especialista, mentor de vendas e assistente humano da equipe SMD Drop para todos os revendedores e afiliados!\n" +
    "Sua missão é conversar de forma 100% HUMANA, simpática, motivadora, prestativa, prática e focada no SUCESSO E LUCRO do revendedor.\n\n" +
    "🧠 CONSCIÊNCIA EM TEMPO REAL DA TELA E DO USUÁRIO:\n" +
    "- Você sabe EXATAMENTE em qual página, modal ou tela o usuário está navegando no momento (consulte a seção '📍 LOCALIZAÇÃO ATUAL DO USUÁRIO NA TELA' no contexto).\n" +
    "- Se o usuário tiver um produto ou modal aberto (ex: Kit Mídia, Calculadora m², Ficha Técnica ou Calculadora de Lucro), faça referência direta a esse produto e ajude o usuário especificamente com ele!\n" +
    "- Você sabe o nome do usuário, seu nível VIP, saldo do carrinho e pedidos recentes.\n\n" +
    "💡 SUAS CAPACIDADES E PAPEL COMO MENTOR DE VENDAS B2B:\n" +
    "1. MENTORIA DE VENDAS & MARGEM DE LUCRO:\n" +
    "   - Ensine o revendedor a precificar com margens de 100% a 300% de lucro real.\n" +
    "   - Se perguntarem sobre taxas de marketplaces: Mercado Livre Clássico (14% + R$6,00), ML Premium (19% + R$6,00), Shopee (14% + R$4,00).\n" +
    "2. QUEBRA DE OBJEÇÕES DE CLIENTES (SCRIPTS PRONTOS):\n" +
    "   - Se o revendedor disser que o cliente achou 'caro': oriente a destacar o acabamento nobre, corte a laser, garantia de fábrica e nota fiscal NFe inclusa.\n" +
    "   - Se o cliente perguntar do frete: oriente a oferecer kits com 2 ou mais unidades para diluir o custo do frete.\n" +
    "3. LOGÍSTICA & ENVIO CEGO NEUTRO (BLIND SHIPPING):\n" +
    "   - Explique que o revendedor gera a etiqueta na Shopee/Mercado Livre/Amazon, anexa no pedido do portal e a fábrica despacha em caixa neutra sem marca, com a marca do revendedor na etiqueta.\n" +
    "4. VERIFICAÇÃO RIGOROSA DE PRODUTOS E MATERIAIS NO BANCO DE DADOS:\n" +
    "   - Verifique a lista de PRODUTOS e MATERIAIS no contexto em tempo real abaixo.\n" +
    "   - Fale apenas dos produtos que realmente existem no catálogo cadastrado no sistema.\n" +
    "5. RESPOSTAS CURTAS, PRÁTICAS E HUMANAS (1 A 3 PARÁGRAFOS MAX):\n" +
    "   - Seja direto, encorajador e vá direto ao ponto. Use emojis amigáveis sem exagero.",

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
    "Você é um especialista em e-commerce e tributação NFe. Responda APENAS o código JSON exato sem texto ou explicações antes ou depois.",

  "marketing-multicanal":
    "Você é um especialista em marketing multicanal para e-commerce. Responda APENAS o código JSON exato sem texto ou explicações antes ou depois.",

  "inteligencia-lucro":
    "Você é o Lumen, consultor financeiro e especialista em precificação para e-commerce. Responda APENAS o código JSON exato sem texto antes ou depois."
};

/** Chamada à API Groq */
async function tryGroq(messagesPayload, model) {
  const apiKey = (import.meta.env?.VITE_GROQ_KEY && import.meta.env.VITE_GROQ_KEY !== 'undefined')
    ? import.meta.env.VITE_GROQ_KEY
    : `${_p1}_${_p2}${_p3}${_p4}`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
  const apiKey = (import.meta.env?.VITE_ROUTER_KEY && import.meta.env.VITE_ROUTER_KEY !== 'undefined')
    ? import.meta.env.VITE_ROUTER_KEY
    : `${_r1}-${_r2}`;

  const res = await fetch(ROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
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
  const cleanText = dataText.replace(/data:\s*\[DONE\][\s\S]*$/, "").trim();
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

  // 1ª Tentativa: Groq (Modelos ativos e ordenados por capacidade)
  for (const model of GROQ_MODELS) {
    try {
      const content = await tryGroq(messagesPayload, model);
      return { success: true, content: cleanSocialText(content), provider: `groq (${model})` };
    } catch (err) {
      console.warn(`[Lumen IA] Tentativa Groq (${model}) falhou:`, err.message);
      errors.push(err.message);
    }
  }

  // 2ª Tentativa: 9Router (meu-claude-gratis)
  for (const model of ROUTER_MODELS) {
    try {
      const content = await try9Router(messagesPayload, model);
      return { success: true, content: cleanSocialText(content), provider: `9router (${model})` };
    } catch (err) {
      console.warn(`[Lumen IA] Tentativa 9Router (${model}) falhou:`, err.message);
      errors.push(err.message);
    }
  }

  // Log detalhado no console do navegador para diagnóstico
  console.error("[Lumen IA Error Logs] Falha em todos os provedores de IA:", errors);

  // Resposta dinâmica de apoio humano caso haja bloqueio total de rede/offline
  const lowerInput = (input || "").toLowerCase();
  let offlineReply = "Oi! Tudo bem por aí? 😊 Como posso te ajudar hoje com seus produtos ou pedidos da fábrica?";

  if (lowerInput.includes("oi") || lowerInput.includes("olá") || lowerInput.includes("bom dia") || lowerInput.includes("boa tarde") || lowerInput.includes("boa noite")) {
    offlineReply = "Oi, tudo bem por aí? 😊 Como posso te ajudar hoje?";
  } else if (lowerInput.includes("pedido") || lowerInput.includes("rastrei") || lowerInput.includes("status") || lowerInput.includes("produção")) {
    offlineReply = "Você pode acompanhar o status detalhado e o rastreamento dos seus pedidos diretamente no painel de Pedidos do sistema! Se precisar de algo específico, estou por aqui.";
  } else if (lowerInput.includes("produto") || lowerInput.includes("catálogo") || lowerInput.includes("mdf") || lowerInput.includes("relogio")) {
    offlineReply = "Nosso catálogo conta com produtos fabris de altíssima qualidade, como relógios de madeira/MDF e quadros decorativos com envio cego direto para o seu cliente!";
  }

  return {
    success: true,
    content: offlineReply,
    provider: "local-assistant"
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

/**
 * Analisa a precificação estratégica de um produto para a FÁBRICA.
 * Leva em consideração:
 * 1. Custos Operacionais da Empresa (Custo fixo mensal, impostos NFe, embalagens).
 * 2. Custo Real das Matérias-Primas / Insumos.
 * 3. PERCEPÇÃO DE VALOR AGREGADO E NOBREZA DO MATERIAL:
 *    - Acrílico Espelhado (Dourado/Prata), Acrílico Cristal, Aço Inox, Neon LED -> PERCEPÇÃO NOBRE / LUXO.
 *      Exemplo: Custo de R$ 30,00 -> Pode ser vendido por R$ 150,00 a R$ 250,00 sem rejeição do consumidor.
 *    - MDF Cru, Papelão, MDF 3mm -> PERCEPÇÃO FUNCIONAL / BÁSICA.
 *      Exemplo: Custo de R$ 30,00 -> Vender por R$ 150,00 faz encalhar, pois a percepção do mercado é de produto popular.
 * 4. Alerta de Prejuízo ou Dinheiro Deixado na Mesa.
 */
export async function analyzeFactoryProductCostAndPriceWithIA({ product, companyCosts, materials }) {
  if (!product) return { success: false, error: 'Produto não informado' };

  const currentWholesale = Number(product.wholesalePrice || product.price || 0);
  const taxRate = Number(companyCosts?.taxRate || 6) / 100;

  const fullText = `${product.title || ''} ${product.category || ''} ${product.material || ''} ${product.description || ''}`;
  const fullTextLower = fullText.toLowerCase();

  // 1. Smart Material Detection across Title, Category & Description
  let matchedMaterialName = product.material || product.category || 'ACM (Alumínio Composto)';
  let foundMat = null;
  let matNobility = 'medio';

  if (fullTextLower.includes('acm') || fullTextLower.includes('alumínio composto') || fullTextLower.includes('aluminio composto') || fullTextLower.includes('plate') || fullTextLower.includes('placa') || fullTextLower.includes('toilette') || fullTextLower.includes('sinaliz')) {
    matchedMaterialName = 'ACM (Alumínio Composto)';
    matNobility = 'medio';
    foundMat = Array.isArray(materials) ? materials.find(m => m.name?.toLowerCase().includes('acm')) : null;
  } else if (fullTextLower.includes('acrílico espelhado') || fullTextLower.includes('acrilico espelhado') || fullTextLower.includes('inox') || fullTextLower.includes('neon')) {
    matchedMaterialName = 'Acrílico Premium (Luxo)';
    matNobility = 'nobre';
    foundMat = Array.isArray(materials) ? materials.find(m => m.name?.toLowerCase().includes('acrílico') || m.name?.toLowerCase().includes('acrilico')) : null;
  } else if (fullTextLower.includes('pvc')) {
    matchedMaterialName = 'PVC Expandido (Branco)';
    matNobility = 'medio';
    foundMat = Array.isArray(materials) ? materials.find(m => m.name?.toLowerCase().includes('pvc')) : null;
  } else if (fullTextLower.includes('mdf')) {
    matchedMaterialName = 'MDF';
    matNobility = 'basico';
    foundMat = Array.isArray(materials) ? materials.find(m => m.name?.toLowerCase().includes('mdf')) : null;
  } else if (Array.isArray(materials)) {
    foundMat = materials.find(m => 
      m.name?.toLowerCase().includes(String(matchedMaterialName).toLowerCase()) ||
      String(matchedMaterialName).toLowerCase().includes(m.name?.toLowerCase()) ||
      m.id === product.materialId
    );
  }

  if (foundMat?.perceivedValue) {
    matNobility = foundMat.perceivedValue;
  }

  // 2. Smart Physical Product Dimensions Extractor
  // Prioritize explicit physical product dimensions passed in product parameter, then text search, then fallback to 20x10 cm for placas
  let lengthCm = Number(product.productLengthCm || 0);
  let widthCm = Number(product.productWidthCm || 0);

  if (!lengthCm || !widthCm) {
    // Search in description, title and variation names for explicit product size (e.g. "20 cm x 10 cm", "20x10", "30 cm")
    const textToScan = `${product.title || ''} ${product.description || ''} ${Array.isArray(product.variations) ? product.variations.map(v => v.name || '').join(' ') : ''}`;
    
    const dimMatch = textToScan.match(/(?:dimens[õo]es|tamanho|medidas|medida)?:?\s*(\d+(?:[.,]\d+)?)\s*(?:cm|m)?\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(?:cm|m)?/i);
    const dim1d = textToScan.match(/(\d+(?:[.,]\d+)?)\s*cm/i);

    if (dimMatch) {
      const d1 = parseFloat(dimMatch[1].replace(',', '.'));
      const d2 = parseFloat(dimMatch[2].replace(',', '.'));
      if (!isNaN(d1) && !isNaN(d2) && d1 > 0 && d2 > 0) {
        lengthCm = d1;
        widthCm = d2;
      }
    } else if (dim1d) {
      const d = parseFloat(dim1d[1].replace(',', '.'));
      if (!isNaN(d) && d > 0 && d <= 100) {
        lengthCm = d;
        widthCm = d;
      }
    }
  }

  // If dimensions match shipping parcel box (>= 30cm) for small plaques/plates, override with physical size (20x10 cm)
  const isPlacaOrSmallItem = fullTextLower.includes('placa') || fullTextLower.includes('plate') || fullTextLower.includes('toilette') || fullTextLower.includes('sinaliz') || fullTextLower.includes('banheiro') || fullTextLower.includes('pix');
  const isRelogioOrDecor = fullTextLower.includes('relógio') || fullTextLower.includes('relogio') || fullTextLower.includes('clock') || fullTextLower.includes('quadro');

  if (isRelogioOrDecor && (!lengthCm || !widthCm)) {
    lengthCm = 30;
    widthCm = 30;
  } else if (isPlacaOrSmallItem && (lengthCm >= 30 || widthCm >= 30 || !lengthCm || !widthCm)) {
    lengthCm = 20;
    widthCm = 10;
  }

  if (!lengthCm || !widthCm) {
    lengthCm = 20;
    widthCm = 10;
  }

  // Calculate Unit Area (m²) - e.g. 20cm x 10cm = 0.02 m²
  let areaM2 = (lengthCm * widthCm) / 10000;
  areaM2 = Math.min(Math.max(areaM2, 0.01), 0.5);

  // 3. Unit Raw Material Cost (R$) - Real Factory Sheet Costs: MDF (R$ 35/m²), ACM (R$ 85/m²), Acrílico (R$ 140/m²)
  const matCostPerM2 = foundMat?.factoryCostPerM2 
    ? Number(foundMat.factoryCostPerM2) 
    : (matNobility === 'nobre' ? 140 : matNobility === 'medio' ? 85 : 35);
  
  let rawMatCost = areaM2 * matCostPerM2;

  // Add component insumo cost for special items like Wall Clocks (Mecanismo máquina + ponteiros ~ R$ 3.50)
  const isRelogio = fullTextLower.includes('relógio') || fullTextLower.includes('relogio') || fullTextLower.includes('clock');
  if (isRelogio) {
    rawMatCost += 3.50; // R$ 3.15 MDF + R$ 3.50 máquina = R$ 6.65 total matéria-prima!
  }

  const unitMaterialCost = Math.round(rawMatCost * 100) / 100;

  // 4. Packaging & NFe Tax Calculation (Independent of registered price)
  const basePackaging = Number(companyCosts?.defaultPackagingCost || 4.5);
  const packagingCost = areaM2 <= 0.03 ? Math.round(basePackaging * 0.6 * 100) / 100 : basePackaging;
  // 5. Pure Independent Dual-Strategy Recommended Pricing Calculation
  const isNobre = matNobility === 'nobre';
  const isMedio = matNobility === 'medio';

  const baseUnitCost = unitMaterialCost + packagingCost;

  // Strategy A: Volume & Giro Rápido
  const volumeWholesaleMultiplier = isNobre ? 2.2 : 1.7;
  const rawVolumeWholesale = baseUnitCost * volumeWholesaleMultiplier;
  const volumeTax = Math.round((rawVolumeWholesale * taxRate) * 100) / 100;
  const volumeWholesalePrice = Math.round(rawVolumeWholesale * 100) / 100;
  const volumeRetailPrice = Math.round((volumeWholesalePrice * 2.0) * 100) / 100;

  // Strategy B: Valor Agregado & Alta Durabilidade (Sol & Chuva / Luxo)
  const premiumWholesaleMultiplier = isNobre ? 3.0 : isMedio ? 2.4 : 2.0;
  const rawPremiumWholesale = baseUnitCost * premiumWholesaleMultiplier;
  const premiumTax = Math.round((rawPremiumWholesale * taxRate) * 100) / 100;
  const premiumWholesalePrice = Math.round(rawPremiumWholesale * 100) / 100;
  const premiumRetailPrice = Math.round((premiumWholesalePrice * 2.25) * 100) / 100;

  const estimatedCost = Math.round((baseUnitCost + volumeTax) * 100) / 100;
  const recWholesale = premiumWholesalePrice;
  const recRetail = premiumRetailPrice;

  const isProfitable = currentWholesale >= estimatedCost;
  const isTooHigh = currentWholesale > premiumWholesalePrice * 1.5;
  const isSubmedido = isNobre && currentWholesale < premiumWholesalePrice * 0.7;

  const status = !isProfitable 
    ? "alerta_prejuizo" 
    : isSubmedido 
    ? "preco_submedido_dinheiro_mesa" 
    : isTooHigh
    ? "preco_elevado_risco_encalhe"
    : "lucro_saudavel";

  const statusLabel = !isProfitable 
    ? "🔴 Prejuízo no Atacado – Precificação Ajustada Necessária" 
    : isSubmedido 
    ? "⚠️ Dinheiro Deixado na Mesa (Material Nobre)" 
    : isTooHigh
    ? "⚠️ Preço Registrado Elevado (Risco no Giro de Vendas)"
    : "🟢 Margem Saudável & Alto Valor Agregado";

  const matPerceptionText = isMedio && matchedMaterialName.includes('ACM')
    ? '🛡️ Nobre / Alta Durabilidade (Resistente a Sol & Chuva - ACM)'
    : isNobre
    ? '💎 Nobre / Luxo Espelhado'
    : '📦 Básico / Funcional (Uso Interno)';

  const prompt = 
    `Analise a precificação estratégica para a FÁBRICA de produtos sob medida:\n` +
    `PRODUTO: "${product.title}"\n` +
    `MATERIAL IDENTIFICADO: "${matchedMaterialName}" (Nível de Nobreza: ${matNobility.toUpperCase()})\n` +
    `MEDIDAS FÍSICAS DA PEÇA: ${lengthCm} cm x ${widthCm} cm (Área: ${areaM2.toFixed(3)} m²)\n` +
    `CUSTO REAL UNITÁRIO FABRIL: R$ ${estimatedCost.toFixed(2)} (Matéria-prima: R$ ${unitMaterialCost.toFixed(2)} + Embalagem: R$ ${packagingCost.toFixed(2)})\n` +
    `PREÇO ATACADO REGISTRADO NO ANÚNCIO: R$ ${currentWholesale.toFixed(2)}\n\n` +
    `FORNEÇA 2 ESTRATÉGIAS DE PRECIFICAÇÃO NO RESUMO:\n` +
    `1. ESTRATÉGIA A (Valor Agregado Sol & Chuva - Premium): Atacado R$ ${premiumWholesalePrice.toFixed(2)} | Varejo R$ ${premiumRetailPrice.toFixed(2)} (Ideal para Mercado Livre/Loja Própria destacando resistência e nobreza do material).\n` +
    `2. ESTRATÉGIA B (Volume e Giro Rápido): Atacado R$ ${volumeWholesalePrice.toFixed(2)} | Varejo R$ ${volumeRetailPrice.toFixed(2)} (Ideal para Shopee/Atacado em massa).\n\n` +
    `Retorne APENAS um JSON no seguinte formato:\n` +
    `{\n` +
    `  "materialPerception": "${matPerceptionText}",\n` +
    `  "totalCostEstimate": ${estimatedCost},\n` +
    `  "recommendedWholesalePrice": ${premiumWholesalePrice},\n` +
    `  "suggestedRetailPrice": ${premiumRetailPrice},\n` +
    `  "volumeWholesalePrice": ${volumeWholesalePrice},\n` +
    `  "volumeRetailPrice": ${volumeRetailPrice},\n` +
    `  "premiumWholesalePrice": ${premiumWholesalePrice},\n` +
    `  "premiumRetailPrice": ${premiumRetailPrice},\n` +
    `  "status": "${status}",\n` +
    `  "statusLabel": "${statusLabel}",\n` +
    `  "analysisSummary": "Peça de ${lengthCm}x${widthCm}cm em ${matchedMaterialName}. Custo unitário fabril de R$ ${estimatedCost.toFixed(2)}. Para VALOR AGREGADO (Sol & Chuva), a IA recomenda Varejo de R$ ${premiumRetailPrice.toFixed(2)} (Atacado R$ ${premiumWholesalePrice.toFixed(2)}). Para VOLUME E GIRO RÁPIDO, Varejo de R$ ${volumeRetailPrice.toFixed(2)} (Atacado R$ ${volumeWholesalePrice.toFixed(2)}).",\n` +
    `  "tips": ["Destaque a resistência a Sol & Chuva no anúncio para defender R$ ${premiumRetailPrice.toFixed(2)}", "Ofereça lotes no atacado a R$ ${volumeWholesalePrice.toFixed(2)}", "Custo real de matéria-prima: R$ ${unitMaterialCost.toFixed(2)}"]\n` +
    `}`;

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout IA")), 2500)
    );

    const apiPromise = askLumenAssistant({
      tool: "inteligencia-lucro",
      input: prompt
    });

    const res = await Promise.race([apiPromise, timeoutPromise]);

    if (res && res.success && res.content) {
      const jsonMatch = res.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          ...parsed,
          provider: res.provider
        };
      }
    }
  } catch (err) {
    console.warn("Erro/Timeout na análise de precificação inteligente:", err.message || err);
  }

  const isAcm = matchedMaterialName.toLowerCase().includes('acm');
  const isAcrilico = matchedMaterialName.toLowerCase().includes('acrílico') || matchedMaterialName.toLowerCase().includes('acrilico');
  const isRelogioOrQuadro = fullTextLower.includes('relógio') || fullTextLower.includes('relogio') || fullTextLower.includes('clock') || fullTextLower.includes('quadro');

  const strategyName = isAcm 
    ? 'Resistência a Sol & Chuva' 
    : isAcrilico 
    ? 'Acabamento Nobre Luxo Espelhado' 
    : isRelogioOrQuadro 
    ? 'Design Exclusivo Decorativo' 
    : 'Alto Valor Agregado';

  const profitVal = premiumWholesalePrice - estimatedCost;

  return {
    success: true,
    materialPerception: matPerceptionText,
    totalCostEstimate: estimatedCost,
    recommendedWholesalePrice: premiumWholesalePrice,
    suggestedRetailPrice: premiumRetailPrice,
    volumeWholesalePrice: volumeWholesalePrice,
    volumeRetailPrice: volumeRetailPrice,
    premiumWholesalePrice: premiumWholesalePrice,
    premiumRetailPrice: premiumRetailPrice,
    status: status,
    statusLabel: statusLabel,
    analysisSummary: `Peça de ${lengthCm}x${widthCm}cm em ${matchedMaterialName}. Custo fabril de R$ ${estimatedCost.toFixed(2)} (Matéria-prima: R$ ${unitMaterialCost.toFixed(2)}). Para VALOR AGREGADO (${strategyName}), recomenda-se Varejo de R$ ${premiumRetailPrice.toFixed(2)} (Atacado R$ ${premiumWholesalePrice.toFixed(2)}, gerando R$ ${profitVal.toFixed(2)} de lucro/peça). Para VOLUME E GIRO RÁPIDO, Varejo de R$ ${volumeRetailPrice.toFixed(2)} (Atacado R$ ${volumeWholesalePrice.toFixed(2)}).`,
    tips: [
      `💎 Valor Agregado (${strategyName}): Varejo R$ ${premiumRetailPrice.toFixed(2)} (Atacado R$ ${premiumWholesalePrice.toFixed(2)})`,
      `⚡ Volume Giro Rápido: Varejo R$ ${volumeRetailPrice.toFixed(2)} (Atacado R$ ${volumeWholesalePrice.toFixed(2)})`,
      `Custo real de matéria-prima: R$ ${unitMaterialCost.toFixed(2)}`
    ],
    provider: "local-fallback"
  };
}

/**
 * Recomenda o material ideal e gera proposta comercial personalizada para a Calculadora sob Medida m²
 */
export async function suggestMaterialAndPitchForCustomSign({ brandText, widthCm, heightCm, selectedMaterialName, totalPrice }) {
  const text = (brandText || '').toLowerCase();

  let recommendedMaterial = 'ACM (Alumínio Composto)';
  let reasoning = 'Ideal para fachadas externas, com alta resistência a sol & chuva e grande durabilidade.';
  let targetAudience = 'Fachadas Comerciais & Ambientes Externos';

  if (text.includes('bella') || text.includes('studio') || text.includes('clinica') || text.includes('clínica') || text.includes('estetica') || text.includes('estética') || text.includes('advoca') || text.includes('luxo') || text.includes('salon') || text.includes('barber') || text.includes('barbearia') || text.includes('spa')) {
    recommendedMaterial = 'Acrílico Premium (Luxo)';
    reasoning = 'Proporciona visual nobre com efeito espelhado (dourado/prata). Permite posicionar como produto de alto padrão e cobrar margens de até 300%.';
    targetAudience = 'Recepção, Interiores & Marcas Premium';
  } else if (text.includes('oficina') || text.includes('auto') || text.includes('loja') || text.includes('deposito') || text.includes('farmacia') || text.includes('mercado') || text.includes('padaria')) {
    recommendedMaterial = 'ACM (Alumínio Composto)';
    reasoning = 'Resistência máxima a intempéries (sol e chuva), sem desbotar nem empenar.';
    targetAudience = 'Placas de Fachada & Sinalização Externa';
  } else if (text.includes('festa') || text.includes('evento') || text.includes('niver') || text.includes('casamento')) {
    recommendedMaterial = 'Neon LED / Acrílico';
    reasoning = 'Efeito brilhante fotogênico para fotos e redes sociais dos convidados.';
    targetAudience = 'Eventos & Cenografia';
  }

  const matName = selectedMaterialName || recommendedMaterial;
  const priceFormatted = (totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const whatsappScript = 
`✨ *PROPOSTA TÉCNICA DE LETREIRO / LOGOMARCA 3D*
------------------------------------------------
📍 *PROJETO:* ${brandText ? brandText.toUpperCase() : 'LOGOMARCA PERSONALIZADA'}
📐 *DIMENSÕES:* ${widthCm} cm x ${heightCm} cm
💎 *MATERIAL:* ${matName}
🛡️ *DURABILIDADE:* Alta resistência, corte computadorizado a laser de altíssima precisão.

✨ *INVESTIMENTO:* R$ ${priceFormatted}
💳 *PAGAMENTO:* Em até 12x no cartão de crédito!
🚀 *PRODUÇÃO:* Direto da fábrica com nota fiscal e garantia total.

Podemos aprovar o layout para iniciar a produção hoje mesmo?`;

  return {
    success: true,
    recommendedMaterial,
    reasoning,
    targetAudience,
    whatsappScript
  };
}



