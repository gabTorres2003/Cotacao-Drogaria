package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.Fornecedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FornecedorRepository extends JpaRepository<Fornecedor, Long> {
    Optional<Fornecedor> findByLoginAndSenha(String login, String senha);
    Optional<Fornecedor> findByLogin(String login);
    Optional<Fornecedor> findByNome(String nome);
}