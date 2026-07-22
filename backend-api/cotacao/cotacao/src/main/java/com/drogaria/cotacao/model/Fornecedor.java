package com.drogaria.cotacao.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_fornecedores")
public class Fornecedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    
    @Column(name = "empresa")
    private String empresa;

    private String email;
    private String telefone;
    private String login;
    private String senha;

    @Column(name = "primeiro_acesso")
    private Boolean primeiroAcesso = true;

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEmpresa() { return empresa; }
    public void setEmpresa(String empresa) { this.empresa = empresa; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }

    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }

    public Boolean getPrimeiroAcesso() { return primeiroAcesso; }
    public void setPrimeiroAcesso(Boolean primeiroAcesso) { this.primeiroAcesso = primeiroAcesso; }
}