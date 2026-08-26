# CLAUDE.md

## 1. Projeto

Este projeto é o **Cotacao-Drogaria**, sistema de Gestão de Compras e
Cotações para uma rede de farmácias.

O sistema conecta compradores da farmácia a fornecedores/distribuidoras
externas.

Estrutura principal atual:

-   `backend-api/cotacao/` --- Backend Java/Spring Boot
-   `frontend-web/` --- Frontend React/Vite

------------------------------------------------------------------------

## 2. Stack

### Frontend

-   React
-   Vite
-   JavaScript/JSX
-   Axios
-   Hooks nativos do React
-   CSS

### Backend

-   Java 17+
-   Spring Boot
-   Spring Data JPA
-   Hibernate
-   REST API
-   Arquitetura em camadas:
    -   Controller
    -   Service
    -   Repository
    -   Model/Entity
    -   DTO

### Banco

-   PostgreSQL
-   SQL
-   Supabase quando aplicável

------------------------------------------------------------------------

# 3. REGRA PRINCIPAL: ALTERAÇÕES PONTUAIS

O sistema possui funcionalidades existentes e deve ser tratado como um
sistema em produção.

**Priorize estabilidade e a menor alteração necessária.**

Ao receber uma tarefa:

1.  Entenda o problema.
2.  Localize somente a área relacionada.
3.  Identifique a causa antes de alterar.
4.  Faça a menor mudança possível.
5.  Preserve comportamento existente.
6.  Valide a alteração.
7.  Não faça refatorações não solicitadas.

### Nunca faça sem autorização

-   Refatoração ampla.
-   Mudança de arquitetura.
-   Troca de bibliotecas.
-   Renomeação em massa.
-   Alteração de endpoints sem necessidade.
-   Alteração de banco estrutural.
-   Remoção de funcionalidades existentes.

------------------------------------------------------------------------

# 4. ECONOMIA DE CONTEXTO --- MUITO IMPORTANTE

O projeto é grande. **Evite consumir contexto desnecessariamente.**

## Regra de investigação

Não leia arquivos inteiros por padrão.

Use este fluxo:

``` text
PROBLEMA
   ↓
BUSCAR símbolo/termo/endpoint
   ↓
IDENTIFICAR arquivos relevantes
   ↓
LER somente os trechos necessários
   ↓
ENTENDER fluxo
   ↓
ALTERAR
   ↓
VALIDAR
```

### Preferir

-   Buscar por nome de componente.
-   Buscar por método.
-   Buscar por classe.
-   Buscar por endpoint.
-   Buscar por variável.
-   Buscar por mensagem de erro.
-   Ler somente o contexto necessário ao redor do resultado.

### Evitar

-   Listar centenas de arquivos.
-   Ler arquivos completos sem necessidade.
-   Repetir leitura de arquivos já analisados.
-   Reexecutar comandos cujo resultado já está disponível.
-   Exibir logs enormes.
-   Investigar áreas não relacionadas à tarefa.

### Ao usar terminal

Prefira saídas limitadas:

``` bash
tail -50 arquivo.log
```

``` bash
grep -i "error" arquivo.log | tail -30
```

Em buscas de arquivos, filtre pelo domínio da tarefa sempre que
possível.

------------------------------------------------------------------------

# 5. FLUXO DE TRABALHO

Para tarefas que envolvam código:

## Etapa 1 --- Diagnóstico

Primeiro localize:

-   componente React;
-   Hook/estado;
-   chamada Axios;
-   endpoint;
-   Controller;
-   Service;
-   Repository;
-   DTO;
-   Entity/Model;
-   query;
-   validação.

Não altere código durante o diagnóstico, salvo se o usuário pedir
explicitamente implementação imediata.

## Etapa 2 --- Plano

Quando a alteração tiver impacto relevante, informe de forma objetiva:

-   causa encontrada;
-   arquivos que serão alterados;
-   solução proposta;
-   possíveis impactos.

Aguarde autorização quando o usuário tiver solicitado planejamento antes
da implementação.

## Etapa 3 --- Implementação

Faça somente a alteração necessária.

Não refatore código adjacente apenas porque encontrou algo que poderia
ser "melhorado".

## Etapa 4 --- Validação

Depois:

