/**
 * ================================================================================
 * CORE UTILITIES - UTILITÁRIOS CENTRALIZADOS
 * ================================================================================
 * Arquivo central com todas as funções utilitárias comuns
 * Remove duplicações de formatAddress, validações, etc.
 * Usado por todos os outros módulos do sistema
 * ================================================================================
 */

class CoreUtils {
    
    // ========================================================================
    // FORMATAÇÃO DE ENDEREÇOS
    // ========================================================================
    
    /**
     * Formata endereços para exibição (centralizada)
     * @param {string} address Endereço para formatar
     * @param {number} length Tamanho do início (padrão: 6)
     * @returns {string} Endereço formatado
     */
    static formatAddress(address, length = 6) {
        if (!address || address.length < 10) return address || 'Não conectado';
        return `${address.slice(0, length)}...${address.slice(-4)}`;
    }

    /**
     * Alias para formatAddress (compatibilidade)
     */
    static getShortAddress(address, length = 6) {
        return this.formatAddress(address, length);
    }

    // ========================================================================
    // VALIDAÇÕES WEB3
    // ========================================================================
    
    /**
     * Verifica se a carteira está conectada
     * @returns {boolean} Status da conexão
     */
    static async isWalletConnected() {
        try {
            // Usar Web3Manager se disponível
            if (window.web3Manager) {
                return window.web3Manager.isConnected;
            }
            
            // Fallback direto
            if (!window.ethereum) return false;
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            return accounts && accounts.length > 0;
        } catch (error) {
            console.error('Erro ao verificar conexão da carteira:', error);
            return false;
        }
    }

    /**
     * Obtém o endereço da carteira conectada
     * @returns {string|null} Endereço da carteira ou null
     */
    static async getWalletAddress() {
        try {
            // Usar Web3Manager se disponível
            if (window.web3Manager && window.web3Manager.isConnected) {
                return window.web3Manager.currentAccount;
            }
            
            // Fallback direto
            if (!window.ethereum) return null;
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            return accounts && accounts.length > 0 ? accounts[0] : null;
        } catch (error) {
            console.error('Erro ao obter endereço da carteira:', error);
            return null;
        }
    }

    /**
     * Obtém conta atual (alias para compatibilidade)
     */
    static getCurrentAccount() {
        if (window.web3Manager) {
            return window.web3Manager.currentAccount;
        }
        return null;
    }

    // ========================================================================
    // VALIDAÇÕES GERAIS
    // ========================================================================
    
