package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.SalvarPrecoDTO;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.service.FornecedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fornecedor")
public class FornecedorController {

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private FornecedorService fornecedorService;

    private final String SITE_URL = "https://cotacaotorresfarma.netlify.app";

    @GetMapping
    public ResponseEntity<List<Fornecedor>> listarTodos() {
        return ResponseEntity.ok(fornecedorRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Fornecedor> criar(@RequestBody Fornecedor fornecedor) {
        return ResponseEntity.ok(fornecedorRepository.save(fornecedor));
    }

    @PostMapping("/salvar-respostas")
    public ResponseEntity<String> salvarRespostas(@RequestBody List<SalvarPrecoDTO> respostas) {
        try {
            fornecedorService.salvarRespostasFornecedor(respostas);
            return ResponseEntity.ok("Respostas salvas com sucesso!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erro ao salvar: " + e.getMessage());
        }
    }

    @GetMapping("/gerar-link-whatsapp")
    public ResponseEntity<String> gerarLinkWhatsapp(
            @RequestParam Long idFornecedor,
            @RequestParam Long idCotacao) {
        Fornecedor fornecedor = fornecedorRepository.findById(idFornecedor)
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));

        if (fornecedor.getTelefone() == null || fornecedor.getTelefone().isEmpty()) {
            return ResponseEntity.badRequest().body("Erro: Fornecedor sem telefone cadastrado.");
        }
        String telefoneLimpo = limparTelefone(fornecedor.getTelefone());
        String linkResposta = SITE_URL + "/responder-cotacao/" + idCotacao + "?f=" + idFornecedor;

        String texto = "Olá " + fornecedor.getNome() + ", segue o link para cotação: " + linkResposta;
        String linkWhatsapp = "https://api.whatsapp.com/send?phone=" + telefoneLimpo + "&text=" + texto;

        return ResponseEntity.ok(linkWhatsapp);
    }

    private String limparTelefone(String telefone) {
        String numeros = telefone.replaceAll("\\D", "");
        if (!numeros.startsWith("55")) {
            numeros = "55" + numeros;
        }
        return numeros;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Fornecedor> atualizar(@PathVariable Long id, @RequestBody Fornecedor dados) {
        return fornecedorRepository.findById(id)
                .map(fornecedor -> {
                    fornecedor.setNome(dados.getNome());
                    fornecedor.setTelefone(dados.getTelefone());
                    return ResponseEntity.ok(fornecedorRepository.save(fornecedor));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}