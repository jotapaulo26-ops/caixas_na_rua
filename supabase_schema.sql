-- ==========================================================
-- SCHEMA SUPABASE: APP "CAIXAS NA RUA"
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

-- 2. Tabela de Clientes e Estabelecimentos
CREATE TABLE IF NOT EXISTS public.clients (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Movimentações (Entregas e Coletas)
CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGINT PRIMARY KEY,
    client_id BIGINT REFERENCES public.clients(id) ON DELETE CASCADE,
    crate_type_id BIGINT REFERENCES public.crate_types(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('DELIVERED', 'COLLECTED')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.crate_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público com Anon Key (Leitura e Escrita pelo App)
CREATE POLICY "Permitir leitura anonima de tipos de caixas" ON public.crate_types FOR SELECT USING (true);
CREATE POLICY "Permitir escrita anonima de tipos de caixas" ON public.crate_types FOR ALL USING (true);

CREATE POLICY "Permitir leitura anonima de clientes" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Permitir escrita anonima de clientes" ON public.clients FOR ALL USING (true);

CREATE POLICY "Permitir leitura anonima de movimentacoes" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Permitir escrita anonima de movimentacoes" ON public.transactions FOR ALL USING (true);
