package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Encomenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface EncomendaRepository extends JpaRepository<Encomenda, UUID> {
    
    @Query(value = "SELECT * FROM encomendas WHERE comprado = false OR comprado IS NULL", nativeQuery = true)
    List<Encomenda> findByCompradoFalseOrCompradoIsNull();
}