/*
================================================================================
WALLET MENU MANAGER OTIMIZADO - Widget SaaS
================================================================================
Sistema otimizado para gerenciar informações de carteira em menus
Delega funcionalidades principais para web3Manager (sem duplicação)
================================================================================
*/

class WalletMenuManager {
    constructor() {
        this.updateInterval = null;
        this.init();
    }

    init() {
        console.log('🔗 Inicializando WalletMenuManager Otimizado...');
        this.setupEventListeners();
        this.startPeriodicUpdate();
        
        // Verificar conexão inicial após pequeno delay
        setTimeout(() => {
            this.updateAllElements();
        }, 500);
    }

    setupEventListeners() {
        // Escutar eventos Web3 globais (já disparados pelo web3Manager)
        document.addEventListener('web3walletConnected', (event) => {
            console.log('✅ WalletMenuManager: Carteira conectada via evento');
            this.updateAllElements();
        });

        document.addEventListener('web3walletDisconnected', () => {
            console.log('❌ WalletMenuManager: Carteira desconectada via evento');
            this.updateAllElements();
        });

        // REMOVIDO: setupEventListeners duplicados do MetaMask
        // web3Manager já gerencia esses eventos
    }

    async updateAllElements() {
        // DELEGAÇÃO: Usar web3Manager como fonte de verdade
        const isConnected = this.getConnectionStatus();
        const currentAddress = this.getCurrentAddress();

        console.log(`🔄 Atualizando elementos - Conectado: ${isConnected}, Endereço: ${currentAddress}`);

        // Atualizar elementos do dashboard menu
        this.updateDashboardMenuElements(isConnected, currentAddress);
        
        // Atualizar elementos do header
        this.updateHeaderElements(isConnected, currentAddress);

        // Atualizar outros elementos genéricos
        this.updateGenericElements(isConnected, currentAddress);
    }

    updateDashboardMenuElements(isConnected, currentAddress) {
        // Atualizar endereço da carteira no dashboard menu
        const addressElement = document.getElementById('connected-wallet-address');
        if (addressElement) {
            if (isConnected && currentAddress) {
                addressElement.textContent = this.getShortAddress(currentAddress);
                addressElement.className = 'badge bg-success d-block text-center py-1';
            } else {
                addressElement.textContent = 'Conectando...';
                addressElement.className = 'badge bg-secondary d-block text-center py-1';
            }
        }

        // Atualizar status de conexão no dashboard menu
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            if (isConnected && currentAddress) {
                statusElement.innerHTML = `<i class="fas fa-circle me-1 text-success"></i>${this.getShortAddress(currentAddress)}`;
            } else {
                statusElement.innerHTML = '<i class="fas fa-circle me-1 text-warning"></i>Conectando...';
            }
        }
    }

    updateHeaderElements(isConnected, currentAddress) {
        // Atualizar botão de carteira no header (compatibilidade com header.js)
        const walletBtn = document.getElementById('connect-wallet-btn');
        const walletText = document.getElementById('wallet-text');
        
        if (walletBtn && walletText) {
            if (isConnected && currentAddress) {
                walletBtn.classList.add('connected');
                walletBtn.title = `Conectado: ${currentAddress}`;
                walletText.textContent = this.getShortAddress(currentAddress);
            } else {
                walletBtn.classList.remove('connected');
                walletBtn.title = 'Conectar Carteira';
                walletText.textContent = 'Conectar';
            }
        }
    }

    updateGenericElements(isConnected, currentAddress) {
        // Atualizar elementos genéricos que mostram informações da carteira
        const walletElements = document.querySelectorAll('.wallet-address-display');
        walletElements.forEach(element => {
            if (isConnected && currentAddress) {
                element.textContent = this.getShortAddress(currentAddress);
                element.classList.add('connected');
            } else {
                element.textContent = 'Não conectado';
                element.classList.remove('connected');
            }
        });

        // Atualizar informações de rede
        const networkElements = document.querySelectorAll('.network-info-display');
        networkElements.forEach(element => {
            if (isConnected) {
                element.textContent = this.getNetworkName();
            } else {
                element.textContent = 'Não conectado';
            }
        });
    }

    // ================================================================================
    // MÉTODOS DELEGADOS (usam web3Manager quando disponível)
    // ================================================================================

    getShortAddress(address) {
        // Usar CoreUtils se disponível
        if (window.CoreUtils) {
            return window.CoreUtils.formatAddress(address);
        }
        
        // DELEGAÇÃO: Usar web3Manager se disponível
        if (window.web3Manager && window.web3Manager.formatAddress) {
            return window.web3Manager.formatAddress(address);
        }
        
        // Fallback simples (caso nem CoreUtils nem web3Manager estejam disponíveis)
        if (!address) return 'Não conectado';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    getNetworkName() {
        // DELEGAÇÃO: Usar web3Manager se disponível
        if (window.web3Manager && window.web3Manager.getNetworkName) {
            return window.web3Manager.getNetworkName();
        }
        
        // Fallback simples
        return 'BSC Mainnet';
    }

    getCurrentAddress() {
        // DELEGAÇÃO: Usar web3Manager como fonte principal
        if (window.web3Manager && window.web3Manager.account) {
            return window.web3Manager.account;
        }
        
        return null;
    }

    getConnectionStatus() {
        // DELEGAÇÃO: Usar web3Manager como fonte principal  
        if (window.web3Manager) {
            return window.web3Manager.isConnected || false;
        }
        
        return false;
    }

    // ================================================================================
    // CONTROLE DE ATUALIZAÇÃO
    // ================================================================================

    startPeriodicUpdate() {
        // Atualizar a cada 15 segundos (menos frequente que antes)
        // web3Manager já gerencia a lógica principal
        this.updateInterval = setInterval(() => {
            this.updateAllElements();
        }, 15000);
    }

    stopPeriodicUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏹️ Polling de atualização parado');
        }
    }

    // ================================================================================
    // MÉTODOS PÚBLICOS PARA INTEGRAÇÃO
    // ================================================================================

    forceUpdate() {
        console.log('🔄 Forçando atualização manual...');
        this.updateAllElements();
    }
}

// ================================================================================
// INSTANCIAÇÃO E FUNÇÕES GLOBAIS
// ================================================================================

// Instanciar globalmente
window.walletMenuManager = new WalletMenuManager();

// Funções de conveniência globais (simplificadas)
window.refreshWalletInfo = () => {
    if (window.walletMenuManager) {
        window.walletMenuManager.forceUpdate();
    }
};

window.getCurrentWallet = () => {
    if (window.walletMenuManager) {
        return window.walletMenuManager.getCurrentAddress();
    }
    return null;
};

window.getWalletStatus = () => {
    if (window.walletMenuManager) {
        return window.walletMenuManager.getConnectionStatus();
    }
    return false;
};

console.log('✅ WalletMenuManager Otimizado carregado (delega para web3Manager)');