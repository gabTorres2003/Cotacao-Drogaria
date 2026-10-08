package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.ConfigFornecedorRequest;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.ConfigFornecedorResponse;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.ConfigGrupoRequest;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.ConfigGrupoResponse;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.DecisaoRequest;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.GerarCotacaoRequest;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.GerarSugestaoRequest;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.GrupoResponse;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.ParametrosResponse;
import com.drogaria.cotacao.model.ConfiguracaoFornecedorInteligencia;
import com.drogaria.cotacao.model.ConfiguracaoGrupoCompra;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.ParametrosInteligenciaCompra;
import com.drogaria.cotacao.model.SugestaoCompra;
import com.drogaria.cotacao.repository.ConfiguracaoFornecedorInteligenciaRepository;
import com.drogaria.cotacao.repository.ConfiguracaoGrupoCompraRepository;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.repository.ParametrosInteligenciaCompraRepository;
import com.drogaria.cotacao.service.InteligenciaDnaService;
import com.drogaria.cotacao.service.SugestaoCompraService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * API da Inteligência de Compras.
 * Rotas não estão em permitAll: exigem JWT (padrão anyRequest().authenticated()),
 * sem alterar o Spring Security existente.
 */
@Slf4j
@RestController
@RequestMapping("/api/inteligencia")
@RequiredArgsConstructor
public class InteligenciaCompraController {

    private final SugestaoCompraService sugestaoService;
    private final InteligenciaDnaService intelDna;
    private final ConfiguracaoGrupoCompraRepository configGrupoRepo;
    private final ConfiguracaoFornecedorInteligenciaRepository configFornRepo;
    private final ParametrosInteligenciaCompraRepository parametrosRepo;
    private final FornecedorRepository fornecedorRepo;

    // ------------------------------------------------------------------
    // Listas auxiliares (DNA + cadastros)
    // ------------------------------------------------------------------
    @GetMapping("/grupos")
    public ResponseEntity<?> listarGrupos() {
        return executar(() -> {
            List<ConfiguracaoGrupoCompra> configs = configGrupoRepo.findAll();
            Map<Integer, ConfiguracaoGrupoCompra> porGrupo = configs.stream()
                    .collect(java.util.stream.Collectors.toMap(
                            ConfiguracaoGrupoCompra::getDnaGrupoId, c -> c, (a, b) -> a));
            List<GrupoResponse> grupos = intelDna.buscarGrupos().stream()
                    .map(g -> {
                        ConfiguracaoGrupoCompra cfg = porGrupo.get(g.codigo());
                        return new GrupoResponse(g.codigo(), g.nome(), cfg != null,
                                cfg != null ? cfg.getAtivo() : null);
                    })
                    .toList();
            return ResponseEntity.ok(grupos);
        });
    }

    @GetMapping("/fornecedores-dna")
    public ResponseEntity<?> listarFornecedoresDna() {
        return executar(() -> ResponseEntity.ok(intelDna.buscarFornecedores()));
    }

    @GetMapping("/fornecedores")
    public ResponseEntity<?> listarFornecedoresSistema() {
        List<InteligenciaDtos.FornecedorSistemaResponse> fornecedores = fornecedorRepo.findAll().stream()
                .filter(Fornecedor::isAtivo)
                .map(f -> new InteligenciaDtos.FornecedorSistemaResponse(
                        f.getId(), f.getNome(), f.getEmpresa(), f.isAtivo()))
                .toList();
        return ResponseEntity.ok(fornecedores);
    }

    // ------------------------------------------------------------------
    // Configurações
    // ------------------------------------------------------------------
    @GetMapping("/config/grupos")
    public ResponseEntity<?> listarConfigGrupos() {
        return executar(() -> ResponseEntity.ok(
                configGrupoRepo.findAllByOrderByDnaGrupoNomeAsc().stream()
                        .map(this::paraConfigGrupoResponse).toList()));
    }

