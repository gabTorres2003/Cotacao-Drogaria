package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.service.IntegracaoDNAService;
import com.drogaria.cotacao.service.PesquisaProdutoDnaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/produtos")
@CrossOrigin(origins = {"https://cotacaotorresfarma.netlify.app", "http://localhost:5173"})
public class ProdutoController {

    @Autowired
    private IntegracaoDNAService integracaoDNAService;

    @Autowired
    private PesquisaProdutoDnaService pesquisaProdutoDnaService;

    @GetMapping("/buscar")
    public ResponseEntity<?> buscarProduto(
            @RequestParam("q") String query,
            @RequestParam(value = "tipo", required = false) String tipo) {
        return integracaoDNAService.buscarProdutoPorCodigoOuBarras(query, tipo)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("Produto não encontrado"));
    }

    /**
     * Pesquisa produtos no DNA por descrição ou princípio ativo. A busca por
     * código/EAN continua em {@link #buscarProduto(String, String)}.
     */
    @GetMapping("/pesquisar")
    public ResponseEntity<?> pesquisarProduto(
            @RequestParam("q") String query,
            @RequestParam(value = "tipo", defaultValue = "descricao") String tipo) {
        try {
            return ResponseEntity.ok(pesquisaProdutoDnaService.pesquisar(query, tipo));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        } catch (PesquisaProdutoDnaService.DnaIndisponivelException e) {
            return ResponseEntity.status(503)
                    .body(Map.of("mensagem", "Consulta ao DNA indisponível. Tente novamente em instantes."));
        }
    }
}
