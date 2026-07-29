package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.LogAuditoria;
import com.drogaria.cotacao.model.enums.TipoAcao;
import com.drogaria.cotacao.service.LogAuditoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auditoria")
@CrossOrigin(origins = {"https://cotacaotorresfarma.netlify.app", "http://localhost:5173"})
@RequiredArgsConstructor
public class LogAuditoriaController {

    private final LogAuditoriaService logAuditoriaService;

    @PostMapping("/registrar")
    public ResponseEntity<Void> registrarLogManual(@RequestBody Map<String, String> payload) {
        String nomeUsuario = payload.get("nomeUsuario");
        String tipoUsuario = payload.get("tipoUsuario");
        TipoAcao acao = TipoAcao.valueOf(payload.get("acao"));
        String detalhes = payload.get("detalhes");

        logAuditoriaService.registrarLog(nomeUsuario, tipoUsuario, acao, "Sistema", null, detalhes);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<LogAuditoria>> listarUltimos() {
        return ResponseEntity.ok(logAuditoriaService.listarUltimosLogs());
    }

    @GetMapping("/buscar-usuario")
    public ResponseEntity<List<LogAuditoria>> buscarPorUsuario(@RequestParam String nome) {
        return ResponseEntity.ok(logAuditoriaService.buscarPorUsuario(nome));
    }

    @GetMapping("/buscar-acao")
    public ResponseEntity<List<LogAuditoria>> buscarPorAcao(@RequestParam TipoAcao acao) {
        return ResponseEntity.ok(logAuditoriaService.buscarPorAcao(acao));
    }

    @GetMapping("/buscar-periodo")
    public ResponseEntity<List<LogAuditoria>> buscarPorPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim) {
        
        return ResponseEntity.ok(logAuditoriaService.buscarPorPeriodo(inicio, fim));
    }
}