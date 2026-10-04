import * as XLSX from 'xlsx';

/**
 * Utility to export products in official Shopee Mass Creation (Criação Básica em Massa) .xlsx format.
 * 
 * IMPORTANT NOTE ON SHOPEE IMPORT:
 * - Shopee Seller Center "Carregamento em Massa" requires an official Excel (.xlsx) file with multi-sheet structure:
 *   ('Orientação', 'Modelo', 'Fazer upload do exemplo', etc.)
 * - The 'Modelo' sheet requires 6 header rows and 52 standard columns.
 * - This generator uses the official Shopee Seller Center template (.xlsx) so ANY seller store can import without error.
 */

// Fallback headers for sheet 'Modelo' if template cannot be fetched
const FALLBACK_MODELO_HEADERS = [
  // Row 1: Technical keys
  [
    "ps_category","ps_product_name","ps_product_description","ps_sku_parent_short",
    "et_title_variation_integration_no","et_title_variation_1","et_title_option_for_variation_1",
    "et_title_image_per_variation","et_title_variation_2","et_title_option_for_variation_2",
    "ps_price","ps_stock","ps_sku_short","ps_new_size_chart","et_title_size_chart",
    "ps_gtin_code|0|0","sl_tool_mass_upload_compatibility_title|0|0","ps_item_cover_image|0|3",
    "ps_item_image_1|0|3","ps_item_image_2|0|3","ps_item_image_3|0|3","ps_item_image_4|0|3",
    "ps_item_image_5|0|3","ps_item_image_6|0|3","ps_item_image_7|0|3","ps_item_image_8|0|3",
    "ps_weight|1|1","ps_length|0|1","ps_width|0|1","ps_height|0|1",
    "channel_id.90016|0|0","channel_id.90023|0|0","ps_product_pre_order_dts|0|1",
    "ps_invoice_ncm|0|0","ps_invoice_cfop_same|0|0","ps_invoice_cfop_diff|0|0",
    "ps_invoice_origin|0|0","ps_invoice_csosn|0|0","ps_invoice_cest|0|0",
    "ps_invoice_measure_unit|0|0","ps_pis_cofins_cst_default|0|0",
    "ps_federal_state_taxes_default|0|0","ps_operation_type_default|0|0",
    "ps_ex_tipi_default|0|0","ps_fci_num_default|0|0","ps_recopi_num_default|0|0",
    "ps_additional_info_default|0|0","sl_label_product_is_grouped_item|0|0",
    "sl_label_grouped_item_gtin_sscc|0|0","sl_label_grouped_item_qty|0|0",
    "sl_label_grouped_item_measure_unity|0|0","et_title_reason|0|0"
  ],
  // Row 2: Category mode
  ["basic"],
  // Row 3: Human readable headers
  [
    "Categoria","Nome do Produto","Descrição do Produto","SKU principal",
    "Número de Integração de Variação","Nome da Variação 1","Opção para Variação 1",
    "Imagem por Variação","Nome da Variação 2","Opção para Variação 2",
    "Preço","Estoque","SKU da Variação","Template da Tabela de Medidas","Imagem de Tamanhos",
    "GTIN (EAN)","IDs de compatibilidade","Imagem de capa","Imagem do produto 1",
    "Imagem do produto 2","Imagem do produto 3","Imagem do produto 4","Imagem do produto 5",
    "Imagem do produto 6","Imagem do produto 7","Imagem do produto 8","Peso",
    "Comprimento","Largura","Altura","Shopee Xpress CPF","Retirada pelo Comprador",
    "Prazo de Postagem para Encomenda","NCM","CFOP (Mesmo Estado)","CFOP (Outro Estado)",
    "Origem","CSOSN","CEST","Unidade de Medida","CST PIS/Cofins",
    "% total de tributos federais, estaduais e municipais","Tipo de Operação",
    "EX TIPI (tabela de exceções IPI)","Nr. de controle da FCI","Nr. RECOPI",
    "Informações adicionais do produto","Produto é um item agrupável",
    "GTIN da Unidade Tributável","Quantidade da Unidade Tributável",
    "Unidade de medida do item agrupável","Motivo da Falha"
  ],
  // Row 4: Required/Optional markers
  [
    "Opcional","Obrigatório","Obrigatório","Opcional","Condicional obrigatório",
    "Condicional obrigatório","Condicional obrigatório","Condicional obrigatório",
    "Condicional obrigatório","Condicional obrigatório","Obrigatório",
    "Condicional obrigatório","Opcional","Condicional obrigatório","Condicional obrigatório",
    "Opcional","Opcional","Opcional","Opcional","Opcional","Opcional","Opcional",
    "Opcional","Opcional","Opcional","Opcional","Obrigatório","Condicional obrigatório",
    "Condicional obrigatório","Condicional obrigatório","Condicional obrigatório",
    "Condicional obrigatório","Opcional","Condicional obrigatório","Condicional obrigatório",
    "Condicional obrigatório","Condicional obrigatório","Condicional obrigatório",
    "Condicional obrigatório","Condicional obrigatório","Condicional obrigatório",
    "Condicional obrigatório","Condicional obrigatório","Condicional obrigatório",
    "Condicional obrigatório","Condicional obrigatório","Condicional obrigatório",
    "Condicional obrigatório","Condicional obrigatório","Condicional obrigatório",
    "Condicional obrigatório",""
  ],
  // Row 5: Descriptions
  new Array(52).fill(''),
  // Row 6: Validation rules
  new Array(52).fill('')
];

