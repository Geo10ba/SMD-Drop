import { describe, it, expect } from 'vitest';
import { parseHashRoute, resolveFactoryTab, FACTORY_TAB_ALIASES } from '../routeNavigation';

describe('Route & Tab Persistence Navigation', () => {
  describe('resolveFactoryTab', () => {
    it('resolves standard factory tabs', () => {
      expect(resolveFactoryTab('products')).toBe('products');
      expect(resolveFactoryTab('drafts')).toBe('drafts');
      expect(resolveFactoryTab('orders')).toBe('orders');
      expect(resolveFactoryTab('analytics')).toBe('analytics');
      expect(resolveFactoryTab('custos')).toBe('custos');
      expect(resolveFactoryTab('settings')).toBe('settings');
      expect(resolveFactoryTab('pending')).toBe('pending');
      expect(resolveFactoryTab('users')).toBe('users');
    });

    it('resolves Portuguese tab aliases correctly', () => {
      expect(resolveFactoryTab('produtos')).toBe('products');
      expect(resolveFactoryTab('pedidos')).toBe('orders');
      expect(resolveFactoryTab('rascunhos')).toBe('drafts');
      expect(resolveFactoryTab('solicitacoes')).toBe('pending');
      expect(resolveFactoryTab('pendentes')).toBe('pending');
      expect(resolveFactoryTab('revendedores')).toBe('users');
      expect(resolveFactoryTab('usuarios')).toBe('users');
      expect(resolveFactoryTab('configuracoes')).toBe('settings');
      expect(resolveFactoryTab('analise')).toBe('analytics');
    });

    it('defaults unknown subpaths to analytics', () => {
      expect(resolveFactoryTab('')).toBe('analytics');
      expect(resolveFactoryTab('unknown_section')).toBe('analytics');
    });
  });

  describe('parseHashRoute', () => {
    it('correctly parses #fabrica/products on page reload', () => {
      const route = parseHashRoute('#fabrica/products');
      expect(route.isFactory).toBe(true);
      expect(route.factoryTab).toBe('products');
      expect(route.isFulfillmentOpen).toBe(false);
      expect(route.isNewProductOpen).toBe(false);
      expect(route.currentPath).toBe('fabrica/products');
    });

    it('correctly parses #fabrica/drafts', () => {
      const route = parseHashRoute('#fabrica/drafts');
      expect(route.isFactory).toBe(true);
      expect(route.factoryTab).toBe('drafts');
      expect(route.currentPath).toBe('fabrica/drafts');
    });

    it('correctly parses #fabrica/expedicao', () => {
      const route = parseHashRoute('#fabrica/expedicao');
      expect(route.isFactory).toBe(true);
      expect(route.isFulfillmentOpen).toBe(true);
      expect(route.currentPath).toBe('fabrica/expedicao');
    });

    it('correctly parses #fabrica/novo-produto', () => {
      const route = parseHashRoute('#fabrica/novo-produto');
      expect(route.isFactory).toBe(true);
      expect(route.isNewProductOpen).toBe(true);
      expect(route.currentPath).toBe('fabrica/novo-produto');
    });

    it('correctly parses Portuguese alias #fabrica/produtos', () => {
      const route = parseHashRoute('#fabrica/produtos');
      expect(route.isFactory).toBe(true);
      expect(route.factoryTab).toBe('products');
      expect(route.currentPath).toBe('fabrica/products');
    });

    it('correctly parses reseller modals: carrinho, checkout, pedidos, carteira, extrato', () => {
      expect(parseHashRoute('#carrinho').isCartOpen).toBe(true);
      expect(parseHashRoute('#checkout').isCheckoutOpen).toBe(true);
      expect(parseHashRoute('#pedidos').isResellerOrdersOpen).toBe(true);
      expect(parseHashRoute('#carteira').isWalletOpen).toBe(true);
      expect(parseHashRoute('#extrato').isFinancialOpen).toBe(true);
      expect(parseHashRoute('#ajuda').isFaqOpen).toBe(true);
      expect(parseHashRoute('#rastreio').isTrackingOpen).toBe(true);
      expect(parseHashRoute('#calculadora-m2').isM2Calc).toBe(true);
    });

    it('correctly parses login and registration routes', () => {
      const loginRoute = parseHashRoute('#login');
      expect(loginRoute.isRegisterOpen).toBe(true);
      expect(loginRoute.authMode).toBe('login');

      const registerRoute = parseHashRoute('#cadastro');
      expect(registerRoute.isRegisterOpen).toBe(true);
      expect(registerRoute.authMode).toBe('register');
    });

    it('defaults empty or #catalogo to wholesale catalog', () => {
      const emptyRoute = parseHashRoute('');
      expect(emptyRoute.isFactory).toBe(false);
      expect(emptyRoute.currentPath).toBe('catalogo');

      const catalogRoute = parseHashRoute('#catalogo');
      expect(catalogRoute.isFactory).toBe(false);
      expect(catalogRoute.currentPath).toBe('catalogo');
    });
  });
});
