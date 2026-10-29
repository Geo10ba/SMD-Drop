import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Building2, 
  Package, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  CheckCircle2, 
  Diamond, 
  Check, 
  X,
  Type,
  Upload,
  RotateCcw,
  Eye,
  EyeOff,
  LayoutGrid
} from 'lucide-react';

export const FactoryCostsContent = () => {
  const { 
    companySettings, 
    updateCompanySettings, 
    setCompanySettings, 
    materials, 
    addMaterial, 
    updateMaterial, 
    setMaterials, 
    showNotification,
    fonts,
    addCustomFont,
    removeFont,
    restoreFonts
  } = useStore();
  const saveCompanySettings = updateCompanySettings || setCompanySettings;

  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'fonts'

  // Project Types Visibility State (Logo de Parede, Placa com Fundo, Frase Simples)
  const [enabledProjectTypes, setEnabledProjectTypes] = useState(() => ({
    logo_parede: companySettings?.enabledProjectTypes?.logo_parede ?? true,
    placa_fundo: companySettings?.enabledProjectTypes?.placa_fundo ?? true,
    texto_simples: companySettings?.enabledProjectTypes?.texto_simples ?? true
  }));

  // Disabled Fonts State (Desativar fontes temporariamente sem excluir)
  const [disabledFontIds, setDisabledFontIds] = useState(() => companySettings?.disabledFontIds || []);

  React.useEffect(() => {
    if (companySettings) {
      if (companySettings.enabledProjectTypes) {
        setEnabledProjectTypes({
          logo_parede: companySettings.enabledProjectTypes.logo_parede ?? true,
          placa_fundo: companySettings.enabledProjectTypes.placa_fundo ?? true,
          texto_simples: companySettings.enabledProjectTypes.texto_simples ?? true
        });
      }
      if (companySettings.disabledFontIds) {
        setDisabledFontIds(companySettings.disabledFontIds);
      }
    }
  }, [companySettings]);

  // New Material form state
  const [newMatName, setNewMatName] = useState('');
  const [newMatPerceived, setNewMatPerceived] = useState('nobre'); // 'nobre', 'medio', 'basico'
  const [newMatDescription, setNewMatDescription] = useState('');

  // Font Management Form state
  const [newFontFile, setNewFontFile] = useState(null);
  const [newFontName, setNewFontName] = useState('');
  const [newFontCategory, setNewFontCategory] = useState('Corporativa');
  const [isSubmittingFont, setIsSubmittingFont] = useState(false);

  // Inline Material Editing State
  const [editingMatId, setEditingMatId] = useState(null);
  const [editMatForm, setEditMatForm] = useState({
    name: '',
    perceivedValue: 'nobre',
    description: ''
  });

  const handleStartEdit = (mat) => {
    setEditingMatId(mat.id);
    setEditMatForm({
      name: mat.name || '',
      perceivedValue: mat.perceivedValue || 'nobre',
      description: mat.description || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingMatId(null);
  };

  const handleSaveEdit = (id) => {
    if (!editMatForm.name.trim()) {
      showNotification('O nome do insumo não pode ser vazio', 'error');
      return;
    }

    if (updateMaterial) {
      updateMaterial(id, {
        name: editMatForm.name.trim(),
        perceivedValue: editMatForm.perceivedValue,
        description: editMatForm.description.trim()
      });
    }
    setEditingMatId(null);
    showNotification(`Insumo "${editMatForm.name}" atualizado com sucesso!`);
  };

  const handleAddMaterial = (e) => {
    if (e) e.preventDefault();
    if (!newMatName.trim()) {
      showNotification('Digite o nome do insumo/material', 'error');
      return;
    }

    const item = {
      id: 'mat-' + Date.now(),
      name: newMatName.trim(),
      perceivedValue: newMatPerceived,
      description: newMatDescription.trim() || 'Material fabril para produção.',
      isActive: true
    };

    addMaterial(item);
    setNewMatName('');
    setNewMatPerceived('nobre');
    setNewMatDescription('');
    showNotification(`Insumo "${item.name}" adicionado à lista com sucesso!`);
  };

  const handleDeleteMaterial = (id) => {
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated);
    showNotification('Insumo removido da lista');
  };

  const handleFontFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewFontFile(file);
    if (!newFontName) {
      const cleanName = file.name
        .replace(/\.(ttf|otf)$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/regular|bold|italic|medium|semibold/gi, (m) => m.toUpperCase());
      setNewFontName(cleanName.trim());
    }
  };

  const handleCreateFont = async (e) => {
    e.preventDefault();
    if (!newFontFile) {
      showNotification('Selecione um arquivo de fonte (.ttf ou .otf).');
      return;
    }
    if (!newFontName.trim()) {
      showNotification('Preencha o nome da fonte.');
      return;
    }

    setIsSubmittingFont(true);
    try {
      await addCustomFont({
        file: newFontFile,
        name: newFontName.trim(),
        category: newFontCategory
      });
      setNewFontFile(null);
      setNewFontName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingFont(false);
    }
  };

  const handleDeleteFont = async (fontId, fontName) => {
    if (confirm(`Tem certeza que deseja excluir a fonte "${fontName}"? Ela deixará de aparecer para o revendedor.`)) {
      await removeFont(fontId);
    }
  };

  const handleToggleProjectType = (typeKey) => {
    const next = {
      ...enabledProjectTypes,
      [typeKey]: !enabledProjectTypes[typeKey]
    };
    const hasAtLeastOne = Object.values(next).some(Boolean);
    if (!hasAtLeastOne) {
      showNotification('⚠️ Ao menos um tipo de projeto deve permanecer ativo.');
      return;
    }
    setEnabledProjectTypes(next);
    saveCompanySettings({ enabledProjectTypes: next });
    showNotification(`Tipo de projeto ${next[typeKey] ? 'ativado' : 'desabilitado temporariamente'}.`);
  };

  const handleToggleMaterialActive = (mat) => {
    const nextStatus = mat.isActive === false ? true : false;
    updateMaterial(mat.id, { isActive: nextStatus });
    showNotification(`Material "${mat.name}" ${nextStatus ? 'visível' : 'oculto para os revendedores'}.`);
  };

  const handleToggleFontActive = (fontId, fontName) => {
    const isCurrentlyDisabled = disabledFontIds.includes(fontId);
    let nextList = [];
    if (isCurrentlyDisabled) {
      nextList = disabledFontIds.filter(id => id !== fontId);
      showNotification(`Fonte "${fontName}" reativada com sucesso!`);
    } else {
      nextList = [...disabledFontIds, fontId];
      showNotification(`Fonte "${fontName}" desabilitada temporariamente.`);
    }
    setDisabledFontIds(nextList);
    saveCompanySettings({ disabledFontIds: nextList });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
          <Building2 size={22} />
        </div>
        <div>
          <span className="badge-gold uppercase tracking-wider text-[10px] mb-0.5 inline-block">
            PAINEL EXCLUSIVO DA FÁBRICA & PROJETOS SOB MEDIDA
          </span>
          <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
            Catálogo de Matérias-Primas & Opções de Orçamento
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Configure as opções e materiais disponíveis para os revendedores escolherem ao solicitar um orçamento.
          </p>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border-color)] pb-3 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'materials'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
              : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Package size={16} /> Matérias-Primas ({materials.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fonts')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'fonts'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
              : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Type size={16} /> Tipografias & Fontes CNC Laser ({fonts?.length || 0})
        </button>
      </div>

      {/* Tab 1: Matérias-Primas & Insumos */}
      {activeTab === 'materials' && (
        <div className="space-y-5 text-xs">
          {/* Card: Tipos de Projetos Aceitos */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-850 p-4 rounded-2xl border border-amber-500/30 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <LayoutGrid size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
                    Tipos de Projetos Aceitos para Orçamento sob Medida
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Desative temporariamente qualquer opção para que o revendedor não consiga selecioná-la no formulário
                  </p>
                </div>
              </div>
              <span className="badge-gold uppercase tracking-wider text-[9px]">
                ⚙️ Aplicação Fabril
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Opção 1: Logo de Parede */}
              <div 
                onClick={() => handleToggleProjectType('logo_parede')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  enabledProjectTypes.logo_parede
                    ? 'bg-slate-800/90 border-amber-500/50 shadow-sm'
                    : 'bg-slate-900/50 border-slate-700/60 opacity-60'
                }`}
              >
                <div>
                  <span className="font-bold text-xs text-white block">🛡️ Logo de Parede</span>
                  <span className="text-[10px] text-slate-400">Letras + Símbolo soltos c/ fita 3M</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  enabledProjectTypes.logo_parede
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {enabledProjectTypes.logo_parede ? <><Check size={11} /> Visível</> : <><X size={11} /> Oculto</>}
                </span>
              </div>

              {/* Opção 2: Placa com Fundo */}
              <div 
                onClick={() => handleToggleProjectType('placa_fundo')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  enabledProjectTypes.placa_fundo
                    ? 'bg-slate-800/90 border-amber-500/50 shadow-sm'
                    : 'bg-slate-900/50 border-slate-700/60 opacity-60'
                }`}
              >
                <div>
                  <span className="font-bold text-xs text-white block">🖼️ Placa com Fundo</span>
                  <span className="text-[10px] text-slate-400">Painel inteiriço furado com prolongadores</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  enabledProjectTypes.placa_fundo
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {enabledProjectTypes.placa_fundo ? <><Check size={11} /> Visível</> : <><X size={11} /> Oculto</>}
                </span>
              </div>

              {/* Opção 3: Frase Simples */}
              <div 
                onClick={() => handleToggleProjectType('texto_simples')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  enabledProjectTypes.texto_simples
                    ? 'bg-slate-800/90 border-amber-500/50 shadow-sm'
                    : 'bg-slate-900/50 border-slate-700/60 opacity-60'
                }`}
              >
                <div>
                  <span className="font-bold text-xs text-white block">🔤 Frase Simples</span>
                  <span className="text-[10px] text-slate-400">Apenas texto corrido linear</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  enabledProjectTypes.texto_simples
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {enabledProjectTypes.texto_simples ? <><Check size={11} /> Visível</> : <><X size={11} /> Oculto</>}
                </span>
              </div>
            </div>
          </div>

          {/* Form to Add New Material */}
          <form onSubmit={handleAddMaterial} className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)] space-y-3">
            <h4 className="font-bold text-[var(--text-main)] flex items-center gap-1.5 uppercase text-[11px]">
              <Plus size={15} className="text-amber-500" /> Cadastrar Nova Matéria-Prima / Insumo
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                  Nome do Insumo / Material
                </label>
                <input
                  type="text"
                  value={newMatName}
                  onChange={(e) => setNewMatName(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-2 rounded-lg text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                  placeholder="Ex: Acrílico Espelhado Dourado 3mm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                  Percepção de Valor / Acabamento
                </label>
                <select
                  value={newMatPerceived}
                  onChange={(e) => setNewMatPerceived(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-2 rounded-lg text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="nobre">💎 Nobre / Luxo (Acrílico Espelhado, Inox, Neon)</option>
                  <option value="medio">🛡️ Intermediário (ACM, MDF Pintado, PVC)</option>
                  <option value="basico">📦 Básico / Funcional (MDF Cru, Papelão)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                Descrição / Especificação Rápida (Opcional)
              </label>
              <input
                type="text"
                value={newMatDescription}
                onChange={(e) => setNewMatDescription(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-2 rounded-lg text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                placeholder="Ex: Corte CNC laser de precisão com película protetora frontal"
              />
            </div>

            <button
              type="submit"
              className="btn-gold py-2 px-4 text-xs font-bold w-full justify-center shadow-sm"
            >
              <Plus size={14} /> Adicionar Insumo à Lista de Orçamento
            </button>
          </form>

          {/* List of Registered Materials */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[var(--text-main)] uppercase text-[11px] tracking-wider">
                Insumos Cadastrados ({materials.length})
              </h4>
              <span className="text-[10px] text-[var(--text-muted)]">
                Dê dois cliques na linha ou clique no lápis para editar
              </span>
            </div>

            <div className="overflow-x-auto border border-[var(--border-color)] rounded-xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Nome do Insumo</th>
                    <th className="py-2.5 px-3">Visibilidade</th>
                    <th className="py-2.5 px-3">Percepção de Valor</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {materials.map((m) => {
                    const isEditing = editingMatId === m.id;
                    const perc = m.perceivedValue || 
                      (m.name?.toLowerCase().includes('acrílico') || m.name?.toLowerCase().includes('espelhado') || m.name?.toLowerCase().includes('inox') ? 'nobre' : 'basico');

                    if (isEditing) {
                      return (
                        <tr key={m.id} className="bg-amber-500/10 border-2 border-amber-500/60 animate-fade-in">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editMatForm.name}
                              onChange={(e) => setEditMatForm(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full bg-[var(--bg-surface)] border border-amber-500 p-1.5 rounded text-xs font-bold text-[var(--text-main)] focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] text-slate-400 font-mono">Em edição</span>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={editMatForm.perceivedValue}
                              onChange={(e) => setEditMatForm(prev => ({ ...prev, perceivedValue: e.target.value }))}
                              className="bg-[var(--bg-surface)] border border-amber-500 p-1.5 rounded text-xs font-bold text-[var(--text-main)] focus:outline-none cursor-pointer"
                            >
                              <option value="nobre">💎 Nobre / Luxo</option>
                              <option value="medio">🛡️ Intermediário</option>
                              <option value="basico">📦 Básico / Funcional</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editMatForm.description}
                              onChange={(e) => setEditMatForm(prev => ({ ...prev, description: e.target.value }))}
                              className="w-full bg-[var(--bg-surface)] border border-amber-500 p-1.5 rounded text-xs font-bold text-[var(--text-main)] focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(m.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg shadow-sm transition-all"
                                title="Salvar Alterações"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="bg-slate-700 hover:bg-slate-600 text-slate-300 p-1.5 rounded-lg transition-all"
                                title="Cancelar"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr 
                        key={m.id} 
                        onDoubleClick={() => handleStartEdit(m)}
                        className={`hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer group ${
                          m.isActive === false ? 'opacity-55 bg-slate-900/30' : ''
                        }`}
                        title="Dê dois cliques ou clique no lápis para editar"
                      >
                        <td className="py-2.5 px-3 font-bold text-[var(--text-main)]">
                          <div className="flex items-center gap-2">
                            <span>{m.name}</span>
                            {m.isActive === false && (
                              <span className="text-[9px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.5 rounded border border-rose-500/30">
                                Oculto para Revendedor
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMaterialActive(m);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                              m.isActive !== false
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                            }`}
                            title={m.isActive !== false ? "Material disponível no formulário de orçamento" : "Material oculto no formulário"}
                          >
                            {m.isActive !== false ? <Eye size={12} className="text-emerald-400" /> : <EyeOff size={12} className="text-slate-400" />}
                            <span>{m.isActive !== false ? 'Visível' : 'Oculto'}</span>
                          </button>
                        </td>
                        <td className="py-2.5 px-3 font-semibold">
                          {perc === 'nobre' && (
                            <span className="badge-purple font-extrabold text-[10px] inline-flex items-center gap-1">
                              <Diamond size={11} /> Nobre / Luxo
                            </span>
                          )}
                          {perc === 'medio' && (
                            <span className="badge-indigo font-bold text-[10px]">
                              🛡️ Intermediário
                            </span>
                          )}
                          {perc === 'basico' && (
                            <span className="badge-amber font-medium text-[10px]">
                              📦 Básico / Funcional
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[var(--text-muted)] truncate max-w-[200px]">
                          {m.description || 'Padrão fabril'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(m);
                              }}
                              className="p-1 hover:text-amber-500 text-[var(--text-muted)] rounded transition-all"
                              title="Editar Insumo"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Deseja excluir o insumo "${m.name}"?`)) {
                                  handleDeleteMaterial(m.id);
                                }
                              }}
                              className="p-1 hover:text-rose-500 text-[var(--text-muted)] rounded transition-all"
                              title="Excluir Insumo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tipografias & Fontes CNC Laser */}
      {activeTab === 'fonts' && (
        <div className="space-y-5 text-xs">
          {/* Form: Add Custom Font */}
          <form onSubmit={handleCreateFont} className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)] space-y-3">
            <h4 className="font-bold text-[var(--text-main)] flex items-center gap-1.5 uppercase text-[11px]">
              <Upload size={15} className="text-amber-500" /> Cadastrar Nova Fonte / Tipografia para Letreiros
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              Faça upload de arquivos TrueType (.ttf) ou OpenType (.otf) para que os revendedores possam escolher no formulário sob medida.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                  Arquivo da Fonte (.TTF / .OTF)
                </label>
                <input
                  type="file"
                  accept=".ttf,.otf"
                  onChange={handleFontFileChange}
                  className="w-full text-xs text-[var(--text-main)] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  value={newFontName}
                  onChange={(e) => setNewFontName(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-2 rounded-lg text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                  placeholder="Ex: Montserrat Bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                  Categoria
                </label>
                <select
                  value={newFontCategory}
                  onChange={(e) => setNewFontCategory(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-2 rounded-lg text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="Corporativa">Corporativa / Moderna (Sem Serifa)</option>
                  <option value="Script">Script / Cursiva Caligráfica</option>
                  <option value="Decorativa">Decorativa / Display</option>
                  <option value="Neon">Neon / Monolinear</option>
                  <option value="Serifada">Elegante / Serifada</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingFont || !newFontFile}
              className="btn-gold py-2 px-4 text-xs font-bold w-full justify-center shadow-sm disabled:opacity-50"
            >
              <Upload size={14} /> {isSubmittingFont ? 'Enviando Fonte...' : 'Carregar e Ativar Fonte'}
            </button>
          </form>

          {/* List of Registered Fonts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[var(--text-main)] uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <Type size={14} className="text-amber-500" /> Fontes Ativas ({fonts?.length || 0})
              </h4>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Deseja restaurar as fontes padrão do sistema?')) {
                    await restoreFonts();
                  }
                }}
                className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1"
              >
                <RotateCcw size={12} /> Restaurar Padrões Fabris
              </button>
            </div>

            <div className="overflow-x-auto border border-[var(--border-color)] rounded-xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Nome da Fonte</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Prévia Visual</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {fonts?.map((f) => {
                    const isFontDisabled = disabledFontIds.includes(f.id);
                    return (
                      <tr 
                        key={f.id} 
                        className={`hover:bg-[var(--bg-surface-hover)] transition-colors group ${
                          isFontDisabled ? 'opacity-55 bg-slate-900/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-[var(--text-main)]">
                          <div className="flex items-center gap-2">
                            <span>{f.name}</span>
                            {f.isCustom && (
                              <span className="text-[9px] bg-amber-500/15 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                                Personalizada
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleFontActive(f.id, f.name)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                              !isFontDisabled
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                            }`}
                            title={!isFontDisabled ? "Fonte disponível para escolha" : "Fonte oculta"}
                          >
                            {!isFontDisabled ? <Eye size={12} className="text-emerald-400" /> : <EyeOff size={12} className="text-slate-400" />}
                            <span>{!isFontDisabled ? 'Ativa' : 'Oculta'}</span>
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-[var(--text-muted)] font-medium">
                          {f.category || 'Padrão'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span 
                            style={{ fontFamily: f.cssFamily || f.name }} 
                            className="text-base text-amber-500 select-none block truncate max-w-[200px]"
                          >
                            Sua Logomarca Aqui
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {f.isCustom && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFont(f.id, f.name)}
                                className="p-1 hover:text-rose-500 text-[var(--text-muted)] rounded transition-all"
                                title="Excluir Fonte"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const FactoryCostsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1 z-10">
          ✕
        </button>
        <div className="overflow-y-auto pr-1">
          <FactoryCostsContent />
        </div>
      </div>
    </div>
  );
};
