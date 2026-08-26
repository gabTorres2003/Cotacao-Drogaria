# 💊 Cotação Drogaria — Torres Farma

Sistema web de **gestão de compras, cotações, respostas de fornecedores, comparação de preços, geração de pedidos e conferência de recebimento** desenvolvido para a operação da Drogaria Torres Farma.

O projeto conecta a equipe de compras da drogaria aos fornecedores, centralizando o processo que começa na identificação das necessidades de compra, passa pela cotação e resposta dos fornecedores, análise das ofertas e geração dos pedidos, até chegar à conferência do recebimento.

> **Status:** Em desenvolvimento e evolução contínua.

---

## 📌 Visão geral

O sistema possui dois principais contextos de utilização:

- **Comprador / operação interna:** cria e acompanha cotações, gerencia fornecedores, analisa respostas, compara preços, gera pedidos, acompanha pedidos e realiza conferências.
- **Fornecedor:** acessa o portal de resposta, visualiza os produtos solicitados e informa preços, quantidades e situações de disponibilidade.

O backend também possui integração de leitura com o **DNA da drogaria**, utilizado como fonte operacional para dados relacionados ao estoque/necessidades de compra.

---

## 🏗️ Arquitetura atual

```text
                         INTERNET
                            │
                            ▼
                ┌──────────────────────┐
                │   Frontend React     │
                │      + Vite          │
                │      Netlify         │
                └──────────┬───────────┘
                           │ HTTPS / REST
                           ▼
                ┌──────────────────────┐
                │   Backend Spring     │
                │ Boot + Java 17       │
                │                      │
                │ Servidor da Drogaria │
                │ Serviço Windows      │
                │ executando o JAR     │
                └───────┬────────┬─────┘
                        │        │
              leitura   │        │ persistência
                        │        │
                        ▼        ▼
                ┌────────────┐  ┌─────────────────┐
                │ DNA /      │  │ PostgreSQL      │
                │ Firebird   │  │ Supabase        │
                │ leitura    │  │                 │
                └────────────┘  └─────────────────┘
```

### Produção

A arquitetura de produção atual é:

| Componente | Tecnologia | Hospedagem / execução |
|---|---|---|
| Frontend | React + Vite | Netlify |
| Backend | Java 17 + Spring Boot | Servidor da Drogaria |
| Execução do backend | JAR | Serviço do Windows, com execução programada diariamente |
| Banco principal | PostgreSQL | Supabase |
| Banco operacional DNA | Firebird | Servidor da Drogaria, utilizado em leitura pelo backend |

O repositório contém um `Dockerfile` no backend, porém o modelo de produção atualmente utilizado é a execução do JAR no servidor da drogaria por serviço do Windows.

---

## 🔄 Fluxo principal do sistema

### 1. Necessidades de compra / DNA

O backend possui uma conexão separada com o banco **Firebird do DNA**, utilizada para leitura de dados operacionais da drogaria.

A partir dessas informações, o sistema trabalha com produtos que precisam ser cotados/comprados.

### 2. Criação da cotação

A equipe interna cria uma cotação com os produtos necessários.

Uma cotação pode conter grande quantidade de produtos e ser enviada para diversos fornecedores.

### 3. Envio aos fornecedores

Os fornecedores recebem acesso à cotação através do fluxo de comunicação definido pela operação, incluindo envio de links.

O fornecedor acessa o portal e responde aos produtos solicitados.

### 4. Resposta da cotação

Para cada produto, o fornecedor pode informar, conforme as regras do sistema:

- preço;
- quantidade disponível;
- indisponibilidade/falta;
- produto sugerido/substituto quando aplicável;
- informações complementares relacionadas à resposta.

### 5. Comparativo

As respostas recebidas são consolidadas na área de detalhes da cotação.

O comprador consegue comparar fornecedores e analisar os preços recebidos para decidir quais ofertas utilizar na compra.

### 6. Geração de pedidos

Os produtos selecionados podem ser agrupados para geração de pedidos, considerando o fornecedor correspondente.

O fluxo de pedidos possui acompanhamento do ciclo de compra e posteriormente permite realizar a conferência do recebimento.

### 7. Conferência

Após o recebimento, o pedido pode ser conferido produto a produto.

O sistema possui tratamento para situações como produto recebido, não recebido e divergências de recebimento, além de permitir continuidade da conferência em cenários parciais.

---

# 🧩 Principais módulos

## 📊 Dashboard e relatórios

O sistema possui dashboard estratégico e área de relatórios para acompanhamento das cotações e indicadores da operação.

Entre os recursos documentados no projeto estão análises relacionadas a:

- cotações;
- histórico de preços;
- ruptura/faltas;
- competitividade de fornecedores;
- acompanhamento operacional.

## 📝 Cotações

Responsável pela criação, acompanhamento e análise das cotações.

Inclui:

