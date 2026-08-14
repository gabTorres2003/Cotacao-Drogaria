package com.drogaria.cotacao.dto.response;

public class ProdutoDnaDTO {

    private Integer codigo;
    private String codbarras;
    private String descricao;
    private Double quantidade;
    private Double precovenda;
    private Double precocusto;
    private String inativo;

    public ProdutoDnaDTO() {}

    public ProdutoDnaDTO(Integer codigo, String codbarras, String descricao, Double quantidade, Double precovenda, Double precocusto, String inativo) {
        this.codigo = codigo;
        this.codbarras = codbarras;
        this.descricao = descricao;
        this.quantidade = quantidade;
        this.precovenda = precovenda;
        this.precocusto = precocusto;
        this.inativo = inativo;
    }

    // Getters e Setters
    public Integer getCodigo() { return codigo; }
    public void setCodigo(Integer codigo) { this.codigo = codigo; }

    public String getCodbarras() { return codbarras; }
    public void setCodbarras(String codbarras) { this.codbarras = codbarras; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public Double getQuantidade() { return quantidade; }
    public void setQuantidade(Double quantidade) { this.quantidade = quantidade; }

    public Double getPrecovenda() { return precovenda; }
    public void setPrecovenda(Double precovenda) { this.precovenda = precovenda; }

    public Double getPrecocusto() { return precocusto; }
    public void setPrecocusto(Double precocusto) { this.precocusto = precocusto; }

    public String getInativo() { return inativo; }
    public void setInativo(String inativo) { this.inativo = inativo; }
}