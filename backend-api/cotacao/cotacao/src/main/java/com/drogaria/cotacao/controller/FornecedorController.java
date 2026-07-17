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
import java.util.Optional;

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
        fornecedor.setPrimeiroAcesso(true); // Garante que será tratado como 1º acesso
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
                    return ResponseEntity.ok(fornecedorRepository.save(fornecedor));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Fornecedor credenciais) {
        // Busca agora usando Login + Senha(PIN)
        Optional<Fornecedor> fornecedor = fornecedorRepository.findByLoginAndSenha(credenciais.getLogin(), credenciais.getSenha());
        
        if (fornecedor.isPresent()) {
            return ResponseEntity.ok(fornecedor.get());
        }
        return ResponseEntity.status(401).body("Login ou PIN inválidos");
    }

    @PutMapping("/{id}/reset-senha")
    public ResponseEntity<Fornecedor> resetSenha(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return fornecedorRepository.findById(id).map(f -> {
            f.setSenha(payload.get("novaSenha"));
            f.setPrimeiroAcesso(true); // Força a troca no próximo acesso do fornecedor
            return ResponseEntity.ok(fornecedorRepository.save(f));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/primeiro-acesso")
    public ResponseEntity<Fornecedor> concluirPrimeiroAcesso(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return fornecedorRepository.findById(id).map(f -> {
            f.setSenha(payload.get("novaSenha"));
            f.setPrimeiroAcesso(false); // Libera o acesso definitivo
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
}