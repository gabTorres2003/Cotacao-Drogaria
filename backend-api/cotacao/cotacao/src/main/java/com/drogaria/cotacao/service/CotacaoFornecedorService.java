package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.CotacaoFornecedor;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.repository.CotacaoFornecedorRepository;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.FornecedorRepository;
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
}