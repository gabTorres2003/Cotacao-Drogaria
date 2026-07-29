package com.drogaria.cotacao.model;

import com.drogaria.cotacao.model.enums.TipoAcao;
import jakarta.persistence.*; 
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "log_auditoria")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataHora;

    @Column(nullable = false)
    private String nomeUsuario; 

    @Column(nullable = false)
    private String tipoUsuario; 

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoAcao acao;

    @Column(name = "entidade_afetada")
    private String entidadeAfetada;

    @Column(name = "entidade_id")
    private Long entidadeId; 

    @Column(columnDefinition = "TEXT")
    private String detalhes; 
    
    @PrePersist
    protected void onCreate() {
        if (this.dataHora == null) {
            this.dataHora = LocalDateTime.now();
        }
    }
}