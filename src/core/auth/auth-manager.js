/*
================================================================================
AUTH MANAGER OTIMIZADO - SISTEMA DE AUTENTICAÇÃO WEB3
================================================================================
Sistema de autenticação otimizado que usa Web3Manager e configuração centralizada
Remove duplicações e foca apenas em autenticação e gerenciamento de sessão
================================================================================
*/

class AuthManager {
    constructor(dataManager, web3Manager) {
        this.dataManager = dataManager;
        this.web3Manager = web3Manager || window.web3ManagerInstance;
        this.currentAccount = null;
        this.currentNetwork = null;
        this.isAuthenticated = false;
        this.config = window.BLOCKCHAIN_CONFIG;
        
        this.init();
    }

    // ========================================================================
    // INICIALIZAÇÃO
    // ========================================================================
    
    async init() {
        try {
            console.log('🔐 Inicializando AuthManager Otimizado...');
            
            if (!this.web3Manager) {
                console.warn('⚠️ Web3Manager não encontrado, funcionalidade limitada');
                return;
            }

            // Escutar eventos do Web3Manager
            this.setupWeb3EventListeners();
            
            // Verificar se já há uma sessão ativa
            await this.checkExistingSession();
            
            console.log('✅ AuthManager inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar AuthManager:', error);
        }
    }

    setupWeb3EventListeners() {
        // Escutar mudanças de conexão
        document.addEventListener('web3ConnectionChanged', (event) => {
            const { isConnected, account, chainId, network } = event.detail;
            this.handleConnectionChanged(isConnected, account, chainId, network);
        });

        // Escutar mudanças de rede
        document.addEventListener('web3NetworkChanged', (event) => {
            const { chainId, isSupported, network } = event.detail;
            this.handleNetworkChanged(chainId, isSupported, network);
        });
    }

    // ========================================================================
    // AUTENTICAÇÃO
    // ========================================================================

    async connect() {
        try {
            if (!this.web3Manager) {
                throw new Error('Web3Manager não disponível');
            }

            console.log('🔐 Iniciando processo de autenticação...');

            // Conectar via Web3Manager
            const connectionResult = await this.web3Manager.connect();
            
            if (connectionResult && connectionResult.account) {
                // Verificar/criar usuário no sistema
                await this.authenticateUser(connectionResult.account, connectionResult.chainId);
                
                return {
                    success: true,
                    account: this.currentAccount,
                    network: this.currentNetwork,
                    isAuthenticated: this.isAuthenticated
                };
            } else {
                throw new Error('Falha ao conectar MetaMask');
            }
        } catch (error) {
            console.error('❌ Erro na autenticação:', error);
            this.isAuthenticated = false;
            throw error;
        }
    }

    async authenticateUser(account, chainId) {
        try {
            this.currentAccount = account;
            this.currentNetwork = this.config?.getNetworkInfo(chainId) || { name: `Chain ${chainId}`, chainId };
            
            // Verificar se é usuário existente ou criar novo
            if (this.dataManager) {
                const existingUser = await this.dataManager.getUser(account);
                
                if (!existingUser) {
                    // Criar novo usuário
                    const userData = {
                        walletAddress: account,
                        createdAt: new Date().toISOString(),
                        lastLogin: new Date().toISOString(),
                        preferredNetwork: chainId,
                        isAdmin: false,
                        credits: 0 // Créditos iniciais, pode ser configurável
                    };
                    
                    await this.dataManager.createUser(account, userData);
                    console.log('👤 Novo usuário criado:', window.CoreUtils ? window.CoreUtils.formatAddress(account) : this.formatAddress(account));
                } else {
                    // Atualizar último login
                    existingUser.lastLogin = new Date().toISOString();
                    existingUser.preferredNetwork = chainId;
                    await this.dataManager.updateUser(account, existingUser);
                    console.log('👤 Usuário existente autenticado:', this.formatAddress(account));
                }
            }
            
            this.isAuthenticated = true;
            
            // Salvar sessão no localStorage
            this.saveSession();
            
            // Notificar outros componentes
            this.notifyAuthenticationChange(true);
            
            console.log(`✅ Usuário autenticado: ${this.formatAddress(account)} na rede ${this.currentNetwork.name}`);
        } catch (error) {
            console.error('❌ Erro ao autenticar usuário:', error);
            this.isAuthenticated = false;
            throw error;
        }
    }

    async disconnect() {
        try {
            // Limpar dados de autenticação
            this.currentAccount = null;
            this.currentNetwork = null;
            this.isAuthenticated = false;
            
            // Limpar sessão
            this.clearSession();
            
            // Notificar desconexão
            this.notifyAuthenticationChange(false);
            
            console.log('🔐 Usuário desautenticado');
        } catch (error) {
            console.error('❌ Erro ao desconectar:', error);
        }
    }

    // ========================================================================
    // GERENCIAMENTO DE SESSÃO
    // ========================================================================

