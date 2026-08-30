package com.drogaria.cotacao.dto.request;

import java.util.List;

public class ConfirmarFracaoDTO {

    private List<ItemFracaoDTO> itens;

    public List<ItemFracaoDTO> getItens() { return itens; }
    public void setItens(List<ItemFracaoDTO> itens) { this.itens = itens; }

    public static class ItemFracaoDTO {
        private Long idPreco;
        private Double novoPreco;

        public Long getIdPreco() { return idPreco; }
        public void setIdPreco(Long idPreco) { this.idPreco = idPreco; }
        public Double getNovoPreco() { return novoPreco; }
        public void setNovoPreco(Double novoPreco) { this.novoPreco = novoPreco; }
    }
}
