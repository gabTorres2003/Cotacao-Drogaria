package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.CotacaoFornecedor;
import com.drogaria.cotacao.service.CotacaoFornecedorService;
import com.drogaria.cotacao.repository.CotacaoFornecedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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

    @GetMapping("/minhas-cotacoes")
    public ResponseEntity<List<CotacaoFornecedor>> minhasCotacoes(Authentication auth) {
        try {
            String identifier = auth.getName();
            
            List<CotacaoFornecedor> todas = repository.findAll();
            List<CotacaoFornecedor> filtradas = todas.stream()
                    .filter(c -> c.getFornecedor() != null && 
                            (c.getFornecedor().getLogin().equals(identifier) || 
                             c.getFornecedor().getId().toString().equals(identifier)))
                    .collect(Collectors.toList());
                    
            if (!filtradas.isEmpty()) {
                return ResponseEntity.ok(filtradas);
            }
            
            return ResponseEntity.ok(service.listarPorFornecedor(identifier));
        } catch (Exception e) {
            return ResponseEntity.ok(service.listarPorFornecedor(auth.getName()));
        }
    }
}