    saveSession() {
        const sessionData = {
            account: this.currentAccount,
            network: this.currentNetwork,
            timestamp: Date.now(),
            isAuthenticated: this.isAuthenticated
        };
        
        localStorage.setItem('xcafe-auth-session', JSON.stringify(sessionData));
    }

    async checkExistingSession() {
        try {
            const sessionData = localStorage.getItem('xcafe-auth-session');
            
            if (!sessionData) {
                console.log('ℹ️ Nenhuma sessão anterior encontrada');
                return false;
            }
            
            const session = JSON.parse(sessionData);
            const sessionAge = Date.now() - session.timestamp;
            const maxSessionAge = 24 * 60 * 60 * 1000; // 24 horas
            
            // Verificar se sessão não expirou
            if (sessionAge > maxSessionAge) {
                console.log('⏰ Sessão expirada');
                this.clearSession();
                return false;
            }
            
            // Verificar se ainda está conectado ao MetaMask
            if (this.web3Manager && this.web3Manager.isConnectedToNetwork()) {
                const currentAccount = this.web3Manager.getAccount();
                
                if (currentAccount && currentAccount.toLowerCase() === session.account.toLowerCase()) {
                    // Restaurar sessão
                    this.currentAccount = session.account;
                    this.currentNetwork = session.network;
                    this.isAuthenticated = true;
                    
                    console.log('✅ Sessão anterior restaurada:', this.formatAddress(this.currentAccount));
                    this.notifyAuthenticationChange(true);
                    return true;
                }
            }
            
            // Se chegou até aqui, limpar sessão inválida
            this.clearSession();
            return false;
        } catch (error) {
            console.error('❌ Erro ao verificar sessão:', error);
            this.clearSession();
            return false;
        }
    }

    clearSession() {
        localStorage.removeItem('xcafe-auth-session');
    }

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    handleConnectionChanged(isConnected, account, chainId, network) {
        if (!isConnected) {
            this.disconnect();
        } else if (account !== this.currentAccount) {
            // Nova conta conectada
            this.authenticateUser(account, chainId).catch(console.error);
        }
    }

    handleNetworkChanged(chainId, isSupported, network) {
        if (this.isAuthenticated) {
            this.currentNetwork = network;
            
            if (!isSupported) {
                console.warn(`⚠️ Rede não suportada: ${network?.name || chainId}`);
                // Pode mostrar aviso ao usuário sobre rede não suportada
            }
            
            // Atualizar preferência de rede do usuário
            if (this.dataManager && this.currentAccount) {
                this.dataManager.getUser(this.currentAccount).then(user => {
                    if (user) {
                        user.preferredNetwork = chainId;
                        this.dataManager.updateUser(this.currentAccount, user);
                    }
                }).catch(console.error);
            }
            
            // Salvar sessão atualizada
            this.saveSession();
        }
    }

    // ========================================================================
    // SISTEMA DE NOTIFICAÇÕES
    // ========================================================================

    notifyAuthenticationChange(isAuthenticated) {
        const event = new CustomEvent('authStateChanged', {
            detail: {
                isAuthenticated,
                account: this.currentAccount,
                network: this.currentNetwork
            }
        });
        document.dispatchEvent(event);
    }

    // ========================================================================
    // UTILITÁRIOS
    // ========================================================================

    formatAddress(address, length = 6) {
        return window.CoreUtils ? window.CoreUtils.formatAddress(address, length) : 
               (address ? `${address.slice(0, length)}...${address.slice(-4)}` : address);
    }

    // ========================================================================
    // API PÚBLICA
    // ========================================================================

    isConnected() {
        return this.isAuthenticated;
    }

    getCurrentAccount() {
        return this.currentAccount;
    }

    getCurrentNetwork() {
        return this.currentNetwork;
    }

    isNetworkSupported(chainId = null) {
        const targetChainId = chainId || (this.currentNetwork ? this.currentNetwork.chainId : null);
        return this.config ? this.config.isNetworkSupported(targetChainId) : false;
    }

    async getUserData() {
        if (!this.dataManager || !this.currentAccount) {
            return null;
        }
        
        try {
            return await this.dataManager.getUser(this.currentAccount);
        } catch (error) {
            console.error('❌ Erro ao obter dados do usuário:', error);
            return null;
        }
    }

    async updateUserData(updates) {
        if (!this.dataManager || !this.currentAccount) {
            throw new Error('DataManager ou conta não disponível');
        }
        
        try {
            const currentUser = await this.dataManager.getUser(this.currentAccount);
            if (currentUser) {
                const updatedUser = { ...currentUser, ...updates };
                await this.dataManager.updateUser(this.currentAccount, updatedUser);
                return updatedUser;
            }
            throw new Error('Usuário não encontrado');
        } catch (error) {
            console.error('❌ Erro ao atualizar dados do usuário:', error);
            throw error;
        }
    }
}

// ========================================================================
// INSTÂNCIA GLOBAL
// ========================================================================
window.AuthManager = AuthManager;

console.log('🔐 AuthManager Otimizado carregado com sucesso!');