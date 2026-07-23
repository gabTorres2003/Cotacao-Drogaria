package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.request.SalvarPrecoDTO;
import com.drogaria.cotacao.dto.request.SalvarRespostaFornecedorRequestDTO;
import com.drogaria.cotacao.dto.request.SugestaoPromocaoDTO;
import com.drogaria.cotacao.dto.response.ItemComparativoDTO;
import com.drogaria.cotacao.dto.response.SugestaoPromocaoResponseDTO;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.CotacaoFornecedor;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.model.PrecoCotacao;
import com.drogaria.cotacao.model.SugestaoPromocao;
import com.drogaria.cotacao.repository.CotacaoFornecedorRepository;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.repository.ItemCotacaoRepository;
import com.drogaria.cotacao.repository.PrecoCotacaoRepository;
import com.drogaria.cotacao.repository.SugestaoPromocaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    @Autowired
    private SugestaoPromocaoRepository sugestaoPromocaoRepository;
    @Autowired
    private CotacaoFornecedorRepository cotacaoFornecedorRepository;

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
            
            linha.setEstoque(item.getEstoque());
            linha.setGrupo(item.getGrupo());
            linha.setVendidoNoMes(item.getVendidoNoMes());
            linha.setUltCompraData(item.getUltCompraData() != null ? item.getUltCompraData().format(formatter) : null);
            linha.setUltCompraQtde(item.getUltCompraQtde());
            linha.setUltVendaData(item.getUltVendaData() != null ? item.getUltVendaData().format(formatter) : null);
            linha.setVendidoAposUltCompra(item.getVendidoAposUltCompra());
            linha.setUltimoPreco(item.getUltimoPreco());

            List<PrecoCotacao> ofertas = ofertasPorItem.getOrDefault(item.getId(), new ArrayList<>());

            for (PrecoCotacao oferta : ofertas) {
                if (oferta.getFornecedor() != null) {
                    String nomeForn = oferta.getFornecedor().getNome();
                    linha.getPrecosPorFornecedor().put(nomeForn, oferta.getPrecoOfertado());

                    if (oferta.getProdutoSubstituto() != null && !oferta.getProdutoSubstituto().trim().isEmpty()) {
                        linha.getSubstitutosPorFornecedor().put(nomeForn, oferta.getProdutoSubstituto().trim());
                        linha.getPrecosSubstitutosPorFornecedor().put(nomeForn, oferta.getPrecoSubstituto());
                        linha.getQtdsSubstitutosPorFornecedor().put(nomeForn, oferta.getQuantidadeSubstituto());
                    }
                    if (oferta.getObservacao() != null && !oferta.getObservacao().trim().isEmpty()) {
                        linha.getObservacoesPorFornecedor().put(nomeForn, oferta.getObservacao().trim());
                    }
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

    public List<SugestaoPromocaoResponseDTO> listarSugestoesDaCotacao(Long idCotacao) {
        List<SugestaoPromocao> sugestoes = sugestaoPromocaoRepository.findByCotacaoId(idCotacao);
        return sugestoes.stream().map(s -> {
            SugestaoPromocaoResponseDTO dto = new SugestaoPromocaoResponseDTO();
            dto.setId(s.getId());
            dto.setFornecedorNome(s.getFornecedor().getNome());
            dto.setNomeProduto(s.getNomeProduto());
            dto.setPreco(s.getPreco());
            dto.setQtdMinima(s.getQtdMinima());
            dto.setObservacao(s.getObservacao());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void salvarPrecos(List<SalvarPrecoDTO> precosDtos) {
        if (precosDtos == null || precosDtos.isEmpty()) return;

        Cotacao cotacaoAlvo = null;

        for (SalvarPrecoDTO dto : precosDtos) {
            ItemCotacao item = itemRepository.findById(dto.getIdItem())
                .orElseThrow(() -> new RuntimeException("Item não encontrado: " + dto.getIdItem()));
                
            Fornecedor fornecedor = fornecedorRepository.findById(dto.getIdFornecedor())
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado: " + dto.getIdFornecedor()));

            PrecoCotacao preco = new PrecoCotacao();
            preco.setItem(item);
            preco.setFornecedor(fornecedor);
            preco.setPrecoOfertado(dto.getPreco());
            preco.setDataResposta(LocalDateTime.now()); 
            preco.setQuantidadeDisponivel(dto.getQuantidadeDisponivel());
            preco.setObservacao(dto.getObservacao()); 
            preco.setProdutoSubstituto(dto.getProdutoSubstituto());
            preco.setPrecoSubstituto(dto.getPrecoSubstituto());
            preco.setQuantidadeSubstituto(dto.getQuantidadeSubstituto());
            
            precoRepository.save(preco);

            if (cotacaoAlvo == null && item.getCotacao() != null) {
                cotacaoAlvo = item.getCotacao();
            }
        }

        if (cotacaoAlvo != null) {
            cotacaoAlvo.setStatus("RESPONDIDA_PARCIALMENTE");
            cotacaoRepository.save(cotacaoAlvo);
        }
    }

    @Transactional
    public void salvarRespostasFornecedor(SalvarRespostaFornecedorRequestDTO request) {
        if (request == null || request.getCotacaoId() == null || request.getFornecedorId() == null) {
            throw new IllegalArgumentException("Identificadores da cotação e do fornecedor são obrigatórios.");
        }

        Cotacao cotacao = cotacaoRepository.findById(request.getCotacaoId())
                .orElseThrow(() -> new RuntimeException("Cotação não encontrada: " + request.getCotacaoId()));

        Fornecedor fornecedor = fornecedorRepository.findById(request.getFornecedorId())
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado: " + request.getFornecedorId()));

        List<ItemCotacao> itensCotacao = itemRepository.findByCotacao(cotacao);
        if (!itensCotacao.isEmpty()) {
            List<PrecoCotacao> precosAntigos = precoRepository.findByFornecedorAndItemIn(fornecedor, itensCotacao);
            if (!precosAntigos.isEmpty()) {
                precoRepository.deleteAll(precosAntigos);
            }
        }
        
        List<SugestaoPromocao> sugestoesAntigas = sugestaoPromocaoRepository.findByCotacaoIdAndFornecedorId(request.getCotacaoId(), request.getFornecedorId());
        if (!sugestoesAntigas.isEmpty()) {
            sugestaoPromocaoRepository.deleteAll(sugestoesAntigas);
        }

        boolean possuiItens = request.getItens() != null && !request.getItens().isEmpty();
        boolean possuiSugestoes = request.getSugestoes() != null && !request.getSugestoes().isEmpty();

        if (possuiItens) {
            for (SalvarPrecoDTO dto : request.getItens()) {
                ItemCotacao item = itemRepository.findById(dto.getIdItem())
                        .orElseThrow(() -> new RuntimeException("Item da cotação não encontrado: " + dto.getIdItem()));

                if (dto.getPreco() == null) {
                    throw new IllegalArgumentException("O preço do produto '" + item.getNomeProduto() + "' não pode ser nulo.");
                }

                PrecoCotacao preco = new PrecoCotacao();
                preco.setItem(item);
                preco.setFornecedor(fornecedor);
                preco.setPrecoOfertado(dto.getPreco());
                preco.setQuantidadeDisponivel(dto.getQuantidadeDisponivel());
                preco.setObservacao(dto.getObservacao());
                
                preco.setProdutoSubstituto(dto.getProdutoSubstituto());
                preco.setPrecoSubstituto(dto.getPrecoSubstituto());
                preco.setQuantidadeSubstituto(dto.getQuantidadeSubstituto());
                
                preco.setDataResposta(LocalDateTime.now());

                precoRepository.save(preco);
            }
        }

        if (possuiSugestoes) {
            for (SugestaoPromocaoDTO sugDto : request.getSugestoes()) {
                if (sugDto.getNomeProduto() == null || sugDto.getNomeProduto().trim().isEmpty()) {
                    throw new IllegalArgumentException("O nome do produto em promoção é obrigatório.");
                }

                SugestaoPromocao sugestao = new SugestaoPromocao();
                sugestao.setCotacao(cotacao);
                sugestao.setFornecedor(fornecedor);
                sugestao.setNomeProduto(sugDto.getNomeProduto().trim());
                sugestao.setPreco(sugDto.getPreco());
                sugestao.setQtdMinima(sugDto.getQtdMinima());
                sugestao.setObservacao(sugDto.getObservacao());

                sugestaoPromocaoRepository.save(sugestao);
            }
        }

        CotacaoFornecedor cotacaoFornecedor = cotacaoFornecedorRepository.findByCotacaoIdAndFornecedorId(request.getCotacaoId(), request.getFornecedorId())
                .orElse(null);
        if (cotacaoFornecedor != null) {
            cotacaoFornecedor.setStatus("RESPONDIDA");
            cotacaoFornecedorRepository.save(cotacaoFornecedor);
        }

        List<CotacaoFornecedor> todosVinculos = cotacaoFornecedorRepository.findByCotacaoId(cotacao.getId());
        boolean todosResponderam = true;
        
        for (CotacaoFornecedor cf : todosVinculos) {
            if (!"RESPONDIDA".equals(cf.getStatus())) {
                todosResponderam = false;
                break;
            }
        }

        if (todosResponderam && !todosVinculos.isEmpty()) {
            cotacao.setStatus("FINALIZADA");
        } else {
            cotacao.setStatus("RESPONDIDA_PARCIALMENTE");
        }
        
        cotacaoRepository.save(cotacao);
    }
}