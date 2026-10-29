package com.drogaria.cotacao.dto.response;

/**
 * Item de resultado da pesquisa de produtos do DNA por descrição ou
 * princípio ativo. Contém apenas campos de identificação e diferenciação
 * (sem custo, preço ou estoque), usando somente colunas existentes em
 * {@code PRODUTOS}.
 */
public record ProdutoPesquisaDnaDTO(
        Integer codigo,
        String codbarras,
        String descricao,
        String principioAtivo,
        String apresentacao,
        String unidade,
        String fabricante,
        String inativo,
        String origem) {
}
