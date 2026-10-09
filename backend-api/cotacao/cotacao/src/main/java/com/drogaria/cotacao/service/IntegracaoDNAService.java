package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.response.ProdutoDnaDTO;
import com.drogaria.cotacao.model.ItemCotacao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
public class IntegracaoDNAService {

    @Autowired
    @Qualifier("dnaNamedJdbcTemplate")
    private NamedParameterJdbcTemplate dnaNamedJdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    /**
     * Venda líquida (bruta - devoluções) a partir da data de referência da última compra.
     * Mesmas regras do sistema: talão não cancelado e finalizado + faturamento de venda
     * sem talão vinculado, menos devoluções. NULL quando não há produto/data de referência.
     */
    private static String sqlVendidoLiquidoAposCompra(String produtoExpr, String dataRefExpr) {
        String bruta =
                "(COALESCE((SELECT SUM(ti.QUANTIDADEVENDIDA) FROM TALAOMANUALITENS ti " +
                "JOIN TALAOMANUAL t ON t.CODIGO = ti.CODTALAOMANUAL " +
                "WHERE ti.CODPRODUTO = " + produtoExpr + " AND ti.CANCELADO = 'N' AND t.CANCELADO = 'N' " +
                "AND t.VENDAFINALIZADA = 'S' AND t.DATA >= " + dataRefExpr + "), 0) + " +
                "COALESCE((SELECT SUM(fi.QUANTIDADE) FROM FATURAMENTOSITENS fi " +
                "JOIN FATURAMENTOS fat ON fat.CODIGO = fi.CODFATURAMENTO " +
                "WHERE fi.CODPRODUTO = " + produtoExpr + " AND fat.TIPOOPERACAO = 1 AND fat.SITUACAONFE = 1 " +
                "AND (fat.CODTALAOMANUAL IS NULL OR NOT EXISTS (SELECT 1 FROM TALAOMANUAL t2 " +
                "WHERE t2.CODIGO = fat.CODTALAOMANUAL AND t2.CANCELADO = 'N' AND t2.VENDAFINALIZADA = 'S')) " +
                "AND fat.DTEMISSAO >= " + dataRefExpr + "), 0))";
        String devolucoes =
                "COALESCE((SELECT SUM(di.QUANTIDADE) FROM DEVOLUCOESMERCADORIASITENS di " +
                "JOIN DEVOLUCOESMERCADORIAS d ON d.CODIGO = di.CODDEVOLUCAO " +
                "WHERE di.CODPRODUTO = " + produtoExpr + " AND d.DTDEVOLUCAO >= " + dataRefExpr + "), 0)";
        return "CASE WHEN " + produtoExpr + " IS NULL OR " + dataRefExpr + " IS NULL THEN NULL ELSE " +
                bruta + " - " + devolucoes + " END";
    }

    /** Lê a coluna de venda líquida; nulo vira nulo e resultado negativo é limitado a zero. */
    private static Double lerVendidoLiquido(ResultSet rs, String coluna) throws SQLException {
        double liquido = rs.getDouble(coluna);
        if (rs.wasNull()) return null;
        return Math.max(0, liquido);
    }

    /** Lê coluna numérica; SQL NULL vira null. */
    private static Double lerDoubleNulo(ResultSet rs, String coluna) throws SQLException {
        double valor = rs.getDouble(coluna);
        return rs.wasNull() ? null : valor;
    }

    /**
     * Vendas nos últimos N dias (janela móvel, não mês calendário), com o mesmo
     * conceito de venda do sistema. NULL quando o produto não tem correspondência.
     * Parâmetro SQL gerado: :dataLimiteN (ex.: :dataLimite30).
     */
    private static String sqlVendasJanelaDias(String produtoExpr, int dias) {
        return "(SELECT SUM(v2.QTDEVENDIDA) FROM A_VENDAS v2 " +
                "WHERE v2.CODPRODUTO = " + produtoExpr +
                " AND v2.DATA > :dataLimite" + dias + " AND v2.DATA <= CURRENT_DATE)";
    }

