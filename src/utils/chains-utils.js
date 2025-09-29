/**
 * CHAINS UTILS - Widget SaaS
 * 
 * Sistema de gerenciamento dinâmico de redes blockchain baseado no xcafe.app
 * 
 * Funcionalidades:
 * - Auto-atualização do chains.json a cada 5 dias
 * - Fallback para redes locais se API falhar
 * - Cache inteligente no localStorage
 * - Suporte a redes personalizadas
 * 
 * @author Widget SaaS Team
 * @version 1.0.0
 */

// ==================== CONFIGURAÇÕES ====================

const CHAINS_CONFIG = {
    // URL da API oficial do chainid.network
    API_URL: 'https://chainid.network/chains.json',
    
    // Chave do localStorage para cache
    CACHE_KEY: 'widget_saas_chains_cache',
    LAST_UPDATE_KEY: 'widget_saas_chains_lastupdate',
    
    // Intervalo de atualização: 5 dias em milissegundos
    UPDATE_INTERVAL: 5 * 24 * 60 * 60 * 1000, // 432000000 ms
    
    // Timeout para requests
    REQUEST_TIMEOUT: 10000, // 10 segundos
    
    // Redes mínimas para fallback
    FALLBACK_NETWORKS: [
        {
            name: "Ethereum Mainnet",
            chainId: 1,
            shortName: "eth",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpc: ["https://rpc.ankr.com/eth", "https://ethereum.publicnode.com"],
            explorers: [{ name: "etherscan", url: "https://etherscan.io" }],
            supported: true
        },
        {
            name: "BNB Smart Chain Mainnet",
            chainId: 56,
            shortName: "bnb",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpc: ["https://bsc-dataseed.binance.org", "https://bsc.publicnode.com"],
            explorers: [{ name: "bscscan", url: "https://bscscan.com" }],
            supported: true
        },
        {
            name: "BNB Smart Chain Testnet",
            chainId: 97,
            shortName: "bnbt",
            nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
            rpc: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
            explorers: [{ name: "bscscan-testnet", url: "https://testnet.bscscan.com" }],
            supported: true
        },
        {
            name: "Polygon Mainnet",
            chainId: 137,
            shortName: "matic",
            nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
            rpc: ["https://polygon-rpc.com", "https://polygon.publicnode.com"],
            explorers: [{ name: "polygonscan", url: "https://polygonscan.com" }],
            supported: true
        }
    ]
};

// ==================== CLASSE PRINCIPAL ====================

/**
 * Classe principal para gerenciamento de redes blockchain
 * Responsável por carregar, cachear e gerenciar todas as operações relacionadas às chains
 */
class ChainsUtils {
    
    /**
     * Inicializa o sistema de chains e força verificação de atualização
     * Este método é o ponto de entrada principal do sistema
     * 
     * @returns {Promise<Array>} Lista de redes carregadas
     */
    static async initialize() {
        console.log('🔗 Inicializando sistema de chains...');
        
        try {
            // Tentar carregar chains atualizadas do cache ou API
            await this.autoUpdateChainsJson();
            
            // Carregar redes disponíveis usando toda a cadeia de fallbacks
            const networks = await this.fetchAllNetworks();
            
            console.log(`✅ Sistema de chains inicializado com ${networks.length} redes`);
            return networks;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema de chains:', error);
            // Em caso de erro total, retorna apenas as redes de fallback
            return CHAINS_CONFIG.FALLBACK_NETWORKS;
        }
    }
    
