/**
 * ================================================================================
 * AUTH PAGE - Sistema de Autenticação Web3 (Otimizado)
 * ================================================================================
 * Página de autenticação que usa AuthManager centralizado
 * Remove duplicações e delega para módulos centrais
 * ================================================================================
 */

class AuthPageController {
    constructor() {
        this.authManager = null;
        this.web3Manager = null;
        this.currentAddress = null;
        this.userType = null;
        this.authToken = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando página de autenticação...');
        
        // Aguardar carregamento dos managers
        await this.waitForManagers();
        
        // Verificar se já está conectado
        await this.checkExistingConnection();
    }

    async waitForManagers() {
        // Aguardar AuthManager e Web3Manager
        let attempts = 0;
        while ((!window.AuthManager || !window.Web3Manager) && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (window.AuthManager && window.Web3Manager) {
            this.web3Manager = new window.Web3Manager();
            this.authManager = new window.AuthManager(null, this.web3Manager);
            console.log('✅ Managers carregados para página de autenticação');
        } else {
            console.error('❌ Managers não disponíveis');
        }
    }

    // Conectar carteira (delega para AuthManager)
    async connectWallet() {
        try {
            if (!this.authManager) {
                throw new Error('AuthManager não disponível');
            }

            this.showStep('loading');

            const result = await this.authManager.connect();
            
            if (result.success) {
                this.currentAddress = result.account;
                await this.authenticateUser();
            } else {
                throw new Error(result.error || 'Falha na conexão');
            }

        } catch (error) {
            console.error('Erro ao conectar:', error);
            this.showError('metamask-error', error.message);
            this.showStep('step-metamask');
        }
    }

    // Autenticar usuário via API
    async authenticateUser() {
        try {
            if (!this.currentAddress) {
                this.currentAddress = await window.CoreUtils.getCurrentAccount();
            }

            // Gerar mensagem única para assinatura
            const timestamp = Date.now();
            const message = `XCafe Auth - ${timestamp}`;

            // Solicitar assinatura via MetaMask
            const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, this.currentAddress]
            });

            // Enviar para backend
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: this.currentAddress,
                    message: message,
                    signature: signature,
                    timestamp: timestamp
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Falha na autenticação');
            }

            // Armazenar dados
            this.userType = result.userType;
            this.authToken = result.token;
            localStorage.setItem('authToken', this.authToken);
            localStorage.setItem('userAddress', this.currentAddress);
            localStorage.setItem('userType', this.userType);

            // Mostrar interface apropriada
            this.showUserInterface(result);

        } catch (error) {
            console.error('Erro na autenticação:', error);
            this.showError('metamask-error', error.message);
            this.showStep('step-metamask');
        }
    }

    // Mostrar interface baseada no tipo de usuário
    showUserInterface(authResult) {
        const address = window.CoreUtils ? window.CoreUtils.formatAddress(this.currentAddress) : this.currentAddress;
        
        switch (authResult.userType) {
            case 'first_admin':
                document.getElementById('first-admin-address').textContent = address;
                this.showStep('step-first-admin');
                break;

            case 'Super Admin':
            case 'Admin':
            case 'Moderator':
                document.getElementById('admin-address').textContent = address;
                document.getElementById('admin-type').textContent = authResult.userType;
                document.getElementById('admin-type').className = `user-type-badge ${authResult.userType.toLowerCase().replace(' ', '-')}`;
                this.showStep('step-admin');
                break;

            case 'normal':
                document.getElementById('user-address').textContent = address;
                this.showStep('step-user');
                break;

            default:
                throw new Error('Tipo de usuário não reconhecido');
        }
    }

    // Setup do primeiro admin
    async setupFirstAdmin() {
        try {
            document.getElementById('setup-loading').style.display = 'block';

            const response = await fetch('/api/system/setup', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    address: this.currentAddress,
                    userType: 'Super Admin'
                })
            });

            const result = await response.json();

            if (result.success) {
                this.userType = 'Super Admin';
                localStorage.setItem('userType', this.userType);

                setTimeout(() => {
                    this.enterAdmin();
                }, 1000);
            } else {
                throw new Error(result.error || 'Erro no setup');
            }

        } catch (error) {
            console.error('Erro no setup:', error);
            alert('Erro no setup: ' + error.message);
            document.getElementById('setup-loading').style.display = 'none';
        }
    }

    // Verificar conexão existente
    async checkExistingConnection() {
        if (this.authManager && this.authManager.isAuthenticated) {
            console.log('✅ Já autenticado, redirecionando...');
            this.enterApp();
            return;
        }

        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    console.log('✅ Carteira já conectada, fazendo auto-login...');
                    this.currentAddress = accounts[0];
                    await this.authenticateUser();
                }
            } catch (error) {
                console.log('Não foi possível fazer auto-login:', error.message);
            }
        }
    }

    // Navegação
    enterAdmin() {
        window.location.href = '/admin-panel.html';
    }

    enterApp() {
        window.location.href = '/';
    }

    // UI Helpers
    showStep(stepId) {
        document.querySelectorAll('.auth-step').forEach(step => {
            step.classList.add('hidden');
        });
        document.getElementById(stepId).classList.remove('hidden');
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
}

// ========================================================================
// INSTÂNCIA GLOBAL E FUNÇÕES DE COMPATIBILIDADE
// ========================================================================

// Instância global
let authPageController = null;

// Inicialização
window.addEventListener('load', async () => {
    authPageController = new AuthPageController();
});

// Funções globais para os botões (compatibilidade)
async function connectWallet() {
    if (authPageController) {
        await authPageController.connectWallet();
    }
}

async function setupFirstAdmin() {
    if (authPageController) {
        await authPageController.setupFirstAdmin();
    }
}

function enterAdmin() {
    if (authPageController) {
        authPageController.enterAdmin();
    }
}

function enterApp() {
    if (authPageController) {
        authPageController.enterApp();
    }
}

// Detectar mudança de conta no MetaMask
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            localStorage.clear();
            location.reload();
        } else if (authPageController && accounts[0] !== authPageController.currentAddress) {
            console.log('🔄 Conta alterada, recarregando...');
            localStorage.clear();
            location.reload();
        }
    });
}

console.log('🔐 Página de autenticação otimizada carregada!');
