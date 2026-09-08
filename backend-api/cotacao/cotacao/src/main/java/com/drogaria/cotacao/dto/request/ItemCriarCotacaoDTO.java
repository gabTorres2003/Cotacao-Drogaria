package com.drogaria.cotacao.dto.request;

public class ItemCriarCotacaoDTO {
    private String nomeProduto;
    private Integer quantidade;
    private String codBarras;
    private String origemItem;
    private Double estoque;
    private Double ultimoPreco;
    private Double vendidoNoMes;
    private String ultCompraData;
    private Double ultCompraQtde;
    private String ultVendaData;
    private Double vendidoAposUltCompra;

    public String getNomeProduto() { return nomeProduto; }
    public void setNomeProduto(String nomeProduto) { this.nomeProduto = nomeProduto; }

    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }

    public String getCodBarras() { return codBarras; }
    public void setCodBarras(String codBarras) { this.codBarras = codBarras; }

    public String getOrigemItem() { return origemItem; }
    public void setOrigemItem(String origemItem) { this.origemItem = origemItem; }

    public Double getEstoque() { return estoque; }
    public void setEstoque(Double estoque) { this.estoque = estoque; }

    public Double getUltimoPreco() { return ultimoPreco; }
    public void setUltimoPreco(Double ultimoPreco) { this.ultimoPreco = ultimoPreco; }

    public Double getVendidoNoMes() { return vendidoNoMes; }
    public void setVendidoNoMes(Double vendidoNoMes) { this.vendidoNoMes = vendidoNoMes; }

    public String getUltCompraData() { return ultCompraData; }
    public void setUltCompraData(String ultCompraData) { this.ultCompraData = ultCompraData; }

    public Double getUltCompraQtde() { return ultCompraQtde; }
    public void setUltCompraQtde(Double ultCompraQtde) { this.ultCompraQtde = ultCompraQtde; }

    public String getUltVendaData() { return ultVendaData; }
    public void setUltVendaData(String ultVendaData) { this.ultVendaData = ultVendaData; }

    public Double getVendidoAposUltCompra() { return vendidoAposUltCompra; }
    public void setVendidoAposUltCompra(Double vendidoAposUltCompra) { this.vendidoAposUltCompra = vendidoAposUltCompra; }
}
