package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Encomenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface EncomendaRepository extends JpaRepository<Encomenda, UUID> {
    
    @Query("SELECT e FROM Encomenda e WHERE e.comprado = false OR e.comprado IS NULL")
    List<Encomenda> findByCompradoFalseOrCompradoIsNull();
}