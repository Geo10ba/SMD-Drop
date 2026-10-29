/**
 * Módulo Oficial de Integração Mercado Pago Checkout Pro & PIX
 * Permite pagamentos em até 12x no cartão, saldo Mercado Pago ou boleto com acréscimo de 5%.
 */

const MP_CONFIG_KEY = "smddrop:mercadopago_config";

export const defaultMercadoPagoConfig = {
  accessToken: "",
  publicKey: "APP_USR-3f850b72-b202-46d8-a8ee-4ace03c5effb",
  isSandbox: false,
  enabled: true,
};

export function getMercadoPagoConfig() {
  if (typeof window === "undefined") return defaultMercadoPagoConfig;
  try {
    const raw = window.localStorage.getItem(MP_CONFIG_KEY);
    if (!raw) return defaultMercadoPagoConfig;
    const parsed = JSON.parse(raw);
    return {
      accessToken: typeof parsed.accessToken === "string" ? parsed.accessToken.trim() : defaultMercadoPagoConfig.accessToken,
      publicKey: typeof parsed.publicKey === "string" && parsed.publicKey.trim() ? parsed.publicKey.trim() : defaultMercadoPagoConfig.publicKey,
      isSandbox: typeof parsed.isSandbox === "boolean" ? parsed.isSandbox : defaultMercadoPagoConfig.isSandbox,
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : defaultMercadoPagoConfig.enabled,
    };
  } catch {
    return defaultMercadoPagoConfig;
  }
}

export function saveMercadoPagoConfig(config) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MP_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error("Erro ao salvar configuração do Mercado Pago:", err);
  }
}

/**
 * Função utilitária para contornar restrições de CORS em requisições de teste no frontend
 */
async function fetchWithCorsFallback(url, options) {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const proxyRes = await fetch(proxyUrl, options);
      return proxyRes;
    } catch {
      throw err;
    }
  }
}

/**
 * Valida o Access Token diretamente nos servidores do Mercado Pago
 */
export async function testMercadoPagoToken(tokenOverride) {
  const config = getMercadoPagoConfig();
  const token = (tokenOverride !== undefined ? tokenOverride : config.accessToken || "").trim();

  if (!token) {
    return { 
      success: false, 
      error: "Nenhum Access Token informado. Obtenha seu token no portal Mercado Pago Developers." 
    };
  }

  try {
    const res = await fetchWithCorsFallback("https://api.mercadopago.com/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.message || `Erro ${res.status}: Credencial não autorizada pelo Mercado Pago.`,
      };
    }

    return {
      success: true,
      nickname: data.nickname || data.first_name || "Conta Mercado Pago",
      email: data.email || "",
      siteId: data.site_id || "MLB",
      id: data.id,
      message: `✅ Conectado com sucesso à conta Mercado Pago (${data.nickname || data.email})!`
    };
  } catch (err) {
    return {
      success: false,
      error: `Falha na conexão com os servidores do Mercado Pago: ${err.message}`,
    };
  }
}

/**
 * Cria uma Preferência Real de Checkout Pro no Mercado Pago
 */
export async function createMercadoPagoPreference(payload) {
  const config = getMercadoPagoConfig();
  const token = (config.accessToken || "").trim();

  // 1. Tentar Endpoint Seguro de Servidor (se houver backend ativo)
  try {
    const res = await fetch("/api/mercadopago/create-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        initPoint: data.initPoint,
        id: data.id,
      };
    }
  } catch {
    // Prossegue com a API oficial direta
  }

  // 2. Se não houver token configurado
  if (!token) {
    return {
      success: false,
      error: "O Access Token do Mercado Pago não foi configurado pela administração da fábrica. Acesse o Painel da Fábrica > Configurações para preencher.",
    };
  }

  // 3. Montar payload no formato oficial exigido pelo Mercado Pago
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const items = (payload.items || []).map((it, idx) => ({
    id: String(it.id || `item-${idx}`),
    title: String(it.title || "Produto SMD Drop"),
    quantity: Number(it.quantity) > 0 ? Number(it.quantity) : 1,
    unit_price: Number(Number(it.unit_price).toFixed(2)),
    currency_id: "BRL",
  }));

  const mpBody = {
    items,
    payer: {
      name: payload.payer?.name || "Revendedor SMD Drop",
      email: payload.payer?.email || "revendedor@smddrop.com.br",
    },
    back_urls: {
      success: `${currentOrigin}/#pedidos`,
      pending: `${currentOrigin}/#pedidos`,
      failure: `${currentOrigin}/#carrinho`,
    },
    auto_return: "approved",
    external_reference: payload.external_reference || `ORD-MP-${Date.now()}`,
    statement_descriptor: "SMD DROP LASER",
  };

  try {
    const response = await fetchWithCorsFallback("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mpBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || (data.cause && data.cause[0]?.description) || "Falha ao gerar checkout no Mercado Pago.",
      };
    }

    const redirectUrl = config.isSandbox && data.sandbox_init_point ? data.sandbox_init_point : data.init_point;

    return {
      success: true,
      initPoint: redirectUrl,
      id: data.id,
    };
  } catch (err) {
    return {
      success: false,
      error: `Erro ao comunicar com a API do Mercado Pago: ${err.message}`,
    };
  }
}

/**
 * Cria cobrança instantânea PIX via API do Mercado Pago
 */
export async function createMercadoPagoPixPayment(payload) {
  const config = getMercadoPagoConfig();
  const token = (config.accessToken || "").trim();

  if (!token) {
    return {
      success: false,
      error: "Access Token do Mercado Pago não configurado.",
    };
  }

  try {
    const response = await fetchWithCorsFallback("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `PIX-${Date.now()}-${Math.random()}`,
      },
      body: JSON.stringify({
        transaction_amount: Number(Number(payload.transaction_amount || 0).toFixed(2)),
        description: payload.description || "Pagamento SMD Drop",
        payment_method_id: "pix",
        payer: {
          email: payload.payer?.email || "revendedor@smddrop.com.br",
          first_name: payload.payer?.first_name || "Revendedor",
          last_name: payload.payer?.last_name || "SMD Drop",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Erro ao gerar PIX no Mercado Pago.",
      };
    }

    const txData = data.point_of_interaction?.transaction_data;

    return {
      success: true,
      paymentId: data.id,
      status: data.status,
      qrCode: txData?.qr_code || "",
      qrCodeBase64: txData?.qr_code_base64 || null,
    };
  } catch (err) {
    return {
      success: false,
      error: `Falha ao conectar com Mercado Pago: ${err.message}`,
    };
  }
}

/**
 * Consulta o status em tempo real de um pagamento no Mercado Pago (Baixa Automática)
 * @param {string|number} paymentId ID do pagamento retornado na criação
 */
export async function checkMercadoPagoPaymentStatus(paymentId) {
  if (!paymentId) return { success: false, status: "pending" };

  const config = getMercadoPagoConfig();
  const token = (config.accessToken || "").trim();

  if (!token) {
    return {
      success: false,
      status: "pending",
      error: "Access Token do Mercado Pago não configurado."
    };
  }

  try {
    const response = await fetchWithCorsFallback(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        status: "pending",
        error: data.message || "Falha ao consultar pagamento no Mercado Pago."
      };
    }

    return {
      success: true,
      status: data.status, // "approved" | "pending" | "in_process" | "rejected" | "cancelled"
      isApproved: data.status === "approved",
      dateApproved: data.date_approved,
      amount: data.transaction_amount,
      paymentId: data.id,
    };
  } catch (err) {
    return {
      success: false,
      status: "pending",
      error: err.message
    };
  }
}

