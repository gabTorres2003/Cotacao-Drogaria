package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.dto.response.CotacaoFornecedorResumoDTO;
import com.drogaria.cotacao.model.CotacaoFornecedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CotacaoFornecedorRepository extends JpaRepository<CotacaoFornecedor, Long> {
    
    List<CotacaoFornecedor> findByFornecedorLogin(String login);
    
    List<CotacaoFornecedor> findByFornecedorId(Long fornecedorId);

    @Query("SELECT new com.drogaria.cotacao.dto.response.CotacaoFornecedorResumoDTO(" +
           "cf.id, cf.status, c.id, c.status, c.dataCriacao) " +
           "FROM CotacaoFornecedor cf JOIN cf.cotacao c " +
           "WHERE cf.fornecedor.id = :fornecedorId ORDER BY cf.id ASC")
    List<CotacaoFornecedorResumoDTO> listarResumosPorFornecedorId(@Param("fornecedorId") Long fornecedorId);

    List<CotacaoFornecedor> findByCotacaoIdAndFornecedorId(Long cotacaoId, Long fornecedorId);
    
    List<CotacaoFornecedor> findByCotacaoId(Long cotacaoId);
}