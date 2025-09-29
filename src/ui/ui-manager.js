/**
 * ================================================================================
 * UI MANAGER CONSOLIDADO - Sistema Unificado de Interface
 * ================================================================================
 * Consolida funcionalidades de dashboard-menu-manager, header-manager, 
 * wallet-menu-manager e widgets-page-manager em um sistema único
 * Remove duplicações e centraliza controle de UI
 * ================================================================================
 */

class UIManager {
    constructor() {
        this.currentSection = 'overview';
        this.isDashboard = this.detectDashboardContext();
        this.walletConnected = false;
        this.currentAddress = null;
        this.userType = 'User';
        this.widgets = [];
        this.updateInterval = null;
        
        this.init();
    }

    // ========================================================================
    // INICIALIZAÇÃO
    // ========================================================================

    detectDashboardContext() {
        return window.location.pathname.includes('dashboard') || 
               document.body.classList.contains('dashboard-page') ||
               document.getElementById('dashboard-menu') !== null;
    }

    async init() {
        console.log(`🎨 Inicializando UIManager - Contexto: ${this.isDashboard ? 'Dashboard' : 'Site'}`);
        
        if (this.isDashboard) {
            this.initDashboardFeatures();
        }
        
        this.setupGlobalEventListeners();
        this.setupWalletIntegration();
        this.startPeriodicUpdate();
        
        console.log('✅ UIManager inicializado com sucesso');
    }

    initDashboardFeatures() {
        this.setupNavigationEvents();
        this.setupMenuCollapse();
        this.setupActionButtons();
        this.setupWalletDisplay();
    }

    // ========================================================================
    // NAVEGAÇÃO DO DASHBOARD
    // ========================================================================

