package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.request.ImportacaoDNARequestDTO;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.repository.CotacaoRepository;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    public Cotacao criarCotacaoDNA(ImportacaoDNARequestDTO request) {
        
        List<ItemCotacao> itensFalta = integracaoDNAService.buscarFaltasDiretoDoBanco(request.getGrupos());
        Map<String, ItemCotacao> mapaItens = new HashMap<>();
        
        if (itensFalta != null) {
            for (ItemCotacao item : itensFalta) {
                mapaItens.put(item.getNomeProduto().toUpperCase().trim(), item);
            }
        }

        if (Boolean.TRUE.equals(request.getIncluirSugestao()) && request.getDataInicial() != null && request.getDataFinal() != null) {
            List<ItemCotacao> itensSugestao = integracaoDNAService.buscarSugestoes(
                    request.getGrupos(), 
                    request.getDataInicial(), 
                    request.getDataFinal(), 
                    request.getDiasSuprir() != null ? request.getDiasSuprir() : 1
            );
            
            if (itensSugestao != null) {
                for (ItemCotacao itemSugestao : itensSugestao) {
                    String chave = itemSugestao.getNomeProduto().toUpperCase().trim();
                    
                    if (mapaItens.containsKey(chave)) {
                        ItemCotacao itemExistente = mapaItens.get(chave);
                        // Adota a maior quantidade sugerida x falta manual
                        if (itemSugestao.getQuantidade() > itemExistente.getQuantidade()) {
                            itemExistente.setQuantidade(itemSugestao.getQuantidade());
                        }
                        itemExistente.setOrigemItem("Falta e Sugestão");
                    } else {
                        mapaItens.put(chave, itemSugestao);
                    }
                }
            }
        }

        List<ItemCotacao> itensFinais = new ArrayList<>(mapaItens.values());

        if (itensFinais.isEmpty()) {
            throw new RuntimeException("Nenhum produto encontrado nas Faltas ou Sugestões para os filtros selecionados.");
        }

        Cotacao novaCotacao = new Cotacao();
        String nomeGrupos = (request.getGrupos() != null && !request.getGrupos().isEmpty()) 
                            ? String.join(", ", request.getGrupos()) 
                            : "Geral";
        
        String tipoBusca = Boolean.TRUE.equals(request.getIncluirSugestao()) ? "(Falta+Sugestão) " : "(Faltas) ";
        novaCotacao.setDescricao("Cotação " + tipoBusca + nomeGrupos);
        novaCotacao.setStatus("ABERTA");
        novaCotacao.setDataCriacao(LocalDateTime.now());
        
        itensFinais.forEach(item -> item.setCotacao(novaCotacao));
        novaCotacao.setItens(itensFinais);
        
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