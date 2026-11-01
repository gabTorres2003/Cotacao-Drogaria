package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.MensagemMenuRequestDTO;
import com.drogaria.cotacao.dto.response.MensagemMenuResponseDTO;
import com.drogaria.cotacao.repository.UsuarioRepository;
import com.drogaria.cotacao.service.MensagemMenuService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mensagens-menu")
@CrossOrigin(origins = {"https://cotacaotorresfarma.netlify.app", "http://localhost:5173"})
@RequiredArgsConstructor
public class MensagemMenuController {

    private final MensagemMenuService mensagemMenuService;
    private final UsuarioRepository usuarioRepository;
    private final HttpServletRequest request;

    @GetMapping
    public ResponseEntity<List<MensagemMenuResponseDTO>> listarParaPerfil(Authentication authentication) {
        return ResponseEntity.ok(mensagemMenuService.listarVigentesParaPerfil(perfilAtual(authentication)));
    }

    @GetMapping("/admin")
    public ResponseEntity<?> listarTodas(Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(mensagemMenuService.listarTodas());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody MensagemMenuRequestDTO dto, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mensagemMenuService.criar(dto, getUsuarioLogado()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
            @PathVariable Long id,
            @RequestBody MensagemMenuRequestDTO dto,
            Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(mensagemMenuService.atualizar(id, dto, getUsuarioLogado()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> alterarStatus(@PathVariable Long id, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(mensagemMenuService.alterarStatus(id, getUsuarioLogado()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@PathVariable Long id, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        mensagemMenuService.excluir(id, getUsuarioLogado());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> tratarErroDeValidacao(ResponseStatusException ex) {
        String mensagem = ex.getReason() != null
                ? ex.getReason()
                : "Não foi possível processar a solicitação.";
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", mensagem));
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) return false;

        boolean porAutoridade = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (porAutoridade) return true;

        return usuarioRepository.findByUsername(authentication.getName())
                .map(usuario -> "ADMIN".equalsIgnoreCase(usuario.getPerfil()))
                .orElse(false);
    }

    private String perfilAtual(Authentication authentication) {
        if (authentication == null) return null;

        Set<String> authorities = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(Collectors.toSet());

        if (authorities.contains("ROLE_ADMIN")) return "ADM";
        if (authorities.contains("ROLE_CONFERENTE")) return "CONFERENTE";
        if (authorities.contains("ROLE_FORNECEDOR")) return "FORNECEDOR";

        return usuarioRepository.findByUsername(authentication.getName())
                .map(usuario -> {
                    String perfil = usuario.getPerfil() == null
                            ? "ADM"
                            : usuario.getPerfil().trim().toUpperCase(Locale.ROOT);
                    return "ADMIN".equals(perfil) ? "ADM" : perfil;
                })
                .orElse(null);
    }

    private String getUsuarioLogado() {
        String nome = request.getHeader("X-Usuario-Nome");
        if (nome != null && !nome.isEmpty()) {
            try {
                return URLDecoder.decode(nome, StandardCharsets.UTF_8.name());
            } catch (Exception e) {
                return nome;
            }
        }
        return "Sistema";
    }
}
