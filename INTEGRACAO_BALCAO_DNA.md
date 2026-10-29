# Integração Balcão → Cotação → DNA

Consulta de leitura de produtos do DNA (Firebird) pelo sistema de
Atendimento (Balcão), reutilizando a conexão já existente no backend do
Cotação. A primeira entrega foi **somente leitura de produto por código
interno ou código de barras**; depois foi adicionada a **pesquisa por
descrição ou princípio ativo** (seção abaixo). Não há consulta de clientes
nesta versão.

## Arquitetura

```text
Navegador (Balcão / Netlify)
        │  POST (Supabase Edge Function `consulta-dna`)
        ▼
Supabase do Balcão — Edge Function (server-side)
        │  POST /auth/login + GET /api/integracao-balcao/produtos (Bearer JWT)
        ▼
Backend Cotação (servidor da drogaria)
        │  JdbcTemplate somente leitura (dnaNamedJdbcTemplate)
        ▼
DNA / Firebird — tabela PRODUTOS
```

- O navegador **não** acessa o Firebird e **não** recebe credenciais do
  Cotação nem do DNA.
- Nenhuma conexão nova com o DNA foi criada: o endpoint reutiliza o
  `dnaDataSource`/`dnaNamedJdbcTemplate` de `DnaDatabaseConfig`.
- Nenhuma tabela, coluna, policy ou migration foi criada/alterada.

## Endpoint

```http
GET /api/integracao-balcao/produtos?q=100460
Authorization: Bearer <JWT do Cotação>
```

- `q`: código interno (inteiro) ou código de barras (até 20 caracteres
  alfanuméricos).
- A busca é exata. Se o mesmo código de barras existir em mais de um
  registro, prioriza o produto ativo e depois o menor `CODIGO`, sempre com
  um único resultado (`SELECT FIRST 1`).

Resposta `200`:

```json
{
  "codigo": 100460,
  "codbarras": "7891234567890",
  "descricao": "DIPIRONA 500MG 10 COMPRIMIDOS",
  "inativo": "N",
  "origem": "DNA"
}
```

| Status | Significado |
|---|---|
| `200` | Produto encontrado |
| `400` | `q` vazio ou com mais de 20 caracteres |
| `401`/`403` | Sem JWT válido ou perfil sem permissão |
| `404` | Produto não encontrado no DNA |
| `503` | DNA indisponível (conexão/erro de consulta) |

### Pesquisa por descrição ou princípio ativo

```http
GET /api/integracao-balcao/produtos/pesquisa?q=dipirona&tipo=descricao
Authorization: Bearer <JWT do Cotação>
```

- `q`: termo de 2 a 40 caracteres (normalizado no backend).
- `tipo`: `descricao` (padrão) ou `principio`.
- A resposta é sempre `200` com lista curta; ausência de resultados é
  `resultados: []` (não é `404`).
- O limite é aplicado no DNA (`SELECT FIRST`), com `truncado: true` quando
  existem mais itens do que o limite retornado.

Resposta `200`:

```json
{
  "resultados": [
    {
      "codigo": 100460,
      "codbarras": "7891234567890",
      "descricao": "DIPIRONA 500MG 10 COMPRIMIDOS",
      "principioAtivo": "DIPIRONA",
      "apresentacao": "COMPRIMIDO",
      "unidade": "CX",
      "fabricante": "FABRICANTE X",
      "inativo": "N",
      "origem": "DNA"
    }
  ],
  "truncado": false,
  "limite": 20
}
```

Critérios de ordenação (todos executados no DNA):

1. descrição/princípio exato;
2. início do texto (`STARTING WITH`);
3. início de palavra;
4. trecho parcial (`LIKE`);
5. produto ativo antes do inativo;
6. descrição como desempate.

