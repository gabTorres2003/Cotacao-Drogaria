package com.drogaria.cotacao.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Leituras em lote do DNA (Firebird) usadas pela Inteligência de Compras.
 * Reutiliza o único DataSource/NamedParameterJdbcTemplate do DNA já existente
 * (somente leitura). Nenhuma conexão nova é criada.
 *
 * Regra de desempenho: uma query por dataset, agregadas por CODPRODUTO,
 * sem consultas por produto individual (evita N+1).
 */
@Slf4j
@Service
public class InteligenciaDnaService {

    @Autowired
    @Qualifier("dnaNamedJdbcTemplate")
    private NamedParameterJdbcTemplate dnaNamedJdbcTemplate;

    public record GrupoDnaDTO(Integer codigo, String nome) {}

    public record ProdutoGrupoDnaDTO(
            Integer codigo, String codbarras, String descricao, BigDecimal quantidade,
            BigDecimal precocusto, BigDecimal precoMedio, BigDecimal precoVenda, BigDecimal precoPromocao,
            BigDecimal margemLucro, LocalDate dtUltVenda, LocalDate dtUltCompra, BigDecimal qtdeUltCompra,
            String curvaAbc, String suspenderCompra, Integer codSubgrupo, Integer codFornecedor) {}

    public record VendasJanelaDTO(BigDecimal v7, BigDecimal v14, BigDecimal v30, BigDecimal v60, BigDecimal v90,
            LocalDate primeiraVendaJanela, LocalDate ultimaVenda, Integer diasComVenda) {}

    public record DevolucoesJanelaDTO(BigDecimal d7, BigDecimal d14, BigDecimal d30, BigDecimal d60, BigDecimal d90) {}

    public record CompraDnaDTO(Integer codProduto, BigDecimal quantidade, BigDecimal vrUnitario,
            BigDecimal valorTotal, BigDecimal valorLiquido, BigDecimal desconto, BigDecimal vrFrete,
            LocalDate dtEntrada, String nrNota, Integer codFornecedor) {}

    public record FornecedorDnaDTO(Integer codigo, String razao, String fantasia, String cnpj, String inativo) {}

    private static final String COLUNAS_PRODUTO = """
            p.CODIGO, p.CODBARRAS, p.DESCRICAO, p.QUANTIDADE, p.PRECOCUSTO, p.PRECOMEDIO,
            p.PRECOVENDA, p.PRECOPROMOCAO, p.MARGEMLUCRO, p.DTULTVENDA, p.DTULTCOMPRA,
            p.QTDEULTCOMPRA, p.CURVAABC, p.SUSPENDERCOMPRA, p.CODSUBGRUPO, p.CODFORNECEDOR
            """;

    /** Produtos ativos de um grupo, em lote. */
    public List<ProdutoGrupoDnaDTO> buscarProdutosPorGrupo(Integer dnaGrupoId) {
        String sql = "SELECT " + COLUNAS_PRODUTO + " FROM PRODUTOS p "
                + "WHERE p.CODGRUPO = :grupo AND p.INATIVO = 'N'";
        try {
            return dnaNamedJdbcTemplate.query(sql, new MapSqlParameterSource().addValue("grupo", dnaGrupoId),
                    (rs, i) -> mapearProduto(rs));
        } catch (Exception e) {
            log.error("[IntelDna] Falha ao consultar produtos do grupo {} no DNA", dnaGrupoId, e);
            throw new IllegalStateException("Falha ao consultar o DNA (produtos do grupo)");
        }
    }

    /** Um produto pelo código (detalhe). Retorna null se não encontrado. */
    public ProdutoGrupoDnaDTO buscarProdutoPorCodigo(Integer codigo) {
        String sql = "SELECT " + COLUNAS_PRODUTO + " FROM PRODUTOS p WHERE p.CODIGO = :codigo";
        try {
            List<ProdutoGrupoDnaDTO> res = dnaNamedJdbcTemplate.query(sql,
                    new MapSqlParameterSource().addValue("codigo", codigo),
                    (rs, i) -> mapearProduto(rs));
            return res.isEmpty() ? null : res.get(0);
        } catch (Exception e) {
            log.error("[IntelDna] Falha ao consultar o produto {} no DNA", codigo, e);
            throw new IllegalStateException("Falha ao consultar o DNA (produto)");
        }
    }

