import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../context/StoreContext';
import { Image as ImageIcon, Plus, Trash2, Check, Star, ExternalLink, Save, X, Sparkles } from 'lucide-react';

export const ResellerProductImagesModal = ({ product, onClose }) => {
  const { updateProduct, showNotification } = useStore();

  const [images, setImages] = useState([]);
  const [coverImage, setCoverImage] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (product) {
      const initialImages = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [product.image || 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80'];
      setImages(initialImages);
      setCoverImage(product.image || initialImages[0] || '');
    }
  }, [product]);

  if (!product) return null;

  const handleAddImage = (e) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    const url = newImageUrl.trim();
    const nextImages = [...images, url];
    setImages(nextImages);
    if (!coverImage) setCoverImage(url);
    setNewImageUrl('');
    showNotification('Nova imagem adicionada à galeria do seu produto!');
  };

  const handleRemoveImage = (index) => {
    const target = images[index];
    const nextImages = images.filter((_, i) => i !== index);
    setImages(nextImages);
    if (coverImage === target) {
      setCoverImage(nextImages[0] || '');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (images.length === 0) {
      showNotification('O produto precisa ter ao menos 1 imagem.', 'error');
      return;
    }

    const finalCover = coverImage && images.includes(coverImage) ? coverImage : images[0];

    updateProduct(product.id, {
      image: finalCover,
      images: images,
      mediaKit: {
        ...(product.mediaKit || {}),
        photos: images
      }
    });

    showNotification('Galeria de fotos atualizada e salva no seu catálogo com sucesso!');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl relative my-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <ImageIcon size={22} />
            </div>
            <div>
              <span className="badge-gold uppercase tracking-wider text-[10px] mb-1 inline-block">
                GERENCIAR FOTOS DO SEU CATÁLOGO
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                {product.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Adicione mais fotos para enriquecer o catálogo da sua loja e gerar mais vendas.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {/* Approved Wholesale Info Summary */}
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Dados Aprovados pela Fábrica:
              </span>
              <p className="font-bold text-[var(--text-main)] mt-0.5">
                Preço Atacado: <span className="text-amber-600 dark:text-amber-400 font-mono">R$ {product.wholesalePrice?.toFixed(2)}</span>
                {' • '}
                Preço Sugerido Venda: <span className="text-emerald-600 dark:text-emerald-400 font-mono">R$ {product.suggestedRetailPrice?.toFixed(2)}</span>
              </p>
            </div>
            <span className="badge-emerald text-[10px] font-bold">
              {product.category || 'Geral'}
            </span>
          </div>

          {/* Add Image Form */}
          <form onSubmit={handleAddImage} className="space-y-2 bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)]">
            <label className="block font-bold text-[var(--text-muted)] uppercase text-[11px] flex items-center gap-1.5">
              <Plus size={14} className="text-amber-500" /> Adicionar URL da Imagem (HD / Web)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://sua-imagem.com/foto.jpg"
                className="input-field font-mono text-xs flex-1"
              />
              <button type="submit" className="btn-gold py-2 px-4 text-xs font-bold shrink-0 flex items-center gap-1">
                <Plus size={14} /> Adicionar
              </button>
            </div>
          </form>

          {/* Photos Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--text-muted)] uppercase text-[11px]">
                Galeria de Fotos do Produto ({images.length}):
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                Clique na estrela ⭐ para definir a capa principal
              </span>
            </div>

            {images.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] bg-[var(--bg-surface-hover)] rounded-xl border">
                Nenhuma foto cadastrada ainda. Adicione uma URL acima.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((imgUrl, idx) => {
                  const isCover = coverImage === imgUrl;
                  return (
                    <div
                      key={idx}
                      className={`group relative rounded-xl border overflow-hidden bg-[var(--bg-surface-hover)] transition-all ${
                        isCover ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-[var(--border-color)]'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-32 object-cover"
                      />

                      {/* Cover Badge */}
                      {isCover && (
                        <span className="absolute top-2 left-2 bg-amber-500 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                          <Star size={11} fill="currentColor" /> CAPA
                        </span>
                      )}

                      {/* Action buttons on hover */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => setCoverImage(imgUrl)}
                            className="bg-amber-500 text-slate-900 text-[10px] font-bold py-1.5 px-2.5 rounded-lg flex items-center gap-1 hover:bg-amber-400"
                            title="Definir como capa principal"
                          >
                            <Star size={12} /> Capa
                          </button>
                        )}
                        <a
                          href={imgUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-800 text-white p-1.5 rounded-lg hover:bg-slate-700"
                          title="Visualizar em tamanho real"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="bg-red-600 text-white p-1.5 rounded-lg hover:bg-red-500"
                          title="Remover foto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[var(--border-color)] flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary py-2.5 px-4 font-semibold">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-gold py-2.5 px-6 font-bold flex items-center gap-1.5 shadow-md"
          >
            <Save size={16} /> Salvar Fotos no Meu Catálogo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
