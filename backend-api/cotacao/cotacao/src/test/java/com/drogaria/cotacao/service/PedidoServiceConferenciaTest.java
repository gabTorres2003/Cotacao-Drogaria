package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.request.ItemNaoSolicitadoDTO;
import com.drogaria.cotacao.dto.request.ItemRecebidoDTO;
import com.drogaria.cotacao.dto.request.ReceberPedidoRequestDTO;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.model.ItemPedido;
import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.model.enums.StatusItemRecebimento;
import com.drogaria.cotacao.model.enums.StatusPedido;
import com.drogaria.cotacao.repository.CotacaoFornecedorRepository;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.DevolucaoRepository;
import com.drogaria.cotacao.repository.EncomendaRepository;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.repository.FotoConferenciaRepository;
import com.drogaria.cotacao.repository.ItemCotacaoRepository;
import com.drogaria.cotacao.repository.ItemPedidoRepository;
import com.drogaria.cotacao.repository.PedidoRepository;
import com.drogaria.cotacao.repository.PrecoCotacaoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes da conferência:
 * - etapa física finalizada pelo Conferente trava novas edições até liberação do ADM;
 * - Conferente nunca persiste valor financeiro;
 * - conversão entre unidade pedida e unidade física é calculada no backend;
 * - produtos não solicitados entram em lote na mesma transação, sem duplicidade;
 * - itens "Não Veio" retornados à cotação permanecem no pedido como "Não entregue".
 */
@ExtendWith(MockitoExtension.class)
class PedidoServiceConferenciaTest {

    @Mock private PedidoRepository pedidoRepository;
    @Mock private ItemPedidoRepository itemPedidoRepository;
    @Mock private CotacaoRepository cotacaoRepository;
    @Mock private FornecedorRepository fornecedorRepository;
    @Mock private ItemCotacaoRepository itemCotacaoRepository;
    @Mock private EncomendaRepository encomendaRepository;
    @Mock private CotacaoFornecedorRepository cotacaoFornecedorRepository;
    @Mock private PrecoCotacaoRepository precoRepository;
    @Mock private DevolucaoRepository devolucaoRepository;
    @Mock private FotoConferenciaRepository fotoConferenciaRepository;

    @InjectMocks
    private PedidoService service;

    // --------------------------------------------------------------------- util

    private static ItemPedido novoItem(long id, int quantidadePedida, double valorUnitario) {
        ItemPedido item = new ItemPedido();
        item.setId(id);
        item.setNomeProduto("Produto " + id);
        item.setQuantidadePedida(quantidadePedida);
        item.setValorUnitarioPedido(valorUnitario);
        item.setQuantidadeReal(0);
        return item;
    }

    private static Pedido novoPedido(StatusPedido status, ItemPedido... itens) {
        Pedido pedido = new Pedido();
        pedido.setId(1L);
        pedido.setStatus(status);
        pedido.setItens(new ArrayList<>(List.of(itens)));
        double total = 0.0;
        for (ItemPedido item : itens) {
            item.setPedido(pedido);
            total += item.getQuantidadePedida() * item.getValorUnitarioPedido();
        }
        pedido.setValorTotalPedido(total);
        return pedido;
    }

    private static ItemRecebidoDTO itemDto(long id, Integer qtdRecebidaAgora, Double valorUnitarioReal) {
        ItemRecebidoDTO dto = new ItemRecebidoDTO();
        dto.setId(id);
        dto.setQuantidadeRecebidaAgora(qtdRecebidaAgora);
        dto.setValorUnitarioReal(valorUnitarioReal);
        return dto;
    }

    private static ItemRecebidoDTO itemDtoComConversao(long id, Integer qtdRecebidaAgora,
                                                       Double valorUnitarioReal, Integer fator,
                                                       String sentido) {
        ItemRecebidoDTO dto = itemDto(id, qtdRecebidaAgora, valorUnitarioReal);
        dto.setFatorConversao(fator);
        dto.setSentidoConversao(sentido);
        return dto;
    }