export const generateShopeeMassCreationRows = (products = [], markupMultiplier = 2.2) => {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  const dataRows = [];

  products.forEach((p) => {
    const title = (p.title || 'Produto SMD Drop').trim();
    let description = (p.mediaKit?.copyDescription || p.description || p.title || '').trim();
    if (description.length < 15) {
      description += ' - Produto oficial fabricado com excelência e garantia de fábrica SMD Drop.';
    }
    
    const parentSku = p.ean || p.sku || p.id || `SMD-${p.id}`;
    
    // Cost calculation
    const rawCost = p.pricingType === 'custom_m2' 
      ? (parseFloat(p.pricePerM2) || 0) 
      : (parseFloat(p.wholesalePrice) || 0);
    const basePrice = parseFloat((rawCost * markupMultiplier).toFixed(2));
    
    // Dimensions & Weight
    const weight = p.weightKg !== undefined && p.weightKg !== null ? parseFloat(p.weightKg) : 0.5;
    const dims = p.dimensions || {};
    const length = dims.length || 30;
    const width = dims.width || 30;
    const height = dims.height || 10;

    // Fiscal & NCM
    const ncm = String(p.ncm || '39269090').replace(/[^0-9]/g, '');

    // Image URLs (up to 9 images)
    const images = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : [p.image || p.image_url || ''];
    
    const coverImg = images[0] || '';
    const img1 = images[1] || '';
    const img2 = images[2] || '';
    const img3 = images[3] || '';
    const img4 = images[4] || '';
    const img5 = images[5] || '';
    const img6 = images[6] || '';
    const img7 = images[7] || '';
    const img8 = images[8] || '';

    const variations = Array.isArray(p.variations) ? p.variations : [];

    if (variations.length > 0) {
      // Product has variations (e.g. colors, options)
      const integrationNo = `SMD-VAR-${p.id || Date.now()}`;
      variations.forEach((v) => {
        const vCost = parseFloat(v.wholesalePrice) || rawCost;
        const vPrice = parseFloat((vCost * markupMultiplier).toFixed(2));
        const vStock = v.stock !== undefined ? parseInt(v.stock, 10) : 50;
        const vSku = v.sku || `${parentSku}-${v.name.replace(/[^a-zA-Z0-9]/g, '')}`;

        const row = new Array(52).fill('');
        row[0] = ''; // Category (optional / Shopee auto-recommend)
        row[1] = title;
        row[2] = description;
        row[3] = parentSku;
        row[4] = integrationNo;
        row[5] = 'Opção'; // Variation 1 Name
        row[6] = v.name || 'Padrão'; // Variation 1 Value
        row[7] = v.image || coverImg; // Variation Image URL
        row[8] = ''; // Variation 2 Name
        row[9] = ''; // Variation 2 Value
        row[10] = vPrice; // Price
        row[11] = vStock; // Stock
        row[12] = vSku; // Variation SKU
        row[15] = p.ean || ''; // GTIN / EAN
        row[17] = coverImg; // Cover image
        row[18] = img1;
        row[19] = img2;
        row[20] = img3;
        row[21] = img4;
        row[22] = img5;
        row[23] = img6;
        row[24] = img7;
        row[25] = img8;
        row[26] = weight;
        row[27] = length;
        row[28] = width;
        row[29] = height;
        row[30] = 'Ativar'; // Shopee Xpress
        row[31] = 'Ativar'; // Retirada pelo Comprador
        row[33] = ncm; // NCM Fiscal
        row[34] = '5101'; // CFOP mesmo estado
        row[35] = '6101'; // CFOP outro estado
        row[36] = '0 - Nacional'; // Origem
        row[37] = '102'; // CSOSN Simples Nacional
        row[39] = 'UN'; // Unidade de medida

        dataRows.push(row);
      });
    } else {
      // Simple product without variations
      const baseStock = p.stock !== undefined ? parseInt(p.stock, 10) : 50;

      const row = new Array(52).fill('');
      row[0] = ''; // Category
      row[1] = title;
      row[2] = description;
      row[3] = parentSku;
      row[4] = ''; // Integration No
      row[5] = ''; // Var 1 Name
      row[6] = ''; // Var 1 Option
      row[7] = ''; // Var Image
      row[8] = '';
      row[9] = '';
      row[10] = basePrice;
      row[11] = baseStock;
      row[12] = parentSku;
      row[15] = p.ean || '';
      row[17] = coverImg;
      row[18] = img1;
      row[19] = img2;
      row[20] = img3;
      row[21] = img4;
      row[22] = img5;
      row[23] = img6;
      row[24] = img7;
      row[25] = img8;
      row[26] = weight;
      row[27] = length;
      row[28] = width;
      row[29] = height;
      row[30] = 'Ativar';
      row[31] = 'Ativar';
      row[33] = ncm;
      row[34] = '5101';
      row[35] = '6101';
      row[36] = '0 - Nacional';
      row[37] = '102';
      row[39] = 'UN';

      dataRows.push(row);
    }
  });

  return dataRows;
};

