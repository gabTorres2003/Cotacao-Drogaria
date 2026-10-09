package com.drogaria.cotacao.service;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;

    public TokenService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public String gerarToken(String username) {
        Instant now = Instant.now();
        var authorities = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .collect(Collectors.toList());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("drogaria-api")
                .subject(username)
                .claim("authorities", authorities)
                .issuedAt(now)
                .expiresAt(now.plusSeconds(36000L))
                .build();
        
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}