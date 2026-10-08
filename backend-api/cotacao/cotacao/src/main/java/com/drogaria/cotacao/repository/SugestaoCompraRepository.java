package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.SugestaoCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SugestaoCompraRepository extends JpaRepository<SugestaoCompra, UUID> {
    List<SugestaoCompra> findByDnaGrupoIdOrderByGeradaEmDesc(Integer dnaGrupoId);
    List<SugestaoCompra> findAllByOrderByGeradaEmDesc();
}
