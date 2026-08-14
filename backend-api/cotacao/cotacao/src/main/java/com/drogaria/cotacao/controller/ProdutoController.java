package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.Produto;
import com.drogaria.cotacao.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/produtos")
@CrossOrigin(origins = {"https://cotacaotorresfarma.netlify.app", "http://localhost:5173"})
@RequiredArgsConstructor
public class ProdutoController {

    private final ProdutoRepository produtoRepository;

    @GetMapping("/buscar")
    public ResponseEntity<List<Produto>> buscarProdutosDna(@RequestParam String q) {
        try {
            String termo = q.trim();
            List<Produto> resultados = new ArrayList<>();

            if (termo.matches("\\d+")) {
                try {
                    Long codigo = Long.parseLong(termo);
                    resultados = produtoRepository.findByCodigoOrCodbarras(codigo, termo);
                } catch (NumberFormatException e) {
                    resultados = produtoRepository.findByCodigoOrCodbarras(-1L, termo);
                }
            } else {
                resultados = produtoRepository.findByDescricaoContainingIgnoreCaseOrderByDescricaoAsc(termo);
            }

            if (resultados.size() > 50) {
                resultados = resultados.subList(0, 50);
            }

            return ResponseEntity.ok(resultados);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}