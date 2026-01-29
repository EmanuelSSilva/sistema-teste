/**
 * SERVIÇO DE MANIPULAÇÃO DE PLANILHAS
 * 
 * Este serviço contém toda a lógica de negócio para:
 * - Ler e analisar planilhas (Excel/CSV)
 * - Extrair estrutura de colunas
 * - Combinar dados de múltiplas planilhas
 * - Gerar previews dos dados
 */

const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const config = require('../../config/app.config');

class PlanilhaService {

    /**
     * Analisa uma planilha e extrai informações básicas
     * @param {string} filePath - Caminho do arquivo
     * @param {string} originalName - Nome original do arquivo
     * @returns {Object} Dados da planilha analisada
     */
    async analisarPlanilha(filePath, originalName) {
        console.log(`🔍 Analisando planilha: ${originalName}`);
        
        try {
            const extensao = path.extname(originalName).toLowerCase();
            let dados = [];
            let colunas = [];
            
            if (extensao === '.csv' || extensao === '.txt') {
                // Processar arquivo CSV
                const resultado = await this._processarCSV(filePath);
                dados = resultado.dados;
                colunas = resultado.colunas;
                
            } else if (extensao === '.xlsx' || extensao === '.xls') {
                // Processar arquivo Excel
                const resultado = await this._processarExcel(filePath);
                dados = resultado.dados;
                colunas = resultado.colunas;
                
            } else {
                throw new Error(`Formato de arquivo não suportado: ${extensao}`);
            }

            // Validar limites
            if (dados.length > config.PROCESSING_CONFIG.MAX_ROWS) {
                console.warn(`⚠️ Planilha tem ${dados.length} linhas (limite: ${config.PROCESSING_CONFIG.MAX_ROWS})`);
            }

            if (colunas.length > config.PROCESSING_CONFIG.MAX_COLUMNS) {
                console.warn(`⚠️ Planilha tem ${colunas.length} colunas (limite: ${config.PROCESSING_CONFIG.MAX_COLUMNS})`);
            }

            return {
                totalLinhas: dados.length,
                totalColunas: colunas.length,
                colunas: colunas,
                amostraDados: dados.slice(0, 5), // Primeiras 5 linhas como amostra
                tipos: this._detectarTiposColunas(dados, colunas),
                estatisticas: this._calcularEstatisticas(dados, colunas)
            };

        } catch (error) {
            console.error(`❌ Erro ao analisar ${originalName}:`, error);
            throw new Error(`Erro ao processar planilha: ${error.message}`);
        }
    }

    /**
     * Analisa apenas a estrutura de uma planilha (sem carregar todos os dados)
     * @param {string} filePath - Caminho do arquivo
     * @param {string} originalName - Nome original do arquivo
     * @returns {Object} Estrutura da planilha
     */    async analisarEstrutura(filePath, originalName) {
        console.log(`🏗️ Analisando estrutura: ${originalName}`);
        
        try {
            const extensao = path.extname(originalName).toLowerCase();
            let colunas = [];
            let amostra = [];
            
            if (extensao === '.csv' || extensao === '.txt') {
                const resultado = await this._analisarEstruturaCSV(filePath);
                colunas = resultado.colunas;
                amostra = resultado.amostra;
                
            } else if (extensao === '.xlsx' || extensao === '.xls') {
                const resultado = await this._analisarEstruturaExcel(filePath);
                colunas = resultado.colunas;
                amostra = resultado.amostra;
                
            } else {
                throw new Error(`Formato não suportado: ${extensao}`);
            }

            console.log(`📊 Estrutura analisada para ${originalName}: ${colunas.length} colunas, ${amostra.length} linhas de amostra`);
            console.log(`📝 Colunas encontradas: ${colunas.join(', ')}`);

            const estrutura = {
                colunas: colunas.map((col, index) => ({
                    indice: index,
                    nome: col,
                    nomeOriginal: col,
                    tipo: this._detectarTipoColuna(amostra, col),
                    exemplos: this._extrairExemplos(amostra, col, 3)
                })),
                amostraDados: amostra,
                arquivo: {
                    nome: originalName,
                    extensao: extensao
                }
            };

            console.log(`✨ Estrutura processada: ${estrutura.colunas.length} colunas mapeadas`);
            return estrutura;

        } catch (error) {
            console.error(`❌ Erro ao analisar estrutura de ${originalName}:`, error);
            throw new Error(`Erro na análise da estrutura: ${error.message}`);
        }
    }

