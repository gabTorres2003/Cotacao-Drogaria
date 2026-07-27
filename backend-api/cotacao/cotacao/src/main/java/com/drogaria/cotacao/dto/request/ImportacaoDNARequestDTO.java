package com.drogaria.cotacao.dto.request;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class ImportacaoDNARequestDTO {
    private List<String> grupos;
    private Boolean incluirSugestao;
    private LocalDate dataInicial;
    private LocalDate dataFinal;
    private Integer diasSuprir;
}