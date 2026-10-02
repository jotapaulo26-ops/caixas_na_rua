# 🚚 Caixas na Rua - Controle de Vasilhames para Entregadores (v2.0)

Aplicativo Progressive Web App (PWA) de alta performance, desenhado especificamente para entregadores na rua registrarem e controlarem o empréstimo e recolhimento de vasilhames e caixas de mercadorias.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jotapaulo26-ops/caixas_na_rua&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY)

---

## ⚡ Principais Funcionalidades

- **👤 Gestão de Múltiplos Entregadores (Login & Cadastro):** Identifica exatamente qual entregador deixou ou recolheu os itens em cada parada. Cadastro simples em 10 segundos com Nome, WhatsApp e Senha.
- **🏢 Ponto de Devolução (Galpão Central / Base):** Tela dedicada para registrar a descarga das caixas recolhidas pelo entregador ao retornar à base, mantendo o controle do estoque de vasilhames na empresa.
- **📱 100% Offline-First:** Salva tudo diretamente no celular via IndexedDB (Dexie.js). Funciona perfeitamente sem sinal de internet em galpões, estradas e subsolos.
- **☁️ Sincronização em Nuvem Automática (Supabase):** Envia movimentações, cadastros e descargas silenciosamente em segundo plano assim que houver conexão.
- **⏱️ Lançamento Rápido em 3 Segundos:** Selecione o cliente, tipo de caixa em lista (com criação instantânea de categorias), quantidade e aperte `DEIXEI (+)` ou `RECOLHI (-)`.
- **💬 Comprovante com Identificação no WhatsApp:** Formata mensagem automática com data, quantidade, tipo de caixa, saldo do cliente e nome do entregador responsável.
- **🚨 Alerta de Caixas Paradas:** Destaca automaticamente clientes com vasilhames retidos há mais de 7 dias sem giro.
- **🛡️ Backup Seguro:** Exportação instantânea de arquivo `.JSON` e planilha Excel `.CSV`.

---

## 🚀 Integrações

### 1. 🐙 Repositório GitHub
👉 **[https://github.com/jotapaulo26-ops/caixas_na_rua](https://github.com/jotapaulo26-ops/caixas_na_rua)**

### 2. ⚡ Deploy na Vercel (Produção com Link HTTPS e PWA)
- Arquivo `vercel.json` pré-configurado para SPA e cache do Service Worker.
- Deploy contínuo ativado automaticamente ao vincular o repositório na [vercel.com](https://vercel.com).

### 3. 🐘 Banco de Dados Supabase (Projeto "coletor de caixas")
1. Acesse seu projeto no painel do Supabase.
2. Abra o **SQL Editor** e execute o script [`supabase_schema.sql`](file:///C:/Users/Jan%C3%A7anti/Documents/App%20Web/app-caixas-na-rua/supabase_schema.sql) (versão 2.0 com suporte a entregadores e ponto de devolução).
3. Conecte diretamente pela aba **Ajustes** no app colando a Project URL e Anon Key!

---

## 📲 Como Usar no Celular (Instalar como App PWA)

1. Acesse o link no navegador do celular (Chrome ou Safari).
2. No Android: toque no menu e selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
3. No iPhone (iOS): toque no botão Compartilhar e escolha **"Adicionar à Tela de Início"**.
