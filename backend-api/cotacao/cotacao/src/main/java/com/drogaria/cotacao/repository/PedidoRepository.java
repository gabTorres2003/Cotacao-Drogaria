package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.model.enums.StatusPedido;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByFornecedorId(Long fornecedorId);
    List<Pedido> findByCotacaoId(Long cotacaoId);

    List<Pedido> findByDataCriacaoBefore(LocalDateTime dataLimite);

    @Modifying
    @Query("UPDATE Pedido p SET p.cotacao = null WHERE p.cotacao IS NOT NULL AND p.cotacao.dataCriacao < :limite")
    int desvincularCotacoesAntigas(@Param("limite") LocalDateTime limite);

    @EntityGraph(attributePaths = {"fornecedor", "cotacao", "itens", "itens.itemCotacao"})
    List<Pedido> findByFornecedorIdAndStatusOrderByIdDesc(Long fornecedorId, StatusPedido status);

    @EntityGraph(attributePaths = {"fornecedor", "cotacao", "itens"})
    List<Pedido> findAll();

    @EntityGraph(attributePaths = {"fornecedor", "cotacao", "itens", "itens.itemCotacao"})
    List<Pedido> findByStatusInOrderByDataCriacaoDesc(@Param("status") List<StatusPedido> status);
}