package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.CotacaoFornecedor;
import com.drogaria.cotacao.service.CotacaoFornecedorService;
import com.drogaria.cotacao.repository.CotacaoFornecedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<?> buscarPorFornecedorId(
            @PathVariable Long idFornecedor,
            @RequestParam(value = "resumo", defaultValue = "false") boolean resumo) {
        if (resumo) {
            return ResponseEntity.ok(repository.listarResumosPorFornecedorId(idFornecedor));
        }
        return ResponseEntity.ok(repository.findByFornecedorId(idFornecedor));
    }

    @GetMapping("/minhas-cotacoes")
    public ResponseEntity<List<CotacaoFornecedor>> minhasCotacoes(org.springframework.security.core.Authentication auth) {
        return ResponseEntity.ok(service.listarPorFornecedor(auth.getName()));
    }

    @GetMapping("/cotacao/{idCotacao}")
    public ResponseEntity<List<CotacaoFornecedor>> buscarVinculosDaCotacao(@PathVariable Long idCotacao) {
        return ResponseEntity.ok(repository.findByCotacaoId(idCotacao));
    }

    @DeleteMapping("/{idVinculo}")
    public ResponseEntity<Void> desvincular(@PathVariable Long idVinculo) {
        service.desvincularFornecedor(idVinculo);
        return ResponseEntity.noContent().build();
    }
}