-   verifique sintaxe;
-   valide imports;
-   verifique contratos frontend/backend;
-   execute testes disponíveis;
-   execute build apropriado quando viável.

Se um comando de build demorar ou apresentar timeout, não repita
indefinidamente. Informe o problema e use uma validação alternativa
quando possível.

## Etapa 5 --- Resumo

Ao finalizar, responda de forma curta:

1.  Causa.
2.  Solução.
3.  Arquivos alterados.
4.  Validação realizada.
5.  Pendências, se houver.

------------------------------------------------------------------------

# 6. FRONTEND --- REACT + VITE

Respeite a estrutura existente.

Preserve:

-   componentes;
-   Hooks;
-   estado;
-   chamadas Axios;
-   endpoints;
-   contratos da API;
-   estilos;
-   comportamento visual.

## Problemas de atualização da interface

Quando algo "não atualiza depois de salvar", não use imediatamente:

``` javascript
window.location.reload()
```

Investigue:

1.  requisição;
2.  resposta da API;
3.  atualização do estado;
4.  função de carregamento;
5.  dependências dos Hooks;
6.  dados retornados;
7.  necessidade de refetch.

Prefira corrigir o estado/fluxo de dados.

Não use reload como solução definitiva sem autorização explícita.

## Alterações visuais

Para mudanças visuais:

-   altere somente o componente necessário;
-   preserve responsividade;
-   preserve identidade visual;
-   preserve funcionalidades;
-   evite reescrever páginas inteiras.

------------------------------------------------------------------------

# 7. BACKEND --- SPRING BOOT

Preserve a separação:

``` text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

### Controller

Responsável principalmente por:

-   HTTP;
-   parâmetros;
-   autenticação/autorização quando aplicável;
-   retorno de respostas.

### Service

Deve concentrar:

-   regras de negócio;
-   processamento;
-   validações de domínio;
-   transações quando aplicável.

### Repository

Responsável por:

-   acesso ao banco;
-   queries;
-   persistência.

Não mova regra de negócio para o Controller apenas para resolver
rapidamente um problema.

------------------------------------------------------------------------

# 8. API

Antes de alterar um endpoint, procure seus consumidores.

Verifique:

-   frontend;
-   outros Controllers;
-   Services;
-   DTOs;
-   integrações;
-   testes.

Preserve:

-   método HTTP;
-   URL;
-   nomes;
-   estrutura da resposta;
-   códigos HTTP;

sempre que a tarefa não exigir mudança.

Se for necessário alterar o contrato, identifique claramente frontend e
backend afetados.

------------------------------------------------------------------------

# 9. BANCO DE DADOS

Não altere estrutura do banco automaticamente.

Antes de modificar:

-   tabelas;
-   colunas;
-   índices;
-   constraints;
-   relacionamentos;
-   migrations;

explique a necessidade e o impacto.

### Nunca

-   apagar dados;
-   executar comandos destrutivos;
-   remover colunas;
-   truncar tabelas;

sem autorização explícita.

Prefira alterações retrocompatíveis quando possível.

------------------------------------------------------------------------

# 10. BUGS

Não assuma a causa do bug.

Exemplo:

> "A tabela não atualiza depois de salvar."

Não faça imediatamente um reload.

Investigue o fluxo:

``` text
UI
 ↓
evento
 ↓
estado
 ↓
Axios
 ↓
API
 ↓
Service
 ↓
Repository
 ↓
Banco
 ↓
resposta
 ↓
estado React
 ↓
