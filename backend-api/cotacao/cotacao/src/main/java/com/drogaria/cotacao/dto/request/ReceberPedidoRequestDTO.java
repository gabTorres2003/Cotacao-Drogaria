package com.drogaria.cotacao.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class ReceberPedidoRequestDTO {
    private String numeroNota;
    private List<ItemRecebidoDTO> itens;
    /**
     * Destino dos itens não recebidos e não cobrados ao finalizar a conferência:
     * RETORNAR_COTACAO - devolve os itens para a cotação de origem (padrão);
     * AGUARDAR - mantém os itens no pedido gerando entrega parcial.
     */
    private String acaoItensFaltantes;
}