/**
 * Generates and triggers download of Shopee Mass Creation .xlsx workbook
 */
export const downloadShopeeMassCreationXLSX = async (products, markupMultiplier = 2.2, filename = null) => {
  if (!Array.isArray(products) || products.length === 0) return false;

  let wb = null;

  try {
    // Try fetching official template from public folder
    const templateUrls = [
      '/templates/shopee_basic_template.xlsx',
      '/planilhas de exemplo/Shopee_mass_upload_2026-10-04_basic_template.xlsx'
    ];

    for (const url of templateUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          wb = XLSX.read(buffer, { type: 'array' });
          if (wb && wb.Sheets && wb.Sheets['Modelo']) break;
        }
      } catch (e) {
        // Try next URL
      }
    }
  } catch (err) {
    console.warn('Could not load Shopee Excel template file, using fallback generator:', err);
  }

  let rows = [];
  if (wb && wb.Sheets['Modelo']) {
    rows = XLSX.utils.sheet_to_json(wb.Sheets['Modelo'], { header: 1 });
  }

  // Ensure 6 header rows exist
  if (!rows || rows.length < 6) {
    rows = [...FALLBACK_MODELO_HEADERS];
    if (!wb) wb = XLSX.utils.book_new();
  }

  // Generate product data rows
  const newProductRows = generateShopeeMassCreationRows(products, markupMultiplier);
  const fullRows = [...rows.slice(0, 6), ...newProductRows];

  // Set populated sheet in workbook
  wb.Sheets['Modelo'] = XLSX.utils.aoa_to_sheet(fullRows);

  const defaultName = products.length === 1 
    ? `shopee_criacao_${(products[0].title || 'produto').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}.xlsx`
    : `shopee_criacao_massa_catalogo_${Date.now()}.xlsx`;

  const finalName = filename || defaultName;

  // Trigger browser download of .xlsx file
  XLSX.writeFile(wb, finalName);
  return true;
};

// Backwards compatibility alias for existing code
export const downloadShopeeMassCreationCSV = downloadShopeeMassCreationXLSX;
export const generateShopeeMassCreationCSV = generateShopeeMassCreationRows;

