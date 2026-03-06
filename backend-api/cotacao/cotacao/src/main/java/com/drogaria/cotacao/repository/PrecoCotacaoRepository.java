package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.model.PrecoCotacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrecoCotacaoRepository extends JpaRepository<PrecoCotacao, Long> {

    List<PrecoCotacao> findByItem(ItemCotacao item);
    
    List<PrecoCotacao> findByItemIn(List<ItemCotacao> itens);
    @Query("SELECT p FROM PrecoCotacao p " +
           "WHERE p.item.nomeProduto = :nomeProduto " +
           "AND p.item.cotacao.status = 'FINALIZADA' " +
           "AND p.precoOfertado > 0 " +
           "ORDER BY p.item.cotacao.id DESC, p.precoOfertado ASC")

    List<PrecoCotacao> findHistoricoPorProduto(@Param("nomeProduto") String nomeProduto);
    @Query("SELECT p FROM PrecoCotacao p " +
           "WHERE p.item.nomeProduto IN :nomesProdutos " +
           "AND p.item.cotacao.status = 'FINALIZADA' " +
           "AND p.precoOfertado > 0 " +
           "ORDER BY p.item.cotacao.id DESC, p.precoOfertado ASC")
    List<PrecoCotacao> findHistoricoEmLote(@Param("nomesProdutos") List<String> nomesProdutos);
}