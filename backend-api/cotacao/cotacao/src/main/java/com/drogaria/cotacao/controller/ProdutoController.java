package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.Produto;
import com.drogaria.cotacao.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/produtos")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProdutoController {

    private final ProdutoRepository produtoRepository;

    @GetMapping("/buscar")
    public ResponseEntity<List<Produto>> buscarProdutosDna(@RequestParam String q) {
        List<Produto> resultados = produtoRepository.buscarPorCodigoExato(q.trim());
        return ResponseEntity.ok(resultados);
    }
}