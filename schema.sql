-- =============================================================================
-- BANCO DE DADOS: SMD DROP PLATAFORMA FABRIL & DROPSHIPPING
-- Compatibilidade: PostgreSQL / Supabase
-- =============================================================================

-- 1. TABELA DE USUÁRIOS E REVENDEDORES
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    phone VARCHAR(32) NOT NULL,
    cnpj VARCHAR(32) NOT NULL,
    role VARCHAR(32) DEFAULT 'reseller', -- 'reseller' ou 'admin'
    status VARCHAR(32) DEFAULT 'aprovado', -- 'aprovado', 'pendente', 'bloqueado'
    tier VARCHAR(32) DEFAULT 'Bronze', -- 'Bronze', 'Prata', 'VIP Gold'
    discount_percent NUMERIC(5,2) DEFAULT 0.00,
    wallet_balance NUMERIC(10,2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    total_spent NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE CATEGORIAS DE PRODUTOS
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE MATÉRIAS-PRIMAS DA FÁBRICA (R$/m²)
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    factory_cost_per_m2 NUMERIC(10,2) NOT NULL DEFAULT 180.00, -- Custo de Produção da Fábrica (Matéria-prima + Mão de Obra) [EXCLUSIVO ADMIN]
    wholesale_price_per_m2 NUMERIC(10,2) NOT NULL, -- Valor Atacado pago pelo revendedor à fábrica
    suggested_price_per_m2 NUMERIC(10,2) NOT NULL, -- Valor sugerido de venda ao cliente final
    style VARCHAR(64) DEFAULT 'dourado', -- 'dourado', 'prata', 'rose', 'preto', 'madeira', 'neon_yellow', 'neon_blue'
    lead_time_days INT DEFAULT 3,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE PRODUTOS DO CATÁLOGO OFICIAL DA FÁBRICA
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category_name VARCHAR(255) REFERENCES categories(name) ON UPDATE CASCADE ON DELETE SET NULL,
    pricing_type VARCHAR(32) DEFAULT 'fixed', -- 'fixed' ou 'custom_m2'
    wholesale_price NUMERIC(10,2) DEFAULT 0.00,
    suggested_retail_price NUMERIC(10,2) DEFAULT 0.00,
    factory_stock INT DEFAULT 100,
    price_per_m2 NUMERIC(10,2) DEFAULT 0.00,
    suggested_price_per_m2 NUMERIC(10,2) DEFAULT 0.00,
    min_width INT DEFAULT 20,
    max_width INT DEFAULT 300,
    min_height INT DEFAULT 20,
    max_height INT DEFAULT 200,
    lead_time_days INT DEFAULT 3,
    description TEXT,
    image_url TEXT,
    ncm VARCHAR(32) DEFAULT '3926.90.90',
    ean VARCHAR(32),
    status VARCHAR(32) DEFAULT 'approved', -- 'approved', 'pending_approval'
    reseller_email VARCHAR(255),
    variations JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    dimensions JSONB DEFAULT '{"width":0,"height":0,"depth":0}'::jsonb,
    weight_kg NUMERIC(8,3) DEFAULT 0.500,
    cest VARCHAR(32),
    measure_unit VARCHAR(32) DEFAULT 'UN (UNIDADE)',
    cfop_same VARCHAR(16) DEFAULT '5101',
    cfop_diff VARCHAR(16) DEFAULT '6101',
    csosn VARCHAR(128) DEFAULT '102 - Tributada pelo Simples Nacional sem permissão de crédito',
    origin VARCHAR(128) DEFAULT '0 - Nacional, exceto as indicadas nos códigos 3 a 5',
    shopee_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE PEDIDOS DA EXPEDIÇÃO FÁBRICA
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    reseller_name VARCHAR(255) NOT NULL,
    reseller_email VARCHAR(255) NOT NULL,
    dispatch_mode VARCHAR(64) NOT NULL, -- 'marketplace_label' ou 'direct_blind'
    marketplace VARCHAR(64), -- 'Mercado Livre', 'Shopee', 'Amazon'
    label_pdf_url TEXT,
    vector_file_url TEXT,
    customer_name VARCHAR(255) NOT NULL,
    customer_cpf VARCHAR(32),
    customer_address TEXT NOT NULL,
    customer_city VARCHAR(128) NOT NULL,
    customer_state VARCHAR(8) NOT NULL,
    customer_zip VARCHAR(16) NOT NULL,
    wholesale_total NUMERIC(10,2) NOT NULL,
    shipping_total NUMERIC(10,2) DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL,
    status VARCHAR(64) DEFAULT 'aguardando_impressao', -- 'aguardando_impressao', 'em_producao', 'despachado', 'entregue'
    tracking_code VARCHAR(64),
    payment_method VARCHAR(64) DEFAULT 'pix',
    mercado_pago_fee NUMERIC(10,2) DEFAULT 0.00,
    items JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABELA DE ITENS DOS PEDIDOS (SOB MEDIDA / FIXO)
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    pricing_type VARCHAR(32) NOT NULL,
    material_name VARCHAR(255),
    width_cm NUMERIC(8,2),
    height_cm NUMERIC(8,2),
    calculated_m2 NUMERIC(8,3),
    unit_wholesale_price NUMERIC(10,2) NOT NULL,
    suggested_retail_price NUMERIC(10,2) NOT NULL,
    custom_selling_price NUMERIC(10,2),
    finish_option VARCHAR(255),
    vector_file_url TEXT,
    quantity INT DEFAULT 1
);

