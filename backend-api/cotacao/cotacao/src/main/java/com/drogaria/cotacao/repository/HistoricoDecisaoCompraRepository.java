package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.HistoricoDecisaoCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HistoricoDecisaoCompraRepository extends JpaRepository<HistoricoDecisaoCompra, UUID> {
    List<HistoricoDecisaoCompra> findBySugestaoItemIdOrderByCreatedAtDesc(UUID sugestaoItemId);
}
