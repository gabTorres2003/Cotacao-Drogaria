package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "sugestoes_compra")
@Getter
@Setter
public class SugestaoCompra {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "dna_grupo_id")
    private Integer dnaGrupoId;

    @Column(name = "dna_grupo_nome")
    private String dnaGrupoNome;

    @Column(name = "gerada_em", nullable = false)
    private OffsetDateTime geradaEm;

    @Column(name = "periodo_inicio")
    private LocalDate periodoInicio;

    @Column(name = "periodo_fim")
    private LocalDate periodoFim;

    @Column(nullable = false)
    private String status = "GERADA";

    @Column(columnDefinition = "text")
    private String observacao;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void aoPersistir() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (geradaEm == null) geradaEm = OffsetDateTime.now();
        if (status == null) status = "GERADA";
    }
}
