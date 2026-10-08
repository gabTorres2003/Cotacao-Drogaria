package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.AnaliseCondicaoFluxoFinanceiro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnaliseCondicaoFluxoFinanceiroRepository extends JpaRepository<AnaliseCondicaoFluxoFinanceiro, String> {
    List<AnaliseCondicaoFluxoFinanceiro> findByAnaliseIdOrderByNumeroParcelaAsc(String analiseId);
}