    /**
     * Combina dados de múltiplas planilhas baseado nas colunas selecionadas
     * @param {Array} planilhas - Array com informações das planilhas
     * @param {Object} colunasEscolhidas - Mapeamento de colunas selecionadas
     * @param {Object} configuracoes - Configurações adicionais
     * @returns {Array} Dados combinados
     */
    async combinarPlanilhas(planilhas, colunasEscolhidas, configuracoes = {}) {
        console.log(`🔗 Combinando ${planilhas.length} planilha(s)`);
        
        try {
            const dadosCombinados = [];
            const cabecalhoFinal = [];
            
            // Preparar cabeçalho final baseado nas colunas escolhidas
            for (const [planilhaId, colunas] of Object.entries(colunasEscolhidas)) {
                for (const coluna of colunas) {
                    const nomeColuna = configuracoes.renomearColunas && configuracoes.renomearColunas[`${planilhaId}_${coluna.nome}`] 
                        ? configuracoes.renomearColunas[`${planilhaId}_${coluna.nome}`] 
                        : `${coluna.nome}`;
                    
                    cabecalhoFinal.push({
                        nomeOriginal: coluna.nome,
                        nomeFinal: nomeColuna,
                        planilhaOrigem: planilhaId,
                        indiceOriginal: coluna.indice
                    });
                }
            }

            // Processar cada planilha
            for (const planilha of planilhas) {
                // Verificar se esta planilha tem colunas selecionadas
                const colunasDestaPlanilha = colunasEscolhidas[planilha.fileName];
                if (!colunasDestaPlanilha || colunasDestaPlanilha.length === 0) {
                    console.log(`⏭️ Pulando planilha sem colunas selecionadas: ${planilha.originalName}`);
                    continue;
                }

                console.log(`📊 Processando: ${planilha.originalName}`);

                // Carregar dados da planilha
                const filePath = path.join(__dirname, '../../uploads', planilha.fileName);
                const dadosPlanilha = await this._carregarDadosCompletos(filePath, planilha.originalName);

                // Extrair apenas as colunas selecionadas
                for (const linha of dadosPlanilha) {
                    const novaLinha = {};
                    
                    // Adicionar informação da origem se configurado
                    if (configuracoes.incluirOrigem) {
                        novaLinha['__origem__'] = planilha.originalName;
                    }
                    
                    // Adicionar colunas selecionadas
                    for (const coluna of colunasDestaPlanilha) {
                        const cabecalhoInfo = cabecalhoFinal.find(h => 
                            h.planilhaOrigem === planilha.fileName && h.nomeOriginal === coluna.nome
                        );
                        
                        if (cabecalhoInfo) {
                            const valor = linha[coluna.nome];
                            novaLinha[cabecalhoInfo.nomeFinal] = this._processarValor(valor, configuracoes);
                        }
                    }
                    
                    dadosCombinados.push(novaLinha);
                }
            }

            console.log(`✅ Combinação concluída: ${dadosCombinados.length} linhas geradas`);

            return dadosCombinados;

        } catch (error) {
            console.error('❌ Erro na combinação:', error);
            throw new Error(`Erro ao combinar planilhas: ${error.message}`);
        }
    }

