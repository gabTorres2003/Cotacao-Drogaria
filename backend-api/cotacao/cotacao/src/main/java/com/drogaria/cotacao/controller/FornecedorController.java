package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.SalvarPrecoDTO;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.service.FornecedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.utils.TelefoneUtils;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import java.util.List;

@RestController
@RequestMapping("/api/fornecedor")
public class FornecedorController {

    @Autowired
    private FornecedorService fornecedorService;

    // criar fornecedores de teste
    @PostMapping("/criar")
    public ResponseEntity<Fornecedor> criarFornecedor(@RequestParam String nome, @RequestParam String email, @RequestParam String telefone) {
        return ResponseEntity.ok(fornecedorService.criarFornecedor(nome, email, telefone));
    }

    // simula o fornecedor preenchendo a planilha online
    @PostMapping("/responder-cotacao")
    public ResponseEntity<String> receberPrecos(@RequestBody List<SalvarPrecoDTO> precos) {
        try {
            fornecedorService.salvarRespostasFornecedor(precos);
            return ResponseEntity.ok("Preços recebidos com sucesso!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }

    @Autowired
    private CotacaoRepository cotacaoRepository;

    @GetMapping("/gerar-link-whatsapp")
    public ResponseEntity<String> gerarLinkWhatsapp(
            @RequestParam Long idFornecedor, 
            @RequestParam Long idCotacao) {
        
        try {
            // 1. Busca os dados
            Fornecedor fornecedor = fornecedorService.buscarPorId(idFornecedor);
            Cotacao cotacao = cotacaoRepository.findById(idCotacao)
                    .orElseThrow(() -> new RuntimeException("Cotação não encontrada"));

            if (fornecedor.getTelefone() == null || fornecedor.getTelefone().isEmpty()) {
                return ResponseEntity.badRequest().body("Erro: Fornecedor sem telefone cadastrado.");
            }

            // 2. Prepara os dados
            String telefoneFormatado = TelefoneUtils.formatarParaWhatsapp(fornecedor.getTelefone());
            
            // Ex: http://localhost:5173/responder?f=1&c=1
            // Pendente do Front-End
            String linkSistema = "http://localhost:5173/responder?f=" + idFornecedor + "&c=" + idCotacao;
            
            // 3. Monta a mensagem
            String mensagemTexto = "Olá " + fornecedor.getNome() + "! " +
                    "Aqui está o link para participar da cotação " + cotacao.getId() + 
                    " da Drogaria Torres: " + linkSistema;

            // Codifica a mensagem para URL
            String mensagemCodificada = URLEncoder.encode(mensagemTexto, StandardCharsets.UTF_8);

            // 4. Monta a URL final do WhatsApp
            String urlWhatsapp = "https://wa.me/" + telefoneFormatado + "?text=" + mensagemCodificada;

            return ResponseEntity.ok(urlWhatsapp);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }
}