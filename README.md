# 💊 Sistema de Cotação Inteligente - Drogaria Torres Farma

![Status do Projeto](https://img.shields.io/badge/Status-Em%20Desenvolvimento-blue)
![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB?logo=react&logoColor=black)
![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%20%7C%20Java-6DB33F?logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Supabase-4169E1?logo=postgresql&logoColor=white)

Um sistema completo (Web App) desenvolvido para automatizar, organizar e otimizar o processo de cotação de medicamentos e produtos de farmácia com múltiplos fornecedores. Este projeto visa reduzir o tempo operacional, evitar rupturas de estoque e garantir a escolha sempre da melhor oferta disponível no mercado.

---

## 🚀 Funcionalidades Principais

* 📊 **Dashboard Estratégico:** Visão geral do funil de cotações (Total, Em Aberto, Pendentes e Finalizadas).
* 🔗 **Integração com WhatsApp:** Envio de links de cotação diretamente para os fornecedores, com suporte a envios individuais ou em massa via Lista de Transmissão.
* 🔒 **Portal do Fornecedor:** Ambiente seguro onde o fornecedor faz login, visualiza os itens solicitados, preenche os preços unitários, informa a quantidade disponível e sinaliza itens em falta.
* 🏆 **Comparativo Automático:** O sistema analisa todas as respostas, ignora envios duplicados, trata itens em falta e destaca matematicamente a melhor oferta (menor preço válido) para cada produto.
* 📈 **Relatórios Analíticos:**
    * Histórico de Última Compra.
    * Relatório de Ruptura (produtos frequentemente em falta).
    * Ranking de Competitividade de Fornecedores.
* 📄 **Geração de Pedidos:** Exportação automática dos pedidos de compra divididos por fornecedor em formato PDF.
* 👥 **Gestão de Fornecedores:** Cadastro e gerenciamento de contatos e credenciais de acesso.

---

## 💻 Tecnologias Utilizadas

### Frontend
* **[React.js](https://reactjs.org/)** com **[Vite](https://vitejs.dev/)** para alta performance.
* **[React Router Dom](https://reactrouter.com/)** para roteamento de páginas protegidas e públicas.
* **[Axios](https://axios-http.com/)** para consumo da API RESTful.
* **[Lucide React](https://lucide.dev/)** para iconografia moderna.
* **[jsPDF](https://parall.ax/products/jspdf)** & **[jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)** para geração de relatórios e faturas.

### Backend
* **[Java 17+](https://adoptium.net/)**
* **[Spring Boot 3](https://spring.io/projects/spring-boot)** (Web, Data JPA, Security).
* **[Hibernate](https://hibernate.org/)** para mapeamento objeto-relacional (ORM).
* **[PostgreSQL](https://www.postgresql.org/)** hospedado no **[Supabase](https://supabase.com/)**.

---

## 📸 Demonstração do Sistema

### Visão do Comprador (Administrador)
| Login | Dashboard |
| :---: | :---: |
| ![Login](frontend-web/public/assets/tela-login.PNG) | ![Dashboard](frontend-web/public/assets/dashboard.PNG) |
| *Tela de login principal do Dashbord* | *Painel de informações e análises das cotações* |

| Comparativo de Preços | Gerador de Pedido |
| :---: | :---: |
| ![Comparativo](frontend-web/public/assets/detalhes.PNG) | ![Gerar Pedido](frontend-web/public/assets/gerar-pedido.PNG) |
| *Análise inteligente das melhores ofertas* | *Gerador de pedidos dos produtos com os melhores preços* |

| Relatório Ranking | Relatório de Ruptura | Histórico de Preços
| :---: | :---: | :---: |
| ![Relatório Ranking](frontend-web/public/assets/ranking-comp.PNG) | ![Relatório de Ruptura](frontend-web/public/assets/ruptura.PNG) | ![Histórico de Preços](frontend-web/public/assets/historico-preco.PNG) |
| *Ranking de melhores fornecedores* | *Relatório de alerta dos produtos com mais registros de falta* | *Histórico de preços dos produtos e comparação com a compra atual* |

| Envio do Link do Whatsapp | 
| :---: | 
| ![WhatsApp](frontend-web/public/assets/envio-links.PNG) |
| | *Geração de link para Lista de Transmissão* |

| Cadastro Fornecedor | Painel Fornecedores |
| :---: | :---: |
| ![Cadastro Fornecedor](frontend-web/public/assets/editar-fornecedor.PNG) | ![Painel Fornecedores](frontend-web/public/assets/painel-fornecedores.PNG) |
| | *Cadastro dos fornecedores* | *Painel dos fornecedores cadastrados e contatos* |


### Visão do Fornecedor
| Tela de Login Segura | Preenchimento da Cotação |
| :---: | :---: |
| ![Login Fornecedor](frontend-web/public/assets/login-fornecedor.PNG) | ![Resposta Fornecedor](frontend-web/public/assets/resposta-cotacao.PNG) |
| *Acesso restrito por fornecedor* | *Campos para preço, quantidade e alerta de falta* |

---

Autor: [Gabriel-Torres](https://github.com/gabTorres2003)