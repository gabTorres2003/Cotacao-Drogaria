package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.DevolucaoRepository;
import com.drogaria.cotacao.repository.ItemPedidoRepository;
import com.drogaria.cotacao.repository.PedidoRepository;
import com.drogaria.cotacao.repository.SugestaoPromocaoRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Exclusão automática ( definitiva ) de cotações e pedidos antigos.
 *
 * Regra: tudo que foi criado há mais de "limpeza.retencao-dias" (padrão 60)
 * é excluído, independentemente do status. As devoluções financeiras dos
 * pedidos excluídos são preservadas, apenas desvinculadas.
 *
 * O servidor é desligado das 22:00 às 07:30, portanto a limpeza executa:
 * - na abertura do sistema (todo dia que o servidor sobe);
 * - reforço diário às 07:40 (janela em que o servidor está ligado).
 * Desativável via propriedade "limpeza.habilitada=false".
 *
 * Ordem das operações respeita as foreign keys:
 * 1. devoluções.desvincula pedido antigo
 * 2. sugestões de promoção das cotações antigas (FK NOT NULL, sem cascade)
 * 3. pedidos restantes desvinculam cotação antiga
 * 4. itens de pedido restantes desvinculam item de cotação antigo
 * 5. exclusão dos pedidos antigos (cascade: itens e sugestões do pedido)
 * 6. exclusão das cotações antigas (cascade: itens, preços e vínculos)
 */
@Service
@RequiredArgsConstructor
public class LimpezaAutomaticaService {

    private static final Logger log = LoggerFactory.getLogger(LimpezaAutomaticaService.class);

    private final PedidoRepository pedidoRepository;
    private final CotacaoRepository cotacaoRepository;
    private final DevolucaoRepository devolucaoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final SugestaoPromocaoRepository sugestaoPromocaoRepository;

    @Value("${limpeza.retencao-dias:60}")
    private int diasRetencao;

    @Value("${limpeza.habilitada:true}")
    private boolean habilitada;

    /** Na abertura da aplicação (todo dia que o servidor ligar). */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void limpezaNaAbertura() {
        executarComSeguranca("abertura");
    }

    /** Reforço diário às 07:40 (servidor ligado das 07:30 às 22:00). */
    @Scheduled(cron = "0 40 7 * * ?")
    @Transactional
    public void limpezaAgendada() {
        executarComSeguranca("agendada 07:40");
    }

    private void executarComSeguranca(String origem) {
        if (!habilitada) {
            log.info("[Limpeza] Execução ({}) ignorada: limpeza.habilitada=false", origem);
            return;
        }
        try {
            executarLimpeza();
        } catch (Exception e) {
            // Etapas concluídas são mantidas (idempotente); a próxima execução termina o restante.
            log.error("[Limpeza] Falha na limpeza automática ({})", origem, e);
        }
    }

    @Transactional
    public void executarLimpeza() {
        LocalDateTime limite = LocalDateTime.now().minusDays(diasRetencao);
        log.info("[Limpeza] Iniciando exclusão de cotações e pedidos criados antes de {}", limite);

        int devolucoesDesvinculadas = devolucaoRepository.desvincularPedidosAntigos(limite);
        int sugestoesExcluidas = sugestaoPromocaoRepository.excluirPorCotacaoAntiga(limite);
        int pedidosDesvinculados = pedidoRepository.desvincularCotacoesAntigas(limite);
        int itensDesvinculados = itemPedidoRepository.desvincularItemCotacaoAntigo(limite);

        List<Pedido> pedidosAntigos = pedidoRepository.findByDataCriacaoBefore(limite);
        if (!pedidosAntigos.isEmpty()) {
            pedidoRepository.deleteAll(pedidosAntigos);
        }

        List<Cotacao> cotacoesAntigas = cotacaoRepository.findByDataCriacaoBefore(limite);
        if (!cotacoesAntigas.isEmpty()) {
            cotacaoRepository.deleteAll(cotacoesAntigas);
        }

        log.info("[Limpeza] Concluída: {} pedido(s) e {} cotação(ões) excluídos "
                        + "(devoluções desvinculadas: {}, sugestões de promoção excluídas: {}, "
                        + "pedidos desvinculados de cotações: {}, itens desvinculados: {})",
                pedidosAntigos.size(), cotacoesAntigas.size(),
                devolucoesDesvinculadas, sugestoesExcluidas, pedidosDesvinculados, itensDesvinculados);
    }
}
