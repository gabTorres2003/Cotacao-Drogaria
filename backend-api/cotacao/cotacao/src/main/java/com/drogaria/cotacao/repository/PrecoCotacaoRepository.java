package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.model.PrecoCotacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface PrecoCotacaoRepository extends JpaRepository<PrecoCotacao, Long> {

    List<PrecoCotacao> findByItem(ItemCotacao item);
    
    @EntityGraph(attributePaths = {"fornecedor"})
    List<PrecoCotacao> findByItemIn(List<ItemCotacao> itens);
    List<PrecoCotacao> findByFornecedorAndItemIn(Fornecedor fornecedor, List<ItemCotacao> itens);
    
    @Query("SELECT p FROM PrecoCotacao p " +
           "WHERE p.item.nomeProduto = :nomeProduto " +
           "AND p.item.cotacao.status = 'FINALIZADA' " +
           "AND p.precoOfertado > 0 " +
           "ORDER BY p.item.cotacao.id DESC, p.precoOfertado ASC")
    List<PrecoCotacao> findHistoricoPorProduto(@Param("nomeProduto") String nomeProduto);
    
    @Query(value = "SELECT DISTINCT ON (i.nome_produto) p.* " +
           "FROM tb_precos_cotacao p " +
           "JOIN tb_itens_cotacao i ON i.id = p.item_id " +
           "JOIN tb_cotacoes c ON c.id = i.cotacao_id " +
           "WHERE i.nome_produto IN (:nomesProdutos) " +
           "AND c.status = 'FINALIZADA' " +
           "AND c.id <> :idCotacao " +
           "AND p.preco_ofertado > 0 " +
           "ORDER BY i.nome_produto, c.id DESC, p.preco_ofertado ASC",
           nativeQuery = true)
    List<PrecoCotacao> findUltimoHistoricoEmLote(
            @Param("nomesProdutos") List<String> nomesProdutos,
            @Param("idCotacao") Long idCotacao);

    List<PrecoCotacao> findByItem_Cotacao_IdAndFornecedorId(Long cotacaoId, Long fornecedorId);
    List<PrecoCotacao> findByItemIdAndFornecedorId(Long itemId, Long fornecedorId);

    @Query("SELECT COUNT(p) > 0 FROM PrecoCotacao p " +
           "WHERE p.fornecedor.id = :fornecedorId AND p.item.id = :itemId")
    boolean existsByFornecedorIdAndItemId(@Param("fornecedorId") Long fornecedorId, @Param("itemId") Long itemId);

    @Modifying
    @Transactional
    @Query("DELETE FROM PrecoCotacao p WHERE p.item.cotacao.id = :cotacaoId")
    void deletarPorCotacaoId(@Param("cotacaoId") Long cotacaoId);
}