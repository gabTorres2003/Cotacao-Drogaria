package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.CondicaoComercial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CondicaoComercialRepository extends JpaRepository<CondicaoComercial, String> {
    List<CondicaoComercial> findByDataCondicaoBetween(java.time.LocalDate inicio, java.time.LocalDate fim);
    List<CondicaoComercial> findByStatusOrderByDataCondicaoDesc(String status);
}
