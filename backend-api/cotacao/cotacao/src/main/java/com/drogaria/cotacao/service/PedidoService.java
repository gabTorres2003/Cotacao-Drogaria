package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.request.GerarPedidoRequestDTO;
import com.drogaria.cotacao.dto.request.ItemGerarPedidoDTO;
import com.drogaria.cotacao.dto.request.ItemRecebidoDTO;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.model.ItemPedido;
import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.model.enums.StatusItemRecebimento;
import com.drogaria.cotacao.model.enums.StatusPedido;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.repository.ItemCotacaoRepository;
import com.drogaria.cotacao.repository.ItemPedidoRepository;
import com.drogaria.cotacao.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final CotacaoRepository cotacaoRepository;
    private final FornecedorRepository fornecedorRepository;
    private final ItemCotacaoRepository itemCotacaoRepository;

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
        if (pedido.getStatus() == null) {
            pedido.setStatus(StatusPedido.PENDENTE_ENTREGA);
        }
        if (pedido.getItens() != null) {
            pedido.getItens().forEach(item -> item.setPedido(pedido));
        }
        
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido processarRecebimento(Long pedidoId, List<ItemRecebidoDTO> itensConferidos) {
        Pedido pedido = buscarPorId(pedidoId);
        
        boolean temDivergenciaQuantidade = false;
        boolean temIncompatibilidadeValor = false;
        boolean temDevolucao = false;
        double valorTotalReal = 0.0;

        for (ItemRecebidoDTO itemConferido : itensConferidos) {
            ItemPedido itemBanco = itemPedidoRepository.findById(itemConferido.getId())
                    .orElseThrow(() -> new RuntimeException("Item do pedido não encontrado"));
            
            itemBanco.setQuantidadeReal(itemConferido.getQuantidadeReal());
            itemBanco.setValorUnitarioReal(itemConferido.getValorUnitarioReal());
            
            StatusItemRecebimento statusItem = itemConferido.getStatusRecebimento();

            if (!itemBanco.getQuantidadeReal().equals(itemBanco.getQuantidadePedida())) {
                temDivergenciaQuantidade = true;
                statusItem = StatusItemRecebimento.INCORRETO; 
            }
            
            if (!itemBanco.getValorUnitarioReal().equals(itemBanco.getValorUnitarioPedido())) {
                temIncompatibilidadeValor = true;
            }

            itemBanco.setStatusRecebimento(statusItem); 
            itemBanco.setObservacaoDevolucao(itemConferido.getObservacaoDevolucao());

            if (statusItem == StatusItemRecebimento.AVARIADO || 
                statusItem == StatusItemRecebimento.INCORRETO) {
                temDevolucao = true;
            }

            valorTotalReal += (itemBanco.getQuantidadeReal() * itemBanco.getValorUnitarioReal());
        }

        pedido.setValorTotalReal(valorTotalReal);

        // MÁQUINA DE STATUS DO PEDIDO
        if (temDevolucao || temDivergenciaQuantidade) {
            // Notei no seu print que ID #15 tem um badge "Divergência". 
            // Suponho que StatusPedido.DIVERGENCIA exista. Se for outro nome, mude abaixo:
            pedido.setStatus(StatusPedido.DIVERGENCIA);
        } else if (temIncompatibilidadeValor) {
            pedido.setStatus(StatusPedido.VALORES_INCOMPATIVEIS);
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

    @Transactional
    public Pedido gerarPedidoEmLote(GerarPedidoRequestDTO dto) {
        Cotacao cotacao = cotacaoRepository.findById(dto.getCotacaoId())
                .orElseThrow(() -> new RuntimeException("Cotação não encontrada"));

        Fornecedor fornecedor = fornecedorRepository.findByNome(dto.getFornecedorNome())
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado: " + dto.getFornecedorNome()));

        Pedido pedido = new Pedido();
        pedido.setCotacao(cotacao);
        pedido.setFornecedor(fornecedor);
        pedido.setStatus(StatusPedido.PENDENTE_ENTREGA);
        pedido.setDataCriacao(LocalDateTime.now());

        double valorTotal = 0.0;
        List<ItemPedido> itens = new ArrayList<>();

        for (ItemGerarPedidoDTO itemDto : dto.getItens()) {
            ItemPedido itemPedido = new ItemPedido();
            itemPedido.setPedido(pedido);

            if (itemDto.getItemCotacaoId() != null) {
                ItemCotacao itemCotacao = itemCotacaoRepository.findById(itemDto.getItemCotacaoId())
                        .orElseThrow(() -> new RuntimeException("Item da cotação não encontrado: " + itemDto.getItemCotacaoId()));
                
                itemPedido.setItemCotacao(itemCotacao);
                itemPedido.setNomeProduto(itemDto.getNomeProduto() != null ? itemDto.getNomeProduto() : itemCotacao.getNomeProduto());
            } else {
                itemPedido.setItemCotacao(null);
                itemPedido.setNomeProduto(itemDto.getNomeProduto());
                
                if (itemPedido.getNomeProduto() == null || itemPedido.getNomeProduto().isEmpty()) {
                    throw new RuntimeException("Itens extras precisam obrigatoriamente ter um nome_produto definido no DTO.");
                }
            }

            itemPedido.setQuantidadePedida(itemDto.getQuantidadePedida());
            itemPedido.setValorUnitarioPedido(itemDto.getValorUnitarioPedido());
            itemPedido.setQuantidadeReal(0);
            itemPedido.setValorUnitarioReal(0.0);

            valorTotal += (itemDto.getQuantidadePedida() * itemDto.getValorUnitarioPedido());
            itens.add(itemPedido);
        }

        pedido.setValorTotalPedido(valorTotal);
        pedido.setItens(itens);

        return pedidoRepository.save(pedido);
    }

    @Transactional
    public void deletarPedido(Long id) {
        Pedido pedido = buscarPorId(id);
        pedidoRepository.delete(pedido);
    }
}