package com.drogaria.cotacao.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Vínculo cotação/fornecedor para o portal do fornecedor. Evita repetir o
 * campo TEXT "configuracao" da cotação em cada vínculo retornado.
 */
@Data
public class CotacaoFornecedorResumoDTO {

    private Long id;
    private String status;
    private CotacaoVinculoResumo cotacao;

    public CotacaoFornecedorResumoDTO(Long id, String status, Long cotacaoId,
                                      String cotacaoStatus, LocalDateTime dataCriacao) {
        this.id = id;
        this.status = status;
        this.cotacao = new CotacaoVinculoResumo(cotacaoId, cotacaoStatus, dataCriacao);
    }

    @Data
    public static class CotacaoVinculoResumo {
        private Long id;
        private String status;
        private LocalDateTime dataCriacao;

        public CotacaoVinculoResumo(Long id, String status, LocalDateTime dataCriacao) {
            this.id = id;
            this.status = status;
            this.dataCriacao = dataCriacao;
        }
    }
}
