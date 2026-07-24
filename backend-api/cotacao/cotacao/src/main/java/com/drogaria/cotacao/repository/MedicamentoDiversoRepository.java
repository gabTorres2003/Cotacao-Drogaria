package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.MedicamentoDiverso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicamentoDiversoRepository extends JpaRepository<MedicamentoDiverso, UUID> {
    
    Optional<MedicamentoDiverso> findByCodigoDiversos(String codigoDiversos);
}