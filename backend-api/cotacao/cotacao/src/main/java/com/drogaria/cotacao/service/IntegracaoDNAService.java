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
                "JOIN FATURAMENTOS f ON f.CODIGO = fi.CODFATURAMENTO " +
                "WHERE fi.CODPRODUTO = " + produtoExpr + " AND f.TIPOOPERACAO = 1 AND f.SITUACAONFE = 1 " +
                "AND (f.CODTALAOMANUAL IS NULL OR NOT EXISTS (SELECT 1 FROM TALAOMANUAL t2 " +
                "WHERE t2.CODIGO = f.CODTALAOMANUAL AND t2.CANCELADO = 'N' AND t2.VENDAFINALIZADA = 'S')) " +
                "AND f.DTEMISSAO >= " + dataRefExpr + "), 0))";
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

    public List<ItemCotacao> buscarFaltasDiretoDoBanco(List<String> gruposSelecionados) {
        StringBuilder sql = new StringBuilder(
                "SELECT f.DESCRICAO, p.CODBARRAS, f.ESTOQUE, f.FALTAS, f.PRECOCUSTO, f.GRUPO, " +
                "f.VENDIDO_NO_MES, f.ULTCOMPRA_DATA, f.ULTCOMPRA_QTDE, " +
                "f.ULTVENDA_DATA, " +
                sqlVendidoLiquidoAposCompra("p.CODIGO", "f.ULTCOMPRA_DATA") + " AS VENDIDO_APOS_ULTCOMPRA " +
                "FROM A_FALTAS f " +
                "LEFT JOIN PRODUTOS p ON p.DESCRICAO = f.DESCRICAO"
        );

        MapSqlParameterSource parametros = new MapSqlParameterSource();

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
                
                sqlVendidoLiquidoAposCompra("p.CODIGO", "p.DTULTCOMPRA") + " AS VENDIDO_APOS_ULTCOMPRA " +

                "FROM A_VENDAS v " +
                "JOIN PRODUTOS p ON p.CODIGO = v.CODPRODUTO " +
                "LEFT JOIN GRUPOS g ON g.CODIGO = p.CODGRUPO " +
                "WHERE v.DATA >= :dataInicial AND v.DATA <= :dataFinal"
        );

        MapSqlParameterSource parametros = new MapSqlParameterSource();
        parametros.addValue("dataInicial", java.sql.Date.valueOf(dataInicial));
        parametros.addValue("dataFinal", java.sql.Date.valueOf(dataFinal));

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

    /**
     * Lista de compra da Inteligência: produtos com movimentação na janela informada
     * e cobertura de estoque abaixo do mínimo (dias), sugerindo reposição até o máximo.
     */
    public List<ItemCotacao> buscarItensInteligencia(List<String> gruposSelecionados,
            int diasEstoqueMinimo, int diasEstoqueMaximo, int diasMediaVendas) {
        StringBuilder sql = new StringBuilder(
                "SELECT p.CODIGO, p.DESCRICAO, p.CODBARRAS, p.QUANTIDADE, p.PRECOCUSTO, " +
                "g.NOME AS GRUPO, p.DTULTCOMPRA, p.QTDEULTCOMPRA, p.DTULTVENDA, " +
                "SUM(v.QTDEVENDIDA) AS TOTAL_VENDIDO, " +
                sqlVendidoLiquidoAposCompra("p.CODIGO", "p.DTULTCOMPRA") + " AS VENDIDO_APOS_ULTCOMPRA " +
                "FROM A_VENDAS v " +
                "JOIN PRODUTOS p ON p.CODIGO = v.CODPRODUTO " +
                "LEFT JOIN GRUPOS g ON g.CODIGO = p.CODGRUPO " +
                "WHERE v.DATA > :dataLimite AND v.DATA <= CURRENT_DATE");

        MapSqlParameterSource parametros = new MapSqlParameterSource();
        parametros.addValue("dataLimite", Date.valueOf(LocalDate.now().minusDays(diasMediaVendas)));

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

            // Apenas produtos com cobertura abaixo do mínimo de dias de estoque
            double cobertura = estoque / vmd;
            if (cobertura >= diasEstoqueMinimo) return null;

            // Reposição até o nível máximo de dias de estoque
            int quantidade = (int) Math.ceil((vmd * diasEstoqueMaximo) - estoque);
            if (quantidade <= 0) return null;

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

            Double vendidoApos = lerVendidoLiquido(rs, "VENDIDO_APOS_ULTCOMPRA");
            if (vendidoApos != null) {
                item.setVendidoAposUltCompra(vendidoApos);
            }

            Date ultCompra = rs.getDate("DTULTCOMPRA");
            if (ultCompra != null) item.setUltCompraData(ultCompra.toLocalDate());
            item.setUltCompraQtde(rs.getDouble("QTDEULTCOMPRA"));

            Date ultVenda = rs.getDate("DTULTVENDA");
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