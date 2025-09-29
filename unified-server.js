#!/usr/bin/env node
/**
 * ================================================================================
 * XCAFE UNIFIED SERVER - Servidor Node.js Consolidado
 * ================================================================================
 * Servidor unificado que combina funcionalidades do server.py e api/server.js
 * Remove duplicações e implementa arquitetura limpa
 * ================================================================================
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// ==================== CONFIGURAÇÃO E CONSTANTES ====================

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'xcafe_secret_2024_web3_auth';
const JWT_SECRET = process.env.JWT_SECRET || SECRET_KEY;

// ==================== CONFIGURAÇÃO ADMIN ====================

let ADMIN_CONFIG = {
    platform_config: {
        current_network: "testnet",
        fee_percentage: 2.5,
        admin_wallet: "0x0000000000000000000000000000000000000000"
    }
};

async function loadAdminConfig() {
    try {
        const configPath = path.join(__dirname, 'admin-config.json');
        const configData = await fs.readFile(configPath, 'utf-8');
        ADMIN_CONFIG = JSON.parse(configData);
        console.log('✅ Configuração admin carregada');
    } catch (error) {
        console.log('⚠️ admin-config.json não encontrado, usando configurações padrão');
    }
}

// ==================== MIDDLEWARE DE SEGURANÇA ====================

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:", "wss:"]
        }
    }
}));

app.use(compression());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Rate limiting global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // 200 requests por IP
    message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
});

// Rate limiting específico para API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Muitas tentativas na API. Tente novamente em 15 minutos.' }
});

app.use(globalLimiter);
app.use('/api/', apiLimiter);

// Parser JSON com limite
app.use(express.json({ limit: '10mb' }));

// ==================== SISTEMA DE DADOS UNIFICADO ====================

class DataManager {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.files = {
            users: 'users.json',
            widgets: 'widgets.json',
            transactions: 'transactions.json',
            credits: 'credits.json',
            api_keys: 'api_keys.json',
            system_stats: 'system_stats.json'
        };
        this.init();
    }

    async init() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            console.log('📁 Diretório de dados inicializado');
            
            // Criar arquivos padrão se não existirem
            for (const [key, filename] of Object.entries(this.files)) {
                await this.ensureFile(filename, key === 'system_stats' ? this.getDefaultStats() : []);
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema de dados:', error);
        }
    }

    async ensureFile(filename, defaultData = []) {
        const filePath = path.join(this.dataDir, filename);
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
            console.log(`📝 Arquivo ${filename} criado`);
        }
    }

    async readData(type) {
        try {
            const filePath = path.join(this.dataDir, this.files[type]);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`❌ Erro ao ler ${type}:`, error);
            return type === 'system_stats' ? this.getDefaultStats() : [];
        }
    }

    async writeData(type, data) {
        try {
            const filePath = path.join(this.dataDir, this.files[type]);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`❌ Erro ao escrever ${type}:`, error);
            return false;
        }
    }

    getDefaultStats() {
        return {
            total_users: 0,
            total_widgets: 0,
            total_transactions: 0,
            total_volume: 0,
            last_updated: new Date().toISOString()
        };
    }

    async updateStats() {
        try {
            const users = await this.readData('users');
            const widgets = await this.readData('widgets');
            const transactions = await this.readData('transactions');

            const totalVolume = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

            const stats = {
                total_users: users.length,
                total_widgets: widgets.length,
                total_transactions: transactions.length,
                total_volume: totalVolume,
                last_updated: new Date().toISOString()
            };

            await this.writeData('system_stats', stats);
            return stats;
        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas:', error);
            return this.getDefaultStats();
        }
    }
}

// ==================== SISTEMA DE AUTENTICAÇÃO ====================

class AuthManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    generateToken(user) {
        return jwt.sign(
            { 
                id: user.id,
                address: user.address,
                userType: user.userType,
                exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 dias
            },
            JWT_SECRET
        );
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    async authenticateUser(address, signature, message, timestamp) {
        try {
            // Verificar se a assinatura é válida (simulado para desenvolvimento)
            if (!address || !signature) {
                throw new Error('Dados de autenticação incompletos');
            }

            // Buscar ou criar usuário
            const users = await this.dataManager.readData('users');
            let user = users.find(u => u.address.toLowerCase() === address.toLowerCase());

            if (!user) {
                // Primeiro usuário é Super Admin
                const userType = users.length === 0 ? 'first_admin' : 'normal';
                
                user = {
                    id: crypto.randomUUID(),
                    address: address,
                    userType: userType,
                    created_at: new Date().toISOString(),
                    last_login: new Date().toISOString()
                };

                users.push(user);
                await this.dataManager.writeData('users', users);
                console.log(`👤 Novo usuário criado: ${address} (${userType})`);
            } else {
                // Atualizar último login
                user.last_login = new Date().toISOString();
                await this.dataManager.writeData('users', users);
            }

            return {
                success: true,
                user: user,
                token: this.generateToken(user),
                userType: user.userType
            };

        } catch (error) {
            console.error('❌ Erro na autenticação:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async setupFirstAdmin(address, token) {
        try {
            const decoded = this.verifyToken(token);
            if (!decoded || decoded.userType !== 'first_admin') {
                throw new Error('Token inválido para configuração de admin');
            }

            const users = await this.dataManager.readData('users');
            const user = users.find(u => u.id === decoded.id);
            
            if (user) {
                user.userType = 'Super Admin';
                user.setup_completed = true;
                user.setup_date = new Date().toISOString();
                
                await this.dataManager.writeData('users', users);
                
                return {
                    success: true,
                    message: 'Super Admin configurado com sucesso'
                };
            }

            throw new Error('Usuário não encontrado');

        } catch (error) {
            console.error('❌ Erro no setup do admin:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// ==================== SISTEMA DE WIDGETS ====================

class WidgetManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    async createWidget(data, userToken) {
        try {
            const decoded = jwt.verify(userToken, JWT_SECRET);
            if (!decoded) {
                throw new Error('Token inválido');
            }

            const widgets = await this.dataManager.readData('widgets');
            
            const widget = {
                id: crypto.randomUUID(),
                owner: decoded.address,
                name: data.name,
                type: data.type || 'token-sale',
                network: data.network,
                contract_address: data.contractAddress,
                token_symbol: data.tokenSymbol,
                token_name: data.tokenName,
                price: data.price,
                max_supply: data.maxSupply,
                status: 'active',
                created_at: new Date().toISOString(),
                api_key: this.generateApiKey(),
                stats: {
                    total_sales: 0,
                    total_volume: 0,
                    total_fees: 0
                }
            };

            widgets.push(widget);
            await this.dataManager.writeData('widgets', widgets);
            await this.dataManager.updateStats();

            return {
                success: true,
                widget: widget
            };

        } catch (error) {
            console.error('❌ Erro ao criar widget:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getUserWidgets(userToken) {
        try {
            const decoded = jwt.verify(userToken, JWT_SECRET);
            if (!decoded) {
                throw new Error('Token inválido');
            }

            const widgets = await this.dataManager.readData('widgets');
            const userWidgets = widgets.filter(w => w.owner === decoded.address);

            return {
                success: true,
                widgets: userWidgets
            };

        } catch (error) {
            console.error('❌ Erro ao buscar widgets:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    generateApiKey() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(16).toString('hex');
        return `xcafe_${timestamp}_${random}`;
    }
}

// ==================== INICIALIZAÇÃO DOS MANAGERS ====================

const dataManager = new DataManager();
const authManager = new AuthManager(dataManager);
const widgetManager = new WidgetManager(dataManager);

// ==================== ROTAS DA API ====================

// Middleware de validação de token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
        return res.status(403).json({ error: 'Token inválido' });
    }

    req.user = decoded;
    next();
};

// ==================== ROTAS DE AUTENTICAÇÃO ====================

app.post('/api/auth/verify', [
    body('address').isEthereumAddress().withMessage('Endereço Ethereum inválido'),
    body('signature').notEmpty().withMessage('Assinatura obrigatória'),
    body('message').notEmpty().withMessage('Mensagem obrigatória')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { address, signature, message, timestamp } = req.body;
        const result = await authManager.authenticateUser(address, signature, message, timestamp);

        if (result.success) {
            res.json(result);
        } else {
            res.status(401).json(result);
        }
    } catch (error) {
        console.error('❌ Erro na rota de verificação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/system/setup', authenticateToken, async (req, res) => {
    try {
        const { address, userType } = req.body;
        const token = req.headers['authorization'].split(' ')[1];
        
        const result = await authManager.setupFirstAdmin(address, token);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro no setup do sistema:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ==================== ROTAS DE WIDGETS ====================

app.post('/api/widgets', authenticateToken, [
    body('name').notEmpty().withMessage('Nome obrigatório'),
    body('network').notEmpty().withMessage('Rede obrigatória'),
    body('contractAddress').isEthereumAddress().withMessage('Endereço de contrato inválido')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const token = req.headers['authorization'].split(' ')[1];
        const result = await widgetManager.createWidget(req.body, token);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('❌ Erro ao criar widget:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/widgets', authenticateToken, async (req, res) => {
    try {
        const token = req.headers['authorization'].split(' ')[1];
        const result = await widgetManager.getUserWidgets(token);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao buscar widgets:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ==================== ROTAS DE SISTEMA ====================

app.get('/api/system/status', async (req, res) => {
    try {
        const stats = await dataManager.updateStats();
        res.json({
            success: true,
            status: 'online',
            timestamp: new Date().toISOString(),
            stats: stats,
            admin_config: ADMIN_CONFIG
        });
    } catch (error) {
        console.error('❌ Erro ao buscar status:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/system/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
    });
});

// ==================== SERVIR ARQUIVOS ESTÁTICOS ====================

app.use(express.static(path.join(__dirname), {
    index: ['index.html'],
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Rota para servir páginas específicas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/admin-panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel.html'));
});

// ==================== TRATAMENTO DE ERROS ====================

app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', err);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.path
    });
});

// ==================== INICIALIZAÇÃO DO SERVIDOR ====================

async function startServer() {
    try {
        await loadAdminConfig();
        await dataManager.init();
        
        app.listen(PORT, () => {
            console.log(`
================================================================================
🚀 XCAFE UNIFIED SERVER - SERVIDOR CONSOLIDADO
================================================================================
🌐 Servidor rodando em: http://localhost:${PORT}
📁 Diretório de dados: ${path.join(__dirname, 'data')}
🔐 JWT Secret configurado: ${JWT_SECRET ? '✅' : '❌'}
📊 Status: Pronto para conexões
================================================================================
            `);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Tratamento de sinais de sistema
process.on('SIGINT', () => {
    console.log('\n🛑 Servidor sendo encerrado...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Servidor sendo encerrado pelo sistema...');
    process.exit(0);
});

// Inicializar servidor
startServer();