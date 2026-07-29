package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.Devolucao;
import com.drogaria.cotacao.model.enums.TipoAcao;
import com.drogaria.cotacao.service.DevolucaoService;
import com.drogaria.cotacao.service.LogAuditoriaService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/devolucoes")
@CrossOrigin(origins = {"https://cotacaotorresfarma.netlify.app", "http://localhost:5173"})
@RequiredArgsConstructor
public class DevolucaoController {

    private final DevolucaoService devolucaoService;
    private final LogAuditoriaService logAuditoriaService;
    private final HttpServletRequest request;

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
    public ResponseEntity<List<Devolucao>> listarTodas() {
        return ResponseEntity.ok(devolucaoService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Devolucao> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(devolucaoService.buscarPorId(id));
    }

    @GetMapping("/pedido/{pedidoId}")
    public ResponseEntity<List<Devolucao>> buscarPorPedido(@PathVariable Long pedidoId) {
        return ResponseEntity.ok(devolucaoService.buscarPorPedido(pedidoId));
    }

    @PostMapping
    public ResponseEntity<Devolucao> criar(@RequestBody Devolucao devolucao) {
        Devolucao salva = devolucaoService.salvar(devolucao);

        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.CRIACAO, "Devolução", salva.getId(),
            "Registrou uma nova devolução para o fornecedor: " + salva.getFornecedor().getNome()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Devolucao> atualizar(@PathVariable Long id, @RequestBody Devolucao devolucao) {
        devolucao.setId(id);
        Devolucao atualizada = devolucaoService.salvar(devolucao);

        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.ATUALIZACAO, "Devolução", id,
            "Atualizou os dados/status da devolução."
        );

        return ResponseEntity.ok(atualizada);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        devolucaoService.deletar(id);

        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.EXCLUSAO, "Devolução", id,
            "Excluiu permanentemente a devolução do sistema."
        );

        return ResponseEntity.noContent().build();
    }
}