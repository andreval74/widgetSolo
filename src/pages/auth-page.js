/**
 * ================================================================================
 * AUTH.JS - Sistema de Autenticação Web3
 * ================================================================================
 * Gerenciamento de autenticação via MetaMask e controle de usuários
 * ================================================================================
 */

class Web3Auth {
    constructor() {
        this.currentAddress = null;
        this.userType = null;
        this.authToken = null;
    }

    // Conectar carteira MetaMask
    async connectWallet() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask não está instalado. Por favor, instale o MetaMask primeiro.');
            }

            // Solicitar conexão
            const accounts = await ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('Nenhuma conta conectada');
            }

            this.currentAddress = accounts[0];
            console.log('🔗 Carteira conectada:', this.currentAddress);

            // Verificar tipo de usuário
            await this.authenticateUser();

        } catch (error) {
            console.error('Erro ao conectar:', error);
            this.showError('metamask-error', error.message);
        }
    }

    // Autenticar usuário via assinatura
    async authenticateUser() {
        try {
            this.showStep('loading');

            // Gerar mensagem única
            const timestamp = Date.now();
            const message = `XCafe Auth - ${timestamp}`;

            // Solicitar assinatura
            const signature = await ethereum.request({
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
        switch (authResult.userType) {
            case 'first_admin':
                document.getElementById('first-admin-address').textContent = this.currentAddress;
                this.showStep('step-first-admin');
                break;

            case 'Super Admin':
            case 'Admin':
            case 'Moderator':
                document.getElementById('admin-address').textContent = this.currentAddress;
                document.getElementById('admin-type').textContent = authResult.userType;
                document.getElementById('admin-type').className = `user-type-badge ${authResult.userType.toLowerCase().replace(' ', '-')}`;
                this.showStep('step-admin');
                break;

            case 'normal':
                document.getElementById('user-address').textContent = this.currentAddress;
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
                // Atualizar tipo de usuário
                this.userType = 'Super Admin';
                localStorage.setItem('userType', this.userType);

                // Mostrar painel admin
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

    // Entrar no painel admin
    enterAdmin() {
        window.location.href = '/admin-panel.html';
    }

    // Entrar na aplicação normal
    enterApp() {
        window.location.href = '/';
    }

    // Mostrar etapa específica
    showStep(stepId) {
        document.querySelectorAll('.auth-step').forEach(step => {
            step.classList.add('hidden');
        });
        document.getElementById(stepId).classList.remove('hidden');
    }

    // Mostrar erro
    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Instância global
const auth = new Web3Auth();

// Funções globais para os botões
async function connectWallet() {
    await auth.connectWallet();
}

async function setupFirstAdmin() {
    await auth.setupFirstAdmin();
}

function enterAdmin() {
    auth.enterAdmin();
}

function enterApp() {
    auth.enterApp();
}

// Verificar se já está conectado ao carregar
window.addEventListener('load', async () => {
    console.log('🚀 Sistema de autenticação Web3 carregado');
    
    // Verificar se MetaMask já está conectado
    if (window.ethereum) {
        try {
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                console.log('✅ Carteira já conectada, fazendo auto-login...');
                auth.currentAddress = accounts[0];
                await auth.authenticateUser();
            }
        } catch (error) {
            console.log('Não foi possível fazer auto-login:', error.message);
        }
    }
});

// Detectar mudança de conta no MetaMask
if (window.ethereum) {
    ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            // Desconectado
            localStorage.clear();
            location.reload();
        } else if (accounts[0] !== auth.currentAddress) {
            // Conta mudou
            console.log('🔄 Conta alterada, recarregando...');
            localStorage.clear();
            location.reload();
        }
    });
}
