/**
 * UTILITÁRIOS PARA MANIPULAÇÃO DE ARQUIVOS
 * 
 * Conjunto de funções auxiliares para trabalhar com arquivos,
 * incluindo validação, geração de nomes únicos, etc.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class FileUtils {

    /**
     * Gera um nome único para arquivo baseado no nome original
     * @param {string} nomeOriginal - Nome original do arquivo
     * @returns {string} Nome único gerado
     */
    generateUniqueFileName(nomeOriginal) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extensao = path.extname(nomeOriginal);
        const nomeBase = path.basename(nomeOriginal, extensao);
        
        // Limpar caracteres especiais do nome
        const nomeLimpo = nomeBase.replace(/[^a-zA-Z0-9_-]/g, '_');
        
        return `${nomeLimpo}_${timestamp}_${random}${extensao}`;
    }

    /**
     * Gera ID único para arquivo
     * @returns {string} ID único
     */
    generateFileId() {
        return crypto.randomUUID();
    }

    /**
     * Valida se o arquivo é de um tipo permitido
     * @param {string} nomeArquivo - Nome do arquivo
     * @param {Array} tiposPermitidos - Array de extensões permitidas
     * @returns {boolean} True se válido
     */
    isValidFileType(nomeArquivo, tiposPermitidos = ['.xlsx', '.xls', '.csv', '.txt']) {
        const extensao = path.extname(nomeArquivo).toLowerCase();
        return tiposPermitidos.includes(extensao);
    }

    /**
     * Valida tamanho do arquivo
     * @param {number} tamanho - Tamanho em bytes
     * @param {number} limiteMaximo - Limite máximo em bytes
     * @returns {boolean} True se dentro do limite
     */
    isValidFileSize(tamanho, limiteMaximo = 50 * 1024 * 1024) { // 50MB default
        return tamanho <= limiteMaximo;
    }

    /**
     * Formata tamanho de arquivo para exibição
     * @param {number} bytes - Tamanho em bytes
     * @returns {string} Tamanho formatado
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const tamanhos = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanhos[i];
    }

    /**
     * Extrai informações básicas de um arquivo
     * @param {string} caminhoArquivo - Caminho completo do arquivo
     * @returns {Object} Informações do arquivo
     */
    getFileInfo(caminhoArquivo) {
        try {
            const stats = fs.statSync(caminhoArquivo);
            const nomeCompleto = path.basename(caminhoArquivo);
            const extensao = path.extname(nomeCompleto);
            const nomeBase = path.basename(nomeCompleto, extensao);
            
            return {
                nomeCompleto,
                nomeBase,
                extensao,
                tamanho: stats.size,
                tamanhoFormatado: this.formatFileSize(stats.size),
                dataCriacao: stats.birthtime,
                dataModificacao: stats.mtime,
                caminhoCompleto: caminhoArquivo,
                diretorio: path.dirname(caminhoArquivo)
            };
            
        } catch (error) {
            throw new Error(`Erro ao obter informações do arquivo: ${error.message}`);
        }
    }

    /**
     * Verifica se um arquivo existe
     * @param {string} caminhoArquivo - Caminho do arquivo
     * @returns {boolean} True se existe
     */
    fileExists(caminhoArquivo) {
        try {
            return fs.existsSync(caminhoArquivo);
        } catch (error) {
            return false;
        }
    }

    /**
     * Cria diretório se não existir
     * @param {string} caminhoDiretorio - Caminho do diretório
     * @returns {boolean} True se criado ou já existia
     */
    ensureDirectoryExists(caminhoDiretorio) {
        try {
            if (!fs.existsSync(caminhoDiretorio)) {
                fs.mkdirSync(caminhoDiretorio, { recursive: true });
                console.log(`📁 Diretório criado: ${caminhoDiretorio}`);
            }
            return true;
        } catch (error) {
            console.error(`❌ Erro ao criar diretório ${caminhoDiretorio}:`, error);
            return false;
        }
    }

    /**
     * Remove arquivo de forma segura
     * @param {string} caminhoArquivo - Caminho do arquivo
     * @returns {boolean} True se removido com sucesso
     */
    safeRemoveFile(caminhoArquivo) {
        try {
            if (this.fileExists(caminhoArquivo)) {
                fs.unlinkSync(caminhoArquivo);
                console.log(`🗑️ Arquivo removido: ${path.basename(caminhoArquivo)}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`❌ Erro ao remover arquivo ${caminhoArquivo}:`, error);
            return false;
        }
    }

    /**
     * Lista arquivos de um diretório com filtro opcional
     * @param {string} diretorio - Caminho do diretório
     * @param {Array} extensoesPermitidas - Extensões para filtrar
     * @returns {Array} Lista de arquivos
     */
    listFiles(diretorio, extensoesPermitidas = null) {
        try {
            if (!fs.existsSync(diretorio)) {
                return [];
            }

            let arquivos = fs.readdirSync(diretorio);

            // Filtrar por extensões se especificado
            if (extensoesPermitidas && Array.isArray(extensoesPermitidas)) {
                arquivos = arquivos.filter(arquivo => {
                    const extensao = path.extname(arquivo).toLowerCase();
                    return extensoesPermitidas.includes(extensao);
                });
            }

            // Adicionar informações detalhadas
            return arquivos.map(arquivo => {
                const caminhoCompleto = path.join(diretorio, arquivo);
                return this.getFileInfo(caminhoCompleto);
            });

        } catch (error) {
            console.error(`❌ Erro ao listar arquivos de ${diretorio}:`, error);
            return [];
        }
    }

    /**
     * Limpa arquivos antigos de um diretório
     * @param {string} diretorio - Diretório para limpar
     * @param {number} idadeMaximaHoras - Idade máxima em horas
     * @returns {number} Número de arquivos removidos
     */
    cleanOldFiles(diretorio, idadeMaximaHoras = 24) {
        try {
            if (!fs.existsSync(diretorio)) {
                return 0;
            }

            const agora = new Date();
            const limiteIdade = idadeMaximaHoras * 60 * 60 * 1000; // Converter para milliseconds
            let arquivosRemovidos = 0;

            const arquivos = fs.readdirSync(diretorio);

            for (const arquivo of arquivos) {
                const caminhoCompleto = path.join(diretorio, arquivo);
                const stats = fs.statSync(caminhoCompleto);
                
                const idadeArquivo = agora - stats.mtime;
                
                if (idadeArquivo > limiteIdade) {
                    if (this.safeRemoveFile(caminhoCompleto)) {
                        arquivosRemovidos++;
                    }
                }
            }

            if (arquivosRemovidos > 0) {
                console.log(`🧹 Limpeza concluída: ${arquivosRemovidos} arquivo(s) antigo(s) removido(s) de ${diretorio}`);
            }

            return arquivosRemovidos;

        } catch (error) {
            console.error(`❌ Erro na limpeza de arquivos antigos:`, error);
            return 0;
        }
    }

    /**
     * Calcula hash MD5 de um arquivo
     * @param {string} caminhoArquivo - Caminho do arquivo
     * @returns {string} Hash MD5
     */
    calculateFileHash(caminhoArquivo) {
        try {
            const conteudo = fs.readFileSync(caminhoArquivo);
            return crypto.createHash('md5').update(conteudo).digest('hex');
        } catch (error) {
            throw new Error(`Erro ao calcular hash do arquivo: ${error.message}`);
        }
    }

    /**
     * Valida se um arquivo não está corrompido (verificação básica)
     * @param {string} caminhoArquivo - Caminho do arquivo
     * @returns {Object} Resultado da validação
     */
    validateFileIntegrity(caminhoArquivo) {
        try {
            const stats = fs.statSync(caminhoArquivo);
            
            // Verificações básicas
            const validacao = {
                existe: true,
                tamanhoValido: stats.size > 0,
                extensaoValida: this.isValidFileType(caminhoArquivo),
                acessivel: true
            };

            // Tentar ler uma pequena parte do arquivo
            try {
                const fd = fs.openSync(caminhoArquivo, 'r');
                fs.closeSync(fd);
            } catch (error) {
                validacao.acessivel = false;
            }

            validacao.valido = validacao.existe && 
                              validacao.tamanhoValido && 
                              validacao.extensaoValida && 
                              validacao.acessivel;

            return validacao;

        } catch (error) {
            return {
                existe: false,
                tamanhoValido: false,
                extensaoValida: false,
                acessivel: false,
                valido: false,
                erro: error.message
            };
        }
    }

    /**
     * Sanitiza nome de arquivo removendo caracteres inválidos
     * @param {string} nomeArquivo - Nome original do arquivo
     * @returns {string} Nome sanitizado
     */
    sanitizeFileName(nomeArquivo) {
        // Remover ou substituir caracteres problemáticos
        return nomeArquivo
            .replace(/[<>:"/\\|?*]/g, '_') // Caracteres inválidos no Windows
            .replace(/[\x00-\x1f]/g, '_')   // Caracteres de controle
            .replace(/\s+/g, '_')           // Espaços múltiplos
            .replace(/_+/g, '_')            // Underscores múltiplos
            .trim();
    }

    /**
     * Converte caminho para formato compatível com o sistema
     * @param {string} caminho - Caminho original
     * @returns {string} Caminho normalizado
     */
    normalizePath(caminho) {
        return path.normalize(caminho);
    }
}

module.exports = new FileUtils();
