package com.drogaria.cotacao.dto.request;

public class SalvarPrecoDTO {
    private Long idItem;       // ID do remédio na tabela de itens
    private Long idFornecedor; // ID do fornecedor
    private Double preco;      // Valor digitado
    private Integer quantidadeDisponivel;

    // Getters e Setters
    public Long getIdItem() { return idItem; }
    public void setIdItem(Long idItem) { this.idItem = idItem; }
    public Long getIdFornecedor() { return idFornecedor; }
    public void setIdFornecedor(Long idFornecedor) { this.idFornecedor = idFornecedor; }
    public Double getPreco() { return preco; }
    public void setPreco(Double preco) { this.preco = preco; }
    public Integer getQuantidadeDisponivel() { return quantidadeDisponivel; }
    public void setQuantidadeDisponivel(Integer quantidadeDisponivel) { this.quantidadeDisponivel = quantidadeDisponivel; }
}