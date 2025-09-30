/*
================================================================================
DASHBOARD MANAGER UNIFICADO - Widget SaaS Platform
================================================================================
Sistema consolidado que une:
- DashboardManager (navegação principal)
- DashboardMenuManager (menu lateral)  
- WalletMenuManager (carteira)
Remove duplicações e mantém funcionalidade completa
================================================================================
*/

class UnifiedDashboardManager {
    constructor() {
        this.currentSection = 'overview';
        this.currentWallet = null;
        this.web3Manager = null;
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando Dashboard Unificado...');
        
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    async setup() {
        try {
            this.setupNavigationEvents();
            this.setupWalletEvents();
            this.setupActionButtons();
            await this.initializeWallet();
            await this.showSection('overview');
            
            console.log('✅ Dashboard Unificado inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar dashboard:', error);
        }
    }

    setupNavigationEvents() {
        // Configurar navegação principal
        const navLinks = document.querySelectorAll('[data-section]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
                this.updateActiveMenu(section);
            });
        });

        // Configurar navegação global
        window.loadSection = (section) => this.showSection(section);
        window.updateActiveMenu = (section) => this.updateActiveMenu(section);
        window.navigateToSection = (section) => this.showSection(section);
    }

    setupWalletEvents() {
        // Botões de carteira
        const connectBtn = document.getElementById('connect-wallet-btn');
        const disconnectBtn = document.getElementById('disconnect-wallet');
        
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }
        
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnectWallet());
        }

        // Eventos da MetaMask
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.handleWalletDisconnected();
                } else {
                    this.currentWallet = accounts[0];
                    this.updateWalletDisplay();
                }
            });

            window.ethereum.on('chainChanged', (chainId) => {
                console.log('🔗 Rede alterada:', chainId);
                location.reload();
            });
        }
    }

    setupActionButtons() {
        // Botões de ação global
        const refreshBtn = document.querySelector('[onclick*="refreshDashboard"]');
        const logoutBtn = document.querySelector('[onclick*="logout"]');
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => this.refreshDashboard(e));
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    async initializeWallet() {
        if (!window.ethereum) {
            console.log('⚠️ MetaMask não detectada');
            return;
        }

        try {
            const accounts = await window.ethereum.request({method: 'eth_accounts'});
            if (accounts.length > 0) {
                this.currentWallet = accounts[0];
                this.updateWalletDisplay();
                console.log('✅ Carteira conectada:', this.currentWallet);
            }
        } catch (error) {
            console.error('❌ Erro ao verificar carteira:', error);
        }
    }

    async connectWallet() {
        if (!window.ethereum) {
            alert('MetaMask não detectada! Por favor, instale a extensão MetaMask.');
            return;
        }

        try {
            const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
            this.currentWallet = accounts[0];
            this.updateWalletDisplay();
            
            console.log('✅ Carteira conectada:', this.currentWallet);
            
            // Mostrar notificação
            this.showNotification('Carteira conectada com sucesso!', 'success');
            
        } catch (error) {
            console.error('❌ Erro ao conectar carteira:', error);
            this.showNotification('Erro ao conectar carteira', 'error');
        }
    }

    disconnectWallet() {
        this.currentWallet = null;
        this.updateWalletDisplay();
        this.showNotification('Carteira desconectada', 'info');
        console.log('🔌 Carteira desconectada');
    }

    handleWalletDisconnected() {
        this.currentWallet = null;
        this.updateWalletDisplay();
        console.log('🔌 Carteira desconectada automaticamente');
    }

    updateWalletDisplay() {
        const connectBtn = document.getElementById('connect-wallet-btn');
        const walletInfo = document.getElementById('wallet-info');
        const walletAddress = document.getElementById('connected-wallet-address');
        const menuWalletDisplay = document.getElementById('wallet-display');

        if (this.currentWallet) {
            const shortAddress = `${this.currentWallet.slice(0, 6)}...${this.currentWallet.slice(-4)}`;
            
            // Atualizar botão principal
            if (connectBtn) {
                connectBtn.style.display = 'none';
            }
            
            // Atualizar info da carteira
            if (walletInfo) {
                walletInfo.style.display = 'block';
            }
            
            if (walletAddress) {
                walletAddress.textContent = shortAddress;
                walletAddress.classList.add('text-success');
            }

            // Atualizar menu lateral
            if (menuWalletDisplay) {
                menuWalletDisplay.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="wallet-icon me-2">
                            <i class="fas fa-wallet text-success"></i>
                        </div>
                        <div>
                            <small class="text-muted">Carteira</small>
                            <div class="fw-bold text-success">${shortAddress}</div>
                        </div>
                    </div>
                `;
            }
        } else {
            // Carteira desconectada
            if (connectBtn) {
                connectBtn.style.display = 'block';
            }
            
            if (walletInfo) {
                walletInfo.style.display = 'none';
            }

            if (menuWalletDisplay) {
                menuWalletDisplay.innerHTML = `
                    <div class="text-center">
                        <i class="fas fa-wallet text-muted mb-2"></i>
                        <div class="small text-muted">Carteira não conectada</div>
                    </div>
                `;
            }
        }
    }

    async showSection(sectionName) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        console.log(`📄 Carregando seção: ${sectionName}`);

        try {
            const mainContent = document.getElementById('main-content');
            if (!mainContent) {
                throw new Error('Elemento main-content não encontrado');
            }

            // Mostrar loading
            mainContent.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="text-muted">Carregando ${sectionName}...</p>
                </div>
            `;

            // Carregar conteúdo da página
            const response = await fetch(`dashboard/pages/${sectionName}.html`);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const content = await response.text();
            mainContent.innerHTML = content;
            
            this.currentSection = sectionName;
            this.updateActiveMenu(sectionName);
            
            // Executar scripts da página se existirem
            const scripts = mainContent.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                newScript.textContent = script.textContent;
                document.head.appendChild(newScript);
                setTimeout(() => document.head.removeChild(newScript), 100);
            });

            console.log(`✅ Seção ${sectionName} carregada com sucesso`);

        } catch (error) {
            console.error(`❌ Erro ao carregar seção ${sectionName}:`, error);
            
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="alert alert-danger text-center">
                        <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                        <h5>Erro ao carregar página</h5>
                        <p>Não foi possível carregar a seção "${sectionName}".</p>
                        <button class="btn btn-primary" onclick="window.dashboardManager.showSection('overview')">
                            Voltar ao Início
                        </button>
                    </div>
                `;
            }
        } finally {
            this.isLoading = false;
        }
    }

    updateActiveMenu(sectionName) {
        // Remover active de todos os links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Adicionar active ao link correto
        const targetLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }

        console.log(`🎯 Menu atualizado para: ${sectionName}`);
    }

    refreshDashboard(event) {
        const btn = event.target;
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Atualizando...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            this.showSection(this.currentSection);
            this.showNotification('Dashboard atualizado!', 'success');
        }, 1500);
    }

    logout() {
        if (confirm('Tem certeza que deseja sair?')) {
            this.disconnectWallet();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'auth.html';
        }
    }

    showNotification(message, type = 'info') {
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const notification = document.createElement('div');
        notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardManager = new UnifiedDashboardManager();
    console.log('🎯 Dashboard Manager Unificado configurado globalmente');
});

// Definir função de navegação global imediatamente
window.navigateToSection = function(section) {
    if (window.dashboardManager) {
        window.dashboardManager.showSection(section);
    } else {
        console.log('⏳ Aguardando Dashboard Manager...');
        setTimeout(() => window.navigateToSection(section), 100);
    }
};

// Função global para logout
window.logout = function() {
    if (window.dashboardManager) {
        window.dashboardManager.logout();
    }
};

// Função global para refresh
window.refreshDashboard = function(event) {
    if (window.dashboardManager) {
        window.dashboardManager.refreshDashboard(event);
    }
};