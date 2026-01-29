/**
 * ARQUIVO PRINCIPAL DO FRONTEND
 * 
 * Controla a inicialização da aplicação e coordena
 * todas as funcionalidades do sistema
 */

// Estado global da aplicação
const AppState = {
    arquivosCarregados: [],
    analises: [],
    colunasEscolhidas: {},
    previewData: null,
    processandoUpload: false,
    processandoAnalise: false,
    processandoCombinacao: false
};

// Configurações da aplicação
const AppConfig = {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 10,
    allowedTypes: ['xlsx', 'xls', 'csv', 'txt'],
    apiBaseUrl: '/api'
};

/**
 * INICIALIZAÇÃO DA APLICAÇÃO
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Sistema de Manipulação de Planilhas');
    
    // Verificar se elementos existem
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    
    console.log('🔍 Verificando elementos:');
    console.log('  - File input:', fileInput ? '✅ Encontrado' : '❌ Não encontrado');
    console.log('  - Upload area:', uploadArea ? '✅ Encontrado' : '❌ Não encontrado');
    
    if (fileInput) {
        console.log('  - Multiple attribute:', fileInput.hasAttribute('multiple') ? '✅ Habilitado' : '❌ Desabilitado');
        console.log('  - Accept attribute:', fileInput.accept || 'não definido');
    }
    
    // Inicializar componentes
    inicializarEventListeners();
    inicializarDragAndDrop();
    verificarConexaoServidor();
    
    // Verificar se há arquivos exportados
    carregarExportsExistentes();
    
    console.log('✅ Sistema inicializado com sucesso');
});

/**
 * CONFIGURAÇÃO DE EVENT LISTENERS
 */
function inicializarEventListeners() {
    // Upload de arquivos
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        console.log('✅ Input de arquivo encontrado, adicionando listener');
        fileInput.addEventListener('change', function(event) {
            console.log('🔥 Change event disparado!');
            console.log('Event:', event);
            console.log('Target:', event.target);
            console.log('Files:', event.target.files);
            console.log('Files length:', event.target.files ? event.target.files.length : 0);
            
            handleFileSelection(event);
        });
    } else {
        console.error('❌ Input de arquivo não encontrado!');
    }
    
    // Botões principais
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        console.log('✅ Upload area encontrada, adicionando listener');
        uploadArea.addEventListener('click', () => {
            console.log('🖱️ Upload area clicada');
            const input = document.getElementById('file-input');
            if (input) {
                console.log('📁 Abrindo seletor de arquivos...');
                input.click();
            } else {
                console.error('❌ Input não encontrado ao clicar na área!');
            }
        });
    } else {
        console.error('❌ Upload area não encontrada!');
    }
    
    // Teclas de atalho
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Fechar modais com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharTodosModais();
        }
    });
    
    // Clique fora do modal para fechar
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                fecharModal(modal.id);
            }
        });
    });
}

/**
 * CONFIGURAÇÃO DE DRAG AND DROP
 */
function inicializarDragAndDrop() {
    const uploadArea = document.getElementById('upload-area');
    
    if (!uploadArea) return;
    
    // Prevenir comportamento padrão para toda a página
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });
    
    // Destacar área de drop
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Processar arquivos dropados
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight(e) {
        uploadArea.classList.add('dragover');
    }
    
    function unhighlight(e) {
        uploadArea.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFileSelection({ target: { files } });
    }
}

/**
 * MANIPULAÇÃO DE SELEÇÃO DE ARQUIVOS
 */
