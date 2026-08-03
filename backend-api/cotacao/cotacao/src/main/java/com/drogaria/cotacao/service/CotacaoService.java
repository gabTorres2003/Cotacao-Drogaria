package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.request.ImportacaoDNARequestDTO;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.ItemCotacaoRepository;
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
    private ItemCotacaoRepository itemCotacaoRepository;

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
            
                if (!"FINALIZADA".equals(cotacao.getStatus()) && !"CANCELADA".equals(cotacao.getStatus())) {
                    if (pendentesNomes.isEmpty() && respondidosIds.size() > 0) {
                        cotacao.setStatus("RESPONDIDA");
                    } else if (!pendentesNomes.isEmpty() && respondidosIds.size() > 0) {
                        cotacao.setStatus("RESPONDIDA_PARCIALMENTE");
                    }
                }
            }
        }
        return cotacoes;
    }

    private List<ItemCotacao> obterItensDoDNA(ImportacaoDNARequestDTO request) {
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

        return new ArrayList<>(mapaItens.values());
    }

    @Transactional
    public Cotacao criarCotacaoDNA(ImportacaoDNARequestDTO request) {
        List<ItemCotacao> itensFinais = obterItensDoDNA(request);

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
        
        itensFinais.forEach(item -> {
            item.setCotacao(novaCotacao);
            item.setNomeOriginal(item.getNomeProduto());
        });
        novaCotacao.setItens(itensFinais);
        
        return cotacaoRepository.save(novaCotacao);
    }

    @Transactional
    public Cotacao atualizarCotacaoDNA(Long cotacaoId, ImportacaoDNARequestDTO request) {
        Cotacao cotacao = cotacaoRepository.findById(cotacaoId)
                .orElseThrow(() -> new RuntimeException("Cotação não encontrada"));

        List<ItemCotacao> itensDoDna = obterItensDoDNA(request);
        Map<String, ItemCotacao> itensExistentes = cotacao.getItens().stream()
                .collect(Collectors.toMap(
                        i -> (i.getNomeOriginal() != null ? i.getNomeOriginal() : i.getNomeProduto()).toUpperCase().trim(),
                        i -> i,
                        (existente, substituto) -> existente
                ));

        boolean houveAlteracao = false;

        for (ItemCotacao itemDna : itensDoDna) {
            String chave = itemDna.getNomeProduto().toUpperCase().trim();
            
            if (itensExistentes.containsKey(chave)) {
                ItemCotacao existente = itensExistentes.get(chave);
                
                // Se o usuário excluiu manualmente, ignora a importação
                if (Boolean.TRUE.equals(existente.getExcluido())) continue;
                
                // Se o usuário editou nome/quantidade, não sobrescreve os dados
                if (Boolean.TRUE.equals(existente.getEditadoManual())) continue;

                if (itemDna.getQuantidade() > existente.getQuantidade()) {
                    existente.setQuantidade(itemDna.getQuantidade());
                    houveAlteracao = true;
                }
            } else {
                itemDna.setCotacao(cotacao);
                itemDna.setOrigemItem("Nova Importação");
                itemDna.setNomeOriginal(itemDna.getNomeProduto());
                cotacao.getItens().add(itemDna);
                houveAlteracao = true;
            }
        }

        if (houveAlteracao) {
            return cotacaoRepository.save(cotacao);
        }
        
        return cotacao;
    }

    @Transactional
    public ItemCotacao adicionarItemManual(Long cotacaoId, ItemCotacao novoItem) {
        Cotacao cotacao = cotacaoRepository.findById(cotacaoId)
                .orElseThrow(() -> new RuntimeException("Cotação não encontrada"));

        novoItem.setCotacao(cotacao);
        novoItem.setNomeOriginal(novoItem.getNomeProduto());
        novoItem.setEditadoManual(true);
        novoItem.setExcluido(false);
        
        if (novoItem.getOrigemItem() == null || novoItem.getOrigemItem().isEmpty()) {
            novoItem.setOrigemItem("Extra Manual");
        }
        
        return itemCotacaoRepository.save(novoItem);
    }

    @Transactional
    public ItemCotacao atualizarItemManual(Long idItem, String novoNome, Integer novaQtd) {
        ItemCotacao item = itemCotacaoRepository.findById(idItem)
            .orElseThrow(() -> new RuntimeException("Item não encontrado"));
        
        if (item.getNomeOriginal() == null) {
            item.setNomeOriginal(item.getNomeProduto());
        }

        item.setNomeProduto(novoNome);
        item.setQuantidade(novaQtd);
        item.setEditadoManual(true);
        return itemCotacaoRepository.save(item);
    }

    @Transactional
    public void removerItemManual(Long idItem) {
        ItemCotacao item = itemCotacaoRepository.findById(idItem)
            .orElseThrow(() -> new RuntimeException("Item não encontrado"));
        
        item.setExcluido(true); 
        itemCotacaoRepository.save(item);
    }

    @Transactional
    public void deletarCotacao(Long id) {
        if (!cotacaoRepository.existsById(id)) {
            throw new RuntimeException("Cotação não encontrada!");
        }

        entityManager.createNativeQuery("UPDATE tb_pedidos SET cotacao_id = NULL WHERE cotacao_id = :id")
                     .setParameter("id", id)
                     .executeUpdate();

        entityManager.createNativeQuery("UPDATE tb_itens_pedido SET item_cotacao_id = NULL WHERE item_cotacao_id IN (SELECT id FROM tb_itens_cotacao WHERE cotacao_id = :id)")
                     .setParameter("id", id)
                     .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM tb_sugestoes_promocao WHERE cotacao_id = :id")
                     .setParameter("id", id)
                     .executeUpdate();

        cotacaoRepository.deleteById(id);
    }
}