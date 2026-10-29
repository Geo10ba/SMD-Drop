// Supabase Edge Function: Webhook Receiver para API Pix Banco Inter PJ
// Endpoint: https://<SEU-PROJETO>.supabase.co/functions/v1/banco-inter-webhook
// Quando o cliente paga no Banco Inter, o Inter envia um POST para cá em ~1 segundo.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Tratamento de preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log("⚡ Webhook Banco Inter Recebido:", JSON.stringify(body));

    // Formato do payload Pix Banco Inter:
    // { pix: [ { endToEndId, txid, valor, horario, pagador } ] }
    const pixList = body.pix || (Array.isArray(body) ? body : [body]);

    for (const item of pixList) {
      const txid = item.txid;
      const valor = parseFloat(item.valor);

      if (!txid) continue;

      console.log(`Processando baixa PIX TxID: ${txid} | Valor: R$ ${valor}`);

      // 1. Verificar se é uma Recarga de Carteira
      if (txid.startsWith("REC")) {
        // Gravar no histórico de transações da carteira do revendedor
        await supabase.from("wallet_transactions").insert({
          txid: txid,
          amount: valor,
          type: "credit",
          description: `Recarga PIX Inter PJ #${txid}`,
          created_at: item.horario || new Date().toISOString()
        });
      }

      // 2. Verificar se é Pagamento de Pedido
      if (txid.startsWith("PED") || txid.startsWith("ORD")) {
        // Atualizar pedido para "pagamento_confirmado" na linha de produção
        await supabase
          .from("orders")
          .update({
            status: "pagamento_confirmado",
            payment_status: "paid",
            paid_at: item.horario || new Date().toISOString()
          })
          .eq("id", txid.replace("PED-", "").replace("PED", "ORD-"));
      }
    }

    return new Response(JSON.stringify({ status: "success", received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro no processamento do webhook Inter:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
