package com.drogaria.cotacao.dto.response;

import com.drogaria.cotacao.model.enums.StatusPedido;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PedidoResponseDTO {
    private Long id;
    private Long cotacaoId;
    private Long fornecedorId;
    private String fornecedorNome; 
    private LocalDateTime dataCriacao;
    private StatusPedido status;
    private Double valorTotalPedido;
    private Double valorTotalReal;
    private List<ItemPedidoResponseDTO> itens;
}