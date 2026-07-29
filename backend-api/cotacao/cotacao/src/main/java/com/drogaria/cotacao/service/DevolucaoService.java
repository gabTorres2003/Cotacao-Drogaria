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
    public void deletar(Long id) {
        devolucaoRepository.deleteById(id);
    }
}