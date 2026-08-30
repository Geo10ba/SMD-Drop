import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { CustomSizeCalculator } from './CustomSizeCalculator';
import { MediaKitModal } from './MediaKitModal';
import { ProfitCalculatorModal } from './ProfitCalculatorModal';
import { ExportCatalogModal } from './ExportCatalogModal';
import { MagicImportModal } from './MagicImportModal';
import { ResellerDashboard } from './ResellerDashboard';
import { 
  Ruler, 
  ShoppingBag, 
  Download, 
  Sparkles, 
  Filter, 
  Check, 
  Factory, 
  Tag, 
  Search, 
  Calculator, 
  FileSpreadsheet, 
  BarChart2, 
  Store, 
  Wand2, 
  Video, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  Lock,
  UserPlus
} from 'lucide-react';

export const ResellerCatalog = ({ onOpenCart, onOpenRegister }) => {
  const { 
    products, 
    addToCart, 
    openMagicImport, 
    itemsPerPage, 
    setItemsPerPage, 
    itemsPerRow, 
    setItemsPerRow, 
    categories: globalCategories,
    currentUser,
    companySettings
  } = useStore();

  const [resellerViewMode, setResellerViewMode] = useState('catalog'); // 'catalog' or 'dashboard'
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedPricingType, setSelectedPricingType] = useState('all'); // 'all', 'fixed', 'custom_m2'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [m2Product, setM2Product] = useState(null);
  const [mediaKitProduct, setMediaKitProduct] = useState(null);
  const [profitModalProduct, setProfitModalProduct] = useState(null);
  const [customPrices, setCustomPrices] = useState({});

  const handleCustomPriceChange = (productId, val) => {
    setCustomPrices((prev) => ({ ...prev, [productId]: val }));
  };

  const hero = companySettings?.heroSettings || {
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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedPricingType, searchQuery, itemsPerPage]);

  // Filter logic
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesPricing = selectedPricingType === 'all' || product.pricingType === selectedPricingType;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesPricing && matchesSearch;
  });

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const categories = ['Todos', ...globalCategories];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* High-Converting Renda Extra / Dropshipping B2B Hero Section for Visitors (Editable by Admin) */}
      {!currentUser && hero.enabled && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 p-6 sm:p-8 text-white shadow-2xl border border-amber-500/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider">
                <Sparkles size={15} /> {hero.badge}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-['Outfit'] leading-tight text-white tracking-tight">
                {hero.title}
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {hero.subtitle}
              </p>

              {/* Feature Bullet Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <Check size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{hero.bullet1Title}</span>
                    <span className="text-[10px] text-slate-400 block">{hero.bullet1Subtitle}</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <Factory size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{hero.bullet2Title}</span>
                    <span className="text-[10px] text-slate-400 block">{hero.bullet2Subtitle}</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0">
                    <Tag size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{hero.bullet3Title}</span>
                    <span className="text-[10px] text-slate-400 block">{hero.bullet3Subtitle}</span>
                  </div>
                </div>
              </div>

              {/* Main Call-To-Action Button */}
              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={onOpenRegister}
                  className="btn-gold py-3.5 px-8 text-sm sm:text-base font-extrabold shadow-xl flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 scale-100 hover:scale-105 transition-transform"
                >
                  <UserPlus size={20} /> {hero.ctaText}
                </button>

                <span className="text-[11px] text-slate-400 text-center sm:text-left flex items-center justify-center sm:justify-start gap-1">
                  <Check size={14} className="text-emerald-400" /> Cadastro 100% gratuito e instantâneo
                </span>
              </div>
            </div>

            {/* Right Column: High-Converting Happy Entrepreneur Image Card */}
            <div className="lg:col-span-5 relative flex items-center justify-center pt-2 lg:pt-0">
              <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl group">
                <img
                  src="/hero_entrepreneur.png"
                  alt="Revendedor de Sucesso SMD Drop"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                {/* Floating Profit Badge */}
                <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-amber-500/40 flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-lg">
                      💵
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Lucro no Seu Bolso</span>
                      <span className="text-[10px] text-amber-300 font-semibold block">Margem Média de 300% por Venda</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider animate-pulse">
                    FÁBRICA B2B
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Top Navigation Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--bg-surface)] p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
        <div>
          <span className="badge-gold uppercase text-[10px] font-bold tracking-wider mb-1 inline-block">
            CATÁLOGO DIRETO DE FÁBRICA
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] font-['Outfit']">
            {resellerViewMode === 'catalog' ? "Produtos Oficiais para Revenda" : "Painel do Revendedor Autorizado"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Sub-view switcher */}
          <div className="flex items-center bg-[var(--bg-surface-hover)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => setResellerViewMode('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                resellerViewMode === 'catalog'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <Store size={14} /> Catálogo ({products.length})
            </button>
            {currentUser && (
              <button
                onClick={() => setResellerViewMode('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  resellerViewMode === 'dashboard'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                <BarChart2 size={14} /> Meus Resultados
              </button>
            )}
          </div>

          {currentUser && (
            <button
              onClick={() => setIsExportOpen(true)}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-semibold"
            >
              <FileSpreadsheet size={15} className="text-emerald-500" /> Exportar Tabela
            </button>
          )}
        </div>
      </div>

      {/* VIEW 2: RESELLER DASHBOARD */}
      {resellerViewMode === 'dashboard' ? (
        <ResellerDashboard />
      ) : (
        /* VIEW 1: PRODUCT CATALOG GRID */
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-3 top-3 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Buscar produto por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9 text-xs py-2"
                />
              </div>

              {/* Pricing Type Filter */}
              <div className="flex items-center gap-1 bg-[var(--bg-surface-hover)] p-1 rounded-xl border border-[var(--border-color)] shrink-0">
                <button
                  onClick={() => setSelectedPricingType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPricingType === 'all'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  Todos ({products.length})
                </button>
                <button
                  onClick={() => setSelectedPricingType('fixed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPricingType === 'fixed'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  Preço Fixo
                </button>
                <button
                  onClick={() => setSelectedPricingType('custom_m2')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPricingType === 'custom_m2'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  Sob Medida (m²)
                </button>
              </div>
            </div>

            {/* Category Pills (Clean Wrap - Visible ONLY when categories exist) */}
            {globalCategories.length > 0 && (
              <div className="border-t border-[var(--border-color)] pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-900 shadow'
                          : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Catalog Grid (Dynamic Column Count) */}
          {products.length === 0 ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-12 text-center space-y-4 my-6 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-3xl font-bold shadow-inner">
                📦
              </div>
              <h3 className="text-xl font-extrabold text-[var(--text-main)] font-['Outfit']">
                Catálogo da Fábrica Zerado (Pronto para Produção)
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                O sistema foi totalmente limpo e está 100% pronto para você começar a cadastrar os seus produtos oficiais ou capturar anúncios via Botão Mágico!
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {currentUser?.role === 'admin' ? (
                  <button
                    onClick={() => openMagicImport()}
                    className="btn-gold py-2.5 px-5 text-xs font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Wand2 size={16} /> ⚡ Capturar Anúncio com Botão Mágico
                  </button>
                ) : (
                  <button
                    onClick={onOpenRegister}
                    className="btn-gold py-2.5 px-5 text-xs font-bold shadow-md flex items-center gap-1.5"
                  >
                    <UserPlus size={16} /> ✨ Criar Conta Grátis em 30s →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={`grid ${
              itemsPerRow === 3 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                : itemsPerRow === 4 
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' 
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4'
            }`}>
              {paginatedProducts.map((product) => {
                const isM2 = product.pricingType === 'custom_m2';
                return (
                  <div
                    key={product.id}
                    className="glass-panel group overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Card Image / Video Banner */}
                    <div className={`relative overflow-hidden bg-slate-900 group ${
                      itemsPerRow === 6 ? 'h-32' : itemsPerRow === 4 ? 'h-36' : 'h-48'
                    }`}>
                      {product.video ? (
                        <video
                          src={product.video}
                          controls
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}

                      {/* Pricing Badge */}
                      <div className="absolute top-2 left-2 pointer-events-none">
                        {isM2 ? (
                          <span className="badge-gold font-bold text-[10px] sm:text-xs shadow-md">
                            Sob Medida (m²)
                          </span>
                        ) : (
                          <span className="badge-emerald font-bold text-[10px] sm:text-xs shadow-md">
                            Preço Fixo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className={`flex flex-col justify-between flex-1 ${
                      itemsPerRow === 6 ? 'p-3 space-y-2' : itemsPerRow === 4 ? 'p-3.5 space-y-3' : 'p-5 space-y-4'
                    }`}>
                      <div>
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                          {product.category}
                        </span>
                        <h3 className={`font-bold text-[var(--text-main)] font-['Outfit'] line-clamp-1 mt-0.5 ${
                          itemsPerRow === 6 ? 'text-xs' : itemsPerRow === 4 ? 'text-sm' : 'text-base'
                        }`}>
                          {product.title}
                        </h3>
                        <p className={`text-[var(--text-muted)] mt-0.5 leading-tight ${
                          itemsPerRow === 6 ? 'text-[11px] line-clamp-1' : 'text-xs line-clamp-2'
                        }`}>
                          {product.description}
                        </p>
                      </div>

                      {/* Pricing Block */}
                      <div className={`bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-color)] ${
                        itemsPerRow === 6 ? 'p-2 space-y-1' : 'p-3 space-y-2'
                      }`}>
                        {currentUser ? (
                          /* LOGGED IN RESELLER VIEW: Show Wholesale Price & Profit Simulation */
                          isM2 ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase truncate">Atacado m²:</span>
                                <button
                                  onClick={() => setProfitModalProduct(product)}
                                  className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5 hover:bg-emerald-500/20 shrink-0"
                                  title="Simular Lucro Líquido"
                                >
                                  <Calculator size={10} /> Lucro
                                </button>
                              </div>

                              <div className="flex justify-between items-baseline pt-0.5">
                                <span className="text-[11px] text-[var(--text-muted)] font-medium">Valor/m²:</span>
                                <span className="text-sm font-extrabold text-[var(--text-main)] font-['Outfit']">
                                  R$ {product.pricePerM2.toFixed(2)}
                                </span>
                              </div>

                              <div className="flex justify-between items-baseline text-[11px] pt-1 border-t border-[var(--border-color)]">
                                <span className="text-[var(--text-muted)]">Sugestão:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  R$ {product.suggestedPricePerM2.toFixed(2)}/m²
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Atacado:</span>
                                <button
                                  onClick={() => setProfitModalProduct(product)}
                                  className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5 hover:bg-emerald-500/20 shrink-0"
                                  title="Simular Lucro Líquido"
                                >
                                  <Calculator size={10} /> Lucro
                                </button>
                              </div>

                              <div className="flex justify-between items-baseline">
                                <span className="text-[11px] text-[var(--text-muted)] font-medium">Custo Un:</span>
                                <span className="text-sm font-extrabold text-[var(--text-main)] font-['Outfit']">
                                  R$ {product.wholesalePrice.toFixed(2)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1 pt-1 border-t border-[var(--border-color)]">
                                <span className="text-[10px] font-bold text-[var(--text-main)]">Sua Venda:</span>
                                <div className="relative w-20">
                                  <span className="absolute left-1.5 top-0.5 text-[10px] text-[var(--text-muted)]">R$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min={product.wholesalePrice}
                                    value={customPrices[product.id] !== undefined ? customPrices[product.id] : product.suggestedRetailPrice}
                                    onChange={(e) => handleCustomPriceChange(product.id, Number(e.target.value))}
                                    className="input-field py-0.5 pl-6 pr-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 text-right"
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        ) : (
                          /* UNAUTHENTICATED VISITOR VIEW: Hide Wholesale Price & Prompt Registration */
                          <div className="space-y-1 py-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-[var(--text-muted)]">Preço Varejo Sugerido:</span>
                              <span className="font-mono font-bold text-[var(--text-main)]">
                                R$ {isM2 ? `${product.suggestedPricePerM2.toFixed(2)}/m²` : product.suggestedRetailPrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/30 text-center space-y-1">
                              <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                                <Lock size={12} /> Preço Atacado Reservado
                              </span>
                              <span className="text-[9px] text-[var(--text-muted)] block">
                                Exclusivo para revendedores cadastrados
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <button
                          onClick={() => setMediaKitProduct(product)}
                          className={`btn-secondary font-semibold justify-center ${
                            itemsPerRow === 6 ? 'py-1 px-1 text-[10px]' : 'py-2 px-2 text-xs'
                          }`}
                        >
                          <Download size={itemsPerRow === 6 ? 12 : 14} /> Kit Mídia
                        </button>

                        {currentUser ? (
                          isM2 ? (
                            <button
                              onClick={() => setM2Product(product)}
                              className={`btn-gold font-bold justify-center shadow-sm ${
                                itemsPerRow === 6 ? 'py-1 px-1 text-[10px]' : 'py-2 px-2 text-xs'
                              }`}
                            >
                              <Ruler size={itemsPerRow === 6 ? 12 : 14} /> Calcular m²
                            </button>
                          ) : (
                            <button
                              onClick={() => addToCart({ ...product, customSellingPrice: customPrices[product.id] })}
                              className={`btn-gold font-bold justify-center shadow-sm ${
                                itemsPerRow === 6 ? 'py-1 px-1 text-[10px]' : 'py-2 px-2 text-xs'
                              }`}
                            >
                              <ShoppingBag size={itemsPerRow === 6 ? 12 : 14} /> Comprar
                            </button>
                          )
                        ) : (
                          <button
                            onClick={onOpenRegister}
                            className={`btn-gold font-bold justify-center shadow-sm text-center ${
                              itemsPerRow === 6 ? 'py-1 px-1 text-[9px]' : 'py-2 px-2 text-[11px]'
                            }`}
                          >
                            <Lock size={12} /> Liberar Atacado
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {m2Product && (
        <CustomSizeCalculator
          product={m2Product}
          onClose={() => setM2Product(null)}
        />
      )}

      {mediaKitProduct && (
        <MediaKitModal
          product={mediaKitProduct}
          onClose={() => setMediaKitProduct(null)}
        />
      )}

      {profitModalProduct && (
        <ProfitCalculatorModal
          product={profitModalProduct}
          onClose={() => setProfitModalProduct(null)}
        />
      )}

      {isExportOpen && (
        <ExportCatalogModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
};
