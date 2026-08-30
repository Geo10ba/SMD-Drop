import { createClient } from '@supabase/supabase-js';

// Supabase Project URL & Anon Key
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://aghbrlihahygczzvxvim.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnaGJybGloYWh5Z2N6enZ4dmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMTcwNTAsImV4cCI6MjA1Njc5MzA1MH0.s_YjV_e4lK3Z6K-3J4Qv2R-4lG0L5V';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sync Local State to Supabase Table (with fallback)
 */
export const syncToSupabase = async (tableName, data) => {
  try {
    const { error } = await supabase.from(tableName).upsert(data);
    if (error) {
      console.warn(`[Supabase Sync Warning] ${tableName}:`, error.message);
    }
  } catch (err) {
    console.warn(`[Supabase Connection] ${tableName}:`, err.message);
  }
};
