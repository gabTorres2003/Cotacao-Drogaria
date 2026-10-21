package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.ParametrosInteligenciaCompra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ParametrosInteligenciaCompraRepository extends JpaRepository<ParametrosInteligenciaCompra, UUID> {
    Optional<ParametrosInteligenciaCompra> findFirstByAtivoTrue();
    Optional<ParametrosInteligenciaCompra> findByNome(String nome);
}
