/**
 * MÓDULO DE ANÁLISE DE PLANILHAS
 * 
 * Gerencia a análise da estrutura das planilhas
 * e permite selecionar colunas para combinação
 */

/**
 * ANALISAR ARQUIVOS CARREGADOS
 */
async function analisarArquivos() {
    if (AppState.processandoAnalise) {
        mostrarToast('warning', 'Aguarde', 'Análise já está em andamento');
        return;
    }
    
    if (AppState.arquivosCarregados.length === 0) {
        mostrarToast('warning', 'Aviso', 'Nenhum arquivo carregado para análise');
        return;
    }
    
    AppState.processandoAnalise = true;
    
    try {
        console.log(`🔍 Analisando ${AppState.arquivosCarregados.length} arquivo(s)`);
        
        mostrarLoading('Analisando estrutura das planilhas...');
        atualizarProgress(20, 'Iniciando análise...');
        
        // Preparar dados para análise
        const arquivosParaAnalise = AppState.arquivosCarregados.map(arquivo => ({
            fileName: arquivo.fileName,
            originalName: arquivo.originalName
        }));
        
        atualizarProgress(40, 'Enviando para análise...');
        
        // Fazer requisição de análise
        const response = await fetch(`${AppConfig.apiBaseUrl}/planilhas/analisar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: arquivosParaAnalise
            })
        });
        
        atualizarProgress(70, 'Processando resultados...');
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro na análise');
        }
        
        if (!data.analises || data.analises.length === 0) {
            throw new Error('Nenhuma análise foi retornada');
        }
        
        atualizarProgress(90, 'Preparando interface...');
        
        // Processar resultados da análise
        await processarResultadosAnalise(data.analises);
        
        atualizarProgress(100, 'Análise concluída!');
        
        console.log('✅ Análise concluída com sucesso');
        mostrarToast('success', 'Análise Concluída', 'Estrutura das planilhas analisada com sucesso');
        
    } catch (error) {
        console.error('❌ Erro na análise:', error);
        mostrarToast('error', 'Erro na Análise', error.message);
        atualizarProgress(0, '');
    } finally {
        AppState.processandoAnalise = false;
        esconderLoading();
    }
}

/**
 * PROCESSAR RESULTADOS DA ANÁLISE
 */
async function processarResultadosAnalise(analises) {
    console.log('🔍 Processando resultados da análise:', analises);
    
    // Separar análises válidas e com erro
    const analisesValidas = analises.filter(analise => !analise.error);
    const analisesComErro = analises.filter(analise => analise.error);
    
    console.log(`✅ Análises válidas: ${analisesValidas.length}`);
    console.log(`❌ Análises com erro: ${analisesComErro.length}`);
    
    // Log detalhado das análises válidas
    analisesValidas.forEach(analise => {
        console.log(`📊 Análise de ${analise.originalName}:`, {
            colunas: analise.colunas ? analise.colunas.length : 0,
            temColunas: !!(analise.colunas && analise.colunas.length > 0),
            amostra: analise.amostraDados ? analise.amostraDados.length : 0
        });
        
        if (analise.colunas) {
            console.log(`📝 Colunas de ${analise.originalName}:`, analise.colunas.map(c => c.nome));
        }
    });
    
    if (analisesValidas.length === 0) {
        throw new Error('Nenhuma planilha pôde ser analisada com sucesso');
    }
    
    // Atualizar estado
    AppState.analises = analisesValidas;
    
    // Mostrar seção de análise
    mostrarSecao('analysis-section');
    renderizarAnalises(analisesValidas);
    
    // Mostrar erros se houver
    if (analisesComErro.length > 0) {
        analisesComErro.forEach(analise => {
            console.warn(`Erro na análise de ${analise.originalName}:`, analise.error);
            mostrarToast('warning', `Erro em ${analise.originalName}`, analise.error);
        });
    }
}

/**
 * RENDERIZAR ANÁLISES DAS PLANILHAS
 */
function renderizarAnalises(analises) {
    console.log('🎨 Renderizando análises:', analises);
    
    const analysisGrid = document.getElementById('analysis-grid');
    
    if (!analises || analises.length === 0) {
        analysisGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Nenhuma análise disponível</h3>
                <p>Faça upload e analise seus arquivos primeiro</p>
            </div>
        `;
        return;
    }
    
    analysisGrid.innerHTML = analises.map(analise => {
        console.log(`🔧 Renderizando análise para ${analise.originalName}:`, {
            fileName: analise.fileName,
            colunas: analise.colunas ? analise.colunas.length : 0,
            temColunas: !!(analise.colunas && analise.colunas.length > 0)
        });
        
        const colunasHtml = renderizarColunas(analise.colunas || [], analise.fileName);
        console.log(`📝 HTML gerado para colunas de ${analise.originalName}:`, colunasHtml.length, 'caracteres');
        
        return `
        <div class="analysis-card" data-file-name="${analise.fileName}">
            <div class="analysis-header">
                <h4>${analise.originalName}</h4>
                <div class="analysis-meta">
                    ${analise.colunas ? analise.colunas.length : 0} coluna(s) disponível(is)
                </div>
            </div>
            
            <div class="columns-list" id="columns-${analise.fileName}">
                ${colunasHtml}
            </div>
            
            <div class="analysis-actions">
                <button class="btn btn-secondary btn-sm" 
                        onclick="selecionarTodasColunas('${analise.fileName}')">
                    <i class="fas fa-check-double"></i> Selecionar Todas
                </button>
                <button class="btn btn-secondary btn-sm" 
                        onclick="desselecionarTodasColunas('${analise.fileName}')">
                    <i class="fas fa-times"></i> Desmarcar Todas
                </button>
            </div>
        </div>
    `}).join('');
    
    // Inicializar listeners para checkboxes
    inicializarListenersAnalise();
}

/**
 * RENDERIZAR COLUNAS DE UMA PLANILHA
 */
function renderizarColunas(colunas, fileName) {
    console.log(`📋 Renderizando colunas para ${fileName}:`, {
        totalColunas: colunas ? colunas.length : 0,
        colunas: colunas ? colunas.map(c => c.nome) : [],
        temColunas: !!(colunas && colunas.length > 0)
    });
    
    if (!colunas || colunas.length === 0) {
        console.warn(`⚠️ Nenhuma coluna encontrada para ${fileName}`);
        return `
            <div class="empty-columns">
                <i class="fas fa-exclamation-circle"></i>
                <span>Nenhuma coluna encontrada</span>
            </div>
        `;
    }
    
    const html = colunas.map(coluna => {
        console.log(`🔧 Criando HTML para coluna: ${coluna.nome} (índice: ${coluna.indice}, tipo: ${coluna.tipo})`);
        
        return `
        <div class="column-item">
            <input type="checkbox" 
                   class="column-checkbox" 
                   id="col-${fileName}-${coluna.indice}"
                   data-file="${fileName}"
                   data-column-index="${coluna.indice}"
                   data-column-name="${coluna.nome}"
                   onchange="atualizarSelecaoColunas()">
            
            <label for="col-${fileName}-${coluna.indice}" class="column-info">
                <div class="column-name">${coluna.nome}</div>
                <div class="column-type">${obterLabelTipo(coluna.tipo)}</div>
                ${coluna.exemplos && coluna.exemplos.length > 0 ? `
                    <div class="column-examples">
                        Ex: ${coluna.exemplos.slice(0, 2).join(', ')}
                        ${coluna.exemplos.length > 2 ? '...' : ''}
                    </div>
                ` : ''}
            </label>
        </div>
    `}).join('');
    
    console.log(`✅ HTML das colunas gerado para ${fileName}: ${html.length} caracteres`);
    return html;
}

/**
 * OBTER LABEL PARA TIPO DE COLUNA
 */
function obterLabelTipo(tipo) {
    const tipos = {
        'text': 'Texto',
        'number': 'Número', 
        'date': 'Data',
        'boolean': 'Verdadeiro/Falso',
        'mixed': 'Misto'
    };
    
    return tipos[tipo] || 'Desconhecido';
}

/**
 * INICIALIZAR LISTENERS DA ANÁLISE
 */
function inicializarListenersAnalise() {
    // Listener para mudanças nos checkboxes já está inline (onchange)
    
    // Listener para scroll automático ao selecionar muitas colunas
    document.querySelectorAll('.columns-list').forEach(list => {
        list.addEventListener('scroll', () => {
            // Salvar posição do scroll para UX
        });
    });
}

/**
 * ATUALIZAR SELEÇÃO DE COLUNAS
 */
function atualizarSelecaoColunas() {
    const checkboxes = document.querySelectorAll('.column-checkbox:checked');
    
    // Limpar seleções anteriores
    AppState.colunasEscolhidas = {};
    
    // Agrupar por arquivo
    checkboxes.forEach(checkbox => {
        const fileName = checkbox.dataset.file;
        const columnIndex = parseInt(checkbox.dataset.columnIndex);
        const columnName = checkbox.dataset.columnName;
        
        if (!AppState.colunasEscolhidas[fileName]) {
            AppState.colunasEscolhidas[fileName] = [];
        }
        
        AppState.colunasEscolhidas[fileName].push({
            indice: columnIndex,
            nome: columnName
        });
    });
    
    // Atualizar contador visual
    atualizarContadorColunas();
    
    // Habilitar/desabilitar botões de ação
    atualizarBotoesAcao();
    
    console.log('Colunas selecionadas:', AppState.colunasEscolhidas);
}

/**
 * ATUALIZAR CONTADOR DE COLUNAS SELECIONADAS
 */
function atualizarContadorColunas() {
    const totalColunas = Object.values(AppState.colunasEscolhidas)
        .reduce((total, colunas) => total + colunas.length, 0);
    
    const totalArquivos = Object.keys(AppState.colunasEscolhidas).length;
    
    // Atualizar header da seção
    const sectionHeader = document.querySelector('#analysis-section .section-header p');
    if (sectionHeader) {
        if (totalColunas > 0) {
            sectionHeader.textContent = `${totalColunas} coluna(s) selecionada(s) de ${totalArquivos} arquivo(s)`;
        } else {
            sectionHeader.textContent = 'Selecione as colunas que deseja combinar';
        }
    }
}

/**
 * ATUALIZAR ESTADO DOS BOTÕES DE AÇÃO
 */
function atualizarBotoesAcao() {
    const totalColunas = Object.values(AppState.colunasEscolhidas)
        .reduce((total, colunas) => total + colunas.length, 0);
    
    // Botões de preview e combinação
    const previewBtn = document.querySelector('button[onclick="gerarPreview()"]');
    const combineBtn = document.querySelector('button[onclick="combinarPlanilhas()"]');
    
    if (previewBtn) {
        previewBtn.disabled = totalColunas === 0;
    }
    
    if (combineBtn) {
        combineBtn.disabled = totalColunas === 0;
    }
}

/**
 * SELECIONAR TODAS AS COLUNAS DE UM ARQUIVO
 */
function selecionarTodasColunas(fileName) {
    const checkboxes = document.querySelectorAll(`input[data-file="${fileName}"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    
    atualizarSelecaoColunas();
    mostrarToast('info', 'Seleção', `Todas as colunas de ${fileName} foram selecionadas`);
}

/**
 * DESSELECIONAR TODAS AS COLUNAS DE UM ARQUIVO
 */
function desselecionarTodasColunas(fileName) {
    const checkboxes = document.querySelectorAll(`input[data-file="${fileName}"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    atualizarSelecaoColunas();
    mostrarToast('info', 'Seleção', `Todas as colunas de ${fileName} foram desmarcadas`);
}

/**
 * SELECIONAR COLUNAS POR TIPO
 */
function selecionarColunasPorTipo(tipo) {
    document.querySelectorAll('.column-checkbox').forEach(checkbox => {
        const columnItem = checkbox.closest('.column-item');
        const typeElement = columnItem.querySelector('.column-type');
        
        if (typeElement && typeElement.textContent.toLowerCase().includes(tipo.toLowerCase())) {
            checkbox.checked = true;
        }
    });
    
    atualizarSelecaoColunas();
    mostrarToast('info', 'Seleção', `Colunas do tipo "${tipo}" foram selecionadas`);
}

/**
 * BUSCAR COLUNAS POR NOME
 */
function buscarColunas(termo) {
    if (!termo || termo.length < 2) {
        // Mostrar todas as colunas
        document.querySelectorAll('.column-item').forEach(item => {
            item.style.display = 'flex';
        });
        return;
    }
    
    const termoLower = termo.toLowerCase();
    
    document.querySelectorAll('.column-item').forEach(item => {
        const columnName = item.querySelector('.column-name');
        if (columnName) {
            const nomeColuna = columnName.textContent.toLowerCase();
            item.style.display = nomeColuna.includes(termoLower) ? 'flex' : 'none';
        }
    });
}

/**
 * OBTER ESTATÍSTICAS DA SELEÇÃO
 */
function obterEstatisticasSelecao() {
    const totalColunas = Object.values(AppState.colunasEscolhidas)
        .reduce((total, colunas) => total + colunas.length, 0);
    
    const totalArquivos = Object.keys(AppState.colunasEscolhidas).length;
    
    const arquivos = Object.entries(AppState.colunasEscolhidas).map(([fileName, colunas]) => {
        const analise = AppState.analises.find(a => a.fileName === fileName);
        return {
            fileName,
            originalName: analise ? analise.originalName : fileName,
            colunasSelecionadas: colunas.length,
            totalColunas: analise ? analise.colunas.length : 0
        };
    });
    
    return {
        totalColunas,
        totalArquivos,
        arquivos
    };
}

// Expor funções globais
window.analisarArquivos = analisarArquivos;
window.atualizarSelecaoColunas = atualizarSelecaoColunas;
window.selecionarTodasColunas = selecionarTodasColunas;
window.desselecionarTodasColunas = desselecionarTodasColunas;
window.selecionarColunasPorTipo = selecionarColunasPorTipo;
window.buscarColunas = buscarColunas;
window.obterEstatisticasSelecao = obterEstatisticasSelecao;
