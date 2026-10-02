package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.ItemPedido;
import com.drogaria.cotacao.model.enums.StatusPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ItemPedidoRepository extends JpaRepository<ItemPedido, Long> {
    List<ItemPedido> findByPedidoId(Long pedidoId);
    boolean existsByItemCotacaoIdAndPedidoStatusNot(Long itemCotacaoId, StatusPedido status);

    @Modifying
    @Query("UPDATE ItemPedido ip SET ip.itemCotacao = null WHERE ip.itemCotacao IS NOT NULL AND ip.itemCotacao.cotacao.dataCriacao < :limite")
    int desvincularItemCotacaoAntigo(@Param("limite") LocalDateTime limite);
}