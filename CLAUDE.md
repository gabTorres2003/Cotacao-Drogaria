# CLAUDE.md

## 1. Visão geral

Este projeto é um sistema de Gestão de Compras e Cotações para uma rede de farmácias.

O sistema conecta compradores da farmácia a fornecedores/distribuidoras externas.

A aplicação possui frontend em React + Vite e backend em Java + Spring Boot.

---

## 2. Stack tecnológica

### Frontend

* React
* Vite
* JavaScript/JSX
* Axios
* Hooks nativos do React
* CSS
* Componentização React

### Backend

* Java 17+
* Spring Boot
* Spring Data JPA
* Hibernate
* REST API
* Arquitetura em camadas:

  * Controller
  * Service
  * Repository
  * Entity/Model
  * DTO quando aplicável

### Banco de dados

* PostgreSQL
* SQL
* Supabase quando aplicável

---

## 3. Regra principal: alterações pontuais

NÃO altere partes do sistema que não estejam relacionadas ao problema solicitado.

Antes de modificar qualquer arquivo:

1. Entenda o problema.
2. Localize a causa.
3. Identifique os arquivos envolvidos.
4. Verifique as dependências entre frontend e backend.
5. Faça a menor alteração possível.
6. Preserve o comportamento existente.
7. Execute testes/build quando possível.

Não faça refatorações gerais enquanto estiver corrigindo um problema específico.

Não altere arquitetura sem autorização explícita.

Não substitua bibliotecas ou tecnologias existentes sem autorização.

---

## 4. Fluxo obrigatório para correções

Quando receber uma solicitação de correção:

### Etapa 1 — Diagnóstico

Primeiro investigue o código relacionado.

Procure:

* componentes React envolvidos;
* hooks;
* chamadas Axios;
* endpoints;
* Controllers;
* Services;
* Repositories;
* Entities;
* DTOs;
* queries;
* validações;
* logs e mensagens de erro.

### Etapa 2 — Explicação

Antes de fazer uma alteração complexa, explique:

* qual é a causa;
* quais arquivos serão alterados;
* qual será a solução.

Para alterações simples e claramente localizadas, pode executar diretamente.

### Etapa 3 — Implementação

Faça somente as alterações necessárias.

Evite modificar arquivos sem relação direta com o problema.

### Etapa 4 — Validação

Depois da alteração:

* verifique erros de compilação;
* execute testes disponíveis;
* execute build quando apropriado;
* verifique possíveis erros de lint;
* confirme se frontend e backend continuam compatíveis.

---

## 5. Frontend React

Respeite a arquitetura existente.

Não transforme componentes em componentes complexos desnecessariamente.

Preserve:

* Hooks existentes;
* gerenciamento de estado;
* chamadas Axios;
* nomes de endpoints;
* contratos da API;
* estrutura visual existente.

Ao corrigir atualização de dados após uma operação:

1. Verifique se a requisição foi concluída.
2. Verifique a resposta da API.
3. Verifique atualização do estado React.
4. Verifique se existe necessidade de refetch.
5. Não use reload da página como solução definitiva sem autorização.

Evite `window.location.reload()` para corrigir problemas de atualização de estado.

---

## 6. Backend Spring Boot

Respeite a separação:

Controller → Service → Repository → Database

Controllers devem cuidar principalmente da camada HTTP.

Regras de negócio devem permanecer no Service.

Acesso ao banco deve permanecer no Repository.

Evite colocar regra de negócio diretamente no Controller.

Não faça queries SQL/JPA desnecessárias.

Preserve os endpoints existentes, salvo quando a solicitação exigir alteração.

---

## 7. API

Antes de alterar um endpoint, procure todos os locais onde ele é utilizado.

Verifique:

* frontend;
* outros Controllers;
* Services;
* integrações;
* DTOs;
* documentação;
* testes.

Não altere nomes ou formatos de resposta sem necessidade.

---

## 8. Banco de dados

Não altere estrutura do banco automaticamente.

Antes de modificar:

* tabelas;
* colunas;
* índices;
* constraints;
* relacionamentos;

explique a necessidade e o impacto.

Nunca apague dados.

Nunca execute comandos destrutivos sem confirmação explícita.

---

## 9. Segurança

Nunca exponha:

* senhas;
* tokens;
* chaves de API;
* credenciais do banco;
* secrets;
* arquivos `.env`.

Não coloque credenciais diretamente no código.

Não faça commit de secrets.

---

## 10. Git

Antes de alterações importantes, verifique:

```bash
git status
```

Não descarte alterações existentes do usuário.

Não execute:

```bash
git reset --hard
```

ou comandos destrutivos semelhantes sem autorização explícita.

Não faça commit automaticamente, a menos que seja solicitado.

---

## 11. Regra para bugs

Quando o usuário informar um bug, não assuma imediatamente a causa.

Investigue primeiro.

Exemplo:

Usuário:
"Depois de salvar, a tabela não atualiza."

Não simplesmente adicione um reload.

Investigue:

* resposta da API;
* atualização do estado;
* lista armazenada no estado;
* função de carregamento;
* ciclo de vida do componente;
* dependências dos Hooks;
* endpoint utilizado.

A solução deve corrigir a causa, não apenas mascarar o problema.

---

## 12. Regra para mudanças visuais

Quando solicitado um ajuste visual:

* altere somente o componente necessário;
* preserve responsividade;
* preserve identidade visual;
* preserve funcionalidades;
* não reescreva páginas inteiras sem necessidade.

Não substitua toda a estrutura CSS para resolver um pequeno problema visual.

---

## 13. Regra de comunicação

Se a solicitação for ambígua, investigue o código antes de pedir informações que possam ser descobertas no projeto.

Ao finalizar uma alteração, informe:

1. O que foi alterado.
2. Arquivos modificados.
3. Problema encontrado.
4. Solução aplicada.
5. Testes/build executados.
6. Eventuais pontos que precisam de atenção.

---

## 14. Regra mais importante

PRIORIZE ESTABILIDADE.

O sistema já possui funcionalidades existentes.

Uma correção não deve criar novos problemas.

Sempre prefira:

"menor alteração necessária para resolver o problema"

em vez de:

"reescrever ou melhorar tudo relacionado ao problema".
