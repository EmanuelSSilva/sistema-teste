# 📊 Sistema de Manipulação de Planilhas

Um sistema moderno e intuitivo para combinar e manipular planilhas Excel e CSV, desenvolvido com Node.js e interface web responsiva.

![Sistema de Manipulação de Planilhas](https://img.shields.io/badge/Node.js-18+-green) ![License](https://img.shields.io/badge/license-MIT-blue) ![Status](https://img.shields.io/badge/status-ativo-success)

## ✨ Funcionalidades

### 🔄 Upload Inteligente
- Suporte a múltiplos formatos: **Excel (.xlsx, .xls)** e **CSV (.csv, .txt)**
- Upload via **drag & drop** ou seleção de arquivos
- Validação automática de tipos e tamanhos
- Processamento de até **10 arquivos** simultaneamente (máx. 50MB cada)

### 🔍 Análise Automatizada
- Detecção automática de estrutura das planilhas
- Identificação de tipos de dados (texto, número, data)
- Visualização de amostras dos dados
- Estatísticas de preenchimento por coluna

### 🎯 Seleção Intuitiva
- Interface visual para escolha de colunas
- Seleção individual ou em lote
- Preview em tempo real das seleções
- Busca e filtros por tipo de dados

### 🔗 Combinação Poderosa
- União de colunas de múltiplas planilhas
- Manutenção da origem dos dados (opcional)
- Configurações avançadas de processamento
- Preview antes da exportação final

### 📤 Exportação Flexível
- Formato **Excel (.xlsx)** com formatação
- Formato **CSV** configurável
- Download direto pelo navegador
- Histórico de arquivos exportados

## 🚀 Instalação e Uso

### Pré-requisitos
- **Node.js** 16+ instalado
- **npm** ou **yarn** para gerenciar dependências

### 1. Configuração
```bash
# Clone ou baixe o projeto
cd programa-da-uniao

# Instale as dependências
npm install

# Inicie o servidor
npm start
```

### 2. Acesso
Abra seu navegador e acesse: **http://localhost:3000**

### 3. Scripts Disponíveis
```bash
npm start     # Inicia o servidor em produção
npm run dev   # Inicia com hot-reload (desenvolvimento)
npm test      # Executa testes (em implementação)
```

## 📁 Estrutura do Projeto

```
programa-da-uniao/
├── 📂 src/                    # Código-fonte do servidor
│   ├── server.js              # Servidor Express principal
│   ├── 📂 controllers/        # Controladores da API
│   │   ├── uploadController.js
│   │   └── planilhaController.js
│   ├── 📂 services/           # Lógica de negócio
│   │   ├── planilhaService.js
│   │   └── exportService.js
│   └── 📂 utils/              # Utilitários
│       └── fileUtils.js
├── 📂 public/                 # Interface web
│   ├── index.html             # Página principal
│   ├── 📂 css/
│   │   └── style.css          # Estilos modernos
│   └── 📂 js/                 # JavaScript do frontend
│       ├── main.js
│       ├── upload.js
│       ├── analysis.js
│       ├── combination.js
│       └── utils.js
├── 📂 config/                 # Configurações
│   └── app.config.js
├── 📂 uploads/                # Arquivos enviados (temporário)
├── 📂 exports/                # Arquivos gerados
└── 📂 .github/                # Configurações do projeto
    └── copilot-instructions.md
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web minimalista
- **Multer** - Upload de arquivos
- **XLSX** - Processamento de arquivos Excel
- **CSV-Parser** - Processamento de arquivos CSV

### Frontend
- **HTML5** - Estrutura moderna
- **CSS3** - Design responsivo e elegante
- **JavaScript (Vanilla)** - Interatividade nativa
- **Font Awesome** - Ícones vetoriais

## 📋 Como Usar o Sistema

### Passo 1: Upload de Arquivos
1. Clique em **"Escolher Arquivos"** ou arraste arquivos para a área de upload
2. Selecione suas planilhas Excel (.xlsx, .xls) ou CSV (.csv, .txt)
3. Aguarde o processamento automático

### Passo 2: Análise das Planilhas
1. Clique em **"Analisar Estrutura"** 
2. Visualize as colunas detectadas em cada arquivo
3. Veja exemplos de dados e tipos identificados

### Passo 3: Seleção de Colunas
1. Marque as **colunas que deseja combinar**
2. Use os botões para selecionar/desmarcar todas
3. Acompanhe o contador de colunas selecionadas

### Passo 4: Preview (Opcional)
1. Clique em **"Visualizar Preview"**
2. Veja como ficará o resultado final
3. Ajuste seleções se necessário

### Passo 5: Combinação Final
1. Defina o **nome do arquivo final**
2. Configure opções como incluir origem dos dados
3. Clique em **"Combinar Planilhas"**
4. Faça o download do arquivo gerado

## ⚙️ Configurações Avançadas

### Limites do Sistema
- **Tamanho máximo por arquivo**: 50MB
- **Número máximo de arquivos**: 10 por upload
- **Linhas máximas por planilha**: 1.000.000
- **Colunas máximas**: 100

### Formatos Suportados
| Formato | Extensões | Observações |
|---------|-----------|-------------|
| Excel | .xlsx, .xls | Suporte completo |
| CSV | .csv, .txt | Detecção automática de separador |

### Configuração do Servidor
Edite `config/app.config.js` para ajustar:
- Porta do servidor
- Limites de upload
- Timeouts de processamento
- Tipos de arquivo permitidos

## 🔒 Segurança e Privacidade

- ✅ Validação rigorosa de tipos de arquivo
- ✅ Limpeza automática de arquivos temporários
- ✅ Sanitização de nomes de arquivos
- ✅ Limites de tamanho e quantidade
- ✅ Processamento local (sem envio para terceiros)

## 🐛 Solução de Problemas

### Problemas Comuns

**Erro: "Arquivo muito grande"**
- Verifique se o arquivo tem menos de 50MB
- Tente dividir planilhas muito grandes

**Erro: "Tipo não suportado"**  
- Confirme que o arquivo é .xlsx, .xls ou .csv
- Renomeie arquivos .txt para .csv se necessário

**Preview não carrega**
- Verifique se há colunas selecionadas
- Tente recarregar a página

**Servidor não inicia**
- Verifique se a porta 3000 está livre
- Execute `npm install` novamente

### Logs e Debug
- Logs detalhados no console do navegador (F12)
- Logs do servidor no terminal
- Arquivos de erro salvos automaticamente

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a **Licença MIT** - veja o arquivo `LICENSE` para detalhes.

## 📞 Suporte

Para dúvidas, sugestões ou reportar problemas:
- 📧 Entre em contato através do sistema
- 🐛 Reporte bugs via issues
- 💡 Sugira melhorias

---

**Desenvolvido com ❤️ em JavaScript**  
*Sistema moderno para manipulação eficiente de planilhas*
