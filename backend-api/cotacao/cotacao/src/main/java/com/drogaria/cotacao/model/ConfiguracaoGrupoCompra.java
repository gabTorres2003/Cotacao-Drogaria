package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import lombok.Getter;
import java.util.UUID;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "configuracao_grupo_compra")
@Getter
@Setter
public class ConfiguracaoGrupoCompra {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "dna_grupo_id", nullable = false, unique = true)
    private Integer dnaGrupoId;

    @Column(name = "dna_grupo_nome")
    private String dnaGrupoNome;

    @Column(name = "intervalo_compra_dias", nullable = false)
    private Integer intervaloCompraDias;

    @Column(name = "dias_seguranca", nullable = false)
    private Integer diasSeguranca = 0;

    @Column(name = "janela_demanda_dias", nullable = false)
    private Integer janelaDemandaDias = 90;

    @Column(name = "cobertura_maxima_dias")
    private Integer coberturaMaximaDias;

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
