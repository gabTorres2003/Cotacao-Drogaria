package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.ConfiguracaoGrupoCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConfiguracaoGrupoCompraRepository extends JpaRepository<ConfiguracaoGrupoCompra, String> {
    Optional<ConfiguracaoGrupoCompra> findByDnaGrupoIdAndAtivoTrue(Integer dnaGrupoId);
    Optional<ConfiguracaoGrupoCompra> findByDnaGrupoId(Integer dnaGrupoId);
    List<ConfiguracaoGrupoCompra> findAllByOrderByDnaGrupoNomeAsc();
}
