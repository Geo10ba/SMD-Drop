export const sampleM2CalculatorProduct = {
  id: 'calc-sample',
  title: 'Orçamento sob Medida CNC',
  category: 'Logomarcas & Letreiros',
  pricingType: 'custom_m2',
  pricePerM2: 530,
  wholesalePrice: 530,
  suggestedPricePerM2: 800,
  suggestedRetailPrice: 800,
  materials: []
};

export const FACTORY_TAB_ALIASES = {
  produtos: 'products',
  products: 'products',
  pedidos: 'orders',
  orders: 'orders',
  rascunhos: 'drafts',
  drafts: 'drafts',
  solicitacoes: 'pending',
  pendentes: 'pending',
  pending: 'pending',
  usuarios: 'users',
  revendedores: 'users',
  users: 'users',
  configuracoes: 'settings',
  settings: 'settings',
  custos: 'custos',
  analytics: 'analytics',
  analise: 'analytics'
};

export const VALID_FACTORY_TABS = [
  'analytics',
  'products',
  'drafts',
  'orders',
  'users',
  'pending',
  'settings',
  'custos'
];

export function resolveFactoryTab(subpath) {
  if (!subpath) return 'analytics';
  const clean = subpath.toLowerCase().trim();
  const alias = FACTORY_TAB_ALIASES[clean];
  if (alias) return alias;
  if (VALID_FACTORY_TABS.includes(clean)) return clean;
  return 'analytics';
}

export function parseHashRoute(hashString) {
  const rawHash = (typeof hashString === 'string') 
    ? hashString 
    : (typeof window !== 'undefined' ? (window.location.hash || '') : '');
  const clean = rawHash.replace(/^#\/?/, '').trim();

  if (clean.startsWith('fabrica')) {
    const sub = clean.replace(/^fabrica\/?/, '').trim();
    if (sub === 'expedicao') {
      return {
        isFactory: true,
        factoryTab: 'analytics',
        isFulfillmentOpen: true,
        isNewProductOpen: false,
        isCartOpen: false,
        isCheckoutOpen: false,
        isResellerOrdersOpen: false,
        isFaqOpen: false,
        isTrackingOpen: false,
        isWalletOpen: false,
        isFinancialOpen: false,
        isAdminLoginOpen: false,
        isRegisterOpen: false,
        authMode: 'register',
        isM2Calc: false,
        currentPath: 'fabrica/expedicao'
      };
    }
    if (sub === 'novo-produto') {
      return {
        isFactory: true,
        factoryTab: 'analytics',
        isFulfillmentOpen: false,
        isNewProductOpen: true,
        isCartOpen: false,
        isCheckoutOpen: false,
        isResellerOrdersOpen: false,
        isFaqOpen: false,
        isTrackingOpen: false,
        isWalletOpen: false,
        isFinancialOpen: false,
        isAdminLoginOpen: false,
        isRegisterOpen: false,
        authMode: 'register',
        isM2Calc: false,
        currentPath: 'fabrica/novo-produto'
      };
    }

    const resolvedTab = resolveFactoryTab(sub);
    return {
      isFactory: true,
      factoryTab: resolvedTab,
      isFulfillmentOpen: false,
      isNewProductOpen: false,
      isCartOpen: false,
      isCheckoutOpen: false,
      isResellerOrdersOpen: false,
      isFaqOpen: false,
      isTrackingOpen: false,
      isWalletOpen: false,
      isFinancialOpen: false,
      isAdminLoginOpen: false,
      isRegisterOpen: false,
      authMode: 'register',
      isM2Calc: false,
      currentPath: `fabrica/${resolvedTab}`
    };
  }

  // Rotas do Revendedor
  return {
    isFactory: false,
    factoryTab: 'analytics',
    isFulfillmentOpen: false,
    isNewProductOpen: false,
    isCartOpen: clean === 'carrinho',
    isCheckoutOpen: clean === 'checkout',
    isResellerOrdersOpen: clean === 'pedidos',
    isFaqOpen: clean === 'ajuda',
    isTrackingOpen: clean === 'rastreio',
    isWalletOpen: clean === 'carteira',
    isFinancialOpen: clean === 'extrato',
    isAdminLoginOpen: clean === 'admin-login',
    isRegisterOpen: clean === 'cadastro' || clean === 'login',
    authMode: clean === 'login' ? 'login' : 'register',
    isM2Calc: clean === 'calculadora-m2',
    currentPath: clean || 'catalogo'
  };
}
