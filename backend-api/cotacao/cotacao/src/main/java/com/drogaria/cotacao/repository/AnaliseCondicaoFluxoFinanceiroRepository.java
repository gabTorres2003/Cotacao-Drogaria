package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.AnaliseCondicaoFluxoFinanceiro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AnaliseCondicaoFluxoFinanceiroRepository extends JpaRepository<AnaliseCondicaoFluxoFinanceiro, UUID> {
    List<AnaliseCondicaoFluxoFinanceiro> findByAnaliseIdOrderByNumeroParcelaAsc(String analiseId);
}
