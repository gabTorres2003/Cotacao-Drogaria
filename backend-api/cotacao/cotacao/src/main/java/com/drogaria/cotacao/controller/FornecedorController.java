package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.SalvarPrecoDTO;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.enums.TipoAcao;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.service.FornecedorService;
import com.drogaria.cotacao.service.LogAuditoriaService;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fornecedor")
public class FornecedorController {

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private FornecedorService fornecedorService;

    @Autowired
    private LogAuditoriaService logAuditoriaService;

    @Autowired
    private HttpServletRequest request;

    private String getUsuarioLogado() {
        String nome = request.getHeader("X-Usuario-Nome");
        if (nome != null && !nome.isEmpty()) {
            try {
                return URLDecoder.decode(nome, StandardCharsets.UTF_8.name());
            } catch (Exception e) {
                return nome;
            }
        }
        return "Sistema"; 
    }

    @GetMapping
    public List<Fornecedor> listar() {
        return fornecedorRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Fornecedor> criar(@RequestBody Fornecedor fornecedor) {
        fornecedor.setPrimeiroAcesso(true);
        Fornecedor salvo = fornecedorRepository.save(fornecedor);

        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.CRIACAO, "Fornecedor", salvo.getId(), 
            "Cadastrou o fornecedor: " + salvo.getNome() + " (" + salvo.getEmpresa() + ")"
        );

        return ResponseEntity.ok(salvo);
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
                    fornecedor.setEntreguePor(dados.getEntreguePor());
                    
                    Fornecedor atualizado = fornecedorRepository.save(fornecedor);

                    logAuditoriaService.registrarLog(
                        getUsuarioLogado(), "INTERNO", TipoAcao.ATUALIZACAO, "Fornecedor", id, 
                        "Atualizou os dados cadastrais do fornecedor."
                    );

                    return ResponseEntity.ok(atualizado);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/reset-senha")
    public ResponseEntity<Fornecedor> resetSenha(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return fornecedorRepository.findById(id).map(f -> {
            f.setSenha(payload.get("novaSenha"));
            f.setPrimeiroAcesso(true);
            
            logAuditoriaService.registrarLog(
                getUsuarioLogado(), "INTERNO", TipoAcao.RESET_SENHA, "Fornecedor", id, 
                "Gerou um novo PIN de acesso manual para o fornecedor."
            );

            return ResponseEntity.ok(fornecedorRepository.save(f));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/primeiro-acesso")
    public ResponseEntity<Fornecedor> concluirPrimeiroAcesso(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return fornecedorRepository.findById(id).map(f -> {
            f.setSenha(payload.get("novaSenha"));
            f.setPrimeiroAcesso(false);

            logAuditoriaService.registrarLog(
                getUsuarioLogado(), "FORNECEDOR", TipoAcao.RESET_SENHA, "Fornecedor", id, 
                "Fornecedor concluiu o fluxo de primeiro acesso e definiu seu próprio PIN."
            );

            return ResponseEntity.ok(fornecedorRepository.save(f));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/salvar-respostas")
    public ResponseEntity<String> salvarRespostas(@RequestBody List<SalvarPrecoDTO> respostas) {
        try {
            fornecedorService.salvarRespostasFornecedor(respostas);
            
            logAuditoriaService.registrarLog(
                getUsuarioLogado(), "FORNECEDOR", TipoAcao.RESPOSTA_COTACAO, "Cotação", null, 
                "Fornecedor enviou/atualizou as propostas de preços para uma cotação."
            );

            return ResponseEntity.ok("Respostas salvas com sucesso!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao salvar: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        try {
            fornecedorService.deletarFornecedor(id);

            logAuditoriaService.registrarLog(
                getUsuarioLogado(), "INTERNO", TipoAcao.EXCLUSAO, "Fornecedor", id, 
                "Excluiu permanentemente o fornecedor do sistema."
            );

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