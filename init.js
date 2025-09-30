*
 * ================================================================================
 * INIT - INICIALIZADOR SIMPLES E FUNCIONAL
 * ================================================================================
 * Sistema básico de inicialização que carrega os módulos essenciais
 * ================================================================================
 */

// Configuração básica do sistema
window.XCAFE_CONFIG = {
    debug: true,
    version: '1.0.0',
    apiUrl: window.location.origin,
    networks: {
        56: { name: 'BSC Mainnet', symbol: 'BNB', rpc: 'https://bsc-dataseed.binance.org/' },
        97: { name: 'BSC Testnet', symbol: 'tBNB', rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/' }
    }
};

// Log de inicialização
console.log('🚀 XCafe Widget SaaS - Inicializando...');

// Função para aguardar carregamento de dependências
function waitForDependency(condition, callback, maxAttempts = 50) {
    let attempts = 0;
    const check = () => {
        if (condition() || attempts >= maxAttempts) {
            callback();
        } else {
            attempts++;
            setTimeout(check, 100);
        }
    };
    check();
}

// Inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 DOM carregado, inicializando sistema...');
    
    // Verificar se Bootstrap está carregado
    waitForDependency(
        () => typeof bootstrap !== 'undefined',
        () => {
            console.log('✅ Bootstrap carregado');
            initializeBasicFeatures();
        }
    );
});

// Inicializar funcionalidades básicas
function initializeBasicFeatures() {
    console.log('🔧 Inicializando funcionalidades básicas...');
    
    // Botão "Começar Agora"
    setupGetStartedButton();
    
    // Smooth scroll para navegação
    setupSmoothScroll();
    
    // Tema básico
    setupBasicTheme();
    
    // Verificar MetaMask
    checkMetaMaskAvailability();
    
    console.log('✅ Sistema básico inicializado!');
}

// Configurar botão "Começar Agora"
function setupGetStartedButton() {
    const getStartedBtn = document.querySelector('.btn-get-started, [data-action="get-started"]');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🚀 Redirecionando para dashboard...');
            
            // Verificar se tem MetaMask
            if (typeof window.ethereum !== 'undefined') {
                window.location.href = '/dashboard.html';
            } else {
                alert('🦊 MetaMask não detectado! Por favor, instale o MetaMask para continuar.');
                window.open('https://metamask.io/download/', '_blank');
            }
        });
        console.log('✅ Botão "Começar Agora" configurado');
    }
}

// Configurar scroll suave
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    console.log('✅ Scroll suave configurado');
}

// Configurar tema básico
function setupBasicTheme() {
    // Verificar tema salvo
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-bs-theme', savedTheme);
    
    // Botão de toggle de tema
    const themeToggle = document.querySelector('[data-action="toggle-theme"]');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.body.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            console.log(`🎨 Tema alterado para: ${newTheme}`);
        });
    }
    console.log('✅ Tema básico configurado');
}

// Verificar disponibilidade do MetaMask
function checkMetaMaskAvailability() {
    if (typeof window.ethereum !== 'undefined') {
        console.log('🦊 MetaMask detectado');
        
        // Atualizar elementos da UI
        const walletStatus = document.querySelectorAll('.wallet-status');
        walletStatus.forEach(el => {
            el.textContent = 'MetaMask Detectado';
            el.classList.add('text-success');
        });
        
        // Configurar botão de conexão básico
        setupBasicWalletConnection();
    } else {
        console.log('❌ MetaMask não detectado');
        
        const walletStatus = document.querySelectorAll('.wallet-status');
        walletStatus.forEach(el => {
            el.textContent = 'MetaMask Necessário';
            el.classList.add('text-warning');
        });
    }
}

// Configurar conexão básica com carteira
function setupBasicWalletConnection() {
    const connectButtons = document.querySelectorAll('[data-action="connect-wallet"], .connect-wallet-btn');
    
    connectButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            console.log('🔗 Tentando conectar carteira...');
            
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                if (accounts.length > 0) {
                    const address = accounts[0];
                    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
                    
                    console.log('✅ Carteira conectada:', shortAddress);
                    
                    // Atualizar UI
                    btn.textContent = shortAddress;
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-success');
                    
                    // Salvar no localStorage
                    localStorage.setItem('walletAddress', address);
                    localStorage.setItem('walletConnected', 'true');
                    
                    // Redirecionar para dashboard após 1 segundo
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 1000);
                }
            } catch (error) {
                console.error('❌ Erro ao conectar carteira:', error);
                alert('Erro ao conectar carteira: ' + error.message);
            }
        });
    });
    
    // Verificar se já está conectado
    checkExistingConnection();
}

// Verificar conexão existente
async function checkExistingConnection() {
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
            const address = accounts[0];
            const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
            
            console.log('✅ Carteira já conectada:', shortAddress);
            
            // Atualizar botões
            const connectButtons = document.querySelectorAll('[data-action="connect-wallet"], .connect-wallet-btn');
            connectButtons.forEach(btn => {
                btn.textContent = shortAddress;
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-success');
            });
            
            localStorage.setItem('walletAddress', address);
            localStorage.setItem('walletConnected', 'true');
        }
    } catch (error) {
        console.log('ℹ️ Nenhuma carteira conectada');
    }
}

// Utilidades globais básicas
window.XCafeUtils = {
    formatAddress: (address, length = 6) => {
        if (!address || address.length < 10) return address || 'Não conectado';
        return `${address.slice(0, length)}...${address.slice(-4)}`;
    },
    
    isWalletConnected: () => {
        return localStorage.getItem('walletConnected') === 'true';
    },
    
    getWalletAddress: () => {
        return localStorage.getItem('walletAddress');
    },
    
    redirectTo: (url) => {
        console.log(`🧭 Redirecionando para: ${url}`);
        window.location.href = url;
    }
};

// Exportar para compatibilidade
window.formatAddress = window.XCafeUtils.formatAddress;
window.isWalletConnected = window.XCafeUtils.isWalletConnected;

console.log('🛠️ Sistema de inicialização carregado!');