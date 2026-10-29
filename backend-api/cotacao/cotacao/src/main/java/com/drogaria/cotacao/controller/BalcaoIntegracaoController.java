package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.service.ConsultaDnaBalcaoService;
import com.drogaria.cotacao.service.PesquisaProdutoDnaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Consultas de leitura do DNA consumidas pelo sistema de Atendimento
 * (Balcão) por meio de um gateway servidor-a-servidor.
 *
 * Exige JWT válido do Cotação com perfil ADMIN ou CONFERENTE
 * (ver SecurityConfigurations). Não é um endpoint público e não é
 * chamado diretamente pelo navegador do Balcão.
 */
@RestController
@RequestMapping("/api/integracao-balcao")
public class BalcaoIntegracaoController {

    @Autowired
    private ConsultaDnaBalcaoService consultaDnaBalcaoService;

    @Autowired
    private PesquisaProdutoDnaService pesquisaProdutoDnaService;

    @GetMapping("/produtos")
    public ResponseEntity<?> consultarProduto(@RequestParam("q") String q) {
        String termo = q == null ? "" : q.trim();

        if (termo.isEmpty() || termo.length() > 20) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensagem", "Informe um código de produto ou código de barras válido."));
        }

        try {
            return consultaDnaBalcaoService.consultarProduto(termo)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(404)
                            .body(Map.of("mensagem", "Produto não encontrado no DNA.")));
        } catch (ConsultaDnaBalcaoService.DnaIndisponivelException e) {
            return ResponseEntity.status(503)
                    .body(Map.of("mensagem", "Consulta ao DNA indisponível. Tente novamente em instantes."));
        }
    }

    /**
     * Pesquisa produtos por descrição ou princípio ativo. Retorna uma lista
     * curta ordenada por relevância e o indicador {@code truncado}.
     */
    @GetMapping("/produtos/pesquisa")
    public ResponseEntity<?> pesquisarProdutos(
            @RequestParam("q") String q,
            @RequestParam(value = "tipo", defaultValue = "descricao") String tipo) {
        try {
            return ResponseEntity.ok(pesquisaProdutoDnaService.pesquisar(q, tipo));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensagem", e.getMessage()));
        } catch (PesquisaProdutoDnaService.DnaIndisponivelException e) {
            return ResponseEntity.status(503)
                    .body(Map.of("mensagem", "Consulta ao DNA indisponível. Tente novamente em instantes."));
        }
    }
}
