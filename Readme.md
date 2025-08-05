# Arandu IA

![HTML CSS JS](https://img.shields.io/badge/Tecnologias-HTML%2C%20CSS%2C%20JS-brightgreen)
![OpenAI Gemini](https://img.shields.io/badge/APIs-OpenAI%2F%20Gemini-blue)

Projeto fullstack desenvolvido nas aulas 22 a 25 - Um assistente de IA completo integrado com APIs de inteligência artificial.

## ✨ Funcionalidades Principais

- **Integração com APIs de IA**:
  - OpenAI (GPT-3.5/4)
  - Google Gemini (alternativa gratuita)
- **Interface amigável**:
  - Campo para pergunta e API Key
  - Exibição de respostas formatadas
  - Estados de carregamento
- **Recursos extras**:
  - Copiar resposta para clipboard
  - Salvar API Key no localStorage
  - Atalho Ctrl+Enter para enviar
  - Validação de formulários
  - Tratamento de erros

## ⚙️ Pré-requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Chave de API da [OpenAI](https://platform.openai.com/) ou [Google Gemini](https://aistudio.google.com/)
- Conhecimentos básicos de HTML/CSS/JS

## 🚀 Fluxo da Aplicação

1. Insira sua API Key no campo designado
2. Digite sua pergunta no campo de texto
3. Clique em "Perguntar" ou pressione Ctrl+Enter
4. Visualize a resposta da IA
5. Use os botões para copiar ou limpar a resposta

## 🔑 Como Obter API Key

### Para OpenAI:

1. Acesse [platform.openai.com](https://platform.openai.com/)
2. Crie conta/login
3. Navegue até "API Keys"
4. Clique em "Create new secret key"

### Para Gemini (gratuito):

1. Acesse [Google AI Studio](https://aistudio.google.com/)
2. Faça login com conta Google
3. Clique em "Get API Key"
4. Selecione "Create API Key"

> **Importante**: Não adicione dados de pagamento no Gemini para manter o plano gratuito

## 🧩 Estrutura do Projeto

Arandu-ia/
├── index.html # Estrutura principal
├── css\style.css # Estilos da aplicação
└── js\script.js # Lógica e integração com APIs
