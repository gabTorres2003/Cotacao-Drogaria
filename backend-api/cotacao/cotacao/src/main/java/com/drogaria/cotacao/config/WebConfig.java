package com.drogaria.cotacao.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Aplica a todas as rotas
                .allowedOrigins("*") // LIBERA GERAL Netlify, Localhost, etc
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Libera todos os métodos
                .allowedHeaders("*"); // Libera todos os cabeçalhos
    }
}