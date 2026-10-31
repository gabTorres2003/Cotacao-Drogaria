package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.ItemPedido;
import com.drogaria.cotacao.model.enums.StatusPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ItemPedidoRepository extends JpaRepository<ItemPedido, Long> {
    List<ItemPedido> findByPedidoId(Long pedidoId);
    boolean existsByItemCotacaoIdAndPedidoStatusNot(Long itemCotacaoId, StatusPedido status);

    @Query("SELECT ip.pedido.id, ip.id, ip.nomeProduto, ip.quantidadePedida, ip.valorUnitarioPedido, " +
           "ip.codigoBarrasRecebido, ic.id, ic.nomeProduto, ic.grupo, ic.codBarras " +
           "FROM ItemPedido ip LEFT JOIN ip.itemCotacao ic WHERE ip.pedido.id IN :pedidoIds")
    List<Object[]> buscarResumoItensPorPedidos(@Param("pedidoIds") List<Long> pedidoIds);

    @Modifying
    @Query("UPDATE ItemPedido ip SET ip.itemCotacao = null WHERE ip.itemCotacao IS NOT NULL AND ip.itemCotacao.cotacao.dataCriacao < :limite")
    int desvincularItemCotacaoAntigo(@Param("limite") LocalDateTime limite);
}