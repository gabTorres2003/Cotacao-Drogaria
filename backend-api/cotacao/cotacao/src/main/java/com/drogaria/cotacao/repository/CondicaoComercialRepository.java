package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.CondicaoComercial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CondicaoComercialRepository extends JpaRepository<CondicaoComercial, UUID> {
    List<CondicaoComercial> findByDataCondicaoBetween(java.time.LocalDate inicio, java.time.LocalDate fim);
    List<CondicaoComercial> findByStatusOrderByDataCondicaoDesc(String status);
}
