package com.drogaria.cotacao.model;

import com.drogaria.cotacao.model.enums.StatusItemRecebimento;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tb_itens_pedido")
@Data
public class ItemPedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pedido_id", nullable = false)
    @JsonBackReference
    private Pedido pedido;

    @ManyToOne
    @JoinColumn(name = "item_cotacao_id", nullable = false)
    private ItemCotacao itemCotacao;

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