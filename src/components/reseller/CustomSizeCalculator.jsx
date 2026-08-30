import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Ruler, 
  Upload, 
  CheckCircle2, 
  DollarSign, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  Type, 
  Palette,
  Copy,
  Check,
  MessageSquare,
  Layers
} from 'lucide-react';

export const CustomSizeCalculator = ({ product, onClose }) => {
  const { addToCart, showNotification, materials } = useStore();

  // Unit State: 'mm' | 'cm' | 'm' (Default 'mm')
  const [unit, setUnit] = useState('mm');
  const [widthInput, setWidthInput] = useState(500); // e.g. 500 mm
  const [heightInput, setHeightInput] = useState(800); // e.g. 800 mm
  const [customText, setCustomText] = useState('STUDIO BELLA');
  const [fontFamily, setFontFamily] = useState('Outfit');
  const [backgroundType, setBackgroundType] = useState('transparente'); // transparente, preto, madeira, recortado
  const [vectorFile, setVectorFile] = useState(null);
  const [copiedQuote, setCopiedQuote] = useState(false);

  // Material Selection State (Pulls from Admin-registered materials table)
  const [selectedMaterialId, setSelectedMaterialId] = useState(() => materials[0]?.id || '');
  const selectedMaterial = materials.find(m => m.id === selectedMaterialId) || materials[0] || {
    name: 'Acrílico Premium (Luxo)',
    wholesalePricePerM2: product?.pricePerM2 || 920,
    suggestedPricePerM2: product?.suggestedPricePerM2 || 1380,
    style: 'dourado',
    leadTimeDays: 3
  };

  // Convert input values to centimeters (cm) and square meters (m²)
  const getWidthInCm = () => {
    const val = Number(widthInput) || 0;
    if (unit === 'mm') return val / 10;
    if (unit === 'm') return val * 100;
    return val; // cm
  };

  const getHeightInCm = () => {
    const val = Number(heightInput) || 0;
    if (unit === 'mm') return val / 10;
    if (unit === 'm') return val * 100;
    return val; // cm
  };

  const widthCm = getWidthInCm();
  const heightCm = getHeightInCm();

  // Dynamic Calculations based on selected material rates + Minimum 0.25 m² area rule!
  const rawM2 = (widthCm * heightCm) / 10000;
  const minM2 = 0.25;
  const isMinM2Applied = rawM2 > 0 && rawM2 < minM2;
  const calculatedM2 = Math.max(minM2, rawM2);

  const wholesaleTotal = calculatedM2 * selectedMaterial.wholesalePricePerM2;
  const suggestedTotal = calculatedM2 * selectedMaterial.suggestedPricePerM2;
  const resellerProfit = suggestedTotal - wholesaleTotal;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVectorFile(file.name);
    }
  };

  const handleCopyWhatsappQuote = () => {
    const text = `🎨 *ORÇAMENTO PRODUTO SOB MEDIDA*
-----------------------------------
📍 *Produto:* ${product?.title || 'Logomarca 3D'}
🧩 *Material:* ${selectedMaterial.name}
📐 *Medidas:* ${widthInput} ${unit} x ${heightInput} ${unit} (${widthCm}x${heightCm}cm - ${calculatedM2.toFixed(3)}m²)
✨ *Texto/Arte:* ${customText || "Personalizado"}
-----------------------------------
💰 *Valor Total para o Cliente:* R$ ${suggestedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
💳 Em até 12x no cartão de crédito!
🚀 Produção direta de fábrica com garantia total.`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
    showNotification('📱 Orçamento com material copiado! Cole no WhatsApp do seu cliente.');
  };

  const handleAddCustomToCart = () => {
    addToCart({
      productId: product?.id || 'custom-m2-prod',
      title: `${product?.title || 'Logomarca 3D'} (${selectedMaterial.name})`,
      pricingType: 'custom_m2',
      customText: customText || product?.title,
      fontFamily,
      materialName: selectedMaterial.name,
      widthCm: Number(widthCm),
      heightCm: Number(heightCm),
      calculatedM2: Number(calculatedM2.toFixed(3)),
      unitWholesalePrice: Number(wholesaleTotal.toFixed(2)),
      suggestedRetailPrice: Number(suggestedTotal.toFixed(2)),
      finishOption: `${selectedMaterial.name} | Fundo: ${backgroundType.toUpperCase()}`,
      vectorFileName: vectorFile || 'logo_cliente_vetor.svg',
      quantity: 1,
      image: product?.image || 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80'
    });
    onClose();
  };

  // Visual preview style mapping based on selected material style
  const getAcrylicStyle = () => {
    switch (selectedMaterial.style) {
      case 'dourado':
        return 'bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 text-transparent bg-clip-text drop-shadow-[0_4px_10px_rgba(245,158,11,0.5)]';
      case 'prata':
        return 'bg-gradient-to-r from-slate-200 via-slate-400 to-slate-100 text-transparent bg-clip-text drop-shadow-[0_4px_10px_rgba(255,255,255,0.6)]';
      case 'rose':
        return 'bg-gradient-to-r from-rose-300 via-pink-400 to-rose-500 text-transparent bg-clip-text drop-shadow-[0_4px_10px_rgba(244,63,94,0.5)]';
      case 'preto':
        return 'text-slate-950 font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]';
      case 'madeira':
        return 'text-amber-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] font-extrabold';
      case 'neon_yellow':
        return 'text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.9)] animate-pulse';
      case 'neon_blue':
        return 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.9)] animate-pulse';
      default:
        return 'text-amber-400';
    }
  };

  const getBgStyle = () => {
    switch (backgroundType) {
      case 'preto':
        return 'bg-slate-950 border border-slate-800';
      case 'madeira':
        return 'bg-amber-950 border border-amber-900/60';
      case 'recortado':
        return 'bg-slate-900/40 border border-dashed border-slate-700';
      default: // transparente
        return 'bg-slate-900/90 backdrop-blur border border-slate-700/60';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Ruler size={20} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-0.5 inline-block">
                CALCULADORA DINÂMICA DE MATÉRIA-PRIMA DA FÁBRICA (R$/m²)
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)] font-['Outfit'] leading-tight">
                {product?.title || 'Cálculo de Logomarca sob Medida'}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {/* 2-Column Wide Layout (No Scroll) */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Form Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-3.5 text-xs">
              {/* Text / Name Input */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center gap-1">
                  <Type size={13} className="text-amber-500" /> 1. Nome ou Texto da Logomarca
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="ex: BARBEARIA SILVA"
                  className="input-field font-extrabold uppercase text-sm py-2"
                />
              </div>

              {/* Unit Selector & Dimensions Input */}
              <div className="bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                    <Ruler size={13} className="text-amber-500" /> 2. Medidas Exatas (Largura x Altura)
                  </label>

                  {/* Unit Switcher */}
                  <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setUnit('mm')}
                      className={`px-2 py-0.5 rounded ${unit === 'mm' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400'}`}
                    >
                      mm
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit('cm')}
                      className={`px-2 py-0.5 rounded ${unit === 'cm' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400'}`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit('m')}
                      className={`px-2 py-0.5 rounded ${unit === 'm' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400'}`}
                    >
                      m
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">Largura ({unit})</span>
                    <input
                      type="number"
                      value={widthInput}
                      onChange={(e) => setWidthInput(Number(e.target.value))}
                      className="input-field font-extrabold mt-0.5 text-amber-500 font-mono py-1.5"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">Altura ({unit})</span>
                    <input
                      type="number"
                      value={heightInput}
                      onChange={(e) => setHeightInput(Number(e.target.value))}
                      className="input-field font-extrabold mt-0.5 text-amber-500 font-mono py-1.5"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-[var(--text-muted)] font-mono">
                  * Conversão: <strong>{widthCm} cm x {heightCm} cm</strong> ({rawM2.toFixed(3)} m²)
                  {isMinM2Applied && (
                    <span className="text-amber-500 font-bold block mt-0.5">
                      ⚡ Área mínima de faturamento fabril aplicada: 0,250 m²
                    </span>
                  )}
                </p>
              </div>

              {/* Dynamic Material Selector */}
              <div className="bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)] space-y-2">
                <label className="font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Layers size={14} className="text-amber-500" /> 3. Escolha a Matéria-Prima / Acabamento
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {materials.map((mat) => (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => setSelectedMaterialId(mat.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        selectedMaterialId === mat.id
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/50'
                          : 'border-[var(--border-color)] hover:bg-[var(--bg-surface)]'
                      }`}
                    >
                      <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${
                          mat.style === 'dourado' ? 'bg-amber-400' :
                          mat.style === 'prata' ? 'bg-slate-300' :
                          mat.style === 'rose' ? 'bg-rose-400' :
                          mat.style === 'preto' ? 'bg-slate-900' :
                          mat.style === 'madeira' ? 'bg-amber-800' :
                          'bg-cyan-400'
                        }`} />
                        <span className="truncate">{mat.name}</span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1 text-[11px] pt-1 border-t border-[var(--border-color)]">
                        <span className="font-mono font-extrabold text-amber-500">
                          R$ {mat.wholesalePricePerM2.toFixed(2)}/m²
                        </span>
                        <span className="text-[9px] text-[var(--text-muted)]">
                          Sug: R$ {mat.suggestedPricePerM2.toFixed(2)}/m²
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vector File Upload */}
              <div>
                <div className="border-2 border-dashed border-[var(--border-hover)] rounded-xl p-2.5 text-center relative bg-[var(--bg-surface-hover)] hover:border-amber-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.png,.jpg,.svg,.dxf,.ai"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <Upload size={15} className="text-amber-500" />
                    <span className="font-semibold text-[var(--text-main)] truncate">
                      {vectorFile ? `Vetor Anexado: ${vectorFile}` : "Anexar Vetor / Logo do Cliente (PDF, SVG, DXF, PNG)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Canvas Preview & Summary Box (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-3">
              {/* Canvas Preview Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Eye size={14} className="text-amber-500" /> Pré-Visualização</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                    {calculatedM2.toFixed(3)} m²
                  </span>
                </div>

                <div className={`h-32 sm:h-36 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden transition-all shadow-inner ${getBgStyle()}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                  
                  <div className="relative z-10 text-center px-3">
                    <h2
                      className={`text-xl sm:text-2xl font-extrabold uppercase tracking-widest ${getAcrylicStyle()}`}
                      style={{ fontFamily: fontFamily }}
                    >
                      {customText || "SUA LOGO AQUI"}
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono font-medium truncate max-w-xs">
                      [ {selectedMaterial.name} ]
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 flex flex-col justify-between shadow-xl space-y-3">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center bg-slate-800/60 p-2 rounded-lg border border-slate-700/60 text-xs">
                    <span className="text-slate-300">Material Escolhido:</span>
                    <span className="font-extrabold text-amber-400 text-right truncate max-w-[170px]">{selectedMaterial.name}</span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">Seu Custo Atacado de Fábrica:</span>
                    <span className="text-2xl font-extrabold text-white font-['Outfit']">
                      R$ {wholesaleTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-400 font-medium">Sugestão Cliente Final:</span>
                      <span className="font-bold text-emerald-300">
                        R$ {suggestedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-emerald-500/20">
                      <span className="text-emerald-400 font-semibold">Seu Lucro Estimado:</span>
                      <span className="font-extrabold text-emerald-400">+ R$ {resellerProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyWhatsappQuote}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    {copiedQuote ? <Check size={15} /> : <MessageSquare size={15} />}
                    {copiedQuote ? "Orçamento Copiado!" : "📱 Copiar Orçamento WhatsApp"}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-700">
                  <button
                    onClick={handleAddCustomToCart}
                    className="w-full btn-gold justify-center py-2.5 text-xs font-extrabold shadow-lg flex items-center gap-1.5"
                  >
                    Adicionar Pedido Sob Medida <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
