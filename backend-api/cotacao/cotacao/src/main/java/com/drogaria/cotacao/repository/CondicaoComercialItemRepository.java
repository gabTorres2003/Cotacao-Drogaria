package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.CondicaoComercialItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CondicaoComercialItemRepository extends JpaRepository<CondicaoComercialItem, UUID> {
    List<CondicaoComercialItem> findByCondicaoId(String condicaoId);
}
