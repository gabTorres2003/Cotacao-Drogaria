package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "cotacao_fornecedor")
@Data
public class CotacaoFornecedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cotacao_id")
    private Cotacao cotacao; 

    @ManyToOne
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor;

    private String status = "PENDENTE"; 
}