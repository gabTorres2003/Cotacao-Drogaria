package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.ConfiguracaoFornecedorInteligencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConfiguracaoFornecedorInteligenciaRepository extends JpaRepository<ConfiguracaoFornecedorInteligencia, String> {
    Optional<ConfiguracaoFornecedorInteligencia> findByDnaFornecedorIdAndAtivoTrue(Integer dnaFornecedorId);
    Optional<ConfiguracaoFornecedorInteligencia> findByFornecedorId(Long fornecedorId);
    List<ConfiguracaoFornecedorInteligencia> findAllByOrderByFornecedorNomeAsc();
}
