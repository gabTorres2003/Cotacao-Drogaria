package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.ImportacaoDNARequestDTO;
import com.drogaria.cotacao.dto.request.CriarCotacaoRequestDTO;
import com.drogaria.cotacao.dto.request.ItemCriarCotacaoDTO;
import com.drogaria.cotacao.dto.response.SugestaoPromocaoResponseDTO;
import com.drogaria.cotacao.model.Cotacao;
import com.drogaria.cotacao.model.ItemCotacao;
import com.drogaria.cotacao.repository.CotacaoRepository;
import com.drogaria.cotacao.repository.PrecoCotacaoRepository;
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
import java.util.ArrayList;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

@RestController
@RequestMapping("/api/cotacao")
@CrossOrigin(origins = {"https://cotacaotorresfarma.netlify.app", "http://localhost:5173"})
public class CotacaoController {

    @Autowired
    private CotacaoRepository cotacaoRepository;

    @Autowired
    private PrecoCotacaoRepository precoCotacaoRepository;

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

    @PostMapping
    public ResponseEntity<Cotacao> criarCotacaoManual(@RequestBody CriarCotacaoRequestDTO request) {
        try {
            Cotacao novaCotacao = new Cotacao();
            novaCotacao.setDescricao(request.getDescricao() != null ? request.getDescricao() : "Cotação Manual");
            novaCotacao.setStatus("ABERTA");
            novaCotacao.setDataCriacao(LocalDateTime.now());
            
            novaCotacao.setSetor(request.getSetor() != null ? request.getSetor() : "AMBOS");
            
            List<ItemCotacao> itens = new ArrayList<>();
            if (request.getItens() != null) {
                for (ItemCriarCotacaoDTO itemDto : request.getItens()) {
                    ItemCotacao item = new ItemCotacao();
                    item.setNomeProduto(itemDto.getNomeProduto());
                    item.setQuantidade(itemDto.getQuantidade());
                    item.setOrigemItem(request.getOrigem() != null ? request.getOrigem() : "Manual");
                    item.setEditadoManual(true);
                    item.setCotacao(novaCotacao);
                    itens.add(item);
                }
            }
            novaCotacao.setItens(itens);
            
            Cotacao salva = cotacaoRepository.save(novaCotacao);
            return ResponseEntity.ok(salva);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
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
    public ResponseEntity<String> importarDiretoDoDna(@RequestBody ImportacaoDNARequestDTO request) {
        try {
            Cotacao cotacao = cotacaoService.criarCotacaoDNA(request);
            return ResponseEntity.ok("Cotação gerada com sucesso! " + cotacao.getItens().size() + " itens importados.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro interno na importação: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/importar-dna")
    public ResponseEntity<String> atualizarCotacaoDna(@PathVariable Long id, @RequestBody ImportacaoDNARequestDTO request) {
        try {
            Cotacao cotacao = cotacaoService.atualizarCotacaoDNA(id, request);
            return ResponseEntity.ok("Cotação atualizada com sucesso! Total de itens: " + cotacao.getItens().size());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro ao atualizar cotação: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/importar-encomendas")
    public ResponseEntity<String> importarEncomendas(@PathVariable Long id, @RequestBody List<ItemCotacao> itens) {
        try {
            return cotacaoRepository.findById(id).map(cotacao -> {
                itens.forEach(item -> {
                    item.setCotacao(cotacao);
                    if (item.getOrigemItem() == null || item.getOrigemItem().isEmpty()) {
                        item.setOrigemItem("Encomenda");
                    }
                    cotacao.getItens().add(item);
                });
                cotacaoRepository.save(cotacao);
                return ResponseEntity.ok("Encomendas importadas com sucesso!");
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao salvar encomendas na cotação: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/item")
    public ResponseEntity<ItemCotacao> adicionarItemManual(@PathVariable Long id, @RequestBody ItemCotacao dados) {
        try {
            ItemCotacao novoItem = cotacaoService.adicionarItemManual(id, dados);
            return ResponseEntity.ok(novoItem);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
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

    // NOVA ROTA PARA EDIÇÃO DE SETOR
    @PutMapping("/{id}/setor")
    public ResponseEntity<String> atualizarSetor(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String novoSetor = payload.get("setor");
        return cotacaoRepository.findById(id)
                .map(cotacao -> {
                    cotacao.setSetor(novoSetor);
                    cotacaoRepository.save(cotacao);
                    return ResponseEntity.ok("Setor atualizado para " + novoSetor);
                }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/item/{idItem}")
    public ResponseEntity<?> atualizarItem(@PathVariable Long idItem, @RequestBody Map<String, Object> dados) {
        try {
            if (dados.containsKey("excluido")) {
                Boolean excluido = (Boolean) dados.get("excluido");
                cotacaoService.restaurarItem(idItem, excluido);
                return ResponseEntity.ok("Item atualizado");
            }
            String nome = (String) dados.get("nomeProduto");
            Integer qtd = dados.get("quantidade") != null ? ((Number) dados.get("quantidade")).intValue() : null;
            ItemCotacao atualizado = cotacaoService.atualizarItemManual(idItem, nome, qtd);
            return ResponseEntity.ok(atualizado);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/preco/{idPreco}")
    public ResponseEntity<?> atualizarRespostaFornecedor(@PathVariable Long idPreco, @RequestBody Map<String, Object> dados) {
        try {
            var precoOpt = precoCotacaoRepository.findById(idPreco);
            if (precoOpt.isEmpty()) return ResponseEntity.notFound().build();
            var preco = precoOpt.get();
            if (dados.containsKey("precoOfertado")) {
                preco.setPrecoOfertado(dados.get("precoOfertado") != null ? Double.valueOf(dados.get("precoOfertado").toString()) : null);
            }
            if (dados.containsKey("produtoSubstituto")) {
                preco.setProdutoSubstituto((String) dados.get("produtoSubstituto"));
            }
            if (dados.containsKey("precoSubstituto")) {
                preco.setPrecoSubstituto(dados.get("precoSubstituto") != null ? Double.valueOf(dados.get("precoSubstituto").toString()) : null);
            }
            precoCotacaoRepository.save(preco);
            return ResponseEntity.ok("Resposta atualizada com sucesso");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao atualizar resposta: " + e.getMessage());
        }
    }

    @PutMapping("/fracoes/confirmar")
    public ResponseEntity<?> confirmarFracoes(@RequestBody com.drogaria.cotacao.dto.request.ConfirmarFracaoDTO dto) {
        try {
            int alterados = 0;
            for (com.drogaria.cotacao.dto.request.ConfirmarFracaoDTO.ItemFracaoDTO item : dto.getItens()) {
                var precoOpt = precoCotacaoRepository.findById(item.getIdPreco());
                if (precoOpt.isEmpty()) continue;
                var preco = precoOpt.get();
                if (preco.getPrecoOriginal() == null) {
                    preco.setPrecoOriginal(preco.getPrecoOfertado());
                }
                preco.setPrecoOfertado(item.getNovoPreco());
                precoCotacaoRepository.save(preco);
                alterados++;
            }
            return ResponseEntity.ok(Map.of("alterados", alterados));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao confirmar frações: " + e.getMessage());
        }
    }

    @DeleteMapping("/item/{idItem}")
    public ResponseEntity<Void> removerItem(@PathVariable Long idItem) {
        try {
            cotacaoService.removerItemManual(idItem);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
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

    @DeleteMapping("/lote")
    public ResponseEntity<?> deletarCotacoesEmMassa(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.get("ids");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().body("Nenhum ID informado.");
        }
        try {
            int excluidas = cotacaoService.deletarCotacoesEmMassa(ids);
            return ResponseEntity.ok(Map.of("excluidas", excluidas));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Algumas cotações possuem pedidos vinculados e não puderam ser excluídas.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro interno ao excluir cotações em lote.");
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
                    return ResponseEntity.ok("Sucesso! Conectado ao banco COMERCIO.FDB. Data no servidor: " + dataServidor);
                }
            }
            return ResponseEntity.ok("Conectou, mas não conseguiu ler a data.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Falha na conexão: " + e.getMessage());
        }
    }
}