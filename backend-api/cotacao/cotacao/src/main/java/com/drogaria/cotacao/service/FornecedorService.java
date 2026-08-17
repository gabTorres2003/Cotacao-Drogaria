package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.model.PrecoCotacao;
import com.drogaria.cotacao.dto.request.SalvarPrecoDTO;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.ItemCotacaoRepository;
import com.drogaria.cotacao.repository.PrecoCotacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FornecedorService {

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private CotacaoRepository cotacaoRepository;

    @Autowired
    private ItemCotacaoRepository itemRepository;

    @Autowired
    private PrecoCotacaoRepository precoRepository;

    public Fornecedor criarFornecedor(String nome, String email, String telefone) {
        Fornecedor f = new Fornecedor();
        f.setNome(nome);
        f.setEmail(email);
        f.setTelefone(telefone);
        return fornecedorRepository.save(f);
    }

    public List<Fornecedor> listarTodos() {
        return fornecedorRepository.findAll();
    }

    public Fornecedor buscarPorId(Long id) {
        return fornecedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));
    }

    public void deletarFornecedor(Long id) {
        fornecedorRepository.deleteById(id);
    }
    
    public void salvarRespostasFornecedor(List<SalvarPrecoDTO> precosRecebidos) {
        for (SalvarPrecoDTO dto : precosRecebidos) {
            ItemCotacao item = itemRepository.findById(dto.getIdItem()).orElse(null);
            Fornecedor fornecedor = fornecedorRepository.findById(dto.getIdFornecedor()).orElse(null);

            if (item != null && fornecedor != null && dto.getPreco() != null) {
                
                // Verifica se o fornecedor já tem preço cadastrado para este item para fazer UPDATE
                PrecoCotacao precoAtual = precoRepository.findByItemIn(List.of(item))
                        .stream()
                        .filter(p -> p.getFornecedor() != null && p.getFornecedor().getId().equals(fornecedor.getId()))
                        .findFirst()
                        .orElse(new PrecoCotacao());

                precoAtual.setItem(item);
                precoAtual.setFornecedor(fornecedor);
                precoAtual.setPrecoOfertado(dto.getPreco());
                precoAtual.setDataResposta(LocalDateTime.now());
                precoAtual.setQuantidadeDisponivel(dto.getQuantidadeDisponivel());
                precoAtual.setObservacao(dto.getObservacao());

                precoAtual.setProdutoSubstituto(dto.getProdutoSubstituto());
                precoAtual.setPrecoSubstituto(dto.getPrecoSubstituto());
                precoAtual.setQuantidadeSubstituto(dto.getQuantidadeSubstituto());

                precoAtual.setQuantidadeCondicao(dto.getQuantidadeCondicao());
                precoAtual.setPrecoCondicao(dto.getPrecoCondicao());
                precoAtual.setQuantidadeCondicaoSubstituto(dto.getQuantidadeCondicaoSubstituto());
                precoAtual.setPrecoCondicaoSubstituto(dto.getPrecoCondicaoSubstituto());

                precoRepository.save(precoAtual);
            }
        }
    }

    public List<SalvarPrecoDTO> buscarRespostas(Long idCotacao, Long idFornecedor) {
        Cotacao cotacao = cotacaoRepository.findById(idCotacao).orElse(null);
        if (cotacao == null) return new ArrayList<>();

        List<ItemCotacao> itens = itemRepository.findByCotacao(cotacao);
        if (itens.isEmpty()) return new ArrayList<>();

        List<PrecoCotacao> precos = precoRepository.findByItemIn(itens);

        return precos.stream()
                .filter(p -> p.getFornecedor() != null && p.getFornecedor().getId().equals(idFornecedor))
                .map(p -> {
                    SalvarPrecoDTO dto = new SalvarPrecoDTO();
                    dto.setIdItem(p.getItem().getId());
                    dto.setIdFornecedor(p.getFornecedor().getId());
                    dto.setPreco(p.getPrecoOfertado());
                    dto.setQuantidadeDisponivel(p.getQuantidadeDisponivel());
                    dto.setObservacao(p.getObservacao());
                    
                    dto.setProdutoSubstituto(p.getProdutoSubstituto());
                    dto.setPrecoSubstituto(p.getPrecoSubstituto());
                    dto.setQuantidadeSubstituto(p.getQuantidadeSubstituto());
                    dto.setQuantidadeCondicao(p.getQuantidadeCondicao());
                    dto.setPrecoCondicao(p.getPrecoCondicao());
                    dto.setQuantidadeCondicaoSubstituto(p.getQuantidadeCondicaoSubstituto());
                    dto.setPrecoCondicaoSubstituto(p.getPrecoCondicaoSubstituto());

                    return dto;
                }).collect(Collectors.toList());
    }
}