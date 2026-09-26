import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Building2, DollarSign, Package, Sparkles, Plus, Trash2, Edit3, Save, CheckCircle2, ShieldAlert, Diamond } from 'lucide-react';

export const FactoryCostsContent = () => {
  const { companySettings, updateCompanySettings, setCompanySettings, materials, addMaterial, setMaterials, showNotification } = useStore();
  const saveCompanySettings = updateCompanySettings || setCompanySettings;

  const [activeTab, setActiveTab] = useState('costs'); // 'costs' | 'materials'

  // Company Operating Costs state
  const [monthlyFixedCost, setMonthlyFixedCost] = useState(companySettings?.monthlyFixedCost ?? 15000);
  const [taxRatePct, setTaxRatePct] = useState(companySettings?.taxRatePct ?? 6);
  const [defaultPackagingCost, setDefaultPackagingCost] = useState(companySettings?.defaultPackagingCost ?? 4.5);
  const [targetMinFactoryMarginPct, setTargetMinFactoryMarginPct] = useState(companySettings?.targetMinFactoryMarginPct ?? 35);

  // New Material form state
  const [newMatName, setNewMatName] = useState('');
  const [newMatCost, setNewMatCost] = useState('');
  const [newMatWholesale, setNewMatWholesale] = useState('');
  const [newMatRetail, setNewMatRetail] = useState('');
  const [newMatPerceived, setNewMatPerceived] = useState('nobre'); // 'nobre', 'medio', 'basico'
  const [newMatDescription, setNewMatDescription] = useState('');

  const parseNumPtBr = (val, defaultVal = 0) => {
    if (val === undefined || val === null || val === '') return defaultVal;
    const normalized = String(val).replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? defaultVal : num;
  };

  const handleSaveCosts = (e) => {
    if (e) e.preventDefault();
    const updated = {
      ...companySettings,
      monthlyFixedCost: parseNumPtBr(monthlyFixedCost, 15000),
      taxRatePct: parseNumPtBr(taxRatePct, 6),
      defaultPackagingCost: parseNumPtBr(defaultPackagingCost, 4.5),
      targetMinFactoryMarginPct: parseNumPtBr(targetMinFactoryMarginPct, 35)
    };
    if (saveCompanySettings) {
      saveCompanySettings(updated);
    } else {
      showNotification('Configurações da empresa salvas com sucesso!');
    }
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
      factoryCostPerM2: parseNumPtBr(newMatCost, 100),
      wholesalePricePerM2: parseNumPtBr(newMatWholesale, 300),
      suggestedPricePerM2: parseNumPtBr(newMatRetail, 500),
      perceivedValue: newMatPerceived,
      description: newMatDescription.trim() || 'Material fabril para produção.'
    };

    addMaterial(item);
    setNewMatName('');
    setNewMatCost('');
    setNewMatWholesale('');
    setNewMatRetail('');
    setNewMatPerceived('nobre');
    setNewMatDescription('');
  };

  const handleDeleteMaterial = (id) => {
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated);
    showNotification('Insumo removido da lista');
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
            PAINEL EXCLUSIVO DA FÁBRICA & GESTÃO DE MARGENS
          </span>
          <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
            Custos da Empresa & Catálogo de Insumos
          </h3>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2 border-b border-[var(--border-color)] pb-3 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('costs')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'costs'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
              : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <DollarSign size={16} /> Custos Fixos & Impostos NFe
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'materials'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
              : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Package size={16} /> Matérias-Primas & Percepção de Nobreza ({materials.length})
        </button>
      </div>

      {/* Tab 1: Custos Operacionais */}
      {activeTab === 'costs' && (
        <form onSubmit={handleSaveCosts} className="space-y-5 text-xs">
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-amber-700 dark:text-amber-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-xs">
              <Sparkles size={16} /> Como a Lumen IA usa estes dados?
            </p>
            <p className="text-[11px] leading-relaxed">
              Estes dados alimentam a inteligência artificial para calcular o custo fabril real de cada produto cadastrado (incluindo margem de imposto, embalagem e prorrogação de custos fixos), evitando que a fábrica venda no prejuízo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[var(--text-main)] mb-1">
                Custo Fixo Mensal da Fábrica (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={monthlyFixedCost}
                onChange={(e) => setMonthlyFixedCost(e.target.value)}
                className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-2.5 rounded-xl font-mono text-xs text-[var(--text-main)] focus:outline-none focus:border-amber-500 font-bold"
                placeholder="Ex: 15000"
              />
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                Inclui aluguel, luz, salários da produção e depreciação das máquinas laser.
              </span>
            </div>

            <div>
              <label className="block font-bold text-[var(--text-main)] mb-1">
                Alíquota Média de Imposto NFe (%)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={taxRatePct}
                onChange={(e) => setTaxRatePct(e.target.value)}
                className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-2.5 rounded-xl font-mono text-xs text-[var(--text-main)] focus:outline-none focus:border-amber-500 font-bold"
                placeholder="Ex: 6"
              />
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                Porcentagem cobrada na emissão da Nota Fiscal (Simples Nacional).
              </span>
            </div>

            <div>
              <label className="block font-bold text-[var(--text-main)] mb-1">
                Custo Médio de Embalagem por Envio (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={defaultPackagingCost}
                onChange={(e) => setDefaultPackagingCost(e.target.value)}
                className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-2.5 rounded-xl font-mono text-xs text-[var(--text-main)] focus:outline-none focus:border-amber-500 font-bold"
                placeholder="Ex: 4,50 ou 4.50"
              />
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                Caixa de papelão reforçada, fita plástica, plástico bolha e proteção.
              </span>
            </div>

            <div>
              <label className="block font-bold text-[var(--text-main)] mb-1">
                Margem Líquida Mínima Desejada da Fábrica (%)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={targetMinFactoryMarginPct}
                onChange={(e) => setTargetMinFactoryMarginPct(e.target.value)}
                className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-2.5 rounded-xl font-mono text-xs text-[var(--text-main)] focus:outline-none focus:border-amber-500 font-bold"
                placeholder="Ex: 35"
              />
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                Lucro líquido livre pretendido para a fábrica em cada produto de atacado.
              </span>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="btn-gold py-3 px-6 text-xs font-bold w-full justify-center shadow-lg cursor-pointer flex items-center gap-2"
            >
              <Save size={16} /> Salvar Parâmetros Operacionais da Fábrica
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Matérias-Primas & Percepção de Valor */}
      {activeTab === 'materials' && (
        <div className="space-y-5 text-xs">
          {/* Add New Material Form */}
          <form onSubmit={handleAddMaterial} className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)] space-y-3">
            <h4 className="font-bold text-[var(--text-main)] flex items-center gap-1.5 uppercase text-[11px]">
              <Plus size={15} className="text-amber-500" /> Cadastrar Nova Matéria-Prima / Insumo
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                  Nome do Insumo
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
                  Custo Real de Aquisição (R$/m²)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newMatCost}
                  onChange={(e) => setNewMatCost(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-2 rounded-lg text-xs font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                  placeholder="Ex: 320.00"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                  Percepção de Valor / Nobreza
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                  Preço Atacado Base (R$/m²)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newMatWholesale}
                  onChange={(e) => setNewMatWholesale(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-2 rounded-lg text-xs font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                  placeholder="Ex: 920.00"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                  Sugestão de Venda Varejo (R$/m²)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newMatRetail}
                  onChange={(e) => setNewMatRetail(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-2 rounded-lg text-xs font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                  placeholder="Ex: 1380.00"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-gold py-2 px-4 text-xs font-bold w-full justify-center shadow-sm"
            >
              <Plus size={14} /> Adicionar Insumo à Tabela
            </button>
          </form>

          {/* List of Registered Materials */}
          <div className="space-y-2">
            <h4 className="font-bold text-[var(--text-main)] uppercase text-[11px] tracking-wider">
              Tabela de Insumos Cadastrados ({materials.length})
            </h4>

            <div className="overflow-x-auto border border-[var(--border-color)] rounded-xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Nome do Insumo</th>
                    <th className="py-2.5 px-3">Percepção de Valor</th>
                    <th className="py-2.5 px-3 text-right">Custo Aquisição (R$)</th>
                    <th className="py-2.5 px-3 text-right">Preço Atacado (R$)</th>
                    <th className="py-2.5 px-3 text-right">Sugestão Varejo (R$)</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {materials.map((m) => {
                    const perc = m.perceivedValue || 
                      (m.name?.toLowerCase().includes('acrílico') || m.name?.toLowerCase().includes('espelhado') || m.name?.toLowerCase().includes('inox') ? 'nobre' : 'basico');

                    return (
                      <tr key={m.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[var(--text-main)]">
                          {m.name}
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
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          R$ {(parseFloat(m.factoryCostPerM2) || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          R$ {(parseFloat(m.wholesalePricePerM2) || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--text-main)]">
                          R$ {(parseFloat(m.suggestedPricePerM2) || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleDeleteMaterial(m.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 font-bold"
                            title="Remover insumo"
                          >
                            <Trash2 size={15} />
                          </button>
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
