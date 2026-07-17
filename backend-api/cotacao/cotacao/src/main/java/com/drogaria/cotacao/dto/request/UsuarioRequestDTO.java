package com.drogaria.cotacao.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UsuarioRequestDTO {
    @NotBlank
    private String username;

    @NotBlank
    private String nome;

    @NotBlank
    @Size(min = 4, max = 6, message = "O PIN deve ter entre 4 e 6 dígitos")
    private String pin;
}