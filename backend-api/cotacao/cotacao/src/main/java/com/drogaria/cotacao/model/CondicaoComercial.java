package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import lombok.Getter;
import java.util.UUID;
import lombok.Setter;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "condicoes_comerciais")
@Getter
@Setter
public class CondicaoComercial {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "fornecedor_id")
    private Long fornecedorId;

    @Column(name = "dna_fornecedor_id")
    private Integer dnaFornecedorId;

    @Column(name = "cotacao_id")
    private Long cotacaoId;

    @Column(columnDefinition = "text")
    private String descricao;

    @Column(name = "data_condicao", nullable = false)
    private LocalDate dataCondicao;

    @Column(name = "validade_inicio")
    private LocalDate validadeInicio;

    @Column(name = "validade_fim")
    private LocalDate validadeFim;

    @Column(columnDefinition = "text")
    private String observacao;

    @Column(nullable = false)
    private String status = "PENDENTE";

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    public void aoPersistir() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (dataCondicao == null) dataCondicao = LocalDate.now();
        if (status == null) status = "PENDENTE";
    }

    @PreUpdate
    public void aoAtualizar() {
        updatedAt = OffsetDateTime.now();
    }
}
