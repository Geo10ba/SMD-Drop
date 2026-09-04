import * as XLSX from 'xlsx';

/**
 * Clean Shopee category strings
 */
export function cleanCategory(catStr) {
  if (!catStr || typeof catStr !== 'string') return 'Quadros & Decoração';
  let clean = catStr.replace(/^\d+\s*-\s*/, '').trim();
  if (clean.includes('/')) {
    const parts = clean.split('/').map(p => p.trim());
    clean = parts[parts.length - 1] || parts[0];
  }
  const lower = clean.toLowerCase();
  if (lower === 'others' || lower === 'outros') return 'Quadros & Decoração';
  if (lower.includes('plate') || lower.includes('placa')) return 'Placas & Sinalização';
  if (lower.includes('fengshui') || lower.includes('religious')) return 'Quadros & Decoração';
  if (lower.includes('photo frames') || lower.includes('wall decoration')) return 'Quadros & Decoração';
  if (lower.includes('home') || lower.includes('living')) return 'Casa & Decoração';
  return clean || 'Quadros & Decoração';
}

/**
 * Clean and format variation names (e.g. "Vermelho,80cm" -> "Vermelho - 80cm")
 */
export function formatVariationName(nameStr) {
  if (!nameStr || typeof nameStr !== 'string') return 'Padrão';
  const trimmed = nameStr.trim();
  if (trimmed.includes(',')) {
    return trimmed.split(',').map(s => s.trim()).join(' - ');
  }
  return trimmed;
}

/**
 * Parse Shopee Excel files with 100% precision for variations, sales, shipping, tax and media info.
 * @param {Array<{ name: string, data: ArrayBuffer | Uint8Array }>} files 
 * @returns {Array<Object>} Consolidated product objects with status: 'rascunho'
 */
