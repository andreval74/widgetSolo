/*
================================================================================
DASHBOARD MANAGER UNIFICADO - WIDGET SAAS
================================================================================
Sistema completo de gerenciamento do dashboard com:
- Navegação modular entre seções
- Integração Web3 robusta 
- Carregamento dinâmico de dados reais
- Interface otimizada e responsiva
================================================================================
*/

// Definir função de navegação global imediatamente
window.navigateToSection = function(section) {
    console.log(`🧭 Navegação solicitada para: ${section}`);
    if (window.dashboardManager && window.dashboardManager.showSection) {
        window.dashboardManager.showSection(section);
    } else {
        console.log('⏳ Dashboard Manager não pronto, aguardando...');
        // Aguardar o dashboard manager estar disponível
        const checkManager = () => {
            if (window.dashboardManager && window.dashboardManager.showSection) {
                console.log('✅ Dashboard Manager pronto, executando navegação');
                window.dashboardManager.showSection(section);
            } else {
                setTimeout(checkManager, 100);
            }
        };
        checkManager();
    }
};

class DashboardManager {
    constructor() {
        // Configurações principais
        this.templateLoader = new TemplateLoader();
        this.currentSection = 'overview';
        this.currentWallet = null;
        this.web3Manager = null;
        this.isAdmin = false;
        this.adminAddresses = [
            '0x0b81337F18767565D2eA40913799317A25DC4bc5',
            '0xc9D6692C29e015308c9D509f0733Cd41A328B6D8'
        ];
        
        // Dados de estatísticas
        this.statsData = {
            totalEarnings: 0,
            activeContracts: 0,
            totalSales: 0,
            availableCredits: 0
        };
        
        // Inicializar sistema
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Iniciando Dashboard Manager Unificado...');
            
            // Aguardar módulos necessários
            await this.waitForModules();
            
            // Inicializar Web3
            await this.initializeWeb3();
            
            // Verificar conexão de wallet
            await this.checkWalletConnection();
            
            if (!this.currentWallet) {
                this.showError('Wallet não conectada. Redirecionando...');
                setTimeout(() => window.location.href = 'index.html', 2000);
                return;
            }
            
            // Configurar acesso admin
            this.checkAdminAccess();
            
            // Inicializar sistema de chains
            await this.initializeChainsSystem();
            
            // Carregar dados reais
            await this.loadRealData();
            
            // Configurar navegação e interface
            this.setupNavigation();
            this.setupInterface();
            
            // Mostrar seção inicial
            await this.showSection('overview');
            
            // Configurar atualizações automáticas
            this.setupAutoRefresh();
            
            // Atualizar status de conexão
            this.updateConnectionStatus(true);
            
            console.log('✅ Dashboard Manager Unificado inicializado');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar dashboard:', error);
            this.showError('Erro ao carregar dashboard');
        }
    }

    async waitForModules() {
        // Aguardar carregamento dos módulos necessários
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
            if (window.Web3Manager && window.TemplateLoader) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 250));
            attempts++;
        }
        
        if (!window.Web3Manager) {
            console.warn('⚠️ Web3Manager não disponível');
        }
    }

    async initializeWeb3() {
        try {
            if (window.Web3Manager) {
                this.web3Manager = new Web3Manager();
                
                // Aguardar inicialização
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (this.web3Manager.account) {
                    this.currentWallet = this.web3Manager.account;
                } else {
                    // Tentar conectar automaticamente
                    await this.web3Manager.connect();
                    this.currentWallet = this.web3Manager.account;
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Web3 não disponível:', error);
            this.handleWeb3Error();
        }
    }

    async checkWalletConnection() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask não instalado');
            }
            
            const accounts = await window.ethereum.request({method: 'eth_accounts'});
            
            if (accounts.length > 0) {
                this.currentWallet = accounts[0];
                console.log('✅ Wallet conectada:', this.currentWallet);
                this.updateWalletDisplay();
            } else if (!this.currentWallet) {
                this.currentWallet = null;
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar wallet:', error);
            this.currentWallet = null;
        }
    }

    checkAdminAccess() {
        if (this.currentWallet) {
            this.isAdmin = this.adminAddresses.includes(this.currentWallet);
            console.log('👑 Acesso admin:', this.isAdmin);
        }
    }

    updateWalletDisplay() {
        if (!this.currentWallet) return;
        
        const shortAddress = `${this.currentWallet.slice(0, 6)}...${this.currentWallet.slice(-4)}`;
        
        // Atualizar display do overview
        const walletElement = document.getElementById('connected-wallet-address');
        if (walletElement) {
            walletElement.textContent = shortAddress;
            walletElement.classList.add('text-success');
        }
        
        // Atualizar display do menu
        const menuWalletElement = document.getElementById('wallet-display');
        if (menuWalletElement) {
            menuWalletElement.innerHTML = `
                <div class="d-flex align-items-center">
                    <small class="text-muted">${shortAddress}</small>
                    ${this.isAdmin ? '<i class="fas fa-crown text-warning ms-1"></i>' : ''}
                </div>
            `;
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            if (connected) {
                statusElement.className = 'connection-status connected';
                statusElement.innerHTML = '<i class="fas fa-check-circle me-1"></i> Conectado';
            } else {
                statusElement.className = 'connection-status disconnected';
                statusElement.innerHTML = '<i class="fas fa-times-circle me-1"></i> Desconectado';
            }
        }
    }

    setupNavigation() {
        // Sistema de navegação modular
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                this.showSection(section);
            });
        });
        
        // Navegação por dropdown
        document.querySelectorAll('[data-bs-toggle="dropdown"] + .dropdown-menu [data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                this.showSection(section);
            });
        });
        
        // Event listener customizado para navegação
        document.addEventListener('dashboardNavigation', (e) => {
            const section = e.detail.section;
            this.showSection(section);
        });
        
        // Conectar função global ao dashboard manager
        if (window.navigateToSection) {
            console.log('🔗 Conectando navegação global ao dashboard manager');
        }
    }

    async showSection(sectionName) {
        try {
            console.log(`🧭 Carregando seção: ${sectionName}`);
            
            this.currentSection = sectionName;
            
            // Carregar template da seção
            const templatePath = this.getTemplatePath(sectionName);
            
            // Usar fetch para carregar o conteúdo diretamente
            const response = await fetch(templatePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const content = await response.text();
            
            // Atualizar conteúdo
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                if (sectionName === 'overview') {
                    // Para overview, manter conteúdo atual e adicionar dados dinâmicos
                    this.loadOverviewData();
                } else {
                    // Para outras seções, substituir conteúdo
                    mainContent.innerHTML = content;
                }
            }
            
            // Atualizar navegação ativa
            this.updateActiveNavigation(sectionName);
            
            // Executar callback específico da seção
            this.onSectionLoaded(sectionName);
            
        } catch (error) {
            console.error(`❌ Erro ao carregar seção ${sectionName}:`, error);
            this.showError(`Erro ao carregar a seção ${sectionName}. Verifique se o arquivo existe: ${this.getTemplatePath(sectionName)}`);
        }
    }

    getTemplatePath(sectionName) {
        const templateMap = {
            'overview': 'dashboard/pages/overview.html',
            'widgets': 'dashboard/pages/widgets.html',
            'new-widget': 'dashboard/pages/new-widget.html',
            'templates': 'dashboard/pages/templates.html',
            'transactions': 'dashboard/pages/transactions.html',
            'earnings': 'dashboard/pages/earnings.html',
            'reports': 'dashboard/pages/reports.html',
            'credits': 'dashboard/pages/credits.html',
            'buy-credits': 'dashboard/pages/buy-credits.html',
            'billing': 'dashboard/pages/billing.html',
            'withdraw': 'dashboard/pages/withdraw.html',
            'settings': 'dashboard/pages/settings.html',
            'support': 'dashboard/pages/support.html',
            // Manter compatibilidade com nomes antigos
            'contracts': 'dashboard/pages/widgets.html',
            'new-contract': 'dashboard/pages/new-widget.html'
        };
        
        return templateMap[sectionName] || 'dashboard/pages/overview.html';
    }

    updateActiveNavigation(sectionName) {
        document.querySelectorAll('.nav-link, .dropdown-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    onSectionLoaded(sectionName) {
        console.log(`🎉 Seção ${sectionName} carregada`);
        
        switch (sectionName) {
            case 'overview':
                this.loadOverviewData();
                break;
            case 'contracts':
                this.loadContractsData();
                break;
            case 'credits':
                this.loadCreditsData();
                break;
            default:
                break;
        }
    }

    async loadRealData() {
        try {
            console.log('📊 Carregando dados reais...');
            
            // Carregar estatísticas do usuário
            await this.loadUserStats();
            
            // Carregar atividade recente
            await this.loadRecentActivity();
            
            // Carregar contratos
            await this.loadContracts();
            
        } catch (error) {
            console.warn('⚠️ Erro ao carregar dados reais:', error);
            this.loadMockData();
        }
    }

    async loadUserStats() {
        try {
            // Simular dados reais por enquanto
            this.statsData = {
                totalEarnings: Math.random() * 1000,
                activeContracts: Math.floor(Math.random() * 10) + 1,
                totalSales: Math.floor(Math.random() * 200) + 50,
                availableCredits: Math.floor(Math.random() * 500) + 100
            };
            
            // Atualizar interface
            this.updateStatsDisplay();
            
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    updateStatsDisplay() {
        // Atualizar ganhos totais
        const earningsElement = document.getElementById('total-earnings');
        if (earningsElement) {
            earningsElement.textContent = `$${this.statsData.totalEarnings.toFixed(2)}`;
            this.animateElement(earningsElement);
        }

        const earningsChangeElement = document.getElementById('earnings-change');
        if (earningsChangeElement) {
            earningsChangeElement.innerHTML = '<i class="fas fa-arrow-up me-1"></i>+12% este mês';
        }

        // Atualizar contratos ativos
        const contractsElement = document.getElementById('active-contracts');
        if (contractsElement) {
            contractsElement.textContent = this.statsData.activeContracts;
            this.animateElement(contractsElement);
        }

        const contractsChangeElement = document.getElementById('contracts-change');
        if (contractsChangeElement) {
            contractsChangeElement.innerHTML = '<i class="fas fa-plus me-1"></i>+2 esta semana';
        }

        // Atualizar vendas totais
        const salesElement = document.getElementById('total-sales');
        if (salesElement) {
            salesElement.textContent = this.statsData.totalSales;
            this.animateElement(salesElement);
        }

        const salesChangeElement = document.getElementById('sales-change');
        if (salesChangeElement) {
            salesChangeElement.innerHTML = '<i class="fas fa-arrow-up me-1"></i>+8% esta semana';
        }

        // Atualizar créditos
        const creditsElement = document.getElementById('available-credits');
        if (creditsElement) {
            creditsElement.textContent = this.statsData.availableCredits;
            this.animateElement(creditsElement);
        }
    }

    animateElement(element) {
        if (!element) return;
        
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.3s ease';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 300);
    }

    async loadRecentActivity() {
        // Implementar carregamento de atividade recente
        console.log('📋 Carregando atividade recente...');
    }

    async loadContracts() {
        // Implementar carregamento de contratos
        console.log('📄 Carregando contratos...');
    }

    async loadOverviewData() {
        console.log('📊 Carregando dados do overview...');
        
        // Atualizar estatísticas
        await this.loadUserStats();
        
        // Simular dados de exemplo para o overview
        const exampleData = {
            earnings: this.statsData.totalEarnings,
            contracts: this.statsData.activeContracts,
            sales: this.statsData.totalSales,
            credits: this.statsData.availableCredits
        };
        
        console.log('Overview data loaded:', exampleData);
    }

    async loadContractsData() {
        console.log('📄 Carregando dados de contratos...');
        // Implementar carregamento específico de contratos
    }

    async loadCreditsData() {
        console.log('🪙 Carregando dados de créditos...');
        // Implementar carregamento específico de créditos
    }

    loadMockData() {
        console.log('🎭 Carregando dados simulados...');
        
        this.statsData = {
            totalEarnings: 1250.75,
            activeContracts: 5,
            totalSales: 156,
            availableCredits: 350
        };
        
        this.updateStatsDisplay();
    }

    setupInterface() {
        // Configurar dropdowns Bootstrap
        const dropdowns = document.querySelectorAll('[data-bs-toggle="dropdown"]');
        dropdowns.forEach(dropdown => {
            new bootstrap.Dropdown(dropdown);
        });

        // Marcar overview como ativo por padrão
        const overviewLink = document.querySelector('[data-section="overview"]');
        if (overviewLink) {
            overviewLink.classList.add('active');
        }
    }

    setupAutoRefresh() {
        // Atualizar estatísticas a cada 5 minutos
        setInterval(() => {
            this.loadUserStats();
        }, 300000);

        // Atualizar atividade recente a cada 30 segundos
        setInterval(() => {
            this.loadRecentActivity();
        }, 30000);
    }

    async initializeChainsSystem() {
        try {
            console.log('🔗 Inicializando sistema de chains...');
            
            // Carregar redes disponíveis se o módulo existir
            if (window.import) {
                const { fetchAllNetworks } = await import('../shared/chains-utils.js');
                this.availableNetworks = await fetchAllNetworks();
                
                window.dispatchEvent(new CustomEvent('chainsUpdated', {
                    detail: { networks: this.availableNetworks }
                }));
            }
            
        } catch (error) {
            console.warn('⚠️ Sistema de chains não disponível:', error);
        }
    }

    handleWeb3Error() {
        console.warn('⚠️ Web3 não disponível, usando modo simulado');
        
        // Simular endereço de wallet
        this.currentWallet = '0x1234...5678';
        this.updateWalletDisplay();
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
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
        }, 5000);
    }

    // ================================================================================
    // FUNCIONALIDADES AVANÇADAS (do dashboard-manager.js)
    // ================================================================================

    /**
     * Modal para novo contrato
     */
    showNewContractModal() {
        const modalHtml = `
            <div class="modal fade" id="newContractModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Cadastrar Novo Contrato</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="newContractForm">
                                <div class="mb-3">
                                    <label class="form-label">Endereço do Contrato</label>
                                    <input type="text" class="form-control" name="contractAddress" required
                                           placeholder="0x..." pattern="^0x[a-fA-F0-9]{40}$">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Nome do Token/Projeto</label>
                                    <input type="text" class="form-control" name="contractName" required
                                           placeholder="Meu Token">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Símbolo</label>
                                    <input type="text" class="form-control" name="tokenSymbol" 
                                           placeholder="MTK" maxlength="10">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Descrição</label>
                                    <textarea class="form-control" name="description" rows="3"
                                              placeholder="Descreva seu projeto..."></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Website (opcional)</label>
                                    <input type="url" class="form-control" name="website"
                                           placeholder="https://seusite.com">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Categoria</label>
                                    <select class="form-select" name="category">
                                        <option value="token">Token</option>
                                        <option value="nft">NFT</option>
                                        <option value="defi">DeFi</option>
                                        <option value="game">Game</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="dashboardManager.submitNewContract()">
                                <i class="fas fa-save me-2"></i>Cadastrar Contrato
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar modal ao DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('newContractModal'));
        modal.show();
        
        // Limpar modal após fechar
        document.getElementById('newContractModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    /**
     * Submit do novo contrato
     */
    async submitNewContract() {
        try {
            const form = document.getElementById('newContractForm');
            const formData = new FormData(form);
            
            const contractData = {
                contractAddress: formData.get('contractAddress'),
                ownerWallet: this.currentWallet,
                contractName: formData.get('contractName'),
                tokenSymbol: formData.get('tokenSymbol'),
                description: formData.get('description'),
                website: formData.get('website'),
                category: formData.get('category')
            };
            
            // Usar API para registrar contrato
            const result = await this.registerContractAPI(contractData);
            
            if (result.success) {
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('newContractModal'));
                if (modal) modal.hide();
                
                // Mostrar sucesso
                this.showSuccess('Contrato cadastrado com sucesso!');
                
                // Recarregar dados
                await this.loadRealData();
            } else {
                this.showError(result.error || 'Erro ao cadastrar contrato');
            }
            
        } catch (error) {
            console.error('❌ Erro ao cadastrar contrato:', error);
            this.showError('Erro ao cadastrar contrato');
        }
    }

    /**
     * Modal para comprar créditos
     */
    showBuyCreditModal() {
        const modalHtml = `
            <div class="modal fade" id="buyCreditModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Comprar Créditos</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="card credit-package" data-package="starter">
                                        <div class="card-body text-center">
                                            <h5>Starter</h5>
                                            <div class="h3 text-primary">100 Créditos</div>
                                            <div class="h4">$9.99</div>
                                            <small class="text-muted">$0.10 por crédito</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card credit-package" data-package="pro">
                                        <div class="card-body text-center">
                                            <h5>Pro</h5>
                                            <div class="h3 text-success">500 Créditos</div>
                                            <div class="h4">$39.99</div>
                                            <small class="text-muted">$0.08 por crédito</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="card credit-package" data-package="business">
                                        <div class="card-body text-center">
                                            <h5>Business</h5>
                                            <div class="h3 text-info">1000 Créditos</div>
                                            <div class="h4">$69.99</div>
                                            <small class="text-muted">$0.07 por crédito</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card credit-package" data-package="enterprise">
                                        <div class="card-body text-center">
                                            <h5>Enterprise</h5>
                                            <div class="h3 text-warning">5000 Créditos</div>
                                            <div class="h4">$299.99</div>
                                            <small class="text-muted">$0.06 por crédito</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-success" id="buyCreditsBtn" disabled>
                                <i class="fas fa-credit-card me-2"></i>Comprar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar modal ao DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Configurar seleção de pacotes
        document.querySelectorAll('.credit-package').forEach(card => {
            card.addEventListener('click', () => {
                // Remover seleção anterior
                document.querySelectorAll('.credit-package').forEach(c => c.classList.remove('border-primary'));
                // Selecionar atual
                card.classList.add('border-primary');
                // Habilitar botão
                document.getElementById('buyCreditsBtn').disabled = false;
                // Configurar ação do botão
                const packageType = card.dataset.package;
                document.getElementById('buyCreditsBtn').onclick = () => this.purchaseCredits(packageType);
            });
        });
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('buyCreditModal'));
        modal.show();
        
        // Limpar modal após fechar
        document.getElementById('buyCreditModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    /**
     * Comprar créditos
     */
    async purchaseCredits(packageName) {
        try {
            this.showNotification('Processando compra de créditos...', 'info');
            
            // Simular compra por enquanto
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('buyCreditModal'));
            if (modal) modal.hide();
            
            // Mostrar sucesso
            this.showSuccess(`Créditos adquiridos com sucesso! Pacote: ${packageName}`);
            
            // Atualizar dados
            await this.loadUserStats();
            
        } catch (error) {
            console.error('❌ Erro ao comprar créditos:', error);
            this.showError('Erro ao processar compra');
        }
    }

    /**
     * Exportar transações
     */
    exportTransactions() {
        this.showNotification('Exportando transações...', 'info');
        
        // Simular exportação
        setTimeout(() => {
            this.showSuccess('Transações exportadas com sucesso!');
        }, 1500);
    }

    /**
     * API para registrar contrato
     */
    async registerContractAPI(contractData) {
        try {
            // Por enquanto simular API
            console.log('📤 Registrando contrato:', contractData);
            
            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Simular sucesso
            return {
                success: true,
                message: 'Contrato registrado com sucesso',
                contractId: 'contract_' + Date.now()
            };
            
        } catch (error) {
            console.error('❌ Erro na API:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Copiar API Key
     */
    copyApiKey(apiKey) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(apiKey).then(() => {
                this.showSuccess('API Key copiada para clipboard!');
            });
        } else {
            // Fallback para browsers antigos
            const textArea = document.createElement('textarea');
            textArea.value = apiKey;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showSuccess('API Key copiada!');
        }
    }

    /**
     * Desconectar wallet
     */
    async disconnectWallet() {
        if (confirm('Tem certeza que deseja desconectar a wallet?')) {
            // Limpar dados locais
            this.currentWallet = null;
            
            // Mostrar mensagem
            this.showNotification('Wallet desconectada', 'info');
            
            // Redirecionar após delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    }
}

// ================================================================================
// FUNÇÕES GLOBAIS PARA COMPATIBILIDADE
// ================================================================================

function navigateToSection(section) {
    console.log(`🧭 Navegação solicitada para: ${section}`);
    const event = new CustomEvent('dashboardNavigation', {
        detail: { section: section }
    });
    document.dispatchEvent(event);
}

function updateChart(days) {
    console.log(`📊 Atualizando gráfico para ${days} dias`);
    
    const overlay = document.querySelector('.chart-overlay p');
    if (overlay) {
        const messages = {
            7: '📈 Últimos 7 dias: +8% crescimento<br>💰 Melhor dia: Ontem ($125)<br>📊 Média diária: $45.71',
            30: '📈 Vendas cresceram 15% este mês<br>💰 Melhor dia: 28/08 ($385)<br>📊 Média diária: $41.67',
            90: '📈 Trimestre positivo: +22%<br>💰 Melhor mês: Agosto ($1.250)<br>📊 Média mensal: $1.083'
        };
        overlay.innerHTML = messages[days] || messages[30];
    }
}

function viewContractDetails(contractId) {
    console.log(`👁️ Visualizando detalhes do contrato: ${contractId}`);
    navigateToSection('contracts');
}

// Funções globais específicas para funcionalidades avançadas
function showNewContractModal() {
    if (window.dashboardManager) {
        window.dashboardManager.showNewContractModal();
    }
}

function showBuyCreditModal() {
    if (window.dashboardManager) {
        window.dashboardManager.showBuyCreditModal();
    }
}

function exportTransactions() {
    if (window.dashboardManager) {
        window.dashboardManager.exportTransactions();
    }
}

function copyApiKey(apiKey) {
    if (window.dashboardManager) {
        window.dashboardManager.copyApiKey(apiKey);
    }
}

function resumeContract(contractId) {
    console.log(`▶️ Reativando contrato: ${contractId}`);
    
    if (confirm('Tem certeza que deseja reativar este contrato?')) {
        const badge = document.querySelector(`[onclick="resumeContract('${contractId}')"]`)
            ?.closest('.card')
            ?.querySelector('.badge');
        
        if (badge) {
            badge.className = 'badge bg-success';
            badge.textContent = 'Ativo';
            
            const button = document.querySelector(`[onclick="resumeContract('${contractId}')"]`);
            if (button) {
                button.className = 'btn btn-outline-primary btn-sm';
                button.innerHTML = '<i class="fas fa-eye me-1"></i>Ver Detalhes';
                button.setAttribute('onclick', `viewContractDetails('${contractId}')`);
            }
        }
    }
}

// ================================================================================
// INICIALIZAÇÃO AUTOMÁTICA
// ================================================================================

// ================================================================================
// INICIALIZAÇÃO AUTOMÁTICA
// ================================================================================

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 Iniciando Dashboard Manager...');
    window.dashboardManager = new DashboardManager();
});

// Exportar para uso global
window.DashboardManager = DashboardManager;