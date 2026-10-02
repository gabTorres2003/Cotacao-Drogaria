package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Devolucao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DevolucaoRepository extends JpaRepository<Devolucao, Long> {
    List<Devolucao> findByFornecedorIdOrderByDataSolicitacaoDesc(Long fornecedorId);
    List<Devolucao> findByPedidoId(Long pedidoId);

    @Modifying
    @Query("UPDATE Devolucao d SET d.pedido = null WHERE d.pedido IS NOT NULL AND d.pedido.dataCriacao < :limite")
    int desvincularPedidosAntigos(@Param("limite") LocalDateTime limite);
}