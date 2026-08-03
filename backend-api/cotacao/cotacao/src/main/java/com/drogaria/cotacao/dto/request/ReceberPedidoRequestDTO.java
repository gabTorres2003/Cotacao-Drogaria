package com.drogaria.cotacao.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class ReceberPedidoRequestDTO {
    private String numeroNota;
    private List<ItemRecebidoDTO> itens;
}