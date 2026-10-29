package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.response.ProdutoPesquisaDnaDTO;
import com.drogaria.cotacao.dto.response.ResultadoPesquisaProdutosDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

/**
 * Pesquisa de produtos no DNA por descrição ou princípio ativo, para uso do
 * Cotação e do Atendimento (Balcão). Reutiliza o mesmo DataSource
 * somente-leitura do DNA já existente ({@code dnaNamedJdbcTemplate}).
 *
 * <p>A busca por código/EAN continua em {@link ConsultaDnaBalcaoService} e
 * {@link IntegracaoDNAService}; esta classe não altera nem substitui aquele
 * fluxo.</p>
 *
 * <p>Regras de precisão:</p>
 * <ul>
 *   <li>termo normalizado (maiúsculas, sem acentos, espaços colapsados);</li>
 *   <li>somente correspondência exata, por prefixo, por início de palavra
 *       ou parcial — nunca a tabela inteira;</li>
 *   <li>limite aplicado no banco ({@code SELECT FIRST}) e ordenação por
 *       relevância feita no DNA;</li>
 *   <li>produtos ativos antes dos inativos e descrição como desempate.</li>
 * </ul>
 */
@Service
public class PesquisaProdutoDnaService {

    private static final Logger log = LoggerFactory.getLogger(PesquisaProdutoDnaService.class);

    static final int TAMANHO_MINIMO_TERMO = 2;
    static final int TAMANHO_MAXIMO_TERMO = 40;

    private static final String TIPO_DESCRICAO = "DESCRICAO";
    private static final String TIPO_PRINCIPIO = "PRINCIPIO";

    private static final String SQL_PESQUISA =
            "SELECT FIRST %d Q.CODIGO, Q.CODBARRAS, Q.DESCRICAO, Q.PRINCIPIOATIVO, " +
            "Q.APRESENTACAO, Q.UNIDADE, Q.FABRICANTE, Q.INATIVO " +
            "FROM (SELECT P.CODIGO, P.CODBARRAS, P.DESCRICAO, " +
            "P.FARPRINCIPIOATIVO AS PRINCIPIOATIVO, P.FARAPRESENTACAO AS APRESENTACAO, " +
            "P.UNIDADE, P.INATIVO, F.RAZAO AS FABRICANTE, UPPER(P.%s) AS BUSCA " +
            "FROM PRODUTOS P LEFT JOIN FORNECEDORES F ON F.CODIGO = P.CODFABRICANTE " +
            "WHERE P.%s IS NOT NULL AND TRIM(P.%s) <> '') Q " +
            "WHERE Q.BUSCA = :exato OR Q.BUSCA STARTING WITH :prefixo " +
            "OR (' ' || Q.BUSCA) LIKE :palavra ESCAPE '\\' " +
            "OR Q.BUSCA LIKE :contem ESCAPE '\\' " +
            "ORDER BY CASE WHEN Q.BUSCA = :exato THEN 0 " +
            "WHEN Q.BUSCA STARTING WITH :prefixo THEN 1 " +
            "WHEN (' ' || Q.BUSCA) LIKE :palavra ESCAPE '\\' THEN 2 ELSE 3 END, " +
            "CASE WHEN COALESCE(Q.INATIVO, 'N') = 'N' THEN 0 ELSE 1 END, Q.DESCRICAO";

    @Autowired
    @Qualifier("dnaNamedJdbcTemplate")
    private NamedParameterJdbcTemplate dnaNamedJdbcTemplate;

