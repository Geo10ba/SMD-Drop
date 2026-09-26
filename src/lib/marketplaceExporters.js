/**
 * Marketplace & E-Commerce Catalog Exporters
 * Formats CSV templates tailored for:
 * 1. Shopee (Criação Básica em Massa)
 * 2. TikTok Shop (Carregamento em Massa / Batch Upload)
 * 3. Mercado Livre (Planilha de Cadastro)
 * 4. Shopify
 * 5. Nuvemshop
 * 6. Yampi / Cartpanda
 */

import { generateShopeeMassCreationCSV, downloadShopeeMassCreationCSV } from './shopeeExporter';

export { generateShopeeMassCreationCSV, downloadShopeeMassCreationCSV };

// Helper to sanitize strings for CSV format
const sanitizeStr = (val) => {
  if (val === undefined || val === null) return '';
  return String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
};

/**
 * Generates TikTok Shop Mass Creation CSV
 */
export const generateTikTokShopCSV = (products = [], markupMultiplier = 2.2) => {
  if (!Array.isArray(products) || products.length === 0) return null;

  const headers = [
    "Product Name",
    "Category Name",
    "Description",
    "Seller SKU",
    "Price",
    "Quantity",
    "Package Weight (kg)",
    "Package Length (cm)",
    "Package Width (cm)",
    "Package Height (cm)",
    "Main Image URL",
    "Image URL 2",
    "Image URL 3",
    "Image URL 4",
    "Variation Name 1",
    "Variation Value 1",
    "Variation SKU",
    "Variation Price",
    "Variation Quantity"
  ];

  const rows = [];
  rows.push(headers.map(h => `"${h}"`).join(','));

  products.forEach((p) => {
    const title = p.title || 'Produto SMD Drop';
    const description = (p.mediaKit?.copyDescription || p.description || p.title || '').trim();
    const sku = p.ean || p.id || `SMD-${p.id}`;
    const rawCost = p.pricingType === 'custom_m2' ? (parseFloat(p.pricePerM2) || 0) : (parseFloat(p.wholesalePrice) || 0);
    const finalPrice = (rawCost * markupMultiplier).toFixed(2);
    const weight = p.weightKg !== undefined ? parseFloat(p.weightKg) : 0.5;
    const dims = p.dimensions || {};
    const length = dims.length || 30;
    const width = dims.width || 30;
    const height = dims.height || 10;
    const category = p.category || 'Casa & Decoração';

    const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image || p.image_url || ''];
    const img1 = images[0] || '';
    const img2 = images[1] || '';
    const img3 = images[2] || '';
    const img4 = images[3] || '';

    const variations = Array.isArray(p.variations) ? p.variations : [];

    if (variations.length > 0) {
      variations.forEach((v) => {
        const vCost = parseFloat(v.wholesalePrice) || rawCost;
        const vPrice = (vCost * markupMultiplier).toFixed(2);
        const vStock = v.stock !== undefined ? v.stock : 99;
        const vSku = v.sku || `${sku}-${v.name.replace(/[^a-zA-Z0-9]/g, '')}`;

        const row = [
          `"${sanitizeStr(title)}"`,
          `"${sanitizeStr(category)}"`,
          `"${sanitizeStr(description)}"`,
          `"${sanitizeStr(sku)}"`,
          `"${vPrice}"`,
          `"${vStock}"`,
          `"${weight}"`,
          `"${length}"`,
          `"${width}"`,
          `"${height}"`,
          `"${sanitizeStr(img1)}"`,
          `"${sanitizeStr(img2)}"`,
          `"${sanitizeStr(img3)}"`,
          `"${sanitizeStr(img4)}"`,
          `"${sanitizeStr('Variação')}"`,
          `"${sanitizeStr(v.name || 'Padrão')}"`,
          `"${sanitizeStr(vSku)}"`,
          `"${vPrice}"`,
          `"${vStock}"`
        ];
        rows.push(row.join(','));
      });
    } else {
      const row = [
        `"${sanitizeStr(title)}"`,
        `"${sanitizeStr(category)}"`,
        `"${sanitizeStr(description)}"`,
        `"${sanitizeStr(sku)}"`,
        `"${finalPrice}"`,
        `"99"`,
        `"${weight}"`,
        `"${length}"`,
        `"${width}"`,
        `"${height}"`,
        `"${sanitizeStr(img1)}"`,
        `"${sanitizeStr(img2)}"`,
        `"${sanitizeStr(img3)}"`,
        `"${sanitizeStr(img4)}"`,
        `""`,
        `""`,
        `""`,
        `""`,
        `""`
      ];
      rows.push(row.join(','));
    }
  });

  return '\uFEFF' + rows.join('\n');
};

/**
 * Generates Mercado Livre Mass Creation CSV
 */
