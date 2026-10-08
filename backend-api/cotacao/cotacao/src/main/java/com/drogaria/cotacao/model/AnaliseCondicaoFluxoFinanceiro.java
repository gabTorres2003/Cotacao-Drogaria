package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "analises_condicoes_fluxo_financeiro")
@Getter
@Setter
public class AnaliseCondicaoFluxoFinanceiro {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "analise_id", nullable = false)
    private AnaliseCondicao analise;

    @Column(name = "numero_parcela", nullable = false)
    private Integer numeroParcela;

    @Column(name = "dias_ate_vencimento", nullable = false)
    private Integer diasAteVencimento;

    @Column(name = "data_vencimento_projetada")
    private LocalDate dataVencimentoProjetada;

    @Column(name = "valor_parcela", nullable = false)
    private BigDecimal valorParcela;

    @Column(name = "unidades_estimadas_vendidas_ate_vencimento")
    private BigDecimal unidadesEstimadasVendidasAteVencimento;

    @Column(name = "estoque_estimado_no_vencimento")
    private BigDecimal estoqueEstimadoNoVencimento;

    @Column(name = "receita_estimada_ate_vencimento")
    private BigDecimal receitaEstimadaAteVencimento;

    @Column(name = "custo_escoado_estimado")
    private BigDecimal custoEscoadoEstimado;

    @Column(name = "cobertura_financeira_suficiente")
    private Boolean coberturaFinanceiraSuficiente;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void aoPersistir() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
