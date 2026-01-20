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

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FornecedorService {

    @Autowired
    private PrecoCotacaoRepository precoRepository;

    @Autowired
    private ItemCotacaoRepository itemRepository;

    @Autowired
    private FornecedorRepository fornecedorRepository;

    public Fornecedor criarFornecedor(String nome, String email, String telefone) {
        Fornecedor f = new Fornecedor();
        f.setNome(nome);
        f.setEmail(email);
        f.setTelefone(telefone);
        return fornecedorRepository.save(f);
    }

    public void salvarRespostasFornecedor(List<SalvarPrecoDTO> precosRecebidos) {
        for (SalvarPrecoDTO dto : precosRecebidos) {
            ItemCotacao item = itemRepository.findById(dto.getIdItem()).orElse(null);
            Fornecedor fornecedor = fornecedorRepository.findById(dto.getIdFornecedor()).orElse(null);

            if (item != null && fornecedor != null && dto.getPreco() != null) {

                PrecoCotacao novoPreco = new PrecoCotacao();
                novoPreco.setItem(item);
                novoPreco.setFornecedor(fornecedor);
                
                novoPreco.setPrecoOfertado(dto.getPreco());
                novoPreco.setDataResposta(LocalDateTime.now());
                
                precoRepository.save(novoPreco);
            }
        }
    }

    public Fornecedor buscarPorId(Long id) {
        return fornecedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));
    }
}