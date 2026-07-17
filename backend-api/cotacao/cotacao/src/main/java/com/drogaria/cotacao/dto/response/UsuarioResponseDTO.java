package com.drogaria.cotacao.dto.response;

import lombok.Data;

@Data
public class UsuarioResponseDTO {
    private Long id;
    private String username;
    private String nome;
    private boolean ativo;
}