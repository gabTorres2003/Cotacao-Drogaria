package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.response.AlertaFornecedorDTO;
import com.drogaria.cotacao.service.AlertaFornecedorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alertas-fornecedores")
@CrossOrigin(origins = {"https://cotacaotorresfarma.netlify.app", "http://localhost:5173"})
@RequiredArgsConstructor
public class AlertaFornecedorController {

    private final AlertaFornecedorService alertaFornecedorService;

    @GetMapping
    public ResponseEntity<List<AlertaFornecedorDTO>> listar(
            @RequestParam(value = "tipo", required = false) String tipo) {
        return ResponseEntity.ok(alertaFornecedorService.listarAlertas(tipo));
    }
}
