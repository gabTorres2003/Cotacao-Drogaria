package com.drogaria.cotacao.dto.response;

/**
 * Contrato mínimo de consulta de produto do DNA exposto ao sistema de
 * Atendimento (Balcão). Não inclui custo, preço de venda nem estoque:
 * apenas identificação e descrição, para evitar exposição de informação
 * comercial a um consumidor que ainda não possui autenticação forte.
 */
public record ProdutoConsultaBalcaoDTO(
        Integer codigo,
        String codbarras,
        String descricao,
        String inativo,
        String origem) {
}
