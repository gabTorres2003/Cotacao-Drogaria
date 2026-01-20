package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "tb_itens_cotacao")
public class ItemCotacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomeProduto;

    public String getNomeProduto() {
        return nomeProduto;
    }

    public void setNomeProduto(String nomeProduto) {
        this.nomeProduto = nomeProduto;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Integer quantidade) {
        this.quantidade = quantidade;
    }

    public Double getUltimoPreco() {
        return ultimoPreco;
    }

    public void setUltimoPreco(Double ultimoPreco) {
        this.ultimoPreco = ultimoPreco;
    }

    private Integer quantidade; 

    private Double ultimoPreco;

    @ManyToOne
    @JoinColumn(name = "cotacao_id")
    @JsonIgnore
    
    private Cotacao cotacao;

    public Cotacao getCotacao() {
        return cotacao;
    }

    public void setCotacao(Cotacao cotacao) {
        this.cotacao = cotacao;
    }

    public Long getId() {
        return id;
    }
}