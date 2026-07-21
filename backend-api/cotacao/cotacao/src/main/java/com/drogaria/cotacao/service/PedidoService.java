package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.ItemPedido;
import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.model.enums.StatusItemRecebimento;
import com.drogaria.cotacao.model.enums.StatusPedido;
import com.drogaria.cotacao.repository.ItemPedidoRepository;
import com.drogaria.cotacao.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;

    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }

    public Pedido buscarPorId(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));
    }

    public List<Pedido> buscarPorCotacao(Long cotacaoId) {
        return pedidoRepository.findByCotacaoId(cotacaoId);
    }

    @Transactional
    public Pedido salvarPedido(Pedido pedido) {
        // Garante que o status inicial seja Pendente de Entrega
        if (pedido.getStatus() == null) {
            pedido.setStatus(StatusPedido.PENDENTE_ENTREGA);
        }
        
        // Garante que a relação bidirecional seja salva corretamente
        if (pedido.getItens() != null) {
            pedido.getItens().forEach(item -> item.setPedido(pedido));
        }
        
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido processarRecebimento(Long pedidoId, List<ItemPedido> itensConferidos) {
        Pedido pedido = buscarPorId(pedidoId);
        
        boolean temFalta = false;
        boolean temIncompatibilidadeValor = false;
        boolean temDevolucao = false;
        double valorTotalReal = 0.0;

        for (ItemPedido itemConferido : itensConferidos) {
            ItemPedido itemBanco = itemPedidoRepository.findById(itemConferido.getId())
                    .orElseThrow(() -> new RuntimeException("Item do pedido não encontrado"));

            // Atualiza os dados da conferência cega
            itemBanco.setQuantidadeReal(itemConferido.getQuantidadeReal());
            itemBanco.setValorUnitarioReal(itemConferido.getValorUnitarioReal());
            itemBanco.setStatusRecebimento(itemConferido.getStatusRecebimento());
            itemBanco.setObservacaoDevolucao(itemConferido.getObservacaoDevolucao());

            // Cálculos para o status do pedido
            if (itemBanco.getQuantidadeReal() < itemBanco.getQuantidadePedida()) {
                temFalta = true;
            }
            
            if (!itemBanco.getValorUnitarioReal().equals(itemBanco.getValorUnitarioPedido())) {
                temIncompatibilidadeValor = true;
            }

            if (itemBanco.getStatusRecebimento() == StatusItemRecebimento.AVARIADO || 
                itemBanco.getStatusRecebimento() == StatusItemRecebimento.INCORRETO) {
                temDevolucao = true;
            }

            valorTotalReal += (itemBanco.getQuantidadeReal() * itemBanco.getValorUnitarioReal());
        }

        pedido.setValorTotalReal(valorTotalReal);

        // Define o status do pedido baseado nas regras de negócio
        if (temDevolucao) {
            pedido.setStatus(StatusPedido.PENDENTE_DEVOLUCAO);
        } else if (temIncompatibilidadeValor) {
            pedido.setStatus(StatusPedido.VALORES_INCOMPATIVEIS);
        } else if (temFalta) {
            pedido.setStatus(StatusPedido.ENTREGUE_COM_FALTA);
        } else {
            pedido.setStatus(StatusPedido.ENTREGUE_SUCESSO);
        }

        return pedidoRepository.save(pedido);
    }
    
    @Transactional
    public Pedido atualizarStatus(Long pedidoId, StatusPedido novoStatus) {
        Pedido pedido = buscarPorId(pedidoId);
        pedido.setStatus(novoStatus);
        return pedidoRepository.save(pedido);
    }
}