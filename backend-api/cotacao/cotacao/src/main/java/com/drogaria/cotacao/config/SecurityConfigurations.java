package com.drogaria.cotacao.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfigurations {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // --- LIBERAÇÃO DO SWAGGER ---
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        
                        // ROTAS PÚBLICAS
                        .requestMatchers(HttpMethod.POST, "/api/cotacao/importar").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/cotacao").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/cotacao/**").permitAll()
                        
                        // --- ROTAS DO FORNECEDOR  ---
                        .requestMatchers(HttpMethod.POST, "/api/fornecedor/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comparativo/listar-itens/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/fornecedor/salvar-respostas").permitAll()
                        
                        // DEMAIS ROTAS
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Mantém as origens seguras
        configuration.setAllowedOrigins(Arrays.asList(
                "https://cotacaotorresfarma.netlify.app",
                "http://localhost:5173"
        ));
        
        // Libera os métodos HTTP
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // O PULO DO GATO: Libera qualquer cabeçalho que o frontend tentar enviar
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}