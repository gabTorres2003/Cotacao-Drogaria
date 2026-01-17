package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.SalvarPrecoDTO;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.service.FornecedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fornecedor")
public class FornecedorController {

    @Autowired
    private FornecedorService fornecedorService;

    // criar fornecedores de teste
    @PostMapping("/criar")
    public ResponseEntity<Fornecedor> criarFornecedor(@RequestParam String nome, @RequestParam String email) {
        return ResponseEntity.ok(fornecedorService.criarFornecedor(nome, email));
    }

    // simula o fornecedor preenchendo a planilha online
    @PostMapping("/responder-cotacao")
    public ResponseEntity<String> receberPrecos(@RequestBody List<SalvarPrecoDTO> precos) {
        try {
            fornecedorService.salvarRespostasFornecedor(precos);
            return ResponseEntity.ok("Preços recebidos com sucesso!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }
}