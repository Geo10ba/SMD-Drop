/**
 * Utility to convert and sanitize product image URLs for 100% marketplace compatibility (Shopee, Mercado Livre, etc.)
 * - Replaces unsupported formats (AVIF, WebP) with high-definition JPEG/PNG.
 * - Upscales low-res thumbnails to 1000x1000px HD.
 */
export const convertMarketplaceImageToHdShopee = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let u = rawUrl.trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) return u;

  // Force HTTPS
  if (u.startsWith('http://')) {
    u = 'https://' + u.slice(7);
  }

  // 1. Temu / Kwcdn: Convert AVIF/WebP to HD JPEG (1000x1000, quality 90)
  if (u.includes('kwcdn.com') || u.includes('temu.com')) {
    u = u.replace(/_\d+x\d+\./i, '_1000x1000.');
    u = u.replace(/\/w\/\d+/i, '/w/1000');
    u = u.replace(/\/q\/\d+/i, '/q/90');
    u = u.replace(/\/format\/(avif|webp)/gi, '/format/jpeg');
    u = u.replace(/format=(avif|webp)/gi, 'format=jpeg');
  }

  // 2. Shopee / Susercontent: Convert thumbnails to 1080x1080 JPEG
  if (u.includes('susercontent.com') || u.includes('shopee.')) {
    u = u.replace(/_tn(\.jpg|\.webp)?$/i, '_1080x1080');
    u = u.replace(/_\d+x\d+(\.jpg|\.webp)?$/i, '_1080x1080');
    u = u.replace(/\.webp$/i, '.jpg');
  }

  // 3. Mercado Livre: Replace .webp with .jpg, ensure -O.jpg (Original HD)
  if (u.includes('mlstatic.com')) {
    u = u.replace(/-[I|V|O|E|C|D]\.(jpg|webp)/i, '-O.jpg');
    u = u.replace(/\.webp$/i, '.jpg');
  }

  // 4. AliExpress: Strip .webp and trailing webp indicators
  if (u.includes('alicdn.com') || u.includes('aliexpress')) {
    u = u.replace(/([._])webp(\?.*)?$/i, '$2').replace(/_\.webp$/i, '');
  }

  // 5. Amazon: Replace small crop with SL1500
  if (u.includes('amazon.com') || u.includes('media-amazon')) {
    u = u.replace(/\._AC_S[A-Z0-9_,]+\._/i, '._AC_SL1500_.');
  }

  // 6. Generic AVIF / WEBP in query params -> force jpeg
  if (/format[=/](avif|webp)/i.test(u)) {
    u = u.replace(/format[=/]avif/gi, 'format=jpeg').replace(/format[=/]webp/gi, 'format=jpeg');
  }

  return u;
};
