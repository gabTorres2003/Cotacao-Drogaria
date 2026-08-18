package com.drogaria.cotacao.dto.response;

public class SugestaoPromocaoResponseDTO {

    private Long id;
    private String fornecedorNome;
    private String nomeProduto;
    private Double preco;
    private Integer qtdMinima;
    private String observacao;

    private Integer quantidadeCondicao;
    private Double precoCondicao;

    // NOVO CAMPO: Para transportar o Array JSON com múltiplas condições
    private String condicoesEscalonamento;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFornecedorNome() { return fornecedorNome; }
    public void setFornecedorNome(String fornecedorNome) { this.fornecedorNome = fornecedorNome; }

    public String getNomeProduto() { return nomeProduto; }
    public void setNomeProduto(String nomeProduto) { this.nomeProduto = nomeProduto; }

    public Double getPreco() { return preco; }
    public void setPreco(Double preco) { this.preco = preco; }

    public Integer getQtdMinima() { return qtdMinima; }
    public void setQtdMinima(Integer qtdMinima) { this.qtdMinima = qtdMinima; }

    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }

    public Integer getQuantidadeCondicao() { return quantidadeCondicao; }
    public void setQuantidadeCondicao(Integer quantidadeCondicao) { this.quantidadeCondicao = quantidadeCondicao; }

    public Double getPrecoCondicao() { return precoCondicao; }
    public void setPrecoCondicao(Double precoCondicao) { this.precoCondicao = precoCondicao; }

    public String getCondicoesEscalonamento() { return condicoesEscalonamento; }
    public void setCondicoesEscalonamento(String condicoesEscalonamento) { this.condicoesEscalonamento = condicoesEscalonamento; }
}