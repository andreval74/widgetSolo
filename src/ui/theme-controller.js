/*
================================================================================
THEME CONTROLLER UNIFICADO - CONTROLE COMPLETO DE TEMAS
================================================================================
Sistema JavaScript para controle de temas globais e específicos do widget demo
Integra funcionalidades do theme-controller.js + index-widget-controller.js
================================================================================
*/

class ThemeController {
    constructor() {
        this.currentTheme = localStorage.getItem('xcafe-theme') || 'dark';
        this.observers = [];
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.applyTheme(this.currentTheme);
            this.setupSimpleThemeToggle();
            this.setupWidgetThemeControls(); // Nova funcionalidade integrada
            this.setupEventListeners();
            this.detectSystemTheme();
            
            // Notificar observadores
            this.notifyObservers(this.currentTheme);
            
            console.log('🎨 Theme Controller Unificado inicializado:', this.currentTheme);
        });
    }

    // ========================================================================
    // CONTROLE DE TEMA GLOBAL (header)
    // ========================================================================

    setupSimpleThemeToggle() {
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkHeader = () => {
            attempts++;
            const themeBtn = document.getElementById('theme-toggle-btn');
            const themeIcon = document.getElementById('theme-icon');
            
            if (themeBtn && themeIcon) {
                this.updateThemeIcon();
                
                themeBtn.addEventListener('click', () => {
                    this.toggleTheme();
                });
                
                console.log('✅ Theme toggle do header configurado');
            } else if (attempts < maxAttempts) {
                setTimeout(checkHeader, 100);
            } else {
                console.log('ℹ️ Theme toggle não encontrado - página sem controle de tema global');
            }
        };
        
        checkHeader();
        
        document.addEventListener('templateLoaded', (event) => {
            if (event.detail && event.detail.containerId === 'header-container') {
                setTimeout(checkHeader, 100);
            }
        });
    }

    // ========================================================================
    // CONTROLE DE TEMA DO WIDGET DEMO (página index)
    // ========================================================================

    setupWidgetThemeControls() {
        // Elementos de controle específicos do widget demo
        const themeLight = document.getElementById('theme-light');
        const themeDark = document.getElementById('theme-dark');

        if (themeLight && themeDark) {
            console.log('🎮 Configurando controles de tema do widget demo...');

            themeLight.addEventListener('change', () => {
                if (themeLight.checked) {
                    this.updateWidgetTheme('light');
                }
            });

            themeDark.addEventListener('change', () => {
                if (themeDark.checked) {
                    this.updateWidgetTheme('dark');
                }
            });

            // Garantir fundo fixo do widget demo
            this.ensureFixedBackground();
        }
    }

    updateWidgetTheme(theme) {
        const widgetContainer = document.getElementById('widget-demo-container');
        const currentThemeExample = document.getElementById('current-theme-example');

        if (widgetContainer) {
            // Atualizar data-theme
            widgetContainer.setAttribute('data-theme', theme);

            // Encontrar o widget existente
            const existingWidget = widgetContainer.querySelector('.token-sale-widget');
            if (existingWidget) {
                // Apenas alterar a classe do widget, SEM afetar o container externo
                if (theme === 'dark') {
                    existingWidget.classList.add('dark');
                } else {
                    existingWidget.classList.remove('dark');
                }
            } else {
                // Se widget não existe, criar novo
                if (window.TokenSaleWidget) {
                    new window.TokenSaleWidget({
                        apiKey: 'demo-key',
                        containerId: 'widget-demo-container',
                        saleId: 'demo-sale',
                        theme: theme
                    });
                }
            }

            // Atualizar exemplo de código
            if (currentThemeExample) {
                currentThemeExample.textContent = theme;
            }

            // Container externo permanece inalterado
            this.ensureFixedBackground();
        }
    }

    ensureFixedBackground() {
        const backgroundContainer = document.getElementById('widget-demo-background');
        if (backgroundContainer) {
            backgroundContainer.style.background = '#f8f9fa';
            backgroundContainer.style.backgroundColor = '#f8f9fa';
        }
    }

    // ========================================================================
    // FUNCIONALIDADES GLOBAIS DE TEMA
    // ========================================================================

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    updateThemeIcon() {
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            if (this.currentTheme === 'light') {
                themeIcon.className = 'fas fa-moon';
            } else {
                themeIcon.className = 'fas fa-sun';
            }
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-btn')) {
                const theme = e.target.closest('.theme-btn').dataset.theme;
                this.setTheme(theme);
            }
        });

        // Escutar mudanças do sistema
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('xcafe-theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    detectSystemTheme() {
        if (!localStorage.getItem('xcafe-theme')) {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.setTheme('dark');
            }
        }
    }

    setTheme(theme) {
        if (!['light', 'dark'].includes(theme)) {
            console.warn(`Tema inválido: ${theme}. Usando 'light' como padrão.`);
            theme = 'light';
        }

        this.currentTheme = theme;
        localStorage.setItem('xcafe-theme', theme);
        this.applyTheme(theme);
        this.updateThemeIcon();
        this.notifyObservers(theme);

        console.log(`🎨 Tema alterado para: ${theme}`);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${theme}`;

        // Aplicar tema em widgets existentes
        const widgets = document.querySelectorAll('[data-token-widget]');
        widgets.forEach(widget => {
            widget.setAttribute('data-theme', theme);
        });

        // Aplicar classes CSS específicas
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        }
    }

    // ========================================================================
    // SISTEMA DE OBSERVADORES
    // ========================================================================

    addObserver(callback) {
        this.observers.push(callback);
    }

    removeObserver(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }

    notifyObservers(theme) {
        this.observers.forEach(callback => {
            try {
                callback(theme);
            } catch (error) {
                console.error('Erro em observer de tema:', error);
            }
        });
    }

    // ========================================================================
    // API PÚBLICA
    // ========================================================================

    getCurrentTheme() {
        return this.currentTheme;
    }

    getAvailableThemes() {
        return ['light', 'dark'];
    }

    isSystemTheme() {
        return !localStorage.getItem('xcafe-theme');
    }
}

// ========================================================================
// CLASSE AUXILIAR PARA COMPATIBILIDADE
// ========================================================================

class WidgetThemeController {
    constructor(themeController) {
        this.themeController = themeController;
    }

    updateWidgetTheme(theme) {
        this.themeController.updateWidgetTheme(theme);
    }

    ensureFixedBackground() {
        this.themeController.ensureFixedBackground();
    }
}

// ========================================================================
// INICIALIZAÇÃO E INSTÂNCIAS GLOBAIS
// ========================================================================

// Instância global do controlador de tema
const themeController = new ThemeController();

// Compatibilidade para código legado
window.themeController = themeController;
window.WidgetThemeController = new WidgetThemeController(themeController);

// Garantir fundo fixo ao carregar (backup para widget demo)
setTimeout(() => {
    if (themeController) {
        themeController.ensureFixedBackground();
    }
}, 100);

console.log('🎨 Theme Controller Unificado carregado com sucesso!');