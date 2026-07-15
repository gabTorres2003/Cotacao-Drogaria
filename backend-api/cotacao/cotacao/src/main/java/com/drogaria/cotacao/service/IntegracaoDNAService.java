package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.ItemCotacao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.util.List;

@Service
public class IntegracaoDNAService {

    @Autowired
    @Qualifier("dnaJdbcTemplate") // Aponta para a configuração secundária do Firebird
    private JdbcTemplate dnaJdbcTemplate;

    public List<ItemCotacao> buscarFaltasDiretoDoBanco() {
        // Query consumindo todos os dados gerados pela View
        String sql = "SELECT DESCRICAO, ESTOQUE, FALTAS, PRECOCUSTO, GRUPO, " +
                     "VENDIDO_NO_MES, ULTCOMPRA_DATA, ULTCOMPRA_QTDE, " +
                     "ULTVENDA_DATA, VENDIDO_APOS_ULTCOMPRA " +
                     "FROM A_FALTAS";

        return dnaJdbcTemplate.query(sql, (rs, rowNum) -> {
            ItemCotacao item = new ItemCotacao();
            
            // Dados essenciais
            item.setNomeProduto(rs.getString("DESCRICAO"));
            item.setUltimoPreco(rs.getDouble("PRECOCUSTO"));
            
            // Como no seu model atual 'quantidade' é Integer e no banco DNA é NUMERIC(15,3)
            item.setQuantidade((int) rs.getDouble("FALTAS")); 
            
            // Dados Extras para Análise de Compra
            item.setEstoque(rs.getDouble("ESTOQUE"));
            item.setGrupo(rs.getString("GRUPO"));
            item.setVendidoNoMes(rs.getDouble("VENDIDO_NO_MES"));
            item.setUltCompraQtde(rs.getDouble("ULTCOMPRA_QTDE"));
            item.setVendidoAposUltCompra(rs.getDouble("VENDIDO_APOS_ULTCOMPRA"));

            // Tratamento de Datas (Evita NullPointerException se o produto nunca foi comprado/vendido)
            Date ultCompra = rs.getDate("ULTCOMPRA_DATA");
            if (ultCompra != null) item.setUltCompraData(ultCompra.toLocalDate());
            
            Date ultVenda = rs.getDate("ULTVENDA_DATA");
            if (ultVenda != null) item.setUltVendaData(ultVenda.toLocalDate());

            return item;
        });
    }
}