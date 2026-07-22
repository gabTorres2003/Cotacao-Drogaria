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

    @Column(name = "quantidade_real")
    private Integer quantidadeReal;

    @Column(name = "valor_unitario_real")
    private Double valorUnitarioReal;

    @Column(name = "observacao_devolucao")
    private String observacaoDevolucao;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_recebimento")
    private StatusItemRecebimento statusRecebimento;
}