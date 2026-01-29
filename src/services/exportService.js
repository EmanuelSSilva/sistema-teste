/**
 * SERVIÇO DE EXPORTAÇÃO DE PLANILHAS
 * 
 * Este serviço gerencia a exportação dos dados combinados
 * para diferentes formatos (Excel, CSV)
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const config = require('../../config/app.config');

class ExportService {

    /**
     * Exporta dados para formato Excel (.xlsx)
     * @param {Array} dados - Array de objetos com os dados
     * @param {string} nomeArquivo - Nome do arquivo (sem extensão)
     * @param {Object} opcoes - Opções de formatação
     * @returns {Object} Informações do arquivo exportado
     */
    async exportarParaExcel(dados, nomeArquivo, opcoes = {}) {
        console.log(`📊 Exportando para Excel: ${nomeArquivo}`);
        
        try {
            // Validar dados de entrada
            if (!dados || !Array.isArray(dados) || dados.length === 0) {
                throw new Error('Nenhum dado fornecido para exportação');
            }

            // Criar pasta de exports se não existir
            const exportDir = path.join(__dirname, '../../', config.UPLOAD_CONFIG.EXPORT_DIR);
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
            }

            // Gerar nome único para o arquivo
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const nomeArquivoFinal = `${nomeArquivo}_${timestamp}.xlsx`;
            const caminhoCompleto = path.join(exportDir, nomeArquivoFinal);

            // Criar workbook
            const workbook = XLSX.utils.book_new();
            
            // Preparar dados para o Excel
            const dadosParaExcel = this._prepararDadosParaExcel(dados, opcoes);
            
            // Criar worksheet
            const worksheet = XLSX.utils.json_to_sheet(dadosParaExcel, {
                header: Object.keys(dados[0]),
                skipHeader: false
            });

            // Aplicar formatação se especificada
            if (opcoes.formatacao) {
                this._aplicarFormatacaoExcel(worksheet, dados, opcoes.formatacao);
            }

            // Adicionar worksheet ao workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, opcoes.nomeAba || 'Dados Combinados');

            // Salvar arquivo
            XLSX.writeFile(workbook, caminhoCompleto);

            const stats = fs.statSync(caminhoCompleto);

            console.log(`✅ Arquivo Excel criado: ${nomeArquivoFinal} (${this._formatarTamanho(stats.size)})`);

            return {
                fileName: nomeArquivoFinal,
                filePath: caminhoCompleto,
                downloadUrl: `/exports/${nomeArquivoFinal}`,
                size: stats.size,
                sizeFormatted: this._formatarTamanho(stats.size),
                createDate: new Date().toISOString(),
                format: 'xlsx',
                totalRows: dados.length,
                totalColumns: Object.keys(dados[0]).length
            };

        } catch (error) {
            console.error('❌ Erro na exportação Excel:', error);
            throw new Error(`Erro ao exportar para Excel: ${error.message}`);
        }
    }

    /**
     * Exporta dados para formato CSV
     * @param {Array} dados - Array de objetos com os dados
     * @param {string} nomeArquivo - Nome do arquivo (sem extensão)
     * @param {Object} opcoes - Opções de exportação CSV
     * @returns {Object} Informações do arquivo exportado
     */
    async exportarParaCSV(dados, nomeArquivo, opcoes = {}) {
        console.log(`📄 Exportando para CSV: ${nomeArquivo}`);
        
        try {
            if (!dados || !Array.isArray(dados) || dados.length === 0) {
                throw new Error('Nenhum dado fornecido para exportação');
            }

            // Criar pasta de exports se não existir
            const exportDir = path.join(__dirname, '../../', config.UPLOAD_CONFIG.EXPORT_DIR);
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
            }

            // Gerar nome único para o arquivo
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const nomeArquivoFinal = `${nomeArquivo}_${timestamp}.csv`;
            const caminhoCompleto = path.join(exportDir, nomeArquivoFinal);

            // Configurações CSV
            const separador = opcoes.separador || ',';
            const quebrarLinha = opcoes.quebrarLinha || '\n';
            const incluirCabecalho = opcoes.incluirCabecalho !== false;

            // Gerar conteúdo CSV
            let conteudoCSV = '';
            
            // Adicionar cabeçalho se solicitado
            if (incluirCabecalho && dados.length > 0) {
                const cabecalhos = Object.keys(dados[0]);
                conteudoCSV += cabecalhos
                    .map(col => this._escaparValorCSV(col, separador))
                    .join(separador) + quebrarLinha;
            }

            // Adicionar dados
            for (const linha of dados) {
                const valores = Object.values(linha)
                    .map(valor => this._escaparValorCSV(valor, separador));
                conteudoCSV += valores.join(separador) + quebrarLinha;
            }

            // Salvar arquivo
            fs.writeFileSync(caminhoCompleto, conteudoCSV, 'utf8');

            const stats = fs.statSync(caminhoCompleto);

            console.log(`✅ Arquivo CSV criado: ${nomeArquivoFinal} (${this._formatarTamanho(stats.size)})`);

            return {
                fileName: nomeArquivoFinal,
                filePath: caminhoCompleto,
                downloadUrl: `/exports/${nomeArquivoFinal}`,
                size: stats.size,
                sizeFormatted: this._formatarTamanho(stats.size),
                createDate: new Date().toISOString(),
                format: 'csv',
                totalRows: dados.length,
                totalColumns: dados.length > 0 ? Object.keys(dados[0]).length : 0
            };

        } catch (error) {
            console.error('❌ Erro na exportação CSV:', error);
            throw new Error(`Erro ao exportar para CSV: ${error.message}`);
        }
    }

    /**
     * Exporta em múltiplos formatos
     * @param {Array} dados - Dados para exportar
     * @param {string} nomeArquivo - Nome base do arquivo
     * @param {Array} formatos - Array de formatos ['xlsx', 'csv']
     * @param {Object} opcoes - Opções por formato
     * @returns {Array} Array com informações dos arquivos criados
     */
    async exportarMultiplosFormatos(dados, nomeArquivo, formatos = ['xlsx'], opcoes = {}) {
        console.log(`📚 Exportando em ${formatos.length} formato(s): ${formatos.join(', ')}`);
        
        const resultados = [];
        
        for (const formato of formatos) {
            try {
                let resultado;
                
                switch (formato.toLowerCase()) {
                    case 'xlsx':
                    case 'excel':
                        resultado = await this.exportarParaExcel(dados, nomeArquivo, opcoes.xlsx || {});
                        break;
                        
                    case 'csv':
                        resultado = await this.exportarParaCSV(dados, nomeArquivo, opcoes.csv || {});
                        break;
                        
                    default:
                        console.warn(`⚠️ Formato não suportado: ${formato}`);
                        continue;
                }
                
                resultados.push(resultado);
                
            } catch (error) {
                console.error(`❌ Erro ao exportar em ${formato}:`, error);
                resultados.push({
                    format: formato,
                    error: error.message
                });
            }
        }
        
        return resultados;
    }

    // MÉTODOS PRIVADOS

    /**
     * Prepara dados para exportação Excel
     */
    _prepararDadosParaExcel(dados, opcoes) {
        if (!opcoes.transformacoes) {
            return dados;
        }

        return dados.map(linha => {
            const linhaProcessada = { ...linha };
            
            // Aplicar transformações específicas
            for (const [coluna, transformacao] of Object.entries(opcoes.transformacoes)) {
                if (linhaProcessada.hasOwnProperty(coluna)) {
                    linhaProcessada[coluna] = this._aplicarTransformacao(
                        linhaProcessada[coluna], 
                        transformacao
                    );
                }
            }
            
            return linhaProcessada;
        });
    }

    /**
     * Aplica formatação específica ao worksheet Excel
     */
    _aplicarFormatacaoExcel(worksheet, dados, formatacao) {
        // Implementar formatações específicas do Excel como:
        // - Largura de colunas
        // - Cores de células
        // - Formatos de número/data
        
        if (formatacao.larguraColunas) {
            const colunas = Object.keys(dados[0]);
            worksheet['!cols'] = colunas.map(col => ({
                wch: formatacao.larguraColunas[col] || 15
            }));
        }

        if (formatacao.cabecalhoNegrito) {
            // Aplicar negrito no cabeçalho
            const colunas = Object.keys(dados[0]);
            colunas.forEach((col, index) => {
                const cellRef = XLSX.utils.encode_cell({ r: 0, c: index });
                if (worksheet[cellRef]) {
                    worksheet[cellRef].s = {
                        font: { bold: true }
                    };
                }
            });
        }
    }

    /**
     * Aplica transformação a um valor
     */
    _aplicarTransformacao(valor, transformacao) {
        switch (transformacao.tipo) {
            case 'data':
                return this._formatarData(valor, transformacao.formato);
                
            case 'numero':
                return this._formatarNumero(valor, transformacao.decimais);
                
            case 'texto':
                return this._formatarTexto(valor, transformacao.opcoes);
                
            default:
                return valor;
        }
    }

    /**
     * Formata data
     */
    _formatarData(valor, formato = 'DD/MM/YYYY') {
        if (!valor) return '';
        
        try {
            const data = new Date(valor);
            if (isNaN(data.getTime())) return valor;
            
            // Implementar formatação de data personalizada
            return data.toLocaleDateString('pt-BR');
        } catch (error) {
            return valor;
        }
    }

    /**
     * Formata número
     */
    _formatarNumero(valor, decimais = 2) {
        if (valor === null || valor === undefined || valor === '') return '';
        
        const numero = parseFloat(valor);
        if (isNaN(numero)) return valor;
        
        return numero.toFixed(decimais);
    }

    /**
     * Formata texto
     */
    _formatarTexto(valor, opcoes = {}) {
        if (!valor || typeof valor !== 'string') return valor;
        
        let resultado = valor;
        
        if (opcoes.maiuscula) resultado = resultado.toUpperCase();
        if (opcoes.minuscula) resultado = resultado.toLowerCase();
        if (opcoes.trim) resultado = resultado.trim();
        
        return resultado;
    }

    /**
     * Escapa valores para CSV
     */
    _escaparValorCSV(valor, separador) {
        if (valor === null || valor === undefined) {
            return '';
        }
        
        let valorString = String(valor);
        
        // Se contém o separador, quebra de linha ou aspas, precisa escapar
        if (valorString.includes(separador) || 
            valorString.includes('\n') || 
            valorString.includes('\r') || 
            valorString.includes('"')) {
            
            // Escapar aspas duplicando-as
            valorString = valorString.replace(/"/g, '""');
            
            // Envolver em aspas
            valorString = `"${valorString}"`;
        }
        
        return valorString;
    }

    /**
     * Formata tamanho de arquivo
     */
    _formatarTamanho(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const tamanhos = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanhos[i];
    }
}

module.exports = new ExportService();
