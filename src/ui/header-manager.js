// Sistema unificado de Header - Suporta tanto header simples quanto dashboard
class HeaderManager {
    constructor(options = {}) {
        this.isDashboard = options.isDashboard || false;
        this.googleTranslateLoaded = false;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupLanguageSelector();
        this.loadGoogleTranslate();
        
        if (this.isDashboard) {
            this.initializeWalletDisplay();
            this.initializeUserTypeDisplay();
        }
    }

    loadGoogleTranslate() {
        const script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.onerror = () => console.warn('Google Translate não pôde ser carregado');
        document.head.appendChild(script);
        
        window.googleTranslateElementInit = () => {
            new google.translate.TranslateElement({
                pageLanguage: 'pt',
                includedLanguages: 'pt,en,es',
                layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL,
                autoDisplay: true,
                multilanguagePage: true
            }, 'google_translate_element');
            this.googleTranslateLoaded = true;
        };
    }

    setupEventListeners() {
        const getStartedBtn = document.getElementById('get-started-btn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', this.handleGetStarted.bind(this));
        }
    }

    async handleGetStarted() {
        window.location.href = '/auth.html';
    }

    setupLanguageSelector() {
        this.restoreSavedLanguage();
    }

    restoreSavedLanguage() {
        const savedLang = localStorage.getItem('selectedLanguage');
        const savedFlag = localStorage.getItem('selectedFlag');
        
        if (savedLang && savedFlag) {
            updateLanguageSelector(savedLang, savedFlag);
            setTimeout(() => applyGoogleTranslation(savedLang), 2000);
        }
    }

    // Métodos específicos do dashboard
    initializeWalletDisplay() {
        if (!this.isDashboard) return;
        
        const walletAddress = localStorage.getItem('walletAddress');
        if (walletAddress) {
            this.updateWalletDisplay(walletAddress);
        }
    }

    initializeUserTypeDisplay() {
        if (!this.isDashboard) return;
        
        const userType = this.determineUserType();
        this.updateUserTypeDisplay(userType);
    }

    updateWalletDisplay(address) {
        if (!this.isDashboard) return;
        
        const walletElements = document.querySelectorAll('[data-wallet-address]');
        walletElements.forEach(element => {
            if (element) {
                element.textContent = this.shortenAddress(address);
                element.setAttribute('data-wallet-address', address);
            }
        });
    }

    updateUserTypeDisplay(userType) {
        if (!this.isDashboard) return;
        
        const userTypeElement = document.getElementById('user-type-display');
        if (userTypeElement) {
            userTypeElement.textContent = userType;
        }
    }

    determineUserType() {
        if (!this.isDashboard) return 'User';
        
        const isAdmin = this.checkIfAdmin();
        if (isAdmin) {
            return 'Admin';
        }
        
        const credits = this.getUserCredits();
        return credits > 0 ? 'Premium' : 'Free';
    }

    checkIfAdmin() {
        const adminWallets = ['0x123...', '0x456...'];
        const currentWallet = localStorage.getItem('walletAddress');
        return adminWallets.includes(currentWallet);
    }

    getUserCredits() {
        return parseInt(localStorage.getItem('userCredits') || '0');
    }

    shortenAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    setupWalletClickToCopy() {
        if (!this.isDashboard) return;
        
        const walletElements = document.querySelectorAll('[data-wallet-address]');
        walletElements.forEach(element => {
            element.addEventListener('click', async () => {
                const address = element.getAttribute('data-wallet-address');
                if (address) {
                    await this.copyToClipboard(address);
                    this.showCopyFeedback(element);
                }
            });
        });
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    }

    showCopyFeedback(element) {
        const originalText = element.textContent;
        element.textContent = 'Copiado!';
        element.style.color = '#28a745';
        
        setTimeout(() => {
            element.textContent = originalText;
            element.style.color = '';
        }, 2000);
    }
}

