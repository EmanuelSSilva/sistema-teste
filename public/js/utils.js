/**
 * UTILITÁRIOS GERAIS DO SISTEMA
 * 
 * Funções auxiliares para formatação, validação,
 * notificações e outras utilidades
 */

/**
 * FORMATAÇÃO DE TAMANHO DE ARQUIVO
 */
function formatarTamanho(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const tamanhos = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanhos[i];
}

/**
 * FORMATAÇÃO DE DATA
 */
function formatarData(dataISO) {
    if (!dataISO) return '';
    
    try {
        const data = new Date(dataISO);
        
        // Verificar se a data é válida
        if (isNaN(data.getTime())) {
            return dataISO;
        }
        
        // Formatação brasileira
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.warn('Erro ao formatar data:', error);
        return dataISO;
    }
}

/**
 * FORMATAÇÃO DE TEMPO RELATIVO
 */
function formatarTempoRelativo(dataISO) {
    if (!dataISO) return '';
    
    try {
        const data = new Date(dataISO);
        const agora = new Date();
        const diferenca = agora - data;
        
        // Converter para minutos
        const minutos = Math.floor(diferenca / (1000 * 60));
        
        if (minutos < 1) return 'agora mesmo';
        if (minutos < 60) return `${minutos} min atrás`;
        
        const horas = Math.floor(minutos / 60);
        if (horas < 24) return `${horas}h atrás`;
        
        const dias = Math.floor(horas / 24);
        if (dias < 30) return `${dias}d atrás`;
        
        // Para períodos maiores, usar formatação normal
        return formatarData(dataISO);
        
    } catch (error) {
        return formatarData(dataISO);
    }
}

/**
 * SISTEMA DE NOTIFICAÇÕES TOAST
 */
let toastCounter = 0;

function mostrarToast(tipo = 'info', titulo = '', mensagem = '', duracao = 5000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.warn('Container de toast não encontrado');
        return;
    }
    
    const toastId = `toast-${++toastCounter}`;
    
    // Definir ícone baseado no tipo
    const icones = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    const icone = icones[tipo] || icones.info;
    
    // Criar elemento do toast
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast ${tipo}`;
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icone}"></i>
        </div>
        <div class="toast-content">
            ${titulo ? `<div class="toast-title">${titulo}</div>` : ''}
            ${mensagem ? `<div class="toast-message">${mensagem}</div>` : ''}
        </div>
        <button class="toast-close" onclick="fecharToast('${toastId}')">
            &times;
        </button>
    `;
    
    // Adicionar ao container
    toastContainer.appendChild(toast);
    
    // Auto-remover após duração especificada
    if (duracao > 0) {
        setTimeout(() => {
            fecharToast(toastId);
        }, duracao);
    }
    
    // Log no console para debug
    console.log(`Toast [${tipo.toUpperCase()}]: ${titulo} - ${mensagem}`);
    
    return toastId;
}

function fecharToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.style.animation = 'toastSlideOut 0.3s ease-in-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// CSS para animação de saída do toast
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes toastSlideOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * VALIDAÇÃO DE EMAIL
 */
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * VALIDAÇÃO DE NOME DE ARQUIVO
 */
function validarNomeArquivo(nome) {
    if (!nome || typeof nome !== 'string') {
        return { valido: false, mensagem: 'Nome é obrigatório' };
    }
    
    const nomeLimpo = nome.trim();
    
    if (nomeLimpo.length === 0) {
        return { valido: false, mensagem: 'Nome não pode estar vazio' };
    }
    
    if (nomeLimpo.length > 100) {
        return { valido: false, mensagem: 'Nome muito longo (máximo 100 caracteres)' };
    }
    
    // Caracteres não permitidos em nomes de arquivo
    const caracteresProibidos = /[<>:"/\\|?*]/;
    if (caracteresProibidos.test(nomeLimpo)) {
        return { valido: false, mensagem: 'Nome contém caracteres inválidos' };
    }
    
    return { valido: true, nome: nomeLimpo };
}

/**
 * DEBOUNCE PARA OTIMIZAR PERFORMANCE
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * THROTTLE PARA LIMITAR FREQUÊNCIA DE CHAMADAS
 */
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * CÓPIA PARA ÁREA DE TRANSFERÊNCIA
 */
async function copiarParaClipboard(texto) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(texto);
            mostrarToast('success', 'Copiado', 'Texto copiado para a área de transferência');
        } else {
            // Fallback para navegadores mais antigos
            const textarea = document.createElement('textarea');
            textarea.value = texto;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            mostrarToast('success', 'Copiado', 'Texto copiado para a área de transferência');
        }
        return true;
    } catch (error) {
        console.error('Erro ao copiar para clipboard:', error);
        mostrarToast('error', 'Erro', 'Não foi possível copiar o texto');
        return false;
    }
}

