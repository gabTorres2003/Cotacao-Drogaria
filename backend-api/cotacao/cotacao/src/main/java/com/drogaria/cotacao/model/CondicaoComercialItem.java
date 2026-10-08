package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import lombok.Getter;
import java.util.UUID;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "condicoes_comerciais_itens")
@Getter
@Setter
public class CondicaoComercialItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "condicao_id", nullable = false)
    private CondicaoComercial condicao;

    @Column(name = "dna_produto_id")
    private Integer dnaProdutoId;

    @Column(length = 64)
    private String ean;

    @Column(name = "produto_nome", nullable = false)
    private String produtoNome;

    @Column(name = "quantidade_condicao", nullable = false)
    private BigDecimal quantidadeCondicao;

    @Column(name = "preco_unitario_condicao", nullable = false)
    private BigDecimal precoUnitarioCondicao;

    @Column(name = "desconto_percentual")
    private BigDecimal descontoPercentual;

    @Column(name = "bonificacao_quantidade")
    private BigDecimal bonificacaoQuantidade = BigDecimal.ZERO;

    @Column(columnDefinition = "text")
    private String observacao;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    public void aoPersistir() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (bonificacaoQuantidade == null) bonificacaoQuantidade = BigDecimal.ZERO;
    }

    @PreUpdate
    public void aoAtualizar() {
        updatedAt = OffsetDateTime.now();
    }
}
