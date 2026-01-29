/**
 * CONTROLADOR DE UPLOAD DE ARQUIVOS
 * 
 * Este controlador gerencia o upload de arquivos de planilha,
 * validando tipos, tamanhos e processando os dados inicialmente.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../../config/app.config');
const planilhaService = require('../services/planilhaService');
const fileUtils = require('../utils/fileUtils');

const router = express.Router();

// CONFIGURAÇÃO DO MULTER PARA UPLOAD
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Criar pasta de uploads se não existir
        const uploadDir = path.join(__dirname, '../../', config.UPLOAD_CONFIG.UPLOAD_DIR);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Gerar nome único para o arquivo
        const uniqueName = fileUtils.generateUniqueFileName(file.originalname);
        cb(null, uniqueName);
    }
});

// VALIDAÇÃO DE ARQUIVOS
const fileFilter = (req, file, cb) => {
    // Verificar tipo MIME
    if (config.UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // Verificar extensão como fallback
        const ext = path.extname(file.originalname).toLowerCase();
        if (config.UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(config.MESSAGES.ERROR.FILE_TYPE), false);
        }
    }
};

// CONFIGURAÇÃO DO UPLOAD
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.UPLOAD_CONFIG.MAX_FILE_SIZE,
        files: config.UPLOAD_CONFIG.MAX_FILES
    }
});

/**
 * ROTA: POST /api/upload/files
 * Faz upload de múltiplos arquivos de planilha
 */
router.post('/files', upload.array('planilhas', config.UPLOAD_CONFIG.MAX_FILES), async (req, res) => {
    try {
        // Verificar se arquivos foram enviados
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: config.MESSAGES.ERROR.NO_FILES
            });
        }

        console.log(`📁 Recebidos ${req.files.length} arquivo(s) para processamento`);

        // Array para armazenar informações dos arquivos processados
        const processedFiles = [];

        // Processar cada arquivo enviado
        for (const file of req.files) {
            try {
                console.log(`🔄 Processando arquivo: ${file.originalname}`);
                
                // Analisar o arquivo e extrair dados
                const planilhaData = await planilhaService.analisarPlanilha(file.path, file.originalname);
                
                // Adicionar informações do arquivo
                processedFiles.push({
                    id: fileUtils.generateFileId(),
                    originalName: file.originalname,
                    fileName: file.filename,
                    filePath: file.path,
                    size: file.size,
                    type: file.mimetype,
                    uploadDate: new Date().toISOString(),
                    ...planilhaData
                });

                console.log(`✅ Arquivo processado: ${file.originalname}`);
            } catch (error) {
                console.error(`❌ Erro ao processar ${file.originalname}:`, error);
                
                // Remover arquivo com erro
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                
                // Continuar com os próximos arquivos
                processedFiles.push({
                    originalName: file.originalname,
                    error: error.message
                });
            }
        }

        // Retornar resultado
        const sucessCount = processedFiles.filter(f => !f.error).length;
        const errorCount = processedFiles.filter(f => f.error).length;

        res.json({
            success: true,
            message: `${sucessCount} arquivo(s) processado(s) com sucesso${errorCount > 0 ? `, ${errorCount} com erro(s)` : ''}`,
            files: processedFiles,
            summary: {
                total: req.files.length,
                success: sucessCount,
                errors: errorCount
            }
        });

    } catch (error) {
        console.error('❌ Erro no upload:', error);
        
        // Limpar arquivos em caso de erro geral
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }

        res.status(500).json({
            success: false,
            message: config.MESSAGES.ERROR.PROCESS_FAIL,
            error: error.message
        });
    }
});

/**
 * ROTA: DELETE /api/upload/files/:filename
 * Remove um arquivo específico
 */
router.delete('/files/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../', config.UPLOAD_CONFIG.UPLOAD_DIR, filename);

        // Verificar se arquivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: config.MESSAGES.ERROR.FILE_NOT_FOUND
            });
        }

        // Remover arquivo
        fs.unlinkSync(filePath);

        console.log(`🗑️ Arquivo removido: ${filename}`);

        res.json({
            success: true,
            message: config.MESSAGES.SUCCESS.DELETE
        });

    } catch (error) {
        console.error('❌ Erro ao remover arquivo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao remover arquivo',
            error: error.message
        });
    }
});

/**
 * ROTA: GET /api/upload/files
 * Lista todos os arquivos na pasta de uploads
 */
router.get('/files', (req, res) => {
    try {
        const uploadDir = path.join(__dirname, '../../', config.UPLOAD_CONFIG.UPLOAD_DIR);
        
        if (!fs.existsSync(uploadDir)) {
            return res.json({ files: [] });
        }

        const files = fs.readdirSync(uploadDir).map(filename => {
            const filePath = path.join(uploadDir, filename);
            const stats = fs.statSync(filePath);
            
            return {
                filename,
                originalName: filename,
                size: stats.size,
                uploadDate: stats.birthtime.toISOString()
            };
        });

        res.json({ files });

    } catch (error) {
        console.error('❌ Erro ao listar arquivos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar arquivos',
            error: error.message
        });
    }
});

// TRATAMENTO DE ERROS DO MULTER
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: config.MESSAGES.ERROR.FILE_SIZE
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: `Máximo de ${config.UPLOAD_CONFIG.MAX_FILES} arquivos permitidos`
            });
        }
    }
    
    res.status(400).json({
        success: false,
        message: error.message || 'Erro no upload'
    });
});

module.exports = router;
