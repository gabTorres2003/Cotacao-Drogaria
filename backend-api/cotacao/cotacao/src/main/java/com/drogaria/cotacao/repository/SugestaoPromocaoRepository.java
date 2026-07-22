package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.SugestaoPromocao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SugestaoPromocaoRepository extends JpaRepository<SugestaoPromocao, Long> {
    List<SugestaoPromocao> findByCotacaoIdAndFornecedorId(Long cotacaoId, Long fornecedorId);
}