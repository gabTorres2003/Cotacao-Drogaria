package com.drogaria.cotacao.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfigurations {

    private final JwtAuthenticationConverter jwtAuthenticationConverter;

    public SecurityConfigurations(JwtAuthenticationConverter jwtAuthenticationConverter) {
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                        // ROTAS PÚBLICAS REAIS
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/fornecedor/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comparativo/listar-itens/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/fornecedor/salvar-respostas").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/cotacao/importar", "/api/cotacao/importar-dna")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/cotacao", "/api/cotacao/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/cotacao/**").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/pedidos/*/conferencia/parcial",
                                "/api/pedidos/*/itens-nao-solicitados").hasAnyRole("ADMIN", "CONFERENTE")
                        .requestMatchers(HttpMethod.POST, "/api/pedidos/*/itens-nao-solicitados")
                                .hasAnyRole("ADMIN", "CONFERENTE")
                        .requestMatchers(HttpMethod.POST, "/api/pedidos/*/conferencia/fotos")
                                .authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/pedidos/*/conferencia/fotos/**")
                                .authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/pedidos/*/receber",
                                "/api/pedidos/*/valores-reais", "/api/pedidos/*/valores-previstos").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/pedidos/*/reabrir-conferencia",
                                "/api/pedidos/*/refazer-conferencia", "/api/pedidos/*/status",
                                "/api/pedidos/*/cancelar-confirmacao", "/api/pedidos/*/falha-entrega",
                                "/api/pedidos/*/recebimento-rapido", "/api/pedidos/*/valor-minimo").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/pedidos", "/api/pedidos/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/pedidos/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/pedidos/**").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/pedidos/**").permitAll()

                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)))
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("https://cotacaotorresfarma.netlify.app", "http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}