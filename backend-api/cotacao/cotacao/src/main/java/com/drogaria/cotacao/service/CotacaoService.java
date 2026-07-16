package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.repository.CotacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CotacaoService {

    @Autowired
    private CotacaoRepository cotacaoRepository;

    @Autowired
    private IntegracaoDNAService integracaoDNAService;

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
}