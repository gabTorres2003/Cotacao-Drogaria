package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Encomenda;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface EncomendaRepository extends JpaRepository<Encomenda, UUID> {
    List<Encomenda> findByCompradoFalseOrCompradoIsNull();
}