    /**
     * Valida endereço de carteira Ethereum
     * @param {string} address Endereço para validar
     * @returns {boolean} True se válido
     */
    static validateWalletAddress(address) {
        if (!address) return false;
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Valida email
     * @param {string} email Email para validar
     * @returns {boolean} True se válido
     */
    static validateEmail(email) {
        if (!email) return false;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Valida campos obrigatórios
     * @param {Object} fields Objeto com campos para validar
     * @returns {Object} Resultado da validação
     */
    static validateRequired(fields) {
        const errors = [];
        const missing = [];

        for (const [key, value] of Object.entries(fields)) {
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                missing.push(key);
                errors.push(`Campo '${key}' é obrigatório`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            missing
        };
    }

    // ========================================================================
    // FORMATAÇÃO DE DADOS
    // ========================================================================
    
    /**
     * Formata data para exibição
     * @param {Date|string} date Data para formatar
     * @param {string} locale Locale (padrão: pt-BR)
     * @returns {string} Data formatada
     */
    static formatDate(date, locale = 'pt-BR') {
        if (!date) return 'N/A';
        
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return dateObj.toLocaleDateString(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return 'Data inválida';
        }
    }

    /**
     * Formata valores monetários
     * @param {number|string} amount Valor para formatar
     * @param {string} currency Moeda (padrão: BRL)
     * @returns {string} Valor formatado
     */
    static formatCurrency(amount, currency = 'BRL') {
        if (!amount && amount !== 0) return 'R$ 0,00';
        
        try {
            const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: currency
            }).format(numericAmount);
        } catch (error) {
            console.error('Erro ao formatar moeda:', error);
            return 'Valor inválido';
        }
    }

    /**
     * Formata números grandes (K, M, B)
     * @param {number} value Valor para formatar
     * @returns {string} Valor formatado
     */
    static formatLargeNumber(value) {
        if (!value && value !== 0) return '0';
        
        const num = Number(value);
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString('pt-BR');
    }

    // ========================================================================
    // UTILITÁRIOS DE REDE
    // ========================================================================
    
    /**
     * Detecta a rede atual da carteira conectada
     * @returns {Object|null} Informações da rede ou null se erro
     */
    static async detectWalletNetwork() {
        try {
            // Usar Web3Manager se disponível
            if (window.web3Manager) {
                return window.web3Manager.currentNetwork;
            }
            
            // Fallback direto
            if (!window.ethereum) return null;
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            // Mapear chainId para nome da rede (básico)
            const networks = {
                '0x1': 'Ethereum Mainnet',
                '0x38': 'BSC Mainnet',
                '0x61': 'BSC Testnet',
                '0x89': 'Polygon'
            };
            
            return {
                chainId: parseInt(chainId, 16),
                name: networks[chainId] || 'Rede Desconhecida'
            };
        } catch (error) {
            console.error('Erro ao detectar rede:', error);
            return null;
        }
    }

    // ========================================================================
    // UTILITÁRIOS GERAIS
    // ========================================================================
    
    /**
     * Adiciona delay para evitar rate limiting
     * @param {number} ms Milissegundos para aguardar
     */
    static async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gera ID único simples
     * @returns {string} ID único
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Gera API Key única
     * @param {string} prefix Prefixo (padrão: xcafe)
     * @returns {string} API Key
     */
    static generateApiKey(prefix = 'xcafe') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}_${timestamp}_${random}`;
    }

    /**
     * Verifica se ethers está disponível
     * @returns {boolean} True se disponível
     */
    static isEthersAvailable() {
        return typeof ethers !== 'undefined';
    }

    /**
     * Gera chave privada aleatória (desenvolvimento)
     * @returns {string} Chave privada hex
     */
    static generateRandomPrivateKey() {
        if (!this.isEthersAvailable()) {
            throw new Error('Ethers.js não carregado');
        }
        
        const wallet = ethers.Wallet.createRandom();
        return wallet.privateKey;
    }

    // ========================================================================
    // MANIPULAÇÃO DE ELEMENTOS DOM
    // ========================================================================
    
    /**
     * Atualiza elemento DOM com verificação
     * @param {string} selector Seletor CSS
     * @param {string} content Conteúdo para definir
     * @param {string} property Propriedade (textContent, innerHTML, value)
     */
    static updateElement(selector, content, property = 'textContent') {
        try {
            const element = document.querySelector(selector);
            if (element) {
                element[property] = content;
            }
        } catch (error) {
            console.error(`Erro ao atualizar elemento ${selector}:`, error);
        }
    }

    /**
     * Adiciona classe com verificação
     * @param {string} selector Seletor CSS
     * @param {string} className Classe para adicionar
     */
    static addClass(selector, className) {
        try {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add(className);
            }
        } catch (error) {
            console.error(`Erro ao adicionar classe ${className}:`, error);
        }
    }

    /**
     * Remove classe com verificação
     * @param {string} selector Seletor CSS
     * @param {string} className Classe para remover
     */
    static removeClass(selector, className) {
        try {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.remove(className);
            }
        } catch (error) {
            console.error(`Erro ao remover classe ${className}:`, error);
        }
    }
}

// ========================================================================
// INSTÂNCIA GLOBAL E FUNÇÕES DE COMPATIBILIDADE
// ========================================================================

// Disponibilizar globalmente
window.CoreUtils = CoreUtils;

// Funções globais para compatibilidade com código existente
window.formatAddress = CoreUtils.formatAddress;
window.getShortAddress = CoreUtils.getShortAddress;
window.isWalletConnected = CoreUtils.isWalletConnected;
window.getCurrentAccount = CoreUtils.getCurrentAccount;
window.validateWalletAddress = CoreUtils.validateWalletAddress;
window.validateEmail = CoreUtils.validateEmail;
window.validateRequired = CoreUtils.validateRequired;

// Utilitários globais
window.utils = {
    formatDate: CoreUtils.formatDate,
    formatCurrency: CoreUtils.formatCurrency,
    formatAddress: CoreUtils.formatAddress,
    formatLargeNumber: CoreUtils.formatLargeNumber,
    validateEmail: CoreUtils.validateEmail,
    validateWallet: CoreUtils.validateWalletAddress,
    validateRequired: CoreUtils.validateRequired,
    generateId: CoreUtils.generateId,
    generateApiKey: CoreUtils.generateApiKey,
    delay: CoreUtils.delay,
    updateElement: CoreUtils.updateElement,
    addClass: CoreUtils.addClass,
    removeClass: CoreUtils.removeClass
};

console.log('🛠️ CoreUtils - Utilitários centralizados carregados com sucesso!');localStorage.clear