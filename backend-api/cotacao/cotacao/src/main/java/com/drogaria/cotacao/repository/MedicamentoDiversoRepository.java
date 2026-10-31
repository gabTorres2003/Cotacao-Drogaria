package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.dto.response.MedicamentoDiversoResumoDTO;
import com.drogaria.cotacao.model.MedicamentoDiverso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MedicamentoDiversoRepository extends JpaRepository<MedicamentoDiverso, UUID> {
    
    Optional<MedicamentoDiverso> findByCodigoDiversos(String codigoDiversos);

    @Query("SELECT new com.drogaria.cotacao.dto.response.MedicamentoDiversoResumoDTO(" +
           "m.codigoDiversos, m.produto) FROM MedicamentoDiverso m")
    List<MedicamentoDiversoResumoDTO> listarResumos();
}