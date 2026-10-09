package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.response.FotoConferenciaResponseDTO;
import com.drogaria.cotacao.service.FotoConferenciaService;
import com.drogaria.cotacao.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos/{pedidoId}/conferencia/fotos")
@CrossOrigin(origins = {"https://cotacaotorresfarma.netlify.app", "http://localhost:5173"})
@RequiredArgsConstructor
public class FotoConferenciaController {

    private final FotoConferenciaService fotoService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FotoConferenciaResponseDTO> enviar(
            @PathVariable Long pedidoId,
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam(value = "itemPedidoId", required = false) Long itemPedidoId,
            @RequestParam(value = "ocorrencia", required = false) String ocorrencia,
            Authentication authentication) {
        if (!interno(authentication)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(fotoService.salvar(
                pedidoId, itemPedidoId, ocorrencia, arquivo, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<FotoConferenciaResponseDTO>> listar(
            @PathVariable Long pedidoId, Authentication authentication) {
        if (!interno(authentication)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(fotoService.listar(pedidoId));
    }

    @GetMapping("/{fotoId}/arquivo")
    public ResponseEntity<Resource> arquivo(
            @PathVariable Long pedidoId,
            @PathVariable Long fotoId,
            Authentication authentication) {
        if (!interno(authentication)) return ResponseEntity.status(403).build();
        Resource resource = fotoService.carregarArquivo(pedidoId, fotoId);
        MediaType tipoConteudo = MediaType.parseMediaType(fotoService.tipoConteudo(pedidoId, fotoId));
        return ResponseEntity.ok()
                .contentType(tipoConteudo)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    private boolean interno(Authentication authentication) {
        if (authentication == null) return false;
        boolean porAutoridade = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || "ROLE_CONFERENTE".equals(a.getAuthority()));
        if (porAutoridade) return true;
        return usuarioRepository.findByUsername(authentication.getName())
                .map(usuario -> "ADMIN".equalsIgnoreCase(usuario.getPerfil())
                        || "CONFERENTE".equalsIgnoreCase(usuario.getPerfil()))
                .orElse(false);
    }
}
