package com.drogaria.cotacao.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardGeralDTO {
    private Double totalSaving;
    private Double savingPercentual;
    private Long pedidosPendentes;
    private Long entregasComFalta;
    private Double totalDevolucoesPendentes;
}