/**
 * CONFIGURAÇÕES GERAIS DA APLICAÇÃO
 * 
 * Este arquivo centraliza todas as configurações importantes do sistema,
 * incluindo portas, limites de arquivo, tipos permitidos, etc.
 */

module.exports = {
    // Porta do servidor
    PORT: process.env.PORT || 3000,
    
    // Configurações de upload
    UPLOAD_CONFIG: {
        // Tamanho máximo por arquivo (100MB)
        MAX_FILE_SIZE: 100 * 1024 * 1024,
        
        // Tipos de arquivo permitidos
        ALLOWED_TYPES: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
            'text/plain' // .txt (para CSVs)
        ],
        
        // Extensões permitidas
        ALLOWED_EXTENSIONS: ['.xlsx', '.xls', '.csv', '.txt'],
        
        // Número máximo de arquivos por upload
        MAX_FILES: 10,
        
        // Pasta de uploads
        UPLOAD_DIR: 'uploads/',
        
        // Pasta de exports
        EXPORT_DIR: 'exports/'
    },
    
    // Configurações de processamento
    PROCESSING_CONFIG: {
        // Número máximo de linhas por planilha
        MAX_ROWS: 1000000,
        
        // Número máximo de colunas por planilha
        MAX_COLUMNS: 100,
        
        // Tempo limite para processamento (30 segundos)
        TIMEOUT: 30000
    },
    
    // Mensagens do sistema
    MESSAGES: {
        SUCCESS: {
            UPLOAD: 'Arquivos enviados com sucesso!',
            PROCESS: 'Planilhas processadas com sucesso!',
            EXPORT: 'Planilha exportada com sucesso!',
            DELETE: 'Arquivo removido com sucesso!'
        },
        ERROR: {
            FILE_TYPE: 'Tipo de arquivo não permitido',
            FILE_SIZE: 'Arquivo muito grande',
            NO_FILES: 'Nenhum arquivo foi enviado',
            PROCESS_FAIL: 'Erro ao processar planilha',
            EXPORT_FAIL: 'Erro ao exportar planilha',
            FILE_NOT_FOUND: 'Arquivo não encontrado'
        }
    }
};
