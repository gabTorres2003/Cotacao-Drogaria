package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.response.SugestaoPromocaoResponseDTO;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.ItemCotacaoRepository;
import com.drogaria.cotacao.service.ComparativoService;
import com.drogaria.cotacao.service.CotacaoService;
import com.drogaria.cotacao.service.excel.ExcelReaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.time.LocalDateTime;
import java.util.List;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

@RestController
@RequestMapping("/api/cotacao")
public class CotacaoController {

    @Autowired
    private CotacaoRepository cotacaoRepository;

    @Autowired
    private ItemCotacaoRepository itemCotacaoRepository;

    @Autowired
    private CotacaoService cotacaoService;

    @Autowired
    private ExcelReaderService excelService;

    @Autowired
    private ComparativoService comparativoService;

    @GetMapping
    public ResponseEntity<List<Cotacao>> listarTodas() {
        return ResponseEntity.ok(cotacaoRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cotacao> buscarPorId(@PathVariable Long id) {
        return cotacaoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/importar")
    public ResponseEntity<String> uploadArquivo(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Arquivo não enviado.");
        }
        try {
            List<ItemCotacao> itens = excelService.read(file);
            if (itens == null || itens.isEmpty())
                return ResponseEntity.badRequest().body("Arquivo sem itens válidos.");

            Cotacao novaCotacao = new Cotacao();
            novaCotacao.setDescricao("Importação em " + LocalDateTime.now());
            novaCotacao.setStatus("ABERTA");
            novaCotacao.setDataCriacao(LocalDateTime.now());
            itens.forEach(item -> item.setCotacao(novaCotacao));
            novaCotacao.setItens(itens);
            cotacaoRepository.save(novaCotacao);

            return ResponseEntity.ok("Cotação criada com sucesso! Itens importados: " + itens.size());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao processar arquivo.");
        }
    }

    @PostMapping("/importar-dna")
    public ResponseEntity<String> importarDiretoDoDna(@RequestBody List<String> grupos) {
        try {
            Cotacao cotacao = cotacaoService.criarCotacaoDNA(grupos);
            return ResponseEntity.ok("Cotação gerada com sucesso! " + cotacao.getItens().size() + " itens importados.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro interno na importação: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<String> atualizarStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String novoStatus = payload.get("status");
        return cotacaoRepository.findById(id)
                .map(cotacao -> {
                    cotacao.setStatus(novoStatus);
                    cotacaoRepository.save(cotacao);
                    return ResponseEntity.ok("Status atualizado para " + novoStatus);
                }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/item/{idItem}")
    public ResponseEntity<ItemCotacao> atualizarItem(@PathVariable Long idItem, @RequestBody ItemCotacao dados) {
        return itemCotacaoRepository.findById(idItem).map(item -> {
            item.setNomeProduto(dados.getNomeProduto());
            item.setQuantidade(dados.getQuantidade());
            return ResponseEntity.ok(itemCotacaoRepository.save(item));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/item/{idItem}")
    public ResponseEntity<Void> removerItem(@PathVariable Long idItem) {
        if (itemCotacaoRepository.existsById(idItem)) {
            itemCotacaoRepository.deleteById(idItem);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarCotacao(@PathVariable Long id) {
        try {
            cotacaoService.deletarCotacao(id);
            return ResponseEntity.ok().build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Não é possível excluir esta cotação pois ela já possui Pedidos gerados. Exclua os pedidos vinculados a ela primeiro.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro interno ao tentar excluir a cotação.");
        }
    }

    @GetMapping("/sugestoes/{idCotacao}")
    public ResponseEntity<List<SugestaoPromocaoResponseDTO>> listarSugestoes(@PathVariable Long idCotacao) {
        return ResponseEntity.ok(comparativoService.listarSugestoesDaCotacao(idCotacao));
    }

    @GetMapping("/teste-firebird")
    public ResponseEntity<String> testarConexaoFirebird() {

        String url = "jdbc:firebirdsql://192.168.18.205:3050/C:/DNA/Pharmacy/Dados/COMERCIO.FDB?charSet=WIN1252";
        String user = "SYSDBA";
        String password = "masterkey";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {

            try (Statement stmt = conn.createStatement();
                    ResultSet rs = stmt.executeQuery("SELECT CURRENT_TIMESTAMP FROM RDB$DATABASE")) {

                if (rs.next()) {
                    String dataServidor = rs.getString(1);
                    return ResponseEntity
                            .ok("Sucesso! Conectado ao banco COMERCIO.FDB. Data no servidor: " + dataServidor);
                }
            }
            return ResponseEntity.ok("Conectou, mas não conseguiu ler a data.");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Falha na conexão: " + e.getMessage());
        }
    }
}