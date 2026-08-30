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
      <div className="w-full max-w-[1650px] mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4 overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="h-10 sm:h-12 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="SMD Drop Logo" className="h-9 sm:h-11 w-auto object-contain rounded-lg shadow-sm" />
          </div>
          <div className="shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[var(--text-main)] font-['Outfit'] whitespace-nowrap">
                SMD <span className="text-[#C59B27] font-light">DROP</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[var(--accent-gold-light)] text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 whitespace-nowrap hidden md:inline-block">
                FABRICAÇÃO PRÓPRIA
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-medium hidden 2xl:block whitespace-nowrap">
              Plataforma Fabril de Dropshipping & Marketplaces
            </p>
          </div>
        </div>

        {/* Center View Mode Switcher (Visible ONLY to Factory Admin on Large Screens) */}
        {(currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'geovancalado@gmail.com') && (
          <div className="hidden xl:flex items-center bg-[var(--bg-surface-hover)] p-1 rounded-xl border border-[var(--border-color)] shrink-0">
            <button
              onClick={() => setViewMode('reseller')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'reseller'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm border border-[var(--border-color)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Store size={15} className={viewMode === 'reseller' ? 'text-[#C59B27]' : ''} />
              Portal Revendedor
            </button>
            
            <button
              onClick={() => setViewMode('factory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'factory'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm border border-[var(--border-color)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Factory size={15} className={viewMode === 'factory' ? 'text-[#C59B27]' : ''} />
              Painel Fábrica
              {pendingOrdersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Right Actions Container */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Admin Switcher for Smaller Screens */}
          {(currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'geovancalado@gmail.com') && (
            <div className="xl:hidden flex items-center bg-[var(--bg-surface-hover)] p-1 rounded-lg border border-[var(--border-color)] shrink-0">
              <button
                onClick={() => setViewMode(viewMode === 'reseller' ? 'factory' : 'reseller')}
                className="text-xs font-semibold px-2 py-1 rounded bg-[var(--bg-surface)] text-[var(--text-main)] flex items-center gap-1"
              >
                {viewMode === 'reseller' ? (
                  <>
                    <Factory size={14} className="text-[#C59B27]" /> <span className="hidden sm:inline">Fábrica</span>
                  </>
                ) : (
                  <>
                    <Store size={14} className="text-[#C59B27]" /> <span className="hidden sm:inline">Revendedor</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Reseller Orders & Navigation Buttons */}
          {viewMode === 'reseller' && (
            <>
              <button
                onClick={onOpenFaq}
                className="btn-secondary text-xs py-1.5 px-2 flex items-center gap-1 shrink-0"
                title="Central de Ajuda & FAQ"
              >
                <HelpCircle size={15} className="text-amber-500 shrink-0" />
                <span className="hidden 2xl:inline">Ajuda</span>
              </button>

              {currentUser ? (
                <>
                  <button
                    onClick={onOpenCalculator}
                    className="btn-secondary text-xs py-1.5 px-2 flex items-center gap-1 shrink-0"
                    title="Calculadora sob Medida R$/m²"
                  >
                    <Ruler size={15} className="text-amber-500 shrink-0" />
                    <span className="hidden 2xl:inline">Calculadora m²</span>
                  </button>

                  <button
                    onClick={onOpenResellerOrders}
                    className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 shrink-0"
                    title="Ver Meus Pedidos de Revenda"
                  >
                    <PackageCheck size={15} className="text-amber-500 shrink-0" />
                    <span className="hidden lg:inline">Pedidos</span>
                  </button>

                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-xl shrink-0">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 truncate max-w-[70px] sm:max-w-[100px]">
                      {currentUser.name?.split(' ')[0]}
                    </span>
                    <button
                      onClick={logout}
                      className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-0.5"
                      title="Sair da Conta"
                    >
                      <LogOut size={13} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onOpenRegister('register')}
                    className="btn-gold text-xs py-1.5 px-2.5 flex items-center gap-1 shadow-md font-bold shrink-0"
                    title="Criar Conta Grátis de Revendedor"
                  >
                    <UserPlus size={15} />
                    <span>Criar Conta</span>
                  </button>

                  <button
                    onClick={() => onOpenRegister('login')}
                    className="btn-secondary text-xs py-1.5 px-2.5 text-amber-600 dark:text-amber-400 font-bold shrink-0"
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
              className="btn-gold text-xs py-1.5 px-3"
            >
              <PlusCircle size={15} />
              <span className="hidden sm:inline">Novo Produto</span>
            </button>
          )}

          {/* Reseller Order Cart Drawer Toggle */}
          {viewMode === 'reseller' && (
            <button
              onClick={onOpenCart}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs py-1.5 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 shadow-md transition-all shrink-0"
              title="Ver Carrinho de Pedidos"
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">Carrinho</span>
              <span className="bg-slate-900 text-amber-400 font-black text-[11px] px-1.5 py-0.2 rounded-full shadow-inner">
                {cart.length}
              </span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)] transition-all shadow-sm shrink-0"
            title={`Mudar para modo ${theme === 'light' ? 'Escuro' : 'Claro'}`}
          >
            {theme === 'light' ? <Moon size={18} className="text-slate-700" /> : <Sun size={18} className="text-amber-400" />}
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
