/*
================================================================================
TEMPLATE LOADER OTIMIZADO - SISTEMA DE CARREGAMENTO DE TEMPLATES
================================================================================
Sistema otimizado para carregamento de header e footer
Remove duplicações e simplifica o carregamento modular
================================================================================
*/

class TemplateLoader {
    constructor() {
        this.loadedTemplates = new Set();
        this.cache = new Map();
        this.isLoading = new Set();
    }

    /**
     * Carrega um template HTML e insere no container especificado
     */
    async loadTemplate(templatePath, containerId, callback = null) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Container com ID "${containerId}" não encontrado`);
                return false;
            }

            // Evitar carregamentos duplicados simultâneos
            const loadKey = `${templatePath}-${containerId}`;
            if (this.isLoading.has(loadKey)) {
                console.log(`⏳ Template já está sendo carregado: ${templatePath}`);
                return false;
            }

            this.isLoading.add(loadKey);

            // Verificar cache
            let html;
            if (this.cache.has(templatePath)) {
                html = this.cache.get(templatePath);
                console.log(`📦 Template carregado do cache: ${templatePath}`);
            } else {
                // Carregar do servidor
                console.log(`🔄 Carregando template: ${templatePath}`);
                
                const response = await fetch(templatePath);
                if (!response.ok) {
                    throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
                }
                
                html = await response.text();
                
                // Salvar no cache
                this.cache.set(templatePath, html);
            }

            // Inserir conteúdo no container
            container.innerHTML = html;

            // Marcar como carregado
            this.loadedTemplates.add(loadKey);

            // Executar callback se fornecido
            if (callback && typeof callback === 'function') {
                try {
                    callback(container);
                } catch (callbackError) {
                    console.error(`❌ Erro no callback do template ${templatePath}:`, callbackError);
                }
            }

            // Disparar evento personalizado
            const event = new CustomEvent('templateLoaded', {
                detail: {
                    templatePath: templatePath,
                    containerId: containerId,
                    container: container
                }
            });
            document.dispatchEvent(event);

            console.log(`✅ Template carregado: ${templatePath} -> ${containerId}`);
            return true;

        } catch (error) {
            console.error(`❌ Erro ao carregar template ${templatePath}:`, error);
            return false;
        } finally {
            // Remover do conjunto de carregamentos em andamento
            const loadKey = `${templatePath}-${containerId}`;
            this.isLoading.delete(loadKey);
        }
    }

    /**
     * Carrega templates padrão (header, footer e support) automaticamente
     */
    async loadDefaultTemplates() {
        const promises = [];
        
        // Carregar header se existir container
        const headerElements = document.querySelectorAll('[data-component="header"]');
        headerElements.forEach(element => {
            const containerId = element.id || `header-container-${Math.random().toString(36).substr(2, 9)}`;
            element.id = containerId;
            promises.push(this.loadTemplate('header.html', containerId));
        });

        // Carregar footer se existir container
        const footerElements = document.querySelectorAll('[data-component="footer"]');
        footerElements.forEach(element => {
            const containerId = element.id || `footer-container-${Math.random().toString(36).substr(2, 9)}`;
            element.id = containerId;
            promises.push(this.loadTemplate('footer.html', containerId));
        });

        // Carregar support se existir container
        const supportElements = document.querySelectorAll('[data-component="support"]');
        supportElements.forEach(element => {
            const containerId = element.id || `support-container-${Math.random().toString(36).substr(2, 9)}`;
            element.id = containerId;
            promises.push(this.loadTemplate('support.html', containerId));
        });

        // Carregar dash-header se existir container
        const dashHeaderElements = document.querySelectorAll('[data-component="dash-header"]');
        dashHeaderElements.forEach(element => {
            const containerId = element.id || `dash-header-container-${Math.random().toString(36).substr(2, 9)}`;
            element.id = containerId;
            promises.push(this.loadTemplate('dash-header.html', containerId));
        });

        // Carregar dash-footer se existir container
        const dashFooterElements = document.querySelectorAll('[data-component="dash-footer"]');
        dashFooterElements.forEach(element => {
            const containerId = element.id || `dash-footer-container-${Math.random().toString(36).substr(2, 9)}`;
            element.id = containerId;
            promises.push(this.loadTemplate('dash-footer.html', containerId));
        });

        // Aguardar todos os carregamentos
        const results = await Promise.allSettled(promises);
        
        let successful = 0;
        let failed = 0;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value === true) {
                successful++;
            } else {
                failed++;
                console.warn(`⚠️ Falha ao carregar template ${index + 1}`);
            }
        });

        console.log(`📄 Templates carregados: ${successful} sucessos, ${failed} falhas`);
        return { successful, failed };
    }

    /**
     * Carrega múltiplos templates de forma otimizada
     */
    async loadTemplates(templateConfigs) {
        const promises = templateConfigs.map(config => {
            const { templatePath, containerId, callback } = config;
            return this.loadTemplate(templatePath, containerId, callback);
        });

        const results = await Promise.allSettled(promises);
        return results.map(result => result.status === 'fulfilled' ? result.value : false);
    }

    /**
     * Pré-carrega templates no cache
     */
    async preloadTemplates(templatePaths) {
        const promises = templatePaths.map(async (path) => {
            if (!this.cache.has(path)) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        const html = await response.text();
                        this.cache.set(path, html);
                        console.log(`💾 Template pré-carregado: ${path}`);
                        return true;
                    }
                } catch (error) {
                    console.warn(`⚠️ Falha ao pré-carregar: ${path}`);
                }
            }
            return false;
        });

        await Promise.allSettled(promises);
    }

    /**
     * Verifica se um template já foi carregado
     */
    isTemplateLoaded(templatePath, containerId) {
        const loadKey = `${templatePath}-${containerId}`;
        return this.loadedTemplates.has(loadKey);
    }

    /**
     * Limpa cache de templates
     */
    clearCache() {
        this.cache.clear();
        this.loadedTemplates.clear();
        console.log('🧹 Cache de templates limpo');
    }

    /**
     * Recarrega um template forçadamente
     */
    async reloadTemplate(templatePath, containerId, callback = null) {
        // Remover do cache
        this.cache.delete(templatePath);
        const loadKey = `${templatePath}-${containerId}`;
        this.loadedTemplates.delete(loadKey);
        
        // Carregar novamente
        return await this.loadTemplate(templatePath, containerId, callback);
    }

    /**
     * Obtém estatísticas do cache
     */
    getCacheStats() {
        return {
            cachedTemplates: this.cache.size,
            loadedTemplates: this.loadedTemplates.size,
            currentlyLoading: this.isLoading.size
        };
    }
}

// ========================================================================
// AUTO-INICIALIZAÇÃO OTIMIZADA
// ========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um momento para garantir que todos os elementos estão prontos
    setTimeout(() => {
        // Verificar se existem elementos de template para carregar
        const headerElements = document.querySelectorAll('[data-component="header"]');
        const footerElements = document.querySelectorAll('[data-component="footer"]');
        const supportElements = document.querySelectorAll('[data-component="support"]');
        
        if (headerElements.length > 0 || footerElements.length > 0 || supportElements.length > 0) {
            const templateLoader = new TemplateLoader();
            templateLoader.loadDefaultTemplates();
        } else {
            console.log('ℹ️ Nenhum template component encontrado');
        }
    }, 50); // Reduzido de 100ms para 50ms para carregamento mais rápido
});

// ========================================================================
// INSTÂNCIA GLOBAL
// ========================================================================
window.TemplateLoader = TemplateLoader;

console.log('📄 Template Loader Otimizado carregado com sucesso!');