    setupNavigationEvents() {
        const navLinks = document.querySelectorAll('[data-section]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });
    }

    navigateToSection(section) {
        console.log(`🧭 Navegando para seção: ${section}`);
        
        // Atualizar estado atual
        this.currentSection = section;
        
        // Atualizar UI de navegação
        this.setActiveSection(section);
        
        // Expandir menu pai se necessário
        this.expandParentMenu(section);
        
        // Delegar para DashboardManager se disponível
        if (window.dashboardManager && window.dashboardManager.showSection) {
            window.dashboardManager.showSection(section);
        } else {
            console.warn('⚠️ DashboardManager não disponível');
        }
    }

    setActiveSection(sectionName) {
        // Remover active de todos
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        // Adicionar active ao section específico
        const targetLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
    }

    expandParentMenu(section) {
        const menuMap = {
            'new-widget': 'widgetsMenu',
            'widgets': 'widgetsMenu',
            'templates': 'widgetsMenu',
            'transactions': 'salesMenu',
            'earnings': 'salesMenu',
            'reports': 'salesMenu',
            'credits': 'billingMenu',
            'buy-credits': 'billingMenu',
            'billing': 'billingMenu',
            'withdraw': 'billingMenu'
        };
        
        const menuId = menuMap[section];
        if (menuId) {
            this.expandMenu(menuId);
        }
    }

    // ========================================================================
    // CONTROLE DE MENUS
    // ========================================================================

    setupMenuCollapse() {
        const collapsibleMenus = document.querySelectorAll('[data-bs-toggle="collapse"]');
        collapsibleMenus.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                const targetId = trigger.getAttribute('href').replace('#', '');
                this.toggleMenu(targetId);
            });
        });
    }

    expandMenu(menuId) {
        const menu = document.getElementById(menuId);
        if (menu && !menu.classList.contains('show')) {
            const bsCollapse = new bootstrap.Collapse(menu, { show: true });
        }
    }

    collapseMenu(menuId) {
        const menu = document.getElementById(menuId);
        if (menu && menu.classList.contains('show')) {
            const bsCollapse = new bootstrap.Collapse(menu, { hide: true });
        }
    }

    toggleMenu(menuId) {
        const menu = document.getElementById(menuId);
        if (menu) {
            const bsCollapse = new bootstrap.Collapse(menu, { toggle: true });
        }
    }

    collapseAllMenus() {
        const allMenus = document.querySelectorAll('.collapse.show');
        allMenus.forEach(menu => {
            const bsCollapse = new bootstrap.Collapse(menu, { hide: true });
        });
    }

    // ========================================================================
    // GERENCIAMENTO DE CARTEIRA
    // ========================================================================

    setupWalletIntegration() {
        // Escutar eventos de mudança de estado da carteira
        document.addEventListener('authStateChanged', (e) => {
            this.handleWalletStateChange(e.detail);
        });

        document.addEventListener('web3ConnectionChanged', (e) => {
            this.handleWalletStateChange(e.detail);
        });
    }

    handleWalletStateChange(detail) {
        this.walletConnected = detail.isConnected || detail.isAuthenticated;
        this.currentAddress = detail.account;
        
        this.updateWalletDisplay();
        this.updateUserTypeDisplay();
    }

    setupWalletDisplay() {
        if (!this.isDashboard) return;
        
        // Configurar click para copiar endereço
        const walletElements = document.querySelectorAll('[data-wallet-address], #connected-wallet-address');
        walletElements.forEach(element => {
            element.addEventListener('click', async () => {
                const address = element.getAttribute('data-wallet-address') || this.currentAddress;
                if (address) {
                    await this.copyToClipboard(address);
                    this.showCopyFeedback(element);
                }
            });
        });
    }

    updateWalletDisplay() {
        if (!this.isDashboard) return;
        
        const displayAddress = this.formatAddress(this.currentAddress);
        
        // Atualizar elementos de endereço
        const walletElements = document.querySelectorAll('#connected-wallet-address, [data-wallet-address]');
        walletElements.forEach(element => {
            if (element) {
                element.textContent = this.walletConnected ? displayAddress : 'Conectando...';
                if (this.currentAddress) {
                    element.setAttribute('data-wallet-address', this.currentAddress);
                }
            }
        });

        // Atualizar status de conexão
        const statusElements = document.querySelectorAll('.wallet-status, [data-wallet-status]');
        statusElements.forEach(element => {
            if (element) {
                const statusText = this.walletConnected ? 
                    `<i class="fas fa-circle me-1 text-success"></i>${displayAddress}` :
                    '<i class="fas fa-circle me-1 text-danger"></i>Desconectado';
                element.innerHTML = statusText;
            }
        });
    }

    updateUserTypeDisplay() {
        if (!this.isDashboard) return;
        
        this.userType = this.determineUserType();
        
        const userTypeElements = document.querySelectorAll('#user-type-display, [data-user-type]');
        userTypeElements.forEach(element => {
            if (element) {
                element.textContent = this.userType;
            }
        });
    }

    determineUserType() {
        if (!this.walletConnected) return 'Desconectado';
        
        const adminAddresses = [
            '0x0b81337F18767565D2eA40913799317A25DC4bc5',
            '0xc9D6692C29e015308c9D509f0733Cd41A328B6D8'
        ];
        
        if (adminAddresses.includes(this.currentAddress)) {
            return 'Admin';
        }
        
        const credits = parseInt(localStorage.getItem('userCredits') || '0');
        return credits > 0 ? 'Premium' : 'Free';
    }

    // ========================================================================
    // GERENCIAMENTO DE WIDGETS
    // ========================================================================

    async loadWidgets() {
        try {
            console.log('📦 Carregando widgets...');
            
            // Buscar widgets da API ou localStorage
            this.widgets = await this.fetchWidgetsFromAPI();
            
            // Renderizar widgets se estivermos na página correta
            if (document.getElementById('widgets-list')) {
                this.renderWidgets();
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar widgets:', error);
        }
    }

    async fetchWidgetsFromAPI() {
        // Simular dados para desenvolvimento
        return [
            {
                id: 'w1',
                name: 'Widget BNB Sale',
                type: 'token-sale',
                network: 'BSC',
                status: 'active',
                contractAddress: '0x123...abc',
                sales: 50,
                earnings: '2.5 BNB',
                created: '2024-01-15'
            },
            {
                id: 'w2', 
                name: 'ETH Presale Widget',
                type: 'presale',
                network: 'Ethereum',
                status: 'paused',
                contractAddress: '0x456...def',
                sales: 12,
                earnings: '0.45 ETH',
                created: '2024-01-10'
            }
        ];
    }

    renderWidgets() {
        const container = document.getElementById('widgets-list');
        if (!container) return;

        if (this.widgets.length === 0) {
            container.innerHTML = '<div class="text-center py-4"><p>Nenhum widget encontrado.</p></div>';
            return;
        }

        container.innerHTML = this.widgets.map(widget => this.createWidgetCard(widget)).join('');
    }

    createWidgetCard(widget) {
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${widget.name}</h6>
                        <span class="badge ${widget.status === 'active' ? 'bg-success' : 'bg-warning'}">${widget.status}</span>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small mb-2">
                            <i class="fas fa-network-wired me-1"></i>${widget.network} • ${widget.type}
                        </p>
                        <p class="mb-1"><strong>Vendas:</strong> ${widget.sales}</p>
                        <p class="mb-1"><strong>Ganhos:</strong> ${widget.earnings}</p>
                        <p class="mb-3 text-muted small">Criado: ${widget.created}</p>
                        
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-outline-primary btn-sm" onclick="uiManager.editWidget('${widget.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="uiManager.viewStats('${widget.id}')">
                                <i class="fas fa-chart-bar"></i>
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="uiManager.copyEmbed('${widget.id}')">
                                <i class="fas fa-code"></i>
                            </button>
                            <button class="btn btn-outline-warning btn-sm" onclick="uiManager.toggleStatus('${widget.id}')">
                                <i class="fas fa-${widget.status === 'active' ? 'pause' : 'play'}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ========================================================================
    // AÇÕES DE WIDGETS
    // ========================================================================

    editWidget(widgetId) {
        console.log('✏️ Editando widget:', widgetId);
        // Implementar navegação para edição
        this.navigateToSection('new-widget');
    }

    viewStats(widgetId) {
        console.log('📊 Visualizando stats do widget:', widgetId);
        // Implementar modal de estatísticas
    }

    copyEmbed(widgetId) {
        console.log('📋 Copiando código embed do widget:', widgetId);
        const widget = this.widgets.find(w => w.id === widgetId);
        if (widget) {
            const embedCode = `<script src="https://widget.xcafe.com/embed.js" data-contract="${widget.contractAddress}"></script>`;
            this.copyToClipboard(embedCode);
            alert('Código de incorporação copiado!');
        }
    }

    toggleStatus(widgetId) {
        console.log('🔄 Alternando status do widget:', widgetId);
        const widget = this.widgets.find(w => w.id === widgetId);
        if (widget) {
            widget.status = widget.status === 'active' ? 'paused' : 'active';
            this.renderWidgets();
        }
    }

    // ========================================================================
    // BOTÕES DE AÇÃO
    // ========================================================================

    setupActionButtons() {
        // Botão de logout
        const logoutBtns = document.querySelectorAll('[data-action="logout"], .logout-btn');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', () => this.logout());
        });

        // Botão de refresh
        const refreshBtns = document.querySelectorAll('[data-action="refresh"], .refresh-btn');
        refreshBtns.forEach(btn => {
            btn.addEventListener('click', () => this.refreshDashboard());
        });

        // Botões de tema
        const themeBtns = document.querySelectorAll('[data-action="toggle-theme"], .theme-btn');
        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.toggleTheme());
        });
    }

    logout() {
        console.log('🚪 Realizando logout...');
        
        // Limpar dados locais
        localStorage.removeItem('authToken');
        localStorage.removeItem('userAddress');
        localStorage.removeItem('userType');
        
        // Desconectar Web3 se disponível
        if (window.web3Manager) {
            window.web3Manager.disconnect();
        }
        
        // Redirecionar para página de autenticação
        window.location.href = '/auth.html';
    }

    refreshDashboard() {
        console.log('🔄 Atualizando dashboard...');
        
        // Recarregar dados
        this.loadWidgets();
        this.updateWalletDisplay();
        this.updateUserTypeDisplay();
        
        // Atualizar outros componentes se disponíveis
        if (window.dashboardManager && window.dashboardManager.loadCurrentSection) {
            window.dashboardManager.loadCurrentSection();
        }
    }

    toggleTheme() {
        const body = document.body;
        const isDark = body.getAttribute('data-bs-theme') === 'dark';
        
        body.setAttribute('data-bs-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        
        console.log(`🎨 Tema alterado para: ${isDark ? 'light' : 'dark'}`);
    }

    // ========================================================================
    // UTILITÁRIOS
    // ========================================================================

    formatAddress(address) {
        return window.CoreUtils ? window.CoreUtils.formatAddress(address) :
               (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Não conectado');
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Erro ao copiar:', error);
            return false;
        }
    }

    showCopyFeedback(element) {
        const originalText = element.textContent;
        element.textContent = 'Copiado!';
        element.classList.add('bg-success', 'text-white');
        
        setTimeout(() => {
            element.textContent = originalText;
            element.classList.remove('bg-success', 'text-white');
        }, 1500);
    }

    // ========================================================================
    // EVENTOS GLOBAIS
    // ========================================================================

    setupGlobalEventListeners() {
        // Detectar mudanças de página
        window.addEventListener('popstate', () => {
            this.handlePageChange();
        });

        // Detectar redimensionamento
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handlePageChange() {
        console.log('🔄 Mudança de página detectada');
        // Reinicializar componentes se necessário
    }

    handleResize() {
        // Ajustar UI responsiva se necessário
    }

    // ========================================================================
    // ATUALIZAÇÃO PERIÓDICA
    // ========================================================================

    startPeriodicUpdate() {
        // Atualizar a cada 30 segundos se estiver no dashboard
        if (this.isDashboard) {
            this.updateInterval = setInterval(() => {
                this.updateWalletDisplay();
            }, 30000);
        }
    }

    stopPeriodicUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    destroy() {
        this.stopPeriodicUpdate();
        // Remover event listeners se necessário
    }
}

// ========================================================================
// INSTÂNCIA GLOBAL E FUNÇÕES DE COMPATIBILIDADE
// ========================================================================

// Instância global
window.UIManager = UIManager;
let uiManager = null;

// Funções globais para compatibilidade
window.navigateToSection = function(section) {
    if (uiManager) {
        uiManager.navigateToSection(section);
    } else {
        console.warn('⚠️ UIManager não inicializado');
    }
};

window.refreshDashboard = function() {
    if (uiManager) {
        uiManager.refreshDashboard();
    }
};

window.logout = function() {
    if (uiManager) {
        uiManager.logout();
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        uiManager = new UIManager();
        window.uiManager = uiManager;
        
        // Carregar widgets se estivermos na página de widgets
        if (document.getElementById('widgets-list')) {
            uiManager.loadWidgets();
        }
        
        console.log('🎨 UIManager disponível globalmente');
    }, 100);
});

console.log('🎨 UIManager consolidado carregado!');