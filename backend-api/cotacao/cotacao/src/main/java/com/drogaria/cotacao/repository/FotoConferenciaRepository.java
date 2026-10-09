package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.FotoConferencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FotoConferenciaRepository extends JpaRepository<FotoConferencia, Long> {
    List<FotoConferencia> findByPedidoIdOrderByDataCriacaoAsc(Long pedidoId);
}
