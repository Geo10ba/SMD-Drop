import React from 'react';
import { useStore } from '../context/StoreContext';
import { 
  Factory, 
  Store, 
  Sun, 
  Moon, 
  ShoppingBag, 
  PackageCheck, 
  Sparkles, 
  Download,
  PlusCircle,
  Truck,
  HelpCircle,
  Lock,
  LogOut,
  Ruler,
  UserPlus
} from 'lucide-react';

export const Navbar = ({ onOpenCart, onOpenNewProductModal, onOpenResellerOrders, onOpenTracking, onOpenFaq, onOpenAdminLogin, onOpenCalculator, onOpenRegister }) => {
  const { theme, toggleTheme, viewMode, setViewMode, currentUser, logout, cart, orders, notification } = useStore();

  const pendingOrdersCount = orders.filter((o) => o.status === 'aguardando_impressao').length;

  const handleFactoryTabClick = () => {
    if (currentUser.role === 'admin') {
      setViewMode('factory');
    } else {
      onOpenAdminLogin();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-glass)] backdrop-blur-md border-b border-[var(--border-color)] transition-colors duration-200">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white text-xs py-1.5 px-4 flex items-center justify-between font-medium">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="bg-[#C59B27] text-black text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
            FÁBRICA PRÓPRIA
          </span>
          <span>Despacho em 24h para Mercado Livre, Shopee & Envio Direto com Etiqueta Cega!</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-300">
          <button
            onClick={onOpenTracking}
            className="flex items-center gap-1 hover:text-amber-400 font-semibold transition-colors"
          >
            <Truck size={13} className="text-[#C59B27]" /> Rastrear Pedido
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-12 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="SMD Drop Logo" className="h-11 w-auto max-h-12 object-contain rounded-lg shadow-sm" />
          </div>
          <div className="shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-[var(--text-main)] font-['Outfit'] whitespace-nowrap">
                SMD <span className="text-[#C59B27] font-light">DROP</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[var(--accent-gold-light)] text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 whitespace-nowrap hidden sm:inline-block">
                FABRICAÇÃO PRÓPRIA
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-medium hidden lg:block whitespace-nowrap">
              Plataforma Fabril de Dropshipping & Marketplaces
            </p>
          </div>
        </div>

        {/* Center View Mode Switcher */}
        <div className="hidden md:flex items-center bg-[var(--bg-surface-hover)] p-1 rounded-xl border border-[var(--border-color)] shrink-0">
          <button
            onClick={() => setViewMode('reseller')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              viewMode === 'reseller'
                ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm border border-[var(--border-color)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Store size={16} className={viewMode === 'reseller' ? 'text-[#C59B27]' : ''} />
            Portal do Revendedor
          </button>
          
          <button
            onClick={handleFactoryTabClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              viewMode === 'factory'
                ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm border border-[var(--border-color)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Factory size={16} className={viewMode === 'factory' ? 'text-[#C59B27]' : ''} />
            Painel da Fábrica
            {currentUser?.role !== 'admin' && <Lock size={12} className="text-amber-500 shrink-0" />}
            {pendingOrdersCount > 0 && currentUser?.role === 'admin' && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile Switcher */}
          <div className="md:hidden flex items-center bg-[var(--bg-surface-hover)] p-1 rounded-lg border border-[var(--border-color)]">
            <button
              onClick={() => setViewMode(viewMode === 'reseller' ? 'factory' : 'reseller')}
              className="text-xs font-semibold px-2.5 py-1 rounded bg-[var(--bg-surface)] text-[var(--text-main)] flex items-center gap-1"
            >
              {viewMode === 'reseller' ? (
                <>
                  <Factory size={14} className="text-[#C59B27]" /> Fábrica
                </>
              ) : (
                <>
                  <Store size={14} className="text-[#C59B27]" /> Revendedor
                </>
              )}
            </button>
          </div>

          {/* Reseller Orders & Navigation Buttons */}
          {viewMode === 'reseller' && (
            <>
              <button
                onClick={onOpenCalculator}
                className="btn-secondary text-xs sm:text-sm py-2 px-3"
                title="Calculadora sob Medida R$/m²"
              >
                <Ruler size={16} className="text-amber-500" />
                <span className="hidden md:inline">Calculadora m²</span>
              </button>

              <button
                onClick={onOpenFaq}
                className="btn-secondary text-xs sm:text-sm py-2 px-3"
                title="Central de Ajuda & FAQ"
              >
                <HelpCircle size={16} className="text-amber-500" />
                <span className="hidden md:inline">Ajuda</span>
              </button>

              {currentUser ? (
                <>
                  <button
                    onClick={onOpenResellerOrders}
                    className="btn-secondary text-xs sm:text-sm py-2 px-3 sm:px-4"
                    title="Ver Meus Pedidos de Revenda"
                  >
                    <PackageCheck size={16} className="text-amber-500" />
                    <span className="hidden sm:inline">Meus Pedidos</span>
                  </button>

                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    <button
                      onClick={logout}
                      className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1"
                      title="Sair da Conta"
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={onOpenRegister}
                    className="btn-gold text-xs sm:text-sm py-2 px-3 sm:px-4 flex items-center gap-1.5 shadow-md font-bold"
                    title="Criar Conta Grátis de Revendedor"
                  >
                    <UserPlus size={16} />
                    <span>Criar Conta</span>
                  </button>

                  <button
                    onClick={onOpenRegister}
                    className="btn-secondary text-xs sm:text-sm py-2 px-3 text-amber-600 dark:text-amber-400 font-bold"
                    title="Acessar Conta de Revendedor"
                  >
                    Entrar
                  </button>
                </>
              )}
            </>
          )}

          {/* New Product Action for Factory Mode */}
          {viewMode === 'factory' && (
            <button
              onClick={onOpenNewProductModal}
              className="btn-gold text-xs sm:text-sm py-2 px-3 sm:px-4"
            >
              <PlusCircle size={16} />
              <span className="hidden sm:inline">Novo Produto Fabricado</span>
            </button>
          )}

          {/* Reseller Order Cart Drawer Toggle */}
          {viewMode === 'reseller' && (
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)] transition-all shadow-sm"
              title="Ver Carrinho de Dropshipping"
            >
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C59B27] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {cart.length}
                </span>
              )}
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)] transition-all shadow-sm"
            title={`Mudar para modo ${theme === 'light' ? 'Escuro' : 'Claro'}`}
          >
            {theme === 'light' ? <Moon size={20} className="text-slate-700" /> : <Sun size={20} className="text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {notification && (
        <div className="absolute top-20 right-4 z-50 animate-fade-in bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl border border-amber-500/40 flex items-center gap-3">
          <Sparkles className="text-amber-400 dark:text-amber-600 shrink-0" size={18} />
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}
    </header>
  );
};
