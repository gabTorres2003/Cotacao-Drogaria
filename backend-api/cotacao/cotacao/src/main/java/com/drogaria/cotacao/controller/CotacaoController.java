package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.service.excel.ExcelReaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/cotacao")
public class CotacaoController {

    @Autowired
    private CotacaoRepository cotacaoRepository;

    @Autowired
    private ExcelReaderService excelService;

    @GetMapping
    public ResponseEntity<List<Cotacao>> listarTodas() {
        return ResponseEntity.ok(cotacaoRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cotacao> buscarPorId(@PathVariable Long id) {
        return cotacaoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadArquivo(@RequestParam("file") MultipartFile file) {
        try {
            List<ItemCotacao> itens = excelService.read(file);

            if (itens.isEmpty()) {
                return ResponseEntity.badRequest().body("O arquivo Excel está vazio ou ilegível.");
            }

            Cotacao novaCotacao = new Cotacao();
            novaCotacao.setDescricao("Importação em " + LocalDateTime.now());
            novaCotacao.setStatus("ABERTA");
            novaCotacao.setDataCriacao(LocalDateTime.now());

            for (ItemCotacao item : itens) {
                item.setCotacao(novaCotacao);
            }
            novaCotacao.setItens(itens);
            cotacaoRepository.save(novaCotacao);

            return ResponseEntity.ok("Cotação criada com sucesso! Itens importados: " + itens.size());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erro ao processar arquivo: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<String> atualizarStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String novoStatus = payload.get("status");
        
        return cotacaoRepository.findById(id)
                .map(cotacao -> {
                    cotacao.setStatus(novoStatus);
                    cotacaoRepository.save(cotacao);
                    return ResponseEntity.ok("Status atualizado para " + novoStatus);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}