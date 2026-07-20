package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.LoginRequestDTO;
import com.drogaria.cotacao.model.Fornecedor;
import com.drogaria.cotacao.model.Usuario;
import com.drogaria.cotacao.repository.FornecedorRepository;
import com.drogaria.cotacao.repository.UsuarioRepository;
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

    public AuthController(AuthenticationManager authenticationManager, TokenService tokenService, 
                          UsuarioRepository usuarioRepository, FornecedorRepository fornecedorRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.usuarioRepository = usuarioRepository;
        this.fornecedorRepository = fornecedorRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody @Valid LoginRequestDTO dto) {
        var authToken = new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPin());
        var authentication = authenticationManager.authenticate(authToken);
        
        String token = tokenService.gerarToken(authentication.getName());
        
        // Descobre qual role o AutenticacaoService atribuiu
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean primeiroAcesso = false;
        String nome = "";

        if (isAdmin) {
            Usuario u = usuarioRepository.findByUsername(authentication.getName()).orElseThrow();
            primeiroAcesso = u.isPrimeiroAcesso();
            nome = u.getNome();
        } else {
            Fornecedor f = fornecedorRepository.findByLogin(authentication.getName()).orElseThrow();
            primeiroAcesso = "0000".equals(f.getSenha()); // Se a senha for 0000, obriga a trocar
            nome = f.getNome();
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("tipoUsuario", isAdmin ? "ADMIN" : "FORNECEDOR");
        response.put("primeiroAcesso", primeiroAcesso);
        response.put("nome", nome);
        
        return ResponseEntity.ok(response); 
    }
}