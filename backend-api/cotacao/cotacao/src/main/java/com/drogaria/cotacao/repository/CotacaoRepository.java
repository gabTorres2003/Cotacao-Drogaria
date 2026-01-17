package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Cotacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CotacaoRepository extends JpaRepository<Cotacao, Long> {
}