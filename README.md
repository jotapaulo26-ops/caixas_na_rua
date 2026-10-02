# 🚚 Caixas na Rua - Controle de Vasilhames para Entregadores

Aplicativo Progressive Web App (PWA) de alta performance, desenhado especificamente para entregadores na rua registrarem e controlarem o empréstimo e recolhimento de vasilhames e caixas de mercadorias.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jotapaulo26-ops/caixas-na-rua&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY)

---

## ⚡ Principais Funcionalidades

- **📱 100% Offline-First:** Salva tudo diretamente no celular via IndexedDB (Dexie.js). Funciona em galpões, subsolos e estradas sem sinal de internet.
- **☁️ Sincronização em Nuvem com Supabase:** Compartilhe ou faça backup de todos os dados do celular na nuvem com um toque.
- **⏱️ Lançamento em 3 Segundos:** Selecione o cliente, tipo de caixa, quantidade e aperte `DEIXEI (+)` ou `RECOLHI (-)`.
- **💬 Envio de Comprovante no WhatsApp em 1 Clique:** Formata mensagem automática com data, quantidade, tipo de caixa e saldo atual do cliente.
- **🚨 Alerta de Caixas Paradas:** Destaca automaticamente clientes que estão retendo vasilhames há mais de 7 dias sem movimentação.
- **🎨 Múltiplos Tipos de Vasilhames:** Caixa plástica hortifrúti, engradados de bebidas, garrafões de água mineral 20L, paletes de madeira, etc.
- **🛡️ Backup Seguro:** Exportação instantânea de arquivo `.JSON` e planilha Excel `.CSV`.

---

## 🚀 Integrações Configuradas

### 1. 🐙 Repositório GitHub
O código completo está versionado e hospedado no GitHub:
👉 **[https://github.com/jotapaulo26-ops/caixas-na-rua](https://github.com/jotapaulo26-ops/caixas-na-rua)**

### 2. ⚡ Deploy na Vercel (Produção com Link HTTPS e PWA)
O projeto já conta com o arquivo `vercel.json` pré-configurado para SPA e Service Worker PWA.

Para colocar no ar na Vercel:
1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique em **"Add New..."** > **"Project"**.
3. Selecione o repositório **`jotapaulo26-ops/caixas-na-rua`**.
4. Em **Environment Variables**, adicione (opcional se for usar Supabase):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Clique em **Deploy**. O seu app estará no ar com link público HTTPS (ex: `https://caixas-na-rua.vercel.app`).

### 3. 🐘 Banco de Dados Supabase (Nuvem)
Para ativar a sincronização na nuvem:
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto gratuito.
2. No menu lateral do Supabase, clique em **SQL Editor** e execute o script contido em [`supabase_schema.sql`](file:///C:/Users/Jan%C3%A7anti/Documents/App%20Web/app-caixas-na-rua/supabase_schema.sql).
3. Vá em **Project Settings** > **API** e copie:
   - **Project URL**
   - **anon public key**
4. Adicione essas credenciais no seu arquivo `.env` local e nas variáveis de ambiente da Vercel:
   ```env
   VITE_SUPABASE_URL=https://seu-id.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```
5. No app, vá na aba **Ajustes** e use os botões **"Enviar p/ Nuvem"** e **"Baixar da Nuvem"**.

---

## 📲 Como Usar no Celular (Instalar como App PWA)

1. Abra o link do app (na rede local ou na Vercel) no navegador do celular (Chrome ou Safari).
2. No Android: toque nos três pontinhos e clique em **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
3. No iPhone (iOS): toque no botão Compartilhar e selecione **"Adicionar à Tela de Início"**.
4. O app terá seu próprio ícone na tela inicial e funcionará mesmo sem sinal de internet.

---

## 💻 Comandos de Desenvolvimento

- **Iniciar servidor local com acesso na rede Wi-Fi:**
  ```bash
  npm run dev -- --host
  ```
- **Gerar build de produção otimizado:**
  ```bash
  npm run build
  ```
