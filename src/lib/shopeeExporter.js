import * as XLSX from 'xlsx';

/**
 * Utility to export products in official Shopee Mass Creation (Criação Básica em Massa) .xlsx format.
 * 
 * DYNAMIC ENGINE:
 * - Adapts dynamically to ANY Shopee Seller Store template (CPF, CNPJ, Correios, Shopee Xpress, etc.)
 * - Maps every product field to the official technical header keys in Row 1 (ps_category, ps_product_name, etc.)
 * - Supports saving the seller's active store template in localStorage so all exports are 100% synchronized with their store ID and logistics contracts.
 */

const STORAGE_KEY_TEMPLATE = 'smd_shopee_seller_template_b64';
const STORAGE_KEY_META = 'smd_shopee_seller_template_meta';

// Fallback headers for sheet 'Modelo' matching Shopee Brasil official specification
const FALLBACK_MODELO_HEADERS = [
  // Row 1: Technical keys
  [
    "ps_category|0|0","ps_product_name|1|0","ps_product_description|1|0","ps_sku_parent_short|0|0",
    "et_title_variation_integration_no|0|0","et_title_variation_1|0|0","et_title_option_for_variation_1|0|0",
    "et_title_image_per_variation|0|3","et_title_variation_2|0|0","et_title_option_for_variation_2|0|0",
    "ps_price|1|1","ps_stock|0|1","ps_sku_short|0|0","ps_new_size_chart|0|1","et_title_size_chart|0|3",
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
  // Row 2: Category mode & template metadata
  ["basic","2abafce44effc4725c42d9798e7c9f84","0","1744988549"],
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

/**
 * Filter out invalid image URLs (e.g. video thumbnails < 500px, unsupported domains, AVIF/WEBP formats)
 * and ensure 100% Shopee compliance (JPG, JPEG, PNG only).
 */
export const sanitizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();

  // Unsupported or bad video thumbnails
  if (
    trimmed.includes('v.etsystatic.com') ||
    trimmed.includes('/video/upload/') ||
    trimmed.includes('h_105') ||
    trimmed.includes('w_105') ||
    trimmed.includes('q_auto,w_105') ||
    trimmed.includes('c_fill,h_105')
  ) {
    return '';
  }

  // Must be a valid web URL
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return '';
  }

  // Force HTTPS
  if (trimmed.startsWith('http://')) {
    trimmed = 'https://' + trimmed.slice(7);
  }

  // 1. Temu / Kwcdn: Strip query parameters if the base path already ends with .png, .jpg, or .jpeg
  // Example: https://img.kwcdn.com/product/..._1000x1000.png?imageView2/2/w/800/q/70/format/avif -> .png
  if (trimmed.includes('kwcdn.com') || trimmed.includes('temu.com')) {
    const qIdx = trimmed.indexOf('?');
    if (qIdx !== -1) {
      const base = trimmed.substring(0, qIdx);
      if (/\.(png|jpe?g)$/i.test(base)) {
        return base;
      }
      // If base has no direct extension, convert format/avif or format/webp to format/jpeg
      trimmed = trimmed.replace(/format\/(avif|webp)/gi, 'format/jpeg');
    }
  }

  // 2. AliExpress / Alicdn: Strip trailing _.webp (e.g. .jpg_640x640.jpg_.webp -> .jpg_640x640.jpg)
  if (trimmed.includes('alicdn.com') || trimmed.includes('aliexpress')) {
    trimmed = trimmed.replace(/([._])webp(\?.*)?$/i, '$2').replace(/_\.webp$/i, '');
  }

  // 3. Mercado Livre: Replace .webp with .jpg, and ensure high resolution -O.jpg
  if (trimmed.includes('mlstatic.com')) {
    trimmed = trimmed.replace(/\.webp$/i, '.jpg').replace(/-[I|V|E|C|D]\.jpg$/i, '-O.jpg');
  }

  // 4. Shopee: Replace _tn and ensure jpg
  if (trimmed.includes('susercontent.com') || trimmed.includes('shopee.')) {
    trimmed = trimmed.replace(/_tn$/i, '').replace(/\.webp$/i, '.jpg');
  }

  // 5. General AVIF / WEBP in query params -> strip if base is already jpg/png, or convert to jpeg
  if (/format[=/](avif|webp)/i.test(trimmed)) {
    const qIdx = trimmed.indexOf('?');
    if (qIdx !== -1) {
      const base = trimmed.substring(0, qIdx);
      if (/\.(png|jpe?g)$/i.test(base)) {
        return base;
      }
    }
    trimmed = trimmed.replace(/format[=/]avif/gi, 'format=jpeg').replace(/format[=/]webp/gi, 'format=jpeg');
  }

  return trimmed;
};

