import { getSupabaseClient } from '../lib/supabase';
import { normalizeCategoryName } from '../lib/categoryTranslations';

/**
 * Utilitários de Resolução Fiscal e Serialização de Produtos para o Supabase
 */

export function resolveSmartNcm(p) {
  if (p && p.ncm && p.ncm.trim().length >= 8 && p.ncm.trim() !== '3926.90.90') {
    return p.ncm.trim();
  }
  const text = `${p?.title || ''} ${p?.category || ''}`.toLowerCase();
  if (text.includes('mdf') || text.includes('madeira')) return '4421.99.00';
  if (text.includes('relógio') || text.includes('relogio') || text.includes('clock')) return '9105.29.00';
  if (text.includes('led') || text.includes('neon') || text.includes('luz')) return '8539.51.00';
  if (text.includes('acm') || text.includes('metal') || text.includes('inox')) return '8306.29.00';
  if (text.includes('quadro') || text.includes('impressão') || text.includes('poster')) return '4911.91.00';
  return p?.ncm || '3926.90.90';
}

export function resolveSmartFiscalDetails(p) {
  const ncm = resolveSmartNcm(p);

  let cest = (p?.cest || '').trim();
  if (!cest || cest.length < 6) {
    if (ncm === '8539.51.00') cest = '28.038.00';
    else if (ncm === '4421.99.00') cest = '28.057.00';
    else cest = '28.061.00';
  }

  const measureUnit = p?.measureUnit || p?.measure_unit || (p?.pricingType === 'custom_m2' || p?.pricing_type === 'custom_m2' ? 'M2 (METRO QUADRADO)' : 'UN (UNIDADE)');
  const cfopSame = p?.cfopSame || p?.cfop_same || '5101';
  const cfopDiff = p?.cfopDiff || p?.cfop_diff || '6101';
  const csosn = p?.csosn || '102 - Tributada pelo Simples Nacional sem permissão de crédito';
  const origin = p?.origin || '0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8';
  const weightKg = Number(p?.weightKg ?? p?.weight_kg ?? 0.5) || 0.5;
  const dimensions = p?.dimensions || { length: 30, width: 30, height: 10 };

  return {
    ncm,
    cest,
    measureUnit,
    cfopSame,
    cfopDiff,
    csosn,
    origin,
    weightKg,
    dimensions
  };
}

export function serializeProductForSupabase(p) {
  const fiscal = resolveSmartFiscalDetails(p);

  const meta = {
    shopeeId: p.shopeeId || p.shopee_id || '',
    parentSku: p.parentSku || p.parent_sku || '',
    variations: p.variations || [],
    images: p.images || [p.image || p.image_url],
    video: p.video || '',
    weightKg: fiscal.weightKg,
    dimensions: fiscal.dimensions,
    ncm: fiscal.ncm,
    cest: fiscal.cest,
    measureUnit: fiscal.measureUnit,
    cfopSame: fiscal.cfopSame,
    cfopDiff: fiscal.cfopDiff,
    csosn: fiscal.csosn,
    origin: fiscal.origin
  };

  const metaString = '<!--SMD_META:' + JSON.stringify(meta) + '-->';
  const cleanDesc = (p.description || '').replace(/<!--SMD_META:[\s\S]*?-->/g, '').trim();

  return {
    id: String(p.id),
    title: p.title,
    category_name: p.category || p.category_name || 'Geral',
    pricing_type: p.pricingType || p.pricing_type || 'fixed',
    wholesale_price: Number(p.wholesalePrice ?? p.wholesale_price ?? 0),
    suggested_retail_price: Number(p.suggestedRetailPrice ?? p.suggestedRetailPrice ?? 0),
    price_per_m2: Number(p.pricePerM2 ?? p.price_per_m2 ?? 0),
    suggested_price_per_m2: Number(p.suggestedPricePerM2 ?? p.suggested_price_per_m2 ?? 0),
    factory_stock: Number(p.factoryStock ?? p.factory_stock ?? 100),
    description: cleanDesc ? `${cleanDesc}\n${metaString}` : metaString,
    image_url: p.image || p.image_url || (p.images && p.images[0]) || '',
    ncm: fiscal.ncm,
    status: p.status || 'rascunho'
  };
}

