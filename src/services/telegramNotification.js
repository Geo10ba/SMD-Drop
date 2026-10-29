/**
 * Serviço Seguro de Notificações via Telegram
 * Dispara requisições para a API Serverless (/api/telegram/notify),
 * garantindo que nenhum token ou segredo seja exposto no navegador.
 */

/**
 * Notifica sobre um novo pedido realizado
 */
export async function notifyOrderToTelegram(orderData) {
  try {
    const payload = {
      type: 'order_created',
      orderId: orderData.id || orderData.orderId,
      resellerName: orderData.resellerName,
      resellerEmail: orderData.resellerEmail,
      customerName: orderData.customerName || orderData.customerData?.name,
      customerCity: orderData.customerCity || orderData.customerData?.city,
      customerState: orderData.customerState || orderData.customerData?.state,
      wholesaleTotal: orderData.wholesaleTotal,
      shippingTotal: orderData.shippingTotal,
      total: orderData.total ?? orderData.wholesaleTotal,
      paymentMethod: orderData.paymentMethod,
      dispatchMode: orderData.dispatchMode,
      marketplace: orderData.marketplace,
      hasLabel: Boolean(orderData.labelPdf || orderData.label_pdf_url),
      labelFileBase64: orderData.labelFileBase64 || null,
      labelFileName: orderData.labelFileName || orderData.labelPdf || null,
      mercadoPagoFee: orderData.mercadoPagoFee || 0,
      items: (orderData.items || []).map(it => ({
        title: it.title || it.name,
        qty: it.qty || it.quantity || 1,
        unitPrice: it.unitPrice || it.price || 0
      }))
    };

    const res = await fetch('/api/telegram/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn('[Telegram Notify Warning]: Falha na resposta da API', res.status);
    }
  } catch (err) {
    // Não quebra o checkout do revendedor se houver falha de rede
    console.warn('[Telegram Notify Exception]:', err.message);
  }
}

/**
 * Notifica sobre uma recarga de saldo na carteira
 */
export async function notifyWalletRechargeToTelegram({ resellerName, resellerEmail, amount, method, paymentId }) {
  try {
    const payload = {
      type: 'wallet_recharge',
      resellerName,
      resellerEmail,
      amount,
      method: method || 'PIX Automático Mercado Pago',
      paymentId
    };

    const res = await fetch('/api/telegram/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn('[Telegram Wallet Warning]: Falha na resposta da API', res.status);
    }
  } catch (err) {
    console.warn('[Telegram Wallet Exception]:', err.message);
  }
}