function handleFileSelection(event) {
    console.log('🔍 handleFileSelection chamado');
    console.log('Event target:', event.target);
    console.log('Files object:', event.target.files);
    console.log('Files length:', event.target.files ? event.target.files.length : 0);
    
    const files = Array.from(event.target.files);
    
    console.log('📁 Files array:', files);
    console.log('📁 Array length:', files.length);
    
    if (files.length === 0) {
        console.warn('⚠️ Nenhum arquivo selecionado');
        return;
    }
    
    console.log(`📁 ${files.length} arquivo(s) selecionado(s):`);
    files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name} (${formatarTamanho(file.size)})`);
    });
    
    // Validar arquivos
    const validationResult = validarArquivos(files);
    
    if (!validationResult.valid) {
        mostrarToast('error', 'Erro na validação', validationResult.message);
        return;
    }
    
    // Fazer upload dos arquivos
    uploadArquivos(files);
}

/**
 * FUNÇÃO DE TESTE PARA UPLOAD MÚLTIPLO
 */
function testarUploadMultiplo() {
    console.log('🧪 INICIANDO TESTE DE UPLOAD MÚLTIPLO');
    
    const fileInput = document.getElementById('file-input');
    
    if (!fileInput) {
        console.error('❌ Input de arquivo não encontrado!');
        mostrarToast('error', 'Erro', 'Input de arquivo não encontrado');
        return;
    }
    
    console.log('📋 Informações do input:');
    console.log('  - Element:', fileInput);
    console.log('  - Type:', fileInput.type);
    console.log('  - Multiple:', fileInput.multiple);
    console.log('  - Accept:', fileInput.accept);
    console.log('  - Hidden:', fileInput.hidden);
    console.log('  - Disabled:', fileInput.disabled);
    
    // Simular clique programático
    console.log('🖱️ Simulando clique no input...');
    fileInput.click();
    
    // Verificar se o evento change está funcionando
    fileInput.addEventListener('change', function testHandler(e) {
        console.log('🔥 TESTE: Change event capturado!');
        console.log('  - Files count:', e.target.files.length);
        console.log('  - Files:', e.target.files);
        
        if (e.target.files.length > 1) {
            mostrarToast('success', 'Teste OK', `Upload múltiplo funcionando! ${e.target.files.length} arquivos selecionados.`);
        } else if (e.target.files.length === 1) {
            mostrarToast('warning', 'Teste Parcial', 'Apenas 1 arquivo selecionado. Tente selecionar múltiplos arquivos com Ctrl+Clique.');
        } else {
            mostrarToast('info', 'Teste', 'Nenhum arquivo selecionado.');
        }
        
        // Remover listener de teste
        fileInput.removeEventListener('change', testHandler);
    }, { once: true });
}

/**
 * VALIDAÇÃO DE ARQUIVOS
 */
function validarArquivos(files) {
    // Verificar número máximo de arquivos
    if (files.length > AppConfig.maxFiles) {
        return {
            valid: false,
            message: `Máximo de ${AppConfig.maxFiles} arquivos permitidos por vez`
        };
    }
    
    // Verificar cada arquivo
    for (const file of files) {
        // Verificar tamanho
        if (file.size > AppConfig.maxFileSize) {
            return {
                valid: false,
                message: `Arquivo "${file.name}" é muito grande (máximo: ${formatarTamanho(AppConfig.maxFileSize)})`
            };
        }
        
        // Verificar tipo
        const extension = file.name.split('.').pop().toLowerCase();
        if (!AppConfig.allowedTypes.includes(extension)) {
            return {
                valid: false,
                message: `Formato "${extension}" não suportado. Formatos aceitos: ${AppConfig.allowedTypes.join(', ')}`
            };
        }
    }
    
    return { valid: true };
}

/**
 * ATALHOS DE TECLADO
 */
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + U para upload
    if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
        event.preventDefault();
        document.getElementById('file-input').click();
    }
    
    // Ctrl/Cmd + A para analisar
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        if (AppState.arquivosCarregados.length > 0) {
            analisarArquivos();
        }
    }
    
    // Ctrl/Cmd + Enter para combinar
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (Object.keys(AppState.colunasEscolhidas).length > 0) {
            combinarPlanilhas();
        }
    }
}

/**
 * VERIFICAÇÃO DE CONEXÃO COM SERVIDOR
 */
async function verificarConexaoServidor() {
    const statusElement = document.getElementById('status-conexao');
    
    try {
        const response = await fetch('/api/health', { method: 'HEAD' });
        
        if (response.ok || response.status === 404) {
            // Status 404 é OK, significa que o servidor está rodando
            statusElement.className = 'status online';
            statusElement.innerHTML = '<i class="fas fa-circle"></i> Online';
        } else {
            throw new Error('Servidor não responde');
        }
    } catch (error) {
        statusElement.className = 'status offline';
        statusElement.innerHTML = '<i class="fas fa-circle"></i> Offline';
        
        mostrarToast('warning', 'Conexão', 'Problema de conexão com o servidor');
    }
}

/**
 * CARREGAR EXPORTS EXISTENTES
 */
async function carregarExportsExistentes() {
    try {
        const response = await fetch(`${AppConfig.apiBaseUrl}/planilhas/exports`);
        const data = await response.json();
        
        if (data.success && data.exports && data.exports.length > 0) {
            mostrarSecao('exports-section');
            renderizarExports(data.exports);
        }
    } catch (error) {
        console.warn('Não foi possível carregar exports existentes:', error);
    }
}

/**
 * RENDERIZAR LISTA DE EXPORTS
 */
function renderizarExports(exports) {
    const exportsGrid = document.getElementById('exports-grid');
    
    if (!exports || exports.length === 0) {
        exportsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Nenhum arquivo exportado ainda</h3>
                <p>As planilhas combinadas aparecerão aqui após o processamento</p>
            </div>
        `;
        return;
    }
    
    exportsGrid.innerHTML = exports.map(exportFile => `
        <div class="file-card">
            <div class="file-card-header">
                <div class="file-info">
                    <h4>${exportFile.filename}</h4>
                    <div class="file-meta">
                        <span><i class="fas fa-weight-hanging"></i> ${formatarTamanho(exportFile.size)}</span>
                        <span><i class="fas fa-calendar"></i> ${formatarData(exportFile.createDate)}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <a href="${exportFile.downloadUrl}" 
                       class="btn btn-primary" 
                       download
                       title="Baixar arquivo">
                        <i class="fas fa-download"></i>
                    </a>
                    <button class="btn btn-danger" 
                            onclick="removerExport('${exportFile.filename}')"
                            title="Remover arquivo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="file-status success">
                <i class="fas fa-check-circle"></i>
                <span>Pronto para download</span>
            </div>
        </div>
    `).join('');
}