    private ProdutoGrupoDnaDTO mapearProduto(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new ProdutoGrupoDnaDTO(
                rs.getObject("CODIGO", Integer.class),
                trim(rs.getString("CODBARRAS")),
                trim(rs.getString("DESCRICAO")),
                rs.getBigDecimal("QUANTIDADE"),
                rs.getBigDecimal("PRECOCUSTO"),
                rs.getBigDecimal("PRECOMEDIO"),
                rs.getBigDecimal("PRECOVENDA"),
                rs.getBigDecimal("PRECOPROMOCAO"),
                rs.getBigDecimal("MARGEMLUCRO"),
                localDate(rs, "DTULTVENDA"),
                localDate(rs, "DTULTCOMPRA"),
                rs.getBigDecimal("QTDEULTCOMPRA"),
                trim(rs.getString("CURVAABC")),
                trim(rs.getString("SUSPENDERCOMPRA")),
                rs.getObject("CODSUBGRUPO", Integer.class),
                rs.getObject("CODFORNECEDOR", Integer.class));
    }

    /** Lista de grupos do DNA (fonte real GRUPOS). */
    public List<GrupoDnaDTO> buscarGrupos() {
        String sql = "SELECT CODIGO, NOME FROM GRUPOS ORDER BY NOME";
        try {
            return dnaNamedJdbcTemplate.query(sql, new MapSqlParameterSource(), (rs, i) ->
                    new GrupoDnaDTO(rs.getObject("CODIGO", Integer.class), trim(rs.getString("NOME"))));
        } catch (Exception e) {
            log.error("[IntelDna] Falha ao consultar grupos no DNA", e);
            throw new IllegalStateException("Falha ao consultar o DNA (grupos)");
        }
    }

    /**
     * Janelas de venda por produto a partir da view A_VENDAS
     * (critérios já validados: faturamentos com SITUACAONFE=1 e talões não cancelados/finalizados,
     * sem dupla contagem talão→faturamento).
     */
    public Map<Integer, VendasJanelaDTO> buscarVendasJanelasPorGrupo(Integer dnaGrupoId, LocalDate hoje) {
        String sql = """
                SELECT CODPRODUTO,
                       SUM(CASE WHEN DATA >= :d7  THEN QTDEVENDIDA ELSE 0 END) AS V7,
                       SUM(CASE WHEN DATA >= :d14 THEN QTDEVENDIDA ELSE 0 END) AS V14,
                       SUM(CASE WHEN DATA >= :d30 THEN QTDEVENDIDA ELSE 0 END) AS V30,
                       SUM(CASE WHEN DATA >= :d60 THEN QTDEVENDIDA ELSE 0 END) AS V60,
                       SUM(CASE WHEN DATA >= :d90 THEN QTDEVENDIDA ELSE 0 END) AS V90,
                       MIN(DATA) AS PRIMEIRA_VENDA,
                       MAX(DATA) AS ULTIMA_VENDA,
                       COUNT(DISTINCT DATA) AS DIAS_COM_VENDA
                FROM A_VENDAS
                WHERE CODGRUPO = :grupo AND DATA >= :d90
                GROUP BY CODPRODUTO
                """;
        MapSqlParameterSource p = janelasParams(dnaGrupoId, hoje);
        try {
            Map<Integer, VendasJanelaDTO> mapa = new HashMap<>();
            dnaNamedJdbcTemplate.query(sql, p, rs -> {
                mapa.put(rs.getObject("CODPRODUTO", Integer.class),
                        new VendasJanelaDTO(nz(rs.getBigDecimal("V7")), nz(rs.getBigDecimal("V14")),
                                nz(rs.getBigDecimal("V30")), nz(rs.getBigDecimal("V60")),
                                nz(rs.getBigDecimal("V90")),
                                localDate(rs, "PRIMEIRA_VENDA"), localDate(rs, "ULTIMA_VENDA"),
                                rs.getObject("DIAS_COM_VENDA", Integer.class)));
            });
            return mapa;
        } catch (Exception e) {
            log.error("[IntelDna] Falha ao consultar vendas do grupo {} no DNA", dnaGrupoId, e);
            throw new IllegalStateException("Falha ao consultar o DNA (vendas)");
        }
    }

