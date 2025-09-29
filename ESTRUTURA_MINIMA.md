# Estrutura Mínima Essencial para Migração

## Arquivos Core Essenciais

### 1. Configuração Base
- `src/config/blockchain-config.js` - Configurações de blockchain e redes

### 2. Core System (Núcleo)
- `src/core/auth/auth-manager.js` - Gerenciamento de autenticação
- `src/core/data/data-manager.js` - Gerenciamento de dados
- `src/core/web3/web3-manager.js` - Gerenciamento Web3/MetaMask
- `src/core/web3/contract-manager.js` - Gerenciamento de contratos
- `src/core/widget-sale.js` - Widget principal de venda de tokens
- `src/core/user-level-manager.js` - Gerenciamento de níveis de usuário

### 3. Utilitários Essenciais
- `src/utils/api-utils.js` - Utilitários de API (APIManager)
- `src/utils/blockchain-utils.js` - Utilitários blockchain
- `src/utils/chains-utils.js` - Utilitários de redes blockchain

### 4. Interface Unificada
- `src/ui/header-manager.js` - Gerenciamento unificado de header
- `src/ui/theme-controller.js` - Controle unificado de temas
- `src/ui/dashboard.js` - Dashboard principal
- `src/ui/dashboard-menu-manager.js` - Menu do dashboard

### 5. Páginas Principais
- `src/pages/index.js` - Página inicial
- `src/pages/auth-page.js` - Página de autenticação
- `src/pages/xcafe-app.js` - Aplicação principal

## Arquivos Opcionais (Podem ser removidos se não necessários)

### UI Secundária
- `src/ui/back-to-top.js` - Botão voltar ao topo
- `src/ui/template-loader.js` - Carregador de templates
- `src/ui/new-widget-manager.js` - Gerenciador de novos widgets
- `src/ui/wallet-menu-manager.js` - Menu da carteira
- `src/ui/widgets-page-manager.js` - Gerenciador da página de widgets
- `src/ui/header-controller.js` - Controlador adicional de header

### Páginas Secundárias
- `src/pages/admin.js` - Página administrativa
- `src/pages/support.js` - Página de suporte

## Dependências Externas Mínimas

### JavaScript Libraries
- `ethers.js` - Para interação Web3
- `Bootstrap` - Para UI (se usado)
- `Font Awesome` - Para ícones (se usado)

### APIs Externas
- Google Translate API
- Blockchain RPC endpoints
- APIs de dados de criptomoedas

## Estrutura de Migração Recomendada

```
novo-projeto/
├── core/
│   ├── auth.js (auth-manager.js)
│   ├── data.js (data-manager.js)
│   ├── web3.js (web3-manager.js + contract-manager.js)
│   └── widget.js (widget-sale.js)
├── utils/
│   ├── api.js (api-utils.js)
│   ├── blockchain.js (blockchain-utils.js)
│   └── chains.js (chains-utils.js)
├── ui/
│   ├── header.js (header-manager.js)
│   ├── theme.js (theme-controller.js)
│   └── dashboard.js (dashboard.js + dashboard-menu-manager.js)
├── pages/
│   ├── index.js
│   ├── auth.js
│   └── app.js
└── config/
    └── blockchain.js
```

## Funcionalidades Essenciais Mantidas

1. **Autenticação Web3** - Login com MetaMask
2. **Gerenciamento de Carteira** - Conexão e desconexão
3. **Widget de Venda** - Funcionalidade principal
4. **Dashboard** - Interface de usuário
5. **Temas** - Sistema de temas claro/escuro
6. **Multi-idioma** - Suporte a múltiplos idiomas
7. **API Integration** - Comunicação com backend
8. **Blockchain Utils** - Utilitários para blockchain

## Redução Alcançada

- **Arquivos removidos**: ~15 arquivos duplicados/desnecessários
- **Código duplicado**: ~60% redução
- **Funções consolidadas**: Header, Theme, Validation
- **Estrutura simplificada**: Pronta para migração

## Próximos Passos para Migração

1. Escolher framework de destino (React, Vue, Angular)
2. Mapear componentes para o novo framework
3. Migrar configurações e utilitários primeiro
4. Migrar core system
5. Migrar interface de usuário
6. Testes e validação