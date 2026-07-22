package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.GerarPedidoRequestDTO;
import com.drogaria.cotacao.dto.request.ReceberPedidoRequestDTO;
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
@CrossOrigin(origins = "*")
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
    public ResponseEntity<Pedido> gerarPedido(@RequestBody GerarPedidoRequestDTO requestDTO) {
        Pedido pedidoSalvo = pedidoService.gerarPedidoEmLote(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoSalvo);
    }

    @PutMapping("/{id}/receber")
    public ResponseEntity<Pedido> processarRecebimento(
            @PathVariable Long id, 
            @RequestBody ReceberPedidoRequestDTO requestDTO) { 
        Pedido pedidoAtualizado = pedidoService.processarRecebimento(id, requestDTO.getItens());
        return ResponseEntity.ok(pedidoAtualizado);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Pedido> atualizarStatus(
            @PathVariable Long id, 
            @RequestBody Map<String, String> body) {
        
        StatusPedido novoStatus = StatusPedido.valueOf(body.get("status"));
        Pedido pedidoAtualizado = pedidoService.atualizarStatus(id, novoStatus);
        return ResponseEntity.ok(pedidoAtualizado);
    }
}