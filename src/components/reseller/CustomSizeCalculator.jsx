import React, { useState, useEffect } from 'react';
import { 
  Ruler, Check, X, Shield, Sparkles, Send, Layers, 
  FileUp, Info, Lock, Unlock, Eye, Type, Clock, 
  MessageSquare, UploadCloud, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { BUILTIN_FONTS, calculateTextDimensions } from '../../utils/textMetrics';
import { parseSVG, parseDXF } from '../../utils/vectorParser';

export const CustomSizeCalculator = ({ product, onClose }) => {
  const { 
    showNotification, 
    materials, 
    fonts, 
    companySettings,
    requestCustomQuote,
    currentUser
  } = useStore();

  const fontList = fonts && fonts.length > 0 ? fonts : BUILTIN_FONTS;

  const enabledProjectTypes = companySettings?.enabledProjectTypes || {
    logo_parede: true,
    placa_fundo: true,
    texto_simples: true
  };
  const activeMaterials = (materials || []).filter(m => m.isActive !== false);
  const disabledFontIds = companySettings?.disabledFontIds || [];
  const activeFonts = fontList.filter(f => !disabledFontIds.includes(f.id));

  // Form State
  const [unit, setUnit] = useState('cm'); // 'mm' | 'cm' | 'm'
  const [widthInput, setWidthInput] = useState(80); // 80 cm
  const [heightInput, setHeightInput] = useState(18); // 18 cm
  const [customText, setCustomText] = useState('Studio Bella');
  const [selectedFontId, setSelectedFontId] = useState(() => activeFonts[0]?.id || fontList[0]?.id || 'ArialBold');
  const [isProportionalLocked, setIsProportionalLocked] = useState(true);
  const [fontMetrics, setFontMetrics] = useState(null);
  const [isCalculatingFont, setIsCalculatingFont] = useState(false);
  const [fontFamily, setFontFamily] = useState('Outfit');
  const [vectorFile, setVectorFile] = useState(null);
  const [vectorData, setVectorData] = useState(null);
  const [resellerNotes, setResellerNotes] = useState('');
  const [resellerWhatsapp, setResellerWhatsapp] = useState(currentUser?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Tipo de Projeto
  const [projectType, setProjectType] = useState(() => {
    if (enabledProjectTypes.logo_parede !== false) return 'logo_parede';
    if (enabledProjectTypes.placa_fundo !== false) return 'placa_fundo';
    if (enabledProjectTypes.texto_simples !== false) return 'texto_simples';
    return 'logo_parede';
  });

  // Material Selection
  const [selectedMaterialId, setSelectedMaterialId] = useState(() => activeMaterials[0]?.id || materials[0]?.id || '');
  const selectedMaterial = activeMaterials.find(m => m.id === selectedMaterialId) || activeMaterials[0] || materials[0] || {
    name: 'MDF 6mm',
    style: 'amadeirado'
  };

  // Unit conversion helpers
  const toMm = (val, u = unit) => {
    const num = Number(val) || 0;
    if (u === 'cm') return num * 10;
    if (u === 'm') return num * 1000;
    return num; // mm
  };

  const fromMm = (valMm, targetUnit = unit) => {
    if (targetUnit === 'cm') return Math.round(valMm / 10);
    if (targetUnit === 'm') return Number((valMm / 1000).toFixed(2));
    return Math.round(valMm); // mm
  };

  const widthCm = unit === 'mm' ? widthInput / 10 : unit === 'm' ? widthInput * 100 : Number(widthInput);
  const heightCm = unit === 'mm' ? heightInput / 10 : unit === 'm' ? heightInput * 100 : Number(heightInput);

  // Typography auto-ratio calculation for live preview
  useEffect(() => {
    let isMounted = true;
    const targetFont = activeFonts.find(f => f.id === selectedFontId) || activeFonts[0] || BUILTIN_FONTS[0];
    if (!targetFont) return;

    setFontFamily(targetFont.family);
    setIsCalculatingFont(true);

    calculateTextDimensions(customText || 'Exemplo', selectedFontId)
      .then((metrics) => {
        if (!isMounted) return;
        setFontMetrics(metrics);
        setIsCalculatingFont(false);

        if (isProportionalLocked && metrics.aspectRatio > 0) {
          const wMm = toMm(widthInput);
          const naturalHMm = Math.round(wMm * metrics.aspectRatio);
          setHeightInput(fromMm(naturalHMm));
        }
      })
      .catch((err) => {
        if (isMounted) setIsCalculatingFont(false);
      });

    return () => { isMounted = false; };
  }, [customText, selectedFontId]);

  const handleWidthChange = (val) => {
    const num = Number(val);
    setWidthInput(num);
    if (isProportionalLocked && fontMetrics?.aspectRatio) {
      const wMm = toMm(num);
      const naturalHMm = Math.round(wMm * fontMetrics.aspectRatio);
      setHeightInput(fromMm(naturalHMm));
    }
  };

  const handleHeightChange = (val) => {
    const num = Number(val);
    setHeightInput(num);
    if (isProportionalLocked && fontMetrics?.aspectRatio && fontMetrics.aspectRatio > 0) {
      const hMm = toMm(num);
      const wMm = Math.round(hMm / fontMetrics.aspectRatio);
      setWidthInput(fromMm(wMm));
    }
  };

  const applyPresetWidth = (widthCmVal) => {
    const converted = unit === 'mm' ? widthCmVal * 10 : unit === 'm' ? widthCmVal / 100 : widthCmVal;
    setWidthInput(converted);
    if (isProportionalLocked && fontMetrics?.aspectRatio) {
      const wMm = widthCmVal * 10;
      const naturalHMm = Math.round(wMm * fontMetrics.aspectRatio);
      setHeightInput(fromMm(naturalHMm));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setVectorFile(file.name);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.svg') || fileName.endsWith('.dxf')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (!content) return;
        try {
          let parsed = fileName.endsWith('.svg') ? parseSVG(content) : parseDXF(content);
          if (parsed && parsed.width > 0 && parsed.height > 0) {
            setVectorData(parsed);
            setWidthInput(fromMm(parsed.width));
            setHeightInput(fromMm(parsed.height));
            showNotification(`✨ Arquivo ${parsed.format.toUpperCase()} analisado! Medidas ajustadas: ${parsed.width}x${parsed.height}mm.`);
          }
        } catch (err) {
          showNotification(`Arquivo anexado: ${file.name}`);
        }
      };
      reader.readAsText(file);
    } else {
      setVectorData(null);
      showNotification(`Arquivo anexado: ${file.name}`);
    }
  };

  const handleSubmitQuoteRequest = () => {
    if (!customText && !vectorFile) {
      showNotification('⚠️ Preencha o nome da marca ou anexe um arquivo para a fábrica avaliar!', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      requestCustomQuote({
        title: customText || vectorFile || 'Projeto Sob Medida',
        customText: customText,
        widthCm: widthCm,
        heightCm: heightCm,
        materialName: selectedMaterial.name,
        projectType: projectType,
        resellerNotes: resellerNotes,
        resellerPhone: resellerWhatsapp,
        vectorFileName: vectorFile || '',
        fontFamily: fontMetrics?.fontName || selectedFontId || 'ArialBold'
      });

      setSubmittedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      console.error(err);
      showNotification('Erro ao enviar solicitação. Tente novamente.', 'error');
      setIsSubmitting(false);
    }
  };

  const handleSendViaWhatsapp = () => {
    const factoryPhone = (companySettings?.phone || '5511987654321').replace(/\D/g, '');
    const projectTypeName = projectType === 'logo_parede' 
      ? 'Logomarca Corporativa 3D' 
      : projectType === 'placa_fundo' 
      ? 'Placa Painel com Fundo' 
      : 'Nome Simples / Frase';

    const msg = `Olá! Gostaria de um orçamento fabril sob medida:\n\n` +
      `🏢 *Projeto:* ${projectTypeName}\n` +
      `✨ *Texto/Marca:* ${customText || 'Conforme arquivo'}\n` +
      `📐 *Medidas Desejadas:* ${widthCm} cm × ${heightCm} cm\n` +
      `🧩 *Material de Preferência:* ${selectedMaterial.name}\n` +
      (vectorFile ? `📁 *Arquivo Anexado:* ${vectorFile}\n` : '') +
      (resellerNotes ? `📝 *Observações:* ${resellerNotes}\n` : '') +
      `\nAguardo a análise técnica e o valor de atacado. Obrigado!`;

    const encoded = encodeURIComponent(msg);
    const url = `https://api.whatsapp.com/send?phone=${factoryPhone}&text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-color)] bg-gradient-to-r from-amber-500/10 via-[var(--bg-surface)] to-[var(--bg-surface)] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold border border-amber-500/30 shadow-inner">
              <Ruler size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-main)] font-['Outfit'] flex items-center gap-2">
                Solicitação de Orçamento sob Medida
                <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Análise Fabril
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Envie suas especificações. A fábrica analisa a geometria e retorna o orçamento com preço oficial no seu painel.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Alert */}
        {submittedSuccess ? (
          <div className="p-12 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl font-extrabold text-[var(--text-main)] font-['Outfit']">
              Solicitação Enviada com Sucesso!
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
              Nossa equipe técnica já recebeu seu projeto. O orçamento com custo de atacado e sugestão de revenda será disponibilizado no seu painel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-color)]">
            
            {/* Left Column: Form Inputs */}
            <div className="lg:col-span-7 p-4 sm:p-6 space-y-5">
              
              {/* 1. Project Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-amber-500" /> 1. Tipo de Aplicação do Projeto
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setProjectType('logo_parede')}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      projectType === 'logo_parede'
                        ? 'border-amber-500 bg-amber-500/15 shadow-sm ring-1 ring-amber-500/40 text-amber-500 font-bold'
                        : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:border-slate-500'
                    }`}
                  >
                    <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1">
                      <span>🛡️ Logo 3D</span>
                    </div>
                    <span className="text-[9px] block text-[var(--text-muted)] mt-1 leading-tight">
                      Letras + Símbolo soltos c/ gabarito
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectType('texto_simples')}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      projectType === 'texto_simples'
                        ? 'border-amber-500 bg-amber-500/15 shadow-sm ring-1 ring-amber-500/40 text-amber-500 font-bold'
                        : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:border-slate-500'
                    }`}
                  >
                    <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1">
                      <span>🔤 Frase / Nome</span>
                    </div>
                    <span className="text-[9px] block text-[var(--text-muted)] mt-1 leading-tight">
                      Texto corrido decorativo
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectType('placa_fundo')}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      projectType === 'placa_fundo'
                        ? 'border-amber-500 bg-amber-500/15 shadow-sm ring-1 ring-amber-500/40 text-amber-500 font-bold'
                        : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:border-slate-500'
                    }`}
                  >
                    <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1">
                      <span>🖼️ Placa Fundo</span>
                    </div>
                    <span className="text-[9px] block text-[var(--text-muted)] mt-1 leading-tight">
                      Painel com prolongadores
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Text / Brand Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Type size={14} className="text-amber-500" /> 2. Nome da Marca ou Texto
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">
                    Letras maiúsculas e minúsculas
                  </span>
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Ex: Studio Bella, Dra. Camila, Barbearia..."
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-3 rounded-2xl text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                />

                {/* Font Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  {activeFonts.slice(0, 8).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFontId(f.id)}
                      className={`p-2 rounded-xl border text-xs truncate transition-all ${
                        selectedFontId === f.id
                          ? 'border-amber-500 bg-amber-500/15 text-amber-500 font-bold'
                          : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-slate-600'
                      }`}
                    >
                      {f.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Dimensions */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <Ruler size={14} className="text-amber-500" /> 3. Medidas Desejadas (Aproximadas)
                  </label>
                  <div className="flex items-center bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded-xl p-0.5 text-xs font-bold">
                    {['mm', 'cm', 'm'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => {
                          const wMm = toMm(widthInput);
                          const hMm = toMm(heightInput);
                          setUnit(u);
                          setWidthInput(fromMm(wMm, u));
                          setHeightInput(fromMm(hMm, u));
                        }}
                        className={`px-2 py-0.5 rounded-lg transition-colors ${
                          unit === u ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[30, 50, 70, 80, 100, 120].map((dim) => (
                    <button
                      key={dim}
                      type="button"
                      onClick={() => applyPresetWidth(dim)}
                      className="px-2.5 py-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[10px] font-bold text-[var(--text-main)] hover:border-amber-500 transition-colors"
                    >
                      {dim} cm
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] mb-1 block">Largura ({unit}):</span>
                    <input
                      type="number"
                      value={widthInput}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-2.5 rounded-xl font-mono text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] mb-1 block">Altura ({unit}):</span>
                    <input
                      type="number"
                      value={heightInput}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-2.5 rounded-xl font-mono text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Material Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-amber-500" /> 4. Matéria-Prima de Preferência
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeMaterials.map((mat) => (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => setSelectedMaterialId(mat.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        selectedMaterialId === mat.id
                          ? 'border-amber-500 bg-amber-500/15 text-amber-500 font-bold ring-1 ring-amber-500/40'
                          : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] text-[var(--text-main)] hover:border-slate-500'
                      }`}
                    >
                      <p className="text-xs font-bold truncate">{mat.name}</p>
                      <span className="text-[9px] text-[var(--text-muted)] block truncate mt-0.5">
                        {mat.description || 'Padrão Fabril'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. File / Vector Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileUp size={14} className="text-amber-500" /> 5. Anexo da Logomarca ou Vetor (Opcional)
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    SVG, DXF, PDF, PNG, JPG, Corel
                  </span>
                </label>

                <div className="border-2 border-dashed border-[var(--border-color)] hover:border-amber-500/60 rounded-2xl p-4 text-center bg-[var(--bg-surface-hover)] transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept=".svg,.dxf,.pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    <UploadCloud size={24} className="text-amber-500" />
                    <span className="text-xs font-bold text-[var(--text-main)]">
                      {vectorFile ? `Anexado: ${vectorFile}` : 'Clique para selecionar seu arquivo ou arraste aqui'}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Se tiver o vetor em curvas, envie para que a fábrica analise os nós de corte
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. Comments & Details */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-amber-500" /> 6. Observações & Detalhes Específicos
                </label>
                <textarea
                  rows={3}
                  value={resellerNotes}
                  onChange={(e) => setResellerNotes(e.target.value)}
                  placeholder="Ex: Fita 3M aplicada no verso de cada letra, gabarito em papel kraft para montagem, cor específica dourada espelhada, cliente tem urgência..."
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-3 rounded-2xl text-xs text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 7. WhatsApp Contact */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Seu WhatsApp para Retorno do Orçamento
                </label>
                <input
                  type="text"
                  value={resellerWhatsapp}
                  onChange={(e) => setResellerWhatsapp(e.target.value)}
                  placeholder="(DDD) 99999-9999"
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-2.5 rounded-xl text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

            </div>

            {/* Right Column: Visual Preview & Submit */}
            <div className="lg:col-span-5 p-4 sm:p-6 bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-surface-hover)] flex flex-col justify-between space-y-4">
              
              <div className="space-y-4">
                {/* Visual Preview Box */}
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                    Pré-visualização Estética
                  </span>
                  <div className="h-44 sm:h-52 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
                    
                    <div className="relative z-10 text-center px-4 max-w-full">
                      <span 
                        className="text-2xl sm:text-3xl font-bold tracking-wide break-words inline-block leading-tight text-amber-400 drop-shadow-md"
                        style={{ fontFamily: fontFamily || 'Outfit' }}
                      >
                        {customText || 'Sua Marca'}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-2">
                        {widthCm} cm × {heightCm} cm • {selectedMaterial.name}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>Proporção real do texto</span>
                      <span>{projectType === 'logo_parede' ? '🛡️ Logo 3D' : projectType === 'placa_fundo' ? '🖼️ Placa' : '🔤 Frase'}</span>
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl space-y-2.5 shadow-sm text-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] block border-b border-[var(--border-color)] pb-1.5">
                    Resumo do Pedido para Análise
                  </span>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">Projeto:</span>
                    <span className="font-bold text-[var(--text-main)]">
                      {projectType === 'logo_parede' ? 'Logomarca 3D Parede' : projectType === 'placa_fundo' ? 'Placa com Fundo' : 'Frase / Nome Simples'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">Medidas:</span>
                    <span className="font-mono font-bold text-[var(--text-main)]">{widthCm} × {heightCm} cm</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">Material:</span>
                    <span className="font-bold text-amber-500">{selectedMaterial.name}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">Arquivo Vetor:</span>
                    <span className="font-medium text-[var(--text-main)] truncate max-w-[160px]">{vectorFile || 'Texto digitado'}</span>
                  </div>
                </div>

                {/* Factory Quality Shield Banner */}
                <div className="bg-amber-500/10 border border-amber-500/25 p-3.5 rounded-2xl flex items-start gap-2.5">
                  <Shield size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed text-[var(--text-main)]">
                    <strong className="block font-bold text-amber-500 mb-0.5">
                      Precificação Manual Exclusiva no Gestor Pro CNC
                    </strong>
                    Sem contas automáticas ou distorções. O setor técnico da fábrica analisa a geometria e a chapa para garantir o menor custo de atacado e o maior lucro para a sua revenda.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitQuoteRequest}
                  className="btn-gold w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Send size={16} />
                  <span>{isSubmitting ? 'Enviando Projeto...' : 'Solicitar Orçamento à Fábrica'}</span>
                  <ChevronRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleSendViaWhatsapp}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <MessageSquare size={14} />
                  <span>Enviar Projeto Direto no WhatsApp da Fábrica</span>
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
