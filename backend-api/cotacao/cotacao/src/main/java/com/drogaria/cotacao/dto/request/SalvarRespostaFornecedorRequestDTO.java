package com.drogaria.cotacao.dto.request;

import java.util.List;

public class SalvarRespostaFornecedorRequestDTO {

    private Long cotacaoId;
    private Long fornecedorId;
    private List<SalvarPrecoDTO> itens;
    private List<SugestaoPromocaoDTO> sugestoes;

    // Getters e Setters
    public Long getCotacaoId() { return cotacaoId; }
    public void setCotacaoId(Long cotacaoId) { this.cotacaoId = cotacaoId; }

    public Long getFornecedorId() { return fornecedorId; }
    public void setFornecedorId(Long fornecedorId) { this.fornecedorId = fornecedorId; }

    public List<SalvarPrecoDTO> getItens() { return itens; }
    public void setItens(List<SalvarPrecoDTO> itens) { this.itens = itens; }

    public List<SugestaoPromocaoDTO> getSugestoes() { return sugestoes; }
    public void setSugestoes(List<SugestaoPromocaoDTO> sugestoes) { this.sugestoes = sugestoes; }
}