/**
 * Utilitário para captura e parsing de dados de bookmarklet/URL na inicialização
 */
export const getInitialBookmarkletData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('magic') === '1' || params.get('auto') === '1' || params.get('title')) {
      const title = params.get('title') || '';
      const desc = params.get('desc') || '';
      const img = params.get('img') || '';
      const imgsParam = params.get('imgs') || '';
      const video = params.get('video') || '';
      const priceStr = params.get('price') || '';
      const price = priceStr ? parseFloat(priceStr) : 120;

      let imagesList = [];
      if (imgsParam) {
        try {
          if (imgsParam.startsWith('[')) {
            imagesList = JSON.parse(imgsParam);
          } else {
            imagesList = imgsParam.split('|||').map((u) => u.trim()).filter(Boolean);
          }
        } catch (e) {}
      }
      if (imagesList.length === 0 && img) {
        imagesList = [img];
      }

      return {
        title: title || 'Produto Capturado Mágico',
        description: desc || (title ? `Produto ${title} fabricado em material nobre com corte a laser.` : 'Descrição importada do anúncio.'),
        image: imagesList[0] || img || 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80',
        images: imagesList,
        video: video || '',
        suggestedRetailPrice: price || 120,
        wholesalePrice: Math.round((price || 120) * 0.45)
      };
    }
  } catch (e) {
    console.error('Error parsing query params:', e);
  }
  return null;
};
