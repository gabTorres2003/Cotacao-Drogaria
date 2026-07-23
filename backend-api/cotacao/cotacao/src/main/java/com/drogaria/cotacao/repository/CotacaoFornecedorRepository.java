package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.CotacaoFornecedor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CotacaoFornecedorRepository extends JpaRepository<CotacaoFornecedor, Long> {
    
    List<CotacaoFornecedor> findByFornecedorLogin(String login);
    
    List<CotacaoFornecedor> findByCotacaoIdAndFornecedorId(Long cotacaoId, Long fornecedorId);
    
    List<CotacaoFornecedor> findByCotacaoId(Long cotacaoId);
}