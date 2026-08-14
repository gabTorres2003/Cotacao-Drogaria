package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.response.ProdutoDnaDTO;
import com.drogaria.cotacao.service.IntegracaoDNAService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired
    private IntegracaoDNAService integracaoDNAService;

    @GetMapping("/buscar")
    public ResponseEntity<?> buscarProduto(@RequestParam("q") String query) {
        return integracaoDNAService.buscarProdutoPorCodigoOuBarras(query)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("Produto não encontrado no DNA"));
    }
}