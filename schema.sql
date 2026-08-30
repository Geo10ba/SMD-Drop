-- =============================================================================
-- BANCO DE DADOS: SMD DROP PLATAFORMA FABRIL & DROPSHIPPING
-- Compatibilidade: PostgreSQL / Supabase / MySQL
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

-- 7. TABELA DE CONFIGURAÇÕES DA FÁBRICA, RODAPÉ E JURÍDICO
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

-- INSERÇÃO INICIAL DO ADMINISTRADOR FÁBRICA
INSERT INTO users (id, name, email, phone, cnpj, role, status, tier)
VALUES ('admin-geovan', 'Geovan Calado (Admin Fábrica)', 'geovancalado@gmail.com', '(11) 98765-4321', '45.109.892/0001-99', 'admin', 'aprovado', 'VIP Gold')
ON CONFLICT (id) DO NOTHING;

-- INSERÇÃO INICIAL DOS MATERIAIS OFICIAIS (TABELA REAL DA EMPRESA)
INSERT INTO materials (id, name, wholesale_price_per_m2, suggested_price_per_m2, style, lead_time_days, description)
VALUES 
    ('mat-mdf-cru', 'MDF Cru', 530.00, 800.00, 'madeira', 2, 'Econômico / Básico para uso interno com acabamento natural.'),
    ('mat-pvc-branco', 'PVC Expandido (Branco)', 615.00, 950.00, 'prata', 2, 'Leve e resistente à umidade, ideal para letras e placas decorativas.'),
    ('mat-mdf-pvc-pintado', 'MDF ou PVC Pintado', 670.00, 1100.00, 'preto', 3, 'Personalizado com acabamento fosco ou brilhante e alta durabilidade.'),
    ('mat-acm', 'ACM (Alumínio Composto)', 670.00, 1000.00, 'prata', 3, 'Metálico e moderno, para fachadas, letreiros externos e painéis.'),
    ('mat-acrilico-luxo', 'Acrílico Premium (Luxo)', 920.00, 1380.00, 'dourado', 3, 'Corte a laser de alta precisão em acrílico cast nobre espelhado.')
ON CONFLICT (id) DO NOTHING;
