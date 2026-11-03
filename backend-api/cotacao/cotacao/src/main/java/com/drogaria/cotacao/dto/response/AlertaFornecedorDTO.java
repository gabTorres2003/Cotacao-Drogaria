package com.drogaria.cotacao.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Alerta operacional gerado pelas ações dos fornecedores em cotações e
 * pedidos. O tipo permite ao ADM filtrar a lista por categoria.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertaFornecedorDTO {

    public static final String TIPO_RESPOSTA_COTACAO = "RESPOSTA_COTACAO";
    public static final String TIPO_CONFIRMACAO_PEDIDO = "CONFIRMACAO_PEDIDO";
    public static final String TIPO_CORTE_PEDIDO = "CORTE_PEDIDO";
    public static final String TIPO_PRAZO_ESTOURADO = "PRAZO_ESTOURADO";

    private String id;
    private String tipo;
    private String fornecedorNome;
    private String mensagem;
    private LocalDateTime data;
    private Long cotacaoId;
    private Long pedidoId;
    private String nomeProduto;
}
