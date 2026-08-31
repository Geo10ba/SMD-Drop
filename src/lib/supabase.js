import { createClient } from '@supabase/supabase-js';

// Dynamic Credentials Retrieval (From localStorage or env vars)
export const getSupabaseCredentials = () => {
  if (typeof window === 'undefined') {
    return {
      url: import.meta.env?.VITE_SUPABASE_URL || '',
      key: import.meta.env?.VITE_SUPABASE_ANON_KEY || ''
    };
  }

  const customUrl = localStorage.getItem('smd_supabase_url');
  const customKey = localStorage.getItem('smd_supabase_anon_key');

  const envUrl = import.meta.env?.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

  const url = customUrl || envUrl || 'https://aghbrlihahygczzvxvim.supabase.co';
  const key = customKey || (envKey !== 'sua_anon_key_do_supabase_aqui' ? envKey : '');

  return { url, key };
};

// Initialize Supabase Client dynamically
export const getSupabaseClient = () => {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key || key === 'sua_anon_key_do_supabase_aqui') {
    return null;
  }
  try {
    return createClient(url, key);
  } catch (e) {
    console.warn('[Supabase Init Error]', e);
    return null;
  }
};

export const supabase = getSupabaseClient();

/**
 * Test connection to Supabase
 */
export const testSupabaseConnection = async (url, key) => {
  if (!url || !key) return { success: false, message: 'URL e Chave Anon são obrigatórias.' };
  try {
    const client = createClient(url, key);
    const { data, error } = await client.from('categories').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table missing or auth error
      if (error.message?.includes('JWT') || error.message?.includes('apiKey') || error.message?.includes('Invalid')) {
        return { success: false, message: `Erro de Autenticação: ${error.message}` };
      }
      return { success: true, message: `Conectado! (Aviso: ${error.message})` };
    }
    return { success: true, message: 'Conexão com Supabase efetuada com sucesso!' };
  } catch (err) {
    return { success: false, message: `Falha na conexão: ${err.message}` };
  }
};

/**
 * Save custom credentials to localStorage
 */
export const saveSupabaseCredentials = (url, key) => {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem('smd_supabase_url', url);
    else localStorage.removeItem('smd_supabase_url');

    if (key) localStorage.setItem('smd_supabase_anon_key', key);
    else localStorage.removeItem('smd_supabase_anon_key');
  }
};

/**
 * Sync single entity to Supabase (with fallback)
 */
export const syncToSupabase = async (tableName, data) => {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const { error } = await client.from(tableName).upsert(data);
    if (error) {
      console.warn(`[Supabase Sync Warning] ${tableName}:`, error.message);
    }
  } catch (err) {
    console.warn(`[Supabase Connection Exception] ${tableName}:`, err.message);
  }
};
