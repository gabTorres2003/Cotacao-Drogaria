package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.response.ProdutoConsultaBalcaoDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Consulta de leitura de produtos do DNA para o sistema de Atendimento
 * (Balcão). Reutiliza o mesmo DataSource somente-leitura do DNA já usado
 * pelo Cotação ({@code dnaNamedJdbcTemplate}); nenhuma conexão nova é criada.
 *
 * Diferentemente de {@link IntegracaoDNAService#buscarProdutoPorCodigoOuBarras},
 * esta consulta não usa fallback para o cache do Supabase e não silencia
 * falhas de banco: "não encontrado" e "DNA indisponível" são situações
 * distintas para o consumidor.
 */
@Service
public class ConsultaDnaBalcaoService {

    private static final Logger log = LoggerFactory.getLogger(ConsultaDnaBalcaoService.class);

    private static final int TAMANHO_MAXIMO_TERMO = 20;

    @Autowired
    @Qualifier("dnaNamedJdbcTemplate")
    private NamedParameterJdbcTemplate dnaNamedJdbcTemplate;

    /**
     * Busca um único produto por código interno ou código de barras.
     * Quando o mesmo código de barras existe em mais de um registro, prioriza
     * o produto ativo e, em seguida, o menor código, garantindo resultado
     * determinístico e sem duplicidade.
     */
    public Optional<ProdutoConsultaBalcaoDTO> consultarProduto(String termo) {
        String valor = termo == null ? "" : termo.trim();

        if (valor.isEmpty() || valor.length() > TAMANHO_MAXIMO_TERMO) {
            return Optional.empty();
        }

        Integer codigo = null;
        try {
            codigo = Integer.parseInt(valor);
        } catch (NumberFormatException ignored) {
            // Código de barras alfanumérico: busca apenas por CODBARRAS.
        }

        MapSqlParameterSource parametros = new MapSqlParameterSource()
                .addValue("barras", valor);

        StringBuilder sql = new StringBuilder(
                "SELECT FIRST 1 CODIGO, CODBARRAS, DESCRICAO, INATIVO FROM PRODUTOS WHERE ");

        if (codigo != null) {
            sql.append("(CODIGO = :codigo OR CODBARRAS = :barras)");
            parametros.addValue("codigo", codigo);
        } else {
            sql.append("CODBARRAS = :barras");
        }

        sql.append(" ORDER BY CASE WHEN INATIVO = 'N' THEN 0 ELSE 1 END, CODIGO");

        try {
            List<ProdutoConsultaBalcaoDTO> encontrados = dnaNamedJdbcTemplate.query(
                    sql.toString(), parametros, (rs, rowNum) -> new ProdutoConsultaBalcaoDTO(
                            rs.getObject("CODIGO", Integer.class),
                            trim(rs.getString("CODBARRAS")),
                            trim(rs.getString("DESCRICAO")),
                            trim(rs.getString("INATIVO")),
                            "DNA"));

            return encontrados.stream().findFirst();
        } catch (Exception e) {
            // Não registra o termo pesquisado para não gravar texto livre em log.
            log.warn("Falha ao consultar produto no DNA: {}", e.getClass().getSimpleName());
            throw new DnaIndisponivelException(e);
        }
    }

    private static String trim(String valor) {
        return valor == null ? null : valor.trim();
    }

    /** Indica que a consulta não pôde ser executada (conexão/erro no DNA). */
    public static class DnaIndisponivelException extends RuntimeException {
        public DnaIndisponivelException(Throwable causa) {
            super("Consulta ao DNA indisponível", causa);
        }
    }
}