- listagem de cotações;
- detalhes da cotação;
- produtos cotados;
- respostas dos fornecedores;
- comparação de preços;
- análise de ofertas;
- tratamento de itens sem resposta;
- geração de pedidos a partir das respostas.

## 🏪 Fornecedores

Cadastro e gerenciamento dos fornecedores utilizados nas cotações.

O sistema trabalha com informações de empresa, contatos e dados necessários para o relacionamento do fornecedor com as cotações.

## 👨‍💼 Portal do fornecedor

Área utilizada pelo fornecedor para responder às cotações.

O frontend possui uma página específica para o dashboard/resposta do fornecedor e o backend possui Controllers próprios para o fluxo de fornecedor e cotação-fornecedor.

## 🛒 Pedidos

Módulo responsável pelo acompanhamento dos pedidos gerados a partir das cotações.

Possui:

- listagem de pedidos;
- detalhes do pedido;
- acompanhamento de status;
- conferência de recebimento;
- tratamento de recebimento parcial;
- integração com o fluxo de compras.

## 📦 Conferência de pedidos

Permite conferir os produtos recebidos em relação ao pedido realizado.

O fluxo contempla situações de divergência e itens que não foram recebidos, permitindo continuidade do processo de conferência.

## 🔁 Devoluções

O projeto possui módulo específico de devoluções, com página frontend e Controller dedicado no backend.

## 🔐 Autenticação, usuários e auditoria

O sistema possui:

- autenticação;
- rotas protegidas no frontend;
- gerenciamento de usuários;
- segurança no backend;
- JWT;
- auditoria de operações.

No frontend, as rotas internas são protegidas por autenticação e existe controle de sessão/timeout.

---

# 💻 Stack tecnológica

## Frontend

- **React 18**
- **Vite 5**
- **React Router DOM 6**
- **Axios**
- **Lucide React**
- **jsPDF**
- **jsPDF AutoTable**
- **Supabase JS** presente nas dependências do frontend
- JavaScript / JSX
- ESLint

O frontend está organizado principalmente em:

```text
frontend-web/
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── package.json
└── vite.config.js
```

### Principais páginas atuais

Entre as páginas existentes no projeto estão:

- `Login.jsx`
- `Cotacoes.jsx`
- `CotacaoDetalhes.jsx`
- `ResponderCotacao.jsx`
- `Fornecedores.jsx`
- `FornecedorDashboard.jsx`
- `Pedidos.jsx`
- `PedidoDetalhes.jsx`
- `PedidoConferencia.jsx`
- `DashboardEstrategico.jsx`
- `Usuarios.jsx`
- `Auditoria.jsx`
- `Devolucoes.jsx`

As rotas são definidas em `frontend-web/src/App.jsx`.

## Backend

- **Java 17**
- **Spring Boot 4.0.1**
- Spring Data JPA
- Hibernate
- Spring Web MVC
- Spring Security
- OAuth2 Resource Server
- JWT
- PostgreSQL Driver
- Firebird JDBC / Jaybird
- Lombok
- Apache POI
- Springdoc OpenAPI

O backend segue organização em camadas e possui, entre outros, Controllers para:

- autenticação;
- cotações;
- cotação-fornecedor;
- comparativo;
- fornecedores;
- pedidos;
- produtos;
- dashboard;
- auditoria;
- devoluções;
- encomendas;
- usuários;
- medicamentos/diversos.

Estrutura principal:

```text
backend-api/
└── cotacao/
    └── cotacao/
        ├── pom.xml
        ├── mvnw
        ├── mvnw.cmd
        ├── Dockerfile
        └── src/
            └── main/
                ├── java/
                │   └── com/drogaria/cotacao/
                │       ├── config/
                │       ├── controller/
                │       ├── model/
                │       ├── repository/
                │       ├── service/
                │       └── ...
                └── resources/
                    └── application.properties
```

---

# 🗄️ Bancos de dados

## PostgreSQL / Supabase

O PostgreSQL hospedado no **Supabase** é o banco principal da aplicação.

O backend utiliza JPA/Hibernate para persistência e possui configuração específica para PostgreSQL.

## DNA / Firebird

O backend também possui uma segunda conexão de banco dedicada ao **DNA da drogaria**, utilizando Firebird/Jaybird.

Essa conexão é tratada como fonte operacional de leitura e fica separada da persistência principal da aplicação.

> **Importante:** credenciais, tokens, senhas e URLs privadas de banco não devem ser documentados neste README. Utilize variáveis de ambiente/segredos de produção para informações sensíveis.

---

# 🔐 Segurança

O projeto utiliza recursos de segurança no backend e proteção de rotas no frontend.

A arquitetura atual inclui:

- Spring Security;
- JWT;
- OAuth2 Resource Server;
- autenticação no frontend;
- rotas privadas;
- controle de sessão;
- auditoria.

### Atenção para desenvolvimento

Nunca publique no Git:

- senhas;
- tokens JWT;
- chaves secretas;
- credenciais do Supabase;
- credenciais do DNA;
- informações privadas do servidor.

