/*
================================================================================
INDEX.JS OTIMIZADO - LANDING PAGE CONTROLLER
================================================================================
Controlador otimizado para a landing page sem duplicações
Remove carregamento duplicado de templates e funcionalidades de scroll
================================================================================
*/

class IndexPage {
    constructor() {
        // Inicializar managers se disponíveis
        this.dataManager = window.DataManager ? new window.DataManager() : null;
        this.web3Manager = null; // Será inicializado após carregamento do Web3Manager otimizado
        this.authManager = null; // Será inicializado após Web3Manager
        
        // Disponibilizar instância globalmente
        window.indexPageInstance = this;
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('🚀 Inicializando Landing Page Otimizada...');
            
            try {
                // Aguardar carregamento dos managers otimizados
                await this.waitForManagers();
                
                // Funcionalidades básicas sempre disponíveis
                this.createParticles();
                this.initWidgetDemo();
                this.initStatsCounter();
                this.initGetStartedButton();
                this.initVerDemoButton();
                this.setupScrollAnimations();
                
                // Funcionalidades Web3 se disponíveis
                if (this.web3Manager && this.authManager) {
                    await this.setupWeb3Features();
                }
                
                // Carregar estatísticas
                await this.loadStats();
                
                console.log('✅ Landing Page otimizada inicializada com sucesso');
            } catch (error) {
                console.error('❌ Erro ao inicializar Landing Page:', error);
            }
        });
    }

    // ========================================================================
    // INICIALIZAÇÃO DE MANAGERS
    // ========================================================================

    async waitForManagers() {
        // Aguardar Web3Manager otimizado
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos máximo
        
        while (!window.Web3Manager && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.Web3Manager) {
            this.web3Manager = new window.Web3Manager();
            window.web3ManagerInstance = this.web3Manager;
            
            // Inicializar AuthManager otimizado se disponível
            if (window.AuthManager && this.dataManager) {
                this.authManager = new window.AuthManager(this.dataManager, this.web3Manager);
            }
        }
    }

    async setupWeb3Features() {
        // Escutar eventos de autenticação
        document.addEventListener('authStateChanged', (event) => {
            const { isAuthenticated, account } = event.detail;
            this.handleAuthStateChange(isAuthenticated, account);
        });

        // Verificar conexão existente
        if (this.web3Manager.isConnectedToNetwork()) {
            await this.authManager?.checkExistingSession();
        }
    }

    // ========================================================================
    // FUNCIONALIDADES VISUAIS
    // ========================================================================

    createParticles() {
        const hero = document.querySelector('.hero-section');
        if (!hero) return;

        // Evitar duplicação de partículas
        if (hero.querySelector('.particle')) return;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(255,255,255,0.3);
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                pointer-events: none;
                z-index: 1;
            `;
            hero.appendChild(particle);
        }
    }

    initWidgetDemo() {
        const quantityBtns = document.querySelectorAll('.quantity-btn');
        const totalDisplay = document.querySelector('.fs-4');
        
        if (!quantityBtns.length || !totalDisplay) return;

        quantityBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active de todos os botões
                quantityBtns.forEach(b => b.classList.remove('active'));
                
                // Adiciona active no clicado
                e.target.classList.add('active');
                
                // Atualiza total
                const text = e.target.textContent;
                let newTotal = 'Total: R$ Custom';
                
                if (text.includes('100')) {
                    newTotal = 'Total: R$ 1,00';
                } else if (text.includes('500')) {
                    newTotal = 'Total: R$ 5,00';
                } else if (text.includes('1000')) {
                    newTotal = 'Total: R$ 10,00';
                }
                
                totalDisplay.textContent = newTotal;
                
                // Efeito visual
                totalDisplay.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    totalDisplay.style.transform = 'scale(1)';
                }, 200);
            });
        });
    }

    initGetStartedButton() {
        // Botão agora é gerenciado pelo wallet.js centralizado
        console.log('✅ Botão Get Started gerenciado pelo wallet.js (index-optimized)');
    }

    initVerDemoButton() {
        const verDemoBtn = document.getElementById('ver-demo');
        if (!verDemoBtn) return;

        verDemoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Scroll suave até a seção #demo
            const demoSection = document.getElementById('demo');
            if (demoSection) {
                demoSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }

    // ========================================================================
    // ANIMAÇÕES E EFEITOS
    // ========================================================================

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, observerOptions);

        // Observar elementos para animação
        const animatedElements = document.querySelectorAll('.feature-card, .step-card, .pricing-card');
        animatedElements.forEach(el => observer.observe(el));
    }

    initStatsCounter() {
        const statsNumbers = document.querySelectorAll('.stats-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    if (!element.dataset.animated) {
                        this.animateNumber(element);
                        element.dataset.animated = 'true';
                    }
                }
            });
        }, { threshold: 0.5 });

        statsNumbers.forEach(el => observer.observe(el));
    }

    animateNumber(element) {
        const finalText = element.textContent;
        const number = parseInt(finalText.replace(/\D/g, ''));
        const suffix = finalText.replace(/[\d,]/g, '');
        const duration = 2000;
        const increment = number / (duration / 50);
        
        let current = 0;
        
        const updateNumber = () => {
            current += increment;
            if (current < number) {
                element.textContent = Math.floor(current).toLocaleString() + suffix;
                setTimeout(updateNumber, 50);
            } else {
                element.textContent = finalText;
            }
        };
        
        element.textContent = '0' + suffix;
        updateNumber();
    }

    // ========================================================================
    // CARREGAMENTO DE DADOS
    // ========================================================================

    async loadStats() {
        try {
            if (!this.dataManager) {
                console.log('📊 DataManager não disponível, usando estatísticas padrão');
                return;
            }

            const stats = await this.dataManager.getSystemStats();
            
            if (stats) {
                // Atualizar estatísticas na página
                this.updateStatsDisplay(stats);
                console.log('📊 Estatísticas carregadas do servidor');
            }
        } catch (error) {
            console.warn('⚠️ Erro ao carregar estatísticas:', error);
        }
    }

    updateStatsDisplay(stats) {
        const statsElements = [
            { selector: '.stats-number:nth-child(1)', value: stats.totalSites || '1000+' },
            { selector: '.stats-number:nth-child(2)', value: stats.totalWidgets || '5000+' },
            { selector: '.stats-number:nth-child(3)', value: stats.totalTransactions || '50k+' },
            { selector: '.stats-number:nth-child(4)', value: stats.totalVolume || '$2M+' }
        ];

        statsElements.forEach(({ selector, value }) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // ========================================================================
    // HANDLERS DE EVENTOS
    // ========================================================================

    handleAuthStateChange(isAuthenticated, account) {
        // Estado de autenticação agora é gerenciado pelo wallet.js
        console.log('ℹ️ Auth state gerenciado pelo wallet.js');
    }

    // ========================================================================
    // UTILITÁRIOS
    // ========================================================================

    redirectToDashboard() {
        // Redirecionamento agora é gerenciado pelo wallet.js
        console.log('ℹ️ Redirecionamento gerenciado pelo wallet.js');
    }

    showConnectionError(message) {
        // Criar toast de erro simples
        const toast = document.createElement('div');
        toast.className = 'toast-error';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 9999;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        toast.innerHTML = `
            <strong>Erro de Conexão</strong><br>
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    formatAddress(address, length = 6) {
        return window.CoreUtils ? window.CoreUtils.formatAddress(address, length) : 
               (address ? `${address.slice(0, length)}...${address.slice(-4)}` : address);
    }

    // ========================================================================
    // API PÚBLICA
    // ========================================================================

    getManagers() {
        return {
            dataManager: this.dataManager,
            web3Manager: this.web3Manager,
            authManager: this.authManager
        };
    }

    isWeb3Available() {
        return !!(this.web3Manager && this.authManager);
    }

    async connectWallet() {
        if (this.authManager) {
            return await this.authManager.connect();
        }
        throw new Error('AuthManager não disponível');
    }
}

// ========================================================================
// INICIALIZAÇÃO
// ========================================================================
const indexPage = new IndexPage();

console.log('🚀 Index Page Otimizado carregado com sucesso!');