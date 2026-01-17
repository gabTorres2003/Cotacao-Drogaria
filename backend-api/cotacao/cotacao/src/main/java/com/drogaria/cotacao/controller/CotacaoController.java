package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.service.excel.ExcelReaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/cotacao")
public class CotacaoController {

    @Autowired
    private ExcelReaderService excelReaderService;

    @PostMapping("/importar")
    public ResponseEntity<String> importarPlanilha(@RequestParam("file") MultipartFile file) {
        try {
            List<ItemCotacao> itens = excelReaderService.lerArquivoDeFaltas(file);
            
            // Teste de leitura
            System.out.println("Foram lidos " + itens.size() + " itens do Excel.");
            itens.forEach(item -> System.out.println("Item: " + item.getNomeProduto() + " | Qtd: " + item.getQuantidade()));

            return ResponseEntity.ok("Leitura realizada com sucesso! Verifique o console.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erro ao ler arquivo: " + e.getMessage());
        }
    }
}