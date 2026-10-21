package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.SugestaoCompraItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface SugestaoCompraItemRepository extends JpaRepository<SugestaoCompraItem, UUID> {
    List<SugestaoCompraItem> findBySugestaoIdOrderByProdutoNomeAsc(UUID sugestaoId);
    List<SugestaoCompraItem> findBySugestaoIdAndDecisaoNot(UUID sugestaoId, String decisao);
    List<SugestaoCompraItem> findBySugestaoIdIn(Collection<UUID> sugestaoIds);
}
