console.log('🚀 INÍCIO DO NEW-WIDGET-MANAGER');

// Variáveis globais
let selectedNetwork = null;
console.log('✅ Variável selectedNetwork inicializada');
let detectedToken = null;

// Configuração das redes
const networkConfigs = {
    '1': { 
        name: 'Ethereum Mainnet', 
        rpc: ['https://mainnet.infura.io/v3/YOUR_KEY'],
        chainId: 1,
        currency: 'ETH'
    },
    '56': { 
        name: 'BNB Smart Chain', 
        rpc: ['https://bsc-dataseed.binance.org/'],
        chainId: 56,
        currency: 'BNB'
    },
    '137': { 
        name: 'Polygon', 
        rpc: ['https://polygon-rpc.com/'],
        chainId: 137,
        currency: 'MATIC'
    },
    '97': { 
        name: 'BSC Testnet', 
        rpc: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
        chainId: 97,
        currency: 'BNB'
    }
};

// Selecionar rede
function selectNetwork() {
    console.log('🌐 FUNÇÃO selectNetwork CHAMADA');
    const select = document.getElementById('networkSelect');
    const chainId = select.value;
    
    if (chainId) {
        selectedNetwork = networkConfigs[chainId];
        console.log('✅ Rede selecionada:', selectedNetwork);
        
        // Habilitar campo de endereço
        const addressInput = document.getElementById('contractAddress');
        if (addressInput) {
            addressInput.disabled = false;
            addressInput.placeholder = 'Cole o endereço do contrato aqui...';
        }
        
        // Habilitar botão de detecção
        const detectBtn = document.getElementById('detectBtn');
        if (detectBtn) {
            detectBtn.disabled = false;
        }
    } else {
        selectedNetwork = null;
        console.log('⚠️ Nenhuma rede selecionada');
    }
}

// Função para buscar dados do token
async function fetchTokenData(tokenAddress, provider) {
    try {
        console.log('🔍 Buscando dados do token:', tokenAddress);
        
        // ABI básica para ERC20
        const abi = [
            "function name() view returns (string)",
            "function symbol() view returns (string)", 
            "function decimals() view returns (uint8)",
            "function totalSupply() view returns (uint256)"
        ];

        // Criar contrato
        const contract = new ethers.Contract(tokenAddress, abi, provider);
        console.log('📄 Contrato criado');

        // Buscar informações básicas
        const [name, symbol, decimals, totalSupply] = await Promise.all([
            contract.name().catch(() => 'Token Desconhecido'),
            contract.symbol().catch(() => 'UNKNOWN'),
            contract.decimals().catch(() => 18),
            contract.totalSupply().catch(() => ethers.BigNumber.from(0))
        ]);

        console.log('✅ Dados obtidos:', { name, symbol, decimals });

        return {
            address: tokenAddress,
            name: name,
            symbol: symbol,
            decimals: decimals,
            totalSupply: totalSupply.toString(),
            network: selectedNetwork
        };

    } catch (error) {
        console.error("❌ Erro ao buscar dados do token:", error);
        throw error;
    }
}

// Detectar contrato
async function detectContract() {
    console.log('🔍 FUNÇÃO detectContract CHAMADA');
    
    const address = document.getElementById('contractAddress').value.trim();
    console.log('📋 Endereço:', address);
    
    if (!selectedNetwork) {
        alert('Por favor, selecione uma rede primeiro');
        return;
    }
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/i.test(address)) {
        alert('Endereço inválido. Use o formato: 0x...');
        return;
    }
    
    const detectBtn = document.getElementById('detectBtn');
    detectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detectando...';
    detectBtn.disabled = true;

    try {
        console.log('🌐 Criando provider para:', selectedNetwork.name);
        
        // Verificar se ethers está disponível
        if (typeof ethers === 'undefined') {
            throw new Error('Ethers.js não carregado');
        }
        
        const provider = new ethers.providers.JsonRpcProvider(selectedNetwork.rpc[0]);
        console.log('✅ Provider criado');

        // Verificar se é um contrato válido
        const code = await provider.getCode(address);
        if (code === '0x') {
            throw new Error('O endereço fornecido não é um contrato inteligente válido');
        }

        console.log('✅ Contrato verificado');

        // Buscar dados do token
        const tokenData = await fetchTokenData(address, provider);
        console.log('🎉 Token detectado:', tokenData);
        
        detectedToken = tokenData;
        
        // Atualizar UI
        updateTokenDisplay(tokenData);
        
        // Habilitar próximos passos
        enableNextSteps();
        
        detectBtn.innerHTML = '<i class="fas fa-check"></i> Token Detectado';
        detectBtn.classList.remove('btn-primary');
        detectBtn.classList.add('btn-success');
        
    } catch (error) {
        console.error('❌ Erro na detecção:', error);
        alert(`Erro: ${error.message}`);
        
        detectBtn.innerHTML = '<i class="fas fa-search"></i> Detectar Token';
        detectBtn.disabled = false;
    }
}

