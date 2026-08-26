package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.request.GerarPedidoRequestDTO;
import com.drogaria.cotacao.dto.request.ItemGerarPedidoDTO;
import com.drogaria.cotacao.dto.request.ItemRecebidoDTO;
import com.drogaria.cotacao.dto.request.ReceberPedidoRequestDTO;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.model.ItemPedido;
import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.model.PrecoCotacao;
import com.drogaria.cotacao.model.SugestaoPedido;
import com.drogaria.cotacao.model.enums.StatusItemRecebimento;
import com.drogaria.cotacao.model.enums.StatusPedido;
import com.drogaria.cotacao.repository.CotacaoFornecedorRepository;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.repository.ItemCotacaoRepository;
import com.drogaria.cotacao.repository.ItemPedidoRepository;
import com.drogaria.cotacao.repository.PedidoRepository;
import com.drogaria.cotacao.repository.EncomendaRepository;
import com.drogaria.cotacao.repository.PrecoCotacaoRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final CotacaoRepository cotacaoRepository;
    private final FornecedorRepository fornecedorRepository;
    private final ItemCotacaoRepository itemCotacaoRepository;
    private final EncomendaRepository encomendaRepository;
    private final CotacaoFornecedorRepository cotacaoFornecedorRepository;
    private final PrecoCotacaoRepository precoRepository;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

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
    public Pedido processarRecebimento(Long pedidoId, ReceberPedidoRequestDTO dto) {
        Pedido pedido = buscarPorId(pedidoId);

        if (dto.getNumeroNota() == null || dto.getNumeroNota().trim().isEmpty()) {
            throw new RuntimeException("O número da NF é obrigatório para registrar o recebimento.");
        }

        String novaNota = dto.getNumeroNota().trim();
        if (pedido.getNumeroNota() == null || pedido.getNumeroNota().trim().isEmpty()) {
            pedido.setNumeroNota(novaNota);
        } else if (!pedido.getNumeroNota().contains(novaNota)) {
            pedido.setNumeroNota(pedido.getNumeroNota() + " / " + novaNota);
        }

        boolean temDivergenciaQuantidade = false;
        boolean temIncompatibilidadeValor = false;
        boolean temDevolucao = false;
        boolean temItemPendente = false;
        double valorTotalReal = 0.0;

        for (ItemRecebidoDTO itemConferido : dto.getItens()) {
            ItemPedido itemBanco = itemPedidoRepository.findById(itemConferido.getId())
                    .orElseThrow(() -> new RuntimeException("Item do pedido não encontrado"));

            Integer jaRecebido = itemBanco.getQuantidadeReal() != null ? itemBanco.getQuantidadeReal() : 0;
            Integer incremento = itemConferido.getQuantidadeRecebidaAgora() != null
                    ? itemConferido.getQuantidadeRecebidaAgora()
                    : itemConferido.getQuantidadeReal();
            if (incremento == null) incremento = 0;

            int novaQuantidadeReal = jaRecebido + incremento;
            itemBanco.setQuantidadeReal(novaQuantidadeReal);
            itemBanco.setValorUnitarioReal(itemConferido.getValorUnitarioReal());

            StatusItemRecebimento statusItem = itemConferido.getStatusRecebimento();

            if (itemBanco.getQuantidadeReal() < itemBanco.getQuantidadePedida()) {
                temDivergenciaQuantidade = true;
                temItemPendente = true;
                if (statusItem == null || statusItem == StatusItemRecebimento.OK) {
                    statusItem = StatusItemRecebimento.FALTANTE;
                }
            }

            if (itemBanco.getValorUnitarioReal() != null
                    && itemBanco.getValorUnitarioPedido() != null
                    && !itemBanco.getValorUnitarioReal().equals(itemBanco.getValorUnitarioPedido())) {
                temIncompatibilidadeValor = true;
            }

            itemBanco.setStatusRecebimento(statusItem);
            itemBanco.setObservacaoDevolucao(itemConferido.getObservacaoDevolucao());

            if (statusItem == StatusItemRecebimento.AVARIADO ||
                statusItem == StatusItemRecebimento.INCORRETO) {
                temDevolucao = true;
            }

            if (itemBanco.getQuantidadeReal() != null && itemBanco.getValorUnitarioReal() != null) {
                valorTotalReal += (itemBanco.getQuantidadeReal() * itemBanco.getValorUnitarioReal());
            }
        }

        pedido.setValorTotalReal(valorTotalReal);

        if (temDevolucao) {
            pedido.setStatus(StatusPedido.DIVERGENCIA);
        } else if (temItemPendente) {
            pedido.setStatus(StatusPedido.ENTREGA_PARCIAL);
        } else if (temIncompatibilidadeValor) {
            pedido.setStatus(StatusPedido.VALORES_INCOMPATIVEIS);
        } else {
            pedido.setStatus(StatusPedido.ENTREGUE_SUCESSO);
        }

        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido refazerConferencia(Long pedidoId) {
        Pedido pedido = buscarPorId(pedidoId);

        if (pedido.getStatus() == StatusPedido.PENDENTE_ENTREGA || pedido.getStatus() == StatusPedido.CONFIRMADO_FORNECEDOR) {
            throw new RuntimeException("Este pedido ainda não foi conferido.");
        }

        pedido.setStatus(StatusPedido.CONFIRMADO_FORNECEDOR);
        pedido.setValorTotalReal(null);
        pedido.setNumeroNota(null);

        for (ItemPedido item : pedido.getItens()) {
            item.setQuantidadeReal(null);
            item.setValorUnitarioReal(null);
            item.setStatusRecebimento(null);
            item.setObservacaoDevolucao(null);
        }

        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido reabrirConferencia(Long pedidoId) {
        Pedido pedido = buscarPorId(pedidoId);

        if (pedido.getStatus() == StatusPedido.PENDENTE_ENTREGA
                || pedido.getStatus() == StatusPedido.CONFIRMADO_FORNECEDOR) {
            throw new RuntimeException("A conferência deste pedido ainda não foi iniciada.");
        }
        if (pedido.getStatus() == StatusPedido.CANCELADO) {
            throw new RuntimeException("Não é possível reabrir a conferência de um pedido cancelado.");
        }

        pedido.setStatus(StatusPedido.CONFIRMADO_FORNECEDOR);
        return pedidoRepository.save(pedido);
    }
    
    @Transactional
    public Pedido atualizarStatus(Long pedidoId, StatusPedido novoStatus) {
        Pedido pedido = buscarPorId(pedidoId);
        pedido.setStatus(novoStatus);
        
        if (novoStatus == StatusPedido.CONFIRMADO_FORNECEDOR) {
            pedido.setDataConfirmacao(LocalDateTime.now());
        }
        
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido cancelarConfirmacao(Long pedidoId) {
        Pedido pedido = buscarPorId(pedidoId);
        
        if (pedido.getStatus() != StatusPedido.CONFIRMADO_FORNECEDOR) {
            throw new RuntimeException("Apenas pedidos já confirmados pelo fornecedor podem ser cancelados/reabertos.");
        }
        
        pedido.setStatus(StatusPedido.PENDENTE_ENTREGA);
        pedido.setDataConfirmacao(null); 
        
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido gerarPedidoEmLote(GerarPedidoRequestDTO dto) {
        Cotacao cotacao = null;
        if (dto.getCotacaoId() != null) {
            cotacao = cotacaoRepository.findById(dto.getCotacaoId())
                    .orElseThrow(() -> new RuntimeException("Cotação não encontrada"));
        }

        Fornecedor fornecedor;
        if (dto.getFornecedorId() != null) {
            final Long idForn = dto.getFornecedorId();
            fornecedor = fornecedorRepository.findById(idForn)
                    .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado: ID " + idForn));
        } else {
            throw new RuntimeException("O identificador do fornecedor (fornecedorId) é obrigatório para gerar o pedido. Não é possível identificar o fornecedor apenas pelo nome.");
        }

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

                if (itemCotacao.getEncomendaId() != null) {
                    encomendaRepository.findById(itemCotacao.getEncomendaId()).ifPresent(encomenda -> {
                        encomenda.setComprado(true);
                        encomenda.setDataCompra(java.time.LocalDate.now());
                        String nomeFornecedorAnotado = fornecedor.getEmpresa() != null ? fornecedor.getEmpresa() : fornecedor.getNome();
                        encomenda.setFornecedor(nomeFornecedorAnotado);
                        encomendaRepository.save(encomenda);
                    });
                }

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
            itemPedido.setValorAlteradoAposPedido(false);
            itemPedido.setCondicaoAplicada(itemDto.getCondicaoAplicada() != null ? itemDto.getCondicaoAplicada() : false);
            itemPedido.setQtdCondicao(itemDto.getQtdCondicao());
            itemPedido.setPrecoCondicao(itemDto.getPrecoCondicao());

            valorTotal += (itemDto.getQuantidadePedida() * itemDto.getValorUnitarioPedido());
            itens.add(itemPedido);
        }

        pedido.setValorTotalPedido(valorTotal);
        pedido.setItens(itens);

        return pedidoRepository.save(pedido);
    }

    @Transactional
    public List<Pedido> gerarPedidosManuais(List<GerarPedidoRequestDTO> dtos) {
        List<Pedido> pedidosGerados = new ArrayList<>();
        Long idCotacao = null;

        for (GerarPedidoRequestDTO dto : dtos) {
            Pedido pedido = gerarPedidoEmLote(dto);
            pedido.setStatus(StatusPedido.CONFIRMADO_FORNECEDOR);
            pedido.setDataConfirmacao(LocalDateTime.now());
            pedidoRepository.save(pedido);

            pedidosGerados.add(pedido);
            if (dto.getCotacaoId() != null) {
                idCotacao = dto.getCotacaoId();
            }
        }

        if (idCotacao != null) {
            Cotacao cotacao = cotacaoRepository.findById(idCotacao)
                    .orElseThrow(() -> new RuntimeException("Cotação não encontrada"));

            List<ItemCotacao> todosItens = itemCotacaoRepository.findByCotacao(cotacao);
            List<Pedido> pedidosDaCotacao = pedidoRepository.findByCotacaoId(idCotacao);

            long itensCompradosCount = pedidosDaCotacao.stream()
                    .flatMap(p -> p.getItens().stream())
                    .filter(ip -> ip.getItemCotacao() != null)
                    .map(ip -> ip.getItemCotacao().getId())
                    .distinct()
                    .count();

            if (itensCompradosCount >= todosItens.size()) {
                cotacao.setStatus("FINALIZADA");
            } else {
                cotacao.setStatus("RESPONDIDA_PARCIALMENTE");
            }

            cotacaoRepository.save(cotacao);
        }

        return pedidosGerados;
    }

    @Transactional
    public void deletarPedido(Long id) {
        try {
            Pedido pedido = buscarPorId(id);
            pedidoRepository.delete(pedido);
            pedidoRepository.flush(); 
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Alerta de Segurança: Não é possível excluir este pedido, pois existe uma devolução vinculada a ele no histórico.");
        }
    }

    public List<Pedido> buscarPorFornecedorId(Long fornecedorId) {
        return pedidoRepository.findByFornecedorId(fornecedorId);
    }

    @Transactional
    public Pedido adicionarItemManual(Long pedidoId, ItemPedido novoItem) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));
        
        if (pedido.getStatus() != StatusPedido.PENDENTE_ENTREGA) {
            throw new RuntimeException("Não é possível adicionar itens a um pedido que já foi processado pelo fornecedor ou entregue.");
        }

        if (novoItem.getItemCotacao() != null && novoItem.getItemCotacao().getId() != null) {
            ItemCotacao ic = itemCotacaoRepository.findById(novoItem.getItemCotacao().getId())
                    .orElseThrow(() -> new RuntimeException("Item da cotação não encontrado"));
            novoItem.setItemCotacao(ic);

            Cotacao cotacaoDoItem = ic.getCotacao();
            Long idFornecedorPedido = pedido.getFornecedor() != null ? pedido.getFornecedor().getId() : null;

            if (cotacaoDoItem != null && idFornecedorPedido != null) {
                boolean temResposta = precoRepository.existsByFornecedorIdAndItemId(idFornecedorPedido, ic.getId());
                boolean temVinculo = !cotacaoFornecedorRepository
                        .findByCotacaoIdAndFornecedorId(cotacaoDoItem.getId(), idFornecedorPedido).isEmpty();

                if (!temResposta && !temVinculo) {
                    throw new RuntimeException("Vínculo inválido: o fornecedor deste pedido não respondeu nem foi notificado nesta cotação. Não é possível associar o produto apenas pelo nome do fornecedor.");
                }

                String setorPedido = pedido.getCotacao() != null ? pedido.getCotacao().getSetor() : null;
                String setorItem = cotacaoDoItem.getSetor();
                if (!setoresCompativeis(setorPedido, setorItem)) {
                    throw new RuntimeException("Categoria incompatível: este produto (cotação " + setorItem + ") não pode ser incluído em um pedido da categoria " + setorPedido + ".");
                }
            }
        }

        novoItem.setPedido(pedido);
        novoItem.setValorAlteradoAposPedido(false);
        
        pedido.getItens().add(novoItem);

        double total = pedido.getItens().stream()
                .mapToDouble(i -> (i.getQuantidadePedida() != null ? i.getQuantidadePedida() : 0) * 
                                  (i.getValorUnitarioPedido() != null ? i.getValorUnitarioPedido() : 0.0))
                .sum();
                
        pedido.setValorTotalPedido(total);
        return pedidoRepository.save(pedido);
    }

    private boolean setoresCompativeis(String setorPedido, String setorItem) {
        if (setorPedido == null || setorPedido.isBlank()) return true;
        if (setorItem == null || setorItem.isBlank()) return true;
        if ("AMBOS".equalsIgnoreCase(setorPedido.trim())) return true;
        return setorPedido.trim().equalsIgnoreCase(setorItem.trim());
    }

    @Transactional
    public void removerItem(Long idItem) {
        ItemPedido item = itemPedidoRepository.findById(idItem)
                .orElseThrow(() -> new RuntimeException("Item do pedido não encontrado"));
        
        Pedido pedido = item.getPedido();
        
        double valorSubtrair = item.getQuantidadePedida() * item.getValorUnitarioPedido();
        pedido.setValorTotalPedido(pedido.getValorTotalPedido() - valorSubtrair);
        item.setItemCotacao(null);
        itemPedidoRepository.saveAndFlush(item);
        
        itemPedidoRepository.delete(item);
        pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido trocarItem(Long pedidoId, Long idItemPedidoAntigo, ItemPedido novoItem) {
        removerItem(idItemPedidoAntigo);
        return adicionarItemManual(pedidoId, novoItem);
    }

    @Transactional
    public Pedido atualizarValoresPrevistos(Long pedidoId, List<Map<String, Object>> payload) {
        Pedido pedido = buscarPorId(pedidoId);
        
        if (pedido.getStatus() != StatusPedido.PENDENTE_ENTREGA && pedido.getStatus() != StatusPedido.CONFIRMADO_FORNECEDOR) {
            throw new RuntimeException("Só é possível editar valores de pedidos que estão aguardando entrega.");
        }

        double novoTotal = 0.0;

        for (Map<String, Object> dados : payload) {
            Long idItem = Long.valueOf(dados.get("idItemPedido").toString());
            Integer novaQtd = Integer.valueOf(dados.get("quantidadePedida").toString());
            Double novoValor = Double.valueOf(dados.get("valorUnitarioPedido").toString());

            ItemPedido item = itemPedidoRepository.findById(idItem)
                    .orElseThrow(() -> new RuntimeException("Item não encontrado"));

            if (!item.getPedido().getId().equals(pedidoId)) continue;

            boolean alterouValor = !item.getValorUnitarioPedido().equals(novoValor) || !item.getQuantidadePedida().equals(novaQtd);

            item.setQuantidadePedida(novaQtd);
            item.setValorUnitarioPedido(novoValor);

            if (alterouValor) {
                item.setValorAlteradoAposPedido(true);
            }

            if (item.getItemCotacao() != null && pedido.getFornecedor() != null) {
                try {
                    String jpql = "SELECT pc FROM PrecoCotacao pc WHERE pc.item.id = :itemId AND pc.fornecedor.id = :fornId";
                    List<PrecoCotacao> precos = entityManager.createQuery(jpql, PrecoCotacao.class)
                            .setParameter("itemId", item.getItemCotacao().getId())
                            .setParameter("fornId", pedido.getFornecedor().getId())
                            .getResultList();

                    if (!precos.isEmpty()) {
                        PrecoCotacao pc = precos.get(0);
                        boolean isSubstituto = false;
                        
                        if (pc.getProdutoSubstituto() != null && !pc.getProdutoSubstituto().trim().isEmpty()) {
                            String nomePedido = item.getNomeProduto() != null ? item.getNomeProduto().toLowerCase().trim() : "";
                            String nomeSubstituto = pc.getProdutoSubstituto().toLowerCase().trim();
                            
                            if (nomePedido.contains(nomeSubstituto) || nomeSubstituto.contains(nomePedido)) {
                                isSubstituto = true;
                            }
                        }

                        if (isSubstituto) {
                            pc.setPrecoSubstituto(novoValor);
                            pc.setQuantidadeSubstituto(novaQtd);
                        } else {
                            pc.setPrecoOfertado(novoValor);
                            pc.setQuantidadeDisponivel(novaQtd);
                        }
                        
                        entityManager.merge(pc);
                    }
                } catch (Exception e) {
                    System.err.println("Aviso: Falha ao sincronizar valor com a cotação: " + e.getMessage());
                }
            }

            novoTotal += (novaQtd * novoValor);
        }

        pedido.setValorTotalPedido(novoTotal);
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido atualizarValorMinimo(Long pedidoId, Double valorMinimo) {
        Pedido pedido = buscarPorId(pedidoId);
        pedido.setValorMinimoFaturamento(valorMinimo);
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public SugestaoPedido adicionarSugestao(Long pedidoId, SugestaoPedido sugestao) {
        Pedido pedido = buscarPorId(pedidoId);
        sugestao.setPedido(pedido);
        if(sugestao.getDataSugestao() == null) {
            sugestao.setDataSugestao(LocalDateTime.now());
        }
        pedido.getSugestoes().add(sugestao);
        pedidoRepository.save(pedido);
        return pedido.getSugestoes().get(pedido.getSugestoes().size() - 1);
    }

    @Transactional
    public void removerSugestao(Long pedidoId, Long sugestaoId) {
        Pedido pedido = buscarPorId(pedidoId);
        pedido.getSugestoes().removeIf(s -> s.getId().equals(sugestaoId));
        pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido aceitarSugestao(Long pedidoId, Long sugestaoId) {
        Pedido pedido = buscarPorId(pedidoId);
        SugestaoPedido sugestao = pedido.getSugestoes().stream()
            .filter(s -> s.getId().equals(sugestaoId))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Sugestão não encontrada"));

        ItemPedido novoItem = new ItemPedido();
        novoItem.setPedido(pedido);
        novoItem.setNomeProduto(sugestao.getNomeProduto() + " (Sugestão Aceita)");
        novoItem.setQuantidadePedida(sugestao.getQuantidade());
        novoItem.setValorUnitarioPedido(sugestao.getPrecoUnitario());
        novoItem.setQuantidadeReal(0);
        novoItem.setValorUnitarioReal(0.0);
        novoItem.setValorAlteradoAposPedido(false);

        boolean temCondicao = sugestao.getQuantidadeCondicao() != null && sugestao.getPrecoCondicao() != null;
        boolean atingiu = temCondicao && sugestao.getQuantidade() >= sugestao.getQuantidadeCondicao();
        
        novoItem.setCondicaoAplicada(atingiu);
        novoItem.setQtdCondicao(sugestao.getQuantidadeCondicao());
        novoItem.setPrecoCondicao(sugestao.getPrecoCondicao());

        pedido.getItens().add(novoItem);
        
        double subtotal = sugestao.getQuantidade() * sugestao.getPrecoUnitario();
        pedido.setValorTotalPedido((pedido.getValorTotalPedido() != null ? pedido.getValorTotalPedido() : 0.0) + subtotal);

        pedido.getSugestoes().remove(sugestao);

        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido registrarFalhaEntrega(Long pedidoId, String motivo, String acaoDestino, Long cotacaoDestinoId) {
        Pedido pedido = buscarPorId(pedidoId);
        pedido.setStatus(StatusPedido.CANCELADO);
        pedido.setMotivoCancelamento(motivo);

        if ("ORIGINAL".equals(acaoDestino) || acaoDestino == null) {
            for (ItemPedido ip : pedido.getItens()) {
                if (ip.getItemCotacao() != null) {
                    ItemCotacao ic = ip.getItemCotacao();
                    ic.setMotivoRetorno(motivo);
                    itemCotacaoRepository.save(ic);
                }
            }
        } else {
            Cotacao cotacaoDestino = null;
            if ("NOVA".equals(acaoDestino)) {
                cotacaoDestino = new Cotacao();
                cotacaoDestino.setDescricao("Recompra - Falha Pedido #" + pedidoId);
                cotacaoDestino.setStatus("ABERTA");
                cotacaoDestino.setDataCriacao(LocalDateTime.now());
                cotacaoDestino = cotacaoRepository.save(cotacaoDestino);
            } else if ("EXISTENTE".equals(acaoDestino) && cotacaoDestinoId != null) {
                cotacaoDestino = cotacaoRepository.findById(cotacaoDestinoId)
                    .orElseThrow(() -> new RuntimeException("Cotação destino não encontrada"));
            }

            if (cotacaoDestino != null) {
                for (ItemPedido ip : pedido.getItens()) {
                    ItemCotacao novoItem = new ItemCotacao();
                    novoItem.setCotacao(cotacaoDestino);
                    novoItem.setNomeProduto(ip.getNomeProduto());
                    novoItem.setQuantidade(ip.getQuantidadePedida());
                    novoItem.setOrigemItem("Retorno Pedido #" + pedidoId);
                    novoItem.setMotivoRetorno(motivo);
                    novoItem.setEditadoManual(true);
                    itemCotacaoRepository.save(novoItem);
                    if (ip.getItemCotacao() != null) {
                        ItemCotacao icAntigo = ip.getItemCotacao();
                        icAntigo.setExcluido(true); 
                        itemCotacaoRepository.save(icAntigo);
                    }
                }
            }
        }
        return pedidoRepository.save(pedido);
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> buscarItensPendentesPorCotacao(Long cotacaoId) {
        String sql = "SELECT ic.id, ic.nome_produto, c.id AS cotacao_id, ic.quantidade " +
                     "FROM tb_itens_cotacao ic " +
                     "JOIN tb_cotacoes c ON ic.cotacao_id = c.id " +
                     "WHERE c.id = :cotacaoId " +
                     "AND (ic.excluido IS NULL OR ic.excluido = false) " +
                     "AND NOT EXISTS (" +
                     "   SELECT 1 FROM tb_itens_pedido ip " +
                     "   JOIN tb_pedidos p ON ip.pedido_id = p.id " +
                     "   WHERE ip.item_cotacao_id = ic.id AND p.status != 'CANCELADO'" +
                     ")";

        List<Object[]> results = entityManager.createNativeQuery(sql)
                .setParameter("cotacaoId", cotacaoId)
                .getResultList();
        
        List<java.util.Map<String, Object>> lista = new java.util.ArrayList<>();
        for (Object[] row : results) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("idItem", row[0]);
            map.put("nomeProduto", row[1]);
            map.put("cotacaoId", row[2]);
            map.put("quantidade", row[3]);
            lista.add(map);
        }
        return lista;
    }

    @Transactional
    public Pedido recebimentoRapido(Long pedidoId) {
        Pedido pedido = buscarPorId(pedidoId);
        double totalReal = 0.0;

        for (ItemPedido item : pedido.getItens()) {
            item.setQuantidadeReal(item.getQuantidadePedida());
            item.setValorUnitarioReal(item.getValorUnitarioPedido());
            // Se o Enum na sua classe chamar diferente, adapte para "OK" ou "RECEBIDO"
            item.setStatusRecebimento(com.drogaria.cotacao.model.enums.StatusItemRecebimento.OK); 
            
            totalReal += (item.getQuantidadePedida() * item.getValorUnitarioPedido());
        }

        pedido.setValorTotalReal(totalReal);
        pedido.setStatus(StatusPedido.ENTREGUE_SUCESSO);
        pedido.setDataConfirmacao(java.time.LocalDateTime.now());
        
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido ajustarValoresReais(Long pedidoId, java.util.List<com.drogaria.cotacao.dto.request.ItemRecebidoDTO> itensAtualizados) {
        Pedido pedido = buscarPorId(pedidoId);
        double totalReal = 0.0;
        boolean temDivergencia = false;
        boolean temFalta = false;

        for (ItemPedido item : pedido.getItens()) {
            for (com.drogaria.cotacao.dto.request.ItemRecebidoDTO dto : itensAtualizados) {
                if (item.getId().equals(dto.getId())) {
                    item.setQuantidadeReal(dto.getQuantidadeReal());
                    item.setValorUnitarioReal(dto.getValorUnitarioReal());

                    if (item.getQuantidadeReal() < item.getQuantidadePedida()) {
                        item.setStatusRecebimento(com.drogaria.cotacao.model.enums.StatusItemRecebimento.FALTANTE);
                        temFalta = true;
                    } else {
                        item.setStatusRecebimento(com.drogaria.cotacao.model.enums.StatusItemRecebimento.OK);
                    }
                    
                    if (!item.getValorUnitarioReal().equals(item.getValorUnitarioPedido())) {
                        temDivergencia = true;
                    }
                }
            }
            if (item.getQuantidadeReal() != null && item.getValorUnitarioReal() != null) {
                totalReal += (item.getQuantidadeReal() * item.getValorUnitarioReal());
            }
        }

        pedido.setValorTotalReal(totalReal);
        
        if (temFalta) {
            pedido.setStatus(StatusPedido.ENTREGUE_COM_FALTA);
        } else if (temDivergencia) {
            pedido.setStatus(StatusPedido.VALORES_INCOMPATIVEIS);
        } else {
            pedido.setStatus(StatusPedido.ENTREGUE_SUCESSO);
        }

        return pedidoRepository.save(pedido);
    }
}