    /**
     * Pesquisa produtos cuja descrição ou princípio ativo corresponde ao
     * termo informado. Retorna no máximo {@link ResultadoPesquisaProdutosDTO#LIMITE_PADRAO}
     * itens, sinalizando quando a lista foi truncada.
     *
     * @param termo texto digitado pelo usuário
     * @param tipo  {@code descricao} (padrão) ou {@code principio}
     * @throws IllegalArgumentException quando o termo/tipo é inválido
     * @throws DnaIndisponivelException quando o DNA não pôde ser consultado
     */
    public ResultadoPesquisaProdutosDTO pesquisar(String termo, String tipo) {
        String coluna = TIPO_PRINCIPIO.equals(normalizarTipo(tipo))
                ? "FARPRINCIPIOATIVO"
                : "DESCRICAO";

        String texto = normalizarTexto(termo);

        if (texto.length() < TAMANHO_MINIMO_TERMO) {
            throw new IllegalArgumentException(
                    "Informe pelo menos " + TAMANHO_MINIMO_TERMO + " caracteres para pesquisar.");
        }
        if (texto.length() > TAMANHO_MAXIMO_TERMO) {
            throw new IllegalArgumentException(
                    "O termo de pesquisa deve ter no máximo " + TAMANHO_MAXIMO_TERMO + " caracteres.");
        }

        String escapado = escaparLike(texto);
        int limite = ResultadoPesquisaProdutosDTO.LIMITE_PADRAO;

        MapSqlParameterSource parametros = new MapSqlParameterSource()
                .addValue("exato", texto)
                .addValue("prefixo", texto)
                .addValue("palavra", "% " + escapado + "%")
                .addValue("contem", "%" + escapado + "%");

        String sql = String.format(SQL_PESQUISA, limite + 1, coluna, coluna, coluna);

        try {
            List<ProdutoPesquisaDnaDTO> encontrados = dnaNamedJdbcTemplate.query(
                    sql, parametros, (rs, rowNum) -> new ProdutoPesquisaDnaDTO(
                            rs.getObject("CODIGO", Integer.class),
                            trim(rs.getString("CODBARRAS")),
                            trim(rs.getString("DESCRICAO")),
                            trim(rs.getString("PRINCIPIOATIVO")),
                            trim(rs.getString("APRESENTACAO")),
                            trim(rs.getString("UNIDADE")),
                            trim(rs.getString("FABRICANTE")),
                            trim(rs.getString("INATIVO")),
                            "DNA"));

            boolean truncado = encontrados.size() > limite;

            return new ResultadoPesquisaProdutosDTO(
                    truncado ? List.copyOf(encontrados.subList(0, limite)) : encontrados,
                    truncado,
                    limite);
        } catch (Exception e) {
            // Não registra o termo pesquisado para não gravar texto livre em log.
            log.warn("Falha ao pesquisar produtos no DNA: {}", e.getClass().getSimpleName());
            throw new DnaIndisponivelException(e);
        }
    }

    /** Normaliza o tipo aceitando variações com acento, espaço e hífen. */
    static String normalizarTipo(String tipo) {
        String valor = normalizarTexto(tipo).replace(" ", "").replace("_", "").replace("-", "");

        if (valor.isEmpty() || "DESCRICAO".equals(valor)) {
            return TIPO_DESCRICAO;
        }
        if ("PRINCIPIO".equals(valor) || "PRINCIPIOATIVO".equals(valor) || "ATIVO".equals(valor)) {
            return TIPO_PRINCIPIO;
        }

        throw new IllegalArgumentException("Tipo de pesquisa inválido. Use descrição ou princípio ativo.");
    }

    /**
     * Maiúsculas, sem acentos e com espaços colapsados. O DNA Pharmacy grava
     * descrições em caixa alta; a remoção de acentos do termo evita que a
     * digitação com acento deixe de encontrar o produto.
     */
    static String normalizarTexto(String valor) {
        if (valor == null) {
            return "";
        }

        String semAcentos = Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");

        return semAcentos.toUpperCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    private static String escaparLike(String valor) {
        return valor.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    private static String trim(String valor) {
        return valor == null ? null : valor.trim();
    }

    /** Indica que a pesquisa não pôde ser executada (conexão/erro no DNA). */
    public static class DnaIndisponivelException extends RuntimeException {
        public DnaIndisponivelException(Throwable causa) {
            super("Pesquisa no DNA indisponível", causa);
        }
    }
}
