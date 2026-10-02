# 🚚 Caixas na Rua - Controle de Vasilhames para Entregadores

Aplicativo web progressivo (PWA) de alta performance, desenhado especificamente para entregadores na rua registrarem e controlarem o empréstimo e recolhimento de vasilhames e caixas plásticas de mercadorias.

---

## ⚡ Principais Funcionalidades

- **📱 100% Offline-First:** Salva tudo diretamente na memória do aparelho via IndexedDB (Dexie.js). Funciona em galpões, subsolos e estradas sem sinal de internet.
- **⏱️ Lançamento em 3 Segundos:** Selecione o cliente, tipo de caixa, quantidade e aperte `DEIXEI (+)` ou `RECOLHI (-)`.
- **💬 Envio de Comprovante no WhatsApp em 1 Clique:** Formata mensagem automática com data, quantidade, tipo de caixa e saldo atual do cliente.
- **🚨 Alerta de Caixas Paradas:** Destaca automaticamente clientes que estão retendo vasilhames há mais de 7, 15 ou 30 dias sem movimentação.
- **🎨 Múltiplos Tipos de Vasilhames:** Caixa plástica hortifrúti, engradados de bebidas, garrafões de água mineral 20L, paletes de madeira, etc.
- **🛡️ Backup Seguro:** Exportação instantânea de arquivo `.JSON` e relatório em planilha Excel `.CSV`.

---

## 📲 Como Usar no Celular (Instalar como App)

1. Com o celular conectado na mesma rede Wi-Fi do computador, abra o navegador do celular e acesse:
   ```
   http://192.168.1.14:5173/
   ```
2. No Chrome do Android: toque no menu (três pontinhos) e selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
3. No Safari do iPhone: toque no botão **Compartilhar** (quadrado com seta para cima) e escolha **"Adicionar à Tela de Início"**.
4. O app terá seu próprio ícone na tela do celular e abrirá em tela cheia como se fosse um app da loja, funcionando inclusive sem internet.

---

## 💻 Comandos Úteis

- **Iniciar servidor de desenvolvimento:**
  ```bash
  npm run dev -- --host
  ```
- **Gerar versão de produção (PWA):**
  ```bash
  npm run build
  ```
