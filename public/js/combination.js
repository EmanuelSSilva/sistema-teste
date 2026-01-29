/**
 * MÓDULO DE COMBINAÇÃO DE PLANILHAS
 * 
 * Gerencia a geração de preview e combinação final
 * das colunas selecionadas das planilhas
 */

/**
 * GERAR PREVIEW DOS DADOS
 */
async function gerarPreview() {
    if (Object.keys(AppState.colunasEscolhidas).length === 0) {
        mostrarToast('warning', 'Aviso', 'Selecione pelo menos uma coluna para gerar o preview');
        return;
    }
    
    try {
        console.log('👁️ Gerando preview dos dados combinados');
        
        mostrarLoading('Gerando preview dos dados...');
        atualizarProgress(30, 'Preparando preview...');
        
        // Preparar dados para preview
        const requestData = {
            planilhas: AppState.arquivosCarregados,
            colunasEscolhidas: AppState.colunasEscolhidas,
            limiteLinha: 10
        };
        
        atualizarProgress(60, 'Processando dados...');
        
        const response = await fetch(`${AppConfig.apiBaseUrl}/planilhas/preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao gerar preview');
        }
        
        atualizarProgress(90, 'Preparando visualização...');
        
        // Armazenar dados do preview
        AppState.previewData = data.preview;
        
        // Mostrar seção de preview
        mostrarSecao('preview-section');
        renderizarPreview(data.preview, data.info);
        
        atualizarProgress(100, 'Preview gerado!');
        
        console.log('✅ Preview gerado com sucesso');
        mostrarToast('success', 'Preview', 'Preview dos dados gerado com sucesso');
        
        // Scroll para a seção de preview
        document.getElementById('preview-section').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
    } catch (error) {
        console.error('❌ Erro ao gerar preview:', error);
        mostrarToast('error', 'Erro no Preview', error.message);
        atualizarProgress(0, '');
    } finally {
        esconderLoading();
    }
}

/**
 * RENDERIZAR PREVIEW DOS DADOS
 */
function renderizarPreview(previewData, info) {
    const previewInfo = document.getElementById('preview-info');
    const previewTable = document.getElementById('preview-table');
    
    if (!previewData || !previewData.dados || previewData.dados.length === 0) {
        previewTable.innerHTML = `
            <tr>
                <td colspan="100%" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Nenhum dado encontrado para as colunas selecionadas
                </td>
            </tr>
        `;
        return;
    }
    
    // Renderizar informações do preview
    if (previewInfo && info) {
        previewInfo.innerHTML = `
            <div class="preview-stat">
                <i class="fas fa-table"></i>
                <span>Linhas exibidas: <strong>${info.linhasExibidas || previewData.dados.length}</strong></span>
            </div>
            <div class="preview-stat">
                <i class="fas fa-database"></i>
                <span>Total estimado: <strong>${info.totalEstimado || 'N/A'}</strong></span>
            </div>
            <div class="preview-stat">
                <i class="fas fa-columns"></i>
                <span>Colunas: <strong>${info.colunas ? info.colunas.length : previewData.colunas.length}</strong></span>
            </div>
            <div class="preview-stat">
                <i class="fas fa-files-o"></i>
                <span>Planilhas: <strong>${previewData.planilhasProcessadas || Object.keys(AppState.colunasEscolhidas).length}</strong></span>
            </div>
        `;
    }
    
    // Renderizar tabela
    const colunas = previewData.colunas || Object.keys(previewData.dados[0]);
    
    previewTable.innerHTML = `
        <thead>
            <tr>
                ${colunas.map(coluna => `<th>${coluna}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${previewData.dados.map(linha => `
                <tr>
                    ${colunas.map(coluna => `
                        <td>${formatarValorCelula(linha[coluna])}</td>
                    `).join('')}
                </tr>
            `).join('')}
        </tbody>
    `;
}

/**
 * FORMATAR VALOR PARA EXIBIÇÃO NA CÉLULA
 */
function formatarValorCelula(valor) {
    if (valor === null || valor === undefined) {
        return '<span class="empty-cell">-</span>';
    }
    
    if (typeof valor === 'string' && valor.length > 50) {
        return `<span title="${valor}">${valor.substring(0, 47)}...</span>`;
    }
    
    if (typeof valor === 'number') {
        return valor.toLocaleString('pt-BR');
    }
    
    return String(valor);
}

/**
 * COMBINAR PLANILHAS
 */
async function combinarPlanilhas() {
    if (Object.keys(AppState.colunasEscolhidas).length === 0) {
        mostrarToast('warning', 'Aviso', 'Selecione pelo menos uma coluna para combinar');
        return;
    }
    
    if (AppState.processandoCombinacao) {
        mostrarToast('warning', 'Aguarde', 'Uma combinação já está em andamento');
        return;
    }
    
    AppState.processandoCombinacao = true;
    
    try {
        console.log('🔗 Iniciando combinação de planilhas');
        
        mostrarLoading('Combinando planilhas...');
        atualizarProgress(20, 'Preparando combinação...');
        
        // Obter configurações do usuário
        const configuracoes = obterConfiguracoesCombinacao();
        
        // Preparar dados para combinação
        const requestData = {
            planilhas: AppState.arquivosCarregados,
            colunasEscolhidas: AppState.colunasEscolhidas,
            nomeArquivoFinal: configuracoes.nomeArquivo,
            configuracoes: configuracoes.opcoes
        };
        
        atualizarProgress(40, 'Enviando para processamento...');
        
        const response = await fetch(`${AppConfig.apiBaseUrl}/planilhas/combinar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        atualizarProgress(70, 'Processando dados...');
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao combinar planilhas');
        }
        
        atualizarProgress(90, 'Finalizando...');
        
        // Processar resultado da combinação
        await processarResultadoCombinacao(data);
        
        atualizarProgress(100, 'Combinação concluída!');
        
        console.log('✅ Planilhas combinadas com sucesso');
        
        // Mostrar modal de sucesso
        mostrarModalSucesso(data);
        
    } catch (error) {
        console.error('❌ Erro na combinação:', error);
        mostrarToast('error', 'Erro na Combinação', error.message);
        atualizarProgress(0, '');
    } finally {
        AppState.processandoCombinacao = false;
        esconderLoading();
    }
}

/**
 * OBTER CONFIGURAÇÕES DA COMBINAÇÃO
 */
function obterConfiguracoesCombinacao() {
    const nomeArquivoInput = document.getElementById('output-filename');
    const incluirOrigemCheckbox = document.getElementById('include-origin');
    
    return {
        nomeArquivo: nomeArquivoInput ? nomeArquivoInput.value.trim() || 'planilha_combinada' : 'planilha_combinada',
        opcoes: {
            incluirOrigem: incluirOrigemCheckbox ? incluirOrigemCheckbox.checked : false,
            removerEspacos: true, // Sempre ativo por padrão
            substituirVazios: '' // Deixar células vazias como estão
        }
    };
}

/**
 * PROCESSAR RESULTADO DA COMBINAÇÃO
 */
async function processarResultadoCombinacao(data) {
    if (!data.arquivo) {
        throw new Error('Arquivo combinado não foi gerado');
    }
    
    // Atualizar lista de exports
    await carregarExportsExistentes();
    
    // Mostrar seção de exports se ainda não estiver visível
    mostrarSecao('exports-section');
    
    // Scroll para a seção de exports
    setTimeout(() => {
        document.getElementById('exports-section').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 500);
}

/**
 * MOSTRAR MODAL DE SUCESSO COM DETALHES
 */
function mostrarModalSucesso(data) {
    const { arquivo, estatisticas } = data;
    
    const mensagem = `
        <div style="margin-bottom: 1rem;">
            <strong>Planilha combinada criada com sucesso!</strong>
        </div>
        
        <div style="margin-bottom: 1rem;">
            <strong>Arquivo:</strong> ${arquivo.fileName}<br>
            <strong>Tamanho:</strong> ${arquivo.sizeFormatted}<br>
            <strong>Formato:</strong> ${arquivo.format.toUpperCase()}
        </div>
        
        ${estatisticas ? `
            <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <strong>Estatísticas:</strong><br>
                • ${estatisticas.totalLinhas} linha(s) de dados<br>
                • ${estatisticas.totalColunas} coluna(s) combinada(s)<br>
                • ${estatisticas.planilhasOriginais} planilha(s) original(is)
            </div>
        ` : ''}
        
        <div style="margin-top: 1rem;">
            <a href="${arquivo.downloadUrl}" 
               class="btn btn-success" 
               download
               style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none;">
                <i class="fas fa-download"></i> Baixar Arquivo
            </a>
        </div>
    `;
    
    mostrarModal('success-modal', 'Combinação Concluída', mensagem);
}

/**
 * EXPORTAR EM MÚLTIPLOS FORMATOS
 */
async function exportarMultiplosFormatos(formatos = ['xlsx', 'csv']) {
    if (Object.keys(AppState.colunasEscolhidas).length === 0) {
        mostrarToast('warning', 'Aviso', 'Selecione colunas para exportar');
        return;
    }
    
    try {
        mostrarLoading('Exportando em múltiplos formatos...');
        
        const configuracoes = obterConfiguracoesCombinacao();
        
        // Fazer uma requisição para cada formato
        const promises = formatos.map(async (formato) => {
            const requestData = {
                planilhas: AppState.arquivosCarregados,
                colunasEscolhidas: AppState.colunasEscolhidas,
                nomeArquivoFinal: `${configuracoes.nomeArquivo}_${formato}`,
                configuracoes: {
                    ...configuracoes.opcoes,
                    formato: formato
                }
            };
            
            const response = await fetch(`${AppConfig.apiBaseUrl}/planilhas/combinar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            return response.json();
        });
        
        const resultados = await Promise.all(promises);
        
        // Verificar se todos foram bem-sucedidos
        const sucessos = resultados.filter(r => r.success);
        const erros = resultados.filter(r => !r.success);
        
        if (sucessos.length > 0) {
            await carregarExportsExistentes();
            mostrarToast('success', 'Exportação', 
                `${sucessos.length} arquivo(s) exportado(s) com sucesso`);
        }
        
        if (erros.length > 0) {
            console.error('Erros na exportação:', erros);
            mostrarToast('warning', 'Aviso', 
                `${erros.length} formato(s) falharam na exportação`);
        }
        
    } catch (error) {
        console.error('Erro na exportação múltipla:', error);
        mostrarToast('error', 'Erro', 'Erro na exportação: ' + error.message);
    } finally {
        esconderLoading();
    }
}

/**
 * VALIDAR SELEÇÃO ANTES DA COMBINAÇÃO
 */
function validarSelecaoParaCombinacao() {
    const totalColunas = Object.values(AppState.colunasEscolhidas)
        .reduce((total, colunas) => total + colunas.length, 0);
    
    if (totalColunas === 0) {
        return {
            valido: false,
            mensagem: 'Selecione pelo menos uma coluna para combinar'
        };
    }
    
    const totalArquivos = Object.keys(AppState.colunasEscolhidas).length;
    
    if (totalArquivos < 1) {
        return {
            valido: false,
            mensagem: 'Selecione colunas de pelo menos um arquivo'
        };
    }
    
    // Verificar se nome do arquivo é válido
    const nomeArquivo = document.getElementById('output-filename')?.value?.trim();
    if (!nomeArquivo) {
        return {
            valido: false,
            mensagem: 'Informe um nome válido para o arquivo final'
        };
    }
    
    return {
        valido: true,
        totalColunas,
        totalArquivos,
        nomeArquivo
    };
}

/**
 * OBTER RESUMO DA COMBINAÇÃO
 */
function obterResumoCombinacao() {
    const validacao = validarSelecaoParaCombinacao();
    
    if (!validacao.valido) {
        return { erro: validacao.mensagem };
    }
    
    const arquivos = Object.entries(AppState.colunasEscolhidas).map(([fileName, colunas]) => {
        const analise = AppState.analises.find(a => a.fileName === fileName);
        return {
            nome: analise ? analise.originalName : fileName,
            colunas: colunas.map(c => c.nome)
        };
    });
    
    return {
        nomeArquivoFinal: validacao.nomeArquivo,
        totalColunas: validacao.totalColunas,
        totalArquivos: validacao.totalArquivos,
        arquivos
    };
}

// Expor funções globais
window.gerarPreview = gerarPreview;
window.combinarPlanilhas = combinarPlanilhas;
window.exportarMultiplosFormatos = exportarMultiplosFormatos;
window.validarSelecaoParaCombinacao = validarSelecaoParaCombinacao;
window.obterResumoCombinacao = obterResumoCombinacao;
