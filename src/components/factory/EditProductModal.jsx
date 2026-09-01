import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../context/StoreContext';
import { 
  Edit2, Tag, Image as ImageIcon, Save, Trash2, Sparkles, Eye, X, 
  Layers, Package, FileText, Plus, Check, AlertCircle, RefreshCw, Star
} from 'lucide-react';

export const EditProductModal = ({ product, onClose }) => {
  const { updateProduct, deleteProduct, categories, addCategory } = useStore();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'variations' | 'logistics' | 'fiscal' | 'gallery'

  // General fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [parentSku, setParentSku] = useState('');
  const [shopeeId, setShopeeId] = useState('');
  const [pricingType, setPricingType] = useState('fixed');
  const [description, setDescription] = useState('');

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Fixed Price & Stock summary
  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [suggestedRetailPrice, setSuggestedRetailPrice] = useState(0);
  const [factoryStock, setFactoryStock] = useState(0);

  // m² fields
  const [pricePerM2, setPricePerM2] = useState(530);
  const [suggestedPricePerM2, setSuggestedPricePerM2] = useState(800);

  // Variations list
  const [variations, setVariations] = useState([]);

  // Logistics
  const [weightKg, setWeightKg] = useState(0.5);
  const [lengthCm, setLengthCm] = useState(30);
  const [widthCm, setWidthCm] = useState(30);
  const [heightCm, setHeightCm] = useState(10);
  const [leadTimeDays, setLeadTimeDays] = useState(3);

  // Tax & Fiscal
  const [ncm, setNcm] = useState('3926.90.90');
  const [cest, setCest] = useState('');
  const [measureUnit, setMeasureUnit] = useState('UN (UNIDADE)');
  const [cfopSame, setCfopSame] = useState('5101');
  const [cfopDiff, setCfopDiff] = useState('6101');
  const [csosn, setCsosn] = useState('102 - Tributada pelo Simples Nacional sem permissão de crédito');
  const [origin, setOrigin] = useState('0 - Nacional');

  // Images Gallery
  const [image, setImage] = useState('');
  const [images, setImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (product) {
      setTitle(product.title || '');
      setCategory(product.category || categories[0] || 'Geral');
      setParentSku(product.parentSku || product.sku || '');
      setShopeeId(product.shopeeId || '');
      setPricingType(product.pricingType || 'fixed');
      setDescription(product.description || '');

      setWholesalePrice(product.wholesalePrice || 0);
      setSuggestedRetailPrice(product.suggestedRetailPrice || 0);
      setFactoryStock(product.factoryStock || 0);

      setPricePerM2(product.pricePerM2 || 530);
      setSuggestedPricePerM2(product.suggestedPricePerM2 || 800);

      setVariations(Array.isArray(product.variations) ? product.variations : []);

      setWeightKg(product.weightKg || 0.5);
      setLengthCm(product.dimensions?.length || product.lengthCm || 30);
      setWidthCm(product.dimensions?.width || product.widthCm || 30);
      setHeightCm(product.dimensions?.height || product.heightCm || 10);
      setLeadTimeDays(product.leadTimeDays || 3);

      setNcm(product.ncm || '3926.90.90');
      setCest(product.cest || '');
      setMeasureUnit(product.measureUnit || 'UN (UNIDADE)');
      setCfopSame(product.cfopSame || '5101');
      setCfopDiff(product.cfopDiff || '6101');
      setCsosn(product.csosn || '102 - Tributada pelo Simples Nacional sem permissão de crédito');
      setOrigin(product.origin || '0 - Nacional');

      setImage(product.image || '');
      setImages(Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image || '']);
    }
  }, [product]);

  if (!product) return null;

  // Bulk Percentage Adjustment State
  const [bulkPercent, setBulkPercent] = useState(10);
  const [bulkTarget, setBulkTarget] = useState('wholesale'); // 'wholesale' | 'retail' | 'stock'
  const [bulkStockValue, setBulkStockValue] = useState(100);

  // Variation handlers
  const handleUpdateVariation = (index, field, value) => {
    const next = [...variations];
    next[index] = { ...next[index], [field]: value };
    
    setVariations(next);

    // Recalculate total stock and summary prices
    const totalStock = next.reduce((acc, v) => acc + (parseInt(v.stock, 10) || 0), 0);
    const validPrices = next.map(v => parseFloat(v.price) || 0).filter(p => p > 0);
    const validWholesales = next.map(v => parseFloat(v.wholesalePrice) || 0).filter(w => w > 0);

    if (validPrices.length > 0) {
      setSuggestedRetailPrice(Math.min(...validPrices));
    }
    if (validWholesales.length > 0) {
      setWholesalePrice(Math.min(...validWholesales));
    }
    if (totalStock > 0) setFactoryStock(totalStock);
  };

  const handleApplyBulkAdjustment = () => {
    if (variations.length === 0) return;

    const pct = parseFloat(bulkPercent) || 0;
    const factor = 1 + (pct / 100);

    const updated = variations.map(v => {
      let nextW = parseFloat(v.wholesalePrice) || 0;
      let nextR = parseFloat(v.price) || 0;
      let nextS = parseInt(v.stock, 10) || 0;

      if (bulkTarget === 'wholesale') {
        // Reajusta APENAS o Custo Atacado R$, mantendo a Sugestão de Revenda intacta
        nextW = Math.round(nextW * factor * 100) / 100;
      } else if (bulkTarget === 'retail') {
        // Reajusta APENAS a Sugestão de Revenda R$, mantendo o Custo Atacado intacto
        nextR = Math.round(nextR * factor * 100) / 100;
      } else if (bulkTarget === 'wholesale_recalc') {
        // Reajusta Custo Atacado e Recalcula Revenda (45%)
        nextW = Math.round(nextW * factor * 100) / 100;
        nextR = Math.round((nextW / 0.45) * 100) / 100;
      } else if (bulkTarget === 'retail_recalc') {
        // Reajusta Sugestão de Revenda e Recalcula Atacado (45%)
        nextR = Math.round(nextR * factor * 100) / 100;
        nextW = Math.round(nextR * 0.45 * 100) / 100;
      } else if (bulkTarget === 'stock') {
        nextS = parseInt(bulkStockValue, 10) || 0;
      }

      return {
        ...v,
        wholesalePrice: nextW,
        price: nextR,
        stock: nextS
      };
    });

    setVariations(updated);

    // Recalculate summary metrics
    const validPrices = updated.map(v => v.price).filter(p => p > 0);
    const validWholesales = updated.map(v => v.wholesalePrice).filter(w => w > 0);
    if (validPrices.length > 0) setSuggestedRetailPrice(Math.min(...validPrices));
    if (validWholesales.length > 0) setWholesalePrice(Math.min(...validWholesales));
    const totalStock = updated.reduce((acc, v) => acc + (v.stock || 0), 0);
    setFactoryStock(totalStock);
  };

  const handleAddVariation = () => {
    const newVar = {
      id: 'var-custom-' + Date.now(),
      name: `Nova Variação ${variations.length + 1}`,
      sku: `${parentSku || 'SKU'}-V${variations.length + 1}`,
      price: suggestedRetailPrice || 49.90,
      wholesalePrice: Math.round((suggestedRetailPrice || 49.90) * 0.45 * 100) / 100,
      stock: 100,
      gtin: ''
    };
    setVariations([...variations, newVar]);
  };

  const handleDeleteVariation = (index) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  // Image gallery handlers
  const handleAddImage = (e) => {
    e.preventDefault();
    if (newImageUrl.trim()) {
      const cleanUrl = newImageUrl.trim();
      const updated = [...images, cleanUrl];
      setImages(updated);
      if (!image) setImage(cleanUrl);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index) => {
    const removedUrl = images[index];
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    if (image === removedUrl) {
      setImage(updated[0] || '');
    }
  };

  const handleSetCoverImage = (imgUrl) => {
    setImage(imgUrl);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Recalculate summary prices if variations exist
    let finalRetailPrice = Number(suggestedRetailPrice);
    let finalWholesalePrice = Number(wholesalePrice);
    let finalStock = Number(factoryStock);

    if (variations.length > 0) {
      const validPrices = variations.map(v => Number(v.price) || 0).filter(p => p > 0);
      if (validPrices.length > 0) {
        finalRetailPrice = Math.min(...validPrices);
        finalWholesalePrice = Math.round(finalRetailPrice * 0.45 * 100) / 100;
      }
      finalStock = variations.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    }

    updateProduct(product.id, {
      title,
      category,
      parentSku,
      shopeeId,
      pricingType,
      wholesalePrice: finalWholesalePrice,
      suggestedRetailPrice: finalRetailPrice,
      factoryStock: finalStock,
      pricePerM2: Number(pricePerM2),
      suggestedPricePerM2: Number(suggestedPricePerM2),
      description,
      variations,
      weightKg: Number(weightKg),
      dimensions: {
        length: Number(lengthCm),
        width: Number(widthCm),
        height: Number(heightCm)
      },
      leadTimeDays: Number(leadTimeDays),
      ncm,
      cest,
      measureUnit,
      cfopSame,
      cfopDiff,
      csosn,
      origin,
      image: image || images[0] || '',
      images: images.length > 0 ? images : [image]
    });

    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${product.title}"?`)) {
      deleteProduct(product.id);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl relative my-auto animate-none">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Edit2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-gold uppercase tracking-wider text-[10px] inline-block">
                  PAINEL DO FABRICANTE • FICHA TÉCNICA COMPLETA
                </span>
                {shopeeId && (
                  <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-500/30">
                    Shopee ID: {shopeeId}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit'] line-clamp-1 mt-0.5">
                {title || product.title}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Edit2 size={14} /> Dados Gerais & Descrição
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variations')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'variations'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Layers size={14} /> Variações Shopee
            {variations.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'variations' ? 'bg-white/30 text-white' : 'bg-amber-500/20 text-amber-600'
              }`}>
                {variations.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logistics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'logistics'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Package size={14} /> Pesos & Dimensões
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fiscal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'fiscal'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <FileText size={14} /> Dados Fiscais (NCM)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <ImageIcon size={14} /> Fotos HD
            {images.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'gallery' ? 'bg-white/30 text-white' : 'bg-emerald-500/20 text-emerald-600'
              }`}>
                {images.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
          
          {/* TAB 1: DADOS GERAIS */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Título do Produto</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input-field font-semibold text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      {!isCreatingCategory ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase">Categoria</label>
                            <button
                              type="button"
                              onClick={() => setIsCreatingCategory(true)}
                              className="text-[10px] text-amber-500 font-bold hover:underline"
                            >
                              + Nova
                            </button>
                          </div>
                          <select
                            value={category}
                            onChange={(e) => {
                              if (e.target.value === '__NEW__') {
                                setIsCreatingCategory(true);
                              } else {
                                setCategory(e.target.value);
                              }
                            }}
                            className="input-field font-medium"
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                            <option value="__NEW__">➕ Criar Nova Categoria...</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Criar Categoria</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              autoFocus
                              placeholder="Nome..."
                              value={newCategoryInput}
                              onChange={(e) => setNewCategoryInput(e.target.value)}
                              className="input-field font-semibold text-xs py-2"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newCategoryInput.trim()) {
                                  const created = newCategoryInput.trim();
                                  addCategory(created);
                                  setCategory(created);
                                  setNewCategoryInput('');
                                  setIsCreatingCategory(false);
                                }
                              }}
                              className="btn-gold px-2 py-2 text-xs font-extrabold shrink-0"
                            >
                              OK
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsCreatingCategory(false)}
                              className="px-1 text-slate-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">SKU de Referência</label>
                      <input
                        type="text"
                        value={parentSku}
                        placeholder="ex: RE-12345"
                        onChange={(e) => setParentSku(e.target.value)}
                        className="input-field font-mono font-semibold uppercase text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Modelo de Precificação</label>
                    <select
                      value={pricingType}
                      onChange={(e) => setPricingType(e.target.value)}
                      className="input-field font-semibold"
                    >
                      <option value="fixed">Preço Fixo (Unidade)</option>
                      <option value="custom_m2">Sob Medida (R$/m²)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {pricingType === 'custom_m2' ? (
                    <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 space-y-3">
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                        <Sparkles size={13} /> Precificação por Metro Quadrado (R$/m²)
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--text-muted)]">Custo Fábrica R$ / m²</label>
                          <input
                            type="number"
                            step="0.01"
                            value={pricePerM2}
                            onChange={(e) => setPricePerM2(e.target.value)}
                            className="input-field font-extrabold text-amber-500 text-sm mt-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--text-muted)]">Sugestão Revenda R$ / m²</label>
                          <input
                            type="number"
                            step="0.01"
                            value={suggestedPricePerM2}
                            onChange={(e) => setSuggestedPricePerM2(e.target.value)}
                            className="input-field font-extrabold text-emerald-500 text-sm mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30 space-y-3">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                        <Tag size={13} /> Resumo de Preços e Estoque Global
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--text-muted)]">Custo Atacado R$</label>
                          <input
                            type="number"
                            step="0.01"
                            value={wholesalePrice}
                            onChange={(e) => setWholesalePrice(e.target.value)}
                            className="input-field font-extrabold text-amber-500 mt-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--text-muted)]">Sugestão Revenda R$</label>
                          <input
                            type="number"
                            step="0.01"
                            value={suggestedRetailPrice}
                            onChange={(e) => setSuggestedRetailPrice(e.target.value)}
                            className="input-field font-extrabold text-emerald-500 mt-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--text-muted)]">Estoque (Un)</label>
                          <input
                            type="number"
                            value={factoryStock}
                            onChange={(e) => setFactoryStock(e.target.value)}
                            className="input-field font-bold mt-1"
                          />
                        </div>
                      </div>
                      {variations.length > 0 && (
                        <p className="text-[10px] text-[var(--text-muted)] italic">
                          * Nota: Os valores acima representam o valor mínimo e a soma total das {variations.length} variações da aba "Variações Shopee".
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">URL da Imagem Capa</label>
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Descrição Detalhada do Produto</label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field leading-relaxed font-sans text-xs"
                  placeholder="Descrição completa com especificações, materiais e destaques..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: VARIAÇÕES SHOPEE */}
          {activeTab === 'variations' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/30">
                <div>
                  <h4 className="font-bold text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1.5">
                    <Layers size={16} /> Cadastro Completo de Variações ({variations.length})
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Edite os preços individuais, estoques, SKUs e códigos GTIN/EAN de cada variação importada da Shopee.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariation}
                  className="btn-gold py-2 px-3 text-xs font-bold shrink-0 flex items-center gap-1 shadow-sm"
                >
                  <Plus size={15} /> Nova Variação
                </button>
              </div>

              {/* Bulk Percentage Adjustment Toolbar */}
              {variations.length > 0 && (
                <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)] space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                    <span className="font-extrabold text-[var(--text-main)] text-xs flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles size={15} className="text-amber-500" /> Reajuste de Preços & Estoque em Massa (% Porcentagem)
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">
                      Aplica em todas as {variations.length} variações simultaneamente
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Target Selector */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                        O que deseja alterar em massa?
                      </label>
                      <select
                        value={bulkTarget}
                        onChange={(e) => setBulkTarget(e.target.value)}
                        className="input-field py-1.5 text-xs font-semibold"
                      >
                        <option value="wholesale">🏷️ Alterar APENAS Custo Atacado R$ (Manter Revenda Intacta)</option>
                        <option value="retail">💰 Alterar APENAS Sugestão de Revenda R$ (Manter Atacado Intacto)</option>
                        <option value="wholesale_recalc">🔄 Alterar Custo Atacado R$ (E Recalcular Revenda)</option>
                        <option value="retail_recalc">🔄 Alterar Sugestão de Revenda R$ (E Recalcular Atacado)</option>
                        <option value="stock">📦 Definir Estoque Fixo em Massa</option>
                      </select>
                    </div>

                    {bulkTarget !== 'stock' ? (
                      <div className="w-32">
                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                          Porcentagem %
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            value={bulkPercent}
                            onChange={(e) => setBulkPercent(e.target.value)}
                            className="input-field py-1.5 pr-6 text-xs font-extrabold font-mono text-amber-500"
                            placeholder="+10"
                          />
                          <span className="absolute right-2 top-1.5 font-bold text-xs text-[var(--text-muted)]">%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-32">
                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                          Qtd Estoque
                        </label>
                        <input
                          type="number"
                          value={bulkStockValue}
                          onChange={(e) => setBulkStockValue(e.target.value)}
                          className="input-field py-1.5 text-xs font-bold font-mono"
                          placeholder="100"
                        />
                      </div>
                    )}

                    {/* Quick Percentage Presets */}
                    {bulkTarget !== 'stock' && (
                      <div className="flex items-center gap-1 self-end pb-0.5">
                        {['+5', '+10', '+15', '+20', '-5', '-10'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setBulkPercent(preset)}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                              String(bulkPercent) === preset
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-amber-500/50'
                            }`}
                          >
                            {preset}%
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="self-end pb-0.5 ml-auto">
                      <button
                        type="button"
                        onClick={handleApplyBulkAdjustment}
                        className="btn-gold py-2 px-4 text-xs font-extrabold shadow-md flex items-center gap-1.5"
                      >
                        <RefreshCw size={14} /> Aplicar Reajuste em {variations.length} Variações
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {variations.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-[var(--border-color)] rounded-xl p-6">
                  <Layers size={32} className="mx-auto text-[var(--text-muted)] opacity-50 mb-2" />
                  <p className="text-sm font-bold text-[var(--text-main)]">Nenhuma variação individual cadastrada</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 mb-3">Este produto está usando o preço fixo e estoque global.</p>
                  <button
                    type="button"
                    onClick={handleAddVariation}
                    className="btn-secondary py-2 px-4 text-xs font-bold"
                  >
                    + Criar Variações do Produto
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-[var(--border-color)] rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-bold text-[10px]">
                      <tr>
                        <th className="p-2.5">Nome da Variação</th>
                        <th className="p-2.5">SKU Variação</th>
                        <th className="p-2.5 text-amber-500">Custo Atacado R$ (Fábrica)</th>
                        <th className="p-2.5 text-emerald-500">Sugestão Revenda R$</th>
                        <th className="p-2.5">Estoque (un)</th>
                        <th className="p-2.5">GTIN / EAN</th>
                        <th className="p-2.5 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)] font-medium text-xs">
                      {variations.map((v, idx) => (
                        <tr key={v.id || idx} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.name}
                              onChange={(e) => handleUpdateVariation(idx, 'name', e.target.value)}
                              className="input-field py-1 text-xs font-semibold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.sku || ''}
                              placeholder="SKU..."
                              onChange={(e) => handleUpdateVariation(idx, 'sku', e.target.value)}
                              className="input-field py-1 font-mono text-[11px] uppercase"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={v.wholesalePrice}
                              onChange={(e) => handleUpdateVariation(idx, 'wholesalePrice', parseFloat(e.target.value) || 0)}
                              className="input-field py-1 text-xs font-extrabold text-amber-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={v.price}
                              onChange={(e) => handleUpdateVariation(idx, 'price', e.target.value)}
                              className="input-field py-1 text-xs font-extrabold text-emerald-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) => handleUpdateVariation(idx, 'stock', parseInt(e.target.value, 10) || 0)}
                              className="input-field py-1 text-xs font-bold w-20"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.gtin || ''}
                              placeholder="789..."
                              onChange={(e) => handleUpdateVariation(idx, 'gtin', e.target.value)}
                              className="input-field py-1 font-mono text-[11px]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteVariation(idx)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Remover Variação"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LOGÍSTICA & EMBALAGEM */}
          {activeTab === 'logistics' && (
            <div className="space-y-4">
              <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/30 space-y-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Package size={15} /> Dimensões da Embalagem para Frete (Correios & Transportadoras)
                </span>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Estes dados são essenciais para a integração automatizada de cálculo de frete (Melhor Envio, Frenet, Shopee Logistics).
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Peso do Pacote (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="input-field font-extrabold text-sm text-indigo-600 dark:text-indigo-400"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 block">ex: 0.50 kg = 500 gramas</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Comprimento (cm)</label>
                  <input
                    type="number"
                    required
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    className="input-field font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Largura (cm)</label>
                  <input
                    type="number"
                    required
                    value={widthCm}
                    onChange={(e) => setWidthCm(e.target.value)}
                    className="input-field font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="input-field font-bold text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-color)] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Prazo de Produção / Postagem (Dias Úteis)</label>
                  <input
                    type="number"
                    required
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(e.target.value)}
                    className="input-field font-bold text-sm"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 block">Dias necessários na fábrica antes de despachar o pedido.</span>
                </div>

                <div className="p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-color)] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[var(--text-main)] block">Volume Cúbico Embalado</span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      {(lengthCm * widthCm * heightCm).toLocaleString()} cm³
                    </span>
                  </div>
                  <Package className="text-indigo-500" size={24} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DADOS FISCAIS */}
          {activeTab === 'fiscal' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileText size={15} /> Dados Tributários para Emissão de Nota Fiscal NFe / NF-e
                </span>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Informações fiscais sincronizadas com o arquivo da Shopee para emissão automatizada de NF de faturamento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">NCM (Nomenclatura Mercosul)</label>
                  <input
                    type="text"
                    required
                    value={ncm}
                    onChange={(e) => setNcm(e.target.value)}
                    className="input-field font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">CEST (Substituição Tributária)</label>
                  <input
                    type="text"
                    value={cest}
                    placeholder="Opcional..."
                    onChange={(e) => setCest(e.target.value)}
                    className="input-field font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Unidade de Medida Comercial</label>
                  <input
                    type="text"
                    value={measureUnit}
                    onChange={(e) => setMeasureUnit(e.target.value)}
                    className="input-field font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">CFOP (Venda Mesmo Estado)</label>
                  <input
                    type="text"
                    value={cfopSame}
                    onChange={(e) => setCfopSame(e.target.value)}
                    className="input-field font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">CFOP (Venda Outro Estado)</label>
                  <input
                    type="text"
                    value={cfopDiff}
                    onChange={(e) => setCfopDiff(e.target.value)}
                    className="input-field font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">CSOSN / Situação Tributária (Simples Nacional)</label>
                <input
                  type="text"
                  value={csosn}
                  onChange={(e) => setCsosn(e.target.value)}
                  className="input-field font-medium text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Origem da Mercadoria</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="input-field font-medium text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 5: GALERIA DE FOTOS HD */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/30">
                <div>
                  <h4 className="font-bold text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1.5">
                    <ImageIcon size={16} /> Fotos em Alta Definição ({images.length})
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Clique em qualquer foto para defini-la como a Foto Capa oficial do catálogo.
                  </p>
                </div>
              </div>

              {/* Add New Image Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Cole a URL de uma foto HD (https://...)..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="input-field text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="btn-gold py-2 px-4 text-xs font-bold shrink-0 flex items-center gap-1"
                >
                  <Plus size={15} /> Adicionar Foto
                </button>
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                {images.map((imgUrl, idx) => {
                  const isCover = image === imgUrl || (idx === 0 && !image);
                  return (
                    <div
                      key={idx}
                      className={`group relative rounded-xl overflow-hidden border-2 transition-all bg-[var(--bg-surface-hover)] ${
                        isCover ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg' : 'border-[var(--border-color)] hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      
                      {isCover && (
                        <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                          <Star size={10} fill="currentColor" /> CAPA
                        </span>
                      )}

                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => handleSetCoverImage(imgUrl)}
                            className="w-full bg-amber-500 text-white font-bold text-[10px] py-1 px-2 rounded-lg shadow hover:bg-amber-400 transition-colors flex items-center justify-center gap-1"
                          >
                            <Star size={11} /> Definir Capa
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="w-full bg-red-600/90 text-white font-bold text-[10px] py-1 px-2 rounded-lg shadow hover:bg-red-500 transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 size={11} /> Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-[var(--border-color)] flex justify-between items-center shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-500/10 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={15} /> Excluir Produto
            </button>

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary py-2.5 px-4 text-xs font-semibold">
                Cancelar
              </button>
              <button type="submit" className="btn-gold py-2.5 px-6 text-xs font-bold shadow-md flex items-center gap-1.5">
                <Save size={15} /> Salvar Ficha do Produto
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