    /** Devoluções por produto nas mesmas janelas (para chegar à venda líquida real). */
    public Map<Integer, DevolucoesJanelaDTO> buscarDevolucoesJanelasPorGrupo(Integer dnaGrupoId, LocalDate hoje) {
        String sql = """
                SELECT di.CODPRODUTO,
                       SUM(CASE WHEN d.DTDEVOLUCAO >= :d7  THEN di.QUANTIDADE ELSE 0 END) AS D7,
                       SUM(CASE WHEN d.DTDEVOLUCAO >= :d14 THEN di.QUANTIDADE ELSE 0 END) AS D14,
                       SUM(CASE WHEN d.DTDEVOLUCAO >= :d30 THEN di.QUANTIDADE ELSE 0 END) AS D30,
                       SUM(CASE WHEN d.DTDEVOLUCAO >= :d60 THEN di.QUANTIDADE ELSE 0 END) AS D60,
                       SUM(CASE WHEN d.DTDEVOLUCAO >= :d90 THEN di.QUANTIDADE ELSE 0 END) AS D90
                FROM DEVOLUCOESMERCADORIASITENS di
                JOIN DEVOLUCOESMERCADORIAS d ON d.CODIGO = di.CODDEVOLUCAO
                JOIN PRODUTOS p ON p.CODIGO = di.CODPRODUTO
                WHERE p.CODGRUPO = :grupo AND d.DTDEVOLUCAO >= :d90
                GROUP BY di.CODPRODUTO
                """;
        MapSqlParameterSource p = janelasParams(dnaGrupoId, hoje);
        try {
            Map<Integer, DevolucoesJanelaDTO> mapa = new HashMap<>();
            dnaNamedJdbcTemplate.query(sql, p, rs -> {
                mapa.put(rs.getObject("CODPRODUTO", Integer.class),
                        new DevolucoesJanelaDTO(nz(rs.getBigDecimal("D7")), nz(rs.getBigDecimal("D14")),
                                nz(rs.getBigDecimal("D30")), nz(rs.getBigDecimal("D60")),
                                nz(rs.getBigDecimal("D90"))));
            });
            return mapa;
        } catch (Exception e) {
            log.error("[IntelDna] Falha ao consultar devoluções do grupo {} no DNA", dnaGrupoId, e);
            throw new IllegalStateException("Falha ao consultar o DNA (devoluções)");
        }
    }

    /** Histórico de compras (entradas) do grupo no período, ordenado por produto/data desc. */
    public List<CompraDnaDTO> buscarComprasPorGrupo(Integer dnaGrupoId, LocalDate limite) {
        String sql = """
                SELECT e.CODPRODUTO, e.QUANTIDADE, e.VRUNITARIO, e.VALORTOTAL, e.VALORLIQUIDO,
                       e.DESCONTO, e.VRFRETE, em.DTENTRADA, em.NRNOTA, em.CODFORNECEDOR
                FROM ENTRADASMERCADORIASITENS e
                JOIN ENTRADASMERCADORIAS em ON em.CODIGO = e.CODENTRADAMERCADORIAS
                JOIN PRODUTOS p ON p.CODIGO = e.CODPRODUTO
                WHERE p.CODGRUPO = :grupo AND em.DTENTRADA >= :limite
                ORDER BY e.CODPRODUTO, em.DTENTRADA DESC
                """;
        try {
            return dnaNamedJdbcTemplate.query(sql,
                    new MapSqlParameterSource().addValue("grupo", dnaGrupoId).addValue("limite", limite),
                    (rs, i) -> mapearCompra(rs));
        } catch (Exception e) {
            log.error("[IntelDna] Falha ao consultar compras do grupo {} no DNA", dnaGrupoId, e);
            throw new IllegalStateException("Falha ao consultar o DNA (compras)");
        }
    }