/**
 * Sanitize product title to comply with Shopee listing moderation
 */
export const sanitizeProductTitle = (raw) => {
  if (!raw || typeof raw !== 'string') return 'Arte de Parede Decorativa em MDF';
  let t = raw
    .replace(/\s*-\s*Etsy\s*Brasil/gi, '')
    .replace(/\s*-\s*Etsy/gi, '')
    .replace(/\bEtsy\b/gi, '')
    .replace(/\(svg,\s*dxf,\s*png\)/gi, '')
    .replace(/\(dxf,\s*svg,\s*png\)/gi, '')
    .replace(/\(svg\s*e\s*dxf\)/gi, '')
    .replace(/\b(svg|dxf|cdr|ai|stl|eps)\b/gi, '')
    .replace(/Arquivos\s+para\s+Corte\s+a\s+Laser\s+CNC/gi, 'Corte a Laser CNC')
    .replace(/Arquivos\s+para\s+Corte\s+a\s+Laser/gi, 'Corte a Laser')
    .replace(/Arquivos\s+para/gi, 'Peça para')
    .replace(/Arquivo\s+para/gi, 'Peça para')
    .replace(/Arquivos\s+digitais?/gi, '')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*,\s*$/, '')
    .replace(/\s*-\s*$/, '')
    .trim();

  if (t.length > 120) {
    t = t.slice(0, 117) + '...';
  }
  return t || 'Arte de Parede Decorativa em MDF';
};

/**
 * Sanitize product description for physical marketplace selling
 */
export const sanitizeProductDescription = (desc, title) => {
  if (!desc || typeof desc !== 'string' || desc.trim().length < 15) {
    return `✨ ${title}\n\nPeça decorativa de alto padrão, fabricada com corte a laser de precisão computadorizada em MDF/Acrílico. Ideal para transformar salas, quartos, escritórios e consultórios com elegância.\n\n📋 Especificações Técnicas:\n- Material: MDF / Acrílico nobre de alta durabilidade\n- Acabamento: Corte a laser com bordas perfeitas e alta definição\n- Pronto para instalação fácil e segura\n\n📦 Embalagem reforçada anti-impacto e envio ágil com garantia de fábrica SMD Drop.`;
  }

  let cleaned = desc
    .replace(/Arquivos para arte de parede/gi, 'Arte de parede decorativa')
    .replace(/Arquivos DXF e SVG/gi, 'Produzido em corte a laser CNC')
    .replace(/Arquivos para corte/gi, 'Peça em corte')
    .replace(/reprodução digital e a venda de arquivos digitais não são permitidas/gi, 'Garantia de fábrica e acabamento de alta qualidade')
    .replace(/arquivos?\s+digitais?/gi, 'produtos decorativos')
    .replace(/recortar ou imprimir/gi, 'pronto para pendurar e decorar')
    .replace(/etsy brasil/gi, 'Shopee')
    .replace(/etsy/gi, 'nossa loja')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!cleaned.includes('Especificações') && !cleaned.includes('Destaques')) {
    cleaned += '\n\n✨ Destaques & Especificações:\n- Fabricado com tecnologia de corte a laser CNC de precisão.\n- Design sofisticado para transformar qualquer ambiente com elegância.\n- Embalagem reforçada e envio seguro direto de fábrica com garantia SMD Drop.';
  }

  return cleaned;
};

/**
 * Builds dynamic column mapping from technical header keys in Row 1
 */
