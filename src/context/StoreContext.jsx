import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialProducts } from '../data/initialProducts';
import { 
  getSupabaseClient, 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  testSupabaseConnection, 
  syncToSupabase 
} from '../lib/supabase';
import { normalizeCategoryName, normalizeCategoryList } from '../lib/categoryTranslations';
import { 
  getAllActiveFonts, 
  registerCustomFont, 
  removeFontById, 
  restoreDefaultFonts 
} from '../utils/textMetrics';
import { buildFiscalOrderData } from '../utils/fiscalOrderFlow';
import { 
  normalizeProductionStatus, 
  getNextProductionStage, 
  getPrevProductionStage, 
  getStageInfo,
  PRODUCTION_STAGES 
} from '../utils/productionCycle';
import { 
  notifyOrderToTelegram, 
  notifyWalletRechargeToTelegram 
} from '../services/telegramNotification';

const StoreContext = createContext();

// Synchronously parse URL query parameters on initial load
const getInitialBookmarkletData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('magic') === '1' || params.get('auto') === '1' || params.get('title')) {
      const title = params.get('title') || '';
      const desc = params.get('desc') || '';
      const img = params.get('img') || '';
      const imgsParam = params.get('imgs') || '';
      const video = params.get('video') || '';
      const priceStr = params.get('price') || '';
      const price = priceStr ? parseFloat(priceStr) : 120;

      let imagesList = [];
      if (imgsParam) {
        try {
          if (imgsParam.startsWith('[')) {
            imagesList = JSON.parse(imgsParam);
          } else {
            imagesList = imgsParam.split('|||').map((u) => u.trim()).filter(Boolean);
          }
        } catch (e) {}
      }
      if (imagesList.length === 0 && img) {
        imagesList = [img];
      }

      return {
        title: title || 'Produto Capturado Mágico',
        description: desc || (title ? `Produto ${title} fabricado em material nobre com corte a laser.` : 'Descrição importada do anúncio.'),
        image: imagesList[0] || img || 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80',
        images: imagesList,
        video: video || '',
        suggestedRetailPrice: price || 120,
        wholesalePrice: Math.round((price || 120) * 0.45)
      };
    }
  } catch (e) {
    console.error('Error parsing query params:', e);
  }
  return null;
};

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


