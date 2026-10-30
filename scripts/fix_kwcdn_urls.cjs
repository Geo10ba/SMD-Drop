const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

let env = {};
if (fs.existsSync('.env')) {
  fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Sem chaves Supabase');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  console.log('Total produtos no banco:', data?.length);
  const affected = data.filter(p => JSON.stringify(p).includes('kwcdn.com') || JSON.stringify(p).includes('avif'));
  console.log('Produtos com kwcdn/avif:', affected.length);
  
  for (const p of affected) {
    console.log('Produto:', p.id, p.title);
    let updated = false;
    let newImg = p.image;
    if (newImg && typeof newImg === 'string' && newImg.includes('kwcdn.com')) {
      newImg = newImg.replace(/\?imageView2.*$/i, '');
      updated = true;
    }
    let newImages = p.images;
    if (Array.isArray(newImages)) {
      newImages = newImages.map(img => typeof img === 'string' && img.includes('kwcdn.com') ? img.replace(/\?imageView2.*$/i, '') : img);
      updated = true;
    }
    let newMediaKit = p.media_kit || p.mediaKit;
    if (newMediaKit && Array.isArray(newMediaKit.photos)) {
      newMediaKit.photos = newMediaKit.photos.map(img => typeof img === 'string' && img.includes('kwcdn.com') ? img.replace(/\?imageView2.*$/i, '') : img);
      updated = true;
    }
    if (updated) {
      console.log('Atualizando produto:', p.id);
      const updatePayload = { image: newImg, images: newImages };
      if (p.media_kit) updatePayload.media_kit = newMediaKit;
      if (p.mediaKit) updatePayload.mediaKit = newMediaKit;
      const { error: upErr } = await supabase.from('products').update(updatePayload).eq('id', p.id);
      console.log('Resultado do update:', upErr ? upErr.message : 'SUCESSO');
    }
  }
}

run();
