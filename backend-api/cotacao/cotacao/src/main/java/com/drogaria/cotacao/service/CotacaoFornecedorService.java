package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.CotacaoFornecedor;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.repository.CotacaoFornecedorRepository;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.FornecedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CotacaoFornecedorService {

    private final CotacaoFornecedorRepository repository;
    private final CotacaoRepository cotacaoRepository;
    private final FornecedorRepository fornecedorRepository;

    public void vincularFornecedores(Long cotacaoId, List<Long> fornecedorIds) {
        Cotacao cotacao = cotacaoRepository.findById(cotacaoId)
                .orElseThrow(() -> new RuntimeException("Cotação não encontrada"));
                
        for (Long fId : fornecedorIds) {
            Fornecedor f = fornecedorRepository.findById(fId).orElseThrow();
            CotacaoFornecedor cf = new CotacaoFornecedor();
            cf.setCotacao(cotacao);
            cf.setFornecedor(f);
            cf.setStatus("PENDENTE");
            repository.save(cf);
        }
    }

    public List<CotacaoFornecedor> listarPorFornecedor(String loginFornecedor) {
        return repository.findByFornecedorLogin(loginFornecedor);
    }
}