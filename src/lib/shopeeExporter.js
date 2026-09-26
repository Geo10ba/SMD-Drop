/**
 * Utility to export products in Shopee Mass Creation (Criação Básica em Massa) format.
 * 
 * IMPORTANT NOTE ON SHOPEE IMPORT ERRORS:
 * - "Mass Update" spreadsheets downloaded directly from a Shopee Seller account contain store-specific IDs (shop_id, ps_product_id, ps_model_id).
 *   Attempting to upload a Mass Update file from one store into another will fail with "ID do produto não pertence a esta loja".
 * - "Mass Creation" (Criação Básica em Massa) spreadsheets omit shop_id and product IDs, making them 100% universal.
 *   ANY seller/affiliate account can import this file into Shopee Seller Centre -> Meus Produtos -> Carregamento em Massa.
 */

export const generateShopeeMassCreationCSV = (products = [], markupMultiplier = 2.2) => {
  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }

  // Header matching Shopee Mass Creation (Criação em Massa) standard template
  const headers = [
    "Categoria",
    "Nome do Produto",
    "Descrição do Produto",
    "SKU da Origem (Parent SKU)",
    "Nome da Variação 1",
    "Opção da Variação 1",
    "Preço da Variação",
    "Estoque da Variação",
    "SKU da Variação",
    "Preço",
    "Estoque",
    "Peso (kg)",
    "Comprimento (cm)",
    "Largura (cm)",
    "Altura (cm)",
    "Imagem de Capa (URL)",
    "Imagem 2",
    "Imagem 3",
    "Imagem 4",
    "Imagem 5",
    "Imagem 6",
    "Imagem 7",
    "Imagem 8",
    "Imagem 9"
  ];

  const sanitizeStr = (val) => {
    if (val === undefined || val === null) return '';
    // Replace inner double quotes with double double-quotes for CSV escaping
    return String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
  };

  const rows = [];
  rows.push(headers.map(h => `"${h}"`).join(','));

  products.forEach((p) => {
    const title = p.title || 'Produto SMD Drop';
    const description = (p.mediaKit?.copyDescription || p.description || p.title || '').trim();
    const parentSku = p.ean || p.id || `SMD-${p.id}`;
    
    // Price calculation based on wholesale price & multiplier
    const rawCost = p.pricingType === 'custom_m2' 
      ? (parseFloat(p.pricePerM2) || 0) 
      : (parseFloat(p.wholesalePrice) || 0);
    const finalPrice = (rawCost * markupMultiplier).toFixed(2);
    
    // Physical dimensions & weight
    const weight = p.weightKg !== undefined && p.weightKg !== null ? parseFloat(p.weightKg) : 0.5;
    const dims = p.dimensions || {};
    const length = dims.length || 30;
    const width = dims.width || 30;
    const height = dims.height || 10;
    const category = p.category || 'Casa & Decoração';

    // Image URLs (up to 9 images)
    const images = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : [p.image || p.image_url || ''];
    
    const img1 = images[0] || '';
    const img2 = images[1] || '';
    const img3 = images[2] || '';
    const img4 = images[3] || '';
    const img5 = images[4] || '';
    const img6 = images[5] || '';
    const img7 = images[6] || '';
    const img8 = images[7] || '';
    const img9 = images[8] || '';

    const variations = Array.isArray(p.variations) ? p.variations : [];

    if (variations.length > 0) {
      // Product has variations
      variations.forEach((v) => {
        const vCost = parseFloat(v.wholesalePrice) || rawCost;
        const vPrice = (vCost * markupMultiplier).toFixed(2);
        const vStock = v.stock !== undefined ? v.stock : 99;
        const vSku = v.sku || `${parentSku}-${v.name.replace(/[^a-zA-Z0-9]/g, '')}`;

        const row = [
          `"${sanitizeStr(category)}"`,
          `"${sanitizeStr(title)}"`,
          `"${sanitizeStr(description)}"`,
          `"${sanitizeStr(parentSku)}"`,
          `"${sanitizeStr('Variação')}"`,
          `"${sanitizeStr(v.name || 'Padrão')}"`,
          `"${vPrice}"`,
          `"${vStock}"`,
          `"${sanitizeStr(vSku)}"`,
          `""`, // Base price empty when using variations
          `""`, // Base stock empty when using variations
          `"${weight}"`,
          `"${length}"`,
          `"${width}"`,
          `"${height}"`,
          `"${sanitizeStr(img1)}"`,
          `"${sanitizeStr(img2)}"`,
          `"${sanitizeStr(img3)}"`,
          `"${sanitizeStr(img4)}"`,
          `"${sanitizeStr(img5)}"`,
          `"${sanitizeStr(img6)}"`,
          `"${sanitizeStr(img7)}"`,
          `"${sanitizeStr(img8)}"`,
          `"${sanitizeStr(img9)}"`
        ];
        rows.push(row.join(','));
      });
    } else {
      // Simple product without variations
      const baseStock = p.stock !== undefined ? p.stock : 99;
      const row = [
        `"${sanitizeStr(category)}"`,
        `"${sanitizeStr(title)}"`,
        `"${sanitizeStr(description)}"`,
        `"${sanitizeStr(parentSku)}"`,
        `""`, // Var name 1
        `""`, // Var option 1
        `""`, // Var price
        `""`, // Var stock
        `""`, // Var SKU
        `"${finalPrice}"`,
        `"${baseStock}"`,
        `"${weight}"`,
        `"${length}"`,
        `"${width}"`,
        `"${height}"`,
        `"${sanitizeStr(img1)}"`,
        `"${sanitizeStr(img2)}"`,
        `"${sanitizeStr(img3)}"`,
        `"${sanitizeStr(img4)}"`,
        `"${sanitizeStr(img5)}"`,
        `"${sanitizeStr(img6)}"`,
        `"${sanitizeStr(img7)}"`,
        `"${sanitizeStr(img8)}"`,
        `"${sanitizeStr(img9)}"`
      ];
      rows.push(row.join(','));
    }
  });

  // Return CSV string with UTF-8 BOM (\uFEFF) for native Excel support
  return '\uFEFF' + rows.join('\n');
};

export const downloadShopeeMassCreationCSV = (products, markupMultiplier = 2.2, filename = null) => {
  const csvStr = generateShopeeMassCreationCSV(products, markupMultiplier);
  if (!csvStr) return false;

  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const defaultName = products.length === 1 
    ? `shopee_criacao_${(products[0].title || 'produto').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}.csv`
    : `shopee_criacao_massa_catalogo_${Date.now()}.csv`;
    
  link.setAttribute('href', url);
  link.setAttribute('download', filename || defaultName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
