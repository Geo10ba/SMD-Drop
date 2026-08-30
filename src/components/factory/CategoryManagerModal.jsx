import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Tag, Plus, Edit2, Trash2, Check, X, FolderTree, Sparkles } from 'lucide-react';

export const CategoryManagerModal = ({ isOpen, onClose }) => {
  const { categories, addCategory, editCategory, deleteCategory } = useStore();

  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [editCatName, setEditCatName] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setNewCatName('');
    }
  };

  const handleStartEdit = (cat) => {
    setEditingCat(cat);
    setEditCatName(cat);
  };

  const handleSaveEdit = (oldName) => {
    if (editCatName.trim() && editCatName !== oldName) {
      editCategory(oldName, editCatName.trim());
    }
    setEditingCat(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-3xl w-full flex flex-col p-5 sm:p-6 shadow-2xl relative animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <FolderTree size={22} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                PAINEL DO FABRICANTE • GESTÃO DE CATEGORIAS
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                Categorias Oficiais de Produtos
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] font-bold p-1">
            ✕
          </button>
        </div>

        {/* 2-Column Content Layout (No Scroll) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
          {/* Left Column: Create Form */}
          <div className="md:col-span-5 space-y-3 bg-amber-500/10 p-4 rounded-xl border border-amber-500/30">
            <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Sparkles size={14} /> Nova Categoria
            </span>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Cadastre novas categorias organizacionais para expor no catálogo do revendedor.
            </p>
            <form onSubmit={handleAdd} className="space-y-2 pt-1">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="ex: Letreiros em Acrílico"
                className="input-field font-semibold"
              />
              <button type="submit" className="w-full btn-gold py-2.5 font-bold justify-center text-xs shadow-md">
                <Plus size={16} /> Criar Categoria
              </button>
            </form>
          </div>

          {/* Right Column: Categories Grid */}
          <div className="md:col-span-7 space-y-2">
            <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[11px] block mb-1">
              Categorias Ativas ({categories.length})
            </span>
            <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-hover)] hover:border-amber-500/40 transition-colors"
                >
                  {editingCat === cat ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="input-field py-1 text-xs font-semibold"
                      />
                      <button
                        onClick={() => handleSaveEdit(cat)}
                        className="p-1.5 rounded bg-emerald-500 text-white font-bold shrink-0"
                        title="Salvar"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingCat(null)}
                        className="p-1.5 rounded bg-slate-500 text-white font-bold shrink-0"
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-[var(--text-main)] flex items-center gap-2">
                        <Tag size={14} className="text-amber-500" /> {cat}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 rounded hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-amber-500 transition-colors"
                          title="Editar Categoria"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat)}
                          className="p-1.5 rounded hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-red-500 transition-colors"
                          title="Excluir Categoria"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
