package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.DecisaoRequest;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.DetalheProdutoResponse;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.GerarCotacaoRequest;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.SugestaoItemResponse;
import com.drogaria.cotacao.dto.inteligencia.InteligenciaDtos.SugestaoResumoResponse;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ConfiguracaoFornecedorInteligencia;
import com.drogaria.cotacao.model.ConfiguracaoGrupoCompra;
import com.drogaria.cotacao.model.HistoricoDecisaoCompra;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.model.ParametrosInteligenciaCompra;
import com.drogaria.cotacao.model.SugestaoCompra;
import com.drogaria.cotacao.model.SugestaoCompraItem;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.ConfiguracaoFornecedorInteligenciaRepository;
import com.drogaria.cotacao.repository.ConfiguracaoGrupoCompraRepository;
import com.drogaria.cotacao.repository.HistoricoDecisaoCompraRepository;
import com.drogaria.cotacao.repository.ParametrosInteligenciaCompraRepository;
import com.drogaria.cotacao.repository.SugestaoCompraItemRepository;
import com.drogaria.cotacao.repository.SugestaoCompraRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Motor de Inteligência de Compras: calcula, sugestão, explica e persiste snapshot.
 * NÃO cria pedidos. A decisão final é humana (registrarDecisao).
 *
 * Fórmulas (pesos vêm de parametros_inteligencia_compra; ciclos de configuracao_grupo_compra;
 * lead time de configuracao_fornecedor_inteligencia):
 *   demanda_diaria_prevista = vmd30*p30 + vmd60*p60 + vmd90*p90
 *   cobertura_atual = estoque / demanda            (demanda 0 -> null, sem NaN/Infinity)
 *   dias_cobertura_alvo = intervalo + lead + seguranca
 *   estoque_alvo = demanda * dias_cobertura_alvo
 *   quantidade_necessaria = max(0, estoque_alvo - estoque)
 *
 * Venda líquida = A_VENDAS (janelas) - devoluções (mesmas janelas), nunca negativa.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SugestaoCompraService {

    private static final Set<String> DECISOES_VALIDAS = Set.of("APROVADO", "AJUSTADO", "RECUSADO");
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final InteligenciaDnaService intelDna;
    private final ConfiguracaoGrupoCompraRepository configGrupoRepo;
    private final ConfiguracaoFornecedorInteligenciaRepository configFornRepo;
    private final ParametrosInteligenciaCompraRepository parametrosRepo;
    private final SugestaoCompraRepository sugestaoRepo;
    private final SugestaoCompraItemRepository itemRepo;
    private final HistoricoDecisaoCompraRepository historicoRepo;
    private final CotacaoRepository cotacaoRepo;
    // Instanciado localmente: o Spring Boot 4 não auto-configura bean do Jackson 2.
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ------------------------------------------------------------------
    // ETAPA 5/6 — geração da sugestão + snapshot
    // ------------------------------------------------------------------
    @Transactional
    public SugestaoCompra gerarSugestao(Integer dnaGrupoId) {
        if (dnaGrupoId == null) {
            throw new IllegalArgumentException("Grupo não informado");
        }
        ConfiguracaoGrupoCompra config = configGrupoRepo.findByDnaGrupoIdAndAtivoTrue(dnaGrupoId)
                .orElseThrow(() -> new IllegalArgumentException("Configuração do grupo inexistente ou inativa"));
        ParametrosInteligenciaCompra params = parametrosRepo.findFirstByAtivoTrue()
                .orElseThrow(() -> new IllegalArgumentException("Parâmetros da inteligência de compra não configurados"));

        LocalDate hoje = LocalDate.now();

        List<InteligenciaDnaService.ProdutoGrupoDnaDTO> produtos = intelDna.buscarProdutosPorGrupo(dnaGrupoId);
        if (produtos == null || produtos.isEmpty()) {
            throw new IllegalArgumentException("Nenhum produto encontrado no DNA para o grupo informado");
        }
        Map<Integer, InteligenciaDnaService.VendasJanelaDTO> vendas =
                intelDna.buscarVendasJanelasPorGrupo(dnaGrupoId, hoje);
        Map<Integer, InteligenciaDnaService.DevolucoesJanelaDTO> devolucoes =
                intelDna.buscarDevolucoesJanelasPorGrupo(dnaGrupoId, hoje);

        int janelaDias = config.getJanelaDemandaDias() != null ? config.getJanelaDemandaDias() : 90;
        LocalDate limiteCompras = hoje.minusDays(janelaDias);
        List<InteligenciaDnaService.CompraDnaDTO> compras =
                intelDna.buscarComprasPorGrupo(dnaGrupoId, limiteCompras);
        Map<Integer, List<InteligenciaDnaService.CompraDnaDTO>> comprasPorProduto = compras.stream()
                .collect(Collectors.groupingBy(InteligenciaDnaService.CompraDnaDTO::codProduto));

        String nomeGrupo = config.getDnaGrupoNome() != null ? config.getDnaGrupoNome()
                : intelDna.buscarGrupos().stream()
                        .filter(g -> g.codigo() != null && g.codigo().equals(dnaGrupoId))
                        .map(InteligenciaDnaService.GrupoDnaDTO::nome)
                        .findFirst().orElse(String.valueOf(dnaGrupoId));

        SugestaoCompra sugestao = new SugestaoCompra();
        sugestao.setDnaGrupoId(dnaGrupoId);
        sugestao.setDnaGrupoNome(nomeGrupo);
        sugestao.setGeradaEm(OffsetDateTime.now());
        sugestao.setPeriodoInicio(limiteCompras);
        sugestao.setPeriodoFim(hoje);
        sugestao.setStatus("GERADA");
        sugestao = sugestaoRepo.save(sugestao);

        List<SugestaoCompraItem> itens = new ArrayList<>();
        for (InteligenciaDnaService.ProdutoGrupoDnaDTO produto : produtos) {
            itens.add(calcularItem(produto,
                    vendas.get(produto.codigo()),
                    devolucoes.get(produto.codigo()),
                    comprasPorProduto.get(produto.codigo()),
                    config, params, hoje, sugestao));
        }
        itemRepo.saveAll(itens);

        log.info("[IntelCompra] Sugestão {} gerada para o grupo '{}' com {} item(ns)",
                sugestao.getId(), nomeGrupo, itens.size());
        return sugestao;
    }

    private SugestaoCompraItem calcularItem(InteligenciaDnaService.ProdutoGrupoDnaDTO produto,
            InteligenciaDnaService.VendasJanelaDTO vendas,
            InteligenciaDnaService.DevolucoesJanelaDTO devolucoes,
            List<InteligenciaDnaService.CompraDnaDTO> compras,
            ConfiguracaoGrupoCompra config, ParametrosInteligenciaCompra params,
            LocalDate hoje, SugestaoCompra sugestao) {

        BigDecimal bruta7 = nz(vendas != null ? vendas.v7() : null);
        BigDecimal bruta14 = nz(vendas != null ? vendas.v14() : null);
        BigDecimal bruta30 = nz(vendas != null ? vendas.v30() : null);
        BigDecimal bruta60 = nz(vendas != null ? vendas.v60() : null);
        BigDecimal bruta90 = nz(vendas != null ? vendas.v90() : null);

        BigDecimal dev7 = nz(devolucoes != null ? devolucoes.d7() : null);
        BigDecimal dev14 = nz(devolucoes != null ? devolucoes.d14() : null);
        BigDecimal dev30 = nz(devolucoes != null ? devolucoes.d30() : null);
        BigDecimal dev60 = nz(devolucoes != null ? devolucoes.d60() : null);
        BigDecimal dev90 = nz(devolucoes != null ? devolucoes.d90() : null);

        BigDecimal liq7 = liquida(bruta7, dev7);
        BigDecimal liq14 = liquida(bruta14, dev14);
        BigDecimal liq30 = liquida(bruta30, dev30);
        BigDecimal liq60 = liquida(bruta60, dev60);
        BigDecimal liq90 = liquida(bruta90, dev90);

        BigDecimal vmd7 = div(liq7, 7);
        BigDecimal vmd14 = div(liq14, 14);
        BigDecimal vmd30 = div(liq30, 30);
        BigDecimal vmd60 = div(liq60, 60);
        BigDecimal vmd90 = div(liq90, 90);

        BigDecimal demanda = vmd30.multiply(nz(params.getPesoDemanda30()))
                .add(vmd60.multiply(nz(params.getPesoDemanda60())))
                .add(vmd90.multiply(nz(params.getPesoDemanda90())))
                .setScale(4, RoundingMode.HALF_UP);

        BigDecimal tendencia = vmd90.compareTo(ZERO) > 0
                ? vmd30.divide(vmd90, 4, RoundingMode.HALF_UP) : null;

        BigDecimal estoque = nz(produto.quantidade());
        boolean demandaPositiva = demanda.compareTo(ZERO) > 0;
        BigDecimal coberturaAtual = demandaPositiva
                ? estoque.divide(demanda, 2, RoundingMode.HALF_UP) : null;

        ConfiguracaoFornecedorInteligencia configForn = produto.codFornecedor() == null ? null
                : configFornRepo.findByDnaFornecedorIdAndAtivoTrue(produto.codFornecedor()).orElse(null);
        boolean leadConfigurado = configForn != null && configForn.getLeadTimeManualDias() != null;
        int leadUsado = leadConfigurado ? configForn.getLeadTimeManualDias() : 0;

        int intervalo = nzInt(config.getIntervaloCompraDias());
        int seguranca = nzInt(config.getDiasSeguranca());
        int diasAlvo = intervalo + leadUsado + seguranca;

        BigDecimal estoqueAlvo = demanda.multiply(BigDecimal.valueOf(diasAlvo))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal necessidade = estoqueAlvo.subtract(estoque).max(ZERO).setScale(2, RoundingMode.HALF_UP);

        // --- status ---
        int diasHistoricoMinimo = nzInt(params.getDiasHistoricoMinimo());
        Integer diasComVenda = vendas != null ? vendas.diasComVenda() : null;
        boolean suspenso = "S".equalsIgnoreCase(produto.suspenderCompra());
        String status;
        if (suspenso) {
            status = "SUSPENSO";
        } else if (liq90.compareTo(ZERO) <= 0 && produto.dtUltVenda() == null) {
            status = "SEM_HISTORICO";
        } else if (liq90.compareTo(ZERO) <= 0) {
            status = "SEM_GIRO";
        } else if (diasComVenda != null && diasComVenda < diasHistoricoMinimo) {
            status = "HISTORICO_INSUFICIENTE";
        } else {
            status = "OK";
        }

        BigDecimal quantidadeSugerida;
        if ("OK".equals(status) || "HISTORICO_INSUFICIENTE".equals(status)) {
            quantidadeSugerida = necessidade.compareTo(ZERO) > 0
                    ? necessidade.setScale(0, RoundingMode.CEILING) : ZERO;
        } else {
            quantidadeSugerida = ZERO;
        }

        List<String> alertas = new ArrayList<>();
        if (!leadConfigurado) {
            alertas.add("Fornecedor sem lead time configurado (lead considerado: 0 dias)");
        }
        if (!demandaPositiva && !"SUSPENSO".equals(status)) {
            alertas.add("Produto sem demanda prevista calculável");
        }

        // --- compras (histórico no período) ---
        LocalDate dataUltCompra = null;
        BigDecimal qtdUltCompra = null;
        BigDecimal menorCusto = null;
        BigDecimal maiorCusto = null;
        BigDecimal qtdCompradaPeriodo = ZERO;
        BigDecimal valorCompradoPeriodo = ZERO;
        int registrosCompras = 0;
        if (compras != null && !compras.isEmpty()) {
            InteligenciaDnaService.CompraDnaDTO ultima = compras.get(0);
            dataUltCompra = ultima.dtEntrada();
            qtdUltCompra = nz(ultima.quantidade());
            for (InteligenciaDnaService.CompraDnaDTO c : compras) {
                registrosCompras++;
                BigDecimal custo = nz(c.vrUnitario());
                BigDecimal qtd = nz(c.quantidade());
                if (menorCusto == null || custo.compareTo(menorCusto) < 0) menorCusto = custo;
                if (maiorCusto == null || custo.compareTo(maiorCusto) > 0) maiorCusto = custo;
                qtdCompradaPeriodo = qtdCompradaPeriodo.add(qtd);
                valorCompradoPeriodo = valorCompradoPeriodo.add(nz(c.valorTotal()));
            }
        } else {
            dataUltCompra = produto.dtUltCompra();
            qtdUltCompra = nz(produto.qtdeUltCompra());
        }

        // --- justificativa legível ---
        StringBuilder just = new StringBuilder();
        just.append("Demanda diária prevista: ").append(fmt(demanda, 2)).append(" un/dia")
                .append(" (VMD30 ").append(fmt(vmd30, 2))
                .append(", VMD60 ").append(fmt(vmd60, 2))
                .append(", VMD90 ").append(fmt(vmd90, 2)).append(").\n");
        just.append("Estoque atual: ").append(fmt(estoque, 0)).append(" un.");
        if (coberturaAtual != null) {
            just.append(" Cobertura atual: ").append(fmt(coberturaAtual, 1)).append(" dias.");
        } else {
            just.append(" Cobertura atual: não calculável (sem demanda prevista).");
        }
        just.append("\n");
        just.append("Ciclo do grupo: ").append(intervalo).append(" dias + lead ")
                .append(leadConfigurado ? leadUsado + " dias" : "não configurado (0)")
                .append(" + segurança ").append(seguranca).append(" dias")
                .append(" => alvo ").append(diasAlvo).append(" dias.\n");
        just.append("Estoque alvo: ").append(fmt(estoqueAlvo, 0)).append(" un. | ")
                .append("Necessidade estimada: ").append(fmt(necessidade, 0)).append(" un.\n");
        just.append("Sugestão calculada: ").append(fmt(quantidadeSugerida, 0)).append(" un.");
        if (tendencia != null) {
            just.append(" | Índice de tendência (VMD30/VMD90): ").append(fmt(tendencia, 2));
            if (tendencia.compareTo(BigDecimal.ONE) > 0) just.append(" (demanda recente acelerando)");
            else if (tendencia.compareTo(BigDecimal.ONE) < 0) just.append(" (demanda recente desacelerando)");
            else just.append(" (demanda estável)");
        }
        just.append("\nStatus: ").append(status).append(".");
        if (!alertas.isEmpty()) {
            just.append("\nAlertas: ").append(String.join("; ", alertas)).append(".");
        }

        // --- snapshot dados_calculo ---
        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("status", status);
        dados.put("vendasBrutas", mapaJanelas(bruta7, bruta14, bruta30, bruta60, bruta90));
        dados.put("devolucoes", mapaJanelas(dev7, dev14, dev30, dev60, dev90));
        dados.put("vendasLiquidas", mapaJanelas(liq7, liq14, liq30, liq60, liq90));
        dados.put("diasComVenda", diasComVenda);
        dados.put("pesos", Map.of(
                "peso30", nz(params.getPesoDemanda30()),
                "peso60", nz(params.getPesoDemanda60()),
                "peso90", nz(params.getPesoDemanda90())));
        dados.put("intervaloCompraDias", intervalo);
        dados.put("leadTimeDias", leadUsado);
        dados.put("leadTimeConfigurado", leadConfigurado);
        dados.put("diasSeguranca", seguranca);
        dados.put("diasCoberturaAlvo", diasAlvo);
        dados.put("janelaDemandaDias", nzInt(config.getJanelaDemandaDias()));
        dados.put("coberturaMaximaDias", config.getCoberturaMaximaDias());
        dados.put("fonteCustoMedio", "PRECOMEDIO (DNA)");
        dados.put("suspensoPorDNA", suspenso);
        dados.put("comprasPeriodo", Map.of(
                "registros", registrosCompras,
                "qtdTotal", qtdCompradaPeriodo,
                "valorTotal", valorCompradoPeriodo,
                "menorCusto", menorCusto != null ? menorCusto : BigDecimal.ZERO,
                "maiorCusto", maiorCusto != null ? maiorCusto : BigDecimal.ZERO));
        dados.put("alertas", alertas);

        SugestaoCompraItem item = new SugestaoCompraItem();
        item.setSugestao(sugestao);
        item.setDnaProdutoId(produto.codigo());
        item.setEan(produto.codbarras());
        item.setProdutoNome(produto.descricao());
        item.setEstoqueAtual(estoque);
        item.setPrecoVenda(nz(produto.precoVenda()));
        item.setCustoAtual(nz(produto.precocusto()));
        item.setCustoMedio(nz(produto.precoMedio()));
        item.setDataUltimaCompra(dataUltCompra);
        item.setQuantidadeUltimaCompra(qtdUltCompra);
        item.setDataUltimaVenda(vendas != null ? vendas.ultimaVenda() : null);
        item.setVendas7d(liq7);
        item.setVendas14d(liq14);
        item.setVendas30d(liq30);
        item.setVendas60d(liq60);
        item.setVendas90d(liq90);
        item.setVmd7d(vmd7);
        item.setVmd14d(vmd14);
        item.setVmd30d(vmd30);
        item.setVmd60d(vmd60);
        item.setVmd90d(vmd90);
        item.setDemandaDiariaPrevista(demanda);
        item.setIndiceTendencia(tendencia);
        item.setCicloCompraDias(intervalo);
        item.setLeadTimeDias(leadUsado);
        item.setDiasSeguranca(seguranca);
        item.setCoberturaAtualDias(coberturaAtual);
        item.setEstoqueAlvo(estoqueAlvo);
        item.setQuantidadeSugerida(quantidadeSugerida);
        item.setDecisao("PENDENTE");
        item.setJustificativaMotor(just.toString());
        item.setDadosCalculo(paraJson(dados));
        return item;
    }

    // ------------------------------------------------------------------
    // Decisão humana (APROVADO / AJUSTADO / RECUSADO) — nunca sobrescreve histórico
    // ------------------------------------------------------------------
    @Transactional
    public SugestaoCompraItem registrarDecisao(UUID sugestaoId, UUID itemId, DecisaoRequest request) {
        if (request == null || request.decisao() == null || !DECISOES_VALIDAS.contains(request.decisao())) {
            throw new IllegalArgumentException("Decisão inválida. Use APROVADO, AJUSTADO ou RECUSADO");
        }
        SugestaoCompra sugestao = sugestaoRepo.findById(sugestaoId)
                .orElseThrow(() -> new IllegalArgumentException("Sugestão não encontrada"));
        if ("COTACAO_GERADA".equals(sugestao.getStatus())) {
            throw new IllegalArgumentException("Sugestão já convertida em cotação; decisões encerradas");
        }
        SugestaoCompraItem item = itemRepo.findById(itemId)
                .filter(i -> i.getSugestao() != null && sugestaoId.equals(i.getSugestao().getId()))
                .orElseThrow(() -> new IllegalArgumentException("Item da sugestão não encontrado"));

        switch (request.decisao()) {
            case "APROVADO" -> item.setQuantidadeAprovada(item.getQuantidadeSugerida());
            case "AJUSTADO" -> {
                if (request.quantidadeDecidida() == null || request.quantidadeDecidida().compareTo(ZERO) < 0) {
                    throw new IllegalArgumentException("Quantidade ajustada inválida");
                }
                item.setQuantidadeAprovada(request.quantidadeDecidida());
            }
            case "RECUSADO" -> item.setQuantidadeAprovada(null);
            default -> throw new IllegalArgumentException("Decisão inválida");
        }
        item.setDecisao(request.decisao());
        if (request.motivo() != null && !request.motivo().isBlank()) {
            item.setJustificativaUsuario(request.motivo().trim());
        }
        itemRepo.save(item);

        HistoricoDecisaoCompra historico = new HistoricoDecisaoCompra();
        historico.setSugestaoItem(item);
        historico.setQuantidadeSugerida(item.getQuantidadeSugerida());
        historico.setQuantidadeDecidida(item.getQuantidadeAprovada());
        historico.setDecisao(request.decisao());
        historico.setMotivo(request.motivo());
        historico.setUsuarioId(request.usuarioId());
        historicoRepo.save(historico);

        atualizarStatusSugestao(sugestao);
        return item;
    }

    private void atualizarStatusSugestao(SugestaoCompra sugestao) {
        List<SugestaoCompraItem> itens = itemRepo.findBySugestaoIdOrderByProdutoNomeAsc(sugestao.getId());
        long pendentes = itens.stream().filter(i -> "PENDENTE".equals(i.getDecisao())).count();
        if (pendentes > 0) {
            sugestao.setStatus(pendentes == itens.size() ? "GERADA" : "EM_REVISAO");
        } else {
            boolean algumAprovado = itens.stream()
                    .anyMatch(i -> ("APROVADO".equals(i.getDecisao()) || "AJUSTADO".equals(i.getDecisao()))
                            && i.getQuantidadeAprovada() != null
                            && i.getQuantidadeAprovada().compareTo(ZERO) > 0);
            sugestao.setStatus(algumAprovado ? "APROVADA" : "DESCARTADA");
        }
        sugestaoRepo.save(sugestao);
    }

    // ------------------------------------------------------------------
    // ETAPA 9 — transformar itens aprovados em cotação do fluxo existente
    // ------------------------------------------------------------------
    @Transactional
    public Long gerarCotacao(UUID sugestaoId, GerarCotacaoRequest request) {
        SugestaoCompra sugestao = sugestaoRepo.findById(sugestaoId)
                .orElseThrow(() -> new IllegalArgumentException("Sugestão não encontrada"));

        List<SugestaoCompraItem> aprovados = itemRepo.findBySugestaoIdOrderByProdutoNomeAsc(sugestaoId).stream()
                .filter(i -> ("APROVADO".equals(i.getDecisao()) || "AJUSTADO".equals(i.getDecisao()))
                        && i.getQuantidadeAprovada() != null
                        && i.getQuantidadeAprovada().compareTo(ZERO) > 0)
                .toList();
        if (aprovados.isEmpty()) {
            throw new IllegalArgumentException("Nenhum item aprovado para gerar cotação");
        }

        Cotacao cotacao = new Cotacao();
        cotacao.setDescricao("Cotação Inteligência de Compra - "
                + (sugestao.getDnaGrupoNome() != null ? sugestao.getDnaGrupoNome() : sugestao.getDnaGrupoId())
                + " - " + LocalDate.now());
        cotacao.setStatus("ABERTA");
        cotacao.setDataCriacao(LocalDateTime.now());
        cotacao.setNomeUsuario(request != null && request.nomeUsuario() != null
                && !request.nomeUsuario().isBlank() ? request.nomeUsuario() : "Inteligência de Compra");
        cotacao.setSetor(request != null && request.setor() != null ? request.setor() : "AMBOS");

        List<ItemCotacao> itens = new ArrayList<>();
        for (SugestaoCompraItem aprovado : aprovados) {
            ItemCotacao item = new ItemCotacao();
            item.setNomeProduto(aprovado.getProdutoNome());
            item.setNomeOriginal(aprovado.getProdutoNome());
            item.setQuantidade(aprovado.getQuantidadeAprovada().setScale(0, RoundingMode.CEILING).intValue());
            item.setCodBarras(aprovado.getEan());
            item.setEstoque(aprovado.getEstoqueAtual() != null ? aprovado.getEstoqueAtual().doubleValue() : null);
            item.setUltimoPreco(aprovado.getCustoAtual() != null ? aprovado.getCustoAtual().doubleValue() : null);
            item.setGrupo(sugestao.getDnaGrupoNome());
            item.setUltCompraData(aprovado.getDataUltimaCompra());
            item.setUltCompraQtde(aprovado.getQuantidadeUltimaCompra() != null
                    ? aprovado.getQuantidadeUltimaCompra().doubleValue() : null);
            item.setUltVendaData(aprovado.getDataUltimaVenda());
            item.setOrigemItem("INTELIGENCIA_COMPRA");

            if (sugestao.getPeriodoInicio() != null && sugestao.getPeriodoFim() != null) {
                long diasPeriodo = sugestao.getPeriodoFim().toEpochDay() - sugestao.getPeriodoInicio().toEpochDay() + 1;
                BigDecimal vendasPeriodo = vendasNoPeriodo(aprovado, diasPeriodo);
                if (vendasPeriodo != null && diasPeriodo > 0 && vendasPeriodo.doubleValue() > 0) {
                    item.setVmd(vendasPeriodo.doubleValue() / diasPeriodo);
                }
            }

            item.setCotacao(cotacao);
            itens.add(item);
        }
        cotacao.setItens(itens);
        Cotacao salva = cotacaoRepo.save(cotacao);

        sugestao.setStatus("COTACAO_GERADA");
        String observacao = sugestao.getObservacao() != null ? sugestao.getObservacao() + "\n" : "";
        sugestao.setObservacao(observacao + "Cotação #" + salva.getId() + " gerada em " + OffsetDateTime.now());
        sugestaoRepo.save(sugestao);

        log.info("[IntelCompra] Sugestão {} convertida na cotação {} ({} item(ns))",
                sugestaoId, salva.getId(), itens.size());
        return salva.getId();
    }

    /** Vendas persistidas do item que correspondem exatamente ao período da sugestão. */
    private static BigDecimal vendasNoPeriodo(SugestaoCompraItem item, long diasPeriodo) {
        if (diasPeriodo == 7) return item.getVendas7d();
        if (diasPeriodo == 14) return item.getVendas14d();
        if (diasPeriodo == 30) return item.getVendas30d();
        if (diasPeriodo == 60) return item.getVendas60d();
        if (diasPeriodo == 90) return item.getVendas90d();
        return null;
    }

    // ------------------------------------------------------------------
    // Leituras auxiliares
    // ------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<SugestaoCompra> listarSugestoes(Integer dnaGrupoId) {
        return dnaGrupoId != null
                ? sugestaoRepo.findByDnaGrupoIdOrderByGeradaEmDesc(dnaGrupoId)
                : sugestaoRepo.findAllByOrderByGeradaEmDesc();
    }

    @Transactional(readOnly = true)
    public SugestaoCompra buscarSugestao(UUID id) {
        return sugestaoRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sugestão não encontrada"));
    }

    @Transactional(readOnly = true)
    public List<SugestaoCompraItem> itensDaSugestao(UUID sugestaoId) {
        return itemRepo.findBySugestaoIdOrderByProdutoNomeAsc(sugestaoId);
    }

    @Transactional(readOnly = true)
    public List<SugestaoItemResponse> itensResponse(UUID sugestaoId) {
        return itensDaSugestao(sugestaoId).stream().map(this::toItemResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SugestaoResumoResponse> resumos(List<SugestaoCompra> sugestoes) {
        if (sugestoes == null || sugestoes.isEmpty()) return List.of();
        List<UUID> ids = sugestoes.stream().map(SugestaoCompra::getId).toList();
        Map<UUID, List<SugestaoCompraItem>> itensPorSugestao = itemRepo.findBySugestaoIdIn(ids).stream()
                .collect(Collectors.groupingBy(i -> i.getSugestao().getId()));
        return sugestoes.stream().map(s -> {
            List<SugestaoCompraItem> itens = itensPorSugestao.getOrDefault(s.getId(), List.of());
            int pendentes = 0, aprovados = 0, recusados = 0;
            for (SugestaoCompraItem i : itens) {
                switch (i.getDecisao() != null ? i.getDecisao() : "PENDENTE") {
                    case "PENDENTE" -> pendentes++;
                    case "RECUSADO" -> recusados++;
                    default -> aprovados++;
                }
            }
            return new SugestaoResumoResponse(s.getId(), s.getDnaGrupoId(), s.getDnaGrupoNome(),
                    s.getGeradaEm(), s.getPeriodoInicio(), s.getPeriodoFim(), s.getStatus(),
                    s.getObservacao(), itens.size(), pendentes, aprovados, recusados);
        }).toList();
    }

    @Transactional(readOnly = true)
    public SugestaoItemResponse toItemResponse(SugestaoCompraItem i) {
        UUID sugestaoId = i.getSugestao() != null ? i.getSugestao().getId() : null;
        return new SugestaoItemResponse(
                i.getId(), sugestaoId, i.getDnaProdutoId(), i.getEan(), i.getProdutoNome(),
                i.getEstoqueAtual(), i.getPrecoVenda(), i.getCustoAtual(), i.getCustoMedio(),
                i.getDataUltimaCompra(), i.getQuantidadeUltimaCompra(), i.getDataUltimaVenda(),
                i.getVendas7d(), i.getVendas14d(), i.getVendas30d(), i.getVendas60d(), i.getVendas90d(),
                i.getVmd7d(), i.getVmd14d(), i.getVmd30d(), i.getVmd60d(), i.getVmd90d(),
                i.getDemandaDiariaPrevista(), i.getIndiceTendencia(),
                i.getCicloCompraDias(), i.getLeadTimeDias(), i.getDiasSeguranca(),
                i.getCoberturaAtualDias(), i.getEstoqueAlvo(),
                i.getQuantidadeSugerida(), i.getQuantidadeAprovada(),
                i.getDecisao(), i.getJustificativaMotor(), i.getJustificativaUsuario(),
                extrairStatus(i), extrairAlertas(i));
    }

    /** Detalhe do produto: snapshot persistido + dados vivos do DNA (compras recentes). */
    @Transactional(readOnly = true)
    public DetalheProdutoResponse detalheProduto(UUID sugestaoId, UUID itemId) {
        SugestaoCompraItem item = itemRepo.findById(itemId)
                .filter(i -> i.getSugestao() != null && sugestaoId.equals(i.getSugestao().getId()))
                .orElseThrow(() -> new IllegalArgumentException("Item da sugestão não encontrado"));

        InteligenciaDnaService.ProdutoGrupoDnaDTO produto =
                intelDna.buscarProdutoPorCodigo(item.getDnaProdutoId());
        List<InteligenciaDnaService.CompraDnaDTO> compras =
                intelDna.buscarUltimasComprasProduto(item.getDnaProdutoId(), LocalDate.now().minusDays(365), 10);

        List<InteligenciaDtos.CompraResponse> comprasResponse = compras.stream()
                .map(c -> new InteligenciaDtos.CompraResponse(
                        c.codProduto(), c.quantidade(), c.vrUnitario(), c.valorTotal(),
                        c.valorLiquido(), c.desconto(), c.vrFrete(), c.dtEntrada(),
                        c.nrNota(), c.codFornecedor()))
                .toList();

        return new DetalheProdutoResponse(
                item.getDnaProdutoId(), toItemResponse(item), comprasResponse,
                produto != null ? produto.curvaAbc() : null,
                produto != null ? produto.suspenderCompra() : null,
                produto != null ? produto.margemLucro() : null,
                produto != null ? produto.precoPromocao() : null);
    }

    /** Extrai o status calculado (guardado em dados_calculo) para exposição na API. */
    public String extrairStatus(SugestaoCompraItem item) {
        return extrairCampoJson(item, "status");
    }

    @SuppressWarnings("unchecked")
    public List<String> extrairAlertas(SugestaoCompraItem item) {
        String json = item.getDadosCalculo();
        if (json == null || json.isBlank()) return List.of();
        try {
            JsonNode node = objectMapper.readTree(json).path("alertas");
            if (node.isArray()) {
                List<String> out = new ArrayList<>();
                node.forEach(n -> out.add(n.asText()));
                return out;
            }
        } catch (Exception e) {
            log.debug("[IntelCompra] Falha ao ler alertas do snapshot do item {}", item.getId());
        }
        return List.of();
    }

    private String extrairCampoJson(SugestaoCompraItem item, String campo) {
        String json = item.getDadosCalculo();
        if (json == null || json.isBlank()) return null;
        try {
            JsonNode node = objectMapper.readTree(json).path(campo);
            return node.isMissingNode() || node.isNull() ? null : node.asText();
        } catch (Exception e) {
            log.debug("[IntelCompra] Falha ao ler '{}' do snapshot do item {}", campo, item.getId());
            return null;
        }
    }

    // ------------------------------------------------------------------
    // utilidades numéricas — nunca produzem NaN/Infinity
    // ------------------------------------------------------------------
    private static BigDecimal nz(BigDecimal v) {
        return v == null ? ZERO : v;
    }

    private static int nzInt(Integer v) {
        return v == null ? 0 : v;
    }

    private static BigDecimal liquida(BigDecimal bruta, BigDecimal devolucao) {
        return bruta.subtract(devolucao).max(ZERO);
    }

    private static BigDecimal div(BigDecimal numerador, int dias) {
        if (dias <= 0) return ZERO;
        return numerador.divide(BigDecimal.valueOf(dias), 4, RoundingMode.HALF_UP);
    }

    private static String fmt(BigDecimal valor, int casas) {
        if (valor == null) return "-";
        return valor.setScale(casas, RoundingMode.HALF_UP).toPlainString();
    }

    private static Map<String, BigDecimal> mapaJanelas(BigDecimal d7, BigDecimal d14, BigDecimal d30,
            BigDecimal d60, BigDecimal d90) {
        Map<String, BigDecimal> m = new LinkedHashMap<>();
        m.put("d7", d7);
        m.put("d14", d14);
        m.put("d30", d30);
        m.put("d60", d60);
        m.put("d90", d90);
        return m;
    }

    private String paraJson(Object objeto) {
        try {
            return objectMapper.writeValueAsString(objeto);
        } catch (Exception e) {
            log.warn("[IntelCompra] Falha ao serializar dados_calculo: {}", e.getMessage());
            return null;
        }
    }
}
