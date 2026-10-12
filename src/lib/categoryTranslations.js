/**
 * Dicionário e Utilitários de Tradução Automática de Categorias
 * Traduz automaticamente categorias em inglês (AliExpress, Shopee, Etsy, UpSeller) para Português oficial brasileiro.
 */

export const CATEGORY_TRANSLATIONS = {
  // Categorias do print do usuário
  'Fengshui & Religious Supplies': 'Artigos Religiosos & Decoração Zen',
  'Statues & Sculptures': 'Estátuas & Esculturas',
  'T-Shirts': 'Camisetas & Vestuário',
  'Shirts': 'Camisas & Roupas',
  'Wallpapers & Wall Stickers': 'Papéis & Adesivos de Parede',
  'Cups, Mugs & Glasses': 'Copos & Canecas',
  'Hand Warmers, Hot Water Bags & Ice Bags': 'Bolsas Térmicas & Acessórios',
  'Keychains': 'Chaveiros & Brindes',
  'Lighting': 'Luminárias & Iluminação LED',
  'Industrial Adhesives & Tapes': 'Fitas & Adesivos Industriais',
  'Puzzles': 'Quebra-Cabeças & Jogos em Madeira',
  'Women Watches': 'Relógios Femininos',
  'Labels & Stickers': 'Etiquetas & Adesivos',
  'Phone Grips': 'Suportes para Celular',

  // Categorias comuns de decoração, corte a laser e e-commerce
  'Wall Decor': 'Decoração de Parede',
  'Wall Art': 'Quadros & Arte de Parede',
  'Home Decor': 'Decoração para Casa',
  'Home & Living': 'Casa & Decoração',
  'Clocks': 'Relógios de Parede',
  'Wall Clocks': 'Relógios de Parede',
  'Paintings': 'Quadros & Telas',
  'Plates': 'Placas & Sinalização',
  'Signs': 'Placas & Letreiros',
  'Signs & Plaques': 'Placas & Letreiros Decorativos',
  'Jewelry & Accessories': 'Joias & Acessórios',
  'Crafts & DIY': 'Artesanato & MDF',
  'Wood Crafts': 'Artesanato em Madeira & MDF',
  'Candles & Holders': 'Velas & Castiçais',
  'Party Supplies': 'Artigos para Festas & Lembrancinhas',
  'Office Supplies': 'Papelaria & Escritório',
  'Kitchen & Dining': 'Cozinha & Mesa Posta',
  'Storage & Organization': 'Organizadores & Caixas',
  'Car Accessories': 'Acessórios Automotivos',
  'Bags & Cases': 'Bolsas & Estojos',
  'Toys & Hobbies': 'Brinquedos & Hobbies',
  'Stationery': 'Papelaria & Escritório',
  'Others': 'Quadros & Decoração',
  'Other': 'Quadros & Decoração',
  'General': 'Geral'
};

/**
 * Traduz e normaliza uma categoria para português
 */
export function normalizeCategoryName(raw) {
  if (!raw || typeof raw !== 'string') return 'Geral';
  const trimmed = raw.trim();
  if (!trimmed) return 'Geral';

  // 1. Correspondência direta exata
  if (CATEGORY_TRANSLATIONS[trimmed]) {
    return CATEGORY_TRANSLATIONS[trimmed];
  }

  // 2. Correspondência sem diferenciar maiúsculas/minúsculas
  const lower = trimmed.toLowerCase();
  for (const [en, pt] of Object.entries(CATEGORY_TRANSLATIONS)) {
    if (en.toLowerCase() === lower) {
      return pt;
    }
  }

  // 3. Regras por palavras-chave em inglês
  if (lower.includes('fengshui') || lower.includes('religious')) return 'Artigos Religiosos & Decoração Zen';
  if (lower.includes('statue') || lower.includes('sculpture')) return 'Estátuas & Esculturas';
  if (lower.includes('clock') || lower.includes('watch')) return 'Relógios de Parede';
  if (lower.includes('wallpaper') || lower.includes('wall sticker')) return 'Papéis & Adesivos de Parede';
  if (lower.includes('wall decor') || lower.includes('wall art')) return 'Decoração de Parede';
  if (lower.includes('cup') || lower.includes('mug')) return 'Copos & Canecas';
  if (lower.includes('keychain')) return 'Chaveiros & Brindes';
  if (lower.includes('lighting') || lower.includes('lamp') || lower.includes('neon')) return 'Luminárias & Iluminação LED';
  if (lower.includes('puzzle')) return 'Quebra-Cabeças & Jogos em Madeira';
  if (lower.includes('plate') || lower.includes('sign')) return 'Placas & Sinalização';
  if (lower.includes('shirt') || lower.includes('apparel')) return 'Camisetas & Vestuário';
  if (lower.includes('sticker') || lower.includes('label')) return 'Etiquetas & Adesivos';
  if (lower.includes('phone grip') || lower.includes('phone holder')) return 'Suportes para Celular';
  if (lower.includes('acrylic') || lower.includes('acrilico')) return 'Logomarcas & Letreiros em Acrílico';

  return trimmed;
}

/**
 * Normaliza uma lista inteira de categorias, traduzindo e removendo duplicatas
 */
export function normalizeCategoryList(categories = []) {
  if (!Array.isArray(categories)) return [];
  const translated = categories.map(normalizeCategoryName).filter(Boolean);
  return Array.from(new Set(translated));
}
