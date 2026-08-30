import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Layers, Plus, Edit2, Trash2, Save, Sparkles, Check, DollarSign, TrendingUp, ShieldAlert } from 'lucide-react';

export const MaterialManagerModal = ({ isOpen, onClose }) => {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useStore();

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editFactoryCost, setEditFactoryCost] = useState(180);
  const [editWholesale, setEditWholesale] = useState(530);
  const [editSuggested, setEditSuggested] = useState(800);
  const [editStyle, setEditStyle] = useState('dourado');
  const [editLeadTime, setEditLeadTime] = useState(3);
  const [editDesc, setEditDesc] = useState('');

  // Form for New Material
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFactoryCost, setNewFactoryCost] = useState(180);
  const [newWholesale, setNewWholesale] = useState(530);
  const [newSuggested, setNewSuggested] = useState(800);
  const [newStyle, setNewStyle] = useState('dourado');
  const [newLeadTime, setNewLeadTime] = useState(3);
  const [newDesc, setNewDesc] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (mat) => {
    setEditingId(mat.id);
    setEditName(mat.name);
    setEditFactoryCost(mat.factoryCostPerM2 || 180);
    setEditWholesale(mat.wholesalePricePerM2);
    setEditSuggested(mat.suggestedPricePerM2);
    setEditStyle(mat.style || 'dourado');
    setEditLeadTime(mat.leadTimeDays || 3);
    setEditDesc(mat.description || '');
  };

  const handleSaveEdit = (id) => {
    updateMaterial(id, {
      name: editName,
      factoryCostPerM2: Number(editFactoryCost),
      wholesalePricePerM2: Number(editWholesale),
      suggestedPricePerM2: Number(editSuggested),
      style: editStyle,
      leadTimeDays: Number(editLeadTime),
      description: editDesc
    });
    setEditingId(null);
  };

  const handleCreateNew = (e) => {
    e.preventDefault();
    if (!newName) return;
    addMaterial({
      name: newName,
      factoryCostPerM2: Number(newFactoryCost),
      wholesalePricePerM2: Number(newWholesale),
      suggestedPricePerM2: Number(newSuggested),
      style: newStyle,
      leadTimeDays: Number(newLeadTime),
      description: newDesc || 'Material fabril sob medida.'
    });
    setNewName('');
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-gold uppercase tracking-wider text-[10px] inline-block">
                  PAINEL DO ADMINISTRADOR • TABELA DE PRECIFICAÇÃO E MARGEM REAL
                </span>
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <ShieldAlert size={12} /> Visível Apenas para o Admin
                </span>
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit'] mt-0.5">
                Gerenciar Matérias-Primas, Custo Fabril e Lucro Líquido (R$/m²)
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 text-[var(--text-main)]">
            <div>
              <h4 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs">
                <TrendingUp size={15} /> Como é calculado o seu Lucro Líquido Real da Fábrica?
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                <strong>Lucro Fábrica (R$/m²) = Preço Atacado (Preço cobrado do Revendedor) - Custo Real Produção (Matéria-prima + Mão de obra).</strong>
                <br />Os revendedores enxergam apenas o Preço Atacado e a Sugestão ao Cliente Final!
              </p>
            </div>
            {!isAddingNew && (
              <button
                onClick={() => setIsAddingNew(true)}
                className="btn-gold py-2.5 px-4 text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-md"
              >
                <Plus size={16} /> Novo Material
              </button>
            )}
          </div>

          {/* Form to Add New Material */}
          {isAddingNew && (
            <form onSubmit={handleCreateNew} className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-amber-500/50 space-y-3">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2">
                <span className="font-bold text-amber-500 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <Sparkles size={14} /> Cadastrar Nova Matéria-Prima na Fábrica
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] font-bold text-xs"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Nome do Material</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Acrílico Espelhado Bronze 3mm"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input-field font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-red-500 uppercase mb-1">Custo Produção R$/m²</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newFactoryCost}
                    onChange={(e) => setNewFactoryCost(e.target.value)}
                    className="input-field font-bold text-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-500 uppercase mb-1">Preço Atacado R$/m²</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newWholesale}
                    onChange={(e) => setNewWholesale(e.target.value)}
                    className="input-field font-bold text-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-500 uppercase mb-1">Sugestão Revenda R$/m²</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newSuggested}
                    onChange={(e) => setNewSuggested(e.target.value)}
                    className="input-field font-bold text-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Amostra Visual</label>
                  <select
                    value={newStyle}
                    onChange={(e) => setNewStyle(e.target.value)}
                    className="input-field font-semibold"
                  >
                    <option value="dourado">Dourado Espelhado</option>
                    <option value="prata">Prata Espelhado</option>
                    <option value="rose">Rose Gold Espelhado</option>
                    <option value="preto">Preto Glossy</option>
                    <option value="madeira">MDF / Madeira</option>
                    <option value="neon_yellow">Neon LED Amarelo</option>
                    <option value="neon_blue">Neon LED Azul Ciano</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full btn-gold py-2.5 font-bold justify-center text-xs shadow-md">
                <Save size={15} /> Cadastrar Material na Fábrica
              </button>
            </form>
          )}

          {/* Table List of Registered Materials */}
          <div className="overflow-x-auto border border-[var(--border-color)] rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3.5">Material / Acabamento</th>
                  <th className="p-3.5 text-red-500">Custo Produção (Fábrica)</th>
                  <th className="p-3.5 text-amber-500">Preço Atacado (Cobrado)</th>
                  <th className="p-3.5 text-emerald-500 bg-emerald-500/10">LUCRO LÍQUIDO FÁBRICA</th>
                  <th className="p-3.5">Sugestão Cliente Final</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                {materials.map((mat) => {
                  const factoryCost = mat.factoryCostPerM2 || 180;
                  const wholesalePrice = mat.wholesalePricePerM2;
                  const factoryProfit = wholesalePrice - factoryCost;
                  const profitMargin = wholesalePrice > 0 ? ((factoryProfit / wholesalePrice) * 100).toFixed(1) : 0;

                  return (
                    <tr key={mat.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      {editingId === mat.id ? (
                        <>
                          <td className="p-3.5">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="input-field font-bold text-xs"
                            />
                          </td>
                          <td className="p-3.5">
                            <input
                              type="number"
                              step="0.01"
                              value={editFactoryCost}
                              onChange={(e) => setEditFactoryCost(e.target.value)}
                              className="input-field font-extrabold text-red-500 text-xs w-28"
                            />
                          </td>
                          <td className="p-3.5">
                            <input
                              type="number"
                              step="0.01"
                              value={editWholesale}
                              onChange={(e) => setEditWholesale(e.target.value)}
                              className="input-field font-extrabold text-amber-500 text-xs w-28"
                            />
                          </td>
                          <td className="p-3.5 bg-emerald-500/5 font-extrabold font-mono text-emerald-500 text-xs">
                            Calculando...
                          </td>
                          <td className="p-3.5">
                            <input
                              type="number"
                              step="0.01"
                              value={editSuggested}
                              onChange={(e) => setEditSuggested(e.target.value)}
                              className="input-field font-extrabold text-slate-400 text-xs w-28"
                            />
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleSaveEdit(mat.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 ml-auto shadow"
                            >
                              <Save size={13} /> Salvar
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3.5">
                            <div className="font-bold text-sm flex items-center gap-2.5">
                              <span className={`w-3.5 h-3.5 rounded-full shrink-0 border border-slate-700 ${
                                mat.style === 'dourado' ? 'bg-amber-400' :
                                mat.style === 'prata' ? 'bg-slate-300' :
                                mat.style === 'rose' ? 'bg-rose-400' :
                                mat.style === 'preto' ? 'bg-slate-900' :
                                mat.style === 'madeira' ? 'bg-amber-800' :
                                'bg-cyan-400'
                              }`} />
                              <span>{mat.name}</span>
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{mat.description}</p>
                          </td>

                          {/* Custo Produção Fábrica */}
                          <td className="p-3.5 font-bold font-mono text-red-500 text-xs">
                            R$ {factoryCost.toFixed(2)} /m²
                          </td>

                          {/* Preço Atacado Fábrica */}
                          <td className="p-3.5 font-extrabold font-mono text-amber-600 dark:text-amber-400 text-sm">
                            R$ {wholesalePrice.toFixed(2)} /m²
                          </td>

                          {/* Lucro Líquido Real da Fábrica (Exclusivo Admin) */}
                          <td className="p-3.5 bg-emerald-500/10 border-x border-emerald-500/20">
                            <div className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
                              <TrendingUp size={15} /> R$ {factoryProfit.toFixed(2)} /m²
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 block mt-0.5">
                              Margem Fábrica: {profitMargin}%
                            </span>
                          </td>

                          {/* Sugestão Varejo */}
                          <td className="p-3.5 font-bold font-mono text-[var(--text-muted)] text-xs">
                            R$ {mat.suggestedPricePerM2.toFixed(2)} /m²
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEdit(mat)}
                                className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                                title="Editar Custo Produção e Preço Atacado"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => deleteMaterial(mat.id)}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Excluir Material"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
