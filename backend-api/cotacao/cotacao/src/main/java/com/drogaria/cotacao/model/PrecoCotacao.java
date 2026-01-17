package com.drogaria.cotacao.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_precos_cotacao")
public class PrecoCotacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "item_id")
    private ItemCotacao item; // O remédio 

    @ManyToOne
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor; // Quem ofertou

    private Double precoOfertado; // O valor 

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public ItemCotacao getItem() { return item; }
    public void setItem(ItemCotacao item) { this.item = item; }
    
    public Fornecedor getFornecedor() { return fornecedor; }
    public void setFornecedor(Fornecedor fornecedor) { this.fornecedor = fornecedor; }
    
    public Double getPrecoOfertado() { return precoOfertado; }
    public void setPrecoOfertado(Double precoOfertado) { this.precoOfertado = precoOfertado; }
}