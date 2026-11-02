package com.drogaria.cotacao.model;

import com.drogaria.cotacao.model.enums.StatusItemRecebimento;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tb_itens_pedido")
@Getter
@Setter
public class ItemPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pedido_id", nullable = false)
    @JsonIgnore 
    private Pedido pedido;

    @ManyToOne(optional = true)
    @JoinColumn(name = "item_cotacao_id", nullable = true)
    @JsonIgnoreProperties({"cotacao", "itensPedido", "precos"}) 
    private ItemCotacao itemCotacao;

    @Column(name = "nome_produto")
    private String nomeProduto;

    @Column(name = "quantidade_pedida", nullable = false)
    private Integer quantidadePedida;

    @Column(name = "valor_unitario_pedido", nullable = false)
    private Double valorUnitarioPedido;

    /**
     * Conversão entre a unidade pedida (pacote/caixa) e a unidade física
     * conferida. MULTIPLICAR: 1 unidade pedida contém {@code fatorConversao}
     * unidades físicas. DIVIDIR: {@code fatorConversao} unidades pedidas
     * formam 1 unidade física. O valor unitário pedido permanece por unidade
     * pedida; o valor por unidade física é derivado no backend.
     */
    @Column(name = "fator_conversao")
    private Integer fatorConversao;

    @Column(name = "sentido_conversao")
    private String sentidoConversao;

    /**
     * Quantidade esperada em unidades físicas após a conversão. Persistida
     * para que a conferência física e a financeira usem a mesma referência.
     */
    @Column(name = "quantidade_esperada")
    private Integer quantidadeEsperada;

    @Column(name = "quantidade_real")
    private Integer quantidadeReal;

    @Column(name = "quantidade_avariada")
    private Integer quantidadeAvariada = 0;

    @Column(name = "valor_unitario_real")
    private Double valorUnitarioReal;

    @Column(name = "observacao_devolucao")
    private String observacaoDevolucao;

    @Column(name = "codigo_barras_recebido")
    private String codigoBarrasRecebido;

    @Column(name = "nome_produto_recebido")
    private String nomeProdutoRecebido;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_recebimento")
    private StatusItemRecebimento statusRecebimento;

    // Item não recebido ("Não Veio") que retornou para a cotação de origem.
    // Mantido no pedido para preservar o histórico, com destaque de "Não entregue".
    @Column(name = "retornado_cotacao")
    private Boolean retornadoCotacao = false;
    
    @Column(name = "valor_alterado_apos_pedido")
    private Boolean valorAlteradoAposPedido = false;

    @Column(name = "condicao_aplicada")
    private Boolean condicaoAplicada = false;

    @Column(name = "qtd_condicao")
    private Integer qtdCondicao;

    @Column(name = "preco_condicao")
    private Double precoCondicao;

    @Transient
    private Boolean reatribuicaoExplicita = false;
}