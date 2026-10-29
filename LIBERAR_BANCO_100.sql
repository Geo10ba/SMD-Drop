-- =============================================================================
-- SCRIPT OFICIAL: LIBERAÇÃO TOTAL DE ACESSO DO SISTEMA AO SUPABASE (RLS)
-- =============================================================================
-- Execute este script no SQL Editor do seu projeto Supabase:
-- Link direto: https://supabase.com/dashboard/project/aghbrlihahygczzvxvim/sql
--
-- Isso garante que:
-- 1. Qualquer pedido finalizado pelo revendedor salve 100% no banco de dados.
-- 2. Qualquer atualização de status, produto ou categoria salve no banco sem bloqueios.
-- =============================================================================

-- 1. Desabilita RLS para operação contínua e sem bloqueios no frontend
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallet_transactions DISABLE ROW LEVEL SECURITY;

-- 2. Concede permissões completas para as chaves pública (anon), autenticada e admin
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Confirmação
SELECT 'Banco de dados 100% liberado para o SMD Drop!' AS status;