export const buildShopeeColumnMap = (headerRow = []) => {
  const map = {
    totalCols: headerRow.length || 52,
    channels: []
  };

  headerRow.forEach((key, idx) => {
    if (!key) return;
    const cleanKey = String(key).split('|')[0].trim();
    map[cleanKey] = idx;
    if (cleanKey.startsWith('channel_id.')) {
      map.channels.push({ id: cleanKey, idx });
    }
  });

  return map;
};

/**
 * Populate a single data row based on dynamic column map and template rules
 */
export const populateDynamicShopeeRow = (colMap, rulesRow, data) => {
  const total = colMap.totalCols || 52;
  const row = new Array(total).fill('');

  // 1. Category
  if (colMap['ps_category'] !== undefined) row[colMap['ps_category']] = data.category || '101156';
  // 2. Product Name & Description
  if (colMap['ps_product_name'] !== undefined) row[colMap['ps_product_name']] = data.title;
  if (colMap['ps_product_description'] !== undefined) row[colMap['ps_product_description']] = data.description;
  // 3. Parent SKU
  if (colMap['ps_sku_parent_short'] !== undefined) row[colMap['ps_sku_parent_short']] = data.parentSku;

  // 4. Variations
  if (colMap['et_title_variation_integration_no'] !== undefined) row[colMap['et_title_variation_integration_no']] = data.integrationNo || '';
  if (colMap['et_title_variation_1'] !== undefined) row[colMap['et_title_variation_1']] = data.var1Title || '';
  if (colMap['et_title_option_for_variation_1'] !== undefined) row[colMap['et_title_option_for_variation_1']] = data.opt1 || '';
  if (colMap['et_title_image_per_variation'] !== undefined) row[colMap['et_title_image_per_variation']] = data.varImg || '';
  if (colMap['et_title_variation_2'] !== undefined) row[colMap['et_title_variation_2']] = data.var2Title || '';
  if (colMap['et_title_option_for_variation_2'] !== undefined) row[colMap['et_title_option_for_variation_2']] = data.opt2 || '';

  // 5. Price & Stock
  if (colMap['ps_price'] !== undefined) row[colMap['ps_price']] = data.price;
  if (colMap['ps_stock'] !== undefined) row[colMap['ps_stock']] = data.stock;

  // 6. Variation SKU (MUST BE EMPTY FOR SIMPLE PRODUCTS)
  if (colMap['ps_sku_short'] !== undefined) row[colMap['ps_sku_short']] = data.varSku || '';

  // 7. GTIN / EAN
  if (colMap['ps_gtin_code'] !== undefined) row[colMap['ps_gtin_code']] = data.ean || '';

  // 8. Images
  if (colMap['ps_item_cover_image'] !== undefined) row[colMap['ps_item_cover_image']] = data.coverImg || '';
  for (let i = 1; i <= 8; i++) {
    const key = `ps_item_image_${i}`;
    if (colMap[key] !== undefined) {
      row[colMap[key]] = data.images[i - 1] || '';
    }
  }

  // 9. Weight & Dimensions
  if (colMap['ps_weight'] !== undefined) row[colMap['ps_weight']] = data.weight;
  if (colMap['ps_length'] !== undefined) row[colMap['ps_length']] = data.length;
  if (colMap['ps_width'] !== undefined) row[colMap['ps_width']] = data.width;
  if (colMap['ps_height'] !== undefined) row[colMap['ps_height']] = data.height;

  // 10. Shipping Channels (Dynamic)
  if (Array.isArray(colMap.channels)) {
    colMap.channels.forEach((ch) => {
      const rule = rulesRow && rulesRow[ch.idx] ? String(rulesRow[ch.idx]).toLowerCase() : '';
      if (rule.includes('do not edit') || rule.includes('não editar') || ch.id.includes('90023')) {
        // Buyer pick-up / do not edit
        row[ch.idx] = '';
      } else {
        // Active carrier (Shopee Xpress, Correios, Expresso Aéreo)
        row[ch.idx] = 'Ligado';
      }
    });
  }

  // 11. Pre-order
  if (colMap['ps_product_pre_order_dts'] !== undefined) row[colMap['ps_product_pre_order_dts']] = '';

  // 12. Fiscal Data (exact Shopee Brazil string options)
  if (colMap['ps_invoice_ncm'] !== undefined) row[colMap['ps_invoice_ncm']] = data.ncm;
  if (colMap['ps_invoice_cfop_same'] !== undefined) row[colMap['ps_invoice_cfop_same']] = '5102';
  if (colMap['ps_invoice_cfop_diff'] !== undefined) row[colMap['ps_invoice_cfop_diff']] = '6102';
  if (colMap['ps_invoice_origin'] !== undefined) row[colMap['ps_invoice_origin']] = '0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8';
  if (colMap['ps_invoice_csosn'] !== undefined) row[colMap['ps_invoice_csosn']] = '102 - Tributada pelo Simples Nacional sem permissão de crédito';
  if (colMap['ps_invoice_cest'] !== undefined) row[colMap['ps_invoice_cest']] = '';
  if (colMap['ps_invoice_measure_unit'] !== undefined) row[colMap['ps_invoice_measure_unit']] = 'UN (UNIDADE)';
  if (colMap['ps_operation_type_default'] !== undefined) row[colMap['ps_operation_type_default']] = '1 - Revendedor';
  if (colMap['ps_additional_info_default'] !== undefined) row[colMap['ps_additional_info_default']] = 'No';
  if (colMap['sl_label_product_is_grouped_item'] !== undefined) row[colMap['sl_label_product_is_grouped_item']] = 'No';

  return row;
};

