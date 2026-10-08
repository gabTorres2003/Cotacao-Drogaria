package com.drogaria.cotacao.dto.request;

import lombok.Data;
import java.util.List;

/**
 * Request para gerar lista de compra pela Inteligência (consulta ao vivo no DNA),
 * com parâmetros de cobertura de estoque e janela de vendas.
 */
@Data
public class ListaInteligenciaRequestDTO {
    private List<String> grupos;
    private Integer diasEstoqueMinimo;
    private Integer diasEstoqueMaximo;
    private Integer diasMediaVendas;
    private Boolean incluirFaltas;
    private String nomeUsuario;
    private String setor;
}
