# LiveNexus

LiveNexus é uma plataforma completa e independente de agregação, controle e automação para streamers, integrando chats ao vivo de YouTube, Twitch e Kick, com suporte a Text-to-Speech (TTS), moderação inteligente, widgets e banco de dados documental próprio.

## Tecnologias

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend & APIs**: Middlewares nativos em Vite / Node.js
- **Persistência**: Estrutura documental com isolamento por usuário e controle de integridade (Johnson CRUDs)
- **Integrações de Transmissão**: WebSockets / IRC anônimo (Twitch), Pusher (Kick), InnerTube / Workers (YouTube)

## Como Executar Localmente

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm

### Instalação

```bash
npm install
```

### Desenvolvimento

Para iniciar o servidor local com hot reload e middlewares de API integrados:

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`.

### Verificação e Qualidade

- **Linting de código**:
  ```bash
  npm run lint
  ```

- **Verificação de tipos**:
  ```bash
  npm run typecheck
  ```

- **Build de produção**:
  ```bash
  npm run build
  ```

## Estrutura do Projeto

- `dashboard/`: Código-fonte da aplicação React, incluindo componentes, painel administrativo e conexões de plataforma.
- `dashboard/conexao/`: Módulos de conexão com canais, chat multi-plataforma e persistência.
- `dashboard/painel-admin/`: Painel administrativo com gerenciamento de tabelas e inspetor de banco de dados.
- `public/`: Arquivos estáticos públicos.
