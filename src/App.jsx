import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { ResellerCatalog } from './components/reseller/ResellerCatalog';
import { CartDrawer } from './components/reseller/CartDrawer';
import { CheckoutModal } from './components/reseller/CheckoutModal';
import { ResellerOrdersModal } from './components/reseller/ResellerOrdersModal';
import { FaqModal } from './components/reseller/FaqModal';
import { MagicImportModal } from './components/reseller/MagicImportModal';
import { TrackingModal } from './components/TrackingModal';
import { FactoryDashboard } from './components/factory/FactoryDashboard';
import { FulfillmentCenter } from './components/factory/FulfillmentCenter';
import { NewProductModal } from './components/factory/NewProductModal';
import { AdminLoginModal } from './components/factory/AdminLoginModal';
import { Footer } from './components/Footer';
import { CustomSizeCalculator } from './components/reseller/CustomSizeCalculator';
import { RegisterModal } from './components/reseller/RegisterModal';
import { LegalModal } from './components/LegalModal';
import { SmdAssistantChat } from './components/assistant/SmdAssistantChat';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { Breadcrumb } from './components/common/Breadcrumb';
import { ResellerWalletModal } from './components/reseller/ResellerWalletModal';
import { FinancialStatementModal } from './components/reseller/FinancialStatementModal';
import { 
  parseHashRoute, 
  resolveFactoryTab, 
  sampleM2CalculatorProduct 
} from './utils/routeNavigation';

