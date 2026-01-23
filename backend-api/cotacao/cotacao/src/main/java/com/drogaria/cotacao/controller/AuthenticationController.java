package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.Usuario;
import com.drogaria.cotacao.repository.UsuarioRepository;
import com.drogaria.cotacao.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/login")
    public ResponseEntity login(@RequestBody Map<String, String> data) {
        var usernamePassword = new UsernamePasswordAuthenticationToken(data.get("login"), data.get("senha"));
        var auth = authenticationManager.authenticate(usernamePassword);
        
        var token = tokenService.gerarToken((Usuario) auth.getPrincipal());
        
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/register")
    public ResponseEntity register(@RequestBody Map<String, String> data) {
        if(repository.findByLogin(data.get("login")) != null) return ResponseEntity.badRequest().build();

        // Criptografa a senha antes de salvar
        String encryptedPassword = new BCryptPasswordEncoder().encode(data.get("senha"));
        Usuario newUser = new Usuario(data.get("login"), encryptedPassword, data.get("role"));

        repository.save(newUser);
        return ResponseEntity.ok().build();
    }
}