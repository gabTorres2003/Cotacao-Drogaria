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
     * AGUARDAR - mantém os itens no pedido gerando entrega parcial;
     * ENCAMINHAR_PEDIDO - envia os itens para outro pedido ativo
     * (pedidoDestinoId).
     */
    private String acaoItensFaltantes;

    /** Pedido que receberá os itens faltantes quando a ação for ENCAMINHAR_PEDIDO. */
    private Long pedidoDestinoId;

    /**
     * Produtos que vieram na entrega mas não fazem parte do pedido. Enviados
     * junto da conferência física para que itens e extras sejam gravados na
     * mesma transação (evita conferência salva pela metade).
     */
    private List<ItemNaoSolicitadoDTO> itensNaoSolicitados;
}