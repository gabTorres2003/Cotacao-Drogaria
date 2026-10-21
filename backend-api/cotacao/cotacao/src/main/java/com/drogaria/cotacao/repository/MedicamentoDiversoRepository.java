package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.MedicamentoDiverso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MedicamentoDiversoRepository extends JpaRepository<MedicamentoDiverso, UUID> {
    
    Optional<MedicamentoDiverso> findByCodigoDiversos(String codigoDiversos);
}