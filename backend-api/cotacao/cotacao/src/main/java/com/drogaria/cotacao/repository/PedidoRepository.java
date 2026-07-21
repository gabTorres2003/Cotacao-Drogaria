package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByFornecedorId(Long fornecedorId);
    List<Pedido> findByCotacaoId(Long cotacaoId);
}