    private static void adicionarParametrosJanelaVendas(MapSqlParameterSource parametros, LocalDate hoje) {
        parametros.addValue("dataLimite30", Date.valueOf(hoje.minusDays(30)));
        parametros.addValue("dataLimite60", Date.valueOf(hoje.minusDays(60)));
        parametros.addValue("dataLimite90", Date.valueOf(hoje.minusDays(90)));
    }

    /** Preenche as janelas de venda (V30/V60/V90) do item a partir das colunas da query. */
    private static void preencherJanelasVendas(ResultSet rs, ItemCotacao item) throws SQLException {
        Double vendas30d = lerDoubleNulo(rs, "VENDAS_30D");
        if (vendas30d != null) item.setVendas30d(vendas30d);
        Double vendas60d = lerDoubleNulo(rs, "VENDAS_60D");
        if (vendas60d != null) item.setVendas60d(vendas60d);
        Double vendas90d = lerDoubleNulo(rs, "VENDAS_90D");
        if (vendas90d != null) item.setVendas90d(vendas90d);
    }

    public List<ItemCotacao> buscarFaltasDiretoDoBanco(List<String> gruposSelecionados) {
        StringBuilder sql = new StringBuilder(
                "SELECT f.DESCRICAO, p.CODBARRAS, f.ESTOQUE, f.FALTAS, f.PRECOCUSTO, f.GRUPO, " +
                "f.VENDIDO_NO_MES, f.ULTCOMPRA_DATA, f.ULTCOMPRA_QTDE, " +
                "f.ULTVENDA_DATA, " +
                sqlVendidoLiquidoAposCompra("p.CODIGO", "f.ULTCOMPRA_DATA") + " AS VENDIDO_APOS_ULTCOMPRA, " +
                sqlVendasJanelaDias("p.CODIGO", 30) + " AS VENDAS_30D, " +
                sqlVendasJanelaDias("p.CODIGO", 60) + " AS VENDAS_60D, " +
                sqlVendasJanelaDias("p.CODIGO", 90) + " AS VENDAS_90D " +
                "FROM A_FALTAS f " +
                "LEFT JOIN PRODUTOS p ON p.DESCRICAO = f.DESCRICAO"
        );

        MapSqlParameterSource parametros = new MapSqlParameterSource();
        adicionarParametrosJanelaVendas(parametros, LocalDate.now());

        if (gruposSelecionados != null && !gruposSelecionados.isEmpty()) {
            List<String> gruposUpper = gruposSelecionados.stream()
                    .map(String::toUpperCase)
                    .collect(Collectors.toList());
            sql.append(" WHERE UPPER(TRIM(f.GRUPO)) IN (:gruposSelecionados)");
            parametros.addValue("gruposSelecionados", gruposUpper);
        }

        return dnaNamedJdbcTemplate.query(sql.toString(), parametros, (rs, rowNum) -> {
            ItemCotacao item = new ItemCotacao();
            
            item.setNomeProduto(rs.getString("DESCRICAO"));
            item.setCodBarras(rs.getString("CODBARRAS"));
            item.setUltimoPreco(rs.getDouble("PRECOCUSTO")); 
            item.setQuantidade((int) rs.getDouble("FALTAS")); 
            item.setEstoque(rs.getDouble("ESTOQUE"));
            item.setGrupo(rs.getString("GRUPO"));
            item.setVendidoNoMes(rs.getDouble("VENDIDO_NO_MES"));
            item.setUltCompraQtde(rs.getDouble("ULTCOMPRA_QTDE"));

            Double vendidoApos = lerVendidoLiquido(rs, "VENDIDO_APOS_ULTCOMPRA");
            if (vendidoApos != null) {
                item.setVendidoAposUltCompra(vendidoApos);
            }

            preencherJanelasVendas(rs, item);

            item.setOrigemItem("Falta Manual");

            Date ultCompra = rs.getDate("ULTCOMPRA_DATA");
            if (ultCompra != null) item.setUltCompraData(ultCompra.toLocalDate());
            
            Date ultVenda = rs.getDate("ULTVENDA_DATA");
            if (ultVenda != null) item.setUltVendaData(ultVenda.toLocalDate());

            return item;
        });
    }

