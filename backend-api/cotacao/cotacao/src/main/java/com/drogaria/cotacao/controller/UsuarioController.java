package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.UsuarioRequestDTO;
import com.drogaria.cotacao.dto.response.UsuarioResponseDTO;
import com.drogaria.cotacao.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService service;

    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> criar(@RequestBody @Valid UsuarioRequestDTO dto) {
        return ResponseEntity.ok(service.criarUsuario(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> atualizar(@PathVariable Long id, @RequestBody @Valid UsuarioRequestDTO dto) {
        return ResponseEntity.ok(service.atualizarUsuario(id, dto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> alterarStatus(@PathVariable Long id) {
        service.alterarStatus(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/alterar-pin")
    public ResponseEntity<Void> alterarPin(@RequestBody java.util.Map<String, String> body, org.springframework.security.core.Authentication authentication) {
        service.alterarPin(authentication.getName(), body.get("novoPin"));
        return ResponseEntity.noContent().build();
    }
}