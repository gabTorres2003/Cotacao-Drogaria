package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.response.ItemComparativoDTO;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.model.PrecoCotacao;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.ItemCotacaoRepository;
import com.drogaria.cotacao.repository.PrecoCotacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ComparativoService {

    @Autowired
    private CotacaoRepository cotacaoRepository; // cotação pai
    @Autowired
    private ItemCotacaoRepository itemRepository; // itens dessa cotação
    @Autowired
    private PrecoCotacaoRepository precoRepository; // respostas dos fornecedores

    public List<ItemComparativoDTO> compararPrecos(Long idCotacao) {
        List<ItemComparativoDTO> relatorio = new ArrayList<>();

        // 1. Busca a Cotação (se não achar, retorna lista vazia ou lança erro)
        Cotacao cotacao = cotacaoRepository.findById(idCotacao)
                .orElseThrow(() -> new RuntimeException("Cotação não encontrada"));

        // 2. Busca os itens dessa cotação.
        List<ItemCotacao> itens = itemRepository.findByCotacao(cotacao);

        // 3. Para cada item, vamos ver quem deu preço
        for (ItemCotacao item : itens) {
            ItemComparativoDTO linha = new ItemComparativoDTO();
            linha.setIdItem(item.getId());
            linha.setNomeProduto(item.getNomeProduto());
            linha.setQuantidade(item.getQuantidade());

            // Busca os preços ofertados para este item.
            List<PrecoCotacao> ofertas = precoRepository.findByItem(item);

            double menorPreco = Double.MAX_VALUE; // Começa com um valor infinito
            String nomeVencedor = "Sem ofertas";

            // 4. Motor de Decisão
            for (PrecoCotacao oferta : ofertas) {
                // Adiciona ao mapa para exibir na tabela depois
                linha.getPrecosPorFornecedor().put(oferta.getFornecedor().getNome(), oferta.getPrecoOfertado());

                // Verifica se é o menor preço até agora
                if (oferta.getPrecoOfertado() < menorPreco) {
                    menorPreco = oferta.getPrecoOfertado();
                    nomeVencedor = oferta.getFornecedor().getNome();
                }
            }

            // Se achou alguém, atualiza o DTO
            if (menorPreco != Double.MAX_VALUE) {
                linha.setMenorPrecoEncontrado(menorPreco);
                linha.setFornecedorVencedor(nomeVencedor);
            }

            relatorio.add(linha);
        }

        return relatorio;
    }
}