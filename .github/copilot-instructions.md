<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Sistema de Manipulação de Planilhas

Este é um projeto Node.js para manipular e combinar planilhas Excel/CSV com interface web moderna.

## Estrutura do Projeto

- `src/server.js` - Servidor Express principal
- `src/controllers/` - Controladores da API REST
- `src/services/` - Lógica de negócio e processamento de planilhas
- `src/utils/` - Utilitários e funções auxiliares
- `public/` - Interface web (HTML, CSS, JavaScript)
- `uploads/` - Pasta para arquivos enviados
- `exports/` - Pasta para arquivos exportados

## Tecnologias Utilizadas

- **Backend**: Node.js, Express.js, Multer, XLSX, CSV-Parser
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Font Awesome
- **Processamento**: Manipulação de planilhas Excel e CSV

## Funcionalidades

1. **Upload de Planilhas**: Suporte a .xlsx, .xls, .csv, .txt
2. **Análise de Estrutura**: Extração automática de colunas e tipos
3. **Seleção de Colunas**: Interface intuitiva para escolher colunas
4. **Combinação**: Unir dados de múltiplas planilhas
5. **Preview**: Visualização antes da exportação
6. **Exportação**: Download em Excel ou CSV

## Instruções para o Copilot

- Sempre comentar código em português brasileiro
- Usar ES6+ features quando apropriado
- Manter padrão de nomenclatura em camelCase para JavaScript
- Seguir estrutura MVC no backend
- Implementar tratamento de erros robusto
- Considerar performance para arquivos grandes
- Manter interface responsiva e acessível
- Usar async/await para operações assíncronas
- Validar dados tanto no frontend quanto backend
- Seguir princípios de segurança web
