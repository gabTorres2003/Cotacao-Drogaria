package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.service.excel.ExcelReaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.ItemCotacaoRepository;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/cotacao")
public class CotacaoController {

    @Autowired
    private ExcelReaderService excelReaderService;

    @Autowired
    private ItemCotacaoRepository repository;

    @Autowired
    private CotacaoRepository cotacaoRepository;

    @GetMapping
    public ResponseEntity<List<Cotacao>> listarCotacoes() {
        return ResponseEntity.ok(cotacaoRepository.findAll());
    }

    @PostMapping(value = "/importar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> importarPlanilha(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) return ResponseEntity.badRequest().body("Arquivo vazio.");

            // 1. Cria a Cotação pai
            Cotacao novaCotacao = new Cotacao();
            novaCotacao.setStatus("ABERTA");
            novaCotacao.setDescricao("Importação em " + LocalDateTime.now());
            
            // Salva a cotação primeiro para gerar o ID
            cotacaoRepository.save(novaCotacao); 

            // 2. Lê os itens do Excel
            List<ItemCotacao> itens = excelReaderService.lerArquivoDeFaltas(file);

            // 3. Vincula cada item à cotação criada
            for (ItemCotacao item : itens) {
                item.setCotacao(novaCotacao);
            }
            
            // 4. Salva os itens vinculados
            repository.saveAll(itens);

            return ResponseEntity.ok("Sucesso! Cotação #" + novaCotacao.getId() + " criada com " + itens.size() + " itens.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }
}
