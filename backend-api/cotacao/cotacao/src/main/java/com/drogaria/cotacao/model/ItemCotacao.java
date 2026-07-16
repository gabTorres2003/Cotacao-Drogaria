package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;

@Entity
@Table(name = "tb_itens_cotacao")
public class ItemCotacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomeProduto;
    private Integer quantidade; 
    private Double ultimoPreco; 
    private Double estoque;
    private String grupo;
    private Double vendidoNoMes;
    
    @Column(name = "ult_compra_data")
    private LocalDate ultCompraData;
    
    private Double ultCompraQtde;
    
    @Column(name = "ult_venda_data")
    private LocalDate ultVendaData;
    
    private Double vendidoAposUltCompra;

    @ManyToOne
    @JoinColumn(name = "cotacao_id")
    @JsonIgnore
    private Cotacao cotacao;

    public Long getId() { return id; }
    public String getNomeProduto() { return nomeProduto; }
    public void setNomeProduto(String nomeProduto) { this.nomeProduto = nomeProduto; }
    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
    public Double getUltimoPreco() { return ultimoPreco; }
    public void setUltimoPreco(Double ultimoPreco) { this.ultimoPreco = ultimoPreco; }
    public Cotacao getCotacao() { return cotacao; }
    public void setCotacao(Cotacao cotacao) { this.cotacao = cotacao; }

    public Double getEstoque() { return estoque; }
    public void setEstoque(Double estoque) { this.estoque = estoque; }
    public String getGrupo() { return grupo; }
    public void setGrupo(String grupo) { this.grupo = grupo; }
    public Double getVendidoNoMes() { return vendidoNoMes; }
    public void setVendidoNoMes(Double vendidoNoMes) { this.vendidoNoMes = vendidoNoMes; }
    public LocalDate getUltCompraData() { return ultCompraData; }
    public void setUltCompraData(LocalDate ultCompraData) { this.ultCompraData = ultCompraData; }
    public Double getUltCompraQtde() { return ultCompraQtde; }
    public void setUltCompraQtde(Double ultCompraQtde) { this.ultCompraQtde = ultCompraQtde; }
    public LocalDate getUltVendaData() { return ultVendaData; }
    public void setUltVendaData(LocalDate ultVendaData) { this.ultVendaData = ultVendaData; }
    public Double getVendidoAposUltCompra() { return vendidoAposUltCompra; }
    public void setVendidoAposUltCompra(Double vendidoAposUltCompra) { this.vendidoAposUltCompra = vendidoAposUltCompra; }
}