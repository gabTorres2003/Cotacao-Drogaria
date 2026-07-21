package com.drogaria.cotacao.dto.request;

import com.drogaria.cotacao.model.enums.StatusItemRecebimento;
import lombok.Data;

@Data
public class ItemRecebidoDTO {
    private Long id;
    private Integer quantidadeReal;
    private Double valorUnitarioReal;
    private StatusItemRecebimento statusRecebimento;
    private String observacaoDevolucao;
}