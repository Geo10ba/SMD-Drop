const { createClient } = require('@supabase/supabase-js');

const url = 'https://aghbrlihahygczzvxvim.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnaGJybGloYWh5Z2N6enZ4dmltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA0NDI0MiwiZXhwIjoyMTAzNjIwMjQyfQ.hTGOtHK2a6ZZwR-iIVf263Wve1TyGlPpowoTAfX74LQ';

const client = createClient(url, key);

async function fixStatuses() {
  const { data: allProds, error: fetchErr } = await client.from('products').select('id, title, status');
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }

  console.log('Total products in Supabase:', allProds.length);

  const initialIds = new Set(['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5']);

  const toRascunho = allProds.filter(p => !initialIds.has(p.id));
  const toApproved = allProds.filter(p => initialIds.has(p.id));

  console.log('Products to set as rascunho:', toRascunho.length);
  console.log('Products to set as approved:', toApproved.length);

  // Update in chunks of 50
  for (let i = 0; i < toRascunho.length; i += 50) {
    const chunk = toRascunho.slice(i, i + 50);
    const ids = chunk.map(p => p.id);
    const { error } = await client.from('products').update({ status: 'rascunho' }).in('id', ids);
    if (error) console.error('Rascunho update error:', error.message);
  }

  for (const p of toApproved) {
    await client.from('products').update({ status: 'approved' }).eq('id', p.id);
  }

  const { data: finalData } = await client.from('products').select('id, title, status');
  const appCount = finalData.filter(p => p.status === 'approved').length;
  const rasCount = finalData.filter(p => p.status === 'rascunho').length;

  console.log('--- FINAL STATUS COUNT IN SUPABASE ---');
  console.log('Approved (Ativos no Catálogo Oficial):', appCount);
  console.log('Rascunhos (Na Aba Rascunhos para Edição e Ativação):', rasCount);
}

fixStatuses();