    /**
     * Auto-atualização do chains.json (baseado no xcafe.app)
     * Verifica a cada 5 dias se há uma versão mais recente na API oficial
     * Implementa cache inteligente e download automático de atualizações
     */
    static async autoUpdateChainsJson() {
        const now = Date.now();
        let lastUpdate = 0;
        
        try {
            // Ler timestamp da última atualização do localStorage
            const stored = localStorage.getItem(CHAINS_CONFIG.LAST_UPDATE_KEY);
            lastUpdate = stored ? parseInt(stored, 10) : 0;
        } catch (e) {
            console.warn('Erro ao ler localStorage:', e);
        }
        
        // Se última atualização foi há menos de 5 dias, não atualizar
        if (now - lastUpdate < CHAINS_CONFIG.UPDATE_INTERVAL) {
            console.log('📅 Chains.json está atualizado (verificado há menos de 5 dias)');
            return;
        }
        
        console.log('🔄 Verificando atualizações do chains.json...');
        
        try {
            // Fazer requests em paralelo para API e arquivo local
            const [apiResponse, localResponse] = await Promise.allSettled([
                this.fetchWithTimeout(CHAINS_CONFIG.API_URL),
                this.fetchLocalChains()
            ]);
            
            // Verificar se API funcionou
            if (apiResponse.status === 'rejected' || !apiResponse.value.ok) {
                console.warn('⚠️ API do chainid.network indisponível, usando cache local');
                localStorage.setItem(CHAINS_CONFIG.LAST_UPDATE_KEY, now.toString());
                return;
            }
            
            const apiData = await apiResponse.value.json();
            
            // Verificar se dados locais existem
            let localData = null;
            if (localResponse.status === 'fulfilled' && localResponse.value) {
                localData = localResponse.value;
            }
            
            // Comparar versões e decidir se deve atualizar
            if (!localData || this.shouldUpdateChains(apiData, localData)) {
                console.log('📥 Nova versão encontrada, atualizando cache...');
                await this.cacheNetworks(apiData);
                this.showUpdateNotification();
            }
            
            // Atualizar timestamp independente do resultado
            localStorage.setItem(CHAINS_CONFIG.LAST_UPDATE_KEY, now.toString());
            
        } catch (error) {
            console.error('❌ Erro na auto-atualização:', error);
            // Mesmo com erro, atualizar timestamp para não tentar novamente por 5 dias
            localStorage.setItem(CHAINS_CONFIG.LAST_UPDATE_KEY, now.toString());
        }
    }
    
    /**
     * Busca todas as redes disponíveis usando estratégia de fallback
     * Ordem de prioridade: 1) Cache localStorage, 2) Arquivo local, 3) Redes básicas
     * 
     * @returns {Promise<Array>} Lista de redes blockchain disponíveis
     */
    static async fetchAllNetworks() {
        try {
            // 1. Tentar cache do localStorage (mais rápido)
            const cached = this.getCachedNetworks();
            if (cached && cached.length > 0) {
                console.log('📦 Usando redes do cache');
                return this.filterSupportedNetworks(cached);
            }
            
            // 2. Tentar arquivo local chains.json
            console.log('📂 Cache vazio, tentando arquivo local...');
            const local = await this.fetchLocalChains();
            if (local && local.length > 0) {
                console.log('📄 Usando arquivo chains.json local');
                // Salvar no cache para próximas consultas
                await this.cacheNetworks(local);
                return this.filterSupportedNetworks(local);
            }
            
            // 3. Fallback para redes mínimas hardcoded
            console.log('⚠️ Arquivo local não encontrado, usando fallback');
            this.showFallbackNotification();
            return CHAINS_CONFIG.FALLBACK_NETWORKS;
            
        } catch (error) {
            console.error('❌ Erro ao buscar redes:', error);
            return CHAINS_CONFIG.FALLBACK_NETWORKS;
        }
    }
    
    /**
     * Busca rede específica por chainId
     * Útil para validação e obtenção de detalhes de uma rede específica
     * 
     * @param {number|string} chainId - ID da rede blockchain
     * @returns {Promise<Object|null>} Objeto da rede ou null se não encontrada
     */
    static async getNetworkByChainId(chainId) {
        const networks = await this.fetchAllNetworks();
        return networks.find(network => network.chainId === parseInt(chainId));
    }
    
    /**
     * Busca redes por nome usando fuzzy search
     * Permite busca flexível por nome, shortName, chain ou chainId
     * 
     * @param {string} query - Termo de busca
     * @returns {Promise<Array>} Lista de redes que correspondem à busca
     */
    static async searchNetworks(query) {
        const networks = await this.fetchAllNetworks();
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) return networks;
        
