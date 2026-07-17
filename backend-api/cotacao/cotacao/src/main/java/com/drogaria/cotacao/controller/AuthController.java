package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.dto.request.LoginRequestDTO;
import com.drogaria.cotacao.service.TokenService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    public AuthController(AuthenticationManager authenticationManager, TokenService tokenService) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody @Valid LoginRequestDTO dto) {
        var authToken = new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPin());
        var authentication = authenticationManager.authenticate(authToken);
        String token = tokenService.gerarToken(authentication.getName());
        
        return ResponseEntity.ok(token); 
    }
}