#!/usr/bin/env node
/**
 * ================================================================================
 * SETUP SCRIPT - Script de Configuração Inicial
 * ================================================================================
 * Configura o ambiente e dependências necessárias para executar o projeto
 * ================================================================================
 */

const fs = require('fs');
const path = require('path');

console.log(`
================================================================================
🚀 XCAFE WIDGET SAAS - CONFIGURAÇÃO INICIAL
================================================================================
`);

// Verificar se os diretórios necessários existem
const requiredDirs = [
    'data',
    'src/config',
    'src/core',
    'src/ui',
    'src/utils',
    'src/pages',
    'css'
];

console.log('📁 Verificando estrutura de diretórios...');
requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Diretório criado: ${dir}`);
    } else {
        console.log(`✅ Diretório existe: ${dir}`);
    }
});

// Criar arquivo .env se não existir
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    const envContent = `# XCafe Widget SaaS - Configurações
PORT=3000
NODE_ENV=development
SECRET_KEY=xcafe_secret_2024_web3_auth
JWT_SECRET=xcafe_jwt_secret_2024
FRONTEND_URL=http://localhost:3000
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Arquivo .env criado');
} else {
    console.log('✅ Arquivo .env existe');
}

// Criar arquivo de configuração admin se não existir
const adminConfigPath = path.join(__dirname, 'admin-config.json');
if (!fs.existsSync(adminConfigPath)) {
    const adminConfig = {
        platform_config: {
            current_network: "testnet",
            fee_percentage: 2.5,
            admin_wallet: "0x0000000000000000000000000000000000000000",
            supported_networks: {
                "56": "BSC Mainnet",
                "97": "BSC Testnet",
                "1": "Ethereum Mainnet",
                "5": "Goerli Testnet"
            }
        },
        features: {
            widget_creation: true,
            api_access: true,
            analytics: true,
            custom_themes: true
        }
    };
    fs.writeFileSync(adminConfigPath, JSON.stringify(adminConfig, null, 2));
    console.log('✅ Configuração admin criada');
} else {
    console.log('✅ Configuração admin existe');
}

console.log(`
================================================================================
✅ CONFIGURAÇÃO CONCLUÍDA!
================================================================================

📋 Próximos passos:

1️⃣  Instalar dependências:
   npm install

2️⃣  Iniciar o servidor:
   npm start
   ou
   npm run dev (com auto-reload)

3️⃣  Acessar a aplicação:
   http://localhost:3000

🔧 Arquivos criados/verificados:
   ✅ Estrutura de diretórios
   ✅ .env (configurações)
   ✅ admin-config.json (configurações admin)

📁 Estrutura do projeto:
   ├── src/                    # Código fonte organizado
   │   ├── config/            # Configurações
   │   ├── core/              # Módulos principais
   │   ├── ui/                # Interface unificada
   │   ├── utils/             # Utilitários consolidados
   │   └── pages/             # Controladores de página
   ├── css/                   # Estilos consolidados
   ├── data/                  # Dados JSON
   └── unified-server.js      # Servidor consolidado

================================================================================
`);

process.exit(0);