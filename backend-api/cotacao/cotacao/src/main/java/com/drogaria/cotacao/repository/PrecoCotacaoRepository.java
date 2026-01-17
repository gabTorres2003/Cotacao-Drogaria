package com.drogaria.cotacao.repository;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.model.PrecoCotacao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrecoCotacaoRepository extends JpaRepository<PrecoCotacao, Long> {

    List<PrecoCotacao> findByItem(ItemCotacao item);
}