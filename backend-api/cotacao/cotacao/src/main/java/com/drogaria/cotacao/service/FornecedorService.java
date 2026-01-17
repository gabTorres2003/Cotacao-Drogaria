package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.request.SalvarPrecoDTO;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.model.PrecoCotacao;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.repository.ItemCotacaoRepository;
import com.drogaria.cotacao.repository.PrecoCotacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FornecedorService {

    @Autowired
    private PrecoCotacaoRepository precoRepository;

    @Autowired
    private ItemCotacaoRepository itemRepository;

    @Autowired
    private FornecedorRepository fornecedorRepository;

    // Método para cadastrar um fornecedor (teste)
    public Fornecedor criarFornecedor(String nome, String email) {
        Fornecedor f = new Fornecedor();
        f.setNome(nome);
        f.setEmail(email);
        return fornecedorRepository.save(f);
    }

    // Salvar os preços enviados
    public void salvarRespostasFornecedor(List<SalvarPrecoDTO> precosRecebidos) {
        for (SalvarPrecoDTO dto : precosRecebidos) {
            ItemCotacao item = itemRepository.findById(dto.getIdItem()).orElse(null);
            Fornecedor fornecedor = fornecedorRepository.findById(dto.getIdFornecedor()).orElse(null);

            // Verifica se os dados existem e se o preço não veio vazio
            if (item != null && fornecedor != null && dto.getPreco() != null && !dto.getPreco().isEmpty()) {
                
                PrecoCotacao novoPreco = new PrecoCotacao();
                novoPreco.setItem(item);
                novoPreco.setFornecedor(fornecedor);
                try {
                    // 1. Remove "R$" e espaços
                    String precoLimpo = dto.getPreco().replace("R$", "").replace(" ", "");
                    
                    // 2. Troca vírgula por ponto
                    precoLimpo = precoLimpo.replace(",", ".");
                    
                    // 3. Converte para Double
                    double valorFinal = Double.parseDouble(precoLimpo);
                    novoPreco.setPrecoOfertado(valorFinal);
                    precoRepository.save(novoPreco);
                } catch (NumberFormatException e) {
                    System.out.println("Erro ao ler preço: " + dto.getPreco());
                }
            }
        }
    }
}