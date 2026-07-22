package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ItemCotacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface ItemCotacaoRepository extends JpaRepository<ItemCotacao, Long> {

    List<ItemCotacao> findByCotacao(Cotacao cotacao);
    @Modifying
    @Transactional
    @Query("DELETE FROM ItemCotacao i WHERE i.cotacao.id = :cotacaoId")
    void deletarPorCotacaoId(@Param("cotacaoId") Long cotacaoId);
}