    private static ReceberPedidoRequestDTO recebimentoDto(ItemRecebidoDTO... itens) {
        ReceberPedidoRequestDTO dto = new ReceberPedidoRequestDTO();
        dto.setNumeroNota("NF-12345");
        dto.setItens(new ArrayList<>(List.of(itens)));
        return dto;
    }

    private static ItemNaoSolicitadoDTO extra(String nome, int quantidade, String codigoBarras) {
        ItemNaoSolicitadoDTO dto = new ItemNaoSolicitadoDTO();
        dto.setNomeProduto(nome);
        dto.setQuantidade(quantidade);
        dto.setCodigoBarrasRecebido(codigoBarras);
        return dto;
    }

    private void mockarSalvamento() {
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    // ------------------------------------------------- Ajuste 4: itens retornados

    @Test
    void itemRetornadoParaCotacaoNaoParticipaDaConferencia() {
        ItemPedido retornado = novoItem(10L, 10, 5.0);
        retornado.setRetornadoCotacao(true);
        ItemPedido ativo = novoItem(11L, 5, 10.0);

        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, retornado, ativo);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(retornado));
        when(itemPedidoRepository.findById(11L)).thenReturn(Optional.of(ativo));
        mockarSalvamento();

        ItemRecebidoDTO dtoRetornado = itemDto(10L, 10, 5.0);
        dtoRetornado.setStatusRecebimento(StatusItemRecebimento.OK);
        ItemRecebidoDTO dtoAtivo = itemDto(11L, 5, 10.0);
        dtoAtivo.setStatusRecebimento(StatusItemRecebimento.OK);

        service.processarRecebimento(1L, recebimentoDto(dtoRetornado, dtoAtivo));

        // Item retornado não pode receber quantidade nem status novos.
        assertThat(retornado.getQuantidadeReal()).isZero();
        assertThat(retornado.getStatusRecebimento()).isNull();
        assertThat(retornado.getValorUnitarioReal()).isNull();