    public List<ItemCotacao> buscarSugestoes(List<String> gruposSelecionados, LocalDate dataInicial, LocalDate dataFinal, int diasSuprir) {
        StringBuilder sql = new StringBuilder(
                "SELECT " +
                "p.CODIGO, " +
                "p.CODBARRAS, " +
                "p.DESCRICAO, " +
                "MAX(p.QUANTIDADE) AS ESTOQUE, " +
                "MAX(p.PRECOCUSTO) AS PRECOCUSTO, " +
                "MAX(g.NOME) AS GRUPO, " +
                "p.DTULTCOMPRA AS ULTCOMPRA_DATA, " +
                "MAX(p.QTDEULTCOMPRA) AS ULTCOMPRA_QTDE, " +
                "MAX(p.DTULTVENDA) AS ULTVENDA_DATA, " +
                "SUM(v.QTDEVENDIDA) AS TOTAL_VENDIDO, " +
                
                "(COALESCE((SELECT SUM(ti.QUANTIDADEVENDIDA) FROM TALAOMANUALITENS ti JOIN TALAOMANUAL t ON t.CODIGO = ti.CODTALAOMANUAL WHERE ti.CODPRODUTO = p.CODIGO AND ti.CANCELADO = 'N' AND t.CANCELADO = 'N' AND t.VENDAFINALIZADA = 'S' AND t.DATA > CURRENT_DATE - EXTRACT(DAY FROM CURRENT_DATE) AND t.DATA <= CURRENT_DATE), 0) + " +
                "COALESCE((SELECT SUM(fi.QUANTIDADE) FROM FATURAMENTOSITENS fi JOIN FATURAMENTOS f ON f.CODIGO = fi.CODFATURAMENTO WHERE fi.CODPRODUTO = p.CODIGO AND f.TIPOOPERACAO = 1 AND f.SITUACAONFE = 1 AND (f.CODTALAOMANUAL IS NULL OR NOT EXISTS (SELECT 1 FROM TALAOMANUAL t2 WHERE t2.CODIGO = f.CODTALAOMANUAL AND t2.CANCELADO = 'N' AND t2.VENDAFINALIZADA = 'S')) AND f.DTEMISSAO > CURRENT_DATE - EXTRACT(DAY FROM CURRENT_DATE) AND f.DTEMISSAO <= CURRENT_DATE), 0)) AS VENDIDO_NO_MES, " +
                
                sqlVendidoLiquidoAposCompra("p.CODIGO", "p.DTULTCOMPRA") + " AS VENDIDO_APOS_ULTCOMPRA, " +
                sqlVendasJanelaDias("p.CODIGO", 30) + " AS VENDAS_30D, " +
                sqlVendasJanelaDias("p.CODIGO", 60) + " AS VENDAS_60D, " +
                sqlVendasJanelaDias("p.CODIGO", 90) + " AS VENDAS_90D " +

                "FROM A_VENDAS v " +
                "JOIN PRODUTOS p ON p.CODIGO = v.CODPRODUTO " +
                "LEFT JOIN GRUPOS g ON g.CODIGO = p.CODGRUPO " +
                "WHERE v.DATA >= :dataInicial AND v.DATA <= :dataFinal"
        );

        MapSqlParameterSource parametros = new MapSqlParameterSource();
        parametros.addValue("dataInicial", java.sql.Date.valueOf(dataInicial));
        parametros.addValue("dataFinal", java.sql.Date.valueOf(dataFinal));
        adicionarParametrosJanelaVendas(parametros, LocalDate.now());

        if (gruposSelecionados != null && !gruposSelecionados.isEmpty()) {
            List<String> gruposUpper = gruposSelecionados.stream()
                    .map(String::toUpperCase)
                    .collect(Collectors.toList());
            sql.append(" AND UPPER(TRIM(g.NOME)) IN (:gruposSelecionados)");
            parametros.addValue("gruposSelecionados", gruposUpper);
        }

        sql.append(" GROUP BY p.CODIGO, p.CODBARRAS, p.DESCRICAO, p.DTULTCOMPRA");

        long diasPeriodo = ChronoUnit.DAYS.between(dataInicial, dataFinal) + 1;
        if (diasPeriodo <= 0) diasPeriodo = 1; 

        long finalDiasPeriodo = diasPeriodo;

        List<ItemCotacao> sugestoesBrutas = dnaNamedJdbcTemplate.query(sql.toString(), parametros, (rs, rowNum) -> {
            double totalVendido = rs.getDouble("TOTAL_VENDIDO");
            double estoque = rs.getDouble("ESTOQUE");
            
            double mediaDiaria = totalVendido / finalDiasPeriodo;
            int sugestao = (int) Math.ceil((mediaDiaria * diasSuprir) - estoque);
            
            if (sugestao > 0) {
                ItemCotacao item = new ItemCotacao();
                item.setNomeProduto(rs.getString("DESCRICAO"));
                item.setCodBarras(rs.getString("CODBARRAS"));
                item.setUltimoPreco(rs.getDouble("PRECOCUSTO"));
                item.setQuantidade(sugestao);
                item.setEstoque(estoque);
                item.setGrupo(rs.getString("GRUPO"));
                item.setOrigemItem("Sugestão");
                item.setVendidoNoMes(rs.getDouble("VENDIDO_NO_MES"));
                item.setVmd(mediaDiaria);

                Double vendidoApos = lerVendidoLiquido(rs, "VENDIDO_APOS_ULTCOMPRA");
                if (vendidoApos != null) {
                    item.setVendidoAposUltCompra(vendidoApos);
                }

                preencherJanelasVendas(rs, item);
                
                Date ultCompra = rs.getDate("ULTCOMPRA_DATA");
                if (ultCompra != null) item.setUltCompraData(ultCompra.toLocalDate());
                
                item.setUltCompraQtde(rs.getDouble("ULTCOMPRA_QTDE"));
                
                Date ultVenda = rs.getDate("ULTVENDA_DATA");
                if (ultVenda != null) item.setUltVendaData(ultVenda.toLocalDate());
                
                return item;
            }
            return null; 
        });

        return sugestoesBrutas.stream().filter(item -> item != null).collect(Collectors.toList());
    }

