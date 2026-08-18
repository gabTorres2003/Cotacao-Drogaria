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
import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.model.ItemPedido;
import com.drogaria.cotacao.model.enums.StatusPedido;
import com.drogaria.cotacao.repository.CotacaoFornecedorRepository;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.repository.ItemCotacaoRepository;
import com.drogaria.cotacao.repository.PrecoCotacaoRepository;
import com.drogaria.cotacao.repository.SugestaoPromocaoRepository;
import com.drogaria.cotacao.repository.PedidoRepository;
import com.drogaria.cotacao.repository.ItemPedidoRepository;
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
    @Autowired
    private PedidoRepository pedidoRepository;
    @Autowired
    private ItemPedidoRepository itemPedidoRepository;

    public List<ItemComparativoDTO> compararPrecos(Long idCotacao) {
        List<ItemComparativoDTO> relatorio = new ArrayList<>();

        Cotacao cotacao = cotacaoRepository.findById(idCotacao).orElse(null);
        if (cotacao == null) {
            return new ArrayList<>();
        }

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
            linha.setOrigemItem(item.getOrigemItem());
            
            linha.setEditadoManual(item.getEditadoManual());
            linha.setExcluido(item.getExcluido());
            linha.setDevolvidoPorAlteracaoPreco(item.getDevolvidoPorAlteracaoPreco() != null ? item.getDevolvidoPorAlteracaoPreco() : false);
            linha.setPedidoOrigemId(item.getPedidoOrigemId());

            List<PrecoCotacao> ofertas = ofertasPorItem.getOrDefault(item.getId(), new ArrayList<>());

            for (PrecoCotacao oferta : ofertas) {
                if (oferta.getFornecedor() != null) {
                    String nomeForn = oferta.getFornecedor().getNome();
                    linha.getPrecosPorFornecedor().put(nomeForn, oferta.getPrecoOfertado());

                    if (oferta.getQuantidadeCondicao() != null && oferta.getPrecoCondicao() != null) {
                        linha.getQtdCondicaoPorFornecedor().put(nomeForn, oferta.getQuantidadeCondicao());
                        linha.getPrecoCondicaoPorFornecedor().put(nomeForn, oferta.getPrecoCondicao());
                    }
                    if (oferta.getCondicoesEscalonamento() != null) {
                        linha.getCondicoesEscalonamentoPorFornecedor().put(nomeForn, oferta.getCondicoesEscalonamento());
                    }

                    if (oferta.getProdutoSubstituto() != null && !oferta.getProdutoSubstituto().trim().isEmpty()) {
                        linha.getSubstitutosPorFornecedor().put(nomeForn, oferta.getProdutoSubstituto().trim());
                        linha.getPrecosSubstitutosPorFornecedor().put(nomeForn, oferta.getPrecoSubstituto());
                        linha.getQtdsSubstitutosPorFornecedor().put(nomeForn, oferta.getQuantidadeSubstituto());
                        
                        if (oferta.getQuantidadeCondicaoSubstituto() != null && oferta.getPrecoCondicaoSubstituto() != null) {
                            linha.getQtdCondicaoSubstPorFornecedor().put(nomeForn, oferta.getQuantidadeCondicaoSubstituto());
                            linha.getPrecoCondicaoSubstPorFornecedor().put(nomeForn, oferta.getPrecoCondicaoSubstituto());
                        }
                        if (oferta.getCondicoesEscalonamentoSubstituto() != null) {
                            linha.getCondicoesEscalonamentoSubstPorFornecedor().put(nomeForn, oferta.getCondicoesEscalonamentoSubstituto());
                        }
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
        Cotacao cotacao = cotacaoRepository.findById(idCotacao).orElse(null);
        if (cotacao == null) {
            return new ArrayList<>();
        }
        
        return cotacao.getItens().stream().map(item -> {
            ItemComparativoDTO dto = new ItemComparativoDTO();
            dto.setIdItem(item.getId()); 
            dto.setNomeProduto(item.getNomeProduto());
            dto.setQuantidade(item.getQuantidade());
            dto.setEditadoManual(item.getEditadoManual());
            dto.setExcluido(item.getExcluido());
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
            dto.setQuantidadeCondicao(s.getQuantidadeCondicao());
            dto.setPrecoCondicao(s.getPrecoCondicao());
            dto.setCondicoesEscalonamento(s.getCondicoesEscalonamento());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void salvarPrecos(List<SalvarPrecoDTO> precosDtos) {
        for (SalvarPrecoDTO dto : precosDtos) {
            ItemCotacao item = itemRepository.findById(dto.getIdItem())
                    .orElseThrow(() -> new RuntimeException("Item da cotação não encontrado"));

            Fornecedor fornecedor = fornecedorRepository.findById(dto.getIdFornecedor())
                    .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));

            PrecoCotacao preco = new PrecoCotacao();
            preco.setItem(item);
            preco.setFornecedor(fornecedor);
            preco.setPrecoOfertado(dto.getPreco());
            preco.setQuantidadeDisponivel(dto.getQuantidadeDisponivel());
            preco.setObservacao(dto.getObservacao());
            preco.setProdutoSubstituto(dto.getProdutoSubstituto());
            preco.setPrecoSubstituto(dto.getPrecoSubstituto());
            preco.setQuantidadeSubstituto(dto.getQuantidadeSubstituto());
            
            preco.setQuantidadeCondicao(dto.getQuantidadeCondicao());
            preco.setPrecoCondicao(dto.getPrecoCondicao());
            preco.setQuantidadeCondicaoSubstituto(dto.getQuantidadeCondicaoSubstituto());
            preco.setPrecoCondicaoSubstituto(dto.getPrecoCondicaoSubstituto());
            preco.setCondicoesEscalonamento(dto.getCondicoesEscalonamento());
            preco.setCondicoesEscalonamentoSubstituto(dto.getCondicoesEscalonamentoSubstituto());

            preco.setDataResposta(LocalDateTime.now());
            precoRepository.save(preco);
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

        List<Pedido> pedidosAbertosDoFornecedor = pedidoRepository.findByCotacaoId(cotacao.getId()).stream()
                .filter(p -> p.getFornecedor() != null && p.getFornecedor().getId().equals(fornecedor.getId()))
                .filter(p -> p.getStatus() == StatusPedido.PENDENTE_ENTREGA || p.getStatus() == StatusPedido.CONFIRMADO_FORNECEDOR)
                .collect(Collectors.toList());

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

                PrecoCotacao preco = new PrecoCotacao();
                preco.setItem(item);
                preco.setFornecedor(fornecedor);
                preco.setPrecoOfertado(dto.getPreco());
                preco.setQuantidadeDisponivel(dto.getQuantidadeDisponivel());
                preco.setObservacao(dto.getObservacao());
                preco.setProdutoSubstituto(dto.getProdutoSubstituto());
                preco.setPrecoSubstituto(dto.getPrecoSubstituto());
                preco.setQuantidadeSubstituto(dto.getQuantidadeSubstituto());
                
                preco.setQuantidadeCondicao(dto.getQuantidadeCondicao());
                preco.setPrecoCondicao(dto.getPrecoCondicao());
                preco.setQuantidadeCondicaoSubstituto(dto.getQuantidadeCondicaoSubstituto());
                preco.setPrecoCondicaoSubstituto(dto.getPrecoCondicaoSubstituto());
                preco.setCondicoesEscalonamento(dto.getCondicoesEscalonamento());
                preco.setCondicoesEscalonamentoSubstituto(dto.getCondicoesEscalonamentoSubstituto());

                preco.setDataResposta(LocalDateTime.now());
                precoRepository.save(preco);

                for (Pedido pedido : pedidosAbertosDoFornecedor) {
                    List<ItemPedido> itensParaRemover = new ArrayList<>();
                    
                    for (ItemPedido ip : pedido.getItens()) {
                        if (ip.getItemCotacao() != null && ip.getItemCotacao().getId().equals(item.getId())) {
                            boolean precoPrincipalDiferente = dto.getPreco() != null && !dto.getPreco().equals(ip.getValorUnitarioPedido());
                            boolean precoSubstitutoDiferente = dto.getPrecoSubstituto() == null || !dto.getPrecoSubstituto().equals(ip.getValorUnitarioPedido());
                            
                            if (precoPrincipalDiferente && precoSubstitutoDiferente) {
                                itensParaRemover.add(ip);
                            }
                        }
                    }
                    
                    if (!itensParaRemover.isEmpty()) {
                        for (ItemPedido ipRemover : itensParaRemover) {
                            double qtd = ipRemover.getQuantidadePedida() != null ? ipRemover.getQuantidadePedida() : 0.0;
                            double vlr = ipRemover.getValorUnitarioPedido() != null ? ipRemover.getValorUnitarioPedido() : 0.0;
                            double subtotal = qtd * vlr;
                            
                            pedido.setValorTotalPedido(pedido.getValorTotalPedido() - subtotal);
                            
                            item.setDevolvidoPorAlteracaoPreco(true);
                            item.setPedidoOrigemId(pedido.getId());
                            itemRepository.save(item);

                            ipRemover.setItemCotacao(null);
                            itemPedidoRepository.saveAndFlush(ipRemover);
                            itemPedidoRepository.delete(ipRemover);
                        }
                        pedido.getItens().removeAll(itensParaRemover);
                        pedidoRepository.save(pedido);
                    }
                }
            }
        }

        if (possuiSugestoes) {
            for (SugestaoPromocaoDTO sugDto : request.getSugestoes()) {
                SugestaoPromocao sugestao = new SugestaoPromocao();
                sugestao.setCotacao(cotacao);
                sugestao.setFornecedor(fornecedor);
                sugestao.setNomeProduto(sugDto.getNomeProduto().trim());
                sugestao.setPreco(sugDto.getPreco());
                sugestao.setQtdMinima(sugDto.getQtdMinima());
                sugestao.setObservacao(sugDto.getObservacao());
                sugestao.setQuantidadeCondicao(sugDto.getQuantidadeCondicao());
                sugestao.setPrecoCondicao(sugDto.getPrecoCondicao());
                sugestao.setCondicoesEscalonamento(sugDto.getCondicoesEscalonamento());

                sugestaoPromocaoRepository.save(sugestao);
            }
        }

        List<CotacaoFornecedor> vinculosDoFornecedor = cotacaoFornecedorRepository.findByCotacaoIdAndFornecedorId(request.getCotacaoId(), request.getFornecedorId());
        if (vinculosDoFornecedor != null && !vinculosDoFornecedor.isEmpty()) {
            for (CotacaoFornecedor cf : vinculosDoFornecedor) {
                cf.setStatus("RESPONDIDA");
            }
            cotacaoFornecedorRepository.saveAll(vinculosDoFornecedor);
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
            cotacao.setStatus("RESPONDIDA");
        } else {
            cotacao.setStatus("RESPONDIDA_PARCIALMENTE");
        }
        
        cotacaoRepository.save(cotacao);
    }
}