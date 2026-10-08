package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "historico_decisoes_compra")
@Getter
@Setter
public class HistoricoDecisaoCompra {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "sugestao_item_id", nullable = false)
    private SugestaoCompraItem sugestaoItem;

    @Column(name = "quantidade_sugerida")
    private BigDecimal quantidadeSugerida;

    @Column(name = "quantidade_decidida")
    private BigDecimal quantidadeDecidida;

    @Column(nullable = false)
    private String decisao;

    @Column(columnDefinition = "text")
    private String motivo;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void aoPersistir() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
