package com.drogaria.cotacao.dto.response;

import com.drogaria.cotacao.model.enums.StatusPedido;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Resumo de pedido usado em listagens e em fluxos que só precisam dos
 * identificadores/nomes dos itens. Evita trafegar a entidade completa
 * (itens com todas as colunas e relacionamentos) do Supabase para o backend.
 */
@Data
public class PedidoResumoDTO {

    private Long id;
    private StatusPedido status;
    private String numeroNota;
    private String motivoCancelamento;
    private LocalDateTime dataCriacao;
    private LocalDateTime dataConfirmacao;
    private Double valorTotalPedido;
    private Double valorTotalReal;
    private Double valorMinimoFaturamento;
    private Long cotacaoId;
    private FornecedorResumo fornecedor;
    private CotacaoResumo cotacao;
    private List<ItemResumo> itens = new ArrayList<>();
    private long qtdSugestoes;

    @Data
    public static class FornecedorResumo {
        private Long id;
        private String nome;
        private String empresa;
        private String entreguePor;
        private String setorCompra;
        private String telefone;
    }

    @Data
    public static class CotacaoResumo {
        private Long id;
        private String setor;
    }

    @Data
    public static class ItemResumo {
        private Long id;
        private String nomeProduto;
        private Integer quantidadePedida;
        private Double valorUnitarioPedido;
        private String codigoBarrasRecebido;
        private ItemCotacaoResumo itemCotacao;
    }

    @Data
    public static class ItemCotacaoResumo {
        private Long id;
        private String nomeProduto;
        private String grupo;
        private String codBarras;
    }
}
