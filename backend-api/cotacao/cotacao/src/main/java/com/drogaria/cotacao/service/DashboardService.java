package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.response.*;
import com.drogaria.cotacao.repository.DashboardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DashboardRepository dashboardRepository;

    public DashboardGeralDTO obterResumoGeral() {
        return dashboardRepository.obterResumoGeral();
    }

    public List<FornecedorDesempenhoDTO> obterRankingFornecedores() {
        return dashboardRepository.obterRankingFornecedores();
    }

    public List<RupturaAlertaDTO> obterAlertasRuptura() {
        return dashboardRepository.obterAlertasRuptura();
    }
}