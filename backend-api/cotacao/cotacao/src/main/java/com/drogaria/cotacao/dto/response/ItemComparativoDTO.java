package com.drogaria.cotacao.dto.response;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class ItemComparativoDTO {

    private Long idItem;
    private String nomeProduto;
    private Integer quantidade;
    
    private Double estoque;
    private String grupo;
    private Double vendidoNoMes;
    private String ultCompraData;
    private Double ultCompraQtde;
    private String ultVendaData;
    private Double vendidoAposUltCompra;
    private Double ultimoPreco;
    private String origemItem;

    private Boolean editadoManual;
    private Boolean excluido;
    private Boolean devolvidoPorAlteracaoPreco;
    private Long pedidoOrigemId;

    private LocalDateTime dataCriacao;

    private Double menorPrecoEncontrado;
    private String fornecedorVencedor;
    private Double ultimoPrecoComprado;
    private String dataUltimaCompra;

    private Map<String, Double> precosPorFornecedor = new HashMap<>();
    private Map<String, String> observacoesPorFornecedor = new HashMap<>();
    
    private Map<String, String> substitutosPorFornecedor = new HashMap<>();
    private Map<String, Double> precosSubstitutosPorFornecedor = new HashMap<>();
    private Map<String, Integer> qtdsSubstitutosPorFornecedor = new HashMap<>();

    private Map<String, Integer> qtdCondicaoPorFornecedor = new HashMap<>();
    private Map<String, Double> precoCondicaoPorFornecedor = new HashMap<>();
    private Map<String, Integer> qtdCondicaoSubstPorFornecedor = new HashMap<>();
    private Map<String, Double> precoCondicaoSubstPorFornecedor = new HashMap<>();

    private Map<String, String> condicoesEscalonamentoPorFornecedor = new HashMap<>();
    private Map<String, String> condicoesEscalonamentoSubstPorFornecedor = new HashMap<>();

    private LocalDateTime ultimaRespostaFornecedorData;
    private Map<String, LocalDateTime> ultimaRespostaPorFornecedor = new HashMap<>();

    private Map<String, Long> fornecedoresIdPorNome = new HashMap<>();

    public Long getIdItem() { return idItem; }
    public void setIdItem(Long idItem) { this.idItem = idItem; }

    public String getNomeProduto() { return nomeProduto; }
    public void setNomeProduto(String nomeProduto) { this.nomeProduto = nomeProduto; }

    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }

    public Double getEstoque() { return estoque; }
    public void setEstoque(Double estoque) { this.estoque = estoque; }

    public String getGrupo() { return grupo; }
    public void setGrupo(String grupo) { this.grupo = grupo; }

    public Double getVendidoNoMes() { return vendidoNoMes; }
    public void setVendidoNoMes(Double vendidoNoMes) { this.vendidoNoMes = vendidoNoMes; }

    public String getUltCompraData() { return ultCompraData; }
    public void setUltCompraData(String ultCompraData) { this.ultCompraData = ultCompraData; }

    public Double getUltCompraQtde() { return ultCompraQtde; }
    public void setUltCompraQtde(Double ultCompraQtde) { this.ultCompraQtde = ultCompraQtde; }

    public String getUltVendaData() { return ultVendaData; }
    public void setUltVendaData(String ultVendaData) { this.ultVendaData = ultVendaData; }

    public Double getVendidoAposUltCompra() { return vendidoAposUltCompra; }
    public void setVendidoAposUltCompra(Double vendidoAposUltCompra) { this.vendidoAposUltCompra = vendidoAposUltCompra; }

    public Double getUltimoPreco() { return ultimoPreco; }
    public void setUltimoPreco(Double ultimoPreco) { this.ultimoPreco = ultimoPreco; }

    public String getOrigemItem() { return origemItem; }
    public void setOrigemItem(String origemItem) { this.origemItem = origemItem; }

    public Boolean getEditadoManual() { return editadoManual; }
    public void setEditadoManual(Boolean editadoManual) { this.editadoManual = editadoManual; }

    public Boolean getExcluido() { return excluido; }
    public void setExcluido(Boolean excluido) { this.excluido = excluido; }

    public Boolean getDevolvidoPorAlteracaoPreco() { return devolvidoPorAlteracaoPreco; }
    public void setDevolvidoPorAlteracaoPreco(Boolean devolvidoPorAlteracaoPreco) { this.devolvidoPorAlteracaoPreco = devolvidoPorAlteracaoPreco; }

    public Long getPedidoOrigemId() { return pedidoOrigemId; }
    public void setPedidoOrigemId(Long pedidoOrigemId) { this.pedidoOrigemId = pedidoOrigemId; }

    public LocalDateTime getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }

    public Double getMenorPrecoEncontrado() { return menorPrecoEncontrado; }
    public void setMenorPrecoEncontrado(Double menorPrecoEncontrado) { this.menorPrecoEncontrado = menorPrecoEncontrado; }

    public String getFornecedorVencedor() { return fornecedorVencedor; }
    public void setFornecedorVencedor(String fornecedorVencedor) { this.fornecedorVencedor = fornecedorVencedor; }

    public Double getUltimoPrecoComprado() { return ultimoPrecoComprado; }
    public void setUltimoPrecoComprado(Double ultimoPrecoComprado) { this.ultimoPrecoComprado = ultimoPrecoComprado; }

    public String getDataUltimaCompra() { return dataUltimaCompra; }
    public void setDataUltimaCompra(String dataUltimaCompra) { this.dataUltimaCompra = dataUltimaCompra; }

    public Map<String, Double> getPrecosPorFornecedor() { return precosPorFornecedor; }
    public void setPrecosPorFornecedor(Map<String, Double> precosPorFornecedor) { this.precosPorFornecedor = precosPorFornecedor; }

    public Map<String, String> getObservacoesPorFornecedor() { return observacoesPorFornecedor; }
    public void setObservacoesPorFornecedor(Map<String, String> observacoesPorFornecedor) { this.observacoesPorFornecedor = observacoesPorFornecedor; }

    public Map<String, String> getSubstitutosPorFornecedor() { return substitutosPorFornecedor; }
    public void setSubstitutosPorFornecedor(Map<String, String> substitutosPorFornecedor) { this.substitutosPorFornecedor = substitutosPorFornecedor; }

    public Map<String, Double> getPrecosSubstitutosPorFornecedor() { return precosSubstitutosPorFornecedor; }
    public void setPrecosSubstitutosPorFornecedor(Map<String, Double> precosSubstitutosPorFornecedor) { this.precosSubstitutosPorFornecedor = precosSubstitutosPorFornecedor; }

    public Map<String, Integer> getQtdsSubstitutosPorFornecedor() { return qtdsSubstitutosPorFornecedor; }
    public void setQtdsSubstitutosPorFornecedor(Map<String, Integer> qtdsSubstitutosPorFornecedor) { this.qtdsSubstitutosPorFornecedor = qtdsSubstitutosPorFornecedor; }

    public Map<String, Integer> getQtdCondicaoPorFornecedor() { return qtdCondicaoPorFornecedor; }
    public void setQtdCondicaoPorFornecedor(Map<String, Integer> qtdCondicaoPorFornecedor) { this.qtdCondicaoPorFornecedor = qtdCondicaoPorFornecedor; }

    public Map<String, Double> getPrecoCondicaoPorFornecedor() { return precoCondicaoPorFornecedor; }
    public void setPrecoCondicaoPorFornecedor(Map<String, Double> precoCondicaoPorFornecedor) { this.precoCondicaoPorFornecedor = precoCondicaoPorFornecedor; }

    public Map<String, Integer> getQtdCondicaoSubstPorFornecedor() { return qtdCondicaoSubstPorFornecedor; }
    public void setQtdCondicaoSubstPorFornecedor(Map<String, Integer> qtdCondicaoSubstPorFornecedor) { this.qtdCondicaoSubstPorFornecedor = qtdCondicaoSubstPorFornecedor; }

    public Map<String, Double> getPrecoCondicaoSubstPorFornecedor() { return precoCondicaoSubstPorFornecedor; }
    public void setPrecoCondicaoSubstPorFornecedor(Map<String, Double> precoCondicaoSubstPorFornecedor) { this.precoCondicaoSubstPorFornecedor = precoCondicaoSubstPorFornecedor; }

    public Map<String, String> getCondicoesEscalonamentoPorFornecedor() { return condicoesEscalonamentoPorFornecedor; }
    public void setCondicoesEscalonamentoPorFornecedor(Map<String, String> condicoesEscalonamentoPorFornecedor) { this.condicoesEscalonamentoPorFornecedor = condicoesEscalonamentoPorFornecedor; }

    public Map<String, String> getCondicoesEscalonamentoSubstPorFornecedor() { return condicoesEscalonamentoSubstPorFornecedor; }
    public void setCondicoesEscalonamentoSubstPorFornecedor(Map<String, String> condicoesEscalonamentoSubstPorFornecedor) { this.condicoesEscalonamentoSubstPorFornecedor = condicoesEscalonamentoSubstPorFornecedor; }

    public LocalDateTime getUltimaRespostaFornecedorData() { return ultimaRespostaFornecedorData; }
    public void setUltimaRespostaFornecedorData(LocalDateTime ultimaRespostaFornecedorData) { this.ultimaRespostaFornecedorData = ultimaRespostaFornecedorData; }

    public Map<String, LocalDateTime> getUltimaRespostaPorFornecedor() { return ultimaRespostaPorFornecedor; }
    public void setUltimaRespostaPorFornecedor(Map<String, LocalDateTime> ultimaRespostaPorFornecedor) { this.ultimaRespostaPorFornecedor = ultimaRespostaPorFornecedor; }

    public Map<String, Long> getFornecedoresIdPorNome() { return fornecedoresIdPorNome; }
    public void setFornecedoresIdPorNome(Map<String, Long> fornecedoresIdPorNome) { this.fornecedoresIdPorNome = fornecedoresIdPorNome; }
}