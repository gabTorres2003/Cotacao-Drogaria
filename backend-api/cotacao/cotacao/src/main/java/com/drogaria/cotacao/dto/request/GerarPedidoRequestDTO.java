package com.drogaria.cotacao.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class GerarPedidoRequestDTO {
    private Long cotacaoId;
    private Long fornecedorId;
    private Double valorTotalPedido;
    private List<ItemGerarPedidoDTO> itens;
}