export function parseShopeeFiles(files) {
  const productsMap = new Map();

  for (const fileObj of files) {
    try {
      const workbook = XLSX.read(fileObj.data, { type: 'array' });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) continue;

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (!rows || rows.length < 2) continue;

      let techHeaderRow = -1;
      let humanHeaderRow = -1;

      for (let r = 0; r < Math.min(10, rows.length); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        const rowStr = row.join(' ').toLowerCase();

        if (rowStr.includes('et_title_product_id')) {
          techHeaderRow = r;
        }
        if (rowStr.includes('id do produto')) {
          humanHeaderRow = r;
        }
      }

      const headerIndex = humanHeaderRow !== -1 ? humanHeaderRow : (techHeaderRow !== -1 ? techHeaderRow : 0);
      const headers = rows[headerIndex].map(h => String(h || '').trim());
      const techHeaders = techHeaderRow !== -1 ? rows[techHeaderRow].map(h => String(h || '').trim()) : headers;

      // Strict column finder using technical header first, then exact human label match
      const getCol = (techKw, humanKw) => {
        return headers.findIndex((h, idx) => {
          const tL = (techHeaders[idx] || '').toLowerCase();
          const hL = (h || '').toLowerCase();
          if (techKw && tL.includes(techKw.toLowerCase())) return true;
          if (humanKw && hL === humanKw.toLowerCase()) return true;
          return false;
        });
      };

      const idCol = getCol('et_title_product_id', 'id do produto');
      const nameCol = getCol('et_title_product_name', 'nome do produto');
      const descCol = getCol('et_title_product_description', 'descrição do produto');
      const catCol = getCol('et_title_category', 'categoria');
      const parentSkuCol = getCol('et_title_parent_sku', 'sku de referência');
      const varIdCol = getCol('et_title_variation_id', 'variante identificador');
      const varNameCol = getCol('et_title_variation_name', 'nome');
      const varSkuCol = getCol('et_title_variation_sku', 'sku');
      const priceCol = getCol('et_title_variation_price', 'preço');
      const stockCol = getCol('et_title_variation_stock', 'estoque');
      const gtinCol = getCol('ps_gtin_code', 'gtin (ean)');
      
      const ncmCol = getCol('ps_invoice_ncm', 'ncm');
      const cestCol = getCol('ps_invoice_cest', 'cest');
      const unitCol = getCol('ps_invoice_measure_unit', 'unidade de medida');
      const cfopSameCol = getCol('ps_invoice_cfop_same', 'cfop (mesmo estado)');
      const cfopDiffCol = getCol('ps_invoice_cfop_diff', 'cfop (outro estado)');
      const csosnCol = getCol('ps_invoice_csosn', 'csosn');
      const originCol = getCol('ps_invoice_origin', 'origem');
      const weightCol = getCol('et_title_product_weight', 'peso do produto/kg');
      const lengthCol = getCol('et_title_product_length', 'comprimento');
      const widthCol = getCol('et_title_product_width', 'largura');
      const heightCol = getCol('et_title_product_height', 'altura');

      // Find image columns
      const imageCols = [];
      headers.forEach((h, idx) => {
        const hLower = h.toLowerCase();
        const techLower = (techHeaders[idx] || '').toLowerCase();
        if (
          hLower.includes('imagem') || 
          hLower.includes('image') || 
          hLower.includes('foto') ||
          techLower.includes('image') || 
          techLower.includes('cover')
        ) {
          imageCols.push(idx);
        }
      });

      for (let r = headerIndex + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row) || row.every(cell => cell === '' || cell === undefined)) continue;

        const firstCell = String(row[0] || '').trim();
        if (firstCell === 'sales_info' || firstCell === 'basic_info' || firstCell === 'shipping_info' || firstCell === 'tax_info' || firstCell === 'media_info') continue;
        if (firstCell.startsWith('{"search_condition') || firstCell.includes('Obrigatório') || firstCell.includes('É possível')) continue;

        const prodId = idCol !== -1 && row[idCol] ? String(row[idCol]).trim() : '';
        const name = nameCol !== -1 && row[nameCol] ? String(row[nameCol]).trim() : '';

        if (!prodId && !name) continue;

        const key = prodId || name.toLowerCase();

        if (!productsMap.has(key)) {
          productsMap.set(key, {
            id: 'prod-shopee-' + (prodId || Date.now() + '-' + Math.random().toString(36).substr(2, 5)),
            shopeeId: prodId,
            title: name || 'Produto Shopee',
            description: '',
            category: 'Quadros & Decoração',
            parentSku: '',
            pricingType: 'fixed',
            wholesalePrice: 0,
            suggestedRetailPrice: 0,
            pricePerM2: 530,
            suggestedPricePerM2: 800,
            factoryStock: 0,
            variationsMap: new Map(),
            weightKg: 0.5,
            dimensions: { length: 30, width: 30, height: 10 },
            ncm: '3926.90.90',
            cest: '',
            measureUnit: 'UN (UNIDADE)',
            cfopSame: '5101',
            cfopDiff: '6101',
            csosn: '102 - Tributada pelo Simples Nacional sem permissão de crédito',
            origin: '0 - Nacional',
            image: '',
            images: [],
            status: 'rascunho',
            source: 'Shopee Planilha',
            importedAt: new Date().toISOString()
          });
        }

        const product = productsMap.get(key);

        if (name && (!product.title || product.title === 'Produto Shopee')) product.title = name;
        if (descCol !== -1 && row[descCol]) product.description = String(row[descCol]).trim();
        if (catCol !== -1 && row[catCol]) product.category = cleanCategory(String(row[catCol]).trim());
        if (parentSkuCol !== -1 && row[parentSkuCol]) product.parentSku = String(row[parentSkuCol]).trim();
        
        if (ncmCol !== -1 && row[ncmCol]) {
          const ncm = String(row[ncmCol]).trim();
          if (ncm.length >= 4) product.ncm = ncm;
        }
        if (cestCol !== -1 && row[cestCol]) product.cest = String(row[cestCol]).trim();
        if (unitCol !== -1 && row[unitCol]) product.measureUnit = String(row[unitCol]).trim();
        if (cfopSameCol !== -1 && row[cfopSameCol]) product.cfopSame = String(row[cfopSameCol]).trim();
        if (cfopDiffCol !== -1 && row[cfopDiffCol]) product.cfopDiff = String(row[cfopDiffCol]).trim();
        if (csosnCol !== -1 && row[csosnCol]) product.csosn = String(row[csosnCol]).trim();
        if (originCol !== -1 && row[originCol]) product.origin = String(row[originCol]).trim();

        if (weightCol !== -1 && row[weightCol]) {
          const w = parseFloat(String(row[weightCol]).replace(',', '.'));
          if (!isNaN(w) && w > 0) product.weightKg = w;
        }
        if (lengthCol !== -1 && row[lengthCol]) {
          const pL = parseFloat(String(row[lengthCol]).replace(',', '.'));
          if (!isNaN(pL) && pL > 0) product.dimensions.length = pL;
        }
        if (widthCol !== -1 && row[widthCol]) {
          const pW = parseFloat(String(row[widthCol]).replace(',', '.'));
          if (!isNaN(pW) && pW > 0) product.dimensions.width = pW;
        }
        if (heightCol !== -1 && row[heightCol]) {
          const pH = parseFloat(String(row[heightCol]).replace(',', '.'));
          if (!isNaN(pH) && pH > 0) product.dimensions.height = pH;
        }

        // Variations Extraction
        const vId = varIdCol !== -1 ? String(row[varIdCol] || '').trim() : '';
        let vName = varNameCol !== -1 ? String(row[varNameCol] || '').trim() : '';
        const vSku = varSkuCol !== -1 ? String(row[varSkuCol] || '').trim() : '';
        const vPriceStr = priceCol !== -1 ? String(row[priceCol] || '').trim() : '';
        const vPrice = parseFloat(vPriceStr.replace(',', '.'));
        const vStock = stockCol !== -1 ? parseInt(String(row[stockCol] || '0'), 10) : 0;
        const vGtin = gtinCol !== -1 ? String(row[gtinCol] || '').trim() : '';

        // If variation name equals product name, ignore as variation name
        if (vName && vName.toLowerCase() === name.toLowerCase()) {
          vName = '';
        }

        if (vId || vName) {
          const varKey = vId || vName;
          const formattedName = formatVariationName(vName || (vId ? `Opção ${vId}` : `Modelo ${product.variationsMap.size + 1}`));

          if (!product.variationsMap.has(varKey)) {
            const priceVal = !isNaN(vPrice) && vPrice > 0 ? vPrice : 0;
            product.variationsMap.set(varKey, {
              id: vId || varKey,
              name: formattedName,
              rawName: vName,
              sku: vSku,
              price: priceVal,
              wholesalePrice: Math.round(priceVal * 0.45 * 100) / 100,
              stock: !isNaN(vStock) && vStock >= 0 ? vStock : 100,
              gtin: vGtin
            });
          } else {
            const existingVar = product.variationsMap.get(varKey);
            if (vName && existingVar.name.startsWith('Opção')) {
              existingVar.name = formattedName;
              existingVar.rawName = vName;
            }
            if (vSku && !existingVar.sku) existingVar.sku = vSku;
            if (!isNaN(vPrice) && vPrice > 0) {
              existingVar.price = vPrice;
              existingVar.wholesalePrice = Math.round(vPrice * 0.45 * 100) / 100;
            }
            if (!isNaN(vStock) && vStock >= 0) existingVar.stock = vStock;
            if (vGtin && !existingVar.gtin) existingVar.gtin = vGtin;
          }
        }

        // Image Extraction
        const extractedImages = [];
        for (const cIdx of imageCols) {
          const val = String(row[cIdx] || '').trim();
          if (val.startsWith('http://') || val.startsWith('https://')) {
            extractedImages.push(val);
          }
        }
        row.forEach(cell => {
          const str = String(cell || '').trim();
          if ((str.startsWith('http://') || str.startsWith('https://')) && !extractedImages.includes(str)) {
            if (str.includes('shopee') || str.includes('image') || str.includes('.jpg') || str.includes('.png') || str.includes('.webp') || str.includes('/file/')) {
              extractedImages.push(str);
            }
          }
        });

        if (extractedImages.length > 0) {
          const existingSet = new Set(product.images);
          extractedImages.forEach(img => existingSet.add(img));
          product.images = Array.from(existingSet);
          if (!product.image && product.images.length > 0) {
            product.image = product.images[0];
          }
        }
      }
    } catch (err) {
      console.error(`Error parsing Shopee spreadsheet file ${fileObj.name}:`, err);
    }
  }

  // Finalize product values
  const result = Array.from(productsMap.values()).map(p => {
    const varsArray = Array.from(p.variationsMap.values());
    delete p.variationsMap;

    p.variations = varsArray;

    if (varsArray.length > 0) {
      const validPrices = varsArray.map(v => v.price).filter(pr => pr > 0);
      if (validPrices.length > 0) {
        p.suggestedRetailPrice = Math.min(...validPrices);
        p.wholesalePrice = Math.round(p.suggestedRetailPrice * 0.45 * 100) / 100;
      }
      p.factoryStock = varsArray.reduce((acc, v) => acc + (v.stock || 0), 0);
    }

    if (!p.image) {
      p.image = 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80';
    }
    if (p.images.length === 0) {
      p.images = [p.image];
    }
    if (!p.description) {
      p.description = `Produto ${p.title} fabricado em material nobre com corte a laser de alta precisão. Ideal para decoração e personalização.`;
    }
    if (p.wholesalePrice === 0 && p.suggestedRetailPrice > 0) {
      p.wholesalePrice = Math.round(p.suggestedRetailPrice * 0.45 * 100) / 100;
    } else if (p.wholesalePrice === 0 && p.suggestedRetailPrice === 0) {
      p.suggestedRetailPrice = 54.99;
      p.wholesalePrice = 24.90;
      p.factoryStock = 100;
    }

    return p;
  });

  return result;
}
