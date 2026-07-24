package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.repository.CotacaoRepository;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CotacaoService {

    @Autowired
    private CotacaoRepository cotacaoRepository;

    @Autowired
    private IntegracaoDNAService integracaoDNAService;

    @Autowired
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<Cotacao> listarTodas() {
        List<Cotacao> cotacoes = cotacaoRepository.findAll();

        for (Cotacao cotacao : cotacoes) {
            if (cotacao.getCotacaoFornecedores() != null && !cotacao.getCotacaoFornecedores().isEmpty()) {
                
                List<String> pendentesNomes = cotacao.getCotacaoFornecedores().stream()
                        .filter(cf -> !"RESPONDIDA".equals(cf.getStatus()))
                        .map(cf -> cf.getFornecedor().getNome())
                        .collect(Collectors.toList());
                cotacao.setFornecedoresPendentes(pendentesNomes);

                List<Long> vinculadosIds = cotacao.getCotacaoFornecedores().stream()
                        .map(cf -> cf.getFornecedor().getId())
                        .collect(Collectors.toList());
                cotacao.setFornecedoresVinculadosIds(vinculadosIds);

                List<Long> respondidosIds = cotacao.getCotacaoFornecedores().stream()
                        .filter(cf -> "RESPONDIDA".equals(cf.getStatus()))
                        .map(cf -> cf.getFornecedor().getId())
                        .collect(Collectors.toList());
                cotacao.setFornecedoresRespondidosIds(respondidosIds);
            
                if (pendentesNomes.isEmpty() && !"FINALIZADA".equals(cotacao.getStatus())) {
                    cotacao.setStatus("FINALIZADA");
                }
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

        entityManager.createNativeQuery("DELETE FROM tb_sugestoes_promocao WHERE cotacao_id = :id")
                     .setParameter("id", id)
                     .executeUpdate();

        cotacaoRepository.deleteById(id);
    }
}