export const generateMercadoLivreCSV = (products = [], markupMultiplier = 2.2) => {
  if (!Array.isArray(products) || products.length === 0) return null;

  const headers = [
    "Título",
    "Categoria",
    "Preço (R$)",
    "Estoque",
    "SKU",
    "Garantia",
    "Descrição",
    "Link Foto 1",
    "Link Foto 2",
    "Link Foto 3",
    "Link Foto 4",
    "Peso (g)",
    "Comprimento (cm)",
    "Largura (cm)",
    "Altura (cm)"
  ];

  const rows = [];
  rows.push(headers.map(h => `"${h}"`).join(','));

  products.forEach((p) => {
    const title = (p.mediaKit?.copyTitle || p.title || 'Produto SMD Drop').substring(0, 60);
    const description = (p.mediaKit?.copyDescription || p.description || p.title || '').trim();
    const sku = p.ean || p.id || `SMD-${p.id}`;
    const rawCost = p.pricingType === 'custom_m2' ? (parseFloat(p.pricePerM2) || 0) : (parseFloat(p.wholesalePrice) || 0);
    const finalPrice = (rawCost * markupMultiplier).toFixed(2);
    const weightGrams = Math.round((p.weightKg !== undefined ? parseFloat(p.weightKg) : 0.5) * 1000);
    const dims = p.dimensions || {};
    const length = dims.length || 30;
    const width = dims.width || 30;
    const height = dims.height || 10;
    const category = p.category || 'Casa, Móveis e Decoração';

    const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image || p.image_url || ''];
    const img1 = images[0] || '';
    const img2 = images[1] || '';
    const img3 = images[2] || '';
    const img4 = images[3] || '';

    const row = [
      `"${sanitizeStr(title)}"`,
      `"${sanitizeStr(category)}"`,
      `"${finalPrice}"`,
      `"99"`,
      `"${sanitizeStr(sku)}"`,
      `"Garantia do Fabricante - 90 dias"`,
      `"${sanitizeStr(description)}"`,
      `"${sanitizeStr(img1)}"`,
      `"${sanitizeStr(img2)}"`,
      `"${sanitizeStr(img3)}"`,
      `"${sanitizeStr(img4)}"`,
      `"${weightGrams}"`,
      `"${length}"`,
      `"${width}"`,
      `"${height}"`
    ];
    rows.push(row.join(','));
  });

  return '\uFEFF' + rows.join('\n');
};

/**
 * Universal Download Function for any Supported Platform
 */
export const downloadMarketplaceCSV = (platform, products, markupMultiplier = 2.2, filename = null) => {
  let csvStr = null;
  let defaultPrefix = platform;

  if (platform === 'shopee') {
    csvStr = generateShopeeMassCreationCSV(products, markupMultiplier);
    defaultPrefix = 'shopee_criacao_massa';
  } else if (platform === 'tiktok') {
    csvStr = generateTikTokShopCSV(products, markupMultiplier);
    defaultPrefix = 'tiktok_shop_massa';
  } else if (platform === 'mercadolivre') {
    csvStr = generateMercadoLivreCSV(products, markupMultiplier);
    defaultPrefix = 'mercadolivre_massa';
  } else if (platform === 'shopify') {
    let rows = ["Handle,Title,Body (HTML),Vendor,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Grams,Variant Inventory Qty,Variant Inventory Policy,Variant Fulfillment Service,Variant Price,Variant Compare At Price,Variant Requires Shipping,Variant Taxable,Image Src"];
    products.forEach((p) => {
      const handle = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const rawCost = p.pricingType === 'custom_m2' ? (p.pricePerM2 * markupMultiplier) : (p.wholesalePrice * markupMultiplier);
      const price = rawCost.toFixed(2);
      const compareAtPrice = (rawCost * 1.25).toFixed(2);
      rows.push(`"${handle}","${sanitizeStr(p.title)}","${sanitizeStr(p.description)}","SMD Drop","${sanitizeStr(p.category)}","Dropship,Fabrica",TRUE,"Title","Default Title","${p.ean || p.id}",500,99,"deny","manual",${price},${compareAtPrice},TRUE,TRUE,"${p.image || ''}"`);
    });
    csvStr = '\uFEFF' + rows.join('\n');
    defaultPrefix = 'shopify_catalogo';
  } else {
    // Nuvemshop / Yampi / Cartpanda
    let rows = ["Identificador,Nome,Categoria,Preco,Preco_Promocional,Estoque,Descricao,Imagem"];
    products.forEach((p) => {
      const rawCost = p.pricingType === 'custom_m2' ? (p.pricePerM2 * markupMultiplier) : (p.wholesalePrice * markupMultiplier);
      const price = rawCost.toFixed(2);
      const compareAtPrice = (rawCost * 1.25).toFixed(2);
      rows.push(`"${p.id}","${sanitizeStr(p.title)}","${sanitizeStr(p.category)}",${compareAtPrice},${price},99,"${sanitizeStr(p.description)}","${p.image || ''}"`);
    });
    csvStr = '\uFEFF' + rows.join('\n');
    defaultPrefix = `${platform}_catalogo`;
  }

  if (!csvStr) return false;

  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const name = filename || `${defaultPrefix}_${Date.now()}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
