package com.drogaria.cotacao.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "tb_fotos_conferencia")
@Getter
@Setter
public class FotoConferencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    @JsonIgnore
    private Pedido pedido;

    @ManyToOne
    @JoinColumn(name = "item_pedido_id")
    @JsonIgnore
    private ItemPedido itemPedido;

    @Column(name = "nome_original", nullable = false)
    private String nomeOriginal;

    @Column(name = "nome_armazenado", nullable = false, unique = true)
    private String nomeArmazenado;

    @Column(name = "caminho_arquivo", nullable = false)
    private String caminhoArquivo;

    @Column(name = "tipo_conteudo", nullable = false)
    private String tipoConteudo;

    @Column(name = "tamanho_bytes", nullable = false)
    private Long tamanhoBytes;

    @Column(name = "ocorrencia")
    private String ocorrencia;

    @Column(name = "enviado_por")
    private String enviadoPor;

    @Column(name = "data_criacao", nullable = false)
    private LocalDateTime dataCriacao;
}
