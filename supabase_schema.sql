-- ==========================================================
-- SCHEMA SUPABASE: APP "CAIXAS NA RUA" (v2.0)
-- Cole este script no "SQL Editor" do seu painel Supabase
-- ==========================================================

-- 1. Tabela de Tipos de Vasilhames e Caixas
CREATE TABLE IF NOT EXISTS public.crate_types (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#22c55e',
    unit_value NUMERIC(10,2) DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Entregadores / Usuários
CREATE TABLE IF NOT EXISTS public.drivers (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Clientes e Estabelecimentos
CREATE TABLE IF NOT EXISTS public.clients (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Movimentações (Entregas e Coletas com Entregador)
CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGINT PRIMARY KEY,
    client_id BIGINT REFERENCES public.clients(id) ON DELETE CASCADE,
    crate_type_id BIGINT REFERENCES public.crate_types(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('DELIVERED', 'COLLECTED')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    driver_id BIGINT,
    driver_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Ponto de Devolução (Descargas na Base / Galpão Central)
CREATE TABLE IF NOT EXISTS public.hub_returns (
    id BIGINT PRIMARY KEY,
    driver_id BIGINT,
    driver_name TEXT,
    crate_type_id BIGINT REFERENCES public.crate_types(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.crate_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_returns ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público com Anon Key
CREATE POLICY "Permissao tipos de caixas" ON public.crate_types FOR ALL USING (true);
CREATE POLICY "Permissao entregadores" ON public.drivers FOR ALL USING (true);
CREATE POLICY "Permissao clientes" ON public.clients FOR ALL USING (true);
CREATE POLICY "Permissao movimentacoes" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Permissao ponto devolucao" ON public.hub_returns FOR ALL USING (true);