export function deserializeProductFromSupabase(p) {
  let meta = {};
  let cleanDesc = p.description || '';

  if (p.description && p.description.includes('<!--SMD_META:')) {
    const match = p.description.match(/<!--SMD_META:([\s\S]*?)-->/);
    if (match && match[1]) {
      try {
        meta = JSON.parse(match[1]);
        cleanDesc = p.description.replace(/<!--SMD_META:[\s\S]*?-->/g, '').trim();
      } catch (e) {}
    }
  }

  const imgs = meta.images || p.images || [p.image_url || p.image || ''];
  const videoUrl = meta.video || p.video || '';

  let variationsList = [];
  if (Array.isArray(meta.variations) && meta.variations.length > 0) {
    variationsList = meta.variations;
  } else if (typeof meta.variations === 'string' && meta.variations.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(meta.variations);
      if (Array.isArray(parsed)) variationsList = parsed;
    } catch (e) {}
  } else if (Array.isArray(p.variations) && p.variations.length > 0) {
    variationsList = p.variations;
  } else if (typeof p.variations === 'string' && p.variations.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(p.variations);
      if (Array.isArray(parsed)) variationsList = parsed;
    } catch (e) {}
  }

  const fiscal = resolveSmartFiscalDetails({
    title: p.title,
    category: p.category_name || p.category,
    pricingType: p.pricing_type || p.pricingType,
    ncm: meta.ncm || p.ncm,
    cest: meta.cest || p.cest,
    measureUnit: meta.measureUnit || p.measure_unit,
    cfopSame: meta.cfopSame || p.cfop_same,
    cfopDiff: meta.cfopDiff || p.cfop_diff,
    csosn: meta.csosn || p.csosn,
    origin: meta.origin || p.origin,
    weightKg: meta.weightKg ?? p.weight_kg,
    dimensions: meta.dimensions || p.dimensions
  });

  return {
    id: String(p.id),
    title: p.title,
    category: normalizeCategoryName(p.category_name || p.category || 'Geral'),
    pricingType: p.pricing_type || p.pricingType || 'fixed',
    wholesalePrice: Number(p.wholesale_price ?? p.wholesalePrice ?? 0),
    suggestedRetailPrice: Number(p.suggested_retail_price ?? p.suggestedRetailPrice ?? 0),
    pricePerM2: Number(p.price_per_m2 ?? p.pricePerM2 ?? 530),
    suggestedPricePerM2: Number(p.suggested_price_per_m2 ?? p.suggestedPricePerM2 ?? 800),
    factoryStock: Number(p.factory_stock ?? p.factoryStock ?? 100),
    description: cleanDesc,
    image: p.image_url || p.image || (imgs && imgs[0]) || '',
    images: imgs,
    video: videoUrl,
    variations: variationsList,
    shopeeId: meta.shopeeId || p.shopee_id || '',
    parentSku: meta.parentSku || p.parent_sku || '',
    weightKg: fiscal.weightKg,
    dimensions: fiscal.dimensions,
    ncm: fiscal.ncm,
    cest: fiscal.cest,
    measureUnit: fiscal.measureUnit,
    cfopSame: fiscal.cfopSame,
    cfopDiff: fiscal.cfopDiff,
    csosn: fiscal.csosn,
    origin: fiscal.origin,
    status: p.status || 'rascunho',
    mediaKit: {
      photos: imgs,
      copyTitle: p.title,
      copyDescription: cleanDesc
    }
  };
}

export const ensureCategoriesInSupabase = async (categoryNames) => {
  const client = getSupabaseClient();
  if (!client || !categoryNames || categoryNames.length === 0) return;

  const uniqueCats = Array.from(new Set(categoryNames.filter(Boolean)));
  if (uniqueCats.length === 0) return;

  const catPayload = uniqueCats.map((cat, idx) => {
    const cleanSlug = String(cat)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `cat-${idx}`;

    return {
      id: `cat-${cleanSlug}`,
      name: cat,
      slug: cleanSlug
    };
  });

  try {
    const { error } = await client.from('categories').upsert(catPayload, { onConflict: 'name' });
    if (error) {
      console.warn('[Supabase Categories Sync Warning]:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Categories Sync Exception]:', err.message);
  }
};

export const safeSyncProductToSupabase = async (product) => {
  const client = getSupabaseClient();
  if (!client || !product) return;

  try {
    const catName = product.category || product.category_name || 'Geral';
    await ensureCategoriesInSupabase([catName]);

    const payload = serializeProductForSupabase(product);
    const { error } = await client.from('products').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase Product Sync Warning]:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Product Sync Exception]:', err.message);
  }
};

export const safeSyncProductsBatchToSupabase = async (productsList) => {
  const client = getSupabaseClient();
  if (!client || !Array.isArray(productsList) || productsList.length === 0) return;

  try {
    const categoriesList = productsList.map((p) => p.category || p.category_name || 'Geral');
    await ensureCategoriesInSupabase(categoriesList);

    const payloads = productsList.map((p) => serializeProductForSupabase(p));

    const chunkSize = 50;
    for (let i = 0; i < payloads.length; i += chunkSize) {
      const chunk = payloads.slice(i, i + chunkSize);
      const { error } = await client.from('products').upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.warn('[Supabase Batch Products Sync Warning]:', error.message);
      }
    }
  } catch (err) {
    console.warn('[Supabase Batch Products Sync Exception]:', err.message);
  }
};
