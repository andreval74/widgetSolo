/**
 * 🔝 BACK TO TOP BUTTON
 * 
 * Controla o botão discreto de voltar ao topo da página
 * - Aparece quando o usuário rola para baixo
 * - Scroll suave ao clicar
 * - Animações discretas e profissionais
 */
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * Controlar visibilidade do botão back-to-top
     */
    function toggleBackToTop() {
        const backToTopBtn = document.getElementById('backToTopBtn');
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }

    // Mostrar/ocultar botão baseado no scroll
    window.addEventListener('scroll', toggleBackToTop);

    // Garantir funções globais
    window.scrollToTop = scrollToTop;
    