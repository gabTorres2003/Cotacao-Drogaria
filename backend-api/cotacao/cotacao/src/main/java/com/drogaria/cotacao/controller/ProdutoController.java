package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.service.IntegracaoDNAService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/produtos")
@CrossOrigin(origins = {"https://cotacaotorresfarma.netlify.app", "http://localhost:5173"})
public class ProdutoController {

    @Autowired
    private IntegracaoDNAService integracaoDNAService;

    @GetMapping("/buscar")
    public ResponseEntity<?> buscarProduto(@RequestParam("q") String query) {
        return integracaoDNAService.buscarProdutoPorCodigoOuBarras(query)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("Produto não encontrado"));
    }
}