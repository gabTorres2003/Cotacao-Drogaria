package com.drogaria.cotacao.model;

import com.drogaria.cotacao.model.enums.StatusPedido;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "tb_pedidos")
@Getter
@Setter
public class Pedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cotacao_id", nullable = false)
    @JsonIgnoreProperties({"pedidos", "itens"}) 
    private Cotacao cotacao;

    @ManyToOne
    @JoinColumn(name = "fornecedor_id", nullable = false)
    @JsonIgnoreProperties("pedidos") 
    private Fornecedor fornecedor;

    @Column(name = "valor_total_pedido")
    private Double valorTotalPedido;

    @Column(name = "valor_total_real")
    private Double valorTotalReal;

    @Column(name = "data_criacao")
    private LocalDateTime dataCriacao;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusPedido status;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("pedido") 
    private List<ItemPedido> itens;
}