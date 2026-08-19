package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.GerarPedidoRequestDTO;
import com.drogaria.cotacao.dto.request.ReceberPedidoRequestDTO;
import com.drogaria.cotacao.model.ItemPedido;
import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.model.SugestaoPedido;
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

    @GetMapping("/cotacao/{cotacaoId}/itens-pendentes")
    public ResponseEntity<List<Map<String, Object>>> buscarItensPendentesDaCotacao(@PathVariable Long cotacaoId) {
        return ResponseEntity.ok(pedidoService.buscarItensPendentesPorCotacao(cotacaoId));
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

    @PostMapping("/{id}/itens")
    public ResponseEntity<Pedido> adicionarItemManual(@PathVariable Long id, @RequestBody ItemPedido novoItem) {
        Pedido pedidoAtualizado = pedidoService.adicionarItemManual(id, novoItem);
        
        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.ATUALIZACAO, "Pedido", id, 
            "Adicionou o produto extra manualmente: " + novoItem.getNomeProduto()
        );

        return ResponseEntity.ok(pedidoAtualizado);
    }

    @PutMapping("/{id}/itens/{idItemAntigo}/trocar")
    public ResponseEntity<Pedido> trocarItemPedido(@PathVariable Long id, @PathVariable Long idItemAntigo, @RequestBody ItemPedido novoItem) {
        Pedido pedidoAtualizado = pedidoService.trocarItem(id, idItemAntigo, novoItem);
        
        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.ATUALIZACAO, "Pedido", id, 
            "Efetuou a troca de um produto do pedido pelo item: " + novoItem.getNomeProduto()
        );

        return ResponseEntity.ok(pedidoAtualizado);
    }

    @PutMapping("/{id}/valores-previstos")
    public ResponseEntity<Pedido> atualizarValoresPrevistos(
            @PathVariable Long id, 
            @RequestBody List<Map<String, Object>> payload) {
        Pedido pedidoAtualizado = pedidoService.atualizarValoresPrevistos(id, payload);
        
        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.ATUALIZACAO, "Pedido", id, 
            "Editou os valores/quantidades no pedido e sincronizou com a cotação."
        );

        return ResponseEntity.ok(pedidoAtualizado);
    }

    @PutMapping("/{id}/receber")
    public ResponseEntity<Pedido> processarRecebimento(
            @PathVariable Long id, 
            @RequestBody ReceberPedidoRequestDTO requestDTO) { 
        Pedido pedidoAtualizado = pedidoService.processarRecebimento(id, requestDTO);
        
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

    @PatchMapping("/{id}/cancelar-confirmacao")
    public ResponseEntity<Pedido> cancelarConfirmacao(@PathVariable Long id) {
        Pedido pedidoAtualizado = pedidoService.cancelarConfirmacao(id);
        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.STATUS_PEDIDO, "Pedido", id, 
            "Cancelou a confirmação do fornecedor e reabriu o pedido para edições."
        );
        return ResponseEntity.ok(pedidoAtualizado);
    }

    @PatchMapping("/{id}/refazer-conferencia")
    public ResponseEntity<Pedido> refazerConferencia(@PathVariable Long id) {
        Pedido pedidoAtualizado = pedidoService.refazerConferencia(id);
        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.ATUALIZACAO, "Pedido", id, 
            "Reabriu a conferência (cega) do pedido para ajustes nos valores da Nota Fiscal."
        );
        return ResponseEntity.ok(pedidoAtualizado);
    }

    @PatchMapping("/{id}/valor-minimo")
    public ResponseEntity<Pedido> atualizarValorMinimo(@PathVariable Long id, @RequestBody Map<String, Double> payload) {
        Double valorMinimo = payload.get("valorMinimo");
        Pedido pedidoAtualizado = pedidoService.atualizarValorMinimo(id, valorMinimo);
        return ResponseEntity.ok(pedidoAtualizado);
    }

    @PostMapping("/{id}/sugestoes")
    public ResponseEntity<SugestaoPedido> adicionarSugestao(@PathVariable Long id, @RequestBody SugestaoPedido sugestao) {
        SugestaoPedido novaSugestao = pedidoService.adicionarSugestao(id, sugestao);
        return ResponseEntity.status(HttpStatus.CREATED).body(novaSugestao);
    }

    @DeleteMapping("/{id}/sugestoes/{idSugestao}")
    public ResponseEntity<Void> removerSugestao(@PathVariable Long id, @PathVariable Long idSugestao) {
        pedidoService.removerSugestao(id, idSugestao);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/sugestoes/{idSugestao}/aceitar")
    public ResponseEntity<Pedido> aceitarSugestao(@PathVariable Long id, @PathVariable Long idSugestao) {
        Pedido pedidoAtualizado = pedidoService.aceitarSugestao(id, idSugestao);
        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "INTERNO", TipoAcao.ATUALIZACAO, "Pedido", id, 
            "Aceitou a sugestão extra do fornecedor e incluiu no pedido oficial."
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

    @DeleteMapping("/item/{idItem}")
    public ResponseEntity<Void> deletarItemPedido(@PathVariable Long idItem) {
        pedidoService.removerItem(idItem);
        logAuditoriaService.registrarLog(
            getUsuarioLogado(), "FORNECEDOR", TipoAcao.EXCLUSAO, "ItemPedido", idItem, 
            "Um item foi removido do pedido e retornou para os pendentes."
        );
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/falha-entrega")
    public ResponseEntity<Pedido> registrarFalhaEntrega(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String motivo = payload.get("motivo");
        String acaoDestino = payload.get("acaoDestino");
        String cotacaoIdStr = payload.get("cotacaoDestinoId");
        
        Long cotacaoDestinoId = null;
        if (cotacaoIdStr != null && !cotacaoIdStr.trim().isEmpty()) {
            cotacaoDestinoId = Long.valueOf(cotacaoIdStr);
        }
        
        return ResponseEntity.ok(pedidoService.registrarFalhaEntrega(id, motivo, acaoDestino, cotacaoDestinoId));
    }

    @PatchMapping("/{id}/recebimento-rapido")
    public ResponseEntity<Pedido> recebimentoRapido(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.recebimentoRapido(id));
    }

    @PutMapping("/{id}/valores-reais")
    public ResponseEntity<Pedido> ajustarValoresReais(@PathVariable Long id, @RequestBody java.util.List<com.drogaria.cotacao.dto.request.ItemRecebidoDTO> itens) {
        return ResponseEntity.ok(pedidoService.ajustarValoresReais(id, itens));
    }
}