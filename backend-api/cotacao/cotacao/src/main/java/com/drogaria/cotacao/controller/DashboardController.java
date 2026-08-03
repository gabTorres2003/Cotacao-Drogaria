package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.response.*;
import com.drogaria.cotacao.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = {"https://cotacaotorresfarma.netlify.app", "http://localhost:5173"})
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/resumo")
    public ResponseEntity<DashboardGeralDTO> getResumo() {
        return ResponseEntity.ok(dashboardService.obterResumoGeral());
    }

    @GetMapping("/fornecedores/ranking")
    public ResponseEntity<List<FornecedorDesempenhoDTO>> getRankingFornecedores() {
        return ResponseEntity.ok(dashboardService.obterRankingFornecedores());
    }

    @GetMapping("/ruptura/alertas")
    public ResponseEntity<List<RupturaAlertaDTO>> getAlertasRuptura() {
        return ResponseEntity.ok(dashboardService.obterAlertasRuptura());
    }
}