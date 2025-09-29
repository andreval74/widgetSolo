/**
 * ================================================================================
 * WIDGETS PAGE MANAGER - WIDGET SAAS
 * ================================================================================
 * Gerenciador da página de widgets com carregamento, filtros e busca
 * ================================================================================
 */

class WidgetsPageManager {
    constructor() {
        this.widgets = [];
        this.filteredWidgets = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    /**
     * Inicializa a página de widgets
     */
    init() {
        console.log('🧩 Inicializando página de widgets...');
        this.setupEventListeners();
        this.loadWidgets();
    }

    /**
     * Configura os event listeners para filtros
     */
    setupEventListeners() {
        const statusFilter = document.getElementById('filter-status');
        const periodFilter = document.getElementById('filter-period');
        const searchInput = document.getElementById('search-widgets');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterWidgets());
        }
        
        if (periodFilter) {
            periodFilter.addEventListener('change', () => this.filterWidgets());
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterWidgets());
        }
    }

    /**
     * Carrega os widgets do servidor
     */
    async loadWidgets() {
        const container = document.getElementById('widgets-list');
        if (!container) return;

        try {
            console.log('🔄 Verificando widgets...');
            
            // Verificar se há widgets sem mostrar loading desnecessário
            const response = await this.fetchWidgetsFromAPI();
            
            if (response && response.length > 0) {
                // Só mostra loading se realmente há dados para carregar
                container.innerHTML = `
                    <div class="text-center py-3">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p class="mt-3">Carregando widgets...</p>
                    </div>
                `;
                
                // Simular processamento dos dados
                setTimeout(() => {
                    this.widgets = response;
                    this.filteredWidgets = [...this.widgets];
                    this.renderWidgets();
                }, 500);
            } else {
                // Se não há dados, mostra diretamente a mensagem
                this.showEmptyState();
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar widgets:', error);
            this.showErrorState();
        }
    }

    /**
     * Simula chamada para API (substituir pela implementação real)
     */
    async fetchWidgetsFromAPI() {
        // Verificação rápida se há widgets (sem delay se não há dados)
        // Quando tiver API real, substituir por: return await apiManager.get('/api/widgets');
        
        // Retorna vazio imediatamente para mostrar estado sem widgets
        return [];
        
        // Exemplo de dados mockados (descomente para testar com dados)
        /*
        return [
            {
                id: 'widget-1',
                name: 'Token Sale Widget',
                token: 'MyToken (MTK)',
                status: 'active',
                sales: 45,
                earnings: '1.23 BNB',
                created: '2024-01-15'
            },
            {
                id: 'widget-2', 
                name: 'ICO Widget',
                token: 'ICOToken (ICO)',
                status: 'paused',
                sales: 12,
                earnings: '0.45 BNB',
                created: '2024-01-10'
            }
        ];
        */
    }

    /**
     * Filtra widgets baseado nos critérios selecionados
     */
    filterWidgets() {
        const statusFilter = document.getElementById('filter-status')?.value || '';
        const periodFilter = document.getElementById('filter-period')?.value || '';
        const searchTerm = document.getElementById('search-widgets')?.value.toLowerCase() || '';

        this.filteredWidgets = this.widgets.filter(widget => {
            // Filtro por status
            if (statusFilter && widget.status !== statusFilter) {
                return false;
            }

            // Filtro por período (implementar lógica de data se necessário)
            if (periodFilter) {
                // Implementar lógica de filtro por período
                // Por enquanto, aceitar todos
            }

            // Filtro por busca
            if (searchTerm) {
                const searchFields = [
                    widget.name?.toLowerCase() || '',
                    widget.token?.toLowerCase() || '',
                    widget.id?.toLowerCase() || ''
                ];
                
                if (!searchFields.some(field => field.includes(searchTerm))) {
                    return false;
                }
            }

            return true;
        });

        this.renderWidgets();
    }

    /**
     * Renderiza a lista de widgets
     */
    renderWidgets() {
        const container = document.getElementById('widgets-list');
        if (!container) return;

        if (this.filteredWidgets.length === 0) {
            if (this.widgets.length === 0) {
                this.showEmptyState();
            } else {
                this.showNoResultsState();
            }
            return;
        }

        const widgetsHTML = this.filteredWidgets.map(widget => this.createWidgetCard(widget)).join('');
        container.innerHTML = widgetsHTML;
    }

    /**
     * Cria o HTML de um card de widget
     */
    createWidgetCard(widget) {
        const statusBadge = this.getStatusBadge(widget.status);
        
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <h5 class="card-title mb-1">${widget.name}</h5>
                            <p class="text-muted mb-0">
                                <i class="fas fa-coins me-1"></i>${widget.token}
                            </p>
                        </div>
                        <div class="col-md-2 text-center">
                            ${statusBadge}
                        </div>
                        <div class="col-md-2 text-center">
                            <small class="text-muted">Vendas</small>
                            <div class="fw-bold">${widget.sales}</div>
                        </div>
                        <div class="col-md-2 text-center">
                            <small class="text-muted">Ganhos</small>
                            <div class="fw-bold text-success">${widget.earnings}</div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <div class="btn-group" role="group">
                            <button class="btn btn-outline-primary btn-sm" onclick="widgetsPageManager.editWidget('${widget.id}')">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="widgetsPageManager.viewStats('${widget.id}')">
                                <i class="fas fa-chart-bar"></i> Stats
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="widgetsPageManager.copyEmbed('${widget.id}')">
                                <i class="fas fa-code"></i> Código
                            </button>
                            <button class="btn btn-outline-warning btn-sm" onclick="widgetsPageManager.toggleStatus('${widget.id}')">
                                <i class="fas fa-pause"></i> ${widget.status === 'active' ? 'Pausar' : 'Ativar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Retorna o badge de status apropriado
     */
    getStatusBadge(status) {
        const badges = {
            'active': '<span class="badge bg-success">Ativo</span>',
            'paused': '<span class="badge bg-warning">Pausado</span>',
            'draft': '<span class="badge bg-secondary">Rascunho</span>',
            'inactive': '<span class="badge bg-danger">Inativo</span>'
        };
        
        return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
    }

    /**
     * Mostra estado vazio (nenhum widget criado)
     */
    showEmptyState() {
        const container = document.getElementById('widgets-list');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-puzzle-piece fa-4x text-muted mb-4"></i>
                <h4>Nenhum Widget Criado</h4>
                <p class="text-muted mb-4">Você ainda não criou nenhum widget de venda.<br>Comece criando seu primeiro widget!</p>
                <button class="btn btn-primary" onclick="window.navigateToSection('new-widget')">
                    <i class="fas fa-plus me-2"></i>Criar Primeiro Widget
                </button>
            </div>
        `;
    }

    /**
     * Mostra estado sem resultados de busca
     */
    showNoResultsState() {
        const container = document.getElementById('widgets-list');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h5>Nenhum resultado encontrado</h5>
                <p class="text-muted">Tente ajustar os filtros ou termos de busca.</p>
                <button class="btn btn-outline-primary" onclick="widgetsPageManager.clearFilters()">
                    <i class="fas fa-times me-2"></i>Limpar Filtros
                </button>
            </div>
        `;
    }

    /**
     * Mostra estado de erro
     */
    showErrorState() {
        const container = document.getElementById('widgets-list');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h5>Erro ao Carregar</h5>
                <p class="text-muted">Não foi possível carregar os widgets.</p>
                <button class="btn btn-outline-primary" onclick="widgetsPageManager.loadWidgets()">
                    <i class="fas fa-redo me-2"></i>Tentar Novamente
                </button>
            </div>
        `;
    }

    /**
     * Limpa todos os filtros
     */
    clearFilters() {
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-period').value = '';
        document.getElementById('search-widgets').value = '';
        this.filterWidgets();
    }

    // ================================================================================
    // AÇÕES DE WIDGET
    // ================================================================================

    editWidget(widgetId) {
        console.log('✏️ Editando widget:', widgetId);
        // Implementar navegação para edição
    }

    viewStats(widgetId) {
        console.log('📊 Visualizando stats do widget:', widgetId);
        // Implementar visualização de estatísticas
    }

    copyEmbed(widgetId) {
        console.log('📋 Copiando código embed do widget:', widgetId);
        // Implementar cópia do código de incorporação
    }

    toggleStatus(widgetId) {
        console.log('🔄 Alternando status do widget:', widgetId);
        // Implementar toggle de status
    }
}

// ================================================================================
// INICIALIZAÇÃO
// ================================================================================

// Instância global para acesso em onclick handlers
let widgetsPageManager = null;

// Inicializar quando a página for carregada
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que a página foi totalmente carregada
    setTimeout(() => {
        if (document.getElementById('widgets-list')) {
            widgetsPageManager = new WidgetsPageManager();
            widgetsPageManager.init();
            
            // Tornar disponível globalmente
            window.widgetsPageManager = widgetsPageManager;
        }
    }, 100);
});

// Função de compatibilidade para dashboard manager
function loadWidgetsPage() {
    if (widgetsPageManager) {
        widgetsPageManager.loadWidgets();
    } else {
        widgetsPageManager = new WidgetsPageManager();
        widgetsPageManager.init();
    }
}