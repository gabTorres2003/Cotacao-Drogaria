package com.drogaria.cotacao.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class FotoConferenciaResponseDTO {
    private Long id;
    private Long itemPedidoId;
    private String nomeOriginal;
    private String tipoConteudo;
    private Long tamanhoBytes;
    private String ocorrencia;
    private String enviadoPor;
    private LocalDateTime dataCriacao;
}
