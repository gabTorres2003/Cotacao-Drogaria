package com.drogaria.cotacao.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_itens_cotacao")
public class ItemCotacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomeProduto; // Vem da Coluna A do Excel

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

    private Integer quantidade; // Vem da Coluna C

    private Double ultimoPreco; // Vem da Coluna D

    @ManyToOne // Muitos itens pertencem a uma cotação
    @JoinColumn(name = "cotacao_id")
    
    private Cotacao cotacao;

    public Cotacao getCotacao() {
        return cotacao;
    }

    public void setCotacao(Cotacao cotacao) {
        this.cotacao = cotacao;
    }

    public Long getId() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getId'");
    }
}