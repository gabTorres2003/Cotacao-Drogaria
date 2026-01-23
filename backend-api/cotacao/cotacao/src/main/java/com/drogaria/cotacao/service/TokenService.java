package com.drogaria.cotacao.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    
    @Value("${api.security.token.secret}")
    private String secret;

    public String validateToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            return JWT.require(algorithm)
                    .build()
                    .verify(token)
                    .getSubject();
        } catch (JWTVerificationException exception) {
            // --- DEBUG ---
            System.out.println("🚨 ERRO DE VALIDAÇÃO DO TOKEN 🚨");
            System.out.println("Token recebido: " + token);
            System.out.println("Erro exato: " + exception.getMessage());
            // ----------------------------------------
            return "";
        }
    }
}