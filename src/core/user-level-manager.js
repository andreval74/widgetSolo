/**
 * ================================================================================
 * USER LEVEL MANAGER - WIDGET SAAS
 * ================================================================================
 * Gerencia o nível do usuário (Admin/User) e controle de menus
 * ================================================================================
 */

class UserLevelManager {
    constructor() {
        this.userLevel = null;
        this.currentOpenMenu = null;
        this.init();
    }

    init() {
        console.log('👤 Inicializando User Level Manager...');
        this.checkUserLevel();
        this.setupMenuBehavior();
        this.updateWalletDisplay();
    }

    /**
     * Verifica o nível do usuário (simular por enquanto)
     */
    async checkUserLevel() {
        try {
            // TODO: Substituir pela chamada real da API
            // const response = await apiManager.get('/api/user/level');
            // this.userLevel = response.level;
            
            // Simulação - verificar localStorage ou API
            this.userLevel = this.simulateUserLevel();
            console.log('👤 Nível do usuário:', this.userLevel);
            
            this.applyUserLevelStyles();
            
        } catch (error) {
            console.error('❌ Erro ao verificar nível do usuário:', error);
            this.userLevel = 'user'; // Fallback para usuário comum
            this.applyUserLevelStyles();
        }
    }

    /**
     * Simula verificação de nível do usuário
     */
     simulateUserLevel() {
        // TEMPORÁRIO: Todos os usuários são tratados como admin
        // No final do sistema, integrar função real para verificar nível
        console.log('⚠️ MODO ADMIN GERAL - Todos os usuários têm acesso completo');
        return 'admin';
        
        /* CÓDIGO PARA ATIVAÇÃO FUTURA:
        const wallet = document.getElementById('connected-wallet-address')?.textContent;
        
        // Lista de carteiras admin (substituir pela verificação real)
        const adminWallets = [
            '0x123...abc', // Exemplo de carteira admin
            // Adicionar mais carteiras admin conforme necessário
        ];
        
        // Verificar se é admin ou usuário comum
        if (wallet && adminWallets.some(adminWallet => wallet.includes(adminWallet))) {
            return 'admin';
        }
        
        // Por padrão, assumir usuário comum
        return 'user';
        */
    }

    /**
     * Aplica estilos baseados no nível do usuário
     */
    applyUserLevelStyles() {
        const walletInfo = document.querySelector('.wallet-info');
        const walletAddress = document.getElementById('connected-wallet-address');
        
        if (!walletInfo) return;

        // Remover classes existentes
        walletInfo.classList.remove('admin', 'user');
        
        // Adicionar classe baseada no nível
        walletInfo.classList.add(this.userLevel);
        
        // Adicionar badge de nível se não existir
        let levelBadge = walletInfo.querySelector('.user-level-badge');
        if (!levelBadge) {
            levelBadge = document.createElement('span');
            levelBadge.className = 'user-level-badge';
            walletInfo.appendChild(levelBadge);
        }
        
        // Atualizar badge
        levelBadge.classList.remove('admin', 'user');
        levelBadge.classList.add(this.userLevel);
        levelBadge.textContent = this.userLevel === 'admin' ? 'ADMIN' : 'USER';
        
        console.log(`🎨 Aplicados estilos para nível: ${this.userLevel}`);
    }

    /**
     * Configura comportamento dos menus (um aberto por vez)
     */
    setupMenuBehavior() {
        const menuToggles = document.querySelectorAll('[data-bs-toggle="collapse"]');
        
        menuToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const targetId = toggle.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    this.handleMenuToggle(targetId, targetElement, toggle);
                }
            });
        });
        
        console.log('🎛️ Comportamento de menus configurado');
    }

    /**
     * Gerencia abertura/fechamento de menus (um por vez)
     */
    handleMenuToggle(menuId, menuElement, toggleElement) {
        const isCurrentlyOpen = menuElement.classList.contains('show');
        
        // Se há um menu aberto e não é o atual, fechá-lo
        if (this.currentOpenMenu && this.currentOpenMenu !== menuId) {
            this.closeMenu(this.currentOpenMenu);
        }
        
        // Se o menu atual não está aberto, abri-lo
        if (!isCurrentlyOpen) {
            this.currentOpenMenu = menuId;
            console.log('📂 Abrindo menu:', menuId);
        } else {
            // Se está fechando o menu atual
            this.currentOpenMenu = null;
            console.log('📁 Fechando menu:', menuId);
        }
    }

    /**
     * Fecha um menu específico
     */
    closeMenu(menuId) {
        const menuElement = document.getElementById(menuId);
        const toggleElement = document.querySelector(`[href="#${menuId}"]`);
        
        if (menuElement && toggleElement) {
            // Usar Bootstrap collapse para fechar
            const bsCollapse = new bootstrap.Collapse(menuElement, { toggle: false });
            bsCollapse.hide();
            
            // Atualizar aria-expanded
            toggleElement.setAttribute('aria-expanded', 'false');
            toggleElement.classList.add('collapsed');
            
            console.log('🔒 Menu fechado:', menuId);
        }
    }

    /**
     * Atualiza display da carteira baseado no nível
     */
    updateWalletDisplay() {
        const walletAddress = document.getElementById('connected-wallet-address');
        if (!walletAddress) return;
        
        // Observar mudanças no conteúdo da carteira
        const observer = new MutationObserver(() => {
            if (walletAddress.textContent !== 'Conectando...') {
                this.checkUserLevel();
            }
        });
        
        observer.observe(walletAddress, { 
            childList: true, 
            characterData: true, 
            subtree: true 
        });
    }

    /**
     * Força atualização do nível do usuário
     */
    async refreshUserLevel() {
        console.log('🔄 Atualizando nível do usuário...');
        await this.checkUserLevel();
    }

    /**
     * Retorna o nível atual do usuário
     */
    getUserLevel() {
        return this.userLevel;
    }

    /**
     * Verifica se o usuário é admin
     */
    isAdmin() {
        return this.userLevel === 'admin';
    }

    /**
     * Verifica se o usuário é user comum
     */
    isUser() {
        return this.userLevel === 'user';
    }
}

// ================================================================================
// INICIALIZAÇÃO
// ================================================================================

// Instância global
let userLevelManager = null;

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        userLevelManager = new UserLevelManager();
        
        // Disponibilizar globalmente
        window.userLevelManager = userLevelManager;
        
        console.log('✅ User Level Manager inicializado');
    }, 100);
});