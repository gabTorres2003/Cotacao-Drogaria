package com.drogaria.cotacao.dto.request;

import java.util.List;

public class CriarCotacaoRequestDTO {
    private String descricao;
    private String origem;
    private List<ItemCriarCotacaoDTO> itens;

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getOrigem() { return origem; }
    public void setOrigem(String origem) { this.origem = origem; }

    public List<ItemCriarCotacaoDTO> getItens() { return itens; }
    public void setItens(List<ItemCriarCotacaoDTO> itens) { this.itens = itens; }
}