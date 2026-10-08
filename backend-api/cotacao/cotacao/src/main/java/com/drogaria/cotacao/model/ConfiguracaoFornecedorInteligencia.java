package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import lombok.Getter;
import java.util.UUID;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "configuracao_fornecedor_inteligencia")
@Getter
@Setter
public class ConfiguracaoFornecedorInteligencia {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "fornecedor_id", unique = true)
    private Long fornecedorId;

    @Column(name = "dna_fornecedor_id", unique = true)
    private Integer dnaFornecedorId;

    @Column(name = "fornecedor_nome")
    private String fornecedorNome;

    @Column(name = "lead_time_manual_dias")
    private Integer leadTimeManualDias;

    @Column(name = "pedido_minimo_valor")
    private BigDecimal pedidoMinimoValor;

    @Column(columnDefinition = "text")
    private String observacao;

    @Column(nullable = false)
    private Boolean ativo = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    public void aoPersistir() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (ativo == null) ativo = true;
    }

    @PreUpdate
    public void aoAtualizar() {
        updatedAt = OffsetDateTime.now();
    }
}
