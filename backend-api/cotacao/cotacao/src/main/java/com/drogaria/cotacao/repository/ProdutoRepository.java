package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    @Query("SELECT p FROM Produto p WHERE CAST(p.codigo AS string) = :termo OR p.codbarras = :termo")
    List<Produto> buscarPorCodigoExato(@Param("termo") String termo);
}