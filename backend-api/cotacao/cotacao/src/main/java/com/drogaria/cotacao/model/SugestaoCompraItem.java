package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "sugestoes_compra_itens")
@Getter
@Setter
public class SugestaoCompraItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "sugestao_id", nullable = false)
    private SugestaoCompra sugestao;

    @Column(name = "dna_produto_id", nullable = false)
    private Integer dnaProdutoId;

    @Column(length = 64)
    private String ean;

    @Column(name = "produto_nome", nullable = false)
    private String produtoNome;

    @Column(name = "estoque_atual") private BigDecimal estoqueAtual;
    @Column(name = "preco_venda") private BigDecimal precoVenda;
    @Column(name = "custo_atual") private BigDecimal custoAtual;
    @Column(name = "custo_medio") private BigDecimal custoMedio;

    @Column(name = "data_ultima_compra") private LocalDate dataUltimaCompra;
    @Column(name = "quantidade_ultima_compra") private BigDecimal quantidadeUltimaCompra;
    @Column(name = "data_ultima_venda") private LocalDate dataUltimaVenda;

    @Column(name = "vendas_7d") private BigDecimal vendas7d;
    @Column(name = "vendas_14d") private BigDecimal vendas14d;
    @Column(name = "vendas_30d") private BigDecimal vendas30d;
    @Column(name = "vendas_60d") private BigDecimal vendas60d;
    @Column(name = "vendas_90d") private BigDecimal vendas90d;
    @Column(name = "vmd_7d") private BigDecimal vmd7d;
    @Column(name = "vmd_14d") private BigDecimal vmd14d;
    @Column(name = "vmd_30d") private BigDecimal vmd30d;
    @Column(name = "vmd_60d") private BigDecimal vmd60d;
    @Column(name = "vmd_90d") private BigDecimal vmd90d;

    @Column(name = "demanda_diaria_prevista") private BigDecimal demandaDiariaPrevista;
    @Column(name = "indice_tendencia") private BigDecimal indiceTendencia;

    @Column(name = "ciclo_compra_dias") private Integer cicloCompraDias;
    @Column(name = "lead_time_dias") private Integer leadTimeDias;
    @Column(name = "dias_seguranca") private Integer diasSeguranca;
    @Column(name = "cobertura_atual_dias") private BigDecimal coberturaAtualDias;
    @Column(name = "estoque_alvo") private BigDecimal estoqueAlvo;

    @Column(name = "quantidade_sugerida", nullable = false)
    private BigDecimal quantidadeSugerida = BigDecimal.ZERO;

    @Column(name = "quantidade_rupturas", nullable = false)
    private Integer quantidadeRupturas = 0;

    @Column(name = "quantidade_urgencias", nullable = false)
    private Integer quantidadeUrgencias = 0;

    @Column(name = "quantidade_aprovada")
    private BigDecimal quantidadeAprovada;

    @Column(nullable = false)
    private String decisao = "PENDENTE";

    @Column(name = "justificativa_motor", columnDefinition = "text")
    private String justificativaMotor;

    @Column(name = "justificativa_usuario", columnDefinition = "text")
    private String justificativaUsuario;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dados_calculo")
    private String dadosCalculo;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    public void aoPersistir() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (decisao == null) decisao = "PENDENTE";
        if (quantidadeSugerida == null) quantidadeSugerida = BigDecimal.ZERO;
        if (quantidadeRupturas == null) quantidadeRupturas = 0;
        if (quantidadeUrgencias == null) quantidadeUrgencias = 0;
    }

    @PreUpdate
    public void aoAtualizar() {
        updatedAt = OffsetDateTime.now();
    }
}
