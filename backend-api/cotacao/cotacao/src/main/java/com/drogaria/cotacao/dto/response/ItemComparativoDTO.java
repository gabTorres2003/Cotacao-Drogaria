package com.drogaria.cotacao.dto.response;

import java.util.HashMap;
import java.util.Map;

public class ItemComparativoDTO {
    private String nomeProduto;
    private Integer quantidade;
    
    // Quem ganhou?
    private Double menorPrecoEncontrado;
    private String fornecedorVencedor;
    
    // Mapa com os preços de cada fornecedor para exibir na grade
    private Map<String, Double> precosPorFornecedor = new HashMap<>();

    // Getters e Setters
    public String getNomeProduto() { return nomeProduto; }
    public void setNomeProduto(String nomeProduto) { this.nomeProduto = nomeProduto; }
    
    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
    
    public Double getMenorPrecoEncontrado() { return menorPrecoEncontrado; }
    public void setMenorPrecoEncontrado(Double menorPrecoEncontrado) { this.menorPrecoEncontrado = menorPrecoEncontrado; }
    
    public String getFornecedorVencedor() { return fornecedorVencedor; }
    public void setFornecedorVencedor(String fornecedorVencedor) { this.fornecedorVencedor = fornecedorVencedor; }
    
    public Map<String, Double> getPrecosPorFornecedor() { return precosPorFornecedor; }
    public void setPrecosPorFornecedor(Map<String, Double> precosPorFornecedor) { this.precosPorFornecedor = precosPorFornecedor; }
}