    /**
     * Gera preview dos dados que serão combinados
     * @param {Array} planilhas - Array das planilhas
     * @param {Object} colunasEscolhidas - Colunas selecionadas
     * @param {number} limite - Número máximo de linhas no preview
     * @returns {Object} Preview dos dados
     */
    async gerarPreview(planilhas, colunasEscolhidas, limite = 10) {
        console.log(`👁️ Gerando preview (limite: ${limite} linhas)`);
        
        try {
            // Usar a mesma lógica de combinação, mas limitada
            const configuracoes = { 
                incluirOrigem: true,
                preview: true 
            };
            
            const dadosCompletos = await this.combinarPlanilhas(planilhas, colunasEscolhidas, configuracoes);
            
            return {
                dados: dadosCompletos.slice(0, limite),
                totalEstimado: dadosCompletos.length,
                colunas: dadosCompletos.length > 0 ? Object.keys(dadosCompletos[0]) : [],
                planilhasProcessadas: planilhas.length
            };

        } catch (error) {
            console.error('❌ Erro no preview:', error);
            throw new Error(`Erro ao gerar preview: ${error.message}`);
        }
    }

    // MÉTODOS PRIVADOS

    /**
     * Processa arquivo CSV
     */
    async _processarCSV(filePath) {
        return new Promise((resolve, reject) => {
            const dados = [];
            let colunas = [];
            
            fs.createReadStream(filePath)
                .pipe(csv({ 
                    separator: this._detectarSeparadorCSV(filePath),
                    skipEmptyLines: true 
                }))
                .on('headers', (headers) => {
                    colunas = headers;
                })
                .on('data', (linha) => {
                    dados.push(linha);
                })
                .on('end', () => {
                    resolve({ dados, colunas });
                })
                .on('error', reject);
        });
    }

    /**
     * Processa arquivo Excel
     */
    async _processarExcel(filePath) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Primeira aba
        const worksheet = workbook.Sheets[sheetName];
        
