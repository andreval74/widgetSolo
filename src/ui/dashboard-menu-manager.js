/*
================================================================================
DASHBOARD MENU MANAGER OTIMIZADO - Widget SaaS
================================================================================
Funcionalidades específicas do menu lateral do dashboard
Otimizado para trabalhar em conjunto com wallet-menu-manager.js
================================================================================
*/

class DashboardMenuManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('📋 Inicializando DashboardMenuManager Otimizado...');
        this.setupNavigationEvents();
        this.setupActionButtons();
        this.setupTestFunctions();
    }

    setupNavigationEvents() {
        // Configurar eventos de navegação para links com data-section
        const navLinks = document.querySelectorAll('[data-section]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(link, e);
            });
        });
    }

    handleNavigation(link, event) {
        const sectionName = link.getAttribute('data-section');
        
        // Remover classe active de todos os links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        // Adicionar active ao link clicado
        link.classList.add('active');
        
        // Disparar evento personalizado para o dashboard manager
        const customEvent = new CustomEvent('dashboardNavigation', {
            detail: { 
                section: sectionName,
                element: link,
                originalEvent: event
            }
        });
        document.dispatchEvent(customEvent);
        
        console.log(`📌 Navegação para seção: ${sectionName}`);
    }

    setupActionButtons() {
        // Os botões já têm onclick definido no HTML
        console.log('✅ Botões de ação configurados via HTML');
    }

    // ================================================================================
    // MÉTODOS UTILITÁRIOS DO MENU
    // ================================================================================

    setActiveSection(sectionName) {
        // Remover active de todos
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        // Adicionar active ao section específico
        const targetLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
    }

    expandMenu(menuId) {
        const menu = document.getElementById(menuId);
        if (menu && menu.classList.contains('collapse')) {
            const bsCollapse = new bootstrap.Collapse(menu, { show: true });
        }
    }

    collapseMenu(menuId) {
        const menu = document.getElementById(menuId);
        if (menu && menu.classList.contains('collapse')) {
            const bsCollapse = new bootstrap.Collapse(menu, { hide: true });
        }
    }

    collapseAllMenus() {
        const allMenus = document.querySelectorAll('.collapse');
        allMenus.forEach(menu => {
            if (menu.classList.contains('show')) {
                const bsCollapse = new bootstrap.Collapse(menu, { hide: true });
            }
        });
    }

    // ================================================================================
    // FUNÇÕES DE TESTE
    // ================================================================================

    /**
     * Configura funções de teste para navegação
     */
    setupTestFunctions() {
        console.log('📋 Dashboard Menu carregado - funções de teste disponíveis');
        this.makeTestFunctionGlobal();
    }

    /**
     * Função de teste para verificar se os links de navegação funcionam
     * @param {string} section - Nome da seção para navegar
     */
    testNavigateToSection(section) {
        console.log('🔍 Testando navegação para:', section);
        
        if (typeof window.navigateToSection === 'function') {
            console.log('✅ Função navigateToSection encontrada');
            window.navigateToSection(section);
        } else {
            console.log('❌ Função navigateToSection não encontrada');
            console.log('Aguardando dashboard manager...');
            setTimeout(() => this.testNavigateToSection(section), 1000);
        }
    }

    /**
     * Torna a função de teste disponível globalmente
     */
    makeTestFunctionGlobal() {
        window.testNavigateToSection = (section) => this.testNavigateToSection(section);
    }

}

// ================================================================================
// FUNÇÕES GLOBAIS DO DASHBOARD
// ================================================================================

function refreshDashboard() {
    console.log('🔄 Atualizando dashboard...');
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Atualizando...';
    btn.disabled = true;
    
    // OTIMIZADO: Forçar atualização via walletMenuManager
    if (window.walletMenuManager) {
        window.walletMenuManager.forceUpdate();
    }
    
    // Disparar evento de refresh
    const refreshEvent = new CustomEvent('dashboardRefresh', {
        detail: { timestamp: new Date().toISOString() }
    });
    document.dispatchEvent(refreshEvent);

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        console.log('✅ Dashboard atualizado');
    }, 1500);
}

function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        console.log('🚪 Fazendo logout do sistema...');
        
        // OTIMIZADO: Desconectar via web3Manager se disponível
        if (window.web3Manager && typeof window.web3Manager.disconnectWallet === 'function') {
            window.web3Manager.disconnectWallet();
        }
        
        // Limpar dados locais
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirecionar para página de autenticação
        window.location.href = '/auth.html';
    }
}


// ================================================================================
// INICIALIZAÇÃO
// ================================================================================

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que outros scripts carregaram
    setTimeout(() => {
        // Criar instância global do manager
        window.dashboardMenuManager = new DashboardMenuManager();
        console.log('✅ DashboardMenuManager Otimizado inicializado');
        
        // Disponibilizar função logout globalmente
        window.logout = logout;
        console.log('🚪 Função logout disponível globalmente');
    }, 100);
});