function MainApp() {
  const { 
    products,
    viewMode, 
    setViewMode,
    currentUser,
    showNotification,
    isMagicImportOpen, 
    magicImportInitialData, 
    closeMagicImport 
  } = useStore();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'geovancalado@gmail.com';

  const initialRoute = React.useMemo(() => parseHashRoute(), []);

  const [m2CalculatorProduct, setM2CalculatorProduct] = useState(() => initialRoute.isM2Calc ? sampleM2CalculatorProduct : null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(() => initialRoute.isRegisterOpen);
  const [authMode, setAuthMode] = useState(() => initialRoute.authMode);
  const [legalModalType, setLegalModalType] = useState(() => initialRoute.legalModalType || null);
  const [isCartOpen, setIsCartOpen] = useState(() => initialRoute.isCartOpen);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(() => initialRoute.isCheckoutOpen);
  const [isResellerOrdersOpen, setIsResellerOrdersOpen] = useState(() => initialRoute.isResellerOrdersOpen);
  const [isFaqOpen, setIsFaqOpen] = useState(() => initialRoute.isFaqOpen);
  const [isTrackingOpen, setIsTrackingOpen] = useState(() => initialRoute.isTrackingOpen);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(() => initialRoute.isAdminLoginOpen);
  const [isFulfillmentOpen, setIsFulfillmentOpen] = useState(() => initialRoute.isFulfillmentOpen);
  const [isNewProductOpen, setIsNewProductOpen] = useState(() => initialRoute.isNewProductOpen);
  const [isWalletOpen, setIsWalletOpen] = useState(() => initialRoute.isWalletOpen);
  const [isFinancialOpen, setIsFinancialOpen] = useState(() => initialRoute.isFinancialOpen);

  const [factoryTab, setFactoryTab] = useState(() => initialRoute.factoryTab);
  const [currentPath, setCurrentPath] = useState(() => initialRoute.currentPath);

  // Proteção contra visualização fabril indevida
  useEffect(() => {
    if (viewMode === 'factory' && !isAdmin) {
      setViewMode('reseller');
      showNotification('Acesso Restrito: Painel fabril exclusivo para a administração da SMD Drop.', 'error');
    }
  }, [viewMode, isAdmin]);

  const handleOpenAuth = (mode = 'register') => {
    setAuthMode(mode);
    setIsRegisterOpen(true);
  };

  const handleNavigatePath = (path) => {
    if (path.startsWith('fabrica')) {
      if (!isAdmin) {
        showNotification('Acesso Restrito: Painel fabril exclusivo para a administração.', 'error');
        setIsAdminLoginOpen(true);
        setViewMode('reseller');
        window.location.hash = '#catalogo';
        return;
      }
      setViewMode('factory');
      const sub = path.replace(/^fabrica\/?/, '').trim();
      if (sub === 'expedicao') {
        setIsFulfillmentOpen(true);
      } else if (sub === 'novo-produto') {
        setIsNewProductOpen(true);
      } else {
        setIsFulfillmentOpen(false);
        setIsNewProductOpen(false);
        const resolved = resolveFactoryTab(sub);
        setFactoryTab(resolved);
      }
    } else {
      setViewMode('reseller');
      setIsFulfillmentOpen(false);
      setIsNewProductOpen(false);
      setIsResellerOrdersOpen(path === 'pedidos');
      setIsCartOpen(path === 'carrinho');
      setIsCheckoutOpen(path === 'checkout');
      setIsWalletOpen(path === 'carteira');
      setIsFinancialOpen(path === 'extrato');
      setIsFaqOpen(path === 'ajuda');
      setIsTrackingOpen(path === 'rastreio');
      if (path === 'cadastro') {
        setAuthMode('register');
        setIsRegisterOpen(true);
      } else if (path === 'login') {
        setAuthMode('login');
        setIsRegisterOpen(true);
      } else {
        setIsRegisterOpen(false);
      }
      if (path === 'termos' || path === 'termos-de-uso') {
        setLegalModalType('terms');
      } else if (path === 'privacidade' || path === 'lgpd') {
        setLegalModalType('privacy');
      } else {
        setLegalModalType(null);
      }
      setIsAdminLoginOpen(path === 'admin-login');
      if (path === 'calculadora-m2') {
        setM2CalculatorProduct(sampleM2CalculatorProduct);
      } else {
        setM2CalculatorProduct(null);
      }
    }
    window.location.hash = `#${path}`;
  };

  // Sync state changes to window.location.hash
  useEffect(() => {
    let targetPath = 'catalogo';
    if (viewMode === 'factory') {
      if (isFulfillmentOpen) targetPath = 'fabrica/expedicao';
      else if (isNewProductOpen) targetPath = 'fabrica/novo-produto';
      else targetPath = `fabrica/${factoryTab}`;
    } else {
      if (isResellerOrdersOpen) targetPath = 'pedidos';
      else if (isCartOpen) targetPath = 'carrinho';
      else if (isCheckoutOpen) targetPath = 'checkout';
      else if (isWalletOpen) targetPath = 'carteira';
      else if (isFinancialOpen) targetPath = 'extrato';
      else if (isFaqOpen) targetPath = 'ajuda';
      else if (isTrackingOpen) targetPath = 'rastreio';
      else if (isRegisterOpen) targetPath = authMode === 'login' ? 'login' : 'cadastro';
      else if (isAdminLoginOpen) targetPath = 'admin-login';
      else if (m2CalculatorProduct) targetPath = 'calculadora-m2';
      else targetPath = 'catalogo';
    }

    setCurrentPath(targetPath);
    const cleanCurrent = (window.location.hash || '').replace(/^#\/?/, '').trim();
    if (cleanCurrent !== targetPath) {
      window.history.replaceState(null, '', `#${targetPath}`);
    }
  }, [
    viewMode,
    factoryTab,
    isFulfillmentOpen,
    isNewProductOpen,
    isResellerOrdersOpen,
    isCartOpen,
    isCheckoutOpen,
    isWalletOpen,
    isFinancialOpen,
    isFaqOpen,
    isTrackingOpen,
    isRegisterOpen,
    authMode,
    isAdminLoginOpen,
    m2CalculatorProduct
  ]);

  // Initial Load & Hash Change Event Listener
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHashRoute();
      if (parsed.isFactory) {
        if (!isAdmin) {
          showNotification('Acesso Restrito: Painel fabril exclusivo para a administração.', 'error');
          setIsAdminLoginOpen(true);
          setViewMode('reseller');
          window.location.hash = '#catalogo';
          return;
        }
        setViewMode('factory');
        setIsFulfillmentOpen(parsed.isFulfillmentOpen);
        setIsNewProductOpen(parsed.isNewProductOpen);
        setFactoryTab(parsed.factoryTab);
      } else {
        setViewMode('reseller');
        setIsFulfillmentOpen(false);
        setIsNewProductOpen(false);
        setIsResellerOrdersOpen(parsed.isResellerOrdersOpen);
        setIsCartOpen(parsed.isCartOpen);
        setIsCheckoutOpen(parsed.isCheckoutOpen);
        setIsFaqOpen(parsed.isFaqOpen);
        setIsTrackingOpen(parsed.isTrackingOpen);
        setIsWalletOpen(parsed.isWalletOpen);
        setIsFinancialOpen(parsed.isFinancialOpen);
        setIsAdminLoginOpen(parsed.isAdminLoginOpen);
        setIsRegisterOpen(parsed.isRegisterOpen);
        setAuthMode(parsed.authMode);
        if (parsed.isM2Calc) {
          setM2CalculatorProduct(sampleM2CalculatorProduct);
        } else {
          setM2CalculatorProduct(null);
        }
      }
      setCurrentPath(parsed.currentPath);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAdmin]);

  useEffect(() => {
    document.title = "SMD Drop | Plataforma Fabril de Dropshipping & Marketplaces";
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = '/favicon.png?v=' + Date.now();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-200">
      {/* Global Navigation Bar */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCalculator={() => setM2CalculatorProduct({
          id: 'calc-sample',
          title: 'Calculadora de Placas e Letreiros sob Medida',
          category: 'Logomarcas & Letreiros',
          pricingType: 'custom_m2',
          pricePerM2: 530,
          wholesalePrice: 530,
          suggestedPricePerM2: 800,
          suggestedRetailPrice: 800,
          materials: []
        })}
        onOpenResellerOrders={() => setIsResellerOrdersOpen(true)}
        onOpenNewProductModal={() => setIsNewProductOpen(true)}
        onOpenFaq={() => setIsFaqOpen(true)}
        onOpenRegister={(mode) => handleOpenAuth(mode)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenFinancialStatement={() => setIsFinancialOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-[1650px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Dynamic Breadcrumb Navigation Bar */}
        <Breadcrumb
          currentPath={currentPath}
          onNavigate={handleNavigatePath}
        />

        {viewMode === 'factory' && isAdmin ? (
          <>
            {isFulfillmentOpen ? (
              <div className="space-y-4">
                <button
                  onClick={() => setIsFulfillmentOpen(false)}
                  className="btn-secondary text-xs font-bold py-2 px-3"
                >
                  ← Voltar ao Dashboard da Fábrica
                </button>
                <FulfillmentCenter onClose={() => setIsFulfillmentOpen(false)} />
              </div>
            ) : (
              <FactoryDashboard
                activeTab={factoryTab}
                onTabChange={(tab) => setFactoryTab(tab)}
                onOpenFulfillment={() => setIsFulfillmentOpen(true)}
                onOpenNewProduct={() => setIsNewProductOpen(true)}
              />
            )}
          </>
        ) : (
          <ResellerCatalog 
            onOpenCart={() => setIsCartOpen(true)} 
            onOpenRegister={(mode) => handleOpenAuth(mode)}
          />
        )}
      </main>

      {/* Dynamic Footer with Legal Shielding & Social Links */}
      <Footer
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenFaq={() => setIsFaqOpen(true)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
      />

      {/* Drawers & Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOpenWallet={() => setIsWalletOpen(true)}
      />

      <ResellerOrdersModal
        isOpen={isResellerOrdersOpen}
        onClose={() => setIsResellerOrdersOpen(false)}
      />

      <FaqModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
      />

      <TrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
      />

      <NewProductModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onOpenRegister={() => handleOpenAuth('register')}
      />

      <MagicImportModal
        isOpen={isMagicImportOpen}
        initialData={magicImportInitialData}
        onClose={closeMagicImport}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        initialMode={authMode}
        onClose={() => setIsRegisterOpen(false)}
        onOpenLegalModal={(type) => setLegalModalType(type)}
      />

      <LegalModal
        isOpen={Boolean(legalModalType)}
        mode={legalModalType || 'terms'}
        onClose={() => {
          setLegalModalType(null);
          if (window.location.hash === '#termos' || window.location.hash === '#privacidade' || window.location.hash === '#termos-de-uso' || window.location.hash === '#lgpd') {
            window.location.hash = '#catalogo';
          }
        }}
      />

      {m2CalculatorProduct && (
        <CustomSizeCalculator
          product={m2CalculatorProduct}
          onClose={() => setM2CalculatorProduct(null)}
        />
      )}

      {/* Reseller Prepaid Wallet Modal */}
      <ResellerWalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />

      {/* Financial Statement & Net Profit Modal */}
      <FinancialStatementModal
        isOpen={isFinancialOpen}
        onClose={() => setIsFinancialOpen(false)}
      />

      {/* PWA Mobile & Desktop Install Prompt */}
      <PwaInstallPrompt />

      {/* Floating Virtual Assistant */}
      <SmdAssistantChat />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
