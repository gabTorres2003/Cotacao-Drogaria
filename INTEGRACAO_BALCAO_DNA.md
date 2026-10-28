# Integração Balcão → Cotação → DNA

Consulta de leitura de produtos do DNA (Firebird) pelo sistema de
Atendimento (Balcão), reutilizando a conexão já existente no backend do
Cotação. Esta é a primeira etapa: **somente leitura de produto por código
interno ou código de barras**. Não há consulta de clientes nesta versão.

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
supabase functions deploy consulta-dna --project-ref <ref-do-projeto-balcao>
```

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
   curl.exe -H "Authorization: Bearer <token>" "http://localhost:8080/api/integracao-balcao/produtos?q=100460"
   ```

## Testes executados

```text
.\mvnw.cmd -B -ntp test
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Cobertura do teste `ConsultaDnaBalcaoServiceTest`:

- produto encontrado com `origem = DNA`;
- produto não encontrado (lista vazia);
- termo vazio não consulta o DNA;
- falha de conexão vira `DnaIndisponivelException` (HTTP 503 no controller).

Não foram executados testes de integração com o Firebird real nem teste de
autorização HTTP ponta a ponta (exigem banco e JWT de produção). Ver
"Pendências".

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
5. **URL e HTTPS de produção não confirmados.** O endereço real do backend
   não está no repositório (vem de `VITE_API_URL` no ambiente do Netlify do
   Cotação). Sem confirmar se há HTTPS válido e alcance a partir do
   servidor do Supabase, a integração não funciona em produção.
6. **Busca por descrição não implementada.** Apenas código/EAN exato. Busca
   textual em `PRODUTOS.DESCRICAO` pode ser custosa e depende de índice
   confirmado; fica para uma próxima etapa.

## Próximos passos sugeridos

1. Confirmar `COTACAO_API_URL` público com HTTPS válido e testar
   `GET /api/integracao-balcao/produtos` a partir da Edge Function.
2. Criar o usuário de integração no Cotação com o menor perfil que atenda
   (`CONFERENTE`) e cadastrar os secrets.
3. Fortalecer a autenticação do Balcão (Supabase Auth) e então validar o
   JWT do usuário final na Edge Function, eliminando o usuário de serviço.
4. Só depois avaliar preço/estoque e, por último, clientes — com schema do
   DNA confirmado e finalidade documentada (LGPD).
5. Remover segredos do `application.properties` e rotacionar os expostos.
