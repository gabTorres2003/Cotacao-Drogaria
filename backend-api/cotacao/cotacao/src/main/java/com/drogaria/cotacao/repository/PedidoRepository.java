package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.model.enums.StatusPedido;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByFornecedorId(Long fornecedorId);

    @Query("SELECT DISTINCT p FROM Pedido p LEFT JOIN FETCH p.itens WHERE p.fornecedor.id = :fornecedorId")
    List<Pedido> findWithItensByFornecedorId(@Param("fornecedorId") Long fornecedorId);
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

    @Query("SELECT p.status, COUNT(p) FROM Pedido p GROUP BY p.status")
    List<Object[]> contarPorStatus();
}