/**
 * REMOVER ARQUIVO EXPORTADO
 */
async function removerExport(filename) {
    if (!confirm(`Deseja remover o arquivo "${filename}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${AppConfig.apiBaseUrl}/planilhas/exports/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarToast('success', 'Sucesso', 'Arquivo removido com sucesso');
            carregarExportsExistentes(); // Recarregar lista
        } else {
            throw new Error(data.message || 'Erro ao remover arquivo');
        }
    } catch (error) {
        console.error('Erro ao remover export:', error);
        mostrarToast('error', 'Erro', 'Erro ao remover arquivo: ' + error.message);
    }
}

/**
 * LIMPAR TODOS OS ARQUIVOS CARREGADOS
 */
async function limparTodosArquivos() {
    if (!confirm('Deseja limpar todos os arquivos carregados?')) {
        return;
    }
    
    // Limpar estado
    AppState.arquivosCarregados = [];
    AppState.analises = [];
    AppState.colunasEscolhidas = {};
    AppState.previewData = null;
    
    // Esconder seções
    ocultarSecao('files-section');
    ocultarSecao('analysis-section');
    ocultarSecao('preview-section');
    
    // Limpar inputs
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.value = '';
    }
    
    const outputFilename = document.getElementById('output-filename');
    if (outputFilename) {
        outputFilename.value = 'planilha_combinada';
    }
    
    mostrarToast('info', 'Limpeza', 'Todos os arquivos foram removidos');
}

/**
 * MOSTRAR/OCULTAR SEÇÕES
 */
function mostrarSecao(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        section.classList.add('fade-in');
    }
}

function ocultarSecao(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'none';
        section.classList.remove('fade-in');
    }
}

/**
 * CONTROLE DE MODAIS
 */
function mostrarModal(modalId, titulo = '', mensagem = '') {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Atualizar conteúdo se fornecido
    if (titulo) {
        const titleElement = modal.querySelector('.modal-header h3');
        if (titleElement) {
            const icon = titleElement.querySelector('i');
            const iconHtml = icon ? icon.outerHTML + ' ' : '';
            titleElement.innerHTML = iconHtml + titulo;
        }
    }
    
    if (mensagem) {
        const messageElement = modal.querySelector('.modal-body p');
        if (messageElement) {
            messageElement.textContent = mensagem;
        }
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function fecharTodosModais() {
    document.querySelectorAll('.modal.show').forEach(modal => {
        modal.classList.remove('show');
    });
    document.body.style.overflow = '';
}

/**
 * MOSTRAR LOADING
 */
function mostrarLoading(mensagem = 'Processando...') {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.textContent = mensagem;
    }
    mostrarModal('loading-modal');
}

function esconderLoading() {
    fecharModal('loading-modal');
}

/**
 * ATUALIZAR PROGRESS BAR
 */
function atualizarProgress(porcentagem, texto = '') {
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (porcentagem > 0) {
        progressContainer.style.display = 'block';
    }
    
    if (progressFill) {
        progressFill.style.width = `${Math.max(0, Math.min(100, porcentagem))}%`;
    }
    
    if (progressText && texto) {
        progressText.textContent = texto;
    }
    
    if (porcentagem >= 100) {
        setTimeout(() => {
            progressContainer.style.display = 'none';
        }, 1000);
    }
}

// Expor funções globais necessárias
window.handleFileSelection = handleFileSelection;
window.limparTodosArquivos = limparTodosArquivos;
window.mostrarModal = mostrarModal;
window.fecharModal = fecharModal;
window.mostrarLoading = mostrarLoading;
window.esconderLoading = esconderLoading;
window.atualizarProgress = atualizarProgress;
window.testarUploadMultiplo = testarUploadMultiplo;
window.AppState = AppState;
window.AppConfig = AppConfig;