        const dados = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,  // Usar primeira linha como header
            defval: ''  // Valor padrão para células vazias
        });
        
        if (dados.length === 0) {
            throw new Error('Planilha vazia');
        }
        
        const colunas = dados[0]; // Primeira linha são os cabeçalhos
        const linhasDados = dados.slice(1); // Resto são os dados
        
        // Converter array de arrays para array de objetos
        const dadosObjeto = linhasDados.map(linha => {
            const objeto = {};
            colunas.forEach((coluna, index) => {
                objeto[coluna] = linha[index] || '';
            });
            return objeto;
        });
        
        return { dados: dadosObjeto, colunas };
    }

    /**
     * Analisa estrutura de CSV sem carregar todos os dados
     */
    async _analisarEstruturaCSV(filePath) {
        return new Promise((resolve, reject) => {
            const amostra = [];
            let colunas = [];
            let contadorLinhas = 0;
            const LIMITE_AMOSTRA = 20;
            
            fs.createReadStream(filePath)
                .pipe(csv({ 
                    separator: this._detectarSeparadorCSV(filePath),
                    skipEmptyLines: true 
                }))
                .on('headers', (headers) => {
                    colunas = headers;
                })
                .on('data', (linha) => {
                    if (contadorLinhas < LIMITE_AMOSTRA) {
                        amostra.push(linha);
                        contadorLinhas++;
                    } else {
                        // Parar de ler após a amostra
                        return;
                    }
                })
                .on('end', () => {
                    resolve({ colunas, amostra });
                })
                .on('error', reject);
        });
    }

    /**
     * Analisa estrutura de Excel sem carregar todos os dados
     */
    async _analisarEstruturaExcel(filePath) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Ler apenas as primeiras 21 linhas (1 header + 20 dados)
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const limitedRange = {
            s: range.s,
            e: { r: Math.min(range.e.r, 20), c: range.e.c }
        };
        
        worksheet['!ref'] = XLSX.utils.encode_range(limitedRange);
        
        const dados = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '' 
        });
        
        if (dados.length === 0) {
            throw new Error('Planilha vazia');
        }
        
        const colunas = dados[0];
        const linhasDados = dados.slice(1);
        
        const amostra = linhasDados.map(linha => {
            const objeto = {};
            colunas.forEach((coluna, index) => {
                objeto[coluna] = linha[index] || '';
            });
            return objeto;
        });
        
        return { colunas, amostra };
    }

    /**
     * Carrega todos os dados de uma planilha
     */
    async _carregarDadosCompletos(filePath, originalName) {
        const extensao = path.extname(originalName).toLowerCase();
        
        if (extensao === '.csv' || extensao === '.txt') {
            const resultado = await this._processarCSV(filePath);
            return resultado.dados;
        } else {
            const resultado = await this._processarExcel(filePath);
            return resultado.dados;
        }
    }

    /**
     * Detecta o separador mais provável de um CSV
     */
    _detectarSeparadorCSV(filePath) {
        try {
            const primeirasLinhas = fs.readFileSync(filePath, 'utf8').split('\n').slice(0, 3).join('\n');
            
            const separadores = [',', ';', '\t', '|'];
            let melhorSeparador = ',';
            let maiorContagem = 0;
            
            for (const sep of separadores) {
                const contagem = (primeirasLinhas.match(new RegExp('\\' + sep, 'g')) || []).length;
                if (contagem > maiorContagem) {
                    maiorContagem = contagem;
                    melhorSeparador = sep;
                }
            }
            
            return melhorSeparador;
        } catch (error) {
            return ','; // Fallback
        }
    }

    /**
     * Detecta o tipo de dados de uma coluna
     */
    _detectarTipoColuna(amostra, nomeColuna) {
        if (!amostra || amostra.length === 0) return 'text';
        
        const valores = amostra
            .map(linha => linha[nomeColuna])
            .filter(val => val !== null && val !== undefined && val !== '');
        
        if (valores.length === 0) return 'text';
        
        // Verificar se todos são números
        const numericos = valores.filter(val => !isNaN(val) && !isNaN(parseFloat(val)));
        if (numericos.length / valores.length > 0.8) {
            return 'number';
        }
        
        // Verificar se são datas
        const datas = valores.filter(val => !isNaN(Date.parse(val)));
        if (datas.length / valores.length > 0.8) {
            return 'date';
        }
        
        return 'text';
    }

    /**
     * Extrai exemplos de valores de uma coluna
     */
    _extrairExemplos(amostra, nomeColuna, quantidade = 3) {
        if (!amostra || amostra.length === 0) return [];
        
        return amostra
            .map(linha => linha[nomeColuna])
            .filter(val => val !== null && val !== undefined && val !== '')
            .slice(0, quantidade);
    }

    /**
     * Detecta tipos de todas as colunas
     */
    _detectarTiposColunas(dados, colunas) {
        const tipos = {};
        for (const coluna of colunas) {
            tipos[coluna] = this._detectarTipoColuna(dados, coluna);
        }
        return tipos;
    }

    /**
     * Calcula estatísticas básicas dos dados
     */
    _calcularEstatisticas(dados, colunas) {
        const estatisticas = {};
        
        for (const coluna of colunas) {
            const valores = dados
                .map(linha => linha[coluna])
                .filter(val => val !== null && val !== undefined && val !== '');
            
            estatisticas[coluna] = {
                total: dados.length,
                preenchidos: valores.length,
                vazios: dados.length - valores.length,
                percentualPreenchimento: dados.length > 0 ? (valores.length / dados.length * 100).toFixed(1) : 0
            };
        }
        
        return estatisticas;
    }

    /**
     * Processa um valor individual aplicando configurações
     */
    _processarValor(valor, configuracoes) {
        if (valor === null || valor === undefined) {
            return configuracoes.substituirVazios || '';
        }
        
        // Aplicar trim se configurado
        if (configuracoes.removerEspacos && typeof valor === 'string') {
            valor = valor.trim();
        }
        
        return valor;
    }
}

module.exports = new PlanilhaService();
