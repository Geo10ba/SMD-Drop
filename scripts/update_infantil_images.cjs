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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

function cleanTemu(u) {
  if (!u || typeof u !== 'string') return '';
  u = u.trim();
  if (u.includes('kwcdn.com') || u.includes('temu.com')) {
    u = u.replace(/_\d+x\d+\./i, '_1000x1000.');
    u = u.replace(/\/w\/\d+/i, '/w/1000');
    u = u.replace(/\/q\/\d+/i, '/q/90');
    u = u.replace(/\/format\/(avif|webp)/gi, '/format/jpeg');
    u = u.replace(/format=(avif|webp)/gi, 'format=jpeg');
  }
  return u;
}

async function run() {
  const { data } = await supabase.from('products').select('*').eq('id', 'prod-1793321681674');
  if (!data || !data[0]) {
    console.log('Produto não encontrado');
    return;
  }
  const p = data[0];
  console.log('Atualizando produto:', p.title);

  let desc = p.description || '';
  // Se houver metadata dentro da descrição
  if (desc.includes('<!--SMD_META:')) {
    const start = desc.indexOf('<!--SMD_META:');
    const end = desc.indexOf('-->', start);
    if (start !== -1 && end !== -1) {
      const metaJson = desc.substring(start + 13, end);
      try {
        const meta = JSON.parse(metaJson);
        if (Array.isArray(meta.images)) {
          meta.images = meta.images.map(cleanTemu);
          console.log('Novas imagens no meta:', meta.images);
        }
        desc = desc.substring(0, start) + '<!--SMD_META:' + JSON.stringify(meta) + '-->' + desc.substring(end + 3);
      } catch (e) {
        console.error('Error parsing meta:', e);
      }
    }
  }

  const newCover = cleanTemu(p.image_url || p.image);
  let newImgs = Array.isArray(p.images) ? p.images.map(cleanTemu) : [];

  const updatePayload = {
    description: desc,
    image_url: newCover
  };
  if (newImgs.length > 0) updatePayload.images = newImgs;

  const { error } = await supabase.from('products').update(updatePayload).eq('id', p.id);
  console.log('Resultado da atualização do relógio infantil:', error ? error.message : 'SUCESSO TOTAL!');
}

run();