    /** Classificação: compra recomendada automaticamente pela Inteligência. */
    public static final String CLASSIFICACAO_COMPRA_SUGERIDA = "COMPRA_SUGERIDA";
    /** Classificação: demanda esporádica; entra na lista com qtd 0 para análise manual. */
    public static final String CLASSIFICACAO_BAIXO_GIRO = "BAIXO_GIRO";
    /** Classificação: sem dados para estimativa confiável; entra na lista com qtd 0. */
    public static final String CLASSIFICACAO_HISTORICO_INSUFICIENTE = "HISTORICO_INSUFICIENTE";

    // Regra de baixo giro (critério do usuário): poucas vendas na janela E compra antiga
    // em relação à última venda => não vale reposição automática.
    private static final double BAIXO_GIRO_TOTAL_VENDIDO_JANELA = 2.0;
    private static final long BAIXO_GIRO_DISTANCIA_COMPRA_VENDA_DIAS = 30L;

    /**
     * Lista de compra da Inteligência: produtos com movimentação na janela informada
     * e cobertura de estoque abaixo do mínimo (dias), sugerindo reposição até o máximo.
     * Produtos com demanda esporádica entram com quantidade 0 e classificação para
     * análise manual; não são excluídos da lista.
     */
    public List<ItemCotacao> buscarItensInteligencia(List<String> gruposSelecionados,
            int diasEstoqueMinimo, int diasEstoqueMaximo, int diasMediaVendas) {
        StringBuilder sql = new StringBuilder(
                "SELECT p.CODIGO, p.DESCRICAO, p.CODBARRAS, p.QUANTIDADE, p.PRECOCUSTO, " +
                "g.NOME AS GRUPO, p.DTULTCOMPRA, p.QTDEULTCOMPRA, p.DTULTVENDA, " +
                "SUM(v.QTDEVENDIDA) AS TOTAL_VENDIDO, " +
                sqlVendidoLiquidoAposCompra("p.CODIGO", "p.DTULTCOMPRA") + " AS VENDIDO_APOS_ULTCOMPRA, " +
                sqlVendasJanelaDias("p.CODIGO", 30) + " AS VENDAS_30D, " +
                sqlVendasJanelaDias("p.CODIGO", 60) + " AS VENDAS_60D, " +
                sqlVendasJanelaDias("p.CODIGO", 90) + " AS VENDAS_90D " +
                "FROM A_VENDAS v " +
                "JOIN PRODUTOS p ON p.CODIGO = v.CODPRODUTO " +
                "LEFT JOIN GRUPOS g ON g.CODIGO = p.CODGRUPO " +
                "WHERE v.DATA > :dataLimite AND v.DATA <= CURRENT_DATE");

        MapSqlParameterSource parametros = new MapSqlParameterSource();
        parametros.addValue("dataLimite", Date.valueOf(LocalDate.now().minusDays(diasMediaVendas)));
        adicionarParametrosJanelaVendas(parametros, LocalDate.now());

        List<String> gruposUpper = gruposSelecionados.stream()
                .map(g -> g.toUpperCase().trim())
                .collect(Collectors.toList());
        sql.append(" AND UPPER(TRIM(g.NOME)) IN (:gruposSelecionados)");
        parametros.addValue("gruposSelecionados", gruposUpper);

        sql.append(" GROUP BY p.CODIGO, p.DESCRICAO, p.CODBARRAS, p.QUANTIDADE, p.PRECOCUSTO, " +
                   "g.NOME, p.DTULTCOMPRA, p.QTDEULTCOMPRA, p.DTULTVENDA");

        List<ItemCotacao> itens = dnaNamedJdbcTemplate.query(sql.toString(), parametros, (rs, rowNum) -> {
            double totalVendido = rs.getDouble("TOTAL_VENDIDO");
            double estoque = rs.getDouble("QUANTIDADE");

            // Apenas produtos com movimentação no período
            if (totalVendido <= 0) return null;

            double vmd = totalVendido / diasMediaVendas;
            if (vmd <= 0) return null;

            // Necessidade de reposição: cobertura atual abaixo do mínimo de dias
            double cobertura = estoque / vmd;
            if (cobertura >= diasEstoqueMinimo) return null;

            Date ultCompra = rs.getDate("DTULTCOMPRA");
            Date ultVenda = rs.getDate("DTULTVENDA");

            // Elegibilidade: demanda esporádica não gera compra automática;
            // o produto continua na lista com quantidade 0 para análise manual.
            String classificacao = CLASSIFICACAO_COMPRA_SUGERIDA;
            int quantidade;
            if (totalVendido <= BAIXO_GIRO_TOTAL_VENDIDO_JANELA) {
                if (ultCompra == null || ultVenda == null) {
                    classificacao = CLASSIFICACAO_HISTORICO_INSUFICIENTE;
                } else {
                    long distanciaDias = ChronoUnit.DAYS.between(ultCompra.toLocalDate(), ultVenda.toLocalDate());
                    if (distanciaDias >= BAIXO_GIRO_DISTANCIA_COMPRA_VENDA_DIAS) {
                        classificacao = CLASSIFICACAO_BAIXO_GIRO;
                    }
                }
            }

            if (CLASSIFICACAO_COMPRA_SUGERIDA.equals(classificacao)) {
                // Reposição até o nível máximo de dias de estoque
                quantidade = (int) Math.ceil((vmd * diasEstoqueMaximo) - estoque);
                if (quantidade <= 0) return null;
            } else {
                quantidade = 0;
            }

            ItemCotacao item = new ItemCotacao();
            item.setNomeProduto(rs.getString("DESCRICAO"));
            item.setCodBarras(rs.getString("CODBARRAS"));
            item.setUltimoPreco(rs.getDouble("PRECOCUSTO"));
            item.setQuantidade(quantidade);
            item.setEstoque(estoque);
            item.setGrupo(rs.getString("GRUPO"));
            item.setVendidoNoMes(totalVendido);
            item.setVmd(vmd);
            item.setOrigemItem("INTELIGENCIA_COMPRA");
            item.setClassificacaoInteligencia(classificacao);

            Double vendidoApos = lerVendidoLiquido(rs, "VENDIDO_APOS_ULTCOMPRA");
            if (vendidoApos != null) {
                item.setVendidoAposUltCompra(vendidoApos);
            }

            preencherJanelasVendas(rs, item);

            if (ultCompra != null) item.setUltCompraData(ultCompra.toLocalDate());
            item.setUltCompraQtde(rs.getDouble("QTDEULTCOMPRA"));

            if (ultVenda != null) item.setUltVendaData(ultVenda.toLocalDate());

            return item;
        });

        return itens.stream().filter(item -> item != null).collect(Collectors.toList());
    }

