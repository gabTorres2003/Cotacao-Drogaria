package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.GerarPedidoRequestDTO;
import com.drogaria.cotacao.dto.request.ReceberPedidoRequestDTO;
import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.model.enums.StatusPedido;
import com.drogaria.cotacao.model.enums.TipoAcao;
import com.drogaria.cotacao.service.LogAuditoriaService;
import com.drogaria.cotacao.service.PedidoService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos")
@CrossOrigin(origins = {"https://cotacaotorresfarma.netlify.app", "http://localhost:5173"})
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;
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
    public ResponseEntity<List<Pedido>> listarTodos() {
        return ResponseEntity.ok(pedidoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pedido> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.buscarPorId(id));
    }

    @GetMapping("/cotacao/{cotacaoId}")
    public ResponseEntity<List<Pedido>> buscarPorCotacao(@PathVariable Long cotacaoId) {
        return ResponseEntity.ok(pedidoService.buscarPorCotacao(cotacaoId));
    }

    @GetMapping("/fornecedor/{fornecedorId}")
    public ResponseEntity<List<Pedido>> buscarPorFornecedorId(@PathVariable Long fornecedorId) {
        return ResponseEntity.ok(pedidoService.buscarPorFornecedorId(fornecedorId));
    }

    @PostMapping("/gerar")
    public ResponseEntity<Pedido> gerarPedido(@RequestBody GerarPedidoRequestDTO requestDTO) {
        Pedido pedidoSalvo = pedidoService.gerarPedidoEmLote(requestDTO);
        
        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.GERACAO_PEDIDO, "Pedido", pedidoSalvo.getId(), 
            "Gerou um novo pedido de compra para o fornecedor: " + requestDTO.getFornecedorNome()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoSalvo);
    }

    @PostMapping("/registro-manual")
    public ResponseEntity<List<Pedido>> registrarPedidosManuais(@RequestBody List<GerarPedidoRequestDTO> requestsDTO) {
        List<Pedido> pedidosSalvos = pedidoService.gerarPedidosManuais(requestsDTO);
        
        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.GERACAO_PEDIDO, "Pedido", null, 
            "Registrou " + pedidosSalvos.size() + " pedido(s) fechado(s) através de checklist manual."
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(pedidosSalvos);
    }

    @PutMapping("/{id}/receber")
    public ResponseEntity<Pedido> processarRecebimento(
            @PathVariable Long id, 
            @RequestBody ReceberPedidoRequestDTO requestDTO) { 
        Pedido pedidoAtualizado = pedidoService.processarRecebimento(id, requestDTO.getItens());
        
        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.ATUALIZACAO, "Pedido", id, 
            "Realizou a conferência física e recebimento do pedido."
        );

        return ResponseEntity.ok(pedidoAtualizado);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Pedido> atualizarStatus(
            @PathVariable Long id, 
            @RequestBody Map<String, String> body) {
        
        StatusPedido novoStatus = StatusPedido.valueOf(body.get("status"));
        Pedido pedidoAtualizado = pedidoService.atualizarStatus(id, novoStatus);

        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "SISTEMA/FORNECEDOR", TipoAcao.STATUS_PEDIDO, "Pedido", id, 
            "Alterou o status do pedido para: " + novoStatus
        );

        return ResponseEntity.ok(pedidoAtualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarPedido(@PathVariable Long id) {
        pedidoService.deletarPedido(id);

        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.EXCLUSAO, "Pedido", id, 
            "Excluiu permanentemente o pedido de compra do sistema."
        );

        return ResponseEntity.noContent().build();
    }
}