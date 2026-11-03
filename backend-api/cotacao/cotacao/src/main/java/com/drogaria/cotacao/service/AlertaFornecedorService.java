package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.response.AlertaFornecedorDTO;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.ItemPedido;
import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.model.PrecoCotacao;
import com.drogaria.cotacao.model.enums.StatusPedido;
import com.drogaria.cotacao.repository.PedidoRepository;
import com.drogaria.cotacao.repository.PrecoCotacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Monta a lista diária de alertas das ações dos fornecedores. Não cria
 * registros no banco: os alertas são derivados das respostas de cotação, das
 * confirmações de pedido, dos cortes registrados e dos prazos vencidos.
 */
@Service
@RequiredArgsConstructor
public class AlertaFornecedorService {

    private final PrecoCotacaoRepository precoCotacaoRepository;
    private final PedidoRepository pedidoRepository;

    @Transactional(readOnly = true)
    public List<AlertaFornecedorDTO> listarAlertas(String tipo) {
        return listarAlertas(tipo, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<AlertaFornecedorDTO> listarAlertas(String tipo, LocalDate data) {
        LocalDate diaSelecionado = data != null ? data : LocalDate.now();
        LocalDateTime inicio = diaSelecionado.atStartOfDay();
        LocalDateTime fim = inicio.plusDays(1);

        List<AlertaFornecedorDTO> alertas = new ArrayList<>();

        if (deveIncluir(tipo, AlertaFornecedorDTO.TIPO_RESPOSTA_COTACAO)) {
            alertas.addAll(alertasDeRespostas(inicio, fim));
        }
        if (deveIncluir(tipo, AlertaFornecedorDTO.TIPO_CONFIRMACAO_PEDIDO)
                || deveIncluir(tipo, AlertaFornecedorDTO.TIPO_CORTE_PEDIDO)) {
            alertas.addAll(alertasDePedidosConfirmados(inicio, fim, tipo));
        }
        if (deveIncluir(tipo, AlertaFornecedorDTO.TIPO_PRAZO_ESTOURADO)) {
            alertas.addAll(alertasDePrazoEstourado(diaSelecionado));
        }

        alertas.sort(Comparator.comparing(
                AlertaFornecedorDTO::getData,
                Comparator.nullsLast(Comparator.reverseOrder())
        ));
        return alertas;
    }

    private boolean deveIncluir(String filtro, String tipo) {
        return filtro == null || filtro.isBlank() || "TODOS".equalsIgnoreCase(filtro)
                || tipo.equalsIgnoreCase(filtro);
    }

    /**
     * Agrupa as respostas por fornecedor + cotação, para exibir um alerta por
     * cotação respondida em vez de um alerta por produto.
     */
    private List<AlertaFornecedorDTO> alertasDeRespostas(LocalDateTime inicio, LocalDateTime fim) {
        List<PrecoCotacao> respostas = precoCotacaoRepository.buscarRespostasNoPeriodo(inicio, fim);
        Map<String, AlertaFornecedorDTO> porFornecedorCotacao = new LinkedHashMap<>();

        for (PrecoCotacao preco : respostas) {
            if (preco.getFornecedor() == null || preco.getItem() == null
                    || preco.getItem().getCotacao() == null) {
                continue;
            }
            Long fornecedorId = preco.getFornecedor().getId();
            Long cotacaoId = preco.getItem().getCotacao().getId();
            String chave = fornecedorId + ":" + cotacaoId;

            AlertaFornecedorDTO existente = porFornecedorCotacao.get(chave);
            if (existente == null) {
                String nome = nomeFornecedor(preco.getFornecedor());
                AlertaFornecedorDTO alerta = new AlertaFornecedorDTO();
                alerta.setId("RESPOSTA_COTACAO-" + chave);
                alerta.setTipo(AlertaFornecedorDTO.TIPO_RESPOSTA_COTACAO);
                alerta.setFornecedorNome(nome);
                alerta.setMensagem(nome + " respondeu a cotação #" + cotacaoId);
                alerta.setData(preco.getDataResposta());
                alerta.setCotacaoId(cotacaoId);
                porFornecedorCotacao.put(chave, alerta);
            } else if (preco.getDataResposta() != null
                    && (existente.getData() == null || preco.getDataResposta().isAfter(existente.getData()))) {
                existente.setData(preco.getDataResposta());
            }
        }

        return new ArrayList<>(porFornecedorCotacao.values());
    }

    /**
     * Usa a data de confirmação como referência do dia para confirmações e
     * cortes (os cortes são registrados no mesmo momento da confirmação).
     */
    private List<AlertaFornecedorDTO> alertasDePedidosConfirmados(LocalDateTime inicio,
                                                                  LocalDateTime fim,
                                                                  String filtro) {
        List<Pedido> pedidos = pedidoRepository.buscarConfirmadosNoPeriodo(inicio, fim);
        List<AlertaFornecedorDTO> alertas = new ArrayList<>();
        boolean incluirConfirmacao = deveIncluir(filtro, AlertaFornecedorDTO.TIPO_CONFIRMACAO_PEDIDO);
        boolean incluirCorte = deveIncluir(filtro, AlertaFornecedorDTO.TIPO_CORTE_PEDIDO);

        for (Pedido pedido : pedidos) {
            if (pedido.getFornecedor() == null) {
                continue;
            }
            String nome = nomeFornecedor(pedido.getFornecedor());

            if (incluirConfirmacao) {
                AlertaFornecedorDTO confirmacao = new AlertaFornecedorDTO();
                confirmacao.setId("CONFIRMACAO_PEDIDO-" + pedido.getId());
                confirmacao.setTipo(AlertaFornecedorDTO.TIPO_CONFIRMACAO_PEDIDO);
                confirmacao.setFornecedorNome(nome);
                confirmacao.setMensagem(nome + " confirmou o pedido #" + pedido.getId());
                confirmacao.setData(pedido.getDataConfirmacao());
                confirmacao.setPedidoId(pedido.getId());
                alertas.add(confirmacao);
            }

            if (incluirCorte && pedido.getItens() != null) {
                for (ItemPedido item : pedido.getItens()) {
                    if (!item.isCortadoPeloFornecedor()) {
                        continue;
                    }
                    String produto = item.getNomeProduto() != null && !item.getNomeProduto().isBlank()
                            ? item.getNomeProduto()
                            : "produto do pedido";
                    AlertaFornecedorDTO corte = new AlertaFornecedorDTO();
                    corte.setId("CORTE_PEDIDO-" + item.getId());
                    corte.setTipo(AlertaFornecedorDTO.TIPO_CORTE_PEDIDO);
                    corte.setFornecedorNome(nome);
                    corte.setMensagem(nome + " registrou corte do " + produto);
                    corte.setData(pedido.getDataConfirmacao());
                    corte.setPedidoId(pedido.getId());
                    corte.setNomeProduto(item.getNomeProduto());
                    alertas.add(corte);
                }
            }
        }

        return alertas;
    }

    private List<AlertaFornecedorDTO> alertasDePrazoEstourado(LocalDate diaSelecionado) {
        LocalDateTime limite = LocalDateTime.now().minusHours(24);
        List<Pedido> pendentes = pedidoRepository.buscarPendentesComPrazoEstourado(
                StatusPedido.PENDENTE_ENTREGA, limite);

        List<AlertaFornecedorDTO> alertas = new ArrayList<>();
        for (Pedido pedido : pendentes) {
            LocalDateTime dataAlerta = pedido.getDataCriacao() != null
                    ? pedido.getDataCriacao().plusHours(24)
                    : null;
            if (dataAlerta == null || !dataAlerta.toLocalDate().equals(diaSelecionado)) {
                continue;
            }
            String nome = nomeFornecedor(pedido.getFornecedor());
            AlertaFornecedorDTO alerta = new AlertaFornecedorDTO();
            alerta.setId("PRAZO_ESTOURADO-" + pedido.getId());
            alerta.setTipo(AlertaFornecedorDTO.TIPO_PRAZO_ESTOURADO);
            alerta.setFornecedorNome(nome);
            alerta.setMensagem("Prazo de Confirmação Estourado - " + nome);
            alerta.setData(dataAlerta);
            alerta.setPedidoId(pedido.getId());
            alertas.add(alerta);
        }
        return alertas;
    }

    private String nomeFornecedor(Fornecedor fornecedor) {
        if (fornecedor == null) {
            return "Fornecedor";
        }
        if (fornecedor.getNome() != null && !fornecedor.getNome().isBlank()) {
            return fornecedor.getNome();
        }
        if (fornecedor.getEmpresa() != null && !fornecedor.getEmpresa().isBlank()) {
            return fornecedor.getEmpresa();
        }
        return "Fornecedor";
    }
}