O termo é normalizado no backend (maiúsculas, sem acentos e com espaços
colapsados) e enviado como parâmetro vinculado (`:exato`, `:prefixo`,
`:palavra`, `:contem`). Curingas `%`, `_` e `\` digitados pelo usuário são
escapados. Não há SQL concatenado com o texto pesquisado.

| Status | Significado |
|---|---|
| `200` | Pesquisa executada (com ou sem resultados) |
| `400` | Termo/tipo inválido |
| `401`/`403` | Sem JWT válido ou perfil sem permissão |
| `503` | DNA indisponível (conexão/erro de consulta) |

O frontend do Cotação consome a mesma lógica em
`GET /api/produtos/pesquisar` (autenticado). A busca por nome/princípio ativo
está disponível em **todos** os pontos do Cotação que consultam o DNA:

| Fluxo | Arquivo | Busca por código | Busca por nome/princípio |
|---|---|---|---|
| Produto recebido (conferência) | `components/IdentificacaoProdutoRecebido.jsx` | Sim | Sim |
| Produto não solicitado | `components/ModalProdutoNaoSolicitado.jsx` | Sim | Sim |
| Pedido avulso | `components/pedidos/modais/ModalPedidoManual.jsx` | Sim | Sim |
| Cotação manual | `components/cotacao/modais/ModalNovaCotacaoManual.jsx` | Sim | Sim |
| Cotação por lote de códigos | `components/cotacao/modais/ModalCriarCotacaoDna.jsx` | Sim | Sim |
| Produto extra na cotação | `components/cotacao/modais/ModalProdutoExtra.jsx` | Sim | Sim |
| Adicionar/trocar item do pedido | `pages/PedidoDetalhes.jsx` | Sim | Sim |

O componente compartilhado `components/PesquisaProdutoDna.jsx` concentra a
UI e as regras de consulta (tipo descrição/princípio, estados de carregamento,
erro, vazio e truncamento, bloqueio de `Enter` repetido e seleção apenas por
clique). Cada fluxo só implementa `selecionarProdutoPorNome`, que preenche o
campo de descrição e o identificador (código DNA ou EAN, conforme o fluxo)
sem alterar quantidades, vínculos ou etapas seguintes.

O `ModalCriarCotacaoDna` está órfão (não é importado por nenhuma página), mas
foi atualizado por completude; nele a seleção por nome apenas acrescenta o
item à lista processada, com deduplicação por código + descrição.

### Campos deliberadamente não expostos

`PRECOCUSTO`, `PRECOMEDIO`, `PRECOVENDA`, `PRECOPROMOCAO` e `QUANTIDADE`
(estoque) existem na tabela `PRODUTOS` e já são usados por outras consultas
do Cotação, mas **não** fazem parte desta resposta. O gateway do Balcão
ainda não é uma fronteira de autenticação forte (ver "Limitações"), então
a primeira versão expõe apenas identificação e descrição do produto.
Preço/estoque exigem decisão de negócio e autenticação mais forte antes de
serem liberados.

## Fonte dos dados

A consulta lê o DNA ao vivo pelo `dnaNamedJdbcTemplate`. Ela **não** usa
`public.produtos` (tabela de cache no Supabase do Cotação, que guarda
`codigo`, `codbarras`, `descricao`, `inativo`, `precovenda` e `quantidade`)
nem faz fallback para o Supabase: se o DNA não responder, a resposta é
`503`; se o produto não existir no DNA, é `404`.

A pesquisa textual usa somente colunas confirmadas na tabela `PRODUTOS`
(`DESCRICAO`, `FARPRINCIPIOATIVO`, `FARAPRESENTACAO`, `UNIDADE`,
`CODFABRICANTE`, `INATIVO`, `CODIGO`, `CODBARRAS`) e o nome do fabricante
em `FORNECEDORES.RAZAO`. A confirmação foi feita no metadado do Firebird
2.5.9 da instalação local do DNA (`RDB$RELATION_FIELDS`), sem presumir
estrutura.

## Autenticação e autorização

- O backend continua usando o JWT HS256 emitido por `POST /auth/login`
  (Spring Security / OAuth2 Resource Server). Nenhum mecanismo existente
  foi desativado.
- `SecurityConfigurations` exige `ROLE_ADMIN` ou `ROLE_CONFERENTE` em
  `GET /api/integracao-balcao/**`.
- No banco do Cotação, `public.usuarios.perfil` tem CHECK que aceita apenas
  `ADMIN` e `CONFERENTE`; o usuário de integração precisa ter um desses dois
  perfis.
- O Balcão não compartilha a identidade do usuário final com o Cotação. A
  Edge Function usa um usuário de integração dedicado, cujas credenciais
  ficam nos secrets da função (`COTACAO_INTEGRACAO_USUARIO`,
  `COTACAO_INTEGRACAO_PIN`). Nenhum token ou senha vai para o navegador.
- O endpoint não é público: está fora das rotas `permitAll` existentes e
  não foi adicionada origem de CORS para o Balcão (o tráfego é
  servidor-a-servidor).

## Configuração

### Backend do Cotação

Nenhuma variável nova. Usa as configurações existentes:

```text
dna.datasource.url
dna.datasource.username
dna.datasource.password
dna.datasource.driver-class-name
api.security.token.secret
```

> Os valores não são documentados aqui. O arquivo
> `src/main/resources/application.properties` está versionado no Git e
> contém credenciais reais; isso é um risco conhecido (ver "Limitações").

### Edge Function do Balcão (`consulta-dna`)

Secrets necessários (Supabase → Edge Functions → Secrets):

```text
COTACAO_API_URL             # URL base do backend do Cotação, ex.: https://<host>
COTACAO_INTEGRACAO_USUARIO  # usuário interno do Cotação com perfil ADMIN/CONFERENTE
COTACAO_INTEGRACAO_PIN      # PIN desse usuário
```

`SUPABASE_URL` e `SERVICE_ROLE_KEY` já são fornecidos pelo runtime.

Deploy:

```bash
npx supabase functions deploy consulta-dna --project-ref uddmenewrluxyewdyfxe
```

> Se o navegador acusar falha de CORS no preflight, confirme primeiro se a
> função está publicada: um `OPTIONS` que retorna `404 NOT_FOUND` significa
> função ausente nesse projeto (e o navegador reporta como CORS). Procedimento
> completo em `atendimento-torres-farma/INTEGRACAO_DNA_COTACAO.md`.

## Execução local

1. Backend do Cotação:

   ```powershell
   cd backend-api/cotacao/cotacao
   .\mvnw.cmd spring-boot:run
   ```

2. Edge Function (com as variáveis acima em `supabase/functions/.env` local
   ou `supabase secrets set`):

   ```bash
   supabase functions serve consulta-dna
   ```

3. Teste direto do endpoint (com um JWT válido):

   ```powershell
   curl.exe -H "Authorization: Bearer <token>" "http://localhost:8080/api/integracao-balcao/produtos?q=7891317026554"
   ```

## Testes executados

```text
.\mvnw.cmd -B -ntp test
Tests run: 15, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS

npm run build (frontend-web)
vite v5.4.21 -> OK (1942 módulos)
```

Cobertura do teste `ConsultaDnaBalcaoServiceTest`:

- produto encontrado com `origem = DNA`;
- produto não encontrado (lista vazia);
- termo vazio não consulta o DNA;
- falha de conexão vira `DnaIndisponivelException` (HTTP 503 no controller).

Cobertura do teste `PesquisaProdutoDnaServiceTest`:

- normalização de maiúsculas, acentos e espaços extras;
- variações aceitas para `tipo` (`descricao`, `principio`, `principio_ativo`);
- tipo inválido rejeitado;
- parâmetros `exato`/`prefixo`/`palavra`/`contem` corretos na busca por descrição;
- busca por princípio ativo usando `FARPRINCIPIOATIVO`;
- truncamento em 20 resultados com `truncado = true`;
- escape de `%`/`_`/`\` nos padrões `LIKE`;
- termo curto/longo rejeitado sem consultar o DNA;
- falha de banco vira `DnaIndisponivelException` (HTTP 503 no controller).

O SQL da pesquisa foi validado contra o schema real do Firebird 2.5.9 local
(`C:\DNA\Pharmacy\COMERCIOEXP.FDB`, tabela `PRODUTOS` vazia) apenas para
checar sintaxe e colunas; não há dados de produção nessa base.

Não foram executados testes automatizados de integração com o Firebird
real. A verificação ponta a ponta abaixo foi manual, em produção e sem
escrita de dados:

```text
POST .../auth/login (usuário de integração)              -> 200 + token
GET  .../api/integracao-balcao/produtos?q=7891317026554  -> 200 + produto DNA
GET  .../api/integracao-balcao/produtos?q=100460         -> 404 (não encontrado)
GET  .../api/integracao-balcao/produtos (sem token)      -> 401
POST .../auth/login (sem token, credenciais válidas)     -> 200 (rota pública)
```

Exemplo de retorno do produto:

```json
{"codigo":42752,"codbarras":"7891317026554",
 "descricao":"BEDOZE 5MG ML SOL C 2AMP 1ML 120991",
 "inativo":"N","origem":"DNA"}
```

## Limitações e riscos conhecidos

1. **Consulta de clientes não implementada.** Não existe, em nenhum dos
   dois repositórios, consulta SQL confirmada às tabelas de clientes do
   DNA. Criar nomes de tabela/coluna por suposição violaria a regra de não
   inventar estrutura. É necessário obter o schema real (ou uma consulta
   validada) antes de qualquer implementação.
2. **Autenticação do Balcão é frágil por desenho atual.** O Balcão valida
   login no navegador consultando a tabela `users` com a chave anon e
   guarda o usuário no `localStorage`; as policies são `USING (true)`. A
   Edge Function valida que o `actor.id` existe e está ativo, mas essa
   identidade não é criptograficamente verificável. Por isso a primeira
   versão não devolve dados pessoais, preço ou estoque. Migrar o Balcão
   para Supabase Auth (ou outro IdP verificável) é pré-requisito para
   ampliar o escopo.
3. **Segredos versionados no Cotação.** O `application.properties` está no
   Git com credenciais do PostgreSQL, do DNA e o segredo JWT. Além disso,
   `JwtConfig` possui um valor padrão de segredo embutido no código. Não
   foram alterados nesta tarefa (mudança de infraestrutura/rotação exige
   ação do responsável), mas devem ser movidos para variáveis de ambiente
   e rotacionados.
4. **Disponibilidade do backend.** O README do Cotação indica execução por
   serviço do Windows com rotina diária. Se o serviço não estiver ativo, a
   consulta retorna 503 e o Balcão mostra indisponibilidade — nenhum dado
   já digitado é apagado.
5. **URL de produção confirmada.** O backend público usado pela integração
   é `https://api.drogariatorresfarma.com.br` (valor de `VITE_API_URL` no
   Netlify do Cotação, confirmado no bundle publicado) e responde por
   HTTPS. A URL fica no secret `COTACAO_API_URL` da Edge Function; nenhum
   valor secreto é versionado. Se o endereço mudar, atualize o secret.
6. **Pesquisa textual sem índice dedicado.** `PRODUTOS.DESCRICAO` e
   `PRODUTOS.FARPRINCIPIOATIVO` não possuem índice no schema DNA 2.5.9
   verificado localmente, então a busca faz varredura da tabela a cada
   ação explícita do atendente. Para o volume de uma farmácia e consultas
   sob demanda isso é aceitável; nenhum índice ou migração foi criado no
   DNA. Monitorar o tempo de resposta em produção.
7. **Acentos nos dados do DNA.** O termo digitado é normalizado no backend
   (maiúsculas, sem acentos e com espaços colapsados), o que cobre o padrão
   do DNA (descrições em caixa alta e sem acento). Se algum cadastro
   específico tiver acento, a pesquisa digitada sem acento pode não
   encontrá-lo; a busca por código/EAN continua sendo o caminho garantido.
8. **Deploy da Edge Function pendente.** A alteração em
   `supabase/functions/consulta-dna/index.ts` só passa a valer em produção
   após `npx supabase functions deploy consulta-dna`. O endpoint novo do
   Cotação também precisa ser publicado no serviço do backend.

## Próximos passos sugeridos

Concluído em 28/10/2026: URL pública definida, usuário de integração
(`balcao.integracao`, perfil `CONFERENTE`), secrets cadastrados na Edge
Function e verificação ponta a ponta aprovada.

1. Fortalecer a autenticação do Balcão (Supabase Auth) e então validar o
   JWT do usuário final na Edge Function, eliminando o usuário de serviço.
2. Só depois avaliar preço/estoque e, por último, clientes — com schema do
   DNA confirmado e finalidade documentada (LGPD).
3. Remover segredos do `application.properties` e rotacionar os expostos.
