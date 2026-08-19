package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.CotacaoFornecedor;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.PrecoCotacao;
import com.drogaria.cotacao.model.SugestaoPromocao;
import com.drogaria.cotacao.repository.CotacaoFornecedorRepository;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.repository.PrecoCotacaoRepository;
import com.drogaria.cotacao.repository.SugestaoPromocaoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CotacaoFornecedorService {

    private final CotacaoFornecedorRepository repository;
    private final CotacaoRepository cotacaoRepository;
    private final FornecedorRepository fornecedorRepository;
    private final PrecoCotacaoRepository precoCotacaoRepository;
    private final SugestaoPromocaoRepository sugestaoPromocaoRepository;

    @Transactional
    public void vincularFornecedores(Long cotacaoId, List<Long> fornecedorIds) {
        log.info("Iniciando vínculo da cotação ID: {} com os fornecedores: {}", cotacaoId, fornecedorIds);

        if (fornecedorIds == null || fornecedorIds.isEmpty()) {
            log.warn("A lista de fornecedores chegou vazia! Nenhum vínculo será criado no banco.");
            return;
        }

        Cotacao cotacao = cotacaoRepository.findById(cotacaoId)
                .orElseThrow(() -> {
                    log.error("Cotação ID {} não encontrada no banco!", cotacaoId);
                    return new RuntimeException("Cotação não encontrada");
                });
                
        for (Long fId : fornecedorIds) {
            log.info("Buscando fornecedor ID: {}", fId);
            Fornecedor f = fornecedorRepository.findById(fId).orElseThrow(() -> {
                log.error("Fornecedor ID {} não encontrado!", fId);
                return new RuntimeException("Fornecedor não encontrado");
            });

            CotacaoFornecedor cf = new CotacaoFornecedor();
            cf.setCotacao(cotacao);
            cf.setFornecedor(f);
            cf.setStatus("PENDENTE");
            
            repository.save(cf);
            log.info("Vínculo salvo com sucesso no banco para o fornecedor ID: {}", fId);
        }
    }

    public List<CotacaoFornecedor> listarPorFornecedor(String loginFornecedor) {
        return repository.findByFornecedorLogin(loginFornecedor);
    }

    @Transactional
    public void desvincularFornecedor(Long idVinculo) {
        CotacaoFornecedor vinculo = repository.findById(idVinculo)
            .orElseThrow(() -> new RuntimeException("Vínculo não encontrado"));

        Long idCotacao = vinculo.getCotacao().getId();
        Long idFornecedor = vinculo.getFornecedor().getId();

        List<PrecoCotacao> precosDoFornecedor = precoCotacaoRepository.findByItem_Cotacao_IdAndFornecedorId(idCotacao, idFornecedor);
        if (!precosDoFornecedor.isEmpty()) {
            precoCotacaoRepository.deleteAll(precosDoFornecedor);
        }

        List<SugestaoPromocao> sugestoesDoFornecedor = sugestaoPromocaoRepository.findByCotacaoIdAndFornecedorId(idCotacao, idFornecedor);
        if (!sugestoesDoFornecedor.isEmpty()) {
            sugestaoPromocaoRepository.deleteAll(sugestoesDoFornecedor);
        }

        repository.deleteById(idVinculo);
        
        Cotacao cotacao = cotacaoRepository.findById(idCotacao).orElse(null);
        if (cotacao != null && !"FINALIZADA".equals(cotacao.getStatus()) && !"CANCELADA".equals(cotacao.getStatus())) {
            List<CotacaoFornecedor> todosVinculos = repository.findByCotacaoId(idCotacao);
            boolean todosResponderam = true;
            for (CotacaoFornecedor cf : todosVinculos) {
                if (!"RESPONDIDA".equals(cf.getStatus())) {
                    todosResponderam = false;
                    break;
                }
            }
            if (todosVinculos.isEmpty()) {
                cotacao.setStatus("ABERTA");
            } else if (todosResponderam) {
                cotacao.setStatus("RESPONDIDA");
            } else {
                cotacao.setStatus("RESPONDIDA_PARCIALMENTE");
            }
            cotacaoRepository.save(cotacao);
        }

        log.info("Vínculo ID {} removido com sucesso e respostas apagadas.", idVinculo);
    }
}