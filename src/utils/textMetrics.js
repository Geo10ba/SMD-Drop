import opentype from 'opentype.js';

export const BUILTIN_FONTS = [
  { 
    id: 'ArialBold', 
    name: 'Moderna / Caixa (Arial Bold)', 
    file: 'ArialBold.ttf', 
    category: 'Corporativa',
    description: 'Ideal para letreiros corporativos, escritórios e logomarcas modernas.',
    isBuiltin: true
  },
  { 
    id: 'GeorgiaBold', 
    name: 'Serifada Nobre (Georgia Bold)', 
    file: 'GeorgiaBold.ttf', 
    category: 'Clássica / Advocacia',
    description: 'Excelente para consultórios médicos, clínicas e bancas de advocacia.',
    isBuiltin: true
  },
  { 
    id: 'DancingScript', 
    name: 'Dancing Script (Cursiva Moderna)', 
    file: 'DancingScript-Regular.ttf', 
    category: 'Estética / Beleza',
    description: 'A queridinha de estúdios de beleza, maquiagem e spas.',
    isBuiltin: true
  },
  { 
    id: 'Pacifico', 
    name: 'Pacifico (Maternidade & Festas)', 
    file: 'Pacifico-Regular.ttf', 
    category: 'Infantil / Maternidade',
    description: 'Perfeita para nomes em quartos de bebê, maternidade e festas infantis.',
    isBuiltin: true
  },
  { 
    id: 'Satisfy', 
    name: 'Satisfy (Elegante & Fluida)', 
    file: 'Satisfy-Regular.ttf', 
    category: 'Luxo / Gastronomia',
    description: 'Sofisticação fluida para confeitarias finas, eventos e boutiques.',
    isBuiltin: true
  },
  { 
    id: 'Playball', 
    name: 'Playball (Forte & Esportiva)', 
    file: 'Playball-Regular.ttf', 
    category: 'Barbearias / Esportes',
    description: 'Visual marcante e robusto, muito usado em barbearias e boxes esportivos.',
    isBuiltin: true
  },
  { 
    id: 'Rochester', 
    name: 'Rochester (Caligráfica Vintage)', 
    file: 'Rochester-Regular.ttf', 
    category: 'Joalherias / Vintage',
    description: 'Traços caligráficos finos com acabamento premium.',
    isBuiltin: true
  },
  { 
    id: 'Sunshine', 
    name: 'Sunshine (Infantil Fofa)', 
    file: 'Sunshine.ttf', 
    category: 'Infantil / Lúdica',
    description: 'Traço arredondado e acolhedor para decoração infantil.',
    isBuiltin: true
  },
  { 
    id: 'Tangerine', 
    name: 'Tangerine (Fina & Alta)', 
    file: 'Tangerine-Regular.ttf', 
    category: 'Minimalista / Delicada',
    description: 'Caligrafia de traço fino e elegante para painéis com fundo de apoio.',
    isBuiltin: true
  }
];

const fontCache = new Map();

// ─── INDEXEDDB BINARY STORAGE PARA FONTES CUSTOMIZADAS (.TTF / .OTF) ─────────
const DB_NAME = "smd_fonts_storage";
const DB_VERSION = 1;
const FONT_STORE = "fonts_binary";

function openDb() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FONT_STORE)) {
        db.createObjectStore(FONT_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn("[textMetrics] Falha ao abrir IndexedDB:", request.error);
      resolve(null);
    };
  });
}

async function saveFontBinary(id, buffer) {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(FONT_STORE, "readwrite");
      const store = tx.objectStore(FONT_STORE);
      const req = store.put({ id, buffer });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function getFontBinary(id) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(FONT_STORE, "readonly");
      const store = tx.objectStore(FONT_STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result?.buffer || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function deleteFontBinary(id) {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(FONT_STORE, "readwrite");
      const store = tx.objectStore(FONT_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

// ─── METADADOS DAS FONTES (LOCALSTORAGE) ────────────────────────────────────
const FONT_META_KEY = "smd_fonts_metadata";
const HIDDEN_BUILTIN_KEY = "smd_hidden_builtin_fonts";

export function getCustomFontsMeta() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FONT_META_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomFontsMeta(metaList) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FONT_META_KEY, JSON.stringify(metaList));
  } catch (err) {
    console.warn("[textMetrics] Erro ao salvar meta de fontes:", err);
  }
}

export function getHiddenBuiltinIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HIDDEN_BUILTIN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHiddenBuiltinIds(ids) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HIDDEN_BUILTIN_KEY, JSON.stringify(ids));
  } catch (err) {
    console.warn("[textMetrics] Erro ao salvar hidden fonts:", err);
  }
}

