/**
 * MÓDULO DE UPLOAD DE ARQUIVOS
 * 
 * Gerencia o upload de arquivos para o servidor,
 * mostra progresso e atualiza a interface
 */

/**
 * FAZER UPLOAD DOS ARQUIVOS SELECIONADOS
 */
async function uploadArquivos(files) {
    if (AppState.processandoUpload) {
        mostrarToast('warning', 'Aguarde', 'Um upload já está em andamento');
        return;
    }
    
    AppState.processandoUpload = true;
    
    try {
        console.log(`📤 Iniciando upload de ${files.length} arquivo(s)`);
        
        // Mostrar progresso
        atualizarProgress(10, 'Preparando upload...');
        mostrarLoading('Enviando arquivos para o servidor...');
        
        // Criar FormData
        const formData = new FormData();
        files.forEach(file => {
            formData.append('planilhas', file);
        });
        
        // Fazer upload
        const response = await fetch(`${AppConfig.apiBaseUrl}/upload/files`, {
            method: 'POST',
            body: formData
        });
        
        atualizarProgress(50, 'Processando arquivos...');
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro no upload');
        }
        
        atualizarProgress(90, 'Finalizando...');
        
        // Processar resultado
        await processarResultadoUpload(data);
        
        atualizarProgress(100, 'Upload concluído!');
        
        console.log('✅ Upload concluído com sucesso');
        
        // Mostrar toast de sucesso
        const sucessCount = data.files.filter(f => !f.error).length;
        const errorCount = data.files.filter(f => f.error).length;
        
        let mensagem = `${sucessCount} arquivo(s) processado(s)`;
        if (errorCount > 0) {
            mensagem += `, ${errorCount} com erro(s)`;
        }
        
        mostrarToast('success', 'Upload Concluído', mensagem);
        
    } catch (error) {
        console.error('❌ Erro no upload:', error);
        atualizarProgress(0, '');
        mostrarToast('error', 'Erro no Upload', error.message);
    } finally {
        AppState.processandoUpload = false;
        esconderLoading();
        
        // Limpar input de arquivo
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.value = '';
        }
    }
}

/**
 * PROCESSAR RESULTADO DO UPLOAD
 */
async function processarResultadoUpload(data) {
    if (!data.files || data.files.length === 0) {
        throw new Error('Nenhum arquivo foi processado');
    }
    
    // Atualizar estado global
    const arquivosValidos = data.files.filter(file => !file.error);
    AppState.arquivosCarregados = arquivosValidos;
    
    // Mostrar seção de arquivos se houver arquivos válidos
    if (arquivosValidos.length > 0) {
        mostrarSecao('files-section');
        renderizarArquivosCarregados(arquivosValidos);
    }
    
    // Mostrar erros se houver
    const arquivosComErro = data.files.filter(file => file.error);
    if (arquivosComErro.length > 0) {
        console.warn('Arquivos com erro:', arquivosComErro);
        
        // Mostrar detalhes dos erros
        arquivosComErro.forEach(file => {
            mostrarToast('error', `Erro em ${file.originalName}`, file.error);
        });
    }
}

/**
 * RENDERIZAR ARQUIVOS CARREGADOS
 */
