package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.SalvarPrecoDTO;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.service.FornecedorService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fornecedor")
public class FornecedorController {

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private FornecedorService fornecedorService;

    @GetMapping
    public List<Fornecedor> listar() {
        return fornecedorRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Fornecedor> criar(@RequestBody Fornecedor fornecedor) {
        fornecedor.setPrimeiroAcesso(true);
        return ResponseEntity.ok(fornecedorRepository.save(fornecedor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Fornecedor> atualizar(@PathVariable Long id, @RequestBody Fornecedor dados) {
        return fornecedorRepository.findById(id)
                .map(fornecedor -> {
                    fornecedor.setNome(dados.getNome());
                    fornecedor.setLogin(dados.getLogin());
                    fornecedor.setTelefone(dados.getTelefone());
                    fornecedor.setEmail(dados.getEmail());
                    fornecedor.setEmpresa(dados.getEmpresa()); 
                    
                    return ResponseEntity.ok(fornecedorRepository.save(fornecedor));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/reset-senha")
    public ResponseEntity<Fornecedor> resetSenha(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return fornecedorRepository.findById(id).map(f -> {
            f.setSenha(payload.get("novaSenha"));
            f.setPrimeiroAcesso(true);
            return ResponseEntity.ok(fornecedorRepository.save(f));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/primeiro-acesso")
    public ResponseEntity<Fornecedor> concluirPrimeiroAcesso(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return fornecedorRepository.findById(id).map(f -> {
            f.setSenha(payload.get("novaSenha"));
            f.setPrimeiroAcesso(false);
            return ResponseEntity.ok(fornecedorRepository.save(f));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/salvar-respostas")
    public ResponseEntity<String> salvarRespostas(@RequestBody List<SalvarPrecoDTO> respostas) {
        try {
            fornecedorService.salvarRespostasFornecedor(respostas);
            return ResponseEntity.ok("Respostas salvas com sucesso!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao salvar: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        try {
            fornecedorService.deletarFornecedor(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Não é possível excluir o fornecedor pois ele possui histórico de respostas.");
        }
    }

    @GetMapping("/{idFornecedor}/cotacao/{idCotacao}/respostas")
    public ResponseEntity<List<SalvarPrecoDTO>> buscarRespostas(
            @PathVariable Long idFornecedor,
            @PathVariable Long idCotacao) {
        return ResponseEntity.ok(fornecedorService.buscarRespostas(idCotacao, idFornecedor));
    }
}