/**
 * Returns all active fonts (both builtin and custom added via Admin)
 */
export function getAllActiveFonts() {
  const hiddenBuiltins = new Set(getHiddenBuiltinIds());
  const activeBuiltins = BUILTIN_FONTS.filter(f => !hiddenBuiltins.has(f.id));
  const customFonts = getCustomFontsMeta();
  return [...activeBuiltins, ...customFonts];
}

/**
 * Adds a new custom font from an uploaded TTF/OTF File
 */
export async function registerCustomFont({ file, name, category, description }) {
  if (!file) throw new Error("Nenhum arquivo de fonte fornecido.");

  const buffer = await file.arrayBuffer();
  let parsedFont = null;
  try {
    parsedFont = opentype.parse(buffer);
  } catch (err) {
    throw new Error(`O arquivo "${file.name}" não é uma fonte TTF ou OTF válida.`);
  }

  const detectedFamily = parsedFont.names?.fontFamily?.en || parsedFont.names?.fontFamily?.pt || file.name.replace(/\.(ttf|otf)$/i, "");
  const fontId = `custom-font-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const fontName = (name || detectedFamily).trim();

  // Save binary in IndexedDB
  await saveFontBinary(fontId, buffer);

  // Cache parsed font instance in memory
  fontCache.set(fontId, parsedFont);

  // Save metadata
  const newMeta = {
    id: fontId,
    name: fontName,
    fileName: file.name,
    category: category || "Personalizada",
    description: description || `Fonte personalizada importada (${file.name}).`,
    isBuiltin: false,
    createdAt: new Date().toISOString()
  };

  const currentCustoms = getCustomFontsMeta();
  const updated = [newMeta, ...currentCustoms];
  saveCustomFontsMeta(updated);

  return newMeta;
}

/**
 * Removes a font (either a custom uploaded font or hides a builtin font)
 */
export async function removeFontById(fontId) {
  // If it's a builtin font, add to hidden list
  const isBuiltin = BUILTIN_FONTS.some(f => f.id === fontId);
  if (isBuiltin) {
    const hidden = getHiddenBuiltinIds();
    if (!hidden.includes(fontId)) {
      saveHiddenBuiltinIds([...hidden, fontId]);
    }
    fontCache.delete(fontId);
    return true;
  }

  // If it's custom, remove from IndexedDB and metadata
  await deleteFontBinary(fontId);
  fontCache.delete(fontId);

  const currentCustoms = getCustomFontsMeta();
  const updated = currentCustoms.filter(f => f.id !== fontId);
  saveCustomFontsMeta(updated);

  return true;
}

/**
 * Restores all default builtin fonts
 */
export function restoreDefaultFonts() {
  saveHiddenBuiltinIds([]);
  return getAllActiveFonts();
}

/**
 * Loads and parses a font using opentype.js with multi-tier caching
 */
export async function loadFontById(fontId) {
  if (fontCache.has(fontId)) {
    return fontCache.get(fontId);
  }

  // 1. Check if it's a custom font in IndexedDB
  const customBuffer = await getFontBinary(fontId);
  if (customBuffer) {
    try {
      const parsed = opentype.parse(customBuffer);
      fontCache.set(fontId, parsed);
      return parsed;
    } catch (err) {
      console.warn(`[textMetrics] Erro ao processar fonte customizada ${fontId}:`, err);
    }
  }

  // 2. Check if it's a builtin font in public/fonts/
  const fontEntry = BUILTIN_FONTS.find(f => f.id === fontId) || BUILTIN_FONTS[0];
  try {
    const response = await fetch(`/fonts/${fontEntry.file}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ao carregar fonte ${fontEntry.file}`);
    }
    const buffer = await response.arrayBuffer();
    const parsedFont = opentype.parse(buffer);
    fontCache.set(fontId, parsedFont);
    return parsedFont;
  } catch (err) {
    console.warn(`[textMetrics] Falha ao carregar fonte ${fontId}:`, err);
    return null;
  }
}

/**
 * Calculates exact typography dimensions and SVG path for a given text & font
 */
export async function calculateTextDimensions(text, fontId, options = {}) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return {
      success: false,
      aspectRatio: 0.35,
      widthMm: 500,
      heightMm: 175,
      svgPath: '',
      viewBox: '0 0 500 175'
    };
  }

  const font = await loadFontById(fontId);
  if (!font) {
    const charCount = trimmed.length;
    const estimatedAspectRatio = Math.max(0.15, Math.min(0.6, 2.2 / (charCount * 0.7 + 1)));
    const w = options.desiredWidthMm || 500;
    const h = options.desiredHeightMm || Math.round(w * estimatedAspectRatio);
    return {
      success: false,
      aspectRatio: estimatedAspectRatio,
      widthMm: w,
      heightMm: h,
      svgPath: '',
      viewBox: `0 0 ${w} ${h}`
    };
  }

  try {
    const fontSize = 100;
    const path = font.getPath(trimmed, 0, fontSize, fontSize);
    
    // Sanitização de ruído de ponto flutuante que gera NaN no opentype.js toPathData
    const cleanCoord = (num) => (typeof num === 'number' && !isNaN(num) ? Number(num.toFixed(4)) : 0);
    for (const cmd of path.commands) {
      if ('x' in cmd && typeof cmd.x === 'number') cmd.x = cleanCoord(cmd.x);
      if ('y' in cmd && typeof cmd.y === 'number') cmd.y = cleanCoord(cmd.y);
      if ('x1' in cmd && typeof cmd.x1 === 'number') cmd.x1 = cleanCoord(cmd.x1);
      if ('x2' in cmd && typeof cmd.x2 === 'number') cmd.x2 = cleanCoord(cmd.x2);
      if ('y1' in cmd && typeof cmd.y1 === 'number') cmd.y1 = cleanCoord(cmd.y1);
      if ('y2' in cmd && typeof cmd.y2 === 'number') cmd.y2 = cleanCoord(cmd.y2);
    }

    const box = path.getBoundingBox();

    const rawWidth = Math.max(1, box.x2 - box.x1);
    const rawHeight = Math.max(1, box.y2 - box.y1);
    const aspectRatio = rawHeight / rawWidth; // Altura / Largura

    let calculatedWidth = options.desiredWidthMm || 500;
    let calculatedHeight = Math.round(calculatedWidth * aspectRatio);

    if (options.desiredHeightMm && !options.desiredWidthMm) {
      calculatedHeight = options.desiredHeightMm;
      calculatedWidth = Math.round(calculatedHeight / aspectRatio);
    }

    let svgPath = path.toPathData(2);
    if (svgPath.includes('NaN')) {
      svgPath = svgPath.replace(/NaN/g, '0');
    }

    const paddingX = Math.max(10, rawWidth * 0.05);
    const paddingY = Math.max(10, rawHeight * 0.08);
    const viewBox = `${box.x1 - paddingX} ${box.y1 - paddingY} ${rawWidth + paddingX * 2} ${rawHeight + paddingY * 2}`;

    return {
      success: true,
      fontName: font.names?.fontFamily?.en || fontId,
      aspectRatio,
      rawWidth,
      rawHeight,
      widthMm: calculatedWidth,
      heightMm: Math.max(20, calculatedHeight),
      svgPath,
      viewBox
    };
  } catch (err) {
    console.warn('[textMetrics] Erro ao medir glifos do texto:', err);
    return {
      success: false,
      aspectRatio: 0.35,
      widthMm: options.desiredWidthMm || 500,
      heightMm: options.desiredHeightMm || 175,
      svgPath: '',
      viewBox: '0 0 500 175'
    };
  }
}
