package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.CotacaoFornecedor;
import com.drogaria.cotacao.service.CotacaoFornecedorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cotacao-fornecedor")
@RequiredArgsConstructor
public class CotacaoFornecedorController {

    private final CotacaoFornecedorService service;

    @PostMapping("/vincular/{cotacaoId}")
    public ResponseEntity<Void> vincular(@PathVariable Long cotacaoId, @RequestBody List<Long> fornecedorIds) {
        service.vincularFornecedores(cotacaoId, fornecedorIds);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/minhas-cotacoes")
    public ResponseEntity<List<CotacaoFornecedor>> minhasCotacoes(Authentication auth) {
        List<CotacaoFornecedor> cotacoes = service.listarPorFornecedor(auth.getName());
        return ResponseEntity.ok(cotacoes);
    }
}