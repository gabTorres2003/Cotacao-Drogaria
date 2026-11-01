package com.drogaria.cotacao.dto.request;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class MensagemMenuRequestDTO {

    private String titulo;
    private String conteudo;
    private String categoria;
    private List<String> destinatarios;
    private Boolean ativa;
    private Boolean destaque;
    private LocalDateTime dataPublicacao;
    private LocalDateTime dataExpiracao;
}
