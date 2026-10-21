package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.AnaliseCondicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AnaliseCondicaoRepository extends JpaRepository<AnaliseCondicao, UUID> {
    List<AnaliseCondicao> findByCondicaoItemIdOrderByAnalisadoEmDesc(String condicaoItemId);
}