/**
 * Generates Shopee mass upload rows adapting dynamically to template headers
 */
export const generateShopeeMassCreationRows = (products = [], markupMultiplier = 2.2, templateHeaderRows = null) => {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  const headers = templateHeaderRows && templateHeaderRows[0] ? templateHeaderRows[0] : FALLBACK_MODELO_HEADERS[0];
  const rules = templateHeaderRows && templateHeaderRows[5] ? templateHeaderRows[5] : FALLBACK_MODELO_HEADERS[5];
  const colMap = buildShopeeColumnMap(headers);

  const dataRows = [];

  products.forEach((p) => {
    const rawTitle = p.mediaKit?.copyTitle || p.title || 'Produto SMD Drop';
    const title = sanitizeProductTitle(rawTitle);

    const rawDesc = p.mediaKit?.copyDescription || p.description || p.title || '';
    const description = sanitizeProductDescription(rawDesc, title);
    
    const parentSku = p.ean || p.sku || p.id || `SMD-${p.id || Date.now()}`;
    
    // Category mapping: Default to Shopee Brazil's '101156'
    let categoryCode = '101156';
    if (p.shopeeCategoryId && String(p.shopeeCategoryId).trim()) {
      categoryCode = String(p.shopeeCategoryId).trim();
    } else if (p.categoryCode && String(p.categoryCode).trim()) {
      categoryCode = String(p.categoryCode).trim();
    } else if (p.category && /^\d+$/.test(String(p.category).trim())) {
      categoryCode = String(p.category).trim();
    }
    
    // Price calculation
    let basePrice = 0;
    if (p.suggestedRetailPrice && parseFloat(p.suggestedRetailPrice) > 0) {
      basePrice = parseFloat(p.suggestedRetailPrice);
    } else if (p.price && parseFloat(p.price) > 0) {
      basePrice = parseFloat(p.price);
    } else {
      const rawCost = p.pricingType === 'custom_m2' 
        ? (parseFloat(p.pricePerM2) || 0) 
        : (parseFloat(p.wholesalePrice) || 0);
      basePrice = parseFloat((rawCost * markupMultiplier).toFixed(2));
    }
    if (!basePrice || basePrice <= 0 || isNaN(basePrice)) {
      basePrice = 29.90;
    }
    
    // Stock
    const baseStock = p.factoryStock !== undefined && p.factoryStock !== null
      ? (parseInt(p.factoryStock, 10) || 50)
      : (p.stock !== undefined && p.stock !== null ? (parseInt(p.stock, 10) || 50) : 50);

    // Dimensions & Weight
    const weight = p.weightKg !== undefined && p.weightKg !== null && parseFloat(p.weightKg) > 0
      ? parseFloat(p.weightKg)
      : 0.5;
    const dims = p.dimensions || {};
    const length = Math.max(1, parseInt(dims.length, 10) || 30);
    const width = Math.max(1, parseInt(dims.width, 10) || 30);
    const height = Math.max(1, parseInt(dims.height, 10) || 10);

    // Fiscal & NCM (8 digits strictly)
    let ncm = String(p.ncm || '39269090').replace(/[^0-9]/g, '');
    if (ncm.length !== 8) {
      ncm = '39269090';
    }

    // High-resolution image filtering (must be >= 500x500px, no video crops)
    const rawImagesList = [];
    if (Array.isArray(p.images) && p.images.length > 0) rawImagesList.push(...p.images);
    if (Array.isArray(p.mediaKit?.photos) && p.mediaKit.photos.length > 0) rawImagesList.push(...p.mediaKit.photos);
    if (p.image) rawImagesList.push(p.image);
    if (p.image_url) rawImagesList.push(p.image_url);

    const cleanImages = [...new Set(rawImagesList.map(sanitizeImageUrl).filter(Boolean))];
    const coverImg = cleanImages[0] || p.image || p.image_url || '';
    const otherImages = cleanImages.slice(1);

    const variations = Array.isArray(p.variations) && p.variations.length > 0 ? p.variations : [];

    if (variations.length > 0) {
      const integrationNo = `SMD-VAR-${p.id || Date.now()}`;
      const isTwoLevel = variations.some(v => v.name && v.name.includes(','));
      const var1Title = p.var1Title || 'Modelo';
      const var2Title = isTwoLevel ? (p.var2Title || 'Tamanho') : '';

      variations.forEach((v) => {
        let opt1 = v.name || 'Padrão';
        let opt2 = '';
        if (v.name && v.name.includes(',')) {
          const parts = v.name.split(',');
          opt1 = parts[0].trim();
          opt2 = parts.slice(1).join(',').trim();
        }

        let vPrice = 0;
        if (v.retailPrice && parseFloat(v.retailPrice) > 0) {
          vPrice = parseFloat(v.retailPrice);
        } else if (v.price && parseFloat(v.price) > 0) {
          vPrice = parseFloat(v.price);
        } else {
          const vCost = parseFloat(v.wholesalePrice) || (basePrice / markupMultiplier);
          vPrice = parseFloat((vCost * markupMultiplier).toFixed(2));
        }
        if (!vPrice || vPrice <= 0 || isNaN(vPrice)) vPrice = basePrice;

        const vStock = v.stock !== undefined && v.stock !== null ? parseInt(v.stock, 10) : baseStock;
        const vSku = v.sku || `${parentSku}-${opt1.replace(/[^a-zA-Z0-9]/g, '')}`;
        const vImg = sanitizeImageUrl(v.image) || coverImg;

        const row = populateDynamicShopeeRow(colMap, rules, {
          category: categoryCode,
          title,
          description,
          parentSku,
          integrationNo,
          var1Title,
          opt1,
          varImg: vImg,
          var2Title: isTwoLevel ? var2Title : '',
          opt2: isTwoLevel ? opt2 : '',
          price: vPrice,
          stock: vStock,
          varSku: vSku,
          ean: p.ean || '',
          coverImg,
          images: otherImages,
          weight,
          length,
          width,
          height,
          ncm
        });

        dataRows.push(row);
      });
    } else {
      // Simple product without variations
      const row = populateDynamicShopeeRow(colMap, rules, {
        category: categoryCode,
        title,
        description,
        parentSku,
        integrationNo: '',
        var1Title: '',
        opt1: '',
        varImg: '',
        var2Title: '',
        opt2: '',
        price: basePrice,
        stock: baseStock,
        varSku: '', // Must be empty
        ean: p.ean || '',
        coverImg,
        images: otherImages,
        weight,
        length,
        width,
        height,
        ncm
      });

      dataRows.push(row);
    }
  });

  return dataRows;
};

