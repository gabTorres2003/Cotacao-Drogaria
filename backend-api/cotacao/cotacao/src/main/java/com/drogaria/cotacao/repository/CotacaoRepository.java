package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Cotacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CotacaoRepository extends JpaRepository<Cotacao, Long> {
    List<Cotacao> findByDataCriacaoBefore(LocalDateTime dataLimite);
}