// Atualizar exibição do token
function updateTokenDisplay(tokenData) {
    console.log('🎨 Atualizando display do token');
    
    const display = document.getElementById('tokenDisplay');
    if (display) {
        display.innerHTML = `
            <div class="alert alert-success">
                <h6><i class="fas fa-coins"></i> Token Detectado</h6>
                <p><strong>Nome:</strong> ${tokenData.name}</p>
                <p><strong>Símbolo:</strong> ${tokenData.symbol}</p>
                <p><strong>Decimais:</strong> ${tokenData.decimals}</p>
                <p><strong>Rede:</strong> ${tokenData.network.name}</p>
            </div>
        `;
        display.style.display = 'block';
    }
}

// Habilitar próximos passos
function enableNextSteps() {
    console.log('🚀 Habilitando próximos passos');
    
    // Habilitar campo de preço
    const priceInput = document.getElementById('tokenPrice');
    if (priceInput) {
        priceInput.disabled = false;
    }
    
    // Mostrar seção de configuração
    const configSection = document.querySelector('[data-step="3"]');
    if (configSection) {
        configSection.style.opacity = '1';
        configSection.style.pointerEvents = 'auto';
    }
}

// Criar widget
async function createWidget() {
    if (!detectedToken) {
        alert('Por favor, detecte um token primeiro');
        return;
    }
    
    const price = document.getElementById('tokenPrice').value;
    const theme = document.getElementById('themeSelect').value;
    
    if (!price || parseFloat(price) <= 0) {
        alert('Por favor, defina um preço válido');
        return;
    }
    
    const widgetData = {
        token: detectedToken,
        price: parseFloat(price),
        theme: theme,
        timestamp: Date.now()
    };
    
    console.log('🚀 Criando widget:', widgetData);
    
    try {
        // Simular criação do widget
        alert('Widget criado com sucesso! (Esta é uma versão de demonstração)');
        
        // Limpar formulário
        resetForm();
        
    } catch (error) {
        console.error('❌ Erro ao criar widget:', error);
        alert('Erro ao criar widget');
    }
}

// Limpar formulário
function resetForm() {
    console.log('🧹 Limpando formulário');
    
    selectedNetwork = null;
    detectedToken = null;
    
    document.getElementById('networkSelect').value = '';
    document.getElementById('contractAddress').value = '';
    document.getElementById('tokenPrice').value = '';
    document.getElementById('themeSelect').value = 'light';
    
    const tokenDisplay = document.getElementById('tokenDisplay');
    if (tokenDisplay) {
        tokenDisplay.style.display = 'none';
    }
    
    const detectBtn = document.getElementById('detectBtn');
    if (detectBtn) {
        detectBtn.innerHTML = '<i class="fas fa-search"></i> Detectar Token';
        detectBtn.classList.remove('btn-success');
        detectBtn.classList.add('btn-primary');
        detectBtn.disabled = true;
    }
}

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM carregado - new-widget-manager');
    
    // Desabilitar campos inicialmente
    const addressInput = document.getElementById('contractAddress');
    if (addressInput) {
        addressInput.disabled = true;
    }
    
    const detectBtn = document.getElementById('detectBtn');
    if (detectBtn) {
        detectBtn.disabled = true;
    }
});

console.log('📋 New Widget Manager carregado');
console.log('🔍 Ethers.js disponível:', typeof ethers !== 'undefined');
console.log('🦊 MetaMask disponível:', typeof window.ethereum !== 'undefined');