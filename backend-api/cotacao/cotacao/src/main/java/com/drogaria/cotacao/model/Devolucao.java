package com.drogaria.cotacao.model;

import com.drogaria.cotacao.model.enums.FormaAbatimento;
import com.drogaria.cotacao.model.enums.StatusDevolucao;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "tb_devolucoes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Devolucao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "fornecedor_id", nullable = false)
    @JsonIgnoreProperties({"pedidos", "cotacoes"})
    private Fornecedor fornecedor;

    @ManyToOne
    @JoinColumn(name = "pedido_id")
    @JsonIgnoreProperties({"itens", "cotacao", "fornecedor"})
    private Pedido pedido;

    private String nfOrigem;
    private String protocolo;
    private String protocoloFalta;
    private String protocoloSobra;

    private LocalDate dataSolicitacao;
    private LocalDate dataRecolhimento;

    @Enumerated(EnumType.STRING)
    private FormaAbatimento formaAbatimento;

    @Column(columnDefinition = "TEXT")
    private String observacaoAbatimento;

    private Double valorTotal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusDevolucao status;

    @OneToMany(mappedBy = "devolucao", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemDevolucao> itens;

    @PrePersist
    protected void onCreate() {
        if (this.dataSolicitacao == null) {
            this.dataSolicitacao = LocalDate.now();
        }
        if (this.status == null) {
            this.status = StatusDevolucao.AGUARDANDO_RECOLHIMENTO;
        }
    }
}