import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CustomSizeCalculator } from './CustomSizeCalculator';
import { MediaKitModal } from './MediaKitModal';
import { ProfitCalculatorModal } from './ProfitCalculatorModal';
import { ExportCatalogModal } from './ExportCatalogModal';
import { MagicImportModal } from './MagicImportModal';
import { ResellerDashboard } from './ResellerDashboard';
import { Ruler, ShoppingBag, Download, Sparkles, Filter, Check, Factory, Tag, Search, Calculator, FileSpreadsheet, BarChart2, Store, Wand2, Video, Layers, ChevronDown, ChevronUp } from 'lucide-react';

export const ResellerCatalog = ({ onOpenCart }) => {
  const { products, addToCart, openMagicImport, itemsPerPage, setItemsPerPage, itemsPerRow, setItemsPerRow, categories: globalCategories } = useStore();

  const [resellerViewMode, setResellerViewMode] = useState('catalog'); // 'catalog' or 'dashboard'
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedPricingType, setSelectedPricingType] = useState('all'); // all, fixed, custom_m2
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isHeroMinimized, setIsHeroMinimized] = useState(false);

  // Selected modals
  const [m2Product, setM2Product] = useState(null);
  const [mediaKitProduct, setMediaKitProduct] = useState(null);
  const [profitModalProduct, setProfitModalProduct] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [customPrices, setCustomPrices] = useState({});

  const handleCustomPriceChange = (productId, val) => {
    setCustomPrices((prev) => ({ ...prev, [productId]: val }));
  };

  // Reset page to 1 whenever filters or itemsPerPage change
  React.useEffect(() => {
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

  const categories = ['Todos', ...new Set(products.map((p) => p.category))];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Reseller Main Navigation Tabs */}
      <div className="flex items-center justify-between bg-[var(--bg-surface)] p-2 rounded-2xl border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setResellerViewMode('catalog')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              resellerViewMode === 'catalog'
                ? 'bg-amber-500 text-slate-900 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Store size={16} /> Catálogo de Atacado da Fábrica
          </button>
          <button
            onClick={() => setResellerViewMode('dashboard')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              resellerViewMode === 'dashboard'
                ? 'bg-amber-500 text-slate-900 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <BarChart2 size={16} /> Meu Dashboard de Revenda & Gráficos
          </button>
        </div>

        <button
          onClick={() => setIsExportOpen(true)}
          className="hidden sm:flex items-center gap-1.5 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] hover:border-amber-500 text-[var(--text-main)] font-bold px-3.5 py-2 rounded-xl transition-all text-xs"
        >
          <FileSpreadsheet size={15} className="text-amber-500" /> Exportar CSV (Shopify / Nuvemshop)
        </button>
      </div>

      {resellerViewMode === 'dashboard' ? (
        <ResellerDashboard onOpenCart={onOpenCart} />
      ) : (
        <>
          {/* Hero Banner for Resellers (Compact & Collapsible) */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-4 sm:p-6 text-white shadow-xl border border-slate-800 transition-all">
            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="space-y-2 max-w-4xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider">
                    <Factory size={12} /> DIRETO DA FÁBRICA • ENVIO SEM MARCA
                  </span>
                </div>
                {!isHeroMinimized ? (
                  <>
                    <h1 className="text-xl sm:text-2xl font-extrabold font-['Outfit'] tracking-tight leading-tight text-amber-400">
                      Revenda Produtos de Fabricação Própria com Alta Lucratividade
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm leading-snug">
                      Venda em sua loja virtual ou anexando etiquetas do <strong>Mercado Livre, Shopee e Amazon</strong>. Produtos sob medida em R$/m² com corte a laser fabril.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <button
                        onClick={() => openMagicImport()}
                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold px-3 py-1 rounded-lg transition-colors shadow-md text-xs"
                      >
                        <Wand2 size={14} /> ⚡ Botão Mágico (Sugerir Produto)
                      </button>
                      <button
                        onClick={() => setIsExportOpen(true)}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1 rounded-lg border border-slate-700 transition-colors shadow-md text-xs"
                      >
                        <FileSpreadsheet size={13} /> Exportar CSV (Shopify / Nuvemshop)
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-300 text-xs font-medium">
                    Plataforma de Dropshipping Fabril SMD Drop. Clique no botão ao lado para ver o banner explicativo completo.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsHeroMinimized(!isHeroMinimized)}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg border border-slate-700 text-xs flex items-center gap-1 shrink-0"
                title={isHeroMinimized ? "Expandir Banner" : "Minimizar Banner"}
              >
                {isHeroMinimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="glass-panel p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative w-full sm:w-80">
                <Search size={18} className="absolute left-3 top-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Buscar produtos ou materiais..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 py-2.5 text-xs sm:text-sm"
                />
              </div>

              {/* Pricing Type Filter Tabs */}
              <div className="flex items-center bg-[var(--bg-surface-hover)] p-1 rounded-xl border border-[var(--border-color)] w-full sm:w-auto">
                <button
                  onClick={() => setSelectedPricingType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPricingType === 'all'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  Todos os Tipos
                </button>
                <button
                  onClick={() => setSelectedPricingType('fixed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPricingType === 'fixed'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  Preço Fixo (Pronta Entrega)
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

            {/* Category Pills & Column Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--border-color)] pt-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
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

              {/* Items Per Row Quick Switcher */}
              <div className="flex items-center gap-1 bg-[var(--bg-surface-hover)] p-1 rounded-xl border border-[var(--border-color)] shrink-0 self-end sm:self-auto">
                <span className="text-[10px] font-bold text-[var(--text-muted)] px-1.5 uppercase hidden md:inline">Visualização:</span>
                <button
                  type="button"
                  onClick={() => setItemsPerRow(3)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    itemsPerRow === 3 ? 'bg-amber-500 text-slate-900 shadow' : 'text-[var(--text-muted)]'
                  }`}
                  title="3 produtos por linha"
                >
                  3/linha
                </button>
                <button
                  type="button"
                  onClick={() => setItemsPerRow(4)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    itemsPerRow === 4 ? 'bg-amber-500 text-slate-900 shadow' : 'text-[var(--text-muted)]'
                  }`}
                  title="4 produtos por linha"
                >
                  4/linha
                </button>
                <button
                  type="button"
                  onClick={() => setItemsPerRow(6)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    itemsPerRow === 6 ? 'bg-amber-500 text-slate-900 shadow' : 'text-[var(--text-muted)]'
                  }`}
                  title="6 produtos por linha"
                >
                  ⚡ 6/linha
                </button>
              </div>
            </div>
          </div>

          {/* Catalog Grid (Dynamic Column Count) */}
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

                    {/* Video Indicator Badge */}
                    {product.video && (
                      <div className="absolute top-2 right-2 pointer-events-none">
                        <span className="bg-purple-600/90 text-white font-extrabold text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-sm border border-purple-400/40">
                          <Video size={10} /> VÍDEO
                        </span>
                      </div>
                    )}
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
                      {isM2 ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase truncate">Custo fábrica/m²:</span>
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

                          <div className="flex justify-between items-center text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
                            <span>Lucro Bruto:</span>
                            <span>
                              + R$ {((customPrices[product.id] !== undefined ? customPrices[product.id] : product.suggestedRetailPrice) - product.wholesalePrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        onClick={() => setMediaKitProduct(product)}
                        className={`btn-secondary font-semibold justify-center ${
                          itemsPerRow === 6 ? 'py-1 px-1 text-[10px]' : 'py-2 px-2 text-xs'
                        }`}
                      >
                        <Download size={itemsPerRow === 6 ? 12 : 14} /> Kit Mídia
                      </button>

                      {isM2 ? (
                        <button
                          onClick={() => setM2Product(product)}
                          className={`btn-gold font-bold justify-center shadow-sm ${
                            itemsPerRow === 6 ? 'py-1 px-1 text-[10px]' : 'py-2 px-2 text-xs'
                          }`}
                        >
                          <Ruler size={itemsPerRow === 6 ? 12 : 14} /> Medir (m²)
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const finalSellingPrice = customPrices[product.id] !== undefined ? customPrices[product.id] : product.suggestedRetailPrice;
                            addToCart({
                              productId: product.id,
                              title: product.title,
                              pricingType: 'fixed',
                              unitWholesalePrice: product.wholesalePrice,
                              suggestedRetailPrice: finalSellingPrice,
                              customSellingPrice: finalSellingPrice,
                              quantity: 1,
                              image: product.image
                            });
                          }}
                          className={`btn-primary font-bold justify-center ${
                            itemsPerRow === 6 ? 'py-1 px-1 text-[10px]' : 'py-2 px-2 text-xs'
                          }`}
                        >
                          <ShoppingBag size={itemsPerRow === 6 ? 12 : 14} /> Comprar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Navigation Bar */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
              <div className="text-xs font-semibold text-[var(--text-muted)]">
                Mostrando <span className="font-bold text-[var(--text-main)]">{startIndex + 1}</span> a{' '}
                <span className="font-bold text-[var(--text-main)]">
                  {Math.min(startIndex + itemsPerPage, totalItems)}
                </span>{' '}
                de <span className="font-bold text-[var(--text-main)]">{totalItems}</span> produtos (Página {currentPage} de {totalPages})
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="btn-secondary py-1.5 px-3 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-extrabold transition-all ${
                      currentPage === pageNum
                        ? 'bg-amber-500 text-slate-900 shadow'
                        : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="btn-secondary py-1.5 px-3 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Custom Size Modal */}
      {m2Product && (
        <CustomSizeCalculator
          product={m2Product}
          onClose={() => setM2Product(null)}
        />
      )}

      {/* Media Kit Modal */}
      {mediaKitProduct && (
        <MediaKitModal
          product={mediaKitProduct}
          onClose={() => setMediaKitProduct(null)}
        />
      )}

      {/* Profit Calculator Modal */}
      {profitModalProduct && (
        <ProfitCalculatorModal
          product={profitModalProduct}
          isOpen={!!profitModalProduct}
          onClose={() => setProfitModalProduct(null)}
        />
      )}

      {/* CSV Export Modal */}
      {isExportOpen && (
        <ExportCatalogModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
};
