package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.Devolucao;
import com.drogaria.cotacao.repository.DevolucaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DevolucaoService {

    private final DevolucaoRepository devolucaoRepository;

    public List<Devolucao> listarTodas() {
        return devolucaoRepository.findAll();
    }

    public Devolucao buscarPorId(Long id) {
        return devolucaoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Devolução não encontrada"));
    }

    public List<Devolucao> buscarPorPedido(Long pedidoId) {
        return devolucaoRepository.findByPedidoId(pedidoId);
    }

    @Transactional
    public Devolucao salvar(Devolucao devolucao) {
        if (devolucao.getItens() != null) {
            devolucao.getItens().forEach(item -> item.setDevolucao(devolucao));
            
            // Calcula o valor total automaticamente
            double total = devolucao.getItens().stream()
                    .mapToDouble(i -> (i.getQuantidade() != null ? i.getQuantidade() : 0) * 
                                      (i.getValorUnitario() != null ? i.getValorUnitario() : 0.0))
                    .sum();
            devolucao.setValorTotal(total);
        }

        return devolucaoRepository.save(devolucao);
    }

    @Transactional
    public Devolucao atualizarItem(Long idDevolucao, Long idItem, String novoNome, Integer novaQtd, Double novoValor) {
        Devolucao devolucao = buscarPorId(idDevolucao);
        boolean itemEncontrado = false;
        
        if (devolucao.getItens() != null) {
            for (var item : devolucao.getItens()) {
                if (item.getId() != null && item.getId().equals(idItem)) {
                    item.setNomeProduto(novoNome);
                    item.setQuantidade(novaQtd);
                    item.setValorUnitario(novoValor);
                    itemEncontrado = true;
                    break;
                }
            }
        }
        
        if (!itemEncontrado) {
            throw new RuntimeException("Item não encontrado na devolução.");
        }
        
        return salvar(devolucao); 
    }

    @Transactional
    public void deletar(Long id) {
        devolucaoRepository.deleteById(id);
    }
}