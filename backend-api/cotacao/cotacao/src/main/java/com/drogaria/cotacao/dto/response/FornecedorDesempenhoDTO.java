package com.drogaria.cotacao.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FornecedorDesempenhoDTO {
    private String nomeFornecedor;
    private Long cotacoesPaticipadas;
    private Long cotacoesGanhas;
    private Double winRate;
    private Double valorTotalComprado;
}