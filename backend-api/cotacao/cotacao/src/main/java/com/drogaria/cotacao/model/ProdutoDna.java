package com.drogaria.cotacao.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "PRODUTOS")
public class ProdutoDna {

    @Id
    @Column(name = "CODIGO")
    private Integer codigo;

    @Column(name = "CODBARRAS")
    private String codbarras;

    @Column(name = "DESCRICAO")
    private String descricao;

    @Column(name = "QUANTIDADE")
    private Double quantidade; 

    @Column(name = "PRECOVENDA")
    private Double precovenda;

    @Column(name = "INATIVO", length = 1)
    private String inativo;
}