package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.ParametrosInteligenciaCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParametrosInteligenciaCompraRepository extends JpaRepository<ParametrosInteligenciaCompra, String> {
    Optional<ParametrosInteligenciaCompra> findFirstByAtivoTrue();
    Optional<ParametrosInteligenciaCompra> findByNome(String nome);
}
