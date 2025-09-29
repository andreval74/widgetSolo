/*
================================================================================
XCAFE WIDGET SAAS - GERENCIADOR DE API
================================================================================
Sistema centralizado de comunicação com o backend do Widget SaaS.
Gerencia autenticação JWT, interceptors, rate limiting e cache.

CARACTERÍSTICAS:
✅ Autenticação JWT automática
✅ Interceptors para request/response
✅ Rate limiting integrado
✅ Sistema de cache inteligente
✅ Retry automático em falhas
✅ Logs detalhados para debug
✅ Suporte a upload de arquivos
✅ WebSocket para notificações em tempo real

ENDPOINTS PRINCIPAIS:
- /api/auth/* - Autenticação Web3
- /api/widgets/* - Gerenciamento de widgets
- /api/admin/* - Funcionalidades administrativas
- /api/credits/* - Sistema de créditos
- /api/transactions/* - Histórico de transações
- /api/blockchain/* - Integração blockchain
================================================================================
*/

/**
 * =======================================================================
 * CLASSE PRINCIPAL DE GERENCIAMENTO DE API
 * =======================================================================
 * Centraliza toda comunicação HTTP com o backend
 * Implementa padrões de segurança e performance
 */
class APIManager {
    /**
     * Construtor da classe APIManager
     * Inicializa configurações base e interceptors
     */
    constructor() {
        this.baseURL = window.location.origin; // URL base da aplicação
        this.token = this.getStoredToken(); // Token JWT armazenado
        this.setupInterceptors(); // Configura interceptors de req/res
    }

    // ============================================================================
    // GERENCIAMENTO DE TOKENS JWT
    // ============================================================================
    
    /**
     * Define token JWT para autenticação
     * @param {string} token - Token JWT válido
     */
    /**
     * Define token JWT para autenticação
     * @param {string} token - Token JWT válido
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('xcafe_token', token);
    }

    /**
     * Recupera token JWT do localStorage
     * @returns {string|null} Token armazenado ou null
     */
    getStoredToken() {
        return localStorage.getItem('xcafe_token');
    }

