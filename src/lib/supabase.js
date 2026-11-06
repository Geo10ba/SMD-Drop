import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://aghbrlihahygczzvxvim.supabase.co';
// Chave Pública Anon (Segura para Frontend com RLS habilitado)
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnaGJybGloYWh5Z2N6enZ4dmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNDQyNDIsImV4cCI6MjEwMzYyMDI0Mn0.cYqQZVGdkcQYo4Hx_cwvFZafZ0Qf5UDqNEZH6T9roVc';

// Dynamic Credentials Retrieval (From localStorage, env vars, or default active service key)
export const getSupabaseCredentials = () => {
  let customUrl = typeof window !== 'undefined' ? localStorage.getItem('smd_supabase_url') : null;
  let customKey = typeof window !== 'undefined' ? localStorage.getItem('smd_supabase_anon_key') : null;

  // Auto-clean stale or expired credentials stored in localStorage
  if (typeof window !== 'undefined' && customKey) {
    if (customKey.includes('1740216255') || customKey.includes('sua_anon_key') || customKey.includes('XgJ2Wnpk')) {
      localStorage.removeItem('smd_supabase_anon_key');
      customKey = null;
    }
  }

  const envUrl = import.meta.env?.VITE_SUPABASE_URL;

  const isValidUrl = (u) => u && typeof u === 'string' && u.startsWith('https://') && u.includes('.supabase.');
  const isValidKey = (k) => k && typeof k === 'string' && k.length > 30 && !k.includes('sua_anon_key') && !k.includes('1740216255');

  const url = isValidUrl(customUrl) ? customUrl : (isValidUrl(envUrl) ? envUrl : DEFAULT_SUPABASE_URL);
  const key = isValidKey(customKey) ? customKey : DEFAULT_SUPABASE_KEY;

  return { url, key };
};

// Cached Singleton Supabase Client to avoid multiple GoTrueClient instances
let cachedClient = null;
let cachedUrl = null;
let cachedKey = null;

export const getSupabaseClient = () => {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return null;
  }
  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }
  try {
    cachedClient = createClient(url, key);
    cachedUrl = url;
    cachedKey = key;
    return cachedClient;
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
    const { data, error } = await client.from('products').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
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
  cachedClient = null;
  cachedUrl = null;
  cachedKey = null;
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

/**
 * Cadastra novo usuário no Supabase Auth + Tabela users
 */
export const signUpWithSupabase = async ({ email, password, metadata = {} }) => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase não inicializado' };

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const authUser = data?.user;
    if (authUser) {
      // Upsert profile in 'users' table
      const profileData = {
        id: authUser.id,
        email: authUser.email,
        name: metadata.storeName || metadata.name || authUser.email.split('@')[0],
        phone: metadata.phone || '',
        cnpj: metadata.cnpj || '',
        role: metadata.role || (authUser.email.toLowerCase() === 'geovancalado@gmail.com' ? 'admin' : 'reseller'),
        status: 'aprovado',
        tier: metadata.tier || 'Bronze',
        wallet_balance: metadata.wallet_balance || 0
      };

      await client.from('users').upsert(profileData, { onConflict: 'id' }).catch(() => {});

      return {
        success: true,
        user: {
          ...profileData,
          walletBalance: profileData.wallet_balance
        },
        session: data.session
      };
    }

    return { success: true, user: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Autentica usuário com E-mail e Senha no Supabase Auth
 */
export const signInWithSupabase = async ({ email, password }) => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase não inicializado' };

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const authUser = data?.user;
    if (authUser) {
      let profile = null;
      try {
        const { data: userRow } = await client.from('users').select('*').eq('id', authUser.id).maybeSingle();
        if (userRow) profile = userRow;
      } catch (e) {}

      if (!profile) {
        try {
          const { data: userRowEmail } = await client.from('users').select('*').eq('email', authUser.email).maybeSingle();
          if (userRowEmail) profile = userRowEmail;
        } catch (e) {}
      }

      const mergedUser = {
        id: authUser.id,
        email: authUser.email,
        name: profile?.name || authUser.user_metadata?.storeName || authUser.user_metadata?.name || authUser.email.split('@')[0],
        phone: profile?.phone || authUser.user_metadata?.phone || '',
        cnpj: profile?.cnpj || authUser.user_metadata?.cnpj || '',
        role: profile?.role || (authUser.email.toLowerCase() === 'geovancalado@gmail.com' ? 'admin' : 'reseller'),
        status: profile?.status || 'aprovado',
        tier: profile?.tier || 'Bronze',
        walletBalance: Number(profile?.wallet_balance ?? 0)
      };

      return {
        success: true,
        user: mergedUser,
        session: data.session
      };
    }

    return { success: false, error: 'Usuário não retornado pelo provedor.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Encerra sessão do Supabase Auth
 */
export const signOutWithSupabase = async () => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.auth.signOut();
  } catch (e) {}
};

/**
 * Obtém sessão e perfil ativo do Supabase
 */
export const getCurrentSupabaseUser = async () => {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) return null;

    const authUser = session.user;
    let profile = null;
    try {
      const { data: userRow } = await client.from('users').select('*').eq('id', authUser.id).maybeSingle();
      if (userRow) profile = userRow;
    } catch (e) {}

    return {
      id: authUser.id,
      email: authUser.email,
      name: profile?.name || authUser.user_metadata?.storeName || authUser.email.split('@')[0],
      phone: profile?.phone || '',
      cnpj: profile?.cnpj || '',
      role: profile?.role || (authUser.email.toLowerCase() === 'geovancalado@gmail.com' ? 'admin' : 'reseller'),
      status: profile?.status || 'aprovado',
      tier: profile?.tier || 'Bronze',
      walletBalance: Number(profile?.wallet_balance ?? 0)
    };
  } catch (e) {
    return null;
  }
};

/**
 * Inscreve no canal Realtime do Supabase para a tabela de pedidos (orders)
 */
export const subscribeToRealtimeOrders = (onOrderChange) => {
  const client = getSupabaseClient();
  if (!client || typeof onOrderChange !== 'function') return () => {};

  try {
    const channel = client
      .channel('realtime_orders_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          onOrderChange(payload);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (e) {
    console.warn('[Realtime Subscription Exception]:', e.message);
    return () => {};
  }
};
