/**
 * SUPPORT.JS - Sistema Simples de Formulário (SEM CARTEIRA)
 */

console.log('📄 Support.js carregado');

// Aguardar template ser carregado
function waitForSupportForm() {
    const checkFormExists = () => {
        const form = document.getElementById('contact-support-form');
        if (form) {
            console.log('✅ Formulário encontrado, inicializando...');
            initializeSupportForm();
        } else {
            setTimeout(checkFormExists, 500);
        }
    };
    checkFormExists();
}

// Função principal - validação de formulário e formatação
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('supportForm');
    if (form) {
        const whatsappInput = document.getElementById('contact-whatsapp');
        const walletInput = document.getElementById('contact-wallet');
        const messageTextarea = document.getElementById('contact-message');
        const termsCheckbox = document.getElementById('contact-terms');
        const submitBtn = document.getElementById('submit-btn');
        const validationStatus = document.getElementById('validation-status');
        
        // Validar campos obrigatórios em tempo real
        function validateRequiredFields() {
            const nameField = document.getElementById('contact-name');
            const emailField = document.getElementById('contact-email');
            const whatsappField = document.getElementById('contact-whatsapp');
            const subjectField = document.getElementById('contact-subject');
            const messageField = document.getElementById('contact-message');
            const termsField = document.getElementById('contact-terms');
            
            const name = nameField?.value.trim();
            const email = emailField?.value.trim();
            const whatsapp = whatsappField?.value.trim();
            const subject = subjectField?.value;
            const message = messageField?.value.trim();
            const terms = termsField?.checked;
            
            // Aplicar classes de validação visual para todos os campos
            [nameField, emailField, whatsappField, messageField].forEach(field => {
                if (field) {
                    const isValid = field.value.trim() !== '';
                    field.classList.toggle('is-valid', isValid);
                    field.classList.toggle('is-invalid', !isValid && field.value !== '');
                }
            });
            
            // Validação específica do select
            if (subjectField) {
                const isSubjectValid = subjectField.value !== '';
                subjectField.classList.toggle('is-valid', isSubjectValid);
                subjectField.classList.toggle('is-invalid', !isSubjectValid && subjectField.value !== '');
            }
            
            // Validação do email
            if (emailField && email) {
                const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                emailField.classList.toggle('is-valid', emailValid);
                emailField.classList.toggle('is-invalid', !emailValid);
            }
            
            // Validação do WhatsApp
            if (whatsappField && whatsapp) {
                const whatsappValid = /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(whatsapp);
                whatsappField.classList.toggle('is-valid', whatsappValid);
                whatsappField.classList.toggle('is-invalid', !whatsappValid);
            }
            
            // Validação da mensagem (mínimo 10 caracteres)
            if (messageField && message) {
                const messageValid = message.length >= 10;
                messageField.classList.toggle('is-valid', messageValid);
                messageField.classList.toggle('is-invalid', !messageValid);
            }
            
            const isFormValid = name && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && 
                               whatsapp && /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(whatsapp) && 
                               subject && message.length >= 10 && terms;
            
            // Atualizar botão
            if (submitBtn) {
                submitBtn.disabled = !isFormValid;
                submitBtn.classList.toggle('btn-warning', isFormValid);
                submitBtn.classList.toggle('btn-secondary', !isFormValid);
            }
            
            // Atualizar status
            if (validationStatus) {
                if (isFormValid) {
                    validationStatus.innerHTML = '<i class="fas fa-check-circle text-success me-1"></i>Formulário pronto para envio';
                    validationStatus.className = 'text-success';
                } else {
                    validationStatus.innerHTML = '<i class="fas fa-info-circle me-1"></i>Preencha todos os campos obrigatórios para enviar';
                    validationStatus.className = 'text-muted';
                }
            }
            
            return isFormValid;
        }
        
        // Event listeners para validação em tempo real
        ['contact-name', 'contact-email', 'contact-whatsapp', 'contact-subject', 'contact-message'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', validateRequiredFields);
                element.addEventListener('change', validateRequiredFields);
            }
        });
        
        if (termsCheckbox) {
            termsCheckbox.addEventListener('change', validateRequiredFields);
        }
        
        // Formatação automática do WhatsApp
        if (whatsappInput) {
            whatsappInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length <= 11) {
                    if (value.length <= 2) {
                        value = value.replace(/(\d{0,2})/, '($1');
                    } else if (value.length <= 6) {
                        value = value.replace(/(\d{2})(\d{0,4})/, '($1) $2');
                    } else if (value.length <= 10) {
                        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                    } else {
                        value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                    }
                }
                
                e.target.value = value;
                validateRequiredFields();
            });
        }
        
        // Validação básica do campo carteira (opcional)
        if (walletInput) {
            walletInput.addEventListener('input', function(e) {
                const value = e.target.value.trim();
                
                if (value && !value.startsWith('0x')) {
                    e.target.value = '0x' + value.replace(/^0x/, '');
                }
                
                // Validação básica de formato Ethereum
                if (value && !/^0x[a-fA-F0-9]{40}$/.test(value) && value.length === 42) {
                    e.target.setCustomValidity('Formato de carteira inválido');
                } else {
                    e.target.setCustomValidity('');
                }
            });
        }
        
        // Contador de caracteres para mensagem
        if (messageTextarea) {
            const maxLength = 1000;
            const counter = document.getElementById('char-count');
            
            if (counter) {
                messageTextarea.addEventListener('input', function() {
                    const remaining = this.value.length;
                    counter.textContent = remaining;
                    
                    if (remaining > maxLength * 0.9) {
                        counter.classList.add('text-warning');
                    } else {
                        counter.classList.remove('text-warning');
                    }
                    
                    validateRequiredFields();
                });
            }
        }
        
        // Validação inicial
        setTimeout(validateRequiredFields, 500);
        
        // Validação do formulário para email
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                if (validateForm() && validateRequiredFields()) {
                    sendEmailMessage();
                }
            });
        }
        
        console.log('✅ Support formulário pronto');
    }
}

