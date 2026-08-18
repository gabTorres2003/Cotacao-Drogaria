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

    private Integer quantidadeCondicao;
    private Double precoCondicao;
    private Integer quantidadeCondicaoSubstituto;
    private Double precoCondicaoSubstituto;

    // CAMPOS PARA RECEBER O JSON DO FRONTEND
    private String condicoesEscalonamento;
    private String condicoesEscalonamentoSubstituto;

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

    public Integer getQuantidadeCondicao() { return quantidadeCondicao; }
    public void setQuantidadeCondicao(Integer quantidadeCondicao) { this.quantidadeCondicao = quantidadeCondicao; }

    public Double getPrecoCondicao() { return precoCondicao; }
    public void setPrecoCondicao(Double precoCondicao) { this.precoCondicao = precoCondicao; }

    public Integer getQuantidadeCondicaoSubstituto() { return quantidadeCondicaoSubstituto; }
    public void setQuantidadeCondicaoSubstituto(Integer quantidadeCondicaoSubstituto) { this.quantidadeCondicaoSubstituto = quantidadeCondicaoSubstituto; }

    public Double getPrecoCondicaoSubstituto() { return precoCondicaoSubstituto; }
    public void setPrecoCondicaoSubstituto(Double precoCondicaoSubstituto) { this.precoCondicaoSubstituto = precoCondicaoSubstituto; }

    public String getCondicoesEscalonamento() { return condicoesEscalonamento; }
    public void setCondicoesEscalonamento(String condicoesEscalonamento) { this.condicoesEscalonamento = condicoesEscalonamento; }

    public String getCondicoesEscalonamentoSubstituto() { return condicoesEscalonamentoSubstituto; }
    public void setCondicoesEscalonamentoSubstituto(String condicoesEscalonamentoSubstituto) { this.condicoesEscalonamentoSubstituto = condicoesEscalonamentoSubstituto; }
}