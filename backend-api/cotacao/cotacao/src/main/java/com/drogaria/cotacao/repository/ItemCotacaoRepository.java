package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.ItemCotacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemCotacaoRepository extends JpaRepository<ItemCotacao, Long> {}