package com.drogaria.cotacao.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_sugestoes_pedido")
@Getter
@Setter
public class SugestaoPedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pedido_id", nullable = false)
    @JsonIgnoreProperties({"itens", "sugestoes", "cotacao", "fornecedor"})
    private Pedido pedido;

    @Column(name = "nome_produto", nullable = false)
    private String nomeProduto;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "preco_unitario", nullable = false)
    private Double precoUnitario;

    private String observacao;

    @Column(name = "data_sugestao")
    private LocalDateTime dataSugestao = LocalDateTime.now();

    @Column(name = "quantidade_condicao")
    private Integer quantidadeCondicao;

    @Column(name = "preco_condicao")
    private Double precoCondicao;

    @Column(name = "condicoes_escalonamento", columnDefinition = "TEXT")
    private String condicoesEscalonamento;
}