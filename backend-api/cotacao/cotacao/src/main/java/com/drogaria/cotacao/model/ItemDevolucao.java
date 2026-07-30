package com.drogaria.cotacao.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tb_itens_devolucao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemDevolucao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "devolucao_id", nullable = false)
    @JsonIgnore
    private Devolucao devolucao;

    @Column(nullable = false)
    private String nomeProduto;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(nullable = false)
    private Double valorUnitario;
}