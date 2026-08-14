package com.drogaria.cotacao.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "PRODUTOS")
@Getter
@Setter
public class Produto {

    @Id
    @Column(name = "CODIGO")
    private Long codigo;

    @Column(name = "CODBARRAS")
    private String codbarras;

    @Column(name = "DESCRICAO")
    private String descricao;
    
    @Column(name = "PRECOVENDA")
    private Double precoVenda;

}