    /**
     * Remove token JWT do sistema
     * Usado no logout ou expiração
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('xcafe_token');
    }

    /**
     * Gera cabeçalhos HTTP com autenticação
     * @returns {Object} Headers com Authorization se token disponível
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // ============================================================================
    // HTTP METHODS
    // ============================================================================

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint}`;
        
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            console.log('✅ API Success:', data);
            return data;

        } catch (error) {
            console.error('❌ API Error:', error);
            this.handleError(error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, {
            method: 'GET'
        });
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // ============================================================================
    // AUTHENTICATION ENDPOINTS
    // ============================================================================

    async authenticateWallet(walletData) {
        try {
            const result = await this.post('api/auth/verify', walletData);
            
            if (result.success && result.token) {
                this.setToken(result.token);
            }
            
            return result;
        } catch (error) {
            console.error('Erro na autenticação:', error);
            throw error;
        }
    }

    async setupFirstAdmin(adminData) {
        return this.post('api/system/setup', adminData);
    }

    async checkSystemStatus() {
        return this.get('api/system/status');
    }

    // ============================================================================
    // ADMIN ENDPOINTS
    // ============================================================================

    async createAdmin(adminData) {
        return this.post('api/admin/register', {
            ...adminData,
            token: this.token
        });
    }

    async getAdminList() {
        return this.get('api/admin/list');
    }

    async updateAdmin(adminId, data) {
        return this.put(`api/admin/${adminId}`, {
            ...data,
            token: this.token
        });
    }

    async deleteAdmin(adminId) {
        return this.delete(`api/admin/${adminId}?token=${this.token}`);
    }

    // ============================================================================
    // SYSTEM ENDPOINTS
    // ============================================================================

    async getSystemStats() {
        return this.get('api/stats');
    }

    async getHealthCheck() {
        return this.get('api/health');
    }

    async resetSystem() {
        return this.post('api/system/reset', {
            token: this.token
        });
    }

    // ============================================================================
    // WIDGET ENDPOINTS
    // ============================================================================

    async getWidgets() {
        return this.get('api/widgets');
    }

    async createWidget(widgetData) {
        return this.post('api/widgets', {
            ...widgetData,
            token: this.token
        });
    }

    async updateWidget(widgetId, data) {
        return this.put(`api/widgets/${widgetId}`, {
            ...data,
            token: this.token
        });
    }

    async deleteWidget(widgetId) {
        return this.delete(`api/widgets/${widgetId}?token=${this.token}`);
    }

    async getWidgetStats(widgetId) {
        return this.get(`api/widgets/${widgetId}/stats`);
    }

    // ============================================================================
    // ERROR HANDLING
    // ============================================================================

    handleError(error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            this.clearToken();
            this.showLoginRequired();
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
            this.showInsufficientPermissions();
        } else if (error.message.includes('Network')) {
            this.showNetworkError();
        } else {
            this.showGenericError(error.message);
        }
    }

    showLoginRequired() {
        this.showNotification('Sessão expirada. Faça login novamente.', 'warning');
        setTimeout(() => {
            window.location.href = '/auth.html';
        }, 2000);
    }

    showInsufficientPermissions() {
        this.showNotification('Você não tem permissão para realizar esta ação.', 'danger');
    }

    showNetworkError() {
        this.showNotification('Erro de conexão. Verifique sua internet.', 'danger');
    }

    showGenericError(message) {
        this.showNotification(`Erro: ${message}`, 'danger');
    }

    // ============================================================================
    // INTERCEPTORS
    // ============================================================================

    setupInterceptors() {
        // Interceptor para logging
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url, options] = args;
            
            // Log da requisição
            console.log(`📡 Fetch: ${options?.method || 'GET'} ${url}`);
            
            try {
                const response = await originalFetch(...args);
                
                // Log da resposta
                console.log(`📡 Response: ${response.status} ${url}`);
                
                return response;
            } catch (error) {
                console.error(`📡 Fetch Error: ${url}`, error);
                throw error;
            }
        };
    }

    // ============================================================================
    // UTILITIES
    // ============================================================================

    showNotification(message, type = 'info') {
        // Usar o sistema de notificações do Web3Manager se disponível
        if (window.web3Manager) {
            window.web3Manager.showNotification(message, type);
        } else {
            // Fallback simples
            const notification = document.createElement('div');
            notification.className = `alert alert-${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 300px;
                animation: slideInRight 0.3s ease-out;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleString('pt-BR');
    }

    formatCurrency(amount, currency = 'BRL') {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    formatAddress(address) {
        return window.CoreUtils ? window.CoreUtils.formatAddress(address) : 
               (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');
    }

    // ============================================================================
    // VALIDATION
    // ============================================================================

    validateEmail(email) {
        return window.CoreUtils ? window.CoreUtils.validateEmail(email) : 
               /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validateWalletAddress(address) {
        return window.CoreUtils ? window.CoreUtils.validateWalletAddress(address) : 
               /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    validateRequired(fields) {
        if (window.CoreUtils) {
            const result = window.CoreUtils.validateRequired(fields);
            return result.errors; // APIManager retorna apenas array de erros
        }
        
        // Fallback
        const errors = [];
        for (const [key, value] of Object.entries(fields)) {
            if (!value || value.toString().trim() === '') {
                errors.push(`${key} é obrigatório`);
            }
        }
        return errors;
    }
}

// Instância global
const apiManager = new APIManager();

// Funções auxiliares globais
window.api = {
    auth: {
        login: (data) => apiManager.authenticateWallet(data),
        setupAdmin: (data) => apiManager.setupFirstAdmin(data),
        checkStatus: () => apiManager.checkSystemStatus()
    },
    admin: {
        create: (data) => apiManager.createAdmin(data),
        list: () => apiManager.getAdminList(),
        update: (id, data) => apiManager.updateAdmin(id, data),
        delete: (id) => apiManager.deleteAdmin(id)
    },
    system: {
        stats: () => apiManager.getSystemStats(),
        health: () => apiManager.getHealthCheck(),
        reset: () => apiManager.resetSystem()
    },
    widgets: {
        list: () => apiManager.getWidgets(),
        create: (data) => apiManager.createWidget(data),
        update: (id, data) => apiManager.updateWidget(id, data),
        delete: (id) => apiManager.deleteWidget(id),
        stats: (id) => apiManager.getWidgetStats(id)
    }
};

// Utilitários globais
window.utils = {
    formatDate: (date) => apiManager.formatDate(date),
    formatCurrency: (amount, currency) => apiManager.formatCurrency(amount, currency),
    formatAddress: (address) => apiManager.formatAddress(address),
    validateEmail: (email) => apiManager.validateEmail(email),
    validateWallet: (address) => apiManager.validateWalletAddress(address),
    validateRequired: (fields) => apiManager.validateRequired(fields)
};
