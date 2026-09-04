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

function MainApp() {
  const { 
    products,
    viewMode, 
    setViewMode,
    isMagicImportOpen, 
    magicImportInitialData, 
    closeMagicImport 
  } = useStore();

  const [m2CalculatorProduct, setM2CalculatorProduct] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [authMode, setAuthMode] = useState('register');
  const [legalModalType, setLegalModalType] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isResellerOrdersOpen, setIsResellerOrdersOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isFulfillmentOpen, setIsFulfillmentOpen] = useState(false);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);

  const [factoryTab, setFactoryTab] = useState('analytics');
  const [currentPath, setCurrentPath] = useState('catalogo');

  const handleOpenAuth = (mode = 'register') => {
    setAuthMode(mode);
    setIsRegisterOpen(true);
  };

  const handleNavigatePath = (path) => {
    if (path.startsWith('fabrica')) {
      setViewMode('factory');
      const sub = path.replace('fabrica/', '').replace('fabrica', '').trim();
      if (sub === 'expedicao') {
        setIsFulfillmentOpen(true);
      } else if (sub === 'novo-produto') {
        setIsNewProductOpen(true);
      } else {
        setIsFulfillmentOpen(false);
        setIsNewProductOpen(false);
        if (['analytics', 'products', 'drafts', 'orders', 'users', 'pending', 'settings'].includes(sub)) {
          setFactoryTab(sub);
        }
      }
    } else {
      setViewMode('reseller');
      setIsFulfillmentOpen(false);
      setIsNewProductOpen(false);
      setIsResellerOrdersOpen(path === 'pedidos');
      setIsCartOpen(path === 'carrinho');
      setIsCheckoutOpen(path === 'checkout');
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
      setIsAdminLoginOpen(path === 'admin-login');
      if (path === 'calculadora-m2') {
        setM2CalculatorProduct({
          id: 'calc-sample',
          title: 'Calculadora sob Medida R$/m²',
          category: 'Logomarcas & Letreiros',
          pricingType: 'custom_m2',
          pricePerM2: 530,
          wholesalePrice: 530,
          suggestedPricePerM2: 800,
          suggestedRetailPrice: 800,
          materials: []
        });
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
      else if (isFaqOpen) targetPath = 'ajuda';
      else if (isTrackingOpen) targetPath = 'rastreio';
      else if (isRegisterOpen) targetPath = authMode === 'login' ? 'login' : 'cadastro';
      else if (isAdminLoginOpen) targetPath = 'admin-login';
      else if (m2CalculatorProduct) targetPath = 'calculadora-m2';
      else targetPath = 'catalogo';
    }

    setCurrentPath(targetPath);
    if (window.location.hash !== `#${targetPath}`) {
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
      const hash = window.location.hash.replace('#', '').trim();
      if (!hash) return;

      if (hash.startsWith('fabrica')) {
        setViewMode('factory');
        const sub = hash.replace('fabrica/', '').replace('fabrica', '').trim();
        if (sub === 'expedicao') {
          setIsFulfillmentOpen(true);
        } else if (sub === 'novo-produto') {
          setIsNewProductOpen(true);
        } else if (['analytics', 'products', 'drafts', 'orders', 'users', 'pending', 'settings'].includes(sub)) {
          setIsFulfillmentOpen(false);
          setIsNewProductOpen(false);
          setFactoryTab(sub);
        }
      } else {
        setViewMode('reseller');
        setIsFulfillmentOpen(false);
        setIsNewProductOpen(false);
        setIsResellerOrdersOpen(hash === 'pedidos');
        setIsCartOpen(hash === 'carrinho');
        setIsCheckoutOpen(hash === 'checkout');
        setIsFaqOpen(hash === 'ajuda');
        setIsTrackingOpen(hash === 'rastreio');
        if (hash === 'cadastro') {
          setAuthMode('register');
          setIsRegisterOpen(true);
        } else if (hash === 'login') {
          setAuthMode('login');
          setIsRegisterOpen(true);
        } else {
          setIsRegisterOpen(false);
        }
        setIsAdminLoginOpen(hash === 'admin-login');
        if (hash === 'calculadora-m2') {
          setM2CalculatorProduct({
            id: 'calc-sample',
            title: 'Calculadora sob Medida R$/m²',
            category: 'Logomarcas & Letreiros',
            pricingType: 'custom_m2',
            pricePerM2: 530,
            wholesalePrice: 530,
            suggestedPricePerM2: 800,
            suggestedRetailPrice: 800,
            materials: []
          });
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
      />

      {/* Main Container */}
      <main className="max-w-[1650px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Dynamic Breadcrumb Navigation Bar */}
        <Breadcrumb
          currentPath={currentPath}
          onNavigate={handleNavigatePath}
        />

        {viewMode === 'reseller' ? (
          <ResellerCatalog 
            onOpenCart={() => setIsCartOpen(true)} 
            onOpenRegister={(mode) => handleOpenAuth(mode)}
          />
        ) : (
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
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      {m2CalculatorProduct && (
        <CustomSizeCalculator
          product={m2CalculatorProduct}
          onClose={() => setM2CalculatorProduct(null)}
        />
      )}

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
