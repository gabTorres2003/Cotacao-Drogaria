package com.drogaria.cotacao.service;

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
 * Testes das ajustes de conferência:
 - Ajuste 1: número da NF exigido/registrado antes da finalização da conferência.
 * - Ajuste 2: fracionamento não gera divergência artificial de valores e o valor
 *   unitário informado é persistido na conferência parcial.
 * - Ajuste 4: itens "Não Veio" retornados à cotação permanecem no pedido como
 *   "Não entregue" e não participam mais da conferência.
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

    private static ReceberPedidoRequestDTO recebimentoDto(ItemRecebidoDTO... itens) {
        ReceberPedidoRequestDTO dto = new ReceberPedidoRequestDTO();
        dto.setNumeroNota("NF-12345");
        dto.setItens(new ArrayList<>(List.of(itens)));
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
    void conferenciaParcialPersisteValorUnitarioInformado() {
        ItemPedido item = novoItem(10L, 10, 10.0);
        Pedido pedido = novoPedido(StatusPedido.PENDENTE_ENTREGA, item);
        when(pedidoRepository.findById(1L)).thenReturn(Optional.of(pedido));
        when(itemPedidoRepository.findById(10L)).thenReturn(Optional.of(item));
        mockarSalvamento();

        // Fracionamento: 5 partes de R$ 10,00 = R$ 2,00 com quantidade × 5 = 50 un.
        ItemRecebidoDTO dtoItem = itemDto(10L, 50, 2.0);
        ReceberPedidoRequestDTO dto = recebimentoDto(dtoItem);
        dto.setNumeroNota("NF-777");

        Pedido salvo = service.salvarConferenciaParcial(1L, dto, "Conferente Teste", "conferente");

        assertThat(item.getQuantidadeReal()).isEqualTo(50);
        assertThat(item.getValorUnitarioReal()).isEqualTo(2.0);
        // Conferência iniciada e NF registrada, mas ainda não finalizada.
        assertThat(salvo.getStatus()).isEqualTo(StatusPedido.CONFERENCIA_INICIADA);
        assertThat(salvo.getNumeroNota()).isEqualTo("NF-777");
        assertThat(salvo.getConferenciaIniciadaPor()).isEqualTo("Conferente Teste");
        assertThat(salvo.getConferenciaFinalizadaPor()).isNull();
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
