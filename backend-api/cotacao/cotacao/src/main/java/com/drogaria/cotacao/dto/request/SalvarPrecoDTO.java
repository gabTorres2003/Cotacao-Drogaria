package com.drogaria.cotacao.dto.request;

public class SalvarPrecoDTO {
    private Long idItem;       // ID do remédio na tabela de itens
    private Long idFornecedor; // ID do fornecedor
    private String preco;      // Valor digitado

    // Getters e Setters
    public Long getIdItem() { return idItem; }
    public void setIdItem(Long idItem) { this.idItem = idItem; }
    public Long getIdFornecedor() { return idFornecedor; }
    public void setIdFornecedor(Long idFornecedor) { this.idFornecedor = idFornecedor; }
    public String getPreco() { return preco; }
    public void setPreco(String preco) { this.preco = preco; }
}