/**
 * Módulo de Integração com Mercado Pago & PIX
 * Copiado e integrado do projeto shop-my-dreams para o SMD Drop
 */

const MP_CONFIG_KEY = "smddrop:mercadopago_config";

export const defaultMercadoPagoConfig = {
  publicKey: "APP_USR-3f850b72-b202-46d8-a8ee-4ace03c5effb",
  accessToken: "APP_USR-8005269201741053-081521-0468bfddeb86eb88b9f188cbf63ada1a-359822476",
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
      publicKey: parsed.publicKey && parsed.publicKey.trim() ? parsed.publicKey : defaultMercadoPagoConfig.publicKey,
      accessToken: parsed.accessToken && parsed.accessToken.trim() ? parsed.accessToken : defaultMercadoPagoConfig.accessToken,
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
 * Cria uma Preferência de Checkout Pro no Mercado Pago
 */
export async function createMercadoPagoPreference(payload) {
  const config = getMercadoPagoConfig();
  if (!config.accessToken) {
    return { success: false, error: "Access Token do Mercado Pago não configurado no painel Admin." };
  }

  try {
    let origin = "https://smddrop.com.br";
    if (typeof window !== "undefined" && window.location.origin) {
      const curOrigin = window.location.origin;
      if (curOrigin.startsWith("https://") && !curOrigin.includes("localhost") && !curOrigin.includes("127.0.0.1")) {
        origin = curOrigin;
      }
    }

    const bodyPayload = {
      items: payload.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        currency_id: "BRL",
        unit_price: Number(item.unit_price.toFixed(2)),
      })),
      payer: {
        name: payload.payer.name,
        email: payload.payer.email,
      },
      back_urls: {
        success: `${origin}/?status=success`,
        failure: `${origin}/?status=failure`,
        pending: `${origin}/?status=pending`,
      },
      auto_return: "approved",
      external_reference: payload.external_reference || `order-${Date.now()}`,
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await response.json();
    if (!response.ok) {
      const errorDetail =
        data.message ||
        data.cause?.[0]?.description ||
        (data.cause ? JSON.stringify(data.cause) : "Erro ao criar checkout Mercado Pago.");
      return { success: false, error: errorDetail };
    }

    return {
      success: true,
      initPoint: config.isSandbox && data.sandbox_init_point ? data.sandbox_init_point : data.init_point,
      id: data.id,
    };
  } catch (err) {
    return { success: false, error: err.message || "Erro de conexão com o Mercado Pago." };
  }
}

/**
 * Cria um pagamento instantâneo via PIX no Mercado Pago
 */
export async function createMercadoPagoPixPayment(payload) {
  const config = getMercadoPagoConfig();
  if (!config.accessToken) {
    return { success: false, error: "Access Token do Mercado Pago não configurado." };
  }

  try {
    const bodyPayload = {
      transaction_amount: Number(payload.transaction_amount.toFixed(2)),
      description: payload.description,
      payment_method_id: "pix",
      payer: {
        email: payload.payer.email,
        first_name: payload.payer.first_name,
        last_name: payload.payer.last_name || "",
      },
    };

    if (payload.payer.identification?.number) {
      bodyPayload.payer.identification = {
        type: payload.payer.identification.type || "CPF",
        number: payload.payer.identification.number.replace(/\D/g, ""),
      };
    }

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
        "X-Idempotency-Key": `pix-${Date.now()}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || data.cause?.[0]?.description || "Erro ao gerar PIX Mercado Pago." };
    }

    const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;

    return {
      success: true,
      paymentId: data.id,
      status: data.status,
      qrCode,
      qrCodeBase64,
    };
  } catch (err) {
    return { success: false, error: err.message || "Erro na geração do PIX." };
  }
}
