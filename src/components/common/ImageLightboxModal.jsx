import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Maximize2, ExternalLink } from 'lucide-react';

export const ImageLightboxModal = ({
  isOpen,
  images = [],
  initialIndex = 0,
  title = 'Imagem do Produto',
  onClose
}) => {
  const imageList = Array.isArray(images) && images.length > 0
    ? images
    : (typeof images === 'string' && images ? [images] : []);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  // Trava de rolagem da página de fundo quando a imagem está aberta
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Sync initialIndex when modal opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, imageList.length - 1)));
      setIsZoomed(false);
    }
  }, [isOpen, initialIndex, imageList.length]);

  // Keyboard navigation (Esc, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, imageList.length]);

  if (!isOpen || imageList.length === 0) return null;

  const currentImage = imageList[currentIndex] || imageList[0];
  const hasMultiple = imageList.length > 1;

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = (title || 'foto_produto').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${cleanTitle}_HD_${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Fallback
      window.open(currentImage, '_blank');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 select-none animate-fadeIn transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="flex items-center justify-between gap-3 w-full max-w-6xl mx-auto z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-amber-500/20 text-amber-400 font-extrabold px-2.5 py-1 rounded-lg text-xs border border-amber-500/30 whitespace-nowrap">
            FOTO HD {hasMultiple ? `${currentIndex + 1} / ${imageList.length}` : '1 / 1'}
          </div>
          <h3 className="text-white font-bold text-xs sm:text-sm font-['Outfit'] truncate max-w-md" title={title}>
            {title}
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Toggle */}
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isZoomed
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
            title={isZoomed ? 'Reduzir para o tamanho original' : 'Ampliar Imagem'}
          >
            {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
            <span className="hidden sm:inline">{isZoomed ? 'Reduzir' : 'Zoom 100%'}</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
            title="Baixar imagem em Alta Resolução"
          >
            <Download size={16} className="text-emerald-400" />
            <span className="hidden sm:inline">Baixar HD</span>
          </button>

          {/* Open in new tab */}
          <a
            href={currentImage}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-xs font-bold flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
            title="Abrir imagem original em nova aba"
          >
            <ExternalLink size={16} />
          </a>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
            title="Fechar (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Center Image Viewport */}
      <div
        className="relative flex-1 flex items-center justify-center my-3 sm:my-4 overflow-hidden"
        onClick={(e) => {
          // If clicked outside the image itself, close
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Navigation Arrow: Left */}
        {hasMultiple && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-slate-900/80 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/20 flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 cursor-pointer"
            title="Foto Anterior (Seta Esquerda)"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* The Image Container */}
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center transition-transform duration-300 ${
            isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed((prev) => !prev);
          }}
          title={isZoomed ? 'Clique para ajustar à tela' : 'Clique para dar Zoom'}
        >
          <img
            key={currentImage}
            src={currentImage}
            alt={title}
            className="max-h-[72vh] sm:max-h-[76vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl border border-white/10"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80';
            }}
          />
        </div>

        {/* Navigation Arrow: Right */}
        {hasMultiple && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-slate-900/80 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/20 flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 cursor-pointer"
            title="Próxima Foto (Seta Direita)"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnails Strip (if multiple photos) */}
      <div
        className="w-full max-w-4xl mx-auto z-10 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {hasMultiple ? (
          <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-900/90 rounded-2xl border border-white/10 shadow-xl max-w-full scrollbar-thin scrollbar-thumb-white/20">
            {imageList.map((thumbUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIsZoomed(false);
                  setCurrentIndex(idx);
                }}
                className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                  currentIndex === idx
                    ? 'border-amber-400 scale-105 shadow-lg ring-2 ring-amber-400/40'
                    : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                }`}
              >
                <img
                  src={thumbUrl}
                  alt={`Miniatura ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-white/50 text-center font-medium">
            💡 Dica: Clique na imagem para aproximar (Zoom) ou no botão Fechar / tecla ESC para voltar
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
