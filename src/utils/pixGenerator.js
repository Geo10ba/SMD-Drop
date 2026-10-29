/**
 * Utilitário Oficial para Geração de Payload PIX (BR Code / EMVCo) e QR Code
 * Compatível com todos os bancos do Brasil (Nubank, Itaú, Bradesco, Santander, Inter, BB, Mercado Pago, etc.)
 */

export const SMD_DROP_CNPJ = '41853955000179';
export const SMD_DROP_CNPJ_FORMATTED = '41.853.955/0001-79';
export const SMD_DROP_BENEFICIARY = 'SMD DROP LASER';
export const SMD_DROP_CITY = 'SAO PAULO';

/**
 * Formata um campo no padrão EMV (ID + Tamanho com 2 dígitos + Conteúdo)
 */
function formatEMV(id, value) {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Cálculo de CRC-16 (CCITT-FALSE: polinômio 0x1021, valor inicial 0xFFFF)
 * Exigido pelo Banco Central no campo 63 do BR Code
 */
function calculateCRC16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera o payload oficial do PIX Copia e Cola para o CNPJ 41853955000179
 * @param {number} amount Valor em Reais (ex: 250.00)
 * @param {string} txid Identificador opcional da transação (ex: RECARGA123)
 * @returns {string} Código PIX completo pronto para Copiar e Colar
 */
export function generatePixPayload({
  key = SMD_DROP_CNPJ,
  beneficiary = SMD_DROP_BENEFICIARY,
  city = SMD_DROP_CITY,
  amount,
  txid = '***'
}) {
  const cleanKey = key.replace(/\D/g, '');
  
  // Campo 26: Merchant Account Information - PIX
  const gui = formatEMV('00', 'br.gov.bcb.pix');
  const keyField = formatEMV('01', cleanKey);
  const merchantAccountInfo = formatEMV('26', `${gui}${keyField}`);

  // Campos básicos
  const payloadFormatIndicator = formatEMV('00', '01');
  const merchantCategoryCode = formatEMV('52', '0000');
  const transactionCurrency = formatEMV('53', '986'); // BRL
  
  // Campo 54: Valor (opcional no PIX, mas obrigatório para recargas específicas)
  let transactionAmount = '';
  if (amount && Number(amount) > 0) {
    const formattedAmount = Number(amount).toFixed(2);
    transactionAmount = formatEMV('54', formattedAmount);
  }

  const countryCode = formatEMV('58', 'BR');
  const merchantName = formatEMV('59', beneficiary.slice(0, 25));
  const merchantCity = formatEMV('60', city.slice(0, 15));

  // Campo 62: Additional Data Field (TxID)
  const cleanTxid = (txid || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';
  const additionalDataField = formatEMV('62', formatEMV('05', cleanTxid));

  // Montagem do payload sem CRC
  const rawPayload = `${payloadFormatIndicator}${merchantAccountInfo}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantName}${merchantCity}${additionalDataField}6304`;

  // Cálculo do CRC16
  const crc = calculateCRC16(rawPayload);

  return `${rawPayload}${crc}`;
}

/**
 * Gera URL de imagem do QR Code escaneável
 */
export function getQrCodeImageUrl(pixCode, size = 300) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(pixCode)}`;
}
