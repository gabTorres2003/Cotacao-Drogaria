package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.CotacaoFornecedor;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.CotacaoFornecedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CotacaoService {

    @Autowired
    private CotacaoRepository cotacaoRepository;

    @Autowired
    private CotacaoFornecedorRepository cotacaoFornecedorRepository;

    @Autowired
    private IntegracaoDNAService integracaoDNAService;

    public List<Cotacao> listarTodas() {
        List<Cotacao> cotacoes = cotacaoRepository.findAll();

        for (Cotacao cotacao : cotacoes) {
            List<CotacaoFornecedor> vinculos = cotacaoFornecedorRepository.findByCotacaoId(cotacao.getId());
            
            if (vinculos != null) {
                List<String> pendentes = vinculos.stream()
                        .filter(v -> !"RESPONDIDA".equals(v.getStatus()))
                        .map(v -> v.getFornecedor().getNome())
                        .collect(Collectors.toList());
                
                cotacao.setFornecedoresPendentes(pendentes);
            }
        }
        return cotacoes;
    }

    @Transactional
    public Cotacao criarCotacaoDNA(List<String> grupos) {
        List<ItemCotacao> itens = integracaoDNAService.buscarFaltasDiretoDoBanco(grupos);

        if (itens == null || itens.isEmpty()) {
            throw new RuntimeException("Nenhuma falta encontrada no sistema PDV para os grupos selecionados.");
        }

        Cotacao novaCotacao = new Cotacao();

        String nomeGrupos = (grupos != null && !grupos.isEmpty()) 
                            ? String.join(", ", grupos) 
                            : "Geral";
        
        novaCotacao.setDescricao("Cotação de " + nomeGrupos);
        novaCotacao.setStatus("ABERTA");
        novaCotacao.setDataCriacao(LocalDateTime.now());
        
        itens.forEach(item -> item.setCotacao(novaCotacao));
        novaCotacao.setItens(itens);
        
        return cotacaoRepository.save(novaCotacao);
    }

    @Transactional
    public void deletarCotacao(Long id) {
        if (!cotacaoRepository.existsById(id)) {
            throw new RuntimeException("Cotação não encontrada!");
        }
        cotacaoRepository.deleteById(id);
    }
}