// Função para enviar por email
function sendEmailMessage() {
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    
    if (submitBtn && btnText) {
        const originalText = btnText.textContent;
        btnText.textContent = 'Enviando...';
        submitBtn.disabled = true;
        
        // Coletar dados do formulário
        const formData = {
            name: document.getElementById('contact-name')?.value.trim(),
            email: document.getElementById('contact-email')?.value.trim(),
            whatsapp: document.getElementById('contact-whatsapp')?.value.trim(),
            wallet: document.getElementById('contact-wallet')?.value.trim(),
            subject: document.getElementById('contact-subject')?.value,
            message: document.getElementById('contact-message')?.value.trim()
        };
        
        // Simular envio (aqui seria integrado com backend)
        setTimeout(() => {
            console.log('📧 Enviando email:', formData);
            
            showSuccessMessage('Mensagem enviada com sucesso! Retornaremos em breve.');
            clearForm(); // Usar a nova função de limpeza
            
            btnText.textContent = originalText;
            
            // Scroll para topo suave
            setTimeout(() => {
                document.querySelector('#support h2').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }, 2000);
    }
}

// Validação simples do formulário
function validateForm() {
    const form = document.getElementById('contact-support-form');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        }
    });
    
    return isValid;
}

// Toast de sucesso moderno
function showSuccessMessage(customMessage) {
    const message = customMessage || 'Mensagem enviada com sucesso!';
    const toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        console.warn('Toast container não encontrado');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-bg-success border-0 show';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Sucesso!</strong> ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remover após 5 segundos com animação
    setTimeout(() => {
        toast.classList.add('fade');
        setTimeout(() => {
            toast.remove();
        }, 150);
    }, 5000);
}

// Função para limpar formulário completamente
function clearForm() {
    const form = document.getElementById('contact-support-form');
    if (form) {
        form.reset();
        
        // Remover todas as classes de validação
        form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
        });
        
        // Resetar contador de caracteres
        const charCounter = document.getElementById('char-count');
        if (charCounter) {
            charCounter.textContent = '0';
            charCounter.classList.remove('text-warning');
        }
        
        // Resetar status de validação
        const validationStatus = document.getElementById('validation-status');
        if (validationStatus) {
            validationStatus.innerHTML = '<i class="fas fa-info-circle me-1"></i>Preencha todos os campos obrigatórios para enviar';
            validationStatus.className = 'text-muted';
        }
        
        // Resetar botão
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.remove('btn-warning');
            submitBtn.classList.add('btn-secondary');
        }
    }
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForSupportForm);
} else {
    waitForSupportForm();
}