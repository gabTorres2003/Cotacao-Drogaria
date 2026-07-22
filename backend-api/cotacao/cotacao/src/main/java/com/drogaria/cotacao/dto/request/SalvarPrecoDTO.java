package com.drogaria.cotacao.dto.request;

public class SalvarPrecoDTO {
    private Long idItem;       
    private Long idFornecedor; 
    private Double preco;      
    private Integer quantidadeDisponivel;
    private String observacao;
    private String produtoSubstituto;
    private Double precoSubstituto;
    private Integer quantidadeSubstituto;

    // Getters e Setters
    public Long getIdItem() { return idItem; }
    public void setIdItem(Long idItem) { this.idItem = idItem; }

    public Long getIdFornecedor() { return idFornecedor; }
    public void setIdFornecedor(Long idFornecedor) { this.idFornecedor = idFornecedor; }

    public Double getPreco() { return preco; }
    public void setPreco(Double preco) { this.preco = preco; }

    public Integer getQuantidadeDisponivel() { return quantidadeDisponivel; }
    public void setQuantidadeDisponivel(Integer quantidadeDisponivel) { this.quantidadeDisponivel = quantidadeDisponivel; }

    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }

    public String getProdutoSubstituto() { return produtoSubstituto; }
    public void setProdutoSubstituto(String produtoSubstituto) { this.produtoSubstituto = produtoSubstituto; }

    public Double getPrecoSubstituto() { return precoSubstituto; }
    public void setPrecoSubstituto(Double precoSubstituto) { this.precoSubstituto = precoSubstituto; }

    public Integer getQuantidadeSubstituto() { return quantidadeSubstituto; }
    public void setQuantidadeSubstituto(Integer quantidadeSubstituto) { this.quantidadeSubstituto = quantidadeSubstituto; }
}