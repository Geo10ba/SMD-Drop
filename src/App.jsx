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

function MainApp() {
  const { 
    products,
    viewMode, 
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

  const handleOpenAuth = (mode = 'register') => {
    setAuthMode(mode);
    setIsRegisterOpen(true);
  };

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
      <main className="max-w-[1650px] mx-auto px-3 sm:px-6 lg:px-8 py-8">
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
