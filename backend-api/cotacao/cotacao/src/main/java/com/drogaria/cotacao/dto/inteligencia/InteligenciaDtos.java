package com.drogaria.cotacao.dto.inteligencia;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTOs da API de Inteligência de Compras (records Java).
 * Contrato frontend <-> backend deste módulo.
 */
public final class InteligenciaDtos {

    private InteligenciaDtos() {}

    public record GerarSugestaoRequest(Integer dnaGrupoId) {}

    public record ConfigGrupoRequest(
            Integer dnaGrupoId,
            String dnaGrupoNome,
            Integer intervaloCompraDias,
            Integer diasSeguranca,
            Integer janelaDemandaDias,
            Integer coberturaMaximaDias,
            Boolean ativo) {}

    public record ConfigFornecedorRequest(
            Long fornecedorId,
            Integer dnaFornecedorId,
            String fornecedorNome,
            Integer leadTimeManualDias,
            BigDecimal pedidoMinimoValor,
            String observacao,
            Boolean ativo) {}

    public record DecisaoRequest(
            String decisao,
            BigDecimal quantidadeDecidida,
            String motivo,
            Long usuarioId) {}

    public record GerarCotacaoRequest(String nomeUsuario, String setor) {}

    public record ParametrosResponse(
            String id, String nome,
            BigDecimal pesoDemanda30, BigDecimal pesoDemanda60, BigDecimal pesoDemanda90,
            Integer diasHistoricoMinimo, BigDecimal margemMinimaPromocao,
            BigDecimal toleranciaExcessoPercentual, Boolean ativo) {}

    public record FornecedorSistemaResponse(Long id, String nome, String empresa, Boolean ativo) {}

    public record GrupoResponse(Integer codigo, String nome, Boolean configurado, Boolean ativo) {}

    public record ConfigGrupoResponse(
            String id, Integer dnaGrupoId, String dnaGrupoNome, Integer intervaloCompraDias,
            Integer diasSeguranca, Integer janelaDemandaDias, Integer coberturaMaximaDias, Boolean ativo) {}

    public record ConfigFornecedorResponse(
            String id, Long fornecedorId, Integer dnaFornecedorId, String fornecedorNome,
            Integer leadTimeManualDias, BigDecimal pedidoMinimoValor, String observacao, Boolean ativo) {}

    public record SugestaoResumoResponse(
            UUID id, Integer dnaGrupoId, String dnaGrupoNome, OffsetDateTime geradaEm,
            LocalDate periodoInicio, LocalDate periodoFim, String status, String observacao,
            Integer totalItens, Integer pendentes, Integer aprovados, Integer recusados) {}

    public record SugestaoDetalheResponse(SugestaoResumoResponse sugestao, List<SugestaoItemResponse> itens) {}

    public record SugestaoItemResponse(
            UUID id, UUID sugestaoId, Integer dnaProdutoId, String ean, String produtoNome,
            BigDecimal estoqueAtual, BigDecimal precoVenda, BigDecimal custoAtual, BigDecimal custoMedio,
            LocalDate dataUltimaCompra, BigDecimal quantidadeUltimaCompra, LocalDate dataUltimaVenda,
            BigDecimal vendas7d, BigDecimal vendas14d, BigDecimal vendas30d, BigDecimal vendas60d, BigDecimal vendas90d,
            BigDecimal vmd7d, BigDecimal vmd14d, BigDecimal vmd30d, BigDecimal vmd60d, BigDecimal vmd90d,
            BigDecimal demandaDiariaPrevista, BigDecimal indiceTendencia,
            Integer cicloCompraDias, Integer leadTimeDias, Integer diasSeguranca,
            BigDecimal coberturaAtualDias, BigDecimal estoqueAlvo,
            BigDecimal quantidadeSugerida, BigDecimal quantidadeAprovada,
            String decisao, String justificativaMotor, String justificativaUsuario,
            String status, List<String> alertas) {}

    public record DetalheProdutoResponse(
            Integer dnaProdutoId,
            SugestaoItemResponse snapshot,
            List<CompraResponse> ultimasCompras,
            String curvaAbc, String suspenderCompra,
            BigDecimal margemLucro, BigDecimal precoPromocao) {}

    public record CompraResponse(
            Integer codProduto, BigDecimal quantidade, BigDecimal vrUnitario, BigDecimal valorTotal,
            BigDecimal valorLiquido, BigDecimal desconto, BigDecimal vrFrete,
            LocalDate dtEntrada, String nrNota, Integer codFornecedor) {}
}
