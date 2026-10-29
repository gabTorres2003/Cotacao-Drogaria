package com.drogaria.cotacao.dto.response;

import java.util.List;

/**
 * Resultado paginado de forma implícita da pesquisa de produtos do DNA.
 * {@code truncado} indica que existem mais produtos do que o limite
 * retornado e que a pesquisa precisa ser refinada.
 */
public record ResultadoPesquisaProdutosDTO(
        List<ProdutoPesquisaDnaDTO> resultados,
        boolean truncado,
        int limite) {

    public static final int LIMITE_PADRAO = 20;

    public static ResultadoPesquisaProdutosDTO vazio() {
        return new ResultadoPesquisaProdutosDTO(List.of(), false, LIMITE_PADRAO);
    }
}
