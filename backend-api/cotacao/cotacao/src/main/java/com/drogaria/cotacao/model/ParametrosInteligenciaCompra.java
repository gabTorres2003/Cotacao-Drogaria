package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import lombok.Getter;
import java.util.UUID;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "parametros_inteligencia_compra")
@Getter
@Setter
public class ParametrosInteligenciaCompra {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String nome;

    @Column(name = "peso_demanda_30", nullable = false)
    private BigDecimal pesoDemanda30;

    @Column(name = "peso_demanda_60", nullable = false)
    private BigDecimal pesoDemanda60;

    @Column(name = "peso_demanda_90", nullable = false)
    private BigDecimal pesoDemanda90;

    @Column(name = "dias_historico_minimo", nullable = false)
    private Integer diasHistoricoMinimo;

    @Column(name = "margem_minima_promocao")
    private BigDecimal margemMinimaPromocao;

    @Column(name = "tolerancia_excesso_percentual")
    private BigDecimal toleranciaExcessoPercentual;

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