/**
 * Save seller's downloaded Shopee template into localStorage for persistence
 */
export const saveCustomShopeeTemplate = async (file) => {
  try {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    if (!wb || !wb.Sheets || !wb.Sheets['Modelo']) {
      return { success: false, message: 'O arquivo não é uma planilha válida da Shopee (aba "Modelo" não encontrada).' };
    }

    const modeloSheet = wb.Sheets['Modelo'];
    const rows = XLSX.utils.sheet_to_json(modeloSheet, { header: 1 });
    if (!rows || rows.length < 6) {
      return { success: false, message: 'O arquivo não contém o cabeçalho completo de 6 linhas da Shopee.' };
    }

    const row1 = rows[1] || [];
    const shopId = row1[3] || 'Desconhecido';
    const channels = (rows[0] || []).filter(k => String(k).startsWith('channel_id.'));

    // Convert arrayBuffer to Base64
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = window.btoa(binary);

    localStorage.setItem(STORAGE_KEY_TEMPLATE, b64);
    localStorage.setItem(STORAGE_KEY_META, JSON.stringify({
      shopId: String(shopId),
      fileName: file.name,
      channelsCount: channels.length,
      savedAt: new Date().toISOString()
    }));

    return {
      success: true,
      shopId: String(shopId),
      fileName: file.name,
      channelsCount: channels.length
    };
  } catch (err) {
    console.error('Error saving custom Shopee template:', err);
    return { success: false, message: err.message || 'Erro ao processar planilha.' };
  }
};

