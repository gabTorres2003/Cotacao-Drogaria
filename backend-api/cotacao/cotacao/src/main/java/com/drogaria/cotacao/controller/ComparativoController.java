package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.SalvarPrecoDTO;
import com.drogaria.cotacao.dto.request.SalvarRespostaFornecedorRequestDTO;
import com.drogaria.cotacao.dto.response.ItemComparativoDTO;
import com.drogaria.cotacao.service.ComparativoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comparativo")
@CrossOrigin(origins = {"https://cotacaotorresfarma.netlify.app", "http://localhost:5173"})
public class ComparativoController {

    @Autowired
    private ComparativoService comparativoService;

    @GetMapping("/listar-itens/{idCotacao}")
    public ResponseEntity<List<ItemComparativoDTO>> listarItens(@PathVariable Long idCotacao) {
        List<ItemComparativoDTO> itens = comparativoService.listarItensParaCotacao(idCotacao);
        return ResponseEntity.ok(itens);
    }

    @GetMapping("/relatorio/{idCotacao}")
    public ResponseEntity<List<ItemComparativoDTO>> gerarRelatorio(@PathVariable Long idCotacao) {
        List<ItemComparativoDTO> relatorio = comparativoService.compararPrecos(idCotacao);
        return ResponseEntity.ok(relatorio);
    }

    @PostMapping("/salvar-precos")
    public ResponseEntity<Void> salvarPrecos(@RequestBody List<SalvarPrecoDTO> precosDtos) {
        comparativoService.salvarPrecos(precosDtos);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/salvar-respostas-completas")
    public ResponseEntity<Void> salvarRespostasFornecedor(@RequestBody SalvarRespostaFornecedorRequestDTO request) {
        comparativoService.salvarRespostasFornecedor(request);
        return ResponseEntity.ok().build();
    }
}