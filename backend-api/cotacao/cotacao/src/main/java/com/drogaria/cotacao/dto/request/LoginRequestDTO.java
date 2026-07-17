package com.drogaria.cotacao.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequestDTO {
    @NotBlank
    private String username;
    
    @NotBlank
    private String pin;
}