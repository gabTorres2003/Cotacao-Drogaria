package com.drogaria.cotacao.dto.request;

import lombok.Data;

@Data
public class ItemGerarPedidoDTO {
    private Long itemCotacaoId;
    private Integer quantidadePedida;
    private Double valorUnitarioPedido;
    private String nomeProduto;
}