package com.drogaria.cotacao.dto.response;

import com.drogaria.cotacao.model.enums.StatusItemRecebimento;
import lombok.Data;

@Data
public class ItemPedidoResponseDTO {
    private Long id;
    private Long itemCotacaoId;
    private String nomeProduto; 
    private Integer quantidadePedida;
    private Double valorUnitarioPedido;
    private Integer quantidadeReal;
    private Double valorUnitarioReal;
    private StatusItemRecebimento statusRecebimento;
    private String observacaoDevolucao;
}