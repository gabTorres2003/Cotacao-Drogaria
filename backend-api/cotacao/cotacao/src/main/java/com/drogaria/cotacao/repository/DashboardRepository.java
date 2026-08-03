package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.dto.response.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class DashboardRepository {

    private final EntityManager em;

    public DashboardGeralDTO obterResumoGeral() {
        DashboardGeralDTO dto = new DashboardGeralDTO(0.0, 0.0, 0L, 0L, 0.0);

        String sqlSaving = "SELECT SUM((ic.ultimo_preco - ip.valor_unitario_pedido) * ip.quantidade_pedida) AS saving, " +
                           "SUM(ip.valor_unitario_pedido * ip.quantidade_pedida) AS gasto " +
                           "FROM tb_itens_pedido ip " +
                           "JOIN tb_itens_cotacao ic ON ip.item_cotacao_id = ic.id " +
                           "WHERE ic.ultimo_preco > ip.valor_unitario_pedido";
        Object[] resultSaving = (Object[]) em.createNativeQuery(sqlSaving).getSingleResult();
        
        if (resultSaving != null && resultSaving[0] != null) {
            double saving = ((Number) resultSaving[0]).doubleValue();
            double gasto = resultSaving[1] != null ? ((Number) resultSaving[1]).doubleValue() : 0.0;
            dto.setTotalSaving(saving);
            dto.setSavingPercentual(gasto > 0 ? (saving / (saving + gasto)) * 100 : 0.0);
        }

        String sqlPendentes = "SELECT COUNT(id) FROM tb_pedidos WHERE status IN ('PENDENTE_ENTREGA', 'CONFIRMADO_FORNECEDOR')";
        dto.setPedidosPendentes(((Number) em.createNativeQuery(sqlPendentes).getSingleResult()).longValue());

        String sqlFaltas = "SELECT COUNT(id) FROM tb_pedidos WHERE status IN ('DIVERGENCIA', 'ENTREGUE_COM_FALTA', 'VALORES_INCOMPATIVEIS')";
        dto.setEntregasComFalta(((Number) em.createNativeQuery(sqlFaltas).getSingleResult()).longValue());

        String sqlDevolucoes = "SELECT SUM(valor_total) FROM tb_devolucoes WHERE status IN ('AGUARDANDO_RECOLHIMENTO', 'AGUARDANDO_CREDITO')";
        Object resultDev = em.createNativeQuery(sqlDevolucoes).getSingleResult();
        if (resultDev != null) {
            dto.setTotalDevolucoesPendentes(((Number) resultDev).doubleValue());
        }

        return dto;
    }

    public List<FornecedorDesempenhoDTO> obterRankingFornecedores() {
        String sql = "SELECT f.empresa, f.nome, " +
                     "(SELECT COUNT(DISTINCT ic.cotacao_id) FROM tb_precos_cotacao pc JOIN tb_itens_cotacao ic ON pc.item_id = ic.id WHERE pc.fornecedor_id = f.id) AS participadas, " +
                     "COUNT(DISTINCT p.cotacao_id) AS ganhas, " +
                     "SUM(p.valor_total_pedido) AS total_comprado " +
                     "FROM tb_fornecedores f " +
                     "JOIN tb_pedidos p ON p.fornecedor_id = f.id " +
                     "GROUP BY f.id, f.empresa, f.nome " +
                     "ORDER BY total_comprado DESC LIMIT 10";

        List<Object[]> results = em.createNativeQuery(sql).getResultList();
        List<FornecedorDesempenhoDTO> list = new ArrayList<>();
        
        for (Object[] row : results) {
            String empresa = row[0] != null ? row[0].toString() : (row[1] != null ? row[1].toString() : "N/A");
            long participadas = ((Number) row[2]).longValue();
            long ganhas = ((Number) row[3]).longValue();
            double totalComprado = row[4] != null ? ((Number) row[4]).doubleValue() : 0.0;
            
            double winRate = participadas > 0 ? ((double) ganhas / participadas) * 100 : 0.0;
            list.add(new FornecedorDesempenhoDTO(empresa, participadas, ganhas, winRate, totalComprado));
        }
        return list;
    }

    public List<RupturaAlertaDTO> obterAlertasRuptura() {
        String sql = "SELECT ip.nome_produto, COUNT(ip.id) AS vezes_falta, MAX(COALESCE(f.empresa, f.nome)) AS ultimo_fornecedor " +
                     "FROM tb_itens_pedido ip " +
                     "JOIN tb_pedidos p ON ip.pedido_id = p.id " +
                     "JOIN tb_fornecedores f ON p.fornecedor_id = f.id " +
                     "WHERE ip.quantidade_real < ip.quantidade_pedida OR ip.status_recebimento IN ('AVARIADO', 'INCORRETO') " +
                     "GROUP BY ip.nome_produto " +
                     "ORDER BY vezes_falta DESC LIMIT 10";

        List<Object[]> results = em.createNativeQuery(sql).getResultList();
        List<RupturaAlertaDTO> list = new ArrayList<>();
        
        for (Object[] row : results) {
            String nomeProduto = row[0] != null ? row[0].toString() : "Desconhecido";
            long vezesFalta = ((Number) row[1]).longValue();
            String ultimoFornecedor = row[2] != null ? row[2].toString() : "-";
            
            String frequencia = vezesFalta >= 5 ? "Alta" : (vezesFalta >= 3 ? "Média" : "Baixa");
            list.add(new RupturaAlertaDTO(nomeProduto, vezesFalta, frequencia, ultimoFornecedor));
        }
        return list;
    }
}