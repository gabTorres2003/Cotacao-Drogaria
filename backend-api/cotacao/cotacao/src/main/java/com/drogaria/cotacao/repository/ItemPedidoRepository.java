package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.ItemPedido;
import com.drogaria.cotacao.model.enums.StatusPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemPedidoRepository extends JpaRepository<ItemPedido, Long> {
    List<ItemPedido> findByPedidoId(Long pedidoId);
    boolean existsByItemCotacaoIdAndPedidoStatusNot(Long itemCotacaoId, StatusPedido status);
}