UI
```

Corrija a causa, não apenas o sintoma.

------------------------------------------------------------------------

# 11. SEGURANÇA

Nunca exponha ou copie para respostas:

-   senhas;
-   tokens;
-   API keys;
-   credenciais;
-   secrets;
-   dados sensíveis.

Nunca coloque credenciais diretamente no código.

Não crie ou altere `.env` com valores secretos sem necessidade.

Não faça commit de secrets.

------------------------------------------------------------------------

# 12. GIT

Antes de alterações importantes:

``` bash
git status
```

Preserve alterações existentes do usuário.

Antes de fazer commit, confira:

``` bash
git diff
```

Não use comandos destrutivos como:

``` bash
git reset --hard
```

sem autorização explícita.

Não faça commit automaticamente quando o usuário informou que prefere
usar GitHub Desktop.

Se o usuário pedir commit, primeiro verifique o diff e o status.

------------------------------------------------------------------------

# 13. BUILD E TESTES

Antes de executar um build:

1.  Identifique qual parte foi alterada.
2.  Prefira a validação mais específica possível.
3.  Evite builds repetidos sem motivo.
4.  Se houver timeout, não repita indefinidamente.

### Frontend

Quando `node_modules` estiver disponível, use os scripts definidos em
`package.json`.

### Backend

Use o Maven Wrapper quando disponível:

``` bash
./mvnw
```

No Windows, quando aplicável:

``` powershell
.\mvnw
```

Não considere "build não executado" como "build aprovado".

Informe claramente quando uma validação não pôde ser executada.

------------------------------------------------------------------------

# 14. CONFERÊNCIA DE PEDIDOS

A funcionalidade de Conferência de Pedidos possui fluxo de entrega e
conferência de itens.

Existe suporte a entrega parcial, permitindo que um pedido seja
continuado posteriormente quando volumes forem recebidos em momentos
diferentes.

Ao alterar essa área, preserve especialmente:

-   quantidades já recebidas;
-   quantidades da nova NF;
-   status do pedido;
-   status dos itens;
-   continuidade da conferência;
-   regras de finalização;
-   compatibilidade com o fluxo existente.

Não altere regras de negócio dessa funcionalidade sem verificar o fluxo
completo frontend → backend.

------------------------------------------------------------------------

# 15. REGRA DE COMPATIBILIDADE

Ao alterar uma funcionalidade existente:

1.  Identifique como ela funciona atualmente.
2.  Identifique consumidores.
3.  Preserve comportamento anterior quando possível.
4.  Evite quebrar fluxos legados.
5.  Se uma mudança exigir comportamento incompatível, informe antes.

Uma solução que funciona no novo caso, mas quebra funcionalidades
existentes, não deve ser considerada concluída.

------------------------------------------------------------------------

# 16. QUANDO O USUÁRIO PEDIR PLANEJAMENTO

Se o usuário disser:

> "Primeiro planeje."

Então:

1.  Investigue.
2.  Não altere código.
3.  Apresente plano.
4.  Liste decisões que precisam do usuário.
5.  Aguarde autorização.

Não implemente antecipadamente.

------------------------------------------------------------------------

# 17. QUANDO O USUÁRIO PEDIR IMPLEMENTAÇÃO DIRETA

Se o pedido estiver suficientemente claro:

1.  Localize os arquivos necessários.
2.  Faça a menor alteração.
3.  Valide.
4.  Informe o resultado.

Não peça confirmação desnecessária sobre informações que podem ser
descobertas no código.

------------------------------------------------------------------------

# 18. COMUNICAÇÃO

Seja objetivo.

Evite explicar novamente informações já conhecidas na sessão.

Não repita grandes blocos de código sem necessidade.

Para tarefas simples, uma resposta curta é suficiente.

Para alterações complexas, informe:

``` text
Causa:
...

Alteração:
...

Arquivos:
...

Validação:
...

Pendências:
...
```

------------------------------------------------------------------------

# 19. PRINCÍPIO FINAL

Sempre priorize:

``` text
CORREÇÃO
> ESTABILIDADE
> COMPATIBILIDADE
> MENOR ALTERAÇÃO
> PERFORMANCE
> REFACTOR
```

Não transforme uma correção pontual em uma refatoração geral.

**O objetivo é resolver o problema solicitado com o menor impacto
possível no restante do sistema.**

### Continuidade entre modelos/sessões

O projeto pode ser desenvolvido por diferentes modelos em sessões diferentes.

Antes de continuar um trabalho iniciado por outro modelo:

1. ler CLAUDE.md;
2. ler README.md;
3. executar git status;
4. executar git diff;
5. identificar alterações já realizadas;
6. identificar o último item concluído;
7. não repetir alterações;
8. não reverter alterações existentes sem justificativa;
9. continuar a partir do estado real do working tree.

O estado do código e do git diff deve ser considerado a fonte de verdade para determinar o progresso da implementação.

Quando houver dúvida sobre uma alteração parcialmente implementada, investigar antes de modificar.