-- 7. TABELA DE TRANSAÇÕES DA CARTEIRA PRÉ-PAGA (EXTRATO / WALLET)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    reseller_email VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL, -- 'credit' ou 'debit'
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    reference_order_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABELA DE CONFIGURAÇÕES DA FÁBRICA, RODAPÉ E JURÍDICO
CREATE TABLE IF NOT EXISTS company_settings (
    id INT PRIMARY KEY DEFAULT 1,
    name VARCHAR(255) DEFAULT 'SMD DROP PRODUTOS PERSONALIZADOS',
    cnpj VARCHAR(32) DEFAULT '45.109.892/0001-99',
    phone VARCHAR(32) DEFAULT '(11) 98765-4321',
    email VARCHAR(255) DEFAULT 'geovancalado@gmail.com',
    address TEXT DEFAULT 'Rua Fabril do Acrílico, 500 - Distrito Industrial',
    city VARCHAR(128) DEFAULT 'São Paulo',
    state VARCHAR(8) DEFAULT 'SP',
    zip VARCHAR(16) DEFAULT '01310-200',
    pix_key VARCHAR(255) DEFAULT '45.109.892/0001-99',
    my_sites JSONB,
    social_links JSONB,
    legal_terms TEXT,
    legal_privacy TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INSERÇÕES BÁSICAS INICIAIS
-- =============================================================================

INSERT INTO users (id, name, email, phone, cnpj, role, status, tier)
VALUES ('admin-geovan', 'Geovan Calado (Admin Fábrica)', 'geovancalado@gmail.com', '(11) 98765-4321', '45.109.892/0001-99', 'admin', 'aprovado', 'VIP Gold')
ON CONFLICT (id) DO NOTHING;

INSERT INTO materials (id, name, factory_cost_per_m2, wholesale_price_per_m2, suggested_price_per_m2, style, lead_time_days, description)
VALUES 
    ('mat-mdf-cru', 'MDF Cru', 35.00, 85.00, 180.00, 'madeira', 2, 'Econômico / Básico para uso interno com acabamento natural.'),
    ('mat-pvc-branco', 'PVC Expandido (Branco)', 55.00, 140.00, 290.00, 'prata', 2, 'Leve e resistente à umidade, ideal para letras e placas decorativas.'),
    ('mat-mdf-pvc-pintado', 'MDF ou PVC Pintado', 65.00, 160.00, 340.00, 'preto', 3, 'Personalizado com acabamento fosco ou brilhante e alta durabilidade.'),
    ('mat-acm', 'ACM (Alumínio Composto)', 85.00, 195.00, 390.00, 'prata', 3, 'Metálico e moderno, para fachadas, letreiros externos e painéis.'),
    ('mat-acrilico-luxo', 'Acrílico Premium (Luxo)', 130.00, 280.00, 590.00, 'dourado', 3, 'Corte a laser de alta precisão em acrílico cast nobre espelhado.')
ON CONFLICT (id) DO UPDATE SET
    factory_cost_per_m2 = EXCLUDED.factory_cost_per_m2,
    wholesale_price_per_m2 = EXCLUDED.wholesale_price_per_m2,
    suggested_price_per_m2 = EXCLUDED.suggested_price_per_m2;

-- =============================================================================
-- ÍNDICES DE ALTA PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_reseller_email ON orders(reseller_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_name);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_reseller ON wallet_transactions(reseller_email);

-- =============================================================================
-- STORAGE BUCKETS (ARQUIVOS, ETIQUETAS E VETORES LASER)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('labels', 'labels', true, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'text/plain']),
  ('vectors', 'vectors', true, 52428800, ARRAY['application/pdf', 'image/svg+xml', 'application/postscript', 'application/illustrator', 'image/x-dxf', 'application/octet-stream', 'application/zip']),
  ('product-images', 'product-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- =============================================================================
-- POLÍTICAS DE SEGURANÇA AVANÇADA: ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- 1. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 2. FUNÇÃO AUXILIAR: VERIFICA SE O USUÁRIO LOGADO É ADMIN DA FÁBRICA
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        (auth.jwt() ->> 'email') = 'geovancalado@gmail.com'
        OR EXISTS (
            SELECT 1 FROM users
            WHERE (id = auth.uid()::text OR email = (auth.jwt() ->> 'email'))
            AND role = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. POLÍTICAS PARA A TABELA: USERS
DROP POLICY IF EXISTS "users_read_policy" ON users;
CREATE POLICY "users_read_policy" ON users
    FOR SELECT
    USING (
        id = auth.uid()::text 
        OR email = (auth.jwt() ->> 'email')
        OR is_admin()
        OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "users_insert_policy" ON users;
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "users_update_policy" ON users;
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE
    USING (
        id = auth.uid()::text 
        OR email = (auth.jwt() ->> 'email') 
        OR is_admin()
    );

DROP POLICY IF EXISTS "users_delete_policy" ON users;
CREATE POLICY "users_delete_policy" ON users
    FOR DELETE
    USING (is_admin());

-- 4. POLÍTICAS PARA A TABELA: PRODUCTS
DROP POLICY IF EXISTS "products_select_policy" ON products;
CREATE POLICY "products_select_policy" ON products
    FOR SELECT
    USING (status = 'approved' OR is_admin());

DROP POLICY IF EXISTS "products_insert_policy" ON products;
CREATE POLICY "products_insert_policy" ON products
    FOR INSERT
    WITH CHECK (
        is_admin() 
        OR status = 'pending_approval'
    );

DROP POLICY IF EXISTS "products_admin_modify_policy" ON products;
CREATE POLICY "products_admin_modify_policy" ON products
    FOR ALL
    USING (is_admin());

-- 5. POLÍTICAS PARA A TABELA: ORDERS (PEDIDOS & EXPEDIÇÃO)
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
CREATE POLICY "orders_select_policy" ON orders
    FOR SELECT
    USING (
        reseller_email = (auth.jwt() ->> 'email')
        OR user_id = auth.uid()::text
        OR is_admin()
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
CREATE POLICY "orders_insert_policy" ON orders
    FOR INSERT
    WITH CHECK (
        reseller_email = (auth.jwt() ->> 'email')
        OR user_id = auth.uid()::text
        OR is_admin()
        OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "orders_update_policy" ON orders;
CREATE POLICY "orders_update_policy" ON orders
    FOR UPDATE
    USING (is_admin() OR auth.role() = 'service_role');

-- 6. POLÍTICAS PARA: ORDER_ITEMS
DROP POLICY IF EXISTS "order_items_policy" ON order_items;
CREATE POLICY "order_items_policy" ON order_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND (
                orders.reseller_email = (auth.jwt() ->> 'email')
                OR orders.user_id = auth.uid()::text
                OR is_admin()
                OR auth.role() = 'anon'
            )
        )
    );

-- 7. POLÍTICAS PARA: WALLET_TRANSACTIONS
DROP POLICY IF EXISTS "wallet_tx_select_policy" ON wallet_transactions;
CREATE POLICY "wallet_tx_select_policy" ON wallet_transactions
    FOR SELECT
    TO public
    USING (
        reseller_email = COALESCE(auth.jwt() ->> 'email', '')
        OR is_admin()
    );

DROP POLICY IF EXISTS "wallet_tx_insert_policy" ON wallet_transactions;
CREATE POLICY "wallet_tx_insert_policy" ON wallet_transactions
    FOR INSERT
    TO public
    WITH CHECK (true);

-- 8. POLÍTICAS PARA: CATEGORIES & MATERIALS
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
CREATE POLICY "categories_select_policy" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_admin_policy" ON categories;
CREATE POLICY "categories_admin_policy" ON categories FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "materials_select_policy" ON materials;
CREATE POLICY "materials_select_policy" ON materials FOR SELECT USING (true);
DROP POLICY IF EXISTS "materials_admin_policy" ON materials;
CREATE POLICY "materials_admin_policy" ON materials FOR ALL USING (is_admin());

-- 9. POLÍTICAS PARA: COMPANY_SETTINGS
DROP POLICY IF EXISTS "company_settings_select_policy" ON company_settings;
CREATE POLICY "company_settings_select_policy" ON company_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "company_settings_admin_policy" ON company_settings;
CREATE POLICY "company_settings_admin_policy" ON company_settings FOR ALL USING (is_admin());

-- 10. POLÍTICAS PARA STORAGE DE OBJETOS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access SMD Drop'
  ) THEN
    CREATE POLICY "Public Access SMD Drop" ON storage.objects
      FOR SELECT TO public USING (bucket_id IN ('labels', 'vectors', 'product-images'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Uploads SMD Drop'
  ) THEN
    CREATE POLICY "Allow Uploads SMD Drop" ON storage.objects
      FOR INSERT TO public WITH CHECK (bucket_id IN ('labels', 'vectors', 'product-images'));
  END IF;
END $$;
