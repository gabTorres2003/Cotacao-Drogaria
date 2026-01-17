package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.response.ItemComparativoDTO;
import com.drogaria.cotacao.service.ComparativoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comparativo")
public class ComparativoController {

    @Autowired
    private ComparativoService comparativoService;

    @GetMapping("/{idCotacao}")
    public ResponseEntity<List<ItemComparativoDTO>> gerarRelatorio(@PathVariable Long idCotacao) {
        List<ItemComparativoDTO> resultado = comparativoService.compararPrecos(idCotacao);
        return ResponseEntity.ok(resultado);
    }
}