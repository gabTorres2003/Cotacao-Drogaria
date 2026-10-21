package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.SugestaoCompra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SugestaoCompraRepository extends JpaRepository<SugestaoCompra, UUID> {
    List<SugestaoCompra> findByDnaGrupoIdOrderByGeradaEmDesc(Integer dnaGrupoId);
    List<SugestaoCompra> findAllByOrderByGeradaEmDesc();
}
