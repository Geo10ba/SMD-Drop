import { getSupabaseClient } from '../lib/supabase';

export const apiService = {
  // --- USUÁRIOS & AUTENTICAÇÃO ---
  async loginUser(email, password) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
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
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
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
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) return data;
    }
    return null;
  },

  // --- MATÉRIAS-PRIMAS DA FÁBRICA ---
  async fetchMaterials() {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('materials')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) return data;
    }
    return null;
  },

  // --- PEDIDOS & EXPEDIÇÃO ---
  async submitOrder(orderData) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('orders')
        .insert([orderData])
        .select();

      if (error) throw error;
      return { success: true, orderId: data[0].id };
    }
    return { success: true, orderId: 'ORD-' + Date.now() };
  }
};