    /** Últimas entradas de um produto (detalhe), com limite fixo de linhas. */
    public List<CompraDnaDTO> buscarUltimasComprasProduto(Integer codProduto, LocalDate limite, int maxLinhas) {
        int limiteLinhas = Math.max(1, Math.min(maxLinhas, 100));
        String sql = String.format("""
                SELECT FIRST %d e.CODPRODUTO, e.QUANTIDADE, e.VRUNITARIO, e.VALORTOTAL, e.VALORLIQUIDO,
                       e.DESCONTO, e.VRFRETE, em.DTENTRADA, em.NRNOTA, em.CODFORNECEDOR
                FROM ENTRADASMERCADORIASITENS e
                JOIN ENTRADASMERCADORIAS em ON em.CODIGO = e.CODENTRADAMERCADORIAS
                WHERE e.CODPRODUTO = :produto AND em.DTENTRADA >= :limite
                ORDER BY em.DTENTRADA DESC
                """, limiteLinhas);
        try {
            return dnaNamedJdbcTemplate.query(sql,
                    new MapSqlParameterSource().addValue("produto", codProduto).addValue("limite", limite),
                    (rs, i) -> mapearCompra(rs));
        } catch (Exception e) {
            log.error("[IntelDna] Falha ao consultar últimas compras do produto {}", codProduto, e);
            throw new IllegalStateException("Falha ao consultar o DNA (últimas compras)");
        }
    }

    /** Fornecedores do DNA (para configurar o vínculo com lead time). */
    public List<FornecedorDnaDTO> buscarFornecedores() {
        String sql = "SELECT CODIGO, RAZAO, FANTASIA, CNPJ, INATIVO FROM FORNECEDORES ORDER BY FANTASIA";
        try {
            return dnaNamedJdbcTemplate.query(sql, new MapSqlParameterSource(), (rs, i) ->
                    new FornecedorDnaDTO(rs.getObject("CODIGO", Integer.class),
                            trim(rs.getString("RAZAO")), trim(rs.getString("FANTASIA")),
                            trim(rs.getString("CNPJ")), trim(rs.getString("INATIVO"))));
        } catch (Exception e) {
            log.error("[IntelDna] Falha ao consultar fornecedores no DNA", e);
            throw new IllegalStateException("Falha ao consultar o DNA (fornecedores)");
        }
    }

    private MapSqlParameterSource janelasParams(Integer dnaGrupoId, LocalDate hoje) {
        return new MapSqlParameterSource()
                .addValue("grupo", dnaGrupoId)
                .addValue("d7", hoje.minusDays(7))
                .addValue("d14", hoje.minusDays(14))
                .addValue("d30", hoje.minusDays(30))
                .addValue("d60", hoje.minusDays(60))
                .addValue("d90", hoje.minusDays(90));
    }

    private CompraDnaDTO mapearCompra(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new CompraDnaDTO(
                rs.getObject("CODPRODUTO", Integer.class),
                rs.getBigDecimal("QUANTIDADE"),
                rs.getBigDecimal("VRUNITARIO"),
                rs.getBigDecimal("VALORTOTAL"),
                rs.getBigDecimal("VALORLIQUIDO"),
                rs.getBigDecimal("DESCONTO"),
                rs.getBigDecimal("VRFRETE"),
                localDate(rs, "DTENTRADA"),
                trim(rs.getString("NRNOTA")),
                rs.getObject("CODFORNECEDOR", Integer.class));
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static String trim(String v) {
        return v == null ? null : v.trim();
    }

    private static LocalDate localDate(java.sql.ResultSet rs, String col) throws java.sql.SQLException {
        java.sql.Date d = rs.getDate(col);
        return d == null ? null : d.toLocalDate();
    }
}
