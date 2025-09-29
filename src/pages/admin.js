/**
 * ================================================================================
 * ADMIN.JS - Funcionalidades do Painel de Administração
 * ================================================================================
 * Gerenciamento de configurações e controle de acesso admin
 * ================================================================================
 */

class AdminPanel {
    constructor() {
        this.config = null;
        this.currentWallet = null;
        this.isAdmin = false;
    }

    async init() {
        console.log('🔧 Inicializando painel admin...');
        await this.checkWalletConnection();
        await this.loadConfig();
        
        // Verificar se é admin após carregar config
        if (this.currentWallet && this.config) {
            this.checkAdminAccess();
        }
        
        this.setupEventListeners();
    }

    async checkWalletConnection() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                    this.currentWallet = accounts[0];
                    const display = this.currentWallet.slice(0, 6) + '...' + this.currentWallet.slice(-4);
                    document.getElementById('wallet-display').textContent = display;
                } else {
                    document.getElementById('wallet-display').innerHTML = 
                        '<button class="btn btn-sm btn-light" onclick="connectWallet()">Conectar</button>';
                }
            }
        } catch (error) {
            console.error('❌ Erro ao verificar wallet:', error);
        }
    }

    checkAdminAccess() {
        if (!this.currentWallet || !this.config) {
            this.showAccessDenied();
            return;
        }

        const adminAddresses = this.config.security.admin_addresses.map(addr => addr.toLowerCase());
        this.isAdmin = adminAddresses.includes(this.currentWallet.toLowerCase());

        if (!this.isAdmin) {
            this.showAccessDenied();
        } else {
            console.log('✅ Acesso admin autorizado');
            this.showAdminPanel();
        }
    }

    showAccessDenied() {
        document.body.innerHTML = `
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="card border-danger">
                            <div class="card-header bg-danger text-white text-center">
                                <h4><i class="fas fa-shield-alt me-2"></i>Acesso Restrito</h4>
                            </div>
                            <div class="card-body text-center">
                                <i class="fas fa-lock fs-1 text-danger mb-3"></i>
                                <h5>Painel de Administração</h5>
                                <p class="text-muted">Este painel é restrito apenas para administradores autorizados.</p>
                                
                                <div class="mt-4">
                                    <strong>Sua carteira:</strong><br>
                                    <code>${this.currentWallet || 'Não conectada'}</code>
                                </div>
                                
                                <div class="mt-4">
                                    <strong>Administradores autorizados:</strong><br>
                                    <small class="text-muted">
                                        0x0b81...c4bc5 (Andre)<br>
                                        0xc9D6...B6D8 (Flavio)
                                    </small>
                                </div>
                                
                                <div class="mt-4">
                                    ${this.currentWallet ? 
                                        '<button class="btn btn-warning me-2" onclick="connectWallet()">Trocar Carteira</button>' : 
                                        '<button class="btn btn-primary me-2" onclick="connectWallet()">Conectar Carteira</button>'
                                    }
                                    <a href="dashboard.html" class="btn btn-outline-secondary">Voltar ao Dashboard</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showAdminPanel() {
        // Panel já está visível, apenas habilita funcionalidades
        console.log('🎛️ Painel admin habilitado');
    }

    async loadConfig() {
        try {
            const response = await fetch('./admin-config.json');
            this.config = await response.json();
            this.updateUI();
            console.log('✅ Configurações carregadas');
        } catch (error) {
            console.error('❌ Erro ao carregar configurações:', error);
            this.showError('Erro ao carregar configurações');
        }
    }

    updateUI() {
        if (!this.config) return;

        // Rede atual
        const currentNetwork = this.config.platform_config.current_network;
        document.getElementById('current-network').textContent = 
            this.config.network_config[currentNetwork].name;
        document.getElementById('network-select').value = currentNetwork;

        // Admin wallet
        document.getElementById('admin-wallet-input').value = 
            this.config.platform_config.admin_wallet;

        // Defaults do contrato
        document.getElementById('default-token-name').value = 
            this.config.contract_defaults.token_name;
        document.getElementById('default-token-symbol').value = 
            this.config.contract_defaults.token_symbol;
        document.getElementById('default-decimals').value = 
            this.config.contract_defaults.token_decimals;
        document.getElementById('default-initial-supply').value = 
            this.config.contract_defaults.initial_supply;
        document.getElementById('default-price-usdt').value = 
            this.config.contract_defaults.price_in_usdt;
        document.getElementById('default-price-bnb').value = 
            this.config.contract_defaults.price_in_bnb;
        document.getElementById('platform-fee').value = 
            this.config.platform_config.fee_percentage;

        // Tokens suportados
        this.updateTokensTable();

        // JSON viewer
        document.getElementById('json-viewer').textContent = 
            JSON.stringify(this.config, null, 2);
    }

    updateTokensTable() {
        const tbody = document.getElementById('testnet-tokens');
        tbody.innerHTML = '';

        const testnetTokens = this.config.supported_tokens.testnet;
        Object.keys(testnetTokens).forEach(symbol => {
            const token = testnetTokens[symbol];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${symbol}</strong><br><small>${token.name}</small></td>
                <td><code>${token.address}</code></td>
                <td>${token.decimals}</td>
                <td><span class="badge bg-success">Ativo</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    setupEventListeners() {
        document.getElementById('network-select').addEventListener('change', (e) => {
            const network = e.target.value;
            document.getElementById('current-network').textContent = 
                this.config.network_config[network].name;
        });
    }

    async saveConfig() {
        try {
            // Atualizar config com valores da UI
            this.config.platform_config.current_network = 
                document.getElementById('network-select').value;
            this.config.platform_config.admin_wallet = 
                document.getElementById('admin-wallet-input').value;
            this.config.contract_defaults.token_name = 
                document.getElementById('default-token-name').value;
            this.config.contract_defaults.token_symbol = 
                document.getElementById('default-token-symbol').value;
            this.config.contract_defaults.token_decimals = 
                parseInt(document.getElementById('default-decimals').value);
            this.config.contract_defaults.initial_supply = 
                parseInt(document.getElementById('default-initial-supply').value);
            this.config.contract_defaults.price_in_usdt = 
                document.getElementById('default-price-usdt').value;
            this.config.contract_defaults.price_in_bnb = 
                document.getElementById('default-price-bnb').value;
            this.config.platform_config.fee_percentage = 
                parseFloat(document.getElementById('platform-fee').value);

            // Simular salvamento (em produção, enviaria para o servidor)
            console.log('💾 Configurações para salvar:', this.config);
            
            // Atualizar JSON viewer
            document.getElementById('json-viewer').textContent = 
                JSON.stringify(this.config, null, 2);
            
            this.showSuccess('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao salvar:', error);
            this.showError('Erro ao salvar configurações');
        }
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'danger');
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} alert-dismissible position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                const alert = new bootstrap.Alert(toast);
                alert.close();
            }
        }, 5000);
    }
}

// Função global para conectar wallet
async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            alert('MetaMask não encontrado!');
            return;
        }
        
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts && accounts.length > 0) {
            console.log('🔄 Carteira conectada, recarregando...');
            window.location.reload();
        }
    } catch (error) {
        console.error('❌ Erro ao conectar wallet:', error);
        if (error.code === 4001) {
            alert('Conexão rejeitada pelo usuário');
        } else {
            alert('Erro ao conectar wallet: ' + error.message);
        }
    }
}

// Funções globais
function saveConfig() {
    adminPanel.saveConfig();
}

function loadConfig() {
    adminPanel.loadConfig();
}

// Inicializar
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
    adminPanel.init();
});
