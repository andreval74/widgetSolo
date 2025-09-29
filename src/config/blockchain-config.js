/*
================================================================================
BLOCKCHAIN CONFIG - CONFIGURAÇÃO CENTRALIZADA DE REDES
================================================================================
Configurações unificadas para todas as redes blockchain suportadas
Elimina duplicações entre web3.js, auth-manager.js e outros módulos
================================================================================
*/

const BLOCKCHAIN_CONFIG = {
    // ========================================================================
    // REDES SUPORTADAS
    // ========================================================================
    supportedChains: {
        1: 'Ethereum Mainnet',
        56: 'Binance Smart Chain', 
        97: 'BSC Testnet',
        137: 'Polygon',
        80001: 'Polygon Mumbai',
        43114: 'Avalanche',
        250: 'Fantom'
    },

    supportedNetworks: {
        1: { 
            name: 'Ethereum Mainnet', 
            symbol: 'ETH', 
            rpc: 'https://eth-mainnet.g.alchemy.com/v2/', 
            explorer: 'https://etherscan.io',
            color: '#627eea'
        },
        56: { 
            name: 'BSC Mainnet', 
            symbol: 'BNB', 
            rpc: 'https://bsc-dataseed.binance.org/', 
            explorer: 'https://bscscan.com',
            color: '#f3ba2f'
        },
        97: { 
            name: 'BSC Testnet', 
            symbol: 'tBNB', 
            rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/', 
            explorer: 'https://testnet.bscscan.com',
            color: '#f3ba2f'
        },
        137: { 
            name: 'Polygon', 
            symbol: 'MATIC', 
            rpc: 'https://polygon-rpc.com/', 
            explorer: 'https://polygonscan.com',
            color: '#8247e5'
        },
        80001: { 
            name: 'Polygon Mumbai', 
            symbol: 'MATIC', 
            rpc: 'https://rpc-mumbai.maticvigil.com/', 
            explorer: 'https://mumbai.polygonscan.com',
            color: '#8247e5'
        },
        43114: { 
            name: 'Avalanche', 
            symbol: 'AVAX', 
            rpc: 'https://api.avax.network/ext/bc/C/rpc', 
            explorer: 'https://snowtrace.io',
            color: '#e84142'
        },
        250: { 
            name: 'Fantom', 
            symbol: 'FTM', 
            rpc: 'https://rpc.ftm.tools/', 
            explorer: 'https://ftmscan.com',
            color: '#13b5ec'
        }
    },

    // ========================================================================
    // CONTRATOS PADRÃO
    // ========================================================================
    defaultContracts: {
        56: {
            universalSale: '0x...' // Endereço do UniversalSaleContract na BSC
        },
        97: {
            universalSale: '0x...' // Endereço do UniversalSaleContract na BSC Testnet
        },
        137: {
            universalSale: '0x...' // Endereço do UniversalSaleContract na Polygon
        }
    },

    // ========================================================================
    // TOKENS SUPORTADOS
    // ========================================================================
    supportedTokens: {
        56: { // BSC Mainnet
            'USDT': '0x55d398326f99059fF775485246999027B3197955',
            'BUSD': '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            'BNB': 'native'
        },
        97: { // BSC Testnet
            'USDT': '0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684',
            'BNB': 'native'
        },
        137: { // Polygon
            'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            'MATIC': 'native'
        }
    },

    // ========================================================================
    // CONFIGURAÇÕES DE REDE
    // ========================================================================
    networkSettings: {
        defaultChain: 97, // BSC Testnet como padrão
        autoSwitchNetwork: true,
        retryAttempts: 3,
        connectionTimeout: 10000,
        confirmationsRequired: {
            1: 12,    // Ethereum - 12 confirmações
            56: 3,    // BSC - 3 confirmações  
            97: 3,    // BSC Testnet - 3 confirmações
            137: 10,  // Polygon - 10 confirmações
            80001: 5  // Polygon Mumbai - 5 confirmações
        }
    },

    // ========================================================================
    // MÉTODOS UTILITÁRIOS
    // ========================================================================
    
    /**
     * Verifica se uma rede é suportada
     */
    isNetworkSupported(chainId) {
        return Object.keys(this.supportedNetworks).includes(chainId.toString());
    },

    /**
     * Obtém informações de uma rede
     */
    getNetworkInfo(chainId) {
        return this.supportedNetworks[chainId] || null;
    },

    /**
     * Obtém nome amigável de uma rede
     */
    getNetworkName(chainId) {
        const network = this.getNetworkInfo(chainId);
        return network ? network.name : `Chain ${chainId}`;
    },

    /**
     * Obtém cor da rede para UI
     */
    getNetworkColor(chainId) {
        const network = this.getNetworkInfo(chainId);
        return network ? network.color : '#6c757d';
    },

    /**
     * Obtém lista de todas as redes suportadas
     */
    getAllNetworks() {
        return Object.entries(this.supportedNetworks).map(([chainId, info]) => ({
            chainId: parseInt(chainId),
            ...info
        }));
    },

    /**
     * Obtém tokens suportados para uma rede
     */
    getNetworkTokens(chainId) {
        return this.supportedTokens[chainId] || {};
    },

    /**
     * Verifica se um token é suportado em uma rede
     */
    isTokenSupported(chainId, tokenSymbol) {
        const tokens = this.getNetworkTokens(chainId);
        return Object.keys(tokens).includes(tokenSymbol.toUpperCase());
    },

    /**
     * Obtém endereço de contrato de um token
     */
    getTokenAddress(chainId, tokenSymbol) {
        const tokens = this.getNetworkTokens(chainId);
        return tokens[tokenSymbol.toUpperCase()] || null;
    },

    /**
     * Verifica se um token é nativo (ETH, BNB, MATIC)
     */
    isNativeToken(chainId, tokenSymbol) {
        const tokenAddress = this.getTokenAddress(chainId, tokenSymbol);
        return tokenAddress === 'native';
    },

    /**
     * Obtém configurações de confirmação para uma rede
     */
    getConfirmationsRequired(chainId) {
        return this.networkSettings.confirmationsRequired[chainId] || 3;
    },

    /**
     * Formata endereço de carteira
     */
    formatAddress(address, length = 6) {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, length)}...${address.slice(-4)}`;
    },

    /**
     * Valida formato de endereço Ethereum
     */
    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    },

    /**
     * Converte chain ID para hexadecimal
     */
    toHex(chainId) {
        return `0x${chainId.toString(16)}`;
    }
};

// ========================================================================
// DISPONIBILIZAR GLOBALMENTE
// ========================================================================
window.BLOCKCHAIN_CONFIG = BLOCKCHAIN_CONFIG;

console.log('🌐 Blockchain Config carregado com', Object.keys(BLOCKCHAIN_CONFIG.supportedNetworks).length, 'redes suportadas');