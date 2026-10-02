package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.SugestaoPromocao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SugestaoPromocaoRepository extends JpaRepository<SugestaoPromocao, Long> {
    List<SugestaoPromocao> findByCotacaoIdAndFornecedorId(Long cotacaoId, Long fornecedorId);
    List<SugestaoPromocao> findByCotacaoId(Long cotacaoId);

    @Modifying
    @Query("DELETE FROM SugestaoPromocao s WHERE s.cotacao.dataCriacao < :limite")
    int excluirPorCotacaoAntiga(@Param("limite") LocalDateTime limite);
}