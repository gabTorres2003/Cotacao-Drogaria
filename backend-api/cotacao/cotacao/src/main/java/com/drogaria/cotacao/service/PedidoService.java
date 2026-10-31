package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.request.GerarPedidoRequestDTO;
import com.drogaria.cotacao.dto.request.ItemGerarPedidoDTO;
import com.drogaria.cotacao.dto.request.ItemNaoSolicitadoDTO;
import com.drogaria.cotacao.dto.request.ItemRecebidoDTO;
import com.drogaria.cotacao.dto.request.ReceberPedidoRequestDTO;
import com.drogaria.cotacao.dto.response.PedidoResumoDTO;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.Devolucao;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.FotoConferencia;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.model.ItemPedido;
import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.model.PrecoCotacao;
import com.drogaria.cotacao.model.SugestaoPedido;
import com.drogaria.cotacao.model.enums.StatusItemRecebimento;
import com.drogaria.cotacao.model.enums.StatusPedido;
import com.drogaria.cotacao.repository.CotacaoFornecedorRepository;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.DevolucaoRepository;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.repository.FotoConferenciaRepository;
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
import java.util.HashMap;
import java.util.LinkedHashMap;
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
    private final DevolucaoRepository devolucaoRepository;
    private final FotoConferenciaRepository fotoConferenciaRepository;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Pedido> listarPorStatuses(List<String> statuses) {
        List<StatusPedido> enumStatuses = statuses.stream()
                .map(StatusPedido::valueOf)
                .toList();
        List<Pedido> pedidos = pedidoRepository.findByStatusInOrderByDataCriacaoDesc(enumStatuses);
        pedidos.forEach(pedido -> pedido.getSugestoes().size());
        return pedidos;
    }

    /**
     * Listagem resumida: carrega apenas as colunas necessárias de pedido,
     * fornecedor, cotação e itens. Evita trazer todas as colunas de
     * ItemPedido/ItemCotacao em históricos extensos.
     */
    @Transactional(readOnly = true)
    public List<PedidoResumoDTO> listarResumoPorStatuses(List<String> statuses) {
        List<StatusPedido> enumStatuses = statuses.stream()
                .map(StatusPedido::valueOf)
                .toList();
        return montarResumos(pedidoRepository.buscarResumoPorStatuses(enumStatuses));
    }

    @Transactional(readOnly = true)
    public List<PedidoResumoDTO> resumoPorCotacao(Long cotacaoId) {
        return montarResumos(pedidoRepository.buscarResumoPorCotacaoId(cotacaoId));
    }

    @SuppressWarnings("unchecked")
    private List<PedidoResumoDTO> montarResumos(List<Pedido> pedidos) {
        if (pedidos == null || pedidos.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> pedidoIds = pedidos.stream().map(Pedido::getId).toList();

        Map<Long, List<PedidoResumoDTO.ItemResumo>> itensPorPedido = new HashMap<>();
        for (Object[] row : itemPedidoRepository.buscarResumoItensPorPedidos(pedidoIds)) {
            Long pedidoId = ((Number) row[0]).longValue();
            PedidoResumoDTO.ItemResumo item = new PedidoResumoDTO.ItemResumo();
            item.setId(row[1] != null ? ((Number) row[1]).longValue() : null);
            item.setNomeProduto((String) row[2]);
            item.setQuantidadePedida(row[3] != null ? ((Number) row[3]).intValue() : null);
            item.setValorUnitarioPedido(row[4] != null ? ((Number) row[4]).doubleValue() : null);
            item.setCodigoBarrasRecebido((String) row[5]);

            if (row[6] != null) {
                PedidoResumoDTO.ItemCotacaoResumo itemCotacao = new PedidoResumoDTO.ItemCotacaoResumo();
                itemCotacao.setId(((Number) row[6]).longValue());
                itemCotacao.setNomeProduto((String) row[7]);
                itemCotacao.setGrupo((String) row[8]);
                itemCotacao.setCodBarras((String) row[9]);
                item.setItemCotacao(itemCotacao);
            }

            itensPorPedido.computeIfAbsent(pedidoId, ignorado -> new ArrayList<>()).add(item);
        }

        Map<Long, Long> sugestoesPorPedido = new HashMap<>();
        List<Object[]> contagens = entityManager.createQuery(
                        "SELECT s.pedido.id, COUNT(s.id) FROM SugestaoPedido s " +
                        "WHERE s.pedido.id IN :pedidoIds GROUP BY s.pedido.id")
                .setParameter("pedidoIds", pedidoIds)
                .getResultList();
        for (Object[] row : contagens) {
            sugestoesPorPedido.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }

        List<PedidoResumoDTO> resultado = new ArrayList<>(pedidos.size());
        for (Pedido pedido : pedidos) {
            PedidoResumoDTO dto = new PedidoResumoDTO();
            dto.setId(pedido.getId());
            dto.setStatus(pedido.getStatus());
            dto.setNumeroNota(pedido.getNumeroNota());
            dto.setMotivoCancelamento(pedido.getMotivoCancelamento());
            dto.setDataCriacao(pedido.getDataCriacao());
            dto.setDataConfirmacao(pedido.getDataConfirmacao());
            dto.setValorTotalPedido(pedido.getValorTotalPedido());
            dto.setValorTotalReal(pedido.getValorTotalReal());
            dto.setValorMinimoFaturamento(pedido.getValorMinimoFaturamento());

            if (pedido.getCotacao() != null) {
                dto.setCotacaoId(pedido.getCotacao().getId());
                PedidoResumoDTO.CotacaoResumo cotacao = new PedidoResumoDTO.CotacaoResumo();
                cotacao.setId(pedido.getCotacao().getId());
                cotacao.setSetor(pedido.getCotacao().getSetor());
                dto.setCotacao(cotacao);
            }

            if (pedido.getFornecedor() != null) {
                PedidoResumoDTO.FornecedorResumo fornecedor = new PedidoResumoDTO.FornecedorResumo();
                fornecedor.setId(pedido.getFornecedor().getId());
                fornecedor.setNome(pedido.getFornecedor().getNome());
                fornecedor.setEmpresa(pedido.getFornecedor().getEmpresa());
                fornecedor.setEntreguePor(pedido.getFornecedor().getEntreguePor());
                fornecedor.setSetorCompra(pedido.getFornecedor().getSetorCompra());
                fornecedor.setTelefone(pedido.getFornecedor().getTelefone());
                dto.setFornecedor(fornecedor);
            }

            dto.setItens(itensPorPedido.getOrDefault(pedido.getId(), new ArrayList<>()));
            dto.setQtdSugestoes(sugestoesPorPedido.getOrDefault(pedido.getId(), 0L));
            resultado.add(dto);
        }
        return resultado;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> contarPorStatus() {
        Map<String, Long> contagem = new LinkedHashMap<>();
        for (Object[] linha : pedidoRepository.contarPorStatus()) {
            contagem.put(((StatusPedido) linha[0]).name(), ((Number) linha[1]).longValue());
        }
        return contagem;
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

        // AGUARDAR mantém os itens faltantes no pedido (entrega parcial);
        // RETORNAR_COTACAO (ou ausente) devolve os itens não recebidos para a cotação de origem.
        boolean aguardarFaltantes = "AGUARDAR".equalsIgnoreCase(dto.getAcaoItensFaltantes());

        boolean temDevolucao = false;
        boolean temIncompatibilidadeValor = false;
        double valorTotalReal = 0.0;

        for (ItemRecebidoDTO itemConferido : dto.getItens()) {
            ItemPedido itemBanco = itemPedidoRepository.findById(itemConferido.getId())
                    .orElseThrow(() -> new RuntimeException("Item do pedido não encontrado"));

            // Item já devolvido à cotação ("Não entregue") não participa mais da conferência.
            if (Boolean.TRUE.equals(itemBanco.getRetornadoCotacao())) {
                continue;
            }

            Integer jaRecebido = itemBanco.getQuantidadeReal() != null ? itemBanco.getQuantidadeReal() : 0;
            Integer incremento = itemConferido.getQuantidadeRecebidaAgora() != null
                    ? itemConferido.getQuantidadeRecebidaAgora()
                    : itemConferido.getQuantidadeReal();
            if (incremento == null) incremento = 0;

            int novaQuantidadeReal = jaRecebido + incremento;
            itemBanco.setQuantidadeReal(novaQuantidadeReal);
            int avariadaAgora = itemConferido.getQuantidadeAvariadaAgora() != null
                    ? itemConferido.getQuantidadeAvariadaAgora() : 0;
            if (avariadaAgora < 0 || avariadaAgora > incremento) {
                throw new RuntimeException("A quantidade avariada não pode exceder a quantidade recebida nesta NF.");
            }
            int avariadaAnterior = itemBanco.getQuantidadeAvariada() != null
                    ? itemBanco.getQuantidadeAvariada() : 0;
            itemBanco.setQuantidadeAvariada(avariadaAnterior + avariadaAgora);
            itemBanco.setValorUnitarioReal(itemConferido.getValorUnitarioReal());

            if (itemBanco.getQuantidadeReal() != null && itemBanco.getValorUnitarioReal() != null) {
                valorTotalReal += (itemBanco.getQuantidadeReal() * itemBanco.getValorUnitarioReal());
            }

            StatusItemRecebimento statusItem = itemConferido.getStatusRecebimento();

            boolean incompleto = itemBanco.getQuantidadeReal() < itemBanco.getQuantidadePedida();
            if (incompleto && (statusItem == null || statusItem == StatusItemRecebimento.OK)) {
                statusItem = StatusItemRecebimento.FALTANTE;
            }

            boolean foiCobrado = itemConferido.getFoiCobrado() != null
                    ? itemConferido.getFoiCobrado()
                    : (itemConferido.getObservacaoDevolucao() != null
                        && itemConferido.getObservacaoDevolucao().contains("Cobrado na nota"));

            // Item sem entrega integral e sem cobrança: exige destino definido pelo usuário.
            boolean semDestino = incompleto && !foiCobrado
                    && statusItem != StatusItemRecebimento.AVARIADO
                    && statusItem != StatusItemRecebimento.INCORRETO
                    && statusItem != StatusItemRecebimento.PROXIMO_VENCIMENTO;

            if (semDestino && !aguardarFaltantes) {
                retornarItemParaCotacaoOrigem(itemBanco, pedido);
                continue;
            }

            itemBanco.setStatusRecebimento(statusItem);
            itemBanco.setObservacaoDevolucao(itemConferido.getObservacaoDevolucao());
            itemBanco.setCodigoBarrasRecebido(itemConferido.getCodigoBarrasRecebido());
            itemBanco.setNomeProdutoRecebido(itemConferido.getNomeProdutoRecebido());

            if (!valoresEquivalentes(itemBanco)) {
                temIncompatibilidadeValor = true;
            }

            if (statusItem == StatusItemRecebimento.AVARIADO ||
                statusItem == StatusItemRecebimento.INCORRETO ||
                statusItem == StatusItemRecebimento.PROXIMO_VENCIMENTO) {
                temDevolucao = true;
            }
        }

        pedido.setValorTotalReal(valorTotalReal);

        // Pendência calculada somente sobre os itens que permaneceram no pedido e que
        // não retornaram à cotação, para que itens devolvidos não gerem entrega parcial
        // indevida.
        boolean temItemPendente = pedido.getItens().stream()
                .filter(i -> !Boolean.TRUE.equals(i.getRetornadoCotacao()))
                .anyMatch(i ->
                        i.getQuantidadeReal() == null || i.getQuantidadePedida() == null
                                || i.getQuantidadeReal() < i.getQuantidadePedida());
        boolean todosItensRetornados = !pedido.getItens().isEmpty()
                && pedido.getItens().stream().allMatch(i -> Boolean.TRUE.equals(i.getRetornadoCotacao()));

        if (temDevolucao) {
            pedido.setStatus(StatusPedido.DIVERGENCIA);
        } else if (temItemPendente) {
            pedido.setStatus(StatusPedido.ENTREGA_PARCIAL);
        } else if (todosItensRetornados || pedido.getItens().isEmpty()) {
            // Todos os itens foram devolvidos à cotação de origem: encerra com falta confirmada.
            pedido.setStatus(StatusPedido.ENTREGUE_COM_FALTA);
        } else if (temIncompatibilidadeValor) {
            pedido.setStatus(StatusPedido.VALORES_INCOMPATIVEIS);
        } else {
            pedido.setStatus(StatusPedido.ENTREGUE_SUCESSO);
        }

        Pedido pedidoSalvo = pedidoRepository.save(pedido);

        if (pedido.getFornecedor() != null && pedido.getFornecedor().getId() != null) {
            try {
                atualizarPercentualImpostoFornecedor(pedido);
            } catch (Exception e) {
                System.err.println("Erro ao calcular média de imposto do fornecedor: " + e.getMessage());
            }
        }

        return pedidoSalvo;
    }

    @Transactional
    public Pedido salvarConferenciaParcial(Long pedidoId, ReceberPedidoRequestDTO dto,
                                            String nomeConferente, String username) {
        Pedido pedido = buscarPorId(pedidoId);
        if (pedido.getStatus() != StatusPedido.PENDENTE_ENTREGA
                && pedido.getStatus() != StatusPedido.CONFIRMADO_FORNECEDOR
                && pedido.getStatus() != StatusPedido.CONFERENCIA_INICIADA) {
            throw new RuntimeException("Este pedido não está disponível para conferência física.");
        }

        if (dto.getNumeroNota() != null && !dto.getNumeroNota().trim().isEmpty()) {
            pedido.setNumeroNota(dto.getNumeroNota().trim());
        }
        if (pedido.getConferenciaIniciadaPor() == null) {
            pedido.setConferenciaIniciadaPor(nomeConferente);
            pedido.setConferenciaIniciadaUsername(username);
            pedido.setDataInicioConferencia(LocalDateTime.now());
        }

        if (dto.getItens() != null) {
            for (ItemRecebidoDTO itemDTO : dto.getItens()) {
                if (itemDTO.getId() == null) continue;
                ItemPedido item = itemPedidoRepository.findById(itemDTO.getId())
                        .orElseThrow(() -> new RuntimeException("Item do pedido não encontrado"));
                if (!item.getPedido().getId().equals(pedidoId)) {
                    throw new RuntimeException("Item não pertence ao pedido informado.");
                }
                // Item já devolvido à cotação ("Não entregue") não participa mais da conferência.
                if (Boolean.TRUE.equals(item.getRetornadoCotacao())) {
                    continue;
                }
                int atual = item.getQuantidadeReal() == null ? 0 : item.getQuantidadeReal();
                int incremento = itemDTO.getQuantidadeRecebidaAgora() == null
                        ? 0 : itemDTO.getQuantidadeRecebidaAgora();
                item.setQuantidadeReal(atual + incremento);
                int avariadaAgora = itemDTO.getQuantidadeAvariadaAgora() != null
                        ? itemDTO.getQuantidadeAvariadaAgora() : 0;
                if (avariadaAgora < 0 || avariadaAgora > incremento) {
                    throw new RuntimeException("A quantidade avariada não pode exceder a quantidade recebida nesta NF.");
                }
                int avariadaAnterior = item.getQuantidadeAvariada() != null
                        ? item.getQuantidadeAvariada() : 0;
                item.setQuantidadeAvariada(avariadaAnterior + avariadaAgora);
                StatusItemRecebimento status = itemDTO.getStatusRecebimento() != null
                        ? itemDTO.getStatusRecebimento()
                        : item.getStatusRecebimento();
                if (status == null
                        && item.getQuantidadePedida() != null
                        && item.getQuantidadeReal() < item.getQuantidadePedida()) {
                    status = StatusItemRecebimento.FALTANTE;
                }
                item.setStatusRecebimento(status);
                item.setObservacaoDevolucao(itemDTO.getObservacaoDevolucao());
                item.setCodigoBarrasRecebido(itemDTO.getCodigoBarrasRecebido());
                item.setNomeProdutoRecebido(itemDTO.getNomeProdutoRecebido());
                if (itemDTO.getValorUnitarioReal() != null && itemDTO.getValorUnitarioReal() > 0) {
                    // Persiste o valor unitário informado (ex.: fracionamento) já na etapa física.
                    item.setValorUnitarioReal(itemDTO.getValorUnitarioReal());
                }
                itemPedidoRepository.save(item);
            }
        }
        pedido.setStatus(StatusPedido.CONFERENCIA_INICIADA);
        return pedidoRepository.save(pedido);
    }

    public boolean ehConferente(String perfil) {
        return "CONFERENTE".equalsIgnoreCase(perfil);
    }

    public void exigirAdministrador(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || authentication.getAuthorities().stream()
                .noneMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()))) {
            throw new org.springframework.security.access.AccessDeniedException("Apenas o ADM pode finalizar a conferência.");
        }
    }

    public void registrarFinalizador(Pedido pedido, String nome) {
        pedido.setConferenciaFinalizadaPor(nome);
    }

    /**
     * Considera os valores do item compatíveis quando o valor unitário confere com o
     * previsto ou quando o total do item se mantém equivalente ao previsto (tolerância
     * de R$ 0,01 para arredondamento). A segunda condição permite o fracionamento
     * (valor unitário dividido e quantidade multiplicada) sem gerar divergência artificial.
     */
    private boolean valoresEquivalentes(ItemPedido item) {
        Double vlrReal = item.getValorUnitarioReal();
        Double vlrPrevisto = item.getValorUnitarioPedido();
        if (vlrReal == null || vlrPrevisto == null) return true;
        if (vlrReal.equals(vlrPrevisto)) return true;

        Integer qtdReal = item.getQuantidadeReal();
        Integer qtdPedida = item.getQuantidadePedida();
        if (qtdReal == null || qtdPedida == null || qtdPedida <= 0) return false;

        double totalReal = qtdReal * vlrReal;
        double totalPrevisto = qtdPedida * vlrPrevisto;
        return Math.abs(totalReal - totalPrevisto) <= 0.01;
    }

    /**
     * Devolve um item não recebido para a cotação de origem.
     * Reativa o ItemCotacao (mesmo que a cotação esteja encerrada) e ajusta o pedido:
     * itens sem nenhuma entrega permanecem no pedido marcados como "Não entregue"
     * (retornadoCotacao), preservando histórico e vínculo com a cotação; itens com
     * entrega parcial passam a considerar somente o que já foi recebido.
     */
    private void retornarItemParaCotacaoOrigem(ItemPedido item, Pedido pedido) {
        int pedida = item.getQuantidadePedida() != null ? item.getQuantidadePedida() : 0;
        int recebida = item.getQuantidadeReal() != null ? item.getQuantidadeReal() : 0;
        int pendente = Math.max(pedida - recebida, 0);
        double valorUnitario = item.getValorUnitarioPedido() != null ? item.getValorUnitarioPedido() : 0.0;
        double valorTotalPedido = pedido.getValorTotalPedido() != null ? pedido.getValorTotalPedido() : 0.0;
        String motivo = "Retorno à cotação de origem - falta na conferência do Pedido #" + pedido.getId();

        ItemCotacao itemCotacaoOrigem = item.getItemCotacao();
        Cotacao cotacaoOrigem = itemCotacaoOrigem != null ? itemCotacaoOrigem.getCotacao() : pedido.getCotacao();

        if (cotacaoOrigem != null) {
            ItemCotacao ic = itemCotacaoOrigem;
            if (ic == null) {
                ic = new ItemCotacao();
                ic.setCotacao(cotacaoOrigem);
                ic.setNomeProduto(item.getNomeProduto());
                ic.setEditadoManual(true);
            }
            ic.setExcluido(false);
            ic.setMotivoRetorno(motivo);
            ic.setOrigemItem("Falta do Pedido " + pedido.getId());
            ic.setQuantidade(pendente > 0 ? pendente : pedida);
            itemCotacaoRepository.save(ic);
        }

        if (recebida <= 0) {
            // Nada foi recebido: o item permanece no pedido como "Não entregue",
            // com o vínculo com a cotação de origem preservado.
            pedido.setValorTotalPedido(valorTotalPedido - (pedida * valorUnitario));
            item.setRetornadoCotacao(true);
            item.setStatusRecebimento(StatusItemRecebimento.FALTANTE);
            item.setObservacaoDevolucao("Não entregue - item retornou para a cotação de origem");
            itemPedidoRepository.save(item);
        } else {
            // Entrega parcial: somente o que já chegou permanece vinculado ao pedido.
            item.setItemCotacao(null);
            pedido.setValorTotalPedido(valorTotalPedido - (pendente * valorUnitario));
            item.setQuantidadePedida(recebida);
            item.setStatusRecebimento(StatusItemRecebimento.OK);
            item.setObservacaoDevolucao("Retorno parcial: " + pendente + " un pendente(s) retornaram para a cotação de origem");
            itemPedidoRepository.save(item);
        }
    }

    @Transactional
    public Pedido adicionarItensNaoSolicitados(Long pedidoId, List<ItemNaoSolicitadoDTO> itens) {
        return adicionarItensNaoSolicitados(pedidoId, itens, false);
    }

    @Transactional
    public Pedido adicionarItensNaoSolicitados(Long pedidoId, List<ItemNaoSolicitadoDTO> itens, boolean conferente) {
        Pedido pedido = buscarPorId(pedidoId);

        for (ItemNaoSolicitadoDTO dto : itens) {
            ItemPedido novoItem = new ItemPedido();
            novoItem.setPedido(pedido);
            novoItem.setNomeProduto(dto.getNomeProduto());
            novoItem.setQuantidadePedida(0);
            novoItem.setValorUnitarioPedido(0.0);
            novoItem.setQuantidadeReal(dto.getQuantidade() != null ? dto.getQuantidade() : 0);
            novoItem.setValorUnitarioReal(conferente ? 0.0
                    : (dto.getValorUnitarioReal() != null ? dto.getValorUnitarioReal() : 0.0));
            novoItem.setStatusRecebimento(StatusItemRecebimento.OK);
            novoItem.setObservacaoDevolucao(dto.getObservacaoDevolucao() != null ? dto.getObservacaoDevolucao() : "Produto Não Solicitado");
            novoItem.setCodigoBarrasRecebido(dto.getCodigoBarrasRecebido());
            novoItem.setNomeProdutoRecebido(dto.getNomeProdutoRecebido());
            novoItem.setCondicaoAplicada(false);
            novoItem.setValorAlteradoAposPedido(false);

            pedido.getItens().add(novoItem);
            itemPedidoRepository.save(novoItem);
        }

        double valorTotalReal = 0.0;
        for (ItemPedido item : pedido.getItens()) {
            if (item.getQuantidadeReal() != null && item.getValorUnitarioReal() != null) {
                valorTotalReal += (item.getQuantidadeReal() * item.getValorUnitarioReal());
            }
        }
        pedido.setValorTotalReal(valorTotalReal);

        return pedidoRepository.save(pedido);
    }

    private void atualizarPercentualImpostoFornecedor(Pedido pedido) {
        if (pedido.getFornecedor() == null || pedido.getFornecedor().getId() == null) return;
        Fornecedor fornecedor = fornecedorRepository.findById(pedido.getFornecedor().getId()).orElse(null);
        if (fornecedor == null) return;

        List<Pedido> pedidosFornecedor = pedidoRepository.findWithItensByFornecedorId(fornecedor.getId());
        double totalPedido = 0.0;
        double totalReal = 0.0;
        for (Pedido pedidoFornecedor : pedidosFornecedor) {
            if (pedidoFornecedor.getStatus() == StatusPedido.CANCELADO) continue;
            if (pedidoFornecedor.getItens() == null) continue;
            for (ItemPedido item : pedidoFornecedor.getItens()) {
                if (item.getQuantidadeReal() == null || item.getQuantidadeReal() <= 0) continue;
                if (item.getValorUnitarioPedido() == null || item.getValorUnitarioPedido() <= 0) continue;
                if (item.getValorUnitarioReal() == null || item.getValorUnitarioReal() <= 0) continue;

                totalPedido += item.getQuantidadeReal() * item.getValorUnitarioPedido();
                totalReal += item.getQuantidadeReal() * item.getValorUnitarioReal();
            }
        }

        if (totalPedido <= 0) return;

        double media = ((totalReal / totalPedido) - 1.0) * 100.0;
        if (media < -50 || media > 100) return;
        double mediaArredondada = Math.round(media * 100.0) / 100.0;

        fornecedor.setPercentualImposto(mediaArredondada);
        fornecedorRepository.save(fornecedor);
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
        pedido.setConferenciaIniciadaPor(null);
        pedido.setConferenciaIniciadaUsername(null);
        pedido.setDataInicioConferencia(null);
        pedido.setConferenciaFinalizadaPor(null);

        for (ItemPedido item : pedido.getItens()) {
            item.setQuantidadeReal(null);
            item.setQuantidadeAvariada(0);
            item.setValorUnitarioReal(null);
            item.setStatusRecebimento(null);
            item.setObservacaoDevolucao(null);
            item.setRetornadoCotacao(false);
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
            throw new RuntimeException("O identificador do fornecedor (fornecedorId) é obrigatório para gerar o pedido.");
        }

        Pedido pedido = new Pedido();
        pedido.setCotacao(cotacao);
        pedido.setFornecedor(fornecedor);
        pedido.setStatus(StatusPedido.PENDENTE_ENTREGA);
        pedido.setDataCriacao(LocalDateTime.now());

        double valorTotal = 0.0;
        List<ItemPedido> itens = new ArrayList<>();

        for (ItemGerarPedidoDTO itemDto : dto.getItens()) {
            if (itemDto.getItemCotacaoId() != null && isItemDuplicado(itemDto.getItemCotacaoId(), itemDto.getReatribuicaoExplicita())) {
                continue;
            }

            ItemPedido itemPedido = new ItemPedido();
            itemPedido.setPedido(pedido);

            if (itemDto.getItemCotacaoId() != null) {
                ItemCotacao itemCotacao = itemCotacaoRepository.findById(itemDto.getItemCotacaoId())
                        .orElse(null);
                if (itemCotacao == null) continue;

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
                    continue;
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
            itemPedido.setReatribuicaoExplicita(itemDto.getReatribuicaoExplicita());

            valorTotal += (itemDto.getQuantidadePedida() * itemDto.getValorUnitarioPedido());
            itens.add(itemPedido);
        }

        if (itens.isEmpty()) {
            throw new RuntimeException("Todos os itens já estão em pedidos ativos. Nenhum pedido foi gerado para " + fornecedor.getEmpresa());
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
        Pedido pedido = buscarPorId(id);

        if (!devolucaoRepository.findByPedidoId(id).isEmpty()) {
            throw new RuntimeException("Não é possível excluir este pedido, pois existe uma devolução vinculada a ele no histórico.");
        }

        // As fotos da conferência referenciam o pedido e os itens do pedido (sem cascade no banco).
        // Precisam ser removidas antes da exclusão para não violar a chave estrangeira.
        List<FotoConferencia> fotos = fotoConferenciaRepository.findByPedidoIdOrderByDataCriacaoAsc(id);
        if (!fotos.isEmpty()) {
            fotoConferenciaRepository.deleteAll(fotos);
            fotoConferenciaRepository.flush();
        }

        try {
            pedidoRepository.delete(pedido);
            pedidoRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Não é possível excluir este pedido: existem registros vinculados a ele (devoluções ou conferências).");
        }
    }

    public List<Pedido> buscarPorFornecedorId(Long fornecedorId) {
        return pedidoRepository.findByFornecedorId(fornecedorId);
    }

    public List<Pedido> buscarPendentesPorFornecedorId(Long fornecedorId) {
        return pedidoRepository.findByFornecedorIdAndStatusOrderByIdDesc(fornecedorId, StatusPedido.PENDENTE_ENTREGA);
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

            if (isItemDuplicado(ic.getId(), novoItem.getReatribuicaoExplicita())) {
                return pedido;
            }

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

            preencherPrecoRespondidoSeNecessario(novoItem, pedido, ic);
        }

        novoItem.setPedido(pedido);
        novoItem.setValorAlteradoAposPedido(false);
        
        pedido.getItens().add(novoItem);

        double total = pedido.getItens().stream()
                .filter(i -> !Boolean.TRUE.equals(i.getRetornadoCotacao()))
                .mapToDouble(i -> (i.getQuantidadePedida() != null ? i.getQuantidadePedida() : 0) * 
                                  (i.getValorUnitarioPedido() != null ? i.getValorUnitarioPedido() : 0.0))
                .sum();
                
        pedido.setValorTotalPedido(total);
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido adicionarItensManuais(Long pedidoId, List<ItemPedido> novosItens) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

        // Pedido já recebido com falta pode receber os itens de volta (retorno de falta
        // à cotação de origem) e volta a ficar aguardando confirmação/entrega.
        boolean retornoFalta = pedido.getStatus() == StatusPedido.ENTREGUE_COM_FALTA
                || pedido.getStatus() == StatusPedido.ENTREGA_PARCIAL
                || pedido.getStatus() == StatusPedido.DIVERGENCIA
                || pedido.getStatus() == StatusPedido.VALORES_INCOMPATIVEIS;

        if (pedido.getStatus() != StatusPedido.PENDENTE_ENTREGA && !retornoFalta) {
            throw new RuntimeException("Não é possível adicionar itens a um pedido que já foi processado pelo fornecedor ou entregue.");
        }

        List<ItemPedido> itensAdicionados = new ArrayList<>();

        for (ItemPedido novoItem : novosItens) {
            if (novoItem.getItemCotacao() != null && novoItem.getItemCotacao().getId() != null) {
                ItemCotacao ic = itemCotacaoRepository.findById(novoItem.getItemCotacao().getId())
                        .orElse(null);
                if (ic == null) {
                    continue;
                }
                novoItem.setItemCotacao(ic);

                Long fornecedorId = pedido.getFornecedor() != null ? pedido.getFornecedor().getId() : null;
                if (fornecedorId != null && ic.getCotacao() != null) {
                    preencherPrecoRespondidoSeNecessario(novoItem, pedido, ic);
                }
            }
            novoItem.setPedido(pedido);
            novoItem.setValorAlteradoAposPedido(false);
            pedido.getItens().add(novoItem);
            itensAdicionados.add(novoItem);
        }

        if (itensAdicionados.isEmpty()) {
            throw new RuntimeException("Nenhum item pôde ser adicionado. Verifique se os itens são válidos.");
        }

        pedido.setValorTotalPedido(pedido.getItens().stream()
                .filter(i -> !Boolean.TRUE.equals(i.getRetornadoCotacao()))
                .mapToDouble(i -> (i.getQuantidadePedida() != null ? i.getQuantidadePedida() : 0)
                        * (i.getValorUnitarioPedido() != null ? i.getValorUnitarioPedido() : 0.0))
                .sum());

        if (retornoFalta) {
            pedido.setStatus(StatusPedido.PENDENTE_ENTREGA);
        }
        return pedidoRepository.save(pedido);
    }

    private void preencherPrecoRespondidoSeNecessario(ItemPedido item, Pedido pedido, ItemCotacao cotacaoItem) {
        if (item.getValorUnitarioPedido() != null && item.getValorUnitarioPedido() > 0
                || pedido.getFornecedor() == null) return;

        List<PrecoCotacao> precos = precoRepository.findByItemIdAndFornecedorId(
                cotacaoItem.getId(), pedido.getFornecedor().getId());
        precos.stream()
                .filter(preco -> preco.getPrecoOfertado() != null && preco.getPrecoOfertado() > 0)
                .findFirst()
                .ifPresent(preco -> item.setValorUnitarioPedido(preco.getPrecoOfertado()));
    }

    private boolean isItemDuplicado(Long itemCotacaoId, Boolean reatribuicaoExplicita) {
        if (Boolean.TRUE.equals(reatribuicaoExplicita)) return false;
        return itemPedidoRepository.existsByItemCotacaoIdAndPedidoStatusNot(itemCotacaoId, StatusPedido.CANCELADO);
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
        
        // Item já devolvido à cotação já teve seu valor abatido do total do pedido.
        if (!Boolean.TRUE.equals(item.getRetornadoCotacao())) {
            double valorSubtrair = item.getQuantidadePedida() * item.getValorUnitarioPedido();
            pedido.setValorTotalPedido(pedido.getValorTotalPedido() - valorSubtrair);
        }
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
                    ic.setOrigemItem("Falta do Pedido " + pedidoId);
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
    public List<Map<String, Object>> buscarItensPendentesPorCotacao(Long cotacaoId, Long fornecedorId) {
        String sql = "SELECT ic.id, ic.nome_produto, c.id AS cotacao_id, ic.quantidade, " +
                     "(SELECT pc.preco_ofertado FROM tb_precos_cotacao pc " +
                     " WHERE pc.item_id = ic.id AND pc.fornecedor_id = :fornecedorId " +
                     " ORDER BY pc.id DESC LIMIT 1) AS preco_fornecedor " +
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
                .setParameter("fornecedorId", fornecedorId)
                .getResultList();
        
        List<java.util.Map<String, Object>> lista = new java.util.ArrayList<>();
        for (Object[] row : results) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("idItem", row[0]);
            map.put("nomeProduto", row[1]);
            map.put("cotacaoId", row[2]);
            map.put("quantidade", row[3]);
            map.put("precoFornecedor", row[4]);
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
                    
                    if (!valoresEquivalentes(item)) {
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

        Pedido pedidoSalvo = pedidoRepository.save(pedido);
        atualizarPercentualImpostoFornecedor(pedidoSalvo);
        return pedidoSalvo;
    }
}