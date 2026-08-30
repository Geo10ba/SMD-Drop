import { createClient } from '@supabase/supabase-js';

// Supabase Credentials for Project aghbrlihahygczzvxvim
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://aghbrlihahygczzvxvim.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'sua_anon_key_do_supabase_aqui')
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const apiService = {
  // --- USUÁRIOS & AUTENTICAÇÃO ---
  async loginUser(email, password) {
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Usuário não encontrado');
      }
      return data;
    }
    return { success: true, email };
  },

  async registerUser(userData) {
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select();

      if (error) throw error;
      return data[0];
    }
    return { success: true, data: userData };
  },

  // --- CATÁLOGO & PRODUTOS ---
  async fetchProducts() {
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) return data;
    }
    return null; // Fallback para o estado local se ainda não houver dados no banco
  },

  // --- MATÉRIAS-PRIMAS DA FÁBRICA ---
  async fetchMaterials() {
    if (supabase) {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) return data;
    }
    return null;
  },

  // --- PEDIDOS & EXPEDIÇÃO ---
  async submitOrder(orderData) {
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select();

      if (error) throw error;
      return { success: true, orderId: data[0].id };
    }
    return { success: true, orderId: 'ORD-' + Date.now() };
  }
};
