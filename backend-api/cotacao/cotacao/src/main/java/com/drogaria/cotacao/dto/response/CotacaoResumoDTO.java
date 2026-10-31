package com.drogaria.cotacao.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Resumo de cotação para listagens. Não inclui o campo TEXT "configuracao",
 * que só é necessário na tela de detalhes da cotação.
 */
@Data
@AllArgsConstructor
public class CotacaoResumoDTO {
    private Long id;
    private LocalDateTime dataCriacao;
    private String status;
    private String descricao;
    private String nomeUsuario;
    private String setor;
}
