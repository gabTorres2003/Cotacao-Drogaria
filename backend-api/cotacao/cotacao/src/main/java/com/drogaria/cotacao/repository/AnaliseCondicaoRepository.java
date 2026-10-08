package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.AnaliseCondicao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnaliseCondicaoRepository extends JpaRepository<AnaliseCondicao, String> {
    List<AnaliseCondicao> findByCondicaoItemIdOrderByAnalisadoEmDesc(String condicaoItemId);
}
