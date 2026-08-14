package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.ProdutoDna;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProdutoDnaRepository extends JpaRepository<ProdutoDna, Integer> {

    @Query("SELECT p FROM ProdutoDna p WHERE (p.codigo = :codigo OR p.codbarras = :codbarras) AND p.inativo = 'N'")
    Optional<ProdutoDna> buscarPorCodigoOuBarrasNoDna(@Param("codigo") Integer codigo, @Param("codbarras") String codbarras);
}