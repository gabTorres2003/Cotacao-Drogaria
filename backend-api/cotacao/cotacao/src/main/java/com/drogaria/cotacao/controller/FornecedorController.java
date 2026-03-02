package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.SalvarPrecoDTO;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.service.FornecedorService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
        System.out.println("Criação registrada - Email: " + fornecedor.getEmail() + " | Senha: " + fornecedor.getSenha()); //Log de teste
        return ResponseEntity.ok(fornecedorRepository.save(fornecedor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Fornecedor> atualizar(@PathVariable Long id, @RequestBody Fornecedor dados) {
        return fornecedorRepository.findById(id)
                .map(fornecedor -> {
                    fornecedor.setNome(dados.getNome());
                    fornecedor.setTelefone(dados.getTelefone());
                    return ResponseEntity.ok(fornecedorRepository.save(fornecedor));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Fornecedor credenciais) {
        Optional<Fornecedor> fornecedor = fornecedorRepository.findByEmailAndSenha(credenciais.getEmail(), credenciais.getSenha());
        
        if (fornecedor.isPresent()) {
            return ResponseEntity.ok(fornecedor.get());
        }
        return ResponseEntity.status(401).body("E-mail ou senha inválidos");
    }

    @PostMapping("/salvar-respostas")
    public ResponseEntity<String> salvarRespostas(@RequestBody List<SalvarPrecoDTO> respostas) {
        try {
            fornecedorService.salvarRespostasFornecedor(respostas);
            return ResponseEntity.ok("Respostas salvas com sucesso!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erro ao salvar: " + e.getMessage());
        }
    }

}