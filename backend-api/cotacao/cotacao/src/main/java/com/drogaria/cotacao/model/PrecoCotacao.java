package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_precos_cotacao")
public class PrecoCotacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "item_id")
    private ItemCotacao item;

    @ManyToOne
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor;

    private Double precoOfertado;

    @Column(name = "preco_original")
    private Double precoOriginal;

    private LocalDateTime dataResposta;
    private Integer quantidadeDisponivel;

    @Column(name = "observacao")
    private String observacao;

    @Column(name = "produto_substituto")
    private String produtoSubstituto;

    @Column(name = "preco_substituto")
    private Double precoSubstituto;

    @Column(name = "quantidade_substituto")
    private Integer quantidadeSubstituto;

    @Column(name = "quantidade_condicao")
    private Integer quantidadeCondicao;

    @Column(name = "preco_condicao")
    private Double precoCondicao;

    @Column(name = "quantidade_condicao_substituto")
    private Integer quantidadeCondicaoSubstituto;

    @Column(name = "preco_condicao_substituto")
    private Double precoCondicaoSubstituto;

    @Column(name = "condicoes_escalonamento", columnDefinition = "TEXT")
    private String condicoesEscalonamento;

    @Column(name = "condicoes_escalonamento_substituto", columnDefinition = "TEXT")
    private String condicoesEscalonamentoSubstituto;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ItemCotacao getItem() { return item; }
    public void setItem(ItemCotacao item) { this.item = item; }

    public Fornecedor getFornecedor() { return fornecedor; }
    public void setFornecedor(Fornecedor fornecedor) { this.fornecedor = fornecedor; }

    public Double getPrecoOfertado() { return precoOfertado; }
    public void setPrecoOfertado(Double precoOfertado) { this.precoOfertado = precoOfertado; }

    public Double getPrecoOriginal() { return precoOriginal; }
    public void setPrecoOriginal(Double precoOriginal) { this.precoOriginal = precoOriginal; }

    public LocalDateTime getDataResposta() { return dataResposta; }
    public void setDataResposta(LocalDateTime dataResposta) { this.dataResposta = dataResposta; }

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