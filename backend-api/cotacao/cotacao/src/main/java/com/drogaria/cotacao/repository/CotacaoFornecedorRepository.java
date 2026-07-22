package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.CotacaoFornecedor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CotacaoFornecedorRepository extends JpaRepository<CotacaoFornecedor, Long> {
    List<CotacaoFornecedor> findByFornecedorLogin(String login);
    Optional<CotacaoFornecedor> findByCotacaoIdAndFornecedorId(Long cotacaoId, Long fornecedorId);
}