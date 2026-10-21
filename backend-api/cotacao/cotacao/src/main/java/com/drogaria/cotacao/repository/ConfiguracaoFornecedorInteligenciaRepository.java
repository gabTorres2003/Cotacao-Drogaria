package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.ConfiguracaoFornecedorInteligencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConfiguracaoFornecedorInteligenciaRepository extends JpaRepository<ConfiguracaoFornecedorInteligencia, UUID> {
    Optional<ConfiguracaoFornecedorInteligencia> findByDnaFornecedorIdAndAtivoTrue(Integer dnaFornecedorId);
    Optional<ConfiguracaoFornecedorInteligencia> findByFornecedorId(Long fornecedorId);
    List<ConfiguracaoFornecedorInteligencia> findAllByOrderByFornecedorNomeAsc();
}