        // Item ativo recebe normalmente e o pedido é entregue com sucesso
        // (o item retornado não gera pendência artificial).
        assertThat(ativo.getQuantidadeReal()).isEqualTo(5);
        assertThat(ativo.getValorUnitarioReal()).isEqualTo(10.0);
        assertThat(pedido.getStatus()).isEqualTo(StatusPedido.ENTREGUE_SUCESSO);
    }

    @Test
    void todosItensRetornadosEncerramPedidoComoEntregueComFalta() {
        ItemPedido retornado = novoItem(10L, 10, 5.0);
        retornado.setRetornadoCotacao(true);
        retornado.setStatusRecebimento(StatusItemRecebimento.FALTANTE);

        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, retornado);
        pedido.setValorTotalPedido(0.0); // valor já abatido no retorno
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        mockarSalvamento();

        service.processarRecebimento(1L, recebimentoDto());

        assertThat(pedido.getStatus()).isEqualTo(StatusPedido.ENTREGUE_COM_FALTA);
    }

    @Test
    void itemNaoEntreguePermaneceNoPedidoMarcadoEReativaCotacao() {
        ItemCotacao itemCotacao = new ItemCotacao();
        itemCotacao.setExcluido(true);
        itemCotacao.setCotacao(new Cotacao());

        ItemPedido item = novoItem(10L, 10, 5.0);
        item.setItemCotacao(itemCotacao);

        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        ItemRecebidoDTO dtoItem = itemDto(10L, 0, null); // nada recebido, sem destino
        ReceberPedidoRequestDTO dto = recebimentoDto(dtoItem);
        dto.setAcaoItensFaltantes("RETORNAR_COTACAO");

        service.processarRecebimento(1L, dto);

        // Permanece no pedido, marcado como não entregue.
        assertThat(pedido.getItens()).hasSize(1);
        assertThat(pedido.getItens().get(0)).isSameAs(item);
        assertThat(item.getRetornadoCotacao()).isTrue();
        assertThat(item.getStatusRecebimento()).isEqualTo(StatusItemRecebimento.FALTANTE);
        assertThat(item.getObservacaoDevolucao()).contains("Não entregue");
        // Vínculo com a cotação de origem preservado e item reativado na cotação.
        assertThat(item.getItemCotacao()).isSameAs(itemCotacao);
        assertThat(itemCotacao.getExcluido()).isFalse();
        assertThat(itemCotacao.getMotivoRetorno()).isNotBlank();
        verify(itemCotacaoRepository).save(itemCotacao);
        // Histórico preservado: nada é apagado.
        verify(itemPedidoRepository, never()).delete(any(ItemPedido.class));
        // Valor do item não recebido abatido do total do pedido.
        assertThat(pedido.getValorTotalPedido()).isEqualTo(0.0);
        assertThat(pedido.getStatus()).isEqualTo(StatusPedido.ENTREGUE_COM_FALTA);
    }

    // ------------------------------------------- Ajuste 2: fracionamento de valores

    @Test
    void fracionamentoComTotalEquivalenteNaoGeraDivergenciaDeValores() {
        // Previsto: 10 un × R$ 10,00 = R$ 100,00.
        // Recebido fracionado: 20 un × R$ 5,00 = R$ 100,00.
        ItemPedido item = novoItem(10L, 10, 10.0);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        ItemRecebidoDTO dtoItem = itemDto(10L, 20, 5.0);
        dtoItem.setStatusRecebimento(StatusItemRecebimento.OK);

        service.processarRecebimento(1L, recebimentoDto(dtoItem));

        assertThat(item.getQuantidadeReal()).isEqualTo(20);
        assertThat(item.getValorUnitarioReal()).isEqualTo(5.0);
        assertThat(pedido.getStatus()).isEqualTo(StatusPedido.ENTREGUE_SUCESSO);
    }

    @Test
    void divergenciaRealDeValoresContinuaSinalizada() {
        // Previsto: 10 un × R$ 10,00 = R$ 100,00; recebido: 10 un × R$ 12,00 = R$ 120,00.
        ItemPedido item = novoItem(10L, 10, 10.0);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        ItemRecebidoDTO dtoItem = itemDto(10L, 10, 12.0);
        dtoItem.setStatusRecebimento(StatusItemRecebimento.OK);

        service.processarRecebimento(1L, recebimentoDto(dtoItem));

        assertThat(pedido.getStatus()).isEqualTo(StatusPedido.VALORES_INCOMPATIVEIS);
    }

    @Test
    void conferenciaParcialNaoPersisteValorUnitarioDoConferente() {
        ItemPedido item = novoItem(10L, 10, 10.0);
        Pedido pedido = novoPedido(StatusPedido.PENDENTE_ENTREGA, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        // Mesmo que a chamada direta envie valor, o Conferente não grava finanças.
        ItemRecebidoDTO dtoItem = itemDto(10L, 50, 2.0);
        ReceberPedidoRequestDTO dto = recebimentoDto(dtoItem);
        dto.setNumeroNota("NF-777");

        Pedido salvo = service.salvarConferenciaParcial(1L, dto, "Conferente Teste", "conferente");

        assertThat(item.getQuantidadeReal()).isEqualTo(50);
        assertThat(item.getValorUnitarioReal()).isNull();
        // Conferência física encerrada e NF registrada, aguardando o financeiro.
        assertThat(salvo.getStatus()).isEqualTo(StatusPedido.CONFERENCIA_INICIADA);
        assertThat(salvo.getNumeroNota()).isEqualTo("NF-777");
        assertThat(salvo.getConferenciaIniciadaPor()).isEqualTo("Conferente Teste");
        assertThat(salvo.getConferenciaFinalizadaPor()).isNull();
        assertThat(salvo.getConferenciaFisicaFinalizada()).isTrue();
        assertThat(salvo.getDataFinalizacaoConferenciaFisica()).isNotNull();
        assertThat(salvo.getConferenciaFisicaFinalizadaPor()).isEqualTo("Conferente Teste");
        assertThat(salvo.getConferenciaEdicaoLiberada()).isFalse();
    }

    @Test
    void conferenciaParcialDoAdminPersisteValorUnitario() {
        ItemPedido item = novoItem(10L, 10, 10.0);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        ItemRecebidoDTO dtoItem = itemDto(10L, 10, 12.5);
        Pedido salvo = service.salvarConferenciaParcial(
                1L, recebimentoDto(dtoItem), "ADM Teste", "admin", true);

        assertThat(item.getValorUnitarioReal()).isEqualTo(12.5);
        // O ADM ainda finaliza pelo fluxo financeiro; a trava física é do Conferente.
        assertThat(salvo.getConferenciaFisicaFinalizada()).isFalse();
    }

    @Test
    void conferenciaParcialIgnoraItemRetornadoParaCotacao() {
        ItemPedido retornado = novoItem(10L, 10, 5.0);
        retornado.setRetornadoCotacao(true);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, retornado);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(retornado));
        mockarSalvamento();

        ItemRecebidoDTO dtoItem = itemDto(10L, 10, 5.0);
        service.salvarConferenciaParcial(1L, recebimentoDto(dtoItem), "Conferente Teste", "conferente");

        assertThat(retornado.getQuantidadeReal()).isZero();
        assertThat(retornado.getValorUnitarioReal()).isNull();
        assertThat(retornado.getStatusRecebimento()).isNull();
    }

    // ------------------------------------- Trava da conferência física / liberação

    @Test
    void conferenciaFisicaFinalizadaBloqueiaNovoSalvamentoDoConferente() {
        ItemPedido item = novoItem(10L, 10, 10.0);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, item);
        pedido.setConferenciaFisicaFinalizada(true);
        pedido.setConferenciaEdicaoLiberada(false);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));

        assertThatThrownBy(() -> service.salvarConferenciaParcial(
                1L, recebimentoDto(itemDto(10L, 5, null)), "Conferente Teste", "conferente"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("liberar");
    }

    @Test
    void admLiberaEdicaoEPermiteConferenteCorrigir() {
        ItemPedido item = novoItem(10L, 10, 10.0);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, item);
        pedido.setConferenciaFisicaFinalizada(true);
        pedido.setConferenciaEdicaoLiberada(false);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        Pedido liberado = service.liberarEdicaoConferencia(1L, "ADM Teste", "admin");
        assertThat(liberado.getConferenciaEdicaoLiberada()).isTrue();
        assertThat(liberado.getConferenciaEdicaoLiberadaPor()).isEqualTo("ADM Teste");
        assertThat(liberado.getConferenciaEdicaoLiberadaEm()).isNotNull();

        Pedido salvo = service.salvarConferenciaParcial(
                1L, recebimentoDto(itemDto(10L, 5, null)), "Conferente Teste", "conferente");

        // Depois de corrigir, o pedido volta a aguardar o financeiro e a
        // liberação é consumida.
        assertThat(salvo.getConferenciaFisicaFinalizada()).isTrue();
        assertThat(salvo.getConferenciaEdicaoLiberada()).isFalse();
        assertThat(salvo.getConferenciaEdicaoLiberadaEm()).isNull();
        assertThat(item.getQuantidadeReal()).isEqualTo(5);
    }

    @Test
    void liberarEdicaoExigeConferenciaFisicaFinalizada() {
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, novoItem(10L, 10, 10.0));
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));

        assertThatThrownBy(() -> service.liberarEdicaoConferencia(1L, "ADM Teste", "admin"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("ainda não foi finalizada");
    }

    // --------------------------------------------------- Conversão de quantidades

    @Test
    void conversaoMultiplicarCalculaQuantidadeEsperadaNoBackend() {
        ItemPedido item = novoItem(10L, 2, 50.0);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        ItemRecebidoDTO dtoItem = itemDtoComConversao(10L, 20, null, 10, "MULTIPLICAR");
        service.salvarConferenciaParcial(1L, recebimentoDto(dtoItem), "Conferente Teste", "conferente");

        assertThat(item.getFatorConversao()).isEqualTo(10);
        assertThat(item.getSentidoConversao()).isEqualTo("MULTIPLICAR");
        assertThat(item.getQuantidadeEsperada()).isEqualTo(20);
        assertThat(item.getQuantidadeReal()).isEqualTo(20);
        // Conferente segue sem gravar valor financeiro.
        assertThat(item.getValorUnitarioReal()).isNull();
    }

    @Test
    void conversaoDividirCalculaQuantidadeEsperadaNoBackend() {
        ItemPedido item = novoItem(10L, 10, 10.0);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        ItemRecebidoDTO dtoItem = itemDtoComConversao(10L, 2, null, 5, "DIVIDIR");
        service.salvarConferenciaParcial(1L, recebimentoDto(dtoItem), "Conferente Teste", "conferente");

        assertThat(item.getFatorConversao()).isEqualTo(5);
        assertThat(item.getSentidoConversao()).isEqualTo("DIVIDIR");
        assertThat(item.getQuantidadeEsperada()).isEqualTo(2);
        assertThat(item.getQuantidadeReal()).isEqualTo(2);
    }

    @Test
    void conversaoDividirRejeitaDivisaoNaoExata() {
        ItemPedido item = novoItem(10L, 10, 10.0);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));

        ItemRecebidoDTO dtoItem = itemDtoComConversao(10L, 3, null, 3, "DIVIDIR");

        assertThatThrownBy(() -> service.salvarConferenciaParcial(
                1L, recebimentoDto(dtoItem), "Conferente Teste", "conferente"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("divisível");
    }

    @Test
    void conversaoNaoAcumulaAoSalvarNovamente() {
        ItemPedido item = novoItem(10L, 2, 50.0);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        ItemRecebidoDTO dtoItem = itemDtoComConversao(10L, 20, null, 10, "MULTIPLICAR");
        service.salvarConferenciaParcial(1L, recebimentoDto(dtoItem), "ADM Teste", "admin", true);
        service.salvarConferenciaParcial(1L, recebimentoDto(dtoItem), "ADM Teste", "admin", true);

        // A conversão é sempre recalculada a partir da quantidade pedida.
        assertThat(item.getQuantidadeEsperada()).isEqualTo(20);
    }

    @Test
    void processarRecebimentoUsaQuantidadeEsperadaDaConversao() {
        ItemPedido item = novoItem(10L, 2, 50.0);
        item.setFatorConversao(10);
        item.setSentidoConversao("MULTIPLICAR");
        item.setQuantidadeEsperada(20);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        // Valor real por unidade física: R$ 5,00 (pacote de R$ 50,00 com 10 un).
        ItemRecebidoDTO dtoItem = itemDto(10L, 20, 5.0);
        dtoItem.setStatusRecebimento(StatusItemRecebimento.OK);

        service.processarRecebimento(1L, recebimentoDto(dtoItem));

        assertThat(item.getQuantidadeReal()).isEqualTo(20);
        assertThat(pedido.getStatus()).isEqualTo(StatusPedido.ENTREGUE_SUCESSO);
    }

    @Test
    void processarRecebimentoAplicaConversaoEnviadaNaFinalizacao() {
        // ADM pode converter diretamente na finalização, sem conferência física anterior.
        ItemPedido item = novoItem(10L, 2, 50.0);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        ItemRecebidoDTO dtoItem = itemDtoComConversao(10L, 20, 5.0, 10, "MULTIPLICAR");
        dtoItem.setStatusRecebimento(StatusItemRecebimento.OK);

        service.processarRecebimento(1L, recebimentoDto(dtoItem));

        assertThat(item.getFatorConversao()).isEqualTo(10);
        assertThat(item.getSentidoConversao()).isEqualTo("MULTIPLICAR");
        assertThat(item.getQuantidadeEsperada()).isEqualTo(20);
        assertThat(item.getQuantidadeReal()).isEqualTo(20);
        assertThat(pedido.getStatus()).isEqualTo(StatusPedido.ENTREGUE_SUCESSO);
    }

    // ------------------------------------------------ Produtos não solicitados

    @Test
    void conferenciaParcialGravaItensNaoSolicitadosNaMesmaTransacao() {
        ItemPedido item = novoItem(10L, 10, 10.0);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        ReceberPedidoRequestDTO dto = recebimentoDto(itemDto(10L, 10, null));
        dto.setItensNaoSolicitados(new ArrayList<>(List.of(
                extra("Produto Extra A", 3, "7891234567890"),
                extra("Produto Extra B", 2, "7891234567891")
        )));

        service.salvarConferenciaParcial(1L, dto, "Conferente Teste", "conferente");

        assertThat(pedido.getItens()).hasSize(3);
        ItemPedido extraA = pedido.getItens().get(1);
        assertThat(extraA.getNomeProduto()).isEqualTo("Produto Extra A");
        assertThat(extraA.getQuantidadeReal()).isEqualTo(3);
        assertThat(extraA.getQuantidadeEsperada()).isEqualTo(3);
        assertThat(extraA.getValorUnitarioReal()).isNull();
        assertThat(extraA.getStatusRecebimento()).isEqualTo(StatusItemRecebimento.OK);
        verify(itemPedidoRepository, org.mockito.Mockito.atLeast(3)).save(any(ItemPedido.class));
    }

    @Test
    void itensNaoSolicitadosDuplicadosSaoRejeitadosAntesDeGravar() {
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, novoItem(10L, 10, 10.0));
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));

        ReceberPedidoRequestDTO dto = recebimentoDto();
        dto.setItensNaoSolicitados(new ArrayList<>(List.of(
                extra("Dipirona 500mg", 1, "7891234567890"),
                extra("dipirona 500mg", 2, "")
        )));

        assertThatThrownBy(() -> service.salvarConferenciaParcial(
                1L, dto, "Conferente Teste", "conferente"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("duplicados");

        assertThat(pedido.getItens()).hasSize(1);
    }

    @Test
    void itemNaoSolicitadoDuplicadoDeExtraExistenteSaoRejeitado() {
        ItemPedido existente = novoItem(20L, 0, 0.0);
        existente.setNomeProduto("Dipirona 500mg");
        existente.setItemCotacao(null);
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, novoItem(10L, 10, 10.0), existente);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));

        ReceberPedidoRequestDTO dto = recebimentoDto();
        dto.setItensNaoSolicitados(new ArrayList<>(List.of(extra("DIPIRONA 500MG", 1, ""))));

        assertThatThrownBy(() -> service.salvarConferenciaParcial(
                1L, dto, "Conferente Teste", "conferente"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("duplicados");
    }

    @Test
    void adicionarItensNaoSolicitadosRespeitaTravaDoConferente() {
        Pedido pedido = novoPedido(StatusPedido.CONFERENCIA_INICIADA, novoItem(10L, 10, 10.0));
        pedido.setConferenciaFisicaFinalizada(true);
        pedido.setConferenciaEdicaoLiberada(false);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));

        assertThatThrownBy(() -> service.adicionarItensNaoSolicitados(
                1L, List.of(extra("Produto Extra", 1, "")), true))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("liberar");
    }

    // ------------------------------------------------------- Ajuste 1: número da NF

    @Test
    void recebimentoExigeNumeroDaNota() {
        when(pedidoRepository.findById(1L))
                .thenReturn(Optional.of(novoPedido(StatusPedido.CONFERENCIA_INICIADA)));

        ReceberPedidoRequestDTO dto = recebimentoDto();
        dto.setNumeroNota("   ");

        assertThatThrownBy(() -> service.processarRecebimento(1L, dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("NF");
    }

    @Test
    void conferenciaParcialRegistraNotaSemFinalizar() {
        ItemPedido item = novoItem(10L, 10, 10.0);
        Pedido pedido = novoPedido(StatusPedido.CONFIRMADO_FORNECEDOR, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        ReceberPedidoRequestDTO dto = recebimentoDto(itemDto(10L, 4, 10.0));
        dto.setNumeroNota("NF-2026-01");

        Pedido salvo = service.salvarConferenciaParcial(1L, dto, "Conferente Teste", "conferente");

        assertThat(salvo.getNumeroNota()).isEqualTo("NF-2026-01");
        assertThat(salvo.getStatus()).isEqualTo(StatusPedido.CONFERENCIA_INICIADA);
        assertThat(salvo.getConferenciaFinalizadaPor()).isNull();
    }
}
