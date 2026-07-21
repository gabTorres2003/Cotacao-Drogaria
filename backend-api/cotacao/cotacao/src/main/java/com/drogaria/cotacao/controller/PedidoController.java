package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.ItemPedido;
import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.model.enums.StatusPedido;
import com.drogaria.cotacao.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

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

    @PostMapping("/gerar")
    public ResponseEntity<Pedido> gerarPedido(@RequestBody Pedido pedido) {
        Pedido pedidoSalvo = pedidoService.salvarPedido(pedido);
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoSalvo);
    }

    // Endpoint utilizado no "Modal de Receber Pedido" para enviar a conferência cega
    @PutMapping("/{id}/receber")
    public ResponseEntity<Pedido> processarRecebimento(
            @PathVariable Long id, 
            @RequestBody List<ItemPedido> itensConferidos) {
        
        Pedido pedidoAtualizado = pedidoService.processarRecebimento(id, itensConferidos);
        return ResponseEntity.ok(pedidoAtualizado);
    }

    // Endpoint para mudar status manuais, como concluir uma devolução
    @PatchMapping("/{id}/status")
    public ResponseEntity<Pedido> atualizarStatus(
            @PathVariable Long id, 
            @RequestBody Map<String, String> body) {
        
        StatusPedido novoStatus = StatusPedido.valueOf(body.get("status"));
        Pedido pedidoAtualizado = pedidoService.atualizarStatus(id, novoStatus);
        return ResponseEntity.ok(pedidoAtualizado);
    }
}