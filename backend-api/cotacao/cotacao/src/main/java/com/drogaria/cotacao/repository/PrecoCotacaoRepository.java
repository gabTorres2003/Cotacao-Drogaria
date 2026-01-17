package com.drogaria.cotacao.repository;
import com.drogaria.cotacao.model.PrecoCotacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrecoCotacaoRepository extends JpaRepository<PrecoCotacao, Long> {
}