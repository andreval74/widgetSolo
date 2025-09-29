/*
================================================================================
XCAFE APP - COORDENADOR PRINCIPAL OTIMIZADO
================================================================================
Sistema de inicialização e coordenação unificado
Remove duplicações e garante ordem correta de carregamento
================================================================================
*/

class XCafeApp {
    constructor() {
        this.loadedModules = new Set();
        this.managers = {};
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('🚀 Inicializando XCafe App Otimizado...');
            
            try {
                // 1. Aguardar carregamento das configurações
                await this.waitForConfig();
                
                // 2. Inicializar managers na ordem correta
                await this.initializeManagers();
                
                // 3. Configurar eventos globais
                this.setupGlobalEventListeners();
                
                // 4. Inicializar funcionalidades específicas da página
                this.initializePageSpecificFeatures();
                
                this.isInitialized = true;
                console.log('✅ XCafe App inicializado com sucesso');
                
                // Disparar evento de inicialização completa
                this.notifyInitializationComplete();
                
            } catch (error) {
                console.error('❌ Erro ao inicializar XCafe App:', error);
            }
        });
    }

    // ========================================================================
    // INICIALIZAÇÃO DE MÓDULOS
    // ========================================================================

    async waitForConfig() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.BLOCKCHAIN_CONFIG && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.BLOCKCHAIN_CONFIG) {
            console.log('✅ Configuração blockchain carregada');
        } else {
            console.warn('⚠️ Configuração blockchain não encontrada, usando fallback');
        }
    }

    async initializeManagers() {
        try {
            // 1. DataManager (sem dependências)
            if (window.DataManager) {
                this.managers.dataManager = new window.DataManager();
                this.loadedModules.add('DataManager');
                console.log('✅ DataManager inicializado');
            }
    
            // 2. Web3Manager (depende da config)
            if (window.Web3Manager) {
                this.managers.web3Manager = new window.Web3Manager();
                window.web3ManagerInstance = this.managers.web3Manager;
                this.loadedModules.add('Web3Manager');
                console.log('✅ Web3Manager inicializado');
            }
    
            // 3. AuthManager (depende de DataManager e Web3Manager)
            if (window.AuthManager && this.managers.dataManager && this.managers.web3Manager) {
                this.managers.authManager = new window.AuthManager(
                    this.managers.dataManager, 
                    this.managers.web3Manager
                );
                this.loadedModules.add('AuthManager');
                console.log('✅ AuthManager inicializado');
            }
    
            // 4. HeaderController (depende de Web3Manager)
            if (window.HeaderController && this.managers.web3Manager) {
                this.managers.headerController = new window.HeaderController(this.managers.web3Manager);
                this.loadedModules.add('HeaderController');
                console.log('✅ HeaderController inicializado');
            }
    
            // 5. Disponibilizar managers globalmente
            window.xcafeManagers = this.managers;
        } catch (error) {
            console.error('❌ Erro ao inicializar XCafe App:', error);
        }
    }

    setupGlobalEventListeners() {
        // Escutar eventos de templates carregados
        document.addEventListener('templateLoaded', (event) => {
            const { templatePath, containerId } = event.detail;
            console.log(`📄 Template carregado: ${templatePath} -> ${containerId}`);
            
            // Reagir a carregamento de header
            if (templatePath.includes('header')) {
                this.onHeaderLoaded(containerId);
            }
            
            // Reagir a carregamento de footer
            if (templatePath.includes('footer')) {
                this.onFooterLoaded(containerId);
            }
        });

        // Escutar mudanças de autenticação
        document.addEventListener('authStateChanged', (event) => {
            const { isAuthenticated, account } = event.detail;
            this.onAuthStateChanged(isAuthenticated, account);
        });

        // Escutar mudanças de rede
        document.addEventListener('web3NetworkChanged', (event) => {
            const { chainId, isSupported, network } = event.detail;
            this.onNetworkChanged(chainId, isSupported, network);
        });
    }

    initializePageSpecificFeatures() {
        // Detectar página atual
        const currentPage = this.getCurrentPage();
        console.log(`📄 Página atual detectada: ${currentPage}`);

        switch (currentPage) {
            case 'index':
                this.initializeIndexPage();
                break;
            case 'dashboard':
                this.initializeDashboardPage();
                break;
            case 'auth':
                this.initializeAuthPage();
                break;
            case 'admin':
                this.initializeAdminPage();
                break;
            default:
                console.log('ℹ️ Página não reconhecida, carregando funcionalidades básicas');
        }
    }

    // ========================================================================
    // INICIALIZAÇÃO ESPECÍFICA POR PÁGINA
    // ========================================================================

    initializeIndexPage() {
        // A página index já tem seu próprio controlador otimizado
        console.log('🏠 Funcionalidades específicas da index já carregadas');
    }

    initializeDashboardPage() {
        if (window.DashboardManagerModular) {
            console.log('📊 Inicializando dashboard modular...');
        }
    }

    initializeAuthPage() {
        if (window.AuthPageManager) {
            console.log('🔐 Inicializando página de autenticação...');
        }
    }

    initializeAdminPage() {
        if (window.AdminPanelManager) {
            console.log('⚙️ Inicializando painel administrativo...');
        }
    }

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    onHeaderLoaded(containerId) {
        // Aguardar um pouco para garantir que o DOM foi atualizado
        setTimeout(() => {
            // Verificar se há controles de tema no header
            if (this.managers.themeController) {
                this.managers.themeController.setupSimpleThemeToggle();
            }
            
            // Atualizar UI do header se disponível
            if (this.managers.headerController && this.managers.headerController.updateUI) {
                this.managers.headerController.updateUI();
            }
        }, 100);
    }

    onFooterLoaded(containerId) {
        console.log(`🦶 Footer carregado em: ${containerId}`);
        // Funcionalidades específicas do footer se necessário
    }

    onAuthStateChanged(isAuthenticated, account) {
        console.log(`🔐 Estado de autenticação alterado: ${isAuthenticated ? 'Conectado' : 'Desconectado'}`);
        
        // Atualizar interface baseado no estado de autenticação
        this.updateUIBasedOnAuth(isAuthenticated, account);
    }

    onNetworkChanged(chainId, isSupported, network) {
        console.log(`🌐 Rede alterada: ${network?.name || chainId} (Suportada: ${isSupported})`);
        
        if (!isSupported) {
            this.showUnsupportedNetworkWarning(chainId, network);
        }
    }

    // ========================================================================
    // UTILITÁRIOS
    // ========================================================================

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().split('.')[0];
        
        // Mapear nomes de arquivo para identificadores de página
        const pageMap = {
            'index': 'index',
            'dashboard': 'dashboard',
            'dashboard-modular': 'dashboard',
            'auth': 'auth',
            'admin': 'admin',
            'admin-panel': 'admin'
        };
        
        return pageMap[filename] || filename || 'index';
    }

    updateUIBasedOnAuth(isAuthenticated, account) {
        // Atualizar botões de navegação
        const connectButton = document.getElementById('connect-wallet-btn');
        if (connectButton) {
            if (isAuthenticated) {
                connectButton.textContent = window.CoreUtils ? window.CoreUtils.formatAddress(account) : this.formatAddress(account);
                connectButton.classList.remove('btn-danger');
                connectButton.classList.add('btn-success');
            } else {
                connectButton.textContent = 'Conectar Carteira';
                connectButton.classList.remove('btn-success');
                connectButton.classList.add('btn-danger');
            }
        }

        // Atualizar links do dashboard
        const dashboardLinks = document.querySelectorAll('a[href*="dashboard"]');
        dashboardLinks.forEach(link => {
            if (isAuthenticated) {
                link.classList.remove('disabled');
                link.style.opacity = '1';
            } else {
                link.classList.add('disabled');
                link.style.opacity = '0.6';
            }
        });
    }

    showUnsupportedNetworkWarning(chainId, network) {
        const supportedNetworks = window.BLOCKCHAIN_CONFIG?.getAllNetworks() || [];
        const supportedNames = supportedNetworks.map(n => n.name).join(', ');
        
        console.warn(`⚠️ Rede não suportada: ${network?.name || chainId}`);
        console.log(`ℹ️ Redes suportadas: ${supportedNames}`);
        
        // Pode mostrar um modal ou notificação para o usuário
    }

    formatAddress(address, length = 6) {
        return window.CoreUtils ? window.CoreUtils.formatAddress(address, length) : 
               (address ? `${address.slice(0, length)}...${address.slice(-4)}` : address);
    }

    notifyInitializationComplete() {
        const event = new CustomEvent('xcafeAppInitialized', {
            detail: {
                managers: this.managers,
                loadedModules: Array.from(this.loadedModules),
                isInitialized: this.isInitialized
            }
        });
        document.dispatchEvent(event);
    }

    // ========================================================================
    // API PÚBLICA
    // ========================================================================

    getManagers() {
        return this.managers;
    }

    getManager(managerName) {
        return this.managers[managerName] || null;
    }

    isModuleLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    }

    getLoadedModules() {
        return Array.from(this.loadedModules);
    }

    isReady() {
        return this.isInitialized;
    }
}

// ========================================================================
// INICIALIZAÇÃO GLOBAL
// ========================================================================
const xcafeApp = new XCafeApp();
window.xcafeApp = xcafeApp;

console.log('🎯 XCafe App Otimizado carregado com sucesso!');

// Inicialização automática quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeXCafeApp);