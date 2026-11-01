package com.drogaria.cotacao.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MensagemMenuResponseDTO {

    private Long id;
    private String titulo;
    private String conteudo;
    private String categoria;
    private List<String> destinatarios;
    private boolean ativa;
    private boolean destaque;
    private LocalDateTime dataPublicacao;
    private LocalDateTime dataExpiracao;
    private LocalDateTime dataCriacao;
    private LocalDateTime dataAtualizacao;
}