export const StoreProvider = ({ children }) => {
  const broadcastSync = (key, data) => {
    if (typeof window === 'undefined') return;
    try {
      const channel = new BroadcastChannel('smd_drop_sync_channel');
      channel.postMessage({ type: 'SYNC_FIELD_UPDATE', key, data });
      channel.close();
    } catch (e) {}
  };

  // Theme Management (Default: 'light' Luxe)
  const [theme, setTheme] = useState('light');

  // View Mode: 'reseller' or 'factory' (Persisted in localStorage)
  const [viewMode, setViewModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_view_mode');
      if (saved === 'factory' || saved === 'reseller') return saved;
    }
    return 'reseller';
  });

  const setViewMode = (mode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smd_view_mode', mode);
    }
  };

  // Admin Auth State & Persistence
  const [adminEmail, setAdminEmail] = useState('geovancalado@gmail.com');

  const defaultAdminUser = {
    id: 'admin-1',
    email: 'geovancalado@gmail.com',
    name: 'Geovan Calado (Admin Fábrica)',
    role: 'admin'
  };

  const defaultResellerUser = {
    id: 'user-1',
    email: 'revendedor@loja.com',
    name: 'Lucas E-Commerce Store',
    cnpj: '45.109.892/0001-99',
    phone: '(11) 98765-4321',
    pixKey: '45.109.892/0001-99',
    role: 'reseller',
    status: 'aprovado',
    tier: 'VIP Gold',
    discountPercent: 5
  };

  const [currentUser, setCurrentUserState] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('smd_current_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.email) {
            if (parsed.email.toLowerCase() === adminEmail.toLowerCase()) {
              parsed.role = 'admin';
            }
            return parsed;
          }
        } catch (e) {}
      }
      const mode = localStorage.getItem('smd_view_mode');
      if (mode === 'factory') return defaultAdminUser;
    }
    return null; // Visitantes não logados iniciam como Visitantes/Visitante Convidado
  });

  const setCurrentUser = (user) => {
    setCurrentUserState(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('smd_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('smd_current_user');
      }
    }
  };

  // Global Magic Import Modal State (Initialized Synchronously)
  const [magicImportInitialData, setMagicImportInitialData] = useState(getInitialBookmarkletData);
  const [isMagicImportOpen, setIsMagicImportOpen] = useState(() => !!getInitialBookmarkletData());

  // Clean URL parameters after initial render if captured
  useEffect(() => {
    if (isMagicImportOpen && magicImportInitialData) {
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      showNotification('⚡ Produto capturado com o Botão Mágico!');
    }
  }, []);

  const openMagicImport = (data = null) => {
    if (data) setMagicImportInitialData(data);
    setIsMagicImportOpen(true);
  };

  const closeMagicImport = () => {
    setIsMagicImportOpen(false);
  };

  // Users List (Resellers Managed by Factory Admin)
  const [users, setUsersState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_users');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const setUsers = (usrs) => {
    setUsersState((prev) => {
      const next = typeof usrs === 'function' ? usrs(prev) : usrs;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_users', JSON.stringify(next));
        broadcastSync('users', next);
      }
      return next;
    });
  };

  // Dynamic Categories State (Normalizado para Português)
  const [categories, setCategoriesState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_categories');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return normalizeCategoryList(parsed);
        } catch (e) {}
      }
    }
    return [];
  });

  const setCategories = (cats) => {
    setCategoriesState((prev) => {
      const raw = typeof cats === 'function' ? cats(prev) : cats;
      const next = normalizeCategoryList(raw);
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_categories', JSON.stringify(next));
        broadcastSync('categories', next);
      }
      return next;
    });
  };

  // Factory Materials Catalog (Calibrated Competitive Industrial Pricing Table)
  const defaultInitialMaterials = [
    {
      id: 'mat-mdf-cru',
      name: 'MDF 6mm',
      factoryCostPerM2: 69.44, // Custo Gestor Pro CNC: Chapa 1800x1200mm a R$ 150 (R$ 69,44/m²)
      wholesalePricePerM2: 115.00,
      suggestedPricePerM2: 180.00,
      style: 'madeira',
      leadTimeDays: 2,
      description: 'MDF 6mm Industrial (Chapa 1800x1200mm a R$ 150). Padrão Gestor Pro CNC.'
    },
    {
      id: 'mat-pvc-branco',
      name: 'PVC Expandido (Branco)',
      factoryCostPerM2: 55.00,
      wholesalePricePerM2: 140.00,
      suggestedPricePerM2: 290.00,
      style: 'prata',
      leadTimeDays: 2,
      description: 'Leve e resistente à umidade, ideal para letras e placas decorativas.'
    },
    {
      id: 'mat-mdf-pvc-pintado',
      name: 'MDF 6mm ou PVC Pintado',
      factoryCostPerM2: 94.44, // MDF 6mm (R$ 69,44) + Pintura/Primer (R$ 25/m²)
      wholesalePricePerM2: 155.00,
      suggestedPricePerM2: 295.00,
      style: 'preto',
      leadTimeDays: 3,
      description: 'Personalizado com pintura laca/esmalte e acabamento fosco ou brilhante.'
    },
    {
      id: 'mat-acm',
      name: 'ACM (Alumínio Composto)',
      factoryCostPerM2: 85.00,
      wholesalePricePerM2: 195.00,
      suggestedPricePerM2: 390.00,
      style: 'prata',
      leadTimeDays: 3,
      description: 'Metálico e moderno, para fachadas, letreiros externos e painéis.'
    },
    {
      id: 'mat-acrilico-luxo',
      name: 'Acrílico Premium (Luxo)',
      factoryCostPerM2: 130.00,
      wholesalePricePerM2: 280.00,
      suggestedPricePerM2: 590.00,
      style: 'dourado',
      leadTimeDays: 3,
      description: 'Corte a laser de alta precisão em acrílico cast nobre espelhado.'
    }
  ];

  const [materials, setMaterialsState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_materials');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const repaired = parsed.map((m) => {
              // Sincronização direta com a tabela do Gestor Pro CNC
              if (m.id === 'mat-mdf-cru' || (m.name && m.name.toLowerCase().includes('mdf'))) {
                return {
                  ...m,
                  id: 'mat-mdf-cru',
                  name: 'MDF 6mm',
                  factoryCostPerM2: 69.44,
                  wholesalePricePerM2: 115.00,
                  suggestedPricePerM2: 180.00,
                  description: 'MDF 6mm Industrial (Chapa 1800x1200mm a R$ 150). Padrão Gestor Pro CNC.',
                  isCustomEdited: false
                };
              }
              if (m.id === 'mat-mdf-pvc-pintado') {
                return {
                  ...m,
                  id: 'mat-mdf-pvc-pintado',
                  name: 'MDF 6mm ou PVC Pintado',
                  factoryCostPerM2: 94.44,
                  wholesalePricePerM2: 155.00,
                  suggestedPricePerM2: 295.00,
                  isCustomEdited: false
                };
              }

              const match = defaultInitialMaterials.find(
                (d) => d.id === m.id || d.name?.toLowerCase() === (m.name || '').toLowerCase()
              );
              let cost = Number(m.factoryCostPerM2 ?? 0);
              let wholesale = Number(m.wholesalePricePerM2 ?? 0);
              let suggested = Number(m.suggestedPricePerM2 ?? 0);
              const isCustom = Boolean(m.isCustomEdited);
              
              if (!isCustom && match) {
                if (cost === 0 || cost >= 180) cost = match.factoryCostPerM2;
                if (wholesale >= 400 && match.id === 'mat-acrilico-luxo') wholesale = match.wholesalePricePerM2;
                if (wholesale >= 200 && match.id === 'mat-pvc-branco') wholesale = match.wholesalePricePerM2;
                if (wholesale >= 300 && match.id === 'mat-acm') wholesale = match.wholesalePricePerM2;
                suggested = match.suggestedPricePerM2;
              }
              if (cost === 0) cost = match?.factoryCostPerM2 || 69.44;
              if (wholesale === 0) wholesale = match?.wholesalePricePerM2 || 115.00;
              if (suggested === 0) suggested = match?.suggestedPricePerM2 || 180.00;

              return {
                ...m,
                factoryCostPerM2: cost,
                wholesalePricePerM2: wholesale,
                suggestedPricePerM2: suggested,
                isCustomEdited: isCustom
              };
            });
            localStorage.setItem('smd_materials', JSON.stringify(repaired));
            return repaired;
          }
        } catch (e) {}
      }
    }
    return defaultInitialMaterials;
  });

  const setMaterials = (mats) => {
    setMaterialsState((prev) => {
      const next = typeof mats === 'function' ? mats(prev) : mats;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_materials', JSON.stringify(next));
        broadcastSync('materials', next);
      }
      return next;
    });
  };

  const addMaterial = (newMat) => {
    const item = {
      id: 'mat-' + Date.now(),
      name: newMat.name || 'Novo Material',
      factoryCostPerM2: Number(newMat.factoryCostPerM2) || 180,
      wholesalePricePerM2: Number(newMat.wholesalePricePerM2) || 530,
      suggestedPricePerM2: Number(newMat.suggestedPricePerM2) || 800,
      style: newMat.style || 'dourado',
      leadTimeDays: Number(newMat.leadTimeDays) || 3,
      description: newMat.description || 'Material fabril sob medida.',
      isCustomEdited: true
    };
    setMaterialsState((prev) => {
      const updated = [item, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_materials', JSON.stringify(updated));
        broadcastSync('materials', updated);
      }
      return updated;
    });
    showNotification(`Material "${item.name}" adicionado com sucesso!`);

    syncToSupabase('materials', {
      id: item.id,
      name: item.name,
      factory_cost_per_m2: item.factoryCostPerM2,
      wholesale_price_per_m2: item.wholesalePricePerM2,
      suggested_price_per_m2: item.suggestedPricePerM2,
      style: item.style,
      lead_time_days: item.leadTimeDays,
      description: item.description,
      is_custom_edited: true
    });
  };

  const updateMaterial = (id, updatedFields) => {
    let updatedItem = null;
    setMaterialsState((prev) => {
      const updated = prev.map((m) => {
        if (m.id === id) {
          updatedItem = { ...m, ...updatedFields, isCustomEdited: true };
          return updatedItem;
        }
        return m;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_materials', JSON.stringify(updated));
        broadcastSync('materials', updated);
      }
      return updated;
    });
    showNotification('Valores do material atualizados com sucesso!');

    if (updatedItem) {
      syncToSupabase('materials', {
        id: updatedItem.id,
        name: updatedItem.name,
        factory_cost_per_m2: Number(updatedItem.factoryCostPerM2),
        wholesale_price_per_m2: Number(updatedItem.wholesalePricePerM2),
        suggested_price_per_m2: Number(updatedItem.suggestedPricePerM2),
        style: updatedItem.style,
        lead_time_days: Number(updatedItem.leadTimeDays),
        description: updatedItem.description,
        is_custom_edited: true
      });
    }
  };

  const deleteMaterial = (id) => {
    const updated = materials.filter((m) => m.id !== id);
    setMaterials(updated);
    showNotification('Material removido.');

    const client = getSupabaseClient();
    if (client) {
      client.from('materials').delete().eq('id', id).then(() => {});
    }
  };

  // Fonts State (Fontes CNC Laser & Tipografias Gerenciadas no Admin)
  const [fonts, setFontsState] = useState(() => getAllActiveFonts());

  const addCustomFont = async (fontData) => {
    try {
      const newMeta = await registerCustomFont(fontData);
      setFontsState(getAllActiveFonts());
      showNotification(`✨ Fonte "${newMeta.name}" adicionada com sucesso!`);
      return newMeta;
    } catch (err) {
      showNotification(`❌ ${err.message || 'Erro ao adicionar fonte'}`);
      throw err;
    }
  };

  const removeFont = async (fontId) => {
    try {
      await removeFontById(fontId);
      setFontsState(getAllActiveFonts());
      showNotification('Fonte removida.');
      return true;
    } catch (err) {
      showNotification(`❌ ${err.message || 'Erro ao remover fonte'}`);
      throw err;
    }
  };

  const restoreFonts = () => {
    const list = restoreDefaultFonts();
    setFontsState(list);
    showNotification('Fontes padrão restauradas!');
  };

  // Products State (Normalizado automaticamente para Português)
  const [products, setProductsState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_products');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.map((p) => ({
              ...p,
              category: normalizeCategoryName(p.category)
            }));
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const setProducts = (prods) => {
    setProductsState((prev) => {
      const raw = typeof prods === 'function' ? prods(prev) : prods;
      const next = Array.isArray(raw)
        ? raw.map((p) => (p.category ? { ...p, category: normalizeCategoryName(p.category) } : p))
        : raw;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_products', JSON.stringify(next));
        broadcastSync('products', next);
      }
      return next;
    });
  };

  // Reseller Suggested Products (Pending Approval by Admin)
  const [pendingProducts, setPendingProductsState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_pending_products');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return [];
  });

  const setPendingProducts = (pProds) => {
    setPendingProductsState((prev) => {
      const next = typeof pProds === 'function' ? pProds(prev) : pProds;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_pending_products', JSON.stringify(next));
        broadcastSync('pendingProducts', next);
      }
      return next;
    });
  };

  // Reseller Cart
  const [cart, setCart] = useState([]);

  // Reseller Wallet & Prepaid Balance State
  const [walletBalance, setWalletBalanceState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_wallet_balance');
      if (saved !== null && !isNaN(Number(saved))) {
        return Number(saved);
      }
    }
    return 0.00; // Saldo real padrão (R$ 0,00)
  });

  const [walletTransactions, setWalletTransactionsState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_wallet_transactions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return []; // Histórico real padrão limpo
  });

  const resetWalletToZero = () => {
    setWalletBalanceState(0);
    setWalletTransactionsState([]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smd_wallet_balance', '0');
      localStorage.setItem('smd_wallet_transactions', JSON.stringify([]));
    }
    showNotification('Saldo de simulação zerado! A carteira agora opera em modo real com R$ 0,00.', 'success');
  };

  const addWalletFunds = ({ amount, description = 'Recarga via PIX Instantâneo' }) => {
    const numAmount = Math.max(0, Number(amount) || 0);
    if (numAmount <= 0) return false;

    setWalletBalanceState((prev) => {
      const next = Number((prev + numAmount).toFixed(2));
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_wallet_balance', String(next));
      }
      return next;
    });

    const newTx = {
      id: 'WTX-' + Date.now(),
      type: 'credit',
      amount: numAmount,
      description,
      date: new Date().toISOString()
    };

    setWalletTransactionsState((prev) => {
      const next = [newTx, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_wallet_transactions', JSON.stringify(next));
      }
      return next;
    });

    showNotification(`💰 R$ ${numAmount.toFixed(2)} adicionados à sua carteira com sucesso!`, 'success');

    // Notificar no Telegram (@smddropbot)
    notifyWalletRechargeToTelegram({
      resellerName: currentUser?.name || 'Revendedor',
      resellerEmail: currentUser?.email || '',
      amount: numAmount,
      method: description
    });

    return true;
  };

  const deductWalletFunds = ({ amount, orderId, description }) => {
    const numAmount = Math.max(0, Number(amount) || 0);
    if (walletBalance < numAmount) {
      showNotification(`Saldo insuficiente na carteira (Disponível: R$ ${walletBalance.toFixed(2)}).`, 'error');
      return false;
    }

    setWalletBalanceState((prev) => {
      const next = Math.max(0, Number((prev - numAmount).toFixed(2)));
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_wallet_balance', String(next));
      }
      return next;
    });

    const newTx = {
      id: 'WTX-' + Date.now(),
      type: 'debit',
      amount: numAmount,
      description: description || `Pagamento Pedido ${orderId || ''}`,
      date: new Date().toISOString()
    };

    setWalletTransactionsState((prev) => {
      const next = [newTx, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_wallet_transactions', JSON.stringify(next));
      }
      return next;
    });

    return true;
  };

  // Orders State (Normalizado e seguro contra valores nulos)
  const [orders, setOrdersState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_orders');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.map((o) => ({
              ...o,
              wholesaleTotal: Number(o.wholesaleTotal ?? o.wholesale_total ?? o.total ?? 0) || 0,
              total: Number(o.total ?? o.wholesaleTotal ?? o.wholesale_total ?? 0) || 0,
              resellerName: o.resellerName || o.reseller_name || 'Revendedor',
              dispatchMode: o.dispatchMode || o.dispatch_mode || 'marketplace_label',
              marketplace: o.marketplace || 'Mercado Livre',
              fiscalData: o.fiscalData || null,
              items: Array.isArray(o.items) ? o.items.map((it) => ({
                ...it,
                unitWholesalePrice: Number(it.unitWholesalePrice ?? it.price ?? 0) || 0
              })) : []
            }));
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const setOrders = (ords) => {
    setOrdersState((prev) => {
      const raw = typeof ords === 'function' ? ords(prev) : ords;
      const next = Array.isArray(raw)
        ? raw.map((o) => ({
            ...o,
            wholesaleTotal: Number(o.wholesaleTotal ?? o.wholesale_total ?? o.total ?? 0) || 0,
            total: Number(o.total ?? o.wholesaleTotal ?? o.wholesale_total ?? 0) || 0,
            resellerName: o.resellerName || o.reseller_name || 'Revendedor',
            dispatchMode: o.dispatchMode || o.dispatch_mode || 'marketplace_label',
            marketplace: o.marketplace || 'Mercado Livre',
            fiscalData: o.fiscalData || null,
            items: Array.isArray(o.items) ? o.items.map((it) => ({
              ...it,
              unitWholesalePrice: Number(it.unitWholesalePrice ?? it.price ?? 0) || 0
            })) : []
          }))
        : raw;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_orders', JSON.stringify(next));
        broadcastSync('orders', next);
      }
      return next;
    });
  };

  const resetSystemForProduction = async () => {
    setProducts([]);
    setCategories([]);
    setOrders([]);
    setPendingProducts([]);
    setUsers([]);
    setCart([]);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('smd_products');
      localStorage.removeItem('smd_categories');
      localStorage.removeItem('smd_orders');
      localStorage.removeItem('smd_pending_products');
      localStorage.removeItem('smd_users');
      localStorage.removeItem('smd_cart');
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('order_items').delete().neq('id', '___');
        await client.from('orders').delete().neq('id', '___');
        await client.from('products').delete().neq('id', '___');
        await client.from('categories').delete().neq('id', '___');
      } catch (err) {
        console.error('Erro ao zerar Supabase:', err);
      }
    }

    showNotification('🧹 Sistema e Banco de Dados Zerados com Sucesso! Prontíssimo para Produção.', 'success');
  };

  const restoreFullBackup = (backupData) => {
    if (!backupData || typeof backupData !== 'object') {
      showNotification('Arquivo de backup inválido.', 'error');
      return false;
    }
    if (Array.isArray(backupData.products)) {
      setProducts(backupData.products);
    }
    if (Array.isArray(backupData.categories)) {
      setCategories(backupData.categories);
    }
    if (Array.isArray(backupData.materials)) {
      setMaterials(backupData.materials);
    }
    if (Array.isArray(backupData.orders)) {
      setOrders(backupData.orders);
    }
    if (Array.isArray(backupData.users)) {
      setUsers(backupData.users);
    }
    if (Array.isArray(backupData.pendingProducts)) {
      setPendingProducts(backupData.pendingProducts);
    }
    if (backupData.companySettings) {
      updateCompanySettings(backupData.companySettings);
    }
    showNotification('🎉 Backup completo restaurado com sucesso no sistema!', 'success');
    return true;
  };

  // Notifications Toast
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Auth Functions
  const loginAsAdmin = (email, password) => {
    if (email.toLowerCase() === adminEmail.toLowerCase()) {
      const adminUser = {
        id: 'admin-1',
        email: adminEmail,
        name: 'Administrador da Fábrica',
        role: 'admin'
      };
      setCurrentUser(adminUser);
      setViewMode('factory');
      showNotification('Autenticado como Administrador da Fábrica!');
      return true;
    } else {
      showNotification('Email não autorizado como administrador.', 'error');
      return false;
    }
  };

  const loginAsReseller = (email, name) => {
    const isAdmin = email.toLowerCase() === adminEmail.toLowerCase();
    const resellerUser = {
      id: isAdmin ? 'admin-geovan' : 'user-' + Date.now(),
      email,
      name: name || (isAdmin ? 'Geovan Calado (Admin Fábrica)' : 'Revendedor Autorizado'),
      cnpj: '45.109.892/0001-99',
      phone: '(11) 99999-8888',
      pixKey: email,
      role: isAdmin ? 'admin' : 'reseller',
      status: 'aprovado',
      tier: isAdmin ? 'VIP Gold' : 'Bronze',
      discountPercent: isAdmin ? 100 : 0
    };
    setCurrentUser(resellerUser);
    setViewMode(isAdmin ? 'factory' : 'reseller');
    showNotification(isAdmin ? '👑 Autenticado como Administrador da Fábrica!' : `Bem-vindo, ${resellerUser.name}!`);

    // Sync to Supabase
    syncToSupabase('users', {
      id: resellerUser.id,
      name: resellerUser.name,
      email: resellerUser.email,
      phone: resellerUser.phone,
      cnpj: resellerUser.cnpj,
      role: resellerUser.role,
      status: resellerUser.status,
      tier: resellerUser.tier
    });
  };

  const registerReseller = (userData) => {
    // Security Helper: Sanitize inputs to prevent XSS script injection
    const sanitize = (str) => (typeof str === 'string' ? str.replace(/<[^>]*>?/gm, '').trim() : '');

    const userEmail = sanitize(userData.email).toLowerCase();
    const isAdmin = userEmail === adminEmail.toLowerCase();

    const newResellerUser = {
      id: isAdmin ? 'admin-geovan' : 'user-' + Date.now(),
      name: sanitize(userData.storeName) || (isAdmin ? 'Geovan Calado (Admin Fábrica)' : 'Nova Loja Revendedora'),
      email: userEmail,
      phone: sanitize(userData.phone) || '(11) 99999-9999',
      cnpj: sanitize(userData.cnpj) || '45.109.892/0001-99',
      role: isAdmin ? 'admin' : 'reseller',
      status: 'aprovado',
      tier: isAdmin ? 'VIP Gold' : 'Bronze',
      discountPercent: isAdmin ? 100 : 0,
      totalOrders: 0,
      totalSpent: 0.00,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers((prev) => [newResellerUser, ...prev]);
    setCurrentUser(newResellerUser);
    setViewMode(isAdmin ? 'factory' : 'reseller');

    if (isAdmin) {
      showNotification(`👑 Conta de Administrador da Fábrica ativada! Bem-vindo, Geovan!`);
    } else {
      showNotification(`🎉 Conta criada com sucesso! Bem-vindo, ${newResellerUser.name}!`);
    }

    // Sync to Supabase table 'users'
    syncToSupabase('users', {
      id: newResellerUser.id,
      name: newResellerUser.name,
      email: newResellerUser.email,
      phone: newResellerUser.phone,
      cnpj: newResellerUser.cnpj,
      role: newResellerUser.role,
      status: newResellerUser.status,
      tier: newResellerUser.tier
    });

    return true;
  };

  const logout = () => {
    setCurrentUser(defaultResellerUser);
    setViewMode('reseller');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smd_current_user');
      localStorage.setItem('smd_view_mode', 'reseller');
    }
    showNotification('Sessão encerrada.');
  };

  // User Management Functions
  const updateUserStatus = (userId, newStatus, newTier, newDiscount) => {
    setUsers((prev) => {
      const next = prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            status: newStatus || u.status,
            tier: newTier || u.tier,
            discountPercent: newDiscount !== undefined ? newDiscount : u.discountPercent
          };
        }
        return u;
      });
      const target = next.find((u) => u.id === userId);
      if (target) {
        syncToSupabase('users', {
          id: target.id,
          name: target.name,
          email: target.email,
          phone: target.phone,
          cnpj: target.cnpj,
          role: target.role,
          status: target.status,
          tier: target.tier,
          discount_percent: target.discountPercent
        });
      }
      return next;
    });
    showNotification(`Dados do revendedor atualizados com sucesso!`);
  };

  const deleteUser = (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showNotification('Revendedor removido da base.');

    const client = getSupabaseClient();
    if (client) {
      client.from('users').delete().eq('id', userId).then(() => {});
    }
  };

  const updateProfile = (updatedProfile) => {
    setCurrentUser((prev) => {
      const nextUser = { ...prev, ...updatedProfile };
      syncToSupabase('users', {
        id: nextUser.id,
        name: nextUser.name,
        email: nextUser.email,
        phone: nextUser.phone,
        cnpj: nextUser.cnpj,
        role: nextUser.role,
        status: nextUser.status,
        tier: nextUser.tier
      });
      return nextUser;
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updatedProfile } : u))
    );
    showNotification('Seus dados de perfil foram salvos!');
  };

  // Real-time Cross-Tab & Incognito Window Synchronizer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel;
    try {
      channel = new BroadcastChannel('smd_drop_sync_channel');
    } catch (e) {}

    const handleMessage = (event) => {
      const { type, key, data, payload } = event.data || {};

      if (type === 'REQUEST_STATE_SYNC' && channel) {
        channel.postMessage({
          type: 'RESPONSE_STATE_SYNC',
          payload: {
            products,
            categories,
            materials,
            orders,
            users,
            pendingProducts,
            companySettings
          }
        });
      } else if (type === 'RESPONSE_STATE_SYNC' && payload) {
        if (payload.products && Array.isArray(payload.products)) {
          setProductsState(payload.products);
          localStorage.setItem('smd_products', JSON.stringify(payload.products));
        }
        if (payload.categories && Array.isArray(payload.categories)) {
          setCategoriesState(payload.categories);
          localStorage.setItem('smd_categories', JSON.stringify(payload.categories));
        }
        if (payload.materials && Array.isArray(payload.materials)) {
          setMaterialsState(payload.materials);
          localStorage.setItem('smd_materials', JSON.stringify(payload.materials));
        }
        if (payload.orders && Array.isArray(payload.orders)) {
          setOrdersState(payload.orders);
          localStorage.setItem('smd_orders', JSON.stringify(payload.orders));
        }
        if (payload.users && Array.isArray(payload.users)) {
          setUsersState(payload.users);
          localStorage.setItem('smd_users', JSON.stringify(payload.users));
        }
        if (payload.pendingProducts && Array.isArray(payload.pendingProducts)) {
          setPendingProductsState(payload.pendingProducts);
          localStorage.setItem('smd_pending_products', JSON.stringify(payload.pendingProducts));
        }
        if (payload.companySettings) {
          setCompanySettingsState(payload.companySettings);
          localStorage.setItem('smd_company_settings', JSON.stringify(payload.companySettings));
        }
      } else if (type === 'SYNC_FIELD_UPDATE') {
        if (key === 'products' && Array.isArray(data)) {
          setProductsState(data);
          localStorage.setItem('smd_products', JSON.stringify(data));
        } else if (key === 'categories' && Array.isArray(data)) {
          setCategoriesState(data);
          localStorage.setItem('smd_categories', JSON.stringify(data));
        } else if (key === 'materials' && Array.isArray(data)) {
          setMaterialsState(data);
          localStorage.setItem('smd_materials', JSON.stringify(data));
        } else if (key === 'orders' && Array.isArray(data)) {
          setOrdersState(data);
          localStorage.setItem('smd_orders', JSON.stringify(data));
        } else if (key === 'users' && Array.isArray(data)) {
          setUsersState(data);
          localStorage.setItem('smd_users', JSON.stringify(data));
        } else if (key === 'pendingProducts' && Array.isArray(data)) {
          setPendingProductsState(data);
          localStorage.setItem('smd_pending_products', JSON.stringify(data));
        } else if (key === 'companySettings' && data) {
          setCompanySettingsState(data);
          localStorage.setItem('smd_company_settings', JSON.stringify(data));
        } else if (key === 'itemsPerRow' && data) {
          setItemsPerRowState(Number(data));
          localStorage.setItem('apex_items_per_row', String(data));
        } else if (key === 'itemsPerPage' && data) {
          setItemsPerPageState(Number(data));
          localStorage.setItem('apex_items_per_page', String(data));
        }
      }
    };

    if (channel) {
      channel.addEventListener('message', handleMessage);
      channel.postMessage({ type: 'REQUEST_STATE_SYNC' });
    }

    const handleStorage = (e) => {
      if (e.key === 'smd_products' && e.newValue) {
        try { setProductsState(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'smd_categories' && e.newValue) {
        try { setCategoriesState(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'smd_orders' && e.newValue) {
        try { setOrdersState(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'smd_users' && e.newValue) {
        try { setUsersState(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'smd_materials' && e.newValue) {
        try { setMaterialsState(JSON.parse(e.newValue)); } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) {
        channel.removeEventListener('message', handleMessage);
        channel.close();
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Load & Hydrate Data from Supabase Database on App Startup (Syncs Vercel & Localhost)
  useEffect(() => {
    const fetchSupabaseData = async () => {
      const client = getSupabaseClient();
      if (!client) return;

      try {
        // 1. Fetch Categories from Supabase
        const { data: dbCategories, error: catErr } = await client.from('categories').select('*');
        if (!catErr && dbCategories && dbCategories.length > 0) {
          const catNames = dbCategories.map((c) => normalizeCategoryName(c.name));
          setCategoriesState((prev) => {
            const merged = normalizeCategoryList([...prev, ...catNames]);
            if (typeof window !== 'undefined') {
              localStorage.setItem('smd_categories', JSON.stringify(merged));
            }
            return merged;
          });
        }

        // 2. Fetch Products from Supabase (Smart Merge to preserve local activations & drafts)
        const { data: dbProducts, error: prodErr } = await client.from('products').select('*');
        const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('smd_products') : null;
        let localProds = [];
        if (savedLocal) {
          try {
            const parsed = JSON.parse(savedLocal);
            if (Array.isArray(parsed)) localProds = parsed;
          } catch (e) {}
        }

        if (!prodErr && dbProducts) {
          const dbNormalized = dbProducts.map((p) => deserializeProductFromSupabase(p));
          const mergedProdsMap = new Map();

          dbNormalized.forEach(p => mergedProdsMap.set(p.id, p));

          localProds.forEach(lp => {
            if (!mergedProdsMap.has(lp.id)) {
              mergedProdsMap.set(lp.id, lp);
              safeSyncProductToSupabase(lp);
            } else {
              const existingInDb = mergedProdsMap.get(lp.id);
              if (lp.status === 'approved' && existingInDb.status !== 'approved') {
                const updated = { ...existingInDb, ...lp, status: 'approved' };
                mergedProdsMap.set(lp.id, updated);
                safeSyncProductToSupabase(updated);
              }
            }
          });

          const finalMergedProducts = Array.from(mergedProdsMap.values());
          setProductsState(finalMergedProducts);
          if (typeof window !== 'undefined') {
            localStorage.setItem('smd_products', JSON.stringify(finalMergedProducts));
          }
        }

        // 3. Fetch Orders from Supabase
        const { data: dbOrders, error: ordErr } = await client.from('orders').select('*');
        if (!ordErr && dbOrders && dbOrders.length > 0) {
          const normalizedOrders = dbOrders.map((o) => ({
            id: o.id,
            resellerName: o.reseller_name || o.resellerName || 'Revendedor',
            resellerEmail: o.reseller_email || o.resellerEmail || '',
            wholesaleTotal: Number(o.wholesale_total ?? o.wholesaleTotal ?? 0) || 0,
            total: Number(o.total ?? o.wholesale_total ?? o.wholesaleTotal ?? 0) || 0,
            status: o.status || 'aguardando_impressao',
            dispatchMode: o.dispatch_mode || o.dispatchMode || 'marketplace_label',
            marketplace: o.marketplace || 'Mercado Livre',
            trackingCode: o.tracking_code || o.trackingCode || null,
            labelPdf: o.label_pdf || o.labelPdf || null,
            createdAt: o.created_at || o.createdAt,
            items: Array.isArray(o.items) ? o.items.map((it) => ({
              ...it,
              unitWholesalePrice: Number(it.unitWholesalePrice ?? it.price ?? 0) || 0
            })) : []
          }));
          setOrdersState(normalizedOrders);
          if (typeof window !== 'undefined') {
            localStorage.setItem('smd_orders', JSON.stringify(normalizedOrders));
          }
        }

        // 4. Fetch Company Settings & Layout preferences from Supabase
        const { data: dbSettings, error: setErr } = await client.from('company_settings').select('*').limit(1);
        if (!setErr && dbSettings && dbSettings.length > 0) {
          const s = dbSettings[0];
          const socLinks = typeof s.social_links === 'string' ? JSON.parse(s.social_links) : (s.social_links || {});
          const mySites = typeof s.my_sites === 'string' ? JSON.parse(s.my_sites) : (s.my_sites || []);

          setCompanySettingsState((prev) => {
            const mergedSettings = {
              ...prev,
              name: s.name || prev.name,
              subtitle: s.subtitle || socLinks.subtitle || prev.subtitle,
              cnpj: s.cnpj || prev.cnpj,
              phone: s.phone || prev.phone,
              email: s.email || prev.email,
              address: s.address || prev.address,
              mySites: Array.isArray(mySites) && mySites.length > 0 ? mySites : prev.mySites,
              socialLinks: {
                instagram: socLinks.instagram || prev.socialLinks?.instagram || '',
                facebook: socLinks.facebook || prev.socialLinks?.facebook || '',
                whatsapp: socLinks.whatsapp || prev.socialLinks?.whatsapp || '',
                youtube: socLinks.youtube || prev.socialLinks?.youtube || ''
              },
              heroSettings: (() => {
                const defaultHero = {
                  enabled: true,
                  badge: "OPORTUNIDADE DE RENDA EXTRA • FABRICAÇÃO PRÓPRIA B2B",
                  title: "Venda Produtos de Acrílico & Neon LED Sem Estoque e Lucre de R$ 3.000 a R$ 15.000/mês!",
                  subtitle: "A fábrica SMD Drop cuida de tudo para você: nós produzimos sob medida, embalamos em caixa neutra e despachamos direto para o seu cliente final com a sua etiqueta do Mercado Livre, Shopee ou Amazon.",
                  ctaText: "✨ Criar Conta Grátis e Liberar Atacado em 30s →",
                  bullet1Title: "Zero Estoque",
                  bullet1Subtitle: "Só pague após vender",
                  bullet2Title: "Envio Cego Neutro",
                  bullet2Subtitle: "Sua marca na etiqueta",
                  bullet3Title: "Margem de 300%",
                  bullet3Subtitle: "Preços direto de fábrica"
                };
                const fetchedHero = s.hero_settings
                  ? (typeof s.hero_settings === 'string' ? JSON.parse(s.hero_settings) : s.hero_settings)
                  : (socLinks.heroSettings || prev.heroSettings || {});
                return { ...defaultHero, ...fetchedHero };
              })(),
              termsContent: s.legal_terms || prev.termsContent,
              privacyContent: s.legal_privacy || prev.privacyContent
            };
            if (typeof window !== 'undefined') {
              localStorage.setItem('smd_company_settings', JSON.stringify(mergedSettings));
            }
            return mergedSettings;
          });

          if (s.items_per_row) {
            setItemsPerRowState(Number(s.items_per_row));
            if (typeof window !== 'undefined') localStorage.setItem('apex_items_per_row', String(s.items_per_row));
          }
          if (s.items_per_page) {
            setItemsPerPageState(Number(s.items_per_page));
            if (typeof window !== 'undefined') localStorage.setItem('apex_items_per_page', String(s.items_per_page));
          }
        }

        // 5. Fetch Materials from Supabase
        const { data: dbMaterials, error: matErr } = await client.from('materials').select('*');
        if (!matErr && dbMaterials && dbMaterials.length > 0) {
          const normalizedMats = dbMaterials.map((m) => {
            if (m.id === 'mat-mdf-cru' || (m.name && m.name.toLowerCase().includes('mdf'))) {
              return {
                id: 'mat-mdf-cru',
                name: 'MDF 6mm',
                factoryCostPerM2: 69.44,
                wholesalePricePerM2: 115.00,
                suggestedPricePerM2: 180.00,
                style: 'madeira',
                leadTimeDays: 2,
                description: 'MDF 6mm Industrial (Chapa 1800x1200mm a R$ 150). Padrão Gestor Pro CNC.',
                isCustomEdited: false
              };
            }

            const match = defaultInitialMaterials.find(
              (d) => d.id === m.id || d.name?.toLowerCase() === (m.name || '').toLowerCase()
            );
            let cost = m.factory_cost_per_m2 !== null && m.factory_cost_per_m2 !== undefined ? Number(m.factory_cost_per_m2) : 0;
            const isCustom = Boolean(m.is_custom_edited || m.isCustomEdited);
            if (!isCustom && match) {
              if (cost === 0 || cost === 35 || (cost === 180 && match.factoryCostPerM2 !== 180)) {
                cost = match.factoryCostPerM2;
              }
            }
            if (cost === 0) cost = match?.factoryCostPerM2 || 102.66;

            return {
              id: m.id,
              name: m.name,
              factoryCostPerM2: cost,
              wholesalePricePerM2: m.wholesale_price_per_m2 !== null && m.wholesale_price_per_m2 !== undefined ? Number(m.wholesale_price_per_m2) : (match?.wholesalePricePerM2 || 530),
              suggestedPricePerM2: m.suggested_price_per_m2 !== null && m.suggested_price_per_m2 !== undefined ? Number(m.suggested_price_per_m2) : (match?.suggestedPricePerM2 || 800),
              style: m.style || match?.style || 'dourado',
              leadTimeDays: Number(m.lead_time_days ?? match?.leadTimeDays ?? 3),
              description: m.description || match?.description || '',
              isCustomEdited: isCustom
            };
          });
          setMaterialsState(normalizedMats);
          if (typeof window !== 'undefined') localStorage.setItem('smd_materials', JSON.stringify(normalizedMats));
        }

        // 6. Fetch Users from Supabase
        const { data: dbUsers, error: usrErr } = await client.from('users').select('*');
        if (!usrErr && dbUsers && dbUsers.length > 0) {
          const normalizedUsers = dbUsers.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            cnpj: u.cnpj,
            role: u.role || 'reseller',
            status: u.status || 'aprovado',
            tier: u.tier || 'Bronze',
            discountPercent: Number(u.discount_percent ?? 0),
            totalOrders: Number(u.total_orders ?? 0),
            totalSpent: Number(u.total_spent ?? 0),
            createdAt: u.created_at
          }));
          setUsersState(normalizedUsers);
          if (typeof window !== 'undefined') localStorage.setItem('smd_users', JSON.stringify(normalizedUsers));
        }
      } catch (err) {
        console.warn('[Supabase Sync Hydration Error]:', err);
      }
    };

    fetchSupabaseData();

    if (typeof window !== 'undefined') {
      const handleWindowFocus = () => fetchSupabaseData();
      window.addEventListener('focus', handleWindowFocus);
      const syncInterval = setInterval(fetchSupabaseData, 15000);
      return () => {
        window.removeEventListener('focus', handleWindowFocus);
        clearInterval(syncInterval);
      };
    }
  }, []);

  // Migração e Tradução Automática no carregamento (Sem ação manual do usuário)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const savedCats = localStorage.getItem('smd_categories');
      const savedProds = localStorage.getItem('smd_products');
      let changed = false;

      if (savedCats) {
        const parsed = JSON.parse(savedCats);
        if (Array.isArray(parsed)) {
          const translated = normalizeCategoryList(parsed);
          if (JSON.stringify(parsed) !== JSON.stringify(translated)) {
            localStorage.setItem('smd_categories', JSON.stringify(translated));
            setCategoriesState(translated);
            changed = true;
          }
        }
      }

      if (savedProds) {
        const parsed = JSON.parse(savedProds);
        if (Array.isArray(parsed)) {
          let prodsChanged = false;
          const translatedProds = parsed.map((p) => {
            const nextCat = normalizeCategoryName(p.category);
            if (nextCat !== p.category) {
              prodsChanged = true;
              return { ...p, category: nextCat };
            }
            return p;
          });
          if (prodsChanged) {
            localStorage.setItem('smd_products', JSON.stringify(translatedProds));
            setProductsState(translatedProds);
            changed = true;
          }
        }
      }

      if (changed) {
        console.log('[SMD Drop] ✨ Categorias traduzidas automaticamente para Português no carregamento.');
      }
    } catch (err) {
      console.warn('[Auto-translate startup error]:', err);
    }
  }, []);

  // Sync all current state to Supabase
  const syncAllToSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      showNotification('Supabase não configurado. Adicione a URL e Chave Anon primeiro.', 'error');
      return false;
    }

    try {
      // 1. Sync Categories
      await ensureCategoriesInSupabase(categories);

      // 2. Sync Products
      await safeSyncProductsBatchToSupabase(products);

      // 3. Sync Orders
      for (const ord of orders) {
        await client.from('orders').upsert({
          id: ord.id,
          reseller_name: ord.resellerName || 'Revendedor',
          reseller_email: ord.resellerEmail || '',
          wholesale_total: Number(ord.wholesaleTotal) || 0,
          total: Number(ord.wholesaleTotal) || 0,
          status: ord.status || 'aguardando_impressao',
          dispatch_mode: ord.dispatchMode || 'marketplace_label',
          customer_name: ord.customerName || 'Cliente Final',
          customer_address: ord.customerAddress || 'Endereço',
          customer_city: ord.customerCity || 'São Paulo',
          customer_state: ord.customerState || 'SP',
          customer_zip: ord.customerZip || '01000-000'
        }, { onConflict: 'id' });
      }

      // 4. Sync Company Settings
      const payloadSocialLinks = {
        ...(companySettings.socialLinks || {}),
        subtitle: companySettings.subtitle || '',
        heroSettings: companySettings.heroSettings || {}
      };

      await client.from('company_settings').upsert({
        id: 1,
        name: companySettings.name || '',
        cnpj: companySettings.cnpj || '',
        phone: companySettings.phone || '',
        email: companySettings.email || '',
        address: companySettings.address || '',
        my_sites: companySettings.mySites || [],
        social_links: payloadSocialLinks,
        legal_terms: companySettings.termsContent || '',
        legal_privacy: companySettings.privacyContent || '',
        items_per_row: itemsPerRow,
        items_per_page: itemsPerPage,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      showNotification('🚀 Todos os dados foram sincronizados com o Supabase!', 'success');
      return true;
    } catch (err) {
      showNotification(`Erro ao sincronizar com Supabase: ${err.message}`, 'error');
      return false;
    }
  };

  // Category Operations
  const addCategory = async (categoryName) => {
    if (!categoryName) return;
    const cleanName = normalizeCategoryName(categoryName.trim());
    setCategories((prev) => {
      if (prev.includes(cleanName)) return prev;
      return [...prev, cleanName];
    });
    showNotification(`Categoria "${cleanName}" criada!`);

    // Sync to Supabase table 'categories'
    await syncToSupabase('categories', {
      id: 'cat-' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: cleanName,
      slug: cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    });
  };

  const editCategory = (oldName, newName) => {
    if (!newName) return;
    const cleanName = normalizeCategoryName(newName.trim());
    setCategories((prev) => prev.map((c) => (c === oldName ? cleanName : c)));
    setProducts((prev) =>
      prev.map((p) => (p.category === oldName ? { ...p, category: cleanName } : p))
    );
    showNotification(`Categoria renomeada para "${cleanName}"!`);
  };

  const deleteCategory = (categoryName) => {
    setCategories((prev) => prev.filter((c) => c !== categoryName));
    showNotification(`Categoria "${categoryName}" removida.`);
  };

  const autoTranslateAllCategories = () => {
    // 1. Translate categories list
    setCategoriesState((prev) => {
      const next = normalizeCategoryList(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_categories', JSON.stringify(next));
        broadcastSync('categories', next);
      }
      return next;
    });

    // 2. Translate product categories
    setProductsState((prev) => {
      const updated = prev.map((p) => {
        const translated = normalizeCategoryName(p.category);
        if (translated !== p.category) {
          return { ...p, category: translated };
        }
        return p;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_products', JSON.stringify(updated));
        broadcastSync('products', updated);
      }
      return updated;
    });

    showNotification('✨ Todas as categorias foram traduzidas para português!');
  };

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Add Item to Cart (Blindado com normalização de preço atacado e quantidade)
  const addToCart = (cartItem) => {
    const wholesale = Number(cartItem.unitWholesalePrice ?? cartItem.wholesalePrice ?? cartItem.price ?? 0) || 0;
    const qty = Number(cartItem.quantity) > 0 ? Number(cartItem.quantity) : 1;
    const retail = Number(cartItem.suggestedRetailPrice ?? cartItem.customSellingPrice ?? (wholesale * 2.2)) || (wholesale * 2.2);

    const normalizedItem = {
      ...cartItem,
      unitWholesalePrice: wholesale,
      wholesalePrice: wholesale,
      quantity: qty,
      suggestedRetailPrice: retail,
      customSellingPrice: Number(cartItem.customSellingPrice) || retail,
      cartId: 'cart-' + Date.now() + Math.random()
    };

    setCart((prev) => [...prev, normalizedItem]);
    showNotification(`Item "${cartItem.title}" adicionado ao carrinho!`);
  };

  const removeFromCart = (cartId) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Submit Order
  const submitOrder = (orderData) => {
    const fiscalData = orderData.fiscalData || buildFiscalOrderData({
      reseller: {
        name: orderData.resellerName || currentUser?.name || 'Revendedor Convidado',
        email: currentUser?.email || orderData.resellerEmail || 'revendedor@smddrop.com.br',
        document: currentUser?.cnpj || orderData.resellerDocument || 'MEI - Isento',
        phone: currentUser?.phone || orderData.resellerPhone || '',
        fiscalRegime: orderData.fiscalRegime || 'mei'
      },
      customer: orderData.customerData || {
        name: orderData.customerName || 'Cliente Final',
        cpf: orderData.customerCpf || '',
        address: orderData.customerAddress || '',
        city: orderData.customerCity || '',
        state: orderData.customerState || '',
        zip: orderData.customerZip || ''
      },
      dispatchMode: orderData.dispatchMode || 'marketplace_label',
      marketplace: orderData.marketplace || 'Mercado Livre',
      fiscalRegime: orderData.fiscalRegime || 'mei',
      documentType: orderData.documentType || (orderData.fiscalRegime === 'mei' ? 'declaracao_conteudo' : 'nfe_venda'),
      nfeKey: orderData.nfeKey || '',
      hasLabelAttached: Boolean(orderData.labelPdf)
    });

    const initialStatus = 'pagamento_confirmado';
    const initialTimeline = [
      {
        stage: initialStatus,
        label: '1. Pagamento Confirmado',
        timestamp: new Date().toISOString(),
        note: 'Custo fabril liquidado ou debitado. Entrada na esteira fabril autorizada.'
      }
    ];

    const newOrder = {
      id: "ORD-" + Math.floor(1000 + Math.random() * 9000),
      resellerName: orderData.resellerName || currentUser?.name || 'Revendedor Convidado',
      resellerEmail: currentUser?.email || orderData.resellerEmail || 'revendedor@smddrop.com.br',
      createdAt: new Date().toISOString(),
      status: initialStatus,
      timeline: initialTimeline,
      ...orderData,
      fiscalData
    };
    const isWalletPay = (orderData.paymentMethod || '').toLowerCase().includes('carteira') || 
                        (orderData.paymentMethod || '').toLowerCase().includes('wallet');

    if (isWalletPay) {
      const totalToPay = Number(orderData.total || orderData.wholesaleTotal || 0);
      deductWalletFunds({
        amount: totalToPay,
        orderId: newOrder.id,
        description: `Débito Pedido ${newOrder.id} (${newOrder.marketplace || 'Envio Direto'})`
      });
    }

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    showNotification(`Pedido ${newOrder.id} enviado para a fábrica!`, 'gold');

    // Sync to Supabase
    syncToSupabase('orders', {
      id: newOrder.id,
      reseller_name: newOrder.resellerName,
      reseller_email: newOrder.resellerEmail,
      wholesale_total: Number(newOrder.wholesaleTotal) || 0,
      shipping_total: Number(newOrder.shippingTotal) || 0,
      total: Number(newOrder.total ?? newOrder.wholesaleTotal) || 0,
      status: newOrder.status,
      dispatch_mode: orderData.dispatchMode || 'marketplace_label',
      marketplace: orderData.marketplace || null,
      tracking_code: newOrder.trackingCode || null,
      label_pdf_url: newOrder.labelPdf || null,
      payment_method: newOrder.paymentMethod || 'pix',
      mercado_pago_fee: Number(newOrder.mercadoPagoFee) || 0,
      items: newOrder.items || [],
      customer_name: orderData.customerName || (newOrder.customerData && newOrder.customerData.name) || 'Cliente Final',
      customer_cpf: (newOrder.customerData && newOrder.customerData.cpf) || null,
      customer_address: orderData.customerAddress || (newOrder.customerData && newOrder.customerData.address) || 'Endereço',
      customer_city: orderData.customerCity || (newOrder.customerData && newOrder.customerData.city) || 'São Paulo',
      customer_state: orderData.customerState || (newOrder.customerData && newOrder.customerData.state) || 'SP',
      customer_zip: orderData.customerZip || (newOrder.customerData && newOrder.customerData.zip) || '01000-000'
    });

    // Notificar imediatamente o dono no Telegram (@smddropbot)
    notifyOrderToTelegram({
      ...newOrder,
      ...orderData
    });

    return newOrder;
  };

  // Update Order Status by Factory with Strict Fiscal Dispatch Lock & Production Timeline
  const updateOrderStatus = (orderId, newStatus, trackingCode = null, note = '') => {
    const canonicalStatus = normalizeProductionStatus(newStatus);
    const targetOrder = orders.find((o) => o.id === orderId);

    // TRAVA FISCAL DE EXPEDIÇÃO: SE TENTAR DESPACHAR (estágio 'enviado') SEM REQUISITOS OBRIGATÓRIOS, BLOQUEIA
    if (canonicalStatus === 'enviado') {
      if (targetOrder && targetOrder.fiscalData && !targetOrder.fiscalData.isFiscalComplete) {
        const reasons = targetOrder.fiscalData.missingReasons?.join('; ') || 'Dados fiscais pendentes';
        showNotification(`⛔ Expedição Bloqueada: Faltam requisitos fiscais obrigatórios (${reasons})!`, 'error');
        return false;
      }
    }

    const stageInfo = getStageInfo(canonicalStatus);
    const timelineEntry = {
      stage: canonicalStatus,
      label: stageInfo.label,
      timestamp: new Date().toISOString(),
      note: note || `Status atualizado para ${stageInfo.label}`
    };

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const currentTimeline = Array.isArray(order.timeline) ? order.timeline : [];
          return {
            ...order,
            status: canonicalStatus,
            trackingCode: trackingCode || order.trackingCode,
            timeline: [...currentTimeline, timelineEntry]
          };
        }
        return order;
      })
    );
    showNotification(`Status do Pedido ${orderId}: ${stageInfo.shortLabel}!`);

    syncToSupabase('orders', {
      id: orderId,
      status: canonicalStatus,
      tracking_code: trackingCode || null
    });
    return true;
  };

  // Avançar Próximo Estágio na Esteira de Produção
  const advanceProductionStage = (orderId, note = '') => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return false;
    const nextStage = getNextProductionStage(target.status);
    if (!nextStage) {
      showNotification(`O pedido ${orderId} já está concluído/entregue!`);
      return false;
    }
    return updateOrderStatus(orderId, nextStage, null, note);
  };

  // Retornar Estágio Anterior para Reprocesso/Retrabalho de Qualidade
  const rollbackProductionStage = (orderId, note = 'Retornado para reprocesso na esteira de produção') => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return false;
    const prevStage = getPrevProductionStage(target.status);
    if (!prevStage) {
      showNotification(`O pedido ${orderId} já está no primeiro estágio!`);
      return false;
    }
    return updateOrderStatus(orderId, prevStage, null, note);
  };

  // Regularização de Dados Fiscais do Pedido (Revendedor ou Fábrica)
  const updateOrderFiscalData = (orderId, updatedFields) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const currentFiscal = order.fiscalData || {};
          const mergedCustomer = {
            ...(currentFiscal.customer || order.customerData || {}),
            ...(updatedFields.customer || {})
          };
          const mergedReseller = {
            ...(currentFiscal.reseller || {}),
            ...(updatedFields.reseller || {})
          };

          const newFiscalData = buildFiscalOrderData({
            reseller: mergedReseller,
            customer: mergedCustomer,
            dispatchMode: updatedFields.dispatchMode || order.dispatchMode,
            marketplace: updatedFields.marketplace || order.marketplace,
            fiscalRegime: updatedFields.fiscalRegime || currentFiscal.reseller?.fiscalRegime || 'mei',
            documentType: updatedFields.documentType || currentFiscal.documentType || 'declaracao_conteudo',
            nfeKey: updatedFields.nfeKey !== undefined ? updatedFields.nfeKey : currentFiscal.nfeKey,
            hasLabelAttached: updatedFields.hasLabelAttached !== undefined ? updatedFields.hasLabelAttached : Boolean(order.labelPdf)
          });

          return {
            ...order,
            customerData: mergedCustomer,
            fiscalData: newFiscalData
          };
        }
        return order;
      })
    );
    showNotification(`Dados fiscais do pedido ${orderId} atualizados!`, 'success');
  };

  const deleteOrder = (orderId) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    showNotification(`Pedido ${orderId} excluído do sistema.`);

    const client = getSupabaseClient();
    if (client) {
      client.from('orders').delete().eq('id', orderId).then(() => {});
    }
  };

  // Add Product by Admin (Direct active publication or Draft)
  const addProduct = async (productData) => {
    const fiscal = resolveSmartFiscalDetails(productData);
    const newProduct = {
      id: "prod-" + Date.now(),
      inStock: productData.status !== 'draft',
      mediaKit: {
        photos: [productData.image],
        copyTitle: productData.title,
        copyDescription: productData.description
      },
      status: 'approved',
      ...fiscal,
      ...productData
    };
    const isDraft = newProduct.status === 'draft' || newProduct.status === 'rascunho';
    setProducts((prev) => [newProduct, ...prev]);
    showNotification(
      isDraft 
        ? `📝 Produto "${productData.title}" salvo como rascunho!` 
        : `Novo produto "${productData.title}" cadastrado no catálogo!`
    );

    safeSyncProductToSupabase(newProduct);
  };

  // Suggest / Register Product by Reseller (Direct active publication & DB sync)
  const suggestProductByReseller = (productData) => {
    const fiscal = resolveSmartFiscalDetails(productData);
    const retailPrice = Number(productData.suggestedRetailPrice) || 120;
    const wholesalePrice = Number(productData.wholesalePrice) || Math.round(retailPrice * 0.45);

    const isDraft = productData.status === 'draft' || productData.status === 'rascunho';

    const newProduct = {
      id: "prod-" + Date.now(),
      createdAt: new Date().toISOString(),
      resellerId: currentUser?.id || 'anon',
      resellerName: currentUser?.name || 'Revendedor Convidado',
      resellerEmail: currentUser?.email || '',
      status: isDraft ? "draft" : "approved",
      inStock: !isDraft,
      wholesalePrice: wholesalePrice,
      suggestedRetailPrice: retailPrice,
      pricePerM2: wholesalePrice,
      suggestedPricePerM2: retailPrice,
      factoryStock: 100,
      resellerNotes: productData.resellerNotes || '',
      image: productData.image || (productData.images && productData.images[0]) || "https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80",
      images: productData.images && productData.images.length > 0 ? productData.images : [productData.image || "https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80"],
      mediaKit: {
        photos: productData.images || (productData.image ? [productData.image] : []),
        copyTitle: productData.title,
        copyDescription: productData.description
      },
      ...fiscal,
      ...productData
    };

    setProducts((prev) => [newProduct, ...prev]);
    if (!isDraft) {
      setPendingProducts((prev) => [newProduct, ...prev]);
    }
    showNotification(
      isDraft
        ? `📝 Produto "${productData.title}" salvo como rascunho!`
        : `✨ Produto "${productData.title}" cadastrado e sincronizado com o banco de dados!`,
      'gold'
    );

    safeSyncProductToSupabase(newProduct);
  };

  // Solicitação de Orçamento sob Medida pelo Revendedor (Envia para Análise Manual da Fábrica)
  const requestCustomQuote = (quoteData) => {
    const title = quoteData.title || quoteData.customText || 'Letreiro Sob Medida';
    const widthCm = Number(quoteData.widthCm) || 0;
    const heightCm = Number(quoteData.heightCm) || 0;
    const materialName = quoteData.materialName || 'MDF 6mm';

    const newQuote = {
      id: "quote-" + Date.now(),
      createdAt: new Date().toISOString(),
      resellerId: currentUser?.id || 'anon',
      resellerName: currentUser?.name || 'Revendedor Convidado',
      resellerEmail: currentUser?.email || '',
      resellerPhone: quoteData.resellerPhone || currentUser?.phone || '',
      title: `${title} (${widthCm}×${heightCm}cm)`,
      description: `Projeto sob medida: ${title} (${widthCm}×${heightCm}cm) em ${materialName}. Tipo: ${quoteData.projectType || 'logo_parede'}.`,
      category: 'Sob Medida',
      pricingType: 'custom_quote',
      status: 'pending_approval',
      widthCm: widthCm,
      heightCm: heightCm,
      materialName: materialName,
      projectType: quoteData.projectType || 'logo_parede',
      resellerNotes: quoteData.resellerNotes || '',
      vectorFileName: quoteData.vectorFileName || '',
      vectorFileUrl: quoteData.vectorFileUrl || '',
      fontFamily: quoteData.fontFamily || 'ArialBold',
      image: quoteData.image || "https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80",
      wholesalePrice: 0,
      suggestedRetailPrice: 0,
      factoryNotes: ''
    };

    setPendingProducts((prev) => [newQuote, ...prev]);
    showNotification(`🚀 Solicitação enviada com sucesso! A fábrica já recebeu seu projeto para análise.`, 'gold');
    safeSyncProductToSupabase(newQuote);
    return newQuote;
  };

  // Approve Reseller Suggested Product (Admin action with pricing and factory notes)
  const approveProductByAdmin = (pendingId, wholesalePrice, suggestedPrice, category, factoryNotes) => {
    const item = pendingProducts.find((p) => p.id === pendingId);
    if (!item) return;

    const raw = {
      title: item.title,
      category: category || item.category || categories[0] || 'Geral',
      pricingType: item.pricingType || 'fixed',
      ...item
    };

    const fiscal = resolveSmartFiscalDetails(raw);

    const approvedProduct = {
      id: "prod-" + (products.length + 1) + '-' + Date.now(),
      title: item.title,
      category: category || item.category || categories[0] || 'Geral',
      pricingType: item.pricingType || 'fixed',
      wholesalePrice: Number(wholesalePrice),
      suggestedRetailPrice: Number(suggestedPrice),
      pricePerM2: Number(wholesalePrice),
      suggestedPricePerM2: Number(suggestedPrice),
      factoryStock: 100,
      leadTimeDays: item.pricingType === 'custom_m2' ? 3 : 1,
      description: item.description || "Produto cadastrado e aprovado pela fábrica.",
      image: item.image || (item.images && item.images[0]) || "https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80",
      images: item.images && item.images.length > 0 ? item.images : [item.image || "https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80"],
      video: item.video || "",
      inStock: true,
      status: 'approved',
      resellerNotes: item.resellerNotes || "",
      factoryNotes: factoryNotes || "",
      requestedByResellerId: item.resellerId || "",
      requestedByResellerName: item.resellerName || "",
      requestedByResellerEmail: item.resellerEmail || "",
      ean: "7899812" + Math.floor(10000 + Math.random() * 90000),
      createdAt: new Date().toISOString(),
      ...fiscal
    };

    setProducts((prev) => [approvedProduct, ...prev]);
    setPendingProducts((prev) =>
      prev.map((p) =>
        p.id === pendingId
          ? {
              ...p,
              status: 'approved',
              wholesalePrice: Number(wholesalePrice),
              suggestedRetailPrice: Number(suggestedPrice),
              category: approvedProduct.category,
              factoryNotes: factoryNotes || "",
              approvedProductId: approvedProduct.id
            }
          : p
      )
    );
    showNotification(`Produto "${approvedProduct.title}" precificado e APROVADO para o catálogo oficial!`);

    safeSyncProductToSupabase(approvedProduct);
  };

  // Reject Reseller Suggested Product (Admin action with reason)
  const rejectProductByAdmin = (pendingId, rejectionReason) => {
    setPendingProducts((prev) =>
      prev.map((p) =>
        p.id === pendingId
          ? { ...p, status: 'rejected', rejectionReason: rejectionReason || "Solicitação não atende aos padrões fabris." }
          : p
      )
    );
    showNotification('Produto recusado com motivo especificado.', 'error');
  };

  const updateProduct = (productId, updatedFields) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === productId ? { ...p, ...updatedFields } : p));
      const target = next.find((p) => p.id === productId);
      if (target) {
        safeSyncProductToSupabase(target);
      }
      return next;
    });
    showNotification(`Produto atualizado com sucesso!`);
  };

  const deleteProduct = (productId) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showNotification('Produto removido do catálogo.');

    const client = getSupabaseClient();
    if (client) {
      client.from('products').delete().eq('id', productId).then(() => {});
    }
  };

  // Shopee Spreadsheet Import & Draft Management Functions
  const importShopeeProducts = (newProductsList) => {
    if (!Array.isArray(newProductsList) || newProductsList.length === 0) return 0;

    const normalizedList = newProductsList.map((p) => ({
      ...p,
      category: normalizeCategoryName(p.category)
    }));

    const newCats = Array.from(new Set(normalizedList.map(p => p.category).filter(Boolean)));
    setCategories(prev => {
      const merged = Array.from(new Set([...prev, ...newCats]));
      return merged;
    });

    let trulyNewItems = [];

    setProducts(prev => {
      const newItemsMap = new Map(normalizedList.map(p => [p.id, p]));
      
      const updatedPrev = prev.map(p => {
        const matched = newItemsMap.get(p.id) || normalizedList.find(np => np.shopeeId && p.shopeeId && np.shopeeId === p.shopeeId);
        if (matched) {
          newItemsMap.delete(matched.id);
          return {
            ...p,
            variations: matched.variations && matched.variations.length > 0 ? matched.variations : (p.variations || []),
            ncm: matched.ncm || p.ncm,
            cest: matched.cest || p.cest,
            measureUnit: matched.measureUnit || p.measureUnit,
            cfopSame: matched.cfopSame || p.cfopSame,
            cfopDiff: matched.cfopDiff || p.cfopDiff,
            csosn: matched.csosn || p.csosn,
            origin: matched.origin || p.origin,
            weightKg: matched.weightKg || p.weightKg,
            dimensions: matched.dimensions || p.dimensions,
            images: matched.images && matched.images.length > 0 ? matched.images : p.images
          };
        }
        return p;
      });

      trulyNewItems = Array.from(newItemsMap.values());
      const updated = [...trulyNewItems, ...updatedPrev];
      return updated;
    });

    if (trulyNewItems.length > 0) {
      safeSyncProductsBatchToSupabase(trulyNewItems);
    }

    showNotification(`🎉 Planilhas Shopee sincronizadas com sucesso! Variações e dados atualizados.`, 'success');
    return newProductsList.length;
  };

  const activateProduct = (productId) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === productId ? { ...p, status: 'approved' } : p));
      const target = next.find((p) => p.id === productId);
      if (target) {
        safeSyncProductToSupabase(target);
        showNotification(`✨ Produto "${target.title}" ativado e publicado no catálogo!`, 'success');
      }
      return next;
    });
  };

  const activateSelectedDrafts = (productIds) => {
    if (!Array.isArray(productIds) || productIds.length === 0) return;
    const idSet = new Set(productIds);

    setProducts((prev) => {
      const next = prev.map((p) => (idSet.has(p.id) ? { ...p, status: 'approved' } : p));
      const toSync = next.filter(p => idSet.has(p.id));
      safeSyncProductsBatchToSupabase(toSync);
      return next;
    });
    showNotification(`🚀 ${productIds.length} produto(s) ativado(s) e publicado(s) no catálogo oficial!`, 'success');
  };

  const moveProductToDraft = (productId) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === productId ? { ...p, status: 'rascunho' } : p));
      const target = next.find((p) => p.id === productId);
      if (target) {
        safeSyncProductToSupabase(target);
        showNotification(`📦 Produto "${target.title}" movido para Rascunho com sucesso!`, 'gold');
      }
      return next;
    });
  };

  const moveSelectedToDraft = (productIds) => {
    if (!Array.isArray(productIds) || productIds.length === 0) return;
    const idSet = new Set(productIds);

    setProducts((prev) => {
      const next = prev.map((p) => (idSet.has(p.id) ? { ...p, status: 'rascunho' } : p));
      const toSync = next.filter(p => idSet.has(p.id));
      safeSyncProductsBatchToSupabase(toSync);
      return next;
    });
    showNotification(`📦 ${productIds.length} produto(s) movido(s) para Rascunho!`, 'gold');
  };

  const deleteSelectedDrafts = (productIds) => {
    if (!Array.isArray(productIds) || productIds.length === 0) return;
    const idSet = new Set(productIds);

    setProducts((prev) => prev.filter((p) => !idSet.has(p.id)));

    const client = getSupabaseClient();
    if (client) {
      client.from('products').delete().in('id', productIds).then(() => {});
    }
    showNotification(`🗑️ ${productIds.length} rascunho(s) removido(s).`);
  };

  // Items Per Page Setting (Configured by Factory Admin)
  const [itemsPerPage, setItemsPerPageState] = useState(() => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem('apex_items_per_page')) || 12;
    }
    return 12;
  });

  const setItemsPerPage = (num) => {
    const val = Number(num);
    setItemsPerPageState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('apex_items_per_page', String(val));
      broadcastSync('itemsPerPage', val);
    }
    syncToSupabase('company_settings', { id: 1, items_per_page: val });
    showNotification(`Limite do catálogo configurado para ${val} produtos por página!`);
  };

  // Items Per Row Setting (Configured by Factory Admin: 3, 4, or 6 columns)
  const [itemsPerRow, setItemsPerRowState] = useState(() => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem('apex_items_per_row')) || 4;
    }
    return 4;
  });

  const setItemsPerRow = (num) => {
    const val = Number(num);
    setItemsPerRowState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('apex_items_per_row', String(val));
      broadcastSync('itemsPerRow', val);
    }
    syncToSupabase('company_settings', { id: 1, items_per_row: val });
    showNotification(`Grade configurada para ${val} produtos por linha!`);
  };

  // Company Settings & Legal Shielding (Configurable by Admin)
  const [companySettings, setCompanySettingsState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_company_settings');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved); 
          if (parsed && parsed.name && !parsed.name.includes('Apex')) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return {
      name: "SMD Drop",
      subtitle: "Plataforma Fabril de Dropshipping & Produtos sob Medida",
      cnpj: "45.109.892/0001-99",
      phone: "(11) 98765-4321",
      email: "contato@smddrop.com.br",
      address: "Av. Industrial Fabril, 1500 - Galpão 4 - São Paulo, SP",
      socialLinks: {
        instagram: "https://instagram.com/smddrop",
        facebook: "https://facebook.com/smddrop",
        whatsapp: "https://wa.me/5511987654321",
        youtube: "https://youtube.com/@smddrop"
      },
      heroSettings: {
        enabled: true,
        badge: "OPORTUNIDADE DE RENDA EXTRA • FABRICAÇÃO PRÓPRIA B2B",
        title: "Venda Produtos de Acrílico & Neon LED Sem Estoque e Lucre de R$ 3.000 a R$ 15.000/mês!",
        subtitle: "A fábrica SMD Drop cuida de tudo para você: nós produzimos sob medida, embalamos em caixa neutra e despachamos direto para o seu cliente final com a sua etiqueta do Mercado Livre, Shopee ou Amazon.",
        ctaText: "✨ Criar Conta Grátis e Liberar Atacado em 30s →",
        bullet1Title: "Zero Estoque",
        bullet1Subtitle: "Só pague após vender",
        bullet2Title: "Envio Cego Neutro",
        bullet2Subtitle: "Sua marca na etiqueta",
        bullet3Title: "Margem de 300%",
        bullet3Subtitle: "Preços direto de fábrica"
      },
      mySites: [
        { title: "Loja Oficial SMD Drop", url: "https://smddrop.com.br" },
        { title: "Portal de Atacado Fabril", url: "https://atacado.smddrop.com.br" },
        { title: "Catálogo Acrílico & Neon", url: "https://acrilico.smddrop.com.br" }
      ],
      monthlyFixedCost: 15000,
      taxRatePct: 5,
      machineHourlyRate: 46.85, // Custo Máquina Laser R$ 46,85/h (Padrão Gestor Pro CNC)
      laborHourlyRate: 12.50, // Custo Acabamento Manual R$ 12,50/h (Padrão Gestor Pro CNC)
      retailMarginPct: 150, // Margem de Lucro 150% do Gestor Pro CNC
      factoryWholesaleMarginPct: 60, // Margem de Atacado da Fábrica (B2B)
      defaultPackagingCost: 4.5,
      maxWallHeightCm: 25, // Limite de altura máxima decorativa de parede (em cm)
      isMaxHeightLockedDefault: true, // Trava inteligente anti-desperdício de chapa ativa por padrão
      minSheetM2: 0.20, // Área mínima fabril de chapa cobrada (em m²)
      enabledProjectTypes: {
        logo_parede: true,
        placa_fundo: true,
        texto_simples: true
      },
      disabledFontIds: [],
      termsContent: `1. ACEITAÇÃO DOS TERMOS E CONDIÇÕES
Ao utilizar a plataforma SMD Drop, o contratante (Revendedor) declara ter lido, compreendido e aceito integralmente estes Termos de Uso. A SMD Drop atua como parceira fabril e prestadora de serviços de fabricação, processamento e postagem de pedidos em modalidade de logística cega (Blind Shipping).

2. DA MODALIDADE DE ENVIO CEGO (BLIND SHIPPING) E RESPONSABILIDADE DAS ETIQUETAS
2.1. A SMD Drop compromete-se a efetuar o despacho de mercadorias utilizando as etiquetas de envio fornecidas pelo contratante (provenientes de plataformas parceiras como Mercado Livre, Shopee, Amazon, Magalu, Nuvemshop ou Shopify).
2.2. A embalagem utilizada pela fábrica é 100% neutra, isenta de marcas, logotipos ou materiais publicitários da SMD Drop, preservando o anonimato da operação perante o cliente final do revendedor.
2.3. O revendedor é o único responsável pela veracidade, conformidade fiscal e validade das etiquetas de frete e declarações de conteúdo cadastradas no sistema.

3. PRODUTOS PERSONALIZADOS SOB MEDIDA (CÁLCULO POR M²) E DIREITO DE ARREPENDIMENTO
3.1. Em estrita conformidade com a jurisprudência brasileira e exceções ao Artigo 49 do Código de Defesa do Consumidor (Lei nº 8.078/1990), produtos fabricados sob medida, personalizados com logomarcas específicas do cliente ou cortados a laser sob demandas customizadas NÃO estão sujeitos a cancelamento injustificado ou devolução por simples arrependimento após a iniciação do processo fabril.
3.2. A SMD Drop garante a substituição ou refabricação sem custos adicionais de qualquer produto que apresente comprovado defeito de fabricação ou divergência em relação ao arquivo vetorial/medidas contratadas.

4. PROPRIEDADE INTELECTUAL E MARCAS REGISTRADAS
4.1. O revendedor declara possuir todos os direitos de uso, autorizações de imagem e licenças de marcas registradas sobre quaisquer logomarcas, arquivos vetoriais ou designs enviados para produção na fábrica.
4.2. A SMD Drop atua estritamente como executora técnica de corte e montagem, ficando isenta de qualquer responsabilidade civil ou criminal por violação de propriedade intelectual cometida pelo contratante.

5. PRAZOS FABRIS E FORÇA MAIOR
5.1. O prazo padrão de fabricação e despacho é de 24h a 72h úteis após a confirmação do pagamento e validação do arquivo vetorial.
5.2. Eventuais atrasos decorrentes de greves de transportadoras, indisponibilidade de serviços de correios ou eventos de força maior não ensejarão multa ou penalidades à contratada.`,
      privacyContent: `1. DECLARAÇÃO DE CONFORMIDADE COM A LGPD (LEI Nº 13.709/2018)
A SMD Drop reafirma seu compromisso inegociável com a segurança, privacidade e proteção dos dados pessoais de seus revendedores e dos clientes finais cujos dados são processados para fins de etiquetação e despacho.

2. DADOS COLETADOS E FINALIDADE DO PROCESSAMENTO
2.1. Coletamos dados do revendedor (Nome/Razão Social, CNPJ/CPF, Email, WhatsApp, Chave PIX) exclusivamente para gestão de cadastro, emissão de cobranças de atacado e suporte operacional.
2.2. Os dados de destinatários contidos nas etiquetas de envio anexadas pelo revendedor são utilizados ESTRITAMENTE para a impressão da etiqueta e colagem no pacote de despacho.
2.3. A SMD Drop NÃO comercializa, compartilha ou utiliza os dados dos clientes finais dos revendedores para fins de marketing ou prospecção própria em nenhuma hipótese.

3. ARMAZENAMENTO E SEGURANÇA DA INFORMAÇÃO
3.1. Todos os dados são armazenados em servidores seguros equipados com criptografia de ponta a ponta e controle de acesso restrito.
3.2. Os arquivos de etiquetas de envio em formato PDF são mantidos no sistema durante o período de garantia legal e descartados/arquivados com segurança após o cumprimento do despacho.

4. DIREITOS DO TITULAR DE DADOS
Nos termos do Artigo 18 da LGPD, o titular dos dados possui o direito de solicitar a confirmação do tratamento, acesso aos dados, correção de informações incompletas ou eliminação de dados pessoais desnecessários.

5. CONTATO DO ENCARREGADO DE DADOS (DPO)
Para exercer seus direitos de privacidade ou esclarecer dúvidas contratuais, entre em contato com nosso Encarregado de Proteção de Dados pelo email: privacidade@smddrop.com.br.`
    };
  });

  const recalculateMaterialPrices = () => {
    // No-op: cálculos matemáticos automáticos por m² foram desativados.
    // Todos os pedidos sob medida são orçados manualmente pela fábrica via Gestor Pro CNC.
  };

  const updateCompanySettings = (newSettings, shouldRecalculatePricing = true) => {
    setCompanySettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_company_settings', JSON.stringify(updated));
        broadcastSync('companySettings', updated);
      }

      const client = getSupabaseClient();
      if (client) {
        const payloadSocialLinks = {
          ...(updated.socialLinks || {}),
          subtitle: updated.subtitle || '',
          heroSettings: updated.heroSettings || {}
        };

        client.from('company_settings').upsert({
          id: 1,
          name: updated.name || '',
          cnpj: updated.cnpj || '',
          phone: updated.phone || '',
          email: updated.email || '',
          address: updated.address || '',
          my_sites: updated.mySites || [],
          social_links: payloadSocialLinks,
          legal_terms: updated.termsContent || '',
          legal_privacy: updated.privacyContent || '',
          items_per_row: itemsPerRow,
          items_per_page: itemsPerPage,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' }).then(({ error }) => {
          if (error) console.warn('[Supabase Company Settings Sync Error]:', error.message);
        });
      }

      return updated;
    });

    showNotification('Configurações da empresa salvas com sucesso!');
  };

  return (
    <StoreContext.Provider
      value={{
        theme,
        toggleTheme,
        viewMode,
        setViewMode,
        adminEmail,
        setAdminEmail,
        currentUser,
        users,
        updateUserStatus,
        deleteUser,
        updateProfile,
        loginAsAdmin,
        loginAsReseller,
        registerReseller,
        logout,
        categories,
        addCategory,
        editCategory,
        deleteCategory,
        autoTranslateAllCategories,
        normalizeCategoryName,
        materials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        setMaterials,
        recalculateMaterialPrices,
        fonts,
        addCustomFont,
        removeFont,
        restoreFonts,
        products,
        addProduct,
        importShopeeProducts,
        activateProduct,
        activateSelectedDrafts,
        moveProductToDraft,
        moveSelectedToDraft,
        deleteSelectedDrafts,
        pendingProducts,
        suggestProductByReseller,
        requestCustomQuote,
        approveProductByAdmin,
        rejectProductByAdmin,
        updateProduct,
        deleteProduct,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        orders,
        submitOrder,
        updateOrderStatus,
        advanceProductionStage,
        rollbackProductionStage,
        updateOrderFiscalData,
        deleteOrder,
        walletBalance,
        walletTransactions,
        addWalletFunds,
        deductWalletFunds,
        resetWalletToZero,
        notification,
        showNotification,
        isMagicImportOpen,
        magicImportInitialData,
        openMagicImport,
        closeMagicImport,
        itemsPerPage,
        setItemsPerPage,
        itemsPerRow,
        setItemsPerRow,
        companySettings,
        updateCompanySettings,
        setCompanySettings: updateCompanySettings,
        resetSystemForProduction,
        restoreFullBackup,
        syncAllToSupabase,
        getSupabaseCredentials,
        saveSupabaseCredentials,
        testSupabaseConnection
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
