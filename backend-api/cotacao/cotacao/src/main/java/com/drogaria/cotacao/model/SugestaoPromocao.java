package com.drogaria.cotacao.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_sugestoes_promocao")
public class SugestaoPromocao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cotacao_id", nullable = false)
    private Cotacao cotacao;

    @ManyToOne
    @JoinColumn(name = "fornecedor_id", nullable = false)
    private Fornecedor fornecedor;

    @Column(name = "nome_produto", nullable = false)
    private String nomeProduto;

    @Column(name = "preco", nullable = false)
    private Double preco;

    @Column(name = "qtd_minima")
    private Integer qtdMinima;

    @Column(name = "observacao")
    private String observacao;

    @Column(name = "quantidade_condicao")
    private Integer quantidadeCondicao;

    @Column(name = "preco_condicao")
    private Double precoCondicao;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Cotacao getCotacao() { return cotacao; }
    public void setCotacao(Cotacao cotacao) { this.cotacao = cotacao; }

    public Fornecedor getFornecedor() { return fornecedor; }
    public void setFornecedor(Fornecedor fornecedor) { this.fornecedor = fornecedor; }

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
}