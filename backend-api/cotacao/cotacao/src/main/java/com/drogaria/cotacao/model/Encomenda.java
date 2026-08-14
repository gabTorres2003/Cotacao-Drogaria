package com.drogaria.cotacao.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "encomendas")
public class Encomenda {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    private String cliente;
    private String telefone;
    private String produto;
    
    @Column(name = "data_encomenda")
    private LocalDate dataEncomenda;
    
    private String status;
    private String fornecedor;
    private String vendedor;
    private String quantidade;
    private String pagamento;
    private Boolean comprado;
    
    @Column(name = "data_compra")
    private LocalDate dataCompra;
    
    private Boolean entregue;
    
    @Column(name = "codigo_produto")
    private String codigoProduto;
    
    @Column(name = "data_prevista")
    private LocalDate dataPrevista;
    
    @Column(name = "fornecedor_sugerido")
    private String fornecedorSugerido;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Getters e Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public String getProduto() { return produto; }
    public void setProduto(String produto) { this.produto = produto; }

    public LocalDate getDataEncomenda() { return dataEncomenda; }
    public void setDataEncomenda(LocalDate dataEncomenda) { this.dataEncomenda = dataEncomenda; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFornecedor() { return fornecedor; }
    public void setFornecedor(String fornecedor) { this.fornecedor = fornecedor; }

    public String getVendedor() { return vendedor; }
    public void setVendedor(String vendedor) { this.vendedor = vendedor; }

    public String getQuantidade() { return quantidade; }
    public void setQuantidade(String quantidade) { this.quantidade = quantidade; }

    public String getPagamento() { return pagamento; }
    public void setPagamento(String pagamento) { this.pagamento = pagamento; }

    public Boolean getComprado() { return comprado; }
    public void setComprado(Boolean comprado) { this.comprado = comprado; }

    public LocalDate getDataCompra() { return dataCompra; }
    public void setDataCompra(LocalDate dataCompra) { this.dataCompra = dataCompra; }

    public Boolean getEntregue() { return entregue; }
    public void setEntregue(Boolean entregue) { this.entregue = entregue; }

    public String getCodigoProduto() { return codigoProduto; }
    public void setCodigoProduto(String codigoProduto) { this.codigoProduto = codigoProduto; }

    public LocalDate getDataPrevista() { return dataPrevista; }
    public void setDataPrevista(LocalDate dataPrevista) { this.dataPrevista = dataPrevista; }

    public String getFornecedorSugerido() { return fornecedorSugerido; }
    public void setFornecedorSugerido(String fornecedorSugerido) { this.fornecedorSugerido = fornecedorSugerido; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}