As configurações de produção devem ser fornecidas de maneira segura pelo ambiente onde o backend é executado.

---

# 🚀 Execução local

## Pré-requisitos

### Frontend

- Node.js
- npm

### Backend

- Java 17 ou superior
- Maven ou Maven Wrapper
- acesso às dependências do projeto
- acesso aos bancos necessários para executar os fluxos que dependem deles

## Frontend

```bash
cd frontend-web
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Preview:

```bash
npm run preview
```

## Backend

No Windows:

```powershell
cd backend-api/cotacao/cotacao
.\mvnw.cmd spring-boot:run
```

Para gerar o JAR:

```powershell
.\mvnw.cmd clean package
```

O JAR gerado é o artefato utilizado no ambiente de produção atual, onde o backend é executado no servidor da drogaria por um serviço do Windows.

---

# 🌐 Deploy atual

## Frontend — Netlify

O frontend React/Vite é hospedado no **Netlify**.

Fluxo conceitual:

```text
Código frontend
      ↓
Build Vite
      ↓
Arquivos estáticos
      ↓
Netlify
```

O frontend consome a API disponibilizada pelo backend.

## Backend — servidor da drogaria

O backend não depende de hospedagem de aplicação Java externa para o ambiente atual.

O processo de produção é:

```text
Código Java
   ↓
Maven package
   ↓
JAR Spring Boot
   ↓
Servidor da Drogaria
   ↓
Serviço do Windows
   ↓
Execução diária do backend
```

O serviço do Windows é responsável por manter o processo de execução conforme a rotina definida no ambiente da drogaria.

## Banco — Supabase

O PostgreSQL utilizado pela aplicação fica hospedado no Supabase.

Assim, a separação atual de infraestrutura é:

```text
Netlify
  └── Frontend

Servidor da Drogaria
  └── Backend JAR
  └── Serviço Windows
  └── Acesso ao DNA / Firebird

Supabase
  └── PostgreSQL
```

---

# 📚 API e documentação

O backend possui integração com **Springdoc OpenAPI**, permitindo disponibilizar documentação da API conforme a configuração do ambiente.

Ao executar localmente, verifique a configuração do projeto para acessar a documentação Swagger/OpenAPI disponibilizada pelo Springdoc.

---

# 🧪 Testes e validação

O backend possui dependências de teste do Spring Boot para JPA e Web MVC.

O frontend possui ESLint configurado.

Antes de publicar alterações relevantes, recomenda-se validar:

1. compilação/build do backend;
2. build do frontend;
3. lint do frontend;
4. fluxo diretamente afetado;
5. integração frontend → API;
6. persistência no PostgreSQL quando aplicável;
7. integração de leitura com o DNA quando aplicável.

---

# 📁 Estrutura do repositório

```text
Cotacao-Drogaria/
├── backend-api/
│   └── cotacao/
│       └── cotacao/
│           ├── pom.xml
│           ├── mvnw
│           ├── mvnw.cmd
│           ├── Dockerfile
│           └── src/
│
├── frontend-web/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
├── CLAUDE.md
├── README.md
└── .gitignore
```

---

# 🤖 Desenvolvimento assistido por IA

O projeto possui um `CLAUDE.md` na raiz do repositório com regras específicas para desenvolvimento assistido por IA.

Essas regras priorizam:

- alterações pontuais;
- economia de contexto;
- leitura somente dos arquivos relacionados;
- preservação das funcionalidades existentes;
- diagnóstico antes da implementação;
- correção da causa em vez do sintoma;
- compatibilidade entre frontend e backend;
- segurança;
- validação das alterações.

### Regra recomendada

Antes de alterar qualquer funcionalidade existente:

```text
Problema
   ↓
Localizar código relacionado
   ↓
Entender fluxo atual
   ↓
Identificar causa
   ↓
Menor alteração possível
   ↓
Validar
```

O `README.md` descreve o contexto geral do sistema; o `CLAUDE.md` contém as regras operacionais que devem ser seguidas durante alterações no código.

---

# 🛠️ Princípios de manutenção

O sistema está em evolução contínua e possui funcionalidades de negócio já utilizadas na operação.

Por isso, alterações devem seguir esta prioridade:

```text
Correção
   >
Estabilidade
   >
Compatibilidade
   >
Menor alteração
   >
Performance
   >
Refatoração
```

Uma correção não deve ser transformada em uma refatoração geral sem necessidade.

---

# 👨‍💻 Autor

**Gabriel Torres**

GitHub: [@gabTorres2003](https://github.com/gabTorres2003)

Repositório: [Cotacao-Drogaria](https://github.com/gabTorres2003/Cotacao-Drogaria)

---

## 📄 Licença

Este projeto é de uso privado da operação da Drogaria Torres Farma. Caso seja necessária uma definição formal de licença para distribuição ou uso externo, ela deve ser adicionada ao repositório.
