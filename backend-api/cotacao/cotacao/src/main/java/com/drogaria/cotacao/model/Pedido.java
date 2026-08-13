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
    @JsonIgnoreProperties({"pedidos", "precos"}) 
    private Fornecedor fornecedor;

    @Column(name = "valor_total_pedido")
    private Double valorTotalPedido;

    @Column(name = "valor_total_real")
    private Double valorTotalReal;

    @Column(name = "valor_minimo_faturamento")
    private Double valorMinimoFaturamento;

    @Column(name = "data_criacao")
    private LocalDateTime dataCriacao;

    @Column(name = "data_confirmacao")
    private LocalDateTime dataConfirmacao;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusPedido status;
    
    @Column(name = "numero_nota")
    private String numeroNota;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("pedido") 
    private List<ItemPedido> itens;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("pedido") 
    private List<SugestaoPedido> sugestoes;
}