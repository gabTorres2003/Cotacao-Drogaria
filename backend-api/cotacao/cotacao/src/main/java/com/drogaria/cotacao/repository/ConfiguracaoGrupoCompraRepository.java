package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.ConfiguracaoGrupoCompra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConfiguracaoGrupoCompraRepository extends JpaRepository<ConfiguracaoGrupoCompra, UUID> {
    Optional<ConfiguracaoGrupoCompra> findByDnaGrupoIdAndAtivoTrue(Integer dnaGrupoId);
    Optional<ConfiguracaoGrupoCompra> findByDnaGrupoId(Integer dnaGrupoId);
    List<ConfiguracaoGrupoCompra> findAllByOrderByDnaGrupoNomeAsc();
}