function renderizarArquivosCarregados(arquivos) {
    const filesGrid = document.getElementById('files-grid');
    
    if (!arquivos || arquivos.length === 0) {
        filesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Nenhum arquivo carregado</h3>
                <p>Faça upload de suas planilhas para começar</p>
            </div>
        `;
        return;
    }
    
    filesGrid.innerHTML = arquivos.map(arquivo => `
        <div class="file-card" data-file-id="${arquivo.id}">
            <div class="file-card-header">
                <div class="file-info">
                    <h4>${arquivo.originalName}</h4>
                    <div class="file-meta">
                        <span><i class="fas fa-table"></i> ${arquivo.totalLinhas || 0} linha(s)</span>
                        <span><i class="fas fa-columns"></i> ${arquivo.totalColunas || 0} coluna(s)</span>
                        <span><i class="fas fa-weight-hanging"></i> ${formatarTamanho(arquivo.size)}</span>
                        <span><i class="fas fa-calendar"></i> ${formatarData(arquivo.uploadDate)}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-secondary" 
                            onclick="visualizarAmostra('${arquivo.id}')"
                            title="Ver amostra dos dados">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-danger" 
                            onclick="removerArquivo('${arquivo.id}')"
                            title="Remover arquivo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            ${arquivo.amostraDados && arquivo.amostraDados.length > 0 ? `
                <div class="file-preview" style="display: none;" id="preview-${arquivo.id}">
                    <h5>Amostra dos dados (${arquivo.amostraDados.length} linha(s)):</h5>
                    <div class="preview-table-container">
                        <table class="preview-table">
                            <thead>
                                <tr>
                                    ${arquivo.colunas.map(col => `<th>${col}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${arquivo.amostraDados.slice(0, 3).map(linha => `
                                    <tr>
                                        ${arquivo.colunas.map(col => `<td>${linha[col] || ''}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
            
            <div class="file-status success">
                <i class="fas fa-check-circle"></i>
                <span>Arquivo processado com sucesso</span>
            </div>
        </div>
    `).join('');
    
    // Adicionar animação
    setTimeout(() => {
        document.querySelectorAll('.file-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('slide-up');
            }, index * 100);
        });
    }, 100);
}

/**
 * VISUALIZAR AMOSTRA DE UM ARQUIVO
 */
function visualizarAmostra(arquivoId) {
    const previewElement = document.getElementById(`preview-${arquivoId}`);
    if (!previewElement) {
        mostrarToast('warning', 'Aviso', 'Amostra não disponível para este arquivo');
        return;
    }
    
    const isVisible = previewElement.style.display !== 'none';
    
    // Esconder todas as outras amostras
    document.querySelectorAll('.file-preview').forEach(preview => {
        preview.style.display = 'none';
    });
    
    // Mostrar ou esconder a amostra atual
    previewElement.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        // Scroll para a amostra
        previewElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }
}

/**
 * REMOVER ARQUIVO ESPECÍFICO
 */
async function removerArquivo(arquivoId) {
    const arquivo = AppState.arquivosCarregados.find(f => f.id === arquivoId);
    
    if (!arquivo) {
        mostrarToast('error', 'Erro', 'Arquivo não encontrado');
        return;
    }
    
    if (!confirm(`Deseja remover o arquivo "${arquivo.originalName}"?`)) {
        return;
    }
    
    try {
        // Remover do servidor
        const response = await fetch(`${AppConfig.apiBaseUrl}/upload/files/${arquivo.fileName}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Erro ao remover arquivo');
        }
        
        // Remover do estado local
        AppState.arquivosCarregados = AppState.arquivosCarregados.filter(f => f.id !== arquivoId);
        
        // Remover das análises se existir
        AppState.analises = AppState.analises.filter(a => a.fileName !== arquivo.fileName);
        
        // Remover das colunas escolhidas
        delete AppState.colunasEscolhidas[arquivo.fileName];
        
        // Atualizar interface
        if (AppState.arquivosCarregados.length === 0) {
            ocultarSecao('files-section');
            ocultarSecao('analysis-section');
            ocultarSecao('preview-section');
        } else {
            renderizarArquivosCarregados(AppState.arquivosCarregados);
        }
        
        mostrarToast('success', 'Sucesso', 'Arquivo removido com sucesso');
        
    } catch (error) {
        console.error('Erro ao remover arquivo:', error);
        mostrarToast('error', 'Erro', 'Erro ao remover arquivo: ' + error.message);
    }
}

/**
 * VERIFICAR STATUS DO UPLOAD
 */
function verificarStatusUpload() {
    return {
        processando: AppState.processandoUpload,
        arquivosCarregados: AppState.arquivosCarregados.length,
        temArquivos: AppState.arquivosCarregados.length > 0
    };
}

/**
 * UPLOAD COM RETRY EM CASO DE FALHA
 */
async function uploadComRetry(files, maxTentativas = 3) {
    let tentativa = 0;
    
    while (tentativa < maxTentativas) {
        try {
            await uploadArquivos(files);
            return; // Sucesso, sair do loop
            
        } catch (error) {
            tentativa++;
            
            if (tentativa >= maxTentativas) {
                throw error; // Esgotar tentativas, propagar erro
            }
            
            console.warn(`Tentativa ${tentativa} falhou, tentando novamente...`);
            mostrarToast('warning', 'Tentando novamente', `Tentativa ${tentativa + 1} de ${maxTentativas}`);
            
            // Aguardar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000 * tentativa));
        }
    }
}

// Expor funções globais
window.uploadArquivos = uploadArquivos;
window.visualizarAmostra = visualizarAmostra;
window.removerArquivo = removerArquivo;
window.verificarStatusUpload = verificarStatusUpload;
window.uploadComRetry = uploadComRetry;
