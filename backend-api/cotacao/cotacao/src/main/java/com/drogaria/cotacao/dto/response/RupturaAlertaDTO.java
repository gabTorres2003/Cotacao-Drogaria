package com.drogaria.cotacao.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RupturaAlertaDTO {
    private String nomeProduto;
    private Long vezesEmFalta;
    private String frequencia;
    private String ultimoFornecedorCotado;
}