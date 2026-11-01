package com.drogaria.cotacao.model;

import com.drogaria.cotacao.model.enums.CategoriaMensagem;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "mensagens_menu")
public class MensagemMenu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CategoriaMensagem categoria;

    /** Perfis separados por vírgula: ADM, CONFERENTE, FORNECEDOR. */
    @Column(nullable = false, length = 120)
    private String destinatarios;

    @Column(nullable = false)
    private boolean ativa = true;

    @Column(nullable = false)
    private boolean destaque = false;

    @Column(name = "data_publicacao")
    private LocalDateTime dataPublicacao;

    @Column(name = "data_expiracao")
    private LocalDateTime dataExpiracao;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    @PrePersist
    protected void onCreate() {
        LocalDateTime agora = LocalDateTime.now();
        if (this.dataCriacao == null) {
            this.dataCriacao = agora;
        }
        this.dataAtualizacao = agora;
    }

    @PreUpdate
    protected void onUpdate() {
        this.dataAtualizacao = LocalDateTime.now();
    }
}