        // Busca em múltiplos campos da rede
        return networks.filter(network => 
            network.name.toLowerCase().includes(searchTerm) ||
            network.shortName?.toLowerCase().includes(searchTerm) ||
            network.chain?.toLowerCase().includes(searchTerm) ||
            network.chainId.toString().includes(searchTerm)
        );
    }
    
    // ==================== MÉTODOS AUXILIARES ====================
    
    /**
     * Fetch com timeout personalizado
     * Evita requests que ficam pendurados indefinidamente
     * 
     * @param {string} url - URL para fazer o request
     * @param {number} timeout - Timeout em milissegundos
     * @returns {Promise<Response>} Response do fetch
     */
    static async fetchWithTimeout(url, timeout = CHAINS_CONFIG.REQUEST_TIMEOUT) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    
    /**
     * Busca o arquivo chains.json local
     * Primeiro fallback quando cache não está disponível
     * 
     * @returns {Promise<Array|null>} Dados do arquivo local ou null se não encontrado
     */
    static async fetchLocalChains() {
        try {
            const response = await fetch('./chains.json');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('📂 Arquivo chains.json local não encontrado');
        }
        return null;
    }
    
    /**
     * Obtém redes do cache localStorage
     * Método mais rápido para carregar redes já baixadas
     * 
     * @returns {Array|null} Lista de redes do cache ou null se não existe
     */
    static getCachedNetworks() {
        try {
            const cached = localStorage.getItem(CHAINS_CONFIG.CACHE_KEY);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Erro ao ler cache:', error);
            return null;
        }
    }
    
    /**
     * Salva redes no cache localStorage
     * Filtra apenas redes suportadas antes de salvar para economizar espaço
     * 
     * @param {Array} networks - Lista de redes para cachear
     */
    static async cacheNetworks(networks) {
        try {
            const filtered = this.filterSupportedNetworks(networks);
            localStorage.setItem(CHAINS_CONFIG.CACHE_KEY, JSON.stringify(filtered));
            console.log(`💾 ${filtered.length} redes salvas no cache`);
        } catch (error) {
            console.error('Erro ao salvar cache:', error);
        }
    }
    
    /**
     * Filtra apenas redes suportadas ou com RPC disponível
     * Remove redes inválidas ou sem informações essenciais
     * 
     * @param {Array} networks - Lista bruta de redes
     * @returns {Array} Lista filtrada de redes válidas
     */
    static filterSupportedNetworks(networks) {
        if (!Array.isArray(networks)) return [];
        
        return networks.filter(network => {
            // Deve ter chainId válido (maior que 0)
            if (!network.chainId || network.chainId < 1) return false;
            
            // Deve ter pelo menos um RPC funcional
            if (!network.rpc || !Array.isArray(network.rpc) || network.rpc.length === 0) return false;
            
            // Deve ter currency nativa definida
            if (!network.nativeCurrency || !network.nativeCurrency.symbol) return false;
            
            // Priorizar redes marcadas como suportadas
            if (network.supported === true) return true;
            
            // Incluir redes populares mesmo sem flag 'supported'
            const popularChains = [1, 56, 97, 137, 80001, 10, 42161, 43114, 250, 8453, 11155111];
            if (popularChains.includes(network.chainId)) {
                network.supported = true; // Marcar como suportada
                return true;
            }
            
            return false;
        });
    }
    
    /**
     * Verifica se deve atualizar as chains comparando com dados locais
     * Usa heurísticas para decidir se vale a pena atualizar o cache
     * 
     * @param {Array} apiData - Dados da API oficial
     * @param {Array} localData - Dados locais atuais
     * @returns {boolean} True se deve atualizar
     */
    static shouldUpdateChains(apiData, localData) {
        if (!localData || !Array.isArray(localData)) return true;
        if (!apiData || !Array.isArray(apiData)) return false;
        
        // Se API tem significativamente mais redes, atualizar (crescimento de 10%+)
        if (apiData.length > localData.length * 1.1) return true;
        
        // Se alguma rede popular foi adicionada na API, atualizar
        const popularChains = [1, 56, 97, 137, 80001, 10, 42161, 43114, 250, 8453];
        const localChainIds = new Set(localData.map(n => n.chainId));
        const apiChainIds = new Set(apiData.map(n => n.chainId));
        
        for (const chainId of popularChains) {
            if (apiChainIds.has(chainId) && !localChainIds.has(chainId)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Mostra notificação de atualização bem-sucedida
     * Integra com sistema de toast se disponível
     */
    static showUpdateNotification() {
        console.log('🔄 Chains.json atualizado com novas redes blockchain!');
        
        // Se existir sistema de notificação global, usar
        if (window.showToast) {
            window.showToast('🔗 Novas redes blockchain disponíveis!', 'success');
        }
    }
    
    /**
     * Mostra notificação de uso de fallback
     * Informa ao usuário que está usando versão limitada das redes
     */
    static showFallbackNotification() {
        console.warn('⚠️ Usando redes básicas - considere adicionar chains.json');
        
        if (window.showToast) {
            window.showToast('⚠️ Usando redes limitadas', 'warning');
        }
    }
    
    /**
     * Limpa cache de redes (útil para debug e troubleshooting)
     * Remove todos os dados armazenados localmente
     */
    static clearCache() {
        try {
            localStorage.removeItem(CHAINS_CONFIG.CACHE_KEY);
            localStorage.removeItem(CHAINS_CONFIG.LAST_UPDATE_KEY);
            console.log('🗑️ Cache de chains limpo');
        } catch (error) {
            console.error('Erro ao limpar cache:', error);
        }
    }
    
    /**
     * Obtém estatísticas detalhadas do cache
     * Útil para debug e monitoramento do sistema
     * 
     * @returns {Object} Estatísticas do cache atual
     */
    static getCacheStats() {
        const cached = this.getCachedNetworks();
        const lastUpdate = localStorage.getItem(CHAINS_CONFIG.LAST_UPDATE_KEY);
        
        return {
            hasCache: !!cached,                                                    // Se tem cache ativo
            networksCount: cached ? cached.length : 0,                           // Quantidade de redes em cache
            lastUpdate: lastUpdate ? new Date(parseInt(lastUpdate)) : null,      // Data da última atualização
            cacheAge: lastUpdate ? Date.now() - parseInt(lastUpdate) : null,     // Idade do cache em ms
            needsUpdate: !lastUpdate || (Date.now() - parseInt(lastUpdate)) > CHAINS_CONFIG.UPDATE_INTERVAL // Se precisa atualizar
        };
    }
}

// ==================== FUNÇÕES EXPORTADAS ====================

/**
 * Inicializa o sistema automaticamente
 * Função de conveniência que chama ChainsUtils.autoUpdateChainsJson()
 * 
 * @returns {Promise<void>} Promise que resolve quando atualização termina
 */
export async function autoUpdateChainsJson() {
    return await ChainsUtils.autoUpdateChainsJson();
}

/**
 * Busca todas as redes disponíveis
 * Função principal para obter lista completa de redes blockchain
 * 
 * @returns {Promise<Array>} Lista de redes disponíveis
 */
export async function fetchAllNetworks() {
    return await ChainsUtils.fetchAllNetworks();
}

/**
 * Busca rede específica por chainId
 * Útil para validação e obtenção de dados de uma rede específica
 * 
 * @param {number|string} chainId - ID da rede blockchain
 * @returns {Promise<Object|null>} Objeto da rede ou null se não encontrada
 */
export async function getNetworkByChainId(chainId) {
    return await ChainsUtils.getNetworkByChainId(chainId);
}

/**
 * Busca redes por termo de pesquisa
 * Permite busca flexível em nome, chainId, símbolo, etc.
 * 
 * @param {string} query - Termo de busca
 * @returns {Promise<Array>} Lista de redes que correspondem à busca
 */
export async function searchNetworks(query) {
    return await ChainsUtils.searchNetworks(query);
}

/**
 * Inicializa o sistema completo de chains
 * Função de alto nível que configura todo o sistema de uma vez
 * 
 * @returns {Promise<Array>} Lista de redes carregadas após inicialização
 */
export async function initializeChainsSystem() {
    return await ChainsUtils.initialize();
}

/**
 * Limpa cache de chains (para debug e troubleshooting)
 * Remove todos os dados armazenados localmente
 */
export function clearChainsCache() {
    return ChainsUtils.clearCache();
}

/**
 * Obtém estatísticas detalhadas do cache
 * Informações sobre idade, tamanho e status do cache atual
 * 
 * @returns {Object} Estatísticas do cache
 */
export function getChainsStats() {
    return ChainsUtils.getCacheStats();
}

// ==================== INICIALIZAÇÃO AUTOMÁTICA ====================

// Auto-inicializar quando módulo é carregado (útil para imports diretos)
console.log('🔗 Módulo chains-utils carregado');

// Se não for ES6 module, adicionar funções ao escopo global (compatibilidade)
if (typeof window !== 'undefined') {
    window.ChainsUtils = ChainsUtils;                    // Classe principal
    window.fetchAllNetworks = fetchAllNetworks;          // Buscar todas as redes
    window.autoUpdateChainsJson = autoUpdateChainsJson;  // Auto-atualização
    window.getNetworkByChainId = getNetworkByChainId;    // Buscar por ID
    window.searchNetworks = searchNetworks;              // Busca por termo
}

// Exportar classe como default para imports flexíveis
export default ChainsUtils;