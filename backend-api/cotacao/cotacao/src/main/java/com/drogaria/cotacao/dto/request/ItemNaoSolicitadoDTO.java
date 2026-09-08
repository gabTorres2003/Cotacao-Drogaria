package com.drogaria.cotacao.dto.request;

import lombok.Data;

@Data
public class ItemNaoSolicitadoDTO {
    private String nomeProduto;
    private Integer quantidade;
    private Double valorUnitarioReal;
    private String observacaoDevolucao;
}