/**
 * DOWNLOAD DE ARQUIVO
 */
function baixarArquivo(url, nomeArquivo = null) {
    try {
        const link = document.createElement('a');
        link.href = url;
        
        if (nomeArquivo) {
            link.download = nomeArquivo;
        }
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        mostrarToast('info', 'Download', 'Download iniciado');
        return true;
    } catch (error) {
        console.error('Erro no download:', error);
        mostrarToast('error', 'Erro', 'Erro ao iniciar download');
        return false;
    }
}

/**
 * VERIFICAR SE DISPOSITIVO É MOBILE
 */
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * VERIFICAR SUPORTE A RECURSOS DO NAVEGADOR
 */
function verificarSuporteNavegador() {
    return {
        fileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob),
        dragAndDrop: 'draggable' in document.createElement('span'),
        localStorage: !!window.localStorage,
        fetch: !!window.fetch,
        clipboard: !!(navigator.clipboard && navigator.clipboard.writeText)
    };
}

/**
 * SANITIZAR HTML PARA PREVENIR XSS
 */
function sanitizarHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * ESCAPAR CARACTERES ESPECIAIS EM REGEX
 */
function escaparRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GERAR ID ÚNICO
 */
function gerarIdUnico() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * AGUARDAR POR TEMPO ESPECÍFICO
 */
function aguardar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * VERIFICAR SE OBJETO ESTÁ VAZIO
 */
function objetoVazio(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

/**
 * CLONAR OBJETO PROFUNDAMENTE
 */
function clonarObjeto(obj) {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (error) {
        console.warn('Erro ao clonar objeto, usando Object.assign:', error);
        return Object.assign({}, obj);
    }
}

/**
 * CAPITALIZAR PRIMEIRA LETRA
 */
function capitalizarPrimeira(str) {
    if (!str || typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * TRUNCAR TEXTO
 */
function truncarTexto(texto, limite = 50, sufixo = '...') {
    if (!texto || texto.length <= limite) return texto;
    return texto.substring(0, limite) + sufixo;
}

/**
 * OBTER PARÂMETROS DA URL
 */
function obterParametrosURL() {
    const params = {};
    const searchParams = new URLSearchParams(window.location.search);
    
    for (const [key, value] of searchParams) {
        params[key] = value;
    }
    
    return params;
}

/**
 * SCROLL SUAVE PARA ELEMENTO
 */
function scrollParaElemento(elemento, offset = 0) {
    const el = typeof elemento === 'string' ? document.getElementById(elemento) : elemento;
    
    if (el) {
        const posicao = el.offsetTop - offset;
        window.scrollTo({
            top: posicao,
            behavior: 'smooth'
        });
    }
}

/**
 * VERIFICAR SE ELEMENTO ESTÁ VISÍVEL NA VIEWPORT
 */
function elementoVisivel(elemento) {
    const rect = elemento.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Expor funções globais
window.formatarTamanho = formatarTamanho;
window.formatarData = formatarData;
window.formatarTempoRelativo = formatarTempoRelativo;
window.mostrarToast = mostrarToast;
window.fecharToast = fecharToast;
window.validarEmail = validarEmail;
window.validarNomeArquivo = validarNomeArquivo;
window.debounce = debounce;
window.throttle = throttle;
window.copiarParaClipboard = copiarParaClipboard;
window.baixarArquivo = baixarArquivo;
window.isMobile = isMobile;
window.verificarSuporteNavegador = verificarSuporteNavegador;
window.sanitizarHTML = sanitizarHTML;
window.escaparRegex = escaparRegex;
window.gerarIdUnico = gerarIdUnico;
window.aguardar = aguardar;
window.objetoVazio = objetoVazio;
window.clonarObjeto = clonarObjeto;
window.capitalizarPrimeira = capitalizarPrimeira;
window.truncarTexto = truncarTexto;
window.obterParametrosURL = obterParametrosURL;
window.scrollParaElemento = scrollParaElemento;
window.elementoVisivel = elementoVisivel;

// Verificar suporte do navegador na inicialização
document.addEventListener('DOMContentLoaded', function() {
    const suporte = verificarSuporteNavegador();
    
    if (!suporte.fileAPI) {
        mostrarToast('error', 'Navegador Incompatível', 
            'Seu navegador não suporta upload de arquivos', 0);
    }
    
    if (!suporte.fetch) {
        mostrarToast('warning', 'Funcionalidade Limitada', 
            'Algumas funcionalidades podem não funcionar corretamente', 8000);
    }
    
    if (isMobile()) {
        // Adicionar classe CSS para mobile se necessário
        document.body.classList.add('mobile-device');
    }
});
