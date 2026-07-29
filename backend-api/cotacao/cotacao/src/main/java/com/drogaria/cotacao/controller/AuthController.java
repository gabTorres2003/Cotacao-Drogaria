package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.LoginRequestDTO;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.Usuario;
import com.drogaria.cotacao.model.enums.TipoAcao;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.repository.UsuarioRepository;
import com.drogaria.cotacao.service.LogAuditoriaService;
import com.drogaria.cotacao.service.TokenService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final UsuarioRepository usuarioRepository;
    private final FornecedorRepository fornecedorRepository;
    private final LogAuditoriaService logAuditoriaService;

    public AuthController(AuthenticationManager authenticationManager, TokenService tokenService, 
                          UsuarioRepository usuarioRepository, FornecedorRepository fornecedorRepository,
                          LogAuditoriaService logAuditoriaService) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.usuarioRepository = usuarioRepository;
        this.fornecedorRepository = fornecedorRepository;
        this.logAuditoriaService = logAuditoriaService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody @Valid LoginRequestDTO dto) {
        var authToken = new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPin());
        var authentication = authenticationManager.authenticate(authToken);
        
        String token = tokenService.gerarToken(authentication.getName());
        
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean primeiroAcesso = false;
        String nome = "";
        Long idUsuario = null; 

        if (isAdmin) {
            Usuario u = usuarioRepository.findByUsername(authentication.getName()).orElseThrow();
            primeiroAcesso = u.isPrimeiroAcesso();
            nome = u.getNome();
            idUsuario = u.getId(); 
        } else {
            Fornecedor f = fornecedorRepository.findByLogin(authentication.getName()).orElseThrow();
            primeiroAcesso = (f.getSenha() == null || "0000".equals(f.getSenha())); 
            nome = f.getNome();
            idUsuario = f.getId(); 
        }
        
        logAuditoriaService.registrarLog(
            nome, 
            isAdmin ? "INTERNO" : "FORNECEDOR", 
            TipoAcao.LOGIN, 
            "Sistema", 
            idUsuario, 
            "Usuário realizou login com sucesso no sistema."
        );

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("tipoUsuario", isAdmin ? "ADMIN" : "FORNECEDOR");
        response.put("primeiroAcesso", primeiroAcesso);
        response.put("nome", nome);
        response.put("id", idUsuario);
        
        return ResponseEntity.ok(response); 
    }
}