/**
 * CONTROLADOR DE MANIPULAÇÃO DE PLANILHAS
 * 
 * Este controlador gerencia as operações de análise, combinação 
 * e exportação de planilhas.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('../../config/app.config');
const planilhaService = require('../services/planilhaService');
const exportService = require('../services/exportService');

const router = express.Router();

/**
 * ROTA: POST /api/planilhas/analisar
 * Analisa planilhas já enviadas e retorna estrutura das colunas
 */
router.post('/analisar', async (req, res) => {
    try {
        const { files } = req.body;

        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo foi especificado para análise'
            });
        }

        console.log(`🔍 Analisando ${files.length} planilha(s)`);

        const analisesResultados = [];

        // Analisar cada arquivo
        for (const fileInfo of files) {
            try {
                const filePath = path.join(__dirname, '../../', config.UPLOAD_CONFIG.UPLOAD_DIR, fileInfo.fileName);
                
                // Verificar se arquivo existe
                if (!fs.existsSync(filePath)) {
                    analisesResultados.push({
                        fileName: fileInfo.fileName,
                        originalName: fileInfo.originalName,
                        error: 'Arquivo não encontrado'
                    });
                    continue;
                }

                // Analisar estrutura da planilha
                const analise = await planilhaService.analisarEstrutura(filePath, fileInfo.originalName);
                
                analisesResultados.push({
                    fileName: fileInfo.fileName,
                    originalName: fileInfo.originalName,
                    ...analise
                });

                console.log(`✅ Análise concluída: ${fileInfo.originalName}`);

            } catch (error) {
                console.error(`❌ Erro na análise de ${fileInfo.originalName}:`, error);
                analisesResultados.push({
                    fileName: fileInfo.fileName,
                    originalName: fileInfo.originalName,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: 'Análise concluída',
            analises: analisesResultados
        });

    } catch (error) {
        console.error('❌ Erro na análise das planilhas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno na análise',
            error: error.message
        });
    }
});

/**
 * ROTA: POST /api/planilhas/combinar
 * Combina colunas selecionadas de múltiplas planilhas
 */
router.post('/combinar', async (req, res) => {
    try {
        const { 
            planilhas, 
            colunasEscolhidas, 
            nomeArquivoFinal,
            configuracoes 
        } = req.body;

        // Validar dados de entrada
        if (!planilhas || !Array.isArray(planilhas) || planilhas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhuma planilha foi especificada para combinação'
            });
        }

        if (!colunasEscolhidas || Object.keys(colunasEscolhidas).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhuma coluna foi selecionada para combinação'
            });
        }

        console.log(`🔄 Combinando colunas de ${planilhas.length} planilha(s)`);

        // Processar combinação
        const resultado = await planilhaService.combinarPlanilhas(
            planilhas,
            colunasEscolhidas,
            configuracoes || {}
        );

        // Exportar resultado
        const nomeArquivo = nomeArquivoFinal || `planilha_combinada_${Date.now()}`;
        const arquivoExportado = await exportService.exportarParaExcel(
            resultado,
            nomeArquivo
        );

        console.log(`✅ Planilha combinada criada: ${arquivoExportado.fileName}`);

        res.json({
            success: true,
            message: 'Planilha combinada com sucesso',
            arquivo: arquivoExportado,
            estatisticas: {
                totalLinhas: resultado.length,
                totalColunas: resultado.length > 0 ? Object.keys(resultado[0]).length : 0,
                planilhasOriginais: planilhas.length,
                colunasCombinatda: Object.keys(colunasEscolhidas).length
            }
        });

    } catch (error) {
        console.error('❌ Erro na combinação de planilhas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao combinar planilhas',
            error: error.message
        });
    }
});

/**
 * ROTA: POST /api/planilhas/preview
 * Gera preview dos dados que serão combinados
 */
router.post('/preview', async (req, res) => {
    try {
        const { 
            planilhas, 
            colunasEscolhidas,
            limiteLinha = 10 
        } = req.body;

        if (!planilhas || !colunasEscolhidas) {
            return res.status(400).json({
                success: false,
                message: 'Dados insuficientes para preview'
            });
        }

        console.log(`👁️ Gerando preview da combinação`);

        // Gerar preview limitado
        const preview = await planilhaService.gerarPreview(
            planilhas,
            colunasEscolhidas,
            limiteLinha
        );

        res.json({
            success: true,
            message: 'Preview gerado com sucesso',
            preview: preview,
            info: {
                linhasExibidas: preview.dados.length,
                totalEstimado: preview.totalEstimado,
                colunas: preview.colunas
            }
        });

    } catch (error) {
        console.error('❌ Erro ao gerar preview:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar preview',
            error: error.message
        });
    }
});

/**
 * ROTA: GET /api/planilhas/exports
 * Lista arquivos exportados disponíveis para download
 */
router.get('/exports', (req, res) => {
    try {
        const exportDir = path.join(__dirname, '../../', config.UPLOAD_CONFIG.EXPORT_DIR);
        
        if (!fs.existsSync(exportDir)) {
            return res.json({ 
                success: true, 
                exports: [] 
            });
        }

        const exports = fs.readdirSync(exportDir)
            .filter(file => file.endsWith('.xlsx') || file.endsWith('.csv'))
            .map(filename => {
                const filePath = path.join(exportDir, filename);
                const stats = fs.statSync(filePath);
                
                return {
                    filename,
                    size: stats.size,
                    createDate: stats.birthtime.toISOString(),
                    downloadUrl: `/exports/${filename}`
                };
            })
            .sort((a, b) => new Date(b.createDate) - new Date(a.createDate)); // Mais recentes primeiro

        res.json({
            success: true,
            exports
        });

    } catch (error) {
        console.error('❌ Erro ao listar exports:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar exports',
            error: error.message
        });
    }
});

/**
 * ROTA: DELETE /api/planilhas/exports/:filename
 * Remove um arquivo exportado
 */
router.delete('/exports/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../', config.UPLOAD_CONFIG.EXPORT_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Arquivo não encontrado'
            });
        }

        fs.unlinkSync(filePath);

        console.log(`🗑️ Export removido: ${filename}`);

        res.json({
            success: true,
            message: 'Arquivo removido com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao remover export:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao remover arquivo',
            error: error.message
        });
    }
});

module.exports = router;