    @PostMapping("/config/grupos")
    public ResponseEntity<?> salvarConfigGrupo(@RequestBody ConfigGrupoRequest request) {
        return executar(() -> {
            if (request == null || request.dnaGrupoId() == null) {
                throw new IllegalArgumentException("Grupo (dnaGrupoId) não informado");
            }
            if (request.intervaloCompraDias() == null || request.intervaloCompraDias() <= 0) {
                throw new IllegalArgumentException("Intervalo de compra inválido (deve ser > 0)");
            }
            if (request.diasSeguranca() != null && request.diasSeguranca() < 0) {
                throw new IllegalArgumentException("Dias de segurança inválidos");
            }
            if (request.janelaDemandaDias() != null && request.janelaDemandaDias() <= 0) {
                throw new IllegalArgumentException("Janela de demanda inválida");
            }
            if (request.coberturaMaximaDias() != null && request.coberturaMaximaDias() <= 0) {
                throw new IllegalArgumentException("Cobertura máxima inválida");
            }
            ConfiguracaoGrupoCompra cfg = configGrupoRepo.findByDnaGrupoId(request.dnaGrupoId())
                    .orElseGet(ConfiguracaoGrupoCompra::new);
            cfg.setDnaGrupoId(request.dnaGrupoId());
            cfg.setDnaGrupoNome(request.dnaGrupoNome());
            cfg.setIntervaloCompraDias(request.intervaloCompraDias());
            cfg.setDiasSeguranca(request.diasSeguranca() != null ? request.diasSeguranca() : 0);
            cfg.setJanelaDemandaDias(request.janelaDemandaDias() != null ? request.janelaDemandaDias() : 90);
            cfg.setCoberturaMaximaDias(request.coberturaMaximaDias());
            cfg.setAtivo(request.ativo() == null || request.ativo());
            return ResponseEntity.ok(paraConfigGrupoResponse(configGrupoRepo.save(cfg)));
        });
    }

    @GetMapping("/config/fornecedores")
    public ResponseEntity<?> listarConfigFornecedores() {
        return executar(() -> ResponseEntity.ok(
                configFornRepo.findAllByOrderByFornecedorNomeAsc().stream()
                        .map(this::paraConfigFornecedorResponse).toList()));
    }

    @PostMapping("/config/fornecedores")
    public ResponseEntity<?> salvarConfigFornecedor(@RequestBody ConfigFornecedorRequest request) {
        return executar(() -> {
            if (request == null || (request.fornecedorId() == null && request.dnaFornecedorId() == null)) {
                throw new IllegalArgumentException("Informe o fornecedor do sistema ou o código DNA");
            }
            if (request.leadTimeManualDias() != null && request.leadTimeManualDias() < 0) {
                throw new IllegalArgumentException("Lead time inválido");
            }
            if (request.pedidoMinimoValor() != null && request.pedidoMinimoValor().signum() < 0) {
                throw new IllegalArgumentException("Pedido mínimo inválido");
            }
            ConfiguracaoFornecedorInteligencia cfg = request.fornecedorId() != null
                    ? configFornRepo.findByFornecedorId(request.fornecedorId()).orElse(null)
                    : null;
            if (cfg == null && request.dnaFornecedorId() != null) {
                cfg = configFornRepo.findByDnaFornecedorIdAndAtivoTrue(request.dnaFornecedorId())
                        .or(() -> configFornRepo.findAll().stream()
                                .filter(c -> request.dnaFornecedorId().equals(c.getDnaFornecedorId()))
                                .findFirst())
                        .orElse(null);
            }
            if (cfg == null) cfg = new ConfiguracaoFornecedorInteligencia();
            cfg.setFornecedorId(request.fornecedorId());
            cfg.setDnaFornecedorId(request.dnaFornecedorId());
            cfg.setFornecedorNome(request.fornecedorNome());
            cfg.setLeadTimeManualDias(request.leadTimeManualDias());
            cfg.setPedidoMinimoValor(request.pedidoMinimoValor());
            cfg.setObservacao(request.observacao());
            cfg.setAtivo(request.ativo() == null || request.ativo());
            return ResponseEntity.ok(paraConfigFornecedorResponse(configFornRepo.save(cfg)));
        });
    }