// Funções globais compartilhadas
function changeLanguage(lang, flag, name) {
    localStorage.setItem('selectedLanguage', lang);
    localStorage.setItem('selectedFlag', flag);
    localStorage.setItem('selectedLanguageName', name);
    
    updateLanguageSelector(lang, flag);
    
    setTimeout(() => {
        applyGoogleTranslation(lang);
    }, 500);
}

function loadGoogleTranslateForced() {
    if (window.google && window.google.translate) {
        const translateElement = document.getElementById('google_translate_element');
        if (translateElement) {
            translateElement.style.display = 'block';
            translateElement.style.position = 'fixed';
            translateElement.style.top = '10px';
            translateElement.style.right = '10px';
            translateElement.style.zIndex = '9999';
            translateElement.style.background = 'white';
            translateElement.style.padding = '5px';
            translateElement.style.borderRadius = '5px';
            
            setTimeout(() => {
                translateElement.style.display = 'none';
            }, 3000);
        }
    }
}

function applyGoogleTranslation(lang) {
    if (!window.google || !window.google.translate) {
        setTimeout(() => applyGoogleTranslation(lang), 1000);
        return;
    }
    
    const langMap = {
        'pt': 'pt',
        'en': 'en', 
        'es': 'es'
    };
    
    const targetLang = langMap[lang] || 'pt';
    
    try {
        const translateElement = document.querySelector('.goog-te-combo');
        if (translateElement) {
            translateElement.value = targetLang;
            translateElement.dispatchEvent(new Event('change'));
        }
    } catch (error) {
        console.warn('Erro ao aplicar tradução:', error);
    }
}

function updateLanguageSelector(lang, flag) {
    const flagElement = document.getElementById('selected-flag');
    const langElement = document.getElementById('selected-lang');
    
    if (flagElement && flag) {
        flagElement.src = flag;
        flagElement.alt = lang;
    }
    
    if (langElement) {
        const langNames = {
            'pt': 'Português',
            'en': 'English',
            'es': 'Español'
        };
        langElement.textContent = langNames[lang] || lang;
    }
}

function disconnectWallet() {
    if (window.web3Manager) {
        window.web3Manager.disconnect();
    }
    
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('userCredits');
    
    window.location.href = '/index.html';
}

// Funções específicas do dashboard
function toggleTheme() {
    // Delegar para o ThemeController se disponível
    if (window.themeController) {
        window.themeController.toggleTheme();
        return;
    }
    
    // Fallback básico
    const body = document.body;
    const isDark = body.classList.contains('dark-theme');
    
    if (isDark) {
        body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    }
}

function showLanguageOptions() {
    const modal = document.getElementById('languageModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeLanguageModal() {
    const modal = document.getElementById('languageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showWalletInfo() {
    const walletAddress = localStorage.getItem('walletAddress');
    const userCredits = localStorage.getItem('userCredits') || '0';
    
    if (walletAddress) {
        alert(`Carteira: ${walletAddress}\nCréditos: ${userCredits}`);
    }
}

function copyWalletAddress() {
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
        navigator.clipboard.writeText(walletAddress).then(() => {
            alert('Endereço copiado!');
        });
    }
}

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const isDashboard = window.location.pathname.includes('dashboard') || 
                           document.body.classList.contains('dashboard-page');
        window.headerManager = new HeaderManager({ isDashboard });
        setTimeout(loadGoogleTranslateForced, 1000);
    });
} else {
    const isDashboard = window.location.pathname.includes('dashboard') || 
                       document.body.classList.contains('dashboard-page');
    window.headerManager = new HeaderManager({ isDashboard });
    setTimeout(loadGoogleTranslateForced, 1000);
}

// Exportar funções globais
window.changeLanguage = changeLanguage;
window.loadGoogleTranslateForced = loadGoogleTranslateForced;
window.applyGoogleTranslation = applyGoogleTranslation;
window.updateLanguageSelector = updateLanguageSelector;
window.disconnectWallet = disconnectWallet;
window.toggleTheme = toggleTheme;
window.showLanguageOptions = showLanguageOptions;
window.closeLanguageModal = closeLanguageModal;
window.showWalletInfo = showWalletInfo;
window.copyWalletAddress = copyWalletAddress;