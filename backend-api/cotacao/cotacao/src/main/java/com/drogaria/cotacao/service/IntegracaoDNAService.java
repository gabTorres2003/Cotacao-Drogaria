package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.ItemCotacao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IntegracaoDNAService {

    @Autowired
    @Qualifier("dnaJdbcTemplate")
    private JdbcTemplate dnaJdbcTemplate;

    public List<ItemCotacao> buscarFaltasDiretoDoBanco(List<String> gruposSelecionados) {
        String sql = "SELECT DESCRICAO, ESTOQUE, FALTAS, PRECOCUSTO, GRUPO, " +
                     "VENDIDO_NO_MES, ULTCOMPRA_DATA, ULTCOMPRA_QTDE, " +
                     "ULTVENDA_DATA, VENDIDO_APOS_ULTCOMPRA " +
                     "FROM A_FALTAS";

        List<ItemCotacao> todosItens = dnaJdbcTemplate.query(sql, (rs, rowNum) -> {
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

        if (gruposSelecionados == null || gruposSelecionados.isEmpty()) {
            return todosItens;
        }

        return todosItens.stream()
                .filter(item -> {
                    if (item.getGrupo() == null) return false;
                    
                    String grupoBancoDna = item.getGrupo().trim();
                    return gruposSelecionados.stream()
                            .anyMatch(grupoSel -> grupoSel.equalsIgnoreCase(grupoBancoDna));
                })
                .collect(Collectors.toList());
    }
}