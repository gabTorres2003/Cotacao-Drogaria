package com.drogaria.cotacao.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "medicamentos_diversos")
public class MedicamentoDiverso {

    @Id
    private UUID id;

    @Column(name = "produto", nullable = false)
    private String produto;

    @Column(name = "codigo_diversos")
    private String codigoDiversos;

    @Column(name = "preco")
    private Double preco;

    @Column(name = "categoria", nullable = false)
    private String categoria;

    @Column(name = "classificacao")
    private String classificacao;

    // Getters e Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getProduto() { return produto; }
    public void setProduto(String produto) { this.produto = produto; }

    public String getCodigoDiversos() { return codigoDiversos; }
    public void setCodigoDiversos(String codigoDiversos) { this.codigoDiversos = codigoDiversos; }

    public Double getPreco() { return preco; }
    public void setPreco(Double preco) { this.preco = preco; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getClassificacao() { return classificacao; }
    public void setClassificacao(String classificacao) { this.classificacao = classificacao; }
}