package com.drogaria.cotacao.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Resumo do cadastro de diversos usado apenas para montar o dicionário
 * código -> produto no frontend.
 */
@Data
@AllArgsConstructor
public class MedicamentoDiversoResumoDTO {
    private String codigoDiversos;
    private String produto;
}
