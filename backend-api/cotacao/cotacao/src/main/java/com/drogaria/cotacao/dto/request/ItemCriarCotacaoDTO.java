package com.drogaria.cotacao.dto.request;

public class ItemCriarCotacaoDTO {
    private String nomeProduto;
    private Integer quantidade;

    public String getNomeProduto() { return nomeProduto; }
    public void setNomeProduto(String nomeProduto) { this.nomeProduto = nomeProduto; }

    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
}