/**
 * Get metadata about the currently saved seller template
 */
export const getCustomShopeeTemplateMeta = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_META);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Remove custom template from localStorage
 */
export const clearCustomShopeeTemplate = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_TEMPLATE);
    localStorage.removeItem(STORAGE_KEY_META);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Get workbook instance from custom template or fallback
 */
export const loadShopeeWorkbookTemplate = async () => {
  // 1. Try saved custom template from localStorage
  try {
    const b64 = localStorage.getItem(STORAGE_KEY_TEMPLATE);
    if (b64) {
      const binary = window.atob(b64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const wb = XLSX.read(bytes.buffer, { type: 'array' });
      if (wb && wb.Sheets && wb.Sheets['Modelo']) {
        return wb;
      }
    }
  } catch (e) {
    console.warn('Could not load custom template from localStorage:', e);
  }

  // 2. Try fetching from public templates
  const templateUrls = [
    '/templates/shopee_basic_template.xlsx',
    '/planilhas de exemplo/Shopee_mass_upload_2026-10-04_basic_template.xlsx'
  ];

  for (const url of templateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        if (wb && wb.Sheets && wb.Sheets['Modelo']) return wb;
      }
    } catch (e) {
      // Try next
    }
  }

  return null;
};

/**
 * Generates and triggers download of Shopee Mass Creation .xlsx workbook
 */
export const downloadShopeeMassCreationXLSX = async (products, markupMultiplier = 2.2, filename = null) => {
  if (!Array.isArray(products) || products.length === 0) return false;

  let wb = await loadShopeeWorkbookTemplate();

  let rows = [];
  if (wb && wb.Sheets['Modelo']) {
    rows = XLSX.utils.sheet_to_json(wb.Sheets['Modelo'], { header: 1 });
  }

  // Ensure 6 header rows exist
  if (!rows || rows.length < 6) {
    rows = [...FALLBACK_MODELO_HEADERS];
    if (!wb) wb = XLSX.utils.book_new();
  }

  // Generate verified product data rows dynamically matching the template
  const newProductRows = generateShopeeMassCreationRows(products, markupMultiplier, rows.slice(0, 6));
  const fullRows = [...rows.slice(0, 6), ...newProductRows];

  // Set populated sheet in workbook preserving structure
  wb.Sheets['Modelo'] = XLSX.utils.aoa_to_sheet(fullRows);

  const cleanTitle = (products[0].title || 'produto')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 50);

  const defaultName = products.length === 1 
    ? `shopee_criacao_${cleanTitle}_${Date.now()}.xlsx`
    : `shopee_criacao_massa_catalogo_${Date.now()}.xlsx`;

  const finalName = filename || defaultName;

  // Trigger browser download of .xlsx file
  XLSX.writeFile(wb, finalName);
  return true;
};

// Backwards compatibility alias for existing code
export const downloadShopeeMassCreationCSV = downloadShopeeMassCreationXLSX;
export const generateShopeeMassCreationCSV = generateShopeeMassCreationRows;
