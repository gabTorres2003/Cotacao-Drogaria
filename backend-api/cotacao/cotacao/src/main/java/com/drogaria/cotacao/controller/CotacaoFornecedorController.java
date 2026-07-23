package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.CotacaoFornecedor;
import com.drogaria.cotacao.service.CotacaoFornecedorService;
import com.drogaria.cotacao.repository.CotacaoFornecedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cotacao-fornecedor")
@RequiredArgsConstructor
public class CotacaoFornecedorController {

    private final CotacaoFornecedorService service;
    private final CotacaoFornecedorRepository repository;

    @PostMapping("/vincular/{cotacaoId}")
    public ResponseEntity<Void> vincular(@PathVariable Long cotacaoId, @RequestBody List<Long> fornecedorIds) {
        service.vincularFornecedores(cotacaoId, fornecedorIds);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/fornecedor/{idFornecedor}")
    public ResponseEntity<List<CotacaoFornecedor>> buscarPorFornecedorId(@PathVariable Long idFornecedor) {
        List<CotacaoFornecedor> todas = repository.findAll();
        List<CotacaoFornecedor> filtradas = todas.stream()
                .filter(c -> c.getFornecedor() != null && c.getFornecedor().getId().equals(idFornecedor))
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(filtradas);
    }

    @GetMapping("/minhas-cotacoes")
    public ResponseEntity<List<CotacaoFornecedor>> minhasCotacoes(org.springframework.security.core.Authentication auth) {
        return ResponseEntity.ok(service.listarPorFornecedor(auth.getName()));
    }

    @GetMapping("/cotacao/{idCotacao}")
    public ResponseEntity<List<CotacaoFornecedor>> buscarVinculosDaCotacao(@PathVariable Long idCotacao) {
        return ResponseEntity.ok(repository.findByCotacaoId(idCotacao));
    }
}