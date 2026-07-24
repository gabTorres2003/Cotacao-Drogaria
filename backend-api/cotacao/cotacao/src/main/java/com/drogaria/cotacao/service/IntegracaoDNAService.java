package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.ItemCotacao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IntegracaoDNAService {

    @Autowired
    @Qualifier("dnaNamedJdbcTemplate")
    private NamedParameterJdbcTemplate dnaNamedJdbcTemplate;

    public List<ItemCotacao> buscarFaltasDiretoDoBanco(List<String> gruposSelecionados) {
        StringBuilder sql = new StringBuilder(
                "SELECT DESCRICAO, ESTOQUE, FALTAS, PRECOCUSTO, GRUPO, " +
                "VENDIDO_NO_MES, ULTCOMPRA_DATA, ULTCOMPRA_QTDE, " +
                "ULTVENDA_DATA, VENDIDO_APOS_ULTCOMPRA " +
                "FROM A_FALTAS"
        );

        MapSqlParameterSource parametros = new MapSqlParameterSource();

        if (gruposSelecionados != null && !gruposSelecionados.isEmpty()) {
            List<String> gruposUpper = gruposSelecionados.stream()
                    .map(String::toUpperCase)
                    .collect(Collectors.toList());
            sql.append(" WHERE UPPER(TRIM(GRUPO)) IN (:gruposSelecionados)");
            parametros.addValue("gruposSelecionados", gruposUpper);
        }

        return dnaNamedJdbcTemplate.query(sql.toString(), parametros, (rs, rowNum) -> {
            ItemCotacao item = new ItemCotacao();
            
            item.setNomeProduto(rs.getString("DESCRICAO"));
            item.setUltimoPreco(rs.getDouble("PRECOCUSTO")); 
            item.setQuantidade((int) rs.getDouble("FALTAS")); 
            item.setEstoque(rs.getDouble("ESTOQUE"));
            item.setGrupo(rs.getString("GRUPO"));
            item.setVendidoNoMes(rs.getDouble("VENDIDO_NO_MES"));
            item.setUltCompraQtde(rs.getDouble("ULTCOMPRA_QTDE"));
            item.setVendidoAposUltCompra(rs.getDouble("VENDIDO_APOS_ULTCOMPRA"));

            Date ultCompra = rs.getDate("ULTCOMPRA_DATA");
            if (ultCompra != null) item.setUltCompraData(ultCompra.toLocalDate());
            
            Date ultVenda = rs.getDate("ULTVENDA_DATA");
            if (ultVenda != null) item.setUltVendaData(ultVenda.toLocalDate());

            return item;
        });
    }
}