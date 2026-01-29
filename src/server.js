/**
 * SERVIDOR PRINCIPAL DO SISTEMA DE MANIPULAÇÃO DE PLANILHAS
 * 
 * Este arquivo configura o servidor Express.js que serve como backend
 * para o sistema de manipulação de planilhas. Ele gerencia:
 * - Upload de arquivos de planilha
 * - Processamento e análise dos dados
 * - Combinação de colunas de múltiplas planilhas
 * - Exportação de novas planilhas
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

// Importar controladores e configurações
const uploadController = require('./controllers/uploadController');
const planilhaController = require('./controllers/planilhaController');
const config = require('../config/app.config');

// Criar instância do Express
const app = express();

// CONFIGURAÇÕES DE MIDDLEWARE
// Permitir CORS para requisições do frontend
app.use(cors());

// Parser para JSON e dados de formulário
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '../public')));

// ROTAS DA API
// Rota principal - servir a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rotas para upload de arquivos
app.use('/api/upload', uploadController);

// Rotas para manipulação de planilhas
app.use('/api/planilhas', planilhaController);

// Rota para download de arquivos exportados
app.use('/exports', express.static(path.join(__dirname, '../exports')));

// TRATAMENTO DE ERROS
// Middleware para capturar erros não tratados
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err.stack);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: err.message 
    });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Rota não encontrada',
        path: req.originalUrl 
    });
});

// INICIALIZAÇÃO DO SERVIDOR
const PORT = config.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Sistema de Manipulação de Planilhas iniciado`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
});

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Encerrando servidor...');
    process.exit(0);
});

module.exports = app;
