/*
================================================================================
WEB3 MANAGER OTIMIZADO - GERENCIAMENTO UNIFICADO WEB3
================================================================================
Sistema otimizado de integração Web3 com MetaMask e blockchain
Remove duplicações e utiliza configuração centralizada
================================================================================
*/

class Web3Manager {
    constructor() {
        // Estado da conexão
        this.web3 = null;
        this.provider = null;
        this.account = null;
        this.currentAccount = null;
        this.isConnected = false;
        this.connecting = false;
        this.chainId = null;
        this.currentNetwork = null;
        this.intentionalDisconnect = false; // Flag para desconexão intencional
        
        // Contratos suportados
        this.contracts = {};
        
        // Usar configuração centralizada
        this.config = window.BLOCKCHAIN_CONFIG || this.getFallbackConfig();
        
        this.init();
    }

    getFallbackConfig() {
        console.warn('⚠️ BLOCKCHAIN_CONFIG não encontrado, usando configuração de fallback');
        return {
            supportedChains: {
                56: 'Binance Smart Chain', 
                97: 'BSC Testnet'
            },
            supportedNetworks: {
                56: { name: 'BSC Mainnet', symbol: 'BNB', rpc: 'https://bsc-dataseed.binance.org/' },
                97: { name: 'BSC Testnet', symbol: 'tBNB', rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/' }
            }
        };
    }

    async init() {
        try {
            console.log('🌐 Inicializando Web3Manager Otimizado...');
            
            if (typeof window.ethereum !== 'undefined') {
                this.web3 = window.ethereum;
                this.provider = window.ethereum;
                
                await this.checkConnection();
                this.setupEventListeners();
                
                console.log('✅ Web3Manager inicializado com sucesso');
            } else {
                console.warn('⚠️ MetaMask não encontrado');
                this.showInstallMetaMask();
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar Web3Manager:', error);
        }
    }

    // ========================================================================
    // VERIFICAÇÃO E SETUP INICIAL
    // ========================================================================

    isMetaMaskAvailable() {
        return typeof window.ethereum !== 'undefined';
    }

    setupEventListeners() {
        if (this.web3) {
            this.web3.on('accountsChanged', (accounts) => {
                console.log('📱 Conta alterada:', accounts);
                this.handleAccountsChanged(accounts);
            });

            this.web3.on('chainChanged', (chainId) => {
                console.log('🔗 Rede alterada:', chainId);
                this.handleChainChanged(chainId);
            });

            this.web3.on('connect', (connectInfo) => {
                console.log('🔌 Conectado:', connectInfo);
            });

            this.web3.on('disconnect', (error) => {
                console.log('🔌 Desconectado:', error);
                this.handleDisconnect();
            });
        }
    }

    async checkConnection() {
        try {
            const accounts = await this.web3.request({ method: 'eth_accounts' });
            
            if (accounts.length > 0) {
                this.currentAccount = accounts[0];
                this.account = accounts[0];
                this.isConnected = true;
                
                // Obter chain ID atual
                const chainId = await this.web3.request({ method: 'eth_chainId' });
                this.chainId = parseInt(chainId, 16);
                this.currentNetwork = this.config.getNetworkInfo(this.chainId);
                
                console.log(`✅ Já conectado: ${this.formatAddress(this.currentAccount)} na rede ${this.chainId}`);
                
                // Notificar outros componentes
                this.notifyConnectionChange(true);
            } else {
                this.isConnected = false;
                console.log('ℹ️ MetaMask disponível mas não conectado');
            }
        } catch (error) {
            console.error('❌ Erro ao verificar conexão:', error);
            this.isConnected = false;
        }
    }

    // ========================================================================
    // FUNÇÃO GLOBAL CENTRALIZADA PARA TODOS OS COMPONENTES
    // ========================================================================
    
    /**
     * Função global para conectar carteira - usado por header, support, etc.
     * @param {boolean} redirectToDashboard - Se deve redirecionar após conectar
     * @returns {Promise<string|null>} - Endereço da carteira ou null
     */
    async connectWalletGlobal(redirectToDashboard = false) {
        try {
            console.log(`🔌 Conectar global - redirect: ${redirectToDashboard}`);
            
            const result = await this.connect();
            
            if (result && result.account) {
                console.log(`✅ Conectado globalmente: ${this.formatAddress(result.account)}`);
                
                // Redirecionar se solicitado
                if (redirectToDashboard) {
                    window.location.href = '/auth.html';
                }
                
                return result.account;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Erro na conexão global:', error);
            throw error;
        }
    }

    // ========================================================================
    // CONEXÃO E DESCONEXÃO
    // ========================================================================

    async connect() {
        try {
            if (!this.isMetaMaskAvailable()) {
                throw new Error('MetaMask não está instalado');
            }

            // Verificar se já está conectado
            if (this.isConnected && this.currentAccount) {
                console.log('✅ Já conectado:', this.formatAddress(this.currentAccount));
                return {
                    account: this.currentAccount,
                    chainId: this.chainId,
                    network: this.currentNetwork
                };
            }

            // Verificar se há uma solicitação pendente
            if (this.connecting) {
                console.log('⏳ Conexão já em andamento...');
                return null;
            }

            this.connecting = true;
            console.log('🔌 Solicitando conexão MetaMask...');
            
            try {
                const accounts = await this.web3.request({ method: 'eth_requestAccounts' });
                
                if (accounts.length > 0) {
                    this.currentAccount = accounts[0];
                    this.account = accounts[0];
                    this.isConnected = true;
                    
                    // Obter informações da rede
                    const chainId = await this.web3.request({ method: 'eth_chainId' });
                    this.chainId = parseInt(chainId, 16);
                    this.currentNetwork = this.config.getNetworkInfo(this.chainId);
                    
                    console.log(`✅ Conectado com sucesso: ${this.formatAddress(this.currentAccount)}`);
                    console.log(`🌐 Rede atual: ${this.currentNetwork?.name || this.chainId}`);
                    
                    // Notificar outros componentes
                    this.notifyConnectionChange(true);
                    
                    return {
                        account: this.currentAccount,
                        chainId: this.chainId,
                        network: this.currentNetwork
                    };
                } else {
                    throw new Error('Nenhuma conta conectada');
                }
            } finally {
                this.connecting = false;
            }
        } catch (error) {
            this.connecting = false;
            
            // Verificar se é erro de solicitação pendente
            if (error.message && error.message.includes('already pending')) {
                console.warn('⚠️ Solicitação de conexão já pendente. Aguarde a conclusão.');
                return null;
            }
            
            console.error('❌ Erro ao conectar:', error);
            this.isConnected = false;
            this.notifyConnectionChange(false);
            throw error;
        }
    }

    async disconnect() {
        try {
            this.intentionalDisconnect = true; // Marcar como desconexão intencional
            this.currentAccount = null;
            this.account = null;
            this.isConnected = false;
            this.chainId = null;
            this.currentNetwork = null;
            
            console.log('🔌 Desconectado do MetaMask');
            this.notifyConnectionChange(false);
            
            // Limpar flag após notificação
            setTimeout(() => {
                this.intentionalDisconnect = false;
            }, 1000);
            
        } catch (error) {
            console.error('❌ Erro ao desconectar:', error);
        }
    }

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    handleAccountsChanged(accounts) {
        // Ignorar mudanças durante desconexão intencional
        if (this.intentionalDisconnect) {
            console.log('🔌 Ignorando mudança de contas durante desconexão intencional');
            return;
        }
        
        if (accounts.length === 0) {
            this.disconnect();
        } else if (accounts[0] !== this.currentAccount) {
            this.currentAccount = accounts[0];
            this.account = accounts[0];
            this.isConnected = true;
            console.log(`👤 Conta alterada para: ${this.formatAddress(this.currentAccount)}`);
            this.notifyConnectionChange(true);
        }
    }

    handleChainChanged(chainId) {
        this.chainId = parseInt(chainId, 16);
        this.currentNetwork = this.config.getNetworkInfo(this.chainId);
        
        console.log(`🔗 Rede alterada para: ${this.currentNetwork?.name || this.chainId}`);
        
        // Verificar se a rede é suportada
        if (!this.config.isNetworkSupported(this.chainId)) {
            console.warn(`⚠️ Rede não suportada: ${this.chainId}`);
            this.notifyNetworkChange(this.chainId, false);
        } else {
            this.notifyNetworkChange(this.chainId, true);
        }
        
        // Recarregar a página pode ser necessário em algumas situações
        if (this.isConnected) {
            window.location.reload();
        }
    }

    handleDisconnect() {
        this.disconnect();
    }

    // ========================================================================
    // UTILITÁRIOS
    // ========================================================================

    formatAddress(address, length = 6) {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, length)}...${address.slice(-4)}`;
    }

    showInstallMetaMask() {
        console.log('🦊 Por favor, instale o MetaMask para continuar');
        
        // Pode mostrar um modal ou notificação para o usuário
        const message = `
            🦊 MetaMask não encontrado!
            
            Para usar este aplicativo, você precisa instalar o MetaMask:
            https://metamask.io/
        `;
        
        if (confirm(message + '\n\nDeseja visitar o site do MetaMask?')) {
            window.open('https://metamask.io/', '_blank');
        }
    }

    // ========================================================================
    // SISTEMA DE NOTIFICAÇÕES
    // ========================================================================

    notifyConnectionChange(isConnected) {
        // Disparar evento personalizado
        const event = new CustomEvent('web3ConnectionChanged', {
            detail: {
                isConnected,
                account: this.currentAccount,
                chainId: this.chainId,
                network: this.currentNetwork
            }
        });
        document.dispatchEvent(event);
    }

    notifyNetworkChange(chainId, isSupported) {
        const event = new CustomEvent('web3NetworkChanged', {
            detail: {
                chainId,
                isSupported,
                network: this.currentNetwork
            }
        });
        document.dispatchEvent(event);
    }

    // ========================================================================
    // API PÚBLICA
    // ========================================================================

    getAccount() {
        return this.currentAccount;
    }

    getChainId() {
        return this.chainId;
    }

    getCurrentNetwork() {
        return this.currentNetwork;
    }

    isConnectedToNetwork() {
        return this.isConnected;
    }

    getSupportedNetworks() {
        return this.config.getAllNetworks();
    }

    async switchNetwork(chainId) {
        try {
            await this.web3.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.config.toHex(chainId) }],
            });
            return true;
        } catch (error) {
            console.error('❌ Erro ao trocar rede:', error);
            return false;
        }
    }

    async addNetwork(chainId) {
        const networkInfo = this.config.getNetworkInfo(chainId);
        if (!networkInfo) {
            throw new Error(`Rede ${chainId} não suportada`);
        }

        try {
            await this.web3.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: this.config.toHex(chainId),
                    chainName: networkInfo.name,
                    nativeCurrency: {
                        name: networkInfo.symbol,
                        symbol: networkInfo.symbol,
                        decimals: 18
                    },
                    rpcUrls: [networkInfo.rpc],
                    blockExplorerUrls: [networkInfo.explorer]
                }]
            });
            return true;
        } catch (error) {
            console.error('❌ Erro ao adicionar rede:', error);
            return false;
        }
    }
}

// ========================================================================
// INSTÂNCIA GLOBAL E FUNÇÃO DE ACESSO SIMPLIFICADO
// ========================================================================
window.Web3Manager = Web3Manager;

// Função global simplificada para conexão de carteira
window.connectWalletGlobal = async function(redirectToDashboard = false) {
    if (window.web3Manager && typeof window.web3Manager.connectWalletGlobal === 'function') {
        return await window.web3Manager.connectWalletGlobal(redirectToDashboard);
    } else {
        console.error('❌ Web3Manager não disponível');
        return null;
    }
};

// Função global para verificar se está conectado
window.isWalletConnected = function() {
    return window.web3Manager && window.web3Manager.isConnected && window.web3Manager.currentAccount;
};

// Função global para obter conta atual
window.getCurrentAccount = function() {
    return window.web3Manager ? window.web3Manager.currentAccount : null;
};

console.log('🌐 Web3Manager Otimizado carregado com sucesso!');