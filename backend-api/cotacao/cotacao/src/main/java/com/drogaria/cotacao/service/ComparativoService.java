package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.request.SalvarPrecoDTO;
import com.drogaria.cotacao.dto.response.ItemComparativoDTO;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.model.PrecoCotacao;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.repository.ItemCotacaoRepository;
import com.drogaria.cotacao.repository.PrecoCotacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ComparativoService {

    @Autowired
    private CotacaoRepository cotacaoRepository; 
    @Autowired
    private ItemCotacaoRepository itemRepository; 
    @Autowired
    private PrecoCotacaoRepository precoRepository;
    @Autowired
    private FornecedorRepository fornecedorRepository; 

    public List<ItemComparativoDTO> compararPrecos(Long idCotacao) {
        List<ItemComparativoDTO> relatorio = new ArrayList<>();

        Cotacao cotacao = cotacaoRepository.findById(idCotacao)
                .orElseThrow(() -> new RuntimeException("Cotação não encontrada"));

        List<ItemCotacao> itens = itemRepository.findByCotacao(cotacao);
        
        if (itens.isEmpty()) {
            return relatorio;
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        List<PrecoCotacao> todasOfertas = precoRepository.findByItemIn(itens);
        
        Map<Long, List<PrecoCotacao>> ofertasPorItem = todasOfertas.stream()
                .collect(Collectors.groupingBy(preco -> preco.getItem().getId()));

        List<String> nomesProdutos = itens.stream()
                .map(ItemCotacao::getNomeProduto)
                .distinct()
                .collect(Collectors.toList());
                
        List<PrecoCotacao> todoHistorico = precoRepository.findHistoricoEmLote(nomesProdutos);
        Map<String, List<PrecoCotacao>> historicoPorProduto = todoHistorico.stream()
                .collect(Collectors.groupingBy(preco -> preco.getItem().getNomeProduto()));

        for (ItemCotacao item : itens) {
            ItemComparativoDTO linha = new ItemComparativoDTO();
            linha.setIdItem(item.getId());
            linha.setNomeProduto(item.getNomeProduto());
            linha.setQuantidade(item.getQuantidade());

            List<PrecoCotacao> ofertas = ofertasPorItem.getOrDefault(item.getId(), new ArrayList<>());

            for (PrecoCotacao oferta : ofertas) {
                if (oferta.getFornecedor() != null) {
                    linha.getPrecosPorFornecedor().put(oferta.getFornecedor().getNome(), oferta.getPrecoOfertado());
                }
            }

            double menorPreco = Double.MAX_VALUE;
            String nomeVencedor = "Sem ofertas";

            for (Map.Entry<String, Double> entry : linha.getPrecosPorFornecedor().entrySet()) {
                double precoAtual = entry.getValue();
                if (precoAtual > 0 && precoAtual < menorPreco) {
                    menorPreco = precoAtual;
                    nomeVencedor = entry.getKey();
                }
            }

            if (menorPreco != Double.MAX_VALUE) {
                linha.setMenorPrecoEncontrado(menorPreco);
                linha.setFornecedorVencedor(nomeVencedor);
            }

            List<PrecoCotacao> historico = historicoPorProduto.getOrDefault(item.getNomeProduto(), new ArrayList<>());
            
            for (PrecoCotacao precoAntigo : historico) {
                if (!precoAntigo.getItem().getCotacao().getId().equals(idCotacao)) {
                    linha.setUltimoPrecoComprado(precoAntigo.getPrecoOfertado());
                    
                    if (precoAntigo.getDataResposta() != null) {
                        linha.setDataUltimaCompra(precoAntigo.getDataResposta().format(formatter));
                    } else {
                        linha.setDataUltimaCompra("Data indisponível");
                    }
                    break; 
                }
            }

            relatorio.add(linha);
        }
        return relatorio;
    }

    public List<ItemComparativoDTO> listarItensParaCotacao(Long idCotacao) {
        Cotacao cotacao = cotacaoRepository.findById(idCotacao)
                .orElseThrow(() -> new RuntimeException("Cotação não encontrada"));
        
        return cotacao.getItens().stream().map(item -> {
            ItemComparativoDTO dto = new ItemComparativoDTO();
            dto.setIdItem(item.getId()); 
            dto.setNomeProduto(item.getNomeProduto());
            dto.setQuantidade(item.getQuantidade());
            return dto;
        }).collect(Collectors.toList());
    }

    public void salvarPrecos(List<SalvarPrecoDTO> precosDtos) {
        for (SalvarPrecoDTO dto : precosDtos) {
            // Busca o item e o fornecedor no banco
            ItemCotacao item = itemRepository.findById(dto.getIdItem())
                .orElseThrow(() -> new RuntimeException("Item não encontrado: " + dto.getIdItem()));
                
            Fornecedor fornecedor = fornecedorRepository.findById(dto.getIdFornecedor())
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado: " + dto.getIdFornecedor()));

            // Cria o registro do preço
            PrecoCotacao preco = new PrecoCotacao();
            preco.setItem(item);
            preco.setFornecedor(fornecedor);
            preco.setPrecoOfertado(dto.getPreco());
            preco.setDataResposta(LocalDateTime.now()); 
            preco.setQuantidadeDisponivel(dto.getQuantidadeDisponivel());
            
            // Salva no banco
            precoRepository.save(preco);
        }
    }
}