    @GetMapping("/parametros")
    public ResponseEntity<?> listarParametros() {
        return executar(() -> {
            ParametrosInteligenciaCompra p = parametrosRepo.findFirstByAtivoTrue()
                    .orElseThrow(() -> new IllegalArgumentException("Parâmetros da inteligência não configurados"));
            return ResponseEntity.ok(new ParametrosResponse(
                    String.valueOf(p.getId()), p.getNome(), p.getPesoDemanda30(), p.getPesoDemanda60(), p.getPesoDemanda90(),
                    p.getDiasHistoricoMinimo(), p.getMargemMinimaPromocao(),
                    p.getToleranciaExcessoPercentual(), p.getAtivo()));
        });
    }

    // ------------------------------------------------------------------
    // Sugestões
    // ------------------------------------------------------------------
    @PostMapping("/sugestoes/gerar")
    public ResponseEntity<?> gerarSugestao(@RequestBody GerarSugestaoRequest request) {
        return executar(() -> {
            SugestaoCompra sugestao = sugestaoService.gerarSugestao(
                    request != null ? request.dnaGrupoId() : null);
            return ResponseEntity.ok(sugestaoService.resumos(List.of(sugestao)).get(0));
        });
    }

    @GetMapping("/sugestoes")
    public ResponseEntity<?> listarSugestoes(@RequestParam(required = false) Integer grupo) {
        return executar(() -> {
            List<SugestaoCompra> sugestoes = sugestaoService.listarSugestoes(grupo);
            return ResponseEntity.ok(sugestaoService.resumos(sugestoes));
        });
    }

    @GetMapping("/sugestoes/{id}")
    public ResponseEntity<?> buscarSugestao(@PathVariable UUID id) {
        return executar(() -> {
            var resumo = sugestaoService.resumos(List.of(sugestaoService.buscarSugestao(id))).get(0);
            return ResponseEntity.ok(new InteligenciaDtos.SugestaoDetalheResponse(
                    resumo, sugestaoService.itensResponse(id)));
        });
    }

    @GetMapping("/sugestoes/{id}/itens/{itemId}/detalhe")
    public ResponseEntity<?> detalheProduto(@PathVariable UUID id, @PathVariable UUID itemId) {
        return executar(() -> ResponseEntity.ok(sugestaoService.detalheProduto(id, itemId)));
    }

    @PutMapping("/sugestoes/{id}/itens/{itemId}/decisao")
    public ResponseEntity<?> registrarDecisao(@PathVariable UUID id, @PathVariable UUID itemId,
            @RequestBody DecisaoRequest request) {
        return executar(() -> ResponseEntity.ok(
                sugestaoService.toItemResponse(sugestaoService.registrarDecisao(id, itemId, request))));
    }

    @PostMapping("/sugestoes/{id}/gerar-cotacao")
    public ResponseEntity<?> gerarCotacao(@PathVariable UUID id, @RequestBody(required = false) GerarCotacaoRequest request) {
        return executar(() -> {
            Long cotacaoId = sugestaoService.gerarCotacao(id, request);
            return ResponseEntity.ok(Map.of("cotacaoId", cotacaoId));
        });
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    private ConfigGrupoResponse paraConfigGrupoResponse(ConfiguracaoGrupoCompra c) {
        return new ConfigGrupoResponse(String.valueOf(c.getId()), c.getDnaGrupoId(), c.getDnaGrupoNome(),
                c.getIntervaloCompraDias(), c.getDiasSeguranca(), c.getJanelaDemandaDias(),
                c.getCoberturaMaximaDias(), c.getAtivo());
    }

    private ConfigFornecedorResponse paraConfigFornecedorResponse(ConfiguracaoFornecedorInteligencia c) {
        return new ConfigFornecedorResponse(String.valueOf(c.getId()), c.getFornecedorId(),
                c.getDnaFornecedorId(), c.getFornecedorNome(), c.getLeadTimeManualDias(),
                c.getPedidoMinimoValor(), c.getObservacao(), c.getAtivo());
    }

    /** Padroniza respostas de erro do módulo: { "message": "..." }. */
    private ResponseEntity<?> executar(Supplier<ResponseEntity<?>> acao) {
        try {
            return acao.get();
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.warn("[IntelCompra] {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message",
                    e.getMessage() != null ? e.getMessage() : "Erro na operação"));
        } catch (Exception e) {
            log.error("[IntelCompra] Erro inesperado", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Erro interno ao processar a solicitação"));
        }
    }
}