    public Optional<ProdutoDnaDTO> buscarProdutoPorCodigoOuBarras(String query) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        
        Integer codigoNum = null;
        try {
            codigoNum = Integer.parseInt(query.trim());
        } catch (NumberFormatException ignored) {}

        params.addValue("codigoNum", codigoNum);
        params.addValue("codbarras", query.trim());

        try {
            String sqlDna;
            if (codigoNum != null) {
                sqlDna = "SELECT CODIGO, CODBARRAS, DESCRICAO, QUANTIDADE, PRECOVENDA, PRECOCUSTO, INATIVO " +
                         "FROM PRODUTOS WHERE CODIGO = :codigoNum OR CODBARRAS = :codbarras";
            } else {
                sqlDna = "SELECT CODIGO, CODBARRAS, DESCRICAO, QUANTIDADE, PRECOVENDA, PRECOCUSTO, INATIVO " +
                         "FROM PRODUTOS WHERE CODBARRAS = :codbarras";
            }
            ProdutoDnaDTO produto = dnaNamedJdbcTemplate.queryForObject(sqlDna, params, (rs, rowNum) -> {
                return new ProdutoDnaDTO(
                    rs.getInt("CODIGO"),
                    rs.getString("CODBARRAS"),
                    rs.getString("DESCRICAO"),
                    rs.getDouble("QUANTIDADE"), 
                    rs.getDouble("PRECOVENDA"),
                    rs.getDouble("PRECOCUSTO"),
                    rs.getString("INATIVO")
                );
            });
            if (produto != null) return Optional.of(produto);
        } catch (Exception ignored) {}

