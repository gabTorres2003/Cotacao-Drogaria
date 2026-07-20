package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.LoginRequestDTO;
import com.drogaria.cotacao.model.Usuario;
import com.drogaria.cotacao.repository.UsuarioRepository;
import com.drogaria.cotacao.service.TokenService;
import jakarta.validation.Valid;

import java.util.HashMap;

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
    public AuthController(AuthenticationManager authenticationManager, TokenService tokenService, UsuarioRepository usuarioRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody @Valid LoginRequestDTO dto) {
        var authToken = new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPin());
        var authentication = authenticationManager.authenticate(authToken);
        
        String token = tokenService.gerarToken(authentication.getName());
        Usuario usuario = usuarioRepository.findByUsername(authentication.getName()).orElseThrow();
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("primeiroAcesso", usuario.isPrimeiroAcesso());
        
        return ResponseEntity.ok(response);
    }
}