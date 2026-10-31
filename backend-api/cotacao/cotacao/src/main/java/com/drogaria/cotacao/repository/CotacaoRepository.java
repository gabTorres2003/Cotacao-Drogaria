package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.dto.response.CotacaoResumoDTO;
import com.drogaria.cotacao.model.Cotacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface CotacaoRepository extends JpaRepository<Cotacao, Long> {
    List<Cotacao> findByDataCriacaoBefore(LocalDateTime dataLimite);

    @Query("SELECT new com.drogaria.cotacao.dto.response.CotacaoResumoDTO(" +
           "c.id, c.dataCriacao, c.status, c.descricao, c.nomeUsuario, c.setor) " +
           "FROM Cotacao c ORDER BY c.dataCriacao DESC")
    List<CotacaoResumoDTO> listarResumos();
}