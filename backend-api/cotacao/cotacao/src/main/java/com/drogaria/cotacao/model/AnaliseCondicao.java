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
@Table(name = "analises_condicoes")
@Getter
@Setter
public class AnaliseCondicao {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "condicao_item_id", nullable = false)
    private CondicaoComercialItem condicaoItem;

    @Column(name = "analisado_em", nullable = false)
    private OffsetDateTime analisadoEm;

    @Column(name = "dna_produto_id")
    private Integer dnaProdutoId;

    @Column(length = 64)
    private String ean;

    @Column(name = "produto_nome")
    private String produtoNome;

    @Column(name = "estoque_atual")
    private BigDecimal estoqueAtual;

    @Column(name = "preco_venda_atual")
    private BigDecimal precoVendaAtual;

    @Column(name = "preco_promocional_atual")
    private BigDecimal precoPromocionalAtual;

    @Column(name = "custo_atual")
    private BigDecimal custoAtual;

    @Column(name = "custo_medio_atual")
    private BigDecimal custoMedioAtual;

    @Column(name = "data_ultima_compra")
    private LocalDate dataUltimaCompra;

    @Column(name = "quantidade_ultima_compra")
    private BigDecimal quantidadeUltimaCompra;

    @Column(name = "custo_ultima_compra")
    private BigDecimal custoUltimaCompra;

    @Column(name = "data_ultima_venda")
    private LocalDate dataUltimaVenda;

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

    @Column(name = "demanda_diaria_prevista")
    private BigDecimal demandaDiariaPrevista;

    @Column(name = "indice_tendencia")
    private BigDecimal indiceTendencia;

    @Column(name = "ciclo_compra_dias")
    private Integer cicloCompraDias;

    @Column(name = "lead_time_dias")
    private Integer leadTimeDias;

    @Column(name = "dias_seguranca")
    private Integer diasSeguranca;

    @Column(name = "cobertura_atual_dias")
    private BigDecimal coberturaAtualDias;

    @Column(name = "estoque_alvo")
    private BigDecimal estoqueAlvo;

    @Column(name = "quantidade_necessaria_normal")
    private BigDecimal quantidadeNecessariaNormal;

    @Column(name = "quantidade_condicao")
    private BigDecimal quantidadeCondicao;

    @Column(name = "preco_condicao")
    private BigDecimal precoCondicao;

    @Column(name = "quantidade_total_pos_compra")
    private BigDecimal quantidadeTotalPosCompra;

    @Column(name = "cobertura_pos_compra_dias")
    private BigDecimal coberturaPosCompraDias;

    @Column(name = "excesso_estimado_unidades")
    private BigDecimal excessoEstimadoUnidades;

    @Column(name = "excesso_estimado_dias")
    private BigDecimal excessoEstimadoDias;

    @Column(name = "custo_medio_pos_compra")
    private BigDecimal custoMedioPosCompra;

    @Column(name = "economia_unitaria_vs_ultimo_custo")
    private BigDecimal economiaUnitariaVsUltimoCusto;

    @Column(name = "economia_total_estimada")
    private BigDecimal economiaTotalEstimada;

    @Column(name = "dias_estimados_escoamento")
    private BigDecimal diasEstimadosEscoamento;

    @Column(name = "promocao_recomendada", nullable = false)
    private Boolean promocaoRecomendada = false;

    @Column(name = "preco_promocional_sugerido")
    private BigDecimal precoPromocionalSugerido;

    @Column(name = "margem_promocional_estimada")
    private BigDecimal margemPromocionalEstimada;

    @Column(name = "fator_promocional_historico")
    private BigDecimal fatorPromocionalHistorico;

    @Column(name = "dias_escoamento_com_promocao")
    private BigDecimal diasEscoamentoComPromocao;

    @Column(nullable = false)
    private String classificacao;

    @Column(name = "score_viabilidade")
    private BigDecimal scoreViabilidade;

    @Column(nullable = false, columnDefinition = "text")
    private String justificativa;

    @Column(columnDefinition = "text")
    private String alertas;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dados_calculo")
    private String dadosCalculo;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void aoPersistir() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (analisadoEm == null) analisadoEm = OffsetDateTime.now();
        if (promocaoRecomendada == null) promocaoRecomendada = false;
    }
}
