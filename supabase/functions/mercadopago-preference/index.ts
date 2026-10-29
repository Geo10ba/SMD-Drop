// Supabase Edge Function: Criação Segura de Preferência Mercado Pago Checkout Pro
// Endpoint: https://<SEU-PROJETO>.supabase.co/functions/v1/mercadopago-preference

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const mpAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const body = await req.json();

    const token = body.accessToken || mpAccessToken;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Access Token do Mercado Pago não configurado." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      return new Response(
        JSON.stringify({ error: data.message || "Erro no Mercado Pago" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: mpResponse.status }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        initPoint: data.init_point,
        sandboxInitPoint: data.sandbox_init_point,
        id: data.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
