package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.model.enums.StatusPedido;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByFornecedorId(Long fornecedorId);
    List<Pedido> findByCotacaoId(Long cotacaoId);

    @EntityGraph(attributePaths = {"fornecedor", "cotacao", "itens"})
    List<Pedido> findAll();

    @EntityGraph(attributePaths = {"fornecedor", "cotacao", "itens", "itens.itemCotacao", "sugestoes"})
    @Query("SELECT p FROM Pedido p WHERE p.status IN :statuses ORDER BY p.dataCriacao DESC")
    List<Pedido> findByStatusesIn(@Param("statuses") List<StatusPedido> statuses);
}