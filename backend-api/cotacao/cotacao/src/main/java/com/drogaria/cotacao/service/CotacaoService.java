package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.request.ImportacaoDNARequestDTO;
import com.drogaria.cotacao.dto.request.ListaInteligenciaRequestDTO;
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
        boolean modoMesclado = Boolean.TRUE.equals(request.getIncluirSugestao())
                && request.getDataInicial() != null && request.getDataFinal() != null;

        List<ItemCotacao> itensFalta = integracaoDNAService.buscarFaltasDiretoDoBanco(request.getGrupos());
        Map<String, ItemCotacao> mapaItens = new HashMap<>();
        
        if (itensFalta != null) {
            for (ItemCotacao item : itensFalta) {
                if (modoMesclado) {
                    item.setQuantidadeBalcao(item.getQuantidade());
                }
                mapaItens.put(item.getNomeProduto().toUpperCase().trim(), item);
            }
        }

        if (modoMesclado) {
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
                        itemExistente.setQuantidadeSugerida(itemSugestao.getQuantidade());
                        if (itemExistente.getVmd() == null) {
                            itemExistente.setVmd(itemSugestao.getVmd());
                        }
                        if (itemExistente.getVendas30d() == null) {
                            itemExistente.setVendas30d(itemSugestao.getVendas30d());
                        }
                        if (itemExistente.getVendas60d() == null) {
                            itemExistente.setVendas60d(itemSugestao.getVendas60d());
                        }
                        if (itemExistente.getVendas90d() == null) {
                            itemExistente.setVendas90d(itemSugestao.getVendas90d());
                        }
                        if (itemSugestao.getQuantidade() > itemExistente.getQuantidade()) {
                            itemExistente.setQuantidade(itemSugestao.getQuantidade());
                        }
                        itemExistente.setOrigemItem("Falta e Sugestão");
                    } else {
                        itemSugestao.setQuantidadeSugerida(itemSugestao.getQuantidade());
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
        novaCotacao.setNomeUsuario(request.getNomeUsuario());
        
        // CORREÇÃO: Lendo o setor do DTO e salvando no banco
        novaCotacao.setSetor(request.getSetor() != null ? request.getSetor() : "AMBOS");
        
        itensFinais.forEach(item -> {
            item.setCotacao(novaCotacao);
            item.setNomeOriginal(item.getNomeProduto());
        });
        novaCotacao.setItens(itensFinais);
        
        return cotacaoRepository.save(novaCotacao);
    }

    /**
     * Gera nova cotação a partir da lista de compra da Inteligência (consulta ao vivo
     * no DNA com parâmetros de cobertura de estoque), opcionalmente mesclada com as
     * Faltas do DNA dos mesmos grupos.
     */
    @Transactional
    public Cotacao criarCotacaoInteligencia(ListaInteligenciaRequestDTO request) {
        if (request.getGrupos() == null || request.getGrupos().isEmpty()) {
            throw new RuntimeException("Selecione pelo menos um grupo.");
        }
        int diasMinimo = request.getDiasEstoqueMinimo() != null ? request.getDiasEstoqueMinimo() : 7;
        int diasMaximo = request.getDiasEstoqueMaximo() != null ? request.getDiasEstoqueMaximo() : 30;
        int diasMedia = request.getDiasMediaVendas() != null ? request.getDiasMediaVendas() : 90;
        if (diasMinimo < 1) throw new RuntimeException("Dias de estoque mínimo inválidos (mínimo 1).");
        if (diasMaximo < 1) throw new RuntimeException("Dias de estoque máximo inválidos (mínimo 1).");
        if (diasMaximo < diasMinimo) throw new RuntimeException("Dias de estoque máximo deve ser maior ou igual ao mínimo.");
        if (diasMedia < 1) throw new RuntimeException("Dias de referência da média de vendas inválidos (mínimo 1).");

        List<ItemCotacao> itensInteligencia =
                integracaoDNAService.buscarItensInteligencia(request.getGrupos(), diasMinimo, diasMaximo, diasMedia);

        Map<String, ItemCotacao> mapaItens = new HashMap<>();
        for (ItemCotacao item : itensInteligencia) {
            mapaItens.put(item.getNomeProduto().toUpperCase().trim(), item);
        }

        if (Boolean.TRUE.equals(request.getIncluirFaltas())) {
            for (ItemCotacao item : mapaItens.values()) {
                item.setQuantidadeSugerida(item.getQuantidade());
            }
            List<ItemCotacao> itensFalta = integracaoDNAService.buscarFaltasDiretoDoBanco(request.getGrupos());
            if (itensFalta != null) {
                for (ItemCotacao itemFalta : itensFalta) {
                    itemFalta.setQuantidadeBalcao(itemFalta.getQuantidade());
                    String chave = itemFalta.getNomeProduto().toUpperCase().trim();
                    ItemCotacao existente = mapaItens.get(chave);
                    if (existente != null) {
                        existente.setQuantidadeBalcao(itemFalta.getQuantidade());
                        if (itemFalta.getQuantidade() > existente.getQuantidade()) {
                            existente.setQuantidade(itemFalta.getQuantidade());
                        }
                        existente.setOrigemItem("Falta e Inteligência");
                    } else {
                        mapaItens.put(chave, itemFalta);
                    }
                }
            }
        }

        List<ItemCotacao> itensFinais = new ArrayList<>(mapaItens.values());
        if (itensFinais.isEmpty()) {
            throw new RuntimeException("Nenhum produto encontrado na Inteligência ou Faltas para os filtros selecionados.");
        }

        Cotacao novaCotacao = new Cotacao();
        String nomeGrupos = String.join(", ", request.getGrupos());
        boolean comFaltas = Boolean.TRUE.equals(request.getIncluirFaltas());
        String tipoBusca = comFaltas ? "(Inteligência+Faltas) " : "(Inteligência) ";
        novaCotacao.setDescricao("Cotação " + tipoBusca + nomeGrupos);
        novaCotacao.setStatus("ABERTA");
        novaCotacao.setDataCriacao(LocalDateTime.now());
        novaCotacao.setNomeUsuario(request.getNomeUsuario());
        novaCotacao.setSetor(request.getSetor() != null ? request.getSetor() : "AMBOS");

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
                
                if (Boolean.TRUE.equals(existente.getExcluido())) continue;
                
                if (Boolean.TRUE.equals(existente.getEditadoManual())) continue;

                if (itemDna.getVmd() != null && !itemDna.getVmd().equals(existente.getVmd())) {
                    existente.setVmd(itemDna.getVmd());
                    houveAlteracao = true;
                }
                if (itemDna.getVendas30d() != null && !itemDna.getVendas30d().equals(existente.getVendas30d())) {
                    existente.setVendas30d(itemDna.getVendas30d());
                    houveAlteracao = true;
                }
                if (itemDna.getVendas60d() != null && !itemDna.getVendas60d().equals(existente.getVendas60d())) {
                    existente.setVendas60d(itemDna.getVendas60d());
                    houveAlteracao = true;
                }
                if (itemDna.getVendas90d() != null && !itemDna.getVendas90d().equals(existente.getVendas90d())) {
                    existente.setVendas90d(itemDna.getVendas90d());
                    houveAlteracao = true;
                }
                if (itemDna.getQuantidadeBalcao() != null && !itemDna.getQuantidadeBalcao().equals(existente.getQuantidadeBalcao())) {
                    existente.setQuantidadeBalcao(itemDna.getQuantidadeBalcao());
                    houveAlteracao = true;
                }
                if (itemDna.getQuantidadeSugerida() != null && !itemDna.getQuantidadeSugerida().equals(existente.getQuantidadeSugerida())) {
                    existente.setQuantidadeSugerida(itemDna.getQuantidadeSugerida());
                    houveAlteracao = true;
                }

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
    public void restaurarItem(Long idItem, Boolean excluido) {
        ItemCotacao item = itemCotacaoRepository.findById(idItem)
            .orElseThrow(() -> new RuntimeException("Item não encontrado"));
        item.setExcluido(excluido);
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

    @Transactional
    public int deletarCotacoesEmMassa(List<Long> ids) {
        int excluidas = 0;
        for (Long id : ids) {
            if (!cotacaoRepository.existsById(id)) {
                continue;
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
            excluidas++;
        }
        return excluidas;
    }
}