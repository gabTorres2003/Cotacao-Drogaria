package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ItemCotacao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemCotacaoRepository extends JpaRepository<ItemCotacao, Long> {

    List<ItemCotacao> findByCotacao(Cotacao cotacao);}