        try {
            String sqlSupabase = "SELECT codigo, codbarras, descricao, quantidade, precovenda, precocusto, inativo " +
                                 "FROM produtos WHERE CAST(codigo AS TEXT) = :q OR codbarras = :q LIMIT 1";
            @SuppressWarnings("unchecked")
            List<Object[]> resultados = entityManager.createNativeQuery(sqlSupabase)
                    .setParameter("q", query.trim())
                    .getResultList();

            if (!resultados.isEmpty()) {
                Object[] row = resultados.get(0);
                ProdutoDnaDTO prodSupabase = new ProdutoDnaDTO(
                    row[0] != null ? ((Number) row[0]).intValue() : null,
                    (String) row[1],
                    (String) row[2],
                    row[3] != null ? ((Number) row[3]).doubleValue() : 0.0,
                    row[4] != null ? ((Number) row[4]).doubleValue() : 0.0,
                    row[5] != null ? ((Number) row[5]).doubleValue() : 0.0,
                    (String) row[6]
                );
                return Optional.of(prodSupabase);
            }
        } catch (Exception ignored) {}

        // 3. Tenta na tabela 'medicamentos_diversos' do Supabase
        try {
            String sqlDiversos = "SELECT codigo_diversos, produto, preco FROM medicamentos_diversos " +
                                 "WHERE codigo_diversos = :q OR produto ILIKE :likeQuery LIMIT 1";
            @SuppressWarnings("unchecked")
            List<Object[]> resultadosDiv = entityManager.createNativeQuery(sqlDiversos)
                    .setParameter("q", query.trim())
                    .setParameter("likeQuery", "%" + query.trim() + "%")
                    .getResultList();

            if (!resultadosDiv.isEmpty()) {
                Object[] row = resultadosDiv.get(0);
                ProdutoDnaDTO prodDiv = new ProdutoDnaDTO(
                    null,
                    (String) row[0],
                    (String) row[1],
                    0.0,
                    row[2] != null ? ((Number) row[2]).doubleValue() : 0.0,
                    0.0,
                    "N"
                );
                return Optional.of(prodDiv);
            }
        } catch (Exception ignored) {}

        return Optional.empty();
    }
}